
import React from 'react';
import { Globe, Code, Printer } from '@phosphor-icons/react';

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
      <div className="bg-surface rounded-3xl shadow-brand-sm border border-line overflow-hidden">
        {/* Banner */}
        <div className="bg-ink p-10 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Globe size={128} weight="fill" className="text-white" />
            </div>
            <h2 className="text-4xl font-display font-extrabold tracking-tight mb-2">DOSSIÊ TÉCNICO</h2>
            <p className="text-white/60 font-medium tracking-wide uppercase">DESTRAVA | Financial OS for Creative Economy</p>
            <div className="mt-6 flex gap-3">
                <span className="bg-success px-3 py-1 rounded-full text-[10px] font-bold uppercase">Spec v1.1</span>
                <span className="bg-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase">Cloud-Ready Architecture</span>
            </div>
        </div>

        <div className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {sections.map((section, idx) => (
                    <div key={idx} className="space-y-4">
                        <h3 className="text-lg font-display font-bold text-ink border-b border-line pb-2 flex items-center gap-2">
                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                            {section.title}
                        </h3>
                        <div className="space-y-3">
                            {section.items.map((item, i) => (
                                <div key={i} className="flex flex-col">
                                    <span className="text-[10px] font-bold text-subtle uppercase tracking-widest">{item.label}</span>
                                    <span className="text-sm text-muted font-medium leading-tight mt-0.5">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Code Structure Summary for Developers */}
            <div className="mt-12 p-8 bg-surface-2 rounded-3xl border border-line">
                <h4 className="font-display font-bold text-ink mb-6 flex items-center gap-2">
                    <Code size={20} weight="bold" />
                    Resumo da Base de Código (Para Estimativa de Dev)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                    <div className="bg-surface p-4 rounded-xl shadow-brand-sm">
                        <p className="text-2xl font-extrabold text-primary">15+</p>
                        <p className="text-[10px] text-subtle uppercase font-bold">Componentes React</p>
                    </div>
                    <div className="bg-surface p-4 rounded-xl shadow-brand-sm">
                        <p className="text-2xl font-extrabold text-success">100%</p>
                        <p className="text-[10px] text-subtle uppercase font-bold">TypeScript Typing</p>
                    </div>
                    <div className="bg-surface p-4 rounded-xl shadow-brand-sm">
                        <p className="text-2xl font-extrabold text-accent">Serverless</p>
                        <p className="text-[10px] text-subtle uppercase font-bold">Sem Backend Legado</p>
                    </div>
                </div>

                <div className="mt-8 text-sm text-muted space-y-4">
                    <p>O projeto utiliza uma estrutura modular onde cada funcionalidade (Fiscal, Precificação, Relatórios) é independente, facilitando o desenvolvimento paralelo ou a integração com APIs externas.</p>
                    <p><strong>Ponto de Atenção para Precificação:</strong> O motor de IA (GeminiService) já abstrai a complexidade de sanitização de dados financeiros, reduzindo drasticamente o custo de processamento de back-office.</p>
                </div>

                <div className="mt-8 pt-6 border-t border-line flex justify-between items-center">
                    <button
                        onClick={() => window.print()}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-2"
                    >
                        <Printer size={16} weight="bold" />
                        Imprimir Dossiê Completo
                    </button>
                    <span className="text-[10px] text-subtle uppercase">Documento Confidencial | DESTRAVA v1.1</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
    