import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Meal suggestion generation
export const generateMealSuggestion = action({
  args: {
    familyId: v.id("families"),
    selectedUserIds: v.array(v.id("users")),
    mealType: v.union(v.literal("large"), v.literal("small")), // large = große Mahlzeit, small = kleiner Snack
    customHints: v.optional(v.string()),
    availableIngredients: v.optional(v.string()),
    suggestionDate: v.string(), // Datum für den Vorschlag im Format YYYY-MM-DD
    excludeLastMealsCount: v.number(), // Anzahl der letzten Mahlzeiten die vermieden werden sollen
    familyPreferences: v.array(v.object({
      name: v.union(v.string(), v.null()),
      preferences: v.union(v.string(), v.null()),
      dislikes: v.union(v.string(), v.null()),
      allergies: v.union(v.string(), v.null()),
    })),
  },
  returns: v.object({
    title: v.string(),
    portions: v.number(),
    steps: v.array(v.object({
      instructions: v.string(),
      estimatedMinutes: v.optional(v.number()),
    })),
    ingredients: v.array(v.object({
      name: v.string(),
      amountPerPortion: v.number(),
      unit: v.string(),
      inStock: v.boolean(),
      estimatedKcal: v.optional(v.number()),
    })),
  }),
  handler: async (ctx, args) => {
    // Get user authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Nicht authentifiziert");
    }

    // Load recent meals for the family before the suggestion date
    const recentMeals: Array<{ title: string; date: string }> = await ctx.runQuery(
      internal.aiSuggestions.getRecentMeals,
      {
        familyId: args.familyId,
        beforeDate: args.suggestionDate,
        limit: args.excludeLastMealsCount,
      }
    );

    // Build prompt for OpenAI
    const prompt = buildPrompt({
      mealType: args.mealType,
      familyPreferences: args.familyPreferences,
      customHints: args.customHints,
      availableIngredients: args.availableIngredients,
      recentMeals,
      portionCount: args.selectedUserIds.length,
    });

    let openaiResponse = "";
    let suggestion = null;
    let success = false;
    let errorMessage = "";

    try {
      // Call OpenAI API
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        throw new Error("OpenAI API Key nicht konfiguriert");
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "Du bist ein professioneller Koch-Assistent. Erstelle Rezeptvorschläge im angegebenen JSON-Format. Antworte ausschließlich mit gültigem JSON, ohne Markdown-Formatierung, ohne ```json oder ``` Tags und ohne zusätzlichen Text."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        errorMessage = `OpenAI API Fehler: ${response.status} - ${errorText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      openaiResponse = content || "";

      if (!content) {
        errorMessage = "Keine Antwort von OpenAI erhalten";
        throw new Error(errorMessage);
      }

      try {
        // Clean the content by removing markdown code blocks
        let cleanContent = content.trim();
        
        // Remove ```json at the start
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.slice(7);
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.slice(3);
        }
        
        // Remove ``` at the end
        if (cleanContent.endsWith('```')) {
          cleanContent = cleanContent.slice(0, -3);
        }
        
        // Trim any remaining whitespace
        cleanContent = cleanContent.trim();
        
        suggestion = JSON.parse(cleanContent);
        
        // Validate the response structure
        if (!suggestion.title || !suggestion.steps || !suggestion.ingredients) {
          errorMessage = "Ungültige Antwortstruktur von OpenAI";
          throw new Error(errorMessage);
        }

        // Set portions based on selected users
        suggestion.portions = args.selectedUserIds.length;

        // Mark available ingredients as in stock
        if (args.availableIngredients) {
          const availableList = args.availableIngredients.toLowerCase().split(/[,\n]+/).map(s => s.trim());
          suggestion.ingredients.forEach((ingredient: any) => {
            const isAvailable = availableList.some(available => 
              ingredient.name.toLowerCase().includes(available) || 
              available.includes(ingredient.name.toLowerCase())
            );
            ingredient.inStock = isAvailable;
          });
        } else {
          // Default: mark all as not in stock
          suggestion.ingredients.forEach((ingredient: any) => {
            ingredient.inStock = false;
          });
        }

        success = true;
      } catch (parseError) {
        errorMessage = `JSON Parse Error: ${parseError} - Content: ${content}`;
        throw new Error("Konnte OpenAI Antwort nicht verarbeiten");
      }
    } catch (error) {
      success = false;
      if (!errorMessage) {
        errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
      }
      console.error("AI Suggestion Error:", error);
    } finally {
      // Log the attempt regardless of success/failure
      // Only log if we can get a valid user ID from the family
      if (args.selectedUserIds.length > 0) {
        // Use the first selected user ID as the requesting user
        const logUserId = args.selectedUserIds[0];
        
        try {
          await ctx.runMutation(internal.aiSuggestions.logAISuggestion, {
            familyId: args.familyId,
            userId: logUserId,
            mealType: args.mealType,
            selectedUserCount: args.selectedUserIds.length,
            customHints: args.customHints,
            availableIngredients: args.availableIngredients,
            excludeLastMealsCount: args.excludeLastMealsCount,
            familyPreferences: args.familyPreferences,
            recentMeals,
            generatedPrompt: prompt,
            openaiResponse,
            parsedSuggestion: suggestion,
            success,
            errorMessage: success ? undefined : errorMessage,
          });
        } catch (logError) {
          // If logging fails, don't let it break the main function
          console.warn("Failed to log AI suggestion:", logError);
        }
      }
    }

    if (!success) {
      throw new Error(errorMessage);
    }

    return suggestion;
  },
});

