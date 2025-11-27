import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

interface ReportsProps {
  transactions: Transaction[];
}

const COLORS = ['#4c1d95', '#f43f5e', '#059669', '#3b82f6', '#eab308', '#8b5cf6', '#ec4899', '#6366f1'];

const Reports: React.FC<ReportsProps> = ({ transactions }) => {
  const [selectedEntity, setSelectedEntity] = useState<'all' | 'PF' | 'PJ'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  // Extract unique values for filters
  const availableMonths = useMemo(() => Array.from(new Set(transactions.map(t => t.month))), [transactions]);
  const availableCategories = useMemo(() => Array.from(new Set(transactions.map(t => t.category))), [transactions]);
  const availableProjects = useMemo(() => Array.from(new Set(transactions.map(t => t.project || '').filter(Boolean))), [transactions]);

  // Filter Data
  const filteredData = useMemo(() => {
    return transactions.filter(t => {
      const matchEntity = selectedEntity === 'all' || t.entity === selectedEntity;
      const matchMonth = selectedMonth === 'all' || t.month === selectedMonth;
      const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
      const matchProject = selectedProject === 'all' || t.project === selectedProject;
      return matchEntity && matchMonth && matchCategory && matchProject;
    });
  }, [transactions, selectedEntity, selectedMonth, selectedCategory, selectedProject]);

  // --- Chart 1: Evolution over time (Line Chart) ---
  const evolutionData = useMemo(() => {
    // Group by month, but we need meaningful order. 
    // We'll use the ISO date to sort, then aggregate.
    const grouped: Record<string, { date: number, name: string, Receita: number, Despesa: number }> = {};
    
    filteredData.forEach(t => {
      const monthKey = t.month;
      if (!grouped[monthKey]) {
        grouped[monthKey] = { 
            date: new Date(t.date).getTime(), // Keep a timestamp for sorting
            name: monthKey, 
            Receita: 0, 
            Despesa: 0 
        };
      }
      if (t.type === 'inflow') grouped[monthKey].Receita += t.amount;
      else grouped[monthKey].Despesa += t.amount;
    });

    return Object.values(grouped).sort((a, b) => a.date - b.date);
  }, [filteredData]);

  // --- Chart 2: Expenses by Category (Bar Chart) ---
  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredData.filter(t => t.type === 'outflow').forEach(t => {
      grouped[t.category] = (grouped[t.category] || 0) + t.amount;
    });

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort descending
  }, [filteredData]);

  // --- KPI Totals ---
  const totalInflow = filteredData.reduce((acc, t) => t.type === 'inflow' ? acc + t.amount : acc, 0);
  const totalOutflow = filteredData.reduce((acc, t) => t.type === 'outflow' ? acc + t.amount : acc, 0);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (transactions.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4 text-primary">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Sem dados para relatórios</h2>
            <p className="text-gray-500 mt-2">Adicione transações no seu Diário Financeiro para visualizar gráficos.</p>
        </div>
    )
  }

  return (
    <div className="animate-fade-in-up pb-12">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-purple-100 pb-6 gap-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-gray-900">Relatórios & Análise</h2>
          <p className="text-gray-500 mt-1">Entenda para onde vai o dinheiro de cada projeto.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-50 mb-8 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wide mr-4">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
           Filtros
        </div>

        <select 
          value={selectedEntity} 
          onChange={(e) => setSelectedEntity(e.target.value as 'all' | 'PF' | 'PJ')}
          className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-medium focus:ring-primary focus:border-primary"
        >
          <option value="all">Pessoa Física & Jurídica</option>
          <option value="PF">Apenas Pessoa Física</option>
          <option value="PJ">Apenas Pessoa Jurídica</option>
        </select>
        
        <select 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-medium focus:ring-primary focus:border-primary"
        >
          <option value="all">Todos os Meses</option>
          {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-medium focus:ring-primary focus:border-primary"
        >
          <option value="all">Todas as Categorias</option>
          {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select 
          value={selectedProject} 
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-medium focus:ring-primary focus:border-primary"
        >
          <option value="all">Todos os Projetos</option>
          {availableProjects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
           <p className="text-xs font-bold text-emerald-700 uppercase">Receita Total (Filtro)</p>
           <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalInflow)}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
           <p className="text-xs font-bold text-red-700 uppercase">Despesa Total (Filtro)</p>
           <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalOutflow)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200">
           <p className="text-xs font-bold text-gray-500 uppercase">Resultado Líquido</p>
           <p className={`text-2xl font-bold mt-1 ${totalInflow - totalOutflow >= 0 ? 'text-primary' : 'text-red-500'}`}>
               {formatCurrency(totalInflow - totalOutflow)}
           </p>
        </div>
      </div>

      {/* Accountability Report Mode (Activated when Project is selected) */}
      {selectedProject !== 'all' && (
        <div className="mb-12 bg-white rounded-3xl shadow-sm border border-purple-200 overflow-hidden">
            <div className="bg-purple-50 px-8 py-6 border-b border-purple-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l5.414 5.414a1 1 0 01.586 1.414V19a2 2 0 01-2 2z"></path></svg>
                    <h3 className="text-lg font-bold text-gray-900">Prestação de Contas: {selectedProject}</h3>
                  </div>
                  <p className="text-sm text-gray-600">Modelo formatado para Editais (Lei Paulo Gustavo / Aldir Blanc)</p>
                </div>
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg shadow hover:bg-purple-800 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                  Imprimir / PDF
                </button>
            </div>
            <div className="overflow-x-auto p-4">
                <table className="min-w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border border-gray-200">
                            <th className="px-4 py-3 border border-gray-300 font-bold text-gray-700">Item</th>
                            <th className="px-4 py-3 border border-gray-300 font-bold text-gray-700">Data Pgto</th>
                            <th className="px-4 py-3 border border-gray-300 font-bold text-gray-700">Fornecedor / Descrição</th>
                            <th className="px-4 py-3 border border-gray-300 font-bold text-gray-700">Natureza da Despesa</th>
                            <th className="px-4 py-3 border border-gray-300 font-bold text-gray-700">Tipo Doc.</th>
                            <th className="px-4 py-3 border border-gray-300 font-bold text-gray-700 text-right">Valor (R$)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((t, idx) => (
                             <tr key={t.id} className="border border-gray-200 hover:bg-gray-50">
                                <td className="px-4 py-2 border border-gray-300 text-gray-600 text-center">{idx + 1}</td>
                                <td className="px-4 py-2 border border-gray-300 text-gray-800">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                <td className="px-4 py-2 border border-gray-300 text-gray-800 font-medium">{t.description}</td>
                                <td className="px-4 py-2 border border-gray-300 text-gray-600">{t.category}</td>
                                <td className="px-4 py-2 border border-gray-300 text-gray-500 italic text-xs">Nota Fiscal/Recibo</td>
                                <td className={`px-4 py-2 border border-gray-300 text-right font-bold ${t.type === 'inflow' ? 'text-black' : 'text-red-600'}`}>
                                    {t.type === 'outflow' ? '-' : ''} {new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 2}).format(t.amount)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-100 font-bold">
                        <tr>
                            <td colSpan={5} className="px-4 py-3 border border-gray-300 text-right uppercase">Saldo do Projeto</td>
                            <td className={`px-4 py-3 border border-gray-300 text-right ${totalInflow - totalOutflow < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
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
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-50">
           <h3 className="text-lg font-bold text-gray-800 mb-6">Evolução Financeira</h3>
           <div className="h-80 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={evolutionData}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `R$${val/1000}k`} tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="Receita" stroke="#10b981" fillOpacity={1} fill="url(#colorReceita)" strokeWidth={3} />
                  <Area type="monotone" dataKey="Despesa" stroke="#ef4444" fillOpacity={1} fill="url(#colorDespesa)" strokeWidth={3} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-50">
           <h3 className="text-lg font-bold text-gray-800 mb-6">Gastos por Categoria</h3>
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
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '11px', color: '#666'}}/>
                </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
      
      {/* Detail Table for Filtered Data (General View) */}
      {selectedCategory !== 'all' && selectedProject === 'all' && (
          <div className="mt-8 bg-white rounded-3xl shadow-sm border border-purple-50 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Detalhamento: {selectedCategory}</h3>
              <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left">
                      <thead className="text-xs text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
                          <tr>
                              <th className="px-6 py-3">Data</th>
                              <th className="px-6 py-3">Descrição</th>
                              <th className="px-6 py-3">Entidade</th>
                              <th className="px-6 py-3">Projeto</th>
                              <th className="px-6 py-3 text-right">Valor</th>
                          </tr>
                      </thead>
                      <tbody>
                          {filteredData.filter(t => t.category === selectedCategory).map(t => (
                              <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                                  <td className="px-6 py-3 text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                                  <td className="px-6 py-3 font-medium text-gray-900">{t.description}</td>
                                  <td className="px-6 py-3">
                                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${t.entity === 'PF' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                                          {t.entity}
                                      </span>
                                  </td>
                                  <td className="px-6 py-3 text-primary">{t.project || '-'}</td>
                                  <td className="px-6 py-3 text-right font-bold text-red-500">
                                      - {formatCurrency(t.amount)}
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