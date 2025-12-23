
import React from 'react';

const Documentation: React.FC = () => {
  const sections = [
    {
      title: "1. Escopo & Proposta",
      items: [
        { label: "Categoria", value: "Fintech / SaaS para Economia Criativa" },
        { label: "Target", value: "MEI Cultural, Artistas e Produtores Independentes" },
        { label: "Valor Agregado", value: "Automação de Prestação de Contas e Segregação de Fluxo PF/PJ." }
      ]
    },
    {
      title: "2. Síntese da Estrutura (Tech Stack)",
      items: [
        { label: "Core", value: "React 19 + TypeScript + Vite (High Performance)" },
        { label: "UI/UX", value: "Tailwind CSS + Design System Gov-inspired" },
        { label: "Inteligência", value: "Google Gemini 2.5 Flash (Extração e Insights)" },
        { label: "Estado/Dados", value: "Persistence via LocalStorage + Complex State Management" }
      ]
    },
    {
      title: "3. Roadmap de Implementação",
      items: [
        { label: "Fase 1 (MVP)", value: "Gestão Local, IA de Extratos e Relatórios LPG (Concluído)" },
        { label: "Fase 2 (Cloud)", value: "Autenticação Gov.br, Banco de Dados Cloud (PostgreSQL) e Multi-dispositivo." },
        { label: "Fase 3 (Banking)", value: "Integração Open Finance (Pluggy/Belvo) para automação real de extratos." },
        { label: "Fase 4 (Escala)", value: "App Mobile (PWA), Marketplace de Contabilidade e Emissão de Notas em Lote." }
      ]
    },
    {
      title: "4. Métricas para Precificação",
      items: [
        { label: "Complexidade IA", value: "Prompt Engineering otimizado para formatos bancários brasileiros." },
        { label: "Regras de Negócio", value: "Motor de rubricas adaptado às leis de fomento vigentes." },
        { label: "Custo de Escala", value: "Arquitetura Serverless minimiza custo fixo mensal por usuário." }
      ]
    }
  ];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up pb-12">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {/* Banner */}
        <div className="bg-slate-900 p-10 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            </div>
            <h2 className="text-4xl font-black tracking-tighter mb-2">DOSSIÊ TÉCNICO</h2>
            <p className="text-slate-400 font-medium tracking-wide uppercase">DESTRAVA | Financial OS for Creative Economy</p>
            <div className="mt-6 flex gap-3">
                <span className="bg-govgreen px-3 py-1 rounded-full text-[10px] font-bold uppercase">Spec v1.1</span>
                <span className="bg-govblue px-3 py-1 rounded-full text-[10px] font-bold uppercase">Cloud-Ready Architecture</span>
            </div>
        </div>

        <div className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {sections.map((section, idx) => (
                    <div key={idx} className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                            <span className="w-2 h-2 bg-govblue rounded-full"></span>
                            {section.title}
                        </h3>
                        <div className="space-y-3">
                            {section.items.map((item, i) => (
                                <div key={i} className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-tight mt-0.5">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Code Structure Summary for Developers */}
            <div className="mt-12 p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                    Resumo da Base de Código (Para Estimativa de Dev)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                        <p className="text-2xl font-black text-govblue">15+</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Componentes React</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                        <p className="text-2xl font-black text-govgreen">100%</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">TypeScript Typing</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                        <p className="text-2xl font-black text-govorange">Serverless</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Sem Backend Legado</p>
                    </div>
                </div>
                
                <div className="mt-8 text-sm text-slate-600 dark:text-slate-400 space-y-4">
                    <p>O projeto utiliza uma estrutura modular onde cada funcionalidade (Fiscal, Precificação, Relatórios) é independente, facilitando o desenvolvimento paralelo ou a integração com APIs externas.</p>
                    <p><strong>Ponto de Atenção para Precificação:</strong> O motor de IA (GeminiService) já abstrai a complexidade de sanitização de dados financeiros, reduzindo drasticamente o custo de processamento de back-office.</p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <button 
                        onClick={() => window.print()}
                        className="text-xs font-bold text-govblue hover:underline flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        Imprimir Dossiê Completo
                    </button>
                    <span className="text-[10px] text-slate-400 uppercase">Documento Confidencial | DESTRAVA v1.1</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
    