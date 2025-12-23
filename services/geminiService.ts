
import { GoogleGenAI, Type } from "@google/genai";
import { FinancialMonth, FinancialInsight, Transaction } from "../types";

// Lazy Initialization Variable
let aiInstance: GoogleGenAI | null = null;

// Using the recommended models for stability and speed
const DATA_PARSING_MODEL = "gemini-3-flash-preview";
const INSIGHT_MODEL = "gemini-3-flash-preview";

/**
 * Safely retrieves the AI instance or throws a user-friendly error.
 */
const getAI = (): GoogleGenAI => {
    if (aiInstance) return aiInstance;

    const apiKey = process.env.API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('undefined')) {
        throw new Error("Chave de API não configurada. Verifique as configurações do ambiente.");
    }

    try {
        aiInstance = new GoogleGenAI({ apiKey: apiKey });
        return aiInstance;
    } catch (e) {
        throw new Error("Erro ao inicializar o motor de inteligência artificial.");
    }
};

/**
 * Parses raw CSV/text financial data into a structured JSON format.
 */
export const parseFinancialData = async (csvContent: string): Promise<FinancialMonth[]> => {
  try {
    const ai = getAI();
    
    const prompt = `
      Analise os dados CSV/Texto de fluxo de caixa de uma empresa cultural.
      Para cada mês, extraia Previsão vs Realizado.
      Retorne APENAS o array JSON.
    `;

    const response = await ai.models.generateContent({
      model: DATA_PARSING_MODEL,
      contents: [
        { text: prompt },
        { text: `DADOS:\n${csvContent}` }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
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
                                type: { type: Type.STRING }
                            }
                        }
                    }
                },
                required: ["month", "forecast", "realized", "details"]
            }
        }
      }
    });

    if (!response.text) {
        throw new Error("A IA não retornou dados válidos.");
    }

    return JSON.parse(response.text.trim()) as FinancialMonth[];

  } catch (error: any) {
    console.error("AI Parsing Error:", error);
    throw new Error(error.message || "Falha ao processar arquivo. Tente um formato mais simples.");
  }
};

/**
 * Generates strategic insights focused on Cultural Producers/Artists.
 */
export const generateFinancialInsights = async (data: FinancialMonth[]): Promise<FinancialInsight[]> => {
    try {
        const ai = getAI();
        const dataSummary = JSON.stringify(data.map(m => ({
            month: m.month,
            realizedNet: m.realized.balance,
            topExpense: m.details.find(d => d.type === 'outflow')?.category
        })));

        const prompt = `
            Você é um mentor de gestão cultural no Brasil. Analise estes dados financeiros: ${dataSummary}
            Forneça 3 insights estratégicos curtos sobre sustentabilidade e impostos (MEI/Simples).
            Use tom profissional e encorajador.
        `;

        const response = await ai.models.generateContent({
            model: INSIGHT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            type: { type: Type.STRING },
                            actionItem: { type: Type.STRING }
                        },
                        required: ["title", "description", "type"]
                    }
                }
            }
        });

        if (!response.text) return [];
        return JSON.parse(response.text.trim()) as FinancialInsight[];

    } catch (error) {
        console.error("AI Insight Error:", error);
        return [{
            title: "Análise Indisponível",
            description: "Não foi possível gerar insights agora devido a uma falha na conexão com a IA.",
            type: "info"
        }];
    }
};
