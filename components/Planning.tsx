import React, { useState } from 'react';
import { TrendUp, Target, ArrowsClockwise, Buildings, User } from '@phosphor-icons/react';
import { Transaction, RecurringRule, MonthlyBudget, BankAccount } from '../types';
import CashflowForecast from './CashflowForecast';
import BudgetPanel from './BudgetPanel';
import RecurringManager from './RecurringManager';

interface PlanningProps {
  transactions: Transaction[];
  recurringRules: RecurringRule[];
  budgets: MonthlyBudget[];
  accounts: BankAccount[];
  customCategories: string[];
  onConfirmPlanned: (planned: Transaction[]) => void;
  onAddRule: (rule: RecurringRule) => void;
  onDeleteRule: (id: string) => void;
  onUpsertBudgets: (budgets: MonthlyBudget[]) => void;
  onDeleteBudget: (id: string) => void;
}

type Tab = 'forecast' | 'budget' | 'recurring';

const Planning: React.FC<PlanningProps> = (props) => {
  const [tab, setTab] = useState<Tab>('forecast');
  const [entity, setEntity] = useState<'PF' | 'PJ'>('PJ');

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: 'forecast', label: 'Projeção', icon: <TrendUp size={16} weight="bold" /> },
    { id: 'budget', label: 'Orçamento', icon: <Target size={16} weight="bold" /> },
    { id: 'recurring', label: 'Recorrentes', icon: <ArrowsClockwise size={16} weight="bold" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up pb-12 px-2 sm:px-0">
      {/* Cabeçalho */}
      <div className="mb-8 border-l-8 border-primary bg-surface rounded-r-3xl shadow-brand-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-primary tracking-tight uppercase">Planejamento</h2>
          <p className="text-sm text-muted mt-1 font-bold tracking-widest opacity-60 uppercase">Fluxo de Caixa Preditivo</p>
        </div>

        {/* Seletor de entidade */}
        <div className="flex bg-surface-2 rounded-2xl p-1.5 border border-line shadow-inner">
          <button
            onClick={() => setEntity('PJ')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${entity === 'PJ' ? 'bg-primary text-primary-on shadow-brand-sm' : 'text-subtle'}`}
          >
            <Buildings size={16} weight="bold" /> Empresa
          </button>
          <button
            onClick={() => setEntity('PF')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${entity === 'PF' ? 'bg-success text-white shadow-brand-sm' : 'text-subtle'}`}
          >
            <User size={16} weight="bold" /> Pessoal
          </button>
        </div>
      </div>

      {/* Abas */}
      <div className="flex justify-center mb-8">
        <div className="bg-surface p-1.5 rounded-[2rem] shadow-brand-sm border border-line flex">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-6 sm:px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${tab === t.id ? 'bg-primary text-primary-on shadow-brand-md' : 'text-subtle hover:text-muted'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div key={`${tab}-${entity}`} className="animate-fade-in">
        {tab === 'forecast' && (
          <CashflowForecast
            transactions={props.transactions}
            recurringRules={props.recurringRules}
            entity={entity}
            onConfirmPlanned={props.onConfirmPlanned}
          />
        )}
        {tab === 'budget' && (
          <BudgetPanel
            transactions={props.transactions}
            budgets={props.budgets}
            entity={entity}
            customCategories={props.customCategories}
            onUpsertBudgets={props.onUpsertBudgets}
            onDeleteBudget={props.onDeleteBudget}
          />
        )}
        {tab === 'recurring' && (
          <RecurringManager
            recurringRules={props.recurringRules}
            accounts={props.accounts}
            entity={entity}
            customCategories={props.customCategories}
            onAddRule={props.onAddRule}
            onDeleteRule={props.onDeleteRule}
          />
        )}
      </div>
    </div>
  );
};

export default Planning;
