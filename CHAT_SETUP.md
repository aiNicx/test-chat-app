# Setup Chat AI con Convex Agents e OpenRouter

Questo documento descrive come configurare e utilizzare il sistema di chat AI implementato.

## 🚀 Configurazione

### 1. Variabili d'ambiente

Aggiungi le seguenti variabili al tuo file `.env.local`:

```env
# OpenRouter AI
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 2. Configurazione OpenRouter

1. Registrati su [OpenRouter](https://openrouter.ai/)
2. Ottieni la tua API key dal dashboard
3. Aggiungi crediti al tuo account per utilizzare i modelli

### 3. Configurazione Convex

Dopo aver configurato le variabili d'ambiente localmente, devi anche configurarle nel deployment Convex:

```bash
npx convex env set OPENROUTER_API_KEY your_openrouter_api_key_here
```

### 4. Deploy

```bash
# Installa le dipendenze (già fatto)
npm install

# Avvia il server di sviluppo
npm run dev
```

## 🤖 Configurazione dell'Agente

### Modello LLM

Il sistema è configurato per utilizzare **gpt-4o-mini** tramite OpenRouter. Puoi cambiare il modello modificando il file `convex/agent.ts`:

```typescript
const openRouterModel = openai.chat("gpt-4o-mini", {
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});
```

### Modelli disponibili su OpenRouter

- `gpt-4o-mini` (economico, veloce)
- `gpt-4o` (più potente, più costoso)
- `claude-3-haiku` (Anthropic)
- `claude-3-sonnet` (Anthropic)
- `llama-3.1-8b-instruct` (Meta, open source)

### System Prompt

Il system prompt è configurabile nel file `convex/agent.ts`:

```typescript
const SYSTEM_PROMPT = `Sei un assistente AI intelligente e utile. 

Le tue caratteristiche principali:
- Fornisci risposte accurate e dettagliate
- Mantieni un tono professionale ma amichevole
- Se non conosci una risposta, ammettilo onestamente
- Cerca di essere conciso ma completo nelle tue spiegazioni
- Puoi aiutare con domande su programmazione, tecnologia, cultura generale e molto altro

Ricorda sempre di essere rispettoso e di fornire informazioni verificate quando possibile.`;
```

## 🎛️ Configurazioni Avanzate

### Temperature e Parametri

Nel file `convex/agent.ts`, puoi modificare i parametri del modello:

```typescript
export const chatAgent = new Agent(components.agent, {
  name: "ChatAssistant",
  instructions: SYSTEM_PROMPT,
  languageModel: openRouterModel,
  callSettings: { 
    maxRetries: 3,        // Numero di tentativi in caso di errore
    temperature: 0.7,     // Creatività del modello (0-2)
  },
});
```

### Gestione degli Errori

Il sistema include gestione automatica degli errori:
- Retry automatico per chiamate fallite
- Messaggi di errore user-friendly
- Logging degli errori per debug

## 🔧 Personalizzazioni

### Cambiare Provider LLM

Per utilizzare un provider diverso (es. OpenAI diretto), modifica `convex/agent.ts`:

```typescript
// Per OpenAI diretto
const model = openai.chat("gpt-4o-mini", {
  apiKey: process.env.OPENAI_API_KEY!,
});

// Per Anthropic Claude
import { anthropic } from "@ai-sdk/anthropic";
const model = anthropic.chat("claude-3-sonnet-20240229", {
  apiKey: process.env.ANTHROPIC_API_KEY!,
});
```

### Aggiungere Tool/Funzioni

Per aggiungere capacità al tuo agente, puoi definire tools:

```typescript
import { createTool } from "@convex-dev/agent";
import { z } from "zod";

const searchTool = createTool({
  description: "Cerca informazioni nel database",
  args: z.object({
    query: z.string().describe("La query di ricerca")
  }),
  handler: async (ctx, args) => {
    // Implementa la logica di ricerca
    return "Risultati della ricerca...";
  },
});

export const chatAgent = new Agent(components.agent, {
  // ... altre configurazioni
  tools: { searchTool },
});
```

## 📊 Monitoraggio e Debug

### Logs

I logs dell'agente sono visibili nella console di Convex:

```bash
npx convex logs
```

### Dashboard Convex

Visualizza i dati dell'agente nel dashboard Convex:
- Thread di conversazione
- Messaggi
- Statistiche di utilizzo

## 🔐 Sicurezza

- Le API key sono gestite come variabili d'ambiente
- L'autenticazione utente è gestita tramite Clerk
- Ogni thread è associato a un utente specifico

## 💡 Tips

1. **Costi**: Monitora l'utilizzo su OpenRouter per controllare i costi
2. **Performance**: gpt-4o-mini è più veloce ed economico per la maggior parte dei casi d'uso
3. **Debugging**: Usa la console del browser e i logs di Convex per debug
4. **Customizzazione**: Il system prompt può essere dinamico basato sull'utente o contesto

## 🆘 Troubleshooting

### Errori comuni

1. **API Key non configurata**: Assicurati che `OPENROUTER_API_KEY` sia configurata sia localmente che su Convex
2. **Modello non disponibile**: Verifica che il modello sia disponibile su OpenRouter
3. **Crediti insufficienti**: Controlla il saldo del tuo account OpenRouter
4. **Errori di rete**: Gli errori di rete sono gestiti automaticamente con retry