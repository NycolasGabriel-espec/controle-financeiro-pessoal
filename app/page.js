'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const shortMoney = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const dateName = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });

const categories = ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Assinaturas', 'Salário', 'Freelance', 'Outros'];
const categoryColors = ['#2563EB', '#84CC16', '#F59E0B', '#60A5FA', '#22C55E', '#A1A1AA', '#3B82F6'];

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

function todayMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function previousMonthOf(value) {
  const [year, month] = value.split('-').map(Number);
  const previous = new Date(year, month - 2, 1);
  return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(value) {
  return monthName.format(new Date(`${value}-01T12:00:00`));
}

function percent(value) {
  const sign = value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

function suggestCategory(description) {
  const text = description.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const rules = [
    [/salario|pagamento mensal/, 'Salário'],
    [/freelance|cliente|projeto|consultoria/, 'Freelance'],
    [/mercado|supermercado|restaurante|ifood|padaria|cafe|lanche|comida/, 'Alimentação'],
    [/aluguel|condominio|iptu|energia|conta de luz|conta de agua|gas de cozinha|internet residencial/, 'Moradia'],
    [/uber|taxi|onibus|metro|combustivel|gasolina|estacionamento/, 'Transporte'],
    [/farmacia|medico|consulta|hospital|dentista|plano de saude|academia/, 'Saúde'],
    [/netflix|streaming|assinatura|spotify|icloud/, 'Assinaturas'],
    [/cinema|show|teatro|viagem|lazer|parque/, 'Lazer'],
    [/curso|escola|faculdade|livro/, 'Educação'],
  ];
  return rules.find(([pattern]) => pattern.test(text))?.[1] || '';
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
  };
  return <svg {...common}>{shapes[name] || shapes.grid}</svg>;
}

function AuthScreen({ onDemo }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!supabase) {
      setError('A conexão com o Supabase ainda não está configurada.');
      return;
    }
    setWorking(true);
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setWorking(false);
    if (result.error) {
      setError(result.error.message === 'Invalid login credentials' ? 'E-mail ou senha não conferem.' : result.error.message);
      return;
    }
    if (mode === 'signup' && !result.data.session) {
      setMessage('Conta criada. Confirme seu e-mail e depois entre para acessar seus dados.');
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Brand />
        <div className="auth-story-copy">
          <div className="eyebrow light-eyebrow"><span /> FINANÇAS COM MAIS CLAREZA</div>
          <h1>Seu dinheiro,<br /><em>no seu ritmo.</em></h1>
          <p>Entenda seus hábitos, acompanhe cada escolha e construa uma relação mais leve com as suas finanças.</p>
          <div className="auth-mini-card">
            <div className="mini-top"><span>Saldo do mês</span><span className="mini-dot" /></div>
            <strong>R$ 2.571,10</strong>
            <div className="mini-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
            <div className="mini-bottom"><span>Receitas</span><span>Despesas</span></div>
          </div>
        </div>
        <div className="auth-footnote">Seus dados pertencem a você. Acesso protegido por conta e senha.</div>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand"><Brand /></div>
          <div className="eyebrow">BEM-VINDO(A)</div>
          <h2>{mode === 'signin' ? 'Entre na sua conta' : 'Crie sua conta'}</h2>
          <p className="muted">{mode === 'signin' ? 'Acesse seu espaço financeiro pessoal.' : 'Seus registros ficam isolados e protegidos.'}</p>
          <div className="auth-tabs" role="tablist" aria-label="Acesso">
            <button className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setError(''); setMessage(''); }}>Entrar</button>
            <button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError(''); setMessage(''); }}>Criar conta</button>
          </div>
          <form className="auth-form" onSubmit={submit}>
            <label>E-mail<input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="voce@exemplo.com" autoComplete="email" required /></label>
            <label>Senha<input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Pelo menos 8 caracteres" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={8} required /></label>
            {error && <div className="form-alert error-alert">{error}</div>}
            {message && <div className="form-alert success-alert">{message}</div>}
            <button className="button button-primary auth-submit" type="submit" disabled={working}>{working ? 'Aguarde…' : mode === 'signin' ? 'Entrar na conta' : 'Criar conta'}<Icon name="chevron" size={17} /></button>
          </form>
          <button type="button" className="demo-login-button" onClick={onDemo}>Explorar demonstração fictícia <Icon name="chevron" size={15} /></button>
          <div className="auth-privacy"><span className="lock-mark">◈</span> Seus dados são privados e protegidos por políticas de acesso por usuário.</div>
        </div>
      </section>
    </main>
  );
}

function Brand() {
  return <div className="brand"><span className="brand-mark"><span /><span /><span /></span><span>CoinPulse<span className="brand-dot">.</span></span></div>;
}

