import { Transaction, RecurringRule } from '../types';
import { monthNameOf } from '../utils/projection';

let seq = 0;

export const tx = (partial: Partial<Transaction> & { date: string; amount: number }): Transaction => ({
  id: `tx_${++seq}`,
  description: partial.description ?? 'Lançamento de teste',
  type: partial.type ?? 'outflow',
  category: partial.category ?? 'Outros',
  month: monthNameOf(partial.date.slice(0, 7)),
  entity: partial.entity ?? 'PJ',
  ...partial,
});

export const rule = (partial: Partial<RecurringRule> & { amount: number }): RecurringRule => ({
  id: partial.id ?? `rec_${++seq}`,
  description: partial.description ?? 'Recorrência de teste',
  type: partial.type ?? 'outflow',
  category: partial.category ?? 'Outros',
  entity: partial.entity ?? 'PJ',
  dayOfMonth: partial.dayOfMonth ?? 5,
  ...partial,
});
