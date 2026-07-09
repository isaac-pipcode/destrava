import { describe, it, expect } from 'vitest';
import { parseBankStatement } from '../services/bankStatementParser';

describe('parseBankStatement', () => {
  it('lê o formato Nubank (Data,Valor,Identificador,Descrição)', () => {
    const csv = [
      'Data,Valor,Identificador,Descrição',
      '05/07/2026,-1200.00,abc-1,Aluguel Ateliê',
      '10/07/2026,3500.00,abc-2,Cachê Sesc',
    ].join('\n');

    const r = parseBankStatement(csv);
    expect(r.success).toBe(true);
    expect(r.transactions).toHaveLength(2);
    expect(r.transactions[0]).toEqual({
      date: '2026-07-05', amount: 1200, type: 'outflow', description: 'Aluguel Ateliê',
    });
    expect(r.transactions[1].type).toBe('inflow');
    expect(r.transactions[1].amount).toBe(3500);
  });

  it('lê separador ; e valores brasileiros com milhar ("1.250,00")', () => {
    const csv = [
      'DATA;HISTORICO;VALOR',
      '03/07/2026;PIX RECEBIDO EDITAL;"1.250,00"',
      '04/07/2026;TARIFA PACOTE;"-25,90"',
    ].join('\n');

    const r = parseBankStatement(csv);
    expect(r.success).toBe(true);
    expect(r.transactions[0].amount).toBe(1250);
    expect(r.transactions[0].type).toBe('inflow');
    expect(r.transactions[1].amount).toBe(25.9);
    expect(r.transactions[1].type).toBe('outflow');
  });

  it('aceita datas YYYY-MM-DD e "21 DEZ 2025"', () => {
    const csv = [
      'Data,Valor,Descrição',
      '2026-07-09,-10.00,Café',
      '21 DEZ 2025,100.00,Venda',
    ].join('\n');

    const r = parseBankStatement(csv);
    expect(r.transactions[0].date).toBe('2026-07-09');
    expect(r.transactions[1].date).toBe('2025-12-21');
  });

  it('remove BOM e ignora linhas vazias/curtas', () => {
    const csv = '﻿Data,Valor,Descrição\n\n05/07/2026,-10.00,Teste\n  \n';
    const r = parseBankStatement(csv);
    expect(r.success).toBe(true);
    expect(r.transactions).toHaveLength(1);
  });

  it('valor com R$ e parênteses (negativo contábil)', () => {
    const csv = [
      'Data,Valor,Descrição',
      '05/07/2026,"(R$ 300,00)",Estorno taxa',
    ].join('\n');
    const r = parseBankStatement(csv);
    expect(r.transactions[0]).toMatchObject({ amount: 300, type: 'outflow' });
  });

  it('arquivo irreconhecível → success false com mensagem', () => {
    const r = parseBankStatement('só uma linha qualquer');
    expect(r.success).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('linha sem valor válido é pulada sem quebrar as demais', () => {
    const csv = [
      'Data,Valor,Descrição',
      '05/07/2026,abc,Linha inválida',
      '06/07/2026,-50.00,Linha válida',
    ].join('\n');
    const r = parseBankStatement(csv);
    expect(r.transactions).toHaveLength(1);
    expect(r.transactions[0].description).toBe('Linha válida');
  });
});
