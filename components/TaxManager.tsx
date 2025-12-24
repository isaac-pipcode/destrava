
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, BusinessProfile, Cnae, SimulatedInvoice, BankAccount } from '../types';
import { maskCpfCnpj } from './ManualManager';
import { GoogleGenAI } from "@google/genai";

interface TaxManagerProps {
  transactions: Transaction[];
  businessProfile: BusinessProfile;
  accounts: BankAccount[];
  onUpdateProfile: (profile: BusinessProfile) => void;
  initialTransactionId?: string;
  onSaveInvoice: (invoice: SimulatedInvoice) => void;
  invoices: SimulatedInvoice[];
  onDeleteInvoice: (id: string) => void;
}

const CULTURAL_CNAES: Cnae[] = [
  { code: '9001-9/01', description: 'Produção de espetáculos teatrais' },
  { code: '9001-9/02', description: 'Produção de espetáculos musicais' },
  { code: '9001-9/06', description: 'Atividades de sonorização e iluminação' },
  { code: '5911-1/99', description: 'Produção cinematográfica e de vídeos' },
  { code: '8230-0/01', description: 'Serviços de organização de feiras e festas' },
  { code: '8592-9/99', description: 'Ensino de arte e cultura não especificado' }
];

const TaxManager: React.FC<TaxManagerProps> = ({ 
  transactions, businessProfile, accounts, onUpdateProfile, 
  initialTransactionId, onSaveInvoice, invoices, onDeleteInvoice 
}) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'history' | 'config'>('simulator');
  const [setupMode, setSetupMode] = useState(!businessProfile.cnpj);
  const [tempProfile, setTempProfile] = useState<BusinessProfile>(() => ({
      ...businessProfile,
      regime: businessProfile.regime || 'MEI'
  }));

  const [isExpandingDescription, setIsExpandingDescription] = useState(false);
  
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerDoc, setCustomerDoc] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceValue, setServiceValue] = useState<number>(0);
  const [selectedCnae, setSelectedCnae] = useState<Cnae | null>(businessProfile.mainCnae || null);
  const [withholdIss, setWithholdIss] = useState(false);
  const [issRate, setIssRate] = useState(2);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [showBankDetailsOnInvoice, setShowBankDetailsOnInvoice] = useState(true);

  // Carregar dados de uma transação do Diário se houver
  useEffect(() => {
    if (initialTransactionId) {
        const t = transactions.find(tx => tx.id === initialTransactionId);
        if (t) {
            setServiceDesc(t.description);
            setServiceValue(t.amount);
            if (t.supplierDoc) setCustomerDoc(t.supplierDoc);
        }
    }
  }, [initialTransactionId, transactions]);

  const factorR = useMemo(() => {
      if (businessProfile.regime !== 'ME' || !businessProfile.lastPayrollTotal) return 0;
      const annualRevenue = transactions
        .filter(t => t.entity === 'PJ' && t.type === 'inflow')
        .reduce((acc, t) => acc + t.amount, 0) || 1;
      return ((businessProfile.lastPayrollTotal * 12) / annualRevenue) * 100;
  }, [businessProfile, transactions]);

  const taxCalculation = useMemo(() => {
    const isMei = businessProfile.regime === 'MEI';
    if (isMei) return { rate: 0, federal: 0, iss: 0, total: 0 };
    const baseRate = factorR >= 28 ? 0.06 : 0.155;
    const federalTaxes = serviceValue * baseRate;
    const issValue = withholdIss ? serviceValue * (issRate / 100) : 0;
    return { rate: baseRate * 100, federal: federalTaxes, iss: issValue, total: federalTaxes + issValue };
  }, [businessProfile, serviceValue, factorR, withholdIss, issRate]);

  const applyManualTemplate = () => {
    const template = `Prestação de serviços artísticos de [DESCREVER ATIVIDADE], referente ao projeto [NOME DO PROJETO], realizado em [DATA/LOCAL]. Valor total bruto: ${formatCurrency(serviceValue)}.`;
    setServiceDesc(template);
  };

  const expandDescriptionWithAI = async () => {
    if (!serviceDesc || serviceDesc.length < 5) return;
    setIsExpandingDescription(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Como um assistente fiscal para artistas brasileiros, transforme esta descrição curta em um texto formal e técnico para Nota Fiscal de Serviço (NFSe), adequado para prestação de contas de editais (LPG/Aldir Blanc). Seja profissional e detalhado. Descrição curta: "${serviceDesc}". Retorne APENAS o texto expandido final.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      
      if (response.text) setServiceDesc(response.text.trim());
    } catch (e) {
      console.error("Erro na IA:", e);
      alert("Não foi possível expandir com IA. Verifique sua chave API.");
    } finally {
      setIsExpandingDescription(false);
    }
  };

  const handleArchiveInvoice = () => {
    if (!serviceValue || !serviceDesc) return;
    const invoice: SimulatedInvoice = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        customerName: customerName || 'Consumidor Final',
        customerDoc: customerDoc,
        serviceDescription: serviceDesc,
        amount: serviceValue,
        taxTotal: taxCalculation.total,
        netValue: serviceValue - taxCalculation.total,
        cnae: selectedCnae?.code || businessProfile.mainCnae?.code || '',
        status: 'draft'
    };
    onSaveInvoice(invoice);
    alert("Nota arquivada no histórico!");
    setCustomerName(''); setCustomerDoc(''); setServiceDesc(''); setServiceValue(0);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (setupMode) {
    return (
        <div className="max-w-4xl mx-auto animate-fade-in py-8 px-4">
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border-t-8 border-govblue p-8 md:p-12">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-govblue text-3xl">🏛️</div>
                    <div><h2 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Onboarding Fiscal</h2><p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Configure os dados da sua empresa para cálculos e emissões.</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Razão Social</label><input type="text" value={tempProfile.companyName} onChange={e => setTempProfile({...tempProfile, companyName: e.target.value})} placeholder="NOME DA EMPRESA LTDA" className="w-full px-5 py-4 rounded-2xl border bg-gray-50 dark:bg-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-govblue transition-all"/></div>
                        <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CNPJ</label><input type="text" value={tempProfile.cnpj} onChange={e => setTempProfile({...tempProfile, cnpj: maskCpfCnpj(e.target.value)})} placeholder="00.000.000/0001-00" className="w-full px-5 py-4 rounded-2xl border bg-gray-50 dark:bg-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-govblue transition-all"/></div>
                    </div>
                    <div className="space-y-6">
                        <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CNAE Principal</label><select value={tempProfile.mainCnae?.code || ''} onChange={e => setTempProfile({...tempProfile, mainCnae: CULTURAL_CNAES.find(c => c.code === e.target.value)})} className="w-full px-5 py-4 rounded-2xl border bg-gray-50 dark:bg-slate-900 dark:text-white font-bold h-[58px] outline-none"><option value="">Selecione sua atividade...</option>{CULTURAL_CNAES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.description.substring(0, 35)}...</option>)}</select></div>
                        <button onClick={() => { onUpdateProfile(tempProfile); setSetupMode(false); }} className="w-full py-5 bg-govblue text-white font-black rounded-3xl shadow-xl hover:bg-blue-800 transition-all uppercase text-sm tracking-widest">Acessar Painel Fiscal</button>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in-up pb-12 px-2 sm:px-0">
      
      {/* Menu Superior de Gestão Fiscal */}
      <div className="flex justify-center mb-10">
          <div className="bg-white dark:bg-slate-800 p-1.5 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700 flex">
              <button onClick={() => setActiveTab('simulator')} className={`px-8 py-3 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'simulator' ? 'bg-govblue text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>✍️ Elaborar Nota</button>
              <button onClick={() => setActiveTab('history')} className={`px-8 py-3 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-govblue text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>📚 Histórico</button>
              <button onClick={() => setActiveTab('config')} className={`px-8 py-3 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'config' ? 'bg-govblue text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>⚙️ Ajustes</button>
          </div>
      </div>

      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Bloco de Formulário */}
            <div className="lg:col-span-5 space-y-8">
                <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-xl border border-gray-100 dark:border-slate-700">
                    <h3 className="text-xl font-black text-gray-800 dark:text-white mb-8 uppercase tracking-tighter flex items-center gap-2">
                      <span className="text-govblue">👤</span> Dados do Tomador
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nome / Razão Social</label>
                            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ex: Sesc São Paulo" className="w-full px-5 py-3 rounded-2xl border bg-gray-50 dark:bg-slate-900 dark:text-white text-sm font-bold outline-none focus:ring-2 focus:ring-govblue"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">CNPJ / CPF</label>
                                <input type="text" value={customerDoc} onChange={e => setCustomerDoc(maskCpfCnpj(e.target.value))} placeholder="00.000.000/0000-00" className="w-full px-5 py-3 rounded-2xl border bg-gray-50 dark:bg-slate-900 dark:text-white text-xs font-mono outline-none focus:ring-2 focus:ring-govblue"/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Serviço (CNAE)</label>
                                <select value={selectedCnae?.code || ''} onChange={e => setSelectedCnae(CULTURAL_CNAES.find(c => c.code === e.target.value) || null)} className="w-full px-4 py-3 rounded-2xl border bg-gray-50 dark:bg-slate-900 dark:text-white text-[10px] font-black outline-none">
                                    <option value="">Atividade Padrão</option>
                                    {CULTURAL_CNAES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-xl font-black text-gray-800 dark:text-white mt-10 mb-6 uppercase tracking-tighter flex items-center gap-2">
                       <span className="text-govblue">📄</span> Detalhes do Serviço
                    </h3>
                    <div className="space-y-5">
                        <div className="relative">
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Discriminação</label>
                              <div className="flex gap-2">
                                <button onClick={applyManualTemplate} className="text-[9px] font-black text-govblue uppercase bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors">Template 📄</button>
                                <button 
                                    onClick={expandDescriptionWithAI}
                                    disabled={isExpandingDescription || serviceDesc.length < 5}
                                    className="text-[9px] font-black text-white uppercase bg-govblue px-2 py-1 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors"
                                >
                                    IA ✨
                                </button>
                              </div>
                            </div>
                            <textarea value={serviceDesc} onChange={e => setServiceDesc(e.target.value)} rows={5} placeholder="Descreva sua atividade ou use um template..." className="w-full px-5 py-4 rounded-2xl border bg-gray-50 dark:bg-slate-900 dark:text-white text-sm font-medium outline-none focus:ring-2 focus:ring-govblue leading-relaxed"/>
                            {isExpandingDescription && (
                                <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 rounded-2xl flex items-center justify-center animate-pulse">
                                    <span className="text-xs font-black text-govblue uppercase tracking-widest">Aprimorando texto...</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Valor Bruto (R$)</label>
                                <input type="number" value={serviceValue || ''} onChange={e => setServiceValue(parseFloat(e.target.value) || 0)} className="w-full px-5 py-3 rounded-2xl border bg-gray-50 dark:bg-slate-900 dark:text-white text-sm font-black outline-none"/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Conta de Recebimento</label>
                                <select value={selectedBankId} onChange={e => setSelectedBankId(e.target.value)} className="w-full px-4 py-3 rounded-2xl border bg-gray-50 dark:bg-slate-900 dark:text-white text-[10px] font-black outline-none">
                                    <option value="">Selecione...</option>
                                    {accounts.map(a => <option key={a.id} value={a.id}>{a.bank} - {a.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-dashed">
                           <div>
                              <p className="text-[10px] font-black text-gray-500 uppercase">Exibir Dados Bancários na Nota?</p>
                              <p className="text-[9px] text-gray-400 font-medium italic leading-none mt-1">Geralmente inserido na discriminação.</p>
                           </div>
                           <button 
                            onClick={() => setShowBankDetailsOnInvoice(!showBankDetailsOnInvoice)}
                            className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${showBankDetailsOnInvoice ? 'bg-govgreen' : 'bg-gray-300'}`}
                           >
                              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${showBankDetailsOnInvoice ? 'translate-x-6' : 'translate-x-0'}`} />
                           </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Espelho da Nota */}
            <div className="lg:col-span-7">
                <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border-4 border-slate-50 dark:border-slate-700 overflow-hidden sticky top-24">
                    <div className="bg-slate-100 dark:bg-slate-900 px-10 py-6 flex justify-between items-center border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-govblue rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg">NF</div>
                            <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Simulação de Emissão</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Conformidade Legal Ativa</p>
                            </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-gray-400 uppercase">Nº 00000000</p>
                          <p className="text-[9px] font-bold text-gray-300">SÉRIE 1</p>
                        </div>
                    </div>
                    
                    <div className="p-10 space-y-8">
                        <div className="grid grid-cols-2 gap-10 border-b pb-8">
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Prestador de Serviços</p>
                              <p className="text-xs font-black text-gray-800 dark:text-white uppercase leading-tight">{businessProfile.companyName}</p>
                              <p className="text-[10px] font-mono text-gray-400 mt-1">{businessProfile.cnpj}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Tomador de Serviços</p>
                              <p className="text-xs font-black text-gray-800 dark:text-white uppercase leading-tight">{customerName || 'IDENTIFICAÇÃO DO CLIENTE'}</p>
                              <p className="text-[10px] font-mono text-gray-400 mt-1">{customerDoc || '00.000.000/0000-00'}</p>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border text-xs font-mono text-gray-600 dark:text-gray-300 leading-relaxed shadow-inner">
                            <p className="whitespace-pre-wrap">{serviceDesc || 'Aguardando preenchimento da discriminação...'}</p>
                            
                            {selectedBankId && showBankDetailsOnInvoice && (
                                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 animate-fade-in">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 underline">Dados para Transferência Bancária</p>
                                    <p className="text-[10px] font-bold text-govblue uppercase">
                                      {accounts.find(a => a.id === selectedBankId)?.bank} | {accounts.find(a => a.id === selectedBankId)?.name}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-4 gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-[2rem]">
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-[1.5rem] text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Bruto</p>
                                <p className="text-xs font-black dark:text-white">{formatCurrency(serviceValue)}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-[1.5rem] text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Impostos</p>
                                <p className="text-xs font-black text-red-500">-{formatCurrency(taxCalculation.total)}</p>
                            </div>
                            <div className="bg-slate-900 p-5 rounded-[1.5rem] text-center col-span-2 shadow-inner">
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Valor Líquido</p>
                                <p className="text-xs font-black text-govgreen">{formatCurrency(serviceValue - taxCalculation.total)}</p>
                            </div>
                        </div>

                        <div className="pt-6 grid grid-cols-2 gap-4">
                            <button 
                                onClick={handleArchiveInvoice}
                                disabled={!serviceValue || !serviceDesc}
                                className="py-4 bg-govblue text-white font-black rounded-2xl shadow-xl hover:bg-blue-800 transition-all uppercase text-[10px] tracking-widest disabled:opacity-50"
                            >
                                Finalizar e Arquivar
                            </button>
                            <button onClick={() => window.print()} className="py-4 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-colors">
                                Gerar PDF Espelho
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="max-w-5xl mx-auto animate-fade-in-up">
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-10 py-8 border-b flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                    <div>
                        <h3 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Histórico de Faturamento</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase mt-1 tracking-widest">Arquivo de notas elaboradas</p>
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] font-black bg-white dark:bg-slate-700 border px-3 py-1 rounded-full">{invoices.length} NOTAS</span>
                    </div>
                </div>
                
                {invoices.length === 0 ? (
                    <div className="p-24 text-center text-gray-400">
                        <p className="text-6xl mb-6 opacity-30">📂</p>
                        <p className="text-sm font-black uppercase tracking-widest">Seu arquivo está vazio.</p>
                        <button onClick={() => setActiveTab('simulator')} className="mt-4 text-xs font-bold text-govblue hover:underline">Simular faturamento agora →</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-[10px] font-black text-gray-400 uppercase bg-white dark:bg-slate-800 border-b">
                                <tr>
                                  <th className="px-10 py-5">Emissão</th>
                                  <th className="px-6 py-5">Tomador</th>
                                  <th className="px-6 py-5">Descrição</th>
                                  <th className="px-6 py-5 text-right">Líquido</th>
                                  <th className="px-10 py-5 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                                {invoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-10 py-6 text-xs font-black text-gray-400">{new Date(inv.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-6">
                                            <p className="text-sm font-black text-gray-800 dark:text-white uppercase leading-none">{inv.customerName}</p>
                                            <p className="text-[10px] text-gray-400 font-mono mt-1">{inv.customerDoc}</p>
                                        </td>
                                        <td className="px-6 py-6 text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{inv.serviceDescription}</td>
                                        <td className="px-6 py-6 text-right font-black text-govgreen">{formatCurrency(inv.netValue)}</td>
                                        <td className="px-10 py-6 text-center">
                                          <div className="flex justify-center gap-2">
                                            <button onClick={() => { setServiceDesc(inv.serviceDescription); setServiceValue(inv.amount); setCustomerName(inv.customerName); setCustomerDoc(inv.customerDoc); setActiveTab('simulator'); }} className="p-2.5 bg-blue-50 dark:bg-slate-700 text-govblue rounded-xl hover:bg-govblue hover:text-white transition-all shadow-sm">👁️</button>
                                            <button onClick={() => onDeleteInvoice(inv.id)} className="p-2.5 bg-red-50 dark:bg-slate-700 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">🗑️</button>
                                          </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
      )}

      {activeTab === 'config' && (
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 p-12 rounded-[3rem] shadow-xl border border-gray-100 dark:border-slate-700 animate-fade-in">
              <h3 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-2">
                 <span className="text-govblue">⚙️</span> Configurações Profissionais
              </h3>
              <div className="space-y-6">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Pró-labore Mensal (ME com Fator R)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-4 text-gray-400 font-bold">R$</span>
                      <input type="number" value={tempProfile.lastPayrollTotal || ''} onChange={e => setTempProfile({...tempProfile, lastPayrollTotal: parseFloat(e.target.value) || 0})} className="w-full px-12 py-4 rounded-2xl border bg-gray-50 dark:bg-slate-900 dark:text-white text-sm font-black outline-none focus:ring-2 focus:ring-govblue" placeholder="0,00"/>
                    </div>
                </div>
                <button onClick={() => { onUpdateProfile(tempProfile); alert("Perfil fiscal atualizado!"); }} className="w-full py-5 bg-govblue text-white font-black rounded-3xl shadow-xl hover:bg-blue-800 transition-all uppercase tracking-widest text-sm">Salvar Alterações</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default TaxManager;
