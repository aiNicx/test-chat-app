"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

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

      // Use AI agent to generate response
      const { generateAIResponse } = await import("./agent");
      const contextMessages = messages.reverse().map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      
      const responseContent = await generateAIResponse(contextMessages);

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