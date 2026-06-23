
import React, { useState } from 'react';
import { aiClient } from '../services/aiClient';

interface PromptStyle {
  id: string;
  name: string;
  emoji: string;
  prompt: string;
}

const PRESET_STYLES: PromptStyle[] = [
  {
    id: 'modern',
    name: 'Moderno',
    emoji: '🏢',
    prompt: 'A professional minimalist logo for a fintech called Destrava, featuring an open padlock symbol, deep blue and emerald green colors, vector style, white background, high quality, flat design.'
  },
  {
    id: 'artistic',
    name: 'Artístico',
    emoji: '🎨',
    prompt: 'A creative and artistic logo for a cultural management platform called Destrava, incorporating Brazilian folk art patterns (cordel style), vibrant orange and green colors, professional design, high quality, cultural heritage vibe.'
  },
  {
    id: 'finance',
    name: 'Financeiro',
    emoji: '🏦',
    prompt: 'A solid, professional corporate logo for a financial platform called Destrava, strong geometric padlock icon with a dollar sign detail, navy blue and silver accents, trustworthy feel, 4k, vector, clean typography.'
  },
  {
    id: 'vibrant',
    name: 'Criativo',
    emoji: '🚀',
    prompt: 'A vibrant and energetic logo for "Destrava", high contrast between orange and cyan, abstract lock symbol transforming into a rising arrow, modern bold typography, digital art style, innovative look.'
  }
];

const BrandingTool: React.FC = () => {
  const [prompt, setPrompt] = useState(PRESET_STYLES[0].prompt);
  const [selectedStyle, setSelectedStyle] = useState(PRESET_STYLES[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);

  const handleStyleSelect = (style: PromptStyle) => {
    setSelectedStyle(style.id);
    setPrompt(style.prompt);
  };

  const generateLogo = async () => {
    setIsGenerating(true);
    try {
      const logoDataUrl = await aiClient.generateLogo(prompt);
      setGeneratedLogo(logoDataUrl);
    } catch (error) {
      console.error("Erro ao gerar logo:", error);
      alert("Não foi possível gerar a imagem. Verifique sua conexão e chave de API.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up pb-12">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">IDENTIDADE VISUAL IA</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Use o motor Gemini para explorar novas possibilidades estéticas para a marca Destrava.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">1. Escolha um Estilo</label>
              <div className="grid grid-cols-2 gap-3">
                {PRESET_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleStyleSelect(style)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${
                      selectedStyle === style.id 
                        ? 'border-govblue bg-blue-50 dark:bg-blue-900/20 text-govblue shadow-sm' 
                        : 'border-gray-100 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span className="text-lg block mb-1">{style.emoji}</span>
                    <span className="text-xs font-bold uppercase tracking-tight">{style.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">2. Refine o Prompt (Opcional)</label>
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setSelectedStyle('custom');
                }}
                rows={4}
                className="w-full p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-sm dark:text-white focus:ring-2 focus:ring-govblue outline-none transition-shadow"
                placeholder="Descreva o logo que você imagina..."
              />
              <button
                onClick={generateLogo}
                disabled={isGenerating}
                className="w-full py-4 bg-govblue hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 transform active:scale-95"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Imaginando...
                  </>
                ) : (
                  'Gerar Conceito de Marca'
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 min-h-[400px] relative overflow-hidden group">
            {generatedLogo ? (
              <img src={generatedLogo} alt="Logo Gerado" className="w-full h-full object-contain p-4 animate-fade-in" />
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border">
                    <span className="text-3xl">🎨</span>
                </div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Pré-visualização da IA</p>
                <p className="text-[10px] text-gray-500 max-w-[200px] mx-auto">Selecione um estilo e clique em gerar para ver a mágica acontecer.</p>
              </div>
            )}
            
            {generatedLogo && (
               <button 
                onClick={() => {
                    const link = document.createElement('a');
                    link.href = generatedLogo;
                    link.download = `destrava-${selectedStyle}-logo.png`;
                    link.click();
                }}
                className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-3 rounded-full shadow-xl hover:bg-white dark:hover:bg-slate-700 transition-all transform hover:scale-110"
                title="Download"
               >
                 <svg className="w-6 h-6 text-govblue dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                 </svg>
               </button>
            )}
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-4">
            <span className="text-xl">✨</span>
            <div>
                <h4 className="font-bold text-govblue dark:text-blue-300 text-sm mb-1 italic">Dica de Design</h4>
                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                    As imagens geradas por IA são conceitos visuais para inspiração. Para uso profissional (papelaria, redes sociais, uniformes), recomendamos exportar essas ideias e refinar com um designer profissional para criar versões vetoriais (SVG).
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingTool;
