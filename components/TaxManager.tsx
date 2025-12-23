
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, BusinessProfile, Cnae } from '../types';
import { maskCpfCnpj } from './ManualManager';

interface TaxManagerProps {
  transactions: Transaction[];
  setTransactions?: React.Dispatch<React.SetStateAction<Transaction[]>>;
  onNavigate: (view: 'manual_pj') => void;
  businessProfile: BusinessProfile;
  onUpdateProfile: (profile: BusinessProfile) => void;
  initialTransactionId?: string;
}

const CULTURAL_CNAES: Cnae[] = [
  { code: '9001-9/02', description: 'Produção musical' },
  { code: '9001-9/01', description: 'Produção de espetáculos circenses' },
  { code: '9001-9/06', description: 'Sonorização e iluminação' },
  { code: '5911-1/99', description: 'Produção cinematográfica' },
  { code: '8592-9/99', description: 'Ensino de arte e cultura' },
  { code: '8230-0/01', description: 'Organização de eventos' },
  { code: '9001-9/02', description: 'Atividades de artistas plásticos' }
];

const TaxManager: React.FC<TaxManagerProps> = ({ transactions, businessProfile, onUpdateProfile, initialTransactionId }) => {
  const currentYear = new Date().getFullYear();
  const MEI_LIMIT = 81000;
  
  // Perfil State (Para o Onboarding/Edição)
  const [setupMode, setSetupMode] = useState(!businessProfile.cnpj);
  const [tempProfile, setTempProfile] = useState<BusinessProfile>(() => ({
      ...businessProfile,
      regime: businessProfile.regime || 'MEI'
  }));

  // Simulador State
  const [customerName, setCustomerName] = useState('');
  const [customerDoc, setCustomerDoc] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceValue, setServiceValue] = useState<number>(0);
  const [selectedCnae, setSelectedCnae] = useState<Cnae | null>(businessProfile.mainCnae || null);
  const [withholdIss, setWithholdIss] = useState(false);
  const [issRate, setIssRate] = useState(2); // 2% a 5%

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

  // Lógica de Impostos ME
  const factorR = useMemo(() => {
      if (businessProfile.regime !== 'ME' || !businessProfile.lastPayrollTotal) return 0;
      const annualRevenue = transactions
        .filter(t => t.entity === 'PJ' && t.type === 'inflow')
        .reduce((acc, t) => acc + t.amount, 0) || 1;
      return (businessProfile.lastPayrollTotal / annualRevenue) * 100;
  }, [businessProfile, transactions]);

  const taxCalculation = useMemo(() => {
    const isMei = businessProfile.regime === 'MEI';
    if (isMei) return { rate: 0, federal: 0, iss: 0, total: 0 };

    // Simples Nacional ME - Anexo III vs V (Cultura costuma cair aqui)
    // Se Fator R > 28%, usa Anexo III (começa em 6%). Senão, Anexo V (começa em 15.5%)
    const baseRate = factorR >= 28 ? 0.06 : 0.155;
    const federalTaxes = serviceValue * baseRate;
    const issValue = withholdIss ? serviceValue * (issRate / 100) : 0;
    
    return {
        rate: baseRate * 100,
        federal: federalTaxes,
        iss: issValue,
        total: federalTaxes + issValue
    };
  }, [businessProfile, serviceValue, factorR, withholdIss, issRate]);

  const revenuePJ = useMemo(() => {
    return transactions
      .filter(t => t.entity === 'PJ' && t.type === 'inflow' && new Date(t.date).getFullYear() === currentYear)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions, currentYear]);

  const percentageUsed = (revenuePJ / MEI_LIMIT) * 100;

  const handleSaveProfile = () => {
    if (!tempProfile.cnpj || !tempProfile.companyName) {
        alert("Preencha CNPJ e Razão Social para destravar o módulo.");
        return;
    }
    onUpdateProfile(tempProfile);
    setSetupMode(false);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (setupMode) {
    return (
        <div className="max-w-3xl mx-auto animate-fade-in py-12 px-4">
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border-t-8 border-govblue p-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                </div>
                
                <h2 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tighter mb-2">Configuração Fiscal</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium mb-10">Precisamos conhecer sua empresa para calcular os impostos corretamente.</p>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Razão Social</label>
                            <input 
                                type="text" 
                                value={tempProfile.companyName}
                                onChange={e => setTempProfile({...tempProfile, companyName: e.target.value})}
                                placeholder="Nome da Empresa"
                                className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-blue-100 outline-none dark:text-white font-bold transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CNPJ</label>
                            <input 
                                type="text" 
                                value={tempProfile.cnpj}
                                onChange={e => setTempProfile({...tempProfile, cnpj: maskCpfCnpj(e.target.value)})}
                                placeholder="00.000.000/0001-00"
                                className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-blue-100 outline-none dark:text-white font-mono transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Regime Tributário</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setTempProfile({...tempProfile, regime: 'MEI'})}
                                className={`p-6 rounded-3xl border-2 transition-all text-left ${tempProfile.regime === 'MEI' ? 'border-govblue bg-blue-50 dark:bg-blue-900/20 shadow-lg' : 'border-gray-100 dark:border-slate-700'}`}
                            >
                                <p className="font-black text-lg text-gray-800 dark:text-white">MEI</p>
                                <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Microempreendedor Individual</p>
                            </button>
                            <button 
                                onClick={() => setTempProfile({...tempProfile, regime: 'ME'})}
                                className={`p-6 rounded-3xl border-2 transition-all text-left ${tempProfile.regime === 'ME' ? 'border-govblue bg-blue-50 dark:bg-blue-900/20 shadow-lg' : 'border-gray-100 dark:border-slate-700'}`}
                            >
                                <p className="font-black text-lg text-gray-800 dark:text-white">ME / EPP</p>
                                <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Simples Nacional (ME)</p>
                            </button>
                        </div>
                    </div>

                    {tempProfile.regime === 'ME' && (
                         <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-800 animate-fade-in-up">
                            <h4 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase mb-4 tracking-widest">Configuração Fator R</h4>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-amber-600 uppercase">Gasto total com folha (Pró-labore + CLT + Encargos) mensal</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-4 text-amber-500 font-bold">R$</span>
                                    <input 
                                        type="number" 
                                        value={tempProfile.lastPayrollTotal || ''}
                                        onChange={e => setTempProfile({...tempProfile, lastPayrollTotal: parseFloat(e.target.value) || 0})}
                                        className="w-full pl-10 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border-none focus:ring-2 focus:ring-amber-300 font-black text-gray-800 dark:text-white"
                                        placeholder="Ex: 1500"
                                    />
                                </div>
                                <p className="text-[9px] text-amber-500 font-medium italic mt-2">* Essencial para saber se você pagará 6% ou 15.5% de imposto.</p>
                            </div>
                         </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CNAE Principal</label>
                        <select 
                            value={tempProfile.mainCnae?.code || ''}
                            onChange={e => setTempProfile({...tempProfile, mainCnae: CULTURAL_CNAES.find(c => c.code === e.target.value)})}
                            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-blue-100 outline-none dark:text-white font-bold transition-all"
                        >
                            <option value="">Selecione a atividade principal...</option>
                            {CULTURAL_CNAES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.description}</option>)}
                        </select>
                    </div>

                    <button 
                        onClick={handleSaveProfile}
                        className="w-full py-5 bg-govblue text-white font-black rounded-3xl shadow-xl hover:bg-blue-800 transition-all transform active:scale-95 uppercase tracking-widest mt-4"
                    >
                        Destravar Gestão Fiscal →
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in-up pb-12 px-2 sm:px-0">
      
      {/* Resumo Dinâmico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {businessProfile.regime === 'MEI' ? (
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-center">
                 <div className="flex justify-between items-end mb-4">
                    <div>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Termômetro de Faturamento MEI</h3>
                        <p className="text-4xl font-black text-[#1d357d] dark:text-white tracking-tighter">{formatCurrency(revenuePJ)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Limite MEI</p>
                        <p className="text-sm font-bold text-gray-500">{formatCurrency(MEI_LIMIT)}</p>
                    </div>
                 </div>
                 <div className="w-full bg-gray-100 dark:bg-slate-900 rounded-full h-4 overflow-hidden shadow-inner">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ${percentageUsed > 85 ? 'bg-red-500' : 'bg-govgreen'}`} 
                        style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                    ></div>
                 </div>
                 <div className="flex justify-between mt-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                        {percentageUsed.toFixed(1)}% utilizado. {percentageUsed > 85 ? '⚠️ Alerta de desenquadramento!' : '✅ Compliance OK.'}
                    </p>
                    <button onClick={() => setSetupMode(true)} className="text-[10px] font-black text-govblue uppercase hover:underline">Editar Perfil</button>
                 </div>
              </div>
          ) : (
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Painel Simples Nacional (ME)</h3>
                        <p className="text-4xl font-black text-govblue dark:text-blue-400 tracking-tighter">Fator R: {factorR.toFixed(1)}%</p>
                    </div>
                    <div className="text-right">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${factorR >= 28 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                            {factorR >= 28 ? 'Anexo III (6%)' : 'Anexo V (15.5%)'}
                        </span>
                    </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                    {factorR >= 28 
                        ? '🚀 Excelente! Sua folha de pagamento é alta o suficiente para você pagar o menor imposto (Anexo III).' 
                        : '💡 Atenção: Sua carga tributária está alta. Aumentar o Pró-labore pode reduzir seu imposto total para 6%.'}
                </p>
                <button onClick={() => setSetupMode(true)} className="text-[10px] font-black text-govblue uppercase hover:underline self-end mt-4">Ajustar Perfil ME</button>
            </div>
          )}

          <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white flex flex-col justify-center relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform"></div>
             <div className="mb-4">
                <span className="text-[10px] font-black text-govgreen uppercase tracking-widest px-3 py-1 bg-white/10 rounded-full">{businessProfile.regime}</span>
             </div>
             <p className="text-xl font-bold truncate leading-tight uppercase tracking-tighter">{businessProfile.companyName}</p>
             <p className="text-xs text-slate-400 font-mono mt-1">{businessProfile.cnpj}</p>
             <div className="mt-6 pt-6 border-t border-slate-800">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CNAE Principal</p>
                <p className="text-xs font-bold text-slate-300 mt-1 truncate">{businessProfile.mainCnae?.description}</p>
             </div>
          </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* Formulário do Simulador */}
        <div className="xl:col-span-5 space-y-8">
            <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-xl border border-gray-100 dark:border-slate-700">
                <h3 className="text-xl font-black text-gray-800 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tighter leading-none">
                    <span className="p-4 bg-blue-50 dark:bg-slate-700 rounded-3xl">📋</span> Simulador NFSe
                </h3>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Discriminação do Serviço</label>
                        <textarea 
                            value={serviceDesc}
                            onChange={e => setServiceDesc(e.target.value)}
                            rows={3}
                            placeholder="Descreva o serviço para a nota..."
                            className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 transition-all dark:text-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Valor Bruto</label>
                            <div className="relative">
                                <span className="absolute left-4 top-4 text-xs font-bold text-gray-400">R$</span>
                                <input 
                                    type="number" 
                                    value={serviceValue || ''}
                                    onChange={e => setServiceValue(parseFloat(e.target.value) || 0)}
                                    className="w-full pl-10 pr-4 py-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-sm font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all dark:text-white"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">CNAE Vinculado</label>
                            <select 
                                value={selectedCnae?.code || ''}
                                onChange={e => setSelectedCnae(CULTURAL_CNAES.find(c => c.code === e.target.value) || null)}
                                className="w-full px-4 py-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-[10px] font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all dark:text-white"
                            >
                                <option value="">Mesmo do Perfil</option>
                                {CULTURAL_CNAES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-dashed space-y-4">
                        <div className="flex items-center justify-between mb-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Retenções Municipais</label>
                             <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Reter ISS?</span>
                                <button 
                                    onClick={() => setWithholdIss(!withholdIss)}
                                    className={`w-12 h-6 rounded-full transition-all relative ${withholdIss ? 'bg-govblue' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${withholdIss ? 'left-7' : 'left-1'}`}></div>
                                </button>
                             </div>
                        </div>
                        
                        {withholdIss && (
                            <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Alíquota ISS (%)</label>
                                    <input 
                                        type="number" 
                                        value={issRate}
                                        onChange={e => setIssRate(parseFloat(e.target.value) || 2)}
                                        className="w-full px-4 py-2 rounded-xl border bg-white dark:bg-slate-900 text-xs font-black"
                                    />
                                </div>
                                <div className="flex items-end text-[10px] text-gray-400 font-medium italic pb-2">
                                    Normalmente 2% a 5% dependendo da cidade.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Visualização da Nota Adaptada */}
        <div className="xl:col-span-7">
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border-4 border-slate-100 dark:border-slate-700 overflow-hidden sticky top-24">
                <div className="bg-slate-100 dark:bg-slate-900 px-10 py-6 flex justify-between items-center border-b">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg ${businessProfile.regime === 'MEI' ? 'bg-govgreen' : 'bg-govblue'}`}>NF</div>
                        <div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Espelho NFSe - Padrão Nacional</span>
                            <p className="text-[9px] font-bold text-slate-400">CÓDIGO DE VERIFICAÇÃO: SIM-STR-001</p>
                        </div>
                    </div>
                    <span className="px-4 py-1.5 bg-white dark:bg-slate-800 rounded-full text-[9px] font-black text-slate-400 border border-slate-200 dark:border-slate-700">AMBIENTE DE TESTES</span>
                </div>
                
                <div className="p-12 space-y-10">
                    <div className="grid grid-cols-2 gap-10 border-b border-slate-100 dark:border-slate-700 pb-10">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest">Prestador de Serviços</p>
                            <p className="text-lg font-black text-gray-800 dark:text-white uppercase leading-none">{businessProfile.companyName}</p>
                            <p className="text-xs font-bold text-gray-500 mt-2">CNPJ: {businessProfile.cnpj}</p>
                            <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold px-2 py-0.5 bg-slate-50 dark:bg-slate-900 rounded inline-block">Regime: {businessProfile.regime}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest">Tomador de Serviços</p>
                            <p className="text-lg font-black text-gray-800 dark:text-white uppercase leading-none">{customerName || 'Cliente / Projeto'}</p>
                            <p className="text-xs font-bold text-gray-500 mt-2">{customerDoc || 'CPF/CNPJ do Tomador'}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest">Detalhamento dos Serviços</p>
                        <div className="min-h-[160px] p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700 text-sm font-mono text-gray-600 dark:text-gray-300 leading-relaxed shadow-inner">
                            {serviceDesc || 'Aguardando preenchimento da descrição...'}
                            {selectedCnae && (
                                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Atividade: {selectedCnae.code}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Simples Nacional: {businessProfile.regime}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Valores e Impostos */}
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] p-1 shadow-inner border border-slate-100 dark:border-slate-800">
                        <div className="grid grid-cols-4 gap-1">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] text-center border border-slate-100 dark:border-slate-700">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Bruto</p>
                                <p className="text-sm font-black text-gray-800 dark:text-white">{formatCurrency(serviceValue)}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] text-center border border-slate-100 dark:border-slate-700">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Simples Nacional</p>
                                <p className={`text-sm font-black ${taxCalculation.federal > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                                    {taxCalculation.federal > 0 ? `-${formatCurrency(taxCalculation.federal)}` : 'Isento'}
                                </p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] text-center border border-slate-100 dark:border-slate-700">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">ISS Retido</p>
                                <p className={`text-sm font-black ${taxCalculation.iss > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                    {taxCalculation.iss > 0 ? `-${formatCurrency(taxCalculation.iss)}` : 'R$ 0,00'}
                                </p>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-[2rem] text-center shadow-2xl">
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Valor Líquido</p>
                                <p className="text-sm font-black text-govgreen">{formatCurrency(serviceValue - taxCalculation.total)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 flex flex-col items-center">
                        <button 
                            disabled={!serviceValue}
                            onClick={() => {
                                const regimeText = businessProfile.regime === 'MEI' 
                                    ? 'ISENÇÃO DE IMPOSTOS FEDERAIS CONFORME LEI COMPLEMENTAR 123/2006 (MEI).'
                                    : `ALÍQUOTA NOMINAL: ${taxCalculation.rate}% | FATOR R: ${factorR.toFixed(1)}%`;

                                const text = `NOTAS PARA EMISSÃO (${businessProfile.regime}):\n` +
                                            `Descrição: ${serviceDesc}\n` +
                                            `Valor Bruto: ${formatCurrency(serviceValue)}\n` +
                                            `Impostos Estimados: ${formatCurrency(taxCalculation.total)}\n` +
                                            `Líquido Real: ${formatCurrency(serviceValue - taxCalculation.total)}\n` +
                                            `Tomador: ${customerName} (${customerDoc})\n` +
                                            `Observação: ${regimeText}`;
                                navigator.clipboard.writeText(text);
                                alert('Dados técnicos copiados para auxiliar na emissão real!');
                            }}
                            className="group px-12 py-5 bg-govblue text-white font-black rounded-3xl shadow-xl hover:shadow-blue-200 transition-all transform active:scale-95 uppercase text-xs tracking-widest disabled:opacity-50 disabled:pointer-events-none"
                        >
                            Exportar Guia de Emissão →
                        </button>
                        <p className="text-[9px] font-bold text-slate-400 mt-8 uppercase tracking-[0.3em]">Destrava Gestão • Inteligência de Compliance</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TaxManager;
