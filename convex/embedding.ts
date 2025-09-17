"use node";

// Sistema di embedding con OpenAI
export interface EmbeddingResult {
  chunkId: string;
  embedding: number[];
  model: string;
  tokenCount: number;
}

export interface Chunk {
  id: string;
  content: string;
  metadata: {
    documentId: string;
    chunkIndex: number;
    section?: string;
    wordCount: number;
  };
}

export class OpenAIEmbedder {
  private static readonly API_URL = "https://api.openai.com/v1/embeddings";
  private static readonly MODEL = "text-embedding-3-small";
  private static readonly MAX_TOKENS_PER_REQUEST = 8000;

  static async generateEmbedding(chunk: Chunk, apiKey: string): Promise<EmbeddingResult> {
    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: this.prepareTextForEmbedding(chunk.content),
          model: this.MODEL,
          encoding_format: "float",
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        chunkId: chunk.id,
        embedding: data.data[0].embedding,
        model: this.MODEL,
        tokenCount: data.usage.total_tokens,
      };
    } catch (error) {
      console.error(`Errore generazione embedding per ${chunk.id}:`, error);
      throw error;
    }
  }

  static async generateEmbeddingsBatch(
    chunks: Chunk[],
    apiKey: string,
    batchSize: number = 10
  ): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      try {
        const batchResults = await Promise.all(
          batch.map(chunk => this.generateEmbedding(chunk, apiKey))
        );

        results.push(...batchResults);

        if (i + batchSize < chunks.length) {
          await this.sleep(1000);
        }
      } catch (error) {
        console.error(`Errore batch ${i / batchSize + 1}:`, error);
      }
    }

    return results;
  }

  private static prepareTextForEmbedding(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000);
  }

  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Embedding devono avere stessa dimensione");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  static findSimilarChunks(
    queryEmbedding: number[],
    chunkEmbeddings: Array<{chunkId: string, embedding: number[], metadata: Record<string, unknown>}>,
    limit: number = 5
  ): Array<{chunkId: string, similarity: number, metadata: Record<string, unknown>}> {
    const similarities = chunkEmbeddings.map(({chunkId, embedding, metadata}) => ({
      chunkId,
      similarity: this.cosineSimilarity(queryEmbedding, embedding),
      metadata,
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}