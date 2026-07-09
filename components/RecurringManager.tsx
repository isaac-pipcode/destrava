import React, { useMemo, useState } from 'react';
import { ArrowsClockwise, Plus, Trash } from '@phosphor-icons/react';
import { RecurringRule, BankAccount } from '../types';
import { categoriesFor } from '../utils/categories';

interface RecurringManagerProps {
  recurringRules: RecurringRule[];
  accounts: BankAccount[];
  entity: 'PF' | 'PJ';
  customCategories: string[];
  onAddRule: (rule: RecurringRule) => void;
  onDeleteRule: (id: string) => void;
}

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const generateRuleId = () => `rec_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`;

const RecurringManager: React.FC<RecurringManagerProps> = ({ recurringRules, accounts, entity, customCategories, onAddRule, onDeleteRule }) => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'inflow' | 'outflow'>('outflow');
  const [category, setCategory] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState(5);
  const [startMonth, setStartMonth] = useState(currentMonth);
  const [monthsAhead, setMonthsAhead] = useState(12);

  const entityRules = useMemo(() => recurringRules.filter(r => r.entity === entity), [recurringRules, entity]);
  const availableCategories = useMemo(
    () => [...categoriesFor(entity, type), ...customCategories],
    [entity, type, customCategories]
  );

  const contextAccounts = useMemo(() => accounts.filter(a => a.entityType === entity), [accounts, entity]);
  const [accountId, setAccountId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    if (!description || isNaN(numAmount) || numAmount <= 0) return;

    onAddRule({
      id: generateRuleId(),
      description,
      amount: numAmount,
      type,
      category: category || availableCategories[0],
      entity,
      dayOfMonth: Math.min(Math.max(dayOfMonth, 1), 31),
      startMonth,
      monthsAhead,
      accountId: accountId || contextAccounts[0]?.id,
    });

    setDescription('');
    setAmount('');
  };

  const monthlyNet = useMemo(
    () => entityRules.reduce((acc, r) => r.type === 'inflow' ? acc + r.amount : acc - r.amount, 0),
    [entityRules]
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-surface p-6 rounded-3xl shadow-brand-sm border border-line">
        <h3 className="text-lg font-display font-extrabold text-ink flex items-center gap-2 uppercase tracking-tight">
          <ArrowsClockwise size={20} weight="bold" className="text-primary" /> Lançamentos Recorrentes
        </h3>
        <p className="text-sm text-muted mt-1 font-medium">
          Aluguel, assinaturas, pró-labore, parcelas de edital: cadastre o que se repete todo mês e a Projeção passa a enxergar o seu futuro.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-5">
          <div className="bg-surface rounded-3xl shadow-brand-md p-6 border-t-8 border-primary">
            <h4 className="font-display text-base font-extrabold text-ink uppercase tracking-tight mb-5">Nova Regra Mensal</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-subtle mb-1.5 uppercase tracking-widest">Descrição</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Aluguel do ateliê" className="w-full rounded-2xl border border-line px-4 py-3 text-sm bg-surface text-ink font-medium outline-none focus:ring-2 focus:ring-primary" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-subtle mb-1.5 uppercase tracking-widest">Valor (R$)</label>
                  <input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" className="w-full rounded-2xl border border-line px-4 py-3 text-sm bg-surface text-ink font-mono tabular-nums font-black outline-none focus:ring-2 focus:ring-primary" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-subtle mb-1.5 uppercase tracking-widest">Dia do mês</label>
                  <input type="number" min={1} max={31} value={dayOfMonth} onChange={e => setDayOfMonth(parseInt(e.target.value) || 1)} className="w-full rounded-2xl border border-line px-4 py-3 text-sm bg-surface text-ink font-mono tabular-nums font-black outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setType('inflow')} className={`py-3 text-xs font-black rounded-2xl border-2 transition-all ${type === 'inflow' ? 'bg-success-soft border-success text-success shadow-brand-sm' : 'bg-surface-2 border-transparent text-subtle opacity-60'}`}>ENTRADA</button>
                <button type="button" onClick={() => setType('outflow')} className={`py-3 text-xs font-black rounded-2xl border-2 transition-all ${type === 'outflow' ? 'bg-error-soft border-error text-error shadow-brand-sm' : 'bg-surface-2 border-transparent text-subtle opacity-60'}`}>SAÍDA</button>
              </div>

              <div>
                <label className="block text-[10px] font-black text-subtle mb-1.5 uppercase tracking-widest">Categoria</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-2xl border border-line px-4 py-3 text-sm bg-surface text-ink font-bold outline-none focus:ring-2 focus:ring-primary">
                  {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-subtle mb-1.5 uppercase tracking-widest">A partir de</label>
                  <input type="month" value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full rounded-2xl border border-line px-4 py-3 text-xs bg-surface text-ink font-bold outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-subtle mb-1.5 uppercase tracking-widest">Duração (meses)</label>
                  <select value={monthsAhead} onChange={e => setMonthsAhead(parseInt(e.target.value))} className="w-full rounded-2xl border border-line px-4 py-3 text-xs bg-surface text-ink font-bold outline-none focus:ring-2 focus:ring-primary">
                    {[3, 6, 12, 24, 36].map(n => <option key={n} value={n}>{n} meses</option>)}
                  </select>
                </div>
              </div>

              {contextAccounts.length > 0 && (
                <div>
                  <label className="block text-[10px] font-black text-subtle mb-1.5 uppercase tracking-widest">Conta</label>
                  <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full rounded-2xl border border-line px-4 py-3 text-xs bg-surface text-ink font-bold outline-none focus:ring-2 focus:ring-primary">
                    {contextAccounts.map(a => <option key={a.id} value={a.id}>{a.bank} - {a.name}</option>)}
                  </select>
                </div>
              )}

              <button type="submit" className="w-full py-4 rounded-2xl shadow-brand-md text-sm font-black text-primary-on uppercase tracking-widest bg-primary hover:bg-primary-hover transition-all flex items-center justify-center gap-2">
                <Plus size={18} weight="bold" /> Criar Recorrência
              </button>
            </form>
          </div>
        </div>

        {/* Lista */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface p-5 rounded-3xl shadow-brand-sm border border-line flex items-center justify-between">
            <p className="text-[10px] text-subtle font-black uppercase tracking-widest">Impacto mensal líquido das regras</p>
            <p className={`text-lg font-black font-mono tabular-nums ${monthlyNet >= 0 ? 'text-success' : 'text-error'}`}>{formatCurrency(monthlyNet)}</p>
          </div>

          {entityRules.length === 0 ? (
            <div className="bg-surface border border-dashed border-line rounded-3xl p-12 text-center text-subtle">
              <p className="text-sm font-black uppercase tracking-widest">Nenhuma recorrência cadastrada</p>
              <p className="text-xs font-medium mt-2">Sem regras, a projeção de caixa não enxerga seus compromissos futuros.</p>
            </div>
          ) : (
            <div className="bg-surface rounded-3xl shadow-brand-sm border border-line divide-y divide-line overflow-hidden">
              {entityRules.map(r => (
                <div key={r.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-sm font-black text-ink truncate block">{r.description}</span>
                    <p className="text-[10px] font-bold text-subtle uppercase mt-0.5">
                      Todo dia {r.dayOfMonth} · {r.category}
                      {r.startMonth ? ` · desde ${r.startMonth}` : ''}
                      {r.monthsAhead ? ` · por ${r.monthsAhead} meses` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`font-black text-sm font-mono tabular-nums ${r.type === 'inflow' ? 'text-success' : 'text-error'}`}>
                      {r.type === 'inflow' ? '+' : '-'} {formatCurrency(r.amount)}
                    </span>
                    <button onClick={() => onDeleteRule(r.id)} className="p-2 bg-error-soft rounded-lg text-error hover:bg-error hover:text-white transition-all" title="Excluir regra">
                      <Trash size={14} weight="bold" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecurringManager;
