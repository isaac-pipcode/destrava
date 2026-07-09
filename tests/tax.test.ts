import { describe, it, expect } from 'vitest';
import {
  revenueLast12Months, calculateFactorR, calculateServiceTaxes,
  SIMPLES_RATE_ANEXO_III, SIMPLES_RATE_ANEXO_V,
} from '../utils/tax';
import { tx } from './helpers';

describe('revenueLast12Months', () => {
  it('soma só entradas PJ dentro da janela de 12 meses', () => {
    const transactions = [
      tx({ date: '2026-07-01T12:00:00.000Z', amount: 5000, type: 'inflow', entity: 'PJ' }),
      tx({ date: '2025-08-15T12:00:00.000Z', amount: 3000, type: 'inflow', entity: 'PJ' }), // dentro (11 meses atrás)
      tx({ date: '2025-07-15T12:00:00.000Z', amount: 9000, type: 'inflow', entity: 'PJ' }), // fora da janela
      tx({ date: '2026-06-01T12:00:00.000Z', amount: 2000, type: 'outflow', entity: 'PJ' }), // saída não conta
      tx({ date: '2026-06-01T12:00:00.000Z', amount: 1000, type: 'inflow', entity: 'PF' }), // PF não conta
    ];
    expect(revenueLast12Months(transactions, '2026-07')).toBe(8000);
  });

  it('ignora lançamentos PLANNED (previstos não são receita)', () => {
    const transactions = [
      tx({ date: '2026-07-01T12:00:00.000Z', amount: 5000, type: 'inflow', entity: 'PJ', status: 'PLANNED' }),
    ];
    expect(revenueLast12Months(transactions, '2026-07')).toBe(0);
  });

  it('não é distorcida por dados de anos anteriores (bug do cálculo antigo)', () => {
    // O cálculo antigo somava TODO o histórico: com 2 anos de dados a receita
    // dobrava e o Fator R caía pela metade, mudando indevidamente de anexo.
    const transactions = [
      tx({ date: '2026-05-01T12:00:00.000Z', amount: 60000, type: 'inflow', entity: 'PJ' }),
      tx({ date: '2024-05-01T12:00:00.000Z', amount: 60000, type: 'inflow', entity: 'PJ' }),
    ];
    const revenue = revenueLast12Months(transactions, '2026-07');
    expect(revenue).toBe(60000);
    // Folha de 1.500/mês → 18.000/ano ÷ 60.000 = 30% → Anexo III
    expect(calculateFactorR(1500, revenue)).toBeCloseTo(30);
  });
});

describe('calculateFactorR', () => {
  it('anualiza a folha e devolve percentual', () => {
    expect(calculateFactorR(2800, 120000)).toBeCloseTo(28);
  });

  it('sem folha → 0 (sem divisão por zero)', () => {
    expect(calculateFactorR(0, 100000)).toBe(0);
    expect(calculateFactorR(1000, 0)).toBeGreaterThan(0);
  });
});

describe('calculateServiceTaxes', () => {
  it('MEI não recolhe por nota', () => {
    expect(calculateServiceTaxes(10000, 'MEI', 0)).toEqual({ rate: 0, federal: 0, iss: 0, total: 0 });
  });

  it('Fator R ≥ 28% aplica Anexo III (6%)', () => {
    const r = calculateServiceTaxes(10000, 'ME', 28);
    expect(r.rate).toBeCloseTo(SIMPLES_RATE_ANEXO_III * 100);
    expect(r.federal).toBeCloseTo(600);
    expect(r.total).toBeCloseTo(600);
  });

  it('Fator R < 28% aplica Anexo V (15,5%)', () => {
    const r = calculateServiceTaxes(10000, 'ME', 27.9);
    expect(r.rate).toBeCloseTo(SIMPLES_RATE_ANEXO_V * 100);
    expect(r.federal).toBeCloseTo(1550);
  });

  it('ISS retido soma ao total', () => {
    const r = calculateServiceTaxes(10000, 'ME', 30, true, 2);
    expect(r.iss).toBeCloseTo(200);
    expect(r.total).toBeCloseTo(800);
  });

  it('valor não positivo zera tudo', () => {
    expect(calculateServiceTaxes(0, 'ME', 30).total).toBe(0);
  });
});
