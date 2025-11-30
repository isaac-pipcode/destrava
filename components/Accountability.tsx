
import React, { useState, useMemo } from 'react';
import { Transaction, ProjectMetadata, BudgetLineItem, ProjectStage, ExpenseNature } from '../types';
import { maskCpfCnpj } from './ManualManager'; // Import reuse mask logic
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

// Helper: Validate CPF/CNPJ Checksum
const isValidCpfCnpj = (val: string): boolean => {
    if (!val) return false;
    const clean = val.replace(/\D/g, '');

    // Check for repetitive digits (e.g., 111.111.111-11)
    if (/^(\d)\1+$/.test(clean)) return false;

    // Validate CPF
    if (clean.length === 11) {
        let sum = 0;
        let remainder;
        for (let i = 1; i <= 9; i++) sum += parseInt(clean.substring(i - 1, i)) * (11 - i);
        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(clean.substring(9, 10))) return false;

        sum = 0;
        for (let i = 1; i <= 10; i++) sum += parseInt(clean.substring(i - 1, i)) * (12 - i);
        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(clean.substring(10, 11))) return false;
        return true;
    }

    // Validate CNPJ
    if (clean.length === 14) {
        let size = clean.length - 2;
        let numbers = clean.substring(0, size);
        const digits = clean.substring(size);
        let sum = 0;
        let pos = size - 7;
        for (let i = size; i >= 1; i--) {
            sum += parseInt(numbers.charAt(size - i)) * pos--;
            if (pos < 2) pos = 9;
        }
        let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
        if (result !== parseInt(digits.charAt(0))) return false;

        size = size + 1;
        numbers = clean.substring(0, size);
        sum = 0;
        pos = size - 7;
        for (let i = size; i >= 1; i--) {
            sum += parseInt(numbers.charAt(size - i)) * pos--;
            if (pos < 2) pos = 9;
        }
        result = sum % 11 < 2 ? 0 : 11 - sum % 11;
        if (result !== parseInt(digits.charAt(1))) return false;
        return true;
    }

    return false;
};

