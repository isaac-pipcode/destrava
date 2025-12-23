
import React, { useState, useEffect } from 'react';

const PricingCalculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hourly' | 'project'>('hourly');

  // --- STATE: HOURLY RATE ---
  const [desiredIncome, setDesiredIncome] = useState<string>('');
  const [fixedCosts, setFixedCosts] = useState<string>('');
  const [daysPerWeek, setDaysPerWeek] = useState<string>('5');
  const [hoursPerDay, setHoursPerDay] = useState<string>('6'); // 6 productive hours is realistic
  const [calculatedHourlyRate, setCalculatedHourlyRate] = useState<number>(0);

  // --- STATE: PROJECT PRICING ---
  const [estimatedHours, setEstimatedHours] = useState<string>('');
  const [manualHourlyRate, setManualHourlyRate] = useState<string>('');
  const [directCosts, setDirectCosts] = useState<string>(''); // Material, Assistants
  const [profitMargin, setProfitMargin] = useState<string>('20');
  const [taxRate, setTaxRate] = useState<string>('6'); // Default MEI/Simples often starts around 6% or 0% for MEI fixed
  
  // Results
  const [baseCost, setBaseCost] = useState(0);
  const [profitValue, setProfitValue] = useState(0);
  const [priceBeforeTax, setPriceBeforeTax] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [taxValue, setTaxValue] = useState(0);

  // --- EFFECTS ---
  
  // Auto-calculate Hourly Rate
  useEffect(() => {
    const income = parseFloat(desiredIncome) || 0;
    const costs = parseFloat(fixedCosts) || 0;
    const days = parseFloat(daysPerWeek) || 0;
    const hours = parseFloat(hoursPerDay) || 0;

    if (days > 0 && hours > 0) {
      // 4.28 weeks in a month on average
      const totalHoursMonth = days * hours * 4.28;
      const totalRevenueNeeded = income + costs;
      setCalculatedHourlyRate(totalRevenueNeeded / totalHoursMonth);
    } else {
      setCalculatedHourlyRate(0);
    }
  }, [desiredIncome, fixedCosts, daysPerWeek, hoursPerDay]);

  // Sync calculated rate to manual rate input if user switches tabs
  useEffect(() => {
    if (calculatedHourlyRate > 0 && !manualHourlyRate) {
      setManualHourlyRate(calculatedHourlyRate.toFixed(2));
    }
  }, [calculatedHourlyRate, activeTab]);

  // Auto-calculate Project Price
  useEffect(() => {
    const h = parseFloat(estimatedHours) || 0;
    const r = parseFloat(manualHourlyRate) || 0;
    const c = parseFloat(directCosts) || 0;
    const margin = parseFloat(profitMargin) || 0;
    const tax = parseFloat(taxRate) || 0;

    // 1. Base Cost (Labor + Direct Costs)
    const cost = (h * r) + c;
    setBaseCost(cost);

    // 2. Profit (Markup on Cost)
    const profit = cost * (margin / 100);
    setProfitValue(profit);

    // 3. Price Before Tax
    const preTax = cost + profit;
    setPriceBeforeTax(preTax);

    // 4. Final Price (Gross Up)
    // Formula: Final = PreTax / (1 - TaxRate)
    // Example: You need 100. Tax is 10%. Invoice must be 111.11. (111.11 * 0.10 = 11.11 -> Net 100)
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
    <div className="animate-fade-in-up pb-12">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 mb-8 border-l-8 border-indigo-500">
         <h2 className="text-3xl font-display font-bold text-gray-800 dark:text-white mb-2">Calculadora de Precificação</h2>
         <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
            Pare de chutar valores. Descubra o valor real da sua hora e forme preços justos que cobrem seus custos e impostos.
         </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
          <div className="bg-gray-100 dark:bg-slate-700 p-1 rounded-xl flex">
              <button 
                onClick={() => setActiveTab('hourly')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'hourly' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                  1. Calcular Valor Hora
              </button>
              <button 
                onClick={() => setActiveTab('project')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'project' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                  2. Precificar Projeto
              </button>
          </div>
      </div>

      <div key={activeTab} className="animate-fade-in">
        {activeTab === 'hourly' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <span>⏱️</span> Dados de Trabalho
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Meta de Renda Mensal (Líquida)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-400">R$</span>
                                <input 
                                  type="number" 
                                  value={desiredIncome}
                                  onChange={e => setDesiredIncome(e.target.value)}
                                  placeholder="Ex: 5000"
                                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Quanto você quer tirar "limpo" pro bolso?</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Custos Fixos Mensais</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-400">R$</span>
                                <input 
                                  type="number" 
                                  value={fixedCosts}
                                  onChange={e => setFixedCosts(e.target.value)}
                                  placeholder="Ex: 1500"
                                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Aluguel, Internet, Softwares, Contador, MEI...</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Dias / Semana</label>
                                <input 
                                  type="number" 
                                  value={daysPerWeek}
                                  onChange={e => setDaysPerWeek(e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Horas Produtivas / Dia</label>
                                <input 
                                  type="number" 
                                  value={hoursPerDay}
                                  onChange={e => setHoursPerDay(e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-3xl border border-indigo-100 dark:border-indigo-800 flex flex-col justify-center items-center text-center">
                    <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4">Seu Valor Hora Mínimo</h4>
                    <div className="text-5xl font-display font-bold text-indigo-600 dark:text-indigo-300 mb-2">
                        {formatCurrency(calculatedHourlyRate)}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 max-w-xs text-sm">
                        Para cobrir seus custos fixos e atingir sua meta salarial, você não deve cobrar menos que isso por hora técnica.
                    </p>
                    
                    <div className="mt-8 w-full bg-white dark:bg-slate-800 p-4 rounded-xl text-left text-xs text-gray-500 dark:text-gray-400 shadow-sm">
                        <p className="mb-1"><strong>Custo Mensal Total:</strong> {formatCurrency((parseFloat(desiredIncome)||0) + (parseFloat(fixedCosts)||0))}</p>
                        <p><strong>Horas Vendáveis Mês:</strong> {((parseFloat(daysPerWeek)||0) * (parseFloat(hoursPerDay)||0) * 4.28).toFixed(0)}h</p>
                    </div>

                    <button 
                      onClick={() => setActiveTab('project')}
                      className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors text-sm"
                    >
                        Usar este valor em um Orçamento &rarr;
                    </button>
                </div>
            </div>
        )}

        {activeTab === 'project' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <span>💰</span> Composição do Preço
                    </h3>

                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Horas Estimadas</label>
                                <input 
                                  type="number" 
                                  value={estimatedHours}
                                  onChange={e => setEstimatedHours(e.target.value)}
                                  placeholder="Ex: 10"
                                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Valor da Hora</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-3 text-gray-400">R$</span>
                                  <input 
                                      type="number" 
                                      value={manualHourlyRate}
                                      onChange={e => setManualHourlyRate(e.target.value)}
                                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                  />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Custos Diretos (Terceiros/Materiais)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-3 text-gray-400">R$</span>
                              <input 
                                  type="number" 
                                  value={directCosts}
                                  onChange={e => setDirectCosts(e.target.value)}
                                  placeholder="Ex: 500 (Transporte, assistente, etc)"
                                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                              />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Margem de Lucro (%)</label>
                                <input 
                                  type="number" 
                                  value={profitMargin}
                                  onChange={e => setProfitMargin(e.target.value)}
                                  placeholder="20"
                                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Imposto NF (%)</label>
                                <input 
                                  type="number" 
                                  value={taxRate}
                                  onChange={e => setTaxRate(e.target.value)}
                                  placeholder="6"
                                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-4">
                    <div className="bg-gray-50 dark:bg-slate-900 p-6 rounded-3xl border border-gray-200 dark:border-slate-700">
                        <h4 className="font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-200 dark:border-slate-700 pb-2">Resultado do Cálculo</h4>
                        
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Custo Base (Horas + Diretos)</span>
                                <span>{formatCurrency(baseCost)}</span>
                            </div>
                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                                <span>+ Lucro ({profitMargin}%)</span>
                                <span>{formatCurrency(profitValue)}</span>
                            </div>
                            <div className="flex justify-between text-orange-600 dark:text-orange-400 font-bold border-b border-gray-200 dark:border-slate-700 pb-2">
                                <span>+ Imposto "Por dentro"</span>
                                <span>{formatCurrency(taxValue)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="font-bold text-gray-800 dark:text-white uppercase text-xs">Valor da Nota Fiscal</span>
                                <span className="text-3xl font-display font-bold text-indigo-600 dark:text-indigo-400">
                                    {formatCurrency(finalPrice)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 text-xs text-indigo-800 dark:text-indigo-200">
                        <p><strong>Entenda o Imposto:</strong> O cálculo já inclui o "Gross Up". Se você emitir uma nota de <strong>{formatCurrency(finalPrice)}</strong> e pagar <strong>{taxRate}%</strong> de imposto ({formatCurrency(finalPrice * (parseFloat(taxRate)/100))}), sobrará exatamente o valor do seu custo + lucro ({formatCurrency(priceBeforeTax)}).</p>
                    </div>
                </div>
            </div>
        )}
      </div>

    </div>
  );
};

export default PricingCalculator;
