import React from 'react';

interface Props { children: React.ReactNode; }
interface State { error: Error | null; }

/**
 * Captura erros de render para nunca exibir tela em branco. Mostra uma mensagem
 * legível com a opção de recarregar.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[Destrava] Erro de render:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-bg text-ink flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-surface border border-line rounded-3xl shadow-brand-md p-8 text-center">
            <h1 className="font-display text-2xl font-extrabold text-ink mb-2">Algo deu errado</h1>
            <p className="text-sm text-muted mb-6">
              Ocorreu um erro inesperado ao carregar o app. Tente recarregar a página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-3 bg-primary text-primary-on rounded-xl text-sm font-semibold shadow-brand-sm hover:bg-primary-hover transition-all"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
