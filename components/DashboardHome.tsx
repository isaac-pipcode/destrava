import React, { useMemo } from 'react';
import { Transaction } from '../types';

interface DashboardHomeProps {
  onNavigate: (view: 'import' | 'manual' | 'accountability' | 'manual_pf' | 'manual_pj') => void;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigate, transactions, setTransactions }) => {
  
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

  const loadDemoData = () => {
      const today = new Date();
      const currentMonth = today.toLocaleString('pt-BR', { month: 'long' });
      const monthStr = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);

      const demoData: Transaction[] = [
          // PJ Data
          { id: '1', description: 'Cachê Sesc - Show Solo', amount: 8500, type: 'inflow', category: 'Cachê Artístico/Serviço', project: 'Turnê 2025', date: today.toISOString(), month: monthStr, entity: 'PJ', paymentDoc: 'NF 102', supplierDoc: '00.000.000/0001-91' },
          { id: '2', description: '1ª Parcela LPG', amount: 30000, type: 'inflow', category: 'Edital/Lei de Incentivo', project: 'Curta Metragem', date: today.toISOString(), month: monthStr, entity: 'PJ', paymentDoc: 'OB 20239', supplierDoc: 'MinC' },
          { id: '3', description: 'Aluguel Câmera Red', amount: 4500, type: 'outflow', category: 'Equipamentos/Software', project: 'Curta Metragem', date: today.toISOString(), month: monthStr, entity: 'PJ', paymentDoc: 'Pix E293', supplierDoc: '22.333.444/0001-88' },
          { id: '4', description: 'DAS MEI', amount: 75, type: 'outflow', category: 'Impostos (MEI/Simples)', project: 'Administrativo', date: today.toISOString(), month: monthStr, entity: 'PJ' },
          
          // PF Data
          { id: '5', description: 'Transferência de Lucro (PJ p/ PF)', amount: 4000, type: 'inflow', category: 'Outros', project: 'Pessoal', date: today.toISOString(), month: monthStr, entity: 'PF' },
          { id: '6', description: 'Aluguel Apartamento', amount: 1800, type: 'outflow', category: 'Outros', project: 'Pessoal', date: today.toISOString(), month: monthStr, entity: 'PF' },
          { id: '7', description: 'Supermercado Mensal', amount: 900, type: 'outflow', category: 'Alimentação', project: 'Pessoal', date: today.toISOString(), month: monthStr, entity: 'PF' },
      ];
      setTransactions(demoData);
  };

  return (
    <div className="animate-fade-in-up">
      {/* Modern Artistic Hero Banner */}
      <div className="w-full h-48 rounded-3xl mb-10 relative overflow-hidden bg-gradient-to-r from-govblue via-[#0d6db8] to-govgreen shadow-lg">
        {/* Abstract Shapes Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full transform translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-20 w-64 h-64 bg-govorange opacity-10 rounded-full transform translate-y-1/2 blur-2xl"></div>
        <div className="absolute top-10 left-10 w-20 h-20 bg-white opacity-10 rounded-full blur-xl"></div>
        
        <div className="relative z-10 h-full flex flex-col justify-center px-10">
            <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-[10px] font-bold uppercase tracking-widest border border-white/20">
                    Sustentabilidade
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-[10px] font-bold uppercase tracking-widest border border-white/20">
                    Gestão
                </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight max-w-2xl">
                Por uma gestão saudável <br/>e sustentável
            </h2>
            <p className="text-white/80 mt-2 max-w-xl text-sm font-medium">
                Fortalecendo a economia criativa através do controle e inteligência financeira.
            </p>
        </div>
      </div>

      {/* Cards de Saúde Financeira Separados */}
      <div className="flex justify-between items-end mb-4 px-2">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Visão Geral dos Saldos</h3>
        {transactions.length === 0 && (
            <button 
            onClick={loadDemoData}
            className="text-sm font-bold text-govblue dark:text-blue-400 hover:text-govorange underline transition-colors"
            >
            Carregar dados de exemplo (Demo)
            </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        
        {/* Card PJ - AZUL */}
        <div className="bg-blue-50/30 dark:bg-slate-800 rounded-2xl shadow-sm p-6 border-l-8 border-govblue relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-bold text-govblue dark:text-blue-400 uppercase tracking-widest">Pessoa Jurídica (MEI/ME)</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Projetos, Editais e Notas Fiscais</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 bg-white dark:bg-slate-700 border-blue-200 dark:border-slate-600 text-govblue dark:text-blue-400`}>
                    <span>{statusPJ.icon}</span> <span>{statusPJ.label}</span>
                </div>
            </div>
            
            <div className="mb-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-100 dark:border-slate-700 shadow-sm">
                <p className="text-3xl font-display font-bold text-gray-800 dark:text-white">{formatCurrency(healthPJ.balance)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Saldo em Caixa</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-blue-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-1 group relative">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1 cursor-help">
                        Fôlego Financeiro (Runway)
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </span>
                    {/* Tooltip Explanation */}
                    <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-xl hidden group-hover:block z-20">
                        <p className="font-bold mb-1">Cálculo do Fôlego:</p>
                        <p>Saldo Atual ÷ Média de Gastos Mensais</p>
                        <p className="mt-1 text-gray-300">Indica quantos meses a empresa sobrevive sem novos contratos.</p>
                    </div>
                    <span className="text-xs font-bold text-govblue dark:text-blue-400">{healthPJ.runway.toFixed(1)} meses</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mb-2">
                    <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${healthPJ.runway < 3 ? 'bg-govorange' : 'bg-govblue'}`} 
                        style={{ width: `${Math.min(healthPJ.runway * 10, 100)}%` }}
                    ></div>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Média de custos fixos: {formatCurrency(healthPJ.avgMonthlyExpenses)}/mês</p>
            </div>
            <div className="mt-4 text-center">
                 <button onClick={() => onNavigate('manual_pj')} className="text-sm font-bold text-govblue dark:text-blue-400 hover:underline">Ir para Diário PJ &rarr;</button>
            </div>
        </div>

        {/* Card PF - VERDE */}
        <div className="bg-green-50/30 dark:bg-slate-800 rounded-2xl shadow-sm p-6 border-l-8 border-govgreen relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-bold text-govgreen uppercase tracking-widest">Pessoa Física</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Gastos pessoais e Patrimônio</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 bg-white dark:bg-slate-700 border-green-200 dark:border-slate-600 text-govgreen`}>
                    <span>{statusPF.icon}</span> <span>{statusPF.label}</span>
                </div>
            </div>
            
            <div className="mb-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-green-100 dark:border-slate-700 shadow-sm">
                <p className="text-3xl font-display font-bold text-gray-800 dark:text-white">{formatCurrency(healthPF.balance)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Disponível</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-green-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-1 group relative">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1 cursor-help">
                        Reserva Pessoal
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </span>
                    <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-xl hidden group-hover:block z-20">
                        <p className="font-bold mb-1">Cálculo da Reserva:</p>
                        <p>Saldo Atual ÷ Média de Gastos Pessoais</p>
                        <p className="mt-1 text-gray-300">Indica quantos meses você mantém seu padrão de vida sem renda.</p>
                    </div>
                    <span className="text-xs font-bold text-govgreen">{healthPF.runway.toFixed(1)} meses</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mb-2">
                    <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${healthPF.runway < 3 ? 'bg-govorange' : 'bg-govgreen'}`} 
                        style={{ width: `${Math.min(healthPF.runway * 10, 100)}%` }}
                    ></div>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Custo de vida médio: {formatCurrency(healthPF.avgMonthlyExpenses)}/mês</p>
            </div>
            <div className="mt-4 text-center">
                 <button onClick={() => onNavigate('manual_pf')} className="text-sm font-bold text-govgreen hover:underline">Ir para Diário PF &rarr;</button>
            </div>
        </div>
      </div>
      
      {/* Quick Actions Grid */}
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Acesso Rápido</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <button onClick={() => onNavigate('manual_pj')} className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:shadow-md hover:border-govblue dark:hover:border-blue-500 transition-all text-left group">
            <div className="w-10 h-10 bg-blue-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3 group-hover:bg-govblue group-hover:text-white transition-colors text-govblue dark:text-blue-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </div>
            <p className="font-bold text-gray-700 dark:text-gray-200 text-sm">Lançar PJ</p>
         </button>

         <button onClick={() => onNavigate('accountability')} className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:shadow-md hover:border-govgreen dark:hover:border-green-500 transition-all text-left group">
            <div className="w-10 h-10 bg-green-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3 group-hover:bg-govgreen group-hover:text-white transition-colors text-govgreen dark:text-green-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l5.414 5.414a1 1 0 01.586 1.414V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <p className="font-bold text-gray-700 dark:text-gray-200 text-sm">Prestação de Contas</p>
         </button>

         <button onClick={() => onNavigate('import')} className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:shadow-md hover:border-govorange transition-all text-left group">
            <div className="w-10 h-10 bg-orange-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3 group-hover:bg-govorange group-hover:text-white transition-colors text-govorange">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <p className="font-bold text-gray-700 dark:text-gray-200 text-sm">Análise IA</p>
         </button>
      </div>
    </div>
  );
};

export default DashboardHome;