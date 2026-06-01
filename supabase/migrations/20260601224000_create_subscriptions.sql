-- Stripe checkout persistence for the Osiris Audit / MIRRORNODE commerce path.
-- Matches app/api/webhook/route.ts, which upserts:
-- user_id, stripe_customer_id, stripe_session_id, status, updated_at.

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_session_id text,
  status text not null default 'active',
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create unique index if not exists subscriptions_stripe_session_id_key
  on public.subscriptions (stripe_session_id)
  where stripe_session_id is not null;

create index if not exists subscriptions_status_idx
  on public.subscriptions (status);

alter table public.subscriptions enable row level security;

-- Service-role webhook writes bypass RLS. This policy only permits signed-in
-- users to read their own subscription state from client code if needed.
drop policy if exists "Users can read own subscription" on public.subscriptions;
create policy "Users can read own subscription"
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);
