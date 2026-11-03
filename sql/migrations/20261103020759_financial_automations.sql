-- Schedules create pending entries only. Each account controls its own preferences.
create schema if not exists finance_private;
revoke all on schema finance_private from public, anon;
grant usage on schema finance_private to authenticated;

create table public.automation_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  recurring_enabled boolean not null default false,
  budget_rollover_enabled boolean not null default false,
  enabled_from date not null default (now() at time zone 'America/Maceio')::date,
  last_run_at timestamptz,
  last_error text,
  last_budget_month date,
  created_at timestamptz not null default now(),
  check (enabled_from >= (created_at at time zone 'America/Maceio')::date)
);
alter table public.automation_settings enable row level security;
revoke all on public.automation_settings from public, anon;
grant select, insert, update, delete on public.automation_settings to authenticated;
create policy "Owner access" on public.automation_settings for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter table public.recurring_expenses add column last_generated_month date;

-- Invoker privileges preserve RLS for browser requests. The scheduler runs as postgres.
create function finance_private.materialize_finance(p_owner uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_settings public.automation_settings;
  v_today date := (now() at time zone 'America/Maceio')::date;
  v_month date := date_trunc('month',v_today)::date;
  v_recurring integer := 0;
  v_budgets integer := 0;
begin
  if current_user not in ('postgres','supabase_admin') and (auth.uid() is null or p_owner is distinct from auth.uid()) then
    raise exception 'Acesso não permitido';
  end if;
  select * into v_settings from public.automation_settings where user_id = p_owner for update;
  if not found then return jsonb_build_object('recurring',0,'budgets',0); end if;
  if v_settings.recurring_enabled then
    insert into public.transactions(user_id,data,descricao,valor,tipo,categoria,recorrencia_id,status)
      select r.user_id,d.due_date,r.descricao,r.valor,'despesa',r.categoria,r.id,'pendente'
      from public.recurring_expenses r
      cross join lateral (select v_month + (least(r.dia_vencimento,extract(day from (v_month + interval '1 month - 1 day'))::integer)-1) as due_date) d
      where r.user_id = p_owner and r.ativo and r.last_generated_month is distinct from v_month
        and d.due_date >= greatest(v_settings.enabled_from,(r.created_at at time zone 'America/Maceio')::date)
      on conflict do nothing;
    get diagnostics v_recurring = row_count;
    update public.recurring_expenses r set last_generated_month=v_month
      where r.user_id=p_owner and r.ativo and r.last_generated_month is distinct from v_month
        and v_month + (least(r.dia_vencimento,extract(day from (v_month + interval '1 month - 1 day'))::integer)-1)
          >= greatest(v_settings.enabled_from,(r.created_at at time zone 'America/Maceio')::date);
  end if;
  if v_settings.budget_rollover_enabled and v_settings.last_budget_month is distinct from v_month
      and v_month >= date_trunc('month',v_settings.enabled_from)::date then
    insert into public.budgets(user_id,mes,categoria,limite)
      select user_id,v_month,categoria,limite from public.budgets
      where user_id = p_owner and mes = (v_month - interval '1 month')::date
      on conflict (user_id,mes,categoria) do nothing;
    get diagnostics v_budgets = row_count;
    update public.automation_settings set last_budget_month=v_month where user_id=p_owner;
  end if;
  update public.automation_settings set last_run_at=now(),last_error=null where user_id=p_owner;
  return jsonb_build_object('recurring',v_recurring,'budgets',v_budgets);
end;
$$;
revoke all on function finance_private.materialize_finance(uuid) from public, anon;
grant execute on function finance_private.materialize_finance(uuid) to authenticated;

create function public.run_finance_automations()
returns jsonb language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
  return finance_private.materialize_finance(auth.uid());
end;
$$;
revoke all on function public.run_finance_automations() from public, anon;
grant execute on function public.run_finance_automations() to authenticated;

create function finance_private.run_scheduled_automations()
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_owner uuid; v_users integer := 0; v_failed integer := 0;
begin
  for v_owner in select user_id from public.automation_settings where recurring_enabled or budget_rollover_enabled loop
    begin
      perform finance_private.materialize_finance(v_owner);
      v_users := v_users + 1;
    exception when others then
      v_failed := v_failed + 1;
      update public.automation_settings set last_error='A rotina falhou. Tente atualizar agora ou revise os cadastros.' where user_id=v_owner;
      raise warning 'Finance automation failed: SQLSTATE %',sqlstate;
    end;
  end loop;
  return jsonb_build_object('users',v_users,'failed',v_failed);
end;
$$;
revoke all on function finance_private.run_scheduled_automations() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('gestao-finance-hourly','5 * * * *','select finance_private.run_scheduled_automations()');
comment on table public.automation_settings is 'Preferências por usuário. Rotina horária em :05; datas calculadas no fuso America/Maceio; sem confirmar pagamentos.';
notify pgrst, 'reload schema';
