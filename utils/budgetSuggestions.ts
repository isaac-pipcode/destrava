import { Transaction } from '../types';
import { addMonths } from './projection';

/**
 * Sugestão de metas de orçamento.
 *
 * Calcula, por categoria, a média mensal do que foi realizado nos últimos
 * N meses completos anteriores ao mês-alvo. Serve de ponto de partida para o
 * usuário definir metas realistas sem começar do zero. Função pura.
 */

export interface SuggestOptions {
  entity: 'PF' | 'PJ';
  uptoMonth: string;              // "YYYY-MM" — usa os meses ANTERIORES a este
  lookbackMonths?: number;        // quantos meses olhar para trás (padrão 3)
  type?: 'inflow' | 'outflow';    // padrão: despesas (outflow)
}

export function suggestBudgets(
  transactions: Transaction[],
  opts: SuggestOptions
): Record<string, number> {
  const lookback = opts.lookbackMonths ?? 3;
  const type = opts.type ?? 'outflow';

  const months = new Set<string>();
  for (let i = 1; i <= lookback; i++) months.add(addMonths(opts.uptoMonth, -i));

  const totals = new Map<string, number>();
  for (const t of transactions) {
    if ((t.status ?? 'REALIZED') === 'PLANNED') continue;
    if (t.entity !== opts.entity) continue;
    if (t.type !== type) continue;
    if (!months.has(t.date.slice(0, 7))) continue;
    totals.set(t.category, (totals.get(t.category) || 0) + t.amount);
  }

  const result: Record<string, number> = {};
  totals.forEach((sum, cat) => {
    const avg = Math.round(sum / lookback);
    if (avg > 0) result[cat] = avg;
  });
  return result;
}
