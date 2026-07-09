
import React, { useState } from 'react';
import { Bank, ChartBar, UploadSimple } from '@phosphor-icons/react';
import FileUpload from './FileUpload';
import KPICards from './KPICards';
import FinancialCharts from './FinancialCharts';
import InsightPanel from './InsightPanel';
import StatementImport from './StatementImport';
import { parseFinancialData, generateFinancialInsights } from '../services/geminiService';
import { AppState, Transaction, FinancialMonth, BankAccount } from '../types';

interface ImportFlowProps {
  transactions: Transaction[];
  onDataAdded: (newT: Transaction[]) => void;
  accounts?: BankAccount[];
  customCategories?: string[];
}

const ImportFlow: React.FC<ImportFlowProps> = ({ transactions, onDataAdded, accounts = [], customCategories = [] }) => {
  const [state, setState] = useState<AppState>({
    data: null,
    insights: [],
    isLoading: false,
    error: null,
  });

  const [mode, setMode] = useState<'selection' | 'upload' | 'statement' | 'analysis'>('selection');

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
          <div className="mb-6 bg-error-soft border border-error/40 text-error px-4 py-3 rounded-2xl relative animate-fade-in" role="alert">
            <strong className="font-bold">Aviso: </strong>
            <span className="block sm:inline">{state.error}</span>
            <button onClick={() => setState(prev => ({...prev, error: null}))} className="absolute top-3 right-4 font-bold">×</button>
          </div>
        )}

        <div key={mode} className="animate-fade-in">
          {mode === 'selection' && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                  <h2 className="text-3xl font-display font-bold text-ink mb-2 tracking-tight uppercase">Diagnóstico Inteligente</h2>
                  <p className="text-muted mb-10 max-w-lg font-medium">Como você deseja destravar sua análise financeira?</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                      <button
                          onClick={() => setMode('statement')}
                          className="bg-surface p-8 rounded-[2.5rem] shadow-brand-sm border-2 border-transparent hover:border-primary hover:shadow-brand-md transition-all group text-left"
                      >
                          <div className="w-14 h-14 bg-primary-soft rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                              <Bank size={32} weight="bold" />
                          </div>
                          <h3 className="text-xl font-display font-extrabold text-ink mb-2 uppercase tracking-tight">Importar Extrato</h3>
                          <p className="text-sm text-muted font-medium">
                              CSV do seu banco lido na hora, sem IA: os lançamentos entram direto no Diário.
                          </p>
                      </button>

                      <button
                          onClick={handleAnalyzeCurrentData}
                          className="bg-surface p-8 rounded-[2.5rem] shadow-brand-sm border-2 border-transparent hover:border-primary hover:shadow-brand-md transition-all group text-left"
                      >
                          <div className="w-14 h-14 bg-primary-soft rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                              <ChartBar size={32} weight="bold" />
                          </div>
                          <h3 className="text-xl font-display font-extrabold text-ink mb-2 uppercase tracking-tight">Analisar Meu Diário</h3>
                          <p className="text-sm text-muted font-medium">
                              Use os lançamentos do sistema para gerar insights estratégicos.
                          </p>
                      </button>

                      <button
                          onClick={() => setMode('upload')}
                          className="bg-surface p-8 rounded-[2.5rem] shadow-brand-sm border-2 border-transparent hover:border-accent hover:shadow-brand-md transition-all group text-left"
                      >
                          <div className="w-14 h-14 bg-accent-soft rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent group-hover:text-white transition-colors text-accent">
                              <UploadSimple size={32} weight="bold" />
                          </div>
                          <h3 className="text-xl font-display font-extrabold text-ink mb-2 uppercase tracking-tight">Enviar Planilha</h3>
                          <p className="text-sm text-muted font-medium">
                              Faça upload de CSV para uma análise pontual de faturamento.
                          </p>
                      </button>
                  </div>
              </div>
          )}

          {mode === 'statement' && (
              <div>
                  <button onClick={() => setMode('selection')} className="text-muted hover:text-primary mb-2 ml-4 flex items-center gap-2 font-bold uppercase text-xs tracking-widest">
                      ← Voltar à Seleção
                  </button>
                  <StatementImport
                      accounts={accounts}
                      customCategories={customCategories}
                      onImport={onDataAdded}
                      onDone={() => setMode('selection')}
                  />
              </div>
          )}

          {mode === 'upload' && !state.data && (
              <div className="max-w-xl mx-auto py-10 px-4">
                  <button onClick={() => setMode('selection')} className="text-muted hover:text-primary mb-6 flex items-center gap-2 font-bold uppercase text-xs tracking-widest">
                      ← Voltar à Seleção
                  </button>
                  <div className="bg-surface p-8 rounded-[2.5rem] shadow-brand-md border border-line">
                    <h2 className="text-2xl font-display font-extrabold text-ink mb-6 text-center uppercase tracking-tight">Upload de Arquivo</h2>
                    <FileUpload onDataLoaded={handleDataLoaded} isLoading={state.isLoading} />
                  </div>
              </div>
          )}

          {state.isLoading && mode === 'analysis' && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
                  <div className="relative w-20 h-20 mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"></div>
                      <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin"></div>
                  </div>
                  <p className="text-xl font-display font-extrabold text-ink animate-pulse uppercase tracking-tight">Analisando sua Carreira...</p>
                  <p className="text-sm text-muted mt-2 font-medium">Isso pode levar alguns segundos dependendo do volume de dados.</p>
              </div>
          )}

          {state.data && (
            <div className="animate-fade-in-up px-2 sm:px-0">
              <div className="flex justify-between items-center mb-8 bg-surface p-6 rounded-3xl shadow-brand-sm border border-line">
                  <div>
                    <h2 className="text-2xl font-display font-extrabold text-ink uppercase tracking-tight">Resultado do Diagnóstico</h2>
                    <p className="text-xs font-bold text-subtle uppercase tracking-widest mt-1">Análise processada por Inteligência Artificial</p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-surface-2 hover:bg-surface-2 rounded-2xl text-xs font-extrabold text-muted uppercase tracking-widest transition-all"
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
