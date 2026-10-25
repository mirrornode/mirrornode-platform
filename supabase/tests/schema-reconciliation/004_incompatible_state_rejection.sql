-- Persistent disposable fixture.
--
-- This file intentionally commits. The runner invokes the reconciliation
-- migration in a separate psql process and expects it to fail. A separate
-- assertion file compares the snapshots below after that expected failure.
--
-- Do not run against production or a shared database.

begin;

drop table if exists public.guest_audit_purchases cascade;
drop table if exists public.schema_reconciliation_incompatible_before cascade;

create table public.guest_audit_purchases (
  id uuid not null default gen_random_uuid(),
  stripe_session_id text not null,
  legacy_reference text not null,
  primary key (legacy_reference)
);

insert into public.guest_audit_purchases (
  stripe_session_id,
  legacy_reference
)
values (
  'cs_incompatible_shape',
  'legacy-reference-001'
);

create table public.schema_reconciliation_incompatible_before as
select
  (
    select jsonb_agg(
      jsonb_build_object(
        'constraint_name', c.conname,
        'constraint_type', c.contype,
        'definition', pg_catalog.pg_get_constraintdef(c.oid, true)
      )
      order by c.conname
    )
    from pg_catalog.pg_constraint c
    where c.conrelid = 'public.guest_audit_purchases'::regclass
      and c.contype = 'p'
  ) as primary_key_definition,
  (
    select count(*)
    from public.guest_audit_purchases
  ) as row_count,
  (
    select jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'stripe_session_id', p.stripe_session_id,
        'legacy_reference', p.legacy_reference
      )
      order by p.legacy_reference
    )
    from public.guest_audit_purchases p
  ) as rows_json;

commit;
