import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

// You can read data from the database via a query:
export const listNumbers = query({
  // Validators for arguments.
  args: {
    count: v.number(),
  },

  // Query implementation.
  handler: async (ctx, args) => {
    //// Read the database as many times as you need here.
    //// See https://docs.convex.dev/database/reading-data.
    const numbers = await ctx.db
      .query("numbers")
      // Ordered by _creationTime, return most recent
      .order("desc")
      .take(args.count);
    const userId = await getAuthUserId(ctx);
    const user = userId === null ? null : await ctx.db.get(userId);
    return {
      viewer: user?.email ?? null,
      numbers: numbers.reverse().map((number) => number.value),
    };
  },
});

// You can write data to the database via a mutation:
export const addNumber = mutation({
  // Validators for arguments.
  args: {
    value: v.number(),
  },

  // Mutation implementation.
  handler: async (ctx, args) => {
    //// Insert or modify documents in the database here.
    //// Mutations can also read from the database like queries.
    //// See https://docs.convex.dev/database/writing-data.

    const id = await ctx.db.insert("numbers", { value: args.value });

    console.log("Added new document with id:", id);
    // Optionally, return a value from your mutation.
    // return id;
  },
});

// You can fetch data from and send data to third-party APIs via an action:
export const myAction = action({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Action implementation.
  handler: async (ctx, args) => {
    //// Use the browser-like `fetch` API to send HTTP requests.
    //// See https://docs.convex.dev/functions/actions#calling-third-party-apis-and-using-npm-packages.
    // const response = await ctx.fetch("https://api.thirdpartyservice.com");
    // const data = await response.json();

    //// Query data by running Convex queries.
    const data = await ctx.runQuery(api.myFunctions.listNumbers, {
      count: 10,
    });
    console.log(data);

    //// Write data by running Convex mutations.
    await ctx.runMutation(api.myFunctions.addNumber, {
      value: args.first,
    });
  },
});

// Get current user with family information
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    let family = null;
    if (user.familyId) {
      family = await ctx.db.get(user.familyId);
    }

    return {
      user,
      family,
    };
  },
});

// Create a new family and assign current user to it
export const createFamily = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Sie müssen angemeldet sein, um eine Familie zu erstellen.");
    }
    
    // Create the family
    const familyId = await ctx.db.insert("families", {
      name: args.name,
      createdAt: Date.now(),
    });
    
    // Update the user to be part of this family
    await ctx.db.patch(userId, {
      familyId,
    });
    
    return familyId;
  },
});

// Generate a random invite code
function createRandomInviteCode(): string {
  const adjectives = [
    "happy", "sunny", "bright", "quick", "smart", "cool", "warm", "fast",
    "blue", "green", "red", "golden", "silver", "purple", "orange", "pink"
  ];
  
  const nouns = [
    "cat", "dog", "bird", "fish", "tree", "star", "moon", "sun",
    "house", "car", "book", "desk", "chair", "lamp", "phone", "cake"
  ];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100);
  
  return `${adjective}-${noun}-${number}`;
}

// Generate new invite code for family
export const generateInviteCode = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Sie müssen angemeldet sein, um einen Einladungscode zu erstellen.");
    }
    
    const user = await ctx.db.get(userId);
    if (!user?.familyId) {
      throw new Error("Sie müssen Mitglied einer Familie sein, um Einladungscodes zu erstellen.");
    }
    
    const inviteCode = createRandomInviteCode();
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 Stunde ab jetzt
    
    await ctx.db.patch(user.familyId, {
      inviteCode,
      inviteCodeExpiresAt: expiresAt,
    });
    
    return { inviteCode, expiresAt };
  },
});

// Join family using invite code
export const joinFamily = mutation({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Sie müssen angemeldet sein, um einer Familie beizutreten.");
    }
    
    const user = await ctx.db.get(userId);
    if (user?.familyId) {
      throw new Error("Sie gehören bereits zu einer Familie. Sie können nur Mitglied einer Familie gleichzeitig sein.");
    }
    
    // Find family with this invite code
    const family = await ctx.db
      .query("families")
      .withIndex("inviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .first();
    
    if (!family) {
      throw new Error("Dieser Einladungscode ist ungültig. Bitte überprüfen Sie den Code und versuchen Sie es erneut.");
    }
    
    // Check if code is still valid
    if (!family.inviteCodeExpiresAt || family.inviteCodeExpiresAt < Date.now()) {
      throw new Error("Dieser Einladungscode ist abgelaufen. Bitten Sie ein Familienmitglied, einen neuen Code zu erstellen.");
    }
    
    // Add user to family
    await ctx.db.patch(userId, {
      familyId: family._id,
    });
    
    return family._id;
  },
});
