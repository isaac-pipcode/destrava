
import React, { useMemo } from 'react';
import { Transaction, RecurringRule } from '../types';
import { projectRecurring, buildForecast } from '../utils/projection';

interface DashboardHomeProps {
  onNavigate: (view: 'import' | 'manual' | 'accountability' | 'manual_pf' | 'manual_pj' | 'planning') => void;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  recurringRules?: RecurringRule[];
  onLoadDemo?: () => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigate, transactions, setTransactions, recurringRules = [], onLoadDemo }) => {

  // Calculate Stats separately for PF and PJ
  const calculateHealth = (entity: 'PF' | 'PJ') => {
    const entityTrans = transactions.filter(t => t.entity === entity && (t.status ?? 'REALIZED') !== 'PLANNED');
    const totalInflow = entityTrans.reduce((acc, t) => t.type === 'inflow' ? acc + t.amount : acc, 0);
    const totalOutflow = entityTrans.reduce((acc, t) => t.type === 'outflow' ? acc + t.amount : acc, 0);
    const balance = totalInflow - totalOutflow;

    // Com recorrências cadastradas, o fôlego vem da projeção real (mês em que o
    // saldo projetado cruza o zero), não da média histórica retrospectiva.
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (recurringRules.some(r => r.entity === entity)) {
      const planned = projectRecurring(recurringRules, transactions, { entity, fromMonth: currentMonth, horizonMonths: 12 });
      const forecast = buildForecast(entityTrans, planned, currentMonth, 12);
      return { balance, runway: forecast.runwayMonths ?? 12, projected: true };
    }

    // Sem recorrências: média histórica. Meses contados por ano+mês — contar só
    // pelo nome do mês colapsava julho/2025 com julho/2026 e inflava o fôlego.
    const uniqueMonths = new Set(entityTrans.map(t => t.date.slice(0, 7))).size || 1;
    const avgMonthlyExpenses = totalOutflow > 0 ? totalOutflow / uniqueMonths : 0;
    const runway = avgMonthlyExpenses > 0 ? balance / avgMonthlyExpenses : 0;

    return { balance, runway, projected: false };
  };

  const healthPF = useMemo(() => calculateHealth('PF'), [transactions, recurringRules]);
  const healthPJ = useMemo(() => calculateHealth('PJ'), [transactions, recurringRules]);

  const getStatus = (runway: number, balance: number) => {
    if (balance === 0 && runway === 0) return { color: 'text-subtle', label: 'Sem Dados', icon: '⚪' };
    if (balance < 0) return { color: 'text-error', label: 'Negativo', icon: '🚨' };
    if (runway < 1) return { color: 'text-warning', label: 'Crítico', icon: '⚠️' };
    if (runway < 3) return { color: 'text-warning', label: 'Atenção', icon: '🚧' };
    return { color: 'text-success', label: 'Saudável', icon: '🌱' };
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
        <div className="bg-surface rounded-2xl shadow-brand-sm p-6 border-l-8 border-primary relative overflow-hidden group hover:shadow-brand-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xs sm:text-sm font-bold text-primary uppercase tracking-widest">Empresa (MEI/ME)</h3>
                    <p className="text-[10px] sm:text-xs text-muted">Projetos e Editais</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 bg-surface-2 border-line text-primary`}>
                    <span>{statusPJ.icon}</span> <span className="hidden sm:inline">{statusPJ.label}</span>
                </div>
            </div>

            <div className="mb-4 bg-primary-soft p-4 rounded-xl border border-line shadow-brand-sm">
                <p className="text-2xl sm:text-3xl font-display font-bold text-ink truncate font-mono tabular-nums">{formatCurrency(healthPJ.balance)}</p>
                <p className="text-[10px] sm:text-sm text-muted">Saldo atual</p>
            </div>

            <div className="bg-surface-2 rounded-xl p-4 border border-line">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] sm:text-xs font-bold text-muted">Fôlego (Runway){healthPJ.projected ? ' · projetado' : ''}</span>
                    <span className="text-[10px] sm:text-xs font-bold text-primary">{healthPJ.projected && healthPJ.runway >= 12 ? '12+' : healthPJ.runway.toFixed(1)} meses</span>
                </div>
                <div className="w-full bg-line rounded-full h-2 mb-1">
                    <div
                        className={`h-2 rounded-full transition-all duration-1000 ${healthPJ.runway < 3 ? 'bg-warning' : 'bg-primary'}`}
                        style={{ width: `${Math.min(healthPJ.runway * 10, 100)}%` }}
                    ></div>
                </div>
            </div>
            <div className="mt-4 text-center">
                 <button onClick={() => onNavigate('manual_pj')} className="text-xs sm:text-sm font-bold text-primary hover:underline">Ver Diário da Empresa &rarr;</button>
            </div>
        </div>

        {/* Card PF - VERDE */}
        <div className="bg-surface rounded-2xl shadow-brand-sm p-6 border-l-8 border-success relative overflow-hidden group hover:shadow-brand-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xs sm:text-sm font-bold text-success uppercase tracking-widest">Pessoa Física</h3>
                    <p className="text-[10px] sm:text-xs text-muted">Survival & Gastos Pessoais</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 bg-surface-2 border-line text-success`}>
                    <span>{statusPF.icon}</span> <span className="hidden sm:inline">{statusPF.label}</span>
                </div>
            </div>

            <div className="mb-4 bg-success-soft p-4 rounded-xl border border-line shadow-brand-sm">
                <p className="text-2xl sm:text-3xl font-display font-bold text-ink truncate font-mono tabular-nums">{formatCurrency(healthPF.balance)}</p>
                <p className="text-[10px] sm:text-sm text-muted">Saldo disponível</p>
            </div>

            <div className="bg-surface-2 rounded-xl p-4 border border-line">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] sm:text-xs font-bold text-muted">Reserva Pessoal{healthPF.projected ? ' · projetada' : ''}</span>
                    <span className="text-[10px] sm:text-xs font-bold text-success">{healthPF.projected && healthPF.runway >= 12 ? '12+' : healthPF.runway.toFixed(1)} meses</span>
                </div>
                <div className="w-full bg-line rounded-full h-2 mb-1">
                    <div
                        className={`h-2 rounded-full transition-all duration-1000 ${healthPF.runway < 3 ? 'bg-warning' : 'bg-success'}`}
                        style={{ width: `${Math.min(healthPF.runway * 10, 100)}%` }}
                    ></div>
                </div>
            </div>
            <div className="mt-4 text-center">
                 <button onClick={() => onNavigate('manual_pf')} className="text-xs sm:text-sm font-bold text-success hover:underline">Ver Diário Pessoal &rarr;</button>
            </div>
        </div>
      </div>
      
      {/* Quick Actions Grid - Responsivo (2 ou 4 colunas) */}
      <h3 className="text-xl font-display font-bold text-ink mb-6">Acesso Rápido</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <button onClick={() => onNavigate('manual_pj')} className="p-4 sm:p-5 bg-surface border border-line rounded-2xl hover:shadow-brand-md hover:border-primary transition-all text-left group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-soft rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </div>
            <p className="font-bold text-muted text-xs sm:text-sm">Novo Lançamento</p>
         </button>

         <button onClick={() => onNavigate('accountability')} className="p-4 sm:p-5 bg-surface border border-line rounded-2xl hover:shadow-brand-md hover:border-success transition-all text-left group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success-soft rounded-2xl flex items-center justify-center mb-4 group-hover:bg-success group-hover:text-white transition-colors text-success">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l5.414 5.414a1 1 0 01.586 1.414V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <p className="font-bold text-muted text-xs sm:text-sm">Prestar Contas</p>
         </button>

         <button onClick={() => onNavigate('import')} className="p-4 sm:p-5 bg-surface border border-line rounded-2xl hover:shadow-brand-md hover:border-accent transition-all text-left group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent-soft rounded-2xl flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-colors text-accent">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <p className="font-bold text-muted text-xs sm:text-sm">Diagnóstico IA</p>
         </button>

         <button onClick={() => onNavigate('planning')} className="p-4 sm:p-5 bg-surface border border-line rounded-2xl hover:shadow-brand-md hover:border-warning transition-all text-left group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning-soft rounded-2xl flex items-center justify-center mb-4 group-hover:bg-warning group-hover:text-white transition-colors text-warning">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            </div>
            <p className="font-bold text-muted text-xs sm:text-sm">Projetar Futuro</p>
         </button>
      </div>
    </div>
  );
};

export default DashboardHome;
