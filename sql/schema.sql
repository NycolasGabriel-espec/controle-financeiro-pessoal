create extension if not exists pgcrypto;

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data date not null,
  descricao text not null check (length(trim(descricao)) > 0),
  valor numeric(14,2) not null check (valor > 0),
  tipo text not null check (tipo in ('receita', 'despesa')),
  categoria text not null check (length(trim(categoria)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_user_data_idx on public.transactions (user_id, data desc);
create index transactions_user_categoria_idx on public.transactions (user_id, categoria);
create index transactions_user_tipo_idx on public.transactions (user_id, tipo);

alter table public.transactions enable row level security;

revoke all privileges on table public.transactions from public, anon;
grant select, insert, update, delete on public.transactions to authenticated;

create policy "Users can read their own transactions"
  on public.transactions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their own transactions"
  on public.transactions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their own transactions"
  on public.transactions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their own transactions"
  on public.transactions for delete to authenticated
  using ((select auth.uid()) = user_id);

comment on table public.transactions is
  'Registros financeiros privados. Cada linha é isolada pelo user_id e protegida por RLS.';