function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="modal-scrim" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`modal-card ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-head"><div><div className="eyebrow">CONTROLE FINANCEIRO</div><h2 id="modal-title">{title}</h2></div><button className="icon-button" aria-label="Fechar" onClick={onClose}><Icon name="close" /></button></div>
        {children}
      </section>
    </div>
  );
}

function CashFlowChart({ rows, month }) {
  const points = useMemo(() => {
    const [year, monthNumber] = month.split('-').map(Number);
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(year, monthNumber - 6 + index, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthRows = rows.filter(row => String(row.data).slice(0, 7) === key);
      return {
        key,
        label: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', ''),
        income: monthRows.filter(row => row.tipo === 'receita').reduce((sum, row) => sum + Number(row.valor), 0),
        expense: monthRows.filter(row => row.tipo === 'despesa').reduce((sum, row) => sum + Number(row.valor), 0),
      };
    });
  }, [rows, month]);

  const max = Math.max(1, ...points.flatMap(point => [point.income, point.expense]));
  const hasData = points.some(point => point.income || point.expense);

  return (
    <div className="chart-wrap">
      <div className="chart-legend"><span><i className="legend-income" /> Receitas</span><span><i className="legend-expense" /> Despesas</span><span className="chart-unit">BRL</span></div>
      <div className="chart-columns" role="img" aria-label="Evolução mensal de receitas e despesas">
        {points.map(point => <div className="chart-column" key={point.key}>
          <div className="chart-bar-pair"><span className="chart-bar income-bar" style={{ height: `${point.income ? Math.max(3, point.income / max * 92) : 0}px` }} title={`${point.label}: receitas ${money.format(point.income)}`} /><span className="chart-bar expense-bar" style={{ height: `${point.expense ? Math.max(3, point.expense / max * 92) : 0}px` }} title={`${point.label}: despesas ${money.format(point.expense)}`} /></div>
          <span className="chart-month">{point.label}</span>
        </div>)}
      </div>
      {!hasData && <div className="chart-empty">Os valores dos últimos meses aparecem aqui.</div>}
    </div>
  );
}

function BalanceTrendChart({ rows, month }) {
  const points = useMemo(() => {
    const [year, monthNumber] = month.split('-').map(Number);
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(year, monthNumber - 6 + index, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthRows = rows.filter(row => String(row.data).slice(0, 7) === key);
      const income = monthRows.filter(row => row.tipo === 'receita').reduce((sum, row) => sum + Number(row.valor), 0);
      const expense = monthRows.filter(row => row.tipo === 'despesa').reduce((sum, row) => sum + Number(row.valor), 0);
      return {
        key,
        label: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', ''),
        balance: income - expense,
      };
    });
  }, [rows, month]);

  const max = Math.max(1, ...points.map(point => Math.abs(point.balance)));
  const hasData = points.some(point => point.balance !== 0);

  return (
    <div className="balance-chart">
      <div className="chart-legend"><span><i className="legend-balance-positive" /> Saldo positivo</span><span><i className="legend-balance-negative" /> Saldo negativo</span><span className="chart-unit">BRL</span></div>
      <div className="balance-chart-columns" role="img" aria-label="Evolução mensal do saldo">
        <span className="balance-zero-line" />
        {points.map(point => {
          const height = point.balance ? Math.max(3, Math.abs(point.balance) / max * 46) : 0;
          return <div className="balance-chart-column" key={point.key}>
            <div className="balance-chart-track">
              <span className={`balance-bar ${point.balance < 0 ? 'negative' : 'positive'}`} style={point.balance < 0 ? { height: `${height}px`, top: '50%' } : { height: `${height}px`, bottom: '50%' }} title={`${point.label}: saldo ${money.format(point.balance)}`} />
            </div>
            <span className="chart-month">{point.label}</span>
          </div>;
        })}
      </div>
      {!hasData && <div className="chart-empty">Os saldos mensais aparecem depois dos primeiros registros.</div>}
    </div>
  );
}

function parseCsv(input) {
  const text = input.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell.trim()); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell.trim());
      if (row.some(value => value !== '')) rows.push(row);
      row = []; cell = '';
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(value => value !== '')) rows.push(row);
  if (!rows.length) return { valid: [], errors: ['O arquivo está vazio.'] };
  const headers = rows.shift().map(value => value.toLowerCase());
  const required = ['data', 'descricao', 'valor', 'tipo', 'categoria'];
  if (required.some(header => !headers.includes(header))) return { valid: [], errors: ['O cabeçalho deve conter: data,descricao,valor,tipo,categoria.'] };
  if (rows.length > 500) return { valid: [], errors: ['Importe até 500 linhas por arquivo.'] };
  const valid = [];
  const errors = [];
  rows.forEach((values, index) => {
    const record = Object.fromEntries(headers.map((header, column) => [header, values[column] || '']));
    const value = Number(record.valor);
    const dateParts = record.data.split('-').map(Number);
    const parsedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(record.data)
      && dateParts.length === 3
      && parsedDate.getFullYear() === dateParts[0]
      && parsedDate.getMonth() === dateParts[1] - 1
      && parsedDate.getDate() === dateParts[2];
    const type = record.tipo.toLowerCase();
    if (!dateOk) errors.push(`Linha ${index + 2}: data inválida.`);
    else if (!record.descricao) errors.push(`Linha ${index + 2}: descrição vazia.`);
    else if (!Number.isFinite(value) || value <= 0 || !/^\d+(\.\d{1,2})?$/.test(record.valor)) errors.push(`Linha ${index + 2}: valor deve ser positivo e usar ponto decimal.`);
    else if (!['receita', 'despesa'].includes(type)) errors.push(`Linha ${index + 2}: tipo deve ser receita ou despesa.`);
    else if (!record.categoria) errors.push(`Linha ${index + 2}: categoria vazia.`);
    else valid.push({ data: record.data, descricao: record.descricao, valor: value, tipo: type, categoria: record.categoria });
  });
  return { valid, errors };
}

function exportCsv(rows) {
  const escape = value => `"${String(value).replaceAll('"', '""')}"`;
  const lines = [['data', 'descricao', 'valor', 'tipo', 'categoria'], ...rows.map(row => [row.data, row.descricao, Number(row.valor).toFixed(2), row.tipo, row.categoria])];
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
  const [rows, setRows] = useState([]);
  const [budgetRows, setBudgetRows] = useState([]);
  const [goalRows, setGoalRows] = useState([]);
  const [recurringRows, setRecurringRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(todayMonth());
  const [kindFilter, setKindFilter] = useState('todos');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState('');
  const [editing, setEditing] = useState(null);
  const [planningEditing, setPlanningEditing] = useState(null);
  const [categoryValue, setCategoryValue] = useState('');
  const [suggestedCategory, setSuggestedCategory] = useState('');
  const [importData, setImportData] = useState(null);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [dbError, setDbError] = useState('');

  const loadRows = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    async function loadAllTransactions() {
      const pageSize = 1000;
      const all = [];
      let offset = 0;
      while (true) {
        const page = await supabase.from('transactions')
          .select('id,data,descricao,valor,tipo,categoria,recorrencia_id', { count: 'exact' })
          .order('data', { ascending: false })
          .range(offset, offset + pageSize - 1);
        if (page.error) return { data: null, error: page.error };
        all.push(...(page.data || []));
        if (!page.data?.length || page.data.length < pageSize || offset + page.data.length >= (page.count || 0)) break;
        offset += pageSize;
      }
      return { data: all, error: null };
    }
    const [transactions, budgets, goals, recurring] = await Promise.all([
      loadAllTransactions(),
      supabase.from('budgets').select('id,mes,categoria,limite').order('mes', { ascending: false }),
      supabase.from('savings_goals').select('id,nome,valor_alvo,valor_atual,data_limite').order('created_at', { ascending: false }),
      supabase.from('recurring_expenses').select('id,descricao,valor,categoria,dia_vencimento,ativo').order('dia_vencimento'),
    ]);
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
      else { setRows([]); setLoading(false); }
    });
    return () => listener.subscription.unsubscribe();
  }, [loadRows]);

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
  const currentRows = useMemo(() => matchingRows.filter(row => String(row.data).slice(0, 7) === month), [matchingRows, month]);
  const previousMonth = previousMonthOf(month);
  const previousRows = useMemo(() => matchingRows.filter(row => String(row.data).slice(0, 7) === previousMonth), [matchingRows, previousMonth]);
  const income = currentRows.filter(row => row.tipo === 'receita').reduce((sum, row) => sum + Number(row.valor), 0);
  const expense = currentRows.filter(row => row.tipo === 'despesa').reduce((sum, row) => sum + Number(row.valor), 0);
  const balance = income - expense;
  const previousExpense = previousRows.filter(row => row.tipo === 'despesa').reduce((sum, row) => sum + Number(row.valor), 0);
  const expenseChange = previousExpense > 0 ? ((expense - previousExpense) / previousExpense) * 100 : null;
  const economyRate = income ? (balance / income) * 100 : null;
  const committedRate = income ? (expense / income) * 100 : null;
  const monthIsPartial = month === todayMonth();
  const monthIsFuture = month > todayMonth();
  const periodMessage = monthIsPartial
    ? `Mês em andamento até ${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(new Date())}`
    : monthIsFuture ? 'Período futuro; os valores ainda podem mudar' : 'Mês encerrado, com base nos registros lançados';

  const visibleRows = useMemo(() => currentRows.slice().sort((a, b) => String(b.data).localeCompare(String(a.data))), [currentRows]);

  const categoryRows = useMemo(() => {
    const totals = new Map();
    currentRows.filter(row => row.tipo === 'despesa').forEach(row => totals.set(row.categoria, (totals.get(row.categoria) || 0) + Number(row.valor)));
    return [...totals.entries()].map(([name, value], index) => ({ name, value, share: expense ? value / expense * 100 : 0, color: categoryColors[index % categoryColors.length] })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [currentRows, expense]);

  const currentBudgets = budgetRows.filter(row => String(row.mes).slice(0, 7) === month);
  const budgetProgress = currentBudgets.map(budget => {
    const spent = currentRows.filter(row => row.tipo === 'despesa' && row.categoria === budget.categoria).reduce((sum, row) => sum + Number(row.valor), 0);
    return { ...budget, spent, percentage: Number(budget.limite) ? spent / Number(budget.limite) * 100 : 0 };
  });
  const largestExpense = currentRows.filter(row => row.tipo === 'despesa').sort((a, b) => Number(b.valor) - Number(a.valor))[0];
  const expenseChangeUnavailable = previousRows.length === 0
    ? 'Sem registros nos filtros selecionados no mês anterior'
    : 'Sem despesas nos filtros selecionados no mês anterior';
  const insights = [];
  if (categoryRows[0] && expense > 0) insights.push({ label: 'Categoria principal', text: `${categoryRows[0].name} concentra ${percent(categoryRows[0].share)} das despesas do período.` });
  if (income > 0) insights.push({ label: 'Renda comprometida', text: `${percent(committedRate)} da renda foi usada em despesas; a taxa de economia foi ${percent(economyRate)}.` });
  if (largestExpense) insights.push({ label: 'Maior saída', text: `${largestExpense.descricao} foi o maior lançamento de despesa, em ${money.format(Number(largestExpense.valor))}.` });
  if (previousExpense > 0) insights.push({ label: 'Variação mensal', text: `As despesas estão ${percent(Math.abs(expenseChange))} ${expenseChange > 0 ? 'acima' : 'abaixo'} de ${monthLabel(previousMonth)}${monthIsPartial ? '; o mês atual ainda está em andamento' : ''}.` });
  const exceededBudget = budgetProgress.find(budget => budget.percentage > 100);
  if (exceededBudget) insights.push({ label: 'Orçamento', text: `${exceededBudget.categoria} ultrapassou o limite mensal em ${money.format(exceededBudget.spent - Number(exceededBudget.limite))}.` });

  async function saveMovement(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record = {
      data: form.get('data'),
      descricao: String(form.get('descricao') || '').trim(),
      valor: Number(form.get('valor')),
      tipo: form.get('tipo'),
      categoria: String(form.get('categoria') || '').trim(),
    };
    setBusy(true);
    const query = editing
      ? supabase.from('transactions').update(record).eq('id', editing.id)
      : supabase.from('transactions').insert(record);
    const { error } = await query;
    setBusy(false);
    if (error) { setToast('Não foi possível salvar. Confira os campos e tente novamente.'); return; }
    setModal(''); setEditing(null); setCategoryValue(''); setSuggestedCategory(''); setToast(editing ? 'Movimentação atualizada.' : 'Movimentação adicionada.');
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
    if (rows.some(row => row.recorrencia_id === record.id && row.data === data)) {
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

  async function importCsv() {
    if (!importData?.valid?.length) return;
    setBusy(true);
    const { error } = await supabase.from('transactions').insert(importData.valid);
    setBusy(false);
    if (error) { setToast('A importação não foi concluída. Tente novamente.'); return; }
    const count = importData.valid.length;
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
    if (previewMode) { setPreviewMode(false); setRows([]); setBudgetRows([]); setGoalRows([]); setRecurringRows([]); return; }
    await supabase.auth.signOut();
    setRows([]); setBudgetRows([]); setGoalRows([]); setRecurringRows([]);
  }

  if (!user && !previewMode) {
    return <>
      {!supabase && <div className="setup-banner"><strong>Configuração pendente:</strong> adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ao ambiente da aplicação.</div>}
      <AuthScreen onDemo={() => { setRows(demoTransactions.map((row, index) => ({ ...row, id: `preview-${index}` }))); setBudgetRows(demoBudgets); setGoalRows(demoGoals); setRecurringRows(demoRecurring); setMonth('2026-10'); setPreviewMode(true); }} />
    </>;
  }

  const topCategory = categoryRows[0];
  const initials = previewMode ? 'D' : (user?.email || 'U').slice(0, 1).toUpperCase();
  function requireAccount(action) {
    if (previewMode) setToast(`Crie uma conta para ${action} suas movimentações.`);
    else setModal('import');
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Brand />
        <div className="side-label">MENU PRINCIPAL</div>
        <nav className="side-nav" aria-label="Navegação principal">
          <a className="side-link active" href="#visao-geral"><Icon name="grid" />Visão geral</a>
          <a className="side-link" href="#movimentacoes"><Icon name="receipt" />Movimentações</a>
          <button className="side-link" onClick={() => requireAccount('importar')}><Icon name="upload" />Importar CSV</button>
          <div className="side-label side-label-spaced">PLANEJAMENTO</div>
          <a className="side-link" href="#orcamentos"><Icon name="target" />Orçamentos</a>
          <a className="side-link" href="#metas"><Icon name="sparkle" />Metas de economia</a>
          <a className="side-link" href="#recorrencias"><Icon name="receipt" />Recorrências</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon"><Icon name="help" size={17} /></div><strong>Um passo de cada vez</strong><p>Pequenas escolhas também constroem grandes planos.</p><a href="#movimentacoes">Ver movimentações <Icon name="chevron" size={14} /></a></div>
          <div className="user-row"><div className="avatar">{initials}</div><div className="user-info"><strong>{previewMode ? 'Demonstração' : user.email?.split('@')[0] || 'Minha conta'}</strong><span>{previewMode ? 'Acesso somente leitura' : 'Conta pessoal'}</span></div><button className="icon-button logout-button" aria-label={previewMode ? 'Sair da demonstração' : 'Sair da conta'} title={previewMode ? 'Sair da demonstração' : 'Sair da conta'} onClick={signOut}><Icon name="logout" size={17} /></button></div>
        </div>
      </aside>

      <main className="main-content" id="visao-geral">
        <header className="topbar">
          <div className="breadcrumb"><span>Meu espaço</span><Icon name="chevron" size={14} /><strong>Visão geral</strong></div>
          <div className="topbar-actions"><span className={`privacy-chip ${previewMode ? 'preview-chip' : ''}`}><span /> {previewMode ? 'Demonstração local' : 'Dados privados'}</span><button className="avatar top-avatar" title={previewMode ? 'Demonstração fictícia' : user.email}>{initials}</button></div>
        </header>

        <div className="content-wrap">
          <div className="page-heading">
            <div><div className="eyebrow">SUA VIDA FINANCEIRA, EM EQUILÍBRIO</div><h1>Visão geral</h1><p>Acompanhe o que entra, o que sai e o que fica.</p></div>
            <div className="heading-actions"><label className="month-select"><span className="sr-only">Mês selecionado</span><input type="month" value={month} onChange={event => { if (event.target.value) setMonth(event.target.value); }} aria-label="Selecionar mês" /></label>{previewMode ? <button className="button button-primary" onClick={() => { setPreviewMode(false); setRows([]); setBudgetRows([]); setGoalRows([]); setRecurringRows([]); }}><Icon name="plus" size={17} />Criar conta para salvar</button> : <><button className="button button-outline" onClick={() => setModal('import')}><Icon name="upload" size={17} />Importar CSV</button><button className="button button-primary" onClick={() => { setEditing(null); setCategoryValue(''); setSuggestedCategory(''); setModal('movement'); }}><Icon name="plus" size={17} />Nova movimentação</button></>}</div>
          </div>

          {!supabase && <div className="notice error-notice">A conexão com o banco não está configurada.</div>}
          {dbError && <div className="notice error-notice">{dbError}</div>}
          <div className={`demo-notice ${previewMode ? 'preview-notice' : ''}`}><span className="demo-badge">{previewMode ? 'AMOSTRA' : 'PRIVADO'}</span><span>{previewMode ? 'Dados fictícios para explorar a dashboard; nenhuma movimentação será salva.' : 'Seus registros ficam visíveis apenas na sua conta. Use a amostra fictícia para explorar a dashboard.'}</span>{!previewMode && <button onClick={loadDemo} disabled={busy || rows.length > 0}>{busy ? 'Carregando…' : rows.length ? 'Amostra já carregada' : 'Carregar amostra'}</button>}</div>
          <div className={`period-note ${monthIsPartial || monthIsFuture ? 'period-note-warning' : ''}`}>{periodMessage}{monthIsPartial && ' · Comparações mensais usam o acumulado até hoje.'}</div>

          <section className="metric-grid" aria-label="Indicadores financeiros">
            <MetricCard title="Receitas" value={money.format(income)} note={`Em ${monthLabel(month)}`} icon="arrowUp" tone="green" loading={loading} />
            <MetricCard title="Despesas" value={money.format(expense)} note={expenseChange === null ? `Variação indisponível: ${expenseChangeUnavailable}` : `${percent(Math.abs(expenseChange))} ${expenseChange > 0 ? 'acima' : 'abaixo'} de ${monthLabel(previousMonth)}${monthIsPartial ? ' · mês parcial' : ''}`} icon="arrowDown" tone="amber" trend={expenseChange} loading={loading} />
            <MetricCard title="Saldo do período" value={money.format(balance)} note="Receitas menos despesas" icon="sparkle" tone="dark" loading={loading} />
            <MetricCard title="Taxa de economia" value={economyRate === null ? '—' : percent(economyRate)} note={economyRate === null ? 'Indisponível: sem receitas no período' : 'Do que entrou, ficou com você'} icon="target" tone="lilac" loading={loading} />
            <MetricCard title="Renda comprometida" value={committedRate === null ? '—' : percent(committedRate)} note={committedRate === null ? 'Indisponível: sem receitas no período' : 'Da renda usada em despesas'} icon="receipt" tone="dark" loading={loading} />
          </section>

          <section className="insights-grid" aria-label="Análise do período">
            <article className="panel flow-panel">
              <div className="panel-heading"><div><div className="eyebrow">MOVIMENTO AO LONGO DO TEMPO</div><h2>Fluxo financeiro</h2><p>Receitas e despesas por mês</p></div><span className="panel-period">6 MESES</span></div>
              <CashFlowChart rows={matchingRows} month={month} />
            </article>
            <article className="panel category-panel">
              <div className="panel-heading"><div><div className="eyebrow">PARA ONDE VAI</div><h2>Despesas por categoria</h2><p>{monthLabel(month)}</p></div><button className="dots-button" aria-label="Mais opções" onClick={() => setCategoryFilter('todas')}>···</button></div>
              {categoryRows.length ? <div className="category-list">{categoryRows.map(category => <div className="category-item" key={category.name}><div className="category-line"><span className="category-name"><i style={{ background: category.color }} />{category.name}</span><span className="category-value">{money.format(category.value)} <small>{percent(category.share)}</small></span></div><div className="category-track"><span style={{ width: `${expense ? Math.max(4, category.share) : 0}%`, background: category.color }} /></div></div>)}</div> : <div className="empty-chart">As categorias aparecem depois das primeiras despesas.</div>}
              <div className="category-total"><span>Total de despesas</span><strong>{money.format(expense)}</strong></div>
            </article>
          </section>

          <section className="panel balance-panel">
            <div className="panel-heading"><div><div className="eyebrow">SALDO MENSAL</div><h2>Evolução do saldo</h2><p>Receitas menos despesas, mês a mês</p></div><span className="panel-period">6 MESES</span></div>
            <BalanceTrendChart rows={matchingRows} month={month} />
          </section>

          <section className="planning-grid" aria-label="Planejamento financeiro">
            <article className="panel planning-panel" id="orcamentos">
              <div className="panel-heading"><div><div className="eyebrow">LIMITE DE GASTOS</div><h2>Orçamentos</h2><p>{monthLabel(month)} · filtros ativos</p></div><button className="button button-outline compact-button" onClick={() => openPlanningEditor('budget')}>Definir limite</button></div>
              {budgetProgress.length ? <div className="planning-list">{budgetProgress.map(item => <div className="planning-item" key={item.id}>
                <div className="planning-item-head"><span>{item.categoria}</span><strong>{money.format(item.spent)} <small>de {money.format(Number(item.limite))}</small></strong></div>
                <div className={`planning-track ${item.percentage > 100 ? 'over-limit' : ''}`}><span style={{ width: `${Math.min(100, item.percentage)}%` }} /></div>
                <div className="planning-item-foot"><span>{percent(item.percentage)} utilizado</span><span>{item.percentage > 100 ? `Excedido em ${money.format(item.spent - Number(item.limite))}` : `${money.format(Number(item.limite) - item.spent)} restantes`}</span></div>
                {!previewMode && <div className="planning-item-actions"><button className="text-action" onClick={() => openPlanningEditor('budget', item)}>Editar</button><button className="text-action destructive-text" onClick={() => deleteBudget(item.id)}>Excluir</button></div>}
              </div>)}</div> : <div className="planning-empty">Defina limites mensais por categoria para acompanhar seus gastos.</div>}
            </article>

            <article className="panel planning-panel" id="metas">
              <div className="panel-heading"><div><div className="eyebrow">OBJETIVOS DE LONGO PRAZO</div><h2>Metas de economia</h2><p>Acompanhe o valor acumulado</p></div><button className="button button-outline compact-button" onClick={() => openPlanningEditor('goal')}>Nova meta</button></div>
              {goalRows.length ? <div className="planning-list">{goalRows.map(goal => {
                const goalPercent = Number(goal.valor_alvo) ? Number(goal.valor_atual) / Number(goal.valor_alvo) * 100 : 0;
                return <div className="planning-item" key={goal.id}>
                  <div className="planning-item-head"><span>{goal.nome}</span><strong>{money.format(Number(goal.valor_atual))} <small>de {money.format(Number(goal.valor_alvo))}</small></strong></div>
                  <div className="planning-track goal-track"><span style={{ width: `${Math.min(100, goalPercent)}%` }} /></div>
                  <div className="planning-item-foot"><span>{percent(goalPercent)} alcançado</span><span>{goal.data_limite ? `Prazo: ${dateName.format(new Date(`${goal.data_limite}T12:00:00`))} ${goal.data_limite.slice(0, 4)}` : 'Sem prazo definido'}</span></div>
                  {!previewMode && <div className="planning-item-actions"><button className="text-action" onClick={() => openPlanningEditor('goal', goal)}>Atualizar progresso</button><button className="text-action destructive-text" onClick={() => deleteGoal(goal.id)}>Excluir</button></div>}
                </div>;
              })}</div> : <div className="planning-empty">Crie uma meta e atualize o valor guardado para acompanhar o progresso.</div>}
            </article>

            <article className="panel planning-panel recurring-panel" id="recorrencias">
              <div className="panel-heading"><div><div className="eyebrow">DESPESAS PROGRAMADAS</div><h2>Recorrências mensais</h2><p>Registre despesas recorrentes no mês selecionado</p></div><button className="button button-outline compact-button" onClick={() => openPlanningEditor('recurring')}>Nova recorrência</button></div>
              {recurringRows.length ? <div className="recurring-list">{recurringRows.map(item => {
                const recurringDate = dateForMonthDay(month, item.dia_vencimento);
                const alreadyLaunched = rows.some(row => row.recorrencia_id === item.id && row.data === recurringDate);
                return <div className={`recurring-item ${item.ativo ? '' : 'recurring-paused'}`} key={item.id}>
                <div className="recurring-detail"><strong>{item.descricao}</strong><span>{item.categoria} · vence dia {item.dia_vencimento}</span></div>
                <strong className="recurring-value">{money.format(Number(item.valor))}</strong>
                <div className="recurring-actions"><button className="button button-outline compact-button" onClick={() => launchRecurring(item)} disabled={!item.ativo || alreadyLaunched || busy || previewMode}>{previewMode ? 'Somente leitura' : alreadyLaunched ? 'Já lançada neste mês' : 'Lançar no mês'}</button>{!previewMode && <><button className="text-action" onClick={() => openPlanningEditor('recurring', item)}>Editar</button><button className="text-action" onClick={() => toggleRecurring(item)}>{item.ativo ? 'Pausar' : 'Ativar'}</button></>}</div>
              </div>})}</div> : <div className="planning-empty">Cadastre despesas mensais para lançá-las com a data de vencimento.</div>}
            </article>
          </section>

          <section className="panel transactions-panel" id="movimentacoes">
            <div className="panel-heading transaction-heading"><div><div className="eyebrow">ACOMPANHAMENTO DE PERTO</div><h2>Movimentações</h2><p>{currentRows.length} {currentRows.length === 1 ? 'registro' : 'registros'} em {monthLabel(month)}</p></div><div className="table-actions"><button className="button button-outline export-button" onClick={() => exportCsv(visibleRows)} disabled={!visibleRows.length}><Icon name="download" size={16} />Exportar CSV</button></div></div>
            <div className="table-toolbar"><label className="search-field"><Icon name="search" size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar movimentação" aria-label="Buscar movimentação" /></label><label className="filter-select"><Icon name="filter" size={16} /><select value={kindFilter} onChange={event => setKindFilter(event.target.value)} aria-label="Filtrar tipo"><option value="todos">Todos os tipos</option><option value="receita">Receitas</option><option value="despesa">Despesas</option></select></label><label className="filter-select category-filter"><select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} aria-label="Filtrar categoria"><option value="todas">Todas as categorias</option>{[...new Set(rows.map(row => row.categoria))].sort().map(category => <option key={category}>{category}</option>)}</select></label></div>
            <div className="table-scroll"><table><thead><tr><th>DESCRIÇÃO</th><th>DATA</th><th>CATEGORIA</th><th>TIPO</th><th className="amount-head">VALOR</th><th aria-label="Ações" /></tr></thead><tbody>
              {visibleRows.slice(0, 8).map(row => <tr key={row.id}><td><div className="transaction-name"><span className={`transaction-symbol ${row.tipo}`}><Icon name={row.tipo === 'receita' ? 'arrowDown' : 'arrowUp'} size={15} /></span><span>{row.descricao}</span></div></td><td className="date-cell">{dateName.format(new Date(`${row.data}T12:00:00`))}</td><td><span className="category-pill">{row.categoria}</span></td><td><span className={`type-label ${row.tipo}`}>{row.tipo === 'receita' ? 'Receita' : 'Despesa'}</span></td><td className={`amount-cell ${row.tipo}`}>{row.tipo === 'despesa' ? '− ' : '+ '}{money.format(Number(row.valor))}</td><td>{!previewMode && <div className="row-actions"><button className="icon-button" title="Editar" aria-label={`Editar ${row.descricao}`} onClick={() => { setEditing(row); setCategoryValue(row.categoria); setSuggestedCategory(''); setModal('movement'); }}><Icon name="pencil" size={15} /></button><button className="icon-button delete-action" title="Excluir" aria-label={`Excluir ${row.descricao}`} onClick={() => deleteMovement(row.id)}><Icon name="trash" size={15} /></button></div>}</td></tr>)}
              {!loading && !visibleRows.length && <tr><td colSpan="6"><div className="empty-state"><span className="empty-illustration"><Icon name="receipt" size={24} /></span><strong>{rows.length ? 'Nenhum resultado por aqui' : 'Sua história começa com um registro'}</strong><p>{rows.length ? 'Ajuste os filtros ou escolha outro mês.' : 'Adicione uma movimentação ou carregue a amostra fictícia para conhecer a dashboard.'}</p>{!rows.length && <button className="button button-outline" onClick={loadDemo} disabled={busy}>Carregar amostra fictícia</button>}</div></td></tr>}
              {loading && <tr><td colSpan="6"><div className="table-loading">Carregando seus registros…</div></td></tr>}
            </tbody></table></div>
            {visibleRows.length > 8 && <div className="table-footer">Mostrando 8 de {visibleRows.length} registros<span>Use os filtros para refinar a lista.</span></div>}
          </section>

          <section className="panel conclusions-panel">
            <div className="panel-heading"><div><div className="eyebrow">LEITURAS BASEADAS NOS SEUS REGISTROS</div><h2>Conclusões do período</h2><p>{periodMessage}. Valores refletem os filtros selecionados.</p></div><span className="panel-period">{Math.min(insights.length, 5)} PONTOS</span></div>
            {insights.length ? <div className="conclusion-list">{insights.slice(0, 5).map((insight, index) => <article className="conclusion-item" key={insight.label}><span className="conclusion-index">{String(index + 1).padStart(2, '0')}</span><div><strong>{insight.label}</strong><p>{insight.text}</p></div></article>)}</div> : <div className="planning-empty">Registre movimentações para gerar conclusões. Nenhum padrão é exibido sem dados suficientes.</div>}
            {insights.length > 0 && insights.length < 3 && <p className="conclusion-caveat">Há poucos registros para produzir três conclusões sem extrapolar os dados.</p>}
          </section>
          <footer className="app-footer"><span>CoinPulse · Clareza para suas finanças</span><span>Seus dados são privados e isolados por conta.</span></footer>
        </div>
      </main>

      {modal === 'movement' && <Modal title={editing ? 'Editar movimentação' : 'Nova movimentação'} onClose={() => { setModal(''); setEditing(null); setCategoryValue(''); setSuggestedCategory(''); }}>
        <form className="movement-form" onSubmit={saveMovement}>
          <label>Tipo<div className="type-toggle"><label><input name="tipo" type="radio" value="despesa" defaultChecked={editing ? editing.tipo === 'despesa' : true} /><span>Despesa</span></label><label><input name="tipo" type="radio" value="receita" defaultChecked={editing?.tipo === 'receita'} /><span>Receita</span></label></div></label>
          <div className="form-row"><label>Valor<input name="valor" type="number" min="0.01" step="0.01" placeholder="0,00" defaultValue={editing ? Number(editing.valor).toFixed(2) : ''} required /></label><label>Data<input name="data" type="date" defaultValue={editing?.data || new Date().toISOString().slice(0, 10)} required /></label></div>
          <label>Descrição<input name="descricao" type="text" placeholder="Ex.: supermercado" defaultValue={editing?.descricao || ''} maxLength="120" onChange={event => setSuggestedCategory(suggestCategory(event.target.value))} required /></label>
          <label>Categoria<input name="categoria" type="text" list="category-options" placeholder="Selecione ou digite" value={categoryValue} onChange={event => setCategoryValue(event.target.value)} maxLength="60" required />{suggestedCategory && suggestedCategory !== categoryValue && <button type="button" className="suggestion-chip" onClick={() => setCategoryValue(suggestedCategory)}>Sugestão: usar {suggestedCategory}</button>}<datalist id="category-options">{categories.map(category => <option key={category} value={category} />)}</datalist></label>
          <div className="modal-actions"><button type="button" className="button button-outline" onClick={() => { setModal(''); setEditing(null); setCategoryValue(''); setSuggestedCategory(''); }}>Cancelar</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Salvando…' : editing ? 'Salvar alterações' : 'Adicionar registro'}</button></div>
        </form>
      </Modal>}

      {modal === 'import' && <Modal title="Importar movimentações" onClose={() => { setModal(''); setImportData(null); }} wide>
        <div className="import-content">
          <p className="muted">Selecione um CSV em UTF-8, separado por vírgulas. O cabeçalho precisa conter <code>data,descricao,valor,tipo,categoria</code>.</p>
          <label className="file-drop"><input type="file" accept=".csv,text/csv" onChange={async event => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 2 * 1024 * 1024) { setImportData({ valid: [], errors: ['O arquivo deve ter até 2 MB.'] }); return; } const parsed = parseCsv(await file.text()); setImportData(parsed); }} /><span className="file-icon"><Icon name="upload" size={21} /></span><strong>Escolha um arquivo CSV</strong><span>ou arraste o arquivo para cá · até 2 MB e 500 linhas</span></label>
          {importData && <div className="import-summary"><strong>{importData.valid.length} linhas prontas para revisar</strong>{importData.errors.length > 0 && <div className="import-errors">{importData.errors.slice(0, 5).map((error, index) => <div key={index}>{error}</div>)}{importData.errors.length > 5 && <div>e mais {importData.errors.length - 5} avisos</div>}</div>}{importData.valid.length > 0 && <p>{importData.valid.filter(candidate => rows.some(existing => existing.data === candidate.data && existing.descricao === candidate.descricao && Number(existing.valor) === candidate.valor && existing.tipo === candidate.tipo && existing.categoria === candidate.categoria)).length} possíveis duplicatas encontradas. Revise antes de confirmar; elas não serão removidas automaticamente.</p>}</div>}
          <div className="modal-actions"><button className="button button-outline" onClick={() => { setModal(''); setImportData(null); }}>Cancelar</button><button className="button button-primary" onClick={importCsv} disabled={!importData?.valid?.length || busy}>{busy ? 'Importando…' : `Importar ${importData?.valid?.length || ''} registros`}</button></div>
        </div>
      </Modal>}
      {modal === 'budget' && <Modal title={planningEditing ? 'Editar limite mensal' : 'Definir orçamento'} onClose={() => { setModal(''); setPlanningEditing(null); }}>
        <form className="movement-form" onSubmit={saveBudget}>
          <p className="muted form-context">Limite para {monthLabel(month)}.</p>
          <label>Categoria<input name="categoria" type="text" list="budget-category-options" placeholder="Selecione ou digite" defaultValue={planningEditing?.categoria || ''} maxLength="60" required /><datalist id="budget-category-options">{categories.map(category => <option key={category} value={category} />)}</datalist></label>
          <label>Limite mensal<input name="limite" type="number" min="0.01" step="0.01" placeholder="0,00" defaultValue={planningEditing ? Number(planningEditing.limite).toFixed(2) : ''} required /></label>
          <div className="modal-actions"><button type="button" className="button button-outline" onClick={() => { setModal(''); setPlanningEditing(null); }}>Cancelar</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar limite'}</button></div>
        </form>
      </Modal>}
      {modal === 'goal' && <Modal title={planningEditing ? 'Atualizar meta de economia' : 'Nova meta de economia'} onClose={() => { setModal(''); setPlanningEditing(null); }}>
        <form className="movement-form" onSubmit={saveGoal}>
          <label>Nome da meta<input name="nome" type="text" placeholder="Ex.: Reserva de emergência" defaultValue={planningEditing?.nome || ''} maxLength="80" required /></label>
          <div className="form-row"><label>Valor alvo<input name="valor_alvo" type="number" min="0.01" step="0.01" placeholder="0,00" defaultValue={planningEditing ? Number(planningEditing.valor_alvo).toFixed(2) : ''} required /></label><label>Valor guardado<input name="valor_atual" type="number" min="0" step="0.01" placeholder="0,00" defaultValue={planningEditing ? Number(planningEditing.valor_atual).toFixed(2) : '0.00'} required /></label></div>
          <label>Data limite <span className="optional-label">opcional</span><input name="data_limite" type="date" defaultValue={planningEditing?.data_limite || ''} /></label>
          <div className="modal-actions"><button type="button" className="button button-outline" onClick={() => { setModal(''); setPlanningEditing(null); }}>Cancelar</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar meta'}</button></div>
        </form>
      </Modal>}
      {modal === 'recurring' && <Modal title={planningEditing ? 'Editar despesa recorrente' : 'Nova despesa recorrente'} onClose={() => { setModal(''); setPlanningEditing(null); }}>
        <form className="movement-form" onSubmit={saveRecurring}>
          <label>Descrição<input name="descricao" type="text" placeholder="Ex.: aluguel" defaultValue={planningEditing?.descricao || ''} maxLength="120" required /></label>
          <div className="form-row"><label>Valor mensal<input name="valor" type="number" min="0.01" step="0.01" placeholder="0,00" defaultValue={planningEditing ? Number(planningEditing.valor).toFixed(2) : ''} required /></label><label>Dia de vencimento<input name="dia_vencimento" type="number" min="1" max="31" step="1" defaultValue={planningEditing?.dia_vencimento || 1} required /></label></div>
          <label>Categoria<input name="categoria" type="text" list="recurring-category-options" placeholder="Selecione ou digite" defaultValue={planningEditing?.categoria || ''} maxLength="60" required /><datalist id="recurring-category-options">{categories.map(category => <option key={category} value={category} />)}</datalist></label>
          <p className="muted form-context">O lançamento é criado apenas quando você selecionar “Lançar no mês”.</p>
          <div className="modal-actions"><button type="button" className="button button-outline" onClick={() => { setModal(''); setPlanningEditing(null); }}>Cancelar</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar recorrência'}</button></div>
        </form>
      </Modal>}
      {toast && <div className="toast-message" role="status">{toast}</div>}
    </div>
  );
}

function MetricCard({ title, value, note, icon, tone, trend, loading }) {
  const positive = trend !== undefined && trend !== null && trend <= 0;
  return <article className="metric-card"><div className="metric-top"><span>{title}</span><span className={`metric-icon ${tone}`}><Icon name={icon} size={17} /></span></div><strong className={`metric-value ${tone === 'dark' ? 'balance-value' : ''}`}>{loading ? <span className="loading-skeleton" role="status" aria-label="Carregando indicador" /> : value}</strong><div className="metric-note">{trend !== undefined && trend !== null && !loading && <span className={`trend-dot ${positive ? 'good' : 'bad'}`}>{positive ? '↓' : '↑'}</span>}{loading ? 'Carregando…' : note}</div><span className={`metric-accent ${tone}`} /></article>;
}
