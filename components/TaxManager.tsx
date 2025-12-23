
import React, { useState, useMemo } from 'react';
import { Transaction, BusinessProfile, Cnae } from '../types';
import { maskCpfCnpj } from './ManualManager';

interface TaxManagerProps {
  transactions: Transaction[];
  setTransactions?: React.Dispatch<React.SetStateAction<Transaction[]>>;
  onNavigate: (view: 'manual_pj') => void;
  businessProfile: BusinessProfile;
  onUpdateProfile: (profile: BusinessProfile) => void;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const CULTURAL_CNAES: Cnae[] = [
  { code: '9001-9/01', description: 'Produção de espetáculos circenses, de marionetes e similares' },
  { code: '9001-9/02', description: 'Produção musical' },
  { code: '9001-9/03', description: 'Produção de espetáculos de dança' },
  { code: '9001-9/06', description: 'Atividades de sonorização e de iluminação' },
  { code: '9003-5/00', description: 'Gestão de espaços para artes cênicas, espetáculos e outras atividades artísticas' },
  { code: '5911-1/99', description: 'Atividades de produção cinematográfica, de vídeos e de programas de televisão' },
  { code: '8592-9/01', description: 'Ensino de dança' },
  { code: '8592-9/99', description: 'Ensino de arte e cultura não especificado anteriormente' },
  { code: '7490-1/05', description: 'Agenciamento de profissionais para atividades culturais e artísticas' },
  { code: '8230-0/01', description: 'Serviços de organização de feiras, congressos, exposições e festas' }
];

const TaxManager: React.FC<TaxManagerProps> = ({ transactions, setTransactions, onNavigate, businessProfile, onUpdateProfile }) => {
  const currentYear = new Date().getFullYear();
  const MEI_LIMIT = 81000;
  
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceValue, setServiceValue] = useState('');
  const [bankInfo, setBankInfo] = useState('Banco: [Nome] | Ag: [0000] | CC: [00000-0] | Pix: [Chave]');
  const [generatedText, setGeneratedText] = useState('');

  // Quick fix state
  const [solvingId, setSolvingId] = useState<string | null>(null);
  const [quickNf, setQuickNf] = useState('');

  // Monthly Detail View State
  const [selectedTaxMonth, setSelectedTaxMonth] = useState<string | null>(null);
  
  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState<BusinessProfile>({ ...businessProfile });

  const revenuePJ = useMemo(() => {
    return transactions
      .filter(t => t.entity === 'PJ' && t.type === 'inflow' && new Date(t.date).getFullYear() === currentYear)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions, currentYear]);

  const percentageUsed = (revenuePJ / MEI_LIMIT) * 100;

