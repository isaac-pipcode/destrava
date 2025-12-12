
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
            <span><strong>Caos Financeiro:</strong> Mistura de contas PF (Pessoal) e PJ (Empresa), gerando descontrole.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-red-500 font-bold">✖</span>
            <span><strong>Burocracia Cultural:</strong> Editais (LPG/PNAB) exigem controle rígido de rubricas que planilhas não entregam.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-red-500 font-bold">✖</span>
            <span><strong>Risco Fiscal:</strong> Desconhecimento do teto MEI e falta de precificação correta geram dívidas.</span>
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
            Um <strong>Sistema Operacional Financeiro</strong> desenhado para a Economia Criativa.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-4">
             <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <h4 className="font-bold text-govblue dark:text-blue-400 mb-1">Gestão Híbrida</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Visão unificada de PF e PJ sem misturar os caixas.</p>
             </div>
             <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                <h4 className="font-bold text-govgreen dark:text-green-400 mb-1">Foco em Editais</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Prestação de contas nativa para leis de incentivo.</p>
             </div>
          </div>
        </div>
      )
    },
    {
      title: "Tecnologia & IA",
      icon: "🤖",
      content: (
        <ul className="space-y-4 text-gray-600 dark:text-gray-300">
          <li className="flex gap-3 items-center">
            <span className="bg-purple-100 text-purple-600 p-1 rounded">Gemini 2.5</span>
            <span>Leitura automática de extratos bancários (CSV/TXT).</span>
          </li>
          <li className="flex gap-3 items-center">
            <span className="bg-blue-100 text-blue-600 p-1 rounded">React + Vite</span>
            <span>Performance nativa, PWA-ready e escalável.</span>
          </li>
          <li className="flex gap-3 items-center">
            <span className="bg-orange-100 text-orange-600 p-1 rounded">Segurança</span>
            <span>Processamento local e arquitetura Serverless.</span>
          </li>
        </ul>
      )
    },
    {
      title: "Estágio Atual (MVP)",
      icon: "🚀",
      content: (
        <div className="grid grid-cols-2 gap-3 text-sm">
           <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              <span className="text-green-500">✔</span> Dashboard Financeiro
           </div>
           <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              <span className="text-green-500">✔</span> Importação via IA
           </div>
           <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              <span className="text-green-500">✔</span> Prestação de Contas (LPG)
           </div>
           <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              <span className="text-green-500">✔</span> Controle Fiscal MEI
           </div>
           <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              <span className="text-green-500">✔</span> Precificação de Projetos
           </div>
           <div className="flex items-center gap-2 text-gray-400">
              <span>⏳</span> Integração Bancária (Open Finance)
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
            <h2 className="text-2xl font-black tracking-tight">DESTRAVA <span className="font-light opacity-80">| Apresentação</span></h2>
            <p className="text-xs opacity-90 mt-1">Pitch Deck Interativo</p>
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
            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 min-h-[200px] flex flex-col justify-center">
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
    