"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

interface KnowledgeStatsProps {
  userId: string;
}

export default function KnowledgeStats({ userId }: KnowledgeStatsProps) {
  const stats = useQuery(api.knowledge.getKnowledgeStats, { userId });

  if (!stats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiche Generali */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          📊 Statistiche Knowledge Base
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📄</span>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Documenti</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.totalDocuments}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🧩</span>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Chunk Totali</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.totalChunks}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🧠</span>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Embedding</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.totalEmbeddings}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiche per Categoria */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          📂 Documenti per Categoria
        </h3>

        <div className="space-y-3">
          {stats.categoryStats.map((category) => (
            <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-lg">
                  {category.category === 'okr_basics' && '📚'}
                  {category.category === 'okr_examples' && '💡'}
                  {category.category === 'manual_input' && '✍️'}
                  {category.category === 'file_upload' && '📁'}
                  {!['okr_basics', 'okr_examples', 'manual_input', 'file_upload'].includes(category.category) && '📄'}
                </span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {category.category.replace('_', ' ')}
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {category.count} documenti
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Utilizzo Token */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          💰 Utilizzo Token (OpenAI)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalTokens.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Token Totali Usati
            </p>
          </div>

          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${(stats.totalTokens / 1000000 * 0.02).toFixed(4)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Costo Stimato
            </p>
          </div>
        </div>
      </div>

      {/* Info sul sistema */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
          ℹ️ Info sul Sistema
        </h3>

        <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
          <p>
            <strong>Chunking:</strong> Documenti divisi in chunk di ~750 parole con overlap del 20%
          </p>
          <p>
            <strong>Embedding:</strong> OpenAI text-embedding-3-small (1536 dimensioni)
          </p>
          <p>
            <strong>Ricerca:</strong> Similarità coseno per trovare chunk rilevanti
          </p>
          <p>
            <strong>Isolamento:</strong> Ogni utente ha la propria knowledge base privata
          </p>
        </div>
      </div>
    </div>
  );
}