-- Execute as postgres against a Supabase database. Fixtures never persist.
begin;
insert into auth.users(id,email,aud,role) values
 ('11111111-1111-4111-8111-111111111101','finance-fixture-a@example.invalid','authenticated','authenticated'),
 ('11111111-1111-4111-8111-111111111102','finance-fixture-b@example.invalid','authenticated','authenticated');
insert into public.accounts(id,user_id,nome,saldo_inicial,data_saldo_inicial) values
 ('22222222-2222-4222-8222-222222222201','11111111-1111-4111-8111-111111111101','Fixture A',1000,'2020-01-01'),
 ('22222222-2222-4222-8222-222222222202','11111111-1111-4111-8111-111111111101','Fixture wallet',0,'2020-01-01'),
 ('22222222-2222-4222-8222-222222222203','11111111-1111-4111-8111-111111111102','Fixture B',500,'2020-01-01');
insert into public.cards(id,user_id,nome,limite,dia_fechamento,dia_vencimento) values
 ('33333333-3333-4333-8333-333333333301','11111111-1111-4111-8111-111111111101','Fixture card',2000,20,5);

set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111101',true);
do $$
declare v_today date := (now() at time zone 'America/Maceio')::date; v_count integer; v_id uuid;
begin
  assert (select count(*) from public.accounts) = 2, 'RLS leaked another owner';
  begin
    insert into public.transactions(data,descricao,valor,tipo,categoria,conta_id)
      values(v_today,'Foreign account',10,'despesa','Outros','22222222-2222-4222-8222-222222222203');
    raise exception 'Cross-owner account accepted';
  exception when foreign_key_violation then null; end;
  begin
    insert into public.transactions(data,descricao,valor,tipo,categoria)
      values(v_today+1,'Invalid future payment',10,'despesa','Outros');
    raise exception using errcode='P0002', message='Future payment accepted';
  exception when raise_exception then null; end;
  begin
    insert into public.transfers(origem_id,destino_id,valor,data)
      values('22222222-2222-4222-8222-222222222201','22222222-2222-4222-8222-222222222202',10,v_today+1);
    raise exception using errcode='P0002', message='Future transfer accepted';
  exception when raise_exception then null; end;
  v_id := public.transfer_between_accounts('22222222-2222-4222-8222-222222222201','22222222-2222-4222-8222-222222222202',100,v_today);
  assert v_id is not null, 'Transfer missing';
  assert (select count(*) from public.transactions) = 0, 'Transfer inflated income/expenses';
  insert into public.transactions(data,descricao,valor,tipo,categoria,status,cartao_id)
    values(v_today,'Fixture installment',33.34,'despesa','Outros','pendente','33333333-3333-4333-8333-333333333301');
  v_count := public.pay_card_invoice('33333333-3333-4333-8333-333333333301','22222222-2222-4222-8222-222222222201',v_today,v_today);
  assert v_count = 1, 'Invoice not settled';
  v_count := public.pay_card_invoice('33333333-3333-4333-8333-333333333301','22222222-2222-4222-8222-222222222201',v_today,v_today);
  assert v_count = 0, 'Invoice settled twice';
  assert (select count(*) from public.transactions) = 1, 'Invoice payment created another expense';
  assert (select sum(valor) from public.transactions where status='realizado') = 33.34, 'Invoice amount changed';
  assert not has_table_privilege('anon','public.accounts','select'), 'Anonymous account access';
  assert not has_function_privilege('anon','public.pay_card_invoice(uuid,uuid,date,date)','execute'), 'Anonymous RPC access';
end;
$$;
reset role;
rollback;
