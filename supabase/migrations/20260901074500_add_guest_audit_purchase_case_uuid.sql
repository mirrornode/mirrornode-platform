-- Reconcile the independent first-dollar case UUID observed in the production
-- guest_audit_purchases ledger with reproducible repository schema history.
--
-- This migration is additive: stripe_session_id remains the existing primary
-- key/payment identity. id is a separate stable case identity for downstream
-- evidence, findings, release, and delivery-receipt bindings.

begin;

alter table public.guest_audit_purchases
  add column if not exists id uuid;

alter table public.guest_audit_purchases
  alter column id set default gen_random_uuid();

update public.guest_audit_purchases
set id = gen_random_uuid()
where id is null;

alter table public.guest_audit_purchases
  alter column id set not null;

create unique index if not exists guest_audit_purchases_id_key
  on public.guest_audit_purchases (id);

commit;
