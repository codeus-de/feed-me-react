import { action } from "./_generated/server";
import { v } from "convex/values";

// Meal suggestion generation
export const generateMealSuggestion = action({
  args: {
    familyId: v.id("families"),
    selectedUserIds: v.array(v.id("users")),
    mealType: v.union(v.literal("large"), v.literal("small")), // large = große Mahlzeit, small = kleiner Snack
    customHints: v.optional(v.string()),
    availableIngredients: v.optional(v.string()),
    excludeLastMealsCount: v.number(), // Anzahl der letzten Mahlzeiten die vermieden werden sollen
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

    // Build prompt for OpenAI
    const prompt = buildPrompt({
      mealType: args.mealType,
      familyPreferences: args.familyPreferences,
      customHints: args.customHints,
      availableIngredients: args.availableIngredients,
      recentMeals: args.recentMeals,
      portionCount: args.selectedUserIds.length,
    });

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
      console.error("OpenAI API Error:", errorText);
      throw new Error(`OpenAI API Fehler: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Keine Antwort von OpenAI erhalten");
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
      
      const suggestion = JSON.parse(cleanContent);
      
      // Validate the response structure
      if (!suggestion.title || !suggestion.steps || !suggestion.ingredients) {
        throw new Error("Ungültige Antwortstruktur von OpenAI");
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

      return suggestion;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Content:", content);
      throw new Error("Konnte OpenAI Antwort nicht verarbeiten");
    }
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
