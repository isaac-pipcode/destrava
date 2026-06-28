import React from 'react';
import { FinancialMonth } from '../types';
import { TrendUp, TrendDown, Wallet, Pulse } from '@phosphor-icons/react';

interface KPICardsProps {
  data: FinancialMonth[];
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

interface CardProps {
  label: string;
  value: string;
  caption: React.ReactNode;
  icon: React.ReactNode;
  tone: 'primary' | 'success' | 'secondary' | 'accent';
}

const toneChip: Record<CardProps['tone'], string> = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  secondary: 'bg-secondary-soft text-secondary',
  accent: 'bg-accent-soft text-accent',
};

const Card: React.FC<CardProps> = ({ label, value, caption, icon, tone }) => (
  <div className="bg-surface rounded-2xl shadow-brand-sm border border-line p-6 transition-colors">
    <div className="flex items-start justify-between">
      <span className="text-[11px] font-semibold text-subtle uppercase tracking-[0.12em]">{label}</span>
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${toneChip[tone]}`}>{icon}</span>
    </div>
    <h3 className="font-mono tabular-nums text-2xl font-semibold text-ink mt-4">{value}</h3>
    <p className="text-xs text-muted mt-2">{caption}</p>
  </div>
);

const KPICards: React.FC<KPICardsProps> = ({ data }) => {
  const totalRealizedInflow = data.reduce((acc, curr) => acc + curr.realized.inflow, 0);
  const totalRealizedOutflow = data.reduce((acc, curr) => acc + curr.realized.outflow, 0);
  const netResult = totalRealizedInflow - totalRealizedOutflow;

  const totalForecastInflow = data.reduce((acc, curr) => acc + curr.forecast.inflow, 0);
  const inflowVariance = totalForecastInflow > 0
    ? ((totalRealizedInflow - totalForecastInflow) / totalForecastInflow) * 100
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card
        label="Receita Realizada"
        value={formatCurrency(totalRealizedInflow)}
        tone="success"
        icon={<TrendUp size={20} weight="bold" />}
        caption={
          <span className={inflowVariance >= 0 ? 'text-success font-semibold' : 'text-error font-semibold'}>
            {inflowVariance > 0 ? '+' : ''}{inflowVariance.toFixed(1)}% vs previsão
          </span>
        }
      />
      <Card
        label="Despesas Realizadas"
        value={formatCurrency(totalRealizedOutflow)}
        tone="secondary"
        icon={<TrendDown size={20} weight="bold" />}
        caption="Acumulado do período"
      />
      <Card
        label="Resultado Líquido"
        value={formatCurrency(netResult)}
        tone={netResult >= 0 ? 'primary' : 'accent'}
        icon={<Wallet size={20} weight="bold" />}
        caption="Entradas − Saídas"
      />
      <Card
        label="Saúde Financeira"
        value={netResult > 0 ? 'Positiva' : 'Atenção'}
        tone={netResult > 0 ? 'primary' : 'accent'}
        icon={<Pulse size={20} weight="bold" />}
        caption="Baseado no fluxo de caixa"
      />
    </div>
  );
};

export default KPICards;
