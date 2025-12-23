
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, ProjectMetadata, BudgetLineItem, ProjectStage, ExpenseNature, BankAccount } from '../types';
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
  onDeleteTransaction?: (id: string) => void;
  viewContext: 'PF' | 'PJ';
  customCategories: string[];
  onAddCategory: (category: string) => void;
  projects?: ProjectMetadata[];
  accounts?: BankAccount[];
  onAddAccount?: (account: BankAccount) => void;
  onGenerateInvoice?: (transactionId: string) => void;
}

const ManualManager: React.FC<ManualManagerProps> = ({ 
    transactions, setTransactions, onDeleteTransaction, viewContext, customCategories, onAddCategory, 
    projects = [], accounts = [], onAddAccount, onGenerateInvoice 
}) => {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[today.getMonth()]);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  
  const [visibleCount, setVisibleCount] = useState(20);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
  const [hasInvoice, setHasInvoice] = useState(false); 
  const [editId, setEditId] = useState<string | null>(null);

  const themeColor = viewContext === 'PF' ? 'govgreen' : 'govblue';
  const themeText = viewContext === 'PF' ? 'text-govgreen' : 'text-[#1d357d]';
  const themeBorder = viewContext === 'PF' ? 'border-govgreen' : 'border-[#1d357d]';
  const themeButton = viewContext === 'PF' ? 'bg-govgreen hover:bg-green-700' : 'bg-[#1d357d] hover:bg-blue-900';

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

  useEffect(() => { 
    if (!editId) setCategory(availableCategories[0]); 
  }, [type, viewContext, availableCategories, editId]);

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

  const handleBudgetLineSelect = (lineId: string) => {
      setBudgetLineId(lineId);
      const line = selectedProjectBudgetLines.find(l => l.id === lineId);
      if (line) setCategory(line.expenseItem);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const cleanAmount = amount.replace(/\./g, '').replace(',', '.');
    const numAmount = parseFloat(cleanAmount);
    
    if (isNaN(numAmount)) {
        alert("Por favor, insira um valor numérico válido.");
        return;
    }

    let finalProjectName = selectedProjectId === 'custom' ? customProjectName : (activeProject?.name || '');
    let linkedBudgetLine = budgetLineId ? selectedProjectBudgetLines.find(l => l.id === budgetLineId) : undefined;

    const newTx: Transaction = {
        id: editId || generateId(),
        description,
        amount: numAmount,
        type,
        category,
        project: finalProjectName,
        projectId: selectedProjectId !== 'custom' && selectedProjectId !== '' ? selectedProjectId : undefined,
        supplierDoc,
        paymentDoc: hasInvoice ? paymentDoc : '',
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
    
    setSelectedMonth(MONTHS[formDate.getMonth()]);
    setSelectedYear(formDate.getFullYear());

    resetForm();
  };

  const resetForm = () => {
    setDescription(''); setAmount(''); setSelectedProjectId(''); setCustomProjectName(''); setBudgetLineId(''); setSupplierDoc(''); setPaymentDoc(''); setEditId(null); setHasInvoice(false);
    setFormDate(new Date());
  };

  const handleEditClick = (t: Transaction) => {
    const tDate = new Date(t.date);
    setDescription(t.description);
    setAmount(t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setType(t.type);
    setCategory(t.category);
    setFormDate(tDate);
    if (t.projectId) { setSelectedProjectId(t.projectId); setCustomProjectName(''); setBudgetLineId(t.budgetLineId || ''); }
    else if (t.project) { setSelectedProjectId('custom'); setCustomProjectName(t.project); }
    else setSelectedProjectId('');
    setSupplierDoc(t.supplierDoc || ''); 
    setPaymentDoc(t.paymentDoc || '');
    setHasInvoice(!!t.paymentDoc);
    if (t.accountId) setSelectedAccountId(t.accountId);
    setEditId(t.id);
  };

  const handleDuplicateClick = (t: Transaction) => {
      const duplicated = { ...t, id: generateId(), date: new Date().toISOString() };
      setTransactions(prev => [...prev, duplicated]);
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

  const currentMonthTotals = useMemo(() => currentMonthTransactions.reduce((acc, curr) => {
      if (curr.type === 'inflow') acc.inflow += curr.amount; else acc.outflow += curr.amount;
      return acc;
  }, { inflow: 0, outflow: 0 }), [currentMonthTransactions]);

  const EditModal = () => {
    if (!editId) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
        <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in-up border-t-8 border-orange-400">
           <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter leading-none">Editar Lançamento</h3>
                  <p className="text-[10px] font-bold text-orange-500 uppercase mt-1 tracking-widest">Alteração de Registro Existente</p>
                </div>
                <button onClick={resetForm} className="text-gray-400 hover:text-red-500 transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              <form onSubmit={handleSaveTransaction} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative" ref={datePickerRef}>
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">Data</label>
                    <button type="button" onClick={() => setIsDatePickerOpen(!isDatePickerOpen)} className="w-full flex items-center justify-between rounded-2xl border px-4 py-3 text-sm bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white font-bold transition-all hover:border-orange-400">{formDate.toLocaleDateString('pt-BR')}</button>
                    {isDatePickerOpen && <DatePicker />}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">Valor (R$)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-xs font-bold text-gray-400">R$</span>
                      <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl border text-sm bg-white dark:bg-slate-900 dark:text-white font-black outline-none focus:ring-2 focus:ring-orange-400" required />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">Descrição</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-2xl border px-4 py-3 text-sm bg-white dark:bg-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-orange-400" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">Categoria</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-2xl border px-4 py-3 text-sm bg-white dark:bg-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-orange-400">
                      {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                   </div>
                   <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">Projeto</label>
                    <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="w-full rounded-2xl border px-4 py-3 text-sm bg-white dark:bg-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-orange-400">
                      <option value="">Sem Projeto</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      <option value="custom">Outro</option>
                    </select>
                   </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={resetForm} className="flex-1 py-4 bg-gray-100 dark:bg-slate-700 text-gray-500 font-black rounded-2xl uppercase text-xs tracking-widest">Cancelar</button>
                  <button type="submit" className="flex-[2] py-4 bg-orange-500 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-lg shadow-orange-200 dark:shadow-none hover:bg-orange-600 transition-all">Salvar Alterações</button>
                </div>
              </form>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up pb-12 px-2 sm:px-0">
      <EditModal />

      <div className={`mb-8 border-l-8 ${themeBorder} bg-white dark:bg-slate-800 rounded-r-3xl shadow-sm p-6 flex flex-col md:flex-row justify-between items-center gap-6`}>
        <div><h2 className={`text-3xl font-black ${themeText} tracking-tighter uppercase`}>DIÁRIO: {viewContext === 'PF' ? 'PESSOAL' : 'EMPRESA'}</h2><p className="text-sm text-gray-500 mt-1 font-bold tracking-widest opacity-60 uppercase">Controle de Lançamentos</p></div>
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
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Novo Registro</h3>
                <span className={`w-3 h-3 rounded-full animate-pulse ${viewContext === 'PF' ? 'bg-govgreen' : 'bg-govblue'}`}></span>
            </div>
            
            <form onSubmit={handleSaveTransaction} className="space-y-5">
              <div className="relative" ref={datePickerRef}>
                <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">Data</label>
                <button type="button" onClick={() => setIsDatePickerOpen(!isDatePickerOpen)} className="w-full flex items-center justify-between rounded-2xl border px-4 py-3 text-sm bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white font-bold transition-all hover:border-govblue">{formDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</button>
                {isDatePickerOpen && <DatePicker />}
              </div>
              
              <div><label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">Descrição</label><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Pagamento Cachê Show" className="w-full rounded-2xl border px-4 py-3 text-sm bg-white dark:bg-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-govblue" required /></div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">Valor (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-xs font-bold text-gray-400">R$</span>
                  <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="w-full pl-10 pr-4 py-3 rounded-2xl border text-sm bg-white dark:bg-slate-900 dark:text-white font-black outline-none focus:ring-2 focus:ring-govblue" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4"><button type="button" onClick={() => setType('inflow')} className={`py-3 text-xs font-black rounded-2xl border-2 transition-all ${type === 'inflow' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-gray-50 border-transparent text-gray-400 opacity-60'}`}>ENTRADA</button><button type="button" onClick={() => setType('outflow')} className={`py-3 text-xs font-black rounded-2xl border-2 transition-all ${type === 'outflow' ? 'bg-red-50 border-red-500 text-red-700 shadow-sm' : 'bg-gray-50 border-transparent text-gray-400 opacity-60'}`}>SAÍDA</button></div>
              
              <div><label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">Vincular Projeto</label><select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="w-full rounded-2xl border px-4 py-3 text-sm bg-white dark:bg-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-govblue"><option value="">Sem Projeto / Administrativo</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}<option value="custom">Outro (Digitar Nome)</option></select></div>
              
              {selectedProjectId === 'custom' && (
                  <input type="text" value={customProjectName} onChange={e => setCustomProjectName(e.target.value)} placeholder="Nome do Projeto Especial" className="w-full rounded-xl border px-4 py-2 text-xs bg-gray-50 dark:bg-slate-900 dark:text-white mt-1" />
              )}

              {viewContext === 'PJ' && selectedProjectBudgetLines.length > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                    <label className="block text-[10px] font-black text-[#1d357d] mb-2 uppercase tracking-widest">Rubrica Orçamentária</label>
                    <select value={budgetLineId} onChange={(e) => handleBudgetLineSelect(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-xs bg-white dark:bg-slate-900 dark:text-white font-bold"><option value="">-- Vincular Rubrica --</option>{selectedProjectBudgetLines.map(line => <option key={line.id} value={line.id}>{line.expenseItem}</option>)}</select>
                  </div>
              )}

              <div><label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">Categoria</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-2xl border px-4 py-3 text-sm bg-white dark:bg-slate-900 dark:text-white font-bold">{availableCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>

              <div className="pt-2">
                  <button type="submit" className={`w-full py-4 px-4 rounded-2xl shadow-xl text-sm font-black text-white uppercase tracking-widest transform transition-transform active:scale-95 ${themeButton}`}>+ Adicionar no Diário</button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
             <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border flex flex-col justify-between"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Entradas {selectedMonth}</p><p className="text-2xl font-black text-emerald-600">{formatCurrency(currentMonthTotals.inflow)}</p></div>
             <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border flex flex-col justify-between"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saídas {selectedMonth}</p><p className="text-2xl font-black text-red-500">{formatCurrency(currentMonthTotals.outflow)}</p></div>
             <div className={`${themeButton} p-6 rounded-[2rem] shadow-xl text-white flex flex-col justify-between transform transition-transform hover:scale-[1.02]`}><p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Saldo Final Mês</p><p className="text-2xl font-black">{formatCurrency(currentMonthTotals.inflow - currentMonthTotals.outflow)}</p></div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl border overflow-hidden flex flex-col h-[650px]">
            <div className="px-8 py-5 border-b flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest">Extrato de Lançamentos</h3>
                <span className="text-[10px] font-black text-gray-400 uppercase bg-white dark:bg-slate-800 px-3 py-1 rounded-full border">{currentMonthTransactions.length} ITENS</span>
            </div>
            <div className="flex-grow overflow-y-auto custom-scroll">
                {sortedTransactions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-400 space-y-4">
                        <span className="text-5xl">📅</span>
                        <div><p className="text-sm font-black uppercase tracking-widest">Nenhum lançamento</p><p className="text-xs font-medium">Inicie o registro do seu mês no formulário ao lado.</p></div>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-white dark:bg-slate-800 shadow-sm z-10"><tr className="text-[10px] font-black text-gray-400 uppercase border-b"><th className="px-8 py-4">Data</th><th className="px-4 py-4">Descrição & Projeto</th><th className="px-8 py-4 text-right">Valor</th><th className="px-6 py-4 text-center">Ações</th></tr></thead>
                        <tbody className="divide-y">{visibleTransactions.map(t => (
                            <tr key={t.id} className={`transition-all hover:bg-gray-50 dark:hover:bg-slate-700/50 group`}>
                                <td className="px-8 py-5 text-xs font-black text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white transition-colors">
                                    {new Date(t.date).getDate().toString().padStart(2, '0')}/{MONTHS[new Date(t.date).getMonth()].substring(0,3)}
                                </td>
                                <td className="px-4 py-5">
                                    <div className="text-sm font-black text-gray-800 dark:text-gray-200">{t.description}</div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 flex items-center gap-2">
                                        <span className="bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[9px]">{t.category}</span>
                                        {t.project && <span className="text-govblue dark:text-blue-400 truncate max-w-[150px]">#{t.project}</span>}
                                    </div>
                                </td>
                                <td className={`px-8 py-5 text-right font-black text-sm ${t.type === 'inflow' ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {t.type === 'inflow' ? '+' : '-'} {formatCurrency(t.amount)}
                                </td>
                                <td className="px-6 py-5 text-center min-w-[200px]">
                                    <div className="flex items-center justify-center gap-2 transition-opacity">
                                        {deletingId === t.id ? (
                                            <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/30 p-1 rounded-xl border border-red-200 dark:border-red-800 animate-fade-in">
                                                <span className="text-[9px] font-black text-red-600 px-2 uppercase">Excluir?</span>
                                                <button onClick={() => { onDeleteTransaction?.(t.id); setDeletingId(null); }} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-red-700 transition-colors">SIM</button>
                                                <button onClick={() => setDeletingId(null)} className="bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-gray-300 transition-colors">NÃO</button>
                                            </div>
                                        ) : (
                                            <>
                                                {t.type === 'inflow' && t.category === 'Cachê Artístico/Serviço' && viewContext === 'PJ' && (
                                                    <button onClick={() => onGenerateInvoice?.(t.id)} className="p-2.5 bg-govblue/10 dark:bg-slate-700 rounded-xl text-govblue dark:text-blue-400 hover:bg-govblue hover:text-white transition-all shadow-sm" title="Gerar Espelho de Nota Fiscal">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l5.414 5.414a1 1 0 01.586 1.414V19a2 2 0 01-2 2z"></path></svg>
                                                    </button>
                                                )}
                                                <button onClick={() => handleEditClick(t)} className="p-2.5 bg-blue-50 dark:bg-slate-700 rounded-xl text-govblue dark:text-blue-400 hover:bg-govblue hover:text-white transition-all shadow-sm" title="Editar">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                </button>
                                                <button onClick={() => setDeletingId(t.id)} className="p-2.5 bg-red-50 dark:bg-slate-700 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Excluir">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                )}
            </div>
            {sortedTransactions.length > visibleCount && (
                <div className="p-4 text-center border-t bg-gray-50 dark:bg-slate-900/30">
                    <button onClick={() => setVisibleCount(prev => prev + 20)} className="text-xs font-black text-gray-400 hover:text-govblue uppercase tracking-widest">Carregar Mais ↓</button>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualManager;
