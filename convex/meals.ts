import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Mahlzeit erstellen
export const createMeal = mutation({
  args: {
    familyId: v.id("families"),
    date: v.string(), // YYYY-MM-DD Format
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
  },
  returns: v.id("meals"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Nicht authentifiziert");
    }

    // Prüfe ob User zu Familie gehört
    const user = await ctx.db.get(userId);
    if (!user || user.familyId !== args.familyId) {
      throw new Error("Nicht berechtigt für diese Familie");
    }

    // Erstelle Mahlzeit
    const mealId = await ctx.db.insert("meals", {
      familyId: args.familyId,
      date: args.date,
      title: args.title,
      portions: args.portions,
      createdAt: Date.now(),
      createdBy: userId,
    });

    // Erstelle Zubereitungsschritte
    for (let i = 0; i < args.steps.length; i++) {
      const step = args.steps[i];
      await ctx.db.insert("steps", {
        mealId,
        position: i + 1,
        instructions: step.instructions,
        estimatedMinutes: step.estimatedMinutes,
      });
    }

    // Erstelle Zutaten
    for (const ingredient of args.ingredients) {
      await ctx.db.insert("ingredients", {
        mealId,
        name: ingredient.name,
        amountPerPortion: ingredient.amountPerPortion,
        unit: ingredient.unit,
        inStock: ingredient.inStock,
        estimatedKcal: ingredient.estimatedKcal,
      });
    }

    return mealId;
  },
});

// Mahlzeiten für bestimmte Tage laden
export const getMealsForDates = query({
  args: {
    familyId: v.id("families"),
    dates: v.array(v.string()), // Array von YYYY-MM-DD Strings
  },
  returns: v.array(v.object({
    _id: v.id("meals"),
    date: v.string(),
    title: v.string(),
    portions: v.number(),
    createdAt: v.number(),
    createdBy: v.id("users"),
    familyId: v.id("families"),
    _creationTime: v.number(),
    steps: v.array(v.object({
      _id: v.id("steps"),
      position: v.number(),
      instructions: v.string(),
      estimatedMinutes: v.optional(v.number()),
      mealId: v.id("meals"),
      _creationTime: v.number(),
    })),
    ingredients: v.array(v.object({
      _id: v.id("ingredients"),
      name: v.string(),
      amountPerPortion: v.number(),
      unit: v.string(),
      inStock: v.boolean(),
      estimatedKcal: v.optional(v.number()),
      mealId: v.id("meals"),
      _creationTime: v.number(),
    })),
  })),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Nicht authentifiziert");
    }

    // Prüfe ob User zu Familie gehört
    const user = await ctx.db.get(userId);
    if (!user || user.familyId !== args.familyId) {
      throw new Error("Nicht berechtigt für diese Familie");
    }

    const meals = [];

    // Lade Mahlzeiten für alle angegebenen Tage
    for (const date of args.dates) {
      const dateMeals = await ctx.db
        .query("meals")
        .withIndex("by_family_and_date", (q) => 
          q.eq("familyId", args.familyId).eq("date", date)
        )
        .collect();

      for (const meal of dateMeals) {
        // Lade Zubereitungsschritte
        const steps = await ctx.db
          .query("steps")
          .withIndex("by_meal_and_position", (q) => q.eq("mealId", meal._id))
          .collect();

        // Lade Zutaten
        const ingredients = await ctx.db
          .query("ingredients")
          .withIndex("by_meal", (q) => q.eq("mealId", meal._id))
          .collect();

        meals.push({
          ...meal,
          steps: steps.sort((a, b) => a.position - b.position),
          ingredients,
        });
      }
    }

    return meals;
  },
});

// Mahlzeit aktualisieren
export const updateMeal = mutation({
  args: {
    mealId: v.id("meals"),
    title: v.optional(v.string()),
    portions: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Nicht authentifiziert");
    }

    const meal = await ctx.db.get(args.mealId);
    if (!meal) {
      throw new Error("Mahlzeit nicht gefunden");
    }

    // Prüfe ob User zu Familie gehört
    const user = await ctx.db.get(userId);
    if (!user || user.familyId !== meal.familyId) {
      throw new Error("Nicht berechtigt für diese Familie");
    }

    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.portions !== undefined) updates.portions = args.portions;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.mealId, updates);
    }

    return null;
  },
});

