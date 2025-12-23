
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, BusinessProfile, Cnae } from '../types';
import { maskCpfCnpj } from './ManualManager';

interface TaxManagerProps {
  transactions: Transaction[];
  setTransactions?: React.Dispatch<React.SetStateAction<Transaction[]>>;
  onNavigate: (view: 'manual_pj') => void;
  businessProfile: BusinessProfile;
  onUpdateProfile: (profile: BusinessProfile) => void;
  initialTransactionId?: string; // Para vir do Diário
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const CULTURAL_CNAES: Cnae[] = [
  { code: '9001-9/02', description: 'Produção musical' },
  { code: '9001-9/01', description: 'Produção de espetáculos circenses e similares' },
  { code: '9001-9/06', description: 'Sonorização e iluminação' },
  { code: '5911-1/99', description: 'Produção cinematográfica e vídeos' },
  { code: '8592-9/99', description: 'Ensino de arte e cultura' },
  { code: '8230-0/01', description: 'Organização de eventos e festas' }
];

const TaxManager: React.FC<TaxManagerProps> = ({ transactions, setTransactions, onNavigate, businessProfile, onUpdateProfile, initialTransactionId }) => {
  const currentYear = new Date().getFullYear();
  const MEI_LIMIT = 81000;
  
  // Simulador State
  const [customerName, setCustomerName] = useState('');
  const [customerDoc, setCustomerDoc] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceValue, setServiceValue] = useState<number>(0);
  const [selectedCnae, setSelectedCnae] = useState<Cnae | null>(businessProfile.mainCnae || null);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState<BusinessProfile>({ ...businessProfile });

  // Load from transaction if ID provided
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

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up pb-12">
      
      {/* Resumo de Faturamento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-center">
             <div className="flex justify-between items-end mb-4">
                <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Faturamento Anual MEI ({currentYear})</h3>
                    <p className="text-4xl font-black text-[#1d357d] dark:text-white tracking-tighter">{formatCurrency(revenuePJ)}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Limite MEI</p>
                    <p className="text-sm font-bold text-gray-500">{formatCurrency(MEI_LIMIT)}</p>
                </div>
             </div>
             <div className="w-full bg-gray-100 dark:bg-slate-900 rounded-full h-3 overflow-hidden shadow-inner">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${percentageUsed > 85 ? 'bg-red-500' : 'bg-govgreen'}`} 
                    style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                ></div>
             </div>
             <p className="text-[10px] font-bold text-gray-400 mt-3 uppercase tracking-tight">
                {percentageUsed.toFixed(1)}% do limite utilizado. {percentageUsed > 85 ? '⚠️ Alerta de desenquadramento!' : '✅ Dentro da meta.'}
             </p>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Seu MEI Ativo</h3>
             <p className="text-lg font-bold truncate">{businessProfile.companyName || 'Nome da Empresa'}</p>
             <p className="text-xs text-slate-400 font-mono mt-1">{businessProfile.cnpj || '00.000.000/0001-00'}</p>
             <div className="mt-6 pt-6 border-t border-slate-800">
                <p className="text-[10px] font-black text-govgreen uppercase tracking-widest">CNAE Principal</p>
                <p className="text-xs font-bold text-slate-300 mt-1">{businessProfile.mainCnae?.code || 'Pendente de Configuração'}</p>
             </div>
          </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Formulário do Simulador */}
        <div className="xl:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="text-xl font-black text-gray-800 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tighter">
                    <span className="p-3 bg-blue-50 dark:bg-slate-700 rounded-2xl">📋</span> Dados do Serviço
                </h3>
                
