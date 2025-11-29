
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, ProjectMetadata, BudgetLineItem, BankAccount, BankName } from '../types';
import { parseBankStatement } from '../services/geminiService';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// PJ (Pessoa Jurídica) Categories
const PJ_CATEGORIES_IN = [
    'Cachê Artístico/Serviço',
    'Edital/Lei de Incentivo',
    'Venda de Obras/Ingressos',
    'Aporte de Sócio',
    'Outros'
];

const PJ_CATEGORIES_OUT = [
    'Produção/Material',
    'Equipamentos/Software',
    'Impostos (MEI/Simples)',
    'Contabilidade/Jurídico',
    'Aluguel de Espaço/Sede',
    'Marketing/Divulgação',
    'Pró-labore/Distribuição Lucro',
    'Transporte/Logística',
    'Taxas Bancárias',
    'Outros'
];

// PF (Pessoa Física) Categories
const PF_CATEGORIES_IN = [
    'Pró-labore/Retirada da PJ',
    'Cachê (Pessoa Física)',
    'Salário/Emprego CLT',
    'Rendimentos/Investimentos',
    'Presentes/Doações Recebidas',
    'Reembolsos',
    'Outros'
];

const PF_CATEGORIES_OUT = [
    'Habitação (Aluguel/Condomínio)',
    'Alimentação/Mercado',
    'Saúde/Farmácia',
    'Transporte/Combustível',
    'Educação/Cursos',
    'Lazer/Cultura',
    'Família/Filhos',
    'Assinaturas/Serviços (Net/Luz)',
    'Vestuário/Cuidados Pessoais',
    'Doações/Apoios',
    'Investimentos/Poupança',
    'Outros'
];

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
    // PJ IN
    'Cachê Artístico/Serviço': 'Recebimento por apresentações, shows, oficinas ou serviços prestados (NF).',
    'Edital/Lei de Incentivo': 'Recursos de editais (Lei Paulo Gustavo, Aldir Blanc, ProAC, Rouanet).',
    'Venda de Obras/Ingressos': 'Receita direta de bilheteria, venda de livros, obras de arte ou merch.',
    'Aporte de Sócio': 'Capital próprio investido na empresa para fluxo de caixa.',
    
    // PJ OUT
    'Produção/Material': 'Custos diretos do projeto (cenografia, figurino, locação, matéria-prima).',
    'Equipamentos/Software': 'Compra de bens duráveis (câmeras, instrumentos) e licenças digitais.',
    'Impostos (MEI/Simples)': 'Pagamento do DAS, taxas de emissão de nota e tributos.',
    'Contabilidade/Jurídico': 'Honorários de contador, advogado ou taxas administrativas.',
    'Aluguel de Espaço/Sede': 'Manutenção do local de trabalho ou estúdio.',
    'Marketing/Divulgação': 'Anúncios (Ads), gestão de redes sociais e assessoria de imprensa.',
    'Pró-labore/Distribuição Lucro': 'Remuneração dos sócios (transferência para conta PF).',
    'Transporte/Logística': 'Fretes, Uber corporativo, passagens e hospedagem de equipe.',
    'Taxas Bancárias': 'Tarifas de conta PJ, taxas de boleto ou maquininha.',

    // PF IN
    'Pró-labore/Retirada da PJ': 'Valores recebidos da sua própria empresa (MEI/ME).',
    'Cachê (Pessoa Física)': 'Trabalhos realizados como autônomo direto no CPF (RPA).',
    'Salário/Emprego CLT': 'Renda de vínculo empregatício formal.',
    'Rendimentos/Investimentos': 'Dividendos, lucros de aplicações ou aluguel de equipamentos.',
    'Presentes/Doações Recebidas': 'Apoio financeiro de familiares ou terceiros.',
    'Reembolsos': 'Devolução de despesas adiantadas.',

    // PF OUT
    'Habitação (Aluguel/Condomínio)': 'Aluguel de casa, IPTU, condomínio e contas residenciais.',
    'Alimentação/Mercado': 'Supermercado, feira e refeições diárias.',
    'Saúde/Farmácia': 'Planos de saúde, consultas, exames e medicamentos.',
    'Transporte/Combustível': 'Uber pessoal, gasolina, transporte público ou manutenção de carro.',
    'Educação/Cursos': 'Mensalidades escolares e material didático.',
    'Lazer/Cultura': 'Cinema, teatro, streaming, assinaturas e saídas.',
    'Família/Filhos': 'Despesas específicas com dependentes.',
    'Assinaturas/Serviços (Net/Luz)': 'Contas de consumo pessoal (Celular, Internet, Luz).',
    'Vestuário/Cuidados Pessoais': 'Roupas, calçados, cabeleireiro e higiene.',
    'Doações/Apoios': 'Contribuições para causas sociais ou ajuda a terceiros.',
    'Investimentos/Poupança': 'Valores guardados para reserva de emergência ou futuro.',
    
    'Outros': 'Movimentações gerais não classificadas acima.'
};

