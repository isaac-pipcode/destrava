
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, ProjectMetadata, BudgetLineItem, BankAccount, BankName } from '../types';
import { generateId } from '../App';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const PJ_CATEGORIES_IN = ['Cachê Artístico/Serviço', 'Edital/Lei de Incentivo', 'Venda de Obras/Ingressos', 'Aporte de Sócio', 'Outros'];
const PJ_CATEGORIES_OUT = ['Produção/Material', 'Equipamentos/Software', 'Impostos (MEI/Simples)', 'Contabilidade/Jurídico', 'Aluguel de Espaço/Sede', 'Marketing/Divulgação', 'Pró-labore/Distribuição Lucro', 'Transporte/Logística', 'Taxas Bancárias', 'Outros'];
const PF_CATEGORIES_IN = ['Pró-labore/Retirada da PJ', 'Cachê (Pessoa Física)', 'Salário/Emprego CLT', 'Rendimentos/Investimentos', 'Presentes/Doações Recebidas', 'Reembolsos', 'Outros'];
const PF_CATEGORIES_OUT = ['Habitação (Aluguel/Condomínio)', 'Alimentação/Mercado', 'Saúde/Farmácia', 'Transporte/Combustível', 'Educação/Cursos', 'Lazer/Cultura', 'Família/Filhos', 'Assinaturas/Serviços (Net/Luz)', 'Vestuário/Cuidados Pessoais', 'Doações/Apoios', 'Investimentos/Poupança', 'Outros'];

export const maskCpfCnpj = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 14) v = v.substring(0, 14);
    if (v.length <= 11) {
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
        v = v.replace(/^(\d{2})(\d)/, "$1.$2");
        v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
        v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
        v = v.replace(/(\d{4})(\d)/, "$1-$2");
    }
    return v;
};

interface ManualManagerProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  viewContext: 'PF' | 'PJ';
  customCategories: string[];
  onAddCategory: (category: string) => void;
  projects?: ProjectMetadata[];
  accounts?: BankAccount[];
  onAddAccount?: (account: BankAccount) => void;
}

