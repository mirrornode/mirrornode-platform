begin;

drop table if exists public.guest_audit_purchases cascade;

create table public.guest_audit_purchases (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null unique,
  fulfillment_status text not null default 'intake_pending'
);

alter table public.guest_audit_purchases enable row level security;

create policy guest_audit_purchases_test_policy
on public.guest_audit_purchases
for select
to authenticated
using (false);

grant select, insert, update
on public.guest_audit_purchases
to service_role;

\i :migration_file

do $$
declare
  v_pk_columns text[];
  v_id_default text;
  v_session_unique boolean;
begin
  select array_agg(a.attname order by key_columns.ordinality)
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
    raise exception 'schema contract failed: id is not the sole primary key';
  end if;

  select pg_catalog.pg_get_expr(d.adbin, d.adrelid)
  into v_id_default
  from pg_catalog.pg_attribute a
  join pg_catalog.pg_attrdef d
    on d.adrelid = a.attrelid
   and d.adnum = a.attnum
  where a.attrelid = 'public.guest_audit_purchases'::regclass
    and a.attname = 'id';

  if v_id_default not in ('gen_random_uuid()', 'extensions.gen_random_uuid()') then
    raise exception 'schema contract failed: id default is not gen_random_uuid()';
  end if;

  select exists (
    select 1
    from pg_catalog.pg_constraint c
    join lateral unnest(c.conkey) with ordinality
      as key_columns(attnum, ordinality)
      on true
    join pg_catalog.pg_attribute a
      on a.attrelid = c.conrelid
     and a.attnum = key_columns.attnum
    where c.conrelid = 'public.guest_audit_purchases'::regclass
      and c.contype = 'u'
    group by c.oid
    having array_agg(a.attname order by key_columns.ordinality)
      = array['stripe_session_id']::text[]
  )
  into v_session_unique;

  if not v_session_unique then
    raise exception
      'schema contract failed: stripe_session_id is not uniquely constrained';
  end if;
end
$$;

insert into public.guest_audit_purchases (stripe_session_id)
values ('cs_target_contract');

do $$
begin
  begin
    insert into public.guest_audit_purchases (stripe_session_id)
    values ('cs_target_contract');

    raise exception
      'schema contract failed: duplicate stripe_session_id was accepted';
  exception
    when unique_violation then
      null;
  end;
end
$$;

rollback;
