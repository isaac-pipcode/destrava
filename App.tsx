import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DashboardHome from './components/DashboardHome';
import ManualManager from './components/ManualManager';
import ImportFlow from './components/ImportFlow'; // Serves as AI Diagnosis
import Accountability from './components/Accountability';
import Reports from './components/Reports';
import TaxManager from './components/TaxManager';
import Login from './components/Login';
import { Transaction, ProjectMetadata, BankAccount } from './types';

type View = 'dashboard' | 'import' | 'manual_pf' | 'manual_pj' | 'accountability' | 'reports' | 'tax';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Centralized state for transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Centralized state for Projects (Accountability)
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);

  // Centralized state for Bank Accounts
  const [accounts, setAccounts] = useState<BankAccount[]>([
    { id: '1', name: 'Conta Principal PJ', bank: 'Banco do Brasil', entityType: 'PJ' },
    { id: '2', name: 'Conta Pessoal', bank: 'Nubank', entityType: 'PF' }
  ]);
  
  // Custom categories state
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  useEffect(() => {
    // Check local storage or system preference on load
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

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('dashboard');
  };

  // Handle Create or Update Project
  const handleSaveProject = (project: ProjectMetadata) => {
    setProjects(prev => {
      const exists = prev.some(p => p.id === project.id);
      if (exists) {
        // Update existing
        return prev.map(p => p.id === project.id ? project : p);
      }
      // Create new
      return [...prev, project];
    });
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardHome 
            onNavigate={(view) => setCurrentView(view as View)} 
            transactions={transactions} 
            setTransactions={setTransactions} 
          />
        );
      case 'manual_pf':
        return (
          <ManualManager 
            transactions={transactions} 
            setTransactions={setTransactions} 
            viewContext="PF"
            customCategories={customCategories}
            onAddCategory={(cat) => setCustomCategories(prev => [...prev, cat])}
            projects={projects}
            accounts={accounts}
            onAddAccount={(acc) => setAccounts(prev => [...prev, acc])}
          />
        );
      case 'manual_pj':
        return (
          <ManualManager 
            transactions={transactions} 
            setTransactions={setTransactions} 
            viewContext="PJ"
            customCategories={customCategories}
            onAddCategory={(cat) => setCustomCategories(prev => [...prev, cat])}
            projects={projects}
            accounts={accounts}
            onAddAccount={(acc) => setAccounts(prev => [...prev, acc])}
          />
        );
      case 'reports':
        return <Reports transactions={transactions} />;
      case 'accountability':
        return (
          <Accountability 
            transactions={transactions} 
            projects={projects}
            onSaveProject={handleSaveProject}
          />
        );
      case 'tax':
        return (
          <TaxManager 
            transactions={transactions} 
            onNavigate={(view) => setCurrentView(view)}
          />
        );
      case 'import':
        return <ImportFlow transactions={transactions} onDataAdded={(newT) => setTransactions(prev => [...prev, ...newT])} />;
      default:
        return (
          <DashboardHome 
            onNavigate={(view) => setCurrentView(view as View)} 
            transactions={transactions}
            setTransactions={setTransactions} 
          />
        );
    }
  };

  if (!isLoggedIn) {
      return <Login onLogin={handleLogin} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      <Header 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>
    </div>
  );
};

export default App;