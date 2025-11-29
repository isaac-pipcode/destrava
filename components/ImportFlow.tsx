import React, { useState } from 'react';
import FileUpload from './FileUpload';
import KPICards from './KPICards';
import FinancialCharts from './FinancialCharts';
import InsightPanel from './InsightPanel';
import { parseFinancialData, generateFinancialInsights } from '../services/geminiService';
import { AppState, Transaction, FinancialMonth } from '../types';

interface ImportFlowProps {
  transactions: Transaction[];
  onDataAdded: (newT: Transaction[]) => void;
}

const ImportFlow: React.FC<ImportFlowProps> = ({ transactions, onDataAdded }) => {
  const [state, setState] = useState<AppState>({
    data: null,
    insights: [],
    isLoading: false,
    error: null,
  });

  const [mode, setMode] = useState<'selection' | 'upload' | 'analysis'>('selection');

  // Helper to convert internal Transactions to FinancialMonth format expected by Charts/AI
  const convertTransactionsToFinancialData = (txs: Transaction[]): FinancialMonth[] => {
      const grouped: Record<string, FinancialMonth> = {};
      
      txs.forEach(t => {
          if (!grouped[t.month]) {
              grouped[t.month] = {
                  month: t.month,
                  forecast: { inflow: 0, outflow: 0, balance: 0 }, // We don't have forecast in manual mode yet, assume 0
                  realized: { inflow: 0, outflow: 0, balance: 0 },
                  details: []
              };
          }
          const m = grouped[t.month];
          if (t.type === 'inflow') {
              m.realized.inflow += t.amount;
          } else {
              m.realized.outflow += t.amount;
          }
          m.realized.balance = m.realized.inflow - m.realized.outflow;
          m.details.push({
              category: t.category,
              amount: t.amount,
              type: t.type
          });
      });

      return Object.values(grouped);
  };

  const handleAnalyzeCurrentData = async () => {
      if (transactions.length === 0) {
          setState(prev => ({ ...prev, error: "Não há dados no Diário para analisar." }));
          return;
      }
      
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      setMode('analysis');

      try {
          // Convert existing transactions to the format expected by the Insight engine
          const financialData = convertTransactionsToFinancialData(transactions);
          const insights = await generateFinancialInsights(financialData);

          setState({
              data: financialData,
              insights: insights,
              isLoading: false,
              error: null,
          });

      } catch (error: any) {
          setState(prev => ({
              ...prev,
              isLoading: false,
              error: "Erro ao gerar análise dos dados existentes."
          }));
      }
  };

  const handleDataLoaded = async (content: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    setMode('analysis');
    
    try {
      const parsedData = await parseFinancialData(content);
      const insights = await generateFinancialInsights(parsedData);

      setState({
        data: parsedData,
        insights: insights,
        isLoading: false,
        error: null,
      });

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || "Ocorreu um erro ao processar os dados.",
      }));
    }
  };

  const handleReset = () => {
    setState({
      data: null,
      insights: [],
      isLoading: false,
      error: null,
    });
    setMode('selection');
  };

  return (
    <div className="animate-fade-in-up">
        {state.error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Erro: </strong>
            <span className="block sm:inline">{state.error}</span>
          </div>
        )}

        {mode === 'selection' && (
             <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">Diagnóstico Inteligente</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-lg">Como você deseja realizar a análise financeira hoje?</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                    <button 
                        onClick={handleAnalyzeCurrentData}
                        className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border-2 border-transparent hover:border-govblue dark:hover:border-blue-500 hover:shadow-md transition-all group text-left"
                    >
                        <div className="w-14 h-14 bg-blue-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6 group-hover:bg-govblue group-hover:text-white transition-colors text-govblue dark:text-blue-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Analisar Meu Diário</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Use os {transactions.length} lançamentos que já estão cadastrados no sistema para gerar insights.
                        </p>
                    </button>

                    <button 
                         onClick={() => setMode('upload')}
                         className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border-2 border-transparent hover:border-govorange dark:hover:border-orange-500 hover:shadow-md transition-all group text-left"
                    >
                        <div className="w-14 h-14 bg-orange-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6 group-hover:bg-govorange group-hover:text-white transition-colors text-govorange dark:text-orange-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Enviar Planilha/Extrato</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Faça upload de um novo arquivo CSV consolidado para uma análise pontual.
                        </p>
                    </button>
                </div>
             </div>
        )}

        {mode === 'upload' && !state.data && (
            <div className="max-w-xl mx-auto py-10">
                 <button onClick={() => setMode('selection')} className="text-gray-500 dark:text-gray-400 hover:text-govblue mb-4 flex items-center gap-2">
                    ← Voltar
                 </button>
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">Upload de Arquivo</h2>
                 <FileUpload onDataLoaded={handleDataLoaded} isLoading={state.isLoading} />
            </div>
        )}

        {state.isLoading && mode === 'analysis' && (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-govblue mb-4"></div>
                 <p className="text-lg text-gray-600 dark:text-gray-300 animate-pulse">A Inteligência Artificial está analisando suas finanças...</p>
            </div>
        )}

        {state.data && (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Resultado do Diagnóstico</h2>
                <button 
                  onClick={handleReset}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm"
                >
                  Nova Análise
                </button>
            </div>

            <KPICards data={state.data} />
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                    <FinancialCharts data={state.data} />
                </div>
                <div className="xl:col-span-1">
                    <InsightPanel insights={state.insights} />
                </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ImportFlow;