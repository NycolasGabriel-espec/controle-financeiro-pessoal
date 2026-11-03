-- Transactional fixtures verify idempotency, user isolation and user edits.
begin;
insert into auth.users(id,email,aud,role) values
 ('11111111-1111-4111-8111-111111111101','finance-fixture-a@example.invalid','authenticated','authenticated'),
 ('11111111-1111-4111-8111-111111111102','finance-fixture-b@example.invalid','authenticated','authenticated');
insert into public.automation_settings(user_id,recurring_enabled,budget_rollover_enabled)
  values('11111111-1111-4111-8111-111111111101',true,true),('11111111-1111-4111-8111-111111111102',false,false);
insert into public.recurring_expenses(id,user_id,descricao,valor,categoria,dia_vencimento)
  values('44444444-4444-4444-8444-444444444401','11111111-1111-4111-8111-111111111101','Fixture recurring',120,'Moradia',31);
insert into public.budgets(user_id,mes,categoria,limite) values
 ('11111111-1111-4111-8111-111111111101',(date_trunc('month',now() at time zone 'America/Maceio')-interval '1 month')::date,'Fixture copy',100),
 ('11111111-1111-4111-8111-111111111101',(date_trunc('month',now() at time zone 'America/Maceio')-interval '1 month')::date,'Fixture preserve',50),
 ('11111111-1111-4111-8111-111111111101',date_trunc('month',now() at time zone 'America/Maceio')::date,'Fixture preserve',75);

set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111101',true);
do $$
declare v_result jsonb; v_month date := date_trunc('month',now() at time zone 'America/Maceio')::date;
begin
  assert (select count(*) from public.automation_settings) = 1, 'Settings RLS leaked';
  v_result := public.run_finance_automations();
  assert (v_result->>'recurring')::integer=1, 'Recurring not generated';
  assert (v_result->>'budgets')::integer=1, 'Budget not copied';
  assert (select count(*) from public.transactions where status='pendente')=1, 'Recurring should be pending';
  assert (select data from public.transactions)=(v_month+interval '1 month - 1 day')::date, 'Due day not clamped';
  assert (select limite from public.budgets where mes=v_month and categoria='Fixture preserve')=75, 'Edited budget overwritten';
  v_result := public.run_finance_automations();
  assert (v_result->>'recurring')::integer=0 and (v_result->>'budgets')::integer=0, 'Repeated execution duplicated entries';
  delete from public.transactions where recorrencia_id='44444444-4444-4444-8444-444444444401';
  delete from public.budgets where mes=v_month and categoria='Fixture copy';
  v_result := public.run_finance_automations();
  assert (v_result->>'recurring')::integer=0 and (v_result->>'budgets')::integer=0, 'Deleted entries recreated';
  begin
    perform finance_private.materialize_finance('11111111-1111-4111-8111-111111111102');
    raise exception using errcode='P0002', message='Foreign automation accepted';
  exception when raise_exception then null; end;
  assert not has_function_privilege('authenticated','finance_private.run_scheduled_automations()','execute'), 'Public access to scheduler';
  assert not has_function_privilege('anon','public.run_finance_automations()','execute'), 'Anonymous automation RPC';
end;
$$;
reset role;
do $$
begin
  assert exists(select 1 from cron.job where jobname='gestao-finance-hourly' and active and schedule='5 * * * *'), 'Scheduled job missing';
end;
$$;
rollback;
