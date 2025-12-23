
import React, { useState } from 'react';

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
      icon: "🔥",
      content: (
        <ul className="space-y-4 text-gray-600 dark:text-gray-300">
          <li className="flex gap-3">
            <span className="text-red-500 font-bold">✖</span>
            <span><strong>Caos Financeiro:</strong> Mistura de contas PF e PJ, gerando descontrole.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-red-500 font-bold">✖</span>
            <span><strong>Burocracia Cultural:</strong> Editais exigem controle rígido de rubricas.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-red-500 font-bold">✖</span>
            <span><strong>Risco de Glosa:</strong> Erros na prestação de contas forçam a devolução de recursos.</span>
          </li>
        </ul>
      )
    },
    {
      title: "A Solução: Destrava",
      icon: "💡",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            O primeiro <strong>Sistema Operacional Financeiro</strong> nativo para a Economia Criativa.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-4">
             <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <h4 className="font-bold text-govblue dark:text-blue-400 mb-1 text-sm">IA Financeira</h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Categorização automática de extratos bancários.</p>
             </div>
             <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                <h4 className="font-bold text-govgreen dark:text-green-400 mb-1 text-sm">Conformidade</h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Prestação de contas formatada para LPG/PNAB.</p>
             </div>
          </div>
        </div>
      )
    },
    {
      title: "Plano de Crescimento",
      icon: "📈",
      content: (
        <div className="space-y-4">
          <div className="flex gap-4 items-center border-b border-gray-100 dark:border-slate-700 pb-3">
             <div className="h-10 w-10 rounded-full bg-blue-100 text-govblue flex items-center justify-center font-bold">01</div>
             <div>
                <h4 className="text-xs font-bold uppercase">Escalabilidade Cloud</h4>
                <p className="text-[11px] text-gray-500">Migração para banco de dados centralizado e Gov.br Auth.</p>
             </div>
          </div>
          <div className="flex gap-4 items-center border-b border-gray-100 dark:border-slate-700 pb-3">
             <div className="h-10 w-10 rounded-full bg-green-100 text-govgreen flex items-center justify-center font-bold">02</div>
             <div>
                <h4 className="text-xs font-bold uppercase">Integração Bancária</h4>
                <p className="text-[11px] text-gray-500">Conexão direta via Open Finance para automação total.</p>
             </div>
          </div>
          <div className="flex gap-4 items-center">
             <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">03</div>
             <div>
                <h4 className="text-xs font-bold uppercase">Serviços & Marketplace</h4>
                <p className="text-[11px] text-gray-500">Conexão com contadores e emissão de NFs nativa.</p>
             </div>
          </div>
        </div>
      )
    },
    {
      title: "Por que investir?",
      icon: "💎",
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg font-bold text-xs">ROI</div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Economia de <strong>20h/mês</strong> em tarefas burocráticas.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg font-bold text-xs">SEG</div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Segurança contra multas e devolução de verbas públicas.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-purple-100 text-purple-600 p-2 rounded-lg font-bold text-xs">DATA</div>
            <p className="text-sm text-gray-600 dark:text-gray-300">A maior base de dados financeira da economia criativa.</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-govblue to-govgreen p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight uppercase">DESTRAVA <span className="font-light opacity-80">| Pitch</span></h2>
            <p className="text-xs opacity-90 mt-1">Negociação de Parceria e Investimento</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl">{slides[activeSlide].icon}</span>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{slides[activeSlide].title}</h3>
            </div>
            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 min-h-[220px] flex flex-col justify-center">
                {slides[activeSlide].content}
            </div>
        </div>

        {/* Footer / Navigation */}
        <div className="p-6 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex justify-between items-center">
            <div className="flex gap-2">
                {slides.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`h-2 rounded-full transition-all duration-300 ${idx === activeSlide ? 'w-8 bg-govblue' : 'w-2 bg-gray-300 dark:bg-slate-600'}`}
                    />
                ))}
            </div>
            
            <div className="flex gap-3">
                <button 
                    onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))}
                    disabled={activeSlide === 0}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Anterior
                </button>
                <button 
                    onClick={() => {
                        if (activeSlide === slides.length - 1) onClose();
                        else setActiveSlide(prev => Math.min(slides.length - 1, prev + 1));
                    }}
                    className="px-6 py-2 rounded-lg text-sm font-bold bg-govblue text-white hover:bg-blue-700 shadow-md transition-transform active:scale-95"
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
    