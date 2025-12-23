
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

// Lista exaustiva de CNAEs da Economia Criativa e Cultural
const CULTURAL_CNAES: Cnae[] = [
  // ARTES CÊNICAS E MÚSICA
  { code: '9001-9/01', description: 'Produção de espetáculos teatrais' },
  { code: '9001-9/02', description: 'Produção de espetáculos musicais' },
  { code: '9001-9/03', description: 'Produção de espetáculos de dança' },
  { code: '9001-9/04', description: 'Produção de espetáculos circenses e similares' },
  { code: '9001-9/06', description: 'Atividades de sonorização e de iluminação' },
  { code: '9001-9/99', description: 'Artes cênicas, espetáculos e atividades complementares' },
  
  // ARTES VISUAIS E LITERATURA
  { code: '9002-7/01', description: 'Atividades de artistas plásticos, jornalistas e escritores' },
  { code: '9002-7/02', description: 'Restauração de objetos de arte' },
  
  // AUDIOVISUAL
  { code: '5911-1/01', description: 'Estúdios cinematográficos' },
  { code: '5911-1/02', description: 'Produção de filmes para publicidade' },
  { code: '5911-1/99', description: 'Produção cinematográfica, vídeos e programas de TV' },
  { code: '5912-0/01', description: 'Serviços de dublagem' },
  { code: '5912-0/02', description: 'Serviços de mixagem e edição de áudio e vídeo' },
  { code: '5912-0/99', description: 'Pós-produção cinematográfica e de TV' },
  { code: '5920-1/00', description: 'Gravação de som e de edição de música' },
  
  // GESTÃO E EVENTOS
  { code: '8230-0/01', description: 'Serviços de organização de feiras, congressos e festas' },
  { code: '9003-5/00', description: 'Gestão de espaços para artes cênicas e espetáculos' },
  { code: '9101-5/00', description: 'Atividades de bibliotecas e arquivos' },
  { code: '9102-3/01', description: 'Atividades de museus e prédios históricos' },
  
  // DESIGN E FOTOGRAFIA
  { code: '7410-2/03', description: 'Design de interiores' },
  { code: '7410-2/99', description: 'Atividades de design não especificadas' },
  { code: '7420-0/01', description: 'Atividades de produção de fotografias' },
  
  // EDUCAÇÃO CULTURAL
  { code: '8592-9/01', description: 'Ensino de dança' },
  { code: '8592-9/02', description: 'Ensino de artes cênicas, exceto dança' },
  { code: '8592-9/03', description: 'Ensino de música' },
  { code: '8592-9/99', description: 'Ensino de arte e cultura não especificado' }
];

