import { RecurringRule, Transaction } from '../types';
import { plannedId } from './ids';

/**
 * Motor de projeção de recorrências (fluxo de caixa preditivo).
 *
 * Dado o conjunto de regras recorrentes e as transações já realizadas, gera
 * lançamentos PLANNED (previstos) para os meses seguintes. Os previstos são
 * virtuais/efêmeros — não são persistidos: existem só para visualização e para
 * o cálculo do saldo projetado. Ao confirmar um previsto, cria-se uma transação
 * REALIZED de verdade (com recurringId), e a projeção passa a ignorá-lo.
 *
 * Funções puras: recebem o mês-base explicitamente para serem determinísticas
 * e testáveis. Portado do núcleo financeiro do Ouver Manager Pro, adaptado ao
 * modelo do Destrava (inflow/outflow, entidades PF/PJ, mês por nome).
 */

const pad = (n: number) => String(n).padStart(2, '0');

export const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** Nome do mês (pt-BR) de um "YYYY-MM" — usado no campo legado `month`. */
export const monthNameOf = (ym: string): string =>
  MONTH_NAMES_PT[Number(ym.slice(5, 7)) - 1] ?? '';

/** Quantidade de dias no mês "YYYY-MM". */
export const daysInMonth = (ym: string): number => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

/** Soma n meses a "YYYY-MM" e devolve "YYYY-MM". */
export const addMonths = (ym: string, n: number): string => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

/** Diferença em meses entre dois "YYYY-MM" (b - a). */
export const monthDiff = (a: string, b: string): number => {
  const [ay, am] = a.split('-').map(Number);
  const [by, bm] = b.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
};

export interface ProjectionOptions {
  entity: 'PF' | 'PJ';
  fromMonth: string;      // "YYYY-MM" — primeiro mês projetado (inclusive)
  horizonMonths?: number; // quantos meses à frente considerar (padrão 12)
}

const norm = (s: string) => (s || '').trim().toLowerCase();

/**
 * Gera as transações PLANNED a partir das regras recorrentes, deduzindo os
 * meses em que já existe um lançamento realizado da mesma regra (por
 * recurringId ou por descrição+valor equivalentes).
 */
export function projectRecurring(
  rules: RecurringRule[],
  realized: Transaction[],
  opts: ProjectionOptions
): Transaction[] {
  const horizon = opts.horizonMonths ?? 12;
  const out: Transaction[] = [];

  for (const rule of rules.filter(r => r.entity === opts.entity)) {
    const ruleStart = rule.startMonth || opts.fromMonth;
    const ruleHorizon = rule.monthsAhead ?? 12;

    for (let i = 0; i < horizon; i++) {
      const m = addMonths(opts.fromMonth, i);
      const since = monthDiff(ruleStart, m);

      if (since < 0) continue;            // antes do início da regra
      if (since >= ruleHorizon) continue; // além do horizonte da regra

      const already = realized.some(t =>
        (t.status ?? 'REALIZED') !== 'PLANNED' &&
        t.entity === rule.entity &&
        t.date.startsWith(m) &&
        (t.recurringId === rule.id ||
          (norm(t.description) === norm(rule.description) && t.amount === rule.amount))
      );
      if (already) continue;

      const day = Math.min(Math.max(rule.dayOfMonth || 1, 1), daysInMonth(m));
      out.push({
        id: plannedId(rule.id, m),
        date: `${m}-${pad(day)}T12:00:00.000Z`,
        description: rule.description,
        amount: rule.amount,
        type: rule.type,
        category: rule.category,
        entity: rule.entity,
        month: monthNameOf(m),
        accountId: rule.accountId,
        status: 'PLANNED',
        recurringId: rule.id,
      });
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Impacto líquido (entradas − saídas) de um conjunto de previstos até uma data
 * final inclusive (comparação lexicográfica de ISO). Compõe o saldo projetado.
 */
export function projectedNetUntil(planned: Transaction[], endDateISO: string): number {
  return planned
    .filter(p => p.date.slice(0, 10) <= endDateISO.slice(0, 10))
    .reduce((acc, t) => (t.type === 'inflow' ? acc + t.amount : acc - t.amount), 0);
}

/** Saldo realizado acumulado até uma data (inclusive). */
export function realizedBalanceUntil(realized: Transaction[], endDateISO: string): number {
  return realized
    .filter(t => (t.status ?? 'REALIZED') !== 'PLANNED' && t.date.slice(0, 10) <= endDateISO.slice(0, 10))
    .reduce((acc, t) => (t.type === 'inflow' ? acc + t.amount : acc - t.amount), 0);
}

export interface ForecastPoint {
  month: string;            // 'YYYY-MM'
  balance: number;          // saldo (realizado + previstos) no fim do mês
  isFuture: boolean;
}

export interface ForecastResult {
  points: ForecastPoint[];
  runwayMonths: number | null; // null = positivo em todo o horizonte
  firstNegMonth: string | null;
  lowest: { value: number; month: string };
  endBalance: number;
  currentBalance: number;
  hasRecurring: boolean;
}

const lastDayISO = (ym: string) => `${ym}-${pad(daysInMonth(ym))}`;

/**
 * Série de saldo mês a mês (passado realizado → futuro projetado) com as
 * métricas de runway: primeiro mês negativo, menor saldo e saldo final.
 */
export function buildForecast(
  realized: Transaction[],
  planned: Transaction[],
  currentMonth: string,
  horizonMonths: number,
  pastMonths = 3
): ForecastResult {
  const start = addMonths(currentMonth, -pastMonths);
  const total = pastMonths + horizonMonths;
  const points: ForecastPoint[] = [];

  let firstNeg: string | null = null;
  let lowest = { value: Infinity, month: currentMonth };

  for (let i = 0; i <= total; i++) {
    const m = addMonths(start, i);
    const endISO = lastDayISO(m);
    const balance = realizedBalanceUntil(realized, endISO) + projectedNetUntil(planned, endISO);

    if (m >= currentMonth) {
      if (balance < lowest.value) lowest = { value: balance, month: m };
      if (balance < 0 && !firstNeg) firstNeg = m;
    }

    points.push({ month: m, balance, isFuture: m > currentMonth });
  }

  const currentBalance = realizedBalanceUntil(realized, lastDayISO(currentMonth));

  return {
    points,
    runwayMonths: firstNeg ? monthDiff(currentMonth, firstNeg) : null,
    firstNegMonth: firstNeg,
    lowest: lowest.value === Infinity ? { value: currentBalance, month: currentMonth } : lowest,
    endBalance: points[points.length - 1]?.balance ?? 0,
    currentBalance,
    hasRecurring: planned.length > 0,
  };
}
