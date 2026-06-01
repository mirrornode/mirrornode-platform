create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique not null,
  stripe_payment_intent_id text,
  user_id uuid references auth.users(id),
  document_id text,
  severity text,
  checkout_tier text,
  amount_usd numeric,
  flow text,
  payment_status text,
  customer_email text,
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists transactions_payment_intent_idx
  on transactions (stripe_payment_intent_id);
