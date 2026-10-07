#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL must point to a disposable test database; production is prohibited." >&2
  exit 64
fi

required_ack="I_UNDERSTAND_THIS_DROPS_PUBLIC_GUEST_AUDIT_PURCHASES"

if [[ "${SCHEMA_RECONCILIATION_TEST_ACK:-}" != "${required_ack}" ]]; then
  echo "Refusing destructive schema tests without explicit acknowledgement." >&2
  echo "Set SCHEMA_RECONCILIATION_TEST_ACK=${required_ack} only for a disposable database." >&2
  exit 64
fi

case "${DATABASE_URL}" in
  *"zomnswctmwjqnvftiayc"*)
    echo "Refusing to run against the known production project." >&2
    exit 64
    ;;
esac

guard_comment="MIRRORNODE_DISPOSABLE_SCHEMA_RECONCILIATION_TEST_DATABASE"
if ! observed_guard="$(
  psql "${DATABASE_URL}" \
    -X \
    -A \
    -t \
    -v ON_ERROR_STOP=1 \
    -c "select coalesce(pg_catalog.obj_description(pg_catalog.to_regclass('public.mirrornode_schema_reconciliation_disposable_guard')::oid, 'pg_class'), '');" \
    2>/dev/null
)"; then
  echo "Unable to verify the disposable-database guard marker." >&2
  exit 65
fi

if [[ "${observed_guard}" != "${guard_comment}" ]]; then
  echo "Refusing destructive schema tests: disposable-database guard marker is absent or invalid." >&2
  exit 64
fi

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
test_dir="${root_dir}/supabase/tests/schema-reconciliation"
migration="${root_dir}/supabase/migrations/20260901051600_reconcile_guest_audit_purchases_uuid_identity.sql"

if [[ ! -f "${migration}" ]]; then
  echo "Reconciliation migration not found: ${migration}" >&2
  exit 66
fi

# Success fixtures own their transaction. Derive a body without the migration's
# outer BEGIN/COMMIT; failure fixtures below still run the exact original file.
if [[ "$(grep -Ec '^[[:space:]]*begin;[[:space:]]*$' "${migration}")" != 1 ||
      "$(grep -Ec '^[[:space:]]*commit;[[:space:]]*$' "${migration}")" != 1 ]]; then
  echo "Migration transaction wrapper changed; refusing fixture replay." >&2
  exit 66
fi

migration_body="$(mktemp)"
negative_fixture="$(mktemp)"
trap 'rm -f "${migration_body}" "${negative_fixture}"' EXIT
sed -e '/^[[:space:]]*begin;[[:space:]]*$/d' \
    -e '/^[[:space:]]*commit;[[:space:]]*$/d' \
    "${migration}" > "${migration_body}"

run_success_test() {
  local file="$1"

  echo "Running success-path test: $(basename "${file}")"

  psql "${DATABASE_URL}" \
    -X \
    -v ON_ERROR_STOP=1 \
    -v migration_file="${migration_body}" \
    -f "${file}"
}

creation_file="${root_dir}/supabase/migrations/20260618221629_create_guest_audit_purchases.sql"
hardening_file="${root_dir}/supabase/migrations/20260813212729_harden_guest_audit_purchase_privileges.sql"

# These includes have no transaction wrapper. Refuse wrapper drift before 007
# can drop anything; its outer transaction must remain owned by the fixture.
for bootstrap_include in "${creation_file}" "${hardening_file}"; do
  if [[ ! -f "${bootstrap_include}" ]]; then
    echo "Bootstrap include not found: ${bootstrap_include}" >&2
    exit 66
  fi
  if grep -Eiq '(^|;)[[:space:]]*(begin([[:space:]]+(work|transaction))?|start[[:space:]]+transaction|commit([[:space:]]+(work|transaction))?|rollback([[:space:]]+(work|transaction))?)[[:space:]]*;' "${bootstrap_include}"; then
    echo "Bootstrap include transaction wrapper changed; refusing fixture replay." >&2
    exit 66
  fi
done

echo "Running success-path test: 007_repository_trigger_bootstrap.sql"
psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 \
  -v creation_file="${creation_file}" \
  -v hardening_file="${hardening_file}" \
  -f "${test_dir}/007_repository_trigger_bootstrap.sql"

run_success_test "${test_dir}/001_target_schema_contract.sql"
run_success_test "${test_dir}/002_legacy_to_target_upgrade.sql"
run_success_test "${test_dir}/003_target_to_target_noop.sql"
run_success_test "${test_dir}/005_data_preservation_and_rerun.sql"

