begin;

drop table if exists public.guest_audit_purchases cascade;

create table public.guest_audit_purchases (
  stripe_session_id text primary key,
  customer_email text,
  fulfillment_status text not null default 'intake_pending',
  operator_reviewed_at timestamptz,
  fulfillment_started_at timestamptz,
  delivered_at timestamptz
);

insert into public.guest_audit_purchases (
  stripe_session_id,
  customer_email,
  fulfillment_status,
  operator_reviewed_at,
  fulfillment_started_at
)
values
  (
    'cs_legacy_intake_complete',
    'intake@example.test',
    'intake_complete',
    null,
    null
  ),
  (
    'cs_legacy_started',
    'started@example.test',
    'fulfillment_started',
    '2026-08-01 12:00:00+00',
    '2026-08-01 12:00:00+00'
  );

\i :migration_file

do $$
declare
  v_row_count bigint;
  v_null_ids bigint;
  v_distinct_ids bigint;
  v_pk_columns text[];
begin
  select count(*),
         count(*) filter (where id is null),
         count(distinct id)
  into v_row_count, v_null_ids, v_distinct_ids
  from public.guest_audit_purchases;

  if v_row_count <> 2 then
    raise exception 'legacy upgrade failed: row count changed';
  end if;

  if v_null_ids <> 0 or v_distinct_ids <> 2 then
    raise exception 'legacy upgrade failed: UUID identities were not backfilled uniquely';
  end if;

  select array_agg(a.attname::text order by key_columns.ordinality)
  into v_pk_columns
  from pg_catalog.pg_constraint c
  join lateral unnest(c.conkey) with ordinality
    as key_columns(attnum, ordinality)
    on true
  join pg_catalog.pg_attribute a
    on a.attrelid = c.conrelid
   and a.attnum = key_columns.attnum
  where c.conrelid = 'public.guest_audit_purchases'::regclass
    and c.contype = 'p'
  group by c.oid;

  if v_pk_columns <> array['id']::text[] then
    raise exception 'legacy upgrade failed: id did not become primary key';
  end if;

  if not exists (
    select 1
    from public.guest_audit_purchases
    where stripe_session_id = 'cs_legacy_started'
      and customer_email = 'started@example.test'
      and fulfillment_status = 'fulfillment_started'
      and operator_reviewed_at = '2026-08-01 12:00:00+00'::timestamptz
      and fulfillment_started_at = '2026-08-01 12:00:00+00'::timestamptz
  ) then
    raise exception
      'legacy upgrade failed: representative fulfillment data was not preserved';
  end if;
end
$$;

rollback;
