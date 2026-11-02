create index if not exists transactions_recurring_owner_idx
  on public.transactions (recorrencia_id, user_id)
  where recorrencia_id is not null;
