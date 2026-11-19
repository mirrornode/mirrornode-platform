#!/usr/bin/env bash
# Database-level checks for the Osiris Audit v1 review-before-delivery gate
# (migration 20261119150000_require_review_before_osiris_delivery.sql).
#
# Runs against a THROWAWAY local Postgres only. Creates the Supabase roles it
# needs, applies the repository migrations in order, then drives cases through
# the real functions AS service_role (the role the app uses), and tries the
# direct writes a privileged writer could attempt.
#
# Usage: PGURL=postgresql://postgres@localhost:5432/postgres scripts/db/test-osiris-delivery-integrity.sh

set -euo pipefail

: "${PGURL:?Set PGURL to a throwaway local Postgres superuser connection}"
case "$PGURL" in
  *supabase.co*|*supabase.com*|*pooler*) echo "Refusing to run against a hosted database." >&2; exit 2 ;;
esac

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DB="osiris_delivery_integrity_$$"
ADMIN_URL="$PGURL"
TEST_URL="${PGURL%/*}/$DB"
pass=0
fail=0

q() { psql "$TEST_URL" -v ON_ERROR_STOP=1 -qtAX -c "$1"; }
# Run SQL as the app's role. Prints the result, or ERR:<sqlstate>:<message>.
svc() {
  local out
  if out="$(psql "$TEST_URL" -v ON_ERROR_STOP=1 -qtAX -v VERBOSITY=sqlstate -c "set role service_role; $1" 2>&1)"; then
    printf '%s' "$out"
  else
    printf 'ERR:%s' "$(printf '%s' "$out" | sed -n 's/.*ERROR: *\([0-9A-Z]\{5\}\).*/\1/p' | head -1)"
  fi
}
as_role() {
  local out
  if out="$(psql "$TEST_URL" -v ON_ERROR_STOP=1 -qtAX -v VERBOSITY=sqlstate -c "set role $1; $2" 2>&1)"; then
    printf '%s' "$out"
  else
    printf 'ERR:%s' "$(printf '%s' "$out" | sed -n 's/.*ERROR: *\([0-9A-Z]\{5\}\).*/\1/p' | head -1)"
  fi
}
check() {
  local label="$1" got="$2" want="$3"
  if [[ "$got" == "$want" ]]; then pass=$((pass + 1)); echo "  ok   $label"
  else fail=$((fail + 1)); echo "  FAIL $label: got [$got], want [$want]"; fi
}

cleanup() { psql "$ADMIN_URL" -qtAX -c "drop database if exists $DB" >/dev/null 2>&1 || true; }
trap cleanup EXIT

psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -qtAX -c "create database $DB" >/dev/null
q "do \$\$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end \$\$;
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key);
create or replace function auth.uid() returns uuid language sql stable as 'select null::uuid';" >/dev/null

