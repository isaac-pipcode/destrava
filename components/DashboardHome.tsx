
import React, { useMemo } from 'react';
import { Transaction } from '../types';

interface DashboardHomeProps {
  onNavigate: (view: 'import' | 'manual' | 'accountability' | 'manual_pf' | 'manual_pj') => void;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  onLoadDemo?: () => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigate, transactions, setTransactions, onLoadDemo }) => {
  
  // Calculate Stats separately for PF and PJ
  const calculateHealth = (entity: 'PF' | 'PJ') => {
    const entityTrans = transactions.filter(t => t.entity === entity);
    const totalInflow = entityTrans.reduce((acc, t) => t.type === 'inflow' ? acc + t.amount : acc, 0);
    const totalOutflow = entityTrans.reduce((acc, t) => t.type === 'outflow' ? acc + t.amount : acc, 0);
    const balance = totalInflow - totalOutflow;

    const uniqueMonths = new Set(entityTrans.map(t => t.month)).size || 1;
    // We consider average expenses only from outflows to be conservative
    const avgMonthlyExpenses = uniqueMonths > 0 && totalOutflow > 0 ? totalOutflow / uniqueMonths : 0;
    const runway = avgMonthlyExpenses > 0 ? balance / avgMonthlyExpenses : 0;

    return { balance, runway, avgMonthlyExpenses };
  };

  const healthPF = useMemo(() => calculateHealth('PF'), [transactions]);
  const healthPJ = useMemo(() => calculateHealth('PJ'), [transactions]);

  const getStatus = (runway: number, balance: number) => {
    if (balance === 0 && runway === 0) return { color: 'text-gray-400', label: 'Sem Dados', icon: '⚪' };
    if (balance < 0) return { color: 'text-red-600', label: 'Negativo', icon: '🚨' };
    if (runway < 1) return { color: 'text-govorange', label: 'Crítico', icon: '⚠️' };
    if (runway < 3) return { color: 'text-yellow-600', label: 'Atenção', icon: '🚧' };
    return { color: 'text-govgreen', label: 'Saudável', icon: '🌱' };
  };

  const statusPF = getStatus(healthPF.runway, healthPF.balance);
  const statusPJ = getStatus(healthPJ.runway, healthPJ.balance);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="animate-fade-in-up">
      {/* Modern Artistic Hero Banner - Responsive Adjustments */}
      <div className="w-full min-h-[14rem] h-auto rounded-3xl mb-10 relative overflow-hidden gov-gradient shadow-brand-md py-10 flex items-center">
        {/* Abstract Shapes Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full transform translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-20 w-64 h-64 bg-govorange opacity-10 rounded-full transform translate-y-1/2 blur-2xl"></div>
        
        <div className="relative z-10 w-full flex flex-col justify-center px-6 md:px-10">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border border-white/20">
                    Sustentabilidade
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border border-white/20">
                    Gestão
                </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight max-w-2xl">
                Por uma gestão saudável <br className="hidden sm:block"/>e sustentável da cultura
            </h2>
            <p className="text-white/80 mt-3 max-w-xl text-xs sm:text-sm font-medium leading-relaxed">
                Fortalecendo a economia criativa brasileira através do controle inteligente e inteligência artificial financeira.
            </p>
        </div>
      </div>

      {/* Seção de Resumo com Feedback Visual para Carregamento de Dados */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 px-2 gap-4">
        <div>
            <h3 className="font-display text-xl font-bold text-ink">Visão Geral dos Saldos</h3>
            {transactions.length === 0 && (
                <p className="text-xs text-warning font-semibold mt-1">Seu painel está vazio. Carregue os dados de demonstração abaixo.</p>
            )}
        </div>
        
        {onLoadDemo && transactions.length < 5 && (
            <button 
                onClick={onLoadDemo}
                className="w-full sm:w-auto px-5 py-3 bg-primary text-primary-on rounded-xl text-sm font-semibold shadow-brand-sm hover:bg-primary-hover transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
                Carregar Dados de Demonstração
            </button>
        )}
      </div>
      
      {/* Cards de Saúde Financeira - Grid Responsivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
        
        {/* Card PJ - AZUL */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border-l-8 border-govblue relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xs sm:text-sm font-bold text-govblue dark:text-blue-400 uppercase tracking-widest">Empresa (MEI/ME)</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Projetos e Editais</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 bg-white dark:bg-slate-700 border-blue-200 dark:border-slate-600 text-govblue dark:text-blue-400`}>
                    <span>{statusPJ.icon}</span> <span className="hidden sm:inline">{statusPJ.label}</span>
                </div>
            </div>
            
            <div className="mb-4 bg-blue-50/50 dark:bg-slate-900 p-4 rounded-xl border border-blue-100 dark:border-slate-700 shadow-sm">
                <p className="text-2xl sm:text-3xl font-display font-bold text-gray-800 dark:text-white truncate">{formatCurrency(healthPJ.balance)}</p>
                <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400">Saldo atual</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-blue-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] sm:text-xs font-bold text-gray-600 dark:text-gray-300">Fôlego (Runway)</span>
                    <span className="text-[10px] sm:text-xs font-bold text-govblue dark:text-blue-400">{healthPJ.runway.toFixed(1)} meses</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mb-1">
                    <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${healthPJ.runway < 3 ? 'bg-govorange' : 'bg-govblue'}`} 
                        style={{ width: `${Math.min(healthPJ.runway * 10, 100)}%` }}
                    ></div>
                </div>
            </div>
            <div className="mt-4 text-center">
                 <button onClick={() => onNavigate('manual_pj')} className="text-xs sm:text-sm font-bold text-govblue dark:text-blue-400 hover:underline">Ver Diário da Empresa &rarr;</button>
            </div>
        </div>

        {/* Card PF - VERDE */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border-l-8 border-govgreen relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xs sm:text-sm font-bold text-govgreen uppercase tracking-widest">Pessoa Física</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Survival & Gastos Pessoais</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 bg-white dark:bg-slate-700 border-green-200 dark:border-slate-600 text-govgreen`}>
                    <span>{statusPF.icon}</span> <span className="hidden sm:inline">{statusPF.label}</span>
                </div>
            </div>
            
            <div className="mb-4 bg-green-50/50 dark:bg-slate-900 p-4 rounded-xl border border-green-100 dark:border-slate-700 shadow-sm">
                <p className="text-2xl sm:text-3xl font-display font-bold text-gray-800 dark:text-white truncate">{formatCurrency(healthPF.balance)}</p>
                <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400">Saldo disponível</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-green-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] sm:text-xs font-bold text-gray-600 dark:text-gray-300">Reserva Pessoal</span>
                    <span className="text-[10px] sm:text-xs font-bold text-govgreen">{healthPF.runway.toFixed(1)} meses</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mb-1">
                    <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${healthPF.runway < 3 ? 'bg-govorange' : 'bg-govgreen'}`} 
                        style={{ width: `${Math.min(healthPF.runway * 10, 100)}%` }}
                    ></div>
                </div>
            </div>
            <div className="mt-4 text-center">
                 <button onClick={() => onNavigate('manual_pf')} className="text-xs sm:text-sm font-bold text-govgreen hover:underline">Ver Diário Pessoal &rarr;</button>
            </div>
        </div>
      </div>
      
      {/* Quick Actions Grid - Responsivo (2 ou 4 colunas) */}
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Acesso Rápido</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <button onClick={() => onNavigate('manual_pj')} className="p-4 sm:p-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl hover:shadow-md hover:border-govblue dark:hover:border-blue-500 transition-all text-left group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-govblue group-hover:text-white transition-colors text-govblue dark:text-blue-400">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </div>
            <p className="font-bold text-gray-700 dark:text-gray-200 text-xs sm:text-sm">Novo Lançamento</p>
         </button>

         <button onClick={() => onNavigate('accountability')} className="p-4 sm:p-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl hover:shadow-md hover:border-govgreen dark:hover:border-green-500 transition-all text-left group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-govgreen group-hover:text-white transition-colors text-govgreen dark:text-green-500">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l5.414 5.414a1 1 0 01.586 1.414V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <p className="font-bold text-gray-700 dark:text-gray-200 text-xs sm:text-sm">Prestar Contas</p>
         </button>

         <button onClick={() => onNavigate('import')} className="p-4 sm:p-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl hover:shadow-md hover:border-govorange transition-all text-left group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-govorange group-hover:text-white transition-colors text-govorange">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <p className="font-bold text-gray-700 dark:text-gray-200 text-xs sm:text-sm">Diagnóstico IA</p>
         </button>
         
         <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-4">
             <span className="text-xl mb-1">📅</span>
             <p className="text-[10px] font-bold text-slate-400 uppercase text-center">{new Date().toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'})}</p>
         </div>
      </div>
    </div>
  );
};

export default DashboardHome;
