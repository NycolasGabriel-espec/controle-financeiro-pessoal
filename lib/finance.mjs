// Shared financial rules. Dates are calendar dates; money is summed in integer cents.
export const cents = value => Math.round(Number(value || 0) * 100);
export const moneyValue = value => value / 100;
export const isRealized = row => !row.status || row.status === 'realizado';
export const effectiveDate = row => isRealized(row) ? (row.data_pagamento || row.data) : row.data;
const sum = rows => moneyValue(rows.reduce((total, row) => total + cents(row.valor), 0));
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function localToday(now = new Date(), timeZone = 'America/Maceio') {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const value = type => parts.find(part => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function validDate(value) {
  if (!ISO_DATE.test(String(value))) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.valueOf()) && parsed.getUTCFullYear() === year && parsed.getUTCMonth() + 1 === month && parsed.getUTCDate() === day;
}

export function monthShift(month, amount) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function dateInMonth(month, day) {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return `${month}-${String(Math.max(1, Math.min(Number(day), lastDay))).padStart(2, '0')}`;
}

export function monthlySummary(rows, month, today = localToday()) {
  const realizedRows = rows.filter(row => isRealized(row) && effectiveDate(row) <= today && String(effectiveDate(row)).slice(0, 7) === month);
  const pendingRows = rows.filter(row => !isRealized(row) && String(row.data).slice(0, 7) === month);
  const income = sum(realizedRows.filter(row => row.tipo === 'receita'));
  const expense = sum(realizedRows.filter(row => row.tipo === 'despesa'));
  const pendingIncome = sum(pendingRows.filter(row => row.tipo === 'receita'));
  const pendingExpense = sum(pendingRows.filter(row => row.tipo === 'despesa'));
  const overdue = pendingRows.filter(row => row.data < today);
  return {
    income, expense, balance: moneyValue(cents(income) - cents(expense)), pendingIncome, pendingExpense,
    expectedBalance: moneyValue(cents(income) - cents(expense) + cents(pendingIncome) - cents(pendingExpense)),
    overdueIncome: sum(overdue.filter(row => row.tipo === 'receita')),
    overdueExpense: sum(overdue.filter(row => row.tipo === 'despesa')),
    realizedRows, pendingRows,
  };
}

export function equivalentComparison(rows, month, today = localToday()) {
  const currentMonth = today.slice(0, 7);
  const partial = month === currentMonth;
  const future = month > currentMonth;
  const previousMonth = monthShift(month, -1);
  const currentStart = `${month}-01`;
  const previousStart = `${previousMonth}-01`;
  const currentEnd = partial ? today : dateInMonth(month, 31);
  const previousEnd = dateInMonth(previousMonth, partial ? Number(today.slice(-2)) : 31);
  const inPeriod = (start, end) => rows.filter(row => isRealized(row) && effectiveDate(row) <= today && effectiveDate(row) >= start && effectiveDate(row) <= end);
  const currentRows = inPeriod(currentStart, currentEnd);
  const previousRows = inPeriod(previousStart, previousEnd);
  const currentExpense = sum(currentRows.filter(row => row.tipo === 'despesa'));
  const previousExpense = sum(previousRows.filter(row => row.tipo === 'despesa'));
  return {
    currentStart, currentEnd, previousStart, previousEnd, currentExpense, previousExpense,
    change: !future && previousExpense > 0 ? (currentExpense - previousExpense) / previousExpense * 100 : null,
    partial, future, currentRows, previousRows,
  };
}

export function budgetStatuses(budgets, allRows, month) {
  const expenses = monthlySummary(allRows, month).realizedRows.filter(row => row.tipo === 'despesa');
  return budgets.filter(budget => String(budget.mes).slice(0, 7) === month).map(budget => {
    const spent = sum(expenses.filter(row => row.categoria === budget.categoria));
    const limit = Number(budget.limite);
    const percentage = limit > 0 ? spent / limit * 100 : 0;
    return { ...budget, spent, percentage, remaining: moneyValue(cents(limit) - cents(spent)), level: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'ok' };
  });
}

export function goalPlan(goal, rows = [], today = localToday()) {
  const contributions = sum(rows.filter(row => row.meta_id === goal.id && row.tipo === 'despesa' && isRealized(row) && effectiveDate(row) <= today));
  const current = moneyValue(cents(goal.valor_atual) + cents(contributions));
  const remaining = Math.max(0, moneyValue(cents(goal.valor_alvo) - cents(current)));
  const completed = remaining === 0;
  const overdue = !completed && Boolean(goal.data_limite && goal.data_limite < today);
  let months = null;
  if (goal.data_limite && !overdue) {
    const [year, month] = today.slice(0, 7).split('-').map(Number);
    const [endYear, endMonth] = goal.data_limite.slice(0, 7).split('-').map(Number);
    months = (endYear - year) * 12 + endMonth - month + 1;
  }
  return { current, remaining, contributions, months, monthlyAmount: completed ? 0 : months ? Math.ceil(cents(remaining) / months) / 100 : null, overdue, completed };
}

export function paginateTransactions(rows, { page = 1, pageSize = 10, sort = 'data_desc' } = {}) {
  const separator = sort.lastIndexOf('_');
  const field = ['valor', 'data', 'descricao'].includes(sort.slice(0, separator)) ? sort.slice(0, separator) : 'data';
  const direction = sort.slice(separator + 1) === 'asc' ? 1 : -1;
  const sorted = rows.map((row, index) => ({ row, index })).sort((a, b) => {
    const left = field === 'data' ? effectiveDate(a.row) : a.row[field];
    const right = field === 'data' ? effectiveDate(b.row) : b.row[field];
    const difference = field === 'valor' ? Number(left) - Number(right) : String(left).localeCompare(String(right), 'pt-BR');
    return difference * direction || a.index - b.index;
  }).map(item => item.row);
  const safeSize = Math.max(1, Math.min(100, Math.trunc(Number(pageSize)) || 10));
  const totalPages = Math.max(1, Math.ceil(sorted.length / safeSize));
  const safePage = Math.max(1, Math.min(totalPages, Math.trunc(Number(page)) || 1));
  return { rows: sorted.slice((safePage - 1) * safeSize, safePage * safeSize), page: safePage, pageSize: safeSize, total: sorted.length, totalPages };
}

export function suggestRuleCategory(description, type, rules = []) {
  const text = normalize(description);
  return rules.filter(rule => rule.ativo !== false && rule.tipo === type && normalize(rule.termo))
    .sort((a, b) => normalize(b.termo).length - normalize(a.termo).length)
    .find(rule => text.includes(normalize(rule.termo)))?.categoria || '';
}

export function buildInstallments(record, count) {
  const total = cents(record.valor);
  const number = Number(count);
  if (!validDate(record.data) || !Number.isInteger(number) || number < 1 || number > 120 || total < number || !Number.isSafeInteger(total)) {
    throw new Error('Informe uma data válida, valor positivo e entre 1 e 120 parcelas de pelo menos um centavo.');
  }
  const base = Math.floor(total / number);
  const remainder = total % number;
  return Array.from({ length: number }, (_, index) => ({
    ...record,
    data: dateInMonth(monthShift(record.data.slice(0, 7), index), Number(record.data.slice(-2))),
    valor: moneyValue(base + (index < remainder ? 1 : 0)),
    ...(number > 1 ? { parcela_numero: index + 1, parcela_total: number } : {}),
  }));
}

export function accountBalance(account, rows = [], transfers = [], asOf = localToday()) {
  const start = account.data_saldo_inicial || '0000-01-01';
  if (start > asOf) return 0;
  let total = cents(account.saldo_inicial);
  for (const row of rows) {
    const date = effectiveDate(row);
    if (row.conta_id === account.id && isRealized(row) && date >= start && date <= asOf) total += cents(row.valor) * (row.tipo === 'receita' ? 1 : -1);
  }
  for (const transfer of transfers) {
    if (transfer.data < start || transfer.data > asOf) continue;
    if (transfer.origem_id === account.id) total -= cents(transfer.valor);
    if (transfer.destino_id === account.id) total += cents(transfer.valor);
  }
  return moneyValue(total);
}

// Transactions store their invoice due date in `data`, including each installment.
export function cardInvoices(card, rows = []) {
  const invoices = new Map();
  for (const row of rows.filter(item => item.cartao_id === card.id && item.tipo === 'despesa')) {
    const month = row.data.slice(0, 7);
    if (!invoices.has(month)) invoices.set(month, []);
    invoices.get(month).push(row);
  }
  return [...invoices.entries()].map(([month, items]) => ({ month, total: sum(items), pending: sum(items.filter(row => !isRealized(row))), realized: sum(items.filter(isRealized)), rows: items })).sort((a, b) => b.month.localeCompare(a.month));
}

export function cardDueDate(card, purchaseDate) {
  if (!validDate(purchaseDate)) throw new Error('Data da compra inválida.');
  const close = Number(card.dia_fechamento);
  const due = Number(card.dia_vencimento);
  if (![close, due].every(day => Number.isInteger(day) && day >= 1 && day <= 31)) throw new Error('Dias do cartão inválidos.');
  let month = purchaseDate.slice(0, 7);
  if (purchaseDate > dateInMonth(month, close)) month = monthShift(month, 1);
  if (due <= close) month = monthShift(month, 1);
  return dateInMonth(month, due);
}

const headerAliases = {
  data: ['data', 'date', 'data vencimento', 'vencimento', 'data da movimentacao', 'data lancamento'],
  descricao: ['descricao', 'description', 'historico', 'lancamento', 'detalhes', 'memo'],
  valor: ['valor', 'value', 'amount', 'montante'],
  tipo: ['tipo', 'type', 'natureza', 'entrada saida'],
  categoria: ['categoria', 'category'],
  status: ['status', 'situacao'],
  data_pagamento: ['data_pagamento', 'data pagamento', 'data de pagamento', 'data recebimento'],
};

function detectDelimiter(text) {
  const counts = { ',': 0, ';': 0 };
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') index += 1;
    else if (char === '"') quoted = !quoted;
    else if (!quoted && (char === '\n' || char === '\r')) break;
    else if (!quoted && char in counts) counts[char] += 1;
  }
  return counts[';'] > counts[','] ? ';' : ',';
}