# Corrupt the successful post-migration shape before its assertions. These
# probes must fail at the intended assertion, not at a later INSERT or SQL error.
for probe in target_pk target_default legacy_pk; do
  case "${probe}" in
    target_pk)
      source_fixture="${test_dir}/001_target_schema_contract.sql"
      corruption='alter table public.guest_audit_purchases drop constraint guest_audit_purchases_pkey;'
      expected_message='schema contract failed: id is not the sole primary key' ;;
    target_default)
      source_fixture="${test_dir}/001_target_schema_contract.sql"
      corruption='alter table public.guest_audit_purchases alter column id drop default;'
      expected_message='schema contract failed: id default is not gen_random_uuid()' ;;
    legacy_pk)
      source_fixture="${test_dir}/002_legacy_to_target_upgrade.sql"
      corruption='alter table public.guest_audit_purchases drop constraint guest_audit_purchases_pkey;'
      expected_message='legacy upgrade failed: id did not become primary key' ;;
  esac
  if [[ "$(grep -Fc '\i :migration_file' "${source_fixture}")" != 1 ]]; then
    echo "Fixture migration include changed; refusing negative probe." >&2
    exit 66
  fi
  awk -v corruption="${corruption}" '{ print; if ($0 == "\\i :migration_file") print corruption; }' \
    "${source_fixture}" > "${negative_fixture}"
  if negative_output="$(psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 \
    -v VERBOSITY=verbose -v migration_file="${migration_body}" \
    -f "${negative_fixture}" 2>&1)"; then
    echo "FAIL: ${probe} assertion accepted corrupted schema." >&2
    exit 1
  fi
  if [[ "${negative_output}" != *"${expected_message}"* ]] ||
      ! grep -Eq 'ERROR:[[:space:]]+P0001:' <<<"${negative_output}"; then
    printf '%s\n' "${negative_output}" >&2
    exit 1
  fi
  echo "PASS: ${probe} failed at its intended assertion (P0001)."
done

echo "Preparing persistent incompatible-shape fixture."

psql "${DATABASE_URL}" \
  -X \
  -v ON_ERROR_STOP=1 \
  -f "${test_dir}/004_incompatible_state_rejection.sql"

expected_output="$(
  psql "${DATABASE_URL}" \
    -X \
    -v ON_ERROR_STOP=1 \
    -v VERBOSITY=verbose \
    -f "${migration}" \
    2>&1
)" && {
  echo "Expected incompatible primary-key fixture to reject the migration." >&2
  exit 1
}

if [[ "${expected_output}" != *"guest_audit_purchases UUID identity reconciliation aborted: table is neither the exact target shape nor the supported legacy shape"* ]]; then
  echo "Expected reconciliation abort message was not observed." >&2
  printf '%s\n' "${expected_output}" >&2
  exit 1
fi

if ! grep -Eq 'ERROR:[[:space:]]+P0001:' <<<"${expected_output}"; then
  echo "Expected reconciliation SQLSTATE P0001 was not observed in verbose psql output." >&2
  printf '%s\n' "${expected_output}" >&2
  exit 1
fi

echo "Verifying incompatible fixture remained unchanged after expected failure."

psql "${DATABASE_URL}" \
  -X \
  -v ON_ERROR_STOP=1 \
  -f "${test_dir}/004_incompatible_state_assert_unchanged.sql"

echo "Preparing persistent inbound-foreign-key fixture."

psql "${DATABASE_URL}" \
  -X \
  -v ON_ERROR_STOP=1 \
  -f "${test_dir}/006_inbound_foreign_key_rejection.sql"

expected_output="$(
  psql "${DATABASE_URL}" \
    -X \
    -v ON_ERROR_STOP=1 \
    -v VERBOSITY=verbose \
    -f "${migration}" \
    2>&1
)" && {
  echo "Expected inbound-foreign-key fixture to reject the migration." >&2
  exit 1
}

if [[ "${expected_output}" != *"guest_audit_purchases UUID identity reconciliation aborted: inbound foreign keys require a separately reviewed migration"* ]]; then
  echo "Expected inbound-foreign-key reconciliation abort message was not observed." >&2
  printf '%s\n' "${expected_output}" >&2
  exit 1
fi

if ! grep -Eq 'ERROR:[[:space:]]+P0001:' <<<"${expected_output}"; then
  echo "Expected inbound-foreign-key SQLSTATE P0001 was not observed in verbose psql output." >&2
  printf '%s\n' "${expected_output}" >&2
  exit 1
fi

echo "Verifying inbound-foreign-key fixture remained unchanged after expected failure."

psql "${DATABASE_URL}" \
  -X \
  -v ON_ERROR_STOP=1 \
  -f "${test_dir}/006_inbound_foreign_key_assert_unchanged.sql"

