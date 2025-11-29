import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ComposedChart, Area
} from 'recharts';
import { FinancialMonth } from '../types';

interface FinancialChartsProps {
  data: FinancialMonth[];
}

const FinancialCharts: React.FC<FinancialChartsProps> = ({ data }) => {
  
  // Prepare data for the comparison chart
  const chartData = data.map(m => ({
    name: m.month,
    Realizado_Entrada: m.realized.inflow,
    Realizado_Saida: m.realized.outflow,
    Previsão_Saldo: m.forecast.balance,
    Realizado_Saldo: m.realized.balance,
  }));

  const formatCurrencyShort = (value: number) => {
    return `R$ ${(value / 1000).toFixed(1)}k`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-4 border border-gray-100 dark:border-slate-700 shadow-xl rounded-xl min-w-[200px] z-50">
          <p className="font-bold text-gray-800 dark:text-white mb-2 border-b border-gray-100 dark:border-slate-700 pb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((p: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4 text-xs">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">{p.name.replace(/_/g, ' ')}:</span>
                 </div>
                 <span className="font-bold text-gray-700 dark:text-gray-200">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.value)}
                 </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      
      {/* Chart 1: Inflow vs Outflow (Realized) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Entradas vs Saídas (Realizado)</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
              <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCurrencyShort} tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
              <Legend iconType="circle" wrapperStyle={{paddingTop: '10px'}} />
              <Bar dataKey="Realizado_Entrada" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="Realizado_Saida" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Net Balance Trend (Forecast vs Realized) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Saldo Líquido: Previsão vs Real</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
              <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCurrencyShort} tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{paddingTop: '10px'}} />
              {/* Forecast as a dashed line or area area */}
              <Line type="monotone" dataKey="Previsão_Saldo" name="Saldo Previsto" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={{r: 4}} />
              {/* Realized as a solid area */}
              <Area type="monotone" dataKey="Realizado_Saldo" name="Saldo Real" fill="#3b82f6" fillOpacity={0.1} stroke="#3b82f6" strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default FinancialCharts;