-- Osiris Audit v1 controlled fulfillment start.
--
-- Adds explicit intake authorization evidence and an attributable, idempotent
-- Operator start receipt. The transition remains service-role only and does not
-- authorize autonomous audit execution, delivery, or broader case mutation.

begin;

alter table public.guest_audit_purchases
  add column if not exists intake_authorization_confirmed_at timestamp with time zone,
  add column if not exists fulfillment_start_event_id uuid,
  add column if not exists fulfillment_start_idempotency_key uuid,
  add column if not exists fulfillment_started_by text,
  add column if not exists fulfillment_start_reason text;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.guest_audit_purchases'::regclass
      and conname = 'guest_audit_purchases_fulfillment_start_event_id_key'
  ) then
    alter table public.guest_audit_purchases
      add constraint guest_audit_purchases_fulfillment_start_event_id_key
      unique (fulfillment_start_event_id);
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.guest_audit_purchases'::regclass
      and conname = 'guest_audit_purchases_fulfillment_start_idempotency_key_key'
  ) then
    alter table public.guest_audit_purchases
      add constraint guest_audit_purchases_fulfillment_start_idempotency_key_key
      unique (fulfillment_start_idempotency_key);
  end if;
end
$$;

comment on column public.guest_audit_purchases.intake_authorization_confirmed_at is
  'Timestamp when the customer explicitly confirmed authorization to request assessment of the submitted scope.';

comment on column public.guest_audit_purchases.fulfillment_start_event_id is
  'Immutable receipt identifier for the Operator-controlled fulfillment start event.';

comment on column public.guest_audit_purchases.fulfillment_start_idempotency_key is
  'Caller-supplied UUID binding retries to the original fulfillment start event.';

comment on column public.guest_audit_purchases.fulfillment_started_by is
  'Authenticated Operator actor ID that started fulfillment.';

comment on column public.guest_audit_purchases.fulfillment_start_reason is
  'Operator-supplied reason recorded with the fulfillment start event.';

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

  if v_target.flow <> 'osiris-audit-v1'
     or v_target.status <> 'paid'
     or v_target.customer_email is null
     or v_target.fulfillment_status <> 'intake_complete'
     or v_target.intake_submitted_at is null
     or v_target.intake_authorization_confirmed_at is null
     or v_target.intake_system_summary is null
     or v_target.intake_primary_goal is null
     or v_target.intake_concerns is null
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
  'Atomically advances one paid, authorized, intake-complete Osiris Audit v1 case into fulfillment with Operator attribution and idempotent receipt binding.';

commit;