                <div className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Descrição do Serviço (Discriminação)</label>
                        <textarea 
                            value={serviceDesc}
                            onChange={e => setServiceDesc(e.target.value)}
                            rows={3}
                            placeholder="Ex: Prestação de serviço de produção musical para o projeto 'Vozes da Mata'..."
                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Valor do Serviço</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-xs font-bold text-gray-400">R$</span>
                                <input 
                                    type="number" 
                                    value={serviceValue || ''}
                                    onChange={e => setServiceValue(parseFloat(e.target.value) || 0)}
                                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-sm font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">CNAE de Referência</label>
                            <select 
                                value={selectedCnae?.code || ''}
                                onChange={e => setSelectedCnae(CULTURAL_CNAES.find(c => c.code === e.target.value) || null)}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-[10px] font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            >
                                <option value="">Mesmo do Perfil</option>
                                {CULTURAL_CNAES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-dashed">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">Dados do Tomador (Cliente)</label>
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                placeholder="Nome / Razão Social do Cliente"
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            />
                            <input 
                                type="text" 
                                value={customerDoc}
                                onChange={e => setCustomerDoc(maskCpfCnpj(e.target.value))}
                                placeholder="CPF ou CNPJ do Cliente"
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800">
                <p className="text-[10px] font-black text-govblue dark:text-blue-300 uppercase mb-2">💡 Guia de Emissão</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed font-medium">
                    Como MEI, você é isento de retenções federais (IR, CSLL, PIS, COFINS). O ISS geralmente é pago no valor fixo do DAS, mas se o serviço for prestado em outro município, verifique se há retenção local.
                </p>
            </div>
        </div>

        {/* Visualização do Espelho da Nota */}
        <div className="xl:col-span-7">
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border-4 border-slate-100 dark:border-slate-700 overflow-hidden sticky top-24">
                <div className="bg-slate-100 dark:bg-slate-900 px-8 py-4 flex justify-between items-center border-b">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-govblue rounded-lg flex items-center justify-center text-white font-black text-xs">NF</div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Espelho de Nota Fiscal de Serviço Eletrônica</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400">SIMULADOR INTERNO</span>
                </div>
                
                <div className="p-10 space-y-8">
                    {/* Cabeçalho Nota */}
                    <div className="grid grid-cols-2 gap-8 border-b pb-6">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Prestador de Serviços</p>
                            <p className="text-sm font-black text-gray-800 dark:text-white uppercase leading-tight">{businessProfile.companyName || 'Sua Empresa Aqui'}</p>
                            <p className="text-xs font-medium text-gray-500 mt-1">CNPJ: {businessProfile.cnpj || '00.000.000/0001-00'}</p>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Incentivador Cultural: Não</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Tomador de Serviços</p>
                            <p className="text-sm font-black text-gray-800 dark:text-white uppercase leading-tight">{customerName || 'Cliente / Projeto'}</p>
                            <p className="text-xs font-medium text-gray-500 mt-1">{customerDoc || 'CPF/CNPJ do Tomador'}</p>
                        </div>
                    </div>

                    {/* Discriminação */}
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest">Discriminação dos Serviços</p>
                        <div className="min-h-[120px] p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-sm font-mono text-gray-600 dark:text-gray-300 leading-relaxed">
                            {serviceDesc || 'Aguardando descrição do serviço...'}
                            {selectedCnae && (
                                <p className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-400 uppercase">
                                    Atividade: {selectedCnae.code} - {selectedCnae.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Valores */}
                    <div className="grid grid-cols-4 gap-4 pt-4">
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Valor Bruto</p>
                            <p className="text-sm font-black text-gray-800 dark:text-white">{formatCurrency(serviceValue)}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Deduções</p>
                            <p className="text-sm font-black text-gray-800 dark:text-white">{formatCurrency(0)}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">ISS Retido</p>
                            <p className="text-sm font-black text-red-500">{formatCurrency(0)}</p>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-2xl text-center shadow-lg">
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Valor Líquido</p>
                            <p className="text-sm font-black text-govgreen">{formatCurrency(serviceValue)}</p>
                        </div>
                    </div>

                    {/* Footer Nota */}
                    <div className="pt-8 border-t flex flex-col items-center">
                        <button 
                            onClick={() => {
                                const text = `NOTAS PARA O PORTAL:\nDescrição: ${serviceDesc}\nValor: ${serviceValue}\nTomador: ${customerName} (${customerDoc})\nCNAE: ${selectedCnae?.code}`;
                                navigator.clipboard.writeText(text);
                                alert('Dados copiados para facilitar o preenchimento no site da prefeitura!');
                            }}
                            className="px-10 py-4 bg-govblue text-white font-black rounded-2xl shadow-xl hover:shadow-blue-200 transition-all transform active:scale-95 uppercase text-xs tracking-widest"
                        >
                            Copiar Dados para o Portal →
                        </button>
                        <p className="text-[9px] font-bold text-slate-400 mt-6 uppercase tracking-widest">Simulador Destrava v1.0 • Baseado no Padrão Nacional NFSe</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TaxManager;
