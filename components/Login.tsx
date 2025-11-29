import React from 'react';

interface LoginProps {
  onLogin: () => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, isDarkMode, toggleTheme }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      
      {/* Theme Toggle (Absolute) */}
      <div className="absolute top-4 right-4">
        {toggleTheme && (
             <button 
               onClick={toggleTheme}
               className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
             >
                {isDarkMode ? '☀️' : '🌙'}
             </button>
        )}
      </div>

      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border-t-8 border-govblue">
        <div className="p-8 text-center">
          
          {/* Logo Abstraction */}
          <div className="flex justify-center mb-6">
             <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                    <div className="w-6 h-6 bg-govblue rounded-tl-lg"></div>
                    <div className="w-6 h-6 bg-govgreen rounded-tr-lg"></div>
                </div>
                <div className="flex gap-1">
                    <div className="w-6 h-6 bg-govorange rounded-bl-lg"></div>
                    <div className="w-6 h-6 bg-govblue rounded-br-lg"></div>
                </div>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-2">MAPA DA GESTÃO</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Sistema de apoio à gestão financeira para trabalhadores da cultura e economia criativa.
          </p>

          <div className="space-y-4">
            <button 
              onClick={onLogin}
              className="w-full py-3 px-4 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-full font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-3 shadow-sm"
            >
               <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png" alt="Google" className="w-5 h-5" />
               Entrar com Google
            </button>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-slate-600"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">Acesso Governamental</span>
                <div className="flex-grow border-t border-gray-200 dark:border-slate-600"></div>
            </div>

            <button 
              onClick={onLogin}
              className="w-full py-4 px-4 bg-govblue text-white rounded-full font-bold text-lg hover:bg-blue-800 transition-all shadow-lg flex items-center justify-center gap-2"
            >
               <span>Entrar com</span> <span className="font-extrabold italic">gov.br</span>
            </button>
            
            <p className="text-xs text-gray-400 mt-4">
               Utilize sua conta gov.br para sincronizar dados de editais estaduais e federais.
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