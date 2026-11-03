import test from 'node:test';
import assert from 'node:assert/strict';
import {
  localToday, validDate, monthShift, dateInMonth, effectiveDate, monthlySummary,
  equivalentComparison, budgetStatuses, goalPlan, paginateTransactions,
  parseImportCsv, suggestRuleCategory, buildInstallments, accountBalance, cardInvoices, cardDueDate,
} from '../lib/finance.mjs';

const transaction = (overrides = {}) => ({ data: '2026-11-02', descricao: 'Mercado', valor: 100, tipo: 'despesa', categoria: 'Supermercado', ...overrides });

test('calendar helpers respect local timezone, year rollover and leap days', () => {
  assert.equal(localToday(new Date('2026-11-03T01:30:00Z')), '2026-11-02');
  assert.equal(monthShift('2026-01', -1), '2025-12');
  assert.equal(monthShift('2026-12', 1), '2027-01');
  assert.equal(dateInMonth('2028-02', 31), '2028-02-29');
  assert.equal(dateInMonth('2026-02', 31), '2026-02-28');
  assert.equal(validDate('2026-02-29'), false);
  assert.equal(validDate('2028-02-29'), true);
  assert.equal(validDate('2026-13-01'), false);
  assert.equal(validDate('0000-01-01'), false);
});

test('monthly accounting separates paid and planned entries and uses settlement dates', () => {
  const rows = [
    transaction({ tipo: 'receita', valor: '1000.10' }),
    transaction({ valor: '0.20' }),
    transaction({ valor: '0.10' }),
    transaction({ data: '2026-10-30', data_pagamento: '2026-11-01', valor: 50, status: 'realizado' }),
    transaction({ data: '2026-11-05', valor: 200, status: 'pendente' }),
    transaction({ data: '2026-11-01', tipo: 'receita', valor: 300, status: 'pendente' }),
    transaction({ data: '2026-12-01', valor: 9999, status: 'pendente' }),
  ];
  const result = monthlySummary(rows, '2026-11', '2026-11-02');
  assert.equal(result.income, 1000.10);
  assert.equal(result.expense, 50.30);
  assert.equal(result.balance, 949.80);
  assert.equal(result.pendingIncome, 300);
  assert.equal(result.pendingExpense, 200);
  assert.equal(result.expectedBalance, 1049.80);
  assert.equal(result.overdueIncome, 300);
  assert.equal(result.overdueExpense, 0);
  assert.equal(effectiveDate(rows[3]), '2026-11-01');
  assert.equal(monthlySummary(rows, '2026-10').expense, 0);
});

test('current month comparison cuts both periods at equivalent days and ignores pending', () => {
  const rows = [
    transaction({ data: '2026-11-01', valor: 90 }),
    transaction({ data: '2026-11-03', valor: 200 }),
    transaction({ data: '2026-10-02', valor: 100 }),
    transaction({ data: '2026-10-03', valor: 800 }),
    transaction({ data: '2026-11-01', valor: 9999, status: 'pendente' }),
  ];
  const result = equivalentComparison(rows, '2026-11', '2026-11-02');
  assert.equal(result.previousEnd, '2026-10-02');
  assert.equal(result.currentExpense, 90);
  assert.equal(result.previousExpense, 100);
  assert.equal(result.change, -10);
  assert.equal(result.partial, true);
  assert.equal(equivalentComparison(rows, '2026-12', '2026-11-02').change, null);
  assert.equal(equivalentComparison(rows, '2026-10', '2026-11-02').currentEnd, '2026-10-31');
  assert.equal(equivalentComparison([], '2026-11', '2026-11-02').change, null);
  assert.equal(equivalentComparison([], '2028-03', '2028-03-31').previousEnd, '2028-02-29');
});

test('budget alerts include exact thresholds, settled expenses and full unfiltered records', () => {
  const budgets = [{ mes: '2026-11-01', categoria: 'Supermercado', limite: 100 }];
  assert.equal(budgetStatuses(budgets, [transaction({ valor: 80 })], '2026-11')[0].level, 'warning');
  const result = budgetStatuses(budgets, [transaction({ valor: 70 }), transaction({ valor: 30 }), transaction({ valor: 500, status: 'pendente' })], '2026-11')[0];
  assert.equal(result.level, 'exceeded');
  assert.equal(result.spent, 100);
  assert.equal(result.remaining, 0);
  assert.equal(budgetStatuses(budgets, [], '2026-12').length, 0);
});

