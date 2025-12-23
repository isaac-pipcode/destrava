
import React, { useState, useMemo } from 'react';
import { Transaction, ProjectMetadata, BudgetLineItem, ProjectStage, ExpenseNature } from '../types';
import { maskCpfCnpj } from './ManualManager'; 
import { generateId } from '../App'; 
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface AccountabilityProps {
  transactions: Transaction[];
  projects: ProjectMetadata[];
  onSaveProject: (project: ProjectMetadata) => void;
}

const COLORS = ['#1351b4', '#009a44', '#f37021', '#475569', '#94a3b8', '#e2e8f0'];

const isValidCpfCnpj = (val: string): boolean => {
    if (!val) return false;
    const clean = val.replace(/\D/g, '');
    if (clean.length !== 11 && clean.length !== 14) return false;
    if (/^(\d)\1+$/.test(clean)) return false;
    return true; // Simplified for core logic review
};

const Accountability: React.FC<AccountabilityProps> = ({ transactions, projects, onSaveProject }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report' | 'guide'>('dashboard');
  const [viewMode, setViewMode] = useState<'select' | 'register' | 'import'>('select');
  
  const [newProject, setNewProject] = useState<Partial<ProjectMetadata>>({ legislation: 'LPG', budget: 0 });
  const [budgetLines, setBudgetLines] = useState<BudgetLineItem[]>([]);
  const [lineActivity, setLineActivity] = useState('');
  const [lineItem, setLineItem] = useState('');
  const [lineStage, setLineStage] = useState<ProjectStage>('Produção');
  const [lineNature, setLineNature] = useState<ExpenseNature>('Serviço (PF/PJ)');
  const [lineValue, setLineValue] = useState('');

  const activeProjectData = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);

  const projectTransactions = useMemo(() => {
    if (!activeProjectData) return [];
    return transactions
      .filter(t => t.projectId === activeProjectData.id)
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, activeProjectData]);

  const budgetExecutionDetails = useMemo(() => {
    if (!activeProjectData || !activeProjectData.budgetLines) return [];
    return activeProjectData.budgetLines.map(line => {
      const realized = projectTransactions
        .filter(t => t.budgetLineId === line.id && t.type === 'outflow')
        .reduce((acc, t) => acc + t.amount, 0);
      return {
        ...line,
        realizedAmount: realized,
        remaining: line.plannedAmount - realized,
        percentage: line.plannedAmount > 0 ? (realized / line.plannedAmount) * 100 : 0
      };
    });
  }, [activeProjectData, projectTransactions]);

  const totalBudget = activeProjectData ? activeProjectData.budget : 0;
  const totalExecuted = projectTransactions.reduce((acc, t) => t.type === 'outflow' ? acc + t.amount : acc, 0);
  const totalInflowRealized = projectTransactions.reduce((acc, t) => t.type === 'inflow' ? acc + t.amount : acc, 0);
  const balance = totalInflowRealized - totalExecuted;

  const stageData = useMemo(() => {
    const grouped: Record<string, number> = {};
    projectTransactions.filter(t => t.type === 'outflow').forEach(t => {
      const stage = t.projectStage || 'Não Classificado';
      grouped[stage] = (grouped[stage] || 0) + t.amount;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [projectTransactions]);

  const handleSaveProjectInternal = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newProject.name || !newProject.proponentDoc) return;
      const calculatedBudget = budgetLines.reduce((acc, curr) => acc + curr.plannedAmount, 0);
      onSaveProject({
          id: newProject.id || generateId(),
          name: newProject.name,
          legislation: newProject.legislation || 'LPG',
          budget: calculatedBudget,
          startDate: newProject.startDate || new Date().toISOString(),
          origin: newProject.origin || 'manual',
          budgetLines,
          proponentDoc: newProject.proponentDoc
      });
      setViewMode('select');
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="animate-fade-in-up pb-12">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border p-8 mb-6 border-l-8 border-govblue">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div><h2 className="text-3xl font-display font-bold text-gray-800 dark:text-white mb-2">Gestor Cultural</h2><p className="text-gray-500 dark:text-gray-400 max-w-2xl">Acompanhamento e Prestação de Contas Simplificada.</p></div>
            <div className="w-full md:w-64"><label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Projeto Ativo</label><select value={selectedProjectId} onChange={(e) => { setSelectedProjectId(e.target.value); if(!e.target.value) setViewMode('select'); }} className="w-full rounded-xl border px-3 py-2 text-sm font-bold bg-white dark:bg-slate-700 dark:text-white font-sans"><option value="">-- Escolha um Projeto --</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
         </div>
      </div>

      {!activeProjectData ? (
          <div className="animate-fade-in" key={viewMode}>
              {viewMode === 'select' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-10">
                      <button onClick={() => setViewMode('register')} className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border-2 border-transparent hover:border-govblue text-left"><div className="w-16 h-16 bg-blue-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-6 text-govblue">📂</div><h3 className="text-xl font-bold mb-2">Novo Projeto</h3><p className="text-sm text-gray-500">Cadastre rubricas e metas orçamentárias.</p></button>
                      <button onClick={() => setViewMode('import')} className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border-2 border-transparent hover:border-govorange text-left"><div className="w-16 h-16 bg-orange-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-6 text-govorange">☁️</div><h3 className="text-xl font-bold mb-2">Importar Dados</h3><p className="text-sm text-gray-500">Puxar do Mapa Cultural.</p></button>
                  </div>
              )}
              {viewMode === 'register' && (
                  <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-lg border p-8 mt-6">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><button onClick={() => setViewMode('select')} className="p-2 hover:bg-gray-100 rounded-full">←</button> Cadastro</h3>
                      <form onSubmit={handleSaveProjectInternal} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="md:col-span-2"><label className="block text-sm font-bold mb-2">Nome do Projeto</label><input type="text" required value={newProject.name || ''} onChange={e => setNewProject({...newProject, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border dark:bg-slate-900" /></div>
                              <div><label className="block text-sm font-bold mb-2">CPF/CNPJ</label><input type="text" required value={newProject.proponentDoc || ''} onChange={e => setNewProject({...newProject, proponentDoc: maskCpfCnpj(e.target.value)})} className="w-full px-4 py-3 rounded-xl border dark:bg-slate-900" /></div>
                              <div><label className="block text-sm font-bold mb-2">Edital</label><select value={newProject.legislation} onChange={e => setNewProject({...newProject, legislation: e.target.value})} className="w-full px-4 py-3 rounded-xl border dark:bg-slate-900"><option value="LPG">Lei Paulo Gustavo</option><option value="PNAB">Aldir Blanc (PNAB)</option><option value="Outros">Outros</option></select></div>
                          </div>
                          <div className="border-t pt-6">
                              <h4 className="font-bold mb-4">Plano de Trabalho</h4>
                              <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl mb-4 border border-dashed">
                                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                                      <div className="md:col-span-4"><label className="text-[10px] font-bold uppercase text-gray-400">Item</label><input type="text" value={lineItem} onChange={e => setLineItem(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm dark:bg-slate-800" /></div>
                                      <div className="md:col-span-4"><label className="text-[10px] font-bold uppercase text-gray-400">Natureza</label><select value={lineNature} onChange={e => setLineNature(e.target.value as ExpenseNature)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm dark:bg-slate-800"><option>Cachê</option><option>Serviço (PF/PJ)</option><option>Material de Consumo</option><option>Bens Duráveis</option></select></div>
                                      <div className="md:col-span-4"><label className="text-[10px] font-bold uppercase text-gray-400">Valor</label><input type="number" value={lineValue} onChange={e => setLineValue(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm dark:bg-slate-800" /></div>
                                  </div>
                                  <button type="button" onClick={() => { if(!lineItem || !lineValue) return; setBudgetLines([...budgetLines, { id: generateId(), activity: 'Geral', expenseItem: lineItem, stage: lineStage, nature: lineNature, plannedAmount: parseFloat(lineValue) }]); setLineItem(''); setLineValue(''); }} className="w-full py-2 bg-govblue text-white rounded-lg text-xs font-bold">+ Adicionar Rubrica</button>
                              </div>
                              {budgetLines.map(line => (<div key={line.id} className="flex justify-between items-center py-2 border-b"><span className="text-sm font-bold">{line.expenseItem}</span><div className="flex items-center gap-4"><span className="text-sm font-bold">{formatCurrency(line.plannedAmount)}</span><button type="button" onClick={() => setBudgetLines(budgetLines.filter(l => l.id !== line.id))} className="text-red-500">×</button></div></div>))}
                          </div>
                          <button type="submit" className="w-full py-4 bg-govblue text-white font-bold rounded-xl shadow-lg">Salvar Projeto</button>
                      </form>
                  </div>
              )}
          </div>
      ) : (
        <div className="animate-fade-in" key={activeTab}>
            <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-slate-700 p-1 rounded-xl w-fit">
                <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white shadow text-govblue' : 'text-gray-500'}`}>📊 Execução Orçamentária</button>
                <button onClick={() => setActiveTab('report')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'report' ? 'bg-white shadow text-govblue' : 'text-gray-500'}`}>📑 Extrato Financeiro</button>
            </div>

            {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-govblue"><p className="text-xs font-bold text-gray-400 uppercase">Orçado Total</p><p className="text-2xl font-bold mt-1">{formatCurrency(totalBudget)}</p></div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-govorange"><p className="text-xs font-bold text-gray-400 uppercase">Realizado</p><p className="text-2xl font-bold mt-1 text-red-600">{formatCurrency(totalExecuted)}</p></div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-govgreen"><p className="text-xs font-bold text-gray-400 uppercase">Saldo em Conta</p><p className="text-2xl font-bold mt-1 text-govgreen">{formatCurrency(balance)}</p></div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border shadow-sm">
                        <h3 className="font-bold mb-6 uppercase tracking-wider text-sm border-b pb-2">Acompanhamento por Item</h3>
                        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="text-gray-400 uppercase text-[10px] font-bold border-b"><th className="px-4 py-3">Rubrica</th><th className="px-4 py-3 text-right">Planejado</th><th className="px-4 py-3 text-right">Executado</th><th className="px-4 py-3 text-right">Saldo</th><th className="px-4 py-3 text-center">Progresso</th></tr></thead><tbody className="divide-y">{budgetExecutionDetails.map(item => (<tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50"><td className="px-4 py-4 font-bold">{item.expenseItem}</td><td className="px-4 py-4 text-right font-medium">{formatCurrency(item.plannedAmount)}</td><td className="px-4 py-4 text-right font-bold text-red-500">{formatCurrency(item.realizedAmount)}</td><td className="px-4 py-4 text-right font-bold">{formatCurrency(item.remaining)}</td><td className="px-4 py-4 min-w-[120px]"><div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden"><div className={`h-1.5 rounded-full ${item.percentage > 100 ? 'bg-red-500' : 'bg-govblue'}`} style={{ width: `${Math.min(item.percentage, 100)}%` }}></div></div></td></tr>))}</tbody></table></div>
                    </div>
                </div>
            )}

            {activeTab === 'report' && (
                <div className="animate-fade-in bg-white dark:bg-slate-800 rounded-2xl shadow-sm border overflow-hidden">
                    <table className="min-w-full text-xs text-left">
                        <thead className="bg-gray-100 uppercase font-black text-gray-400"><tr className="border-b"><th className="px-6 py-4">Data</th><th className="px-6 py-4">Rubrica</th><th className="px-6 py-4">Fornecedor</th><th className="px-6 py-4 text-right">Valor Pago</th></tr></thead>
                        <tbody className="divide-y">{projectTransactions.filter(t => t.type === 'outflow').map(t => (
                            <tr key={t.id} className="hover:bg-gray-50"><td className="px-6 py-4">{new Date(t.date).toLocaleDateString()}</td><td className="px-6 py-4 font-bold">{activeProjectData.budgetLines?.find(l => l.id === t.budgetLineId)?.expenseItem || 'Geral'}</td><td className="px-6 py-4">{t.description}</td><td className="px-6 py-4 text-right font-bold text-red-500">{formatCurrency(t.amount)}</td></tr>
                        ))}</tbody>
                    </table>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Accountability;
