import { FinancialMonth, FinancialInsight } from '../types';
import { aiClient } from './aiClient';

/**
 * Camada fina de compatibilidade. As chamadas reais ao Gemini agora acontecem
 * na Edge Function 'gemini' do Supabase (ver services/aiClient.ts). A chave de
 * API não vive mais no app.
 */

export const parseFinancialData = async (csvContent: string): Promise<FinancialMonth[]> => {
  return aiClient.parseFinancial(csvContent);
};

export const generateFinancialInsights = async (
  data: FinancialMonth[]
): Promise<FinancialInsight[]> => {
  try {
    return await aiClient.insights(data);
  } catch (error) {
    console.error('AI Insight Error:', error);
    return [
      {
        title: 'Análise Indisponível',
        description:
          'Não foi possível gerar insights agora devido a uma falha na conexão com a IA.',
        type: 'info',
      },
    ];
  }
};
