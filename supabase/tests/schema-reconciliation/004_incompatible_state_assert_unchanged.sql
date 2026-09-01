begin;

do $$
declare
  v_before public.schema_reconciliation_incompatible_before%rowtype;
  v_after_primary_key_definition jsonb;
  v_after_row_count bigint;
  v_after_rows_json jsonb;
begin
  if to_regclass('public.schema_reconciliation_incompatible_before') is null then
    raise exception
      'incompatible-state assertion failed: pre-failure snapshot is absent';
  end if;

  select *
  into v_before
  from public.schema_reconciliation_incompatible_before;

  select
    (
      select jsonb_agg(
        jsonb_build_object(
          'constraint_name', c.conname,
          'constraint_type', c.contype,
          'definition', pg_catalog.pg_get_constraintdef(c.oid, true)
        )
        order by c.conname
      )
      from pg_catalog.pg_constraint c
      where c.conrelid = 'public.guest_audit_purchases'::regclass
        and c.contype = 'p'
    ),
    (
      select count(*)
      from public.guest_audit_purchases
    ),
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'stripe_session_id', p.stripe_session_id,
          'legacy_reference', p.legacy_reference
        )
        order by p.legacy_reference
      )
      from public.guest_audit_purchases p
    )
  into
    v_after_primary_key_definition,
    v_after_row_count,
    v_after_rows_json;

  if v_before.primary_key_definition
       is distinct from v_after_primary_key_definition then
    raise exception
      'incompatible-state assertion failed: primary-key definition changed after rejected migration';
  end if;

  if v_before.row_count is distinct from v_after_row_count then
    raise exception
      'incompatible-state assertion failed: row count changed after rejected migration';
  end if;

  if v_before.rows_json is distinct from v_after_rows_json then
    raise exception
      'incompatible-state assertion failed: fixture row payload changed after rejected migration';
  end if;
end
$$;

drop table public.schema_reconciliation_incompatible_before;

commit;
