'use client';

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';

const easing = [0.2, 0, 0, 1] as const;
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatValue(value: number, format: 'currency' | 'percent') {
  if (format === 'currency') return currency.format(value);
  return `${value < 0 ? '−' : ''}${decimal.format(Math.abs(value))}%`;
}

/** The accessible value is always final; only the visual text interpolates. */
export function AnimatedNumber({ value, format = 'currency' }: { value: number | null; format?: 'currency' | 'percent' }) {
  const reducedMotion = useReducedMotion();
  const current = useMotionValue(0);
  const displayed = useTransform(current, number => formatValue(number, format));

  useEffect(() => {
    if (value === null) return;
    if (reducedMotion) { current.set(value); return; }
    const animation = animate(current, value, { duration: 0.42, ease: easing });
    return () => animation.stop();
  }, [value, current, reducedMotion]);

  if (value === null) return <>—</>;
  return <><span className="sr-only">{formatValue(value, format)}</span><motion.span aria-hidden="true">{displayed}</motion.span></>;
}

type PanelProps = { children?: ReactNode; className?: string; id?: string; 'aria-label'?: string; as?: 'section' | 'article'; delay?: number };

export function AnimatedPanel({ as = 'article', delay = 0, children, ...props }: PanelProps) {
  const reducedMotion = useReducedMotion();
  const Component = as === 'section' ? motion.section : motion.article;
  return <Component {...props}
    initial={reducedMotion ? false : { opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.08 }}
    transition={{ duration: reducedMotion ? 0 : 0.32, delay: reducedMotion ? 0 : delay, ease: easing }}
  >{children}</Component>;
}

export function AnimatedProgress({ value, color }: { value: number; color?: string }) {
  const reducedMotion = useReducedMotion();
  return <motion.span
    style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color, transformOrigin: 'left' }}
    initial={reducedMotion ? false : { scaleX: 0 }}
    whileInView={{ scaleX: 1 }}
    viewport={{ once: true }}
    transition={{ duration: reducedMotion ? 0 : 0.4, ease: easing }}
  />;
}

export function SavingsRing({ rate }: { rate: number | null }) {
  const reducedMotion = useReducedMotion();
  const progress = Math.min(100, Math.max(0, rate ?? 0));
  return <div className="savings-ring" role="img" aria-label={rate === null ? 'Taxa de economia indisponível' : `${formatValue(rate, 'percent')} de economia`}>
    <svg viewBox="0 0 104 104" aria-hidden="true">
      <circle className="savings-ring-track" cx="52" cy="52" r="44" />
      <motion.circle className={`savings-ring-progress ${rate !== null && rate < 0 ? 'is-negative' : ''}`} cx="52" cy="52" r="44" pathLength="100"
        strokeDasharray="100" initial={{ strokeDashoffset: 100 }}
        animate={{ strokeDashoffset: 100 - progress }}
        transition={{ duration: reducedMotion ? 0 : 0.45, ease: easing }} />
    </svg>
    <div aria-hidden="true"><strong>{rate === null ? '—' : formatValue(rate, 'percent')}</strong><span>economizado</span></div>
  </div>;
}
