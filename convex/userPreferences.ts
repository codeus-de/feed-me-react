import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Nutzerpräferenzen abrufen
export const getUserPreferences = query({
  args: {},
  returns: v.union(
    v.object({
      preferences: v.union(v.string(), v.null()),
      dislikes: v.union(v.string(), v.null()),
      allergies: v.union(v.string(), v.null()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    return {
      preferences: user.preferences || null,
      dislikes: user.dislikes || null,
      allergies: user.allergies || null,
    };
  },
});

// Nutzerpräferenzen aktualisieren
export const updateUserPreferences = mutation({
  args: {
    preferences: v.optional(v.string()),
    dislikes: v.optional(v.string()),
    allergies: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Nicht authentifiziert");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("Benutzer nicht gefunden");
    }

    // Aktualisiere nur die übergebenen Felder
    const updates: any = {};
    if (args.preferences !== undefined) {
      updates.preferences = args.preferences || undefined;
    }
    if (args.dislikes !== undefined) {
      updates.dislikes = args.dislikes || undefined;
    }
    if (args.allergies !== undefined) {
      updates.allergies = args.allergies || undefined;
    }

    await ctx.db.patch(userId, updates);
    return null;
  },
});

// Alle Nutzerpräferenzen einer Familie abrufen (für spätere LLM-Integration)
export const getFamilyPreferences = query({
  args: {
    familyId: v.id("families"),
  },
  returns: v.array(v.object({
    userId: v.id("users"),
    name: v.union(v.string(), v.null()),
    preferences: v.union(v.string(), v.null()),
    dislikes: v.union(v.string(), v.null()),
    allergies: v.union(v.string(), v.null()),
  })),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Nicht authentifiziert");
    }

    // Prüfe ob der Nutzer zur Familie gehört
    const currentUser = await ctx.db.get(userId);
    if (!currentUser || currentUser.familyId !== args.familyId) {
      throw new Error("Keine Berechtigung für diese Familie");
    }

    // Alle Nutzer der Familie abrufen
    const familyMembers = await ctx.db
      .query("users")
      .withIndex("familyId", (q) => q.eq("familyId", args.familyId))
      .collect();

    return familyMembers.map(member => ({
      userId: member._id,
      name: member.name || null,
      preferences: member.preferences || null,
      dislikes: member.dislikes || null,
      allergies: member.allergies || null,
    }));
  },
});
