'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import styles from './finance-charts.module.css';

type Transaction = { data: string; tipo: string; valor: number | string };
type ChartProps = { rows: Transaction[]; month: string };
type MonthPoint = { key: string; label: string; fullLabel: string; income: number; expense: number; balance: number; count: number };

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const shortMonth = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
const fullMonth = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });

function useMonthPoints(rows: Transaction[], month: string): MonthPoint[] {
  return useMemo(() => {
    const [year, monthNumber] = month.split('-').map(Number);
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(year, monthNumber - 6 + index, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const matching = rows.filter(row => String(row.data).slice(0, 7) === key);
      const income = matching.filter(row => row.tipo === 'receita').reduce((sum, row) => sum + Number(row.valor), 0);
      const expense = matching.filter(row => row.tipo === 'despesa').reduce((sum, row) => sum + Number(row.valor), 0);
      return { key, label: shortMonth.format(date).replace('.', ''), fullLabel: fullMonth.format(date), income, expense, balance: income - expense, count: matching.length };
    });
  }, [rows, month]);
}

function AccessibleData({ points, balance = false }: { points: MonthPoint[]; balance?: boolean }) {
  return <div className={styles.srOnly}><table>
    <caption>{balance ? 'Saldo mensal: receitas menos despesas' : 'Receitas e despesas por mês'}</caption>
    <thead><tr><th scope="col">Mês</th>{balance ? <th scope="col">Saldo</th> : <><th scope="col">Receitas</th><th scope="col">Despesas</th></>}</tr></thead>
    <tbody>{points.map(point => <tr key={point.key}><th scope="row">{point.fullLabel}</th>{balance ? <td>{money.format(point.balance)}</td> : <><td>{money.format(point.income)}</td><td>{money.format(point.expense)}</td></>}</tr>)}</tbody>
  </table></div>;
}

// Harmonic-mean tangents keep each segment inside its neighboring values.
function monotonePath(points: { x: number; y: number }[]) {
  const slopes = points.slice(1).map((point, index) => (point.y - points[index].y) / (point.x - points[index].x));
  const tangents = points.map((_, index) => {
    if (index === 0) return slopes[0];
    if (index === points.length - 1) return slopes[slopes.length - 1];
    const before = slopes[index - 1];
    const after = slopes[index];
    return before * after <= 0 ? 0 : 2 * before * after / (before + after);
  });

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const third = (point.x - previous.x) / 3;
    return `${path} C ${previous.x + third} ${previous.y + third * tangents[index - 1]}, ${point.x - third} ${point.y - third * tangents[index]}, ${point.x} ${point.y}`;
  }, '');
}

