import React, { useMemo, useState } from 'react';
import { Bank, CheckCircle, CloudArrowUp, Sparkle, WarningCircle } from '@phosphor-icons/react';
import { Transaction, BankAccount } from '../types';
import { parseBankStatement, ParsedStatementLine } from '../services/bankStatementParser';
import { guessCategory, categoriesFor } from '../utils/categories';
import { refineCategories } from '../services/geminiService';
import { monthNameOf } from '../utils/projection';
import { generateId } from '../App';

interface StatementImportProps {
  accounts: BankAccount[];
  customCategories: string[];
  onImport: (transactions: Transaction[]) => void;
  onDone: () => void;
}

interface PreviewLine extends ParsedStatementLine {
  include: boolean;
  category: string;
}

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const StatementImport: React.FC<StatementImportProps> = ({ accounts, customCategories, onImport, onDone }) => {
  const [entity, setEntity] = useState<'PF' | 'PJ'>('PJ');
  const [accountId, setAccountId] = useState('');
  const [lines, setLines] = useState<PreviewLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refining, setRefining] = useState(false);
  const [refined, setRefined] = useState(false);
  const [imported, setImported] = useState(0);

  const contextAccounts = useMemo(() => accounts.filter(a => a.entityType === entity), [accounts, entity]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') return;

      // Parse determinístico, local e instantâneo — sem custo de IA
      const result = parseBankStatement(text);
      if (!result.success) {
        setError(result.errors.join(' '));
        return;
      }
      setError(null);
      setRefined(false);
      setLines(result.transactions.map(t => ({
        ...t,
        include: true,
        category: guessCategory(t.description, t.type, entity),
      })));
    };
    reader.readAsText(file);
  };

  const switchEntity = (next: 'PF' | 'PJ') => {
    setEntity(next);
    setAccountId('');
    setRefined(false);
    // Recategoriza pela heurística local no novo contexto
    setLines(prev => prev.map(l => ({ ...l, category: guessCategory(l.description, l.type, next) })));
  };

  const availableCategories = (type: 'inflow' | 'outflow') => [...categoriesFor(entity, type), ...customCategories];

  const handleRefineWithAI = async () => {
    setRefining(true);
    try {
      const all = [...new Set([...categoriesFor(entity, 'inflow'), ...categoriesFor(entity, 'outflow'), ...customCategories])];
      const result = await refineCategories(
        lines.map(l => ({ description: l.description, type: l.type, category: l.category })),
        entity,
        all
      );
      const byDesc = new Map(result.map(r => [`${r.description}|${r.type}`, r.category]));
      setLines(prev => prev.map(l => ({ ...l, category: byDesc.get(`${l.description}|${l.type}`) || l.category })));
      setRefined(true);
    } finally {
      setRefining(false);
    }
  };

  const updateLine = (idx: number, patch: Partial<PreviewLine>) => {
    setLines(prev => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const included = lines.filter(l => l.include);
  const totals = useMemo(() => included.reduce((acc, l) => {
    if (l.type === 'inflow') acc.inflow += l.amount; else acc.outflow += l.amount;
    return acc;
  }, { inflow: 0, outflow: 0 }), [included]);

  const handleConfirm = () => {
    const selectedAccount = accountId || contextAccounts[0]?.id;
    const txs: Transaction[] = included.map(l => ({
      id: generateId(),
      description: l.description,
      amount: l.amount,
      type: l.type,
      category: l.category,
      date: `${l.date}T12:00:00.000Z`,
      month: monthNameOf(l.date.slice(0, 7)),
      entity,
      accountId: selectedAccount,
    }));
    onImport(txs);
    setImported(txs.length);
    setLines([]);
  };

  if (imported > 0) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-success-soft rounded-3xl flex items-center justify-center text-success mx-auto mb-6">
          <CheckCircle size={44} weight="bold" />
        </div>
        <h2 className="text-2xl font-display font-extrabold text-ink uppercase tracking-tight mb-2">{imported} lançamentos importados</h2>
        <p className="text-sm text-muted font-medium mb-8">Os lançamentos já estão no seu Diário {entity === 'PJ' ? 'da Empresa' : 'Pessoal'}.</p>
        <button onClick={onDone} className="px-8 py-4 bg-primary text-primary-on font-black rounded-2xl uppercase text-xs tracking-widest shadow-brand-md hover:bg-primary-hover transition-all">
          Concluir
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-2 sm:px-4 animate-fade-in-up">
      {error && (
        <div className="mb-6 bg-error-soft border border-error/40 text-error px-4 py-3 rounded-2xl flex items-center gap-2" role="alert">
          <WarningCircle size={20} weight="bold" />
          <span className="text-sm font-bold">{error}</span>
        </div>
      )}

      {lines.length === 0 ? (
        <div className="max-w-xl mx-auto">
          <div className="bg-surface p-8 rounded-[2.5rem] shadow-brand-md border border-line">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary-soft rounded-2xl flex items-center justify-center text-primary"><Bank size={26} weight="bold" /></div>
              <div>
                <h2 className="text-xl font-display font-extrabold text-ink uppercase tracking-tight">Importar Extrato Bancário</h2>
                <p className="text-xs text-muted font-medium">CSV exportado do seu banco (Nubank, Itaú, Bradesco, BB, Inter...)</p>
              </div>
            </div>

            <div className="relative flex flex-col items-center justify-center w-full h-52 border-2 border-dashed border-line rounded-2xl cursor-pointer bg-surface-2 hover:bg-surface transition-colors mb-4">
              <CloudArrowUp size={36} weight="bold" className="mb-3 text-subtle" />
              <p className="text-sm text-muted text-center px-4"><span className="font-bold">Clique para enviar</span> ou arraste o CSV do extrato</p>
              <p className="text-[10px] text-subtle mt-1 uppercase font-bold tracking-widest">Leitura local e instantânea — sem IA</p>
              <input
                type="file"
                accept=".csv,.txt"
                className="absolute w-full h-full opacity-0 cursor-pointer"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
            </div>
            <p className="text-[11px] text-subtle font-medium leading-relaxed">
              Os valores e datas são lidos pelo app, no seu aparelho, sem passar por IA — zero risco de números inventados.
              Depois, se quiser, a IA ajuda só a classificar as categorias.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Configuração do destino */}
          <div className="bg-surface p-6 rounded-3xl shadow-brand-sm border border-line flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-ink uppercase tracking-widest">{lines.length} lançamentos encontrados</h3>
              <p className="text-[10px] font-bold text-subtle uppercase mt-1">
                Entradas: <span className="text-success">{formatCurrency(totals.inflow)}</span> · Saídas: <span className="text-error">{formatCurrency(totals.outflow)}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-surface-2 rounded-xl p-1 border border-line">
                <button onClick={() => switchEntity('PJ')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${entity === 'PJ' ? 'bg-primary text-primary-on shadow-brand-sm' : 'text-subtle'}`}>Empresa</button>
                <button onClick={() => switchEntity('PF')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${entity === 'PF' ? 'bg-success text-white shadow-brand-sm' : 'text-subtle'}`}>Pessoal</button>
              </div>
              {contextAccounts.length > 0 && (
                <select value={accountId} onChange={e => setAccountId(e.target.value)} className="rounded-xl border border-line px-3 py-2 text-xs bg-surface-2 text-ink font-bold outline-none">
                  {contextAccounts.map(a => <option key={a.id} value={a.id}>{a.bank} - {a.name}</option>)}
                </select>
              )}
              <button
                onClick={handleRefineWithAI}
                disabled={refining || refined}
                className="px-4 py-2 bg-accent-soft text-accent rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all disabled:opacity-50 flex items-center gap-1.5"
                title="Usa IA para melhorar a classificação das categorias (opcional)"
              >
                <Sparkle size={14} weight="bold" /> {refining ? 'Refinando...' : refined ? 'Categorias refinadas' : 'Refinar com IA'}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-surface rounded-3xl shadow-brand-sm border border-line overflow-hidden">
            <div className="max-h-[420px] overflow-y-auto custom-scroll">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-surface shadow-brand-sm z-10">
                  <tr className="text-[10px] font-black text-subtle uppercase border-b border-line">
                    <th className="px-4 py-3 w-10"></th>
                    <th className="px-2 py-3">Data</th>
                    <th className="px-2 py-3">Descrição</th>
                    <th className="px-2 py-3">Categoria</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {lines.map((l, idx) => (
                    <tr key={idx} className={`transition-all ${l.include ? '' : 'opacity-40'}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={l.include} onChange={e => updateLine(idx, { include: e.target.checked })} className="w-4 h-4 accent-[color:var(--primary)]" />
                      </td>
                      <td className="px-2 py-3 text-xs font-bold text-subtle whitespace-nowrap">{new Date(`${l.date}T12:00:00`).toLocaleDateString('pt-BR')}</td>
                      <td className="px-2 py-3 text-xs font-bold text-ink max-w-[220px] truncate">{l.description}</td>
                      <td className="px-2 py-3">
                        <select
                          value={l.category}
                          onChange={e => updateLine(idx, { category: e.target.value })}
                          className="rounded-lg border border-line px-2 py-1.5 text-[10px] bg-surface-2 text-ink font-bold outline-none max-w-[180px]"
                        >
                          {[...new Set([l.category, ...availableCategories(l.type)])].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className={`px-4 py-3 text-right font-black text-xs font-mono tabular-nums whitespace-nowrap ${l.type === 'inflow' ? 'text-success' : 'text-error'}`}>
                        {l.type === 'inflow' ? '+' : '-'} {formatCurrency(l.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button onClick={() => setLines([])} className="px-6 py-4 bg-surface-2 text-muted font-black rounded-2xl uppercase text-xs tracking-widest">
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={included.length === 0}
              className="px-8 py-4 bg-primary text-primary-on font-black rounded-2xl uppercase text-xs tracking-widest shadow-brand-md hover:bg-primary-hover transition-all disabled:opacity-50"
            >
              Adicionar {included.length} ao Diário {entity === 'PJ' ? '(Empresa)' : '(Pessoal)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatementImport;