  const pendingInvoices = useMemo(() => {
    return transactions
      .filter(t => t.entity === 'PJ' && t.type === 'inflow' && t.category === 'Cachê Artístico/Serviço' && !t.paymentDoc)
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

  const monthTransactions = useMemo(() => {
      if (!selectedTaxMonth) return [];
      return transactions.filter(t => t.entity === 'PJ' && t.month === selectedTaxMonth && new Date(t.date).getFullYear() === currentYear);
  }, [transactions, selectedTaxMonth, currentYear]);

  const handleQuickResolve = (id: string) => {
      if (!setTransactions || !quickNf) return;
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, paymentDoc: quickNf } : t));
      setSolvingId(null);
      setQuickNf('');
  };

  const handleSaveProfile = () => {
    onUpdateProfile(tempProfile);
    setIsEditingProfile(false);
  };

  const handleGenerateText = () => {
    const cnaeLine = businessProfile.mainCnae 
        ? `\nCNAE: ${businessProfile.mainCnae.code} - ${businessProfile.mainCnae.description}` 
        : '';

    const text = `PRESTAÇÃO DE SERVIÇOS DE ${serviceDesc.toUpperCase()}.
REFERENTE AO MÊS DE ${MONTHS[new Date().getMonth()].toUpperCase()}/${currentYear}.${cnaeLine}

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
      {/* SEÇÃO: PERFIL DE NEGÓCIO / CNAE */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 mb-8 border-t-8 border-govblue">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Perfil da Empresa / CNAE</h3>
            {!isEditingProfile && (
                <button onClick={() => setIsEditingProfile(true)} className="text-xs font-bold text-govblue hover:underline">Editar Perfil</button>
            )}
        </div>

        {isEditingProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase">Razão Social / Nome MEI</label>
                        <input type="text" value={tempProfile.companyName} onChange={e => setTempProfile({...tempProfile, companyName: e.target.value})} className="w-full rounded-xl border px-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase">CNPJ</label>
                        <input type="text" value={tempProfile.cnpj} onChange={e => setTempProfile({...tempProfile, cnpj: maskCpfCnpj(e.target.value)})} className="w-full rounded-xl border px-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 dark:text-white" />
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">CNAE Principal de Serviço</label>
                        <select 
                            value={tempProfile.mainCnae?.code || ''} 
                            onChange={e => {
                                const found = CULTURAL_CNAES.find(c => c.code === e.target.value);
                                setTempProfile({...tempProfile, mainCnae: found});
                            }}
                            className="w-full rounded-xl border px-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 dark:text-white"
                        >
                            <option value="">-- Selecione o CNAE --</option>
                            {CULTURAL_CNAES.map(c => (
                                <option key={c.code} value={c.code}>{c.code} - {c.description}</option>
                            ))}
                        </select>
                        <p className="text-[9px] text-gray-400 mt-1 italic">* O CNAE correto garante que você pague o imposto certo (Anexo III para cultura).</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={handleSaveProfile} className="flex-grow py-2 bg-govblue text-white text-xs font-black rounded-xl shadow-md">Salvar Configurações</button>
                        <button onClick={() => setIsEditingProfile(false)} className="px-4 py-2 text-xs font-bold text-gray-500">Cancelar</button>
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex flex-wrap gap-8 items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-govblue text-xl font-bold">🏢</div>
                    <div>
                        <p className="text-xs font-black text-gray-800 dark:text-white">{businessProfile.companyName || 'Empresa não configurada'}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{businessProfile.cnpj || '00.000.000/0001-00'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-govgreen text-xl font-bold">📄</div>
                    <div>
                        <p className="text-xs font-black text-gray-800 dark:text-white">CNAE Ativo: {businessProfile.mainCnae?.code || 'Pendente'}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate max-w-[200px]">{businessProfile.mainCnae?.description || 'Configure no botão ao lado'}</p>
                    </div>
                </div>
                {!businessProfile.mainCnae && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-xl border border-dashed border-orange-200 flex items-center gap-2">
                        <span className="animate-pulse">⚠️</span>
                        <p className="text-[10px] font-bold text-orange-600">Configure seu CNAE para habilitar o gerador de NF automático.</p>
                    </div>
                )}
            </div>
        )}
      </div>

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
            <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-4 mb-4 overflow-hidden shadow-inner">
                <div 
                    className={`h-4 rounded-full transition-all duration-1000 ${percentageUsed > 80 ? 'bg-red-500' : percentageUsed > 50 ? 'bg-orange-400' : 'bg-govgreen'}`} 
                    style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                ></div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl text-sm text-gray-600 dark:text-gray-300 border border-dashed border-gray-200">
                {percentageUsed < 80 ? <p>Você utilizou <strong>{percentageUsed.toFixed(1)}%</strong> do seu limite anual. ✅</p> : <p className="text-orange-600 dark:text-orange-400 font-bold">Atenção! Você está próximo do limite. ⚠️</p>}
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><span>🗓️</span> Controle do DAS <span className="text-[10px] font-normal text-gray-400 uppercase ml-2">(Clique no mês para ver detalhes)</span></h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {MONTHS.map((m, idx) => {
                    const isPaid = dasStatus[m];
                    const isFuture = idx > new Date().getMonth();
                    const isSelected = selectedTaxMonth === m;
                    return (
                        <button 
                            key={m} 
                            onClick={() => setSelectedTaxMonth(isSelected ? null : m)}
                            className={`p-2 rounded-lg border text-center transition-all transform active:scale-95 ${isSelected ? 'ring-4 ring-govblue border-govblue' : ''} ${isPaid ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : isFuture ? 'bg-gray-50 dark:bg-slate-700 opacity-50' : 'bg-red-50 dark:bg-red-900/20 border-red-200'}`}
                        >
                            <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">{m.substring(0,3)}</p>
                            {isPaid ? <span className="text-lg">✅</span> : isFuture ? <span className="text-gray-300">-</span> : <span className="text-lg">❌</span>}
                        </button>
                    )
                })}
            </div>
        </div>
      </div>

      {/* MONTHLY DETAIL DRAWER */}
      {selectedTaxMonth && (
          <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border-2 border-govblue animate-fade-in-up">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <div>
                    <h3 className="text-xl font-black text-govblue uppercase tracking-tight">Detalhamento Mensal: {selectedTaxMonth}</h3>
                    <p className="text-xs font-bold text-gray-400">VERIFICAÇÃO DE DOCUMENTAÇÃO FISCAL</p>
                  </div>
                  <button onClick={() => setSelectedTaxMonth(null)} className="text-gray-400 hover:text-red-500 font-bold text-xl">×</button>
              </div>
              
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead>
                          <tr className="text-[10px] font-black text-gray-400 uppercase border-b">
                              <th className="px-4 py-3">Descrição / Item</th>
                              <th className="px-4 py-3">Categoria</th>
                              <th className="px-4 py-3 text-right">Valor</th>
                              <th className="px-4 py-3 text-center">Nota Fiscal</th>
                              <th className="px-4 py-3 text-right">Ação</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y">
                          {monthTransactions.length === 0 ? (
                              <tr><td colSpan={5} className="py-8 text-center text-gray-400 italic">Nenhum lançamento registrado para este mês.</td></tr>
                          ) : (
                              monthTransactions.map(t => (
                                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                      <td className="px-4 py-4">
                                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{t.description}</p>
                                          <p className="text-[10px] text-gray-400">{t.project || 'Administrativo'}</p>
                                      </td>
                                      <td className="px-4 py-4 text-xs text-gray-500">{t.category}</td>
                                      <td className={`px-4 py-4 text-right font-bold text-sm ${t.type === 'inflow' ? 'text-emerald-600' : 'text-red-500'}`}>
                                          {formatCurrency(t.amount)}
                                      </td>
                                      <td className="px-4 py-4 text-center">
                                          {t.paymentDoc ? (
                                              <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-md">NF: {t.paymentDoc}</span>
                                          ) : t.category === 'Cachê Artístico/Serviço' ? (
                                              <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-black rounded-md animate-pulse">NF PENDENTE</span>
                                          ) : (
                                              <span className="text-gray-300">-</span>
                                          )}
                                      </td>
                                      <td className="px-4 py-4 text-right">
                                          {solvingId === t.id ? (
                                              <div className="flex gap-1 justify-end">
                                                  <input 
                                                    type="text" 
                                                    value={quickNf} 
                                                    onChange={e => setQuickNf(e.target.value)}
                                                    className="w-20 px-2 py-1 text-[10px] border-2 border-govblue rounded"
                                                    placeholder="Nº NF"
                                                  />
                                                  <button onClick={() => handleQuickResolve(t.id)} className="bg-govblue text-white px-2 py-1 rounded text-[10px]">OK</button>
                                              </div>
                                          ) : (
                                              <button onClick={() => setSolvingId(t.id)} className="text-govblue hover:underline text-[10px] font-bold">Vincular NF</button>
                                          )}
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-orange-600 mb-4 flex items-center gap-2">
                  <span>⚠️</span> Receitas sem Nota Fiscal
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium italic">
                  O Destrava identificou serviços que precisam de emissão de nota para regularizar seu faturamento.
              </p>

              {pendingInvoices.length === 0 ? (
                  <div className="p-8 text-center bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                      <p className="text-green-700 dark:text-green-300 font-bold">Parabéns! Suas notas estão em dia. ✅</p>
                  </div>
              ) : (
                  <div className="max-h-80 overflow-y-auto pr-2 custom-scroll space-y-4">
                      {pendingInvoices.map(t => (
                          <div key={t.id} className="p-4 bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-100 dark:border-orange-800 rounded-2xl transition-all">
                              <div className="flex justify-between items-start mb-3">
                                  <div>
                                      <p className="font-black text-gray-800 dark:text-gray-200 text-sm">{t.description}</p>
                                      <p className="text-[10px] text-gray-500 font-bold uppercase">{new Date(t.date).toLocaleDateString()} • {t.month} • {t.project || 'Geral'}</p>
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
                                        placeholder="Número da Nota"
                                        className="flex-grow px-3 py-1.5 text-xs rounded-lg border-2 border-orange-300 bg-white dark:bg-slate-900 dark:text-white"
                                        autoFocus
                                      />
                                      <button onClick={() => handleQuickResolve(t.id)} className="px-3 py-1.5 bg-govblue text-white text-xs font-black rounded-lg">LANÇAR</button>
                                      <button onClick={() => setSolvingId(null)} className="px-2 py-1.5 text-gray-400 text-xs font-bold">×</button>
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
              <p className="text-xs text-gray-400 mb-4 font-bold uppercase">Agilize o preenchimento no site da prefeitura</p>
              <div className="space-y-3">
                  <input type="text" placeholder="Ex: Show voz e violão na Praça Central" value={serviceDesc} onChange={e => setServiceDesc(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 text-sm dark:text-white" />
                  <input type="text" placeholder="Valor (R$)" value={serviceValue} onChange={e => setServiceValue(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 text-sm dark:text-white" />
                  <textarea placeholder="Dados Bancários para o Tomador" value={bankInfo} onChange={e => setBankInfo(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 text-sm dark:text-white" />
                  <button onClick={handleGenerateText} className="w-full py-2 bg-govblue text-white font-bold rounded-lg text-sm shadow-md transition-transform active:scale-95">Gerar Descrição Padrão</button>
                  {generatedText && (
                      <div className="mt-4 relative animate-fade-in">
                          <textarea readOnly value={generatedText} rows={5} className="w-full p-3 rounded-lg bg-gray-50 dark:bg-slate-900 text-[10px] font-mono border border-indigo-100" />
                          <button onClick={copyToClipboard} className="absolute top-2 right-2 bg-white px-2 py-1 rounded border shadow-sm text-[10px] font-bold hover:bg-govblue hover:text-white transition-colors">Copiar</button>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default TaxManager;
