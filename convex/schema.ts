import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Schema con Knowledge Base
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

  // Knowledge Base Documents
  documents: defineTable({
    userId: v.string(), // ISOLAMENTO PER UTENTE
    title: v.string(),
    content: v.string(),
    category: v.string(),
    source: v.optional(v.string()),
    isPublic: v.optional(v.boolean()), // Permette condivisione documenti
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_category", ["category"])
    .index("by_user_category", ["userId", "category"]),

  // Document chunks with embeddings
  document_chunks: defineTable({
    documentId: v.id("documents"),
    userId: v.string(), // ISOLAMENTO PER UTENTE
    chunkId: v.string(),
    content: v.string(),
    embedding: v.array(v.number()),
    metadata: v.any(),
    model: v.string(),
    tokenCount: v.number(),
    createdAt: v.number(),
  }).index("by_document", ["documentId"])
    .index("by_user", ["userId"])
    .index("by_chunk_id", ["chunkId"]),

  // Processing queue per utente
  processing_queue: defineTable({
    userId: v.string(),
    documentId: v.optional(v.id("documents")),
    operation: v.string(), // "chunking", "embedding", "upload"
    status: v.string(), // "pending", "processing", "completed", "failed"
    progress: v.optional(v.number()), // 0-100
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),
});
