
import React from 'react';

const Documentation: React.FC = () => {
  const sections = [
    {
      title: "1. Escopo do Produto",
      items: [
        { label: "Vertical", value: "Fintech / Edutech para Economia Criativa" },
        { label: "Problema Central", value: "Complexidade na prestação de contas de editais e mistura de contas PF/PJ." },
        { label: "Solução", value: "Dashboard inteligente com segregação de fluxos e conformidade nativa (LPG/PNAB)." }
      ]
    },
    {
      title: "2. Arquitetura Técnica Atual",
      items: [
        { label: "Linguagem/Framework", value: "React 19 + TypeScript (Vite)" },
        { label: "Processamento de IA", value: "Google Gemini 2.5 Flash (LLM para extração de dados financeiros)" },
        { label: "Persistência", value: "LocalStorage (Local-first architecture)" },
        { label: "Estilização", value: "Tailwind CSS (Design System adaptativo/Dark Mode)" }
      ]
    },
    {
      title: "3. Requisitos para Escala (2.000+ Usuários)",
      items: [
        { label: "Banco de Dados", value: "Migração para PostgreSQL (Supabase/AWS RDS) com Row Level Security." },
        { label: "Autenticação", value: "Integração via Gov.br (OAuth2) e Google Auth." },
        { label: "Infraestrutura", value: "Hospedagem Serverless (Vercel) + API Management para tokens de IA." },
        { label: "Segurança", value: "Criptografia AES-256 para dados bancários e conformidade LGPD." }
      ]
    },
    {
      title: "4. Estrutura de Custos Operacionais",
      items: [
        { label: "Cloud/Hospedagem", value: "Estimado em $20 - $50/mês" },
        { label: "API de IA", value: "Custo por uso (Token-based). Estimado em $0.05 a $0.10 por usuário ativo/mês." },
        { label: "Manutenção", value: "Estimada em 10-15h mensais para correções e suporte técnico." }
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
            <h2 className="text-4xl font-black tracking-tighter mb-2">DOCUMENTAÇÃO TÉCNICA</h2>
            <p className="text-slate-400 font-medium tracking-wide">DESTRAVA | Financial OS for Creative Economy</p>
            <div className="mt-6 flex gap-3">
                <span className="bg-govgreen px-3 py-1 rounded-full text-[10px] font-bold uppercase">v1.0 Beta</span>
                <span className="bg-govblue px-3 py-1 rounded-full text-[10px] font-bold uppercase">Business & Tech Spec</span>
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

            <div className="mt-12 p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-white mb-4">Nota para o Consultor</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Este projeto visa preencher a lacuna entre a <strong>gestão contábil tradicional</strong> e a <strong>realidade informal/intermitente</strong> dos produtores culturais. 
                    A precificação deve considerar não apenas o valor da licença de software (SaaS), mas o valor agregado na <strong>redução de risco de glosa</strong> em editais públicos, onde o erro na prestação de contas pode significar a falência de um microempreendedor cultural.
                </p>
                <div className="mt-6 flex justify-between items-center">
                    <button 
                        onClick={() => window.print()}
                        className="text-xs font-bold text-govblue hover:underline flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        Gerar PDF para Consultoria
                    </button>
                    <span className="text-[10px] text-slate-400">© 2024 DESTRAVA - Todos os direitos reservados</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
    