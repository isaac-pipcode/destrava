
import React, { useState, useEffect, useCallback } from 'react';

const PricingCalculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hourly' | 'project'>('hourly');

  // --- STATE: HOURLY RATE ---
  const [desiredIncome, setDesiredIncome] = useState<string>('');
  const [fixedCosts, setFixedCosts] = useState<string>('');
  const [daysPerWeek, setDaysPerWeek] = useState<string>('5');
  const [hoursPerDay, setHoursPerDay] = useState<string>('6'); 
  const [calculatedHourlyRate, setCalculatedHourlyRate] = useState<number>(0);

  // --- STATE: PROJECT PRICING ---
  const [estimatedHours, setEstimatedHours] = useState<string>('');
  const [manualHourlyRate, setManualHourlyRate] = useState<string>('');
  const [directCosts, setDirectCosts] = useState<string>(''); 
  const [profitMargin, setProfitMargin] = useState<string>('20');
  const [taxRate, setTaxRate] = useState<string>('6'); 
  
  // Results
  const [baseCost, setBaseCost] = useState(0);
  const [profitValue, setProfitValue] = useState(0);
  const [priceBeforeTax, setPriceBeforeTax] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [taxValue, setTaxValue] = useState(0);

  // --- LÓGICA DE TRANSFERÊNCIA CORRIGIDA ---
  const handleUseRateInProject = useCallback(() => {
    if (calculatedHourlyRate > 0) {
      const rateStr = calculatedHourlyRate.toFixed(2);
      // Garantir que o estado seja atualizado e só depois trocar a aba
      setManualHourlyRate(rateStr);
      setTimeout(() => {
        setActiveTab('project');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  }, [calculatedHourlyRate]);

  // --- EFFECTS ---
  
  // Auto-calculate Hourly Rate
  useEffect(() => {
    const income = parseFloat(desiredIncome) || 0;
    const costs = parseFloat(fixedCosts) || 0;
    const days = parseFloat(daysPerWeek) || 0;
    const hours = parseFloat(hoursPerDay) || 0;

    if (days > 0 && hours > 0) {
      const totalHoursMonth = days * hours * 4.28;
      const totalRevenueNeeded = income + costs;
      setCalculatedHourlyRate(totalRevenueNeeded / totalHoursMonth);
    } else {
      setCalculatedHourlyRate(0);
    }
  }, [desiredIncome, fixedCosts, daysPerWeek, hoursPerDay]);

  // Auto-calculate Project Price
  useEffect(() => {
    const h = parseFloat(estimatedHours) || 0;
    const r = parseFloat(manualHourlyRate) || 0;
    const c = parseFloat(directCosts) || 0;
    const margin = parseFloat(profitMargin) || 0;
    const tax = parseFloat(taxRate) || 0;

    const cost = (h * r) + c;
    setBaseCost(cost);

    const profit = cost * (margin / 100);
    setProfitValue(profit);

    const preTax = cost + profit;
    setPriceBeforeTax(preTax);

    if (tax < 100) {
      const final = preTax / (1 - (tax / 100));
      setFinalPrice(final);
      setTaxValue(final - preTax);
    } else {
      setFinalPrice(0);
      setTaxValue(0);
    }
  }, [estimatedHours, manualHourlyRate, directCosts, profitMargin, taxRate]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up pb-12 px-2 sm:px-0">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700 p-8 mb-8 border-l-8 border-indigo-500">
         <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-2 tracking-tighter uppercase leading-none">Precificação Cultural</h2>
         <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl font-bold uppercase tracking-widest opacity-60">
            Cálculo de sustentabilidade para o trabalhador da cultura.
         </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-10">
          <div className="bg-gray-100 dark:bg-slate-700 p-1.5 rounded-[2rem] flex shadow-inner">
              <button 
                onClick={() => setActiveTab('hourly')}
                className={`px-6 sm:px-10 py-3.5 rounded-3xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'hourly' ? 'bg-white dark:bg-slate-600 shadow-xl text-indigo-600 dark:text-indigo-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                  1. Valor da Hora
              </button>
              <button 
                onClick={() => setActiveTab('project')}
                className={`px-6 sm:px-10 py-3.5 rounded-3xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'project' ? 'bg-white dark:bg-slate-600 shadow-xl text-indigo-600 dark:text-indigo-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                  2. Orçamento Projeto
              </button>
          </div>
      </div>

      <div key={activeTab} className="animate-fade-in">
        {activeTab === 'hourly' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-xl border border-gray-100 dark:border-slate-700">
                    <h3 className="text-xl font-black text-gray-800 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tighter">
                        <span className="p-3 bg-indigo-50 dark:bg-slate-700 rounded-2xl">⏱️</span> Custos Mensais
                    </h3>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Renda Mensal Desejada (Líquida)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-4 text-gray-400 font-bold">R$</span>
                                <input 
                                  type="number" 
                                  value={desiredIncome}
                                  onChange={e => setDesiredIncome(e.target.value)}
                                  placeholder="0,00"
                                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none dark:text-white font-black transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Despesas Fixas (Internet, MEI, etc)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-4 text-gray-400 font-bold">R$</span>
                                <input 
                                  type="number" 
                                  value={fixedCosts}
                                  onChange={e => setFixedCosts(e.target.value)}
                                  placeholder="0,00"
                                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none dark:text-white font-black transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Dias/Semana</label>
                                <input 
                                  type="number" 
                                  value={daysPerWeek}
                                  onChange={e => setDaysPerWeek(e.target.value)}
                                  className="w-full px-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none dark:text-white font-black transition-all text-center"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Horas Reais/Dia</label>
                                <input 
                                  type="number" 
                                  value={hoursPerDay}
                                  onChange={e => setHoursPerDay(e.target.value)}
                                  className="w-full px-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none dark:text-white font-black transition-all text-center"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-indigo-600 p-10 rounded-[3rem] shadow-2xl flex flex-col justify-center items-center text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl transform -translate-x-10 translate-y-20"></div>
                    
                    <h4 className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-4">Valor Recomendado</h4>
                    <div className="text-6xl sm:text-7xl font-black mb-6 tracking-tighter">
                        {formatCurrency(calculatedHourlyRate)}
                    </div>
                    <p className="text-white/80 max-w-xs text-sm font-bold mb-10 leading-tight">
                        Este é o valor mínimo que você deve cobrar por hora para manter sua carreira sustentável.
                    </p>
                    
                    <button 
                      onClick={handleUseRateInProject}
                      disabled={calculatedHourlyRate <= 0}
                      className="group relative px-10 py-5 bg-white text-indigo-600 font-black rounded-3xl transition-all shadow-2xl hover:shadow-white/20 hover:-translate-y-1 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-widest"
                    >
                        Destravar este valor no Projeto →
                    </button>
                </div>
            </div>
        )}

        {activeTab === 'project' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-2 sm:px-0">
                <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-xl border border-gray-100 dark:border-slate-700">
                    <h3 className="text-xl font-black text-gray-800 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tighter leading-none">
                        <span className="p-3 bg-emerald-50 dark:bg-slate-700 rounded-2xl">💰</span> Orçamento
                    </h3>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Estimativa de Horas</label>
                                <input 
                                  type="number" 
                                  value={estimatedHours}
                                  onChange={e => setEstimatedHours(e.target.value)}
                                  placeholder="0"
                                  className="w-full px-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-emerald-100 outline-none dark:text-white font-black transition-all text-center"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Valor da Hora (R$)</label>
                                <div className="relative">
                                  <span className="absolute left-4 top-4 text-gray-400 font-bold">R$</span>
                                  <input 
                                      type="number" 
                                      value={manualHourlyRate}
                                      onChange={e => setManualHourlyRate(e.target.value)}
                                      className={`w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-emerald-100 outline-none dark:text-white font-black transition-all ${manualHourlyRate ? 'bg-emerald-50/30' : ''}`}
                                  />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Custos Diretos (Insumos, Terceiros, etc)</label>
                            <div className="relative">
                              <span className="absolute left-4 top-4 text-gray-400 font-bold">R$</span>
                              <input 
                                  type="number" 
                                  value={directCosts}
                                  onChange={e => setDirectCosts(e.target.value)}
                                  placeholder="0,00"
                                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-emerald-100 outline-none dark:text-white font-black transition-all"
                              />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Lucro Desejado (%)</label>
                                <input 
                                  type="number" 
                                  value={profitMargin}
                                  onChange={e => setProfitMargin(e.target.value)}
                                  className="w-full px-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-emerald-100 outline-none dark:text-white font-black transition-all text-center"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Imposto p/ NF (%)</label>
                                <input 
                                  type="number" 
                                  value={taxRate}
                                  onChange={e => setTaxRate(e.target.value)}
                                  className="w-full px-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-emerald-100 outline-none dark:text-white font-black transition-all text-center"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 border-b border-slate-800 pb-4">Budget do Projeto</h4>
                        
                        <div className="space-y-5 font-bold">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Custo Total Operacional</span>
                                <span>{formatCurrency(baseCost)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-emerald-400">Meta de Lucro ({profitMargin}%)</span>
                                <span>{formatCurrency(profitValue)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-5">
                                <span className="text-orange-400">Impostos Provisórios</span>
                                <span>{formatCurrency(taxValue)}</span>
                            </div>
                            <div className="pt-6 text-center">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Valor Total do Orçamento</p>
                                <p className="text-5xl font-black text-white tracking-tighter leading-none">
                                    {formatCurrency(finalPrice)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-800">
                        <p className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase mb-2 flex items-center gap-2">
                           <span className="text-lg">💡</span> Dica do Especialista
                        </p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 leading-snug font-bold">
                            Cobrar por hora é o primeiro passo para parar de pagar para trabalhar. O "Gross Up" de impostos garante que sua margem seja real.
                        </p>
                    </div>
                </div>
            </div>
        )}
      </div>

    </div>
  );
};

export default PricingCalculator;
