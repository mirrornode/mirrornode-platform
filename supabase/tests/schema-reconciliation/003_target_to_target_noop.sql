begin;

drop table if exists public.guest_audit_purchases cascade;

create table public.guest_audit_purchases (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null unique,
  customer_email text,
  fulfillment_status text not null default 'intake_pending'
);

alter table public.guest_audit_purchases enable row level security;

create policy guest_audit_purchases_live_shape_policy
on public.guest_audit_purchases
for select
to authenticated
using (false);

grant select, insert, update
on public.guest_audit_purchases
to service_role;

insert into public.guest_audit_purchases (
  id,
  stripe_session_id,
  customer_email,
  fulfillment_status
)
values (
  '00000000-0000-4000-8000-000000000001',
  'cs_live_shape_noop',
  'live-shape@example.test',
  'intake_complete'
);

create temporary table before_state as
select
  (
    select jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'stripe_session_id', p.stripe_session_id,
        'customer_email', p.customer_email,
        'fulfillment_status', p.fulfillment_status
      )
      order by p.id
    )
    from public.guest_audit_purchases p
  ) as rows_json,
  (
    select c.relrowsecurity
    from pg_catalog.pg_class c
    where c.oid = 'public.guest_audit_purchases'::regclass
  ) as rls_enabled,
  (
    select jsonb_agg(
      jsonb_build_object(
        'name', p.polname,
        'roles', p.polroles,
        'command', p.polcmd,
        'using', pg_catalog.pg_get_expr(p.polqual, p.polrelid),
        'check', pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid)
      )
      order by p.polname
    )
    from pg_catalog.pg_policy p
    where p.polrelid = 'public.guest_audit_purchases'::regclass
  ) as policies_json,
  (
    select jsonb_agg(
      jsonb_build_object(
        'grantee', g.grantee,
        'privilege_type', g.privilege_type,
        'is_grantable', g.is_grantable
      )
      order by g.grantee, g.privilege_type, g.is_grantable
    )
    from information_schema.role_table_grants g
    where g.table_schema = 'public'
      and g.table_name = 'guest_audit_purchases'
  ) as grants_json;

\i :migration_file

create temporary table after_state as
select
  (
    select jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'stripe_session_id', p.stripe_session_id,
        'customer_email', p.customer_email,
        'fulfillment_status', p.fulfillment_status
      )
      order by p.id
    )
    from public.guest_audit_purchases p
  ) as rows_json,
  (
    select c.relrowsecurity
    from pg_catalog.pg_class c
    where c.oid = 'public.guest_audit_purchases'::regclass
  ) as rls_enabled,
  (
    select jsonb_agg(
      jsonb_build_object(
        'name', p.polname,
        'roles', p.polroles,
        'command', p.polcmd,
        'using', pg_catalog.pg_get_expr(p.polqual, p.polrelid),
        'check', pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid)
      )
      order by p.polname
    )
    from pg_catalog.pg_policy p
    where p.polrelid = 'public.guest_audit_purchases'::regclass
  ) as policies_json,
  (
    select jsonb_agg(
      jsonb_build_object(
        'grantee', g.grantee,
        'privilege_type', g.privilege_type,
        'is_grantable', g.is_grantable
      )
      order by g.grantee, g.privilege_type, g.is_grantable
    )
    from information_schema.role_table_grants g
    where g.table_schema = 'public'
      and g.table_name = 'guest_audit_purchases'
  ) as grants_json;

do $$
declare
  v_before before_state%rowtype;
  v_after after_state%rowtype;
begin
  select * into v_before from before_state;
  select * into v_after from after_state;

  if v_before.rows_json is distinct from v_after.rows_json then
    raise exception 'target no-op failed: rows changed';
  end if;

  if v_before.rls_enabled is distinct from v_after.rls_enabled then
    raise exception 'target no-op failed: RLS enabled state changed';
  end if;

  if v_before.policies_json is distinct from v_after.policies_json then
    raise exception 'target no-op failed: policies changed';
  end if;

  if v_before.grants_json is distinct from v_after.grants_json then
    raise exception 'target no-op failed: grants changed';
  end if;
end
$$;

rollback;
