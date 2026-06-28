import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { ChartBar, Funnel, FileText, Printer } from '@phosphor-icons/react';

interface ReportsProps {
  transactions: Transaction[];
}

const COLORS = ['#0E6E6A', '#B14A2C', '#E2864D', '#1F7A5C', '#2E6F9E', '#949A99'];

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const Reports: React.FC<ReportsProps> = ({ transactions }) => {
  const [selectedEntity, setSelectedEntity] = useState<'all' | 'PF' | 'PJ'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'inflow' | 'outflow'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  
  // Date Filters
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  // Extract unique values for filters
  const availableCategories = useMemo(() => Array.from(new Set(transactions.map(t => t.category))), [transactions]);
  const availableProjects = useMemo(() => Array.from(new Set(transactions.map(t => t.project || '').filter(Boolean))), [transactions]);
  
  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
    return Array.from(years).sort((a: number, b: number) => b - a);
  }, [transactions]);

  // Filter Data
  const filteredData = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      const tYear = tDate.getFullYear().toString();
      const tMonthIndex = tDate.getMonth(); // 0-11

      // Entity & Type & Category & Project Filters
      const matchEntity = selectedEntity === 'all' || t.entity === selectedEntity;
      const matchType = selectedType === 'all' || t.type === selectedType;
      const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
      const matchProject = selectedProject === 'all' || t.project === selectedProject;

      // Date Filters
      const matchYear = selectedYear === 'all' || tYear === selectedYear;
      
      let matchPeriod = true;
      if (selectedPeriod !== 'all') {
          if (selectedPeriod === 'S1') matchPeriod = tMonthIndex <= 5; // Jan-Jun
          else if (selectedPeriod === 'S2') matchPeriod = tMonthIndex >= 6; // Jul-Dec
          else if (selectedPeriod === 'Q1') matchPeriod = tMonthIndex <= 2; // Jan-Mar
          else if (selectedPeriod === 'Q2') matchPeriod = tMonthIndex >= 3 && tMonthIndex <= 5; // Apr-Jun
          else if (selectedPeriod === 'Q3') matchPeriod = tMonthIndex >= 6 && tMonthIndex <= 8; // Jul-Sep
          else if (selectedPeriod === 'Q4') matchPeriod = tMonthIndex >= 9; // Oct-Dec
          else matchPeriod = tMonthIndex === parseInt(selectedPeriod); // Specific Month
      }

      return matchEntity && matchType && matchCategory && matchProject && matchYear && matchPeriod;
    });
  }, [transactions, selectedEntity, selectedType, selectedCategory, selectedProject, selectedYear, selectedPeriod]);

  // --- Chart 1: Evolution over time (Line Chart) ---
  const evolutionData = useMemo(() => {
    // Group by month label (e.g., "Out/2023" or just "Out" if 1 year selected)
    const grouped: Record<string, { date: number, name: string, Receita: number, Despesa: number }> = {};
    
    filteredData.forEach(t => {
      const d = new Date(t.date);
      // Create a unique key for sorting, and a display name
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      // If multiple years selected, show year in label. If single year, show just month.
      const label = selectedYear === 'all' 
        ? `${MONTH_NAMES[d.getMonth()].substring(0,3)}/${d.getFullYear().toString().substring(2)}`
        : MONTH_NAMES[d.getMonth()].substring(0,3);

      if (!grouped[key]) {
        grouped[key] = { 
            date: d.getTime(), // Sortable timestamp
            name: label, 
            Receita: 0, 
            Despesa: 0 
        };
      }
      if (t.type === 'inflow') grouped[key].Receita += t.amount;
      else grouped[key].Despesa += t.amount;
    });

    return Object.values(grouped).sort((a, b) => a.date - b.date);
  }, [filteredData, selectedYear]);

  // --- Chart 2: Category Breakdown (Pie Chart) ---
  // Logic: If user filters specifically for 'inflow', show Income Sources.
  // Otherwise (All or Outflow), show Expenses breakdown.
  const pieChartType = selectedType === 'inflow' ? 'inflow' : 'outflow';
  const pieChartTitle = selectedType === 'inflow' ? 'Receitas por Categoria' : 'Gastos por Categoria';

  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    // Filter specifically for the chart type logic, independent of 'selectedType' being 'all'
    const dataToChart = selectedType === 'all' 
        ? filteredData.filter(t => t.type === 'outflow') // Default to outflow if ALL is selected
        : filteredData; // Otherwise use the filtered data (which is already specific type)

    dataToChart.forEach(t => {
      grouped[t.category] = (grouped[t.category] || 0) + t.amount;
    });

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort descending
  }, [filteredData, selectedType]);

  // --- KPI Totals ---
  const totalInflow = filteredData.reduce((acc, t) => t.type === 'inflow' ? acc + t.amount : acc, 0);
  const totalOutflow = filteredData.reduce((acc, t) => t.type === 'outflow' ? acc + t.amount : acc, 0);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // --- Custom Tooltips ---

  const CustomEvolutionTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Get data from the original object to calculate net result on hover
      const data = payload[0].payload; 
      const saldo = data.Receita - data.Despesa;
      
      return (
        <div className="bg-surface p-4 border border-line shadow-brand-md rounded-xl min-w-[180px] z-50">
          <p className="font-bold text-ink mb-2 border-b border-line pb-2">{label}</p>
          <div className="space-y-1">
             <div className="flex justify-between items-center text-xs">
                <span className="text-success font-medium">Receita:</span>
                <span className="font-bold text-muted font-mono tabular-nums">{formatCurrency(data.Receita)}</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-error font-medium">Despesa:</span>
                <span className="font-bold text-muted font-mono tabular-nums">{formatCurrency(data.Despesa)}</span>
             </div>
             <div className="border-t border-line mt-2 pt-1 flex justify-between items-center text-xs">
                <span className="text-muted font-bold uppercase">Saldo:</span>
                <span className={`font-bold font-mono tabular-nums ${saldo >= 0 ? 'text-primary' : 'text-warning'}`}>
                    {formatCurrency(saldo)}
                </span>
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface p-3 border border-line shadow-brand-md rounded-xl z-50">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }}></div>
                <p className="font-bold text-ink text-xs">{payload[0].name}</p>
            </div>
            <p className="font-bold text-muted text-sm pl-4 font-mono tabular-nums">
                {formatCurrency(payload[0].value)}
            </p>
        </div>
      );
    }
    return null;
  };

  if (transactions.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-secondary-soft rounded-full flex items-center justify-center mb-4 text-secondary">
                <ChartBar size={40} weight="duotone" />
            </div>
            <h2 className="text-xl font-display font-bold text-ink">Sem dados para relatórios</h2>
            <p className="text-muted mt-2">Adicione transações no seu Diário Financeiro para visualizar gráficos.</p>
        </div>
    )
  }

  return (
    <div className="animate-fade-in-up pb-12">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-line pb-6 gap-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-ink">Relatórios & Análise</h2>
          <p className="text-muted mt-1">Entenda para onde vai o dinheiro de cada projeto.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface p-6 rounded-2xl shadow-brand-sm border border-line mb-8 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-sm font-bold text-muted uppercase tracking-wide mr-4">
           <Funnel size={16} weight="duotone" />
           Filtros
        </div>

        <select
          value={selectedEntity}
          onChange={(e) => setSelectedEntity(e.target.value as 'all' | 'PF' | 'PJ')}
          className="px-4 py-2 rounded-lg bg-surface-2 border border-line text-sm font-medium focus:ring-primary focus:border-primary text-ink"
        >
          <option value="all">Pessoa Física & Jurídica</option>
          <option value="PF">Apenas Pessoa Física</option>
          <option value="PJ">Apenas Pessoa Jurídica</option>
        </select>
        
        <select 
          value={selectedType} 
          onChange={(e) => setSelectedType(e.target.value as 'all' | 'inflow' | 'outflow')}
          className={`px-4 py-2 rounded-lg border text-sm font-medium focus:ring-primary focus:border-primary ${
              selectedType === 'inflow' ? 'bg-success-soft border-success text-success' :
              selectedType === 'outflow' ? 'bg-error-soft border-error text-error' :
              'bg-surface-2 border-line text-ink'
          }`}
        >
          <option value="all">Entradas e Saídas</option>
          <option value="inflow">Apenas Entradas</option>
          <option value="outflow">Apenas Saídas</option>
        </select>

        {/* YEAR Filter */}
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-4 py-2 rounded-lg bg-surface-2 border border-line text-sm font-medium focus:ring-primary focus:border-primary text-ink"
        >
          <option value="all">Todos os Anos</option>
          {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
          ))}
        </select>

        {/* PERIOD Filter */}
        <select 
          value={selectedPeriod} 
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 rounded-lg bg-surface-2 border border-line text-sm font-medium focus:ring-primary focus:border-primary min-w-[140px] text-ink"
        >
          <option value="all">Todo o Período</option>
          <optgroup label="Semestres">
            <option value="S1">1º Semestre (Jan-Jun)</option>
            <option value="S2">2º Semestre (Jul-Dez)</option>
          </optgroup>
          <optgroup label="Trimestres">
            <option value="Q1">1º Trimestre (Jan-Mar)</option>
            <option value="Q2">2º Trimestre (Abr-Jun)</option>
            <option value="Q3">3º Trimestre (Jul-Set)</option>
            <option value="Q4">4º Trimestre (Out-Dez)</option>
          </optgroup>
          <optgroup label="Mensal">
            {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx.toString()}>{m}</option>
            ))}
          </optgroup>
        </select>

        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 rounded-lg bg-surface-2 border border-line text-sm font-medium focus:ring-primary focus:border-primary text-ink"
        >
          <option value="all">Todas as Categorias</option>
          {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select 
          value={selectedProject} 
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-4 py-2 rounded-lg bg-surface-2 border border-line text-sm font-medium focus:ring-primary focus:border-primary text-ink"
        >
          <option value="all">Todos os Projetos</option>
          {availableProjects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`bg-success-soft p-6 rounded-2xl border border-success transition-opacity ${selectedType === 'outflow' ? 'opacity-50' : 'opacity-100'}`}>
           <p className="text-xs font-bold text-success uppercase">Receita Total (Filtro)</p>
           <p className="text-2xl font-bold text-ink mt-1 font-mono tabular-nums">{formatCurrency(totalInflow)}</p>
        </div>
        <div className={`bg-error-soft p-6 rounded-2xl border border-error transition-opacity ${selectedType === 'inflow' ? 'opacity-50' : 'opacity-100'}`}>
           <p className="text-xs font-bold text-error uppercase">Despesa Total (Filtro)</p>
           <p className="text-2xl font-bold text-ink mt-1 font-mono tabular-nums">{formatCurrency(totalOutflow)}</p>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-line">
           <p className="text-xs font-bold text-muted uppercase">Resultado Líquido</p>
           <p className={`text-2xl font-bold mt-1 font-mono tabular-nums ${totalInflow - totalOutflow >= 0 ? 'text-primary' : 'text-error'}`}>
               {formatCurrency(totalInflow - totalOutflow)}
           </p>
        </div>
      </div>

      {/* Accountability Report Mode (Activated when Project is selected) */}
      {selectedProject !== 'all' && (
        <div className="mb-12 bg-surface rounded-3xl shadow-brand-sm border border-line overflow-hidden">
            <div className="bg-secondary-soft px-8 py-6 border-b border-line flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={20} weight="duotone" className="text-secondary" />
                    <h3 className="text-lg font-display font-bold text-ink">Prestação de Contas: {selectedProject}</h3>
                  </div>
                  <p className="text-sm text-muted">Modelo formatado para Editais (Lei Paulo Gustavo / Aldir Blanc)</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-secondary text-white text-sm font-bold rounded-lg shadow-brand-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Printer size={16} weight="duotone" />
                  Imprimir / PDF
                </button>
            </div>
            <div className="overflow-x-auto p-4">
                <table className="min-w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-surface-2 border border-line">
                            <th className="px-4 py-3 border border-line font-bold text-muted">Item</th>
                            <th className="px-4 py-3 border border-line font-bold text-muted">Data Pgto</th>
                            <th className="px-4 py-3 border border-line font-bold text-muted">Fornecedor / Descrição</th>
                            <th className="px-4 py-3 border border-line font-bold text-muted">Natureza da Despesa</th>
                            <th className="px-4 py-3 border border-line font-bold text-muted">Tipo Doc.</th>
                            <th className="px-4 py-3 border border-line font-bold text-muted text-right">Valor (R$)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((t, idx) => (
                             <tr key={t.id} className="border border-line hover:bg-surface-2">
                                <td className="px-4 py-2 border border-line text-muted text-center">{idx + 1}</td>
                                <td className="px-4 py-2 border border-line text-ink">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                <td className="px-4 py-2 border border-line text-ink font-medium">{t.description}</td>
                                <td className="px-4 py-2 border border-line text-muted">{t.category}</td>
                                <td className="px-4 py-2 border border-line text-subtle italic text-xs">Nota Fiscal/Recibo</td>
                                <td className={`px-4 py-2 border border-line text-right font-bold font-mono tabular-nums ${t.type === 'inflow' ? 'text-success' : 'text-error'}`}>
                                    {t.type === 'outflow' ? '-' : ''} {new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 2}).format(t.amount)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-surface-2 font-bold">
                        <tr>
                            <td colSpan={5} className="px-4 py-3 border border-line text-right uppercase text-muted">Saldo do Projeto</td>
                            <td className={`px-4 py-3 border border-line text-right font-mono tabular-nums ${totalInflow - totalOutflow < 0 ? 'text-error' : 'text-success'}`}>
                                {formatCurrency(totalInflow - totalOutflow)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Evolution Chart */}
        <div className="bg-surface p-6 rounded-3xl shadow-brand-sm border border-line">
           <h3 className="text-lg font-display font-bold text-ink mb-6">Evolução Financeira</h3>
           <div className="h-80 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={evolutionData}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1F7A5C" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#1F7A5C" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B14A2C" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#B14A2C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#949A99" className="dark:stroke-slate-700" />
                  <XAxis dataKey="name" tick={{fill: '#949A99', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `R$${val/1000}k`} tick={{fill: '#949A99', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomEvolutionTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="Receita" stroke="#1F7A5C" fillOpacity={1} fill="url(#colorReceita)" strokeWidth={3} />
                  <Area type="monotone" dataKey="Despesa" stroke="#B14A2C" fillOpacity={1} fill="url(#colorDespesa)" strokeWidth={3} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Breakdown by Category */}
        <div className="bg-surface p-6 rounded-3xl shadow-brand-sm border border-line">
           <h3 className="text-lg font-display font-bold text-ink mb-6">{pieChartTitle}</h3>
           <div className="h-80 w-full flex">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '11px', color: '#949A99'}}/>
                </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
      
      {/* Detail Table for Filtered Data (General View) */}
      {selectedProject === 'all' && (
          <div className="mt-8 bg-surface rounded-3xl shadow-brand-sm border border-line p-6">
              <h3 className="text-lg font-display font-bold text-ink mb-4">Detalhamento de Lançamentos</h3>
              <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left">
                      <thead className="text-xs text-subtle uppercase bg-surface-2 border-b border-line">
                          <tr>
                              <th className="px-6 py-3">Data</th>
                              <th className="px-6 py-3">Descrição</th>
                              <th className="px-6 py-3">Entidade</th>
                              <th className="px-6 py-3">Categoria</th>
                              <th className="px-6 py-3">Projeto</th>
                              <th className="px-6 py-3 text-right">Valor</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                          {filteredData.map(t => (
                              <tr key={t.id} className="border-b border-line hover:bg-surface-2">
                                  <td className="px-6 py-3 text-muted">{new Date(t.date).toLocaleDateString()}</td>
                                  <td className="px-6 py-3 font-medium text-ink">{t.description}</td>
                                  <td className="px-6 py-3">
                                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${t.entity === 'PF' ? 'bg-success-soft text-success' : 'bg-primary-soft text-primary'}`}>
                                          {t.entity}
                                      </span>
                                  </td>
                                  <td className="px-6 py-3 text-muted text-xs">{t.category}</td>
                                  <td className="px-6 py-3 text-primary">{t.project || '-'}</td>
                                  <td className={`px-6 py-3 text-right font-bold font-mono tabular-nums ${t.type === 'inflow' ? 'text-success' : 'text-error'}`}>
                                      {t.type === 'inflow' ? '+' : '-'} {formatCurrency(t.amount)}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

    </div>
  );
};

export default Reports;