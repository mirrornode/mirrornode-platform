begin;

drop table if exists public.guest_audit_purchases cascade;

create table public.guest_audit_purchases (
  stripe_session_id text primary key,
  customer_email text,
  fulfillment_status text not null default 'intake_pending',
  intake_system_summary text,
  intake_primary_goal text,
  intake_concerns text,
  intake_artifact_links jsonb not null default '[]'::jsonb,
  intake_additional_context text,
  intake_submitted_at timestamptz,
  operator_reviewed_at timestamptz,
  fulfillment_started_at timestamptz,
  delivered_at timestamptz
);

insert into public.guest_audit_purchases (
  stripe_session_id,
  customer_email,
  fulfillment_status,
  intake_system_summary,
  intake_primary_goal,
  intake_concerns,
  intake_artifact_links,
  intake_additional_context,
  intake_submitted_at,
  operator_reviewed_at,
  fulfillment_started_at,
  delivered_at
)
values (
  'cs_preservation_case',
  'preservation@example.test',
  'delivered',
  'System summary',
  'Primary goal',
  'Concern list',
  '["https://example.test/repository"]'::jsonb,
  'Additional context',
  '2026-07-01 12:00:00+00',
  '2026-07-02 12:00:00+00',
  '2026-07-02 12:30:00+00',
  '2026-07-03 15:00:00+00'
);

create temporary table legacy_snapshot as
select
  stripe_session_id,
  customer_email,
  fulfillment_status,
  intake_system_summary,
  intake_primary_goal,
  intake_concerns,
  intake_artifact_links,
  intake_additional_context,
  intake_submitted_at,
  operator_reviewed_at,
  fulfillment_started_at,
  delivered_at
from public.guest_audit_purchases;

\i :migration_file

create temporary table first_upgrade_snapshot as
select id, stripe_session_id
from public.guest_audit_purchases;

\i :migration_file

do $$
begin
  if exists (
    (
      select
        stripe_session_id,
        customer_email,
        fulfillment_status,
        intake_system_summary,
        intake_primary_goal,
        intake_concerns,
        intake_artifact_links,
        intake_additional_context,
        intake_submitted_at,
        operator_reviewed_at,
        fulfillment_started_at,
        delivered_at
      from public.guest_audit_purchases
    )
    except
    (
      select
        stripe_session_id,
        customer_email,
        fulfillment_status,
        intake_system_summary,
        intake_primary_goal,
        intake_concerns,
        intake_artifact_links,
        intake_additional_context,
        intake_submitted_at,
        operator_reviewed_at,
        fulfillment_started_at,
        delivered_at
      from legacy_snapshot
    )
  ) then
    raise exception 'data-preservation failed: migrated data differs from legacy snapshot';
  end if;

  if exists (
    (
      select id, stripe_session_id
      from public.guest_audit_purchases
    )
    except
    (
      select id, stripe_session_id
      from first_upgrade_snapshot
    )
  ) then
    raise exception 'rerun failed: UUID identities changed on target-state rerun';
  end if;
end
$$;

rollback;
