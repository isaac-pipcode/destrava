
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

// --- UTILS ---
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
      if (exists) {
        return prev.map(p => p.id === project.id ? project : p);
      }
      return [...prev, project];
    });
  };

  const generateRobustDemoData = useCallback(() => {
      if (window.confirm("Isso carregará um cenário de demonstração completo (4 meses) e substituirá os dados atuais. Continuar?")) {
        try {
            const today = new Date();
            const months = [
                new Date(today.getFullYear(), today.getMonth() - 3, 1),
                new Date(today.getFullYear(), today.getMonth() - 2, 1),
                new Date(today.getFullYear(), today.getMonth() - 1, 1),
                today
            ];
            const getMonthName = (d: Date) => d.toLocaleString('pt-BR', { month: 'long' }).charAt(0).toUpperCase() + d.toLocaleString('pt-BR', { month: 'long' }).slice(1);
            const projId = "proj-demo-01";
            const line1 = "line-01";
            const line2 = "line-02";
            const line3 = "line-03";
            const line4 = "line-04";

            const demoProject: ProjectMetadata = {
                id: projId,
                name: "Documentário: Vozes da Terra",
                legislation: "LPG",
                budget: 50000,
                startDate: months[0].toISOString(),
                origin: "manual",
                proponentDoc: "12.345.678/0001-99",
                budgetLines: [
                    { id: line1, activity: "Captação de Imagem", expenseItem: "Locação de Câmera Cinema", stage: "Produção", nature: "Bens Duráveis/Equipamentos", plannedAmount: 15000 },
                    { id: line2, activity: "Direção Geral", expenseItem: "Cachê Diretor", stage: "Pré-Produção", nature: "Cachê", plannedAmount: 10000 },
                    { id: line3, activity: "Logística de Set", expenseItem: "Alimentação Equipe", stage: "Produção", nature: "Material de Consumo", plannedAmount: 5000 },
                    { id: line4, activity: "Pós-Produção", expenseItem: "Ilha de Edição", stage: "Pós-Produção", nature: "Serviço (PF/PJ)", plannedAmount: 8000 }
                ]
            };

            const demoTransactions: Transaction[] = [];
            const addTx = (desc: string, amount: number, type: 'inflow' | 'outflow', cat: string, date: Date, entity: 'PF'|'PJ', proj?: string, accId?: string, lineId?: string, doc?: string) => {
                demoTransactions.push({
                    id: generateId(),
                    description: desc,
                    amount,
                    type,
                    category: cat,
                    date: date.toISOString(),
                    month: getMonthName(date),
                    entity,
                    project: proj,
                    accountId: accId || '1',
                    budgetLineId: lineId,
                    paymentDoc: doc,
                    supplierDoc: entity === 'PJ' ? '00.000.000/0001-00' : undefined,
                    projectStage: lineId ? demoProject.budgetLines?.find(l => l.id === lineId)?.stage : undefined,
                    projectNature: lineId ? demoProject.budgetLines?.find(l => l.id === lineId)?.nature : undefined,
                });
            };

            addTx("Recebimento 1ª Parcela LPG", 50000, 'inflow', "Edital/Lei de Incentivo", new Date(months[0].getFullYear(), months[0].getMonth(), 5), 'PJ', demoProject.name, '1', undefined, "OB-202401");
            addTx("Pagamento Contador (Abertura)", 1200, 'outflow', "Contabilidade/Jurídico", new Date(months[0].getFullYear(), months[0].getMonth(), 10), 'PJ', undefined, '1');
            addTx("Cachê Diretor (Parcela 1)", 5000, 'outflow', "Cachê Diretor", new Date(months[0].getFullYear(), months[0].getMonth(), 15), 'PJ', demoProject.name, '1', line2, "NF-101");
            addTx("Salário Professor", 3500, 'inflow', "Salário/Emprego CLT", new Date(months[0].getFullYear(), months[0].getMonth(), 5), 'PF', undefined, '2');
            addTx("Aluguel Apartamento", 1800, 'outflow', "Habitação (Aluguel/Condomínio)", new Date(months[0].getFullYear(), months[0].getMonth(), 10), 'PF', undefined, '2');
            addTx("Locação Kit Câmera RED", 8000, 'outflow', "Locação de Câmera Cinema", new Date(months[1].getFullYear(), months[1].getMonth(), 5), 'PJ', demoProject.name, '1', line1, "NF-202");
            addTx("HDs Externos SSD", 1500, 'outflow', "Produção/Material", new Date(months[1].getFullYear(), months[1].getMonth(), 8), 'PJ', demoProject.name, '1', undefined, "NF-203");
            addTx("DAS MEI Mensal", 75, 'outflow', "Impostos (MEI/Simples)", new Date(months[1].getFullYear(), months[1].getMonth(), 20), 'PJ', undefined, '1');
            addTx("Pró-labore Retirada", 2000, 'inflow', "Pró-labore/Retirada da PJ", new Date(months[1].getFullYear(), months[1].getMonth(), 10), 'PF', undefined, '2');
            addTx("Supermercado", 850, 'outflow', "Alimentação/Mercado", new Date(months[1].getFullYear(), months[1].getMonth(), 12), 'PF', undefined, '2');
            addTx("Alimentação Equipe (Catering)", 2500, 'outflow', "Alimentação Equipe", new Date(months[2].getFullYear(), months[2].getMonth(), 2), 'PJ', demoProject.name, '1', line3, "NF-305");
            addTx("Uber/Transporte Set", 450, 'outflow', "Transporte/Logística", new Date(months[2].getFullYear(), months[2].getMonth(), 5), 'PJ', demoProject.name, '1');
            addTx("Locação Lentes Especiais", 4000, 'outflow', "Locação de Câmera Cinema", new Date(months[2].getFullYear(), months[2].getMonth(), 10), 'PJ', demoProject.name, '1', line1, "NF-310");
            addTx("Cachê Diretor (Parcela 2)", 5000, 'outflow', "Cachê Diretor", new Date(months[2].getFullYear(), months[2].getMonth(), 25), 'PJ', demoProject.name, '1', line2, "NF-320");
            addTx("Freelance Edição Vídeo Corp", 3000, 'inflow', "Cachê Artístico/Serviço", new Date(today.getFullYear(), today.getMonth(), 5), 'PJ', "Trabalho Extra", '1', undefined, "NF-401");
            addTx("Editor de Cor (Colorist)", 4000, 'outflow', "Ilha de Edição", new Date(today.getFullYear(), today.getMonth(), 10), 'PJ', demoProject.name, '1', line4, "NF-405");
            addTx("DAS MEI Mensal", 75, 'outflow', "Impostos (MEI/Simples)", new Date(today.getFullYear(), today.getMonth(), 20), 'PJ', undefined, '1');
            
            setProjects([demoProject]);
            setTransactions(demoTransactions);
            setAccounts(DEFAULT_ACCOUNTS);
            alert("Ambiente de demonstração carregado com sucesso!");
            setCurrentView('dashboard');
        } catch (e) {
            console.error("Erro ao gerar dados:", e);
            alert("Ocorreu um erro ao gerar os dados de demonstração.");
        }
      }
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardHome onNavigate={(v) => setCurrentView(v as View)} transactions={transactions} setTransactions={setTransactions} onLoadDemo={generateRobustDemoData} />;
      case 'manual_pf':
        return <ManualManager transactions={transactions} setTransactions={setTransactions} viewContext="PF" customCategories={customCategories} onAddCategory={(cat) => setCustomCategories(prev => [...prev, cat])} projects={projects} accounts={accounts} onAddAccount={(acc) => setAccounts(prev => [...prev, acc])} />;
      case 'manual_pj':
        return <ManualManager transactions={transactions} setTransactions={setTransactions} viewContext="PJ" customCategories={customCategories} onAddCategory={(cat) => setCustomCategories(prev => [...prev, cat])} projects={projects} accounts={accounts} onAddAccount={(acc) => setAccounts(prev => [...prev, acc])} />;
      case 'reports':
        return <Reports transactions={transactions} />;
      case 'accountability':
        return <Accountability transactions={transactions} projects={projects} onSaveProject={handleSaveProject} />;
      case 'tax':
        return <TaxManager transactions={transactions} onNavigate={(view) => setCurrentView(view)} />;
      case 'pricing':
        return <PricingCalculator />;
      case 'documentation':
        return <Documentation />;
      case 'branding':
        return <BrandingTool />;
      case 'import':
        return <ImportFlow transactions={transactions} onDataAdded={(newT) => setTransactions(prev => [...prev, ...newT])} />;
      default:
        return <DashboardHome onNavigate={(v) => setCurrentView(v as View)} transactions={transactions} setTransactions={setTransactions} onLoadDemo={generateRobustDemoData} />;
    }
  };

  if (!isLoggedIn) {
      return <Login onLogin={handleLogin} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      <Header currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} onOpenPresentation={() => setIsPresentationOpen(true)} />
      <PresentationModal isOpen={isPresentationOpen} onClose={() => setIsPresentationOpen(false)} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div key={currentView} className="animate-fade-in-up">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
