-- Osiris Audit v1: track dispute state separately from refund state.
--
-- PROPOSED, NOT APPLIED. This file is part of a draft pull request. It has not
-- been applied to any hosted Supabase project and needs review and Operator
-- authorization before it is. It depends on
-- 20261118193000_keep_guest_audit_refunds_monotonic.sql (same pull request).
--
-- Why: the payment status column held both refund and dispute state. A
-- dispute plus a partial refund on the same payment left only
-- 'partially_refunded' visible, hiding the open dispute. A single "current
-- dispute" column has the same problem one level down: a charge can have an
-- inquiry and then a chargeback, and Stripe can deliver their events late or
-- more than once, so an event for one dispute could hide the other.
--
-- Dispute state is now kept per dispute:
--   * disputes      jsonb object, Stripe dispute id -> latest Stripe status,
--                   e.g. {"dp_1": "warning_closed", "dp_2": "needs_response"}.
--   * dispute_hold  generated: true while any recorded dispute is open, lost
--                   or prevented (anything but 'won' or 'warning_closed').
-- Statuses are not constrained, so a status Stripe adds later cannot make the
-- webhook fail and retry; an unknown status counts as a hold.
--
-- Rules:
--   * record_osiris_audit_dispute_v1 (service_role only) is the one writer of
--     dispute state. It sets one dispute's status, never changes a dispute
--     whose recorded status is closed (won, lost, warning_closed, prevented),
--     and pauses an active case while dispute_hold is true. It never unpauses.
--   * Trigger: for every other writer, a dispute is never removed from the map
--     and a closed dispute's status never changes.
--   * Intake (application) and the fulfillment start RPC refuse a case while
--     dispute_hold is true.
-- The existing refund rules in the trigger are unchanged. Payment status
-- 'disputed' is no longer written by the application.

begin;

alter table public.guest_audit_purchases
  add column if not exists disputes jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.guest_audit_purchases'::regclass
      and conname = 'guest_audit_purchases_disputes_object_check'
  ) then
    alter table public.guest_audit_purchases
      add constraint guest_audit_purchases_disputes_object_check
      check (pg_catalog.jsonb_typeof(disputes) = 'object');
  end if;
end
$$;

alter table public.guest_audit_purchases
  add column if not exists dispute_hold boolean
  generated always as (
    pg_catalog.jsonb_path_exists(disputes, '$.* ? (@ != "won" && @ != "warning_closed")')
  ) stored;

comment on column public.guest_audit_purchases.disputes is
  'Stripe dispute id -> latest Stripe dispute status, one entry per dispute. Tracked separately from the refund state in status.';

comment on column public.guest_audit_purchases.dispute_hold is
  'True while any recorded dispute is open, lost or prevented. Intake and fulfillment start refuse the case while it is true.';

create or replace function public.guest_audit_purchases_keep_refunds()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_key text;
  v_status text;
begin
  if old.status = 'refunded' then
    new.status := 'refunded';
  elsif old.status = 'partially_refunded'
        and new.status not in ('partially_refunded', 'refunded') then
    new.status := 'partially_refunded';
  end if;

  if old.fulfillment_status = 'refunded' then
    new.fulfillment_status := 'refunded';
  end if;

  -- Disputes: an entry is never removed, and a closed entry never changes.
  if new.disputes is null or pg_catalog.jsonb_typeof(new.disputes) <> 'object' then
    new.disputes := old.disputes;
  end if;
  for v_key, v_status in
    select e.key, e.value from pg_catalog.jsonb_each_text(old.disputes) as e
  loop
    if v_status in ('won', 'lost', 'warning_closed', 'prevented')
       or (new.disputes ->> v_key) is null then
      new.disputes := new.disputes || pg_catalog.jsonb_build_object(v_key, v_status);
    end if;
  end loop;

  return new;
end
$$;

revoke all privileges on function public.guest_audit_purchases_keep_refunds()
  from public, anon, authenticated;

comment on function public.guest_audit_purchases_keep_refunds() is
  'Keeps refunded and partially refunded Osiris Audit v1 purchases from being reopened, and keeps each closed dispute closed.';

create or replace function public.record_osiris_audit_dispute_v1(
  p_stripe_session_id text,
  p_dispute_id text,
  p_dispute_status text
)
returns table (
  fulfillment_status text,
  dispute_hold boolean,
  recorded_status text
)
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
#variable_conflict use_column
begin
  if p_stripe_session_id is null
     or p_dispute_id is null
     or p_dispute_id !~ '^[A-Za-z0-9_]+$'
     or nullif(pg_catalog.btrim(p_dispute_status), '') is null then
    raise exception using
      errcode = '22023',
      message = 'invalid Osiris dispute record';
  end if;

  -- One statement under the row lock: set this dispute's status unless its
  -- recorded status is already closed. Other disputes are untouched.
  update public.guest_audit_purchases g
  set
    disputes = case
      when (g.disputes ->> p_dispute_id) in ('won', 'lost', 'warning_closed', 'prevented')
        then g.disputes
      else g.disputes || pg_catalog.jsonb_build_object(p_dispute_id, p_dispute_status)
    end,
    updated_at = pg_catalog.now()
  where g.stripe_session_id = p_stripe_session_id;

  -- Same transaction, row still locked: pause an active case while any
  -- dispute holds it. Never unpauses.
  update public.guest_audit_purchases g
  set fulfillment_status = 'paused', updated_at = pg_catalog.now()
  where g.stripe_session_id = p_stripe_session_id
    and g.dispute_hold
    and g.fulfillment_status in ('intake_pending', 'intake_complete', 'fulfillment_started');

  return query
  select g.fulfillment_status, g.dispute_hold, g.disputes ->> p_dispute_id
  from public.guest_audit_purchases g
  where g.stripe_session_id = p_stripe_session_id;
