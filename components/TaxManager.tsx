import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';

interface TaxManagerProps {
  transactions: Transaction[];
  onNavigate: (view: 'manual_pj') => void;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const TaxManager: React.FC<TaxManagerProps> = ({ transactions, onNavigate }) => {
  const currentYear = new Date().getFullYear();
  const MEI_LIMIT = 81000;
  
  // --- STATE FOR INVOICE GENERATOR ---
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceValue, setServiceValue] = useState('');
  const [bankInfo, setBankInfo] = useState('Banco: [Nome] | Ag: [0000] | CC: [00000-0] | Pix: [Chave]');
  const [generatedText, setGeneratedText] = useState('');

  // --- CALCULATIONS ---

  // 1. MEI Ceiling (Revenue PJ in current year)
  const revenuePJ = useMemo(() => {
    return transactions
      .filter(t => t.entity === 'PJ' && t.type === 'inflow' && new Date(t.date).getFullYear() === currentYear)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions, currentYear]);

  const percentageUsed = (revenuePJ / MEI_LIMIT) * 100;

  // 2. Missing Invoices (Inflows PJ without paymentDoc)
  const pendingInvoices = useMemo(() => {
    return transactions
      .filter(t => t.entity === 'PJ' && t.type === 'inflow' && !t.paymentDoc)
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  // 3. DAS Payment Check (Outflows PJ category 'Impostos' by month)
  const dasStatus = useMemo(() => {
    const status: Record<string, boolean> = {};
    MONTHS.forEach(m => status[m] = false);

    transactions
      .filter(t => 
        t.entity === 'PJ' && 
        t.type === 'outflow' && 
        new Date(t.date).getFullYear() === currentYear &&
        (t.category.includes('Impostos') || t.description.toLowerCase().includes('das'))
      )
      .forEach(t => {
        status[t.month] = true;
      });
    
    return status;
  }, [transactions, currentYear]);

  // --- ACTIONS ---

  const handleGenerateText = () => {
    const text = `PRESTAÇÃO DE SERVIÇOS DE ${serviceDesc.toUpperCase()}.
REFERENTE AO MÊS DE ${MONTHS[new Date().getMonth()].toUpperCase()}/${currentYear}.

VALOR TOTAL: R$ ${serviceValue}

DADOS BANCÁRIOS PARA PAGAMENTO:
${bankInfo}

Declaro que sou optante pelo Simples Nacional (MEI), não gerando direito a crédito fiscal de IPI e ICMS.`;
    setGeneratedText(text);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    alert('Texto copiado para a área de transferência!');
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="animate-fade-in-up pb-12">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 mb-8 border-l-8 border-govorange">
         <h2 className="text-3xl font-display font-bold text-gray-800 dark:text-white mb-2">Gestão Fiscal MEI</h2>
         <p className="text-gray-500 dark:text-gray-400">
            Monitore seu faturamento anual, controle a emissão de notas fiscais e o pagamento do DAS.
         </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* MEI LIMIT TRACKER */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <span>📈</span> Termômetro do Teto MEI ({currentYear})
            </h3>
            
            <div className="mb-2 flex justify-between items-end">
                <span className="text-3xl font-bold text-govblue dark:text-blue-400">{formatCurrency(revenuePJ)}</span>
                <span className="text-xs text-gray-400 font-bold uppercase">Limite: {formatCurrency(MEI_LIMIT)}</span>
            </div>

            <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-4 mb-4 overflow-hidden">
                <div 
                    className={`h-4 rounded-full transition-all duration-1000 ${percentageUsed > 80 ? 'bg-red-500' : percentageUsed > 50 ? 'bg-orange-400' : 'bg-govgreen'}`} 
                    style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                ></div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl text-sm text-gray-600 dark:text-gray-300">
                {percentageUsed < 80 ? (
                    <p>Você utilizou <strong>{percentageUsed.toFixed(1)}%</strong> do seu limite anual. Situação Confortável. ✅</p>
                ) : percentageUsed < 100 ? (
                    <p className="text-orange-600 dark:text-orange-400 font-bold">Atenção! Você está próximo do limite. Considere o desenquadramento ou organize o fluxo de caixa. ⚠️</p>
                ) : (
                    <p className="text-red-600 dark:text-red-400 font-bold">Limite excedido! Procure um contador urgente para migração para ME. 🚨</p>
                )}
            </div>
        </div>

        {/* DAS CHECKLIST */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <span>🗓️</span> Controle do DAS (Imposto Mensal)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Monitoramento automático baseado nos lançamentos de saída com categoria "Impostos".
            </p>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {MONTHS.map((m, idx) => {
                    const isPaid = dasStatus[m];
                    const isFuture = idx > new Date().getMonth();
                    
                    return (
                        <div key={m} className={`p-2 rounded-lg border text-center ${
                            isPaid 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                            : isFuture 
                                ? 'bg-gray-50 dark:bg-slate-700 border-gray-100 dark:border-slate-600 opacity-50'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        }`}>
                            <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">{m.substring(0,3)}</p>
                            {isPaid ? (
                                <span className="text-lg">✅</span>
                            ) : isFuture ? (
                                <span className="text-gray-300">-</span>
                            ) : (
                                <span className="text-lg" title="Pendente/Não Identificado">❌</span>
                            )}
                        </div>
                    )
                })}
            </div>
             <div className="mt-4 text-right">
                <a 
                    href="https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/Identificacao" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-govblue hover:underline flex justify-end items-center gap-1"
                >
                    Emitir Guia DAS (Gov.br) ↗
                </a>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* PENDING INVOICES LIST */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 text-orange-600">
                  ⚠️ Receitas sem Nota Fiscal
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Os seguintes recebimentos foram identificados no extrato mas não possuem número de documento (NF) cadastrado.
              </p>

              {pendingInvoices.length === 0 ? (
                  <div className="p-8 text-center bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                      <p className="text-green-700 dark:text-green-300 font-bold">Tudo certo! Todas as receitas possuem nota vinculada.</p>
                  </div>
              ) : (
                  <div className="max-h-64 overflow-y-auto pr-2 custom-scroll space-y-3">
                      {pendingInvoices.map(t => (
                          <div key={t.id} className="p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 rounded-lg flex justify-between items-center">
                              <div>
                                  <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{t.description}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(t.date).toLocaleDateString()} • {t.project || 'Sem Projeto'}</p>
                              </div>
                              <div className="text-right">
                                  <p className="font-bold text-govblue dark:text-blue-400 text-sm">{formatCurrency(t.amount)}</p>
                                  <button 
                                    onClick={() => onNavigate('manual_pj')}
                                    className="text-[10px] font-bold text-orange-600 hover:underline"
                                  >
                                    Corrigir &rarr;
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>

          {/* INVOICE TEXT GENERATOR */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <span>📝</span> Gerador de Texto para NF
              </h3>
              <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Descrição do Serviço (Ex: Direção de Arte)" 
                    value={serviceDesc}
                    onChange={e => setServiceDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white"
                  />
                  <input 
                    type="text" 
                    placeholder="Valor (Ex: 2.500,00)" 
                    value={serviceValue}
                    onChange={e => setServiceValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white"
                  />
                  <textarea 
                    placeholder="Dados Bancários" 
                    value={bankInfo}
                    onChange={e => setBankInfo(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white"
                  />
                  
                  <button 
                    onClick={handleGenerateText}
                    className="w-full py-2 bg-govblue text-white font-bold rounded-lg text-sm hover:bg-blue-700"
                  >
                    Gerar Descrição Padrão
                  </button>

                  {generatedText && (
                      <div className="mt-4 relative">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Texto Gerado</label>
                          <textarea 
                            readOnly
                            value={generatedText}
                            rows={6}
                            className="w-full mt-1 p-3 rounded-lg bg-gray-100 dark:bg-slate-900 text-xs font-mono text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700"
                          />
                          <button 
                            onClick={copyToClipboard}
                            className="absolute top-6 right-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 px-2 py-1 rounded text-xs font-bold hover:bg-gray-50"
                          >
                            Copiar
                          </button>
                      </div>
                  )}
              </div>
          </div>

      </div>
    </div>
  );
};

export default TaxManager;