// Internal query to get user by email
export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  returns: v.union(v.null(), v.object({
    _id: v.id("users"),
    email: v.optional(v.string()),
    familyId: v.optional(v.id("families")),
  })),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();
    
    if (!user) return null;
    
    return {
      _id: user._id,
      email: user.email,
      familyId: user.familyId,
    };
  },
});

// Internal query to get user by ID
export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  returns: v.union(v.null(), v.object({
    _id: v.id("users"),
    email: v.optional(v.string()),
    familyId: v.optional(v.id("families")),
  })),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user) return null;
    
    return {
      _id: user._id,
      email: user.email,
      familyId: user.familyId,
    };
  },
});

// Internal function to log AI suggestion attempts for debugging
export const logAISuggestion = internalMutation({
  args: {
    familyId: v.id("families"),
    userId: v.id("users"),
    mealType: v.union(v.literal("large"), v.literal("small")),
    selectedUserCount: v.number(),
    customHints: v.optional(v.string()),
    availableIngredients: v.optional(v.string()),
    excludeLastMealsCount: v.number(),
    familyPreferences: v.array(v.object({
      name: v.union(v.string(), v.null()),
      preferences: v.union(v.string(), v.null()),
      dislikes: v.union(v.string(), v.null()),
      allergies: v.union(v.string(), v.null()),
    })),
    recentMeals: v.array(v.object({
      title: v.string(),
      date: v.string(),
    })),
    generatedPrompt: v.string(),
    openaiResponse: v.string(),
    parsedSuggestion: v.optional(v.object({
      title: v.string(),
      portions: v.number(),
      steps: v.array(v.object({
        instructions: v.string(),
        estimatedMinutes: v.optional(v.number()),
      })),
      ingredients: v.array(v.object({
        name: v.string(),
        amountPerPortion: v.number(),
        unit: v.string(),
        inStock: v.boolean(),
        estimatedKcal: v.optional(v.number()),
      })),
    })),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  },
  returns: v.id("aiSuggestionLogs"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiSuggestionLogs", {
      ...args,
      timestamp: Date.now(),
      parsedSuggestion: args.parsedSuggestion || {
        title: "",
        portions: 0,
        steps: [],
        ingredients: [],
      },
    });
  },
});

// Query to get AI suggestion logs for a family (for debugging)
export const getAISuggestionLogs = query({
  args: { 
    familyId: v.optional(v.id("families")), 
    limit: v.optional(v.number()),
    includeSuccessOnly: v.optional(v.boolean()),
  },
  returns: v.array(v.object({
    _id: v.id("aiSuggestionLogs"),
    _creationTime: v.number(),
    timestamp: v.number(),
    mealType: v.union(v.literal("large"), v.literal("small")),
    selectedUserCount: v.number(),
    customHints: v.optional(v.string()),
    availableIngredients: v.optional(v.string()),
    generatedPrompt: v.string(),
    openaiResponse: v.string(),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
    parsedSuggestion: v.object({
      title: v.string(),
      portions: v.number(),
    }),
  })),
  handler: async (ctx, args) => {
    const { familyId, limit = 20, includeSuccessOnly = false } = args;
    
    let logs;
    
    if (familyId) {
      logs = await ctx.db
        .query("aiSuggestionLogs")
        .withIndex("by_family_and_timestamp", (q) => 
          q.eq("familyId", familyId)
        )
        .order("desc")
        .take(limit);
    } else {
      logs = await ctx.db
        .query("aiSuggestionLogs")
        .withIndex("by_timestamp")
        .order("desc")
        .take(limit);
    }
    
    return logs
      .filter(log => !includeSuccessOnly || log.success)
      .map(log => ({
        _id: log._id,
        _creationTime: log._creationTime,
        timestamp: log.timestamp,
        mealType: log.mealType,
        selectedUserCount: log.selectedUserCount,
        customHints: log.customHints,
        availableIngredients: log.availableIngredients,
        generatedPrompt: log.generatedPrompt,
        openaiResponse: log.openaiResponse,
        success: log.success,
        errorMessage: log.errorMessage,
        parsedSuggestion: {
          title: log.parsedSuggestion.title,
          portions: log.parsedSuggestion.portions,
        },
      }));
  },
});

