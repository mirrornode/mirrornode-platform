#!/usr/bin/env bash
# Database-level checks for Osiris Audit v1 refund integrity.
#
# Runs against a THROWAWAY local Postgres only. It creates the Supabase roles it
# needs, applies the repository migrations in order, and replays the exact
# statements that lib/osiris-audit/purchase-ledger.ts and the intake route send
# through PostgREST (supabase-js upsert/update filters), including concurrent
# sessions. Never point it at a hosted Supabase project.
#
# Usage: PGURL=postgresql://postgres@localhost:5432/postgres scripts/db/test-osiris-refund-integrity.sh

set -euo pipefail

: "${PGURL:?Set PGURL to a throwaway local Postgres superuser connection}"
case "$PGURL" in
  *supabase.co*|*supabase.com*|*pooler*) echo "Refusing to run against a hosted database." >&2; exit 2 ;;
esac

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DB="osiris_refund_integrity_$$"
ADMIN_URL="$PGURL"
TEST_URL="${PGURL%/*}/$DB"
NEW_MIGRATION="20261118193000_keep_guest_audit_refunds_monotonic.sql"

pass=0
fail=0

q() { psql "$TEST_URL" -v ON_ERROR_STOP=1 -qtAX -c "$1"; }
check() {
  local label="$1" got="$2" want="$3"
  if [[ "$got" == "$want" ]]; then
    pass=$((pass + 1)); echo "  ok   $label"
  else
    fail=$((fail + 1)); echo "  FAIL $label: got [$got], want [$want]"
  fi
}

cleanup() { psql "$ADMIN_URL" -qtAX -c "drop database if exists $DB" >/dev/null 2>&1 || true; }
trap cleanup EXIT

psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -qtAX -c "create database $DB" >/dev/null
q "do \$\$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end \$\$;
-- Minimal stand-in for Supabase's auth schema, which one earlier migration references.
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key);
create or replace function auth.uid() returns uuid language sql stable as 'select null::uuid';" >/dev/null

