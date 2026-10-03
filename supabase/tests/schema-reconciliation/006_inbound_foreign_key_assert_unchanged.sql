begin;

do $$
declare
  v_pk_columns text[];
  v_parent_count bigint;
  v_child_count bigint;
begin
  if exists (
    select 1
    from pg_catalog.pg_attribute a
    where a.attrelid = 'public.guest_audit_purchases'::regclass
      and a.attname = 'id'
      and a.attnum > 0
      and not a.attisdropped
  ) then
    raise exception
      'inbound-foreign-key assertion failed: rejected migration added id';
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

  if v_pk_columns <> array['stripe_session_id']::text[] then
    raise exception
      'inbound-foreign-key assertion failed: parent primary key changed';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint c
    where c.conrelid = 'public.schema_reconciliation_inbound_child'::regclass
      and c.confrelid = 'public.guest_audit_purchases'::regclass
      and c.contype = 'f'
  ) then
    raise exception
      'inbound-foreign-key assertion failed: inbound foreign key is absent';
  end if;

  select count(*)
  into v_parent_count
  from public.guest_audit_purchases
  where stripe_session_id = 'cs_inbound_fk_shape'
    and customer_email = 'inbound-fk@example.test';

  select count(*)
  into v_child_count
  from public.schema_reconciliation_inbound_child
  where purchase_session_id = 'cs_inbound_fk_shape';

  if v_parent_count <> 1 or v_child_count <> 1 then
    raise exception
      'inbound-foreign-key assertion failed: fixture data changed';
  end if;
end
$$;

drop table public.schema_reconciliation_inbound_child;
drop table public.guest_audit_purchases;

commit;
