'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { cents, effectiveDate, isRealized, localToday, monthlySummary } from '../../lib/finance.mjs';
import './automation-panel.css';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const shiftDay = (date, amount) => { const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + amount); return value.toISOString().slice(0, 10); };
const defaults = { recurring_enabled: false, budget_rollover_enabled: false };

export function AutomationPanel({ rows = [], month, previewMode = false, onRefresh, onNotify }) {
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(previewMode);
  const [retryVersion, setRetryVersion] = useState(0);
  const today = localToday();
  const weekStart = shiftDay(today, -6);
  const weekEnd = shiftDay(today, 7);
  const actual = rows.filter(row => isRealized(row) && effectiveDate(row) >= weekStart && effectiveDate(row) <= today);
  const weekIncome = actual.filter(row => row.tipo === 'receita').reduce((sum, row) => sum + cents(row.valor), 0) / 100;
  const weekExpense = actual.filter(row => row.tipo === 'despesa').reduce((sum, row) => sum + cents(row.valor), 0) / 100;
  const upcoming = rows.filter(row => !isRealized(row) && row.data >= today && row.data <= weekEnd);
  const overdue = rows.filter(row => !isRealized(row) && row.data < today);
  const summary = monthlySummary(rows, month || today.slice(0, 7), today);
  const preferences = settings || defaults;

  useEffect(() => {
    if (previewMode || !supabase) { setReady(true); return undefined; }
    let cancelled = false;
    (async () => {
      try {
        const result = await supabase.from('automation_settings').select('*').maybeSingle();
        if (cancelled) return;
        if (result.error) throw result.error;
        setSettings(result.data);
        setReady(true);
        if (result.data?.recurring_enabled || result.data?.budget_rollover_enabled) {
          const run = await supabase.rpc('run_finance_automations');
          if (cancelled) return;
          if (run.error) throw run.error;
          if (run.data?.recurring || run.data?.budgets) await onRefresh?.();
          const refreshed = await supabase.from('automation_settings').select('*').maybeSingle();
          if (!cancelled && !refreshed.error) setSettings(refreshed.data);
        }
      } catch {
        if (!cancelled) { setError('Não foi possível carregar ou executar as automações. Confira a conexão e tente novamente.'); setReady(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [previewMode, onRefresh, retryVersion]);

  async function execute(nextPreferences = preferences, persist = false) {
    if (busy || previewMode || !supabase) return;
    setBusy(true); setError('');
    try {
      if (persist) {
        const payload = {
          recurring_enabled: nextPreferences.recurring_enabled,
          budget_rollover_enabled: nextPreferences.budget_rollover_enabled,
          enabled_from: settings?.enabled_from || today,
        };
        const saved = await supabase.from('automation_settings').upsert(payload, { onConflict: 'user_id' }).select('*').single();
        if (saved.error) throw saved.error;
        setSettings(saved.data);
      }
      const result = await supabase.rpc('run_finance_automations');
      if (result.error) throw result.error;
      const refreshed = await supabase.from('automation_settings').select('*').maybeSingle();
      if (!refreshed.error) setSettings(refreshed.data);
      setReady(true);
      await onRefresh?.();
      onNotify?.(persist ? 'Preferências salvas. A rotina também foi executada agora.' : `${result.data?.recurring || 0} contas previstas e ${result.data?.budgets || 0} orçamentos criados.`);
    } catch {
      setError('Não foi possível concluir a rotina. As preferências podem ter sido salvas; tente “Atualizar agora” para conferir.');
    } finally { setBusy(false); }
  }

  return <section className="panel automation-panel" id="automacoes" aria-labelledby="automation-title">
    <div className="panel-heading"><div><div className="eyebrow">ROTINAS E ACOMPANHAMENTO</div><h2 id="automation-title">Seu acompanhamento automático</h2><p>Resumo atualizado com seus registros, sem depender dos filtros do extrato.</p></div>{!previewMode && <button type="button" className="button button-outline" disabled={busy || (!preferences.recurring_enabled && !preferences.budget_rollover_enabled)} onClick={() => execute()}>{busy ? 'Atualizando…' : 'Atualizar agora'}</button>}</div>
    <div className="automatic-summary" aria-label="Resumo automático">
      <div><span>Últimos 7 dias · receitas</span><strong>{money.format(weekIncome)}</strong></div>
      <div><span>Últimos 7 dias · despesas</span><strong>{money.format(weekExpense)}</strong></div>
      <div><span>Próximos 7 dias</span><strong>{upcoming.length} compromissos</strong></div>
      <div><span>Pendências em atraso</span><strong className={overdue.length ? 'negative-value' : ''}>{overdue.length}</strong></div>
    </div>
    <p className="automation-month-note">No mês selecionado: {money.format(summary.income)} recebidos, {money.format(summary.expense)} pagos e {money.format(summary.balance)} de resultado realizado.</p>
    {error && <p className="automation-error" role="alert">{error}</p>}
    {!ready && error && <button type="button" className="button button-outline" onClick={() => setRetryVersion(value => value + 1)}>Tentar carregar novamente</button>}
    {settings?.last_error && <p className="automation-error" role="alert">{settings.last_error}</p>}
    <div className="automation-preferences">
      <label><input type="checkbox" checked={preferences.recurring_enabled} disabled={busy || !ready || previewMode} onChange={event => execute({ ...preferences, recurring_enabled: event.target.checked }, true)} /><span><strong>Gerar contas recorrentes</strong><small>Criar pendências do mês atual a partir da ativação. Pagamentos precisam ser confirmados por você.</small></span></label>
      <label><input type="checkbox" checked={preferences.budget_rollover_enabled} disabled={busy || !ready || previewMode} onChange={event => execute({ ...preferences, budget_rollover_enabled: event.target.checked }, true)} /><span><strong>Renovar orçamentos todo mês</strong><small>Copiar limites do mês anterior uma vez por mês, preservando os limites já definidos.</small></span></label>
    </div>
    <p className="automation-footnote">{previewMode ? 'Demonstração somente para leitura. As preferências são individuais na conta.' : settings?.last_run_at ? `Última execução: ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Maceio' }).format(new Date(settings.last_run_at))}. ` : 'Ative as rotinas que deseja usar. '}O agendamento executa a cada hora, no minuto 05, mesmo com o site fechado. Registros excluídos após a geração não são recriados automaticamente no mesmo mês.</p>
  </section>;
}
