"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { DocumentChunker } from "./chunking";
import { OpenAIEmbedder } from "./embedding";
import { Id } from "./_generated/dataModel";

// Action per processare un singolo documento con embedding
// Segue le best practices per RAG con Convex Agent component
export const processDocumentWithEmbedding = action({
  args: {
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    source: v.optional(v.string()),
  },
  returns: v.object({
    documentId: v.id("documents"),
    chunksProcessed: v.number(),
    chunksSaved: v.number(),
    totalTokens: v.number(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    documentId: Id<"documents">;
    chunksProcessed: number;
    chunksSaved: number;
    totalTokens: number;
    success: boolean;
    error?: string;
  }> => {
    try {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        return {
          documentId: "" as Id<"documents">,
          chunksProcessed: 0,
          chunksSaved: 0,
          totalTokens: 0,
          success: false,
          error: "OPENAI_API_KEY non configurata"
        };
      }

      // Validazione input
      if (!args.content || args.content.trim().length === 0) {
        return {
          documentId: "" as Id<"documents">,
          chunksProcessed: 0,
          chunksSaved: 0,
          totalTokens: 0,
          success: false,
          error: "Contenuto del documento vuoto"
        };
      }

      // 1. Salva documento
      const docId: Id<"documents"> = await ctx.runMutation(internal.setupKnowledge.saveDocumentInternal, {
        userId: args.userId,
        title: args.title,
        content: args.content,
        category: args.category,
        source: args.source,
      });

      // 2. Chunking
      const chunks = DocumentChunker.chunkDocument(args.content, docId);

      if (chunks.length === 0) {
        return {
          documentId: docId,
          chunksProcessed: 0,
          chunksSaved: 0,
          totalTokens: 0,
          success: false,
          error: "Nessun chunk generato dal documento"
        };
      }

      // 3. Genera embedding con retry logic
      let embeddings;
      try {
        embeddings = await OpenAIEmbedder.generateEmbeddingsBatch(
          chunks,
          openaiKey,
          5
        );
      } catch (embeddingError) {
        console.error("Errore nella generazione degli embedding:", embeddingError);
        return {
          documentId: docId,
          chunksProcessed: chunks.length,
          chunksSaved: 0,
          totalTokens: 0,
          success: false,
          error: `Errore nella generazione degli embedding: ${embeddingError instanceof Error ? embeddingError.message : 'Errore sconosciuto'}`
        };
      }

      // 4. Salva chunks con embedding
      let savedChunks = 0;
      const errors: string[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings.find((e: {chunkId: string, embedding: number[], model: string, tokenCount: number}) => e.chunkId === chunk.id);

        if (embedding) {
          try {
            await ctx.runMutation(internal.setupKnowledge.saveChunkInternal, {
              documentId: docId,
              userId: args.userId,
              chunkId: chunk.id,
              content: chunk.content,
              embedding: embedding.embedding,
              metadata: chunk.metadata,
              model: embedding.model,
              tokenCount: embedding.tokenCount,
            });
            savedChunks++;
          } catch (chunkError) {
            console.error(`Errore nel salvare chunk ${chunk.id}:`, chunkError);
            errors.push(`Chunk ${i + 1}: ${chunkError instanceof Error ? chunkError.message : 'Errore sconosciuto'}`);
          }
        } else {
          errors.push(`Chunk ${i + 1}: embedding non trovato`);
        }
      }

      const totalTokens = embeddings.reduce((sum: number, e: {tokenCount: number}) => sum + e.tokenCount, 0);

      return {
        documentId: docId,
        chunksProcessed: chunks.length,
        chunksSaved: savedChunks,
        totalTokens,
        success: savedChunks > 0,
        error: errors.length > 0 ? `Alcuni chunk non sono stati salvati: ${errors.join('; ')}` : undefined
      };

    } catch (error) {
      console.error("Errore generale nel processamento del documento:", error);
      return {
        documentId: "" as Id<"documents">,
        chunksProcessed: 0,
        chunksSaved: 0,
        totalTokens: 0,
        success: false,
        error: `Errore nel processamento: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
      };
    }
  },
});

// Action per ricerca semantica (richiede OpenAI API)
// Implementa RAG pattern seguendo le best practices per Convex Agent
export const searchSemanticWithEmbedding = action({
  args: {
    userId: v.string(),
    query: v.string(),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("document_chunks"),
    _creationTime: v.number(),
    documentId: v.id("documents"),
    userId: v.string(),
    chunkId: v.string(),
    content: v.string(),
    embedding: v.array(v.number()),
    metadata: v.record(v.string(), v.any()),
    model: v.string(),
    tokenCount: v.number(),
    createdAt: v.number(),
    similarity: v.number(),
  })),
  handler: async (ctx, args): Promise<Array<{
    _id: Id<"document_chunks">;
    _creationTime: number;
    documentId: Id<"documents">;
    userId: string;
    chunkId: string;
    content: string;
    embedding: number[];
    metadata: Record<string, unknown>;
    model: string;
    tokenCount: number;
    createdAt: number;
    similarity: number;
  }>> => {
    try {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        console.error("OPENAI_API_KEY non configurata per la ricerca semantica");
        return [];
      }

      // Validazione input
      if (!args.query || args.query.trim().length === 0) {
        console.warn("Query vuota fornita per la ricerca semantica");
        return [];
      }

      // Limita la lunghezza della query per evitare costi eccessivi
      const maxQueryLength = 1000;
      const query = args.query.length > maxQueryLength 
        ? args.query.substring(0, maxQueryLength) + "..."
        : args.query;

      const limit = Math.min(args.limit || 5, 20); // Limita a max 20 risultati

      // 1. Genera embedding per la query
      let queryEmbedding;
      try {
        const queryChunks = DocumentChunker.chunkDocument(query, "query");
        if (queryChunks.length === 0) {
          console.warn("Nessun chunk generato dalla query");
          return [];
        }

        queryEmbedding = await OpenAIEmbedder.generateEmbedding(
          queryChunks[0],
          openaiKey
        );
      } catch (embeddingError) {
        console.error("Errore nella generazione dell'embedding per la query:", embeddingError);
        return [];
      }

      // 2. Recupera embedding dell'utente
      let allEmbeddings;
      try {
        allEmbeddings = await ctx.runQuery(internal.knowledge.getUserEmbeddings, {
          userId: args.userId,
          category: args.category,
        });

        if (allEmbeddings.length === 0) {
          console.info(`Nessun embedding trovato per l'utente ${args.userId}${args.category ? ` nella categoria ${args.category}` : ''}`);
          return [];
        }
      } catch (queryError) {
        console.error("Errore nel recuperare gli embedding dell'utente:", queryError);
        return [];
      }

      // 3. Calcola similarità
      let similarChunks;
      try {
        similarChunks = OpenAIEmbedder.findSimilarChunks(
          queryEmbedding.embedding,
          allEmbeddings.map((embedding: {chunkId: string, embedding: number[], metadata: Record<string, unknown>}) => ({
            chunkId: embedding.chunkId,
            embedding: embedding.embedding,
            metadata: embedding.metadata,
          })),
          limit
        );

        if (similarChunks.length === 0) {
          console.info("Nessun chunk simile trovato");
          return [];
        }
      } catch (similarityError) {
        console.error("Errore nel calcolo della similarità:", similarityError);
        return [];
      }

      // 4. Recupera contenuto completo
      const results: Array<{
        _id: Id<"document_chunks">;
        _creationTime: number;
        documentId: Id<"documents">;
        userId: string;
        chunkId: string;
        content: string;
        embedding: number[];
        metadata: Record<string, unknown>;
        model: string;
        tokenCount: number;
        createdAt: number;
        similarity: number;
      }> = [];
      
      for (const chunk of similarChunks) {
        try {
          const chunkData = await ctx.runQuery(internal.knowledge.getChunkById, {
            chunkId: chunk.chunkId,
          });

          if (chunkData) {
            results.push({
              ...chunkData,
              similarity: chunk.similarity,
            });
          } else {
            console.warn(`Chunk ${chunk.chunkId} non trovato nel database`);
          }
        } catch (chunkError) {
          console.error(`Errore nel recuperare chunk ${chunk.chunkId}:`, chunkError);
          // Continua con gli altri chunk invece di fermarsi
        }
      }

      console.info(`Ricerca semantica completata: ${results.length} risultati trovati per la query "${query.substring(0, 50)}..."`);
      return results;

    } catch (error) {
      console.error("Errore generale nella ricerca semantica:", error);
      return [];
    }
  },
});