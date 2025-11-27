import React, { useState } from 'react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: 'dashboard' | 'import' | 'manual_pf' | 'manual_pj' | 'accountability' | 'reports') => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getLinkClass = (isActive: boolean) => {
    return isActive
      ? "text-white bg-govblue px-4 py-2 rounded-md font-bold text-sm shadow-md"
      : "text-gray-600 hover:text-govblue hover:bg-blue-50 px-4 py-2 rounded-md font-medium text-sm transition-all";
  };

  return (
    <header className="bg-white border-b-4 border-govgreen sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center gap-8">
             <div 
               className="flex items-center gap-3 cursor-pointer group"
               onClick={() => onNavigate('dashboard')}
             >
                {/* Logo Abstract Representation similar to Mapa da Cultura */}
                <div className="flex flex-col gap-0.5">
                    <div className="flex gap-0.5">
                        <div className="w-4 h-4 bg-govblue rounded-tl-lg"></div>
                        <div className="w-4 h-4 bg-govgreen rounded-tr-lg"></div>
                    </div>
                    <div className="flex gap-0.5">
                        <div className="w-4 h-4 bg-govorange rounded-bl-lg"></div>
                        <div className="w-4 h-4 bg-govblue rounded-br-lg"></div>
                    </div>
                </div>
                <div className="flex flex-col">
                    <h1 className="text-xl font-extrabold text-gray-800 tracking-tight leading-none">MAPA DA<br/>GESTÃO</h1>
                </div>
             </div>

             <nav className="hidden md:flex items-center space-x-2">
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className={getLinkClass(currentView === 'dashboard')}
                >
                  Painel
                </button>
                
                {/* Dropdown for Diário Financeiro */}
                <div 
                  className="relative group"
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <button 
                    className={`flex items-center gap-1 ${getLinkClass(currentView.startsWith('manual'))}`}
                  >
                    Diário Financeiro
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 w-48 bg-white border border-gray-100 rounded-lg shadow-xl py-2 animate-fade-in-up">
                      <button 
                        onClick={() => { onNavigate('manual_pf'); setIsDropdownOpen(false); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-govgreen font-bold border-l-4 border-transparent hover:border-govgreen"
                      >
                        Pessoa Física
                      </button>
                      <button 
                        onClick={() => { onNavigate('manual_pj'); setIsDropdownOpen(false); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-govblue font-bold border-l-4 border-transparent hover:border-govblue"
                      >
                        Pessoa Jurídica (MEI)
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => onNavigate('reports')}
                  className={getLinkClass(currentView === 'reports')}
                >
                  Relatórios
                </button>

                <button 
                  onClick={() => onNavigate('accountability')}
                  className={getLinkClass(currentView === 'accountability')}
                >
                  Prestação de Contas
                </button>
                <button 
                  onClick={() => onNavigate('import')}
                  className={getLinkClass(currentView === 'import')}
                >
                  Diagnóstico IA
                </button>
             </nav>
          </div>
          
          <div className="flex items-center">
             <div className="hidden md:block text-right mr-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Apoio à Gestão</p>
                <p className="text-xs font-bold text-govblue">Trabalhadores da Cultura</p>
             </div>
             <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold border border-gray-200">
                G
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;