export function CashFlowChart({ rows, month }: ChartProps) {
  const points = useMonthPoints(rows, month);
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const chartRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(chartRef, { once: true, amount: .25 });
  const tooltipId = useId();
  const gradientId = useId().replace(/:/g, '');
  const maximum = Math.max(1, ...points.flatMap(point => [point.income, point.expense]));
  const step = 10 ** Math.floor(Math.log10(maximum)) / 2;
  const scale = Math.ceil(maximum * 1.12 / step) * step;
  const hasData = points.some(point => point.count > 0);
  const x = (index: number) => 50 + index * 100;
  const y = (value: number) => 230 * (1 - value / scale);
  const incomePath = monotonePath(points.map((point, index) => ({ x: x(index), y: y(point.income) })));
  const expensePath = monotonePath(points.map((point, index) => ({ x: x(index), y: y(point.expense) })));
  const activeIndex = points.findIndex(point => point.key === activeMonth);
  const visible = isInView || reducedMotion;

  return <div className={`${styles.chart} ${styles.cashFlowChart}`} ref={chartRef}>
    <div className={styles.legend} aria-hidden="true"><span><i className={styles.incomeLineKey} />Receitas</span><span><i className={styles.expenseLineKey} />Despesas</span><small>Valores em R$</small></div>
    <div className={styles.areaChart}>
      <div className={styles.axis} aria-hidden="true">{[1, .75, .5, .25, 0].map(ratio => <span key={ratio} style={{ top: `${(1 - ratio) * 100}%` }}>{compact.format(scale * ratio)}</span>)}</div>
      <div className={styles.cashPlot}>
        <svg viewBox="0 0 600 230" preserveAspectRatio="none" className={styles.lineSvg} aria-hidden="true">
          <defs><linearGradient id={`${gradientId}-income`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-income)" stopOpacity=".2" /><stop offset="100%" stopColor="var(--chart-income)" stopOpacity=".015" /></linearGradient></defs>
          {[0, .25, .5, .75, 1].map(ratio => <line key={ratio} x1="0" x2="600" y1={ratio * 230} y2={ratio * 230} className={styles.gridLine} />)}
          {hasData && <>
            <motion.path d={`${incomePath} L 550 230 L 50 230 Z`} fill={`url(#${gradientId}-income)`} initial={false} animate={{ opacity: visible ? 1 : 0 }} transition={{ duration: reducedMotion ? 0 : .45 }} />
            <motion.path d={incomePath} className={styles.incomeLine} initial={false} animate={{ pathLength: visible ? 1 : 0, opacity: visible ? 1 : 0 }} transition={{ duration: reducedMotion ? 0 : .5, ease: 'easeOut' }} />
            <motion.path d={expensePath} className={styles.expenseLine} initial={false} animate={{ opacity: visible ? 1 : 0 }} transition={{ duration: reducedMotion ? 0 : .45 }} />
            {activeIndex >= 0 && <>
              <line x1={x(activeIndex)} x2={x(activeIndex)} y1="0" y2="230" className={styles.activeGuide} />
              <circle cx={x(activeIndex)} cy={y(points[activeIndex].income)} r="4" className={styles.incomeDot} />
              <circle cx={x(activeIndex)} cy={y(points[activeIndex].expense)} r="4" className={styles.expenseDot} />
            </>}
          </>}
        </svg>
        <div className={styles.lineColumns}>
          {points.map((point, index) => {
            const selected = activeMonth === point.key;
            return <div className={`${styles.lineColumn} ${point.key === month ? styles.currentMonth : ''}`} key={point.key}>
              <button type="button" className={styles.monthButton} aria-label={`${point.fullLabel}: receitas ${money.format(point.income)}, despesas ${money.format(point.expense)}`} aria-describedby={selected ? `${tooltipId}-${index}` : undefined} onPointerEnter={event => { if (event.pointerType !== 'touch') setActiveMonth(point.key); }} onPointerLeave={event => { if (event.pointerType !== 'touch') setActiveMonth(null); }} onFocus={() => setActiveMonth(point.key)} onBlur={() => setActiveMonth(null)} onClick={() => setActiveMonth(point.key)} onKeyDown={event => { if (event.key === 'Escape') setActiveMonth(null); }}><span>{point.label}</span></button>
              {selected && <div id={`${tooltipId}-${index}`} role="tooltip" className={`${styles.tooltip} ${index < 2 ? styles.tooltipStart : index > 3 ? styles.tooltipEnd : ''}`}><strong>{point.fullLabel}</strong><span><i className={styles.incomeKey} />Receitas<b>{money.format(point.income)}</b></span><span><i className={styles.expenseKey} />Despesas<b>{money.format(point.expense)}</b></span></div>}
            </div>;
          })}
        </div>
        {!hasData && <div className={styles.empty}>O fluxo aparece com as primeiras movimentações.</div>}
      </div>
    </div>
    <p className={styles.hint}>Passe o cursor ou selecione um mês para ver os valores.</p>
    <AccessibleData points={points} />
  </div>;
}