test('goals use only linked actual contributions and report deadline planning explicitly', () => {
  const goal = { id: 'reserve', valor_alvo: 1000, valor_atual: 100, data_limite: '2027-01-31' };
  const result = goalPlan(goal, [transaction({ meta_id: 'reserve', valor: 100 }), transaction({ meta_id: 'reserve', valor: 300, status: 'pendente' }), transaction({ meta_id: 'reserve', valor: 700, tipo: 'receita' })], '2026-11-02');
  assert.equal(result.current, 200);
  assert.equal(result.remaining, 800);
  assert.equal(result.months, 3);
  assert.equal(result.monthlyAmount, 266.67);
  assert.equal(goalPlan({ ...goal, data_limite: '2026-10-31' }, [], '2026-11-02').overdue, true);
  assert.equal(goalPlan({ ...goal, data_limite: null }, []).monthlyAmount, null);
  assert.equal(goalPlan({ ...goal, valor_atual: 1100 }, []).remaining, 0);
});

test('pagination gives access to every transaction and clamps stale page after filtering', () => {
  const rows = Array.from({ length: 23 }, (_, index) => transaction({ id: index, valor: 23 - index }));
  const pages = [1, 2, 3].flatMap(page => paginateTransactions(rows, { page, pageSize: 10, sort: 'valor_asc' }).rows);
  assert.equal(new Set(pages.map(row => row.id)).size, 23);
  assert.equal(pages[0].valor, 1);
  assert.equal(pages.at(-1).valor, 23);
  assert.equal(paginateTransactions(rows.slice(0, 1), { page: 3 }).page, 1);
  assert.deepEqual(paginateTransactions([], { page: 10 }).rows, []);
  assert.equal(paginateTransactions(rows, { pageSize: -1 }).pageSize, 1);
});

test('installments preserve every cent and the original due day across short months', () => {
  const rows = buildInstallments(transaction({ data: '2028-01-31', valor: 100, status: 'pendente', grupo_parcelamento: 'group' }), 3);
  assert.deepEqual(rows.map(row => row.valor), [33.34, 33.33, 33.33]);
  assert.deepEqual(rows.map(row => row.data), ['2028-01-31', '2028-02-29', '2028-03-31']);
  assert.deepEqual(rows.map(row => row.parcela_numero), [1, 2, 3]);
  assert.equal(rows.reduce((total, row) => total + Math.round(row.valor * 100), 0), 10000);
  assert.equal(rows.every(row => row.grupo_parcelamento === 'group'), true);
  assert.throws(() => buildInstallments(transaction({ valor: 0.01 }), 2));
  assert.throws(() => buildInstallments(transaction(), 121));
  assert.throws(() => buildInstallments(transaction({ data: '2026-02-30' }), 2));
});

test('account balances include separate transfers without creating income/expense', () => {
  const account = { id: 'bank', saldo_inicial: 1000, data_saldo_inicial: '2026-11-01' };
  const rows = [transaction({ conta_id: 'bank', data: '2026-10-31', valor: 999 }), transaction({ conta_id: 'bank', valor: 100 }), transaction({ conta_id: 'bank', valor: 300, status: 'pendente' }), transaction({ conta_id: 'wallet', valor: 500 })];
  const transfers = [{ origem_id: 'bank', destino_id: 'wallet', data: '2026-11-02', valor: 200 }, { origem_id: 'wallet', destino_id: 'bank', data: '2026-11-03', valor: 50 }];
  assert.equal(accountBalance(account, rows, transfers, '2026-11-02'), 700);
  assert.equal(accountBalance(account, rows, transfers, '2026-11-03'), 750);
  assert.equal(accountBalance(account, rows, transfers, '2026-10-31'), 0);
  assert.equal(monthlySummary(rows, '2026-11').income, 0);
});

test('card invoice month comes from due date and settlement does not change its invoice', () => {
  const card = { id: 'card', dia_fechamento: 25, dia_vencimento: 5 };
  assert.equal(cardDueDate(card, '2026-11-24'), '2026-12-05');
  assert.equal(cardDueDate(card, '2026-11-26'), '2027-01-05');
  assert.equal(cardDueDate({ ...card, dia_fechamento: 10, dia_vencimento: 20 }, '2026-11-10'), '2026-11-20');
  const result = cardInvoices(card, [transaction({ cartao_id: 'card', data: '2026-12-05', valor: 100, status: 'pendente' }), transaction({ cartao_id: 'card', data: '2026-12-05', data_pagamento: '2027-01-01', valor: 50 })]);
  assert.equal(result[0].month, '2026-12');
  assert.equal(result[0].total, 150);
  assert.equal(result[0].pending, 100);
  assert.equal(result[0].realized, 50);
});

test('CSV imports Brazilian date/money and escaped descriptions with automatic column aliases', () => {
  const csv = '\uFEFFData;Histórico;Valor;Tipo;Categoria\r\n02/11/2026;"Mercado; loja ""A""";"R$ 1.234,56";débito;Supermercado';
  const result = parseImportCsv(csv);
  assert.equal(result.delimiter, ';');
  assert.equal(result.errors.length, 0);
  assert.equal(result.valid[0].valor, 1234.56);
  assert.equal(result.valid[0].data, '2026-11-02');
  assert.equal(result.valid[0].descricao, 'Mercado; loja "A"');
  assert.equal(result.items[0].selected, true);
  assert.equal(result.mapping.descricao, 'Histórico');
});

