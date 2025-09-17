import { v } from "convex/values";
import { action, mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { paginationOptsValidator } from "convex/server";

// Creare un nuovo thread di conversazione
export const createChatThread = mutation({
  args: {
    userId: v.string(),
    title: v.optional(v.string()),
  },
  returns: v.object({ threadId: v.string() }),
  handler: async (ctx, { userId, title }) => {
    // Create a simple thread record in our own table
    const threadId = await ctx.db.insert("chatThreads", {
      userId,
      title: title || "Nuova Conversazione",
      summary: "Conversazione con l'assistente AI",
      createdAt: Date.now(),
    });
    
    return { threadId: threadId };
  },
});

// Inviare un messaggio e generare una risposta asincrona
export const sendMessage = mutation({
  args: { 
    threadId: v.id("chatThreads"), 
    prompt: v.string(),
    userId: v.string(),
  },
  returns: v.object({ messageId: v.id("chatMessages") }),
  handler: async (ctx, { threadId, prompt, userId }) => {
    // Validate that the thread exists
    const thread = await ctx.db.get(threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    // Save the user message
    const messageId = await ctx.db.insert("chatMessages", {
      threadId,
      userId,
      content: prompt,
      role: "user" as const,
      createdAt: Date.now(),
    });

    // Schedule AI response generation
    await ctx.scheduler.runAfter(0, internal.chatActions.generateResponse, {
      threadId,
      userMessageId: messageId,
    });

    return { messageId };
  },
});

// Internal function to create thread (for agent usage)
export const createThreadInternal = internalMutation({
  args: {
    userId: v.string(),
    title: v.string(),
    summary: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, { userId, title, summary }) => {
    const threadId = await ctx.db.insert("chatThreads", {
      userId,
      title,
      summary,
      createdAt: Date.now(),
    });
    return threadId;
  },
});


// Get messages for context (internal query)
export const getMessagesForContext = internalQuery({
  args: { threadId: v.id("chatThreads") },
  returns: v.array(v.object({
    _id: v.id("chatMessages"),
    _creationTime: v.float64(),
    threadId: v.id("chatThreads"),
    userId: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.float64(),
  })),
  handler: async (ctx, { threadId }) => {
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .order("desc")
      .take(10);
  },
});

// Save AI response (internal mutation)
export const saveAIResponse = internalMutation({
  args: {
    threadId: v.id("chatThreads"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { threadId, content }) => {
    // Get thread info to include userId
    const thread = await ctx.db.get(threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    await ctx.db.insert("chatMessages", {
      threadId,
      userId: thread.userId, // Include userId for consistency
      content,
      role: "assistant" as const,
      createdAt: Date.now(),
    });
    return null;
  },
});

// Get messages for a thread (public query)
export const getMessages = query({
  args: { 
    threadId: v.id("chatThreads"),
    paginationOpts: v.optional(paginationOptsValidator),
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("chatMessages"),
      _creationTime: v.number(),
      threadId: v.id("chatThreads"),
      userId: v.optional(v.string()),
      content: v.string(),
      role: v.union(v.literal("user"), v.literal("assistant")),
      createdAt: v.number(),
    })),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
    splitCursor: v.optional(v.union(v.string(), v.null())),
  }),
  handler: async (ctx, { threadId, paginationOpts }) => {
    // Validate that the thread exists
    const thread = await ctx.db.get(threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    return await ctx.db
      .query("chatMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .order("asc")
      .paginate(paginationOpts || { numItems: 50, cursor: null });
  },
});

// Get user threads (public query)
export const getUserThreads = query({
  args: { 
    userId: v.string(),
    paginationOpts: v.optional(paginationOptsValidator),
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("chatThreads"),
      _creationTime: v.number(),
      userId: v.string(),
      title: v.string(),
      summary: v.string(),
      createdAt: v.number(),
    })),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
    splitCursor: v.optional(v.union(v.string(), v.null())),
  }),
  handler: async (ctx, { userId, paginationOpts }) => {
    return await ctx.db
      .query("chatThreads")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(paginationOpts || { numItems: 20, cursor: null });
  },
});

// Delete a thread (public action)
export const deleteThread = action({
  args: { threadId: v.id("chatThreads") },
  returns: v.null(),
  handler: async (ctx, { threadId }) => {
    // Delete all messages in the thread first
    const messages = await ctx.runQuery(internal.chat.getMessagesForContext, { threadId });
    for (const message of messages) {
      await ctx.runMutation(internal.chat.deleteMessage, { messageId: message._id });
    }
    
    // Delete the thread
    await ctx.runMutation(internal.chat.deleteThreadInternal, { threadId });
    return null;
  },
});

// Delete message (internal)
export const deleteMessage = internalMutation({
  args: { messageId: v.id("chatMessages") },
  returns: v.null(),
  handler: async (ctx, { messageId }) => {
    await ctx.db.delete(messageId);
    return null;
  },
});

// Delete thread (internal)
export const deleteThreadInternal = internalMutation({
  args: { threadId: v.id("chatThreads") },
  returns: v.null(),
  handler: async (ctx, { threadId }) => {
    await ctx.db.delete(threadId);
    return null;
  },
});

// Helper function to get thread by ID
export const getThread = internalQuery({
  args: { threadId: v.id("chatThreads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.threadId);
  },
});