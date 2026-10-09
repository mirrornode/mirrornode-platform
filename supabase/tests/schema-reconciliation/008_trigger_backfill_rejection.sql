-- Persistent fixture for a separate expected-failure migration invocation.
begin;
drop table if exists public.guest_audit_purchases;
drop function if exists public.set_guest_audit_purchases_updated_at();
\i :creation_file
insert into public.guest_audit_purchases
  (stripe_session_id, flow, updated_at)
values ('trigger-null-id', 'osiris-audit-v1', '2000-01-01T00:00:00Z'),
       ('trigger-existing-id', 'osiris-audit-v1', '2001-01-01T00:00:00Z');
\if :mixed_ids
-- Simulate a partially backfilled legacy without UPDATE-trigger side effects.
alter table public.guest_audit_purchases add column id uuid
  default '11111111-1111-4111-8111-111111111111'::uuid;
alter table public.guest_audit_purchases alter column id drop default;
insert into public.guest_audit_purchases
  (stripe_session_id, flow, updated_at)
values ('trigger-null-existing-column', 'osiris-audit-v1', '1999-01-01T00:00:00Z');
\endif
commit;
