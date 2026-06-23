
import React, { useState } from 'react';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

const Login: React.FC<LoginProps> = ({ isDarkMode, toggleTheme }) => {
  const { signInWithPassword, signUpWithPassword, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleGoogle = async () => {
    setError(null);
    setInfo(null);
    setLoadingProvider('google');
    try {
      // Redireciona para o Google; o retorno é tratado pelo Supabase.
      await signInWithGoogle();
    } catch (e) {
      setError((e as Error).message || 'Não foi possível entrar com o Google.');
      setLoadingProvider(null);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email || !password) return;
    setLoadingProvider('email');
    try {
      if (mode === 'login') {
        await signInWithPassword(email, password);
      } else {
        const { needsConfirmation } = await signUpWithPassword(email, password);
        if (needsConfirmation) {
          setInfo('Conta criada! Confirme o e-mail enviado para concluir o acesso.');
        }
      }
    } catch (e) {
      setError((e as Error).message || 'Falha na autenticação. Verifique os dados.');
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 transition-colors duration-200 relative overflow-hidden">

      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-govblue/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -right-24 w-64 h-64 bg-govgreen/10 rounded-full blur-3xl"></div>
      </div>

      {/* Theme Toggle */}
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
            <h1 className="text-4xl font-black text-[#1d357d] dark:text-white tracking-tighter uppercase">Destrava</h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
              {mode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'} — gestão inteligente para a cultura
            </p>
          </div>

          <div className="space-y-4">
            {/* Google Button */}
            <button
              onClick={handleGoogle}
              disabled={!!loadingProvider}
              className="w-full py-3.5 px-4 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-full font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
               {loadingProvider === 'google' ? (
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
               <span className="text-sm">Continuar com Google</span>
            </button>

            <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-slate-600"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-[10px] uppercase font-bold tracking-widest">Ou via e-mail</span>
                <div className="flex-grow border-t border-gray-200 dark:border-slate-600"></div>
            </div>

            {error && (
              <div className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            {info && (
              <div className="text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-xl px-4 py-3">
                {info}
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleEmail} className="space-y-3">
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  value={email}
                  autoComplete="email"
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-govblue outline-none transition-shadow"
                />
                <input
                  type="password"
                  placeholder={mode === 'signup' ? 'Crie uma senha (mín. 6 caracteres)' : 'Sua senha'}
                  value={password}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-govblue outline-none transition-shadow"
                />
                <button
                  type="submit"
                  disabled={!!loadingProvider || !email || !password}
                  className="w-full py-3.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loadingProvider === 'email'
                    ? 'Processando...'
                    : mode === 'login' ? 'Acessar Conta' : 'Criar Conta'}
                </button>
            </form>

            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
              {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem uma conta?'}{' '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setInfo(null); }}
                className="font-bold text-govblue dark:text-blue-400 underline"
              >
                {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
              </button>
            </p>

            <p className="text-center text-[10px] text-gray-400 mt-6 uppercase tracking-tight">
               Ao continuar, você concorda com os <a href="#" className="underline">Termos de Uso</a> e <a href="#" className="underline">Privacidade</a>.
            </p>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-slate-900/50 p-4 text-center border-t border-gray-100 dark:border-slate-700">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Tecnologia para a Cultura Brasileira</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