function csvCells(text, delimiter) {
  const rows = [];
  let values = [], cell = '', quoted = false, line = 1, startLine = 1;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (!quoted && char === delimiter) { values.push(cell.trim()); cell = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      line += 1;
      if (quoted) cell += '\n';
      else {
        values.push(cell.trim());
        if (values.some(Boolean)) rows.push({ values, line: startLine });
        values = []; cell = ''; startLine = line;
      }
    } else cell += char;
  }
  values.push(cell.trim());
  if (values.some(Boolean)) rows.push({ values, line: startLine });
  return { rows, quoted };
}

function parseDate(value) {
  const text = String(value || '').trim();
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  const iso = match ? `${match[3]}-${match[2]}-${match[1]}` : text;
  return validDate(iso) ? iso : '';
}

function parseAmount(value) {
  const text = String(value || '').replace(/^R\$\s*/i, '').replace(/\s/g, '');
  if (/^-?\d{1,3}(?:\.\d{3})+,\d{1,2}$/.test(text) || /^-?\d+,\d{1,2}$/.test(text)) return Number(text.replaceAll('.', '').replace(',', '.'));
  if (/^-?\d+(?:\.\d{1,2})?$/.test(text)) return Number(text);
  return NaN;
}

function duplicateKey(record) {
  // Category changes do not make the same bank movement a distinct transaction.
  return [record.data, normalize(record.descricao), cents(record.valor), record.tipo].join('|');
}

