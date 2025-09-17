# 🧠 Knowledge Base OKRs - Guida Completa

Sistema completo per gestire una knowledge base vettoriale con RAG (Retrieval-Augmented Generation) per il tuo chatbot OKRs.

## 🚀 Caratteristiche Principali

### ✅ **Sistema RAG Integrato**
- Ricerca semantica nei documenti
- Chunking intelligente dei contenuti
- Embedding vettoriali con OpenAI
- Risposte contestualizzate dal chatbot

### ✅ **Dashboard Interattiva**
- Upload documenti da file o testo (supporta .md, .txt, .pdf)
- Elaborazione intelligente di PDF con estrazione testo
- Gestione completa della knowledge base
- Statistiche dettagliate sull'utilizzo
- Monitoraggio in tempo reale del processamento

### ✅ **Isolamento per Utente**
- Ogni utente ha la propria knowledge base privata
- Sicurezza e privacy garantite
- Possibilità di condivisione documenti (futuro)

### ✅ **Integrazione Chatbot**
- Risposte automatiche basate sulla knowledge base
- Contesto rilevante incluso nelle risposte
- Fallback graceful se la ricerca fallisce

---

## 📋 Prerequisiti

### Environment Variables
```bash
# Nel file .env.local
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key-here
```

### Dipendenze
```bash
npm install @convex-dev/rag
```

---

## 🏗️ Architettura del Sistema

### **Componenti Core**

```
📁 convex/
├── 📄 chunking.ts         # Sistema di chunking intelligente
├── 📄 embedding.ts        # Generatore embedding OpenAI
├── 📄 knowledge.ts        # API gestione knowledge base
├── 📄 setupKnowledge.ts   # Script setup documenti
└── 📄 schema.ts           # Database schema

📁 components/
├── 📄 DocumentUploader.tsx    # Upload documenti
├── 📄 DocumentList.tsx        # Lista e gestione
├── 📄 KnowledgeStats.tsx      # Statistiche
└── 📄 ProcessingQueue.tsx     # Monitoraggio processamento

📁 app/knowledge/
└── 📄 page.tsx            # Dashboard principale
```

### **Database Schema**

```typescript
// Documenti per utente
documents: {
  userId: string,      // Isolamento per utente
  title: string,
  content: string,
  category: string,
  source?: string,
  createdAt: number
}

// Chunk con embedding
document_chunks: {
  documentId: ID,
  userId: string,
  chunkId: string,
  content: string,
  embedding: number[],   // Vettore OpenAI
  model: string,
  tokenCount: number
}

// Queue processamento
processing_queue: {
  userId: string,
  operation: string,
  status: string,
  progress?: number,
  error?: string
}
```

---

## 🚀 Come Usare il Sistema

### **1. Setup Iniziale**

```bash
# Avvia il server di sviluppo
npm run dev

# Vai alla dashboard knowledge base
http://localhost:3000/knowledge
```

### **2. Popolare la Knowledge Base**

#### **Opzione A: Setup Automatico**
```typescript
// Nel browser console o tramite script
import { useUser } from "@clerk/nextjs";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

const { user } = useUser();
const setupKB = useAction(api.setupKnowledge.setupOKRKnowledge);

// Popola con documenti OKRs di esempio
await setupKB({ userId: user.id });
```

#### **Opzione B: Upload Manuale**
1. Vai su `/knowledge`
2. Usa la tab "📤 Upload Documenti"
3. **Testo**: Incolla direttamente documenti
4. **File**: Carica file .md, .txt o .pdf
5. **PDF**: Il sistema estrae automaticamente il testo e lo processa

### **3. Testare il Sistema RAG**

1. **Chat normale**: Vai su `/` e inizia una conversazione
2. **Domande specifiche**: Chiedi informazioni sugli OKRs
3. **Verifica RAG**: Il chatbot includerà contesto dalla tua knowledge base

**Esempi di domande da testare:**
- "Cosa sono gli OKRs?"
- "Come scrivere buoni obiettivi?"
- "Quali sono le differenze tra OKRs e KPI?"
- "Esempi di OKRs per team tecnici?"

---

## 🔧 Configurazione Avanzata

### **Chunking Parameters**
```typescript
// convex/chunking.ts
class DocumentChunker {
  private static readonly MAX_CHUNK_SIZE = 1000; // Modifica dimensione chunk
  private static readonly OVERLAP_SIZE = 100;    // Modifica overlap
}
```

