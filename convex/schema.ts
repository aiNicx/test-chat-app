import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Schema semplificato senza Convex Auth
export default defineSchema({
  // Tabella utenti semplificata per Clerk
  userProfiles: defineTable({
    clerkUserId: v.string(), // ID utente da Clerk
    name: v.optional(v.string()),
    email: v.string(),
  }).index("by_clerk_user_id", ["clerkUserId"]),
  
  // Manteniamo la tabella numbers per l'esempio esistente
  numbers: defineTable({
    value: v.number(),
  }),
});
