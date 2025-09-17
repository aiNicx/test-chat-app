"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useAction } from "convex/react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import { api } from "../convex/_generated/api";

interface DocumentUploaderProps {
  userId: string;
}

interface ProcessingResult {
  documentId: string;
  chunksProcessed: number;
  chunksSaved: number;
  totalTokens: number;
}

const resolvePdfWorkerSrc = () => {
  if (typeof window !== "undefined") {
    try {
      return new URL("pdf.worker.min.mjs", window.location.origin).toString();
    } catch (error) {
      console.warn("Impossibile risolvere l'URL del worker PDF locale:", error);
    }
  }

  return "/pdf.worker.min.mjs";
};

export default function DocumentUploader({ userId }: DocumentUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [textInput, setTextInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Assicura che il componente sia renderizzato solo lato client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const processTextDocument = useMutation(api.knowledge.addDocumentWithEmbedding);
  const processFileDocument = useMutation(api.knowledge.addDocumentWithEmbedding);
  const processPDFDocument = useAction(api.knowledgeActions.processPDFDocument);

  // Funzione per estrarre testo da PDF utilizzando PDF.js lato client
  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const workerSrc = resolvePdfWorkerSrc();

      if (pdfjsLib.GlobalWorkerOptions.workerSrc !== workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
      }

      const arrayBuffer = await file.arrayBuffer();
      const data = arrayBuffer;
      let pdf;

      try {
        pdf = await pdfjsLib.getDocument({ data }).promise;
      } catch (workerError) {
        console.warn(
          "Caricamento del worker PDF.js non riuscito, fallback senza worker attivato:",
          workerError
        );
        pdf = await pdfjsLib.getDocument({ data, useWorker: false }).promise;
      }
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ');
        fullText += pageText + '\n\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('Errore nell\'estrazione del testo PDF:', error);
      throw new Error('Impossibile estrarre il testo dal PDF. Assicurati che il file sia un PDF valido.');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validFiles = selectedFiles.filter(file =>
      file.type === 'text/markdown' ||
      file.type === 'text/plain' ||
      file.type === 'application/pdf' ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.pdf')
    );
    setFiles(validFiles);
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim() || !userId) return;

    setIsProcessing(true);
    try {
      const result = await processTextDocument({
        userId,
        title: `Documento Testo - ${new Date().toLocaleDateString()}`,
        content: textInput,
        category: "manual_input",
        source: "dashboard_input",
      });

      setResults(prev => [...prev, result]);
      setTextInput("");
    } catch (error) {
      console.error("Errore processamento testo:", error);
      alert("Errore nel processamento del documento");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async () => {
    if (files.length === 0 || !userId) return;

    setIsProcessing(true);
    const uploadResults: ProcessingResult[] = [];

    try {
      for (const file of files) {
        let result: ProcessingResult;

        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          // Gestisce file PDF - estrae il testo lato client
          try {
            const extractedText = await extractTextFromPDF(file);
            
            if (!extractedText || extractedText.trim().length === 0) {
              throw new Error('Impossibile estrarre testo dal PDF o PDF vuoto');
            }
            
            result = await processPDFDocument({
              userId,
              title: file.name.replace(/\.pdf$/i, ''),
              extractedText,
              category: "pdf_upload",
              source: `uploaded_pdf_${file.name}`,
            });
          } catch (pdfError) {
            console.error(`Errore nell'elaborazione del PDF ${file.name}:`, pdfError);
            // Crea un risultato di errore
            result = {
              documentId: '',
              chunksProcessed: 0,
              chunksSaved: 0,
              totalTokens: 0,
            };
            alert(`Errore nell'elaborazione del PDF ${file.name}: ${pdfError instanceof Error ? pdfError.message : 'Errore sconosciuto'}`);
            continue; // Salta questo file e continua con il prossimo
          }
        } else {
          // Gestisce file di testo (.md, .txt)
          const content = await file.text();

          result = await processFileDocument({
            userId,
            title: file.name.replace(/\.(md|txt)$/i, ''),
            content,
            category: "file_upload",
            source: `uploaded_file_${file.name}`,
          });
        }

        uploadResults.push(result);
      }

      setResults(prev => [...prev, ...uploadResults]);
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Errore upload file:", error);
      alert("Errore nell'upload dei file");
    } finally {
      setIsProcessing(false);
    }
  };

  // Mostra loading durante l'hydration per evitare problemi SSR
  if (!isClient) {
    return (
      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Input Testo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📝 Aggiungi Testo Manualmente
        </h3>

        <div className="space-y-4">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Incolla qui il tuo testo OKRs...&#10;&#10;Esempio:&#10;Gli OKRs (Objectives and Key Results) sono un framework per definire obiettivi misurabili..."
            className="w-full h-48 p-4 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     placeholder-gray-500 dark:placeholder-gray-400
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />

          <button
            onClick={handleTextSubmit}
            disabled={!textInput.trim() || isProcessing || !userId}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                     disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? "🔄 Processando..." : "🚀 Processa Testo"}
          </button>
        </div>
      </div>

      {/* Upload File */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📁 Upload File (.md, .txt, .pdf)
        </h3>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600
                        rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".md,.txt,.pdf,text/markdown,text/plain,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />

            <label
              htmlFor="file-upload"
              className="cursor-pointer block"
            >
              <div className="text-gray-600 dark:text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Trascina i file qui o clicca per selezionare
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Supporta .md, .txt e .pdf (max 10MB ciascuno)
              </p>
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">
                File selezionati ({files.length}):
              </h4>
              {files.map((file, index) => {
                const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
                const isMarkdown = file.name.endsWith('.md');
                const icon = isPDF ? '📕' : isMarkdown ? '📝' : '📄';
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-blue-600">{icon}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      {isPDF && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          PDF
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={handleFileUpload}
            disabled={files.length === 0 || isProcessing || !userId}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700
                     disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? "🔄 Processando..." : `📤 Upload ${files.length} File`}
          </button>
        </div>
      </div>

      {/* Risultati Processamento */}
      {results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            ✅ Risultati Processamento
          </h3>

          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-green-600">✅</span>
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Documento {result.documentId.slice(-8)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Chunk Processati:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {result.chunksProcessed}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Chunk Salvati:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {result.chunksSaved}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Token Totali:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {result.totalTokens}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}