-- Persistent disposable fixture for the inbound-foreign-key rejection path.
--
-- This file intentionally commits. The runner invokes the reconciliation
-- migration in a separate psql process and expects it to fail. A separate
-- assertion file verifies that the parent identity and inbound relationship
-- remain unchanged after the rejected migration.
--
-- Do not run against production or a shared database.

begin;

drop table if exists public.schema_reconciliation_inbound_child;
drop table if exists public.guest_audit_purchases cascade;

create table public.guest_audit_purchases (
  stripe_session_id text primary key,
  customer_email text
);

create table public.schema_reconciliation_inbound_child (
  id uuid primary key default gen_random_uuid(),
  purchase_session_id text not null references public.guest_audit_purchases(stripe_session_id)
);

insert into public.guest_audit_purchases (
  stripe_session_id,
  customer_email
)
values (
  'cs_inbound_fk_shape',
  'inbound-fk@example.test'
);

insert into public.schema_reconciliation_inbound_child (
  purchase_session_id
)
values (
  'cs_inbound_fk_shape'
);

commit;
