import { FinancialMonth, FinancialInsight } from '../types';
import { aiClient } from './aiClient';
import { buildLocalInsights, buildLocalForecastNote, ForecastSummary } from '../utils/localInsights';
import { guessCategory } from '../utils/categories';

/**
 * Camada fina de compatibilidade. As chamadas reais de IA acontecem na Edge
 * Function 'ai' do Supabase (ver services/aiClient.ts) — a chave nunca vive no
 * app. Padrão "IA opcional, nunca bloqueante": toda função aqui tem um
 * fallback local determinístico, então limite diário, rede fora ou provedor
 * indisponível nunca deixam a tela sem análise.
 */

export const parseFinancialData = async (csvContent: string): Promise<FinancialMonth[]> => {
  return aiClient.parseFinancial(csvContent);
};

export const generateFinancialInsights = async (
  data: FinancialMonth[]
): Promise<FinancialInsight[]> => {
  try {
    const insights = await aiClient.insights(data);
    return insights && insights.length > 0 ? insights : buildLocalInsights(data);
  } catch (error) {
    console.warn('IA indisponível para insights; usando leitura local determinística.');
    return buildLocalInsights(data);
  }
};

/**
 * Conselho estratégico sobre a projeção de caixa. Tenta enriquecer com IA;
 * se indisponível, devolve a nota local determinística.
 */
export const getForecastAdvice = async (summary: ForecastSummary): Promise<string> => {
  const local = buildLocalForecastNote(summary);
  try {
    const text = await aiClient.forecastAdvice(summary);
    return (text || '').trim() || local;
  } catch {
    return local;
  }
};

/**
 * Refina as categorias de linhas de extrato com IA; em falha, mantém a
 * categorização local por palavras-chave já aplicada.
 */
export const refineCategories = async (
  lines: Array<{ description: string; type: 'inflow' | 'outflow'; category: string }>,
  entity: 'PF' | 'PJ',
  availableCategories: string[]
): Promise<Array<{ description: string; type: 'inflow' | 'outflow'; category: string }>> => {
  try {
    const refined = await aiClient.categorize(
      lines.map(l => ({ description: l.description, type: l.type })),
      availableCategories
    );
    const byDesc = new Map(refined.map(r => [r.description, r.category]));
    return lines.map(l => {
      const cat = byDesc.get(l.description);
      return cat && availableCategories.includes(cat) ? { ...l, category: cat } : l;
    });
  } catch {
    // Fallback: garante ao menos a heurística local por palavras-chave.
    return lines.map(l => ({
      ...l,
      category: l.category || guessCategory(l.description, l.type, entity),
    }));
  }
};
