"use node";

import type { Chunk } from "./embedding";

// Sistema di chunking intelligente per documenti
export type { Chunk } from "./embedding";

export class DocumentChunker {
  private static readonly MAX_CHUNK_SIZE = 1000; // token (~750 parole)
  private static readonly MIN_CHUNK_SIZE = 200;  // token
  private static readonly OVERLAP_SIZE = 100;   // token di overlap

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
      if (line.match(/^#{1,6}\s/)) {
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
    for (let i = Math.min(preferredEnd, words.length) - 1; i > start; i--) {
      const word = words[i];
      if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) {
        return i + 1;
      }
      if (word === '' || word.includes('\n\n')) {
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