
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
import { useAuth } from './contexts/AuthContext';
import { Transaction, ProjectMetadata, BankAccount, BusinessProfile, SimulatedInvoice } from './types';

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
  const { user, loading: authLoading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  
  const [activeInvoiceTransactionId, setActiveInvoiceTransactionId] = useState<string | undefined>(undefined);
  
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

  const [invoices, setInvoices] = useState<SimulatedInvoice[]>(() => {
    const saved = localStorage.getItem('app_invoices');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
      const saved = localStorage.getItem('app_categories');
      return saved ? JSON.parse(saved) : [];
  });

  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(() => {
    const saved = localStorage.getItem('app_business_profile');
    return saved ? JSON.parse(saved) : { cnpj: '', companyName: '', secondaryCnaes: [] };
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
  useEffect(() => { localStorage.setItem('app_invoices', JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem('app_categories', JSON.stringify(customCategories)); }, [customCategories]);
  useEffect(() => { localStorage.setItem('app_business_profile', JSON.stringify(businessProfile)); }, [businessProfile]);

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

  const handleLogout = async () => {
    await signOut();
    setCurrentView('dashboard');
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleSaveInvoice = (invoice: SimulatedInvoice) => {
    setInvoices(prev => [invoice, ...prev]);
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardHome onNavigate={(v) => setCurrentView(v as View)} transactions={transactions} setTransactions={setTransactions} />;
      case 'manual_pf': return <ManualManager transactions={transactions} setTransactions={setTransactions} onDeleteTransaction={handleDeleteTransaction} viewContext="PF" customCategories={customCategories} onAddCategory={(cat) => setCustomCategories(prev => [...prev, cat])} projects={projects} accounts={accounts} onAddAccount={(acc) => setAccounts(prev => [...prev, acc])} />;
      case 'manual_pj': return <ManualManager transactions={transactions} setTransactions={setTransactions} onDeleteTransaction={handleDeleteTransaction} viewContext="PJ" customCategories={customCategories} onAddCategory={(cat) => setCustomCategories(prev => [...prev, cat])} projects={projects} accounts={accounts} onAddAccount={(acc) => setAccounts(prev => [...prev, acc])} onGenerateInvoice={(id) => { setActiveInvoiceTransactionId(id); setCurrentView('tax'); }} />;
      case 'reports': return <Reports transactions={transactions} />;
      case 'accountability': return <Accountability transactions={transactions} projects={projects} onSaveProject={(p) => setProjects(prev => [...prev.filter(x => x.id !== p.id), p])} onDeleteTransaction={handleDeleteTransaction} />;
      case 'tax': return <TaxManager transactions={transactions} businessProfile={businessProfile} accounts={accounts} onUpdateProfile={setBusinessProfile} initialTransactionId={activeInvoiceTransactionId} onSaveInvoice={handleSaveInvoice} invoices={invoices} onDeleteInvoice={handleDeleteInvoice} />;
      case 'pricing': return <PricingCalculator />;
      case 'documentation': return <Documentation />;
      case 'branding': return <BrandingTool />;
      case 'import': return <ImportFlow transactions={transactions} onDataAdded={(newT) => setTransactions(prev => [...prev, ...newT])} />;
      default: return <DashboardHome onNavigate={(v) => setCurrentView(v as View)} transactions={transactions} setTransactions={setTransactions} />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      </div>
    );
  }

  if (!user) return <Login isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;

  return (
    <div className="min-h-screen bg-bg text-ink font-sans transition-colors duration-200">
      <Header currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} onOpenPresentation={() => setIsPresentationOpen(true)} />
      <PresentationModal isOpen={isPresentationOpen} onClose={() => setIsPresentationOpen(false)} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div key={currentView} className="animate-fade-in-up">{renderView()}</div>
      </main>
    </div>
  );
};

export default App;
