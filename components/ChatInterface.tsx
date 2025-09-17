"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Id } from "../convex/_generated/dataModel";

interface Message {
  _id: string;
  role: "user" | "assistant";
  content: string;
  _creationTime: number;
  threadId: string;
  userId?: string;
  createdAt: number;
}

export default function ChatInterface() {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [currentThreadId, setCurrentThreadId] = useState<Id<"chatThreads"> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mutations
  const createThread = useMutation(api.chat.createChatThread);
  const sendMessage = useMutation(api.chat.sendMessage);

  // Query per ottenere i messaggi
  const messages = useQuery(
    api.chat.getMessages,
    currentThreadId ? { threadId: currentThreadId } : "skip"
  );

  // Scroll automatico ai nuovi messaggi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreateNewThread = useCallback(async () => {
    if (!user) return;
    
    try {
      const result = await createThread({
        userId: user.id,
        title: "Nuova Conversazione",
      });
      setCurrentThreadId(result.threadId);
    } catch (error) {
      console.error("Errore nella creazione del thread:", error);
    }
  }, [user, createThread]);

  // Inizializza un nuovo thread quando il componente si monta
  useEffect(() => {
    if (user && !currentThreadId) {
      handleCreateNewThread();
    }
  }, [user, currentThreadId, handleCreateNewThread]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !user || !currentThreadId || isLoading) return;

    const messageText = message.trim();
    setMessage("");
    setIsLoading(true);

    try {
      await sendMessage({
        threadId: currentThreadId,
        prompt: messageText,
        userId: user.id,
      });
    } catch (error) {
      console.error("Errore nell'invio del messaggio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Accedi per utilizzare la chat</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto border border-gray-200 rounded-lg shadow-lg bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">
          Chat con l&apos;Assistente AI
        </h2>
        <button
          onClick={handleCreateNewThread}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Nuova Chat
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.page.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Inizia una conversazione con l&apos;assistente AI!</p>
            <p className="text-sm mt-2">Scrivi un messaggio qui sotto per iniziare.</p>
          </div>
        ) : (
          messages?.page.map((msg: Message) => (
            <div
              key={msg._id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.role === "user" ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {formatTime(msg._creationTime)}
                </p>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-sm">L&apos;assistente sta scrivendo...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Scrivi il tuo messaggio..."
            disabled={isLoading || !currentThreadId}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 text-gray-900 placeholder:text-gray-500"
          />
          <button
            type="submit"
            disabled={!message.trim() || isLoading || !currentThreadId}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Invia
          </button>
        </div>
      </form>
    </div>
  );
}