// Query to get detailed log entry (for debugging a specific suggestion)
export const getAISuggestionLogDetail = query({
  args: { logId: v.id("aiSuggestionLogs") },
  returns: v.union(v.null(), v.object({
    _id: v.id("aiSuggestionLogs"),
    _creationTime: v.number(),
    timestamp: v.number(),
    mealType: v.union(v.literal("large"), v.literal("small")),
    selectedUserCount: v.number(),
    customHints: v.optional(v.string()),
    availableIngredients: v.optional(v.string()),
    excludeLastMealsCount: v.number(),
    familyPreferences: v.array(v.object({
      name: v.union(v.string(), v.null()),
      preferences: v.union(v.string(), v.null()),
      dislikes: v.union(v.string(), v.null()),
      allergies: v.union(v.string(), v.null()),
    })),
    recentMeals: v.array(v.object({
      title: v.string(),
      date: v.string(),
    })),
    generatedPrompt: v.string(),
    openaiResponse: v.string(),
    parsedSuggestion: v.object({
      title: v.string(),
      portions: v.number(),
      steps: v.array(v.object({
        instructions: v.string(),
        estimatedMinutes: v.optional(v.number()),
      })),
      ingredients: v.array(v.object({
        name: v.string(),
        amountPerPortion: v.number(),
        unit: v.string(),
        inStock: v.boolean(),
        estimatedKcal: v.optional(v.number()),
      })),
    }),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.logId);
  },
});

// Internal query to get recent meals for a family before a specific date
export const getRecentMeals = internalQuery({
  args: {
    familyId: v.id("families"),
    beforeDate: v.string(), // Format YYYY-MM-DD
    limit: v.number(),
  },
  returns: v.array(v.object({
    title: v.string(),
    date: v.string(),
  })),
  handler: async (ctx, args) => {
    // Get all meals for the family that are before or on the given date
    // We'll collect all meals and then sort them by date manually since we need desc order by date
    const allMeals = await ctx.db
      .query("meals")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .filter((q) => q.lte(q.field("date"), args.beforeDate))
      .collect();

    // Sort by date descending (most recent first) and take the limit
    const sortedMeals = allMeals
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, args.limit);

    return sortedMeals.map(meal => ({
      title: meal.title,
      date: meal.date,
    }));
  },
});

// Helper function to build the prompt
function buildPrompt({
  mealType,
  familyPreferences,
  customHints,
  availableIngredients,
  recentMeals,
  portionCount,
}: {
  mealType: "large" | "small";
  familyPreferences: Array<{
    name: string | null;
    preferences: string | null;
    dislikes: string | null;
    allergies: string | null;
  }>;
  customHints?: string;
  availableIngredients?: string;
  recentMeals: Array<{ title: string; date: string }>;
  portionCount: number;
}) {
  const mealTypeText = mealType === "large" 
    ? "eine große Mahlzeit mit Kochen (Hauptgericht)"
    : "einen kleinen Snack oder eine leichte Mahlzeit";

  let prompt = `Erstelle einen Vorschlag für ${mealTypeText} für ${portionCount} ${portionCount === 1 ? 'Person' : 'Personen'}.\n\n`;

  // Add family preferences
  if (familyPreferences.length > 0) {
    prompt += "FAMILIENPRÄFERENZEN:\n";
    familyPreferences.forEach((member, index) => {
      const name = member.name || `Person ${index + 1}`;
      prompt += `${name}:\n`;
      if (member.preferences) prompt += `- Mag: ${member.preferences}\n`;
      if (member.dislikes) prompt += `- Mag nicht: ${member.dislikes}\n`;
      if (member.allergies) prompt += `- Allergien: ${member.allergies}\n`;
      prompt += "\n";
    });
  }

  // Add custom hints
  if (customHints) {
    prompt += `SPEZIELLE WÜNSCHE: ${customHints}\n\n`;
  }

  // Add available ingredients
  if (availableIngredients) {
    prompt += `VERFÜGBARE ZUTATEN (sollten verwendet werden): ${availableIngredients}\n\n`;
  }

  // Add recent meals to avoid
  if (recentMeals.length > 0) {
    prompt += "KÜRZLICH GEKOCHT (bitte vermeiden):\n";
    recentMeals.forEach(meal => {
      prompt += `- ${meal.title} (${meal.date})\n`;
    });
    prompt += "\n";
  }

  prompt += `ANTWORTFORMAT:
Antworte mit einem gültigen JSON-Objekt in diesem exakten Format:

{
  "title": "Name des Gerichts",
  "steps": [
    {
      "instructions": "Detaillierte Anweisung für diesen Schritt",
      "estimatedMinutes": 15
    }
  ],
  "ingredients": [
    {
      "name": "Zutat",
      "amountPerPortion": 200,
      "unit": "g",
      "estimatedKcal": 150
    }
  ]
}

WICHTIGE HINWEISE:
- Alle Mengen sind PRO PORTION angegeben
- estimatedMinutes ist optional, aber hilfreich für Zeitplanung
- estimatedKcal ist optional, aber hilfreich für Nährwertinfo
- Verwende realistische deutsche Zutaten und Einheiten (g, ml, Stück, TL, EL, etc.)
- Schritte sollen klar und verständlich sein
- Bei ${mealType === "large" ? "großen Mahlzeiten" : "Snacks"} entsprechend umfangreich/einfach gestalten`;

  return prompt;
}
