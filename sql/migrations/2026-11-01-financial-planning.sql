create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  mes date not null check (extract(day from mes) = 1),
  categoria text not null check (length(trim(categoria)) > 0),
  limite numeric(14,2) not null check (limite > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, mes, categoria)
);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  valor_alvo numeric(14,2) not null check (valor_alvo > 0),
  valor_atual numeric(14,2) not null default 0 check (valor_atual >= 0),
  data_limite date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  descricao text not null check (length(trim(descricao)) > 0),
  valor numeric(14,2) not null check (valor > 0),
  categoria text not null check (length(trim(categoria)) > 0),
  dia_vencimento smallint not null check (dia_vencimento between 1 and 31),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

alter table public.transactions
  add column if not exists recorrencia_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'transactions_recorrencia_owner_fk'
  ) then
    alter table public.transactions
      add constraint transactions_recorrencia_owner_fk
      foreign key (recorrencia_id, user_id)
      references public.recurring_expenses(id, user_id);
  end if;
end $$;

create unique index if not exists transactions_recurring_instance_idx
  on public.transactions (user_id, recorrencia_id, data)
  where recorrencia_id is not null;
create index if not exists transactions_recurring_owner_idx
  on public.transactions (recorrencia_id, user_id)
  where recorrencia_id is not null;
create index if not exists budgets_user_mes_idx
  on public.budgets (user_id, mes desc);
create index if not exists savings_goals_user_created_idx
  on public.savings_goals (user_id, created_at desc);
create index if not exists recurring_expenses_user_active_idx
  on public.recurring_expenses (user_id, ativo);

alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;
alter table public.recurring_expenses enable row level security;

revoke all privileges on table public.budgets, public.savings_goals, public.recurring_expenses from public, anon;
grant select, insert, update, delete on public.budgets, public.savings_goals, public.recurring_expenses to authenticated;

drop policy if exists "Users can read their own budgets" on public.budgets;
create policy "Users can read their own budgets" on public.budgets
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can create their own budgets" on public.budgets;
create policy "Users can create their own budgets" on public.budgets
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own budgets" on public.budgets;
create policy "Users can update their own budgets" on public.budgets
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete their own budgets" on public.budgets;
create policy "Users can delete their own budgets" on public.budgets
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own savings goals" on public.savings_goals;
create policy "Users can read their own savings goals" on public.savings_goals
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can create their own savings goals" on public.savings_goals;
create policy "Users can create their own savings goals" on public.savings_goals
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own savings goals" on public.savings_goals;
create policy "Users can update their own savings goals" on public.savings_goals
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete their own savings goals" on public.savings_goals;
create policy "Users can delete their own savings goals" on public.savings_goals
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own recurring expenses" on public.recurring_expenses;
create policy "Users can read their own recurring expenses" on public.recurring_expenses
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can create their own recurring expenses" on public.recurring_expenses;
create policy "Users can create their own recurring expenses" on public.recurring_expenses
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own recurring expenses" on public.recurring_expenses;
create policy "Users can update their own recurring expenses" on public.recurring_expenses
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete their own recurring expenses" on public.recurring_expenses;
create policy "Users can delete their own recurring expenses" on public.recurring_expenses
  for delete to authenticated using ((select auth.uid()) = user_id);

comment on table public.budgets is 'Limites mensais por categoria, privados por usuário via RLS.';
comment on table public.savings_goals is 'Metas de economia e progresso declarado, privados por usuário via RLS.';
comment on table public.recurring_expenses is 'Modelos de despesas mensais, privados por usuário via RLS.';
