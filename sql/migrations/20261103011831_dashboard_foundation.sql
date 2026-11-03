-- Additive foundation for the complete dashboard. Existing entries remain realized.
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null check (length(trim(nome)) between 1 and 80),
  tipo text not null default 'banco' check (tipo in ('banco', 'carteira')),
  saldo_inicial numeric(14,2) not null default 0 check (saldo_inicial <> 'NaN'::numeric),
  data_saldo_inicial date not null default (now() at time zone 'America/Maceio')::date,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null check (length(trim(nome)) between 1 and 80),
  limite numeric(14,2) not null check (limite > 0 and limite <> 'NaN'::numeric),
  dia_fechamento smallint not null check (dia_fechamento between 1 and 31),
  dia_vencimento smallint not null check (dia_vencimento between 1 and 31),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  origem_id uuid not null,
  destino_id uuid not null,
  valor numeric(14,2) not null check (valor > 0 and valor <> 'NaN'::numeric),
  data date not null,
  created_at timestamptz not null default now(),
  check (origem_id <> destino_id),
  foreign key (origem_id, user_id) references public.accounts(id, user_id),
  foreign key (destino_id, user_id) references public.accounts(id, user_id)
);

alter table public.savings_goals add constraint savings_goals_id_owner_key unique (id, user_id);
alter table public.transactions
  add column status text not null default 'realizado' check (status in ('realizado', 'pendente')),
  add column data_pagamento date,
  add column conta_id uuid,
  add column cartao_id uuid,
  add column meta_id uuid,
  add column parcela_numero smallint,
  add column parcela_total smallint,
  add column grupo_parcelamento uuid,
  add constraint transactions_account_owner_fk foreign key (conta_id, user_id) references public.accounts(id, user_id),
  add constraint transactions_card_owner_fk foreign key (cartao_id, user_id) references public.cards(id, user_id),
  add constraint transactions_goal_owner_fk foreign key (meta_id, user_id) references public.savings_goals(id, user_id),
  add constraint transactions_pending_payment_check check (status <> 'pendente' or data_pagamento is null),
  add constraint transactions_card_expense_check check (cartao_id is null or tipo = 'despesa'),
  add constraint transactions_goal_expense_check check (meta_id is null or tipo = 'despesa'),
  add constraint transactions_installments_check check (
    (parcela_numero is null and parcela_total is null and grupo_parcelamento is null)
    or (parcela_numero is not null and parcela_total is not null and grupo_parcelamento is not null
      and parcela_total between 2 and 120 and parcela_numero between 1 and parcela_total)
  );

-- Once per month, even when the template's due day is subsequently changed.
create unique index transactions_recurring_month_idx
  on public.transactions (user_id, recorrencia_id, (date_trunc('month', data::timestamp)))
  where recorrencia_id is not null;
create unique index transactions_installment_idx
  on public.transactions (user_id, grupo_parcelamento, parcela_numero)
  where grupo_parcelamento is not null;
create index transactions_account_owner_idx on public.transactions(conta_id, user_id) where conta_id is not null;
create index transactions_card_owner_idx on public.transactions(cartao_id, user_id) where cartao_id is not null;
create index transactions_goal_owner_idx on public.transactions(meta_id, user_id) where meta_id is not null;
create index transactions_user_status_date_idx on public.transactions(user_id, status, data);
create index transfers_source_owner_idx on public.transfers(origem_id, user_id);
create index transfers_destination_owner_idx on public.transfers(destino_id, user_id);
create index transfers_user_date_idx on public.transfers(user_id, data);

create table public.category_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  termo text not null check (length(trim(termo)) between 2 and 120),
  tipo text not null check (tipo in ('receita', 'despesa')),
  categoria text not null check (length(trim(categoria)) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (user_id, tipo, termo)
);
create table public.import_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null check (length(trim(nome)) between 1 and 80),
  mapping jsonb not null check (jsonb_typeof(mapping) = 'object'),
  created_at timestamptz not null default now(),
  unique (user_id, nome)
);

alter table public.accounts enable row level security;
alter table public.cards enable row level security;
alter table public.transfers enable row level security;
alter table public.category_rules enable row level security;
alter table public.import_profiles enable row level security;
revoke all on public.accounts, public.cards, public.transfers, public.category_rules, public.import_profiles from public, anon;
grant select, insert, update, delete on public.accounts, public.cards, public.transfers, public.category_rules, public.import_profiles to authenticated;
create policy "Owner access" on public.accounts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owner access" on public.cards for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owner access" on public.transfers for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owner access" on public.category_rules for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owner access" on public.import_profiles for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- These invariants also apply to direct Data API writes, not only to the RPCs.
create function public.validate_transfer() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.data > (now() at time zone 'America/Maceio')::date then
    raise exception 'Transferências devem ter uma data realizada';
  end if;
  if (select count(*) from public.accounts where user_id = new.user_id
      and id in (new.origem_id,new.destino_id) and data_saldo_inicial <= new.data) <> 2 then
    raise exception 'Escolha contas próprias e uma data a partir dos saldos iniciais';
  end if;
  return new;
