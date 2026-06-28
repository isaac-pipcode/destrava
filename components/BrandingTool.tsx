
import React, { useState } from 'react';
import { aiClient } from '../services/aiClient';
import { Buildings, PaintBrush, Bank, Rocket, Sparkle, DownloadSimple } from '@phosphor-icons/react';

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

const STYLE_ICONS: Record<string, React.ReactNode> = {
  modern: <Buildings size={24} weight="bold" />,
  artistic: <PaintBrush size={24} weight="bold" />,
  finance: <Bank size={24} weight="bold" />,
  vibrant: <Rocket size={24} weight="bold" />,
};

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
      <div className="bg-surface rounded-3xl shadow-brand-sm border border-line overflow-hidden p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-display font-extrabold text-ink mb-2">IDENTIDADE VISUAL IA</h2>
          <p className="text-sm text-muted">
            Use o motor Gemini para explorar novas possibilidades estéticas para a marca Destrava.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-subtle uppercase tracking-widest mb-3">1. Escolha um Estilo</label>
              <div className="grid grid-cols-2 gap-3">
                {PRESET_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleStyleSelect(style)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${
                      selectedStyle === style.id
                        ? 'border-primary bg-primary-soft text-primary shadow-brand-sm'
                        : 'border-line hover:border-line-strong'
                    }`}
                  >
                    <span className="block mb-1">{STYLE_ICONS[style.id]}</span>
                    <span className="text-xs font-bold uppercase tracking-tight">{style.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-black text-subtle uppercase tracking-widest">2. Refine o Prompt (Opcional)</label>
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setSelectedStyle('custom');
                }}
                rows={4}
                className="w-full p-4 rounded-xl border border-line bg-surface-2 text-sm text-ink focus:ring-2 focus:ring-primary outline-none transition-shadow"
                placeholder="Descreva o logo que você imagina..."
              />
              <button
                onClick={generateLogo}
                disabled={isGenerating}
                className="w-full py-4 bg-primary hover:bg-blue-700 text-white font-bold rounded-xl shadow-brand-md transition-all flex items-center justify-center gap-3 disabled:opacity-50 transform active:scale-95"
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

          <div className="flex flex-col items-center justify-center bg-surface-2 rounded-2xl border-2 border-dashed border-line min-h-[400px] relative overflow-hidden group">
            {generatedLogo ? (
              <img src={generatedLogo} alt="Logo Gerado" className="w-full h-full object-contain p-4 animate-fade-in" />
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 shadow-brand-sm border border-line text-muted">
                    <PaintBrush size={28} weight="bold" />
                </div>
                <p className="text-xs text-subtle font-bold uppercase tracking-widest mb-2">Pré-visualização da IA</p>
                <p className="text-[10px] text-muted max-w-[200px] mx-auto">Selecione um estilo e clique em gerar para ver a mágica acontecer.</p>
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
                className="absolute bottom-4 right-4 bg-surface/90 backdrop-blur-sm p-3 rounded-full shadow-brand-md hover:bg-surface transition-all transform hover:scale-110"
                title="Download"
               >
                 <DownloadSimple size={24} weight="bold" className="text-primary" />
               </button>
            )}
          </div>
        </div>

        <div className="mt-8 p-6 bg-primary-soft rounded-xl border border-line flex items-start gap-4">
            <span className="text-primary"><Sparkle size={20} weight="bold" /></span>
            <div>
                <h4 className="font-bold text-primary text-sm mb-1 italic">Dica de Design</h4>
                <p className="text-xs text-muted leading-relaxed">
                    A geração de logo por IA está temporariamente pausada enquanto migramos para um modelo de imagem soberano (sem dependência de Big Tech). As imagens geradas por IA servem como conceitos visuais para inspiração; para uso profissional, refine com um designer para criar versões vetoriais (SVG).
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingTool;