const TaxManager: React.FC<TaxManagerProps> = ({ transactions, businessProfile, onUpdateProfile, initialTransactionId }) => {
  const currentYear = new Date().getFullYear();
  const MEI_LIMIT = 81000;
  
  const [setupMode, setSetupMode] = useState(!businessProfile.cnpj);
  const [tempProfile, setTempProfile] = useState<BusinessProfile>(() => ({
      ...businessProfile,
      regime: businessProfile.regime || 'MEI'
  }));

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
      // Cálculo simplificado: Folha dos últimos 12 meses / Faturamento últimos 12 meses
      // Aqui usamos os dados disponíveis no estado
      const annualRevenue = transactions
        .filter(t => t.entity === 'PJ' && t.type === 'inflow')
        .reduce((acc, t) => acc + t.amount, 0) || 1;
      
      // Assumindo que lastPayrollTotal é a média mensal x 12 para simplificar o simulador
      return ((businessProfile.lastPayrollTotal * 12) / annualRevenue) * 100;
  }, [businessProfile, transactions]);

  const taxCalculation = useMemo(() => {
    const isMei = businessProfile.regime === 'MEI';
    if (isMei) return { rate: 0, federal: 0, iss: 0, total: 0 };

    // Simples Nacional - Regra do Fator R
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
                    <div>
                        <h2 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Onboarding Fiscal</h2>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Configure sua empresa para destravar cálculos automatizados.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Razão Social</label>
                            <input 
                                type="text" 
                                value={tempProfile.companyName}
                                onChange={e => setTempProfile({...tempProfile, companyName: e.target.value})}
                                placeholder="NOME DA EMPRESA LTDA"
                                className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-blue-100 outline-none dark:text-white font-bold transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CNPJ</label>
                            <input 
                                type="text" 
                                value={tempProfile.cnpj}
                                onChange={e => setTempProfile({...tempProfile, cnpj: maskCpfCnpj(e.target.value)})}
                                placeholder="00.000.000/0001-00"
                                className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-blue-100 outline-none dark:text-white font-mono transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Regime Tributário</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setTempProfile({...tempProfile, regime: 'MEI'})}
                                    className={`py-4 rounded-2xl border-2 font-black text-xs transition-all ${tempProfile.regime === 'MEI' ? 'border-govblue bg-blue-50 dark:bg-blue-900/20 text-govblue' : 'border-gray-50 dark:border-slate-700 text-gray-400'}`}
                                >
                                    MEI
                                </button>
                                <button 
                                    onClick={() => setTempProfile({...tempProfile, regime: 'ME'})}
                                    className={`py-4 rounded-2xl border-2 font-black text-xs transition-all ${tempProfile.regime === 'ME' ? 'border-govblue bg-blue-50 dark:bg-blue-900/20 text-govblue' : 'border-gray-50 dark:border-slate-700 text-gray-400'}`}
                                >
                                    ME (SIMPLES)
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CNAE Principal (Atividade Econômica)</label>
                            <select 
                                value={tempProfile.mainCnae?.code || ''}
                                onChange={e => setTempProfile({...tempProfile, mainCnae: CULTURAL_CNAES.find(c => c.code === e.target.value)})}
                                className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-blue-100 outline-none dark:text-white text-xs font-bold transition-all h-[58px]"
                            >
                                <option value="">Selecione sua atividade...</option>
                                {CULTURAL_CNAES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.description.substring(0, 40)}...</option>)}
                            </select>
                        </div>

                        {tempProfile.regime === 'ME' && (
                             <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800 animate-fade-in-up">
                                <h4 className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase mb-3 tracking-widest">Informação de Folha (Fator R)</h4>
                                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mb-4 leading-tight">Informe seu gasto mensal médio com Pró-labore e encargos.</p>
                                <div className="relative">
                                    <span className="absolute left-4 top-4 text-indigo-400 font-bold">R$</span>
                                    <input 
                                        type="number" 
                                        value={tempProfile.lastPayrollTotal || ''}
                                        onChange={e => setTempProfile({...tempProfile, lastPayrollTotal: parseFloat(e.target.value) || 0})}
                                        className="w-full pl-10 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border-none font-black text-gray-800 dark:text-white"
                                        placeholder="0,00"
                                    />
                                </div>
                             </div>
                        )}

                        <div className="pt-4">
                            <button 
                                onClick={handleSaveProfile}
                                className="w-full py-5 bg-govblue text-white font-black rounded-3xl shadow-xl hover:bg-blue-800 transition-all transform active:scale-95 uppercase text-sm tracking-widest"
                            >
                                Salvar e Destravar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in-up pb-12 px-2 sm:px-0">
      
      {/* Cards de Status Fiscal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-sm border border-gray-100 dark:border-slate-700">
             {businessProfile.regime === 'MEI' ? (
                <div className="flex flex-col h-full justify-center">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Limite Anual MEI ({currentYear})</h3>
                            <p className="text-4xl font-black text-govblue dark:text-white tracking-tighter">{formatCurrency(revenuePJ)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase">Teto: {formatCurrency(MEI_LIMIT)}</p>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full ${percentageUsed > 80 ? 'bg-red-100 text-red-600' : 'bg-govgreen/10 text-govgreen'}`}>
                                {percentageUsed.toFixed(1)}% USADO
                            </span>
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-900 rounded-full h-4 overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${percentageUsed > 80 ? 'bg-red-500' : 'bg-govgreen'}`} style={{ width: `${Math.min(percentageUsed, 100)}%` }}></div>
                    </div>
                </div>
             ) : (
                <div className="flex flex-col h-full justify-center">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Análise Fator R (Simples Nacional)</h3>
                            <p className="text-4xl font-black text-govblue dark:text-blue-400 tracking-tighter">Índice: {factorR.toFixed(1)}%</p>
                        </div>
                        <div className="text-right">
                            <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${factorR >= 28 ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>
                                {factorR >= 28 ? 'Anexo III (6%)' : 'Anexo V (15.5%)'}
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                        {factorR >= 28 
                            ? '✅ Excelente! Seu índice de folha permite a menor tributação do Simples.' 
                            : '⚠️ Atenção: Sua carga tributária está no teto. Considere ajustar seu pró-labore para atingir 28%.'}
                    </p>
                </div>
             )}
          </div>

          <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform"></div>
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-black text-govgreen uppercase tracking-widest px-3 py-1 bg-white/10 rounded-full">{businessProfile.regime} ATIVO</span>
                    <button onClick={() => setSetupMode(true)} className="text-[10px] font-black text-slate-400 hover:text-white transition-colors">EDITAR PERFIL</button>
                </div>
                <p className="text-xl font-bold uppercase tracking-tighter leading-tight mb-1">{businessProfile.companyName}</p>
                <p className="text-xs text-slate-500 font-mono mb-6">{businessProfile.cnpj}</p>
                <div className="pt-6 border-t border-slate-800">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">CNAE Principal</p>
                    <p className="text-[11px] font-bold text-slate-300 leading-snug">{businessProfile.mainCnae?.description}</p>
                </div>
             </div>
          </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* Simulador */}
        <div className="xl:col-span-5 space-y-8">
            <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-xl border border-gray-100 dark:border-slate-700">
                <h3 className="text-xl font-black text-gray-800 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tighter leading-none">
                    <span className="p-4 bg-blue-50 dark:bg-slate-700 rounded-3xl">📝</span> Nova Simulação
                </h3>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Discriminação do Serviço</label>
                        <textarea 
                            value={serviceDesc}
                            onChange={e => setServiceDesc(e.target.value)}
                            rows={3}
                            placeholder="Ex: Prestação de serviços de produção fonográfica para o álbum..."
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
                                <option value="">Perfil ({businessProfile.mainCnae?.code})</option>
                                {CULTURAL_CNAES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-dashed space-y-4">
                         <div className="flex items-center justify-between">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reter ISS no Destino?</label>
                             <button 
                                onClick={() => setWithholdIss(!withholdIss)}
                                className={`w-14 h-7 rounded-full transition-all relative ${withholdIss ? 'bg-govblue' : 'bg-gray-300'}`}
                             >
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${withholdIss ? 'left-8 shadow-md' : 'left-1'}`}></div>
                             </button>
                         </div>
                         
                         {withholdIss && (
                            <div className="animate-fade-in-up">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Alíquota ISS (%)</label>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="number" 
                                        value={issRate}
                                        onChange={e => setIssRate(parseFloat(e.target.value) || 2)}
                                        className="w-24 px-4 py-2 rounded-xl border bg-white dark:bg-slate-900 text-xs font-black"
                                    />
                                    <p className="text-[9px] text-gray-400 font-medium italic">Normalmente 2% a 5% p/ serviços fora do município.</p>
                                </div>
                            </div>
                         )}
                    </div>
                </div>
            </div>
            
            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-800 flex items-start gap-4">
                <span className="text-2xl">🌱</span>
                <div>
                    <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase mb-1 tracking-widest">Dica de Sustentabilidade</h4>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-500 leading-relaxed font-medium">
                        Como {businessProfile.regime}, sua eficiência fiscal depende da organização das notas. Copie os dados técnicos para facilitar o preenchimento no portal da prefeitura.
                    </p>
                </div>
            </div>
        </div>

        {/* Espelho da Nota */}
        <div className="xl:col-span-7">
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border-4 border-slate-100 dark:border-slate-700 overflow-hidden sticky top-24">
                <div className="bg-slate-50 dark:bg-slate-900 px-10 py-6 flex justify-between items-center border-b">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg ${businessProfile.regime === 'MEI' ? 'bg-govgreen' : 'bg-govblue'}`}>NF</div>
                        <div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Nota Fiscal de Serviço Eletrônica</span>
                            <p className="text-[9px] font-bold text-slate-400">MODELO NACIONAL • SIMULAÇÃO DE COMPLIANCE</p>
                        </div>
                    </div>
                </div>
                
                <div className="p-12 space-y-10">
                    <div className="grid grid-cols-2 gap-10 border-b border-slate-100 dark:border-slate-700 pb-10">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest">Prestador</p>
                            <p className="text-lg font-black text-gray-800 dark:text-white uppercase leading-none">{businessProfile.companyName}</p>
                            <p className="text-xs font-bold text-gray-500 mt-2">CNPJ: {businessProfile.cnpj}</p>
                            <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-900 rounded text-slate-500 uppercase mt-2 inline-block">Optante Simples Nacional</span>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest">Tomador</p>
                            <p className="text-lg font-black text-gray-800 dark:text-white uppercase leading-none">{customerName || 'NOME DO CLIENTE'}</p>
                            <p className="text-xs font-bold text-gray-500 mt-2">{customerDoc || '00.000.000/0000-00'}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest">Discriminação</p>
                        <div className="min-h-[160px] p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700 text-xs font-mono text-gray-600 dark:text-gray-300 leading-relaxed shadow-inner">
                            {serviceDesc || 'Aguardando descrição do serviço para visualização...'}
                            {selectedCnae && (
                                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Atividade: {selectedCnae.code} - {selectedCnae.description}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Blocos de Valor */}
                    <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-[2.5rem]">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Valor Bruto</p>
                            <p className="text-sm font-black text-gray-800 dark:text-white">{formatCurrency(serviceValue)}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Federais ({taxCalculation.rate}%)</p>
                            <p className={`text-sm font-black ${taxCalculation.federal > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                                {taxCalculation.federal > 0 ? `-${formatCurrency(taxCalculation.federal)}` : 'Isento'}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-2">ISS Retido</p>
                            <p className={`text-sm font-black ${taxCalculation.iss > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                {taxCalculation.iss > 0 ? `-${formatCurrency(taxCalculation.iss)}` : 'R$ 0,00'}
                            </p>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-[2rem] text-center shadow-xl">
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Líquido Real</p>
                            <p className="text-sm font-black text-govgreen">{formatCurrency(serviceValue - taxCalculation.total)}</p>
                        </div>
                    </div>

                    <div className="pt-8 flex flex-col items-center">
                        <button 
                            disabled={!serviceValue}
                            onClick={() => {
                                const text = `RESUMO FISCAL DE EMISSÃO (${businessProfile.regime})\n` +
                                            `Descrição: ${serviceDesc}\n` +
                                            `Valor Bruto: ${formatCurrency(serviceValue)}\n` +
                                            `Impostos Aplicados: ${formatCurrency(taxCalculation.total)}\n` +
                                            `Valor Líquido: ${formatCurrency(serviceValue - taxCalculation.total)}\n` +
                                            `CNAE: ${selectedCnae?.code || businessProfile.mainCnae?.code}\n` +
                                            `Observações: Fator R de ${factorR.toFixed(1)}% detectado.`;
                                navigator.clipboard.writeText(text);
                                alert('Dados técnicos copiados com sucesso!');
                            }}
                            className="group px-12 py-5 bg-govblue text-white font-black rounded-3xl shadow-xl hover:shadow-blue-200 transition-all transform active:scale-95 uppercase text-xs tracking-widest disabled:opacity-50"
                        >
                            Copiar Guia de Preenchimento →
                        </button>
                        <p className="text-[9px] font-bold text-slate-400 mt-8 uppercase tracking-[0.4em]">Destrava • Inteligência Fiscal Aplicada</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TaxManager;