const ManualManager: React.FC<ManualManagerProps> = ({ 
    transactions, setTransactions, viewContext, customCategories, onAddCategory, 
    projects = [], accounts = [], onAddAccount 
}) => {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[today.getMonth()]);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  
  const [visibleCount, setVisibleCount] = useState(20);

  // --- FORM STATE ---
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'inflow' | 'outflow'>('inflow');
  const [category, setCategory] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  
  const [formDate, setFormDate] = useState<Date>(today);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [customProjectName, setCustomProjectName] = useState('');
  const [budgetLineId, setBudgetLineId] = useState('');

  const [supplierDoc, setSupplierDoc] = useState('');
  const [paymentDoc, setPaymentDoc] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const themeColor = viewContext === 'PF' ? 'govgreen' : 'govblue';
  const themeText = viewContext === 'PF' ? 'text-govgreen' : 'text-govblue';
  const themeBorder = viewContext === 'PF' ? 'border-govgreen' : 'border-govblue';
  const themeButton = viewContext === 'PF' ? 'bg-govgreen hover:bg-green-700' : 'bg-govblue hover:bg-blue-800';

  const contextAccounts = useMemo(() => accounts.filter(a => a.entityType === viewContext), [accounts, viewContext]);

  useEffect(() => {
      if (contextAccounts.length > 0 && !selectedAccountId) setSelectedAccountId(contextAccounts[0].id);
  }, [contextAccounts, selectedAccountId]);

  const availableCategories = useMemo(() => {
      let baseList = viewContext === 'PF' 
        ? (type === 'inflow' ? PF_CATEGORIES_IN : PF_CATEGORIES_OUT)
        : (type === 'inflow' ? PJ_CATEGORIES_IN : PJ_CATEGORIES_OUT);
      return [...baseList, ...customCategories];
  }, [viewContext, type, customCategories]);

  useEffect(() => { setCategory(availableCategories[0]); }, [type, viewContext, availableCategories]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) setIsMonthPickerOpen(false);
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) setIsDatePickerOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
  const selectedProjectBudgetLines = useMemo(() => activeProject?.budgetLines || [], [activeProject]);

  const currentBudgetLineBalance = useMemo(() => {
    if (!budgetLineId || !activeProject) return null;
    const line = selectedProjectBudgetLines.find(l => l.id === budgetLineId);
    if (!line) return null;
    const executed = transactions
        .filter(t => t.budgetLineId === budgetLineId && t.type === 'outflow' && t.id !== editId)
        .reduce((acc, t) => acc + t.amount, 0);
    return line.plannedAmount - executed;
  }, [budgetLineId, selectedProjectBudgetLines, transactions, activeProject, editId]);

  const handleBudgetLineSelect = (lineId: string) => {
      setBudgetLineId(lineId);
      const line = selectedProjectBudgetLines.find(l => l.id === lineId);
      if (line) setCategory(line.expenseItem);
      else setCategory(availableCategories[0] || '');
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const numAmount = parseFloat(amount.replace(',', '.'));
    let finalProjectName = selectedProjectId === 'custom' ? customProjectName : (activeProject?.name || '');

    let linkedBudgetLine: BudgetLineItem | undefined;
    if (budgetLineId) linkedBudgetLine = selectedProjectBudgetLines.find(l => l.id === budgetLineId);

    const newTx: Transaction = {
        id: editId || generateId(),
        description,
        amount: numAmount,
        type,
        category,
        project: finalProjectName,
        projectId: selectedProjectId !== 'custom' && selectedProjectId !== '' ? selectedProjectId : undefined,
        supplierDoc,
        paymentDoc,
        date: formDate.toISOString(),
        month: MONTHS[formDate.getMonth()],
        entity: viewContext,
        budgetLineId: budgetLineId || undefined,
        projectStage: linkedBudgetLine?.stage,
        projectNature: linkedBudgetLine?.nature,
        accountId: selectedAccountId
    };

    if (editId) setTransactions(prev => prev.map(t => t.id === editId ? newTx : t));
    else setTransactions(prev => [...prev, newTx]);
    
    // Reset view to saved date
    setSelectedMonth(MONTHS[formDate.getMonth()]);
    setSelectedYear(formDate.getFullYear());

    // Reset Form
    setDescription(''); setAmount(''); setSelectedProjectId(''); setCustomProjectName(''); setBudgetLineId(''); setSupplierDoc(''); setPaymentDoc(''); setEditId(null);
    setFormDate(new Date());
  };

  const handleEditClick = (t: Transaction) => {
    const tDate = new Date(t.date);
    setDescription(t.description);
    setAmount(t.amount.toString());
    setType(t.type);
    setCategory(t.category);
    setFormDate(tDate);
    if (t.projectId) { setSelectedProjectId(t.projectId); setCustomProjectName(''); setBudgetLineId(t.budgetLineId || ''); }
    else if (t.project) { setSelectedProjectId('custom'); setCustomProjectName(t.project); }
    else setSelectedProjectId('');
    setSupplierDoc(t.supplierDoc || ''); setPaymentDoc(t.paymentDoc || '');
    if (t.accountId) setSelectedAccountId(t.accountId);
    setEditId(t.id);
    setSelectedMonth(t.month);
    setSelectedYear(tDate.getFullYear());
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const DatePicker = () => {
    const [viewDate, setViewDate] = useState(new Date(formDate));
    const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const years = useMemo(() => {
        const arr = [];
        for (let y = today.getFullYear() - 10; y <= today.getFullYear() + 10; y++) arr.push(y);
        return arr;
    }, []);

    return (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 p-4 z-[100] animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
                <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500">←</button>
                <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-gray-800 dark:text-white uppercase">{MONTHS[viewDate.getMonth()]}</span>
                    <select value={viewDate.getFullYear()} onChange={e => setViewDate(new Date(parseInt(e.target.value), viewDate.getMonth(), 1))} className="bg-transparent border-none text-sm font-bold text-gray-800 dark:text-white focus:ring-0 p-0">
                        {years.map(y => <option key={y} value={y} className="dark:bg-slate-800">{y}</option>)}
                    </select>
                </div>
                <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500">→</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {WEEKDAYS_SHORT.map(wd => <div key={wd} className="text-[10px] font-bold text-gray-400 uppercase">{wd}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {days.map(day => {
                    const isSelected = day === formDate.getDate() && viewDate.getMonth() === formDate.getMonth() && viewDate.getFullYear() === formDate.getFullYear();
                    const isToday = day === today.getDate() && viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
                    return (
                        <button key={day} type="button" onClick={() => { setFormDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)); setIsDatePickerOpen(false); }} className={`h-8 w-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${isSelected ? `${themeButton} text-white shadow-md` : isToday ? `border-2 border-${themeColor} ${themeText}` : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                            {day}
                        </button>
                    );
                })}
            </div>
            <button type="button" onClick={() => { const now = new Date(); setFormDate(now); setViewDate(new Date(now.getFullYear(), now.getMonth(), 1)); setIsDatePickerOpen(false); }} className={`w-full mt-4 py-1.5 text-[10px] font-black uppercase rounded-lg border-2 border-dashed ${themeBorder} ${themeText}`}>Ir para Hoje</button>
        </div>
    );
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const currentEntityTransactions = useMemo(() => transactions.filter(t => t.entity === viewContext), [transactions, viewContext]);
  const currentMonthTransactions = useMemo(() => currentEntityTransactions.filter(t => {
      const tDate = new Date(t.date);
      return t.month === selectedMonth && tDate.getFullYear() === selectedYear;
  }), [currentEntityTransactions, selectedMonth, selectedYear]);
  const sortedTransactions = useMemo(() => [...currentMonthTransactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [currentMonthTransactions]);
  const visibleTransactions = useMemo(() => sortedTransactions.slice(0, visibleCount), [sortedTransactions, visibleCount]);

  const previousBalance = useMemo(() => {
      const startOfView = new Date(selectedYear, MONTHS.indexOf(selectedMonth), 1);
      return currentEntityTransactions.reduce((acc, t) => new Date(t.date) < startOfView ? acc + (t.type === 'inflow' ? t.amount : -t.amount) : acc, 0);
  }, [currentEntityTransactions, selectedMonth, selectedYear]);

  const currentMonthTotals = useMemo(() => currentMonthTransactions.reduce((acc, curr) => {
      if (curr.type === 'inflow') acc.inflow += curr.amount; else acc.outflow += curr.amount;
      return acc;
  }, { inflow: 0, outflow: 0 }), [currentMonthTransactions]);

  const accumulatedBalance = useMemo(() => previousBalance + (currentMonthTotals.inflow - currentMonthTotals.outflow), [previousBalance, currentMonthTotals]);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up pb-12 px-2 sm:px-0">
      <div className={`mb-8 border-l-8 ${themeBorder} bg-white dark:bg-slate-800 rounded-r-3xl shadow-sm p-6 flex flex-col md:flex-row justify-between items-center gap-6`}>
        <div><h2 className={`text-3xl font-black ${themeText} tracking-tighter uppercase`}>DIÁRIO: {viewContext === 'PF' ? 'PESSOAL' : 'EMPRESA'}</h2><p className="text-sm text-gray-500 mt-1 font-bold tracking-widest opacity-60 uppercase">Fluxo de Caixa Mensal</p></div>
        <div className="w-full sm:w-auto relative" ref={monthPickerRef}>
          <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-900 rounded-2xl shadow-inner border border-gray-100 p-1.5">
             <button onClick={() => { const idx = MONTHS.indexOf(selectedMonth); if(idx === 0) { setSelectedMonth(MONTHS[11]); setSelectedYear(v => v-1); } else setSelectedMonth(MONTHS[idx-1]); }} className="p-2.5 rounded-xl hover:bg-white text-gray-500 shadow-sm transition-all">←</button>
             <div className="px-6 py-2 cursor-pointer flex flex-col items-center" onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}><span className={`text-lg font-black ${themeText}`}>{selectedMonth}</span><span className="text-gray-400 text-[10px] font-bold tracking-widest">{selectedYear}</span></div>
             <button onClick={() => { const idx = MONTHS.indexOf(selectedMonth); if(idx === 11) { setSelectedMonth(MONTHS[0]); setSelectedYear(v => v+1); } else setSelectedMonth(MONTHS[idx+1]); }} className="p-2.5 rounded-xl hover:bg-white text-gray-500 shadow-sm transition-all">→</button>
          </div>
          {isMonthPickerOpen && (
              <div className="absolute right-0 top-full mt-3 w-full sm:w-80 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border p-5 z-50 animate-fade-in-up">
                  <div className="grid grid-cols-3 gap-2">{MONTHS.map((m) => (<button key={m} onClick={() => { setSelectedMonth(m); setIsMonthPickerOpen(false); }} className={`py-3 rounded-xl text-xs font-bold transition-all ${selectedMonth === m ? `${themeButton} text-white shadow-lg` : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>{m.substring(0, 3)}</button>))}</div>
              </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className={`bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl p-8 border-t-8 ${themeBorder} relative overflow-hidden`}>
            <h3 className="text-xl font-black text-gray-800 dark:text-white mb-8 pb-4 border-b uppercase">{editId ? 'Editar Item' : 'Novo Lançamento'}</h3>
            <form onSubmit={handleSaveTransaction} className="space-y-5">
              <div className="relative" ref={datePickerRef}>
                <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">Data</label>
                <button type="button" onClick={() => setIsDatePickerOpen(!isDatePickerOpen)} className="w-full flex items-center justify-between rounded-2xl border px-4 py-3 text-sm bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white font-bold transition-all hover:border-govblue">{formDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</button>
                {isDatePickerOpen && <DatePicker />}
              </div>
              <div><label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">Descrição</label><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-2xl border px-4 py-3 text-sm dark:bg-slate-900 dark:text-white" required /></div>
              <div><label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">Valor (R$)</label><input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-2xl border px-4 py-3 text-sm dark:bg-slate-900 dark:text-white" required /></div>
              <div className="grid grid-cols-2 gap-4"><button type="button" onClick={() => setType('inflow')} className={`py-3 text-xs font-black rounded-2xl border-2 ${type === 'inflow' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-gray-50 border-transparent text-gray-400'}`}>ENTRADA</button><button type="button" onClick={() => setType('outflow')} className={`py-3 text-xs font-black rounded-2xl border-2 ${type === 'outflow' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-gray-50 border-transparent text-gray-400'}`}>SAÍDA</button></div>
              <div><label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">Projeto</label><select value={selectedProjectId} onChange={(e) => { setSelectedProjectId(e.target.value); setBudgetLineId(''); }} className="w-full rounded-2xl border px-4 py-3 text-sm dark:bg-slate-900 dark:text-white"><option value="">Geral / Administrativo</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}<option value="custom">Outro...</option></select></div>
              {viewContext === 'PJ' && selectedProjectBudgetLines.length > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100">
                    <label className="block text-[10px] font-black text-govblue mb-2 uppercase tracking-widest">Rubrica Orçamentária</label>
                    <select value={budgetLineId} onChange={(e) => handleBudgetLineSelect(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-xs bg-white dark:bg-slate-900 dark:text-white">{optionPrefix}{selectedProjectBudgetLines.map(line => <option key={line.id} value={line.id}>{line.expenseItem}</option>)}</select>
                    {currentBudgetLineBalance !== null && <p className={`mt-2 text-[10px] font-bold ${currentBudgetLineBalance < 0 ? 'text-red-500' : 'text-govblue'}`}>Saldo Restante: {formatCurrency(currentBudgetLineBalance)}</p>}
                  </div>
              )}
              <div><label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">Categoria</label><select value={category} onChange={(e) => setCategory(e.target.value)} disabled={!!budgetLineId} className="w-full rounded-2xl border px-4 py-3 text-sm dark:bg-slate-900 dark:text-white">{availableCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <button type="submit" className={`w-full py-4 px-4 rounded-2xl shadow-xl text-sm font-black text-white uppercase tracking-widest ${themeButton}`}>{editId ? 'Salvar Alterações' : '+ Adicionar Lançamento'}</button>
              {editId && <button type="button" onClick={() => { setEditId(null); setDescription(''); setAmount(''); setSelectedProjectId(''); setFormDate(new Date()); }} className="w-full text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest">Cancelar Edição</button>}
            </form>
          </div>
        </div>
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
             <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border flex flex-col justify-between"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saldo Anterior</p><p className={`text-2xl font-black ${previousBalance >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-500'}`}>{formatCurrency(previousBalance)}</p></div>
             <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border flex flex-col justify-between"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Resultado Mês</p><p className={`text-2xl font-black ${currentMonthTotals.inflow - currentMonthTotals.outflow >= 0 ? themeText : 'text-red-500'}`}>{formatCurrency(currentMonthTotals.inflow - currentMonthTotals.outflow)}</p></div>
             <div className={`${accumulatedBalance >= 0 ? themeButton : 'bg-red-500'} p-6 rounded-[2rem] shadow-xl text-white flex flex-col justify-between`}><p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Saldo Acumulado</p><p className="text-2xl font-black">{formatCurrency(accumulatedBalance)}</p></div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl border overflow-hidden flex flex-col h-[600px]">
            <div className="px-8 py-5 border-b flex justify-between items-center bg-gray-50 dark:bg-slate-900/50"><h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest">Extrato Detalhado</h3><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{currentMonthTransactions.length} ITENS</span></div>
            <div className="flex-grow overflow-y-auto custom-scroll">
                {sortedTransactions.length === 0 ? (<div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-40">📂<p className="text-sm font-bold uppercase tracking-widest">Nenhum registro</p></div>) : (
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-white dark:bg-slate-800 shadow-sm z-10"><tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b"><th className="px-8 py-4">DIA</th><th className="px-4 py-4">DESCRIÇÃO</th><th className="px-8 py-4 text-right">VALOR</th></tr></thead>
                        <tbody className="divide-y">{visibleTransactions.map(t => (<tr key={t.id} onClick={() => handleEditClick(t)} className={`cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-slate-700/50 group ${editId === t.id ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}><td className="px-8 py-5 text-xs font-black text-gray-300 group-hover:text-govblue">{new Date(t.date).getDate().toString().padStart(2, '0')}</td><td className="px-4 py-5"><div className="text-sm font-black text-gray-800 dark:text-gray-200">{t.description}</div><div className="text-[10px] font-bold text-gray-400 uppercase">{t.category} {t.project && <span className="opacity-40 ml-1">• {t.project}</span>}</div></td><td className={`px-8 py-5 text-right font-black text-sm ${t.type === 'inflow' ? 'text-emerald-600' : 'text-red-500'}`}>{t.type === 'inflow' ? '+' : '-'} {formatCurrency(t.amount)}</td></tr>))}</tbody>
                    </table>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const optionPrefix = <option value="">-- Selecione a Rubrica --</option>;

export default ManualManager;
