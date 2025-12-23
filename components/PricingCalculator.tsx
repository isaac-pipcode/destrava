
import React, { useState, useEffect } from 'react';

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

  // --- LÓGICA DE TRANSFERÊNCIA ---
  const handleUseRateInProject = () => {
    if (calculatedHourlyRate > 0) {
      setManualHourlyRate(calculatedHourlyRate.toFixed(2));
      setActiveTab('project');
      // Scroll para o topo para garantir que o usuário veja a mudança
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // --- EFFECTS ---
  
  // Auto-calculate Hourly Rate
  useEffect(() => {
    const income = parseFloat(desiredIncome) || 0;
    const costs = parseFloat(fixedCosts) || 0;
    const days = parseFloat(daysPerWeek) || 0;
    const hours = parseFloat(hoursPerDay) || 0;

    if (days > 0 && hours > 0) {
      // 4.28 semanas em um mês em média
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
    <div className="max-w-5xl mx-auto animate-fade-in-up pb-12">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 mb-8 border-l-8 border-indigo-500">
         <h2 className="text-3xl font-display font-bold text-gray-800 dark:text-white mb-2 tracking-tighter uppercase">Calculadora de Precificação</h2>
         <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl font-medium">
            Forme preços justos baseados na sua realidade de custos e impostos da economia criativa.
         </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-10">
          <div className="bg-gray-100 dark:bg-slate-700 p-1.5 rounded-2xl flex shadow-inner">
              <button 
                onClick={() => setActiveTab('hourly')}
                className={`px-8 py-3 rounded-xl text-sm font-black transition-all uppercase tracking-widest ${activeTab === 'hourly' ? 'bg-white dark:bg-slate-600 shadow-md text-indigo-600 dark:text-indigo-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                  1. Valor da Hora
              </button>
              <button 
                onClick={() => setActiveTab('project')}
                className={`px-8 py-3 rounded-xl text-sm font-black transition-all uppercase tracking-widest ${activeTab === 'project' ? 'bg-white dark:bg-slate-600 shadow-md text-indigo-600 dark:text-indigo-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                  2. Orçamento Projeto
              </button>
          </div>
      </div>

      <div key={activeTab} className="animate-fade-in">
        {activeTab === 'hourly' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-700">
                    <h3 className="text-xl font-black text-gray-800 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tighter leading-none">
                        <span className="p-2 bg-indigo-50 dark:bg-slate-700 rounded-xl">⏱️</span> Custos Mensais
                    </h3>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Meta de Renda Mensal (Líquida)</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-4 text-gray-400 font-bold">R$</span>
                                <input 
                                  type="number" 
                                  value={desiredIncome}
                                  onChange={e => setDesiredIncome(e.target.value)}
                                  placeholder="Ex: 5000"
                                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none dark:text-white font-black transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Custos Fixos (Internet, MEI, Aluguel...)</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-4 text-gray-400 font-bold">R$</span>
                                <input 
                                  type="number" 
                                  value={fixedCosts}
                                  onChange={e => setFixedCosts(e.target.value)}
                                  placeholder="Ex: 1500"
                                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none dark:text-white font-black transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Dias Úteis/Sem</label>
                                <input 
                                  type="number" 
                                  value={daysPerWeek}
                                  onChange={e => setDaysPerWeek(e.target.value)}
                                  className="w-full px-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none dark:text-white font-black transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Horas Reais/Dia</label>
                                <input 
                                  type="number" 
                                  value={hoursPerDay}
                                  onChange={e => setHoursPerDay(e.target.value)}
                                  className="w-full px-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none dark:text-white font-black transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-indigo-600 p-10 rounded-[2.5rem] shadow-2xl flex flex-col justify-center items-center text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl transform -translate-x-10 translate-y-20"></div>
                    
                    <h4 className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-4">Seu Valor Hora Recomendado</h4>
                    <div className="text-6xl font-black mb-4 tracking-tighter">
                        {formatCurrency(calculatedHourlyRate)}
                    </div>
                    <p className="text-white/80 max-w-xs text-sm font-medium mb-10 leading-relaxed">
                        Este é o valor mínimo que você deve cobrar para atingir suas metas de sustentabilidade.
                    </p>
                    
                    <button 
                      onClick={handleUseRateInProject}
                      disabled={calculatedHourlyRate <= 0}
                      className="group relative px-8 py-4 bg-white text-indigo-600 font-black rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-widest"
                    >
                        Usar este valor em um Orçamento →
                    </button>
                </div>
            </div>
        )}

        {activeTab === 'project' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-700">
                    <h3 className="text-xl font-black text-gray-800 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tighter">
                        <span className="p-2 bg-emerald-50 dark:bg-slate-700 rounded-xl">💰</span> Composição do Preço
                    </h3>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Horas para o Projeto</label>
                                <input 
                                  type="number" 
                                  value={estimatedHours}
                                  onChange={e => setEstimatedHours(e.target.value)}
                                  placeholder="Ex: 10"
                                  className="w-full px-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-emerald-100 outline-none dark:text-white font-black transition-all"
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
                                      className={`w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-emerald-100 outline-none dark:text-white font-black transition-all ${calculatedHourlyRate > 0 ? 'animate-pulse ring-2 ring-indigo-200' : ''}`}
                                  />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Custos Diretos (Material, Logística, Terceiros)</label>
                            <div className="relative">
                              <span className="absolute left-4 top-4 text-gray-400 font-bold">R$</span>
                              <input 
                                  type="number" 
                                  value={directCosts}
                                  onChange={e => setDirectCosts(e.target.value)}
                                  placeholder="Ex: 500"
                                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-emerald-100 outline-none dark:text-white font-black transition-all"
                              />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Margem de Lucro (%)</label>
                                <input 
                                  type="number" 
                                  value={profitMargin}
                                  onChange={e => setProfitMargin(e.target.value)}
                                  className="w-full px-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-emerald-100 outline-none dark:text-white font-black transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Imposto / NF (%)</label>
                                <input 
                                  type="number" 
                                  value={taxRate}
                                  onChange={e => setTaxRate(e.target.value)}
                                  className="w-full px-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-4 focus:ring-emerald-100 outline-none dark:text-white font-black transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">Resultado do Cálculo</h4>
                        
                        <div className="space-y-4 font-medium">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Custo Operacional</span>
                                <span className="font-bold">{formatCurrency(baseCost)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-emerald-400">Margem de Lucro ({profitMargin}%)</span>
                                <span className="font-bold">{formatCurrency(profitValue)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-4">
                                <span className="text-orange-400">Reserva Fiscal (Imposto)</span>
                                <span className="font-bold">{formatCurrency(taxValue)}</span>
                            </div>
                            <div className="pt-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Valor Sugerido do Orçamento</p>
                                <p className="text-4xl font-black text-center text-white tracking-tighter">
                                    {formatCurrency(finalPrice)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800">
                        <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase mb-2">💡 Nota sobre Impostos</p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 leading-relaxed font-medium">
                            O cálculo utiliza a técnica de "Gross Up", garantindo que após pagar o imposto sobre a nota, você receba exatamente o valor do custo + lucro planejado.
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