snapshot_type_fixture() {
  psql "${DATABASE_URL}" -X -A -t -v ON_ERROR_STOP=1 <<'SQL'
select jsonb_build_object(
  'columns', (
    select jsonb_agg(jsonb_build_array(
      a.attname, a.atttypid, a.atttypmod, a.attnotnull,
      pg_catalog.pg_get_expr(d.adbin, d.adrelid)
    ) order by a.attnum)
    from pg_catalog.pg_attribute a
    left join pg_catalog.pg_attrdef d
      on d.adrelid = a.attrelid and d.adnum = a.attnum
    where a.attrelid = 'public.guest_audit_purchases'::regclass
      and a.attnum > 0 and not a.attisdropped
  ),
  'constraints', (
    select jsonb_agg(jsonb_build_array(
      conname, pg_catalog.pg_get_constraintdef(oid)
    ) order by conname)
    from pg_catalog.pg_constraint
    where conrelid = 'public.guest_audit_purchases'::regclass
  ),
  'rows', (
    select jsonb_agg(to_jsonb(t) order by stripe_session_id)
    from public.guest_audit_purchases t
  )
);
SQL
}

for legacy in false true; do
  echo "Testing incompatible session-id type (legacy=${legacy})."
  psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 -v legacy="${legacy}" <<'SQL'
begin;
drop table if exists public.guest_audit_purchases;
\if :legacy
create table public.guest_audit_purchases (
  stripe_session_id integer primary key
);
\else
create table public.guest_audit_purchases (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id integer not null unique
);
\endif
insert into public.guest_audit_purchases (stripe_session_id) values (123);
commit;
SQL
  before_type_fixture="$(snapshot_type_fixture)"
  if expected_output="$(
    psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 \
      -v VERBOSITY=verbose -f "${migration}" 2>&1
  )"; then
    echo "FAIL: migration accepted an integer session identifier." >&2
    exit 1
  fi
  if [[ "${expected_output}" != *"stripe_session_id must be text"* ]] ||
      ! grep -Eq 'ERROR:[[:space:]]+P0001:' <<<"${expected_output}"; then
    printf '%s\n' "${expected_output}" >&2
    exit 1
  fi
  after_type_fixture="$(snapshot_type_fixture)"
  if [[ "${before_type_fixture}" != "${after_type_fixture}" ]]; then
    echo "FAIL: rejected migration changed the type fixture." >&2
    exit 1
  fi
  echo "PASS: incompatible type rejected; columns, constraints and rows preserved."
done

psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 \
  -c 'drop table public.guest_audit_purchases;'


# Reject a same-name UUID domain and malformed id-primary-key shapes without
# changing any column, constraint or row. Domain identity is not built-in UUID.
for shape in domain_legacy domain_target missing_default nullable_session; do
  echo "Testing incompatible identity shape (${shape})."
  psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 -v shape="${shape}" <<'SQL'
begin;
drop table if exists public.guest_audit_purchases;
create schema if not exists reconciliation_custom;
drop domain if exists reconciliation_custom.uuid;
create domain reconciliation_custom.uuid as pg_catalog.uuid;
select :'shape' = 'domain_legacy' as domain_legacy,
       :'shape' = 'domain_target' as domain_target,
       :'shape' = 'missing_default' as missing_default \gset
\if :domain_legacy
create table public.guest_audit_purchases (
  id reconciliation_custom.uuid,
  stripe_session_id text primary key
);
\elif :domain_target
create table public.guest_audit_purchases (
  id reconciliation_custom.uuid primary key default gen_random_uuid(),
  stripe_session_id text not null unique
);
\elif :missing_default
create table public.guest_audit_purchases (
  id pg_catalog.uuid primary key,
  stripe_session_id text not null unique
);
\else
create table public.guest_audit_purchases (
  id pg_catalog.uuid primary key default gen_random_uuid(),
  stripe_session_id text unique
);
\endif
insert into public.guest_audit_purchases (id, stripe_session_id)
values (gen_random_uuid(), 'schema_review_fixture');
commit;
SQL
  before_shape_fixture="$(snapshot_type_fixture)"
  if expected_output="$(
    psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 \
      -v VERBOSITY=verbose -f "${migration}" 2>&1
  )"; then
    echo "FAIL: migration accepted incompatible identity shape ${shape}." >&2
    exit 1
  fi
  if [[ "${shape}" == domain_legacy ]]; then
    shape_message="existing id column is not uuid"
  else
    shape_message="table is neither the exact target shape nor the supported legacy shape"
  fi
  if [[ "${expected_output}" != *"${shape_message}"* ]] ||
      ! grep -Eq 'ERROR:[[:space:]]+P0001:' <<<"${expected_output}"; then
    printf '%s\n' "${expected_output}" >&2
    exit 1
  fi
  after_shape_fixture="$(snapshot_type_fixture)"
  if [[ "${before_shape_fixture}" != "${after_shape_fixture}" ]]; then
    echo "FAIL: rejected migration changed identity fixture ${shape}." >&2
    exit 1
  fi
  echo "PASS: ${shape} rejected with accurate diagnostic and unchanged state."
done
psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 \
  -c 'drop table public.guest_audit_purchases; drop schema reconciliation_custom cascade;'

echo "Schema reconciliation tests passed."