const Accountability: React.FC<AccountabilityProps> = ({ transactions, projects, onSaveProject }) => {
  // Navigation & Selection State
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report' | 'guide'>('dashboard');
  const [viewMode, setViewMode] = useState<'select' | 'register' | 'import'>('select');
  
  // Register Form State
  // We add 'id' to partial to track if we are editing an existing project
  const [newProject, setNewProject] = useState<Partial<ProjectMetadata>>({ legislation: 'LPG', budget: 0 });
  const [budgetLines, setBudgetLines] = useState<BudgetLineItem[]>([]);
  const [projectFormError, setProjectFormError] = useState('');
  
  // Real-time Field Validation State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  // Budget Line Input State
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [lineActivity, setLineActivity] = useState('');
  const [lineItem, setLineItem] = useState('');
  const [lineStage, setLineStage] = useState<ProjectStage>('Produção');
  const [lineNature, setLineNature] = useState<ExpenseNature>('Serviço (PF/PJ)');
  const [lineValue, setLineValue] = useState('');
  const [lineError, setLineError] = useState('');

  // Import State
  const [importTerm, setImportTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Filters for Report Tab
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('all');

  // --- Logic & Calculations ---

  // Merge Registered Projects with Projects found in Transactions (legacy/manual entries)
  const availableProjects = useMemo(() => {
      const transactionProjects = Array.from(new Set(transactions.map(t => t.project).filter(Boolean))) as string[];
      const unifiedList: ProjectMetadata[] = [...projects];

      transactionProjects.forEach(tName => {
          if (!unifiedList.find(p => p.name === tName)) {
              unifiedList.push({
                  id: tName,
                  name: tName,
                  legislation: 'Outros',
                  budget: 0,
                  startDate: new Date().toISOString(),
                  origin: 'manual'
              });
          }
      });
      return unifiedList;
  }, [transactions, projects]);

  const activeProjectData = useMemo(() => {
      return availableProjects.find(p => p.id === selectedProjectId || p.name === selectedProjectId);
  }, [availableProjects, selectedProjectId]);

  const projectTransactions = useMemo(() => {
    if (!activeProjectData) return [];
    return transactions
      .filter(t => t.project === activeProjectData.name)
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, activeProjectData]);

  // KPIs
  const totalBudget = activeProjectData ? activeProjectData.budget : 0;
  const totalExecuted = projectTransactions.reduce((acc, t) => t.type === 'outflow' ? acc + t.amount : acc, 0);
  const totalInflowRealized = projectTransactions.reduce((acc, t) => t.type === 'inflow' ? acc + t.amount : acc, 0);
  const balance = totalInflowRealized - totalExecuted;
  const budgetExecutionPercentage = totalBudget > 0 ? (totalExecuted / totalBudget) * 100 : 0;

  // Chart Data: Breakdown by STAGE (Etapa)
  const stageData = useMemo(() => {
    const grouped: Record<string, number> = {};
    projectTransactions.filter(t => t.type === 'outflow').forEach(t => {
      const stage = t.projectStage || 'Não Classificado';
      grouped[stage] = (grouped[stage] || 0) + t.amount;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [projectTransactions]);

  // Chart Data: Timeline
  const timelineData = useMemo(() => {
      const grouped: Record<string, number> = {};
      projectTransactions.filter(t => t.type === 'outflow').forEach(t => {
          const date = new Date(t.date);
          const key = `${date.toLocaleString('pt-BR', { month: 'short' })}/${date.getFullYear().toString().substr(2)}`;
          grouped[key] = (grouped[key] || 0) + t.amount;
      });
      return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [projectTransactions]);

  // Report Filter Logic
  const filteredReportData = useMemo(() => {
      return projectTransactions.filter(t => {
          const matchesSearch = 
            t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (t.supplierDoc && t.supplierDoc.includes(searchTerm)) ||
            (t.category.toLowerCase().includes(searchTerm.toLowerCase()));
          
          const matchesStage = filterStage === 'all' || (t.projectStage === filterStage);
          
          return matchesSearch && matchesStage;
      });
  }, [projectTransactions, searchTerm, filterStage]);

  // --- Actions ---

  const handleEditProject = () => {
    if (!activeProjectData) return;
    
    // Populate form with existing data
    setNewProject({
        id: activeProjectData.id,
        name: activeProjectData.name,
        legislation: activeProjectData.legislation,
        budget: activeProjectData.budget,
        startDate: activeProjectData.startDate,
        proponentDoc: activeProjectData.proponentDoc
    });
    
    setBudgetLines(activeProjectData.budgetLines || []);
    setProjectFormError('');
    setFieldErrors({});
    setViewMode('register');
  };

  const handleAddBudgetLine = () => {
      if(!lineActivity || !lineItem || !lineValue) {
          setLineError('Preencha todos os campos da rubrica.');
          return;
      }
      
      const val = parseFloat(lineValue);

      if (editingLineId) {
        // Update existing line
        setBudgetLines(prev => prev.map(line => {
            if (line.id === editingLineId) {
                return {
                    ...line,
                    activity: lineActivity,
                    expenseItem: lineItem,
                    stage: lineStage,
                    nature: lineNature,
                    plannedAmount: val
                };
            }
            return line;
        }));
        setEditingLineId(null);
      } else {
        // Add new line
        const newLine: BudgetLineItem = {
            id: crypto.randomUUID(),
            activity: lineActivity,
            expenseItem: lineItem,
            stage: lineStage,
            nature: lineNature,
            plannedAmount: val
        };
        setBudgetLines([...budgetLines, newLine]);
      }
      
      setLineItem('');
      setLineValue('');
      setLineError('');
      // Keep Activity/Stage/Nature as they are often repetitive
  };

  const handleEditLine = (line: BudgetLineItem) => {
    setLineActivity(line.activity);
    setLineItem(line.expenseItem);
    setLineStage(line.stage);
    setLineNature(line.nature);
    setLineValue(line.plannedAmount.toString());
    setEditingLineId(line.id);
  };

  const removeBudgetLine = (id: string) => {
      setBudgetLines(budgetLines.filter(l => l.id !== id));
      if (editingLineId === id) {
          setEditingLineId(null);
          setLineItem('');
          setLineValue('');
      }
  };

  const handleSaveProjectInternal = (e: React.FormEvent) => {
      e.preventDefault();
      setProjectFormError('');

      // Check for any field errors before saving
      if (Object.keys(fieldErrors).length > 0) {
          setProjectFormError('Corrija os erros no formulário antes de salvar.');
          return;
      }

      if (!newProject.name) {
          setProjectFormError('O nome do projeto é obrigatório.');
          return;
      }

      // Final validate CPF/CNPJ if present
      if (newProject.proponentDoc && !isValidCpfCnpj(newProject.proponentDoc)) {
          setProjectFormError('Documento inválido. Verifique CPF ou CNPJ.');
          return;
      }

      // Sum budget from lines if lines exist, otherwise use manual total
      const calculatedBudget = budgetLines.length > 0 
          ? budgetLines.reduce((acc, curr) => acc + curr.plannedAmount, 0)
          : (newProject.budget || 0);

      const project: ProjectMetadata = {
          id: newProject.id || crypto.randomUUID(), // Use existing ID if editing
          name: newProject.name,
          legislation: newProject.legislation || 'Outros',
          budget: calculatedBudget,
          startDate: newProject.startDate || new Date().toISOString(),
          origin: newProject.origin || 'manual',
          budgetLines: budgetLines,
          proponentDoc: newProject.proponentDoc // Save Proponent Doc
      };

      onSaveProject(project);
      setSelectedProjectId(project.id);
      setViewMode('select');
      // Reset form
      setNewProject({ legislation: 'LPG', budget: 0, proponentDoc: '' });
      setBudgetLines([]);
      setLineError('');
      setProjectFormError('');
      setFieldErrors({});
      setEditingLineId(null);
  };

  // --- Real-time Validation Handlers ---

  const handleNameChange = (val: string) => {
      setNewProject({...newProject, name: val});
      if (!val.trim()) {
          setFieldErrors(prev => ({...prev, name: 'O nome do projeto é obrigatório.'}));
      } else {
          const newErrors = {...fieldErrors};
          delete newErrors.name;
          setFieldErrors(newErrors);
      }
  };

  const handleDocChange = (val: string) => {
      const masked = maskCpfCnpj(val);
      setNewProject({...newProject, proponentDoc: masked});
      
      const clean = masked.replace(/\D/g, '');
      // Only validate format if length indicates a full document is being attempted
      if (clean.length === 11 || clean.length === 14) {
          if (!isValidCpfCnpj(masked)) {
              setFieldErrors(prev => ({...prev, proponentDoc: 'CPF/CNPJ inválido (verifique os dígitos).'}));
          } else {
              const newErrors = {...fieldErrors};
              delete newErrors.proponentDoc;
              setFieldErrors(newErrors);
          }
      } else if (clean.length > 0) {
          // While typing...
          setFieldErrors(prev => ({...prev, proponentDoc: 'Digite o CPF (11) ou CNPJ (14) completo.'}));
      } else {
          // Empty is technically allowed unless we enforce it as required
          const newErrors = {...fieldErrors};
          delete newErrors.proponentDoc;
          setFieldErrors(newErrors);
      }
  };

  const handleBudgetChange = (val: string) => {
      const num = parseFloat(val);
      setNewProject({...newProject, budget: isNaN(num) ? 0 : num});
      
      if (num < 0) {
          setFieldErrors(prev => ({...prev, budget: 'O valor não pode ser negativo.'}));
      } else {
          const newErrors = {...fieldErrors};
          delete newErrors.budget;
          setFieldErrors(newErrors);
      }
  };

  const handleImportMapaCultural = () => {
      if (!importTerm) return;
      setIsImporting(true);

      setTimeout(() => {
          const mockProject: ProjectMetadata = {
              id: crypto.randomUUID(),
              name: "Festival de Arte Integrada (Importado)",
              legislation: "PNAB",
              budget: 75000.00,
              startDate: "2024-03-01",
              origin: 'mapa_cultural',
              mapaCulturalId: importTerm,
              proponentDoc: "12.345.678/0001-90",
              budgetLines: [
                  { id: '1', activity: 'Pré-produção', expenseItem: 'Curadoria', stage: 'Pré-Produção', nature: 'Cachê', plannedAmount: 5000 },
                  { id: '2', activity: 'Produção', expenseItem: 'Equipamento de Som', stage: 'Produção', nature: 'Bens Duráveis/Equipamentos', plannedAmount: 20000 },
              ]
          };

          onSaveProject(mockProject);
          setSelectedProjectId(mockProject.id);
          setIsImporting(false);
          setImportTerm('');
          setViewMode('select');
      }, 2000);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const exportToCSV = () => {
    if (projectTransactions.length === 0) return;

    const headers = [
        'Etapa', 'Atividade/Ação', 'Item de Despesa', 'Natureza', 'Favorecido', 'CNPJ/CPF', 'Data', 'Valor'
    ];
    
    // Find Budget Line Info for each transaction if available
    const rows = projectTransactions.map((t) => {
        // Find metadata if budgetLineId exists in active project
        const lineMeta = activeProjectData?.budgetLines?.find(b => b.id === t.budgetLineId);
        
        return [
            `"${lineMeta?.stage || t.projectStage || ''}"`,
            `"${lineMeta?.activity || ''}"`,
            `"${t.category}"`, // Category acts as the Item Description
            `"${lineMeta?.nature || t.projectNature || ''}"`,
            `"${t.description}"`,
            `"${t.supplierDoc || ''}"`,
            new Date(t.date).toLocaleDateString('pt-BR'),
            t.amount.toFixed(2).replace('.', ',')
        ];
    });

    const csvContent = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Prestacao_LPG_${activeProjectData?.name || 'Projeto'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CustomTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white dark:bg-slate-800 p-3 border border-gray-100 dark:border-slate-700 shadow-xl rounded-xl z-50">
              <p className="font-bold text-gray-800 dark:text-white text-xs mb-1">{payload[0].name}</p>
              <p className="font-bold text-govblue dark:text-blue-400 text-sm">
                  {formatCurrency(payload[0].value)}
              </p>
          </div>
        );
      }
      return null;
  };

  return (
    <div className="animate-fade-in-up pb-12">
      
      {/* Header & Project Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 mb-6 border-l-8 border-govblue">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
                <h2 className="text-3xl font-display font-bold text-gray-800 dark:text-white mb-2">Gestor Cultural</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
                    Prestação de Contas Simplificada para Editais (LPG, Aldir Blanc, ProAC).
                </p>
            </div>
            
            <div className="w-full md:w-64">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Projeto Ativo</label>
                <select 
                    value={selectedProjectId}
                    onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        if(e.target.value === '') setViewMode('select');
                    }}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 font-bold focus:ring-govblue"
                >
                    <option value="">-- Selecione ou Cadastre --</option>
                    {availableProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>
         </div>
      </div>

      {!activeProjectData ? (
          /* EMPTY STATE / ONBOARDING */
          <div className="animate-fade-in">
              {viewMode === 'select' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-10">
                      {/* Card Register */}
                      <button 
                          onClick={() => {
                              setViewMode('register');
                              setProjectFormError('');
                              setFieldErrors({});
                          }}
                          className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border-2 border-transparent hover:border-govblue dark:hover:border-blue-500 hover:shadow-lg transition-all group text-left relative overflow-hidden"
                      >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                          <div className="w-16 h-16 bg-blue-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-6 text-govblue dark:text-blue-400 relative z-10">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 relative z-10">Cadastrar Projeto</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 relative z-10">
                              Cadastro detalhado do orçamento aprovado para controle de rubricas da Lei Paulo Gustavo.
                          </p>
                      </button>

                      {/* Card Import */}
                      <button 
                          onClick={() => setViewMode('import')}
                          className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border-2 border-transparent hover:border-govorange dark:hover:border-orange-500 hover:shadow-lg transition-all group text-left relative overflow-hidden"
                      >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 dark:bg-orange-900/20 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                          <div className="w-16 h-16 bg-orange-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-6 text-govorange dark:text-orange-400 relative z-10">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 relative z-10">Importar do Mapa Cultural</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 relative z-10">
                              Meu projeto já está cadastrado na plataforma oficial. Quero puxar os dados via integração.
                          </p>
                      </button>
                  </div>
              )}

              {/* REGISTER/EDIT FORM WITH BUDGET BUILDER */}
              {viewMode === 'register' && (
                  <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700 p-8 mt-6">
                      <div className="flex items-center gap-3 mb-6">
                          <button onClick={() => {
                              setViewMode('select');
                              setNewProject({ legislation: 'LPG', budget: 0, proponentDoc: '' });
                              setBudgetLines([]);
                              setProjectFormError('');
                              setFieldErrors({});
                              setEditingLineId(null);
                          }} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full">
                             <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                          </button>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              {newProject.id ? 'Editar Projeto Cultural' : 'Novo Projeto Cultural'}
                          </h3>
                      </div>
                      
                      <form onSubmit={handleSaveProjectInternal} className="space-y-6">
                          {/* Basic Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="md:col-span-2">
                                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nome do Projeto</label>
                                  <input 
                                      type="text" 
                                      required
                                      placeholder="Ex: Curta-metragem O Sol do Sertão"
                                      value={newProject.name || ''}
                                      onChange={e => handleNameChange(e.target.value)}
                                      className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-govblue'} bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 outline-none transition-colors`}
                                  />
                                  {fieldErrors.name && <p className="text-red-500 text-xs mt-1 font-bold">{fieldErrors.name}</p>}
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Edital / Lei</label>
                                  <select 
                                      value={newProject.legislation}
                                      onChange={e => setNewProject({...newProject, legislation: e.target.value})}
                                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-govblue outline-none"
                                  >
                                      <option value="LPG">Lei Paulo Gustavo</option>
                                      <option value="PNAB">Aldir Blanc (PNAB)</option>
                                      <option value="ProAC">ProAC</option>
                                      <option value="Outros">Outros</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Início da Vigência</label>
                                  <div className="relative">
                                      <input 
                                          type="date" 
                                          required
                                          value={newProject.startDate ? newProject.startDate.substring(0, 10) : ''}
                                          onChange={e => setNewProject({...newProject, startDate: e.target.value})}
                                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-govblue outline-none appearance-none cursor-pointer"
                                      />
                                      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500 dark:text-gray-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                      </div>
                                  </div>
                              </div>
                              <div className="md:col-span-2">
                                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">CPF/CNPJ do Proponente</label>
                                  <input 
                                      type="text" 
                                      required
                                      placeholder="00.000.000/0000-00"
                                      value={newProject.proponentDoc || ''}
                                      onChange={e => handleDocChange(e.target.value)}
                                      maxLength={18}
                                      className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.proponentDoc ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-govblue'} bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 outline-none transition-colors`}
                                  />
                                  {fieldErrors.proponentDoc && <p className="text-red-500 text-xs mt-1 font-bold">{fieldErrors.proponentDoc}</p>}
                              </div>
                          </div>

                          {/* Budget Builder Section */}
                          <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
                              <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Planejamento Orçamentário (Planilha de Aplicação)</h4>
                              <p className="text-sm text-gray-500 mb-4">Adicione ou edite as rubricas conforme aprovado no projeto.</p>
                              
                              {/* Global Budget Field if no lines are added yet or just general entry */}
                              {budgetLines.length === 0 && (
                                  <div className="mb-6">
                                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Valor Total do Orçamento (Estimado)</label>
                                      <input 
                                          type="number"
                                          value={newProject.budget}
                                          onChange={e => handleBudgetChange(e.target.value)}
                                          className={`w-full md:w-1/3 px-4 py-3 rounded-xl border ${fieldErrors.budget ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-govblue'} bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 outline-none`}
                                      />
                                      {fieldErrors.budget && <p className="text-red-500 text-xs mt-1 font-bold">{fieldErrors.budget}</p>}
                                      <p className="text-xs text-gray-500 mt-1">Este valor será substituído pela soma das rubricas assim que você adicionar itens abaixo.</p>
                                  </div>
                              )}

                              <div className={`p-4 rounded-xl border border-gray-200 dark:border-slate-600 mb-4 transition-colors ${editingLineId ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200' : 'bg-gray-50 dark:bg-slate-900/50'}`}>
                                  {editingLineId && (
                                      <div className="flex justify-between items-center mb-2">
                                          <span className="text-xs font-bold text-govblue dark:text-blue-400 uppercase">✏️ Editando Rubrica</span>
                                          <button type="button" onClick={() => { setEditingLineId(null); setLineItem(''); setLineValue(''); }} className="text-xs text-gray-500 hover:text-red-500">Cancelar Edição</button>
                                      </div>
                                  )}
                                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                                      <div className="md:col-span-3">
                                          <label className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase">Atividade / Ação</label>
                                          <input 
                                            type="text" 
                                            placeholder="Ex: Filmagem" 
                                            value={lineActivity} 
                                            onChange={e => {setLineActivity(e.target.value); setLineError('');}} 
                                            className={`w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-govblue focus:border-transparent outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white ${lineError && !lineActivity ? 'border-red-400' : ''}`} 
                                          />
                                      </div>
                                      <div className="md:col-span-3">
                                          <label className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase">Item de Despesa</label>
                                          <input 
                                            type="text" 
                                            placeholder="Ex: Operador de Câmera" 
                                            value={lineItem} 
                                            onChange={e => {setLineItem(e.target.value); setLineError('');}} 
                                            className={`w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-govblue focus:border-transparent outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white ${lineError && !lineItem ? 'border-red-400' : ''}`} 
                                          />
                                      </div>
                                      <div className="md:col-span-2">
                                          <label className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase">Etapa</label>
                                          <select 
                                            value={lineStage} 
                                            onChange={e => setLineStage(e.target.value as ProjectStage)} 
                                            className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-govblue focus:border-transparent outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                          >
                                              <option>Pré-Produção</option>
                                              <option>Produção</option>
                                              <option>Pós-Produção</option>
                                              <option>Administrativo/Gestão</option>
                                              <option>Outros</option>
                                          </select>
                                      </div>
                                      <div className="md:col-span-2">
                                          <label className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase">Natureza</label>
                                          <select 
                                            value={lineNature} 
                                            onChange={e => setLineNature(e.target.value as ExpenseNature)} 
                                            className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-govblue focus:border-transparent outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                          >
                                              <option>Cachê</option>
                                              <option>Serviço (PF/PJ)</option>
                                              <option>Material de Consumo</option>
                                              <option>Bens Duráveis/Equipamentos</option>
                                              <option>Logística/Transporte</option>
                                          </select>
                                      </div>
                                      <div className="md:col-span-2">
                                          <label className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase">Valor (R$)</label>
                                          <input 
                                            type="number" 
                                            placeholder="0.00" 
                                            value={lineValue} 
                                            onChange={e => {setLineValue(e.target.value); setLineError('');}} 
                                            className={`w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-govblue focus:border-transparent outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white ${lineError && !lineValue ? 'border-red-400' : ''}`} 
                                          />
                                      </div>
                                  </div>
                                  {lineError && (
                                      <p className="text-xs text-red-500 font-bold mb-2 animate-pulse">{lineError}</p>
                                  )}
                                  <button type="button" onClick={handleAddBudgetLine} className={`w-full py-2 rounded-lg text-sm font-bold transition-colors ${editingLineId ? 'bg-govblue text-white hover:bg-blue-600' : 'bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200'}`}>
                                      {editingLineId ? 'Atualizar Rubrica' : '+ Adicionar Rubrica'}
                                  </button>
                              </div>

                              {/* Budget Lines List */}
                              {budgetLines.length > 0 && (
                                  <div className="mb-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-600">
                                      <table className="w-full text-sm text-left">
                                          <thead className="bg-gray-100 dark:bg-slate-700 text-xs uppercase text-gray-700 dark:text-gray-400 font-bold">
                                              <tr>
                                                  <th className="px-3 py-2">Etapa</th>
                                                  <th className="px-3 py-2">Item</th>
                                                  <th className="px-3 py-2 text-right">Valor</th>
                                                  <th className="px-3 py-2"></th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                              {budgetLines.map(line => (
                                                  <tr key={line.id} className={`group hover:bg-gray-50 dark:hover:bg-slate-700/50 ${editingLineId === line.id ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-slate-800'}`}>
                                                      <td className="px-3 py-2 text-gray-800 dark:text-gray-300">{line.stage}</td>
                                                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{line.expenseItem} <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">({line.nature})</span></td>
                                                      <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-300">{formatCurrency(line.plannedAmount)}</td>
                                                      <td className="px-3 py-2 text-right flex justify-end gap-2">
                                                          <button type="button" onClick={() => handleEditLine(line)} className="text-blue-400 hover:text-blue-600 font-bold" title="Editar">✎</button>
                                                          <button type="button" onClick={() => removeBudgetLine(line.id)} className="text-red-400 hover:text-red-600 font-bold" title="Remover">×</button>
                                                      </td>
                                                  </tr>
                                              ))}
                                              <tr className="bg-gray-50 dark:bg-slate-800 font-bold border-t border-gray-200 dark:border-slate-700">
                                                  <td colSpan={2} className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">TOTAL DO ORÇAMENTO:</td>
                                                  <td className="px-3 py-2 text-right text-govblue dark:text-blue-400">
                                                      {formatCurrency(budgetLines.reduce((acc, curr) => acc + curr.plannedAmount, 0))}
                                                  </td>
                                                  <td></td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </div>
                              )}
                          </div>
                          
                          {projectFormError && (
                              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-pulse">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                  {projectFormError}
                              </div>
                          )}

                          <button type="submit" className="w-full py-4 bg-govblue hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors">
                              {newProject.id ? 'Salvar Alterações do Projeto' : 'Salvar Novo Projeto'}
                          </button>
                      </form>
                  </div>
              )}
              
              {/* IMPORT MODE (Simple placeholder as before) */}
               {viewMode === 'import' && (
                  <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700 p-8 mt-6 text-center">
                       <div className="flex justify-start mb-4">
                            <button onClick={() => setViewMode('select')} className="text-sm text-gray-500 hover:text-govblue flex items-center gap-1">← Voltar</button>
                       </div>
                       
                       <div className="w-16 h-16 bg-orange-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-govorange">
                           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                       </div>
                       <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Conectar com Mapa Cultural</h3>
                       <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                           Insira o ID do projeto ou o link público para buscarmos as informações oficiais.
                       </p>

                       <div className="relative mb-4">
                           <input 
                                type="text"
                                placeholder="Ex: ID 20394 ou https://mapacultural..."
                                value={importTerm}
                                onChange={e => setImportTerm(e.target.value)}
                                disabled={isImporting}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-govorange outline-none"
                           />
                           {isImporting && (
                               <div className="absolute right-3 top-3">
                                   <svg className="animate-spin h-6 w-6 text-govorange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                               </div>
                           )}
                       </div>

                       <button 
                            onClick={handleImportMapaCultural}
                            disabled={isImporting || !importTerm}
                            className="w-full py-3 bg-govorange hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
                       >
                           {isImporting ? 'Buscando dados...' : 'Importar Projeto'}
                       </button>
                  </div>
              )}
          </div>
      ) : (
        <>
            {/* DASHBOARD CONTENT (When project is selected) */}
            
            {/* Project Header Info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{activeProjectData.name}</h3>
                        <button 
                            onClick={handleEditProject}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded text-gray-600 dark:text-gray-300 font-bold flex items-center gap-1"
                        >
                            ✏️ Editar Projeto e Orçamento
                        </button>
                    </div>
                    <div className="flex gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            {activeProjectData.legislation}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                            Orçamento: {formatCurrency(activeProjectData.budget)}
                        </span>
                        {activeProjectData.proponentDoc && (
                             <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                                CPF/CNPJ: {activeProjectData.proponentDoc}
                             </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-slate-700 p-1 rounded-xl w-fit mx-4 sm:mx-0">
                <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white dark:bg-slate-600 shadow text-govblue dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                    📊 Visão Geral
                </button>
                <button 
                    onClick={() => setActiveTab('report')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'report' ? 'bg-white dark:bg-slate-600 shadow text-govblue dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                    📑 Extrato LPG
                </button>
                <button 
                    onClick={() => setActiveTab('guide')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'guide' ? 'bg-white dark:bg-slate-600 shadow text-govblue dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                    💡 Guia de Bolso
                </button>
            </div>

            {/* TAB: DASHBOARD */}
            {activeTab === 'dashboard' && (
                <div className="animate-fade-in">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Budget Card */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-govblue relative group">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orçamento Aprovado</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{formatCurrency(totalBudget)}</p>
                            <div className="flex justify-between items-center mt-2 text-xs">
                                <span className="text-gray-400">Recebido em conta:</span>
                                <span className={`font-bold ${totalInflowRealized < totalBudget ? 'text-orange-500' : 'text-emerald-500'}`}>
                                    {formatCurrency(totalInflowRealized)}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-govorange">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Executado</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{formatCurrency(totalExecuted)}</p>
                            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                                <div className="bg-govorange h-1.5 rounded-full" style={{ width: `${Math.min(budgetExecutionPercentage, 100)}%` }}></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">{budgetExecutionPercentage.toFixed(1)}% do orçamento</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-govgreen">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Saldo em Conta</p>
                            <p className={`text-2xl font-bold mt-1 ${balance < 0 ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>{formatCurrency(balance)}</p>
                            <p className="text-[10px] text-gray-400 mt-1">
                                {balance >= 0 ? 'Em conformidade' : 'Atenção: Conta negativa'}
                            </p>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Stage Breakdown */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Execução por Etapa</h3>
                            <div className="h-64 w-full">
                                {stageData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stageData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {stageData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip content={<CustomTooltip />} />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">Sem despesas lançadas.</div>
                                )}
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Linha do Tempo</h3>
                            <div className="h-64 w-full">
                                {timelineData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={timelineData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                                            <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                                            <YAxis tickFormatter={(val) => `${val/1000}k`} tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                                            <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                                            <Bar dataKey="value" fill="#475569" radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">Sem movimentação.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: REPORT */}
            {activeTab === 'report' && (
                <div className="animate-fade-in bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50 dark:bg-slate-900/50">
                        <div className="flex gap-4 flex-1">
                            <input 
                                type="text" 
                                placeholder="Buscar fornecedor, item..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-64 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-1 focus:ring-govblue focus:outline-none dark:text-white"
                            />
                            <select 
                                value={filterStage}
                                onChange={(e) => setFilterStage(e.target.value)}
                                className="hidden sm:block px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-1 focus:ring-govblue focus:outline-none dark:text-white"
                            >
                                <option value="all">Todas Etapas</option>
                                <option value="Pré-Produção">Pré-Produção</option>
                                <option value="Produção">Produção</option>
                                <option value="Pós-Produção">Pós-Produção</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => window.print()}
                                className="px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600"
                             >
                                🖨️ Imprimir
                             </button>
                             <button 
                                onClick={exportToCSV}
                                className="px-3 py-2 bg-govgreen text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm"
                             >
                                📥 CSV Oficial
                             </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 uppercase text-xs font-bold tracking-wider">
                                    <th className="px-4 py-4">Etapa</th>
                                    <th className="px-4 py-4">Atividade / Item</th>
                                    <th className="px-4 py-4">Natureza</th>
                                    <th className="px-4 py-4">Favorecido / Desc.</th>
                                    <th className="px-4 py-4 text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {filteredReportData.map((t) => {
                                    // Try to match budget line meta
                                    const budgetLine = activeProjectData.budgetLines?.find(b => b.id === t.budgetLineId);
                                    
                                    return (
                                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-4 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap text-xs">
                                                <span className="bg-gray-200 dark:bg-slate-600 px-2 py-1 rounded">
                                                    {budgetLine?.stage || t.projectStage || 'Geral'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="font-bold text-gray-800 dark:text-white text-xs">{budgetLine?.activity}</p>
                                                <p className="text-sm font-medium text-govblue dark:text-blue-300">{t.category}</p>
                                            </td>
                                            <td className="px-4 py-4 text-gray-500 dark:text-gray-400 text-xs">
                                                {budgetLine?.nature || t.projectNature || '-'}
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-gray-800 dark:text-gray-200 text-xs font-bold">{t.description}</p>
                                                <p className="text-[10px] text-gray-400 font-mono">
                                                    {t.supplierDoc ? maskCpfCnpj(t.supplierDoc) : ''}
                                                </p>
                                            </td>
                                            <td className={`px-4 py-4 text-right font-bold font-mono ${t.type === 'inflow' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                                {t.type === 'outflow' ? '-' : '+'} {formatCurrency(t.amount)}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB: GUIDE (Unchanged) */}
            {activeTab === 'guide' && (
                <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-yellow-400">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                           <span>🛒</span> Aquisição de Bens
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                           Ao comprar equipamentos permanentes (câmeras, computadores), verifique se o edital exige doação à administração pública ao final do projeto.
                           <br/><br/>
                           <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded text-xs font-bold">Dica:</span> Guarde manual, garantia e nota fiscal original.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-blue-400">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                           <span>💳</span> Tarifas Bancárias
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                           Contas de fomento cultural (LPG/PNAB) geralmente são isentas de tarifas ("Cesta de Serviços"). Se houver cobrança, solicite estorno ao banco ou justifique como despesa administrativa (se o edital permitir).
                        </p>
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default Accountability;
