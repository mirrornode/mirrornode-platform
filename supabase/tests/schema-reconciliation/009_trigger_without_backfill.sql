-- Complete UUID legacy needs no UPDATE, even with row and statement triggers.
begin;
drop table if exists public.guest_audit_purchases;
drop function if exists public.set_guest_audit_purchases_updated_at();
\i :creation_file
insert into public.guest_audit_purchases
  (stripe_session_id, flow, updated_at)
values ('trigger-complete-id', 'osiris-audit-v1', '2000-01-01T00:00:00Z');
alter table public.guest_audit_purchases add column id uuid default gen_random_uuid();
create function public.reconciliation_reject_statement_update()
returns trigger language plpgsql as $$
begin
  raise exception 'unexpected statement UPDATE during identity-only conversion';
end;
$$;
create trigger reconciliation_statement_update
  before update on public.guest_audit_purchases for each statement
  execute function public.reconciliation_reject_statement_update();
create temporary table trigger_no_backfill_before as
select stripe_session_id, to_jsonb(t) as payload from public.guest_audit_purchases t;
\i :migration_file
\i :migration_file

do $$
begin
  if exists (
    select 1 from trigger_no_backfill_before b full join
      public.guest_audit_purchases t using (stripe_session_id)
    where b.payload is distinct from to_jsonb(t)
  ) then
    raise exception 'trigger no-backfill conversion changed a complete row';
  end if;
  if (select count(*) from pg_trigger
      where tgrelid = 'public.guest_audit_purchases'::regclass
        and not tgisinternal and tgenabled = 'O') <> 2 then
    raise exception 'trigger no-backfill conversion changed enabled triggers';
  end if;
end;
$$;
rollback;
