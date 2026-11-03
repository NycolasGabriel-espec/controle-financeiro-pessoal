'use client';

import { useCallback, useEffect, useMemo, useState, useRef, useId } from 'react';
import { supabase } from '../lib/supabase';
import { expenseCategories, incomeCategories, suggestCategory } from '../lib/categories';
import { SpaceLogin } from '@/components/ui/space-login';
import { AnimatedNumber, AnimatedPanel, AnimatedProgress } from '@/components/ui/dashboard-motion';
import { CashFlowChart, BalanceTrendChart } from '@/components/ui/finance-charts';
import { DashboardNavigation } from '@/components/ui/dashboard-navigation';
import { AccountsPanel } from '@/components/ui/accounts-panel';
import { AutomationPanel } from '@/components/ui/automation-panel';
import './dashboard-enhancements.css';
import dashboardStyles from './dashboard.module.css';
import { Bell, PanelLeft, Search } from 'lucide-react';
import { buildInstallments, parseImportCsv, goalPlan, monthlySummary, equivalentComparison, localToday, suggestRuleCategory, budgetStatuses } from '../lib/finance.mjs';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const dateName = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });

const categoryColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)'];

const demoBudgets = [
  { id: 'demo-budget-home', mes: '2026-10-01', categoria: 'Moradia', limite: 2200 },
  { id: 'demo-budget-food', mes: '2026-10-01', categoria: 'Alimentação', limite: 900 },
  { id: 'demo-budget-health', mes: '2026-10-01', categoria: 'Saúde', limite: 250 },
];

const demoGoals = [
  { id: 'demo-goal-reserve', nome: 'Reserva de emergência', valor_alvo: 10000, valor_atual: 2800, data_limite: '2027-06-30' },
  { id: 'demo-goal-trip', nome: 'Viagem de férias', valor_alvo: 4500, valor_atual: 1750, data_limite: '2027-01-15' },
];

const demoRecurring = [
  { id: 'demo-recurring-rent', descricao: 'Aluguel', valor: 1700, categoria: 'Moradia', dia_vencimento: 5, ativo: true },
  { id: 'demo-recurring-internet', descricao: 'Internet residencial', valor: 120, categoria: 'Moradia', dia_vencimento: 18, ativo: true },
  { id: 'demo-recurring-streaming', descricao: 'Streaming', valor: 39.9, categoria: 'Assinaturas', dia_vencimento: 22, ativo: false },
];

const demoTransactions = [
  { data: '2026-07-02', descricao: 'Salário mensal', valor: 5000, tipo: 'receita', categoria: 'Salário' },
  { data: '2026-07-04', descricao: 'Aluguel', valor: 1700, tipo: 'despesa', categoria: 'Moradia' },
  { data: '2026-07-08', descricao: 'Supermercado', valor: 760, tipo: 'despesa', categoria: 'Alimentação' },
  { data: '2026-07-12', descricao: 'Transporte público', valor: 260, tipo: 'despesa', categoria: 'Transporte' },
  { data: '2026-07-20', descricao: 'Contas da casa', valor: 410, tipo: 'despesa', categoria: 'Moradia' },
  { data: '2026-07-25', descricao: 'Lazer e cultura', valor: 470, tipo: 'despesa', categoria: 'Lazer' },
  { data: '2026-08-02', descricao: 'Salário mensal', valor: 5000, tipo: 'receita', categoria: 'Salário' },
  { data: '2026-08-04', descricao: 'Aluguel', valor: 1700, tipo: 'despesa', categoria: 'Moradia' },
  { data: '2026-08-08', descricao: 'Supermercado', valor: 810, tipo: 'despesa', categoria: 'Alimentação' },
  { data: '2026-08-12', descricao: 'Transporte público', valor: 280, tipo: 'despesa', categoria: 'Transporte' },
  { data: '2026-08-20', descricao: 'Contas da casa', valor: 430, tipo: 'despesa', categoria: 'Moradia' },
  { data: '2026-08-25', descricao: 'Lazer e cultura', valor: 540, tipo: 'despesa', categoria: 'Lazer' },
  { data: '2026-08-27', descricao: 'Farmácia', valor: 120, tipo: 'despesa', categoria: 'Saúde' },
  { data: '2026-09-02', descricao: 'Salário mensal', valor: 5200, tipo: 'receita', categoria: 'Salário' },
  { data: '2026-09-14', descricao: 'Projeto freelancer', valor: 400, tipo: 'receita', categoria: 'Freelance' },
  { data: '2026-09-04', descricao: 'Aluguel', valor: 1700, tipo: 'despesa', categoria: 'Moradia' },
  { data: '2026-09-08', descricao: 'Supermercado', valor: 720, tipo: 'despesa', categoria: 'Alimentação' },
  { data: '2026-09-12', descricao: 'Transporte público', valor: 290, tipo: 'despesa', categoria: 'Transporte' },
  { data: '2026-09-20', descricao: 'Contas da casa', valor: 420, tipo: 'despesa', categoria: 'Moradia' },
  { data: '2026-09-25', descricao: 'Restaurantes e lazer', valor: 510, tipo: 'despesa', categoria: 'Lazer' },
  { data: '2026-09-27', descricao: 'Saúde e bem-estar', valor: 135, tipo: 'despesa', categoria: 'Saúde' },
  { data: '2026-10-02', descricao: 'Salário mensal', valor: 5200, tipo: 'receita', categoria: 'Salário' },
  { data: '2026-10-17', descricao: 'Projeto freelancer', valor: 800, tipo: 'receita', categoria: 'Freelance' },
  { data: '2026-10-03', descricao: 'Aluguel', valor: 1700, tipo: 'despesa', categoria: 'Moradia' },
  { data: '2026-10-05', descricao: 'Supermercado', valor: 640, tipo: 'despesa', categoria: 'Alimentação' },
  { data: '2026-10-06', descricao: 'Conta de energia', valor: 180, tipo: 'despesa', categoria: 'Moradia' },
  { data: '2026-10-10', descricao: 'Transporte público', valor: 280, tipo: 'despesa', categoria: 'Transporte' },
  { data: '2026-10-13', descricao: 'Restaurantes', valor: 210, tipo: 'despesa', categoria: 'Alimentação' },
  { data: '2026-10-18', descricao: 'Internet residencial', valor: 120, tipo: 'despesa', categoria: 'Moradia' },
  { data: '2026-10-21', descricao: 'Farmácia', valor: 95, tipo: 'despesa', categoria: 'Saúde' },
  { data: '2026-10-23', descricao: 'Academia', valor: 89, tipo: 'despesa', categoria: 'Saúde' },
  { data: '2026-10-26', descricao: 'Assinaturas', valor: 49.9, tipo: 'despesa', categoria: 'Assinaturas' },
  { data: '2026-10-28', descricao: 'Cinema', valor: 65, tipo: 'despesa', categoria: 'Lazer' },
];

function todayMonth() { return localToday().slice(0, 7); }
function todayDate() { return localToday(); }
function isRealized(row) { return row.status !== 'pendente'; }
function effectiveDate(row) { return isRealized(row) ? row.data_pagamento || row.data : row.data; }

function previousMonthOf(value) {
  const [year, month] = value.split('-').map(Number);
  const previous = new Date(year, month - 2, 1);
  return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}`;
}

function nextMonthOf(value) {
  const [year, month] = value.split('-').map(Number);
  const next = new Date(year, month, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(value) {
  return monthName.format(new Date(`${value}-01T12:00:00`));
}

function percent(value) {
  const sign = value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

function monthStart(value) {
  return `${value}-01`;
}

function dateForMonthDay(month, day) {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return `${month}-${String(Math.min(Number(day), lastDay)).padStart(2, '0')}`;
}

function Icon({ name, size = 19, strokeWidth = 1.8 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const shapes = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    receipt: <><path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
    upload: <><path d="M12 16V4m-4 4 4-4 4 4" /><path d="M5 14v5h14v-5" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.8M12 17.4h.01" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    down: <path d="m7 10 5 5 5-5" />,
    arrowUp: <><path d="M7 17 17 7M7 7h10v10" /></>,
    arrowDown: <><path d="M7 7 17 17M7 17h10V7" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" /></>,
    filter: <><path d="M4 6h16M7 12h10m-7 6h4" /></>,
    download: <><path d="M12 4v11m-4-4 4 4 4-4" /><path d="M5 18v2h14v-2" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    sparkle: <><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3z" /><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16z" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    pencil: <><path d="m4 16.5-.8 4.3 4.3-.8L19.8 7.7a2.3 2.3 0 0 0-3.2-3.2z" /><path d="m14.8 6.5 2.7 2.7" /></>,
    trash: <><path d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
    wallet: <><path d="M20 8V5a2 2 0 0 0-2-2H6a3 3 0 0 0 0 6h14v11H6a3 3 0 0 1-3-3V6" /><path d="M20 12h-5v5h5M17 14.5h.01" /></>,
  };
  return <svg {...common}>{shapes[name] || shapes.grid}</svg>;
}

function AuthScreen({ onDemo }) {
  async function submit({ email, password, mode }) {
    if (!supabase) {
      throw new Error('A conexão com o Supabase ainda não está configurada.');
    }
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) {
      throw new Error(result.error.message === 'Invalid login credentials' ? 'E-mail ou senha não conferem.' : result.error.message);
    }
    if (mode === 'signup' && !result.data.session) {
      return { message: 'Conta criada. Confirme seu e-mail e depois entre para acessar seus dados.' };
    }
  }

  return <SpaceLogin brand={<Brand />} onSubmit={submit} onDemo={onDemo} />;
}

function Brand() {
  return <div className="brand"><span className="brand-mark"><span /><span /><span /></span><span>Gestão Finance<span className="brand-dot">.</span></span></div>;
}

function Modal({ title, onClose, children, wide = false }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.querySelector('button, input, select, [tabindex="0"]')?.focus();
    function handleKey(event) {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab') return;
      const controls = [...(dialog?.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') || [])].filter(element => element.offsetParent !== null);
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    dialog?.addEventListener('keydown', handleKey);
    return () => { dialog?.removeEventListener('keydown', handleKey); previous?.focus?.(); };
  }, []);
  return (
    <div className="modal-scrim" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`modal-card ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef}>
        <div className="modal-head"><div><div className="eyebrow">CONTROLE FINANCEIRO</div><h2 id={titleId}>{title}</h2></div><button className="icon-button" aria-label="Fechar" onClick={onClose}><Icon name="close" /></button></div>
        {children}
      </section>
    </div>
  );
}


