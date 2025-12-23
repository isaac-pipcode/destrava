
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

const BrandingTool: React.FC = () => {
  const [prompt, setPrompt] = useState('A professional minimalist logo for a fintech called Destrava, featuring an open padlock symbol, deep blue and emerald green colors, vector style, white background, high quality.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);

  const generateLogo = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            imageConfig: {
                aspectRatio: "1:1"
            }
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setGeneratedLogo(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
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
          <div className="space-y-4">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Instrução para a IA</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-sm dark:text-white focus:ring-2 focus:ring-govblue outline-none"
            />
            <button
              onClick={generateLogo}
              disabled={isGenerating}
              className="w-full py-4 bg-govblue hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
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

          <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 min-h-[300px] relative overflow-hidden">
            {generatedLogo ? (
              <img src={generatedLogo} alt="Logo Gerado" className="w-full h-full object-contain p-4 animate-fade-in" />
            ) : (
              <div className="text-center p-8">
                <span className="text-4xl mb-4 block">🎨</span>
                <p className="text-xs text-gray-400 font-bold uppercase">Pré-visualização da IA</p>
              </div>
            )}
            
            {generatedLogo && (
               <button 
                onClick={() => {
                    const link = document.createElement('a');
                    link.href = generatedLogo;
                    link.download = 'destrava-concept-logo.png';
                    link.click();
                }}
                className="absolute bottom-4 right-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white transition-colors"
                title="Download"
               >
                 <svg className="w-5 h-5 text-govblue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
               </button>
            )}
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <h4 className="font-bold text-govblue dark:text-blue-300 text-sm mb-2 italic">Aviso de Branding</h4>
            <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                As imagens geradas por IA são conceitos visuais. Elas podem servir de inspiração para designers criarem versões finais em alta definição (SVG) que garantam a consistência da marca em todos os canais.
            </p>
        </div>
      </div>
    </div>
  );
};

export default BrandingTool;
