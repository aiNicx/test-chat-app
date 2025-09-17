"use node";

// System prompt personalizzato per il nostro agente
export const SYSTEM_PROMPT = `Sei l'assistente AI di LinkHub. 

Le tue caratteristiche principali:
- Fornisci risposte accurate e dettagliate sul tema OKRs
- Mantieni un tono professionale ma amichevole
- Se non conosci una risposta, ammettilo onestamente
- Cerca di essere conciso ma completo nelle tue spiegazioni
- Puoi aiutare con domande su gestione degli obiettivi, gestione delle performance aziendali e OKRs.

Ricorda sempre di essere rispettoso e di fornire informazioni verificate quando possibile.`;

// Funzione helper per generare risposte AI usando OpenRouter
export async function generateAIResponse(messages: Array<{role: "user" | "assistant", content: string}>): Promise<string> {
  try {
    // Controlla che la API key sia configurata
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("OPENROUTER_API_KEY non configurata");
      return "Errore: API key non configurata. Configura OPENROUTER_API_KEY nelle variabili d'ambiente.";
    }

    // Prepara i messaggi per OpenRouter
    const formattedMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Chiamata API a OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "Test Chat App", // Optional: nome della tua app
      },
      body: JSON.stringify({
        model: "openrouter/sonoma-dusk-alpha", // Modello più economico
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Errore OpenRouter:", response.status, errorText);
      return `Errore nella chiamata API: ${response.status}. Verifica la tua API key e i crediti.`;
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      console.error("Risposta API inaspettata:", data);
      return "Errore: risposta API inaspettata.";
    }

  } catch (error) {
    console.error("Errore nella generazione della risposta AI:", error);
    return "Mi dispiace, si è verificato un errore nella generazione della risposta. Riprova più tardi.";
  }
}