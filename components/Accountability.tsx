
import React, { useState, useMemo } from 'react';
import { Transaction, ProjectMetadata, BudgetLineItem, ProjectStage, ExpenseNature } from '../types';
import { maskCpfCnpj } from './ManualManager'; 
import { generateId } from '../App'; 
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Folder, CloudArrowDown, ArrowLeft, Plus, ChartBar, Receipt, PencilSimple, Trash } from '@phosphor-icons/react';

interface AccountabilityProps {
  transactions: Transaction[];
  projects: ProjectMetadata[];
  onSaveProject: (project: ProjectMetadata) => void;
  onDeleteTransaction?: (id: string) => void;
  onEditTransaction?: (id: string) => void;
}

const COLORS = ['#0E6E6A', '#B14A2C', '#E2864D', '#1F7A5C', '#2E6F9E', '#949A99'];

const isValidCpfCnpj = (val: string): boolean => {
    if (!val) return false;
    const clean = val.replace(/\D/g, '');
    if (clean.length !== 11 && clean.length !== 14) return false;
    if (/^(\d)\1+$/.test(clean)) return false;
    return true;
};

const Accountability: React.FC<AccountabilityProps> = ({ transactions, projects, onSaveProject, onDeleteTransaction, onEditTransaction }) => {
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
      <div className="bg-surface rounded-3xl shadow-brand-sm border border-line p-8 mb-6 border-l-8 border-primary">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div><h2 className="text-3xl font-display font-bold text-ink mb-2">Gestor Cultural</h2><p className="text-muted max-w-2xl">Acompanhamento e Prestação de Contas Simplificada.</p></div>
            <div className="w-full md:w-64"><label className="block text-xs font-bold text-muted mb-1 uppercase tracking-wide">Projeto Ativo</label><select value={selectedProjectId} onChange={(e) => { setSelectedProjectId(e.target.value); if(!e.target.value) setViewMode('select'); }} className="w-full rounded-xl border border-line px-3 py-2 text-sm font-bold bg-surface text-ink font-sans"><option value="">-- Escolha um Projeto --</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
         </div>
      </div>

      {!activeProjectData ? (
          <div className="animate-fade-in" key={viewMode}>
              {viewMode === 'select' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-10">
                      <button onClick={() => setViewMode('register')} className="bg-surface p-8 rounded-3xl shadow-brand-sm border-2 border-transparent hover:border-primary text-left"><div className="w-16 h-16 bg-primary-soft rounded-2xl flex items-center justify-center mb-6 text-primary"><Folder size={28} weight="duotone" /></div><h3 className="text-xl font-display font-bold mb-2 text-ink">Novo Projeto</h3><p className="text-sm text-muted">Cadastre rubricas e metas orçamentárias.</p></button>
                      <button onClick={() => setViewMode('import')} className="bg-surface p-8 rounded-3xl shadow-brand-sm border-2 border-transparent hover:border-accent text-left"><div className="w-16 h-16 bg-accent-soft rounded-2xl flex items-center justify-center mb-6 text-accent"><CloudArrowDown size={28} weight="duotone" /></div><h3 className="text-xl font-display font-bold mb-2 text-ink">Importar Dados</h3><p className="text-sm text-muted">Puxar do Mapa Cultural.</p></button>
                  </div>
              )}
              {viewMode === 'register' && (
                  <div className="max-w-4xl mx-auto bg-surface rounded-3xl shadow-brand-md border border-line p-8 mt-6">
                      <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2 text-ink"><button onClick={() => setViewMode('select')} className="p-2 hover:bg-surface-2 rounded-full"><ArrowLeft size={20} /></button> Cadastro</h3>
                      <form onSubmit={handleSaveProjectInternal} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="md:col-span-2"><label className="block text-sm font-bold mb-2 text-ink">Nome do Projeto</label><input type="text" required value={newProject.name || ''} onChange={e => setNewProject({...newProject, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-line bg-surface-2 text-ink" /></div>
                              <div><label className="block text-sm font-bold mb-2 text-ink">CPF/CNPJ</label><input type="text" required value={newProject.proponentDoc || ''} onChange={e => setNewProject({...newProject, proponentDoc: maskCpfCnpj(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-line bg-surface-2 text-ink" /></div>
                              <div><label className="block text-sm font-bold mb-2 text-ink">Edital</label><select value={newProject.legislation} onChange={e => setNewProject({...newProject, legislation: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-line bg-surface-2 text-ink"><option value="LPG">Lei Paulo Gustavo</option><option value="PNAB">Aldir Blanc (PNAB)</option><option value="Outros">Outros</option></select></div>
                          </div>
                          <div className="border-t border-line pt-6">
                              <h4 className="font-bold mb-4 text-ink">Plano de Trabalho</h4>
                              <div className="p-4 bg-surface-2 rounded-xl mb-4 border border-dashed border-line">
                                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                                      <div className="md:col-span-4"><label className="text-[10px] font-bold uppercase text-subtle">Item</label><input type="text" value={lineItem} onChange={e => setLineItem(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm bg-surface text-ink" /></div>
                                      <div className="md:col-span-4"><label className="text-[10px] font-bold uppercase text-subtle">Natureza</label><select value={lineNature} onChange={e => setLineNature(e.target.value as ExpenseNature)} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm bg-surface text-ink"><option>Cachê</option><option>Serviço (PF/PJ)</option><option>Material de Consumo</option><option>Bens Duráveis</option></select></div>
                                      <div className="md:col-span-4"><label className="text-[10px] font-bold uppercase text-subtle">Valor</label><input type="number" value={lineValue} onChange={e => setLineValue(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm bg-surface text-ink" /></div>
                                  </div>
                                  <button type="button" onClick={() => { if(!lineItem || !lineValue) return; setBudgetLines([...budgetLines, { id: generateId(), activity: 'Geral', expenseItem: lineItem, stage: lineStage, nature: lineNature, plannedAmount: parseFloat(lineValue) }]); setLineItem(''); setLineValue(''); }} className="w-full py-2 bg-primary text-primary-on rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Plus size={14} weight="bold" /> Adicionar Rubrica</button>
                              </div>
                              {budgetLines.map(line => (<div key={line.id} className="flex justify-between items-center py-2 border-b border-line"><span className="text-sm font-bold text-ink">{line.expenseItem}</span><div className="flex items-center gap-4"><span className="text-sm font-bold font-mono tabular-nums text-ink">{formatCurrency(line.plannedAmount)}</span><button type="button" onClick={() => setBudgetLines(budgetLines.filter(l => l.id !== line.id))} className="text-error"><Trash size={16} /></button></div></div>))}
                          </div>
                          <button type="submit" className="w-full py-4 bg-primary text-primary-on font-bold rounded-xl shadow-brand-md">Salvar Projeto</button>
                      </form>
                  </div>
              )}
          </div>
      ) : (
        <div className="animate-fade-in" key={activeTab}>
            <div className="flex space-x-1 mb-6 bg-surface-2 p-1 rounded-xl w-fit">
                <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${activeTab === 'dashboard' ? 'bg-surface shadow-brand-sm text-primary' : 'text-muted'}`}><ChartBar size={16} weight="duotone" /> Execução Orçamentária</button>
                <button onClick={() => setActiveTab('report')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${activeTab === 'report' ? 'bg-surface shadow-brand-sm text-primary' : 'text-muted'}`}><Receipt size={16} weight="duotone" /> Extrato Financeiro</button>
            </div>

            {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-surface p-6 rounded-2xl shadow-brand-sm border-l-4 border-primary"><p className="text-xs font-bold text-subtle uppercase">Orçado Total</p><p className="text-2xl font-bold mt-1 font-mono tabular-nums text-ink">{formatCurrency(totalBudget)}</p></div>
                        <div className="bg-surface p-6 rounded-2xl shadow-brand-sm border-l-4 border-accent"><p className="text-xs font-bold text-subtle uppercase">Realizado</p><p className="text-2xl font-bold mt-1 font-mono tabular-nums text-error">{formatCurrency(totalExecuted)}</p></div>
                        <div className="bg-surface p-6 rounded-2xl shadow-brand-sm border-l-4 border-success"><p className="text-xs font-bold text-subtle uppercase">Saldo em Conta</p><p className="text-2xl font-bold mt-1 font-mono tabular-nums text-success">{formatCurrency(balance)}</p></div>
                    </div>
                    <div className="bg-surface p-6 rounded-3xl border border-line shadow-brand-sm">
                        <h3 className="font-bold mb-6 uppercase tracking-wider text-sm border-b border-line pb-2 text-ink">Acompanhamento por Item</h3>
                        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="text-subtle uppercase text-[10px] font-bold border-b border-line"><th className="px-4 py-3">Rubrica</th><th className="px-4 py-3 text-right">Planejado</th><th className="px-4 py-3 text-right">Executado</th><th className="px-4 py-3 text-right">Saldo</th><th className="px-4 py-3 text-center">Progresso</th></tr></thead><tbody className="divide-y divide-line">{budgetExecutionDetails.map(item => (<tr key={item.id} className="hover:bg-surface-2"><td className="px-4 py-4 font-bold text-ink">{item.expenseItem}</td><td className="px-4 py-4 text-right font-medium font-mono tabular-nums text-ink">{formatCurrency(item.plannedAmount)}</td><td className="px-4 py-4 text-right font-bold font-mono tabular-nums text-error">{formatCurrency(item.realizedAmount)}</td><td className="px-4 py-4 text-right font-bold font-mono tabular-nums text-ink">{formatCurrency(item.remaining)}</td><td className="px-4 py-4 min-w-[120px]"><div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden"><div className={`h-1.5 rounded-full ${item.percentage > 100 ? 'bg-error' : 'bg-primary'}`} style={{ width: `${Math.min(item.percentage, 100)}%` }}></div></div></td></tr>))}</tbody></table></div>
                    </div>
                </div>
            )}

            {activeTab === 'report' && (
                <div className="animate-fade-in bg-surface rounded-2xl shadow-brand-sm border border-line overflow-hidden">
                    <table className="min-w-full text-xs text-left">
                        <thead className="bg-surface-2 uppercase font-extrabold text-subtle"><tr className="border-b border-line"><th className="px-6 py-4">Data</th><th className="px-6 py-4">Rubrica</th><th className="px-6 py-4">Fornecedor / Detalhe</th><th className="px-6 py-4 text-right">Valor Pago</th><th className="px-6 py-4 text-right">Ações</th></tr></thead>
                        <tbody className="divide-y divide-line">{projectTransactions.filter(t => t.type === 'outflow').map(t => (
                            <tr key={t.id} className="hover:bg-surface-2 transition-colors"><td className="px-6 py-4 text-ink">{new Date(t.date).toLocaleDateString()}</td><td className="px-6 py-4 font-bold text-ink">{activeProjectData.budgetLines?.find(l => l.id === t.budgetLineId)?.expenseItem || 'Geral'}</td><td className="px-6 py-4 text-ink">{t.description}</td><td className="px-6 py-4 text-right font-bold font-mono tabular-nums text-error">{formatCurrency(t.amount)}</td><td className="px-6 py-4 text-right flex justify-end gap-2"><button onClick={() => onEditTransaction?.(t.id)} className="p-1.5 hover:bg-primary-soft rounded text-primary" title="Editar"><PencilSimple size={16} /></button><button onClick={() => onDeleteTransaction?.(t.id)} className="p-1.5 hover:bg-error-soft rounded text-error" title="Excluir"><Trash size={16} /></button></td></tr>
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