end;
$$;

revoke all privileges on function public.record_osiris_audit_dispute_v1(text, text, text)
  from public, anon, authenticated;

grant execute on function public.record_osiris_audit_dispute_v1(text, text, text)
  to service_role;

comment on function public.record_osiris_audit_dispute_v1(text, text, text) is
  'Records one Stripe dispute status for an Osiris Audit v1 purchase, keeps closed disputes closed, and pauses an active case while any dispute holds it.';

create or replace function public.start_osiris_audit_fulfillment_v1(
  p_stripe_session_id text,
  p_idempotency_key uuid,
  p_actor_id text,
  p_reason text,
  p_event_id uuid
)
returns table (
  outcome text,
  case_session_id text,
  fulfillment_status text,
  activation_event_id uuid,
  idempotency_key uuid,
  operator_id text,
  start_reason text,
  operator_reviewed_at timestamp with time zone,
  fulfillment_started_at timestamp with time zone
)
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_existing public.guest_audit_purchases%rowtype;
  v_target public.guest_audit_purchases%rowtype;
  v_now timestamp with time zone := pg_catalog.clock_timestamp();
begin
  if p_stripe_session_id is null
     or p_idempotency_key is null
     or p_event_id is null
     or nullif(pg_catalog.btrim(p_actor_id), '') is null
     or nullif(pg_catalog.btrim(p_reason), '') is null then
    raise exception using
      errcode = '22023',
      message = 'invalid Osiris fulfillment start command';
  end if;

  -- Serialize retries and cross-case reuse for this idempotency key before
  -- inspecting or mutating case state. Hash collisions can only serialize
  -- unrelated commands; they cannot weaken correctness.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_idempotency_key::text, 0)
  );

  select *
  into v_existing
  from public.guest_audit_purchases
  where fulfillment_start_idempotency_key = p_idempotency_key
  for update;

  if found then
    if v_existing.stripe_session_id = p_stripe_session_id then
      return query
      select
        'IDEMPOTENT'::text,
        v_existing.stripe_session_id,
        v_existing.fulfillment_status,
        v_existing.fulfillment_start_event_id,
        v_existing.fulfillment_start_idempotency_key,
        v_existing.fulfillment_started_by,
        v_existing.fulfillment_start_reason,
        v_existing.operator_reviewed_at,
        v_existing.fulfillment_started_at;
    else
      return query
      select
        'IDEMPOTENCY_CONFLICT'::text,
        p_stripe_session_id,
        null::text,
        null::uuid,
        p_idempotency_key,
        null::text,
        null::text,
        null::timestamp with time zone,
        null::timestamp with time zone;
    end if;
    return;
  end if;

  select *
  into v_target
  from public.guest_audit_purchases
  where stripe_session_id = p_stripe_session_id
  for update;

  if not found then
    return query
    select
      'NOT_FOUND'::text,
      p_stripe_session_id,
      null::text,
      null::uuid,
      p_idempotency_key,
      null::text,
      null::text,
      null::timestamp with time zone,
      null::timestamp with time zone;
    return;
  end if;

  if v_target.flow is distinct from 'osiris-audit-v1'
     or v_target.status is distinct from 'paid'
     or v_target.customer_email is null
     or v_target.fulfillment_status <> 'intake_complete'
     or v_target.dispute_hold
     or v_target.intake_submitted_at is null
     or v_target.intake_authorization_confirmed_at is null
     or v_target.intake_system_summary is null
     or v_target.intake_primary_goal is null
     or v_target.intake_concerns is null
     or nullif(pg_catalog.btrim(v_target.intake_channel_authorization_text), '') is null
     or v_target.operator_reviewed_at is not null
     or v_target.fulfillment_started_at is not null
     or v_target.fulfillment_start_idempotency_key is not null then
    return query
    select
      'NOT_READY'::text,
      v_target.stripe_session_id,
      v_target.fulfillment_status,
      v_target.fulfillment_start_event_id,
      v_target.fulfillment_start_idempotency_key,
      v_target.fulfillment_started_by,
      v_target.fulfillment_start_reason,
      v_target.operator_reviewed_at,
      v_target.fulfillment_started_at;
    return;
  end if;

  update public.guest_audit_purchases
  set
    operator_reviewed_at = v_now,
    fulfillment_started_at = v_now,
    fulfillment_status = 'fulfillment_started',
    fulfillment_start_event_id = p_event_id,
    fulfillment_start_idempotency_key = p_idempotency_key,
    fulfillment_started_by = pg_catalog.btrim(p_actor_id),
    fulfillment_start_reason = pg_catalog.btrim(p_reason),
    updated_at = v_now
  where stripe_session_id = p_stripe_session_id
  returning * into v_target;

  return query
  select
    'STARTED'::text,
    v_target.stripe_session_id,
    v_target.fulfillment_status,
    v_target.fulfillment_start_event_id,
    v_target.fulfillment_start_idempotency_key,
    v_target.fulfillment_started_by,
    v_target.fulfillment_start_reason,
    v_target.operator_reviewed_at,
    v_target.fulfillment_started_at;
end;
$$;

revoke all privileges on function public.start_osiris_audit_fulfillment_v1(
  text, uuid, text, text, uuid
) from public, anon, authenticated;

grant execute on function public.start_osiris_audit_fulfillment_v1(
  text, uuid, text, text, uuid
) to service_role;

comment on function public.start_osiris_audit_fulfillment_v1(
  text, uuid, text, text, uuid
) is
  'Atomically advances one paid, authorized, intake-complete Osiris Audit v1 case with no open, lost or prevented dispute into fulfillment with Operator attribution and idempotent receipt binding.';

commit;