test('CSV duplicate review includes file duplicates and existing entries despite category changes', () => {
  const csv = 'data,descricao,valor,tipo,categoria\n2026-11-02,Mercado,100.00,despesa,Outros\n2026-11-02,Café,5.00,despesa,Lazer\n2026-11-02,Café,5.00,despesa,Restaurantes';
  const result = parseImportCsv(csv, { existingRows: [transaction()] });
  assert.deepEqual(result.items.map(item => item.duplicate), [true, false, true]);
  assert.deepEqual(result.items.map(item => item.selected), [false, true, false]);
  assert.equal(result.valid.length, 3);
});

test('CSV preserves paid state and can reuse a supplied mapping with custom category rules', () => {
  const rules = [{ termo: 'UBER', tipo: 'despesa', categoria: 'Transporte' }];
  const csv = 'Quando;Texto;Dinheiro;status;data_pagamento\n2026-11-02;Uber corrida;-23,45;pendente;';
  const options = { mapping: { data: 'Quando', descricao: 'Texto', valor: 'Dinheiro' }, rules };
  const result = parseImportCsv(csv, options);
  assert.equal(result.errors.length, 0);
  assert.equal(result.valid[0].tipo, 'despesa');
  assert.equal(result.valid[0].categoria, 'Transporte');
  assert.equal(result.valid[0].valor, 23.45);
  assert.equal(result.valid[0].status, 'pendente');
  assert.equal(parseImportCsv('data,descricao,valor,tipo,categoria,status,data_pagamento\n2026-11-01,Aluguel,100.00,despesa,Moradia,pago,02/11/2026').valid[0].data_pagamento, '2026-11-02');
  assert.equal(suggestRuleCategory('  UBER corrida ', 'receita', rules), '');
});

test('CSV reports per-row errors, rejects malformed files and enforces maximum rows', () => {
  const csv = 'data,descricao,valor,tipo,categoria,status,data_pagamento\n2026-02-30,Teste,10.00,despesa,Outros,realizado,\n2026-11-02,Teste,1.2345,despesa,Outros,realizado,\n2026-11-02,Teste,10.00,despesa,Outros,pendente,2026-11-02';
  const result = parseImportCsv(csv);
  assert.equal(result.valid.length, 0);
  assert.equal(result.items.every(item => !item.selected), true);
  assert.equal(result.errors.some(error => error.startsWith('Linha 2:')), true);
  assert.equal(parseImportCsv('data,descricao,valor\n2026-11-02,"Test,10').valid.length, 0);
  assert.equal(parseImportCsv('').errors[0], 'O arquivo está vazio.');
  const large = 'data,descricao,valor\n' + Array.from({ length: 501 }, () => '2026-11-02,Item,1').join('\n');
  assert.equal(parseImportCsv(large).items.length, 0);
  assert.equal(parseImportCsv(large).errors[0], 'Importe até 500 linhas por arquivo.');
});

test('future confirmations never inflate realized totals, comparisons or goals', () => {
  const future = transaction({ data: '2026-11-10', valor: 500, meta_id: 'reserve', status: 'realizado' });
  assert.equal(monthlySummary([future], '2026-11', '2026-11-02').expense, 0);
  assert.equal(equivalentComparison([future], '2026-12', '2026-11-02').previousExpense, 0);
  assert.equal(goalPlan({ id: 'reserve', valor_alvo: 1000, valor_atual: 100 }, [future], '2026-11-02').current, 100);
  const csv = 'data,descricao,valor,tipo,status\n2026-11-10,Future,10,despesa,realizado';
  const parsed = parseImportCsv(csv, { today: '2026-11-02' });
  assert.equal(parsed.valid.length, 0);
  assert.equal(parsed.items[0].selected, false);
});

test('specific category rules win and optional CSV mappings can be explicitly ignored', () => {
  const rules = [{ termo: 'uber', tipo: 'despesa', categoria: 'Transporte' }, { termo: 'uber eats', tipo: 'despesa', categoria: 'Restaurantes' }];
  assert.equal(suggestRuleCategory('Uber Eats pedido', 'despesa', rules), 'Restaurantes');
  const csv = 'data,descricao,valor,tipo,categoria\n2026-11-02,Uber Eats,-10,invalid,Outros';
  const result = parseImportCsv(csv, { mapping: { tipo: '', categoria: '' }, rules, today: '2026-11-02' });
  assert.equal(result.errors.length, 0);
  assert.equal(result.valid[0].tipo, 'despesa');
  assert.equal(result.valid[0].categoria, 'Restaurantes');
});
