'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { accountBalance, cardInvoices, localToday } from '../../lib/finance.mjs';
import './accounts-panel.css';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateLabel = value => new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`));
const monthLabel = value => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(`${value}-01T12:00:00`));

function friendlyError(error) {
  if (error?.code === '23503') return 'Este item possui movimentações ou transferências vinculadas. Revise os vínculos antes de excluir.';
  if (error?.code === '42501') return 'Sua sessão não permite esta operação. Entre novamente e tente outra vez.';
  if (error?.code === 'PGRST202' || error?.code === '42P01' || error?.code === '42703') return 'Esta função depende da atualização do banco. Confira a migração do dashboard.';
  return error?.message === 'no_rows' ? 'O registro não foi encontrado. Atualize a página antes de tentar novamente.' : 'Não foi possível concluir. Confira os dados e tente novamente.';
}

export function AccountsPanel({ accounts = [], cards = [], transfers = [], rows = [], month, previewMode = false, onRefresh, onNotify }) {
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sectionId = useId();
  const headingRef = useRef(null);
  const today = localToday();
  const selectedMonth = month || today.slice(0, 7);
  const balances = useMemo(() => accounts.map(account => ({ ...account, balance: accountBalance(account, rows, transfers, today) })), [accounts, rows, transfers, today]);
  const accountNames = new Map(accounts.map(account => [account.id, account.nome]));
  const monthTransfers = transfers.filter(transfer => String(transfer.data).slice(0, 7) === selectedMonth).sort((a, b) => String(b.data).localeCompare(String(a.data)));
  const totalBalance = balances.reduce((total, account) => total + account.balance, 0);

  function openEditor(type, record = null) {
    if (previewMode || busy) return;
    setError('');
    setEditor({ type, record });
  }

  function closeEditor() {
    if (busy) return;
    setEditor(null);
    setError('');
    headingRef.current?.focus();
  }

  async function perform(operation, success) {
    if (previewMode || busy || !supabase) return;
    setBusy(true);
    setError('');
    let saved = false;
    try {
      const result = await operation();
      if (result.error) throw result.error;
      if (Array.isArray(result.data) && result.data.length === 0) throw new Error('no_rows');
      saved = true;
      setEditor(null);
      onNotify?.(success);
      await onRefresh?.();
      headingRef.current?.focus();
    } catch (operationError) {
      const message = saved ? 'O registro foi salvo, mas a lista não foi atualizada. Recarregue a página.' : friendlyError(operationError);
      setError(message);
      onNotify?.(message);
    } finally {
      setBusy(false);
    }
  }

  async function saveAccount(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record = {
      nome: String(form.get('nome') || '').trim(),
      tipo: form.get('tipo'),
      saldo_inicial: Number(form.get('saldo_inicial')),
      data_saldo_inicial: form.get('data_saldo_inicial'),
    };
    if (!record.nome || !Number.isFinite(record.saldo_inicial) || record.data_saldo_inicial > today) {
      setError('Informe nome, saldo válido e uma data inicial até hoje.');
      return;
    }
    await perform(() => editor.record
      ? supabase.from('accounts').update(record).eq('id', editor.record.id).select('id')
      : supabase.from('accounts').insert(record).select('id'), 'Conta salva.');
  }

  async function saveCard(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record = {
      nome: String(form.get('nome') || '').trim(),
      limite: Number(form.get('limite')),
      dia_fechamento: Number(form.get('dia_fechamento')),
      dia_vencimento: Number(form.get('dia_vencimento')),
    };
    if (!record.nome || !Number.isFinite(record.limite) || record.limite <= 0) {
      setError('Informe nome e um limite maior que zero.');
      return;
    }
    await perform(() => editor.record
      ? supabase.from('cards').update(record).eq('id', editor.record.id).select('id')
      : supabase.from('cards').insert(record).select('id'), 'Cartão salvo.');
  }

  async function transfer(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const source = String(form.get('origem_id') || '');
    const destination = String(form.get('destino_id') || '');
    const amount = Number(form.get('valor'));
    if (!source || source === destination || !Number.isFinite(amount) || amount <= 0 || form.get('data') > today) {
      setError('Escolha contas diferentes, um valor positivo e uma data até hoje.');
      return;
    }
    await perform(() => supabase.rpc('transfer_between_accounts', {
      p_origem_id: source, p_destino_id: destination, p_valor: amount, p_data: form.get('data'),
    }), 'Transferência registrada sem alterar receitas ou despesas.');
  }

  async function payInvoice(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get('data') > today) { setError('Confirme o pagamento com uma data até hoje.'); return; }
    await perform(async () => {
      const result = await supabase.rpc('pay_card_invoice', {
        p_cartao_id: editor.record.id,
        p_conta_id: form.get('conta_id'),
        p_mes: `${selectedMonth}-01`,
        p_data: form.get('data'),
      });
      if (!result.error && Number(result.data) === 0) return { ...result, error: new Error('no_rows') };
      return result;
    }, 'Fatura confirmada. As parcelas foram pagas sem criar uma segunda despesa.');
  }

  async function remove(table, record, label) {
    if (previewMode || busy || !window.confirm(`Excluir ${label}? Esta ação não pode ser desfeita.`)) return;
    await perform(() => supabase.from(table).delete().eq('id', record.id).select('id'), `${label} excluído.`);
  }

  const editorTitle = editor?.type === 'account' ? (editor.record ? 'Editar conta' : 'Nova conta')
    : editor?.type === 'card' ? (editor.record ? 'Editar cartão' : 'Novo cartão')
      : editor?.type === 'transfer' ? 'Transferir entre contas' : `Pagar fatura · ${editor?.record?.nome || ''}`;

  return <section className="panel accounts-panel" id="contas" aria-labelledby={`${sectionId}-title`}>
    <div className="panel-heading accounts-heading">
      <div>
        <div className="eyebrow">CONTAS E CARTÕES</div>
        <h2 id={`${sectionId}-title`} tabIndex={-1} ref={headingRef}>Seu dinheiro por conta</h2>
        <p>Saldos realizados até {dateLabel(today)}. Compromissos do cartão aparecem separados.</p>
      </div>
      {!previewMode && <div className="accounts-actions">
        <button type="button" className="button button-outline" disabled={busy} onClick={() => openEditor('transfer')}>Transferir</button>
        <button type="button" className="button button-outline" disabled={busy} onClick={() => openEditor('card')}>Novo cartão</button>
        <button type="button" className="button button-primary" disabled={busy} onClick={() => openEditor('account')}>Nova conta</button>
      </div>}
    </div>

    {error && <p className="accounts-error" role="alert">{error}</p>}

    {editor && <div className="accounts-editor" role="region" aria-labelledby={`${sectionId}-editor-title`}>
      <h3 id={`${sectionId}-editor-title`}>{editorTitle}</h3>
      {editor.type === 'account' && <form className="accounts-form" onSubmit={saveAccount} key={`account-${editor.record?.id || 'new'}`}>
        <label>Nome da conta<input name="nome" type="text" maxLength={80} defaultValue={editor.record?.nome || ''} autoComplete="off" required autoFocus /></label>
        <label>Tipo<select name="tipo" defaultValue={editor.record?.tipo || 'banco'}><option value="banco">Banco</option><option value="carteira">Carteira</option></select></label>
        <label>Saldo inicial (R$)<input name="saldo_inicial" type="number" step="0.01" defaultValue={editor.record?.saldo_inicial ?? 0} required /></label>
        <label>Data do saldo inicial<input name="data_saldo_inicial" type="date" max={today} defaultValue={editor.record?.data_saldo_inicial || today} required /></label>
        <p className="accounts-form-note">O saldo inicial deve representar o valor antes das movimentações desse dia. Lançamentos anteriores à data inicial não entram no saldo. Editar estes campos recalcula a conta.</p>
        <FormActions busy={busy} onCancel={closeEditor} />
      </form>}
      {editor.type === 'card' && <form className="accounts-form" onSubmit={saveCard} key={`card-${editor.record?.id || 'new'}`}>
        <label>Nome do cartão<input name="nome" type="text" maxLength={80} defaultValue={editor.record?.nome || ''} autoComplete="off" required autoFocus /></label>
        <label>Limite (R$)<input name="limite" type="number" min="0.01" step="0.01" defaultValue={editor.record?.limite || ''} required /></label>
        <label>Dia de fechamento<input name="dia_fechamento" type="number" min="1" max="31" step="1" defaultValue={editor.record?.dia_fechamento || 1} required /></label>
        <label>Dia de vencimento<input name="dia_vencimento" type="number" min="1" max="31" step="1" defaultValue={editor.record?.dia_vencimento || 10} required /></label>
        <p className="accounts-form-note">Registre compras e parcelas na nova movimentação. Os vencimentos existentes são preservados ao editar o cartão.</p>
        <FormActions busy={busy} onCancel={closeEditor} />
      </form>}
      {editor.type === 'transfer' && (accounts.length < 2 ? <div className="accounts-empty"><p>Cadastre pelo menos duas contas para registrar uma transferência.</p><button className="button button-outline" type="button" onClick={closeEditor}>Fechar</button></div> : <form className="accounts-form" onSubmit={transfer}>
        <label>Conta de origem<select name="origem_id" required autoFocus>{accounts.map(account => <option key={account.id} value={account.id}>{account.nome}</option>)}</select></label>
        <label>Conta de destino<select name="destino_id" defaultValue={accounts[1]?.id} required>{accounts.map(account => <option key={account.id} value={account.id}>{account.nome}</option>)}</select></label>
        <label>Valor (R$)<input name="valor" type="number" min="0.01" step="0.01" required /></label>
        <label>Data<input name="data" type="date" max={today} defaultValue={today} required /></label>
        <p className="accounts-form-note">O valor sai de uma conta e entra na outra. O total de receitas e despesas permanece igual.</p>
        <FormActions busy={busy} onCancel={closeEditor} submitLabel="Registrar transferência" />
      </form>)}
      {editor.type === 'invoice' && <form className="accounts-form" onSubmit={payInvoice}>
        <p className="accounts-form-note">Confirmar {money.format(cardInvoices(editor.record, rows).find(invoice => invoice.month === selectedMonth)?.pending || 0)} de {monthLabel(selectedMonth)}. O pagamento atualiza as parcelas pendentes desta fatura e desconta o valor da conta escolhida.</p>
        <label>Conta do pagamento<select name="conta_id" required autoFocus>{accounts.map(account => <option key={account.id} value={account.id}>{account.nome}</option>)}</select></label>
        <label>Data do pagamento<input name="data" type="date" max={today} defaultValue={today} required /></label>
        <FormActions busy={busy} onCancel={closeEditor} submitLabel="Confirmar pagamento" />
      </form>}
    </div>}

    <div className="accounts-columns">
      <div className="accounts-column">
        <div className="accounts-summary"><span>Saldo das contas hoje</span><strong className={totalBalance < 0 ? 'accounts-negative' : ''}>{money.format(totalBalance)}</strong></div>
        {!accounts.length ? <p className="accounts-empty">Cadastre uma conta ou carteira para acompanhar saldos. Movimentações sem conta vinculada continuam no extrato.</p> : <ul className="accounts-list">
          {balances.map(account => <li className="accounts-item" key={account.id}>
            <div className="accounts-item-main"><div><strong>{account.nome}</strong><span>{account.tipo === 'carteira' ? 'Carteira' : 'Banco'} · saldo inicial em {dateLabel(account.data_saldo_inicial)}</span></div><b className={account.balance < 0 ? 'accounts-negative' : ''}>{money.format(account.balance)}</b></div>
            {!previewMode && <div className="accounts-item-actions"><button type="button" disabled={busy} onClick={() => openEditor('account', account)} aria-label={`Editar conta ${account.nome}`}>Editar</button><button type="button" disabled={busy} onClick={() => remove('accounts', account, `conta ${account.nome}`)} aria-label={`Excluir conta ${account.nome}`}>Excluir</button></div>}
          </li>)}
        </ul>}
        <p className="accounts-footnote">Saldos consideram apenas movimentações realizadas vinculadas a cada conta e transferências, a partir do saldo inicial.</p>
      </div>

      <div className="accounts-column">
        <div className="accounts-summary"><span>Faturas de {monthLabel(selectedMonth)}</span><small>Vencimentos no mês selecionado</small></div>
        {!cards.length ? <p className="accounts-empty">Adicione um cartão para acompanhar faturas e compras parceladas.</p> : <ul className="accounts-list">
          {cards.map(card => {
            const invoices = cardInvoices(card, rows);
            const invoice = invoices.find(item => item.month === selectedMonth);
            const outstanding = invoices.reduce((total, item) => total + item.pending, 0);
            const future = invoices.filter(item => item.month > selectedMonth).reduce((total, item) => total + item.pending, 0);
            const available = Number(card.limite) - outstanding;
            return <li className="accounts-item accounts-card" key={card.id}>
              <div className="accounts-item-main"><div><strong>{card.nome}</strong><span>Fecha dia {card.dia_fechamento} · vence dia {card.dia_vencimento}</span></div><b className={(invoice?.pending || 0) > 0 ? 'accounts-pending' : ''}>{money.format(invoice?.pending || 0)}<small>pendente neste mês</small></b></div>
              <dl className="accounts-card-details"><div><dt>Pago no mês</dt><dd>{money.format(invoice?.realized || 0)}</dd></div><div><dt>Parcelas futuras</dt><dd>{money.format(future)}</dd></div><div><dt>Limite disponível estimado</dt><dd className={available < 0 ? 'accounts-negative' : ''}>{money.format(available)}</dd></div></dl>
              <p className="accounts-card-note">Limite estimado pelos lançamentos pendentes cadastrados.</p>
              {invoices.length > 0 && <details className="accounts-invoice-history"><summary>Ver faturas e parcelas</summary><ul>{invoices.map(item => <li key={item.month}>
                <div className="accounts-invoice-month"><div><strong>{monthLabel(item.month)}</strong><span>{item.rows.length} {item.rows.length === 1 ? 'lançamento' : 'lançamentos'}</span></div><span>{money.format(item.pending)} pendente</span></div>
                <ul className="accounts-installments">{item.rows.map(transaction => <li key={transaction.id}>
                  <div><strong>{transaction.descricao}{transaction.parcela_total > 1 ? ` · ${transaction.parcela_numero}/${transaction.parcela_total}` : ''}</strong><span>Vence {dateLabel(transaction.data)} · {transaction.status === 'pendente' ? 'Pendente' : 'Pago'}</span></div><span>{money.format(Number(transaction.valor))}</span>
                </li>)}</ul>
              </li>)}</ul></details>}
              {!previewMode && <div className="accounts-item-actions">
                <button type="button" disabled={busy || !accounts.length || !invoice?.pending} onClick={() => openEditor('invoice', card)} aria-label={`Pagar fatura de ${card.nome} de ${monthLabel(selectedMonth)}`}>Pagar fatura</button>
                <button type="button" disabled={busy} onClick={() => openEditor('card', card)} aria-label={`Editar cartão ${card.nome}`}>Editar</button>
                <button type="button" disabled={busy} onClick={() => remove('cards', card, `cartão ${card.nome}`)} aria-label={`Excluir cartão ${card.nome}`}>Excluir</button>
              </div>}
              {!previewMode && !accounts.length && (invoice?.pending || 0) > 0 && <p className="accounts-card-note">Cadastre uma conta para confirmar o pagamento.</p>}
            </li>;
          })}
        </ul>}
      </div>
    </div>

    <details className="accounts-transfers"><summary>Transferências de {monthLabel(selectedMonth)} <span>{monthTransfers.length}</span></summary>
      {!monthTransfers.length ? <p className="accounts-empty">Nenhuma transferência registrada neste mês.</p> : <ul>{monthTransfers.map(item => <li key={item.id}><div><strong>{accountNames.get(item.origem_id) || 'Conta de origem'} → {accountNames.get(item.destino_id) || 'Conta de destino'}</strong><span>{dateLabel(item.data)}</span></div><b>{money.format(Number(item.valor))}</b>{!previewMode && <button type="button" className="accounts-transfer-delete" disabled={busy} aria-label={`Excluir transferência de ${money.format(Number(item.valor))} em ${dateLabel(item.data)}`} onClick={() => remove('transfers', item, 'transferência')}>Excluir</button>}</li>)}</ul>}
    </details>
  </section>;
}

function FormActions({ busy, onCancel, submitLabel = 'Salvar' }) {
  return <div className="accounts-form-actions"><button type="button" className="button button-outline" disabled={busy} onClick={onCancel}>Cancelar</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Salvando…' : submitLabel}</button></div>;
}
