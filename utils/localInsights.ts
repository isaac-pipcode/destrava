import { FinancialMonth, FinancialInsight } from '../types';

/**
 * Leituras financeiras determinísticas, sem IA/rede.
 *
 * Padrão "IA opcional, nunca bloqueante": a IA enriquece quando disponível;
 * quando falha (limite diário, rede, provedor fora), estas funções garantem
 * que o usuário nunca fica sem análise. Funções puras.
 */

export const fmtBRL = (v: number): string =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export interface ForecastSummary {
  entityLabel: string;          // "Empresa (PJ)" ou "Pessoal (PF)"
  currentBalance: number;
  runwayMonths: number | null;  // null = fôlego acima do horizonte
  firstNegMonth: string | null; // "YYYY-MM" em que o saldo cruza o zero
  lowest: number;               // menor saldo projetado no horizonte
  horizon: number;              // meses analisados
}

/** Nota determinística sobre a projeção de caixa, construída só com os números. */
export const buildLocalForecastNote = (s: ForecastSummary): string => {
  if (s.runwayMonths === null) {
    return `O caixa se mantém positivo durante todos os ${s.horizon} meses projetados, com fundo em torno de ${fmtBRL(s.lowest)}. Momento propício para reforçar a reserva ou investir na sua produção com folga.`;
  }
  if (s.runwayMonths <= 0) {
    return `Atenção: o caixa já está no vermelho (${fmtBRL(s.currentBalance)}). Priorize antecipar cachês e recebíveis de editais e renegocie saídas fixas antes de assumir novos custos.`;
  }
  return `No ritmo atual de lançamentos recorrentes, o caixa cruza o zero em cerca de ${s.runwayMonths} ${s.runwayMonths === 1 ? 'mês' : 'meses'}, atingindo ${fmtBRL(s.lowest)}. Antecipe recebimentos ou segure despesas não essenciais para esticar o fôlego.`;
};

/**
 * Insights determinísticos a partir dos meses consolidados — fallback do
 * gerador de insights por IA. Devolve até 3 leituras no mesmo shape.
 */
export function buildLocalInsights(data: FinancialMonth[]): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  if (!data || data.length === 0) {
    return [{
      title: 'Sem dados suficientes',
      description: 'Registre lançamentos no Diário ou importe um extrato para gerar leituras do seu caixa.',
      type: 'info',
      actionItem: 'Comece registrando as entradas e saídas do mês atual.',
    }];
  }

  const totalIn = data.reduce((a, m) => a + m.realized.inflow, 0);
  const totalOut = data.reduce((a, m) => a + m.realized.outflow, 0);
  const net = totalIn - totalOut;

  insights.push(net >= 0
    ? {
        title: 'Resultado positivo no período',
        description: `As entradas superaram as saídas em ${fmtBRL(net)} nos ${data.length} meses analisados. Manter parte desse excedente em reserva protege os meses de baixa temporada.`,
        type: 'success',
        actionItem: 'Separe um percentual do excedente como reserva de emergência.',
      }
    : {
        title: 'Saídas acima das entradas',
        description: `No período analisado as saídas superaram as entradas em ${fmtBRL(-net)}. Vale revisar despesas fixas e priorizar receitas já contratadas.`,
        type: 'warning',
        actionItem: 'Liste as três maiores despesas do período e avalie cortes ou renegociação.',
      });

  const negMonths = data.filter(m => m.realized.balance < 0);
  if (negMonths.length > 0) {
    insights.push({
      title: `${negMonths.length} ${negMonths.length === 1 ? 'mês fechou' : 'meses fecharam'} no vermelho`,
      description: 'A irregularidade é comum na renda cultural: meses de edital convivem com meses vazios. Um colchão de caixa equivalente a 2–3 meses de despesas suaviza esses vales.',
      type: negMonths.length > data.length / 2 ? 'warning' : 'info',
      actionItem: 'Cadastre suas despesas recorrentes para projetar os próximos vales com antecedência.',
    });
  }

  const byCategory = new Map<string, number>();
  data.forEach(m => m.details.forEach(d => {
    if (d.type === 'outflow') byCategory.set(d.category, (byCategory.get(d.category) || 0) + d.amount);
  }));
  const top = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top && totalOut > 0) {
    const pct = Math.round((top[1] / totalOut) * 100);
    insights.push({
      title: `Maior gasto: ${top[0]}`,
      description: `A categoria "${top[0]}" concentrou ${fmtBRL(top[1])} (${pct}% das saídas). Definir uma meta mensal para ela é o jeito mais rápido de ganhar controle.`,
      type: pct >= 50 ? 'warning' : 'info',
      actionItem: `Crie uma meta de orçamento para "${top[0]}" no Planejamento.`,
    });
  }

  return insights.slice(0, 3);
}
