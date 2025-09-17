"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

interface DocumentListProps {
  userId: string;
}

export default function DocumentList({ userId }: DocumentListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const documents = useQuery(api.knowledge.getDocuments, {
    userId,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    search: searchTerm || undefined,
  });

  const categories = useQuery(api.knowledge.getCategories, { userId });
  const deleteDocument = useMutation(api.knowledge.deleteDocument);

  const handleDelete = async (documentId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo documento?')) {
      try {
        await deleteDocument({ documentId, userId });
      } catch (error) {
        console.error('Errore eliminazione:', error);
        alert('Errore nell\'eliminazione del documento');
      }
    }
  };

  if (!documents || !categories) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-3">
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
      {/* Filtri */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cerca documenti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tutte le categorie</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista Documenti */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            📋 Documenti ({documents.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {documents.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg">Nessun documento trovato</p>
              <p className="text-sm mt-2">
                {searchTerm || selectedCategory !== 'all'
                  ? 'Prova a modificare i filtri di ricerca'
                  : 'Aggiungi il primo documento dalla tab "Upload"'
                }
              </p>
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-lg">
                        {doc.category === 'okr_basics' && '📚'}
                        {doc.category === 'okr_examples' && '💡'}
                        {doc.category === 'manual_input' && '✍️'}
                        {doc.category === 'file_upload' && '📁'}
                        {!['okr_basics', 'okr_examples', 'manual_input', 'file_upload'].includes(doc.category) && '📄'}
                      </span>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {doc.title}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <span className="flex items-center space-x-1">
                        <span>📂</span>
                        <span>{doc.category.replace('_', ' ')}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>📅</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString('it-IT')}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>📏</span>
                        <span>{doc.content.length} caratteri</span>
                      </span>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                      {doc.content.substring(0, 200)}...
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20
                             rounded-lg transition-colors"
                    title="Elimina documento"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}