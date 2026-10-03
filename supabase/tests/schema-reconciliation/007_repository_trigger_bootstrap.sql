-- The guarded runner supplies absolute paths. All fixture changes roll back.
begin;
drop table if exists public.guest_audit_purchases;
drop function if exists public.set_guest_audit_purchases_updated_at();

\i :creation_file

-- Attribute the security properties to bootstrap, before hardening can set them.
do $$
begin
  if not exists (
    select 1 from pg_proc
    where oid = 'public.set_guest_audit_purchases_updated_at()'::regprocedure
      and not prosecdef and proconfig @> array['search_path=pg_catalog']
  ) then
    raise exception 'bootstrap itself did not create a pinned security invoker';
  end if;
end;
$$;
\i :hardening_file

insert into public.guest_audit_purchases
  (stripe_session_id, flow, updated_at)
values ('bootstrap-test', 'osiris-audit-v1', '2000-01-01T00:00:00Z');
update public.guest_audit_purchases set status = 'completed'
where stripe_session_id = 'bootstrap-test';

do $$
begin
  if not exists (
    select 1 from public.guest_audit_purchases
    where stripe_session_id = 'bootstrap-test' and updated_at = now()
  ) then
    raise exception 'bootstrap trigger did not update updated_at';
  end if;
  if not exists (
    select 1 from pg_proc
    where oid = 'public.set_guest_audit_purchases_updated_at()'::regprocedure
      and not prosecdef and proconfig @> array['search_path=pg_catalog']
  ) then
    raise exception 'bootstrap function is not a pinned security invoker';
  end if;
end;
$$;

-- An existing implementation must not be silently replaced on replay.
create or replace function public.set_guest_audit_purchases_updated_at()
returns trigger language plpgsql set search_path = pg_catalog as $$
begin
  new.updated_at = '2001-01-01T00:00:00Z'::timestamptz;
  return new;
end;
$$;
-- Exercise preservation of a deliberately different same-name trigger.
drop trigger trg_guest_audit_purchases_updated_at on public.guest_audit_purchases;
create trigger trg_guest_audit_purchases_updated_at
  after update on public.guest_audit_purchases
  for each row execute function public.set_guest_audit_purchases_updated_at();
create temporary table bootstrap_before as
select pg_get_functiondef('public.set_guest_audit_purchases_updated_at()'::regprocedure) as definition,
  (select pg_get_triggerdef(oid) from pg_trigger
   where tgrelid = 'public.guest_audit_purchases'::regclass
     and tgname = 'trg_guest_audit_purchases_updated_at') as trigger_definition;

\i :creation_file

do $$
begin
  if (select definition from bootstrap_before) is distinct from
     pg_get_functiondef('public.set_guest_audit_purchases_updated_at()'::regprocedure)
     or (select trigger_definition from bootstrap_before) is distinct from
     (select pg_get_triggerdef(oid) from pg_trigger
      where tgrelid = 'public.guest_audit_purchases'::regclass
        and tgname = 'trg_guest_audit_purchases_updated_at') then
    raise exception 'bootstrap replaced an existing function or trigger';
  end if;
end;
$$;
rollback;
