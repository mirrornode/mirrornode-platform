-- Guest Osiris Audit v1 checkout reconciliation.
-- app/api/webhook/route.ts upserts here when checkout.session.completed
-- has flow=osiris-audit-v1 and no authenticated metadata.user_id.

create table if not exists public.guest_audit_purchases (
  stripe_session_id text primary key,
  stripe_customer_id text,
  customer_email text,
  flow text not null,
  status text not null default 'completed',
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.guest_audit_purchases enable row level security;

-- No anon/authenticated policies: this ledger is written by the service-role
-- Stripe webhook and should not be exposed to public client reads.
