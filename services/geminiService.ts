import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FinancialMonth, FinancialInsight, Transaction } from "../types";

// Lazy Initialization Variable
let aiInstance: GoogleGenAI | null = null;

const DATA_PARSING_MODEL = "gemini-2.5-flash";
const INSIGHT_MODEL = "gemini-2.5-flash";

/**
 * Safely retrieves the AI instance or throws a user-friendly error.
 */
const getAI = (): GoogleGenAI => {
    if (aiInstance) return aiInstance;

    // Access the env var injected by Vite
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('undefined')) {
        console.error("[Gemini] API Key is missing or invalid. Value:", apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined');
        throw new Error("A Chave de API (GEMINI_API_KEY) não está configurada neste ambiente. Configure-a no arquivo .env.local ou variáveis de ambiente do Vercel.");
    }

    try {
        console.log("[Gemini] Initializing GoogleGenAI with API key:", apiKey.substring(0, 10) + "...");
        aiInstance = new GoogleGenAI({ apiKey: apiKey });
        console.log("[Gemini] GoogleGenAI initialized successfully");
        return aiInstance;
    } catch (e) {
        console.error("[Gemini] Failed to initialize GoogleGenAI:", e);
        throw new Error("Falha ao inicializar o serviço de IA. Verifique sua chave.");
    }
};

/**
 * Parses raw CSV/text financial data into a structured JSON format.
 */
