-- Schema Baseline Reconciliation PR only.
--
-- Purpose:
--   Converge a legacy repository-shaped guest_audit_purchases table
--   (stripe_session_id as the primary key) to the live authoritative shape
--   (id uuid primary key; stripe_session_id unique).
--
-- Non-goals:
--   No receipt table, fulfillment RPC, command endpoint, credential, actor
--   binding, RLS policy change, grant change, or MOPCON change.
--
-- Production safety:
--   When the exact target shape is already present, this migration takes a
--   no-op branch before any table DML or DDL.

begin;

select pg_catalog.pg_advisory_xact_lock(
  pg_catalog.hashtext(
    'mirrornode:guest_audit_purchases:uuid-identity-reconciliation:v1'
  )
);

do $$
declare
  v_table regclass;

  v_id_exists boolean;
  v_id_is_uuid boolean;
  v_id_is_not_null boolean;
  v_id_has_uuid_default boolean;

  v_session_exists boolean;
  v_session_is_not_null boolean;
  v_session_unique boolean;

  v_pk_name text;
  v_pk_columns text[];
  v_pk_is_id boolean;
  v_pk_is_session boolean;

  v_target_shape boolean;
  v_inbound_fk_count integer;

  v_null_id_count bigint;
  v_null_session_count bigint;
  v_duplicate_session_count bigint;
