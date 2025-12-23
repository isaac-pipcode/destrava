
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import DashboardHome from './components/DashboardHome';
import ManualManager from './components/ManualManager';
import ImportFlow from './components/ImportFlow'; 
import Accountability from './components/Accountability';
import Reports from './components/Reports';
import TaxManager from './components/TaxManager';
import PricingCalculator from './components/PricingCalculator';
import Documentation from './components/Documentation';
import BrandingTool from './components/BrandingTool';
import Login from './components/Login';
import PresentationModal from './components/PresentationModal';
import { Transaction, ProjectMetadata, BankAccount, BudgetLineItem } from './types';

type View = 'dashboard' | 'import' | 'manual_pf' | 'manual_pj' | 'accountability' | 'reports' | 'tax' | 'pricing' | 'documentation' | 'branding';

export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

const DEFAULT_ACCOUNTS: BankAccount[] = [
    { id: '1', name: 'Conta Movimento PJ', bank: 'Banco do Brasil', entityType: 'PJ' },
    { id: '2', name: 'Conta Pessoal', bank: 'Nubank', entityType: 'PF' },
    { id: '3', name: 'Investimentos', bank: 'Inter', entityType: 'PF' }
];

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('app_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [projects, setProjects] = useState<ProjectMetadata[]>(() => {
    const saved = localStorage.getItem('app_projects');
    return saved ? JSON.parse(saved) : [];
  });

  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('app_accounts');
    return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
  });
  
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
      const saved = localStorage.getItem('app_categories');
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => { localStorage.setItem('app_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('app_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('app_accounts', JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem('app_categories', JSON.stringify(customCategories)); }, [customCategories]);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('dashboard');
  };

  const handleSaveProject = (project: ProjectMetadata) => {
    setProjects(prev => {
      const exists = prev.some(p => p.id === project.id);
      if (exists) return prev.map(p => p.id === project.id ? project : p);
      return [...prev, project];
    });
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este lançamento?")) {
        setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const generateRobustDemoData = useCallback(() => {
      if (window.confirm("Isso carregará um cenário de demonstração completo e substituirá os dados atuais. Continuar?")) {
        try {
            const today = new Date();
            const months = [new Date(today.getFullYear(), today.getMonth() - 1, 1), today];
            const getMonthName = (d: Date) => d.toLocaleString('pt-BR', { month: 'long' }).charAt(0).toUpperCase() + d.toLocaleString('pt-BR', { month: 'long' }).slice(1);
            const projId = "proj-demo-01";
            
            const demoProject: ProjectMetadata = {
                id: projId,
                name: "Documentário: Vozes da Terra",
                legislation: "LPG",
                budget: 50000,
                startDate: months[0].toISOString(),
                origin: "manual",
                proponentDoc: "12.345.678/0001-99",
                budgetLines: [
                    { id: "line-01", activity: "Captação", expenseItem: "Câmera", stage: "Produção", nature: "Bens Duráveis/Equipamentos", plannedAmount: 15000 },
                    { id: "line-02", activity: "Direção", expenseItem: "Cachê Diretor", stage: "Pré-Produção", nature: "Cachê", plannedAmount: 10000 }
                ]
            };

            const demoTransactions: Transaction[] = [
                { id: generateId(), description: "Recebimento LPG Parcela 1", amount: 25000, type: 'inflow', category: "Edital/Lei de Incentivo", date: months[0].toISOString(), month: getMonthName(months[0]), entity: 'PJ', projectId: projId, project: demoProject.name },
                { id: generateId(), description: "Serviço Consultoria Técnica", amount: 4500, type: 'inflow', category: "Cachê Artístico/Serviço", date: today.toISOString(), month: getMonthName(today), entity: 'PJ', paymentDoc: '' } // PENDING NF
            ];

            setProjects([demoProject]);
            setTransactions(demoTransactions);
            alert("Dados de demonstração carregados!");
            setCurrentView('dashboard');
        } catch (e) { console.error(e); }
      }
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardHome onNavigate={(v) => setCurrentView(v as View)} transactions={transactions} setTransactions={setTransactions} onLoadDemo={generateRobustDemoData} />;
      case 'manual_pf': return <ManualManager transactions={transactions} setTransactions={setTransactions} onDeleteTransaction={handleDeleteTransaction} viewContext="PF" customCategories={customCategories} onAddCategory={(cat) => setCustomCategories(prev => [...prev, cat])} projects={projects} accounts={accounts} onAddAccount={(acc) => setAccounts(prev => [...prev, acc])} />;
      case 'manual_pj': return <ManualManager transactions={transactions} setTransactions={setTransactions} onDeleteTransaction={handleDeleteTransaction} viewContext="PJ" customCategories={customCategories} onAddCategory={(cat) => setCustomCategories(prev => [...prev, cat])} projects={projects} accounts={accounts} onAddAccount={(acc) => setAccounts(prev => [...prev, acc])} />;
      case 'reports': return <Reports transactions={transactions} />;
      case 'accountability': return <Accountability transactions={transactions} projects={projects} onSaveProject={handleSaveProject} onEditTransaction={(id) => { const t = transactions.find(tx => tx.id === id); if(t) { setCurrentView(t.entity === 'PJ' ? 'manual_pj' : 'manual_pf'); /* The logic for edit mode would need state injection or we just jump to the manual manager where the item will be sorted by date */ } }} onDeleteTransaction={handleDeleteTransaction} />;
      case 'tax': return <TaxManager transactions={transactions} setTransactions={setTransactions} onNavigate={(view) => setCurrentView(view)} />;
      case 'pricing': return <PricingCalculator />;
      case 'documentation': return <Documentation />;
      case 'branding': return <BrandingTool />;
      case 'import': return <ImportFlow transactions={transactions} onDataAdded={(newT) => setTransactions(prev => [...prev, ...newT])} />;
      default: return <DashboardHome onNavigate={(v) => setCurrentView(v as View)} transactions={transactions} setTransactions={setTransactions} onLoadDemo={generateRobustDemoData} />;
    }
  };

  if (!isLoggedIn) return <Login onLogin={handleLogin} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      <Header currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} onOpenPresentation={() => setIsPresentationOpen(true)} />
      <PresentationModal isOpen={isPresentationOpen} onClose={() => setIsPresentationOpen(false)} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div key={currentView} className="animate-fade-in-up">{renderView()}</div>
      </main>
    </div>
  );
};

export default App;
