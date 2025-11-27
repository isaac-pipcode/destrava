import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';

interface AccountabilityProps {
  transactions: Transaction[];
}

const Accountability: React.FC<AccountabilityProps> = ({ transactions }) => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [legislation, setLegislation] = useState('LPG'); // LPG (Paulo Gustavo) or PNAB (Aldir Blanc)
  
  const availableProjects = useMemo(() => {
      const projects = Array.from(new Set(transactions.map(t => t.project).filter(Boolean)));
      return projects.sort();
  }, [transactions]);

  const filteredData = useMemo(() => {
    if (!selectedProject) return [];
    return transactions.filter(t => t.project === selectedProject).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, selectedProject]);

  const totalInflow = filteredData.reduce((acc, t) => t.type === 'inflow' ? acc + t.amount : acc, 0);
  const totalOutflow = filteredData.reduce((acc, t) => t.type === 'outflow' ? acc + t.amount : acc, 0);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const exportToCSV = () => {
    if (filteredData.length === 0) return;

    // Standardized columns for accountability based on Gov requirements
    const headers = [
        'Item', 
        'Data', 
        'Descrição da Despesa', 
        'Favorecido (Fornecedor)',
        'CNPJ/CPF Fornecedor', 
        'Natureza da Despesa (Rubrica)', 
        'Nº Documento Fiscal',
        'Nº Pix/Cheque',
        'Valor', 
        'Tipo (E/S)'
    ];
    
    const rows = filteredData.map((t, idx) => [
        idx + 1,
        new Date(t.date).toLocaleDateString('pt-BR'),
        `"${t.description}"`, // Quote to handle commas
        `"${t.description}"`, // Often description matches Payee in simple view, or add dedicated Payee field
        `"${t.supplierDoc || ''}"`,
        `"${t.category}"`,
        "Nota Fiscal/Recibo",
        `"${t.paymentDoc || ''}"`,
        t.amount.toFixed(2).replace('.', ','),
        t.type === 'inflow' ? 'Entrada' : 'Saída'
    ]);

    const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Prestacao_Contas_${legislation}_${selectedProject.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in-up pb-12">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8 border-l-8 border-govblue">
         <h2 className="text-3xl font-display font-bold text-gray-800 mb-2">Prestação de Contas (Transferegov)</h2>
         <p className="text-gray-500 mb-8 max-w-2xl">
            Ferramenta de conformidade para a Lei Paulo Gustavo e Política Nacional Aldir Blanc.
            Gera relatórios padronizados com os campos exigidos pelos editais.
         </p>

         <div className="flex flex-col md:flex-row items-end gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <div className="w-full md:w-1/3">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Legislação / Edital</label>
                <select 
                    value={legislation}
                    onChange={(e) => setLegislation(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-govblue focus:ring-1 focus:ring-govblue bg-white font-bold text-govblue"
                >
                    <option value="LPG">Lei Paulo Gustavo (LC 195/2022)</option>
                    <option value="PNAB">Política Nac. Aldir Blanc (Lei 14.399/2022)</option>
                    <option value="Estadual">ProAC / Funcultura / Outros</option>
                </select>
            </div>

            <div className="w-full md:w-1/3">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Selecione o Projeto</label>
                <select 
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-govblue focus:ring-1 focus:ring-govblue bg-white"
                >
                    <option value="">-- Selecione --</option>
                    {availableProjects.map(p => <option key={p} value={p as string}>{p}</option>)}
                </select>
            </div>
            
            {selectedProject && (
                <button 
                    onClick={exportToCSV}
                    className="px-6 py-3 bg-govgreen text-white font-bold rounded-xl shadow hover:bg-green-700 transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Exportar Relatório Oficial
                </button>
            )}
         </div>
      </div>

      {selectedProject ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-govblue text-white px-8 py-6 flex justify-between items-center">
               <div>
                 <h3 className="font-bold text-lg">Extrato de Execução Financeira</h3>
                 <p className="text-xs opacity-80">Referência: {selectedProject} | {legislation}</p>
               </div>
               <div className="text-right">
                   <p className="text-xs opacity-80 uppercase">Saldo Remanescente</p>
                   <span className={`font-bold text-2xl ${totalInflow - totalOutflow >= 0 ? 'text-white' : 'text-orange-300'}`}>{formatCurrency(totalInflow - totalOutflow)}</span>
               </div>
            </div>

            <div className="overflow-x-auto p-0">
                <table className="min-w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-tight text-gray-500">
                            <th className="px-4 py-4 border-r border-gray-100 font-bold text-center w-12">#</th>
                            <th className="px-4 py-4 border-r border-gray-100 font-bold w-24">Data</th>
                            <th className="px-4 py-4 border-r border-gray-100 font-bold">Descrição / Fornecedor</th>
                            <th className="px-4 py-4 border-r border-gray-100 font-bold">CNPJ/CPF</th>
                            <th className="px-4 py-4 border-r border-gray-100 font-bold">Rubrica (Natureza)</th>
                            <th className="px-4 py-4 border-r border-gray-100 font-bold">Doc. Fiscal</th>
                            <th className="px-4 py-4 font-bold text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredData.length > 0 ? filteredData.map((t, idx) => (
                             <tr key={t.id} className="hover:bg-blue-50/10">
                                <td className="px-4 py-3 border-r border-gray-100 text-gray-400 text-center font-mono text-xs">{idx + 1}</td>
                                <td className="px-4 py-3 border-r border-gray-100 text-gray-600">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                <td className="px-4 py-3 border-r border-gray-100 text-gray-800 font-bold">{t.description}</td>
                                <td className="px-4 py-3 border-r border-gray-100 text-gray-500 text-xs font-mono">{t.supplierDoc || '-'}</td>
                                <td className="px-4 py-3 border-r border-gray-100 text-gray-600">
                                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">{t.category}</span>
                                </td>
                                <td className="px-4 py-3 border-r border-gray-100 text-gray-500 text-xs">
                                    {t.paymentDoc ? `Doc: ${t.paymentDoc}` : 'N/A'}
                                </td>
                                <td className={`px-4 py-3 text-right font-bold ${t.type === 'inflow' ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {t.type === 'outflow' ? '-' : ''} {new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 2}).format(t.amount)}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-gray-400 italic">
                                    Nenhum lançamento encontrado para este projeto.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="bg-gray-50 px-8 py-4 text-xs text-gray-500 border-t border-gray-100 text-center">
                Documento gerado eletronicamente pelo sistema Mapa da Gestão - Sujeito a conferência documental física.
            </div>
        </div>
      ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
              <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 text-govblue border border-gray-100">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l5.414 5.414a1 1 0 01.586 1.414V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <p className="text-gray-500 font-medium">Selecione o projeto acima para carregar a tabela de conciliação.</p>
          </div>
      )}
    </div>
  );
};

export default Accountability;