export const parseFinancialData = async (csvContent: string): Promise<FinancialMonth[]> => {
  try {
    const ai = getAI(); // Lazy load here
    
    const prompt = `
      Analyze the following CSV/Text data representing a Cultural/Creative Business Cash Flow.
      For each month, extract Forecast vs Realized.
      
      Clean the number formats. Return ONLY the JSON array.
    `;

    const schema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                month: { type: Type.STRING },
                forecast: {
                    type: Type.OBJECT,
                    properties: {
                        inflow: { type: Type.NUMBER },
                        outflow: { type: Type.NUMBER },
                        balance: { type: Type.NUMBER }
                    },
                    required: ["inflow", "outflow", "balance"]
                },
                realized: {
                    type: Type.OBJECT,
                    properties: {
                        inflow: { type: Type.NUMBER },
                        outflow: { type: Type.NUMBER },
                        balance: { type: Type.NUMBER }
                    },
                    required: ["inflow", "outflow", "balance"]
                },
                details: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING },
                            amount: { type: Type.NUMBER },
                            type: { type: Type.STRING, enum: ["inflow", "outflow"] }
                        }
                    }
                }
            },
            required: ["month", "forecast", "realized", "details"]
        }
    };

    const response = await ai.models.generateContent({
      model: DATA_PARSING_MODEL,
      contents: [
        { text: prompt },
        { text: `CSV DATA:\n${csvContent}` }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    if (!response.text) {
        throw new Error("No data returned from AI parsing.");
    }

    return JSON.parse(response.text) as FinancialMonth[];

  } catch (error: any) {
    console.error("Error parsing financial data:", error);
    // Propagate friendly error message
    throw new Error(error.message || "Failed to process the uploaded file.");
  }
};

/**
 * Parses raw text from a bank statement into structured Transactions.
 */
export const parseBankStatement = async (textContent: string): Promise<Omit<Transaction, 'id' | 'month'>[]> => {
  try {
    const ai = getAI(); // Lazy load here

    const prompt = `
      You are a specialized financial assistant for Artists and Cultural Producers in Brazil (MEI/ME).
      Analyze the text below (bank statement transactions).

      Context:
      - Negative numbers or words like "Pagamento", "Débito", "Pix enviado" are OUTFLOWS.
      - Positive numbers or words like "Recebimento", "Crédito", "Resgate" are INFLOWS.
      
      Task: Extract transactions.
      
      Categories to infer (use these specifically if applicable):
      - 'Cachê Artístico/Serviço' (Income from work/shows)
      - 'Edital/Lei de Incentivo' (Grant money - Paulo Gustavo, Aldir Blanc)
      - 'Produção/Material' (Costumes, sets, raw material)
      - 'Equipamentos/Software' (Camera, instruments, software)
      - 'Impostos (MEI/Simples)' (DAS, Tax fees - Important to identify)
      - 'Transporte/Viagem' (Uber, fuel, tickets)
      - 'Alimentação'
      - 'Outros'

      Return JSON array.
    `;

    const schema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          type: { type: Type.STRING, enum: ['inflow', 'outflow'] },
          date: { type: Type.STRING, description: "YYYY-MM-DD" },
          category: { type: Type.STRING }
        },
        required: ['description', 'amount', 'type', 'date', 'category']
      }
    };

    const response = await ai.models.generateContent({
      model: DATA_PARSING_MODEL,
      contents: [
        { text: prompt },
        { text: `BANK STATEMENT:\n${textContent}` }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    if (!response.text) return [];
    
    return JSON.parse(response.text) as Omit<Transaction, 'id' | 'month'>[];

  } catch (error: any) {
    console.error("Error parsing bank statement:", error);
    if (error.message && error.message.includes("API Key")) {
        throw error;
    }
    throw new Error("Não foi possível interpretar o formato do extrato. Verifique se o texto está legível.");
  }
};

/**
 * Generates strategic insights focused on Cultural Producers/Artists.
 */
export const generateFinancialInsights = async (data: FinancialMonth[]): Promise<FinancialInsight[]> => {
    try {
        console.log("[Gemini] Generating financial insights for", data.length, "months");
        const ai = getAI(); // Lazy load here

        const dataSummary = JSON.stringify(data.map(m => ({
            month: m.month,
            realizedNet: m.realized.balance,
            forecastVsRealizedDiff: m.realized.balance - m.forecast.balance,
            topExpense: m.details.find(d => d.type === 'outflow')?.category
        })));

        const prompt = `
            You are an experienced Executive Producer and Cultural Manager in Brazil (Mentoria para Artistas e MEI).
            You are mentoring a newly professionalized artist/producer.
            Analyze this monthly cash flow summary: ${dataSummary}

            Provide 3 insights/tips. Tone: Encouraging, professional but accessible, strictly focused on Brazilian cultural market reality.

            Mandatory Checks:
            1. 'MEI Trap': If revenue is high, warn about the MEI limit (R$ 81k/year).
            2. Taxes: Remind them to pay the DAS (approx R$ 70,00) every month to avoid debt.
            3. 'Intermittency' (Sazonalidade): If they had a good month, advise saving for the 'dry months' (entressafra) between grants.

            Language: Portuguese (Brazil).
        `;

        const schema: Schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ["success", "warning", "info"] },
                    actionItem: { type: Type.STRING }
                },
                required: ["title", "description", "type"]
            }
        };

        console.log("[Gemini] Calling generateContent with model:", INSIGHT_MODEL);
        const response = await ai.models.generateContent({
            model: INSIGHT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        console.log("[Gemini] Response received, parsing...");
        if (!response.text) {
            console.warn("[Gemini] Response has no text");
            return [];
        }

        const insights = JSON.parse(response.text) as FinancialInsight[];
        console.log("[Gemini] Successfully generated", insights.length, "insights");
        return insights;

    } catch (error: any) {
        console.error("[Gemini] Error generating insights:");
        console.error("[Gemini] Error name:", error?.name);
        console.error("[Gemini] Error message:", error?.message);
        console.error("[Gemini] Full error:", error);

        // Provide more specific error message
        let errorDetail = "Verifique a configuração da chave de API.";
        if (error?.message?.includes("API_KEY") || error?.message?.includes("GEMINI_API_KEY")) {
            errorDetail = "A chave de API não está configurada. Configure GEMINI_API_KEY no Vercel.";
        } else if (error?.message?.includes("quota") || error?.message?.includes("limit")) {
            errorDetail = "Limite de uso da API atingido. Verifique sua quota no Google AI Studio.";
        } else if (error?.message?.includes("network") || error?.message?.includes("fetch")) {
            errorDetail = "Erro de conexão com a API Gemini. Verifique sua conexão.";
        }

        // Do not throw here, just return descriptive error to not break the dashboard
        return [{
            title: "Análise Indisponível",
            description: `No momento não consigo gerar insights. ${errorDetail}`,
            type: "info"
        }];
    }
}