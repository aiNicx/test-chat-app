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
  
  // Chat threads table
  chatThreads: defineTable({
    userId: v.string(),
    title: v.string(),
    summary: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  
  // Chat messages table
  chatMessages: defineTable({
    threadId: v.id("chatThreads"),
    userId: v.optional(v.string()),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    createdAt: v.number(),
  }).index("by_thread", ["threadId"])
    .index("by_thread_and_creation", ["threadId", "createdAt"]),
});
