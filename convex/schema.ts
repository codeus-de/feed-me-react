import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  
  // Erweitere die users Tabelle um familyId und Präferenzen
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    familyId: v.optional(v.id("families")), // Referenz zur Familie
    preferences: v.optional(v.string()), // Lieblingsessen (mehrzeilig)
    dislikes: v.optional(v.string()), // Mag ich nicht so gerne (mehrzeilig)
    allergies: v.optional(v.string()), // Allergien (mehrzeilig)
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("familyId", ["familyId"]), // Index für Familie-Abfragen
  
  // Neue Familie-Tabelle
  families: defineTable({
    name: v.string(), // Name der Familie (erforderlich)
    createdAt: v.number(), // Zeitstempel der Erstellung
    inviteCode: v.optional(v.string()), // Aktueller Einladungscode
    inviteCodeExpiresAt: v.optional(v.number()), // Ablaufzeit des Codes
  })
    .index("inviteCode", ["inviteCode"]), // Index für Code-Lookup

  // Mahlzeiten-Tabelle
  meals: defineTable({
    familyId: v.id("families"), // Referenz zur Familie
    date: v.string(), // Datum im Format YYYY-MM-DD
    title: v.string(), // Name der Mahlzeit
    portions: v.number(), // Anzahl der Portionen
    createdAt: v.number(), // Zeitstempel der Erstellung
    createdBy: v.id("users"), // Wer die Mahlzeit erstellt hat
  })
    .index("by_family_and_date", ["familyId", "date"]) // Für Kalender-Abfragen
    .index("by_family", ["familyId"]), // Für Familie-Abfragen

  // Zubereitungsschritte
  steps: defineTable({
    mealId: v.id("meals"), // Referenz zur Mahlzeit
    position: v.number(), // Position/Reihenfolge des Schritts
    instructions: v.string(), // Freitext-Anweisungen
    estimatedMinutes: v.optional(v.number()), // Geschätzte Dauer in Minuten
  })
    .index("by_meal_and_position", ["mealId", "position"]), // Für sortierte Abfrage

  // Zutaten
  ingredients: defineTable({
    mealId: v.id("meals"), // Referenz zur Mahlzeit
    name: v.string(), // Name der Zutat
    amountPerPortion: v.number(), // Menge pro Portion
    unit: v.string(), // Einheit (g, ml, Stück, etc.)
    inStock: v.boolean(), // Ist die Zutat vorrätig?
    estimatedKcal: v.optional(v.number()), // Geschätzte Kalorien pro Portion
  })
    .index("by_meal", ["mealId"]) // Für Meal-Abfragen
    .index("by_meal_and_stock", ["mealId", "inStock"]), // Für Einkaufslisten
  
  numbers: defineTable({
    value: v.number(),
  }),

  // AI Suggestion Logs für Debugging und Optimierung
  aiSuggestionLogs: defineTable({
    familyId: v.id("families"),
    userId: v.id("users"),
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
    generatedPrompt: v.string(), // Der vollständige Prompt
    openaiResponse: v.string(), // Die Rohausgabe von OpenAI
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
    success: v.boolean(), // War die Generierung erfolgreich?
    errorMessage: v.optional(v.string()), // Fehlermeldung falls nicht erfolgreich
  })
    .index("by_family_and_timestamp", ["familyId", "timestamp"])
    .index("by_user_and_timestamp", ["userId", "timestamp"])
    .index("by_timestamp", ["timestamp"]),
});
