// Script di setup per popolare la knowledge base con documenti OKRs
import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { api } from "./_generated/api";

// Internal mutation per salvare un documento
export const saveDocumentInternal = internalMutation({
  args: {
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    source: v.optional(v.string()),
  },
  returns: v.id("documents"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("documents", {
      userId: args.userId,
      title: args.title,
      content: args.content,
      category: args.category,
      source: args.source,
      isPublic: false,
      createdAt: Date.now(),
    });
  },
});

// Internal mutation per salvare un chunk
export const saveChunkInternal = internalMutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
    chunkId: v.string(),
    content: v.string(),
    embedding: v.array(v.number()),
    metadata: v.any(),
    model: v.string(),
    tokenCount: v.number(),
  },
  returns: v.id("document_chunks"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("document_chunks", {
      documentId: args.documentId,
      userId: args.userId,
      chunkId: args.chunkId,
      content: args.content,
      embedding: args.embedding,
      metadata: args.metadata,
      model: args.model,
      tokenCount: args.tokenCount,
      createdAt: Date.now(),
    });
  },
});


export const setupOKRKnowledge = action({
  args: { userId: v.string() },
  returns: v.object({
    processed: v.number(),
    total: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const documents = [
      {
        title: "Cosa sono gli OKRs",
        content: `# Obiettivi e Risultati Chiave (OKRs)

Gli OKRs sono un framework di gestione degli obiettivi che aiuta le organizzazioni a definire e tracciare obiettivi misurabili e ambiziosi.

## Definizione
- **Objectives (Obiettivi)**: Cosa vogliamo raggiungere
- **Key Results (Risultati Chiave)**: Come misureremo il progresso

## Principi Fondamentali
1. **Misurabilità**: Ogni KR deve essere quantificabile
2. **Ambizione**: Gli obiettivi dovrebbero essere sfidanti ma realistici
3. **Trasparenza**: Tutti dovrebbero conoscere gli OKRs dell'organizzazione
4. **Allineamento**: Gli OKRs individuali supportano quelli aziendali

## Ciclo OKRs
1. **Definizione** (1-2 mesi prima)
2. **Allineamento** (condivisioni e feedback)
3. **Esecuzione** (tracking settimanale)
4. **Revisione** (valutazione e apprendimento)`,
        category: "okr_basics",
      },
      {
        title: "Come Scrivere OKRs Efficaci",
        content: `# Come Scrivere OKRs Efficaci

La scrittura di OKRs di qualità è fondamentale per il successo del framework.

## Struttura di un Buon Objective

### Characteristics
- **Ispirazionale**: Motiva e guida il team
- **Facilmente comprensibile**: Chiaro per tutti
- **Allineato**: Supporta la strategia aziendale
- **Temporale**: Limitato nel tempo (di solito trimestrale)

### Esempi di Objectives
✅ "Diventare il leader nel mercato SaaS italiano"
❌ "Aumentare le vendite" (troppo vago)

## Struttura di Key Results Efficaci

### Characteristics
- **Misurabili**: Devono avere numeri concreti
- **Risultato-oriented**: Focati sull'impatto, non sulle attività
- **Controllabili**: Il team deve poter influenzare il risultato
- **Ambiziosi ma realistici**: Sfida senza essere impossibili

### Esempi di Key Results
✅ "Raggiungere 500 clienti paganti entro fine trimestre"
❌ "Implementare una nuova feature" (è un'attività, non un risultato)

## Template per OKRs

### Objective Template
"Come [target customer] possiamo [benefit] attraverso [solution]"

### KR Template
- Metric: [Current Value] → [Target Value] [Unit]
- Binary: [Action] [Success Criteria]
- Milestone: [Achievement] entro [Date]`,
        category: "okr_writing",
      },
      {
        title: "Esempi OKRs per Team Tecnici",
        content: `# Esempi OKRs per Team Tecnici

## OKR Sviluppatore Individuale

**Objective**: Migliorare la qualità del codice e l'efficienza dello sviluppo

**Key Results**:
- Ridurre i bug in produzione del 50%
- Aumentare la velocità di sviluppo del 30%
- Raggiungere il 90% di copertura dei test
- Implementare 3 nuove feature entro il trimestre

## OKR Team Backend

**Objective**: Migliorare la scalabilità e affidabilità del sistema

**Key Results**:
- Ridurre il tempo di risposta API sotto i 200ms (p95)
- Implementare rate limiting per tutte le API
- Aumentare l'uptime al 99.9%
- Ridurre gli incidenti di sicurezza del 80%

## OKR Team Frontend

**Objective**: Migliorare l'esperienza utente e le performance

**Key Results**:
- Aumentare il Core Web Vitals score del 40%
- Ridurre il tempo di caricamento delle pagine del 50%
- Implementare design system completo
- Raggiungere il 95% di soddisfazione utente

## OKR DevOps/SRE

**Objective**: Automatizzare e ottimizzare l'infrastruttura

**Key Results**:
- Implementare CI/CD per tutti i servizi
- Ridurre il tempo di deploy del 70%
- Aumentare l'efficienza energetica del 30%
- Implementare monitoring completo per tutti i sistemi`,
        category: "okr_examples",
      },
      {
        title: "OKRs vs KPI: Differenze e Quando Usarli",
        content: `# OKRs vs KPI: Capire le Differenze

## Cosa Sono i KPI

**Key Performance Indicators (KPI)** sono metriche che misurano la performance rispetto a standard prestabiliti.

### Characteristics dei KPI
- **Misurano lo stato corrente**: Descrivono "dove siamo ora"
- **Stabili nel tempo**: Non cambiano frequentemente
- **Focalizzati sull'efficienza**: Mantenere gli standard
- **Operazionali**: Guidano le operazioni quotidiane

### Esempi di KPI
- Tempo medio di risoluzione ticket di supporto
- Costo per acquisizione cliente
- Tasso di abbandono utenti
- Margine di profitto operativo

## Differenze Principali

| Aspetto | OKRs | KPI |
|---------|------|-----|
| **Scopo** | Definire obiettivi ambiziosi | Misurare performance corrente |
| **Frequenza** | Trimestrale/Annuale | Continua |
| **Tipo** | Aspirazionale | Misurabile |
| **Approccio** | "Cosa possiamo raggiungere?" | "Come stiamo performando?" |

## Quando Usare OKRs vs KPI

### Usa OKRs per:
- Definire direzioni strategiche
- Allineare il team verso obiettivi comuni
- Promuovere innovazione e crescita
- Guidare cambiamenti significativi

### Usa KPI per:
- Monitorare performance operative
- Identificare problemi immediati
- Misurare efficienza dei processi
- Valutare performance rispetto a standard

## Approccio Ibrido: OKRs + KPI

La combinazione più efficace è usare entrambi:

1. **OKRs** per definire la direzione strategica
2. **KPI** per monitorare l'esecuzione e identificare problemi

### Esempio Ibrido
**OKR**: Lanciare nuovo prodotto rivoluzionario
**KPI**: Tempo di sviluppo, qualità del codice, soddisfazione cliente`,
        category: "okr_vs_kpi",
      },
      {
        title: "Come Tracciare e Misurare gli OKRs",
        content: `# Tracciamento e Misurazione degli OKRs

## Metodi di Tracciamento

### 1. Dashboard Visuali
- **Grafici di progresso** per ogni KR
- **Indicatori di stato** (rosso/giallo/verde)
- **Trend nel tempo** per identificare problemi precocemente

### 2. Check-in Regolari
- **Settimanali**: Per identificare problemi emergenti
- **Mensili**: Per aggiustamenti significativi
- **Trimestrali**: Per valutazione finale

### 3. Metriche di Qualità
- **Completezza**: Tutti i KR sono stati misurati?
- **Accuratezza**: I dati sono corretti?
- **Tempestività**: Le metriche sono aggiornate regolarmente?

## Framework di Misurazione

### Rosso/Giallo/Verde (RYG)
- **🟢 Verde**: KR completato o on-track (>80%)
- **🟡 Giallo**: Progresso significativo ma necessita attenzione (40-80%)
- **🔴 Rosso**: Bloccato o progresso insufficiente (<40%)

### Percentuale di Completamento
- **0-25%**: Progetto avviato
- **26-50%**: Buon progresso iniziale
- **51-75%**: Buon progresso, focus sui dettagli
- **76-99%**: Quasi completato
- **100%**: Obiettivo raggiunto

## Strumenti di Tracciamento

### Strumenti Gratuiti
- **Google Sheets**: Semplice e accessibile
- **Trello/Miro**: Per visualizzazioni collaborative
- **Notion**: Per documentazione integrata

### Strumenti Specializzati
- **Lattice**: OKRs + performance management
- **BetterWorks**: Enterprise OKR platform
- **Weekdone**: Semplice e focalizzato
- **Koan**: OKRs + KPIs integrati

## Best Practices per il Tracciamento

### 1. Automatizza Quando Possibile
- Integra con strumenti esistenti (Jira, GitHub, analytics)
- Usa API per sincronizzare dati automaticamente
- Riduci il carico amministrativo

### 2. Focus sulla Qualità dei Dati
- Verifica l'accuratezza delle metriche
- Documenta le fonti dei dati
- Aggiorna regolarmente le definizioni

### 3. Trasparenza e Collaborazione
- Condividi progressi regolarmente
- Incoraggia discussioni sui blocchi
- Celebra i successi intermedi

### 4. Apprendimento Continuo
- Documenta lezioni apprese
- Aggiorna processi basati sui feedback
- Adatta approccio per il prossimo ciclo

## Segni di Allarme

### OKRs Non Efficaci
- KR non misurati per settimane
- Mancanza di check-in regolari
- Team che non conosce i propri OKRs
- KR che non influenzano le decisioni quotidiane

### Risposte ai Segni di Allarme
- Revisione immediata degli OKRs
- Training aggiuntivo sul framework
- Semplificazione del processo di tracking
- Focus su obiettivi più raggiungibili`,
        category: "okr_tracking",
      },
    ];

    let processed = 0;

    for (const doc of documents) {
      try {
        await ctx.runAction(api.knowledgeActions.processDocumentWithEmbedding, {
          userId: args.userId,
          title: doc.title,
          content: doc.content,
          category: doc.category,
          source: "setup_script",
        });
        processed++;
        console.log(`Processato: ${doc.title}`);
      } catch (error) {
        console.error(`Errore nel processamento di ${doc.title}:`, error);
      }
    }

    return {
      processed,
      total: documents.length,
      message: `Knowledge base popolata con ${processed}/${documents.length} documenti`
    };
  },
});