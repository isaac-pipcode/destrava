
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
  { code: '9001-9/01', description: 'Produção de espetáculos teatrais' },
  { code: '9001-9/02', description: 'Produção de espetáculos musicais' },
  { code: '9001-9/03', description: 'Produção de espetáculos de dança' },
  { code: '9001-9/04', description: 'Produção de espetáculos circenses' },
  { code: '9001-9/06', description: 'Atividades de sonorização e iluminação' },
  { code: '5911-1/99', description: 'Produção cinematográfica e de vídeos' },
  { code: '8230-0/01', description: 'Serviços de organização de feiras e festas' },
  { code: '8592-9/99', description: 'Ensino de arte e cultura não especificado' }
];

const TaxManager: React.FC<TaxManagerProps> = ({ transactions, businessProfile, onUpdateProfile, initialTransactionId }) => {
  const currentYear = new Date().getFullYear();
  const MEI_LIMIT = 81000;
  
  const [activeTab, setActiveTab] = useState<'simulator' | 'config'>('simulator');
  const [setupMode, setSetupMode] = useState(!businessProfile.cnpj);
  const [tempProfile, setTempProfile] = useState<BusinessProfile>(() => ({
      ...businessProfile,
      regime: businessProfile.regime || 'MEI'
  }));

  // Estados de Configuração Real
  const [certUploaded, setCertUploaded] = useState(false);
  const [certPassword, setCertPassword] = useState('');
  const [cityToken, setCityToken] = useState('');
  const [environment, setEnvironment] = useState<'homologation' | 'production'>('homologation');

  const [customerName, setCustomerName] = useState('');
  const [customerDoc, setCustomerDoc] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceValue, setServiceValue] = useState<number>(0);
  const [selectedCnae, setSelectedCnae] = useState<Cnae | null>(businessProfile.mainCnae || null);
  const [withholdIss, setWithholdIss] = useState(false);
  const [issRate, setIssRate] = useState(2);

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

  const revenuePJ = useMemo(() => {
    return transactions
      .filter(t => t.entity === 'PJ' && t.type === 'inflow' && new Date(t.date).getFullYear() === currentYear)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions, currentYear]);

  const percentageUsed = (revenuePJ / MEI_LIMIT) * 100;

  const handleSaveProfile = () => {
    if (!tempProfile.cnpj || !tempProfile.companyName || !tempProfile.mainCnae) {
        alert("Preencha Razão Social, CNPJ e CNAE Principal para continuar.");
        return;
    }
    onUpdateProfile(tempProfile);
    setSetupMode(false);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (setupMode) {
    return (
        <div className="max-w-4xl mx-auto animate-fade-in py-8 px-4">
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border-t-8 border-govblue p-8 md:p-12">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-govblue text-3xl">🏛️</div>
                    <div><h2 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Onboarding Fiscal</h2><p className="text-gray-500 dark:text-gray-400 font-medium">Configure sua empresa para destravar cálculos automatizados.</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Razão Social</label><input type="text" value={tempProfile.companyName} onChange={e => setTempProfile({...tempProfile, companyName: e.target.value})} placeholder="NOME DA EMPRESA LTDA" className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-blue-100 outline-none dark:text-white font-bold transition-all"/></div>
                        <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CNPJ</label><input type="text" value={tempProfile.cnpj} onChange={e => setTempProfile({...tempProfile, cnpj: maskCpfCnpj(e.target.value)})} placeholder="00.000.000/0001-00" className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-blue-100 outline-none dark:text-white font-mono transition-all"/></div>
                        <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Regime Tributário</label><div className="grid grid-cols-2 gap-3"><button onClick={() => setTempProfile({...tempProfile, regime: 'MEI'})} className={`py-4 rounded-2xl border-2 font-black text-xs transition-all ${tempProfile.regime === 'MEI' ? 'border-govblue bg-blue-50 dark:bg-blue-900/20 text-govblue' : 'border-gray-50 dark:border-slate-700 text-gray-400'}`}>MEI</button><button onClick={() => setTempProfile({...tempProfile, regime: 'ME'})} className={`py-4 rounded-2xl border-2 font-black text-xs transition-all ${tempProfile.regime === 'ME' ? 'border-govblue bg-blue-50 dark:bg-blue-900/20 text-govblue' : 'border-gray-50 dark:border-slate-700 text-gray-400'}`}>ME (SIMPLES)</button></div></div>
                    </div>
                    <div className="space-y-6">
                        <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CNAE Principal</label><select value={tempProfile.mainCnae?.code || ''} onChange={e => setTempProfile({...tempProfile, mainCnae: CULTURAL_CNAES.find(c => c.code === e.target.value)})} className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-blue-100 outline-none dark:text-white text-xs font-bold transition-all h-[58px]"><option value="">Selecione sua atividade...</option>{CULTURAL_CNAES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.description.substring(0, 40)}...</option>)}</select></div>
                        <button onClick={handleSaveProfile} className="w-full py-5 bg-govblue text-white font-black rounded-3xl shadow-xl hover:bg-blue-800 transition-all transform active:scale-95 uppercase text-sm tracking-widest">Salvar e Destravar</button>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in-up pb-12 px-2 sm:px-0">
      
      {/* Navegação entre Simulador e Configuração Legal */}
      <div className="flex justify-center mb-10">
          <div className="bg-white dark:bg-slate-800 p-1.5 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700 flex">
              <button 
                onClick={() => setActiveTab('simulator')}
                className={`px-8 py-3 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'simulator' ? 'bg-govblue text-white shadow-xl' : 'text-gray-400'}`}
              >
                📊 Simulador NFSe
              </button>
              <button 
                onClick={() => setActiveTab('config')}
                className={`px-8 py-3 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'config' ? 'bg-govblue text-white shadow-xl' : 'text-gray-400'}`}
              >
                ⚙️ Conexão Prefeitura
              </button>
          </div>
      </div>

      {activeTab === 'simulator' ? (
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-sm border border-gray-100 dark:border-slate-700">
                 {businessProfile.regime === 'MEI' ? (
                    <div className="flex flex-col h-full justify-center">
                        <div className="flex justify-between items-end mb-6"><div><h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Termômetro MEI</h3><p className="text-4xl font-black text-govblue dark:text-white tracking-tighter">{formatCurrency(revenuePJ)}</p></div><div className="text-right"><p className="text-[10px] font-black text-gray-400 uppercase">Teto: {formatCurrency(MEI_LIMIT)}</p><span className={`text-[10px] font-black px-3 py-1 rounded-full ${percentageUsed > 80 ? 'bg-red-100 text-red-600' : 'bg-govgreen/10 text-govgreen'}`}>{percentageUsed.toFixed(1)}% USADO</span></div></div>
                        <div className="w-full bg-gray-100 dark:bg-slate-900 rounded-full h-4 overflow-hidden"><div className={`h-full transition-all duration-1000 ${percentageUsed > 80 ? 'bg-red-500' : 'bg-govgreen'}`} style={{ width: `${Math.min(percentageUsed, 100)}%` }}></div></div>
                    </div>
                 ) : (
                    <div className="flex flex-col h-full justify-center">
                        <div className="flex justify-between items-start mb-6"><div><h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Análise Fator R</h3><p className="text-4xl font-black text-govblue dark:text-blue-400 tracking-tighter">Índice: {factorR.toFixed(1)}%</p></div><div className="text-right"><div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${factorR >= 28 ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>{factorR >= 28 ? 'Anexo III (6%)' : 'Anexo V (15.5%)'}</div></div></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{factorR >= 28 ? '✅ Alíquota reduzida ativa.' : '⚠️ Atenção: Carga tributária elevada.'}</p>
                    </div>
                 )}
              </div>
              <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
                 <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6"><span className="text-[10px] font-black text-govgreen uppercase tracking-widest px-3 py-1 bg-white/10 rounded-full">{businessProfile.regime} ATIVO</span><button onClick={() => setSetupMode(true)} className="text-[10px] font-black text-slate-400 hover:text-white transition-colors">EDITAR</button></div>
                    <p className="text-xl font-bold uppercase tracking-tighter leading-tight mb-1">{businessProfile.companyName}</p>
                    <p className="text-xs text-slate-500 font-mono mb-6">{businessProfile.cnpj}</p>
                    <div className="pt-6 border-t border-slate-800"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">CNAE Principal</p><p className="text-[11px] font-bold text-slate-300 leading-snug">{businessProfile.mainCnae?.description}</p></div>
                 </div>
              </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            <div className="xl:col-span-5 space-y-8">
                <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-xl border border-gray-100 dark:border-slate-700">
                    <h3 className="text-xl font-black text-gray-800 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tighter leading-none">📝 Nova Simulação</h3>
                    <div className="space-y-6">
                        <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Discriminação</label><textarea value={serviceDesc} onChange={e => setServiceDesc(e.target.value)} rows={3} placeholder="Descreva o serviço..." className="w-full px-5 py-4 rounded-2xl border bg-gray-50 dark:bg-slate-900 text-sm font-medium outline-none dark:text-white"/></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Valor Bruto</label><input type="number" value={serviceValue || ''} onChange={e => setServiceValue(parseFloat(e.target.value) || 0)} className="w-full px-4 py-4 rounded-2xl border bg-gray-50 dark:bg-slate-900 text-sm font-black outline-none dark:text-white"/></div>
                            <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">CNAE</label><select value={selectedCnae?.code || ''} onChange={e => setSelectedCnae(CULTURAL_CNAES.find(c => c.code === e.target.value) || null)} className="w-full px-4 py-4 rounded-2xl border bg-gray-50 dark:bg-slate-900 text-[10px] font-black dark:text-white"><option value="">Padrão</option>{CULTURAL_CNAES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}</select></div>
                        </div>
                    </div>
                </div>
                {!certUploaded && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-[2.5rem] border border-amber-200 flex items-start gap-4">
                        <span className="text-2xl">⚠️</span>
                        <div><h4 className="text-xs font-black text-amber-700 uppercase mb-1">Apenas Simulação</h4><p className="text-[10px] text-amber-600 leading-relaxed">Para emitir notas reais com validade jurídica, conecte seu Certificado Digital na aba de configurações.</p></div>
                    </div>
                )}
            </div>

            <div className="xl:col-span-7">
                <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border-4 border-slate-100 dark:border-slate-700 overflow-hidden sticky top-24">
                    <div className="bg-slate-50 dark:bg-slate-900 px-10 py-6 flex justify-between items-center border-b"><div className="flex items-center gap-3"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg ${businessProfile.regime === 'MEI' ? 'bg-govgreen' : 'bg-govblue'}`}>NF</div><div><span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Nota Fiscal de Serviço Eletrônica</span><p className="text-[9px] font-bold text-slate-400">MODELO NACIONAL • SIMULAÇÃO DE COMPLIANCE</p></div></div></div>
                    <div className="p-12 space-y-10">
                        <div className="grid grid-cols-2 gap-10 border-b pb-10">
                            <div><p className="text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest">Prestador</p><p className="text-lg font-black text-gray-800 dark:text-white uppercase leading-none">{businessProfile.companyName}</p><p className="text-xs font-bold text-gray-500 mt-2">CNPJ: {businessProfile.cnpj}</p></div>
                            <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest">Tomador</p><p className="text-lg font-black text-gray-800 dark:text-white uppercase leading-none">{customerName || 'NOME DO CLIENTE'}</p></div>
                        </div>
                        <div className="min-h-[120px] p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl border text-xs font-mono text-gray-600 dark:text-gray-300 leading-relaxed">{serviceDesc || 'Aguardando descrição...'}</div>
                        <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-[2.5rem]">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] text-center"><p className="text-[9px] font-black text-slate-400 uppercase mb-2">Bruto</p><p className="text-sm font-black text-gray-800 dark:text-white">{formatCurrency(serviceValue)}</p></div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] text-center"><p className="text-[9px] font-black text-slate-400 uppercase mb-2">Impostos</p><p className="text-sm font-black text-orange-500">-{formatCurrency(taxCalculation.total)}</p></div>
                            <div className="bg-slate-900 p-6 rounded-[2rem] text-center col-span-2 shadow-xl"><p className="text-[9px] font-black text-slate-500 uppercase mb-2">Líquido Estimado</p><p className="text-sm font-black text-govgreen">{formatCurrency(serviceValue - taxCalculation.total)}</p></div>
                        </div>
                        <div className="pt-8 flex flex-col items-center">
                            <button className="px-12 py-5 bg-govblue text-white font-black rounded-3xl shadow-xl hover:shadow-blue-200 transition-all uppercase text-xs tracking-widest disabled:opacity-50" disabled={!serviceValue}>Copiar Guia de Preenchimento →</button>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-xl border p-10">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h3 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Configuração de Emissão Legal</h3>
                        <p className="text-gray-500 font-medium">Conecte sua empresa aos servidores da prefeitura para emitir notas reais.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setEnvironment('homologation')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${environment === 'homologation' ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-gray-100 text-gray-400'}`}>Homologação</button>
                        <button onClick={() => setEnvironment('production')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${environment === 'production' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-gray-100 text-gray-400'}`}>Produção</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Certificado Digital (A1 - .pfx)</label>
                            <div 
                                className={`h-48 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all cursor-pointer ${certUploaded ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 hover:bg-blue-50 border-gray-200 hover:border-govblue'}`}
                                onClick={() => setCertUploaded(true)}
                            >
                                {certUploaded ? (
                                    <div className="text-center animate-fade-in">
                                        <span className="text-4xl">✅</span>
                                        <p className="text-xs font-black text-emerald-700 mt-2 uppercase">Certificado Conectado</p>
                                        <p className="text-[9px] text-emerald-500 uppercase mt-1">Validade: 12/2025</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <span className="text-4xl">📂</span>
                                        <p className="text-[10px] font-black text-gray-400 mt-3 uppercase">Clique para fazer upload</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {certUploaded && (
                            <div className="animate-fade-in-up">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Senha do Certificado</label>
                                <input 
                                    type="password" 
                                    value={certPassword}
                                    onChange={e => setCertPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-5 py-4 rounded-2xl border bg-gray-50 dark:bg-slate-900 text-sm font-black outline-none"
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h4 className="text-xs font-black text-gray-800 dark:text-white uppercase mb-4">Credenciais da Prefeitura</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Inscrição Municipal</label>
                                    <input type="text" placeholder="000.000-0" className="w-full px-5 py-3 rounded-xl border bg-gray-50 text-sm font-bold outline-none"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Token de Acesso (API)</label>
                                    <input 
                                        type="text" 
                                        value={cityToken}
                                        onChange={e => setCityToken(e.target.value)}
                                        placeholder="Seu token de emissor..." 
                                        className="w-full px-5 py-3 rounded-xl border bg-gray-50 text-sm font-mono outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100">
                            <p className="text-[10px] font-black text-govblue uppercase mb-2">Padrão de Transmissão</p>
                            <p className="text-xs text-blue-700 font-bold leading-relaxed">
                                O Destrava utiliza o padrão **ABRASF v2.04** com assinatura digital em tempo real. Certifique-se de que sua prefeitura aceita envios via Webservice.
                            </p>
                        </div>

                        <button 
                            disabled={!certUploaded || !certPassword || !cityToken}
                            className="w-full py-5 bg-govblue text-white font-black rounded-3xl shadow-xl hover:bg-blue-800 transition-all transform active:scale-95 uppercase text-sm tracking-widest disabled:opacity-50"
                        >
                            Verificar Conexão Legal →
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TaxManager;