apply_migrations() { # $1 = include the new trigger migration (yes/no)
  for f in "$ROOT"/supabase/migrations/*.sql; do
    if [[ "$1" == "no" && "$(basename "$f")" == "$NEW_MIGRATION" ]]; then continue; fi
    if [[ "$(basename "$f")" == "20260813212729_harden_guest_audit_purchase_privileges.sql" ]]; then
      # Known drift: this migration alters a trigger function that no repository
      # migration creates. Recreate it as the hosted project defines it (observed
      # read-only on 2026-11-18), so the test schema matches production.
      q "create or replace function public.set_guest_audit_purchases_updated_at() returns trigger
           language plpgsql set search_path = pg_catalog as 'begin new.updated_at = now(); return new; end;';
         create trigger trg_guest_audit_purchases_updated_at before update on public.guest_audit_purchases
           for each row execute function public.set_guest_audit_purchases_updated_at();" >/dev/null
    fi
    psql "$TEST_URL" -v ON_ERROR_STOP=1 -qX -f "$f" >/dev/null
  done
}

# SQL equivalents of the PostgREST requests the app sends. Each mirrors one
# helper in lib/osiris-audit/purchase-ledger.ts or the intake route.
define_app_statements() {
  q "
create schema if not exists t;

-- recordOsirisPayment: upsert(ignoreDuplicates) + update ... not.status.in.(protected)
create or replace function t.record_payment(p_id text, p_status text) returns void language sql as \$\$
  insert into public.guest_audit_purchases (stripe_session_id, flow, status, customer_email, updated_at)
  values (p_id, 'osiris-audit-v1', p_status, 'synthetic@example.invalid', now())
  on conflict (stripe_session_id) do nothing;
  update public.guest_audit_purchases set status = p_status, updated_at = now()
  where stripe_session_id = p_id
    and status not in ('refunded','partially_refunded','disputed','needs_review');
\$\$;

-- ensureOsirisPurchaseRow: upsert(ignoreDuplicates)
create or replace function t.ensure_row(p_id text, p_status text, p_fs text) returns void language sql as \$\$
  insert into public.guest_audit_purchases (stripe_session_id, flow, status, fulfillment_status, updated_at)
  values (p_id, 'osiris-audit-v1', p_status, p_fs, now())
  on conflict (stripe_session_id) do nothing;
\$\$;

-- markOsirisRefunded
create or replace function t.mark_refunded(p_id text) returns void language sql as \$\$
  update public.guest_audit_purchases
  set status = 'refunded', fulfillment_status = 'refunded', updated_at = now()
  where stripe_session_id = p_id;
\$\$;

-- holdOsirisCase: conditional pause, else conditional record
create or replace function t.hold(p_id text, p_status text, p_keep text[]) returns text language plpgsql as \$\$
declare v text;
begin
  update public.guest_audit_purchases
  set status = p_status, fulfillment_status = 'paused', updated_at = now()
  where stripe_session_id = p_id and not (status = any (p_keep))
    and fulfillment_status in ('intake_pending','intake_complete','fulfillment_started')
  returning fulfillment_status into v;
  if found then return v; end if;
  update public.guest_audit_purchases set status = p_status, updated_at = now()
  where stripe_session_id = p_id and not (status = any (p_keep)) and fulfillment_status <> 'refunded'
  returning fulfillment_status into v;
  return v;
end \$\$;

-- intake route: conditional intake write
create or replace function t.intake(p_id text) returns int language plpgsql as \$\$
declare n int;
begin
  update public.guest_audit_purchases
  set intake_system_summary = 's', intake_primary_goal = 'g', intake_concerns = 'c',
      intake_submitted_at = now(), intake_authorization_confirmed_at = now(),
      intake_channel_authorization_text = 'synthetic authorization',
      fulfillment_status = 'intake_complete', updated_at = now()
  where stripe_session_id = p_id and status = 'paid'
    and fulfillment_status = 'intake_pending' and intake_submitted_at is null;
  get diagnostics n = row_count;
  return n;
end \$\$;

-- The pre-fix code path: upsert that overwrites status unconditionally.
create or replace function t.legacy_upsert_paid(p_id text) returns void language sql as \$\$
  insert into public.guest_audit_purchases (stripe_session_id, flow, status, updated_at)
  values (p_id, 'osiris-audit-v1', 'paid', now())
  on conflict (stripe_session_id) do update set status = excluded.status, updated_at = excluded.updated_at;
\$\$;
" >/dev/null
}

state() { q "select status || '/' || fulfillment_status from public.guest_audit_purchases where stripe_session_id = '$1'"; }
start_case() {
  q "select outcome from public.start_osiris_audit_fulfillment_v1('$1', gen_random_uuid(), 'operator_synthetic', 'synthetic start', gen_random_uuid())"
}

echo "Phase 1: migrations before the trigger, application guards only"
apply_migrations no
define_app_statements

q "select t.record_payment('cs_p1_full', 'paid'); select t.mark_refunded('cs_p1_full'); select t.record_payment('cs_p1_full', 'paid');" >/dev/null
check "replayed payment does not reopen a full refund" "$(state cs_p1_full)" "refunded/refunded"

q "select t.record_payment('cs_p1_part', 'paid'); select t.hold('cs_p1_part', 'partially_refunded', array['refunded']); select t.record_payment('cs_p1_part', 'paid');" >/dev/null
check "replayed payment does not reopen a partial refund" "$(state cs_p1_part)" "partially_refunded/paused"

q "select t.record_payment('cs_p1_late', 'paid'); select t.mark_refunded('cs_p1_late');" >/dev/null
check "late partial refund does not overwrite a full refund" "$(q "select coalesce(t.hold('cs_p1_late','partially_refunded',array['refunded']),'none')")/$(state cs_p1_late)" "none/refunded/refunded"

q "select t.legacy_upsert_paid('cs_p1_legacy'); select t.mark_refunded('cs_p1_legacy'); select t.legacy_upsert_paid('cs_p1_legacy');" >/dev/null
check "control: the pre-fix upsert does reopen a refund without the trigger" "$(state cs_p1_legacy)" "paid/refunded"

echo "Phase 2: with the trigger migration applied"
psql "$TEST_URL" -v ON_ERROR_STOP=1 -qX -f "$ROOT/supabase/migrations/$NEW_MIGRATION" >/dev/null

q "select t.legacy_upsert_paid('cs_p2_legacy'); select t.mark_refunded('cs_p2_legacy'); select t.legacy_upsert_paid('cs_p2_legacy');" >/dev/null
check "trigger keeps a full refund against the pre-fix upsert" "$(state cs_p2_legacy)" "refunded/refunded"

q "select t.record_payment('cs_p2_part', 'paid'); select t.hold('cs_p2_part', 'partially_refunded', array['refunded']); select t.legacy_upsert_paid('cs_p2_part');" >/dev/null
check "trigger keeps a partial refund against the pre-fix upsert" "$(state cs_p2_part)" "partially_refunded/paused"

q "select t.record_payment('cs_p2_up', 'paid'); select t.hold('cs_p2_up', 'partially_refunded', array['refunded']); select t.mark_refunded('cs_p2_up');" >/dev/null
check "partial refund can still become a full refund" "$(state cs_p2_up)" "refunded/refunded"

q "update public.guest_audit_purchases set fulfillment_status = 'intake_complete' where stripe_session_id = 'cs_p2_part'" >/dev/null
check "operator un-pause of a partially refunded case: start refused" "$(start_case cs_p2_part)" "NOT_READY"

echo "Phase 3: out-of-order events"
q "select t.ensure_row('cs_ooo_full', 'refunded', 'refunded'); select t.mark_refunded('cs_ooo_full'); select t.record_payment('cs_ooo_full', 'paid');" >/dev/null
check "full refund before payment event stays refunded" "$(state cs_ooo_full)" "refunded/refunded"
check "intake refused after refund-first ordering" "$(q "select t.intake('cs_ooo_full')")" "0"

q "select t.ensure_row('cs_ooo_part', 'partially_refunded', 'paused'); select t.hold('cs_ooo_part', 'partially_refunded', array['refunded']); select t.record_payment('cs_ooo_part', 'paid');" >/dev/null
check "partial refund before payment event stays held" "$(state cs_ooo_part)" "partially_refunded/paused"

q "select t.ensure_row('cs_ooo_disp', 'disputed', 'paused'); select t.hold('cs_ooo_disp', 'disputed', array['refunded']); select t.record_payment('cs_ooo_disp', 'paid');" >/dev/null
check "dispute before payment event stays held" "$(state cs_ooo_disp)" "disputed/paused"

q "select t.record_payment('cs_dup', 'paid'); select t.record_payment('cs_dup', 'paid'); select t.record_payment('cs_dup', 'paid');" >/dev/null
check "duplicate payment events leave one paid row" "$(q "select count(*) || ':' || max(status) from public.guest_audit_purchases where stripe_session_id = 'cs_dup'")" "1:paid"

q "select t.record_payment('cs_rev', 'paid'); select t.ensure_row('cs_rev', 'needs_review', 'paused'); select t.hold('cs_rev', 'needs_review', array['refunded','partially_refunded','disputed']); select t.record_payment('cs_rev', 'paid');" >/dev/null
check "review hold is not cleared by a replayed payment" "$(state cs_rev)" "needs_review/paused"

echo "Phase 4: concurrent sessions (READ COMMITTED, real row locks)"
# A full refund holds the row lock while a partial-refund hold and a payment
# replay arrive. Both must re-check their WHERE clause after the lock is released.
q "select t.record_payment('cs_race', 'paid'); select t.intake('cs_race');" >/dev/null
psql "$TEST_URL" -qtAX -c "begin; select t.mark_refunded('cs_race'); select pg_sleep(1.5); commit;" >/dev/null &
A=$!
sleep 0.4
psql "$TEST_URL" -qtAX -c "select t.hold('cs_race', 'partially_refunded', array['refunded'])" >/dev/null &
B=$!
psql "$TEST_URL" -qtAX -c "select t.record_payment('cs_race', 'paid')" >/dev/null &
C=$!
wait $A $B $C
check "full refund wins over a concurrent partial hold and payment replay" "$(state cs_race)" "refunded/refunded"

# A partial-refund hold holds the lock while the intake write arrives.
q "select t.record_payment('cs_race2', 'paid');" >/dev/null
psql "$TEST_URL" -qtAX -c "begin; select t.hold('cs_race2', 'partially_refunded', array['refunded']); select pg_sleep(1.5); commit;" >/dev/null &
A=$!
sleep 0.4
T0=$(date +%s%N)
INTAKE_ROWS="$(psql "$TEST_URL" -qtAX -c "select t.intake('cs_race2')")"
WAITED_MS=$(( ($(date +%s%N) - T0) / 1000000 ))
wait $A
check "intake actually waited on the row lock (>= 800 ms)" "$([[ $WAITED_MS -ge 800 ]] && echo yes || echo "no, ${WAITED_MS} ms")" "yes"
check "intake blocked behind a concurrent partial refund" "$INTAKE_ROWS/$(state cs_race2)" "0/partially_refunded/paused"

# The fulfillment start RPC (FOR UPDATE) racing a full refund.
q "select t.record_payment('cs_race3', 'paid'); select t.intake('cs_race3');" >/dev/null
psql "$TEST_URL" -qtAX -c "begin; select t.mark_refunded('cs_race3'); select pg_sleep(1.5); commit;" >/dev/null &
A=$!
sleep 0.4
OUTCOME="$(start_case cs_race3)"
wait $A
check "start refused when it queues behind a full refund" "$OUTCOME/$(state cs_race3)" "NOT_READY/refunded/refunded"

echo
echo "$pass passed, $fail failed"
[[ "$fail" -eq 0 ]]