function exportCsv(rows) {
  const escape = value => `"${String(value).replaceAll('"', '""')}"`;
  const lines = [['data', 'descricao', 'valor', 'tipo', 'categoria', 'status', 'data_pagamento'], ...rows.map(row => [row.data, row.descricao, Number(row.valor).toFixed(2), row.tipo, row.categoria, row.status || 'realizado', row.data_pagamento || ''])];
  const blob = new Blob([`\uFEFF${lines.map(line => line.map(escape).join(',')).join('\r\n')}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `movimentacoes-${todayMonth()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rows, setRows] = useState([]);
  const [budgetRows, setBudgetRows] = useState([]);
  const [goalRows, setGoalRows] = useState([]);
  const [recurringRows, setRecurringRows] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [categoryRules, setCategoryRules] = useState([]);
  const [importProfiles, setImportProfiles] = useState([]);
  const [extensionError, setExtensionError] = useState('');
  const [ledgerPage, setLedgerPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortOrder, setSortOrder] = useState('data-desc');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [movementStatus, setMovementStatus] = useState('realizado');
  const [movementCard, setMovementCard] = useState('');
  const [csvText, setCsvText] = useState('');
  const [csvMapping, setCsvMapping] = useState({});
  const [selectedProfile, setSelectedProfile] = useState('');
  const [profileName, setProfileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(todayMonth());
  const [kindFilter, setKindFilter] = useState('todos');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState('');
  const [editing, setEditing] = useState(null);
  const [planningEditing, setPlanningEditing] = useState(null);
  const [categoryValue, setCategoryValue] = useState('');
  const [categoryManual, setCategoryManual] = useState(false);
  const [movementType, setMovementType] = useState('despesa');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [importData, setImportData] = useState(null);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [dbError, setDbError] = useState('');
  const loadVersion = useRef(0);
  const movementCategories = movementType === 'receita' ? incomeCategories : expenseCategories;
  const suggestedCategory = suggestRuleCategory(descriptionValue, movementType, categoryRules) || suggestCategory(descriptionValue, movementType);
  const today = todayDate();
  const automaticCategory = suggestRuleCategory(descriptionValue, movementType, categoryRules);
  const autoCategoryRef = useRef('');
  useEffect(() => {
    if (editing || categoryManual) return;
    if (automaticCategory) { setCategoryValue(automaticCategory); autoCategoryRef.current = automaticCategory; }
    else if (autoCategoryRef.current) { setCategoryValue(''); autoCategoryRef.current = ''; }
  }, [automaticCategory, categoryManual, editing]);

  const loadRows = useCallback(async ({ silent = false } = {}) => {
    if (!supabase) { setLoading(false); return; }
    const version = ++loadVersion.current;
    if (!silent) setLoading(true);
    async function loadAllRecords(table, order = 'id') {
      const pageSize = 1000;
      const all = [];
      let offset = 0;
      while (true) {
        const query = supabase.from(table)
          .select('*', { count: 'exact' })
          .order(order, { ascending: false });
        if (order !== 'id') query.order('id');
        const page = await query.range(offset, offset + pageSize - 1);
        if (page.error) return { data: null, error: page.error };
        all.push(...(page.data || []));
        if (!page.data?.length || page.data.length < pageSize || offset + page.data.length >= (page.count || 0)) break;
        offset += pageSize;
      }
      return { data: all, error: null };
    }
    const [transactions, budgets, goals, recurring] = await Promise.all([
      loadAllRecords('transactions', 'data'),
      loadAllRecords('budgets', 'mes'),
      loadAllRecords('savings_goals', 'created_at'),
      loadAllRecords('recurring_expenses', 'dia_vencimento'),
    ]);
    const extras = await Promise.all(['accounts', 'cards', 'transfers', 'category_rules', 'import_profiles'].map(table => loadAllRecords(table)));
    if (version !== loadVersion.current) return;
    [setAccounts, setCards, setTransfers, setCategoryRules, setImportProfiles].forEach((setter, index) => setter(extras[index].error ? [] : extras[index].data || []));
    setExtensionError(extras.some(result => result.error) ? 'Alguns recursos de contas, cartões ou regras ainda não puderam ser carregados. Confira a conexão e se a atualização do banco foi aplicada.' : '');
    const error = transactions.error || budgets.error || goals.error || recurring.error;
    if (error) setDbError('Não foi possível carregar todos os dados. Confira a conexão e as políticas de acesso.');
    else {
      setRows(transactions.data || []);
      setBudgetRows(budgets.data || []);
      setGoalRows(goals.data || []);
      setRecurringRows(recurring.data || []);
      setDbError('');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return undefined; }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      if (data.session?.user) loadRows(); else setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) loadRows();
      else { ++loadVersion.current; setRows([]); setBudgetRows([]); setGoalRows([]); setRecurringRows([]); setAccounts([]); setCards([]); setTransfers([]); setCategoryRules([]); setImportProfiles([]); setLoading(false); }
    });
    return () => listener.subscription.unsubscribe();
  }, [loadRows]);

  useEffect(() => {
    if (!user || previewMode) return undefined;
    const refresh = () => { if (document.visibilityState === 'visible') loadRows({ silent: true }); };
    const timer = window.setInterval(refresh, 5 * 60 * 1000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [user, previewMode, loadRows]);

  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(''), 3600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const matchingRows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return rows.filter(row => {
      const matchesType = kindFilter === 'todos' || row.tipo === kindFilter;
      const matchesCategory = categoryFilter === 'todas' || row.categoria === categoryFilter;
      const matchesSearch = !term || `${row.descricao} ${row.categoria}`.toLocaleLowerCase('pt-BR').includes(term);
      return matchesType && matchesCategory && matchesSearch;
    });
  }, [rows, kindFilter, categoryFilter, search]);
  const filteredSummary = useMemo(() => monthlySummary(matchingRows, month, today), [matchingRows, month, today]);
  const currentRows = filteredSummary.realizedRows;
  const ledgerRows = useMemo(() => matchingRows.filter(row => String(effectiveDate(row)).slice(0, 7) === month && (statusFilter === 'todos' || (statusFilter === 'realizado' ? isRealized(row) : !isRealized(row)))), [matchingRows, month, statusFilter]);
  const pendingRows = rows.filter(row => !isRealized(row) && String(row.data).slice(0, 7) === month).sort((a, b) => a.data.localeCompare(b.data));
  const comparisonDay = month === todayMonth() ? Number(today.slice(-2)) : null;
  const comparison = equivalentComparison(matchingRows, month, today);
  const monthSummary = monthlySummary(rows, month, today);
  const previousMonth = previousMonthOf(month);
  const previousRows = comparison.previousRows;
  const { income, expense, balance } = filteredSummary;
  const previousExpense = comparison.previousExpense;
  const expenseChange = comparison.change;
  const economyRate = income ? (balance / income) * 100 : null;
  const committedRate = income ? (expense / income) * 100 : null;
  const monthIsPartial = month === todayMonth();
  const monthIsFuture = month > todayMonth();
  const periodMessage = monthIsPartial
    ? `Mês em andamento até ${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', timeZone: 'America/Maceio' }).format(new Date())}`
    : monthIsFuture ? 'Período futuro; os valores ainda podem mudar' : 'Mês encerrado, com base nos registros lançados';

  useEffect(() => { setLedgerPage(1); }, [month, kindFilter, categoryFilter, search, sortOrder, statusFilter, pageSize]);
  const visibleRows = useMemo(() => ledgerRows.slice().sort((a, b) => { const [field, order] = sortOrder.split('-'); const difference = field === 'valor' ? Number(a.valor) - Number(b.valor) : String(effectiveDate(a)).localeCompare(String(effectiveDate(b))); return (order === 'asc' ? difference : -difference) || String(a.id).localeCompare(String(b.id)); }), [ledgerRows, sortOrder]);
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const safePage = Math.min(ledgerPage, totalPages);
  const pagedRows = visibleRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const realizedChartRows = matchingRows.filter(row => isRealized(row) && effectiveDate(row) <= today).map(row => ({ ...row, data: effectiveDate(row) }));
  const forecastBalance = monthSummary.expectedBalance;

  const categoryRows = useMemo(() => {
    const totals = new Map();
    currentRows.filter(row => row.tipo === 'despesa').forEach(row => totals.set(row.categoria, (totals.get(row.categoria) || 0) + Number(row.valor)));
    return [...totals.entries()].map(([name, value], index) => ({ name, value, share: expense ? value / expense * 100 : 0, color: categoryColors[index % categoryColors.length] })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [currentRows, expense]);

  const budgetProgress = budgetStatuses(budgetRows, rows, month);
  const budgetAlerts = budgetProgress.filter(item => item.percentage >= 80);
  const largestExpense = currentRows.filter(row => row.tipo === 'despesa').sort((a, b) => Number(b.valor) - Number(a.valor))[0];
  const expenseChangeUnavailable = previousRows.length === 0
    ? 'Sem registros nos filtros selecionados no mês anterior'
    : 'Sem despesas nos filtros selecionados no mês anterior';
  const insights = [];
  if (categoryRows[0] && expense > 0) insights.push({ label: 'Categoria principal', text: `${categoryRows[0].name} concentra ${percent(categoryRows[0].share)} das despesas do período.` });
  if (income > 0) insights.push({ label: 'Renda comprometida', text: `${percent(committedRate)} da renda foi usada em despesas; a taxa de economia foi ${percent(economyRate)}.` });
  if (largestExpense) insights.push({ label: 'Maior saída', text: `${largestExpense.descricao} foi o maior lançamento de despesa, em ${money.format(Number(largestExpense.valor))}.` });
  if (previousExpense > 0) insights.push({ label: 'Variação mensal', text: `As despesas estão ${percent(Math.abs(expenseChange))} ${expenseChange > 0 ? 'acima' : 'abaixo'} de ${monthLabel(previousMonth)}${monthIsPartial ? `, considerando dias 1 a ${comparisonDay} em ambos os meses` : ''}.` });
  const exceededBudget = budgetProgress.find(budget => budget.percentage > 100);
  if (exceededBudget) insights.push({ label: 'Orçamento', text: `${exceededBudget.categoria} ultrapassou o limite mensal em ${money.format(exceededBudget.spent - Number(exceededBudget.limite))}.` });

  function openMovementEditor(record = null) {
    setEditing(record);
    setMovementType(record?.tipo || 'despesa');
    setDescriptionValue(record?.descricao || '');
    setCategoryValue(record?.categoria || '');
    setCategoryManual(Boolean(record));
    autoCategoryRef.current = '';
    setMovementStatus(record?.status || 'realizado');
    setMovementCard(record?.cartao_id || '');
    setModal('movement');
  }

  function closeMovementEditor() {
    setModal('');
    setEditing(null);
    setMovementType('despesa');
    setDescriptionValue('');
    setCategoryValue('');
    setCategoryManual(false);
  }

  function changeMovementType(type) {
    setMovementType(type);
    setCategoryManual(false);
    setMovementCard('');
    const options = type === 'receita' ? incomeCategories : expenseCategories;
    if (!options.includes(categoryValue)) setCategoryValue('');
  }

  async function saveMovement(event) {
    event.preventDefault();
    if (previewMode) return;
    const form = new FormData(event.currentTarget);
    const record = {
      data: form.get('data'),
      descricao: String(form.get('descricao') || '').trim(),
      valor: Number(form.get('valor')),
      tipo: form.get('tipo'),
      categoria: String(form.get('categoria') || '').trim(),
      status: form.get('status') || 'realizado',
      data_pagamento: form.get('status') === 'realizado' ? form.get('data_pagamento') || form.get('data') : null,
      conta_id: form.get('conta_id') || null,
      cartao_id: form.get('cartao_id') || null,
      meta_id: form.get('tipo') === 'despesa' ? form.get('meta_id') || null : null,
    };
    if (record.status === 'realizado' && record.data_pagamento > todayDate()) { setToast('Um pagamento confirmado precisa ter uma data até hoje. Use Pendente para compromissos futuros.'); return; }
    setBusy(true);
    const installmentCount = Math.max(1, Number(form.get('parcelas') || 1));
    let records;
    if (!editing && record.cartao_id) { record.status = 'pendente'; record.data_pagamento = null; record.conta_id = null; }
    try { records = installmentCount > 1 ? buildInstallments({ ...record, status: 'pendente', data_pagamento: null, grupo_parcelamento: crypto.randomUUID() }, installmentCount) : [record]; }
    catch (error) { setBusy(false); setToast(error.message); return; }
    const query = editing
      ? supabase.from('transactions').update(record).eq('id', editing.id)
      : supabase.from('transactions').insert(records);
    const { error, data: saved } = await query.select('id');
    setBusy(false);
    if (error || !saved?.length) { setToast('Não foi possível salvar. Confira os campos e tente novamente.'); return; }
    if (form.get('save_rule') && record.descricao && record.categoria) {
      const term = String(form.get('rule_term') || record.descricao).trim().toLocaleLowerCase('pt-BR');
      const { error: ruleError } = await supabase.from('category_rules').upsert({ termo: term, tipo: record.tipo, categoria: record.categoria }, { onConflict: 'user_id,termo,tipo' });
      if (ruleError) setToast('Movimentação salva, mas não foi possível guardar a regra de categoria.');
      else setToast('Movimentação e regra de categoria salvas.');
    } else setToast(editing ? 'Movimentação atualizada.' : 'Movimentação adicionada.');
    closeMovementEditor();
    await loadRows();
  }

  function openPlanningEditor(mode, record = null) {
    if (previewMode) { setToast('Crie uma conta para salvar itens de planejamento.'); return; }
    setPlanningEditing(record);
    setModal(mode);
  }

  async function saveBudget(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record = { mes: monthStart(month), categoria: String(form.get('categoria') || '').trim(), limite: Number(form.get('limite')) };
    setBusy(true);
    const query = planningEditing
      ? supabase.from('budgets').update(record).eq('id', planningEditing.id)
      : supabase.from('budgets').upsert(record, { onConflict: 'user_id,mes,categoria' });
    const { error } = await query;
    setBusy(false);
    if (error) { setToast('Não foi possível salvar o limite. Confira os dados e tente novamente.'); return; }
    setModal(''); setPlanningEditing(null); setToast('Orçamento salvo.');
    await loadRows();
  }

  async function deleteBudget(id) {
    if (!window.confirm('Excluir este limite mensal?')) return;
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) { setToast('Não foi possível excluir o orçamento.'); return; }
    setToast('Orçamento excluído.');
    await loadRows();
  }

  async function saveGoal(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record = {
      nome: String(form.get('nome') || '').trim(),
      valor_alvo: Number(form.get('valor_alvo')),
      valor_atual: Number(form.get('valor_atual') || 0),
      data_limite: form.get('data_limite') || null,
    };
    setBusy(true);
    const query = planningEditing
      ? supabase.from('savings_goals').update(record).eq('id', planningEditing.id)
      : supabase.from('savings_goals').insert(record);
    const { error } = await query;
    setBusy(false);
    if (error) { setToast('Não foi possível salvar a meta. Confira os valores e tente novamente.'); return; }
    setModal(''); setPlanningEditing(null); setToast('Meta de economia salva.');
    await loadRows();
  }

  async function deleteGoal(id) {
    if (!window.confirm('Excluir esta meta de economia?')) return;
    const { error } = await supabase.from('savings_goals').delete().eq('id', id);
    if (error) { setToast('Não foi possível excluir a meta.'); return; }
    setToast('Meta excluída.');
    await loadRows();
  }

  async function saveRecurring(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record = {
      descricao: String(form.get('descricao') || '').trim(),
      valor: Number(form.get('valor')),
      categoria: String(form.get('categoria') || '').trim(),
      dia_vencimento: Number(form.get('dia_vencimento')),
      ativo: planningEditing ? planningEditing.ativo : true,
    };
    setBusy(true);
    const query = planningEditing
      ? supabase.from('recurring_expenses').update(record).eq('id', planningEditing.id)
      : supabase.from('recurring_expenses').insert(record);
    const { error } = await query;
    setBusy(false);
    if (error) { setToast('Não foi possível salvar a despesa recorrente. Confira os dados.'); return; }
    setModal(''); setPlanningEditing(null); setToast('Despesa recorrente salva.');
    await loadRows();
  }

  async function toggleRecurring(record) {
    const { error } = await supabase.from('recurring_expenses').update({ ativo: !record.ativo }).eq('id', record.id);
    if (error) { setToast('Não foi possível atualizar a recorrência.'); return; }
    setToast(record.ativo ? 'Recorrência pausada.' : 'Recorrência ativada.');
    await loadRows();
  }

  async function launchRecurring(record) {
    const data = dateForMonthDay(month, record.dia_vencimento);
    if (rows.some(row => row.recorrencia_id === record.id && String(row.data).slice(0, 7) === month)) {
      setToast('Esta despesa recorrente já foi lançada neste mês.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('transactions').insert({
      data,
      descricao: record.descricao,
      valor: Number(record.valor),
      tipo: 'despesa',
      categoria: record.categoria,
      recorrencia_id: record.id,
      status: 'pendente',
    });
    setBusy(false);
    if (error) { setToast('Não foi possível lançar a despesa. Ela pode já ter sido registrada neste mês.'); return; }
    setToast(`${record.descricao} lançada em ${monthLabel(month)}.`);
    await loadRows();
  }

  async function deleteMovement(id) {
    if (!window.confirm('Excluir esta movimentação?')) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) { setToast('Não foi possível excluir a movimentação.'); return; }
    setToast('Movimentação excluída.');
    await loadRows();
  }

  function prepareImport(text, mapping = {}) {
    const parsed = parseImportCsv(text, { existingRows: rows, mapping, rules: categoryRules });
    setCsvText(text); setCsvMapping(parsed.mapping || mapping); setImportData(parsed);
  }

  async function saveImportProfile() {
    if (!profileName.trim() || !importData?.headers?.length) return;
    setBusy(true);
    const { error } = await supabase.from('import_profiles').upsert({ nome: profileName.trim(), mapping: csvMapping }, { onConflict: 'user_id,nome' });
    setBusy(false);
    if (error) { setToast('Não foi possível salvar o formato de importação.'); return; }
    setToast('Formato salvo para as próximas importações.'); setProfileName(''); await loadRows();
  }

  async function deleteCategoryRule(id) {
    const { error } = await supabase.from('category_rules').delete().eq('id', id);
    if (error) { setToast('Não foi possível remover a regra.'); return; }
    setToast('Regra removida.'); await loadRows();
  }

  async function importCsv() {
    const selected = (importData?.items || []).filter(item => item.selected && item.record).map(item => item.record);
    if (!selected.length) return;
    setBusy(true);
    const { error } = await supabase.from('transactions').insert(selected);
    setBusy(false);
    if (error) { setToast('A importação não foi concluída. Tente novamente.'); return; }
    const count = selected.length;
    setCsvText(''); setCsvMapping({});
    setModal(''); setImportData(null); setToast(`${count} movimentações importadas.`);
    await loadRows();
  }

  async function loadDemo() {
    setBusy(true);
    const { error } = await supabase.from('transactions').insert(demoTransactions);
    setBusy(false);
    if (error) { setToast('Não foi possível carregar a demonstração.'); return; }
    setMonth('2026-10'); setToast('Amostra fictícia carregada na sua conta.');
    await loadRows();
  }

  async function signOut() {
    if (previewMode) { setPreviewMode(false); setRows([]); setBudgetRows([]); setGoalRows([]); setRecurringRows([]); setAccounts([]); setCards([]); setTransfers([]); setCategoryRules([]); setImportProfiles([]); return; }
    await supabase.auth.signOut();
    setRows([]); setBudgetRows([]); setGoalRows([]); setRecurringRows([]); setAccounts([]); setCards([]); setTransfers([]); setCategoryRules([]); setImportProfiles([]);
  }

  if (!user && !previewMode) {
    return <>
      {!supabase && <div className="setup-banner"><strong>Configuração pendente:</strong> adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ao ambiente da aplicação.</div>}
      <AuthScreen onDemo={() => { setRows([...demoTransactions.map((row, index) => ({ ...row, id: `preview-${index}`, conta_id: 'demo-bank' })), { id: 'demo-pending-1', data: '2026-10-30', descricao: 'Freelance a receber', valor: 450, tipo: 'receita', categoria: 'Freelance', status: 'pendente' }, { id: 'demo-pending-2', data: '2026-10-31', descricao: 'Fatura do cartão', valor: 320, tipo: 'despesa', categoria: 'Compras e vestuário', status: 'pendente', cartao_id: 'demo-card' }]); setBudgetRows(demoBudgets); setGoalRows(demoGoals); setRecurringRows(demoRecurring); setAccounts([{ id: 'demo-bank', nome: 'Conta principal', tipo: 'banco', saldo_inicial: 1200, data_saldo_inicial: '2026-07-01' }]); setCards([{ id: 'demo-card', nome: 'Cartão pessoal', limite: 4000, dia_fechamento: 25, dia_vencimento: 5 }]); setMonth('2026-10'); setPreviewMode(true); }} />
    </>;
  }

  const hasActiveFilters = kindFilter !== 'todos' || categoryFilter !== 'todas' || search.trim() !== '' || statusFilter !== 'todos';
  function clearFilters() { setKindFilter('todos'); setCategoryFilter('todas'); setSearch(''); setStatusFilter('todos'); }
  const recentActivity = ledgerRows.slice().sort((left, right) => String(effectiveDate(right)).localeCompare(String(effectiveDate(left))) || String(right.id).localeCompare(String(left.id))).slice(0, 5);
  const initials = previewMode ? 'D' : (user?.email || 'U').slice(0, 1).toUpperCase();
  function requireAccount(action) {
    if (previewMode) setToast(`Crie uma conta para ${action} suas movimentações.`);
    else setModal('import');
  }

  return (
    <div className={`app-frame ${dashboardStyles.dashboard} ${sidebarCollapsed ? dashboardStyles.collapsed : ''}`}>
      <aside className="sidebar" id="dashboard-sidebar" aria-label="Menu do painel">
        <Brand />
        <div className="side-label">MENU PRINCIPAL</div>
        <DashboardNavigation onImport={() => requireAccount('importar')} />
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon"><Icon name="help" size={17} /></div><strong>Um passo de cada vez</strong><p>Pequenas escolhas também constroem grandes planos.</p><a href="#movimentacoes">Ver movimentações <Icon name="chevron" size={14} /></a></div>
          <div className="user-row"><div className="avatar">{initials}</div><div className="user-info"><strong>{previewMode ? 'Demonstração' : user.email?.split('@')[0] || 'Minha conta'}</strong><span>{previewMode ? 'Acesso somente leitura' : 'Conta pessoal'}</span></div><button className="icon-button logout-button" aria-label={previewMode ? 'Sair da demonstração' : 'Sair da conta'} title={previewMode ? 'Sair da demonstração' : 'Sair da conta'} onClick={signOut}><Icon name="logout" size={17} /></button></div>
        </div>
      </aside>

      <main className="main-content" id="visao-geral">
        <header className="topbar">
          <div className="topbar-leading">
            <button type="button" className="icon-button sidebar-toggle" aria-label={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'} aria-expanded={!sidebarCollapsed} aria-controls="dashboard-sidebar" onClick={() => setSidebarCollapsed(value => !value)}><PanelLeft size={19} strokeWidth={1.7} aria-hidden="true" /></button>
            <span className="topbar-divider" aria-hidden="true" />
            <div className="breadcrumb"><span>Meu espaço</span><Icon name="chevron" size={13} /><strong>Visão geral</strong></div>
          </div>
          <div className="topbar-actions">
            <span className={`privacy-chip ${previewMode ? 'preview-chip' : ''}`}><Icon name="lock" size={12} />{previewMode ? 'Demonstração' : 'Dados privados'}</span>
            <a className="icon-button" href="#movimentacoes" aria-label="Buscar nas movimentações" onClick={() => window.requestAnimationFrame(() => document.getElementById('transaction-search')?.focus({ preventScroll: true }))}><Search size={18} strokeWidth={1.7} aria-hidden="true" /></a>
            <a className="icon-button notifications-button" href="#vencimentos" aria-label={`${pendingRows.length} compromissos pendentes. Ver vencimentos`}><Bell size={18} strokeWidth={1.7} aria-hidden="true" />{pendingRows.length > 0 && <span className="notification-dot" />}</a>
            <span className="avatar top-avatar" title={previewMode ? 'Demonstração fictícia' : user.email}>{initials}</span>
            <button type="button" className="icon-button mobile-signout" aria-label={previewMode ? 'Sair da demonstração' : 'Sair da conta'} onClick={signOut}><Icon name="logout" size={17} /></button>
          </div>
        </header>

        <div className="content-wrap">
          <div className="page-heading">
            <div><div className="eyebrow">PAINEL FINANCEIRO</div><h1>Visão geral</h1><p>Acompanhe o que entra, o que sai e o que fica.</p></div>
            <div className="heading-actions"><div className="month-control" role="group" aria-label="Navegação mensal"><button type="button" className="month-nav-button" aria-label={`Ir para ${monthLabel(previousMonthOf(month))}`} title="Mês anterior" onClick={() => setMonth(previousMonthOf(month))}><Icon name="chevronLeft" size={17} /></button><label className="month-select"><span className="sr-only">Mês selecionado</span><input type="month" value={month} onChange={event => { if (event.target.value) setMonth(event.target.value); }} aria-label="Selecionar mês" /></label><button type="button" className="month-nav-button" aria-label={`Ir para ${monthLabel(nextMonthOf(month))}`} title="Próximo mês" onClick={() => setMonth(nextMonthOf(month))}><Icon name="chevron" size={17} /></button></div>{previewMode ? <button className="button button-primary" onClick={() => { setPreviewMode(false); setRows([]); setBudgetRows([]); setGoalRows([]); setRecurringRows([]); setAccounts([]); setCards([]); setTransfers([]); setCategoryRules([]); setImportProfiles([]); }}><Icon name="plus" size={17} />Criar conta para salvar</button> : <><button className="button button-outline" onClick={() => setModal('import')}><Icon name="upload" size={17} />Importar CSV</button><button className="button button-primary" onClick={() => openMovementEditor()}><Icon name="plus" size={17} />Nova movimentação</button></>}</div>
          </div>

          {!supabase && <div className="notice warning-notice">A conexão com o banco não está configurada.</div>}
          {dbError && <div className="notice error-notice">{dbError}</div>}
          {extensionError && !previewMode && <div className="notice warning-notice">{extensionError}</div>}
          <div className={`demo-notice ${previewMode ? 'preview-notice' : ''}`}><span className="demo-badge">{previewMode ? 'AMOSTRA' : 'PRIVADO'}</span><span>{previewMode ? 'Dados fictícios para explorar a dashboard; nenhuma movimentação será salva.' : 'Seus registros ficam visíveis apenas na sua conta. Use a amostra fictícia para explorar a dashboard.'}</span>{!previewMode && <button onClick={loadDemo} disabled={busy || rows.length > 0}>{busy ? 'Carregando…' : rows.length ? 'Amostra já carregada' : 'Carregar amostra'}</button>}</div>

          {hasActiveFilters && <div className="active-filters" role="status"><Icon name="filter" size={14} /><span>Visão filtrada{kindFilter !== 'todos' && ` · ${kindFilter === 'receita' ? 'Receitas' : 'Despesas'}`}{categoryFilter !== 'todas' && ` · ${categoryFilter}`}{search.trim() && ` · “${search.trim()}”`}</span><button onClick={clearFilters}>Limpar filtros <Icon name="close" size={13} /></button></div>}

          <section className="metric-grid" aria-label="Indicadores financeiros">
            <MetricCard title="Saldo do período" value={balance} valueTone={balance < 0 ? 'negative' : ''} note="Recebimentos menos pagamentos confirmados" icon="wallet" tone="dark" highlighted loading={loading} />
            <MetricCard title="Receitas" value={income} note={`Em ${monthLabel(month)}`} icon="arrowUp" tone="green" delay={0.04} loading={loading} />
            <MetricCard title="Despesas" value={expense} note={expenseChange === null ? `Variação indisponível: ${expenseChangeUnavailable}` : `${percent(Math.abs(expenseChange))} ${expenseChange > 0 ? 'acima' : 'abaixo'} de ${monthLabel(previousMonth)}${monthIsPartial ? ` · dias 1 a ${comparisonDay}` : ''}`} icon="arrowDown" tone="amber" trend={expenseChange} delay={0.08} loading={loading} />
            <MetricCard title="Taxa de economia" value={economyRate} format="percent" valueTone={economyRate < 0 ? 'negative' : ''} note={economyRate === null ? 'Indisponível: sem receitas no período' : 'Do que entrou, ficou com você'} icon="target" tone="green" delay={0.12} loading={loading} />
          </section>
          <div className="overview-context">
            <p className={`period-note ${monthIsPartial || monthIsFuture ? 'period-note-warning' : ''}`}><span className="period-indicator" aria-hidden="true" />{periodMessage}{monthIsPartial && ' · Comparações até hoje.'}</p>
            <span className="committed-summary" title="Percentual das receitas usado em despesas realizadas">Renda comprometida <strong className={committedRate > 100 ? 'negative-value' : ''}>{loading ? '…' : committedRate === null ? '—' : percent(committedRate)}</strong></span>
          </div>

            <AnimatedPanel as="section" className="panel flow-panel overview-flow-panel">
              <div className="panel-heading"><div><h2>Fluxo financeiro</h2><p>Acompanhe suas receitas e despesas nos últimos seis meses.</p></div><span className="panel-period"><span className="live-dot" />Últimos 6 meses</span></div>
              <CashFlowChart rows={realizedChartRows} month={month} />
            </AnimatedPanel>

          <section className="insights-grid overview-details" aria-label="Categorias e atividade recente">
            <AnimatedPanel className="panel category-panel">
              <div className="panel-heading"><div><h2>Despesas por categoria</h2><p>{monthLabel(month)}</p></div><button className="icon-button category-reset" aria-label="Limpar filtro de categoria" title="Limpar filtro de categoria" disabled={categoryFilter === 'todas'} onClick={() => setCategoryFilter('todas')}><Icon name="filter" size={16} /></button></div>
              {categoryRows.length ? <div className="category-list">{categoryRows.map(category => <button className="category-item" key={category.name} onClick={() => setCategoryFilter(category.name)} aria-pressed={categoryFilter === category.name} title={`Filtrar por ${category.name}`}><span className="category-line"><span className="category-name"><i style={{ background: category.color }} />{category.name}</span><span className="category-value">{money.format(category.value)} <small>{percent(category.share)}</small></span></span><span className="category-track"><AnimatedProgress value={category.share} color={category.color} /></span></button>)}</div> : <div className="empty-chart">As categorias aparecem depois das primeiras despesas.</div>}
              <div className="category-total"><span>Total de despesas</span><strong>{money.format(expense)}</strong></div>
            </AnimatedPanel>
            <AnimatedPanel className="panel activity-panel">
              <div className="panel-heading"><div><h2>Atividade recente</h2><p>Seus últimos registros no período</p></div><a className="text-action activity-view-all" href="#movimentacoes">Ver extrato <Icon name="chevron" size={14} /></a></div>
              {recentActivity.length ? <ol className="activity-list">{recentActivity.map(row => <li className="activity-entry" key={row.id}>
                <span className={`transaction-symbol ${row.tipo}`}><Icon name={row.tipo === 'receita' ? 'arrowDown' : 'arrowUp'} size={16} /></span>
                <div className="activity-description"><strong>{row.descricao}</strong><span>{row.categoria} <span aria-hidden="true">·</span> {dateName.format(new Date(`${effectiveDate(row)}T12:00:00`))}</span></div>
                <div className="activity-amount"><strong className={row.tipo === 'receita' ? 'positive-value' : ''}>{row.tipo === 'receita' ? '+' : '−'} {money.format(Number(row.valor))}</strong><span>{isRealized(row) ? row.tipo === 'receita' ? 'Recebido' : 'Pago' : 'Pendente'}</span></div>
              </li>)}</ol> : <div className="planning-empty">Suas movimentações mais recentes aparecerão aqui.</div>}
              <div className="activity-footer"><span>{ledgerRows.length} registros no período</span><a href="#movimentacoes" className="text-action">Ver todas as movimentações <Icon name="arrowUp" size={13} /></a></div>
            </AnimatedPanel>
          </section>

          <section className="outlook-grid" aria-label="Previsão e vencimentos">
            <AnimatedPanel className="panel outlook-panel">
              <div className="panel-heading"><div><div className="eyebrow">COMPROMISSOS DO MÊS</div><h2>Previsão de fechamento</h2><p>{monthLabel(month)} · todos os registros</p></div><span className="status-badge pending">Estimativa</span></div>
              <strong className={`forecast-amount ${forecastBalance < 0 ? 'negative-value' : ''}`}>{money.format(forecastBalance)}</strong>
              <dl className="forecast-breakdown"><div><dt>Resultado já realizado</dt><dd>{money.format(monthSummary.balance)}</dd></div><div><dt>Recebimentos pendentes</dt><dd>+ {money.format(monthSummary.pendingIncome)}</dd></div><div><dt>Pagamentos pendentes</dt><dd>− {money.format(monthSummary.pendingExpense)}</dd></div></dl>
              <p className="outlook-note">Resultado realizado + receitas pendentes − despesas pendentes com vencimento no mês. Não inclui gastos ainda não registrados nem o saldo inicial das contas.</p>
            </AnimatedPanel>
            <AnimatedPanel className="panel due-panel" id="vencimentos">
              <div className="panel-heading"><div><div className="eyebrow">A PAGAR E RECEBER</div><h2>Próximos vencimentos</h2><p>{pendingRows.length} compromissos em {monthLabel(month)}</p></div><span className="panel-period">{pendingRows.filter(row => row.data < today).length} ATRASADOS</span></div>
              {pendingRows.length ? <div className="due-list">{pendingRows.slice(0, 5).map(row => <div className="due-item" key={row.id}><div><strong>{row.descricao}</strong><span><span className={`status-badge ${row.data < today ? 'overdue' : 'pending'}`}>{row.data < today ? 'Atrasado' : row.tipo === 'receita' ? 'A receber' : 'A pagar'}</span> {dateName.format(new Date(`${row.data}T12:00:00`))}</span></div><div className="due-value"><strong className={row.tipo === 'receita' ? 'positive-value' : ''}>{money.format(Number(row.valor))}</strong>{!previewMode && <button className="text-action" onClick={() => { openMovementEditor(row); setMovementStatus('realizado'); }}>Confirmar {row.tipo === 'receita' ? 'recebimento' : 'pagamento'}</button>}</div></div>)}</div> : <div className="planning-empty">Nenhum vencimento pendente neste mês. Cadastre uma movimentação com status “Pendente”.</div>}
              {pendingRows.length > 5 && <button className="text-action" onClick={() => { setStatusFilter('pendente'); document.getElementById('movimentacoes')?.scrollIntoView({ behavior: 'smooth' }); }}>Ver os {pendingRows.length} compromissos no extrato</button>}
            </AnimatedPanel>
          </section>
          {budgetAlerts.length > 0 && <section className="budget-alerts" aria-label="Alertas de orçamento">{budgetAlerts.map(item => <div className={`budget-alert ${item.percentage >= 100 ? 'budget-alert-exceeded' : ''}`} key={item.id}><Icon name="receipt" size={18} /><span><strong>{item.categoria}: {percent(item.percentage)} do limite</strong><span>{item.percentage >= 100 ? `Limite atingido${item.spent > Number(item.limite) ? ` · ${money.format(item.spent - Number(item.limite))} acima` : ''}` : `${money.format(Number(item.limite) - item.spent)} disponíveis neste mês`}</span></span></div>)}</section>}

          <AnimatedPanel as="section" className="panel balance-panel">
            <div className="panel-heading"><div><div className="eyebrow">SALDO MENSAL</div><h2>Evolução do saldo</h2><p>Receitas menos despesas, mês a mês</p></div><span className="panel-period">6 MESES</span></div>
            <BalanceTrendChart rows={realizedChartRows} month={month} />
          </AnimatedPanel>

          <section className="planning-grid" aria-label="Planejamento financeiro">
            <AnimatedPanel className="panel planning-panel" id="orcamentos">
              <div className="panel-heading"><div><div className="eyebrow">LIMITE DE GASTOS</div><h2>Orçamentos</h2><p>{monthLabel(month)} · todas as despesas realizadas</p></div><button className="button button-outline compact-button" onClick={() => openPlanningEditor('budget')}>Definir limite</button></div>
              {budgetProgress.length ? <div className="planning-list">{budgetProgress.map(item => <div className="planning-item" key={item.id}>
                <div className="planning-item-head"><span>{item.categoria}</span><strong>{money.format(item.spent)} <small>de {money.format(Number(item.limite))}</small></strong></div>
                <div className={`planning-track ${item.percentage > 100 ? 'over-limit' : ''}`}><AnimatedProgress value={item.percentage} /></div>
                <div className="planning-item-foot"><span>{percent(item.percentage)} utilizado</span><span>{item.percentage > 100 ? `Excedido em ${money.format(item.spent - Number(item.limite))}` : `${money.format(Number(item.limite) - item.spent)} restantes`}</span></div>
                {!previewMode && <div className="planning-item-actions"><button className="text-action" onClick={() => openPlanningEditor('budget', item)}>Editar</button><button className="text-action destructive-text" onClick={() => deleteBudget(item.id)}>Excluir</button></div>}
              </div>)}</div> : <div className="planning-empty">Defina limites mensais por categoria para acompanhar seus gastos.</div>}
            </AnimatedPanel>

            <AnimatedPanel className="panel planning-panel" id="metas">
              <div className="panel-heading"><div><div className="eyebrow">OBJETIVOS DE LONGO PRAZO</div><h2>Metas de economia</h2><p>Saldo inicial + aportes confirmados vinculados</p></div><button className="button button-outline compact-button" onClick={() => openPlanningEditor('goal')}>Nova meta</button></div>
              {goalRows.length ? <div className="planning-list">{goalRows.map(goal => {
                const plan = goalPlan(goal, rows, today);
                const goalPercent = Number(goal.valor_alvo) ? plan.current / Number(goal.valor_alvo) * 100 : 0;
                return <div className="planning-item" key={goal.id}>
                  <div className="planning-item-head"><span>{goal.nome}</span><strong>{money.format(plan.current)} <small>de {money.format(Number(goal.valor_alvo))}</small></strong></div>
                  <div className="planning-track goal-track"><AnimatedProgress value={goalPercent} /></div>
                  <div className="planning-item-foot"><span>{percent(goalPercent)} alcançado</span><span>{goal.data_limite ? `Prazo: ${dateName.format(new Date(`${goal.data_limite}T12:00:00`))} ${goal.data_limite.slice(0, 4)}` : 'Sem prazo definido'}</span></div>
                  <p className={`goal-plan-note ${plan.overdue ? 'negative-value' : ''}`}>{plan.completed ? 'Meta alcançada.' : plan.overdue ? `Prazo encerrado · faltam ${money.format(plan.remaining)}` : plan.monthlyAmount != null ? `Planeje ${money.format(plan.monthlyAmount)}/mês · faltam ${money.format(plan.remaining)}` : `Faltam ${money.format(plan.remaining)} · defina um prazo para calcular os aportes`}</p>
                  {!previewMode && <div className="planning-item-actions"><button className="text-action" onClick={() => openPlanningEditor('goal', goal)}>Atualizar progresso</button><button className="text-action destructive-text" onClick={() => deleteGoal(goal.id)}>Excluir</button></div>}
                </div>;
              })}</div> : <div className="planning-empty">Crie uma meta e vincule pagamentos de aportes para acompanhar o progresso.</div>}
            </AnimatedPanel>

            <AnimatedPanel className="panel planning-panel recurring-panel" id="recorrencias">
              <div className="panel-heading"><div><div className="eyebrow">DESPESAS PROGRAMADAS</div><h2>Recorrências mensais</h2><p>Registre despesas recorrentes no mês selecionado</p></div><button className="button button-outline compact-button" onClick={() => openPlanningEditor('recurring')}>Nova recorrência</button></div>
              {recurringRows.length ? <div className="recurring-list">{recurringRows.map(item => {
                const recurringDate = dateForMonthDay(month, item.dia_vencimento);
                const alreadyLaunched = rows.some(row => row.recorrencia_id === item.id && String(row.data).slice(0, 7) === month);
                return <div className={`recurring-item ${item.ativo ? '' : 'recurring-paused'}`} key={item.id}>
                <div className="recurring-detail"><strong>{item.descricao}</strong><span>{item.categoria} · vence dia {item.dia_vencimento}</span></div>
                <strong className="recurring-value">{money.format(Number(item.valor))}</strong>
                <div className="recurring-actions"><button className="button button-outline compact-button" onClick={() => launchRecurring(item)} disabled={!item.ativo || alreadyLaunched || busy || previewMode}>{previewMode ? 'Somente leitura' : alreadyLaunched ? 'Já lançada neste mês' : 'Lançar no mês'}</button>{!previewMode && <><button className="text-action" onClick={() => openPlanningEditor('recurring', item)}>Editar</button><button className="text-action" onClick={() => toggleRecurring(item)}>{item.ativo ? 'Pausar' : 'Ativar'}</button></>}</div>
              </div>})}</div> : <div className="planning-empty">Cadastre despesas mensais para lançá-las com a data de vencimento.</div>}
            </AnimatedPanel>
          </section>

          <AccountsPanel accounts={accounts} cards={cards} transfers={transfers} rows={rows} month={month} previewMode={previewMode} onRefresh={loadRows} onNotify={setToast} />
          <AutomationPanel rows={rows} month={month} previewMode={previewMode} onRefresh={loadRows} onNotify={setToast} />

          <AnimatedPanel as="section" className="panel transactions-panel" id="movimentacoes">
            <div className="panel-heading transaction-heading"><div><div className="eyebrow">ACOMPANHAMENTO DE PERTO</div><h2>Movimentações</h2><p>{ledgerRows.length} {ledgerRows.length === 1 ? 'registro' : 'registros'} em {monthLabel(month)}</p></div><div className="table-actions"><button className="button button-outline export-button" onClick={() => exportCsv(visibleRows)} disabled={!visibleRows.length}><Icon name="download" size={16} />Exportar CSV</button></div></div>
            <div className="table-toolbar"><label className="search-field"><Icon name="search" size={17} /><input id="transaction-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar movimentação" aria-label="Buscar movimentação" /></label><label className="filter-select"><Icon name="filter" size={16} /><select value={kindFilter} onChange={event => setKindFilter(event.target.value)} aria-label="Filtrar tipo"><option value="todos">Todos os tipos</option><option value="receita">Receitas</option><option value="despesa">Despesas</option></select></label><label className="filter-select"><select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} aria-label="Filtrar status"><option value="todos">Todos os status</option><option value="realizado">Pagos e recebidos</option><option value="pendente">Pendentes</option></select></label><label className="filter-select"><select value={sortOrder} onChange={event => setSortOrder(event.target.value)} aria-label="Ordenar movimentações"><option value="data-desc">Data: mais recentes</option><option value="data-asc">Data: mais antigas</option><option value="valor-desc">Valor: maior primeiro</option><option value="valor-asc">Valor: menor primeiro</option></select></label><label className="filter-select category-filter"><select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} aria-label="Filtrar categoria"><option value="todas">Todas as categorias</option>{[...new Set(rows.map(row => row.categoria))].sort().map(category => <option key={category}>{category}</option>)}</select></label></div>
            <div className="table-scroll"><table><thead><tr><th>DESCRIÇÃO</th><th>DATA</th><th>CATEGORIA</th><th>STATUS</th><th className="amount-head">VALOR</th><th aria-label="Ações" /></tr></thead><tbody>
              {pagedRows.map(row => <tr key={row.id}><td><div className="transaction-name"><span className={`transaction-symbol ${row.tipo}`}><Icon name={row.tipo === 'receita' ? 'arrowDown' : 'arrowUp'} size={15} /></span><span>{row.descricao}{row.parcela_total > 1 && <small className="transaction-subline">Parcela {row.parcela_numero}/{row.parcela_total}</small>}</span></div></td><td className="date-cell">{dateName.format(new Date(`${effectiveDate(row)}T12:00:00`))}</td><td><span className="category-pill">{row.categoria}</span></td><td><span className={`status-badge ${isRealized(row) ? 'settled' : row.data < today ? 'overdue' : 'pending'}`}>{isRealized(row) ? row.tipo === 'receita' ? 'Recebido' : 'Pago' : row.data < today ? 'Atrasado' : row.tipo === 'receita' ? 'A receber' : 'A pagar'}</span></td><td className={`amount-cell ${row.tipo}`}>{row.tipo === 'despesa' ? '− ' : '+ '}{money.format(Number(row.valor))}</td><td>{!previewMode && <div className="row-actions"><button className="icon-button" title="Editar" aria-label={`Editar ${row.descricao}`} onClick={() => openMovementEditor(row)}><Icon name="pencil" size={15} /></button><button className="icon-button delete-action" title="Excluir" aria-label={`Excluir ${row.descricao}`} onClick={() => deleteMovement(row.id)}><Icon name="trash" size={15} /></button></div>}</td></tr>)}
              {!loading && !visibleRows.length && <tr><td colSpan="6"><div className="empty-state"><span className="empty-illustration"><Icon name="receipt" size={24} /></span><strong>{rows.length ? 'Nenhum resultado por aqui' : 'Sua história começa com um registro'}</strong><p>{rows.length ? 'Ajuste os filtros ou escolha outro mês.' : 'Adicione uma movimentação ou carregue a amostra fictícia para conhecer a dashboard.'}</p>{!rows.length && <button className="button button-outline" onClick={loadDemo} disabled={busy}>Carregar amostra fictícia</button>}</div></td></tr>}
              {loading && <tr><td colSpan="6"><div className="table-loading">Carregando seus registros…</div></td></tr>}
            </tbody></table></div>
            <div className="ledger-pagination"><span>{visibleRows.length ? `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, visibleRows.length)} de ${visibleRows.length}` : '0 registros'}</span><label>Por página<select value={pageSize} onChange={event => setPageSize(Number(event.target.value))}><option value="10">10</option><option value="25">25</option><option value="50">50</option></select></label><div><button className="button button-outline compact-button" onClick={() => setLedgerPage(safePage - 1)} disabled={safePage === 1}>Anterior</button><span aria-live="polite">{safePage} / {totalPages}</span><button className="button button-outline compact-button" onClick={() => setLedgerPage(safePage + 1)} disabled={safePage === totalPages}>Próxima</button></div></div>
          </AnimatedPanel>

          {categoryRules.length > 0 && <AnimatedPanel as="section" className="panel rules-panel"><div className="panel-heading"><div><div className="eyebrow">PREFERÊNCIAS SALVAS</div><h2>Regras de categoria</h2><p>Preenchidas automaticamente em novos registros e na importação; você pode ajustar.</p></div></div><div className="rule-list">{categoryRules.map(rule => <div key={rule.id}><span><strong>{rule.termo}</strong> → {rule.categoria} <small>({rule.tipo})</small></span>{!previewMode && <button className="text-action destructive-text" onClick={() => deleteCategoryRule(rule.id)}>Remover</button>}</div>)}</div></AnimatedPanel>}

          <AnimatedPanel as="section" className="panel conclusions-panel">
            <div className="panel-heading"><div><div className="eyebrow">LEITURAS BASEADAS NOS SEUS REGISTROS</div><h2>Conclusões do período</h2><p>{periodMessage}. Valores refletem os filtros selecionados.</p></div><span className="panel-period">{Math.min(insights.length, 5)} PONTOS</span></div>
            {insights.length ? <div className="conclusion-list">{insights.slice(0, 5).map((insight, index) => <AnimatedPanel className="conclusion-item" key={insight.label}><span className="conclusion-index">{String(index + 1).padStart(2, '0')}</span><div><strong>{insight.label}</strong><p>{insight.text}</p></div></AnimatedPanel>)}</div> : <div className="planning-empty">Registre movimentações para gerar conclusões. Nenhum padrão é exibido sem dados suficientes.</div>}
            {insights.length > 0 && insights.length < 3 && <p className="conclusion-caveat">Há poucos registros para produzir três conclusões sem extrapolar os dados.</p>}
          </AnimatedPanel>
          <footer className="app-footer"><span>Gestão Finance · Clareza para suas finanças</span><span>Seus dados são privados e isolados por conta.</span></footer>
        </div>
      </main>

      {modal === 'movement' && <Modal title={editing ? 'Editar movimentação' : 'Nova movimentação'} onClose={closeMovementEditor}>
        <form className="movement-form" onSubmit={saveMovement}>
          <label>Tipo<div className="type-toggle"><label><input name="tipo" type="radio" value="despesa" checked={movementType === 'despesa'} onChange={event => changeMovementType(event.target.value)} /><span>Despesa</span></label><label><input name="tipo" type="radio" value="receita" checked={movementType === 'receita'} onChange={event => changeMovementType(event.target.value)} /><span>Receita</span></label></div></label>
          <div className="form-row"><label>Valor total (R$)<input name="valor" type="number" min="0.01" step="0.01" placeholder="0,00" defaultValue={editing ? Number(editing.valor).toFixed(2) : ''} required /></label><label>Data / vencimento<input name="data" type="date" defaultValue={editing?.data || todayDate()} required /></label></div>
          <div className="form-row"><label>Status<select name="status" value={movementStatus} onChange={event => setMovementStatus(event.target.value)} disabled={!editing && !!movementCard}><option value="realizado">{movementType === 'receita' ? 'Recebido' : 'Pago'}</option><option value="pendente">Pendente</option></select>{!editing && movementCard && <input type="hidden" name="status" value="pendente" />}</label>{movementStatus === 'realizado' && <label>Data do {movementType === 'receita' ? 'recebimento' : 'pagamento'}<input name="data_pagamento" type="date" max={today} defaultValue={editing?.data_pagamento || (editing?.status === 'pendente' ? today : editing?.data) || today} required /></label>}</div>
          <div className="form-row"><label>Conta<select name="conta_id" defaultValue={editing?.conta_id || ''} disabled={!editing && !!movementCard}><option value="">Sem conta vinculada</option>{accounts.map(account => <option key={account.id} value={account.id}>{account.nome}</option>)}</select></label>{movementType === 'despesa' && <label>Cartão<select name="cartao_id" value={movementCard} onChange={event => { setMovementCard(event.target.value); if (event.target.value && !editing) setMovementStatus('pendente'); }}><option value="">Sem cartão</option>{cards.map(card => <option key={card.id} value={card.id}>{card.nome}</option>)}</select></label>}</div>
          {!editing && <label>Parcelas<input name="parcelas" type="number" min="1" max="120" step="1" defaultValue="1" /><small className="muted">O valor total será dividido em parcelas mensais pendentes. A data informada é o primeiro vencimento.</small></label>}
          {movementType === 'despesa' && <label>Aporte para meta <span className="optional-label">opcional</span><select name="meta_id" defaultValue={editing?.meta_id || ''}><option value="">Nenhuma meta</option>{goalRows.map(goal => <option key={goal.id} value={goal.id}>{goal.nome}</option>)}</select><small className="muted">Só pagamentos confirmados contam como aporte. O saldo inicial da meta é somado separadamente.</small></label>}
          <label>Descrição<input name="descricao" type="text" placeholder="Ex.: supermercado" value={descriptionValue} maxLength="120" onChange={event => setDescriptionValue(event.target.value)} required /></label>
          <label>Categoria<input name="categoria" type="text" list="category-options" placeholder="Selecione ou digite" value={categoryValue} onChange={event => { setCategoryValue(event.target.value); setCategoryManual(true); }} maxLength="60" required />{suggestedCategory && suggestedCategory !== categoryValue && <button type="button" className="suggestion-chip" onClick={() => { setCategoryValue(suggestedCategory); setCategoryManual(true); }}>Sugestão: usar {suggestedCategory}</button>}<datalist id="category-options">{movementCategories.map(category => <option key={category} value={category} />)}</datalist></label>
          <label className="checkbox-label"><input name="save_rule" type="checkbox" />Salvar uma regra de categoria para os próximos registros</label><label>Palavra ou trecho da regra<input name="rule_term" type="text" placeholder="Ex.: Uber, Netflix, supermercado" minLength="2" maxLength="120" /><small className="muted">Se ficar vazio, a regra usará a descrição completa. A regra será aplicada apenas ao tipo de movimentação selecionado.</small></label>
          <div className="modal-actions"><button type="button" className="button button-outline" onClick={closeMovementEditor}>Cancelar</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Salvando…' : editing ? 'Salvar alterações' : 'Adicionar registro'}</button></div>
        </form>
      </Modal>}

      {modal === 'import' && <Modal title="Revisar importação CSV" onClose={() => { setModal(''); setImportData(null); setCsvText(''); }} wide>
        <div className="import-content">
          <p className="muted">CSV em UTF-8, separado por vírgula ou ponto e vírgula. Aceita datas AAAA-MM-DD ou DD/MM/AAAA e valores em reais. Revise cada linha antes de salvar.</p>
          {importProfiles.length > 0 && <label className="import-profile-label">Formato salvo<select value={selectedProfile} onChange={event => { setSelectedProfile(event.target.value); const profile = importProfiles.find(item => item.id === event.target.value); setCsvMapping(profile?.mapping || {}); if (csvText) prepareImport(csvText, profile?.mapping || {}); }}><option value="">Reconhecer automaticamente</option>{importProfiles.map(profile => <option key={profile.id} value={profile.id}>{profile.nome}</option>)}</select></label>}
          <label className="file-drop"><input type="file" accept=".csv,text/csv" onChange={async event => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 2 * 1024 * 1024) { setImportData({ valid: [], items: [], errors: ['O arquivo deve ter até 2 MB.'] }); return; } prepareImport(await file.text(), csvMapping); }} /><span className="file-icon"><Icon name="upload" size={21} /></span><strong>Escolha um arquivo CSV</strong><span>até 2 MB e 500 linhas</span></label>
          {importData?.headers?.length > 0 && <><div className="csv-mapping">{['data', 'descricao', 'valor', 'tipo', 'categoria', 'status', 'data_pagamento'].map(field => <label key={field}>{({ data: 'Data', descricao: 'Descrição', valor: 'Valor', tipo: 'Tipo', categoria: 'Categoria', status: 'Status', data_pagamento: 'Data de pagamento' })[field]}<select value={csvMapping[field] ?? ''} onChange={event => { const mapping = { ...csvMapping, [field]: event.target.value }; prepareImport(csvText, mapping); }}><option value="">{['categoria', 'status', 'data_pagamento'].includes(field) ? 'Automático / opcional' : 'Selecione a coluna'}</option>{importData.headers.map((header, index) => <option key={index} value={header}>{header}</option>)}</select></label>)}</div><div className="save-import-profile"><input value={profileName} onChange={event => setProfileName(event.target.value)} maxLength="60" placeholder="Nome deste formato" aria-label="Nome do formato de importação" /><button className="button button-outline compact-button" onClick={saveImportProfile} disabled={!profileName.trim() || busy}>Salvar formato</button></div></>}
          {importData && <div className="import-summary"><strong>{(importData.items || []).filter(item => item.selected && item.record).length} linhas selecionadas de {importData.items?.length || 0}</strong><p>Possíveis duplicatas começam desmarcadas. Você pode selecioná-las após conferir.</p>{importData.errors?.length > 0 && <div className="import-errors">{importData.errors.map((error, index) => <div key={index}>{error}</div>)}</div>}{importData.items?.length > 0 && <><div className="csv-selection-actions"><button className="text-action" onClick={() => setImportData({ ...importData, items: importData.items.map(item => ({ ...item, selected: !!item.record && !item.errors?.length && !item.duplicate })) })}>Selecionar válidas sem duplicatas</button><button className="text-action" onClick={() => setImportData({ ...importData, items: importData.items.map(item => ({ ...item, selected: false })) })}>Desmarcar todas</button></div><div className="csv-preview"><table><thead><tr><th>Importar</th><th>Linha</th><th>Descrição / validação</th><th>Data</th><th>Categoria</th><th>Valor</th></tr></thead><tbody>{importData.items.map(item => <tr key={item.id}><td><input type="checkbox" checked={!!item.selected} disabled={!item.record || !!item.errors?.length} aria-label={`Importar linha ${item.line}`} onChange={event => setImportData({ ...importData, items: importData.items.map(candidate => candidate.id === item.id ? { ...candidate, selected: event.target.checked } : candidate) })} /></td><td>{item.line}</td><td>{item.record?.descricao || 'Linha inválida'}{item.duplicate && <small className="duplicate-warning">Possível duplicata</small>}{item.errors?.map((error, index) => <small className="negative-value" key={index}>{error}</small>)}</td><td>{item.record?.data || '—'}</td><td>{item.record?.categoria || '—'}</td><td>{item.record ? money.format(Number(item.record.valor)) : '—'}</td></tr>)}</tbody></table></div></>}</div>}
          <div className="modal-actions"><button className="button button-outline" onClick={() => { setModal(''); setImportData(null); setCsvText(''); }}>Cancelar</button><button className="button button-primary" onClick={importCsv} disabled={!(importData?.items || []).some(item => item.selected && item.record) || busy}>{busy ? 'Importando…' : `Importar ${(importData?.items || []).filter(item => item.selected && item.record).length} registros`}</button></div>
        </div>
      </Modal>}
      {modal === 'budget' && <Modal title={planningEditing ? 'Editar limite mensal' : 'Definir orçamento'} onClose={() => { setModal(''); setPlanningEditing(null); }}>
        <form className="movement-form" onSubmit={saveBudget}>
          <p className="muted form-context">Limite para {monthLabel(month)}.</p>
          <label>Categoria<input name="categoria" type="text" list="budget-category-options" placeholder="Selecione ou digite" defaultValue={planningEditing?.categoria || ''} maxLength="60" required /><datalist id="budget-category-options">{expenseCategories.map(category => <option key={category} value={category} />)}</datalist></label>
          <label>Limite mensal<input name="limite" type="number" min="0.01" step="0.01" placeholder="0,00" defaultValue={planningEditing ? Number(planningEditing.limite).toFixed(2) : ''} required /></label>
          <div className="modal-actions"><button type="button" className="button button-outline" onClick={() => { setModal(''); setPlanningEditing(null); }}>Cancelar</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar limite'}</button></div>
        </form>
      </Modal>}
      {modal === 'goal' && <Modal title={planningEditing ? 'Atualizar meta de economia' : 'Nova meta de economia'} onClose={() => { setModal(''); setPlanningEditing(null); }}>
        <form className="movement-form" onSubmit={saveGoal}>
          <label>Nome da meta<input name="nome" type="text" placeholder="Ex.: Reserva de emergência" defaultValue={planningEditing?.nome || ''} maxLength="80" required /></label>
          <div className="form-row"><label>Valor alvo<input name="valor_alvo" type="number" min="0.01" step="0.01" placeholder="0,00" defaultValue={planningEditing ? Number(planningEditing.valor_alvo).toFixed(2) : ''} required /></label><label>Saldo inicial guardado<input name="valor_atual" type="number" min="0" step="0.01" placeholder="0,00" defaultValue={planningEditing ? Number(planningEditing.valor_atual).toFixed(2) : '0.00'} required /></label></div>
          <p className="muted form-context">O saldo inicial representa o valor já guardado antes dos aportes vinculados. Evite informar os mesmos aportes nos dois lugares.</p>
          <label>Data limite <span className="optional-label">opcional</span><input name="data_limite" type="date" defaultValue={planningEditing?.data_limite || ''} /></label>
          <div className="modal-actions"><button type="button" className="button button-outline" onClick={() => { setModal(''); setPlanningEditing(null); }}>Cancelar</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar meta'}</button></div>
        </form>
      </Modal>}
      {modal === 'recurring' && <Modal title={planningEditing ? 'Editar despesa recorrente' : 'Nova despesa recorrente'} onClose={() => { setModal(''); setPlanningEditing(null); }}>
        <form className="movement-form" onSubmit={saveRecurring}>
          <label>Descrição<input name="descricao" type="text" placeholder="Ex.: aluguel" defaultValue={planningEditing?.descricao || ''} maxLength="120" required /></label>
          <div className="form-row"><label>Valor mensal<input name="valor" type="number" min="0.01" step="0.01" placeholder="0,00" defaultValue={planningEditing ? Number(planningEditing.valor).toFixed(2) : ''} required /></label><label>Dia de vencimento<input name="dia_vencimento" type="number" min="1" max="31" step="1" defaultValue={planningEditing?.dia_vencimento || 1} required /></label></div>
          <label>Categoria<input name="categoria" type="text" list="recurring-category-options" placeholder="Selecione ou digite" defaultValue={planningEditing?.categoria || ''} maxLength="60" required /><datalist id="recurring-category-options">{expenseCategories.map(category => <option key={category} value={category} />)}</datalist></label>
          <p className="muted form-context">Ao lançar, a despesa fica pendente até você confirmar o pagamento. As automações podem gerar os próximos lançamentos.</p>
          <div className="modal-actions"><button type="button" className="button button-outline" onClick={() => { setModal(''); setPlanningEditing(null); }}>Cancelar</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar recorrência'}</button></div>
        </form>
      </Modal>}
      {toast && <div className="toast-message" role="status">{toast}</div>}
    </div>
  );
}

function MetricCard({ title, value, format = 'currency', valueTone = '', note, icon, tone, trend, loading, highlighted = false, delay = 0 }) {
  const positive = trend !== undefined && trend !== null && trend <= 0;
  return <AnimatedPanel className={`metric-card ${highlighted ? 'metric-primary' : ''}`} aria-label={title} delay={delay}>
    <div className="metric-top"><span>{title}</span><span className={`metric-icon ${tone}`}><Icon name={icon} size={17} /></span></div>
    <strong className={`metric-value ${valueTone ? `${valueTone}-value` : ''}`}>{loading ? <span className="loading-skeleton" role="status" aria-label="Carregando indicador" /> : <AnimatedNumber value={value} format={format} />}</strong>
    <div className="metric-note">{trend !== undefined && trend !== null && !loading && <span className={`trend-dot ${positive ? 'good' : 'bad'}`}>{positive ? '↓' : '↑'}</span>}{loading ? 'Carregando…' : note}</div>
  </AnimatedPanel>;
}
