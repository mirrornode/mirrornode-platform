-- Osiris Audit v1: track dispute state separately from refund state.
--
-- PROPOSED, NOT APPLIED. This file is part of a draft pull request. It has not
-- been applied to any hosted Supabase project and needs review and Operator
-- authorization before it is. It depends on
-- 20261118193000_keep_guest_audit_refunds_monotonic.sql (same pull request).
--
-- Why: the payment status column held both refund and dispute state. A
-- dispute plus a partial refund on the same payment left only
-- 'partially_refunded' visible, hiding the open dispute. Dispute state now has
-- its own columns, written only by the webhook's dispute handler:
--   * dispute_id      Stripe dispute id (dp_...)
--   * dispute_status  Stripe dispute status, as Stripe sends it
-- There is no CHECK constraint on dispute_status, so a status Stripe adds later
-- cannot make the webhook fail and retry forever.
--
-- Rules added:
--   * Trigger: a closed status of a dispute (won, lost, warning_closed,
--     prevented) is never replaced for the same dispute_id. A late or replayed
--     open event therefore cannot reopen it. A different dispute_id is allowed.
--   * Fulfillment start RPC: refuses a case whose dispute is open, lost or
--     prevented. Only no dispute, 'won' or 'warning_closed' can start.
-- The existing refund rules in the trigger are unchanged. Payment status
-- 'disputed' is no longer written by the application.

begin;

alter table public.guest_audit_purchases
  add column if not exists dispute_id text,
  add column if not exists dispute_status text;

comment on column public.guest_audit_purchases.dispute_id is
  'Stripe dispute id for the most recent dispute recorded against this purchase.';

comment on column public.guest_audit_purchases.dispute_status is
  'Stripe dispute status for dispute_id, tracked separately from the refund state in status.';

create or replace function public.guest_audit_purchases_keep_refunds()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
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

  -- A closed dispute stays closed for the same dispute id.
  if old.dispute_status in ('won', 'lost', 'warning_closed', 'prevented')
     and (new.dispute_id is null or new.dispute_id = old.dispute_id) then
    new.dispute_id := old.dispute_id;
    new.dispute_status := old.dispute_status;
  end if;

  return new;
end
$$;

revoke all privileges on function public.guest_audit_purchases_keep_refunds()
  from public, anon, authenticated;

comment on function public.guest_audit_purchases_keep_refunds() is
  'Keeps refunded and partially refunded Osiris Audit v1 purchases from being reopened, and keeps a closed dispute closed.';

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
     or (v_target.dispute_status is not null
         and v_target.dispute_status not in ('won', 'warning_closed'))
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
  'Atomically advances one paid, authorized, intake-complete Osiris Audit v1 case with no open or lost dispute into fulfillment with Operator attribution and idempotent receipt binding.';

commit;
