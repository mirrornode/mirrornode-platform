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

run_success_test() {
  local file="$1"

  echo "Running success-path test: $(basename "${file}")"

  psql "${DATABASE_URL}" \
    -X \
    -v ON_ERROR_STOP=1 \
    -v migration_file="${migration}" \
    -f "${file}"
}

run_success_test "${test_dir}/001_target_schema_contract.sql"
run_success_test "${test_dir}/002_legacy_to_target_upgrade.sql"
run_success_test "${test_dir}/003_target_to_target_noop.sql"
run_success_test "${test_dir}/005_data_preservation_and_rerun.sql"

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

if [[ "${expected_output}" != *"guest_audit_purchases UUID identity reconciliation aborted: primary key is neither id nor stripe_session_id"* ]]; then
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

echo "Schema reconciliation tests passed."
