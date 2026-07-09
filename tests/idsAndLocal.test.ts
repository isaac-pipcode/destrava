import { describe, it, expect } from 'vitest';
import { slugify, budgetId, plannedId } from '../utils/ids';
import { buildLocalForecastNote, buildLocalInsights } from '../utils/localInsights';
import { guessCategory } from '../utils/categories';
import { FinancialMonth } from '../types';

describe('ids determinísticos', () => {
  it('slugify normaliza acentos e símbolos', () => {
    expect(slugify('Transporte/Logística')).toBe('transporte-logistica');
    expect(slugify('  Pró-labore & Cia  ')).toBe('pro-labore-cia');
  });

  it('budgetId é estável para a mesma chave natural (upsert nunca duplica)', () => {
    const a = budgetId('PJ', '2026-07', 'Aluguel de Espaço/Sede');
    const b = budgetId('PJ', '2026-07', 'Aluguel de Espaço/Sede');
    expect(a).toBe(b);
    expect(a).toBe('bud_pj_2026-07_aluguel-de-espaco-sede');
  });

  it('plannedId compõe regra + mês', () => {
    expect(plannedId('rec_x', '2026-08')).toBe('plan_rec_x_2026-08');
  });
});

describe('fallback local determinístico (IA opcional)', () => {
  it('nota de projeção: caixa positivo no horizonte', () => {
    const note = buildLocalForecastNote({
      entityLabel: 'Empresa (PJ)', currentBalance: 5000, runwayMonths: null,
      firstNegMonth: null, lowest: 1200, horizon: 12,
    });
    expect(note).toContain('12 meses');
    expect(note).toMatch(/positivo/);
  });

  it('nota de projeção: caixa cruza o zero', () => {
    const note = buildLocalForecastNote({
      entityLabel: 'Empresa (PJ)', currentBalance: 2000, runwayMonths: 3,
      firstNegMonth: '2026-10', lowest: -800, horizon: 12,
    });
    expect(note).toContain('3 meses');
  });

  it('nota de projeção: caixa já negativo', () => {
    const note = buildLocalForecastNote({
      entityLabel: 'Pessoal (PF)', currentBalance: -500, runwayMonths: 0,
      firstNegMonth: '2026-07', lowest: -900, horizon: 6,
    });
    expect(note).toMatch(/vermelho/);
  });

  it('insights locais: aponta resultado, meses no vermelho e maior gasto', () => {
    const data: FinancialMonth[] = [
      {
        month: 'Junho',
        forecast: { inflow: 0, outflow: 0, balance: 0 },
        realized: { inflow: 3000, outflow: 4000, balance: -1000 },
        details: [
          { category: 'Aluguel', amount: 2500, type: 'outflow' },
          { category: 'Transporte', amount: 1500, type: 'outflow' },
          { category: 'Cachê', amount: 3000, type: 'inflow' },
        ],
      },
    ];
    const insights = buildLocalInsights(data);
    expect(insights.length).toBeGreaterThanOrEqual(2);
    expect(insights.length).toBeLessThanOrEqual(3);
    expect(insights[0].type).toBe('warning');            // saídas > entradas
    expect(insights.some(i => i.title.includes('Aluguel'))).toBe(true); // maior gasto
  });

  it('insights locais: sem dados → orientação inicial', () => {
    const insights = buildLocalInsights([]);
    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe('info');
  });
});

describe('guessCategory (categorizador local)', () => {
  it('classifica padrões comuns por entidade', () => {
    expect(guessCategory('UBER *TRIP 8821', 'outflow', 'PF')).toBe('Transporte/Combustível');
    expect(guessCategory('UBER *TRIP 8821', 'outflow', 'PJ')).toBe('Transporte/Logística');
    expect(guessCategory('PIX Lei Paulo Gustavo parcela 2', 'inflow', 'PJ')).toBe('Edital/Lei de Incentivo');
    expect(guessCategory('DAS Simples Nacional 07/2026', 'outflow', 'PJ')).toBe('Impostos (MEI/Simples)');
    expect(guessCategory('Netflix.com', 'outflow', 'PF')).toBe('Assinaturas/Serviços (Net/Luz)');
  });

  it('sem correspondência → Outros', () => {
    expect(guessCategory('XPTO 123', 'outflow', 'PJ')).toBe('Outros');
  });
});
