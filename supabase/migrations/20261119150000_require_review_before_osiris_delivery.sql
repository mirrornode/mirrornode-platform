-- PROPOSED, repository file only. Not applied to any hosted project.
--
-- Osiris Audit v1: a case can be marked delivered only for the exact artifact an
-- operator reviewed and passed, by a recorded operator, once.
--
-- Before this migration any writer with UPDATE on guest_audit_purchases (the
-- service role included) could set fulfillment_status = 'delivered' with no
-- review on record. The runbook asked for a review; nothing enforced it.
--
-- This migration:
--   1. adds review and delivery evidence columns;
--   2. adds two functions, the only way to write that evidence:
--        record_osiris_audit_review_v1   (fulfillment_started cases only)
--        deliver_osiris_audit_v1         (latest review must be PASS for this artifact)
--      They run as their owner (SECURITY DEFINER), are pinned to pg_catalog,
--      and only service_role may execute them;
--   3. narrows the service role's INSERT and UPDATE privileges to the existing
--      columns, so it cannot write the new evidence columns directly;
--   4. adds a BEFORE INSERT OR UPDATE trigger that refuses, for every writer:
--        - entering 'delivered' without a PASS review of the same artifact,
--          a delivery actor, event id and time, or from any state but
--          fulfillment_started, or while a dispute holds the case;
--        - leaving 'delivered' for anything but 'refunded';
--        - changing review or delivery evidence once delivered;
--        - entering 'fulfillment_started' without a start receipt;
--        - inserting a row already started or delivered.
--      Pausing a started case voids its review (evidence kept, verdict VOID),
--      so a resumed case needs a fresh review before delivery.
--
-- A database superuser or the table owner can still bypass this (for example by
-- disabling the trigger). That boundary is stated for THOTH, not hidden.

alter table public.guest_audit_purchases
  add column if not exists delivery_review_artifact_digest text,
  add column if not exists delivery_review_verdict text,
  add column if not exists delivery_reviewed_by text,
  add column if not exists delivery_reviewed_at timestamp with time zone,
  add column if not exists delivery_review_event_id uuid,
  add column if not exists delivered_artifact_digest text,
  add column if not exists delivered_by text,
  add column if not exists delivery_event_id uuid,
  add column if not exists delivery_idempotency_key uuid;

alter table public.guest_audit_purchases
  drop constraint if exists guest_audit_purchases_delivery_review_digest_check,
  add constraint guest_audit_purchases_delivery_review_digest_check
    check (delivery_review_artifact_digest is null or delivery_review_artifact_digest ~ '^sha256:[0-9a-f]{64}$'),
  drop constraint if exists guest_audit_purchases_delivered_digest_check,
  add constraint guest_audit_purchases_delivered_digest_check
    check (delivered_artifact_digest is null or delivered_artifact_digest ~ '^sha256:[0-9a-f]{64}$'),
  drop constraint if exists guest_audit_purchases_delivery_review_verdict_check,
  add constraint guest_audit_purchases_delivery_review_verdict_check
    check (delivery_review_verdict is null or delivery_review_verdict in ('PASS', 'FAIL', 'VOID'));

create unique index if not exists guest_audit_purchases_delivery_idempotency_key_idx
  on public.guest_audit_purchases (delivery_idempotency_key)
  where delivery_idempotency_key is not null;

comment on column public.guest_audit_purchases.delivery_review_verdict is
  'Latest operator quality review of the deliverable: PASS, FAIL, or VOID (voided by a pause). Written only by record_osiris_audit_review_v1.';
comment on column public.guest_audit_purchases.delivered_artifact_digest is
  'sha256 of the artifact actually delivered; must equal the PASS review digest. Written only by deliver_osiris_audit_v1.';

-- Service role: keep INSERT and UPDATE on every column that existed before this
-- migration, and none on the new evidence columns.
do $$
declare
  v_cols text;
begin
  select string_agg(pg_catalog.quote_ident(column_name), ', ' order by ordinal_position)
  into v_cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'guest_audit_purchases'
    and is_generated = 'NEVER'
    and column_name not in (
      'delivery_review_artifact_digest', 'delivery_review_verdict', 'delivery_reviewed_by',
      'delivery_reviewed_at', 'delivery_review_event_id', 'delivered_artifact_digest',
      'delivered_by', 'delivery_event_id', 'delivery_idempotency_key'
    );
  execute 'revoke insert, update on table public.guest_audit_purchases from service_role';
  execute pg_catalog.format('grant insert (%s), update (%s) on table public.guest_audit_purchases to service_role', v_cols, v_cols);
