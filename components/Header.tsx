
import React, { useState, useRef, useEffect } from 'react';
import { Sparkle, House, Buildings, User, Folder, Bank, Calculator, ChartBar, BookOpen, SignOut, List, X, TrendUp } from '@phosphor-icons/react';
import Logo from './Logo';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: 'dashboard' | 'import' | 'manual_pf' | 'manual_pj' | 'planning' | 'accountability' | 'reports' | 'tax' | 'pricing' | 'documentation' | 'branding') => void;
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
      ? "text-primary-on bg-primary px-4 py-2 rounded-xl font-semibold text-sm shadow-brand-sm"
      : "text-muted hover:text-primary hover:bg-primary-soft px-4 py-2 rounded-xl font-medium text-sm transition-all";
  };

  const getMobileLinkClass = (isActive: boolean) => {
    return `w-full text-left px-4 py-3 rounded-xl text-base font-semibold flex items-center gap-3 transition-colors ${
      isActive
        ? "bg-primary text-primary-on shadow-brand-sm"
        : "text-ink hover:bg-surface-2"
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
    <header className="bg-surface border-b border-line sticky top-0 z-50 shadow-brand-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center gap-4 lg:gap-8">
             {/* Mobile Menu Button */}
             <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-muted hover:bg-surface-2 transition-colors"
             >
                {isMobileMenuOpen
                    ? <X size={24} weight="bold" />
                    : <List size={24} weight="bold" />
                }
             </button>

             <div className="flex items-center gap-2 sm:gap-4 cursor-pointer group" onClick={() => onNavigate('dashboard')}>
                <Logo size="md" />
                <div className="flex flex-col">
                    <h1 className="font-display text-xl sm:text-2xl font-extrabold text-ink tracking-tight leading-none transition-colors">Destrava</h1>
                    <span className="text-[9px] font-semibold text-subtle uppercase tracking-[0.18em] mt-1">Gestão Inteligente</span>
                </div>
             </div>

             {/* Desktop Navigation - Updated Labels & Order */}
             <nav className="hidden md:flex items-center space-x-1">
                <button onClick={() => onNavigate('dashboard')} className={getLinkClass(currentView === 'dashboard')}>Painel</button>
                
                <div className="relative group" onMouseEnter={() => setIsDropdownOpen(true)} onMouseLeave={() => setIsDropdownOpen(false)}>
                  <button className={`flex items-center gap-1 ${getLinkClass(currentView.startsWith('manual'))}`}>
                    Diário Financeiro
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 w-48 bg-surface border border-line rounded-xl shadow-brand-md py-2 animate-fade-in-up">
                      <button onClick={() => { handleNav('manual_pf'); setIsDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-muted hover:bg-success-soft hover:text-success font-bold border-l-4 border-transparent hover:border-success">Pessoa Física</button>
                      <button onClick={() => { handleNav('manual_pj'); setIsDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-muted hover:bg-primary-soft hover:text-primary font-bold border-l-4 border-transparent hover:border-primary">Pessoa Jurídica</button>
                    </div>
                  )}
                </div>

                <button onClick={() => onNavigate('planning')} className={getLinkClass(currentView === 'planning')}>Planejamento</button>
                <button onClick={() => onNavigate('accountability')} className={getLinkClass(currentView === 'accountability')}>Gestão</button>
                <button onClick={() => onNavigate('tax')} className={getLinkClass(currentView === 'tax')}>Fiscal</button>
                <button onClick={() => onNavigate('pricing')} className={getLinkClass(currentView === 'pricing')}>Orçamento</button>
                <button onClick={() => onNavigate('reports')} className={getLinkClass(currentView === 'reports')}>Relatórios</button>
                <button onClick={() => onNavigate('documentation')} className={getLinkClass(currentView === 'documentation')}>Sobre</button>
             </nav>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
             <button onClick={onOpenPresentation} className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-muted hover:text-primary bg-surface-2 hover:bg-primary-soft px-4 py-2 rounded-full transition-colors border border-line">
               <Sparkle size={16} weight="fill" className="text-accent" /> Pitch
             </button>
             <button onClick={toggleTheme} className="p-2 text-muted hover:bg-surface-2 rounded-full transition-colors">
                {isDarkMode ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>}
             </button>
             <div className="relative" ref={userMenuRef}>
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="h-10 w-10 bg-surface-2 rounded-full flex items-center justify-center text-muted font-bold border border-line hover:bg-surface-2 transition-colors">G</button>
                {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-surface rounded-xl shadow-brand-md border border-line py-1 animate-fade-in-up z-50">
                        <div className="px-4 py-3 border-b border-line text-center">
                            <p className="text-[10px] text-subtle font-bold uppercase">Usuário</p>
                            <p className="text-sm font-medium text-ink truncate">gov.br/artista</p>
                        </div>
                        <button onClick={() => { handleNav('branding'); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-muted hover:bg-surface-2 font-medium">Branding IA</button>
                        <button onClick={() => { handleNav('documentation'); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-muted hover:bg-surface-2 font-medium">Sobre o Projeto</button>
                        <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error-soft font-bold flex items-center gap-2">
                            <SignOut size={16} weight="bold" />
                            Sair
                        </button>
                    </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation - Updated Labels & Order */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="absolute top-0 left-0 bottom-0 w-[80%] max-w-[300px] bg-surface shadow-brand-md flex flex-col animate-fade-in-left">
                <div className="p-6 border-b border-line flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Logo size="sm" />
                        <span className="font-display font-extrabold text-ink tracking-tight">Destrava</span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-subtle">
                        <X size={24} weight="bold" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <button onClick={() => handleNav('dashboard')} className={getMobileLinkClass(currentView === 'dashboard')}>
                        <House size={20} weight="fill" /> Painel Inicial
                    </button>

                    <div className="py-2 px-4 text-[10px] font-bold text-subtle uppercase tracking-widest">Finanças</div>
                    <button onClick={() => handleNav('manual_pj')} className={getMobileLinkClass(currentView === 'manual_pj')}>
                        <Buildings size={20} weight="fill" className="text-primary" /> Diário (PJ)
                    </button>
                    <button onClick={() => handleNav('manual_pf')} className={getMobileLinkClass(currentView === 'manual_pf')}>
                        <User size={20} weight="fill" className="text-success" /> Diário (PF)
                    </button>
                    <button onClick={() => handleNav('planning')} className={getMobileLinkClass(currentView === 'planning')}>
                        <TrendUp size={20} weight="fill" className="text-accent" /> Planejamento
                    </button>

                    <div className="py-2 px-4 text-[10px] font-bold text-subtle uppercase tracking-widest">Ferramentas</div>
                    <button onClick={() => handleNav('accountability')} className={getMobileLinkClass(currentView === 'accountability')}>
                        <Folder size={20} weight="fill" /> Gestão & Contas
                    </button>
                    <button onClick={() => handleNav('tax')} className={getMobileLinkClass(currentView === 'tax')}>
                        <Bank size={20} weight="fill" /> Fiscal
                    </button>
                    <button onClick={() => handleNav('pricing')} className={getMobileLinkClass(currentView === 'pricing')}>
                        <Calculator size={20} weight="fill" /> Orçamento
                    </button>
                    <button onClick={() => handleNav('reports')} className={getMobileLinkClass(currentView === 'reports')}>
                        <ChartBar size={20} weight="fill" /> Relatórios
                    </button>

                    <div className="py-2 px-4 text-[10px] font-bold text-subtle uppercase tracking-widest">Informações</div>
                    <button onClick={() => handleNav('documentation')} className={getMobileLinkClass(currentView === 'documentation')}>
                        <BookOpen size={20} weight="fill" /> Sobre
                    </button>
                </div>

                <div className="p-4 border-t border-line">
                    <button onClick={onLogout} className="w-full py-3 px-4 rounded-xl text-error font-bold flex items-center gap-3">
                        <SignOut size={20} weight="bold" />
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
