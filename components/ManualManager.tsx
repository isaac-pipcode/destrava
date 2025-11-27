import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction } from '../types';
import { parseBankStatement } from '../services/geminiService';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const CATEGORIES = [
  'Cachê Artístico/Serviço',
  'Edital/Lei de Incentivo',
  'Venda de Obras/Ingressos',
  'Produção/Material',
  'Equipamentos/Software',
  'Impostos (MEI/Simples)',
  'Aluguel de Espaço',
  'Transporte/Viagem',
  'Alimentação',
  'Transferência entre Contas',
  'Outros'
];

interface ManualManagerProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  viewContext: 'PF' | 'PJ';
}

const ManualManager: React.FC<ManualManagerProps> = ({ transactions, setTransactions, viewContext }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'inflow' | 'outflow'>('inflow');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [project, setProject] = useState('');
  const [supplierDoc, setSupplierDoc] = useState('');
  const [paymentDoc, setPaymentDoc] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme Colors based on Context
  const themeColor = viewContext === 'PF' ? 'govgreen' : 'govblue';
  const themeBgLight = viewContext === 'PF' ? 'bg-green-50' : 'bg-blue-50';
  const themeText = viewContext === 'PF' ? 'text-govgreen' : 'text-govblue';
  const themeBorder = viewContext === 'PF' ? 'border-govgreen' : 'border-govblue';

  const handleEditClick = (t: Transaction) => {
    setDescription(t.description);
    setAmount(t.amount.toString());
    setType(t.type);
    setCategory(t.category);
    setProject(t.project || '');
    setSupplierDoc(t.supplierDoc || '');
    setPaymentDoc(t.paymentDoc || '');
    setEditId(t.id);
    setSelectedMonth(t.month);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    if (editId) {
      // Update existing
      setTransactions(prev => prev.map(t => {
        if (t.id === editId) {
          return {
            ...t,
            description,
            amount: parseFloat(amount.replace(',', '.')),
            type,
            category,
            project,
            supplierDoc,
            paymentDoc,
            entity: viewContext,
            month: selectedMonth
          };
        }
        return t;
      }));
      setEditId(null);
    } else {
      // Add new
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        description,
        amount: parseFloat(amount.replace(',', '.')), 
        type,
        category,
        project,
        supplierDoc,
        paymentDoc,
        date: new Date().toISOString(),
        month: selectedMonth,
        entity: viewContext // Lock to current view
      };
      setTransactions(prev => [...prev, newTransaction]);
    }
    
    // Reset form
    setDescription('');
    setAmount('');
    setProject('');
    setSupplierDoc('');
    setPaymentDoc('');
    setEditId(null);
  };

  const handleCancelEdit = () => {
    setDescription('');
    setAmount('');
    setProject('');
    setSupplierDoc('');
    setPaymentDoc('');
    setEditId(null);
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (editId === id) handleCancelEdit();
  };

  const handleStatementUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    setIsImporting(true);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsedItems = await parseBankStatement(text);
        
        if (parsedItems.length === 0) {
            setImportStatus({ msg: "Nenhuma transação identificada.", type: 'error' });
            return;
        }

        const monthCounts: Record<string, number> = {};

        const newTransactions: Transaction[] = parsedItems.map(item => {
           let itemMonth = selectedMonth;
           if (item.date) {
             const dateObj = new Date(item.date);
             if (!isNaN(dateObj.getTime())) {
                itemMonth = MONTHS[dateObj.getMonth()];
             }
           }
           monthCounts[itemMonth] = (monthCounts[itemMonth] || 0) + 1;

           return {
             id: crypto.randomUUID(),
             ...item,
             month: itemMonth,
             project: '',
             entity: viewContext // Force import to current view context
           };
        });

        const mostFrequentMonth = Object.keys(monthCounts).reduce((a, b) => monthCounts[a] > monthCounts[b] ? a : b);
        
        setTransactions(prev => [...prev, ...newTransactions]);
        setSelectedMonth(mostFrequentMonth);
        setImportStatus({ 
            msg: `${newTransactions.length} itens importados para ${viewContext}! Mês: ${mostFrequentMonth}.`, 
            type: 'success' 
        });
        
        if (fileInputRef.current) fileInputRef.current.value = '';

      } catch (error) {
        console.error(error);
        setImportStatus({ msg: "Erro ao ler arquivo. Use .CSV ou .TXT.", type: 'error' });
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  // Filter Transactions for CURRENT View Context ONLY
  const currentEntityTransactions = useMemo(() => {
    return transactions.filter(t => t.entity === viewContext);
  }, [transactions, viewContext]);

  // Filter by Month
  const currentMonthTransactions = useMemo(() => {
    return currentEntityTransactions.filter(t => t.month === selectedMonth);
  }, [currentEntityTransactions, selectedMonth]);

  // Totals for this view
  const totals = useMemo(() => {
    return currentMonthTransactions.reduce((acc, curr) => {
      if (curr.type === 'inflow') {
        acc.inflow += curr.amount;
      } else {
        acc.outflow += curr.amount;
      }
      return acc;
    }, { inflow: 0, outflow: 0 });
  }, [currentMonthTransactions]);

  // Relationship Logic: Check flow from the OTHER entity
  const otherEntity = viewContext === 'PF' ? 'PJ' : 'PF';
  const crossFlow = useMemo(() => {
     // Find transactions in the OTHER entity that might be related
     // E.g. if I am PF, I want to know if PJ sent money out to me.
     const otherTrans = transactions.filter(t => t.entity === otherEntity && t.month === selectedMonth);
     
     // Heuristic: Transfers usually have "Transferência" or "PF"/"PJ" in description or category
     if (viewContext === 'PF') {
         // Money coming from PJ (Outflows from PJ that are Inflows to PF logic)
         // Actually, we look at Inflows in PF that are categorized as Transfers/Income from PJ
         // OR we look at Outflows in PJ that match "Sócio" or "Retirada"
         const relatedOutflowsFromPJ = otherTrans
            .filter(t => t.type === 'outflow' && (t.category.includes('Impostos') === false)) // Exclude taxes
            .filter(t => t.description.toLowerCase().includes('sócio') || t.description.toLowerCase().includes('pf') || t.description.toLowerCase().includes('retirada') || t.category === 'Transferência entre Contas');
         
         const totalReceivedFromPJ = relatedOutflowsFromPJ.reduce((acc, t) => acc + t.amount, 0);
         return { label: `Retiradas da PJ (${selectedMonth})`, amount: totalReceivedFromPJ, direction: 'incoming' };
     } else {
         // Money sent to PJ (Inflows to PJ from PF? Rare. Usually 'Aporte')
         // Or Money sent to PF (Distribution)
         const relatedInflowsFromPF = otherTrans
             .filter(t => t.type === 'outflow' && t.description.toLowerCase().includes('aporte')); // PF outflowing to PJ
         
         const totalAporteFromPF = relatedInflowsFromPF.reduce((acc, t) => acc + t.amount, 0);
         return { label: `Aportes de PF (${selectedMonth})`, amount: totalAporteFromPF, direction: 'incoming' };
     }
  }, [transactions, viewContext, selectedMonth]);


  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up pb-12">
      {/* Context Header */}
      <div className={`mb-8 border-l-8 ${themeBorder} bg-white rounded-r-xl shadow-sm p-6 flex flex-col md:flex-row justify-between items-center`}>
        <div>
          <h2 className={`text-3xl font-display font-bold ${themeText}`}>
             Diário Financeiro: {viewContext === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
          </h2>
          <p className="text-gray-500 mt-1">
             {viewContext === 'PF' ? 'Controle seus gastos pessoais e sobrevivência.' : 'Gerencie editais, cachês, produção e impostos.'}
          </p>
        </div>
        
        <div className="flex items-center bg-gray-50 p-1 pr-4 rounded-full shadow-inner border border-gray-200 mt-4 md:mt-0">
          <div className="bg-white shadow-sm border border-gray-100 px-4 py-2 rounded-full mr-2">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Mês</span>
          </div>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent border-none text-gray-800 font-bold focus:ring-0 cursor-pointer min-w-[120px] text-lg"
          >
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input Form (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
           {/* Card Importação */}
           <div className={`rounded-2xl shadow-xl p-6 text-white relative overflow-hidden group ${viewContext === 'PF' ? 'bg-govgreen shadow-green-100' : 'bg-govblue shadow-blue-100'}`}>
            <h3 className="text-lg font-bold mb-2 relative z-10 font-display">
              Importar Extrato {viewContext}
            </h3>
            <p className="text-sm opacity-90 mb-6 relative z-10 font-light">
               Envie o arquivo .CSV ou .TXT do seu banco para processar lançamentos nesta conta.
            </p>
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleStatementUpload}
              className="hidden"
              accept=".csv,.txt"
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className={`w-full relative z-10 py-3 px-4 bg-white rounded-xl font-bold text-sm shadow-sm flex justify-center items-center gap-2 transition-colors ${themeText}`}
            >
              {isImporting ? 'Processando...' : 'Selecionar Arquivo'}
            </button>
          </div>
          
          {importStatus && (
              <div className={`p-4 rounded-xl text-sm border flex items-center gap-3 ${
                  importStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'
              }`}>
                  {importStatus.msg}
              </div>
          )}

          {/* Form Card */}
          <div className={`bg-white rounded-3xl shadow-sm p-8 border-t-8 ${themeBorder}`}>
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100">
                <h3 className="text-xl font-display font-bold text-gray-800">
                    {editId ? 'Editar Lançamento' : 'Novo Lançamento'}
                </h3>
                {editId && (
                    <button onClick={handleCancelEdit} className="text-xs text-red-500 hover:underline">Cancelar</button>
                )}
            </div>
            
            <form onSubmit={handleSaveTransaction} className="space-y-5">
              
              {/* Entity Indicator (Read Only) */}
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase">Conta Destino</span>
                  <span className={`text-sm font-bold ${themeText}`}>
                      {viewContext === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                  </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Descrição</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={viewContext === 'PF' ? "Ex: Aluguel, Mercado" : "Ex: Cachê, Fornecedor"}
                  className={`w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all bg-white focus:${themeBorder} focus:ring-${themeColor}`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className={`w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all bg-white focus:${themeBorder} focus:ring-${themeColor}`}
                  required
                />
              </div>

               {/* Project Field */}
               <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">
                    {viewContext === 'PJ' ? 'Projeto / Edital' : 'Fonte / Origem'}
                </label>
                <input 
                  type="text" 
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder={viewContext === 'PJ' ? "Ex: Lei Paulo Gustavo" : "Ex: Salário, Freelance"}
                  className={`w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all bg-white focus:${themeBorder} focus:ring-${themeColor}`}
                />
              </div>

              {/* Only show Gov Accountability fields if PJ */}
              {viewContext === 'PJ' && (
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Dados para Prestação de Contas</p>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">CPF/CNPJ Fornecedor</label>
                        <input 
                          type="text" 
                          value={supplierDoc}
                          onChange={(e) => setSupplierDoc(e.target.value)}
                          placeholder="00.000.000/0001-99"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-govblue"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Nº Doc (Pix/Cheque)</label>
                        <input 
                          type="text" 
                          value={paymentDoc}
                          onChange={(e) => setPaymentDoc(e.target.value)}
                          placeholder="Ex: NF 123"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-govblue"
                        />
                      </div>
                  </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Tipo</label>
                    <div className="flex rounded-xl bg-gray-100 p-1">
                      <button
                        type="button"
                        onClick={() => setType('inflow')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                          type === 'inflow' 
                            ? 'bg-white text-emerald-600 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Entrada
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('outflow')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                          type === 'outflow' 
                            ? 'bg-white text-red-500 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Saída
                      </button>
                    </div>
                 </div>
                 <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Categoria</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={`w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-1 bg-white focus:${themeBorder} focus:ring-${themeColor}`}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
              </div>

              <button 
                type="submit"
                className={`w-full py-4 px-4 rounded-xl shadow-lg text-sm font-bold text-white transition-all transform active:scale-95 mt-4 ${
                    viewContext === 'PF' ? 'bg-govgreen hover:bg-green-700' : 'bg-govblue hover:bg-blue-800'
                }`}
              >
                {editId ? 'Atualizar Lançamento' : '+ Adicionar'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Dashboard & List (8 columns) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Visual Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden">
               <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Entradas ({selectedMonth})</p>
               <p className="text-3xl font-display font-bold text-gray-900">{formatCurrency(totals.inflow)}</p>
             </div>
             
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden">
               <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Saídas ({selectedMonth})</p>
               <p className="text-3xl font-display font-bold text-gray-900">{formatCurrency(totals.outflow)}</p>
             </div>
             
             <div className={`p-6 rounded-3xl shadow-sm border flex flex-col justify-between h-32 relative overflow-hidden transition-colors ${
                 totals.inflow - totals.outflow >= 0 ? `${viewContext === 'PF' ? 'bg-govgreen' : 'bg-govblue'} text-white border-transparent` : 'bg-red-50 border-red-200'
             }`}>
               <p className={`text-xs font-bold uppercase tracking-widest ${
                   totals.inflow - totals.outflow >= 0 ? 'text-white/80' : 'text-red-700'
               }`}>Saldo do Mês</p>
               <p className={`text-3xl font-display font-bold ${
                   totals.inflow - totals.outflow >= 0 ? 'text-white' : 'text-red-600'
               }`}>
                 {formatCurrency(totals.inflow - totals.outflow)}
               </p>
             </div>
          </div>

          {/* Relationship / Cross Flow Visualization */}
          {crossFlow.amount > 0 && (
              <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-4 border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                      </div>
                      <div>
                          <p className="text-xs font-bold text-gray-500 uppercase">Fluxo Cruzado detectado</p>
                          <p className="text-sm font-medium text-gray-700">{crossFlow.label}</p>
                      </div>
                  </div>
                  <div className="text-right">
                       <span className="text-lg font-bold text-purple-700">{formatCurrency(crossFlow.amount)}</span>
                  </div>
              </div>
          )}

          {/* List Style */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[500px] flex flex-col">
            <div className={`px-8 py-6 border-b border-gray-100 flex justify-between items-center ${themeBgLight} bg-opacity-30 rounded-t-3xl`}>
              <h3 className="text-lg font-display font-bold text-gray-800">Lançamentos: {viewContext}</h3>
              <p className="text-xs text-gray-400 font-normal">Clique no item para editar</p>
            </div>
            
            {currentMonthTransactions.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Sem movimentações em {viewContext}</h4>
                <p className="text-gray-500 max-w-sm">Adicione receitas ou despesas para visualizar o fluxo deste mês.</p>
              </div>
            ) : (
              <div className="flex-grow overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-gray-100">
                    <tr>
                      <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Dia</th>
                      <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Descrição</th>
                      <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{viewContext === 'PJ' ? 'Projeto' : 'Origem'}</th>
                      <th className="px-8 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Valor</th>
                      <th className="px-4 py-4 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentMonthTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t) => (
                      <tr 
                        key={t.id} 
                        onClick={() => handleEditClick(t)}
                        className={`cursor-pointer transition-colors group ${editId === t.id ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-8 py-5 text-sm font-medium text-gray-500">
                           {t.date ? new Date(t.date).toLocaleDateString('pt-BR', {day: '2-digit'}) : '-'}
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-sm font-bold text-gray-800">{t.description}</div>
                           <div className="text-[10px] text-gray-400 mt-1">{t.category}</div>
                        </td>
                        <td className="px-8 py-5">
                          {t.project ? (
                             <span className={`px-2 py-1 rounded text-[10px] font-bold border ${themeBgLight} ${themeText} ${themeBorder} border-opacity-30`}>
                                {t.project}
                             </span>
                          ) : <span className="text-gray-300 text-xs">-</span>}
                        </td>
                        <td className={`px-8 py-5 text-right font-bold text-sm ${
                          t.type === 'inflow' ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          {t.type === 'inflow' ? '+' : '-'} {formatCurrency(t.amount)}
                        </td>
                        <td className="px-4 py-5 text-center">
                          <button 
                            onClick={(e) => handleDelete(t.id, e)}
                            className="p-2 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                            title="Apagar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualManager;