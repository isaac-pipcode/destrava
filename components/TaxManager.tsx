
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';

interface TaxManagerProps {
  transactions: Transaction[];
  setTransactions?: React.Dispatch<React.SetStateAction<Transaction[]>>; // Added setter to update transactions
  onNavigate: (view: 'manual_pj') => void;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const TaxManager: React.FC<TaxManagerProps> = ({ transactions, setTransactions, onNavigate }) => {
  const currentYear = new Date().getFullYear();
  const MEI_LIMIT = 81000;
  
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceValue, setServiceValue] = useState('');
  const [bankInfo, setBankInfo] = useState('Banco: [Nome] | Ag: [0000] | CC: [00000-0] | Pix: [Chave]');
  const [generatedText, setGeneratedText] = useState('');

  // Quick fix state
  const [solvingId, setSolvingId] = useState<string | null>(null);
  const [quickNf, setQuickNf] = useState('');

  const revenuePJ = useMemo(() => {
    return transactions
      .filter(t => t.entity === 'PJ' && t.type === 'inflow' && new Date(t.date).getFullYear() === currentYear)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions, currentYear]);

  const percentageUsed = (revenuePJ / MEI_LIMIT) * 100;

  const pendingInvoices = useMemo(() => {
    return transactions
      .filter(t => t.entity === 'PJ' && t.type === 'inflow' && !t.paymentDoc)
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

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

  const handleQuickResolve = (id: string) => {
      if (!setTransactions || !quickNf) return;
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, paymentDoc: quickNf } : t));
      setSolvingId(null);
      setQuickNf('');
  };

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
                    className={`h-4 rounded-full transition-all duration-1000 ${percentageUsed > 80 ? 'bg-red-50' : percentageUsed > 50 ? 'bg-orange-400' : 'bg-govgreen'}`} 
                    style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                ></div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl text-sm text-gray-600 dark:text-gray-300">
                {percentageUsed < 80 ? <p>Você utilizou <strong>{percentageUsed.toFixed(1)}%</strong> do seu limite anual. ✅</p> : <p className="text-orange-600 dark:text-orange-400 font-bold">Atenção! Você está próximo do limite. ⚠️</p>}
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><span>🗓️</span> Controle do DAS</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {MONTHS.map((m, idx) => {
                    const isPaid = dasStatus[m];
                    const isFuture = idx > new Date().getMonth();
                    return (
                        <div key={m} className={`p-2 rounded-lg border text-center ${isPaid ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : isFuture ? 'bg-gray-50 dark:bg-slate-700 opacity-50' : 'bg-red-50 dark:bg-red-900/20 border-red-200'}`}>
                            <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">{m.substring(0,3)}</p>
                            {isPaid ? <span className="text-lg">✅</span> : isFuture ? <span className="text-gray-300">-</span> : <span className="text-lg">❌</span>}
                        </div>
                    )
                })}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-orange-600 mb-4 flex items-center gap-2">
                  <span>⚠️</span> Receitas sem Nota Fiscal
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium italic">
                  O sistema identificou estes serviços realizados que ainda não possuem registro de Nota Fiscal (NF-e).
              </p>

              {pendingInvoices.length === 0 ? (
                  <div className="p-8 text-center bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                      <p className="text-green-700 dark:text-green-300 font-bold">Parabéns! Nenhuma pendência fiscal pendente.</p>
                  </div>
              ) : (
                  <div className="max-h-80 overflow-y-auto pr-2 custom-scroll space-y-4">
                      {pendingInvoices.map(t => (
                          <div key={t.id} className="p-4 bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-100 dark:border-orange-800 rounded-2xl transition-all">
                              <div className="flex justify-between items-start mb-3">
                                  <div>
                                      <p className="font-black text-gray-800 dark:text-gray-200 text-sm">{t.description}</p>
                                      <p className="text-[10px] text-gray-500 font-bold uppercase">{new Date(t.date).toLocaleDateString()} • {t.project || 'Geral'}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="font-black text-govblue dark:text-blue-400 text-sm">{formatCurrency(t.amount)}</p>
                                  </div>
                              </div>
                              
                              {solvingId === t.id ? (
                                  <div className="flex gap-2 animate-fade-in">
                                      <input 
                                        type="text" 
                                        value={quickNf} 
                                        onChange={(e) => setQuickNf(e.target.value)}
                                        placeholder="Nº da NF"
                                        className="flex-grow px-3 py-1.5 text-xs rounded-lg border-2 border-orange-300 bg-white dark:bg-slate-900 dark:text-white"
                                        autoFocus
                                      />
                                      <button onClick={() => handleQuickResolve(t.id)} className="px-3 py-1.5 bg-govblue text-white text-xs font-black rounded-lg">SALVAR</button>
                                      <button onClick={() => setSolvingId(null)} className="px-2 py-1.5 text-gray-400 text-xs">×</button>
                                  </div>
                              ) : (
                                  <button 
                                    onClick={() => setSolvingId(t.id)}
                                    className="w-full py-2 border-2 border-dashed border-orange-300 dark:border-orange-800 text-[10px] font-black text-orange-600 dark:text-orange-400 rounded-xl hover:bg-orange-100 transition-colors uppercase"
                                  >
                                    + Informar Nº da Nota Fiscal
                                  </button>
                              )}
                          </div>
                      ))}
                  </div>
              )}
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><span>📝</span> Gerador de Texto para NF</h3>
              <div className="space-y-3">
                  <input type="text" placeholder="Descrição do Serviço" value={serviceDesc} onChange={e => setServiceDesc(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 text-sm dark:text-white" />
                  <input type="text" placeholder="Valor (R$)" value={serviceValue} onChange={e => setServiceValue(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 text-sm dark:text-white" />
                  <textarea placeholder="Dados Bancários" value={bankInfo} onChange={e => setBankInfo(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 text-sm dark:text-white" />
                  <button onClick={handleGenerateText} className="w-full py-2 bg-govblue text-white font-bold rounded-lg text-sm">Gerar Descrição</button>
                  {generatedText && (
                      <div className="mt-4 relative">
                          <textarea readOnly value={generatedText} rows={5} className="w-full p-3 rounded-lg bg-gray-50 dark:bg-slate-900 text-[10px] font-mono border" />
                          <button onClick={copyToClipboard} className="absolute top-2 right-2 bg-white px-2 py-1 rounded border text-[10px] font-bold">Copiar</button>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default TaxManager;