for f in "$ROOT"/supabase/migrations/*.sql; do
  if [[ "$(basename "$f")" == "20260813212729_harden_guest_audit_purchase_privileges.sql" ]]; then
    # Known drift (see test-osiris-refund-integrity.sh): stand-in only when absent.
    q "do \$\$ begin
         if to_regprocedure('public.set_guest_audit_purchases_updated_at()') is null then
           create function public.set_guest_audit_purchases_updated_at() returns trigger
             language plpgsql set search_path = pg_catalog as 'begin new.updated_at = now(); return new; end;';
         end if;
         if not exists (select 1 from pg_trigger where tgrelid = 'public.guest_audit_purchases'::regclass
                          and tgname = 'trg_guest_audit_purchases_updated_at') then
           create trigger trg_guest_audit_purchases_updated_at before update on public.guest_audit_purchases
             for each row execute function public.set_guest_audit_purchases_updated_at();
         end if;
       end \$\$;" >/dev/null
  fi
  psql "$TEST_URL" -v ON_ERROR_STOP=1 -qX -f "$f" >/dev/null
done
q "grant usage on schema public to anon, authenticated, service_role" >/dev/null

A="sha256:$(printf 'artifact-A' | sha256sum | cut -c1-64)"
B="sha256:$(printf 'artifact-B' | sha256sum | cut -c1-64)"
uuid() { q "select gen_random_uuid()"; }

# A paid, intaken case, started through the real start RPC as service_role.
new_case() {
  local id="$1"
  q "insert into public.guest_audit_purchases (stripe_session_id, flow, status, customer_email, fulfillment_status)
     values ('$id', 'osiris-audit-v1', 'paid', 'synthetic@example.invalid', 'intake_pending')" >/dev/null
  q "update public.guest_audit_purchases set intake_system_summary='Synthetic system summary', intake_primary_goal='Synthetic primary goal',
       intake_concerns='Synthetic concerns', intake_submitted_at=now(), intake_authorization_confirmed_at=now(),
       intake_channel_authorization_text='synthetic authorization', fulfillment_status='intake_complete'
     where stripe_session_id='$id'" >/dev/null
}
start_case() {
  svc "select outcome from public.start_osiris_audit_fulfillment_v1('$1', '$(uuid)', 'operator_SYNTH', 'Synthetic start for delivery gate tests', '$(uuid)')"
}
review() { svc "select outcome from public.record_osiris_audit_review_v1('$1', '$2', '$3', 'reviewer_SYNTH', '$(uuid)')"; }
deliver() { svc "select outcome from public.deliver_osiris_audit_v1('$1', '$2', 'operator_SYNTH', '$3', '$(uuid)')"; }
fs() { q "select fulfillment_status from public.guest_audit_purchases where stripe_session_id='$1'"; }

echo "== privileges"
check "service_role cannot UPDATE the new evidence columns" \
  "$(q "select string_agg(c || '=' || has_column_privilege('service_role', 'public.guest_audit_purchases', c, 'UPDATE')::text, ',' order by c) from unnest(array['delivered_artifact_digest','delivered_by','delivery_review_verdict','delivery_review_artifact_digest']) c")" \
  "delivered_artifact_digest=false,delivered_by=false,delivery_review_artifact_digest=false,delivery_review_verdict=false"
check "service_role keeps UPDATE on existing columns" \
  "$(q "select bool_and(has_column_privilege('service_role', 'public.guest_audit_purchases', c, 'UPDATE')) from unnest(array['status','fulfillment_status','updated_at','disputes','intake_submitted_at','fulfillment_start_event_id','delivered_at']) c")" "t"
check "review and deliver functions: service_role only" \
  "$(q "select string_agg(r || '=' || has_function_privilege(r, f, 'execute')::text, ',' order by f, r) from unnest(array['anon','authenticated','service_role']) r, unnest(array['public.deliver_osiris_audit_v1(text,text,text,uuid,uuid)','public.record_osiris_audit_review_v1(text,text,text,text,uuid)']) f")" \
  "anon=false,authenticated=false,service_role=true,anon=false,authenticated=false,service_role=true"
check "anon cannot call deliver" "$(as_role anon "select outcome from public.deliver_osiris_audit_v1('cs_x', '$A', 'x', gen_random_uuid(), gen_random_uuid())")" "ERR:42501"
check "functions are SECURITY DEFINER with search_path pinned to pg_catalog" \
  "$(q "select string_agg(proname || ':' || prosecdef::text || ':' || array_to_string(proconfig, ';'), ',' order by proname) from pg_proc where proname in ('deliver_osiris_audit_v1','record_osiris_audit_review_v1')")" \
  "deliver_osiris_audit_v1:true:search_path=pg_catalog,record_osiris_audit_review_v1:true:search_path=pg_catalog"

echo "== happy path"
new_case cs_happy
check "start" "$(start_case cs_happy)" "STARTED"
check "review PASS of A" "$(review cs_happy "$A" PASS)" "RECORDED"
K1="$(uuid)"
check "deliver A" "$(deliver cs_happy "$A" "$K1")" "DELIVERED"
check "ledger shows delivered A by operator with time" \
  "$(q "select fulfillment_status || ':' || (delivered_artifact_digest = '$A')::text || ':' || delivered_by || ':' || (delivered_at is not null)::text || ':' || delivery_reviewed_by from public.guest_audit_purchases where stripe_session_id='cs_happy'")" \
  "delivered:true:operator_SYNTH:true:reviewer_SYNTH"

echo "== absent review"
new_case cs_noreview; start_case cs_noreview >/dev/null
check "deliver with no review" "$(deliver cs_noreview "$A" "$(uuid)")" "REVIEW_REQUIRED"
check "service_role direct UPDATE to delivered (runbook's old step) refused" \
  "$(svc "update public.guest_audit_purchases set fulfillment_status='delivered', delivered_at=now() where stripe_session_id='cs_noreview'")" "ERR:P0001"
check "service_role cannot write review columns directly" \
  "$(svc "update public.guest_audit_purchases set delivery_review_verdict='PASS', delivery_review_artifact_digest='$A' where stripe_session_id='cs_noreview'")" "ERR:42501"
check "case still started" "$(fs cs_noreview)" "fulfillment_started"
check "review FAIL then deliver" "$(review cs_noreview "$A" FAIL; echo; deliver cs_noreview "$A" "$(uuid)")" $'RECORDED\nREVIEW_REQUIRED'

echo "== wrong artifact digest"
new_case cs_wrong; start_case cs_wrong >/dev/null; review cs_wrong "$A" PASS >/dev/null
check "deliver B after PASS of A" "$(deliver cs_wrong "$B" "$(uuid)")" "ARTIFACT_MISMATCH"
check "malformed digest refused" "$(deliver cs_wrong "sha256:xyz" "$(uuid)")" "ERR:22023"

echo "== changed approval"
new_case cs_changed; start_case cs_changed >/dev/null
review cs_changed "$A" PASS >/dev/null
check "second review PASS of B replaces A" "$(review cs_changed "$B" PASS)" "RECORDED"
check "deliver A now refused" "$(deliver cs_changed "$A" "$(uuid)")" "ARTIFACT_MISMATCH"
review cs_changed "$B" FAIL >/dev/null
check "PASS then FAIL: deliver B refused" "$(deliver cs_changed "$B" "$(uuid)")" "REVIEW_REQUIRED"
review cs_changed "$B" PASS >/dev/null
check "PASS again: deliver B" "$(deliver cs_changed "$B" "$(uuid)")" "DELIVERED"
check "review after delivery refused" "$(review cs_changed "$A" PASS)" "ALREADY_DELIVERED"

echo "== pause voids the review"
new_case cs_pause; start_case cs_pause >/dev/null; review cs_pause "$A" PASS >/dev/null
svc "update public.guest_audit_purchases set fulfillment_status='paused' where stripe_session_id='cs_pause'" >/dev/null
check "pause sets verdict VOID, digest kept" "$(q "select delivery_review_verdict || ':' || (delivery_review_artifact_digest='$A')::text from public.guest_audit_purchases where stripe_session_id='cs_pause'")" "VOID:true"
svc "update public.guest_audit_purchases set fulfillment_status='fulfillment_started' where stripe_session_id='cs_pause'" >/dev/null
check "operator resume keeps the start receipt" "$(fs cs_pause)" "fulfillment_started"
check "deliver after resume needs a new review" "$(deliver cs_pause "$A" "$(uuid)")" "REVIEW_REQUIRED"
review cs_pause "$A" PASS >/dev/null
check "fresh review then deliver" "$(deliver cs_pause "$A" "$(uuid)")" "DELIVERED"

echo "== duplicate delivery"
check "same key replays" "$(deliver cs_happy "$A" "$K1")" "IDEMPOTENT"
check "new key refused" "$(deliver cs_happy "$A" "$(uuid)")" "ALREADY_DELIVERED"
check "same key on another case conflicts" "$(deliver cs_pause "$A" "$K1")" "IDEMPOTENCY_CONFLICT"
check "service_role cannot rewrite delivered_at after delivery" \
  "$(svc "update public.guest_audit_purchases set delivered_at=now() - interval '1 day' where stripe_session_id='cs_happy'")" "ERR:P0001"
check "service_role cannot move delivered back to started" \
  "$(svc "update public.guest_audit_purchases set fulfillment_status='fulfillment_started' where stripe_session_id='cs_happy'")" "ERR:P0001"
check "a full refund after delivery still applies" \
  "$(svc "update public.guest_audit_purchases set status='refunded', fulfillment_status='refunded' where stripe_session_id='cs_happy' returning status || ':' || fulfillment_status")" "refunded:refunded"

echo "== unauthorized state promotion"
new_case cs_promote
check "direct intake_complete -> fulfillment_started (no start receipt)" \
  "$(svc "update public.guest_audit_purchases set fulfillment_status='fulfillment_started' where stripe_session_id='cs_promote'")" "ERR:P0001"
check "direct intake_complete -> delivered" \
  "$(svc "update public.guest_audit_purchases set fulfillment_status='delivered', delivered_at=now() where stripe_session_id='cs_promote'")" "ERR:P0001"
check "insert a row already delivered" \
  "$(svc "insert into public.guest_audit_purchases (stripe_session_id, flow, status, customer_email, fulfillment_status, delivered_at) values ('cs_forged', 'osiris-audit-v1', 'paid', 'x@example.invalid', 'delivered', now())")" "ERR:P0001"
check "insert a row already started" \
  "$(svc "insert into public.guest_audit_purchases (stripe_session_id, flow, status, customer_email, fulfillment_status) values ('cs_forged2', 'osiris-audit-v1', 'paid', 'x@example.invalid', 'fulfillment_started')")" "ERR:P0001"
check "review before start refused" "$(review cs_promote "$A" PASS)" "NOT_READY"
check "deliver before start refused" "$(deliver cs_promote "$A" "$(uuid)")" "NOT_READY"
check "superuser direct delivered write also refused by the trigger" \
  "$(psql "$TEST_URL" -qtAX -v VERBOSITY=sqlstate -c "update public.guest_audit_purchases set fulfillment_status='delivered', delivered_at=now() where stripe_session_id='cs_promote'" 2>&1 | grep -oE 'P0001' | head -1)" "P0001"

echo "== held, refunded and partially refunded cases"
new_case cs_held; start_case cs_held >/dev/null; review cs_held "$A" PASS >/dev/null
check "dispute recorded through the dispute function" "$(svc "select dispute_hold from public.record_osiris_audit_dispute_v1('cs_held', 'dp_SYNTH1', 'needs_response')")" "t"
check "dispute pauses and voids the review" "$(q "select fulfillment_status || ':' || delivery_review_verdict from public.guest_audit_purchases where stripe_session_id='cs_held'")" "paused:VOID"
check "deliver while disputed" "$(deliver cs_held "$A" "$(uuid)")" "NOT_READY"
new_case cs_ref; start_case cs_ref >/dev/null; review cs_ref "$A" PASS >/dev/null
svc "update public.guest_audit_purchases set status='refunded', fulfillment_status='refunded' where stripe_session_id='cs_ref'" >/dev/null
check "deliver after full refund" "$(deliver cs_ref "$A" "$(uuid)")" "NOT_READY"
new_case cs_part; start_case cs_part >/dev/null; review cs_part "$A" PASS >/dev/null
svc "update public.guest_audit_purchases set status='partially_refunded', fulfillment_status='paused' where stripe_session_id='cs_part'" >/dev/null
check "deliver after partial refund" "$(deliver cs_part "$A" "$(uuid)")" "NOT_READY"

echo "== concurrent deliveries with different keys"
new_case cs_race; start_case cs_race >/dev/null; review cs_race "$A" PASS >/dev/null
R1="$(uuid)"; R2="$(uuid)"
( deliver cs_race "$A" "$R1" > /tmp/osiris_race_1.$$ ) & ( deliver cs_race "$A" "$R2" > /tmp/osiris_race_2.$$ ) & wait
check "exactly one DELIVERED, the other ALREADY_DELIVERED" \
  "$(sort /tmp/osiris_race_1.$$ /tmp/osiris_race_2.$$ | tr '\n' ',')" "ALREADY_DELIVERED,DELIVERED,"
rm -f /tmp/osiris_race_1.$$ /tmp/osiris_race_2.$$

echo
echo "$pass passed, $fail failed"
[[ "$fail" -eq 0 ]]