### **Embedding Configuration**
```typescript
// convex/embedding.ts
class OpenAIEmbedder {
  private static readonly MODEL = "text-embedding-3-small"; // Cambia modello
  private static readonly MAX_TOKENS_PER_REQUEST = 8000;   // Limite API
}
```

### **Limiti e Quotas**
- **OpenAI Embedding**: ~$0.02 per 1M token
- **Chunk Size**: 750-1000 parole ottimale
- **Ricerca**: Max 5 risultati per query
- **Rate Limits**: 5 richieste batch per volta

---

## 📊 Dashboard Features

### **📤 Upload Documenti**
- **Input Testo**: Incolla direttamente contenuti
- **Upload File**: Supporta .md, .txt e .pdf
- **Elaborazione PDF**: Estrazione automatica del testo
- **Chunking Intelligente**: Suddivisione coerente per PDF complessi
- **Progress Tracking**: Monitora l'elaborazione
- **Error Handling**: Gestione errori user-friendly

### **📋 Gestisci Documenti**
- **Lista Completa**: Tutti i tuoi documenti
- **Filtri**: Per categoria e ricerca testuale
- **Azioni**: Elimina documenti non più necessari
- **Statistiche**: Conteggio per categoria

### **📊 Statistiche**
- **Documenti Totali**: Numero di documenti caricati
- **Chunk Generati**: Suddivisione intelligente
- **Token Utilizzati**: Monitoraggio costi OpenAI
- **Costo Stimato**: Calcolo automatico

---

## 🔍 Come Funziona il Sistema RAG

### **Flusso di Ricerca**

```
1. Utente chiede: "Come scrivere OKRs?"
   ↓
2. Sistema cerca nella knowledge base dell'utente
   ↓
3. Trova chunk rilevanti tramite similarità vettoriale
   ↓
4. Include contesto nei primi 2 risultati più simili
   ↓
5. AI genera risposta basata su conoscenza specifica
```

### **Ottimizzazioni**

- **Chunking**: Documenti divisi in segmenti semanticamente coerenti
- **Embedding**: Rappresentazione vettoriale del significato
- **Ricerca**: Similarità coseno per trovare contenuti rilevanti
- **Contesto**: Limite di 500 caratteri per chunk incluso nel prompt

---

## 🛠️ Troubleshooting

### **Problemi Comuni**

#### **1. Embedding Fallisce**
```
Errore: OPENAI_API_KEY non configurata
```
**Soluzione**: Aggiungi la chiave API nel file `.env.local`

#### **2. Upload Lento**
**Causa**: File troppo grandi o molti documenti contemporaneamente
**Soluzione**: Dividi in batch più piccoli, limita a 5 file per volta

#### **3. RAG Non Trova Risultati**
**Causa**: Query troppo vaga o contenuto non rilevante
**Soluzione**: Usa termini più specifici, verifica categorie documenti

#### **4. Chatbot Non Usa Knowledge Base**
**Causa**: Errore nella ricerca o contesto troppo lungo
**Soluzione**: Controlla console per errori, semplifica query

### **Debug Tools**

```typescript
// Verifica stato knowledge base
const stats = useQuery(api.knowledge.getKnowledgeStats, { userId });

// Test ricerca manuale
const results = useAction(api.knowledge.searchSemantic, {
  userId,
  query: "test query",
  limit: 3
});
```

---

## 🔮 Roadmap e Miglioramenti Futuri

### **Versione Corrente (✅ Implementata)**
- ✅ Knowledge base per utente
- ✅ Chunking intelligente
- ✅ Embedding OpenAI
- ✅ Dashboard completa
- ✅ Integrazione chatbot RAG

### **Prossime Features (🚧 Pianificate)**
- 🔄 **Documenti Condivisi**: Possibilità di condividere documenti tra utenti
- 🔄 **Ricerca Avanzata**: Filtri per data, categoria, autore
- 🔄 **Import Esport**: Backup e ripristino knowledge base
- 🔄 **Analytics**: Statistiche dettagliate su utilizzo RAG
- 🔄 **Auto-categorizzazione**: AI per categorizzare documenti automaticamente

---

## 📞 Supporto

Per problemi o domande:
1. **Controlla la console** per errori JavaScript
2. **Verifica le environment variables**
3. **Testa con documenti piccoli** prima di upload massivi
4. **Monitora i costi OpenAI** nel dashboard

**Il sistema è progettato per essere robusto e gestire gracefully gli errori, quindi non dovrebbe mai bloccare il funzionamento del chatbot anche se la knowledge base ha problemi.**

---

*Creato con ❤️ per ottimizzare la gestione degli OKRs attraverso AI e RAG*