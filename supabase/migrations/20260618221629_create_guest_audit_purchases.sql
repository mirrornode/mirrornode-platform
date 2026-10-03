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

-- Repository bootstrap must supply the trigger prerequisite hardened by
-- 20260813212729. Existing hosted definitions are preserved, not replaced.
do $bootstrap$
begin
  if to_regprocedure('public.set_guest_audit_purchases_updated_at()') is null then
    execute $definition$
      create function public.set_guest_audit_purchases_updated_at()
      returns trigger
      language plpgsql
      set search_path = pg_catalog
      as $body$
      begin
        new.updated_at = now();
        return new;
      end;
      $body$
    $definition$;
  end if;

  if not exists (
    select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.guest_audit_purchases'::regclass
      and tgname = 'trg_guest_audit_purchases_updated_at'
      and not tgisinternal
  ) then
    create trigger trg_guest_audit_purchases_updated_at
      before update on public.guest_audit_purchases
      for each row execute function public.set_guest_audit_purchases_updated_at();
  end if;
end;
$bootstrap$;