// --- HELPER: Mask CPF/CNPJ ---
export const maskCpfCnpj = (value: string) => {
    // Remove everything that is not a digit
    let v = value.replace(/\D/g, "");

    if (v.length > 14) {
        v = v.substring(0, 14);
    }

    if (v.length <= 11) {
        // CPF Mask: 000.000.000-00
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
        // CNPJ Mask: 00.000.000/0000-00
        v = v.replace(/^(\d{2})(\d)/, "$1.$2");
        v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
        v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
        v = v.replace(/(\d{4})(\d)/, "$1-$2");
    }
    return v;
};

// --- BANK LOGO COMPONENT ---
const BankLogo: React.FC<{ bank: BankName; size?: 'sm' | 'md' | 'lg' }> = ({ bank, size = 'md' }) => {
    const s = size === 'sm' ? 'w-5 h-5 text-[8px]' : size === 'md' ? 'w-8 h-8 text-[10px]' : 'w-12 h-12 text-xs';
    
    switch (bank) {
        case 'Banco do Brasil':
            return <div className={`${s} rounded-full bg-[#FFE600] text-[#0038A8] font-black flex items-center justify-center border-2 border-[#0038A8]`} title="Banco do Brasil">BB</div>;
        case 'Bradesco':
            return <div className={`${s} rounded-md bg-[#CC092F] text-white font-bold flex items-center justify-center`} title="Bradesco">B</div>;
        case 'Caixa':
            return <div className={`${s} rounded-full bg-[#005CA9] text-[#F7941D] font-black flex items-center justify-center`} title="Caixa">X</div>;
        case 'Itaú':
            return <div className={`${s} rounded-md bg-[#EC7000] text-[#0038A8] font-black flex items-center justify-center`} title="Itaú">I</div>;
        case 'Nubank':
            return <div className={`${s} rounded-full bg-[#820AD1] text-white font-bold flex items-center justify-center`} title="Nubank">Nu</div>;
        case 'Santander':
            return <div className={`${s} rounded-full bg-[#EC0000] text-white font-bold flex items-center justify-center`} title="Santander">S</div>;
        case 'Inter':
            return <div className={`${s} rounded-md bg-[#FF7A00] text-white font-bold flex items-center justify-center`} title="Inter">in</div>;
        case 'XP':
            return <div className={`${s} rounded-full bg-black text-[#FFC400] font-bold flex items-center justify-center border border-[#FFC400]`} title="XP">XP</div>;
        case 'BTG':
            return <div className={`${s} rounded-full bg-[#002B49] text-white font-bold flex items-center justify-center`} title="BTG">BTG</div>;
        default:
            return <div className={`${s} rounded-full bg-gray-200 text-gray-500 font-bold flex items-center justify-center`}>?</div>;
    }
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
  const todayDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[todayDate.getMonth()]);
  const [selectedYear, setSelectedYear] = useState<number>(todayDate.getFullYear());
  
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  // Datepicker / Month Picker State
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  
  // Lazy Loading State
  const [visibleCount, setVisibleCount] = useState(20);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'inflow' | 'outflow'>('inflow');
  const [category, setCategory] = useState('');
  
  // Account Selection
  const [selectedAccountId, setSelectedAccountId] = useState('');
  
  // Account Management State
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBank, setNewAccountBank] = useState<BankName>('Banco do Brasil');
  
  // Project & Budget Linkage
  const [project, setProject] = useState('');
  const [customProjectName, setCustomProjectName] = useState('');
  const [budgetLineId, setBudgetLineId] = useState(''); // Stores link to detailed budget

  const [supplierDoc, setSupplierDoc] = useState('');
  const [paymentDoc, setPaymentDoc] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  
  // Recurring State
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceMonths, setRecurrenceMonths] = useState(1);

  // New Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme Colors
  const themeColor = viewContext === 'PF' ? 'govgreen' : 'govblue';
  const themeBgLight = viewContext === 'PF' ? 'bg-green-50' : 'bg-blue-50';
  const themeBgDark = viewContext === 'PF' ? 'dark:bg-green-900/20' : 'dark:bg-blue-900/20';
  const themeText = viewContext === 'PF' ? 'text-govgreen' : 'text-govblue';
  const themeBorder = viewContext === 'PF' ? 'border-govgreen' : 'border-govblue';

  // Filter accounts by context
  const contextAccounts = useMemo(() => {
      return accounts.filter(a => a.entityType === viewContext);
  }, [accounts, viewContext]);

  // Set default account
  useEffect(() => {
      if (contextAccounts.length > 0 && !selectedAccountId) {
          setSelectedAccountId(contextAccounts[0].id);
      }
  }, [contextAccounts, selectedAccountId]);

  // Determine available categories based on context and type
  const availableCategories = useMemo(() => {
      let baseList = [];
      if (viewContext === 'PF') {
          baseList = type === 'inflow' ? PF_CATEGORIES_IN : PF_CATEGORIES_OUT;
      } else {
          baseList = type === 'inflow' ? PJ_CATEGORIES_IN : PJ_CATEGORIES_OUT;
      }
      return [...baseList, ...customCategories];
  }, [viewContext, type, customCategories]);

  // Set default category when type/context changes
  useEffect(() => {
      setCategory(availableCategories[0]);
  }, [type, viewContext, availableCategories]);

  // Reset visible count when month/year or context changes
  useEffect(() => {
    setVisibleCount(20);
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
    }
  }, [selectedMonth, selectedYear, viewContext]);

  // Close month picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Determine if selected project has detailed budget lines
  const selectedProjectBudgetLines = useMemo(() => {
      const selectedProj = projects.find(p => p.name === project);
      return selectedProj?.budgetLines || [];
  }, [projects, project]);

  const handleBudgetLineSelect = (lineId: string) => {
      setBudgetLineId(lineId);
      const line = selectedProjectBudgetLines.find(l => l.id === lineId);
      if (line) {
          setCategory(line.expenseItem); // Override generic category with the specific Item Name
      }
  };

  const handleAddCustomCategory = () => {
      if (newCategoryName.trim()) {
          onAddCategory(newCategoryName.trim());
          setCategory(newCategoryName.trim());
          setIsAddingCategory(false);
          setNewCategoryName('');
      }
  };

  const handleAddAccount = () => {
      if(newAccountName.trim() && onAddAccount) {
          onAddAccount({
              id: crypto.randomUUID(),
              name: newAccountName,
              bank: newAccountBank,
              entityType: viewContext
          });
          setIsAddingAccount(false);
          setNewAccountName('');
      }
  };

  const changeMonth = (offset: number) => {
    const currentIndex = MONTHS.indexOf(selectedMonth);
    let newIndex = currentIndex + offset;
    
    // Cycle through months and adjust year
    if (newIndex < 0) {
        newIndex = 11;
        setSelectedYear(prev => prev - 1);
    } else if (newIndex > 11) {
        newIndex = 0;
        setSelectedYear(prev => prev + 1);
    }
    
    setSelectedMonth(MONTHS[newIndex]);
  };

  const goToToday = () => {
      const now = new Date();
      setSelectedMonth(MONTHS[now.getMonth()]);
      setSelectedYear(now.getFullYear());
      setIsMonthPickerOpen(false);
  };

  const handleEditClick = (t: Transaction) => {
    setDescription(t.description);
    setAmount(t.amount.toString());
    setType(t.type);
    setCategory(t.category);
    
    // Logic to populate Project Select vs Custom
    const knownProject = projects.find(p => p.name === t.project);
    if (knownProject || !t.project) {
        setProject(t.project || '');
        setCustomProjectName('');
        // If it has a linked budget line, set it
        setBudgetLineId(t.budgetLineId || '');
    } else {
        setProject('custom');
        setCustomProjectName(t.project);
    }

    setSupplierDoc(t.supplierDoc || '');
    setPaymentDoc(t.paymentDoc || '');
    if (t.accountId) setSelectedAccountId(t.accountId);
    setEditId(t.id);
    
    // Switch view to transaction's date
    const tDate = new Date(t.date);
    setSelectedMonth(t.month);
    setSelectedYear(tDate.getFullYear());
    
    setIsRecurring(false); 
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const numAmount = parseFloat(amount.replace(',', '.'));
    
    // Resolve Project Name
    let finalProjectName = project;
    if (project === 'custom') {
        finalProjectName = customProjectName;
    }

    // Identify Budget Line Data if available
    let linkedBudgetLine: BudgetLineItem | undefined;
    if (budgetLineId) {
        linkedBudgetLine = selectedProjectBudgetLines.find(l => l.id === budgetLineId);
    }

    // Generate Transactions (1 or many if recurring)
    const newTransactions: Transaction[] = [];
    const loopCount = editId ? 1 : (isRecurring ? recurrenceMonths : 1);
    const relatedId = isRecurring ? crypto.randomUUID() : undefined;
    
    // Determine start date based on SELECTED YEAR and Month
    let currentMonthIndex = MONTHS.indexOf(selectedMonth);
    let currentYear = selectedYear;
    
    // Default day to today's day, or 28th if simpler to avoid overflows
    const day = Math.min(new Date().getDate(), 28);

    for (let i = 0; i < loopCount; i++) {
        // Calculate Month Cyclic
        let totalMonthIndex = currentMonthIndex + i;
        let yearOffset = Math.floor(totalMonthIndex / 12);
        let monthIndex = totalMonthIndex % 12;
        let monthName = MONTHS[monthIndex];
        let year = currentYear + yearOffset;
        
        // Create Date object
        let dateObj = new Date(year, monthIndex, day);

        newTransactions.push({
            id: editId && i === 0 ? editId : crypto.randomUUID(),
            description: loopCount > 1 ? `${description} (${i+1}/${loopCount})` : description,
            amount: numAmount,
            type,
            category, // This will be the Expense Item name if Budget Line is selected
            project: finalProjectName,
            supplierDoc, // Now comes pre-masked from input
            paymentDoc,
            date: dateObj.toISOString(),
            month: monthName,
            entity: viewContext,
            isRecurring: loopCount > 1,
            relatedId,
            
            // New LPG Fields
            budgetLineId: budgetLineId || undefined,
            projectStage: linkedBudgetLine?.stage,
            projectNature: linkedBudgetLine?.nature,
            
            // Account Link
            accountId: selectedAccountId
        });
    }

    if (editId) {
        setTransactions(prev => prev.map(t => t.id === editId ? newTransactions[0] : t));
    } else {
        setTransactions(prev => [...prev, ...newTransactions]);
    }
    
    // Reset form
    setDescription('');
    setAmount('');
    setProject('');
    setCustomProjectName('');
    setBudgetLineId('');
    setSupplierDoc('');
    setPaymentDoc('');
    setEditId(null);
    setIsRecurring(false);
    setRecurrenceMonths(1);
  };

  const handleCancelEdit = () => {
    setDescription('');
    setAmount('');
    setProject('');
    setCustomProjectName('');
    setBudgetLineId('');
    setSupplierDoc('');
    setPaymentDoc('');
    setEditId(null);
    setIsRecurring(false);
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
        const yearCounts: Record<number, number> = {};

        const newTransactions: Transaction[] = parsedItems.map(item => {
           let itemMonth = selectedMonth;
           let itemYear = selectedYear;

           if (item.date) {
             const dateObj = new Date(item.date);
             if (!isNaN(dateObj.getTime())) {
                itemMonth = MONTHS[dateObj.getMonth()];
                itemYear = dateObj.getFullYear();
             }
           }
           monthCounts[itemMonth] = (monthCounts[itemMonth] || 0) + 1;
           yearCounts[itemYear] = (yearCounts[itemYear] || 0) + 1;

           return {
             id: crypto.randomUUID(),
             ...item,
             month: itemMonth,
             project: '',
             entity: viewContext,
             accountId: selectedAccountId
           };
        });

        // Determine most frequent month/year to switch view
        const mostFrequentMonth = Object.keys(monthCounts).reduce((a, b) => monthCounts[a] > monthCounts[b] ? a : b);
        const mostFrequentYear = Object.keys(yearCounts).reduce((a, b) => yearCounts[parseInt(a)] > yearCounts[parseInt(b)] ? a : b);
        
        setTransactions(prev => [...prev, ...newTransactions]);
        setSelectedMonth(mostFrequentMonth);
        setSelectedYear(parseInt(mostFrequentYear));

        setImportStatus({ 
            msg: `${newTransactions.length} itens importados! Visualizando ${mostFrequentMonth}/${mostFrequentYear}.`, 
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

  // --- Financial Logic ---

  // 1. Filter Transactions for CURRENT Entity Only
  const currentEntityTransactions = useMemo(() => {
    return transactions.filter(t => t.entity === viewContext);
  }, [transactions, viewContext]);

  // 2. Filter by Month AND Year
  const currentMonthTransactions = useMemo(() => {
    return currentEntityTransactions.filter(t => {
        const tDate = new Date(t.date);
        if (isNaN(tDate.getTime())) return false;
        return t.month === selectedMonth && tDate.getFullYear() === selectedYear;
    });
  }, [currentEntityTransactions, selectedMonth, selectedYear]);

  // 3. Sorting & Lazy Loading
  const sortedTransactions = useMemo(() => {
    return currentMonthTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(b.date).getTime());
  }, [currentMonthTransactions]);

  const visibleTransactions = useMemo(() => {
    return sortedTransactions.slice(0, visibleCount);
  }, [sortedTransactions, visibleCount]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    // Check if scrolled near bottom (50px threshold)
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (!isLoadingList && visibleCount < sortedTransactions.length) {
        setIsLoadingList(true);
        // Delay to show spinner/simulation
        setTimeout(() => {
          setVisibleCount(prev => prev + 20);
          setIsLoadingList(false);
        }, 600);
      }
    }
  };

  // 4. Calculate "Previous Balance" (All time before start of this month)
  const previousBalance = useMemo(() => {
      // Create a date for the 1st of the current selected month/year
      const startOfView = new Date(selectedYear, MONTHS.indexOf(selectedMonth), 1);

      return currentEntityTransactions.reduce((acc, t) => {
          const tDate = new Date(t.date);
          if (tDate < startOfView) {
              return acc + (t.type === 'inflow' ? t.amount : -t.amount);
          }
          return acc;
      }, 0);
  }, [currentEntityTransactions, selectedMonth, selectedYear]);

  // 5. Current Month Totals
  const currentMonthTotals = useMemo(() => {
    return currentMonthTransactions.reduce((acc, curr) => {
      if (curr.type === 'inflow') {
        acc.inflow += curr.amount;
      } else {
        acc.outflow += curr.amount;
      }
      return acc;
    }, { inflow: 0, outflow: 0 });
  }, [currentMonthTransactions]);

  const currentMonthResult = currentMonthTotals.inflow - currentMonthTotals.outflow;
  const accumulatedBalance = previousBalance + currentMonthResult;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up pb-12">
      {/* Context Header */}
      <div className={`mb-8 border-l-8 ${themeBorder} bg-white dark:bg-slate-800 rounded-r-xl shadow-sm p-6 flex flex-col md:flex-row justify-between items-center transition-colors`}>
        <div>
          <h2 className={`text-3xl font-display font-bold ${themeText}`}>
             Diário Financeiro: {viewContext === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
             {viewContext === 'PF' ? 'Controle seus gastos pessoais e sobrevivência.' : 'Gerencie editais, cachês, produção e impostos.'}
          </p>
        </div>
        
        {/* Visual Month/Year Picker */}
        <div className="mt-4 md:mt-0 relative" ref={monthPickerRef}>
          <div className="flex items-center bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 p-1">
             <button 
               onClick={() => changeMonth(-1)}
               className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-500 dark:text-gray-300 hover:text-govblue transition-colors"
               title="Mês Anterior"
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
             </button>
             
             <div 
               className="px-6 py-2 cursor-pointer flex items-center gap-2 group min-w-[180px] justify-center"
               onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
             >
                <svg className="w-4 h-4 text-gray-400 group-hover:text-govblue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <div className="flex flex-col items-center leading-tight">
                    <span className={`text-lg font-bold ${themeText} select-none`}>
                    {selectedMonth}
                    </span>
                    <span className="text-gray-400 dark:text-gray-400 text-xs font-normal select-none">{selectedYear}</span>
                </div>
             </div>

             <button 
               onClick={() => changeMonth(1)}
               className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-500 dark:text-gray-300 hover:text-govblue transition-colors"
               title="Próximo Mês"
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
             </button>
          </div>

          {/* Grid Dropdown for Direct Selection */}
          {isMonthPickerOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 p-4 z-50 animate-fade-in-up">
                  {/* Year Navigation inside Popover */}
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50 dark:border-slate-700">
                      <button onClick={() => setSelectedYear(prev => prev - 1)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-500 dark:text-gray-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                      </button>
                      <span className="font-bold text-gray-800 dark:text-gray-100">{selectedYear}</span>
                      <button onClick={() => setSelectedYear(prev => prev + 1)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-500 dark:text-gray-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                      </button>
                  </div>
                  
                  {/* Months Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                      {MONTHS.map((m) => (
                          <button
                              key={m}
                              onClick={() => { setSelectedMonth(m); setIsMonthPickerOpen(false); }}
                              className={`py-2 px-1 text-sm rounded-lg font-medium transition-colors ${
                                  selectedMonth === m 
                                  ? `${viewContext === 'PF' ? 'bg-govgreen' : 'bg-govblue'} text-white shadow-md` 
                                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                              }`}
                          >
                              {m.substring(0, 3)}
                          </button>
                      ))}
                  </div>
                  
                  {/* Today Button */}
                  <button 
                    onClick={goToToday}
                    className={`w-full py-2 text-xs font-bold uppercase rounded-lg border border-dashed transition-colors
                        ${viewContext === 'PF' ? 'text-govgreen border-govgreen hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-govblue border-govblue hover:bg-blue-50 dark:hover:bg-blue-900/20'}
                    `}
                  >
                    Ir para Hoje
                  </button>
              </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input Form (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
           {/* Card Importação */}
           <div className={`rounded-2xl shadow-xl p-6 text-white relative overflow-hidden group ${viewContext === 'PF' ? 'bg-govgreen shadow-green-100 dark:shadow-none' : 'bg-govblue shadow-blue-100 dark:shadow-none'}`}>
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
              className={`w-full relative z-10 py-3 px-4 bg-white dark:bg-slate-800 rounded-xl font-bold text-sm shadow-sm flex justify-center items-center gap-2 transition-colors ${themeText} dark:text-white`}
            >
              {isImporting ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </>
              ) : 'Selecionar Arquivo'}
            </button>
          </div>
          
          {importStatus && (
              <div className={`p-4 rounded-xl text-sm border flex items-center gap-3 ${
                  importStatus.type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-100 dark:border-red-800'
              }`}>
                  {importStatus.msg}
              </div>
          )}

          {/* Manage Accounts Widget */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-slate-700">
               <div className="flex justify-between items-center mb-2">
                   <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Minhas Contas</h4>
                   <button 
                    onClick={() => setIsAddingAccount(!isAddingAccount)} 
                    className={`text-xs font-bold ${themeText} hover:underline`}
                   >
                       {isAddingAccount ? 'Cancelar' : '+ Nova Conta'}
                   </button>
               </div>
               
               {isAddingAccount ? (
                   <div className="space-y-2 mb-2 animate-fade-in">
                       <input 
                         type="text" 
                         value={newAccountName}
                         onChange={e => setNewAccountName(e.target.value)}
                         placeholder="Nome da Conta (ex: Investimento)"
                         className="w-full text-sm border rounded p-2 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                       />
                       <select 
                         value={newAccountBank}
                         onChange={e => setNewAccountBank(e.target.value as BankName)}
                         className="w-full text-sm border rounded p-2 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                       >
                           {['Banco do Brasil', 'Bradesco', 'Caixa', 'Itaú', 'Nubank', 'Santander', 'Inter', 'XP', 'BTG', 'Outros'].map(b => (
                               <option key={b} value={b}>{b}</option>
                           ))}
                       </select>
                       <button onClick={handleAddAccount} className={`w-full py-1.5 rounded text-xs text-white font-bold ${viewContext === 'PF' ? 'bg-govgreen' : 'bg-govblue'}`}>
                           Salvar Conta
                       </button>
                   </div>
               ) : (
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scroll">
                        {contextAccounts.map(acc => (
                            <div 
                                key={acc.id} 
                                onClick={() => setSelectedAccountId(acc.id)}
                                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer min-w-[140px] transition-all
                                    ${selectedAccountId === acc.id 
                                        ? `border-${themeColor} bg-gray-50 dark:bg-slate-700 ring-1 ring-${themeColor}` 
                                        : 'border-gray-100 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    }
                                `}
                            >
                                <BankLogo bank={acc.bank} size="sm" />
                                <div className="truncate text-xs font-bold text-gray-700 dark:text-gray-300">
                                    {acc.name}
                                </div>
                            </div>
                        ))}
                    </div>
               )}
          </div>

          {/* Form Card */}
          <div className={`bg-white dark:bg-slate-800 rounded-3xl shadow-sm p-8 border-t-8 ${themeBorder}`}>
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100 dark:border-slate-700">
                <h3 className="text-xl font-display font-bold text-gray-800 dark:text-white">
                    {editId ? 'Editar Lançamento' : 'Novo Lançamento'}
                </h3>
                {editId && (
                    <button onClick={handleCancelEdit} className="text-xs text-red-500 hover:underline">Cancelar</button>
                )}
            </div>
            
            <form onSubmit={handleSaveTransaction} className="space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Descrição</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={viewContext === 'PF' ? "Ex: Aluguel, Supermercado" : "Ex: Cachê, Fornecedor"}
                  className={`w-full rounded-xl border border-gray-200 dark:border-slate-600 px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:${themeBorder} focus:ring-${themeColor}`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className={`w-full rounded-xl border border-gray-200 dark:border-slate-600 px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:${themeBorder} focus:ring-${themeColor}`}
                  required
                />
              </div>
              
              {/* Account Selection Field */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Conta Bancária</label>
                <div className="relative">
                    <select
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className={`w-full rounded-xl border border-gray-200 dark:border-slate-600 px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:${themeBorder} focus:ring-${themeColor} appearance-none`}
                    >
                        {contextAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>
                        ))}
                    </select>
                    {/* Visual hint of selected bank logo inside select (simulated via absolute) */}
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                         {selectedAccountId && <BankLogo bank={contextAccounts.find(a => a.id === selectedAccountId)?.bank || 'Outros'} size="sm"/>}
                    </div>
                </div>
              </div>

               {/* Project Selection / Source Field */}
               <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                    {viewContext === 'PJ' ? 'Vincular a Projeto' : 'Fonte / Origem'}
                </label>
                
                {viewContext === 'PJ' ? (
                  <div className="space-y-2">
                      <select
                          value={project}
                          onChange={(e) => {
                              setProject(e.target.value);
                              setBudgetLineId(''); // Reset budget line if project changes
                          }}
                          className={`w-full rounded-xl border border-gray-200 dark:border-slate-600 px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:${themeBorder} focus:ring-${themeColor}`}
                      >
                          <option value="">Despesa Geral / Administrativa</option>
                          {projects.map(p => (
                              <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                          <option value="custom">Outro (Digitar...)</option>
                      </select>
                      
                      {project === 'custom' && (
                          <input 
                              type="text" 
                              value={customProjectName}
                              onChange={(e) => setCustomProjectName(e.target.value)}
                              placeholder="Digite o nome do projeto/origem"
                              className={`w-full rounded-xl border border-gray-200 dark:border-slate-600 px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:${themeBorder} focus:ring-${themeColor}`}
                              autoFocus
                          />
                      )}
                  </div>
                ) : (
                   <input 
                      type="text" 
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                      placeholder="Ex: Salário, Freelance, Pessoal"
                      className={`w-full rounded-xl border border-gray-200 dark:border-slate-600 px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:${themeBorder} focus:ring-${themeColor}`}
                   />
                )}
              </div>

              {/* Only show Gov Accountability fields if PJ */}
              {viewContext === 'PJ' && (
                  <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl border border-gray-100 dark:border-slate-700 space-y-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Dados para Prestação de Contas</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">CPF/CNPJ Fornecedor</label>
                            <input 
                            type="text" 
                            value={supplierDoc}
                            onChange={(e) => setSupplierDoc(maskCpfCnpj(e.target.value))}
                            placeholder="00.000.000/0000-00"
                            maxLength={18}
                            className="w-full rounded-lg border border-gray-200 dark:border-slate-600 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-govblue bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Nº Doc</label>
                            <input 
                            type="text" 
                            value={paymentDoc}
                            onChange={(e) => setPaymentDoc(e.target.value)}
                            placeholder="NF/Pix"
                            className="w-full rounded-lg border border-gray-200 dark:border-slate-600 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-govblue bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            />
                        </div>
                      </div>
                  </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Tipo</label>
                    <div className="flex rounded-xl bg-gray-100 dark:bg-slate-700 p-1">
                      <button
                        type="button"
                        onClick={() => setType('inflow')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                          type === 'inflow' 
                            ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                            : 'text-gray-500 dark:text-gray-300 hover:text-gray-700'
                        }`}
                      >
                        Entrada
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('outflow')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                          type === 'outflow' 
                            ? 'bg-white dark:bg-slate-800 text-red-500 dark:text-red-400 shadow-sm' 
                            : 'text-gray-500 dark:text-gray-300 hover:text-gray-700'
                        }`}
                      >
                        Saída
                      </button>
                    </div>
                 </div>
                 <div className="col-span-2">
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {viewContext === 'PJ' && selectedProjectBudgetLines.length > 0 && type === 'outflow' ? 'Item Orçamentário (Rubrica)' : 'Categoria'}
                        </label>
                        {!isAddingCategory && selectedProjectBudgetLines.length === 0 && (
                            <button 
                                type="button" 
                                onClick={() => setIsAddingCategory(true)}
                                className="text-[10px] text-accent font-bold hover:underline"
                            >
                                + Nova
                            </button>
                        )}
                    </div>
                    
                    {isAddingCategory ? (
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Nome da Categoria"
                                className={`flex-1 rounded-xl border border-gray-200 dark:border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:${themeBorder} focus:ring-${themeColor} bg-white dark:bg-slate-900 text-gray-900 dark:text-white`}
                                autoFocus
                            />
                            <button type="button" onClick={handleAddCustomCategory} className="bg-govgreen text-white px-3 py-2 rounded-lg text-xs font-bold">OK</button>
                            <button type="button" onClick={() => setIsAddingCategory(false)} className="bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-200 px-3 py-2 rounded-lg text-xs font-bold">X</button>
                        </div>
                    ) : (
                        // Logic Swap: If PJ project selected AND it has budget lines AND is outflow, show Budget Selector
                        viewContext === 'PJ' && selectedProjectBudgetLines.length > 0 && type === 'outflow' ? (
                             <select 
                                value={budgetLineId}
                                onChange={(e) => handleBudgetLineSelect(e.target.value)}
                                className={`w-full rounded-xl border border-gray-200 dark:border-slate-600 px-4 py-3 text-sm focus:outline-none focus:ring-1 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:${themeBorder} focus:ring-${themeColor}`}
                            >
                                <option value="">-- Selecione o item do orçamento --</option>
                                {selectedProjectBudgetLines.map(line => (
                                    <option key={line.id} value={line.id}>
                                        {line.expenseItem} ({line.stage})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <select 
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className={`w-full rounded-xl border border-gray-200 dark:border-slate-600 px-4 py-3 text-sm focus:outline-none focus:ring-1 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:${themeBorder} focus:ring-${themeColor}`}
                            >
                            {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        )
                    )}

                    {/* Description Tooltip */}
                    {!isAddingCategory && category && CATEGORY_DESCRIPTIONS[category] && !budgetLineId && (
                        <div className="mt-2 px-1 flex items-start gap-2 animate-fade-in">
                            <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${viewContext === 'PF' ? 'text-govgreen' : 'text-govblue'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                {CATEGORY_DESCRIPTIONS[category]}
                            </p>
                        </div>
                    )}
                 </div>
              </div>
              
              {/* Recurring Option */}
              {!editId && (
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl border border-transparent dark:border-slate-700">
                      <input 
                          type="checkbox" 
                          id="recurring" 
                          checked={isRecurring} 
                          onChange={(e) => setIsRecurring(e.target.checked)}
                          className={`w-5 h-5 rounded text-${themeColor} focus:ring-${themeColor} border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800`}
                      />
                      <label htmlFor="recurring" className="text-sm text-gray-700 dark:text-gray-300 font-medium select-none cursor-pointer">
                          Repetir lançamento?
                      </label>
                      
                      {isRecurring && (
                          <select 
                              value={recurrenceMonths}
                              onChange={(e) => setRecurrenceMonths(Number(e.target.value))}
                              className="ml-auto text-xs border border-gray-300 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                          >
                              {[2,3,4,5,6,12].map(n => <option key={n} value={n}>{n} meses</option>)}
                          </select>
                      )}
                  </div>
              )}

              <button 
                type="submit"
                className={`w-full py-4 px-4 rounded-xl shadow-lg text-sm font-bold text-white transition-all transform active:scale-95 mt-4 ${
                    viewContext === 'PF' ? 'bg-govgreen hover:bg-green-700' : 'bg-govblue hover:bg-blue-800'
                }`}
              >
                {editId ? 'Atualizar Lançamento' : (isRecurring ? `Lançar Recorrente (${recurrenceMonths}x)` : '+ Adicionar')}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Dashboard & List (8 columns) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Visual Summary Cards - Updated for Continuity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Previous Balance */}
             <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col justify-between h-32 relative overflow-hidden">
               <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Saldo Anterior</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">Até final de {MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}</p>
               </div>
               <p className={`text-2xl font-display font-bold ${previousBalance >= 0 ? 'text-gray-700 dark:text-gray-200' : 'text-red-500'}`}>
                   {formatCurrency(previousBalance)}
               </p>
             </div>
             
             {/* Monthly Result */}
             <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-between h-32 relative overflow-hidden">
               <div>
                   <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Resultado Mês</p>
                   <p className="text-[10px] text-gray-400 dark:text-gray-500">Entradas - Saídas ({selectedMonth})</p>
               </div>
               <div className="flex justify-between items-end">
                   <p className={`text-2xl font-display font-bold ${currentMonthResult >= 0 ? (viewContext === 'PF' ? 'text-govgreen' : 'text-govblue') : 'text-red-500'}`}>
                       {formatCurrency(currentMonthResult)}
                   </p>
                   {/* Mini indicator */}
                   <span className={`text-xs font-bold ${currentMonthResult >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                       {currentMonthResult >= 0 ? '▲ Superávit' : '▼ Déficit'}
                   </span>
               </div>
             </div>
             
             {/* Final Accumulated Balance */}
             <div className={`p-6 rounded-3xl shadow-sm border flex flex-col justify-between h-32 relative overflow-hidden transition-colors ${
                 accumulatedBalance >= 0 ? `${viewContext === 'PF' ? 'bg-govgreen' : 'bg-govblue'} text-white border-transparent` : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
             }`}>
               <p className={`text-xs font-bold uppercase tracking-widest ${
                   accumulatedBalance >= 0 ? 'text-white/80' : 'text-red-700 dark:text-red-300'
               }`}>Saldo Final (Acumulado)</p>
               <p className={`text-3xl font-display font-bold ${
                   accumulatedBalance >= 0 ? 'text-white' : 'text-red-600 dark:text-red-400'
               }`}>
                 {formatCurrency(accumulatedBalance)}
               </p>
             </div>
          </div>

          {/* List Style */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col h-[600px]">
            <div className={`px-8 py-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center ${themeBgLight} ${themeBgDark} bg-opacity-30 rounded-t-3xl flex-shrink-0`}>
              <h3 className="text-lg font-display font-bold text-gray-800 dark:text-white">Lançamentos: {viewContext}</h3>
              <p className="text-xs text-gray-400 font-normal">
                {visibleTransactions.length} de {currentMonthTransactions.length} exibidos
              </p>
            </div>
            
            {sortedTransactions.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
                <div className="w-24 h-24 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-gray-300 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                </div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sem movimentações em {selectedMonth}/{selectedYear}</h4>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">Adicione receitas ou despesas para visualizar o fluxo deste mês.</p>
              </div>
            ) : (
              <div 
                ref={listContainerRef}
                onScroll={handleScroll}
                className="flex-grow overflow-y-auto"
              >
                <table className="min-w-full text-left relative">
                  <thead className="sticky top-0 bg-white dark:bg-slate-800 shadow-sm z-10 border-b border-gray-100 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Dia</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Descrição</th>
                      <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Conta</th>
                      <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{viewContext === 'PJ' ? 'Projeto' : 'Origem'}</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Valor</th>
                      <th className="px-4 py-4 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                    {visibleTransactions.map((t) => (
                      <tr 
                        key={t.id} 
                        onClick={() => handleEditClick(t)}
                        className={`cursor-pointer transition-colors group ${editId === t.id ? 'bg-orange-50 dark:bg-orange-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                      >
                        <td className="px-6 py-5 text-sm font-medium text-gray-500 dark:text-gray-400">
                           {t.date ? new Date(t.date).toLocaleDateString('pt-BR', {day: '2-digit'}) : '-'}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{t.description}</div>
                             {t.isRecurring && (
                                 <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded" title="Recorrente">↺</span>
                             )}
                          </div>
                           <div className="text-[10px] text-gray-400 mt-1">
                               {t.category}
                               {t.projectStage && <span className="ml-1 px-1 bg-gray-100 dark:bg-slate-600 rounded">({t.projectStage})</span>}
                           </div>
                        </td>
                        <td className="px-4 py-5">
                             {t.accountId ? (
                                 <div className="flex items-center gap-2">
                                     <BankLogo bank={accounts.find(a => a.id === t.accountId)?.bank || 'Outros'} size="sm" />
                                 </div>
                             ) : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-4 py-5">
                          {t.project ? (
                             <span className={`px-2 py-1 rounded text-[10px] font-bold border ${themeBgLight} dark:bg-slate-700 ${themeText} dark:text-gray-300 ${themeBorder} border-opacity-30 dark:border-slate-600`}>
                                {t.project}
                             </span>
                          ) : <span className="text-gray-300 dark:text-gray-600 text-xs">-</span>}
                        </td>
                        <td className={`px-6 py-5 text-right font-bold text-sm ${
                          t.type === 'inflow' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                        }`}>
                          {t.type === 'inflow' ? '+' : '-'} {formatCurrency(t.amount)}
                        </td>
                        <td className="px-4 py-5 text-center">
                          <button 
                            onClick={(e) => handleDelete(t.id, e)}
                            className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                            title="Apagar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {isLoadingList && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center">
                           <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                              <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Carregando mais itens...
                           </div>
                        </td>
                      </tr>
                    )}
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
