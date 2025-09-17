"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";

// Generate AI response (internal action with Node.js runtime)
export const generateResponse = internalAction({
  args: {
    threadId: v.id("chatThreads"),
    userMessageId: v.id("chatMessages"),
  },
  returns: v.null(),
  handler: async (ctx, { threadId }) => {
    try {
      // Get recent messages for context
      const messages = await ctx.runQuery(internal.chat.getMessagesForContext, {
        threadId,
      });

      // Get thread info for userId
      const thread = await ctx.runQuery(internal.chat.getThread, { threadId });
      if (!thread) {
        throw new Error("Thread not found");
      }

      // Use AI agent to generate response with RAG
      const { generateAIResponse } = await import("./agent");
      const contextMessages = messages.reverse().map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Create search function for RAG
      const searchKnowledge = async (query: string, userId: string, category?: string) => {
        const searchResults = await ctx.runAction(api.knowledgeActions.searchSemanticWithEmbedding, {
          userId,
          query,
          category,
          limit: 5,
        });
        return searchResults.map((result: {content: string, similarity: number}) => ({
          content: result.content,
          similarity: result.similarity,
        }));
      };

      const responseContent = await generateAIResponse(contextMessages, searchKnowledge, thread.userId);

      // Save AI response
      await ctx.runMutation(internal.chat.saveAIResponse, {
        threadId,
        content: responseContent,
      });

      return null;
    } catch (error) {
      console.error("Errore nella generazione della risposta:", error);
      
      // Save error message
      await ctx.runMutation(internal.chat.saveAIResponse, {
        threadId,
        content: "Mi dispiace, si è verificato un errore. Riprova più tardi.",
      });
      
      return null;
    }
  },
});