end;
$$;
create trigger validate_transfer before insert or update on public.transfers
  for each row execute function public.validate_transfer();
revoke all on function public.validate_transfer() from public, anon, authenticated;

create function public.validate_settlement() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.valor = 'NaN'::numeric then raise exception 'Valor inválido'; end if;
  if new.status = 'realizado' and coalesce(new.data_pagamento,new.data) > (now() at time zone 'America/Maceio')::date then
    raise exception 'Confirmações exigem uma data até hoje; use Pendente para o futuro';
  end if;
  return new;
end;
$$;
create trigger validate_settlement before insert or update on public.transactions
  for each row execute function public.validate_settlement();
revoke all on function public.validate_settlement() from public, anon, authenticated;

create function public.transfer_between_accounts(p_origem_id uuid, p_destino_id uuid, p_valor numeric, p_data date)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid; v_owner uuid := auth.uid();
begin
  if v_owner is null then raise exception 'Autenticação necessária'; end if;
  if p_origem_id is null or p_destino_id is null or p_origem_id = p_destino_id
    or p_valor is null or p_valor <= 0 or p_data is null
    or p_data > (now() at time zone 'America/Maceio')::date then
    raise exception 'Transferência inválida: informe duas contas, valor positivo e data realizada';
  end if;
  -- Same order prevents concurrent opposite transfers deadlocking.
  perform id from public.accounts where user_id = v_owner and id in (p_origem_id, p_destino_id) order by id for update;
  if (select count(*) from public.accounts where user_id = v_owner and id in (p_origem_id, p_destino_id)) <> 2 then
    raise exception 'Conta não encontrada';
  end if;
  if exists(select 1 from public.accounts where user_id = v_owner and id in (p_origem_id,p_destino_id) and data_saldo_inicial > p_data) then
    raise exception 'A data deve ser igual ou posterior aos saldos iniciais das contas';
  end if;
  insert into public.transfers(user_id,origem_id,destino_id,valor,data)
    values(v_owner,p_origem_id,p_destino_id,p_valor,p_data) returning id into v_id;
  return v_id;
end;
$$;

create function public.pay_card_invoice(p_cartao_id uuid, p_conta_id uuid, p_mes date, p_data date)
returns integer language plpgsql security invoker set search_path = '' as $$
declare v_count integer; v_owner uuid := auth.uid();
begin
  if v_owner is null then raise exception 'Autenticação necessária'; end if;
  if p_mes is null or p_data is null or p_data > (now() at time zone 'America/Maceio')::date then
    raise exception 'Informe o mês da fatura e uma data de pagamento realizada';
  end if;
  perform id from public.accounts where id = p_conta_id and user_id = v_owner and data_saldo_inicial <= p_data for update;
  if not found then raise exception 'Conta não encontrada ou pagamento anterior ao saldo inicial'; end if;
  perform id from public.cards where id = p_cartao_id and user_id = v_owner for update;
  if not found then raise exception 'Cartão não encontrado'; end if;
  update public.transactions set status = 'realizado', data_pagamento = p_data, conta_id = p_conta_id, updated_at = now()
    where user_id = v_owner and cartao_id = p_cartao_id and status = 'pendente'
      and data >= date_trunc('month',p_mes)::date and data < (date_trunc('month',p_mes) + interval '1 month')::date;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.transfer_between_accounts(uuid,uuid,numeric,date) from public, anon;
revoke all on function public.pay_card_invoice(uuid,uuid,date,date) from public, anon;
grant execute on function public.transfer_between_accounts(uuid,uuid,numeric,date) to authenticated;
grant execute on function public.pay_card_invoice(uuid,uuid,date,date) to authenticated;

comment on column public.transactions.data is 'Vencimento previsto; para realizados sem data_pagamento, data de efetivação.';
comment on column public.transactions.meta_id is 'Aporte real a uma meta: despesa vinculada, somada ao saldo inicial declarado da meta.';
comment on table public.transfers is 'Transferências realizadas entre contas próprias; não integram receitas ou despesas.';
notify pgrst, 'reload schema';
