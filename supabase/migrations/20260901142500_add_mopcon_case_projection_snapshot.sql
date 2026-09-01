-- MOPCON read-only Osiris case projection.
--
-- Purpose:
--   Return every actionable Osiris case plus the latest bounded terminal history
--   from one PostgreSQL statement snapshot so fulfillment-status transitions
--   cannot make a case disappear between client-side pages.
--
-- Preconditions:
--   public.guest_audit_purchases uses the reconciled UUID identity baseline:
--   id uuid primary key; stripe_session_id text unique.
--
-- Non-goals:
--   No fulfillment mutation, release/delivery authority, command credential,
--   receipt creation, or MOPCON write capability.

begin;

create or replace function public.mopcon_case_projection()
returns table (
  id uuid,
  customer_email text,
  flow text,
  status text,
  fulfillment_status text,
  created_at timestamptz,
  updated_at timestamptz,
  intake_submitted_at timestamptz,
  operator_reviewed_at timestamptz,
  fulfillment_started_at timestamptz,
  delivered_at timestamptz,
  intake_artifact_links jsonb
)
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  with snapshot_rows as materialized (
    select
      p.id,
      p.customer_email,
      p.flow,
      p.status,
      p.fulfillment_status,
      p.created_at,
      p.updated_at,
      p.intake_submitted_at,
      p.operator_reviewed_at,
      p.fulfillment_started_at,
      p.delivered_at,
      p.intake_artifact_links
    from public.guest_audit_purchases as p
    where p.flow = 'osiris-audit-v1'
  ),
  actionable as (
    select *
    from snapshot_rows
    where fulfillment_status = any (
      array[
        'intake_pending',
        'intake_complete',
        'fulfillment_started',
        'paused'
      ]::text[]
    )
  ),
  terminal as (
    select *
    from snapshot_rows
    where fulfillment_status = any (array['delivered', 'refunded']::text[])
    order by created_at desc nulls last, id desc
    limit 100
  )
  select * from actionable
  union all
  select * from terminal
  order by created_at desc nulls last, id desc;
$$;

revoke all on function public.mopcon_case_projection() from public;
revoke all on function public.mopcon_case_projection() from anon;
revoke all on function public.mopcon_case_projection() from authenticated;
grant execute on function public.mopcon_case_projection() to service_role;

comment on function public.mopcon_case_projection() is
  'Read-only MOPCON Osiris case projection: all actionable rows plus latest 100 terminal rows from one statement snapshot.';

commit;
