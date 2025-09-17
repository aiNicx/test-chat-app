"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

interface ProcessingQueueProps {
  userId: string;
}

export default function ProcessingQueue({ userId }: ProcessingQueueProps) {
  const queue = useQuery(api.knowledge.getProcessingQueue, { userId });

  if (!queue || queue.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
      <div className="flex items-center space-x-3 mb-3">
        <span className="text-yellow-600">⚡</span>
        <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
          Documenti in Elaborazione ({queue.length})
        </h4>
      </div>

      <div className="space-y-2">
        {queue.map((item) => (
          <div key={item._id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${
                item.status === 'processing' ? 'bg-yellow-500 animate-pulse' :
                item.status === 'completed' ? 'bg-green-500' :
                item.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
              }`}></div>
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.operation === 'upload' ? 'Upload Documento' :
                   item.operation === 'chunking' ? 'Chunking' :
                   item.operation === 'embedding' ? 'Generazione Embedding' :
                   item.operation}
                </span>
                {item.documentId && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    ID: {item.documentId.slice(-8)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {item.progress !== undefined && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {item.progress}%
                </div>
              )}
              <span className={`text-xs px-2 py-1 rounded ${
                item.status === 'processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' :
                item.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                item.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200'
              }`}>
                {item.status === 'processing' ? 'In corso...' :
                 item.status === 'completed' ? 'Completato' :
                 item.status === 'failed' ? 'Fallito' :
                 item.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {queue.some(item => item.error) && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">
            Alcuni documenti hanno avuto errori durante l'elaborazione. Controlla i dettagli per maggiori informazioni.
          </p>
        </div>
      )}
    </div>
  );
}