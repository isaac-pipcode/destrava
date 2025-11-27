import React from 'react';
import { FinancialMonth } from '../types';

interface KPICardsProps {
  data: FinancialMonth[];
}

const KPICards: React.FC<KPICardsProps> = ({ data }) => {
  // Calculate Totals for the available period
  const totalRealizedInflow = data.reduce((acc, curr) => acc + curr.realized.inflow, 0);
  const totalRealizedOutflow = data.reduce((acc, curr) => acc + curr.realized.outflow, 0);
  const netResult = totalRealizedInflow - totalRealizedOutflow;
  
  // Calculate Forecast Accuracy (simple variance)
  const totalForecastInflow = data.reduce((acc, curr) => acc + curr.forecast.inflow, 0);
  const inflowVariance = totalForecastInflow > 0 ? ((totalRealizedInflow - totalForecastInflow) / totalForecastInflow) * 100 : 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Revenue */}
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-emerald-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Receita Realizada (Total)</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(totalRealizedInflow)}</h3>
          </div>
          <div className="p-3 bg-emerald-100 rounded-full">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>
        <p className={`text-xs mt-2 ${inflowVariance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {inflowVariance > 0 ? '+' : ''}{inflowVariance.toFixed(1)}% vs Previsão
        </p>
      </div>

      {/* Total Expenses */}
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Despesas Realizadas</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(totalRealizedOutflow)}</h3>
          </div>
          <div className="p-3 bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Acumulado do período</p>
      </div>

      {/* Net Result */}
      <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${netResult >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Resultado Líquido</p>
            <h3 className={`text-2xl font-bold mt-1 ${netResult >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {formatCurrency(netResult)}
            </h3>
          </div>
          <div className={`p-3 rounded-full ${netResult >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
            <svg className={`w-6 h-6 ${netResult >= 0 ? 'text-blue-600' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Saldo (Entradas - Saídas)</p>
      </div>

      {/* Burn Rate / Health (Simple Logic) */}
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Saúde Financeira</p>
            <h3 className="text-lg font-bold text-gray-800 mt-1">
                {netResult > 0 ? "Positiva 🚀" : "Atenção ⚠️"}
            </h3>
          </div>
          <div className="p-3 bg-purple-100 rounded-full">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Baseado no fluxo de caixa</p>
      </div>
    </div>
  );
};

export default KPICards;
