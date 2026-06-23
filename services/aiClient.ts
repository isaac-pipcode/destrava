import { supabase } from './supabaseClient';
import type { FinancialMonth, FinancialInsight } from '../types';

/**
 * Cliente de IA do frontend. NÃO fala com o Google diretamente: invoca a Edge
 * Function 'gemini' do Supabase, que guarda a chave de API no servidor, exige
 * usuário autenticado e aplica rate limiting. O token de acesso do usuário é
 * anexado automaticamente por supabase.functions.invoke.
 */
async function invokeGemini<T>(action: string, payload: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke('gemini', {
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
    invokeGemini<FinancialMonth[]>('parseFinancial', { csvContent }),

  insights: (data: FinancialMonth[]) =>
    invokeGemini<FinancialInsight[]>('insights', { data }),

  expandDescription: (text: string) =>
    invokeGemini<string>('expandDescription', { text }),

  /** Retorna uma data URL (data:image/png;base64,...) pronta para <img src>. */
  generateLogo: (prompt: string) =>
    invokeGemini<string>('generateLogo', { prompt }),
};
