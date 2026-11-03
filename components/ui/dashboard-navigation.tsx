'use client';

import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LayoutDashboard, ReceiptText, Repeat2, Sparkles, Target, Upload, Wallet, RefreshCw } from 'lucide-react';
import styles from './dashboard-navigation.module.css';

const sections = [
  { id: 'visao-geral', label: 'Visão geral', mobile: 'Resumo', icon: LayoutDashboard },
  { id: 'movimentacoes', label: 'Movimentações', mobile: 'Extrato', icon: ReceiptText },
  { id: 'orcamentos', label: 'Orçamentos', mobile: 'Limites', icon: Target },
  { id: 'metas', label: 'Metas de economia', mobile: 'Metas', icon: Sparkles },
  { id: 'recorrencias', label: 'Recorrências', mobile: 'Mensais', icon: Repeat2 },
  { id: 'contas', label: 'Contas e cartões', mobile: 'Contas', icon: Wallet },
  { id: 'automacoes', label: 'Automações', mobile: 'Rotinas', icon: RefreshCw },
] as const;
type SectionId = typeof sections[number]['id'];

export function DashboardNavigation({ onImport }: { onImport: () => void }) {
  const [active, setActive] = useState<SectionId>('visao-geral');
  const activeRef = useRef<SectionId>('visao-geral');
  const scrollLockUntil = useRef(0);
  const reducedMotion = useReducedMotion();
  const layoutId = useId();

  function select(id: SectionId) {
    // Keep the chosen destination selected while native smooth scrolling passes other sections.
    scrollLockUntil.current = performance.now() + (reducedMotion ? 60 : 800);
    activeRef.current = id;
    setActive(id);
  }

  useEffect(() => {
    let frame = 0;
    let lockTimer = 0;

    function syncFromScroll() {
      frame = 0;
      if (performance.now() < scrollLockUntil.current) return;
      const threshold = Math.min(150, window.innerHeight * .22);
      const reached = sections
        .filter(section => section.id !== 'visao-geral')
        .map(section => ({ id: section.id, top: document.getElementById(section.id)?.getBoundingClientRect().top ?? Infinity }))
        .filter(section => section.top <= threshold)
        .sort((left, right) => right.top - left.top);

      let next: SectionId = 'visao-geral';
      if (reached.length) {
        // Budgets and goals share a row on desktop. Keep the selected sibling stable.
        const sameRow = reached.filter(section => Math.abs(section.top - reached[0].top) < 8);
        next = sameRow.find(section => section.id === activeRef.current)?.id ?? sameRow[0].id;
      }
      if (next !== activeRef.current) {
        activeRef.current = next;
        setActive(next);
      }
    }

    function scheduleSync() {
      if (!frame) frame = window.requestAnimationFrame(syncFromScroll);
    }

    function syncFromHash() {
      const hash = window.location.hash.slice(1);
      const section = sections.find(item => item.id === hash);
      if (!section) { scheduleSync(); return; }
      scrollLockUntil.current = performance.now() + (reducedMotion ? 60 : 800);
      activeRef.current = section.id;
      setActive(section.id);
      window.clearTimeout(lockTimer);
      lockTimer = window.setTimeout(scheduleSync, reducedMotion ? 80 : 820);
    }

    syncFromHash();
    window.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', scheduleSync);
    window.addEventListener('hashchange', syncFromHash);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(lockTimer);
      window.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('resize', scheduleSync);
      window.removeEventListener('hashchange', syncFromHash);
    };
  }, [reducedMotion]);

  function link(section: typeof sections[number]) {
    const selected = active === section.id;
    const Icon = section.icon;
    return <a key={section.id} className={`side-link ${styles.link} ${section.id === 'contas' || section.id === 'automacoes' ? styles.desktopOnly : ''} ${selected ? styles.selected : ''}`} href={`#${section.id}`} title={section.label} aria-current={selected ? 'location' : undefined}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) select(section.id); }}>
      {selected && <motion.span className={styles.activePill} layoutId={`${layoutId}-active`} aria-hidden="true" transition={{ duration: reducedMotion ? 0 : .24, ease: [.2, 0, 0, 1] }} />}
      <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
      <span className="nav-label">{section.label}</span><span className="nav-label-mobile">{section.mobile}</span>
    </a>;
  }

  return <nav className={`side-nav ${styles.nav}`} aria-label="Navegação principal">
    {link(sections[0])}
    {link(sections[1])}
    <button type="button" className={`side-link ${styles.link}`} title="Importar CSV" onClick={onImport}><Upload size={19} strokeWidth={1.7} aria-hidden="true" /><span className="nav-label">Importar CSV</span><span className="nav-label-mobile">Importar</span></button>
    <div className="side-label side-label-spaced">PLANEJAMENTO</div>
    {sections.slice(2).map(link)}
  </nav>;
}
