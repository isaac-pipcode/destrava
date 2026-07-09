import { Transaction } from '../types';
import { addMonths } from './projection';

/**
 * Lógica tributária pura (Simples Nacional / Fator R / MEI).
 *
 * Extraída do TaxManager para ser testável: erro aqui gera prejuízo direto ao
 * usuário. A receita anual considera os últimos 12 meses a partir do mês de
 * referência (RBT12), e não o total histórico de lançamentos — com dados de
 * vários anos o cálculo antigo inflava a receita e distorcia o Fator R.
 */

/** Receita bruta PJ dos últimos 12 meses (inclui o mês de referência). */
export function revenueLast12Months(
  transactions: Transaction[],
  referenceMonth: string // 'YYYY-MM'
): number {
  const firstMonth = addMonths(referenceMonth, -11);
  return transactions
    .filter(t =>
      (t.status ?? 'REALIZED') !== 'PLANNED' &&
      t.entity === 'PJ' &&
      t.type === 'inflow' &&
      t.date.slice(0, 7) >= firstMonth &&
      t.date.slice(0, 7) <= referenceMonth
    )
    .reduce((acc, t) => acc + t.amount, 0);
}

/**
 * Fator R (%): folha de pagamento anualizada ÷ receita bruta dos últimos 12
 * meses. Fator R ≥ 28% enquadra serviços no Anexo III (alíquota menor).
 */
export function calculateFactorR(monthlyPayroll: number, revenue12m: number): number {
  if (!monthlyPayroll || monthlyPayroll <= 0) return 0;
  const revenue = revenue12m > 0 ? revenue12m : 1;
  return ((monthlyPayroll * 12) / revenue) * 100;
}

export interface TaxBreakdown {
  rate: number;    // alíquota federal aplicada (%)
  federal: number; // tributos federais (Simples) em R$
  iss: number;     // ISS retido em R$
  total: number;   // total de tributos em R$
}

/** Alíquotas iniciais do Simples para serviços: Anexo III × Anexo V. */
export const SIMPLES_RATE_ANEXO_III = 0.06;
export const SIMPLES_RATE_ANEXO_V = 0.155;
export const FACTOR_R_THRESHOLD = 28;

/**
 * Estimativa de tributos sobre uma nota de serviço.
 * MEI: tributos fixos mensais (DAS), não incidentes por nota → retorno zerado.
 */
export function calculateServiceTaxes(
  serviceValue: number,
  regime: 'MEI' | 'ME',
  factorR: number,
  withholdIss = false,
  issRatePercent = 2
): TaxBreakdown {
  if (regime === 'MEI' || serviceValue <= 0) {
    return { rate: 0, federal: 0, iss: 0, total: 0 };
  }
  const baseRate = factorR >= FACTOR_R_THRESHOLD ? SIMPLES_RATE_ANEXO_III : SIMPLES_RATE_ANEXO_V;
  const federal = serviceValue * baseRate;
  const iss = withholdIss ? serviceValue * (issRatePercent / 100) : 0;
  return { rate: baseRate * 100, federal, iss, total: federal + iss };
}
