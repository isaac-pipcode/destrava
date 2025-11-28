import React, { useState } from 'react';
import Header from './components/Header';
import DashboardHome from './components/DashboardHome';
import ManualManager from './components/ManualManager';
import ImportFlow from './components/ImportFlow'; // Serves as AI Diagnosis
import Accountability from './components/Accountability';
import Reports from './components/Reports';
import Login from './components/Login';
import { Transaction } from './types';

type View = 'dashboard' | 'import' | 'manual_pf' | 'manual_pj' | 'accountability' | 'reports';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  // Centralized state for transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Custom categories state
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('dashboard');
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
          />
        );
      case 'reports':
        return <Reports transactions={transactions} />;
      case 'accountability':
        return <Accountability transactions={transactions} />;
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
      return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans">
      <Header 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        onLogout={handleLogout}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>
    </div>
  );
};

export default App;