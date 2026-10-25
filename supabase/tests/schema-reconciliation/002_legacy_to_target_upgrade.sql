-- Default preserves direct invocation and the runner's legacy-PK mutation probe.
\if :{?session_unique_shape}
\else
\set session_unique_shape none
\endif

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

create temporary table legacy_unique_case as
select :'session_unique_shape'::text as shape;

do $$
begin
  if (select shape from legacy_unique_case) not in ('none', 'canonical', 'alternate') then
    raise exception 'unknown legacy session uniqueness fixture';
  end if;
end
$$;

select :'session_unique_shape' = 'canonical' as canonical,
       :'session_unique_shape' = 'alternate' as alternate \gset
\if :canonical
alter table public.guest_audit_purchases
  add constraint guest_audit_purchases_stripe_session_id_key unique (stripe_session_id);
\elif :alternate
alter table public.guest_audit_purchases
  add constraint legacy_session_unique unique (stripe_session_id);
\endif

-- OIDs detect replacement even if a recreated object has the same definition.
create temporary view legacy_session_uniques as
select c.oid as constraint_oid, c.conindid as index_oid, c.conname,
       c.condeferrable, pg_catalog.pg_get_constraintdef(c.oid) as definition
from pg_catalog.pg_constraint c
where c.conrelid = 'public.guest_audit_purchases'::regclass
  and c.contype = 'u'
  and c.conkey = array[(
    select a.attnum from pg_catalog.pg_attribute a
    where a.attrelid = c.conrelid and a.attname = 'stripe_session_id'
      and a.attnum > 0 and not a.attisdropped
  )]::smallint[];

create temporary table legacy_uniques_before as
select * from legacy_session_uniques;

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

create temporary table legacy_business_before as
select to_jsonb(p) as payload from public.guest_audit_purchases p;

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

  if v_pk_columns is distinct from array['id']::text[] then
    raise exception 'legacy upgrade failed: id did not become primary key';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.guest_audit_purchases'::regclass
      and contype = 'p' and not condeferrable
  ) then
    raise exception 'legacy upgrade failed: replacement primary key is deferrable';
  end if;

  if (select count(*) from legacy_session_uniques) <> 1
     or exists (select 1 from legacy_session_uniques where condeferrable) then
    raise exception 'legacy upgrade failed: expected exactly one immediate session UNIQUE';
  end if;

  if (select shape from legacy_unique_case) = 'none' then
    if not exists (
      select 1 from legacy_session_uniques
      where conname = 'guest_audit_purchases_stripe_session_id_key'
    ) then
      raise exception 'legacy upgrade failed: missing canonical session UNIQUE';
    end if;
  elsif (select count(*) from legacy_uniques_before) <> 1 or exists (
    select * from legacy_uniques_before except select * from legacy_session_uniques
  ) then
    raise exception 'legacy upgrade failed: existing session constraint or index changed';
  end if;

  if exists (
    select payload from legacy_business_before
    except select to_jsonb(p) - 'id' from public.guest_audit_purchases p
  ) or exists (
    select to_jsonb(p) - 'id' from public.guest_audit_purchases p
    except select payload from legacy_business_before
  ) then
    raise exception 'legacy upgrade failed: business data changed';
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

-- Positive application control: an existing session must update, not duplicate.
insert into public.guest_audit_purchases (stripe_session_id, customer_email)
values ('cs_legacy_started', 'upsert@example.test')
on conflict (stripe_session_id) do update
set customer_email = excluded.customer_email;

do $$
begin
  if (select count(*) from public.guest_audit_purchases) <> 2 or not exists (
    select 1 from public.guest_audit_purchases
    where stripe_session_id = 'cs_legacy_started' and customer_email = 'upsert@example.test'
  ) then
    raise exception 'legacy upgrade failed: session upsert did not update the existing row';
  end if;
end
$$;

create temporary table upgraded_rows as
select to_jsonb(p) as payload from public.guest_audit_purchases p;
create temporary table upgraded_uniques as
select * from legacy_session_uniques;

\i :migration_file

do $$
begin
  if (select count(*) from public.guest_audit_purchases) <> 2 or exists (
    select payload from upgraded_rows
    except select to_jsonb(p) from public.guest_audit_purchases p
  ) or exists (
    select to_jsonb(p) from public.guest_audit_purchases p
    except select payload from upgraded_rows
  ) then
    raise exception 'legacy rerun failed: rows or UUID identities changed';
  end if;
  if exists (
    select * from upgraded_uniques except select * from legacy_session_uniques
  ) or exists (
    select * from legacy_session_uniques except select * from upgraded_uniques
  ) then
    raise exception 'legacy rerun failed: session constraints or indexes changed';
  end if;
end
$$;

rollback;
