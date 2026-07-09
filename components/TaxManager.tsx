
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, BusinessProfile, Cnae, SimulatedInvoice, BankAccount } from '../types';
import { maskCpfCnpj } from './ManualManager';
import { aiClient } from '../services/aiClient';
import { revenueLast12Months, calculateFactorR, calculateServiceTaxes } from '../utils/tax';
import { Buildings, User, FileText, Sparkle, PencilSimple, BookOpen, Gear, Eye, Trash, FolderOpen } from '@phosphor-icons/react';

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

  // Lógica pura e testada em utils/tax.ts. A receita considera os últimos 12
  // meses (RBT12) — o cálculo antigo somava o histórico inteiro e distorcia o
  // Fator R quando havia dados de mais de um ano.
  const factorR = useMemo(() => {
      if (businessProfile.regime !== 'ME' || !businessProfile.lastPayrollTotal) return 0;
      const referenceMonth = new Date().toISOString().slice(0, 7);
      return calculateFactorR(businessProfile.lastPayrollTotal, revenueLast12Months(transactions, referenceMonth));
  }, [businessProfile, transactions]);

  const taxCalculation = useMemo(
    () => calculateServiceTaxes(serviceValue, businessProfile.regime === 'MEI' ? 'MEI' : 'ME', factorR, withholdIss, issRate),
    [businessProfile, serviceValue, factorR, withholdIss, issRate]
  );

  const applyManualTemplate = () => {
    const template = `Prestação de serviços artísticos de [DESCREVER ATIVIDADE], referente ao projeto [NOME DO PROJETO], realizado em [DATA/LOCAL]. Valor total bruto: ${formatCurrency(serviceValue)}.`;
    setServiceDesc(template);
  };

  const expandDescriptionWithAI = async () => {
    if (!serviceDesc || serviceDesc.length < 5) return;
    setIsExpandingDescription(true);
    try {
      const expanded = await aiClient.expandDescription(serviceDesc);
      if (expanded) setServiceDesc(expanded);
    } catch (e) {
      console.error("Erro na IA:", e);
      alert("Não foi possível expandir com IA. Tente novamente em instantes.");
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
            <div className="bg-surface rounded-[3rem] shadow-brand-md border-t-8 border-primary p-8 md:p-12">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-primary-soft rounded-3xl flex items-center justify-center text-primary"><Buildings size={32} weight="bold" /></div>
                    <div><h2 className="text-3xl font-display font-extrabold text-ink uppercase tracking-tight">Onboarding Fiscal</h2><p className="text-muted font-medium text-sm">Configure os dados da sua empresa para cálculos e emissões.</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div><label className="block text-[10px] font-black text-subtle uppercase tracking-widest mb-2">Razão Social</label><input type="text" value={tempProfile.companyName} onChange={e => setTempProfile({...tempProfile, companyName: e.target.value})} placeholder="NOME DA EMPRESA LTDA" className="w-full px-5 py-4 rounded-2xl border border-line bg-surface-2 text-ink font-bold outline-none focus:ring-2 focus:ring-primary transition-all"/></div>
                        <div><label className="block text-[10px] font-black text-subtle uppercase tracking-widest mb-2">CNPJ</label><input type="text" value={tempProfile.cnpj} onChange={e => setTempProfile({...tempProfile, cnpj: maskCpfCnpj(e.target.value)})} placeholder="00.000.000/0001-00" className="w-full px-5 py-4 rounded-2xl border border-line bg-surface-2 text-ink font-mono tabular-nums outline-none focus:ring-2 focus:ring-primary transition-all"/></div>
                    </div>
                    <div className="space-y-6">
                        <div><label className="block text-[10px] font-black text-subtle uppercase tracking-widest mb-2">CNAE Principal</label><select value={tempProfile.mainCnae?.code || ''} onChange={e => setTempProfile({...tempProfile, mainCnae: CULTURAL_CNAES.find(c => c.code === e.target.value)})} className="w-full px-5 py-4 rounded-2xl border border-line bg-surface-2 text-ink font-bold h-[58px] outline-none"><option value="">Selecione sua atividade...</option>{CULTURAL_CNAES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.description.substring(0, 35)}...</option>)}</select></div>
                        <button onClick={() => { onUpdateProfile(tempProfile); setSetupMode(false); }} className="w-full py-5 bg-primary text-white font-black rounded-3xl shadow-brand-md hover:bg-blue-800 transition-all uppercase text-sm tracking-widest">Acessar Painel Fiscal</button>
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
          <div className="bg-surface p-1.5 rounded-[2.5rem] shadow-brand-sm border border-line flex">
              <button onClick={() => setActiveTab('simulator')} className={`px-8 py-3 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'simulator' ? 'bg-primary text-white shadow-brand-md' : 'text-subtle hover:text-muted'}`}><PencilSimple size={16} weight="bold" /> Elaborar Nota</button>
              <button onClick={() => setActiveTab('history')} className={`px-8 py-3 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-primary text-white shadow-brand-md' : 'text-subtle hover:text-muted'}`}><BookOpen size={16} weight="bold" /> Histórico</button>
              <button onClick={() => setActiveTab('config')} className={`px-8 py-3 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'config' ? 'bg-primary text-white shadow-brand-md' : 'text-subtle hover:text-muted'}`}><Gear size={16} weight="bold" /> Ajustes</button>
          </div>
      </div>

      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Bloco de Formulário */}
            <div className="lg:col-span-5 space-y-8">
                <div className="bg-surface p-10 rounded-[3rem] shadow-brand-md border border-line">
                    <h3 className="text-xl font-display font-extrabold text-ink mb-8 uppercase tracking-tight flex items-center gap-2">
                      <span className="text-primary"><User size={20} weight="bold" /></span> Dados do Tomador
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-subtle uppercase tracking-widest mb-1">Nome / Razão Social</label>
                            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ex: Sesc São Paulo" className="w-full px-5 py-3 rounded-2xl border border-line bg-surface-2 text-ink text-sm font-bold outline-none focus:ring-2 focus:ring-primary"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-subtle uppercase tracking-widest mb-1">CNPJ / CPF</label>
                                <input type="text" value={customerDoc} onChange={e => setCustomerDoc(maskCpfCnpj(e.target.value))} placeholder="00.000.000/0000-00" className="w-full px-5 py-3 rounded-2xl border border-line bg-surface-2 text-ink text-xs font-mono tabular-nums outline-none focus:ring-2 focus:ring-primary"/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-subtle uppercase tracking-widest mb-1">Serviço (CNAE)</label>
                                <select value={selectedCnae?.code || ''} onChange={e => setSelectedCnae(CULTURAL_CNAES.find(c => c.code === e.target.value) || null)} className="w-full px-4 py-3 rounded-2xl border border-line bg-surface-2 text-ink text-[10px] font-black outline-none">
                                    <option value="">Atividade Padrão</option>
                                    {CULTURAL_CNAES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-xl font-display font-extrabold text-ink mt-10 mb-6 uppercase tracking-tight flex items-center gap-2">
                       <span className="text-primary"><FileText size={20} weight="bold" /></span> Detalhes do Serviço
                    </h3>
                    <div className="space-y-5">
                        <div className="relative">
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-[10px] font-black text-subtle uppercase tracking-widest">Discriminação</label>
                              <div className="flex gap-2">
                                <button onClick={applyManualTemplate} className="text-[9px] font-black text-primary uppercase bg-primary-soft px-2 py-1 rounded-lg hover:bg-primary-soft transition-colors flex items-center gap-1">Template <FileText size={12} weight="bold" /></button>
                                <button
                                    onClick={expandDescriptionWithAI}
                                    disabled={isExpandingDescription || serviceDesc.length < 5}
                                    className="text-[9px] font-black text-white uppercase bg-primary px-2 py-1 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center gap-1"
                                >
                                    IA <Sparkle size={12} weight="bold" />
                                </button>
                              </div>
                            </div>
                            <textarea value={serviceDesc} onChange={e => setServiceDesc(e.target.value)} rows={5} placeholder="Descreva sua atividade ou use um template..." className="w-full px-5 py-4 rounded-2xl border border-line bg-surface-2 text-ink text-sm font-medium outline-none focus:ring-2 focus:ring-primary leading-relaxed"/>
                            {isExpandingDescription && (
                                <div className="absolute inset-0 bg-surface/80 rounded-2xl flex items-center justify-center animate-pulse">
                                    <span className="text-xs font-black text-primary uppercase tracking-widest">Aprimorando texto...</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-subtle uppercase tracking-widest mb-2">Valor Bruto (R$)</label>
                                <input type="number" value={serviceValue || ''} onChange={e => setServiceValue(parseFloat(e.target.value) || 0)} className="w-full px-5 py-3 rounded-2xl border border-line bg-surface-2 text-ink text-sm font-black font-mono tabular-nums outline-none"/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-subtle uppercase tracking-widest mb-2">Conta de Recebimento</label>
                                <select value={selectedBankId} onChange={e => setSelectedBankId(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-line bg-surface-2 text-ink text-[10px] font-black outline-none">
                                    <option value="">Selecione...</option>
                                    {accounts.map(a => <option key={a.id} value={a.id}>{a.bank} - {a.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between bg-surface-2 p-4 rounded-2xl border border-dashed border-line">
                           <div>
                              <p className="text-[10px] font-black text-muted uppercase">Exibir Dados Bancários na Nota?</p>
                              <p className="text-[9px] text-subtle font-medium italic leading-none mt-1">Geralmente inserido na discriminação.</p>
                           </div>
                           <button
                            onClick={() => setShowBankDetailsOnInvoice(!showBankDetailsOnInvoice)}
                            className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${showBankDetailsOnInvoice ? 'bg-success' : 'bg-gray-300'}`}
                           >
                              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${showBankDetailsOnInvoice ? 'translate-x-6' : 'translate-x-0'}`} />
                           </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Espelho da Nota */}
            <div className="lg:col-span-7">
                <div className="bg-surface rounded-[3rem] shadow-brand-md border-4 border-line overflow-hidden sticky top-24">
                    <div className="bg-surface-2 px-10 py-6 flex justify-between items-center border-b border-line">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-brand-md">NF</div>
                            <div>
                              <p className="text-[10px] font-black text-muted uppercase tracking-widest leading-none">Simulação de Emissão</p>
                              <p className="text-[9px] font-bold text-subtle uppercase mt-1">Conformidade Legal Ativa</p>
                            </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-subtle uppercase">Nº 00000000</p>
                          <p className="text-[9px] font-bold text-subtle">SÉRIE 1</p>
                        </div>
                    </div>
                    
                    <div className="p-10 space-y-8">
                        <div className="grid grid-cols-2 gap-10 border-b border-line pb-8">
                            <div>
                              <p className="text-[9px] font-black text-subtle uppercase mb-2 tracking-widest">Prestador de Serviços</p>
                              <p className="text-xs font-black text-ink uppercase leading-tight">{businessProfile.companyName}</p>
                              <p className="text-[10px] font-mono tabular-nums text-subtle mt-1">{businessProfile.cnpj}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black text-subtle uppercase mb-2 tracking-widest">Tomador de Serviços</p>
                              <p className="text-xs font-black text-ink uppercase leading-tight">{customerName || 'IDENTIFICAÇÃO DO CLIENTE'}</p>
                              <p className="text-[10px] font-mono tabular-nums text-subtle mt-1">{customerDoc || '00.000.000/0000-00'}</p>
                            </div>
                        </div>

                        <div className="p-8 bg-surface-2 rounded-3xl border border-line text-xs font-mono text-muted leading-relaxed shadow-inner">
                            <p className="whitespace-pre-wrap">{serviceDesc || 'Aguardando preenchimento da discriminação...'}</p>

                            {selectedBankId && showBankDetailsOnInvoice && (
                                <div className="mt-8 pt-6 border-t border-line animate-fade-in">
                                    <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-1 underline">Dados para Transferência Bancária</p>
                                    <p className="text-[10px] font-bold text-primary uppercase">
                                      {accounts.find(a => a.id === selectedBankId)?.bank} | {accounts.find(a => a.id === selectedBankId)?.name}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-4 gap-1 bg-surface-2 p-1 rounded-[2rem]">
                            <div className="bg-surface p-5 rounded-[1.5rem] text-center">
                                <p className="text-[9px] font-black text-subtle uppercase mb-1">Bruto</p>
                                <p className="text-xs font-black text-ink font-mono tabular-nums">{formatCurrency(serviceValue)}</p>
                            </div>
                            <div className="bg-surface p-5 rounded-[1.5rem] text-center">
                                <p className="text-[9px] font-black text-subtle uppercase mb-1">Impostos</p>
                                <p className="text-xs font-black text-error font-mono tabular-nums">-{formatCurrency(taxCalculation.total)}</p>
                            </div>
                            <div className="bg-surface-2 p-5 rounded-[1.5rem] text-center col-span-2 shadow-inner">
                                <p className="text-[9px] font-black text-subtle uppercase mb-1">Valor Líquido</p>
                                <p className="text-xs font-black text-success font-mono tabular-nums">{formatCurrency(serviceValue - taxCalculation.total)}</p>
                            </div>
                        </div>

                        <div className="pt-6 grid grid-cols-2 gap-4">
                            <button 
                                onClick={handleArchiveInvoice}
                                disabled={!serviceValue || !serviceDesc}
                                className="py-4 bg-primary text-white font-black rounded-2xl shadow-brand-md hover:bg-blue-800 transition-all uppercase text-[10px] tracking-widest disabled:opacity-50"
                            >
                                Finalizar e Arquivar
                            </button>
                            <button onClick={() => window.print()} className="py-4 bg-surface-2 text-muted font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-colors">
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
            <div className="bg-surface rounded-[3rem] shadow-brand-md border border-line overflow-hidden">
                <div className="px-10 py-8 border-b border-line flex justify-between items-center bg-surface-2">
                    <div>
                        <h3 className="text-2xl font-display font-extrabold text-ink uppercase tracking-tight">Histórico de Faturamento</h3>
                        <p className="text-xs text-muted font-bold uppercase mt-1 tracking-widest">Arquivo de notas elaboradas</p>
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] font-black bg-surface border border-line px-3 py-1 rounded-full">{invoices.length} NOTAS</span>
                    </div>
                </div>

                {invoices.length === 0 ? (
                    <div className="p-24 text-center text-subtle">
                        <p className="mb-6 opacity-30 flex justify-center"><FolderOpen size={64} weight="bold" /></p>
                        <p className="text-sm font-black uppercase tracking-widest">Seu arquivo está vazio.</p>
                        <button onClick={() => setActiveTab('simulator')} className="mt-4 text-xs font-bold text-primary hover:underline">Simular faturamento agora →</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-[10px] font-black text-subtle uppercase bg-surface border-b border-line">
                                <tr>
                                  <th className="px-10 py-5">Emissão</th>
                                  <th className="px-6 py-5">Tomador</th>
                                  <th className="px-6 py-5">Descrição</th>
                                  <th className="px-6 py-5 text-right">Líquido</th>
                                  <th className="px-10 py-5 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {invoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-surface-2 transition-colors">
                                        <td className="px-10 py-6 text-xs font-black text-subtle">{new Date(inv.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-6">
                                            <p className="text-sm font-black text-ink uppercase leading-none">{inv.customerName}</p>
                                            <p className="text-[10px] text-subtle font-mono tabular-nums mt-1">{inv.customerDoc}</p>
                                        </td>
                                        <td className="px-6 py-6 text-xs text-muted max-w-[200px] truncate">{inv.serviceDescription}</td>
                                        <td className="px-6 py-6 text-right font-black text-success font-mono tabular-nums">{formatCurrency(inv.netValue)}</td>
                                        <td className="px-10 py-6 text-center">
                                          <div className="flex justify-center gap-2">
                                            <button onClick={() => { setServiceDesc(inv.serviceDescription); setServiceValue(inv.amount); setCustomerName(inv.customerName); setCustomerDoc(inv.customerDoc); setActiveTab('simulator'); }} className="p-2.5 bg-primary-soft text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-brand-sm"><Eye size={16} weight="bold" /></button>
                                            <button onClick={() => onDeleteInvoice(inv.id)} className="p-2.5 bg-error-soft text-error rounded-xl hover:bg-error hover:text-white transition-all shadow-brand-sm"><Trash size={16} weight="bold" /></button>
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
          <div className="max-w-3xl mx-auto bg-surface p-12 rounded-[3rem] shadow-brand-md border border-line animate-fade-in">
              <h3 className="text-2xl font-display font-extrabold text-ink uppercase tracking-tight mb-8 flex items-center gap-2">
                 <span className="text-primary"><Gear size={22} weight="bold" /></span> Configurações Profissionais
              </h3>
              <div className="space-y-6">
                <div>
                    <label className="block text-[10px] font-black text-subtle uppercase mb-2 tracking-widest">Pró-labore Mensal (ME com Fator R)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-4 text-subtle font-bold">R$</span>
                      <input type="number" value={tempProfile.lastPayrollTotal || ''} onChange={e => setTempProfile({...tempProfile, lastPayrollTotal: parseFloat(e.target.value) || 0})} className="w-full px-12 py-4 rounded-2xl border border-line bg-surface-2 text-ink text-sm font-black font-mono tabular-nums outline-none focus:ring-2 focus:ring-primary" placeholder="0,00"/>
                    </div>
                </div>
                <button onClick={() => { onUpdateProfile(tempProfile); alert("Perfil fiscal atualizado!"); }} className="w-full py-5 bg-primary text-white font-black rounded-3xl shadow-brand-md hover:bg-blue-800 transition-all uppercase tracking-widest text-sm">Salvar Alterações</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default TaxManager;
