-- Keep the Osiris purchase and intake ledger server-owned.
-- RLS blocks row access, while explicit table grants remove unused capabilities
-- inherited from legacy public-schema defaults.

alter table public.guest_audit_purchases enable row level security;

-- Pin the trigger function to trusted built-ins and clear the database advisor's
-- mutable search-path warning.
alter function public.set_guest_audit_purchases_updated_at()
  set search_path = pg_catalog;

revoke all privileges on table public.guest_audit_purchases
  from public, anon, authenticated;

-- The Stripe webhook and verified intake route use the service-role client for
-- reconciliation. They require reads, inserts, and updates, but not deletes or
-- table-administration privileges.
grant select, insert, update on table public.guest_audit_purchases
  to service_role;
