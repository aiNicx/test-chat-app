import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";


// Salva documento
export const saveDocument = internalMutation({
  args: {
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    source: v.optional(v.string()),
  },
  returns: v.id("documents"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("documents", {
      userId: args.userId,
      title: args.title,
      content: args.content,
      category: args.category,
      source: args.source,
      isPublic: false,
      createdAt: Date.now(),
    });
  },
});

// Salva chunk con embedding
export const saveChunkWithEmbedding = internalMutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
    chunkId: v.string(),
    content: v.string(),
    embedding: v.array(v.number()),
    metadata: v.any(),
    model: v.string(),
    tokenCount: v.number(),
  },
  returns: v.id("document_chunks"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("document_chunks", {
      documentId: args.documentId,
      userId: args.userId,
      chunkId: args.chunkId,
      content: args.content,
      embedding: args.embedding,
      metadata: args.metadata,
      model: args.model,
      tokenCount: args.tokenCount,
      createdAt: Date.now(),
    });
  },
});


// Query helper
export const getUserEmbeddings = internalQuery({
  args: { userId: v.string(), category: v.optional(v.string()) },
  returns: v.array(v.object({
    _id: v.id("document_chunks"),
    _creationTime: v.number(),
    documentId: v.id("documents"),
    userId: v.string(),
    chunkId: v.string(),
    content: v.string(),
    embedding: v.array(v.number()),
    metadata: v.any(),
    model: v.string(),
    tokenCount: v.number(),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const baseQuery = ctx.db.query("document_chunks").withIndex("by_user", (q) =>
      q.eq("userId", args.userId)
    );

    if (args.category) {
      // Filtra per categoria attraverso la relazione con documents
      const userDocs = await ctx.db.query("documents")
        .withIndex("by_user_category", (q) =>
          q.eq("userId", args.userId).eq("category", args.category || "")
        )
        .collect();

      const docIds = userDocs.map(doc => doc._id);
      if (docIds.length === 0) {
        // Se non ci sono documenti per questa categoria, restituisci array vuoto
        return [];
      }
      
      const allChunks = await baseQuery.collect();
      return allChunks.filter(chunk => docIds.includes(chunk.documentId));
    }

    return await baseQuery.collect();
  },
});

export const getChunkById = internalQuery({
  args: { chunkId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("document_chunks"),
      _creationTime: v.number(),
      documentId: v.id("documents"),
      userId: v.string(),
      chunkId: v.string(),
      content: v.string(),
      embedding: v.array(v.number()),
      metadata: v.any(),
      model: v.string(),
      tokenCount: v.number(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db.query("document_chunks")
      .withIndex("by_chunk_id", (q) => q.eq("chunkId", args.chunkId))
      .first();
  },
});

// Gestione documenti
export const getDocuments = query({
  args: {
    userId: v.string(),
    category: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  returns: v.array(v.object({
    _id: v.id("documents"),
    _creationTime: v.number(),
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    source: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db.query("documents").withIndex("by_user", (q) =>
      q.eq("userId", args.userId)
    );

    if (args.category) {
      query = query.filter((q) => q.eq("category", args.category));
    }

    // Nota: Convex non supporta search() sui filter.
    // Per ricerche full-text avanzate, considera di usare un servizio esterno
    // o implementare una soluzione custom

    return await query.order("desc").collect();
  },
});

export const getCategories = query({
  args: { userId: v.string() },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const documents = await ctx.db.query("documents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const categories = [...new Set(documents.map(doc => doc.category))];
    return categories;
  },
});

export const deleteDocument = mutation({
  args: { documentId: v.id("documents"), userId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verifica ownership
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== args.userId) {
      throw new Error("Documento non trovato o non autorizzato");
    }

    // Elimina chunks
    const chunks = await ctx.db.query("document_chunks")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    for (const chunk of chunks) {
      await ctx.db.delete(chunk._id);
    }

    // Elimina documento
    await ctx.db.delete(args.documentId);
  },
});

// Processing queue
export const createProcessingQueue = mutation({
  args: {
    userId: v.string(),
    operation: v.string(),
    status: v.string(),
    documentId: v.optional(v.id("documents")),
  },
  returns: v.id("processing_queue"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("processing_queue", {
      userId: args.userId,
      documentId: args.documentId,
      operation: args.operation,
      status: args.status,
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateProcessingQueue = mutation({
  args: {
    queueId: v.id("processing_queue"),
    status: v.optional(v.string()),
    progress: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: Record<string, string | number | undefined> = { updatedAt: Date.now() };
    if (args.status) updates.status = args.status;
    if (args.progress !== undefined) updates.progress = args.progress;
    if (args.error) updates.error = args.error;

    await ctx.db.patch(args.queueId, updates);
    return null;
  },
});

export const getProcessingQueue = query({
  args: { userId: v.string() },
  returns: v.array(v.object({
    _id: v.id("processing_queue"),
    _creationTime: v.number(),
    userId: v.string(),
    documentId: v.optional(v.id("documents")),
    operation: v.string(),
    status: v.string(),
    progress: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    // Prima prendiamo tutti i record per l'utente
    const allRecords = await ctx.db.query("processing_queue")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Filtriamo manualmente quelli non completati
    const activeRecords = allRecords
      .filter(record => record.status !== "completed")
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    return activeRecords;
  },
});

// Statistiche
export const getKnowledgeStats = query({
  args: { userId: v.string() },
  returns: v.object({
    totalDocuments: v.number(),
    totalChunks: v.number(),
    totalEmbeddings: v.number(),
    categoryStats: v.array(v.object({
      category: v.string(),
      count: v.number(),
    })),
    totalTokens: v.number(),
  }),
  handler: async (ctx, args) => {
    const documents = await ctx.db.query("documents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const chunks = await ctx.db.query("document_chunks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Calcola statistiche per categoria
    const categoryStats = documents.reduce((acc, doc) => {
      const existing = acc.find(c => c.category === doc.category);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ category: doc.category, count: 1 });
      }
      return acc;
    }, [] as Array<{category: string, count: number}>);

    // Calcola token totali
    const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0);

    return {
      totalDocuments: documents.length,
      totalChunks: chunks.length,
      totalEmbeddings: chunks.length,
      categoryStats,
      totalTokens,
    };
  },
});