export function parseImportCsv(input, { existingRows = [], mapping: requestedMapping = {}, rules = [], today = localToday() } = {}) {
  const text = String(input || '').replace(/^\uFEFF/, '');
  const delimiter = detectDelimiter(text);
  const parsed = csvCells(text, delimiter);
  const headers = parsed.rows[0]?.values || [];
  const mapping = {};
  const empty = errors => ({ headers, delimiter, mapping, valid: [], items: [], errors });
  if (!headers.length) return empty(['O arquivo está vazio.']);
  if (parsed.quoted) return empty(['O CSV contém aspas sem fechamento.']);
  if (parsed.rows.length - 1 > 500) return empty(['Importe até 500 linhas por arquivo.']);
  for (const [field, aliases] of Object.entries(headerAliases)) {
    const requested = requestedMapping[field];
    if (Object.hasOwn(requestedMapping, field) && requested === '') { mapping[field] = ''; continue; }
    let index = typeof requested === 'number' ? requested : requested ? headers.indexOf(requested) : -1;
    if (index < 0 || index >= headers.length) index = headers.findIndex(header => aliases.includes(normalize(header).replaceAll('_', ' ')));
    if (index >= 0) mapping[field] = headers[index];
  }
  const missing = ['data', 'descricao', 'valor'].filter(field => !mapping[field]);
  if (missing.length) return empty([`Mapeie as colunas obrigatórias: ${missing.join(', ')}.`]);
  const seen = new Set(existingRows.map(duplicateKey));
  const items = parsed.rows.slice(1).map(({ values, line }, index) => {
    const errors = [];
    const get = field => values[headers.indexOf(mapping[field])] || '';
    const data = parseDate(get('data'));
    const descricao = get('descricao').trim();
    const rawAmount = parseAmount(get('valor'));
    const suppliedType = normalize(get('tipo'));
    const typeAliases = { receita: 'receita', entrada: 'receita', credito: 'receita', credit: 'receita', despesa: 'despesa', saida: 'despesa', debito: 'despesa', debit: 'despesa' };
    const tipo = suppliedType ? typeAliases[suppliedType] : rawAmount < 0 ? 'despesa' : rawAmount > 0 ? 'receita' : '';
    const statusAliases = { realizado: 'realizado', pago: 'realizado', recebido: 'realizado', pendente: 'pendente', previsto: 'pendente' };
    const suppliedStatus = normalize(get('status'));
    const status = suppliedStatus ? statusAliases[suppliedStatus] : 'realizado';
    const data_pagamento = get('data_pagamento') ? parseDate(get('data_pagamento')) : null;
    const categoria = get('categoria').trim() || suggestRuleCategory(descricao, tipo, rules) || 'Outros';
    if (!data) errors.push('Data inválida; use AAAA-MM-DD ou DD/MM/AAAA.');
    if (!descricao || descricao.length > 120) errors.push('Descrição deve ter de 1 a 120 caracteres.');
    if (!Number.isFinite(rawAmount) || rawAmount === 0 || Math.abs(rawAmount) > 999999999999.99) errors.push('Valor deve ser diferente de zero, com até duas casas decimais.');
    if (!tipo) errors.push('Tipo inválido; use receita ou despesa.');
    if (suppliedType && rawAmount < 0 && tipo === 'receita') errors.push('Valor negativo conflita com tipo receita.');
    if (!status) errors.push('Status inválido; use realizado ou pendente.');
    if (get('data_pagamento') && !data_pagamento) errors.push('Data de pagamento inválida.');
    if (status === 'pendente' && data_pagamento) errors.push('Movimentações pendentes não podem ter data de pagamento.');
    if (status === 'realizado' && (data_pagamento || data) > today) errors.push('Pagamentos futuros devem ter status pendente.');
    if (categoria.length > 60) errors.push('Categoria deve ter até 60 caracteres.');
    if (values.length !== headers.length) errors.push('Quantidade de colunas diferente do cabeçalho.');
    const record = { data, descricao, valor: Math.abs(rawAmount), tipo, categoria, status, data_pagamento };
    const key = duplicateKey(record);
    const duplicate = errors.length === 0 && seen.has(key);
    if (!errors.length) seen.add(key);
    return { id: String(index + 1), line, record, errors, duplicate, selected: !errors.length && !duplicate };
  });
  return { headers, delimiter, mapping, valid: items.filter(item => !item.errors.length).map(item => item.record), items, errors: items.flatMap(item => item.errors.map(error => `Linha ${item.line}: ${error}`)) };
}

export const parseCsv = parseImportCsv;
