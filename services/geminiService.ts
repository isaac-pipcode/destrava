import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FinancialMonth, FinancialInsight, Transaction } from "../types";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DATA_PARSING_MODEL = "gemini-2.5-flash";
const INSIGHT_MODEL = "gemini-2.5-flash";

/**
 * Parses raw CSV/text financial data into a structured JSON format.
 */
export const parseFinancialData = async (csvContent: string): Promise<FinancialMonth[]> => {
  try {
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

  } catch (error) {
    console.error("Error parsing financial data:", error);
    throw new Error("Failed to process the uploaded file.");
  }
};

/**
 * Parses raw text from a bank statement into structured Transactions.
 */
export const parseBankStatement = async (textContent: string): Promise<Omit<Transaction, 'id' | 'month'>[]> => {
  try {
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

  } catch (error) {
    console.error("Error parsing bank statement:", error);
    throw new Error("Não foi possível interpretar o formato do extrato.");
  }
};

/**
 * Generates strategic insights focused on Cultural Producers/Artists.
 */
export const generateFinancialInsights = async (data: FinancialMonth[]): Promise<FinancialInsight[]> => {
    try {
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

        const response = await ai.models.generateContent({
            model: INSIGHT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        if (!response.text) return [];
        return JSON.parse(response.text) as FinancialInsight[];

    } catch (error) {
        console.error("Error generating insights:", error);
        return [{
            title: "Análise Indisponível",
            description: "No momento não consigo gerar insights sobre sua carreira.",
            type: "info"
        }];
    }
}