// Zutat Status aktualisieren (inStock)
export const updateIngredientStock = mutation({
  args: {
    ingredientId: v.id("ingredients"),
    inStock: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Nicht authentifiziert");
    }

    const ingredient = await ctx.db.get(args.ingredientId);
    if (!ingredient) {
      throw new Error("Zutat nicht gefunden");
    }

    const meal = await ctx.db.get(ingredient.mealId);
    if (!meal) {
      throw new Error("Mahlzeit nicht gefunden");
    }

    // Prüfe ob User zu Familie gehört
    const user = await ctx.db.get(userId);
    if (!user || user.familyId !== meal.familyId) {
      throw new Error("Nicht berechtigt für diese Familie");
    }

    await ctx.db.patch(args.ingredientId, { inStock: args.inStock });

    return null;
  },
});

// Mahlzeit löschen
export const deleteMeal = mutation({
  args: {
    mealId: v.id("meals"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Nicht authentifiziert");
    }

    const meal = await ctx.db.get(args.mealId);
    if (!meal) {
      throw new Error("Mahlzeit nicht gefunden");
    }

    // Prüfe ob User zu Familie gehört
    const user = await ctx.db.get(userId);
    if (!user || user.familyId !== meal.familyId) {
      throw new Error("Nicht berechtigt für diese Familie");
    }

    // Lösche alle Zubereitungsschritte
    const steps = await ctx.db
      .query("steps")
      .withIndex("by_meal_and_position", (q) => q.eq("mealId", args.mealId))
      .collect();
    
    for (const step of steps) {
      await ctx.db.delete(step._id);
    }

    // Lösche alle Zutaten
    const ingredients = await ctx.db
      .query("ingredients")
      .withIndex("by_meal", (q) => q.eq("mealId", args.mealId))
      .collect();
    
    for (const ingredient of ingredients) {
      await ctx.db.delete(ingredient._id);
    }

    // Lösche Mahlzeit
    await ctx.db.delete(args.mealId);

    return null;
  },
});

// Einzelne Mahlzeit mit allen Details laden
export const getMealById = query({
  args: {
    mealId: v.id("meals"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("meals"),
      date: v.string(),
      title: v.string(),
      portions: v.number(),
      createdAt: v.number(),
      createdBy: v.id("users"),
      familyId: v.id("families"),
      _creationTime: v.number(),
      steps: v.array(v.object({
        _id: v.id("steps"),
        position: v.number(),
        instructions: v.string(),
        estimatedMinutes: v.optional(v.number()),
        mealId: v.id("meals"),
        _creationTime: v.number(),
      })),
      ingredients: v.array(v.object({
        _id: v.id("ingredients"),
        name: v.string(),
        amountPerPortion: v.number(),
        unit: v.string(),
        inStock: v.boolean(),
        estimatedKcal: v.optional(v.number()),
        mealId: v.id("meals"),
        _creationTime: v.number(),
      })),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Nicht authentifiziert");
    }

    // Lade Mahlzeit
    const meal = await ctx.db.get(args.mealId);
    if (!meal) {
      return null;
    }

    // Prüfe ob User zu Familie gehört
    const user = await ctx.db.get(userId);
    if (!user || user.familyId !== meal.familyId) {
      throw new Error("Nicht berechtigt für diese Familie");
    }

    // Lade Zubereitungsschritte
    const steps = await ctx.db
      .query("steps")
      .withIndex("by_meal_and_position", (q) => q.eq("mealId", meal._id))
      .collect();

    // Lade Zutaten
    const ingredients = await ctx.db
      .query("ingredients")
      .withIndex("by_meal", (q) => q.eq("mealId", meal._id))
      .collect();

    return {
      ...meal,
      steps: steps.sort((a, b) => a.position - b.position),
      ingredients,
    };
  },
});
