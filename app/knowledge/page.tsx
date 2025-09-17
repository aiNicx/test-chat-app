"use client";

import { useState, useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import DocumentUploader from "../../components/DocumentUploader";
import KnowledgeStats from "../../components/KnowledgeStats";
import DocumentList from "../../components/DocumentList";
import ProcessingQueue from "../../components/ProcessingQueue";

export default function KnowledgePage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'stats'>('upload');
  const [userId, setUserId] = useState<string>("");

  // Ottieni userId da Clerk
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    }
  }, [user]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Caricamento...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Knowledge Base OKRs
              </h1>
              <a
                href="/"
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                ← Torna alla Chat
              </a>
            </div>
            <UserButton afterSignOutUrl="/signin" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header con navigazione */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Gestione Knowledge Base
            </h2>

            <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
              {[
                { id: 'upload', label: '📤 Upload Documenti', icon: '📤' },
                { id: 'manage', label: '📋 Gestisci Documenti', icon: '📋' },
                { id: 'stats', label: '📊 Statistiche', icon: '📊' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contenuto delle tab */}
          <div className="space-y-6">
            {activeTab === 'upload' && <DocumentUploader userId={userId} />}
            {activeTab === 'manage' && <DocumentList userId={userId} />}
            {activeTab === 'stats' && <KnowledgeStats userId={userId} />}
          </div>

          {/* Queue di processamento */}
          {userId && <ProcessingQueue userId={userId} />}
        </div>
      </main>
    </div>
  );
}