begin
  v_table := to_regclass('public.guest_audit_purchases');

  if v_table is null then
    raise exception using
      errcode = 'P0001',
      message =
        'guest_audit_purchases UUID identity reconciliation aborted: required table is absent';
  end if;

  select
    exists (
      select 1
      from pg_catalog.pg_attribute a
      where a.attrelid = v_table
        and a.attname = 'id'
        and a.attnum > 0
        and not a.attisdropped
    ),
    exists (
      select 1
      from pg_catalog.pg_attribute a
      join pg_catalog.pg_type t on t.oid = a.atttypid
      where a.attrelid = v_table
        and a.attname = 'id'
        and a.attnum > 0
        and not a.attisdropped
        and t.typname = 'uuid'
    ),
    exists (
      select 1
      from pg_catalog.pg_attribute a
      where a.attrelid = v_table
        and a.attname = 'id'
        and a.attnum > 0
        and not a.attisdropped
        and a.attnotnull
    ),
    exists (
      select 1
      from pg_catalog.pg_attribute a
      join pg_catalog.pg_attrdef d
        on d.adrelid = a.attrelid
       and d.adnum = a.attnum
      where a.attrelid = v_table
        and a.attname = 'id'
        and a.attnum > 0
        and not a.attisdropped
        and pg_catalog.pg_get_expr(d.adbin, d.adrelid)
          in ('gen_random_uuid()', 'extensions.gen_random_uuid()')
    )
  into
    v_id_exists,
    v_id_is_uuid,
    v_id_is_not_null,
    v_id_has_uuid_default;

  select
    exists (
      select 1
      from pg_catalog.pg_attribute a
      where a.attrelid = v_table
        and a.attname = 'stripe_session_id'
        and a.attnum > 0
        and not a.attisdropped
    ),
    exists (
      select 1
      from pg_catalog.pg_attribute a
      where a.attrelid = v_table
        and a.attname = 'stripe_session_id'
        and a.attnum > 0
        and not a.attisdropped
        and a.attnotnull
    )
  into
    v_session_exists,
    v_session_is_not_null;

  if not v_session_exists then
    raise exception using
      errcode = 'P0001',
      message =
        'guest_audit_purchases UUID identity reconciliation aborted: stripe_session_id column is absent';
  end if;

  select c.conname,
         array_agg(a.attname::text order by key_columns.ordinality)
  into v_pk_name, v_pk_columns
  from pg_catalog.pg_constraint c
  join lateral unnest(c.conkey) with ordinality
    as key_columns(attnum, ordinality)
    on true
  join pg_catalog.pg_attribute a
    on a.attrelid = c.conrelid
   and a.attnum = key_columns.attnum
  where c.conrelid = v_table
    and c.contype = 'p'
  group by c.conname;

  v_pk_is_id =
    coalesce(v_pk_columns, array[]::text[]) = array['id']::text[];

  v_pk_is_session =
    coalesce(v_pk_columns, array[]::text[])
      = array['stripe_session_id']::text[];

  select exists (
    select 1
    from pg_catalog.pg_constraint c
    join lateral unnest(c.conkey) with ordinality
      as key_columns(attnum, ordinality)
      on true
    join pg_catalog.pg_attribute a
      on a.attrelid = c.conrelid
     and a.attnum = key_columns.attnum
    where c.conrelid = v_table
      and c.contype = 'u'
    group by c.oid
    having array_agg(a.attname::text order by key_columns.ordinality)
      = array['stripe_session_id']::text[]
  )
  into v_session_unique;

  v_target_shape =
    v_id_exists
    and v_id_is_uuid
    and v_id_is_not_null
    and v_id_has_uuid_default
    and v_session_exists
    and v_session_is_not_null
    and v_session_unique
    and v_pk_is_id;

  -- Production / target-state no-op:
  -- no update, alter table, RLS, policy, or grant operation is issued.
  if not v_target_shape then
    -- Only the legacy repository shape is upgradeable by this bounded migration.
    if not v_pk_is_session then
      raise exception using
        errcode = 'P0001',
        message =
          'guest_audit_purchases UUID identity reconciliation aborted: primary key is neither id nor stripe_session_id';
    end if;

    if v_id_exists and not v_id_is_uuid then
      raise exception using
        errcode = 'P0001',
        message =
          'guest_audit_purchases UUID identity reconciliation aborted: existing id column is not uuid';
    end if;

    select count(*)
    into v_inbound_fk_count
    from pg_catalog.pg_constraint c
    where c.contype = 'f'
      and c.confrelid = v_table;

    if v_inbound_fk_count <> 0 then
      raise exception using
        errcode = 'P0001',
        message =
          'guest_audit_purchases UUID identity reconciliation aborted: inbound foreign keys require a separately reviewed migration';
    end if;

    -- Freeze the supported legacy table while validating and replacing keys.
    lock table public.guest_audit_purchases in access exclusive mode;

    if not v_id_exists then
      alter table public.guest_audit_purchases
        add column id uuid;
    end if;

    select count(*)
    into v_null_session_count
    from public.guest_audit_purchases
    where stripe_session_id is null;

    if v_null_session_count <> 0 then
      raise exception using
        errcode = 'P0001',
        message =
          'guest_audit_purchases UUID identity reconciliation aborted: stripe_session_id contains null values';
    end if;

    select count(*)
    into v_duplicate_session_count
    from (
      select stripe_session_id
      from public.guest_audit_purchases
      group by stripe_session_id
      having count(*) > 1
    ) duplicates;

    if v_duplicate_session_count <> 0 then
      raise exception using
        errcode = 'P0001',
        message =
          'guest_audit_purchases UUID identity reconciliation aborted: stripe_session_id contains duplicate values';
    end if;

    update public.guest_audit_purchases
    set id = gen_random_uuid()
    where id is null;

    select count(*)
    into v_null_id_count
    from public.guest_audit_purchases
    where id is null;

    if v_null_id_count <> 0 then
      raise exception using
        errcode = 'P0001',
        message =
          'guest_audit_purchases UUID identity reconciliation aborted: UUID backfill left null id values';
    end if;

    alter table public.guest_audit_purchases
      alter column id set default gen_random_uuid();

    alter table public.guest_audit_purchases
      alter column id set not null;

    -- The legacy primary key itself already guarantees stripe_session_id
    -- uniqueness. The primary-key replacement and replacement unique constraint
    -- run in one transaction, so no session can observe a committed gap.
    execute format(
      'alter table public.guest_audit_purchases drop constraint %I',
      v_pk_name
    );

    alter table public.guest_audit_purchases
      add constraint guest_audit_purchases_pkey primary key (id);

    alter table public.guest_audit_purchases
      add constraint guest_audit_purchases_stripe_session_id_key
      unique (stripe_session_id);
  end if;
end
$$;

commit;
