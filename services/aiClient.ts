import { supabase } from './supabaseClient';
import type { FinancialMonth, FinancialInsight } from '../types';
import type { ForecastSummary } from '../utils/localInsights';

/**
 * Cliente de IA do frontend. Invoca a Edge Function 'ai' do Supabase, que usa um
 * LLM brasileiro (Maritaca/Sabiá), guarda a chave de API no servidor, exige
 * usuário autenticado e aplica rate limiting. O token de acesso do usuário é
 * anexado automaticamente por supabase.functions.invoke.
 */
async function invokeAI<T>(action: string, payload: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke('ai', {
    body: { action, payload },
  });

  if (error) {
    throw new Error(error.message || 'Falha ao contatar o serviço de IA.');
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data.result as T;
}

export const aiClient = {
  parseFinancial: (csvContent: string) =>
    invokeAI<FinancialMonth[]>('parseFinancial', { csvContent }),

  insights: (data: FinancialMonth[]) =>
    invokeAI<FinancialInsight[]>('insights', { data }),

  expandDescription: (text: string) =>
    invokeAI<string>('expandDescription', { text }),

  /**
   * Refina categorias de linhas de extrato já parseadas localmente.
   * Recebe as categorias disponíveis para restringir a resposta.
   */
  categorize: (lines: Array<{ description: string; type: 'inflow' | 'outflow' }>, categories: string[]) =>
    invokeAI<Array<{ description: string; category: string }>>('categorize', { lines, categories }),

  /** Conselho estratégico curto sobre a projeção de caixa (runway). */
  forecastAdvice: (summary: ForecastSummary) =>
    invokeAI<string>('forecastAdvice', { summary }),

  /** Retorna uma data URL (data:image/png;base64,...) pronta para <img src>. */
  generateLogo: (prompt: string) =>
    invokeAI<string>('generateLogo', { prompt }),
};
