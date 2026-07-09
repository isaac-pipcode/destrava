import { describe, it, expect } from 'vitest';
import {
  projectRecurring, projectedNetUntil, buildForecast,
  addMonths, monthDiff, daysInMonth, monthNameOf,
} from '../utils/projection';
import { tx, rule } from './helpers';

describe('helpers de mês', () => {
  it('addMonths atravessa a virada de ano', () => {
    expect(addMonths('2026-11', 3)).toBe('2027-02');
    expect(addMonths('2026-01', -2)).toBe('2025-11');
  });

  it('monthDiff calcula diferença assinada', () => {
    expect(monthDiff('2026-07', '2026-10')).toBe(3);
    expect(monthDiff('2026-07', '2026-07')).toBe(0);
    expect(monthDiff('2026-07', '2025-07')).toBe(-12);
  });

  it('daysInMonth trata fevereiro e bissexto', () => {
    expect(daysInMonth('2026-02')).toBe(28);
    expect(daysInMonth('2028-02')).toBe(29);
    expect(daysInMonth('2026-07')).toBe(31);
  });

  it('monthNameOf devolve o nome pt-BR usado no campo legado month', () => {
    expect(monthNameOf('2026-07')).toBe('Julho');
    expect(monthNameOf('2026-01')).toBe('Janeiro');
  });
});

describe('projectRecurring', () => {
  it('expande a regra em um previsto por mês dentro do horizonte', () => {
    const planned = projectRecurring(
      [rule({ amount: 1200, description: 'Aluguel', dayOfMonth: 5 })],
      [],
      { entity: 'PJ', fromMonth: '2026-07', horizonMonths: 3 }
    );
    expect(planned).toHaveLength(3);
    expect(planned.map(p => p.date.slice(0, 10))).toEqual(['2026-07-05', '2026-08-05', '2026-09-05']);
    expect(planned.every(p => p.status === 'PLANNED')).toBe(true);
    expect(planned[0].month).toBe('Julho');
  });

  it('clampa o dia ao fim do mês (dia 31 em fevereiro)', () => {
    const planned = projectRecurring(
      [rule({ amount: 100, dayOfMonth: 31 })],
      [],
      { entity: 'PJ', fromMonth: '2026-02', horizonMonths: 1 }
    );
    expect(planned[0].date.slice(0, 10)).toBe('2026-02-28');
  });

  it('respeita startMonth e monthsAhead da regra', () => {
    const planned = projectRecurring(
      [rule({ amount: 100, startMonth: '2026-08', monthsAhead: 2 })],
      [],
      { entity: 'PJ', fromMonth: '2026-07', horizonMonths: 12 }
    );
    expect(planned.map(p => p.date.slice(0, 7))).toEqual(['2026-08', '2026-09']);
  });

  it('deduz mês já realizado pela mesma regra (recurringId)', () => {
    const r = rule({ id: 'rec_alug', amount: 1200 });
    const realized = [tx({ date: '2026-07-05T12:00:00.000Z', amount: 1200, recurringId: 'rec_alug' })];
    const planned = projectRecurring([r], realized, { entity: 'PJ', fromMonth: '2026-07', horizonMonths: 2 });
    expect(planned.map(p => p.date.slice(0, 7))).toEqual(['2026-08']);
  });

  it('deduz por descrição+valor equivalentes quando não há recurringId', () => {
    const r = rule({ amount: 1200, description: 'Aluguel Ateliê' });
    const realized = [tx({ date: '2026-07-03T12:00:00.000Z', amount: 1200, description: '  aluguel ateliê ' })];
    const planned = projectRecurring([r], realized, { entity: 'PJ', fromMonth: '2026-07', horizonMonths: 2 });
    expect(planned.map(p => p.date.slice(0, 7))).toEqual(['2026-08']);
  });

  it('filtra por entidade (PF não enxerga regra PJ)', () => {
    const planned = projectRecurring(
      [rule({ amount: 100, entity: 'PJ' })],
      [],
      { entity: 'PF', fromMonth: '2026-07', horizonMonths: 3 }
    );
    expect(planned).toHaveLength(0);
  });

  it('gera ids determinísticos (mesma regra+mês → mesmo id)', () => {
    const r = rule({ id: 'rec_fixo', amount: 100 });
    const a = projectRecurring([r], [], { entity: 'PJ', fromMonth: '2026-07', horizonMonths: 1 });
    const b = projectRecurring([r], [], { entity: 'PJ', fromMonth: '2026-07', horizonMonths: 1 });
    expect(a[0].id).toBe(b[0].id);
    expect(a[0].id).toBe('plan_rec_fixo_2026-07');
  });
});

describe('projectedNetUntil e buildForecast', () => {
  it('soma entradas e subtrai saídas até a data limite', () => {
    const planned = projectRecurring(
      [
        rule({ amount: 3000, type: 'inflow', description: 'Cachê fixo', dayOfMonth: 10 }),
        rule({ amount: 1000, type: 'outflow', description: 'Aluguel', dayOfMonth: 5 }),
      ],
      [],
      { entity: 'PJ', fromMonth: '2026-07', horizonMonths: 2 }
    );
    expect(projectedNetUntil(planned, '2026-07-31')).toBe(2000);
    expect(projectedNetUntil(planned, '2026-08-31')).toBe(4000);
    expect(projectedNetUntil(planned, '2026-07-07')).toBe(-1000);
  });

  it('detecta o mês em que o caixa cruza o zero (runway)', () => {
    const realized = [tx({ date: '2026-06-15T12:00:00.000Z', amount: 2500, type: 'inflow' })];
    const planned = projectRecurring(
      [rule({ amount: 1000, type: 'outflow' })],
      realized,
      { entity: 'PJ', fromMonth: '2026-07', horizonMonths: 6 }
    );
    const fc = buildForecast(realized, planned, '2026-07', 6);
    // 2500 - 1000 (jul) - 1000 (ago) = 500; - 1000 (set) = -500 → cruza em setembro
    expect(fc.firstNegMonth).toBe('2026-09');
    expect(fc.runwayMonths).toBe(2);
    // saldo "hoje" considera só o realizado, não os previstos
    expect(fc.currentBalance).toBe(2500);
  });

  it('caixa sempre positivo → runway null e menor saldo coerente', () => {
    const realized = [tx({ date: '2026-06-15T12:00:00.000Z', amount: 10000, type: 'inflow' })];
    const planned = projectRecurring(
      [rule({ amount: 100, type: 'outflow' })],
      realized,
      { entity: 'PJ', fromMonth: '2026-07', horizonMonths: 6 }
    );
    const fc = buildForecast(realized, planned, '2026-07', 6);
    expect(fc.runwayMonths).toBeNull();
    expect(fc.firstNegMonth).toBeNull();
    expect(fc.lowest.value).toBe(10000 - 100 * 6); // 6 previstos (jul..dez, horizonte da regra)
  });
});
