import React, { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: 'dashboard' | 'import' | 'manual_pf' | 'manual_pj' | 'accountability' | 'reports' | 'tax' | 'pricing') => void;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, onLogout, isDarkMode, toggleTheme }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const getLinkClass = (isActive: boolean) => {
    return isActive
      ? "text-white bg-govblue px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md transition-all"
      : "text-gray-700 dark:text-gray-300 hover:text-govblue dark:hover:text-white hover:bg-blue-50 dark:hover:bg-slate-800 px-4 py-2.5 rounded-lg font-medium text-sm transition-all";
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white dark:bg-slate-800 border-b-4 border-govgreen sticky top-0 z-50 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <div className="flex items-center gap-4 md:gap-8">
             <div
               className="flex items-center gap-2 md:gap-3 cursor-pointer group"
               onClick={() => onNavigate('dashboard')}
             >
                {/* Logo DESTRAVA (Open Lock Concept) */}
                <div className="relative w-7 h-7 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0">
                    {/* Lock Body */}
                    <div className="absolute bottom-0 w-7 h-4 md:w-8 md:h-5 bg-govblue rounded-md shadow-sm z-10"></div>
                    {/* Lock Shackle (Open) */}
                    <div className="absolute -top-1 right-0 w-4 h-5 md:w-5 md:h-6 border-3 md:border-4 border-govgreen rounded-t-full transform translate-x-1 -translate-y-1"></div>
                    {/* Keyhole */}
                    <div className="absolute bottom-1 md:bottom-1.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-govorange rounded-full z-20"></div>
                </div>

                <div className="flex items-center gap-1.5 md:gap-2">
                    <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">DESTRAVA</h1>
                    <span className="bg-blue-100 text-govblue border border-blue-200 text-[8px] md:text-[9px] font-bold px-1 md:px-1.5 py-0.5 rounded uppercase">Beta</span>
                </div>
             </div>

             <nav className="hidden md:flex items-center space-x-1.5">
                {/* 1. Diário Financeiro - Dropdown */}
                <div
                  className="relative group"
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <button
                    className={`flex items-center gap-1.5 ${getLinkClass(currentView.startsWith('manual'))}`}
                  >
                    Diário Financeiro
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl py-2 animate-fade-in-up">
                      <button
                        onClick={() => { onNavigate('manual_pf'); setIsDropdownOpen(false); }}
                        className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-govgreen font-semibold border-l-4 border-transparent hover:border-govgreen transition-all"
                      >
                        Pessoa Física
                      </button>
                      <button
                        onClick={() => { onNavigate('manual_pj'); setIsDropdownOpen(false); }}
                        className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-govblue font-semibold border-l-4 border-transparent hover:border-govblue transition-all"
                      >
                        Pessoa Jurídica (MEI)
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Gestão Fiscal */}
                <button
                  onClick={() => onNavigate('tax')}
                  className={getLinkClass(currentView === 'tax')}
                >
                  Gestão Fiscal
                </button>

                {/* 3. Prestação de Contas */}
                <button
                  onClick={() => onNavigate('accountability')}
                  className={getLinkClass(currentView === 'accountability')}
                >
                  Prestação de Contas
                </button>

                {/* 4. Precificação */}
                <button
                  onClick={() => onNavigate('pricing')}
                  className={getLinkClass(currentView === 'pricing')}
                >
                  Precificação
                </button>

                {/* 5. Gráficos e Relatórios */}
                <button
                  onClick={() => onNavigate('reports')}
                  className={getLinkClass(currentView === 'reports')}
                >
                  Gráficos e Relatórios
                </button>
             </nav>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden lg:block text-right">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-tight">Apoio à Gestão</p>
                <p className="text-xs font-semibold text-govblue dark:text-blue-400">Trabalhadores da Cultura</p>
             </div>

             {/* Mobile Menu Button */}
             <button
               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
               className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
               aria-label="Menu"
             >
               {isMobileMenuOpen ? (
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
               ) : (
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
               )}
             </button>

             {/* Theme Toggle */}
             <button
               onClick={toggleTheme}
               className="p-1.5 md:p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
               title="Alternar Tema"
             >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                )}
             </button>

             {/* User Profile / Logout Menu - Hidden on Mobile (shown in mobile menu) */}
             <div className="hidden md:block relative" ref={userMenuRef}>
                <button
                   onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                   className="h-10 w-10 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold border border-gray-200 dark:border-slate-600 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-govblue"
                >
                   G
                </button>
                
                {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 py-1 animate-fade-in-up z-50">
                        <div className="px-4 py-3 border-b border-gray-50 dark:border-slate-700">
                            <p className="text-xs text-gray-400 font-bold uppercase">Usuário</p>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">gov.br/artista</p>
                        </div>
                        <button 
                            onClick={onLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 font-bold flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                            Sair do Sistema
                        </button>
                    </div>
                )}
             </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 animate-fade-in-up"
          >
            <nav className="px-4 py-4 space-y-2 max-h-[calc(100vh-5rem)] overflow-y-auto">
              {/* Diário Financeiro - Mobile */}
              <div className="space-y-1">
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase px-4 py-2">
                  Diário Financeiro
                </div>
                <button
                  onClick={() => { onNavigate('manual_pf'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    currentView === 'manual_pf'
                      ? 'bg-green-100 dark:bg-green-900/30 text-govgreen border-l-4 border-govgreen'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 border-l-4 border-transparent'
                  }`}
                >
                  Pessoa Física
                </button>
                <button
                  onClick={() => { onNavigate('manual_pj'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    currentView === 'manual_pj'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-govblue border-l-4 border-govblue'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-l-4 border-transparent'
                  }`}
                >
                  Pessoa Jurídica (MEI)
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-slate-700 my-2"></div>

              {/* Gestão Fiscal */}
              <button
                onClick={() => { onNavigate('tax'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'tax'
                    ? 'bg-govblue text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-700'
                }`}
              >
                Gestão Fiscal
              </button>

              {/* Prestação de Contas */}
              <button
                onClick={() => { onNavigate('accountability'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'accountability'
                    ? 'bg-govblue text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-700'
                }`}
              >
                Prestação de Contas
              </button>

              {/* Precificação */}
              <button
                onClick={() => { onNavigate('pricing'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'pricing'
                    ? 'bg-govblue text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-700'
                }`}
              >
                Precificação
              </button>

              {/* Gráficos e Relatórios */}
              <button
                onClick={() => { onNavigate('reports'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'reports'
                    ? 'bg-govblue text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-700'
                }`}
              >
                Gráficos e Relatórios
              </button>

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-slate-700 my-2"></div>

              {/* User Info & Logout - Mobile */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Usuário</p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">gov.br/artista</p>
                <button
                  onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                  className="w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                  Sair do Sistema
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;