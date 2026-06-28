
import React, { useState } from 'react';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

const Login: React.FC<LoginProps> = ({ isDarkMode, toggleTheme }) => {
  const { signInWithPassword, signUpWithPassword, signInWithMagicLink } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingProvider, setLoadingProvider] = useState<'magic' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleMagicLink = async () => {
    setError(null);
    setInfo(null);
    if (!email) {
      setError('Informe seu e-mail para receber o link de acesso.');
      return;
    }
    setLoadingProvider('magic');
    try {
      await signInWithMagicLink(email);
      setInfo('Link de acesso enviado! Confira seu e-mail para entrar sem senha.');
    } catch (e) {
      setError((e as Error).message || 'Não foi possível enviar o link de acesso.');
    } finally {
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
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4 transition-colors duration-200 relative overflow-hidden">

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
               className="p-2 text-muted hover:bg-surface-2 rounded-full transition-colors"
             >
                {isDarkMode ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                )}
             </button>
        )}
      </div>

      <div className="max-w-md w-full bg-surface rounded-3xl shadow-brand-md overflow-hidden border border-line border-t-8 border-t-primary z-10 relative">
        <div className="p-8">

          <div className="flex justify-center mb-8">
             <Logo size="xl" className="transform scale-110" />
          </div>

          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-extrabold text-ink tracking-tight">Destrava</h1>
            <p className="text-sm font-medium text-muted mt-2">
              {mode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'} — gestão inteligente para a cultura
            </p>
          </div>

          <div className="space-y-4">
            {/* Magic Link — login sem senha, sem provedores de Big Tech */}
            <button
              onClick={handleMagicLink}
              disabled={!!loadingProvider}
              className="w-full py-3.5 px-4 bg-surface border border-line-strong rounded-full font-semibold text-ink hover:bg-surface-2 transition-all flex items-center justify-center gap-3 shadow-brand-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
               {loadingProvider === 'magic' ? (
                 <svg className="animate-spin h-5 w-5 text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
               ) : (
                 <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
               )}
               <span className="text-sm">Receber link de acesso por e-mail</span>
            </button>

            <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-line"></div>
                <span className="flex-shrink-0 mx-4 text-subtle text-[10px] uppercase font-bold tracking-widest">Ou com senha</span>
                <div className="flex-grow border-t border-line"></div>
            </div>

            {error && (
              <div className="text-xs font-semibold text-error bg-error-soft border border-error rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            {info && (
              <div className="text-xs font-semibold text-success bg-success-soft border border-success rounded-xl px-4 py-3">
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
                  className="w-full px-4 py-3 rounded-xl border border-line bg-surface-2 text-ink text-sm focus:ring-2 focus:ring-primary outline-none transition-shadow"
                />
                <input
                  type="password"
                  placeholder={mode === 'signup' ? 'Crie uma senha (mín. 6 caracteres)' : 'Sua senha'}
                  value={password}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-line bg-surface-2 text-ink text-sm focus:ring-2 focus:ring-primary outline-none transition-shadow"
                />
                <button
                  type="submit"
                  disabled={!!loadingProvider || !email || !password}
                  className="w-full py-3.5 bg-primary hover:bg-primary-hover text-primary-on font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loadingProvider === 'email'
                    ? 'Processando...'
                    : mode === 'login' ? 'Acessar Conta' : 'Criar Conta'}
                </button>
            </form>

            <p className="text-center text-xs text-muted mt-4">
              {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem uma conta?'}{' '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setInfo(null); }}
                className="font-bold text-primary underline"
              >
                {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
              </button>
            </p>

            <p className="text-center text-[10px] text-subtle mt-6 uppercase tracking-tight">
               Ao continuar, você concorda com os <a href="#" className="underline">Termos de Uso</a> e <a href="#" className="underline">Privacidade</a>.
            </p>
          </div>
        </div>
        <div className="bg-surface-2 p-4 text-center border-t border-line">
            <p className="text-[10px] text-subtle uppercase tracking-widest font-bold">Tecnologia para a Cultura Brasileira</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