end
$$;

create or replace function public.guest_audit_purchases_require_review()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if tg_op = 'INSERT' then
    if new.fulfillment_status in ('fulfillment_started', 'delivered')
       or new.delivered_at is not null
       or new.delivery_review_verdict is not null
       or new.delivered_artifact_digest is not null then
      raise exception using errcode = 'P0001',
        message = 'OSIRIS_PROMOTION_REFUSED: a new purchase row cannot start as started, reviewed or delivered';
    end if;
    return new;
  end if;

  -- Leaving delivered: only a refund may follow, and evidence never changes.
  if old.fulfillment_status = 'delivered' then
    if new.fulfillment_status not in ('delivered', 'refunded') then
      raise exception using errcode = 'P0001',
        message = 'OSIRIS_DELIVERY_FINAL: a delivered case can only become refunded';
    end if;
    if (new.delivered_at, new.delivered_artifact_digest, new.delivered_by, new.delivery_event_id,
        new.delivery_idempotency_key, new.delivery_review_artifact_digest, new.delivery_review_verdict,
        new.delivery_reviewed_by, new.delivery_reviewed_at, new.delivery_review_event_id)
       is distinct from
       (old.delivered_at, old.delivered_artifact_digest, old.delivered_by, old.delivery_event_id,
        old.delivery_idempotency_key, old.delivery_review_artifact_digest, old.delivery_review_verdict,
        old.delivery_reviewed_by, old.delivery_reviewed_at, old.delivery_review_event_id) then
      raise exception using errcode = 'P0001',
        message = 'OSIRIS_DELIVERY_FINAL: review and delivery evidence cannot change after delivery';
    end if;
    return new;
  end if;

  -- Entering fulfillment_started needs the start receipt (start RPC, or an
  -- operator resume of a case that already has one).
  if new.fulfillment_status = 'fulfillment_started'
     and old.fulfillment_status is distinct from 'fulfillment_started'
     and (new.fulfillment_start_event_id is null
          or new.fulfillment_started_by is null
          or new.operator_reviewed_at is null
          or new.fulfillment_started_at is null) then
    raise exception using errcode = 'P0001',
      message = 'OSIRIS_PROMOTION_REFUSED: fulfillment_started requires a start receipt';
  end if;

  -- Pausing a started case voids its review; the evidence stays.
  if new.fulfillment_status = 'paused'
     and old.fulfillment_status = 'fulfillment_started'
     and new.delivery_review_verdict = 'PASS' then
    new.delivery_review_verdict := 'VOID';
  end if;

  -- Review evidence can only change while the case is started.
  if (new.delivery_review_artifact_digest, new.delivery_review_verdict, new.delivery_reviewed_by,
      new.delivery_reviewed_at, new.delivery_review_event_id)
     is distinct from
     (old.delivery_review_artifact_digest, old.delivery_review_verdict, old.delivery_reviewed_by,
      old.delivery_reviewed_at, old.delivery_review_event_id)
     and not (old.fulfillment_status = 'fulfillment_started'
              and new.fulfillment_status in ('fulfillment_started', 'paused')) then
    raise exception using errcode = 'P0001',
      message = 'OSIRIS_REVIEW_REFUSED: a review can only be recorded on a started case';
  end if;

  if new.fulfillment_status = 'delivered' then
    if old.fulfillment_status <> 'fulfillment_started'
       or new.status <> 'paid'
       or old.dispute_hold
       or new.disputes is distinct from old.disputes
       or old.delivery_review_verdict is distinct from 'PASS'
       or (new.delivery_review_artifact_digest, new.delivery_review_verdict, new.delivery_reviewed_by,
           new.delivery_reviewed_at, new.delivery_review_event_id)
          is distinct from
          (old.delivery_review_artifact_digest, old.delivery_review_verdict, old.delivery_reviewed_by,
           old.delivery_reviewed_at, old.delivery_review_event_id)
       or new.delivered_artifact_digest is distinct from old.delivery_review_artifact_digest
       or nullif(pg_catalog.btrim(new.delivered_by), '') is null
       or new.delivery_event_id is null
       or new.delivered_at is null then
      raise exception using errcode = 'P0001',
        message = 'OSIRIS_DELIVERY_REQUIRES_REVIEW: delivered needs a PASS review of the same artifact, recorded before delivery';
    end if;
  elsif (new.delivered_at, new.delivered_artifact_digest, new.delivered_by, new.delivery_event_id,
         new.delivery_idempotency_key)
        is distinct from
        (old.delivered_at, old.delivered_artifact_digest, old.delivered_by, old.delivery_event_id,
         old.delivery_idempotency_key) then
    raise exception using errcode = 'P0001',
      message = 'OSIRIS_DELIVERY_REQUIRES_REVIEW: delivery evidence can only be written by a delivery';
  end if;

  return new;
