import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  
  // Erweitere die users Tabelle um familyId
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    familyId: v.optional(v.id("families")), // Referenz zur Familie
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("familyId", ["familyId"]), // Index für Familie-Abfragen
  
  // Neue Familie-Tabelle
  families: defineTable({
    name: v.string(), // Name der Familie (erforderlich)
    createdAt: v.number(), // Zeitstempel der Erstellung
  }),
  
  numbers: defineTable({
    value: v.number(),
  }),
});
