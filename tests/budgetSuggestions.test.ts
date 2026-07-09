import { describe, it, expect } from 'vitest';
import { suggestBudgets } from '../utils/budgetSuggestions';
import { tx } from './helpers';

describe('suggestBudgets', () => {
  it('média mensal por categoria nos meses anteriores ao alvo', () => {
    const transactions = [
      tx({ date: '2026-04-10T12:00:00.000Z', amount: 900, category: 'Aluguel de Espaço/Sede' }),
      tx({ date: '2026-05-10T12:00:00.000Z', amount: 1200, category: 'Aluguel de Espaço/Sede' }),
      tx({ date: '2026-06-10T12:00:00.000Z', amount: 900, category: 'Aluguel de Espaço/Sede' }),
      tx({ date: '2026-06-12T12:00:00.000Z', amount: 300, category: 'Transporte/Logística' }),
    ];
    const s = suggestBudgets(transactions, { entity: 'PJ', uptoMonth: '2026-07' });
    expect(s['Aluguel de Espaço/Sede']).toBe(1000); // (900+1200+900)/3
    expect(s['Transporte/Logística']).toBe(100);    // 300/3
  });

  it('ignora o próprio mês-alvo, entradas, PLANNED e outra entidade', () => {
    const transactions = [
      tx({ date: '2026-07-01T12:00:00.000Z', amount: 500, category: 'A' }),                       // mês-alvo
      tx({ date: '2026-06-01T12:00:00.000Z', amount: 500, category: 'B', type: 'inflow' }),       // entrada
      tx({ date: '2026-06-01T12:00:00.000Z', amount: 500, category: 'C', status: 'PLANNED' }),    // previsto
      tx({ date: '2026-06-01T12:00:00.000Z', amount: 500, category: 'D', entity: 'PF' }),         // PF
    ];
    const s = suggestBudgets(transactions, { entity: 'PJ', uptoMonth: '2026-07' });
    expect(s).toEqual({});
  });

  it('lookback configurável', () => {
    const transactions = [
      tx({ date: '2026-06-10T12:00:00.000Z', amount: 600, category: 'A' }),
      tx({ date: '2026-01-10T12:00:00.000Z', amount: 6000, category: 'A' }), // fora do lookback 1
    ];
    const s = suggestBudgets(transactions, { entity: 'PJ', uptoMonth: '2026-07', lookbackMonths: 1 });
    expect(s['A']).toBe(600);
  });
});