end
$$;

revoke all privileges on function public.guest_audit_purchases_require_review()
  from public, anon, authenticated;

-- Fires after guest_audit_purchases_keep_refunds (triggers run in name order),
-- so refund clamping is applied first.
drop trigger if exists guest_audit_purchases_require_review on public.guest_audit_purchases;
create trigger guest_audit_purchases_require_review
  before insert or update on public.guest_audit_purchases
  for each row execute function public.guest_audit_purchases_require_review();

create or replace function public.record_osiris_audit_review_v1(
  p_stripe_session_id text,
  p_artifact_digest text,
  p_verdict text,
  p_actor_id text,
  p_event_id uuid
)
returns table (
  outcome text,
  case_session_id text,
  fulfillment_status text,
  review_verdict text,
  review_artifact_digest text,
  reviewed_by text,
  reviewed_at timestamp with time zone
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_row public.guest_audit_purchases%rowtype;
  v_now timestamp with time zone := pg_catalog.clock_timestamp();
begin
  if p_stripe_session_id is null
     or p_event_id is null
     or p_artifact_digest is null
     or p_artifact_digest !~ '^sha256:[0-9a-f]{64}$'
     or p_verdict is null
     or p_verdict not in ('PASS', 'FAIL')
     or nullif(pg_catalog.btrim(p_actor_id), '') is null then
    raise exception using errcode = '22023', message = 'invalid Osiris review command';
  end if;

  select * into v_row
  from public.guest_audit_purchases g
  where g.stripe_session_id = p_stripe_session_id
  for update;

  if not found then
    return query select 'NOT_FOUND'::text, p_stripe_session_id, null::text, null::text, null::text, null::text, null::timestamp with time zone;
    return;
  end if;

  if v_row.fulfillment_status = 'delivered' then
    return query select 'ALREADY_DELIVERED'::text, v_row.stripe_session_id, v_row.fulfillment_status,
      v_row.delivery_review_verdict, v_row.delivery_review_artifact_digest, v_row.delivery_reviewed_by, v_row.delivery_reviewed_at;
    return;
  end if;

  if v_row.flow is distinct from 'osiris-audit-v1'
     or v_row.status is distinct from 'paid'
     or v_row.dispute_hold
     or v_row.fulfillment_status <> 'fulfillment_started' then
    return query select 'NOT_READY'::text, v_row.stripe_session_id, v_row.fulfillment_status,
      v_row.delivery_review_verdict, v_row.delivery_review_artifact_digest, v_row.delivery_reviewed_by, v_row.delivery_reviewed_at;
    return;
  end if;

  update public.guest_audit_purchases g
  set delivery_review_artifact_digest = p_artifact_digest,
      delivery_review_verdict = p_verdict,
      delivery_reviewed_by = pg_catalog.btrim(p_actor_id),
      delivery_reviewed_at = v_now,
      delivery_review_event_id = p_event_id,
      updated_at = v_now
  where g.stripe_session_id = p_stripe_session_id
  returning * into v_row;

  return query select 'RECORDED'::text, v_row.stripe_session_id, v_row.fulfillment_status,
    v_row.delivery_review_verdict, v_row.delivery_review_artifact_digest, v_row.delivery_reviewed_by, v_row.delivery_reviewed_at;
end
$$;

create or replace function public.deliver_osiris_audit_v1(
  p_stripe_session_id text,
  p_artifact_digest text,
  p_actor_id text,
  p_idempotency_key uuid,
  p_event_id uuid
)
returns table (
  outcome text,
  case_session_id text,
  fulfillment_status text,
  delivered_artifact_digest text,
  delivered_by text,
  delivered_at timestamp with time zone,
  delivery_event_id uuid
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_row public.guest_audit_purchases%rowtype;
  v_now timestamp with time zone := pg_catalog.clock_timestamp();
begin
  if p_stripe_session_id is null
     or p_idempotency_key is null
     or p_event_id is null
     or p_artifact_digest is null
     or p_artifact_digest !~ '^sha256:[0-9a-f]{64}$'
     or nullif(pg_catalog.btrim(p_actor_id), '') is null then
    raise exception using errcode = '22023', message = 'invalid Osiris delivery command';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('osiris-delivery:' || p_idempotency_key::text, 0));

  select * into v_row
  from public.guest_audit_purchases g
  where g.delivery_idempotency_key = p_idempotency_key
  for update;

  if found then
    return query select
      (case when v_row.stripe_session_id = p_stripe_session_id then 'IDEMPOTENT' else 'IDEMPOTENCY_CONFLICT' end)::text,
      v_row.stripe_session_id, v_row.fulfillment_status, v_row.delivered_artifact_digest,
      v_row.delivered_by, v_row.delivered_at, v_row.delivery_event_id;
    return;
  end if;

  select * into v_row
  from public.guest_audit_purchases g
  where g.stripe_session_id = p_stripe_session_id
  for update;

  if not found then
    return query select 'NOT_FOUND'::text, p_stripe_session_id, null::text, null::text, null::text, null::timestamp with time zone, null::uuid;
    return;
  end if;

  if v_row.fulfillment_status = 'delivered' then
    return query select 'ALREADY_DELIVERED'::text, v_row.stripe_session_id, v_row.fulfillment_status,
      v_row.delivered_artifact_digest, v_row.delivered_by, v_row.delivered_at, v_row.delivery_event_id;
    return;
  end if;

  if v_row.flow is distinct from 'osiris-audit-v1'
     or v_row.status is distinct from 'paid'
     or v_row.dispute_hold
     or v_row.fulfillment_status <> 'fulfillment_started' then
    return query select 'NOT_READY'::text, v_row.stripe_session_id, v_row.fulfillment_status,
      null::text, null::text, null::timestamp with time zone, null::uuid;
    return;
  end if;

  if v_row.delivery_review_verdict is distinct from 'PASS' then
    return query select 'REVIEW_REQUIRED'::text, v_row.stripe_session_id, v_row.fulfillment_status,
      null::text, null::text, null::timestamp with time zone, null::uuid;
    return;
  end if;

  if v_row.delivery_review_artifact_digest is distinct from p_artifact_digest then
    return query select 'ARTIFACT_MISMATCH'::text, v_row.stripe_session_id, v_row.fulfillment_status,
      null::text, null::text, null::timestamp with time zone, null::uuid;
    return;
  end if;

  update public.guest_audit_purchases g
  set fulfillment_status = 'delivered',
      delivered_at = v_now,
      delivered_artifact_digest = p_artifact_digest,
      delivered_by = pg_catalog.btrim(p_actor_id),
      delivery_event_id = p_event_id,
      delivery_idempotency_key = p_idempotency_key,
      updated_at = v_now
  where g.stripe_session_id = p_stripe_session_id
  returning * into v_row;

  return query select 'DELIVERED'::text, v_row.stripe_session_id, v_row.fulfillment_status,
    v_row.delivered_artifact_digest, v_row.delivered_by, v_row.delivered_at, v_row.delivery_event_id;
end
$$;

revoke all privileges on function public.record_osiris_audit_review_v1(text, text, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.record_osiris_audit_review_v1(text, text, text, text, uuid)
  to service_role;

revoke all privileges on function public.deliver_osiris_audit_v1(text, text, text, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.deliver_osiris_audit_v1(text, text, text, uuid, uuid)
  to service_role;

comment on function public.record_osiris_audit_review_v1(text, text, text, text, uuid) is
  'Records the operator quality review (PASS or FAIL) of one artifact digest for a started Osiris Audit v1 case. The latest review replaces an earlier one until delivery.';
comment on function public.deliver_osiris_audit_v1(text, text, text, uuid, uuid) is
  'Marks an Osiris Audit v1 case delivered, once, only for the artifact digest the latest PASS review covers.';