export function BalanceTrendChart({ rows, month }: ChartProps) {
  const points = useMonthPoints(rows, month);
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const chartRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(chartRef, { once: true, amount: .25 });
  const tooltipId = useId();
  const clipId = useId().replace(/:/g, '');
  const hasData = points.some(point => point.count > 0);
  const minimum = Math.min(0, ...points.map(point => point.balance));
  const maximum = Math.max(0, ...points.map(point => point.balance));
  const spread = Math.max(1, maximum - minimum);
  const domainMax = maximum + spread * .16;
  const domainMin = minimum - spread * .16;
  const y = (value: number) => 160 * (domainMax - value) / (domainMax - domainMin);
  const x = (index: number) => 50 + index * 100;
  const zeroY = y(0);
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(point.balance)}`).join(' ');
  const ticks = [maximum, (maximum + minimum) / 2, minimum].filter((value, index, all) => all.indexOf(value) === index);

  return <div className={`${styles.chart} ${styles.balanceChart}`} ref={chartRef}>
    <div className={styles.legend} aria-hidden="true"><span><i className={styles.positiveKey} />Saldo positivo</span><span><i className={styles.negativeKey} />Saldo negativo</span><small>R$</small></div>
    <div className={styles.lineChart}>
      <div className={styles.axis} aria-hidden="true">{ticks.map(value => <span key={value} style={{ top: `${y(value) / 160 * 100}%` }}>{compact.format(value)}</span>)}</div>
      <div className={styles.linePlot}>
        <svg viewBox="0 0 600 160" preserveAspectRatio="none" className={styles.lineSvg} aria-hidden="true">
          <defs><clipPath id={`${clipId}-positive`}><rect width="600" height={zeroY} /></clipPath><clipPath id={`${clipId}-negative`}><rect y={zeroY} width="600" height={160 - zeroY} /></clipPath></defs>
          {ticks.map(value => <line key={value} x1="0" x2="600" y1={y(value)} y2={y(value)} className={styles.gridLine} />)}
          <line x1="0" x2="600" y1={zeroY} y2={zeroY} className={styles.zeroLine} />
          {hasData && <>
            <motion.path d={path} clipPath={`url(#${clipId}-positive)`} className={styles.positiveLine} initial={false} animate={{ d: path, pathLength: isInView || reducedMotion ? 1 : 0, opacity: isInView || reducedMotion ? 1 : 0 }} transition={{ duration: reducedMotion ? 0 : .4, ease: 'easeOut' }} />
            <motion.path d={path} clipPath={`url(#${clipId}-negative)`} className={styles.negativeLine} initial={false} animate={{ d: path, pathLength: isInView || reducedMotion ? 1 : 0, opacity: isInView || reducedMotion ? 1 : 0 }} transition={{ duration: reducedMotion ? 0 : .4, ease: 'easeOut' }} />
            {points.map((point, index) => <motion.circle key={point.key} cx={x(index)} className={point.balance < 0 ? styles.negativeDot : styles.positiveDot} initial={false} animate={{ cy: y(point.balance), r: activeMonth === point.key ? 5 : 3.5, opacity: isInView || reducedMotion ? 1 : 0 }} transition={{ duration: reducedMotion ? 0 : .24, ease: 'easeOut' }} />)}
          </>}
        </svg>
        <div className={styles.lineColumns}>{points.map((point, index) => {
          const selected = activeMonth === point.key;
          return <div key={point.key} className={`${styles.lineColumn} ${point.key === month ? styles.currentMonth : ''}`}>
            <button type="button" className={styles.monthButton} aria-label={`${point.fullLabel}: saldo ${money.format(point.balance)}`} aria-describedby={selected ? `${tooltipId}-${index}` : undefined} onPointerEnter={event => { if (event.pointerType !== 'touch') setActiveMonth(point.key); }} onPointerLeave={event => { if (event.pointerType !== 'touch') setActiveMonth(null); }} onFocus={() => setActiveMonth(point.key)} onBlur={() => setActiveMonth(null)} onClick={() => setActiveMonth(point.key)} onKeyDown={event => { if (event.key === 'Escape') setActiveMonth(null); }}><span>{point.label}</span></button>
            {selected && <div id={`${tooltipId}-${index}`} role="tooltip" className={`${styles.tooltip} ${styles.balanceTooltip} ${index < 2 ? styles.tooltipStart : index > 3 ? styles.tooltipEnd : ''}`}><strong>{point.fullLabel}</strong><span>Saldo<b>{money.format(point.balance)}</b></span><small>{point.count ? 'Receitas menos despesas' : 'Sem movimentações registradas'}</small></div>}
          </div>;
        })}</div>
        {!hasData && <div className={styles.empty}>Os saldos aparecem com as primeiras movimentações.</div>}
      </div>
    </div>
    <p className={styles.hint}>Saldo de cada mês, com base nos registros filtrados.</p>
    <AccessibleData points={points} balance />
  </div>;
}
