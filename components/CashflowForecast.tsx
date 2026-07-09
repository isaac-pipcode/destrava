import React, { useMemo, useState, useEffect } from 'react';
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';
import { TrendUp, Warning, ShieldCheck, Gauge, Info, Sparkle, CheckCircle } from '@phosphor-icons/react';
import { Transaction, RecurringRule } from '../types';
import { projectRecurring, buildForecast, addMonths } from '../utils/projection';
import { getForecastAdvice } from '../services/geminiService';

interface CashflowForecastProps {
  transactions: Transaction[];
  recurringRules: RecurringRule[];
  entity: 'PF' | 'PJ';
  onConfirmPlanned: (planned: Transaction[]) => void;
}

const shortLabel = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return `${s}/${String(y).slice(2)}`;
};

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const CashflowForecast: React.FC<CashflowForecastProps> = ({ transactions, recurringRules, entity, onConfirmPlanned }) => {
  const [horizon, setHorizon] = useState(12);

  const todayISO = new Date().toISOString().slice(0, 10);
  const currentMonth = todayISO.slice(0, 7);

  const realized = useMemo(
    () => transactions.filter(t => (t.status ?? 'REALIZED') !== 'PLANNED' && t.entity === entity),
    [transactions, entity]
  );

  const planned = useMemo(
    () => projectRecurring(recurringRules, transactions, { entity, fromMonth: currentMonth, horizonMonths: horizon }),
    [recurringRules, transactions, entity, currentMonth, horizon]
  );

  const forecast = useMemo(
    () => buildForecast(realized, planned, currentMonth, horizon),
    [realized, planned, currentMonth, horizon]
  );

  const overdue = useMemo(
    () => planned.filter(p => p.date.slice(0, 10) <= todayISO),
    [planned, todayISO]
  );

  const upcoming = useMemo(
    () => planned.filter(p => p.date.slice(0, 10) > todayISO).slice(0, 8),
    [planned, todayISO]
  );

  const chartData = useMemo(() => forecast.points.map(p => ({
    label: shortLabel(p.month),
    month: p.month,
    realized: p.month <= currentMonth ? p.balance : null,
    projected: p.month >= currentMonth ? p.balance : null,
  })), [forecast.points, currentMonth]);

  // Conselho estratégico (IA com fallback local determinístico — nunca bloqueia)
  const [advice, setAdvice] = useState('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoadingAdvice(true);
    getForecastAdvice({
      entityLabel: entity === 'PJ' ? 'Empresa (PJ)' : 'Pessoal (PF)',
      currentBalance: forecast.currentBalance,
      runwayMonths: forecast.runwayMonths,
      firstNegMonth: forecast.firstNegMonth,
      lowest: forecast.lowest.value,
      horizon,
    })
      .then(txt => { if (!cancelled) setAdvice(txt); })
      .finally(() => { if (!cancelled) setLoadingAdvice(false); });
    return () => { cancelled = true; };
  }, [entity, forecast.currentBalance, forecast.runwayMonths, forecast.firstNegMonth, forecast.lowest.value, horizon]);

  const confirmOne = (p: Transaction) => {
    onConfirmPlanned([p]);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const p = payload.find((x: any) => x.value !== null) || payload[0];
    if (p.value === null || p.value === undefined) return null;
    const isFuture = p.payload.month > currentMonth;
    return (
      <div className="bg-surface border border-line p-3 rounded-xl shadow-brand-md">
        <p className="text-[10px] font-black mb-1 text-subtle uppercase tracking-widest">
          {p.payload.label} {isFuture && '· previsto'}
        </p>
        <p className={`text-sm font-black font-mono tabular-nums ${p.value < 0 ? 'text-error' : 'text-ink'}`}>
          Saldo: {formatCurrency(p.value)}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Cabeçalho + horizonte */}
      <div className="bg-surface p-6 rounded-3xl shadow-brand-sm border border-line flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-display font-extrabold text-ink flex items-center gap-2 uppercase tracking-tight">
            <TrendUp size={20} weight="bold" className="text-primary" /> Projeção de Caixa (Fôlego)
          </h3>
          <p className="text-sm text-muted mt-1 font-medium">
            Saldo realizado até hoje, projetado para frente pelos seus lançamentos recorrentes.
          </p>
        </div>
        <div className="flex bg-surface-2 rounded-xl p-1 border border-line">
          {[6, 12].map(h => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${horizon === h ? 'bg-surface text-ink shadow-brand-sm border border-line' : 'text-subtle'}`}
            >
              {h} meses
            </button>
          ))}
        </div>
      </div>

      {/* Métricas de runway */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-3xl shadow-brand-sm border border-line">
          <p className="text-[10px] text-subtle font-black uppercase mb-1 tracking-widest">Saldo Hoje</p>
          <p className={`text-xl font-black font-mono tabular-nums ${forecast.currentBalance >= 0 ? 'text-ink' : 'text-error'}`}>{formatCurrency(forecast.currentBalance)}</p>
        </div>
        <div className={`p-5 rounded-3xl shadow-brand-sm border ${forecast.runwayMonths === null ? 'bg-surface border-line' : 'bg-error-soft border-error/30'}`}>
          <p className="text-[10px] font-black uppercase mb-1 tracking-widest text-subtle flex items-center gap-1"><Gauge size={12} weight="bold" /> Fôlego de Caixa</p>
          <p className={`text-xl font-black font-mono tabular-nums ${forecast.runwayMonths === null ? 'text-primary' : 'text-error'}`}>
            {forecast.runwayMonths === null ? `${horizon}+ meses` : forecast.runwayMonths === 0 ? 'Negativo' : `${forecast.runwayMonths} ${forecast.runwayMonths === 1 ? 'mês' : 'meses'}`}
          </p>
        </div>
        <div className="bg-surface p-5 rounded-3xl shadow-brand-sm border border-line">
          <p className="text-[10px] text-subtle font-black uppercase mb-1 tracking-widest">Menor Saldo Projetado</p>
          <p className={`text-xl font-black font-mono tabular-nums ${forecast.lowest.value < 0 ? 'text-error' : 'text-ink'}`}>{formatCurrency(forecast.lowest.value)}</p>
          <p className="text-[10px] text-subtle font-bold uppercase mt-0.5">em {shortLabel(forecast.lowest.month)}</p>
        </div>
        <div className="p-5 rounded-3xl shadow-brand-md bg-primary text-primary-on border border-primary">
          <p className="text-[10px] font-black uppercase mb-1 tracking-widest opacity-70">Saldo em {shortLabel(addMonths(currentMonth, horizon))}</p>
          <p className="text-xl font-black font-mono tabular-nums">{formatCurrency(forecast.endBalance)}</p>
        </div>
      </div>

      {/* Conselho (IA opcional, fallback local) */}
      <div className="bg-primary rounded-3xl p-6 text-primary-on shadow-brand-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Sparkle size={110} weight="fill" /></div>
        <h3 className="text-sm font-black mb-2 flex items-center gap-2 uppercase tracking-widest">
          <Sparkle size={16} weight="fill" className="text-accent" /> Leitura do Mentor
        </h3>
        <p className="text-sm leading-relaxed max-w-3xl relative z-10 opacity-90">
          {loadingAdvice ? <span className="animate-pulse">Analisando a projeção do caixa...</span> : advice}
        </p>
      </div>

      {/* Gráfico */}
      <div className="bg-surface p-6 rounded-3xl shadow-brand-sm border border-line">
        <div className="flex flex-wrap gap-5 mb-5">
          <span className="text-xs font-bold text-muted flex items-center gap-2">
            <span className="inline-block w-6 h-[3px] rounded" style={{ background: 'var(--primary)' }}></span> Realizado
          </span>
          <span className="text-xs font-bold text-muted flex items-center gap-2">
            <span className="inline-block w-6 border-t-2 border-dashed" style={{ borderColor: 'var(--accent)' }}></span> Projetado
          </span>
          <span className="text-xs font-bold text-muted flex items-center gap-2">
            <span className="inline-block w-6 border-t-2 border-dashed" style={{ borderColor: 'var(--error)' }}></span> Zona de aperto (R$ 0)
          </span>
        </div>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="fcArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={44} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="var(--error)" strokeDasharray="4 4" strokeWidth={1.5} />
              <ReferenceLine x={shortLabel(currentMonth)} stroke="var(--text-subtle)" strokeDasharray="3 3" label={{ value: 'hoje', position: 'insideTopRight', fontSize: 10, fill: 'var(--text-subtle)' }} />
              <Area type="monotone" dataKey="realized" stroke="var(--primary)" strokeWidth={3} fill="url(#fcArea)" dot={{ r: 3, fill: 'var(--primary)' }} connectNulls={false} />
              <Line type="monotone" dataKey="projected" stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="7 6" dot={{ r: 3, fill: 'var(--surface)', stroke: 'var(--accent)', strokeWidth: 2 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertas / leitura */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {forecast.firstNegMonth ? (
          <div className="bg-error-soft border border-error/30 rounded-3xl p-5 flex items-start gap-3">
            <div className="p-2 bg-surface text-error rounded-xl shrink-0"><Warning size={18} weight="bold" /></div>
            <div>
              <h4 className="font-black text-error text-sm uppercase tracking-tight">Aperto de caixa em {shortLabel(forecast.firstNegMonth)}</h4>
              <p className="text-sm text-muted mt-1 font-medium">
                No ritmo atual de recorrentes, o saldo projetado cruza o zero em <span className="font-black">{shortLabel(forecast.firstNegMonth)}</span>.
                Antecipe cachês e recebíveis ou reduza saídas até lá para preservar o fôlego.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-success-soft border border-success/30 rounded-3xl p-5 flex items-start gap-3">
            <div className="p-2 bg-surface text-success rounded-xl shrink-0"><ShieldCheck size={18} weight="bold" /></div>
            <div>
              <h4 className="font-black text-success text-sm uppercase tracking-tight">Caixa saudável no horizonte</h4>
              <p className="text-sm text-muted mt-1 font-medium">
                O saldo projetado permanece positivo durante todos os {horizon} meses analisados.
              </p>
            </div>
          </div>
        )}

        {!forecast.hasRecurring && (
          <div className="bg-surface border border-dashed border-line rounded-3xl p-5 flex items-start gap-3">
            <div className="p-2 bg-surface-2 text-subtle rounded-xl shrink-0"><Info size={18} weight="bold" /></div>
            <div>
              <h4 className="font-black text-ink text-sm uppercase tracking-tight">Projeção ainda sem recorrentes</h4>
              <p className="text-sm text-muted mt-1 font-medium">
                A curva à frente repete o saldo atual. Cadastre entradas e saídas recorrentes na aba <span className="font-black">Recorrentes</span> (ou marque "Repetir todo mês" ao lançar no Diário) para projetar o futuro.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Previstos: vencidos + próximos */}
      {(overdue.length > 0 || upcoming.length > 0) && (
        <div className="bg-surface rounded-3xl shadow-brand-sm border border-line overflow-hidden">
          <div className="px-6 py-4 border-b border-line flex flex-wrap justify-between items-center gap-3 bg-surface-2">
            <h3 className="text-sm font-black text-ink uppercase tracking-widest">Lançamentos Previstos</h3>
            {overdue.length > 0 && (
              <button
                onClick={() => onConfirmPlanned(overdue)}
                className="px-4 py-2 bg-warning text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-brand-sm hover:opacity-90 transition-all flex items-center gap-2"
              >
                <CheckCircle size={14} weight="bold" /> Lançar vencidos ({overdue.length})
              </button>
            )}
          </div>
          <div className="divide-y divide-line">
            {[...overdue, ...upcoming].map(p => {
              const isOverdue = p.date.slice(0, 10) <= todayISO;
              return (
                <div key={p.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-ink truncate">{p.description}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isOverdue ? 'bg-warning-soft text-warning' : 'bg-surface-2 text-subtle'}`}>
                        {isOverdue ? 'Vencido' : 'Previsto'}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-subtle uppercase mt-0.5">
                      {new Date(p.date).toLocaleDateString('pt-BR')} · {p.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`font-black text-sm font-mono tabular-nums ${p.type === 'inflow' ? 'text-success' : 'text-error'}`}>
                      {p.type === 'inflow' ? '+' : '-'} {formatCurrency(p.amount)}
                    </span>
                    <button
                      onClick={() => confirmOne(p)}
                      className="px-3 py-1.5 bg-primary-soft text-primary rounded-lg text-[10px] font-black uppercase hover:bg-primary hover:text-primary-on transition-all"
                      title="Confirmar como realizado"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CashflowForecast;
