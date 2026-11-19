#!/usr/bin/env bash
# Database-level checks for Osiris Audit v1 refund and dispute integrity.
#
# Runs against a THROWAWAY local Postgres only. It creates the Supabase roles it
# needs, applies the repository migrations in order, and replays the exact
# statements that lib/osiris-audit/purchase-ledger.ts and the intake route send
# through PostgREST (supabase-js upsert/update filters), including concurrent
# sessions. Never point it at a hosted Supabase project.
#
# Every scenario and every race runs twice:
#   1. with the guest_audit_purchases_keep_refunds trigger DISABLED, so the
#      application's conditional writes are the only protection. This shows
#      the app guards hold on their own, under real row locks.
#   2. with the trigger ENABLED, plus controls that replay unguarded writes
#      (the pre-fix upsert, a dispute write that bypasses the dispute RPC). The
#      controls reopen a refund or hide a dispute in run 1 and are blocked in
#      run 2, which shows the trigger is what stops them.
# Dispute events go through the real record_osiris_audit_dispute_v1 function,
# exactly as the webhook calls it. Its own checks, and the fulfillment start
# RPC's checks, are part of the function bodies, not the trigger, so they apply
# in both runs.
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
RULE="guest_audit_purchases_keep_refunds"

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

apply_migrations() {
  for f in "$ROOT"/supabase/migrations/*.sql; do
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
# helper in lib/osiris-audit/purchase-ledger.ts, the webhook route or the
# intake route.
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
    and status not in ('refunded','partially_refunded','needs_review');
\$\$;

-- ensureOsirisPurchaseRow: upsert(ignoreDuplicates), optionally with one dispute
create or replace function t.ensure_row(p_id text, p_status text, p_fs text,
    p_disputes jsonb default '{}'::jsonb) returns void language sql as \$\$
  insert into public.guest_audit_purchases
    (stripe_session_id, flow, status, fulfillment_status, disputes, updated_at)
  values (p_id, 'osiris-audit-v1', p_status, p_fs, p_disputes, now())
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

-- webhook handleOsirisRefund
create or replace function t.full_refund(p_id text) returns void language sql as \$\$
  select t.ensure_row(p_id, 'refunded', 'refunded');
  select t.mark_refunded(p_id);
\$\$;
create or replace function t.partial_refund(p_id text) returns text language sql as \$\$
  select t.ensure_row(p_id, 'partially_refunded', 'paused');
  select t.hold(p_id, 'partially_refunded', array['refunded']);
\$\$;

-- webhook handleOsirisDispute: ensure the row (paid, paused, this dispute),
-- then the real dispute RPC (recordOsirisDispute calls it through supabase.rpc).
create or replace function t.dispute_event(p_id text, p_did text, p_dstatus text) returns text language plpgsql as \$\$
declare v text;
begin
  perform t.ensure_row(p_id, 'paid', 'paused', jsonb_build_object(p_did, p_dstatus));
  select r.fulfillment_status into v
  from public.record_osiris_audit_dispute_v1(p_id, p_did, p_dstatus) r;
  return v;
end \$\$;

-- intake route: conditional intake write, including the dispute filter
create or replace function t.intake(p_id text) returns int language plpgsql as \$\$
declare n int;
begin
  update public.guest_audit_purchases
  set intake_system_summary = 's', intake_primary_goal = 'g', intake_concerns = 'c',
      intake_submitted_at = now(), intake_authorization_confirmed_at = now(),
      intake_channel_authorization_text = 'synthetic authorization',
      fulfillment_status = 'intake_complete', updated_at = now()
  where stripe_session_id = p_id and status = 'paid'
    and fulfillment_status = 'intake_pending'
    and dispute_hold = false
    and intake_submitted_at is null;
  get diagnostics n = row_count;
  return n;
end \$\$;

-- Controls: unguarded writes the trigger exists to stop.
-- The pre-fix code path: upsert that overwrites status unconditionally.
create or replace function t.legacy_upsert_paid(p_id text) returns void language sql as \$\$
  insert into public.guest_audit_purchases (stripe_session_id, flow, status, updated_at)
  values (p_id, 'osiris-audit-v1', 'paid', now())
  on conflict (stripe_session_id) do update set status = excluded.status, updated_at = excluded.updated_at;
\$\$;
-- Dispute writes that bypass the dispute RPC: one sets a dispute's status
-- without the closed check, one replaces the whole map as a single-dispute
-- writer would.
create or replace function t.unguarded_dispute(p_id text, p_did text, p_dstatus text) returns void language sql as \$\$
  update public.guest_audit_purchases set disputes = disputes || jsonb_build_object(p_did, p_dstatus)
  where stripe_session_id = p_id;
\$\$;
create or replace function t.replace_disputes(p_id text, p_did text, p_dstatus text) returns void language sql as \$\$
  update public.guest_audit_purchases set disputes = jsonb_build_object(p_did, p_dstatus)
  where stripe_session_id = p_id;
\$\$;
" >/dev/null
}

# status/fulfillment/disputes, disputes as id=status sorted by id, or '-'.
state() {
  q "select status || '/' || fulfillment_status || '/' ||
       coalesce((select string_agg(key || '=' || value, ',' order by key) from jsonb_each_text(disputes)), '-')
     from public.guest_audit_purchases where stripe_session_id = '$1'"
}
hold_of() { q "select dispute_hold from public.guest_audit_purchases where stripe_session_id = '$1'"; }
start_case() {
  q "select outcome from public.start_osiris_audit_fulfillment_v1('$1', gen_random_uuid(), 'operator_synthetic', 'synthetic start', gen_random_uuid())"
}
operator_unpause() { q "update public.guest_audit_purchases set fulfillment_status = '$2' where stripe_session_id = '$1'" >/dev/null; }

# $1 = prefix for session ids, so each run uses fresh rows.
run_scenarios() {
  local P="$1"
  echo " Refunds"
  q "select t.record_payment('${P}_full', 'paid'); select t.full_refund('${P}_full'); select t.record_payment('${P}_full', 'paid');" >/dev/null
  check "replayed payment does not reopen a full refund" "$(state ${P}_full)" "refunded/refunded/-"

  q "select t.record_payment('${P}_part', 'paid'); select t.partial_refund('${P}_part'); select t.record_payment('${P}_part', 'paid');" >/dev/null
  check "replayed payment does not reopen a partial refund" "$(state ${P}_part)" "partially_refunded/paused/-"

  q "select t.record_payment('${P}_late', 'paid'); select t.full_refund('${P}_late');" >/dev/null
  check "late partial refund does not overwrite a full refund" "$(q "select coalesce(t.partial_refund('${P}_late'),'none')")/$(state ${P}_late)" "none/refunded/refunded/-"

  q "select t.record_payment('${P}_up', 'paid'); select t.partial_refund('${P}_up'); select t.full_refund('${P}_up');" >/dev/null
  check "partial refund can still become a full refund" "$(state ${P}_up)" "refunded/refunded/-"

  operator_unpause "${P}_part" intake_complete
  check "operator un-pause of a partially refunded case: start refused" "$(start_case ${P}_part)" "NOT_READY"

  echo " Out-of-order and duplicate events"
  q "select t.full_refund('${P}_ooo_full'); select t.record_payment('${P}_ooo_full', 'paid');" >/dev/null
  check "full refund before payment event stays refunded" "$(state ${P}_ooo_full)" "refunded/refunded/-"
  check "intake refused after refund-first ordering" "$(q "select t.intake('${P}_ooo_full')")" "0"

  q "select t.partial_refund('${P}_ooo_part'); select t.record_payment('${P}_ooo_part', 'paid');" >/dev/null
  check "partial refund before payment event stays held" "$(state ${P}_ooo_part)" "partially_refunded/paused/-"

  q "select t.record_payment('${P}_dup', 'paid'); select t.record_payment('${P}_dup', 'paid'); select t.record_payment('${P}_dup', 'paid');" >/dev/null
  check "duplicate payment events leave one paid row" "$(q "select count(*) || ':' || max(status) from public.guest_audit_purchases where stripe_session_id = '${P}_dup'")" "1:paid"

  q "select t.record_payment('${P}_rev', 'paid'); select t.ensure_row('${P}_rev', 'needs_review', 'paused'); select t.hold('${P}_rev', 'needs_review', array['refunded','partially_refunded']); select t.record_payment('${P}_rev', 'paid');" >/dev/null
  check "review hold is not cleared by a replayed payment" "$(state ${P}_rev)" "needs_review/paused/-"

  echo " Disputes combined with refunds"
  q "select t.record_payment('${P}_dp1', 'paid'); select t.intake('${P}_dp1'); select t.dispute_event('${P}_dp1', 'dp_1', 'needs_response'); select t.partial_refund('${P}_dp1');" >/dev/null
  check "dispute, then partial refund: both visible, case paused" "$(state ${P}_dp1)" "partially_refunded/paused/dp_1=needs_response"

  q "select t.record_payment('${P}_dp2', 'paid'); select t.intake('${P}_dp2'); select t.partial_refund('${P}_dp2'); select t.dispute_event('${P}_dp2', 'dp_2', 'needs_response');" >/dev/null
  check "partial refund, then dispute: both visible, case paused" "$(state ${P}_dp2)" "partially_refunded/paused/dp_2=needs_response"

  q "select t.record_payment('${P}_dp3', 'paid'); select t.dispute_event('${P}_dp3', 'dp_3', 'needs_response'); select t.full_refund('${P}_dp3');" >/dev/null
  check "dispute, then full refund: refunded with the dispute still visible" "$(state ${P}_dp3)" "refunded/refunded/dp_3=needs_response"

  q "select t.record_payment('${P}_dp4', 'paid'); select t.full_refund('${P}_dp4'); select t.dispute_event('${P}_dp4', 'dp_4', 'needs_response');" >/dev/null
  check "full refund, then dispute: dispute recorded, refund untouched" "$(state ${P}_dp4)" "refunded/refunded/dp_4=needs_response"

  q "select t.record_payment('${P}_dp5', 'paid'); select t.dispute_event('${P}_dp5', 'dp_5', 'needs_response'); select t.record_payment('${P}_dp5', 'paid');" >/dev/null
  check "replayed payment event leaves an open dispute and the pause alone" "$(state ${P}_dp5)" "paid/paused/dp_5=needs_response"

  echo " Dispute closed, won and lost"
  q "select t.record_payment('${P}_won', 'paid'); select t.intake('${P}_won'); select t.dispute_event('${P}_won', 'dp_w', 'needs_response'); select t.dispute_event('${P}_won', 'dp_w', 'won');" >/dev/null
  check "dispute won: recorded, case stays paused for the Operator" "$(state ${P}_won)/$(hold_of ${P}_won)" "paid/paused/dp_w=won/f"
  q "select t.dispute_event('${P}_won', 'dp_w', 'needs_response'); select t.dispute_event('${P}_won', 'dp_w', 'under_review');" >/dev/null
  check "late created/updated events do not reopen a won dispute" "$(state ${P}_won)" "paid/paused/dp_w=won"
  operator_unpause "${P}_won" intake_complete
  check "won dispute: start allowed after the Operator un-pauses" "$(start_case ${P}_won)" "STARTED"

  q "select t.record_payment('${P}_lost', 'paid'); select t.intake('${P}_lost'); select t.dispute_event('${P}_lost', 'dp_l', 'needs_response'); select t.dispute_event('${P}_lost', 'dp_l', 'lost'); select t.dispute_event('${P}_lost', 'dp_l', 'needs_response');" >/dev/null
  check "dispute lost: stays lost against a late open event" "$(state ${P}_lost)" "paid/paused/dp_l=lost"
  operator_unpause "${P}_lost" intake_complete
  check "lost dispute: start refused even after an un-pause" "$(start_case ${P}_lost)" "NOT_READY"

  q "select t.record_payment('${P}_lf', 'paid');" >/dev/null
  q "select t.dispute_event('${P}_lf', 'dp_lf', 'lost');" >/dev/null
  check "lost dispute with no earlier open event still pauses an active case" "$(state ${P}_lf)" "paid/paused/dp_lf=lost"

  q "select t.record_payment('${P}_pv', 'paid'); select t.dispute_event('${P}_pv', 'dp_pv', 'prevented');" >/dev/null
  check "prevented dispute pauses an active case and holds it" "$(state ${P}_pv)/$(hold_of ${P}_pv)" "paid/paused/dp_pv=prevented/t"

  q "select t.record_payment('${P}_inq', 'paid'); select t.dispute_event('${P}_inq', 'dp_i', 'warning_needs_response'); select t.dispute_event('${P}_inq', 'dp_i', 'warning_closed'); select t.dispute_event('${P}_inq', 'dp_i', 'warning_under_review');" >/dev/null
  check "closed inquiry stays closed against a late inquiry event" "$(state ${P}_inq)/$(hold_of ${P}_inq)" "paid/paused/dp_i=warning_closed/f"
  q "select t.dispute_event('${P}_inq', 'dp_i2', 'needs_response');" >/dev/null
  check "a new dispute after a closed inquiry is recorded next to it" "$(state ${P}_inq)/$(hold_of ${P}_inq)" "paid/paused/dp_i=warning_closed,dp_i2=needs_response/t"

  q "select t.record_payment('${P}_unk', 'paid'); select t.dispute_event('${P}_unk', 'dp_u', 'some_future_status');" >/dev/null
  check "a status Stripe adds later is recorded and counts as a hold" "$(state ${P}_unk)/$(hold_of ${P}_unk)" "paid/paused/dp_u=some_future_status/t"

  echo " Several disputes on one payment, any delivery order (re-review at 57f5a65, review bot at 5380897)"
  # Reviewer ordering: inquiry open, inquiry closed, chargeback open, redelivered inquiry close.
  q "select t.record_payment('${P}_ord', 'paid'); select t.intake('${P}_ord');
     select t.dispute_event('${P}_ord', 'dp_inq', 'warning_needs_response');
     select t.dispute_event('${P}_ord', 'dp_inq', 'warning_closed');
     select t.dispute_event('${P}_ord', 'dp_cb', 'needs_response');
     select t.dispute_event('${P}_ord', 'dp_inq', 'warning_closed');" >/dev/null
  check "inquiry open, closed, chargeback open, redelivered inquiry close: chargeback still holds" "$(state ${P}_ord)/$(hold_of ${P}_ord)" "paid/paused/dp_cb=needs_response,dp_inq=warning_closed/t"
  q "select t.dispute_event('${P}_ord', 'dp_inq', 'warning_needs_response');" >/dev/null
  check "a redelivered inquiry open event changes nothing" "$(state ${P}_ord)" "paid/paused/dp_cb=needs_response,dp_inq=warning_closed"
  operator_unpause "${P}_ord" intake_complete
  check "after an un-pause, start is still refused while the chargeback is open" "$(start_case ${P}_ord)" "NOT_READY"
  operator_unpause "${P}_ord" intake_pending
  q "update public.guest_audit_purchases set intake_submitted_at = null where stripe_session_id = '${P}_ord'" >/dev/null
  check "after an un-pause, intake is still refused while the chargeback is open" "$(q "select t.intake('${P}_ord')")" "0"

  # Review bot ordering: chargeback opens before the inquiry's close arrives.
  q "select t.record_payment('${P}_bot', 'paid'); select t.intake('${P}_bot');
     select t.dispute_event('${P}_bot', 'dp_inq', 'warning_needs_response');
     select t.dispute_event('${P}_bot', 'dp_cb', 'needs_response');
     select t.dispute_event('${P}_bot', 'dp_inq', 'warning_closed');" >/dev/null
  check "inquiry open, chargeback open, inquiry closed: chargeback recorded and still holds" "$(state ${P}_bot)/$(hold_of ${P}_bot)" "paid/paused/dp_cb=needs_response,dp_inq=warning_closed/t"
  operator_unpause "${P}_bot" intake_complete
  check "after an un-pause, start is refused while that chargeback is open" "$(start_case ${P}_bot)" "NOT_READY"

  q "select t.record_payment('${P}_cbw', 'paid');
     select t.dispute_event('${P}_cbw', 'dp_inq', 'warning_needs_response');
     select t.dispute_event('${P}_cbw', 'dp_cb', 'needs_response');
     select t.dispute_event('${P}_cbw', 'dp_cb', 'won');" >/dev/null
  check "chargeback won while the inquiry is still open: still held by the inquiry" "$(state ${P}_cbw)/$(hold_of ${P}_cbw)" "paid/paused/dp_cb=won,dp_inq=warning_needs_response/t"
  q "select t.dispute_event('${P}_cbw', 'dp_inq', 'warning_closed');" >/dev/null
  check "once every dispute is closed in the merchant's favour, the hold clears" "$(hold_of ${P}_cbw)" "f"
  check "clearing the hold never un-pauses the case" "$(state ${P}_cbw)" "paid/paused/dp_cb=won,dp_inq=warning_closed"

  q "select t.record_payment('${P}_lost2', 'paid');
     select t.dispute_event('${P}_lost2', 'dp_l1', 'lost');
     select t.dispute_event('${P}_lost2', 'dp_l2', 'won');" >/dev/null
  check "a lost dispute still holds after a different dispute is won" "$(state ${P}_lost2)/$(hold_of ${P}_lost2)" "paid/paused/dp_l1=lost,dp_l2=won/t"
  operator_unpause "${P}_lost2" intake_complete
  check "lost plus won: start refused after an un-pause" "$(start_case ${P}_lost2)" "NOT_READY"

  q "select t.record_payment('${P}_cbl', 'paid'); select t.intake('${P}_cbl');
     select t.dispute_event('${P}_cbl', 'dp_inq', 'warning_closed');
     select t.dispute_event('${P}_cbl', 'dp_cb', 'lost');" >/dev/null
  check "a chargeback lost after a closed inquiry is recorded and pauses the case" "$(state ${P}_cbl)/$(hold_of ${P}_cbl)" "paid/paused/dp_cb=lost,dp_inq=warning_closed/t"

  q "select t.record_payment('${P}_open', 'paid'); select t.intake('${P}_open'); select t.dispute_event('${P}_open', 'dp_o', 'needs_response');" >/dev/null
  operator_unpause "${P}_open" intake_complete
  check "open dispute: start refused even after an un-pause" "$(start_case ${P}_open)" "NOT_READY"
  q "select t.record_payment('${P}_open2', 'paid'); select t.dispute_event('${P}_open2', 'dp_o2', 'needs_response');" >/dev/null
  operator_unpause "${P}_open2" intake_pending
  check "open dispute: intake refused even after an un-pause" "$(q "select t.intake('${P}_open2')")" "0"

  q "select t.dispute_event('${P}_first', 'dp_f', 'needs_response'); select t.record_payment('${P}_first', 'paid');" >/dev/null
  check "dispute before the payment event: row paused with the dispute, payment recorded" "$(state ${P}_first)" "paid/paused/dp_f=needs_response"
  check "intake refused after dispute-first ordering" "$(q "select t.intake('${P}_first')")" "0"

  check "dispute RPC rejects a malformed dispute id" "$(q "do \$\$ begin perform public.record_osiris_audit_dispute_v1('${P}_first', 'dp_x,dispute_hold.is.false', 'won'); raise exception 'accepted'; exception when sqlstate '22023' then null; end \$\$; select 'rejected'")" "rejected"
  check "dispute RPC rejects an empty status" "$(q "do \$\$ begin perform public.record_osiris_audit_dispute_v1('${P}_first', 'dp_f', ' '); raise exception 'accepted'; exception when sqlstate '22023' then null; end \$\$; select 'rejected'")" "rejected"
  check "the rejected calls changed nothing" "$(state ${P}_first)" "paid/paused/dp_f=needs_response"
}

# $1 = prefix, $2 = expected control outcome suffix ("reopened" or "kept")
run_controls() {
  local P="$1" mode="$2"
  q "select t.legacy_upsert_paid('${P}_lg1'); select t.mark_refunded('${P}_lg1'); select t.legacy_upsert_paid('${P}_lg1');" >/dev/null
  q "select t.record_payment('${P}_lg2', 'paid'); select t.partial_refund('${P}_lg2'); select t.legacy_upsert_paid('${P}_lg2');" >/dev/null
  q "select t.record_payment('${P}_lg3', 'paid'); select t.dispute_event('${P}_lg3', 'dp_g', 'lost'); select t.unguarded_dispute('${P}_lg3', 'dp_g', 'needs_response');" >/dev/null
  q "select t.record_payment('${P}_lg4', 'paid'); select t.dispute_event('${P}_lg4', 'dp_inq', 'warning_closed'); select t.dispute_event('${P}_lg4', 'dp_cb', 'needs_response'); select t.replace_disputes('${P}_lg4', 'dp_inq', 'warning_closed');" >/dev/null
  if [[ "$mode" == "reopened" ]]; then
    check "control: pre-fix upsert reopens a full refund without the rule" "$(state ${P}_lg1)" "paid/refunded/-"
    check "control: pre-fix upsert reopens a partial refund without the rule" "$(state ${P}_lg2)" "paid/paused/-"
    check "control: unguarded write reopens a lost dispute without the rule" "$(state ${P}_lg3)" "paid/paused/dp_g=needs_response"
    check "control: a single-dispute write drops an open chargeback without the rule" "$(state ${P}_lg4)/$(hold_of ${P}_lg4)" "paid/paused/dp_inq=warning_closed/f"
  else
    check "rule keeps a full refund against the pre-fix upsert" "$(state ${P}_lg1)" "refunded/refunded/-"
    check "rule keeps a partial refund against the pre-fix upsert" "$(state ${P}_lg2)" "partially_refunded/paused/-"
    check "rule keeps a lost dispute against an unguarded write" "$(state ${P}_lg3)" "paid/paused/dp_g=lost"
    check "rule keeps an open chargeback against a single-dispute write" "$(state ${P}_lg4)/$(hold_of ${P}_lg4)" "paid/paused/dp_cb=needs_response,dp_inq=warning_closed/t"
  fi
}

# Holds the row lock in one session for 1.5 s while $2 runs in another.
# $1 = SQL for the lock holder.
hold_lock() { psql "$TEST_URL" -qtAX -c "begin; $1; select pg_sleep(1.5); commit;" >/dev/null & }

run_races() {
  local P="$1" A B C T0 WAITED_MS OUT
  # A full refund holds the row lock while a partial-refund hold and a payment
  # replay arrive. Both must re-check their WHERE clause after the lock is released.
  q "select t.record_payment('${P}_r1', 'paid'); select t.intake('${P}_r1');" >/dev/null
  hold_lock "select t.full_refund('${P}_r1')"; A=$!
  sleep 0.4
  psql "$TEST_URL" -qtAX -c "select t.partial_refund('${P}_r1')" >/dev/null & B=$!
  psql "$TEST_URL" -qtAX -c "select t.record_payment('${P}_r1', 'paid')" >/dev/null & C=$!
  wait $A $B $C
  check "full refund wins over a concurrent partial refund and payment replay" "$(state ${P}_r1)" "refunded/refunded/-"

  # A partial refund holds the lock while the intake write arrives.
  q "select t.record_payment('${P}_r2', 'paid');" >/dev/null
  hold_lock "select t.partial_refund('${P}_r2')"; A=$!
  sleep 0.4
  T0=$(date +%s%N)
  OUT="$(psql "$TEST_URL" -qtAX -c "select t.intake('${P}_r2')")"
  WAITED_MS=$(( ($(date +%s%N) - T0) / 1000000 ))
  wait $A
  check "intake actually waited on the row lock (>= 800 ms)" "$([[ $WAITED_MS -ge 800 ]] && echo yes || echo "no, ${WAITED_MS} ms")" "yes"
  check "intake blocked behind a concurrent partial refund" "$OUT/$(state ${P}_r2)" "0/partially_refunded/paused/-"

  # The fulfillment start RPC (FOR UPDATE) racing a full refund.
  q "select t.record_payment('${P}_r3', 'paid'); select t.intake('${P}_r3');" >/dev/null
  hold_lock "select t.full_refund('${P}_r3')"; A=$!
  sleep 0.4
  OUT="$(start_case ${P}_r3)"
  wait $A
  check "start refused when it queues behind a full refund" "$OUT/$(state ${P}_r3)" "NOT_READY/refunded/refunded/-"

  # An open dispute holds the lock while the intake write arrives.
  q "select t.record_payment('${P}_r4', 'paid');" >/dev/null
  hold_lock "select t.dispute_event('${P}_r4', 'dp_r4', 'needs_response')"; A=$!
  sleep 0.4
  T0=$(date +%s%N)
  OUT="$(psql "$TEST_URL" -qtAX -c "select t.intake('${P}_r4')")"
  WAITED_MS=$(( ($(date +%s%N) - T0) / 1000000 ))
  wait $A
  check "intake waited on the dispute's row lock (>= 800 ms)" "$([[ $WAITED_MS -ge 800 ]] && echo yes || echo "no, ${WAITED_MS} ms")" "yes"
  check "intake blocked behind a concurrent open dispute" "$OUT/$(state ${P}_r4)" "0/paid/paused/dp_r4=needs_response"

  # An open dispute holds the lock while a partial refund arrives: both must survive.
  q "select t.record_payment('${P}_r5', 'paid'); select t.intake('${P}_r5');" >/dev/null
  hold_lock "select t.dispute_event('${P}_r5', 'dp_r5', 'needs_response')"; A=$!
  sleep 0.4
  psql "$TEST_URL" -qtAX -c "select t.partial_refund('${P}_r5')" >/dev/null
  wait $A
  check "concurrent dispute and partial refund: both visible" "$(state ${P}_r5)" "partially_refunded/paused/dp_r5=needs_response"

  # A closing (won) event holds the lock while a late open event for the same dispute arrives.
  q "select t.record_payment('${P}_r6', 'paid'); select t.dispute_event('${P}_r6', 'dp_r6', 'needs_response');" >/dev/null
  hold_lock "select t.dispute_event('${P}_r6', 'dp_r6', 'won')"; A=$!
  sleep 0.4
  psql "$TEST_URL" -qtAX -c "select t.dispute_event('${P}_r6', 'dp_r6', 'under_review')" >/dev/null
  wait $A
  check "late open event queued behind a win does not reopen the dispute" "$(state ${P}_r6)" "paid/paused/dp_r6=won"

  # A chargeback holds the lock while a redelivered close for the older inquiry arrives.
  q "select t.record_payment('${P}_r8', 'paid'); select t.dispute_event('${P}_r8', 'dp_inq', 'warning_needs_response'); select t.dispute_event('${P}_r8', 'dp_inq', 'warning_closed');" >/dev/null
  hold_lock "select t.dispute_event('${P}_r8', 'dp_cb', 'needs_response')"; A=$!
  sleep 0.4
  psql "$TEST_URL" -qtAX -c "select t.dispute_event('${P}_r8', 'dp_inq', 'warning_closed')" >/dev/null
  wait $A
  check "redelivered inquiry close queued behind a chargeback does not hide it" "$(state ${P}_r8)/$(hold_of ${P}_r8)" "paid/paused/dp_cb=needs_response,dp_inq=warning_closed/t"

  # Two different disputes' first events race on a row that already exists:
  # both must end up in the map.
  q "select t.record_payment('${P}_r9', 'paid');" >/dev/null
  hold_lock "select t.dispute_event('${P}_r9', 'dp_a', 'warning_needs_response')"; A=$!
  sleep 0.4
  psql "$TEST_URL" -qtAX -c "select t.dispute_event('${P}_r9', 'dp_b', 'needs_response')" >/dev/null
  wait $A
  check "two disputes arriving together are both recorded" "$(state ${P}_r9)/$(hold_of ${P}_r9)" "paid/paused/dp_a=warning_needs_response,dp_b=needs_response/t"

  # The fulfillment start RPC racing an open dispute.
  q "select t.record_payment('${P}_r7', 'paid'); select t.intake('${P}_r7');" >/dev/null
  hold_lock "select t.dispute_event('${P}_r7', 'dp_r7', 'needs_response')"; A=$!
  sleep 0.4
  OUT="$(start_case ${P}_r7)"
  wait $A
  check "start refused when it queues behind an open dispute" "$OUT/$(state ${P}_r7)" "NOT_READY/paid/paused/dp_r7=needs_response"
}

echo "Applying all migrations in order"
apply_migrations
define_app_statements
check "both proposed migrations applied; rule present" "$(q "select count(*) from pg_trigger where tgname = '$RULE'")" "1"
check "dispute RPC: service_role can execute, anon and authenticated cannot" "$(q "select string_agg(r || '=' || has_function_privilege(r, 'public.record_osiris_audit_dispute_v1(text,text,text)', 'execute')::text, ',' order by r) from unnest(array['anon','authenticated','service_role']) r")" "anon=false,authenticated=false,service_role=true"

echo
echo "Run 1: rule DISABLED, application guards only"
q "alter table public.guest_audit_purchases disable trigger $RULE" >/dev/null
check "rule is disabled for this run" "$(q "select tgenabled from pg_trigger where tgname = '$RULE'")" "D"
run_scenarios off
echo " Controls (unguarded writes)"
run_controls off reopened
echo " Concurrent sessions (READ COMMITTED, real row locks)"
run_races off

echo
echo "Run 2: rule ENABLED"
q "alter table public.guest_audit_purchases enable trigger $RULE" >/dev/null
check "rule is enabled for this run" "$(q "select tgenabled from pg_trigger where tgname = '$RULE'")" "O"
run_scenarios on
echo " Controls (unguarded writes)"
run_controls on kept
echo " Concurrent sessions (READ COMMITTED, real row locks)"
run_races on

echo
echo "$pass passed, $fail failed"
[[ "$fail" -eq 0 ]]
