
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

  const convertTransactionsToFinancialData = (txs: Transaction[]): FinancialMonth[] => {
      const grouped: Record<string, FinancialMonth> = {};
      txs.forEach(t => {
          if (!grouped[t.month]) {
              grouped[t.month] = {
                  month: t.month,
                  forecast: { inflow: 0, outflow: 0, balance: 0 },
                  realized: { inflow: 0, outflow: 0, balance: 0 },
                  details: []
              };
          }
          const m = grouped[t.month];
          if (t.type === 'inflow') m.realized.inflow += t.amount;
          else m.realized.outflow += t.amount;
          m.realized.balance = m.realized.inflow - m.realized.outflow;
          m.details.push({ category: t.category, amount: t.amount, type: t.type });
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
              error: error.message || "Erro ao gerar análise dos dados existentes."
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
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-2xl relative animate-fade-in" role="alert">
            <strong className="font-bold">Aviso: </strong>
            <span className="block sm:inline">{state.error}</span>
            <button onClick={() => setState(prev => ({...prev, error: null}))} className="absolute top-3 right-4 font-bold">×</button>
          </div>
        )}

        <div key={mode} className="animate-fade-in">
          {mode === 'selection' && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                  <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2 tracking-tighter uppercase">Diagnóstico Inteligente</h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-lg font-medium">Como você deseja destravar sua análise financeira?</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                      <button 
                          onClick={handleAnalyzeCurrentData}
                          className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border-2 border-transparent hover:border-govblue dark:hover:border-blue-500 hover:shadow-xl transition-all group text-left"
                      >
                          <div className="w-14 h-14 bg-blue-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-govblue group-hover:text-white transition-colors text-govblue dark:text-blue-400">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                          </div>
                          <h3 className="text-xl font-black text-gray-800 dark:text-white mb-2 uppercase tracking-tighter">Analisar Meu Diário</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                              Use os lançamentos do sistema para gerar insights estratégicos.
                          </p>
                      </button>

                      <button 
                          onClick={() => setMode('upload')}
                          className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border-2 border-transparent hover:border-govorange dark:hover:border-orange-500 hover:shadow-xl transition-all group text-left"
                      >
                          <div className="w-14 h-14 bg-orange-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-govorange group-hover:text-white transition-colors text-govorange dark:text-orange-400">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                          </div>
                          <h3 className="text-xl font-black text-gray-800 dark:text-white mb-2 uppercase tracking-tighter">Enviar Planilha</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                              Faça upload de CSV para uma análise pontual de faturamento.
                          </p>
                      </button>
                  </div>
              </div>
          )}

          {mode === 'upload' && !state.data && (
              <div className="max-w-xl mx-auto py-10 px-4">
                  <button onClick={() => setMode('selection')} className="text-gray-500 dark:text-gray-400 hover:text-govblue mb-6 flex items-center gap-2 font-bold uppercase text-xs tracking-widest">
                      ← Voltar à Seleção
                  </button>
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-700">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 text-center uppercase tracking-tighter">Upload de Arquivo</h2>
                    <FileUpload onDataLoaded={handleDataLoaded} isLoading={state.isLoading} />
                  </div>
              </div>
          )}

          {state.isLoading && mode === 'analysis' && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
                  <div className="relative w-20 h-20 mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-govblue/20 animate-ping"></div>
                      <div className="absolute inset-0 rounded-full border-t-4 border-govblue animate-spin"></div>
                  </div>
                  <p className="text-xl font-black text-gray-800 dark:text-white animate-pulse uppercase tracking-tighter">Analisando sua Carreira...</p>
                  <p className="text-sm text-gray-500 mt-2 font-medium">Isso pode levar alguns segundos dependendo do volume de dados.</p>
              </div>
          )}

          {state.data && (
            <div className="animate-fade-in-up px-2 sm:px-0">
              <div className="flex justify-between items-center mb-8 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border">
                  <div>
                    <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Resultado do Diagnóstico</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Análise processada por Inteligência Artificial</p>
                  </div>
                  <button 
                    onClick={handleReset}
                    className="px-6 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 rounded-2xl text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-widest transition-all"
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
    </div>
  );
};

export default ImportFlow;
