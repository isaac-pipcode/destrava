
import React, { useState } from 'react';
import Logo from './Logo';

interface LoginProps {
  onLogin: () => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, isDarkMode, toggleTheme }) => {
  const [isLoading, setIsLoading] = useState<'google' | 'gov' | 'email' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSimulatedLogin = (provider: 'google' | 'gov' | 'email') => {
    setIsLoading(provider);
    
    // Simula o tempo de resposta da API de autenticação (2 segundos)
    setTimeout(() => {
      setIsLoading(null);
      onLogin();
    }, 2000);
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    handleSimulatedLogin('email');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 transition-colors duration-200 relative overflow-hidden">
      
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-govblue/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -right-24 w-64 h-64 bg-govgreen/10 rounded-full blur-3xl"></div>
      </div>

      {/* Theme Toggle (Absolute) */}
      <div className="absolute top-4 right-4 z-10">
        {toggleTheme && (
             <button 
               onClick={toggleTheme}
               className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
             >
                {isDarkMode ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                )}
             </button>
        )}
      </div>

      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border-t-8 border-govblue z-10 relative">
        <div className="p-8">
          
          <div className="flex justify-center mb-8">
             <Logo size="xl" className="transform scale-110" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-gray-800 dark:text-white tracking-tighter">DESTRAVA</h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
              Gestão inteligente para os trabalhadores da cultura
            </p>
          </div>

          <div className="space-y-4">
            {/* Google Button */}
            <button 
              onClick={() => handleSimulatedLogin('google')}
              disabled={!!isLoading}
              className="w-full py-3 px-4 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-full font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
               {isLoading === 'google' ? (
                 <svg className="animate-spin h-5 w-5 text-gray-600 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
               ) : (
                 <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                 </svg>
               )}
               {isLoading === 'google' ? 'Conectando...' : 'Entrar com Google'}
            </button>

            {/* Gov.br Button */}
            <button 
              onClick={() => handleSimulatedLogin('gov')}
              disabled={!!isLoading}
              className="w-full py-3 px-4 bg-[#1351b4] text-white rounded-full font-bold text-lg hover:bg-[#0c326f] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
               {isLoading === 'gov' ? (
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
               ) : (
                 <>
                  <span>Entrar com</span>
                  <span className="font-black italic font-serif text-xl group-hover:underline decoration-2 underline-offset-4">gov.br</span>
                 </>
               )}
            </button>
            
            <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-slate-600"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-bold">Ou via e-mail</span>
                <div className="flex-grow border-t border-gray-200 dark:border-slate-600"></div>
            </div>

            {/* Manual Login Form */}
            <form onSubmit={handleEmailLogin} className="space-y-3">
                <input 
                  type="email" 
                  placeholder="Seu e-mail"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-govblue outline-none transition-shadow"
                />
                <input 
                  type="password" 
                  placeholder="Sua senha"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-govblue outline-none transition-shadow"
                />
                <button 
                  type="submit"
                  disabled={!!isLoading || !email || !password}
                  className="w-full py-3 bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading === 'email' ? 'Autenticando...' : 'Acessar Conta'}
                </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-4">
               Ao continuar, você concorda com os Termos de Uso e Política de Privacidade.
            </p>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-slate-900/50 p-4 text-center border-t border-gray-100 dark:border-slate-700">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Iniciativa de Apoio à Cultura</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
