
import React, { useState } from 'react';
import { Flame, Lightbulb, TrendUp, Diamond, X } from '@phosphor-icons/react';

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PresentationModal: React.FC<PresentationModalProps> = ({ isOpen, onClose }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      title: "O Problema",
      icon: <Flame size={40} weight="fill" className="text-error" />,
      content: (
        <ul className="space-y-4 text-muted">
          <li className="flex gap-3">
            <span className="text-error font-bold">✖</span>
            <span><strong>Caos Financeiro:</strong> Mistura de contas PF e PJ, gerando descontrole.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-error font-bold">✖</span>
            <span><strong>Burocracia Cultural:</strong> Editais exigem controle rígido de rubricas.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-error font-bold">✖</span>
            <span><strong>Risco de Glosa:</strong> Erros na prestação de contas forçam a devolução de recursos.</span>
          </li>
        </ul>
      )
    },
    {
      title: "A Solução: Destrava",
      icon: <Lightbulb size={40} weight="fill" className="text-accent" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted">
            O primeiro <strong>Sistema Operacional Financeiro</strong> nativo para a Economia Criativa.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-4">
             <div className="p-4 bg-primary-soft rounded-xl border border-line">
                <h4 className="font-bold text-primary mb-1 text-sm">IA Financeira</h4>
                <p className="text-[10px] text-muted">Categorização automática de extratos bancários.</p>
             </div>
             <div className="p-4 bg-success-soft rounded-xl border border-line">
                <h4 className="font-bold text-success mb-1 text-sm">Conformidade</h4>
                <p className="text-[10px] text-muted">Prestação de contas formatada para LPG/PNAB.</p>
             </div>
          </div>
        </div>
      )
    },
    {
      title: "Plano de Crescimento",
      icon: <TrendUp size={40} weight="fill" className="text-primary" />,
      content: (
        <div className="space-y-4">
          <div className="flex gap-4 items-center border-b border-line pb-3">
             <div className="h-10 w-10 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold">01</div>
             <div>
                <h4 className="text-xs font-bold uppercase">Escalabilidade Cloud</h4>
                <p className="text-[11px] text-muted">Migração para banco de dados centralizado e Gov.br Auth.</p>
             </div>
          </div>
          <div className="flex gap-4 items-center border-b border-line pb-3">
             <div className="h-10 w-10 rounded-full bg-success-soft text-success flex items-center justify-center font-bold">02</div>
             <div>
                <h4 className="text-xs font-bold uppercase">Integração Bancária</h4>
                <p className="text-[11px] text-muted">Conexão direta via Open Finance para automação total.</p>
             </div>
          </div>
          <div className="flex gap-4 items-center">
             <div className="h-10 w-10 rounded-full bg-secondary-soft text-secondary flex items-center justify-center font-bold">03</div>
             <div>
                <h4 className="text-xs font-bold uppercase">Serviços & Marketplace</h4>
                <p className="text-[11px] text-muted">Conexão com contadores e emissão de NFs nativa.</p>
             </div>
          </div>
        </div>
      )
    },
    {
      title: "Por que investir?",
      icon: <Diamond size={40} weight="fill" className="text-secondary" />,
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary-soft text-primary p-2 rounded-lg font-bold text-xs">ROI</div>
            <p className="text-sm text-muted">Economia de <strong>20h/mês</strong> em tarefas burocráticas.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-success-soft text-success p-2 rounded-lg font-bold text-xs">SEG</div>
            <p className="text-sm text-muted">Segurança contra multas e devolução de verbas públicas.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-secondary-soft text-secondary p-2 rounded-lg font-bold text-xs">DATA</div>
            <p className="text-sm text-muted">A maior base de dados financeira da economia criativa.</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface w-full max-w-2xl rounded-3xl shadow-brand-md overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-success p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-display font-extrabold tracking-tight uppercase">DESTRAVA <span className="font-light opacity-80">| Pitch</span></h2>
            <p className="text-xs opacity-90 mt-1">Negociação de Parceria e Investimento</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-colors">
            <X size={24} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl">{slides[activeSlide].icon}</span>
                <h3 className="text-2xl font-display font-bold text-ink">{slides[activeSlide].title}</h3>
            </div>
            <div className="bg-surface-2 rounded-2xl p-6 border border-line min-h-[220px] flex flex-col justify-center">
                {slides[activeSlide].content}
            </div>
        </div>

        {/* Footer / Navigation */}
        <div className="p-6 border-t border-line bg-surface-2 flex justify-between items-center">
            <div className="flex gap-2">
                {slides.map((_, idx) => (
                    <div
                        key={idx}
                        className={`h-2 rounded-full transition-all duration-300 ${idx === activeSlide ? 'w-8 bg-primary' : 'w-2 bg-line-strong'}`}
                    />
                ))}
            </div>
            
            <div className="flex gap-3">
                <button 
                    onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))}
                    disabled={activeSlide === 0}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-muted hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Anterior
                </button>
                <button 
                    onClick={() => {
                        if (activeSlide === slides.length - 1) onClose();
                        else setActiveSlide(prev => Math.min(slides.length - 1, prev + 1));
                    }}
                    className="px-6 py-2 rounded-lg text-sm font-bold bg-primary text-primary-on hover:bg-primary-hover shadow-brand-md transition-transform active:scale-95"
                >
                    {activeSlide === slides.length - 1 ? 'Concluir' : 'Próximo'}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default PresentationModal;
    