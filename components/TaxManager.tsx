
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

  const expandDescriptionWithAI = async () => {
    if (!serviceDesc || serviceDesc.length < 5) return;
    setIsExpandingDescription(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Como um assistente fiscal para artistas brasileiros, transforme esta descrição curta em um texto formal e técnico para Nota Fiscal de Serviço (NFSe), adequado para prestação de contas de editais. Mantenha o tom profissional. Descrição curta: "${serviceDesc}". Retorne apenas o texto final expandido.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      
      if (response.text) setServiceDesc(response.text.trim());
    } catch (e) {
      console.error(e);
      alert("Erro ao expandir com IA. Tente novamente.");
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
    alert("Simulação arquivada no histórico!");
    setCustomerName(''); setCustomerDoc(''); setServiceDesc(''); setServiceValue(0);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (setupMode) {
    return (
        <div className="max-w-4xl mx-auto animate-fade-in py-8 px-4">
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border-t-8 border-govblue p-8 md:p-12">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-govblue text-3xl">🏛️</div>
                    <div><h2 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Onboarding Fiscal</h2><p className="text-gray-500 dark:text-gray-400 font-medium">Configure sua empresa para faturamento guiado.</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Razão Social</label><input type="text" value={tempProfile.companyName} onChange={e => setTempProfile({...tempProfile, companyName: e.target.value})} placeholder="NOME DA EMPRESA LTDA" className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-blue-100 outline-none dark:text-white font-bold transition-all"/></div>
                        <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CNPJ</label><input type="text" value={tempProfile.cnpj} onChange={e => setTempProfile({...tempProfile, cnpj: maskCpfCnpj(e.target.value)})} placeholder="00.000.000/0001-00" className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-blue-100 outline-none dark:text-white font-mono transition-all"/></div>
                    </div>
                    <div className="space-y-6">
                        <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CNAE Principal</label><select value={tempProfile.mainCnae?.code || ''} onChange={e => setTempProfile({...tempProfile, mainCnae: CULTURAL_CNAES.find(c => c.code === e.target.value)})} className="w-full px-5 py-4 rounded-2xl border bg-gray-50 dark:bg-slate-900 text-xs font-bold h-[58px]"><option value="">Selecione sua atividade...</option>{CULTURAL_CNAES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.description.substring(0, 40)}...</option>)}</select></div>
                        <button onClick={() => { onUpdateProfile(tempProfile); setSetupMode(false); }} className="w-full py-5 bg-govblue text-white font-black rounded-3xl shadow-xl uppercase text-sm tracking-widest">Acessar Painel de Notas</button>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in-up pb-12 px-2 sm:px-0">
      
      {/* Menu Superior */}
      <div className="flex justify-center mb-10">
          <div className="bg-white dark:bg-slate-800 p-1.5 rounded-[2.5rem] shadow-sm border flex">
              <button onClick={() => setActiveTab('simulator')} className={`px-8 py-3 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'simulator' ? 'bg-govblue text-white' : 'text-gray-400'}`}>✍️ Elaborar Nota</button>
              <button onClick={() => setActiveTab('history')} className={`px-8 py-3 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-govblue text-white' : 'text-gray-400'}`}>📚 Histórico</button>
              <button onClick={() => setActiveTab('config')} className={`px-8 py-3 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'config' ? 'bg-govblue text-white' : 'text-gray-400'}`}>⚙️ Ajustes</button>
          </div>
      </div>

      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Formulário de Elaboração */}
            <div className="lg:col-span-5 space-y-8">
                <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-xl border border-gray-100 dark:border-slate-700">
                    <h3 className="text-xl font-black text-gray-800 dark:text-white mb-8 uppercase tracking-tighter">Dados do Tomador (Cliente)</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nome ou Razão Social</label>
                            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ex: Sesc São Paulo" className="w-full px-5 py-3 rounded-2xl border bg-gray-50 dark:bg-slate-900 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-govblue"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">CNPJ/CPF</label>
                                <input type="text" value={customerDoc} onChange={e => setCustomerDoc(maskCpfCnpj(e.target.value))} placeholder="00.000.000/0000-00" className="w-full px-5 py-3 rounded-2xl border bg-gray-50 dark:bg-slate-900 text-xs font-mono dark:text-white outline-none focus:ring-2 focus:ring-govblue"/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">CNAE Vinculado</label>
                                <select value={selectedCnae?.code || ''} onChange={e => setSelectedCnae(CULTURAL_CNAES.find(c => c.code === e.target.value) || null)} className="w-full px-4 py-3 rounded-2xl border bg-gray-50 dark:bg-slate-900 text-[10px] font-black dark:text-white outline-none">
                                    <option value="">CNAE Padrão</option>
                                    {CULTURAL_CNAES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-xl font-black text-gray-800 dark:text-white mt-10 mb-6 uppercase tracking-tighter">Serviço & Valores</h3>
                    <div className="space-y-5">
                        <div className="relative">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Discriminação dos Serviços</label>
                            <textarea value={serviceDesc} onChange={e => setServiceDesc(e.target.value)} rows={4} placeholder="Ex: Show musical Vozes da Terra..." className="w-full px-5 py-4 rounded-2xl border bg-gray-50 dark:bg-slate-900 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-govblue pr-12"/>
                            <button 
                                onClick={expandDescriptionWithAI}
                                disabled={isExpandingDescription || serviceDesc.length < 5}
                                className="absolute right-3 bottom-3 p-2 bg-govblue text-white rounded-xl shadow-lg hover:scale-110 transition-all disabled:opacity-50"
                                title="Expandir com IA"
                            >
                                {isExpandingDescription ? '...' : '✨'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Valor Bruto</label>
                                <input type="number" value={serviceValue || ''} onChange={e => setServiceValue(parseFloat(e.target.value) || 0)} className="w-full px-5 py-3 rounded-2xl border bg-gray-50 dark:bg-slate-900 text-sm font-black dark:text-white"/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Conta p/ Recebimento</label>
                                <select value={selectedBankId} onChange={e => setSelectedBankId(e.target.value)} className="w-full px-4 py-3 rounded-2xl border bg-gray-50 dark:bg-slate-900 text-[10px] font-black dark:text-white">
                                    <option value="">Selecione...</option>
                                    {accounts.map(a => <option key={a.id} value={a.id}>{a.bank} - {a.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview da Nota */}
            <div className="lg:col-span-7">
                <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border-4 border-slate-50 dark:border-slate-700 overflow-hidden sticky top-24">
                    <div className="bg-slate-50 dark:bg-slate-900 px-10 py-6 flex justify-between items-center border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-govblue rounded-2xl flex items-center justify-center text-white font-black text-lg">NF</div>
                            <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SIMULAÇÃO DE EMISSÃO</p><p className="text-[9px] font-bold text-slate-400 uppercase">Ambiente de Conferência Legal</p></div>
                        </div>
                    </div>
                    
                    <div className="p-12 space-y-8">
                        <div className="grid grid-cols-2 gap-10 border-b pb-8">
                            <div><p className="text-[9px] font-black text-slate-400 uppercase mb-2">Prestador</p><p className="text-sm font-black text-gray-800 dark:text-white uppercase">{businessProfile.companyName}</p><p className="text-[10px] font-mono text-gray-400">{businessProfile.cnpj}</p></div>
                            <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase mb-2">Tomador</p><p className="text-sm font-black text-gray-800 dark:text-white uppercase">{customerName || 'Aguardando nome...'}</p><p className="text-[10px] font-mono text-gray-400">{customerDoc || '00.000.000/0000-00'}</p></div>
                        </div>

                        <div className="min-h-[140px] p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border text-xs font-mono text-gray-600 dark:text-gray-300 leading-relaxed shadow-inner italic">
                            {serviceDesc || 'Descreva seu serviço para visualizar o texto formal da nota...'}
                            {selectedBankId && (
                                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 not-italic">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dados para Pagamento</p>
                                    <p className="text-[10px] font-bold text-govblue">{accounts.find(a => a.id === selectedBankId)?.bank} - {accounts.find(a => a.id === selectedBankId)?.name}</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-4 gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-[2rem]">
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-[1.5rem] text-center"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Bruto</p><p className="text-xs font-black dark:text-white">{formatCurrency(serviceValue)}</p></div>
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-[1.5rem] text-center"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Impostos</p><p className="text-xs font-black text-red-500">-{formatCurrency(taxCalculation.total)}</p></div>
                            <div className="bg-slate-900 p-5 rounded-[1.5rem] text-center col-span-2"><p className="text-[9px] font-black text-slate-500 uppercase mb-1">Líquido Real</p><p className="text-xs font-black text-govgreen">{formatCurrency(serviceValue - taxCalculation.total)}</p></div>
                        </div>

                        <div className="pt-6 flex flex-col gap-3">
                            <button 
                                onClick={handleArchiveInvoice}
                                disabled={!serviceValue || !serviceDesc}
                                className="w-full py-4 bg-govblue text-white font-black rounded-2xl shadow-xl hover:bg-blue-800 transition-all uppercase text-xs tracking-widest disabled:opacity-50"
                            >
                                Finalizar e Arquivar Simulação
                            </button>
                            <button onClick={() => window.print()} className="w-full py-4 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-black rounded-2xl text-xs uppercase tracking-widest">Imprimir Espelho PDF</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="max-w-5xl mx-auto animate-fade-in-up">
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-xl border overflow-hidden">
                <div className="px-10 py-6 border-b flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                    <div><h3 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Histórico de Faturamento</h3><p className="text-xs text-gray-500 font-bold uppercase mt-1">Total de {invoices.length} notas elaboradas</p></div>
                </div>
                {invoices.length === 0 ? (
                    <div className="p-20 text-center text-gray-400"><p className="text-5xl mb-4">📭</p><p className="text-sm font-black uppercase">Nenhuma nota no histórico.</p></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-[10px] font-black text-gray-400 uppercase bg-white dark:bg-slate-800 border-b">
                                <tr><th className="px-10 py-5">Data</th><th className="px-6 py-5">Cliente</th><th className="px-6 py-5">Descrição</th><th className="px-6 py-5 text-right">Valor Líquido</th><th className="px-10 py-5 text-center">Ações</th></tr>
                            </thead>
                            <tbody className="divide-y">
                                {invoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                                        <td className="px-10 py-6 text-xs font-black text-gray-500">{new Date(inv.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-6"><p className="text-sm font-black text-gray-800 dark:text-white uppercase">{inv.customerName}</p><p className="text-[10px] text-gray-400 font-mono">{inv.customerDoc}</p></td>
                                        <td className="px-6 py-6 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">{inv.serviceDescription}</td>
                                        <td className="px-6 py-6 text-right font-black text-govgreen">{formatCurrency(inv.netValue)}</td>
                                        <td className="px-10 py-6 text-center flex justify-center gap-2">
                                            <button onClick={() => { setServiceDesc(inv.serviceDescription); setServiceValue(inv.amount); setCustomerName(inv.customerName); setCustomerDoc(inv.customerDoc); setActiveTab('simulator'); }} className="p-2 bg-blue-50 text-govblue rounded-lg">👁️</button>
                                            <button onClick={() => onDeleteInvoice(inv.id)} className="p-2 bg-red-50 text-red-500 rounded-lg">🗑️</button>
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
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-xl border animate-fade-in">
              <h3 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter mb-8">Configurações Fiscais</h3>
              <div className="space-y-6">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Pró-labore Médio (ME com Fator R)</label>
                    <input type="number" value={tempProfile.lastPayrollTotal || ''} onChange={e => setTempProfile({...tempProfile, lastPayrollTotal: parseFloat(e.target.value) || 0})} className="w-full px-5 py-4 rounded-2xl border bg-gray-50 text-sm font-black" placeholder="R$ 0,00"/>
                </div>
                <button onClick={() => { onUpdateProfile(tempProfile); alert("Perfil atualizado!"); }} className="w-full py-5 bg-govblue text-white font-black rounded-3xl shadow-xl uppercase">Atualizar Dados Profissionais</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default TaxManager;
