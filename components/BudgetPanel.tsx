import React, { useMemo, useState } from 'react';
import { CaretLeft, CaretRight, MagicWand, Target, Trash } from '@phosphor-icons/react';
import { Transaction, MonthlyBudget } from '../types';
import { addMonths, monthNameOf } from '../utils/projection';
import { suggestBudgets } from '../utils/budgetSuggestions';
import { budgetId } from '../utils/ids';
import { categoriesFor } from '../utils/categories';

interface BudgetPanelProps {
  transactions: Transaction[];
  budgets: MonthlyBudget[];
  entity: 'PF' | 'PJ';
  customCategories: string[];
  onUpsertBudgets: (budgets: MonthlyBudget[]) => void;
  onDeleteBudget: (id: string) => void;
}

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const BudgetPanel: React.FC<BudgetPanelProps> = ({ transactions, budgets, entity, customCategories, onUpsertBudgets, onDeleteBudget }) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const monthBudgets = useMemo(
    () => budgets.filter(b => b.entity === entity && b.month === month),
    [budgets, entity, month]
  );

  // Realizado por categoria (saídas) no mês selecionado
  const realizedByCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach(t => {
      if ((t.status ?? 'REALIZED') === 'PLANNED') return;
      if (t.entity !== entity || t.type !== 'outflow') return;
      if (t.date.slice(0, 7) !== month) return;
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
    return map;
  }, [transactions, entity, month]);

  const rows = useMemo(() => monthBudgets.map(b => {
    const realized = realizedByCategory.get(b.category) || 0;
    const pct = b.plannedAmount > 0 ? (realized / b.plannedAmount) * 100 : 0;
    return { ...b, realized, pct, deviation: realized - b.plannedAmount };
  }).sort((a, b) => b.plannedAmount - a.plannedAmount), [monthBudgets, realizedByCategory]);

  const totals = useMemo(() => {
    const planned = rows.reduce((a, r) => a + r.plannedAmount, 0);
    const realized = rows.reduce((a, r) => a + r.realized, 0);
    const onTrack = rows.filter(r => r.realized <= r.plannedAmount).length;
    return { planned, realized, adherence: rows.length ? Math.round((onTrack / rows.length) * 100) : 0 };
  }, [rows]);

  const availableCategories = useMemo(() => {
    const base = [...categoriesFor(entity, 'outflow'), ...customCategories];
    const used = new Set(monthBudgets.map(b => b.category));
    return base.filter(c => !used.has(c));
  }, [entity, customCategories, monthBudgets]);

  const handleSuggest = () => {
    const suggestions = suggestBudgets(transactions, { entity, uptoMonth: month, lookbackMonths: 3 });
    const entries = Object.entries(suggestions);
    if (entries.length === 0) {
      alert('Sem histórico suficiente nos últimos 3 meses para sugerir metas. Registre ou importe lançamentos primeiro.');
      return;
    }
    // Upsert por id determinístico: metas existentes da categoria são sobrescritas
    onUpsertBudgets(entries.map(([category, plannedAmount]) => ({
      id: budgetId(entity, month, category),
      month,
      category,
      plannedAmount,
      entity,
    })));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newAmount.replace(/\./g, '').replace(',', '.'));
    if (!newCategory || isNaN(amount) || amount <= 0) return;
    onUpsertBudgets([{
      id: budgetId(entity, month, newCategory),
      month,
      category: newCategory,
      plannedAmount: amount,
      entity,
    }]);
    setNewCategory('');
    setNewAmount('');
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Cabeçalho + navegação de mês */}
      <div className="bg-surface p-6 rounded-3xl shadow-brand-sm border border-line flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-display font-extrabold text-ink flex items-center gap-2 uppercase tracking-tight">
            <Target size={20} weight="bold" className="text-primary" /> Orçamento Mensal (Meta × Realizado)
          </h3>
          <p className="text-sm text-muted mt-1 font-medium">
            Defina quanto pretende gastar por categoria e acompanhe o desvio ao longo do mês.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface-2 rounded-2xl border border-line p-1.5">
          <button onClick={() => setMonth(m => addMonths(m, -1))} className="p-2 rounded-xl hover:bg-surface text-muted transition-all"><CaretLeft size={16} weight="bold" /></button>
          <div className="px-4 text-center">
            <span className="text-sm font-black text-ink">{monthNameOf(month)}</span>
            <span className="text-subtle text-[10px] font-bold tracking-widest block">{month.slice(0, 4)}</span>
          </div>
          <button onClick={() => setMonth(m => addMonths(m, 1))} className="p-2 rounded-xl hover:bg-surface text-muted transition-all"><CaretRight size={16} weight="bold" /></button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface p-5 rounded-3xl shadow-brand-sm border border-line">
          <p className="text-[10px] text-subtle font-black uppercase mb-1 tracking-widest">Meta Total</p>
          <p className="text-xl font-black text-ink font-mono tabular-nums">{formatCurrency(totals.planned)}</p>
        </div>
        <div className="bg-surface p-5 rounded-3xl shadow-brand-sm border border-line">
          <p className="text-[10px] text-subtle font-black uppercase mb-1 tracking-widest">Realizado</p>
          <p className={`text-xl font-black font-mono tabular-nums ${totals.realized > totals.planned && totals.planned > 0 ? 'text-error' : 'text-ink'}`}>{formatCurrency(totals.realized)}</p>
        </div>
        <div className="bg-surface p-5 rounded-3xl shadow-brand-sm border border-line">
          <p className="text-[10px] text-subtle font-black uppercase mb-1 tracking-widest">Aderência</p>
          <p className={`text-xl font-black font-mono tabular-nums ${totals.adherence >= 70 ? 'text-success' : 'text-warning'}`}>{rows.length ? `${totals.adherence}%` : '—'}</p>
        </div>
      </div>

      {/* Nova meta + sugerir */}
      <div className="bg-surface p-6 rounded-3xl shadow-brand-sm border border-line">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 flex-1 min-w-[260px]">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-[10px] font-black text-subtle mb-1.5 uppercase tracking-widest">Categoria</label>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full rounded-2xl border border-line px-4 py-3 text-sm bg-surface-2 text-ink font-bold outline-none focus:ring-2 focus:ring-primary">
                <option value="">Selecione...</option>
                {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="w-36">
              <label className="block text-[10px] font-black text-subtle mb-1.5 uppercase tracking-widest">Meta (R$)</label>
              <input type="text" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="0,00" className="w-full rounded-2xl border border-line px-4 py-3 text-sm bg-surface-2 text-ink font-mono tabular-nums font-black outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <button type="submit" className="px-6 py-3 bg-primary text-primary-on font-black rounded-2xl uppercase text-xs tracking-widest shadow-brand-sm hover:bg-primary-hover transition-all">
              Definir Meta
            </button>
          </form>
          <button
            onClick={handleSuggest}
            className="px-5 py-3 bg-accent-soft text-accent font-black rounded-2xl uppercase text-xs tracking-widest hover:bg-accent hover:text-white transition-all flex items-center gap-2"
            title="Preenche metas com a média dos últimos 3 meses"
          >
            <MagicWand size={16} weight="bold" /> Sugerir metas
          </button>
        </div>
        <p className="text-[10px] text-subtle font-medium mt-3">
          "Sugerir metas" usa a média realizada por categoria nos últimos 3 meses — um ponto de partida realista, ajustável a qualquer momento.
        </p>
      </div>

      {/* Lista de metas */}
      {rows.length === 0 ? (
        <div className="bg-surface border border-dashed border-line rounded-3xl p-12 text-center text-subtle">
          <p className="text-sm font-black uppercase tracking-widest">Nenhuma meta para {monthNameOf(month)}</p>
          <p className="text-xs font-medium mt-2">Defina metas manualmente ou use "Sugerir metas" para começar pela sua média histórica.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-3xl shadow-brand-sm border border-line divide-y divide-line overflow-hidden">
          {rows.map(r => {
            const over = r.realized > r.plannedAmount;
            const width = Math.min(r.pct, 100);
            return (
              <div key={r.id} className="px-6 py-5">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="min-w-0">
                    <span className="text-sm font-black text-ink">{r.category}</span>
                    <span className={`ml-3 text-[10px] font-black uppercase ${over ? 'text-error' : 'text-success'}`}>
                      {over ? `+${formatCurrency(r.deviation)} acima` : `${Math.round(r.pct)}% da meta`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-black font-mono tabular-nums text-muted">
                      {formatCurrency(r.realized)} <span className="text-subtle font-bold">/ {formatCurrency(r.plannedAmount)}</span>
                    </span>
                    <button onClick={() => onDeleteBudget(r.id)} className="p-2 bg-error-soft rounded-lg text-error hover:bg-error hover:text-white transition-all" title="Remover meta">
                      <Trash size={14} weight="bold" />
                    </button>
                  </div>
                </div>
                <div className="w-full bg-surface-2 rounded-full h-2.5 border border-line relative overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-error' : r.pct > 80 ? 'bg-warning' : 'bg-primary'}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BudgetPanel;
