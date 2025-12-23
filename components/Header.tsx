
import React, { useState, useRef, useEffect } from 'react';
import Logo from './Logo';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: 'dashboard' | 'import' | 'manual_pf' | 'manual_pj' | 'accountability' | 'reports' | 'tax' | 'pricing' | 'documentation' | 'branding') => void;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onOpenPresentation: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, onLogout, isDarkMode, toggleTheme, onOpenPresentation }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const getLinkClass = (isActive: boolean) => {
    return isActive
      ? "text-white bg-govblue px-4 py-2 rounded-lg font-bold text-sm shadow-md"
      : "text-gray-600 dark:text-gray-300 hover:text-govblue dark:hover:text-white hover:bg-blue-50 dark:hover:bg-slate-800 px-4 py-2 rounded-lg font-medium text-sm transition-all";
  };

  const getMobileLinkClass = (isActive: boolean) => {
    return `w-full text-left px-4 py-3 rounded-xl text-base font-bold flex items-center gap-3 transition-colors ${
      isActive 
        ? "bg-govblue text-white shadow-lg" 
        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
    }`;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNav = (view: any) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 sticky top-0 z-50 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center gap-4 lg:gap-8">
             {/* Mobile Menu Button */}
             <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
             >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen 
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    }
                </svg>
             </button>

             <div className="flex items-center gap-2 sm:gap-4 cursor-pointer group" onClick={() => onNavigate('dashboard')}>
                <Logo size="md" />
                <div className="flex flex-col">
                    <h1 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white tracking-tighter leading-none group-hover:text-govblue transition-colors">DESTRAVA</h1>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Gestão Inteligente</span>
                </div>
             </div>

             {/* Desktop Navigation */}
             <nav className="hidden md:flex items-center space-x-1">
                <button onClick={() => onNavigate('dashboard')} className={getLinkClass(currentView === 'dashboard')}>Painel</button>
                <div className="relative group" onMouseEnter={() => setIsDropdownOpen(true)} onMouseLeave={() => setIsDropdownOpen(false)}>
                  <button className={`flex items-center gap-1 ${getLinkClass(currentView.startsWith('manual'))}`}>
                    Diário
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 w-48 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl py-2 animate-fade-in-up">
                      <button onClick={() => { handleNav('manual_pf'); setIsDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-govgreen font-bold border-l-4 border-transparent hover:border-govgreen">Pessoa Física</button>
                      <button onClick={() => { handleNav('manual_pj'); setIsDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-govblue font-bold border-l-4 border-transparent hover:border-govblue">Pessoa Jurídica</button>
                    </div>
                  )}
                </div>
                <button onClick={() => onNavigate('reports')} className={getLinkClass(currentView === 'reports')}>Relatórios</button>
                <button onClick={() => onNavigate('accountability')} className={getLinkClass(currentView === 'accountability')}>Contas</button>
                <button onClick={() => onNavigate('tax')} className={getLinkClass(currentView === 'tax')}>Fiscal</button>
                <button onClick={() => onNavigate('pricing')} className={getLinkClass(currentView === 'pricing')}>Preço</button>
                <button onClick={() => onNavigate('documentation')} className={getLinkClass(currentView === 'documentation')}>Doc</button>
             </nav>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
             <button onClick={onOpenPresentation} className="hidden sm:flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-govblue bg-gray-50 dark:bg-slate-700 hover:bg-blue-50 px-4 py-2 rounded-full transition-colors border border-gray-100 dark:border-slate-600">
               <span className="text-lg">✨</span> Pitch
             </button>
             <button onClick={toggleTheme} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                {isDarkMode ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>}
             </button>
             <div className="relative" ref={userMenuRef}>
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="h-10 w-10 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold border border-gray-100 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">G</button>
                {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 py-1 animate-fade-in-up z-50">
                        <div className="px-4 py-3 border-b border-gray-50 dark:border-slate-700 text-center">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Usuário</p>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">gov.br/artista</p>
                        </div>
                        <button onClick={() => { handleNav('branding'); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium">Branding IA</button>
                        <button onClick={() => { handleNav('documentation'); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium">Documentação</button>
                        <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 font-bold flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                            Sair
                        </button>
                    </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="absolute top-0 left-0 bottom-0 w-[80%] max-w-[300px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-fade-in-left">
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Logo size="sm" />
                        <span className="font-black text-gray-800 dark:text-white tracking-tight">DESTRAVA</span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <button onClick={() => handleNav('dashboard')} className={getMobileLinkClass(currentView === 'dashboard')}>
                        <span>🏠</span> Painel Inicial
                    </button>
                    <div className="py-2 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Finanças Diárias</div>
                    <button onClick={() => handleNav('manual_pj')} className={getMobileLinkClass(currentView === 'manual_pj')}>
                        <span className="text-govblue">🏢</span> Pessoa Jurídica
                    </button>
                    <button onClick={() => handleNav('manual_pf')} className={getMobileLinkClass(currentView === 'manual_pf')}>
                        <span className="text-govgreen">👤</span> Pessoa Física
                    </button>
                    
                    <div className="py-2 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gestão de Projetos</div>
                    <button onClick={() => handleNav('accountability')} className={getMobileLinkClass(currentView === 'accountability')}>
                        <span>📑</span> Prestação de Contas
                    </button>
                    <button onClick={() => handleNav('reports')} className={getMobileLinkClass(currentView === 'reports')}>
                        <span>📊</span> Relatórios
                    </button>
                    <button onClick={() => handleNav('tax')} className={getMobileLinkClass(currentView === 'tax')}>
                        <span>🏛️</span> Fiscal & MEI
                    </button>
                    <button onClick={() => handleNav('pricing')} className={getMobileLinkClass(currentView === 'pricing')}>
                        <span>💰</span> Precificação
                    </button>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-slate-800">
                    <button onClick={onLogout} className="w-full py-3 px-4 rounded-xl text-red-500 font-bold flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        Encerrar Sessão
                    </button>
                </div>
            </div>
        </div>
      )}
    </header>
  );
};

export default Header;
