"use node";

import type { Chunk } from "./embedding";

// Sistema di chunking intelligente per documenti
export type { Chunk } from "./embedding";

export class DocumentChunker {
  private static readonly MAX_CHUNK_SIZE = 1500; // token (~1125 parole) - aumentato per PDF
  private static readonly MIN_CHUNK_SIZE = 300;  // token - aumentato per coerenza
  private static readonly OVERLAP_SIZE = 150;   // token di overlap - aumentato per contesto

  static chunkDocument(content: string, documentId: string): Chunk[] {
    const chunks: Chunk[] = [];
    const sections = this.splitIntoSections(content);
    let chunkIndex = 0;

    for (const section of sections) {
      const sectionChunks = this.chunkSection(section, documentId, chunkIndex);
      chunks.push(...sectionChunks);
      chunkIndex += sectionChunks.length;
    }

    return this.validateChunks(chunks);
  }

  private static splitIntoSections(content: string): Array<{title?: string, content: string}> {
    const lines = content.split('\n');
    const sections: Array<{title?: string, content: string}> = [];
    let currentSection = '';
    let currentTitle = '';

    for (const line of lines) {
      // Migliora il riconoscimento di titoli per PDF
      if (
        line.match(/^#{1,6}\s/) || // Markdown headers
        line.match(/^\d+\.\s+[A-Z]/) || // Numbered sections (1. Title)
        line.match(/^[A-Z][A-Z\s]{3,}$/) || // ALL CAPS titles
        (line.match(/^[A-Z]/) && line.length < 100 && line.endsWith(':')) || // Title with colon
        line.match(/^Chapter\s+\d+/i) || // Chapter titles
        line.match(/^Section\s+\d+/i) // Section titles
      ) {
        if (currentSection.trim()) {
          sections.push({
            title: currentTitle,
            content: currentSection.trim()
          });
        }
        currentTitle = line.replace(/^#{1,6}\s/, '').trim();
        currentSection = '';
      } else {
        currentSection += line + '\n';
      }
    }

    if (currentSection.trim()) {
      sections.push({
        title: currentTitle,
        content: currentSection.trim()
      });
    }

    return sections;
  }

  private static chunkSection(
    section: {title?: string, content: string},
    documentId: string,
    startIndex: number
  ): Chunk[] {
    const chunks: Chunk[] = [];
    const { title, content } = section;
    const words = content.split(/\s+/);

    let start = 0;
    let chunkIndex = startIndex;

    while (start < words.length) {
      let end = start + this.MAX_CHUNK_SIZE;

      if (end >= words.length) {
        end = words.length;
      } else {
        end = this.findNaturalBreak(words, start, end);
      }

      const chunkContent = words.slice(start, end).join(' ');
      const chunk: Chunk = {
        id: `${documentId}_chunk_${chunkIndex}`,
        content: title ? `${title}\n\n${chunkContent}` : chunkContent,
        metadata: {
          documentId,
          chunkIndex,
          section: title,
          wordCount: end - start,
        }
      };

      chunks.push(chunk);
      chunkIndex++;
      start = Math.max(start + 1, end - this.OVERLAP_SIZE);
    }

    return chunks;
  }

  private static findNaturalBreak(words: string[], start: number, preferredEnd: number): number {
    // Cerca un punto di interruzione naturale in ordine di priorità
    for (let i = Math.min(preferredEnd, words.length) - 1; i > start + 50; i--) { // Evita chunk troppo piccoli
      const word = words[i];
      const nextWord = words[i + 1] || '';
      
      // 1. Fine di paragrafo (doppio newline)
      if (word.includes('\n\n') || nextWord.includes('\n\n')) {
        return i + 1;
      }
      
      // 2. Fine di frase con punto, punto esclamativo o interrogativo
      if ((word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) && 
          nextWord && nextWord.match(/^[A-Z]/)) {
        return i + 1;
      }
      
      // 3. Fine di elenco puntato o numerato
      if (word.endsWith(':') && (nextWord.match(/^[-•*]\s/) || nextWord.match(/^\d+\.\s/))) {
        return i + 1;
      }
      
      // 4. Interruzioni di sezione
      if (nextWord && (
        nextWord.match(/^Chapter\s+\d+/i) ||
        nextWord.match(/^Section\s+\d+/i) ||
        nextWord.match(/^\d+\.\s+[A-Z]/)
      )) {
        return i + 1;
      }
    }
    
    // Fallback: cerca almeno un punto
    for (let i = Math.min(preferredEnd, words.length) - 1; i > start; i--) {
      const word = words[i];
      if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) {
        return i + 1;
      }
    }
    
    return Math.min(preferredEnd, words.length);
  }

  private static validateChunks(chunks: Chunk[]): Chunk[] {
    const valid: Chunk[] = [];
    const invalid: Chunk[] = [];

    for (const chunk of chunks) {
      if (chunk.content.length < 50) {
        invalid.push(chunk);
      } else if (chunk.metadata.wordCount < this.MIN_CHUNK_SIZE && chunk.metadata.wordCount > 10) {
        if (valid.length > 0) {
          const lastChunk = valid[valid.length - 1];
          if (lastChunk.metadata.wordCount + chunk.metadata.wordCount < this.MAX_CHUNK_SIZE) {
            lastChunk.content += '\n\n' + chunk.content;
            lastChunk.metadata.wordCount += chunk.metadata.wordCount;
            continue;
          }
        }
      }
      valid.push(chunk);
    }

    console.log(`Chunking completato: ${valid.length} validi, ${invalid.length} scartati`);
    return valid;
  }
}