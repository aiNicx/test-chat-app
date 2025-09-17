import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// NOTA: File temporaneamente semplificato dopo rimozione di Convex Auth
// TODO: Implementare funzioni utente con Clerk quando necessario

/**
 * Ottiene l'utente corrente autenticato.
 * Restituisce null se non autenticato.
 * TEMPORANEAMENTE DISABILITATO - da implementare con Clerk
 */
export const getCurrentUser = query({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Temporaneamente disabilitato - implementare con Clerk se necessario
    return null;
  },
});

/**
 * Crea o aggiorna l'utente nel database.
 * TEMPORANEAMENTE DISABILITATO - da implementare con Clerk
 */
export const upsertUser = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.string(),
    clerkUserId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // TODO: Implementare con Clerk
    // Esempio di implementazione futura:
    // const existingUser = await ctx.db
    //   .query("userProfiles")
    //   .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
    //   .unique();
    //
    // if (existingUser) {
    //   await ctx.db.patch(existingUser._id, {
    //     name: args.name || existingUser.name,
    //     email: args.email,
    //   });
    // } else {
    //   await ctx.db.insert("userProfiles", {
    //     name: args.name,
    //     email: args.email,
    //     clerkUserId: args.clerkUserId,
    //   });
    // }
    
    return null;
  },
});