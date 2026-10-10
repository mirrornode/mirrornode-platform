# Osiris Audit v1 — Operator Fulfillment Runbook

Status: Controlled-start procedure; target rollout must be verified separately
Scope: Osiris Audit v1 only
Authority boundary: This runbook records the manual fulfillment procedure. It does not authorize autonomous fulfillment, broaden product scope, or replace Operator judgment.

## Purpose

Provide the smallest repeatable Operator procedure from a paid Osiris Audit v1 intake through review, fulfillment, delivery, pause, or refund.

Payment state remains separate from fulfillment state:

- `status` records Stripe/payment evidence.
- `fulfillment_status` records manual fulfillment state.

Allowed fulfillment states:

- `intake_pending`
- `intake_complete`
- `fulfillment_started`
- `delivered`
- `paused`
- `refunded`

## 1. Operator intake review checkpoint

Before work begins, confirm the private `guest_audit_purchases` record shows:

- `flow = osiris-audit-v1`
- payment `status = paid`
- customer email is present
- `fulfillment_status = intake_complete`
- intake summary, goal, and concerns are present
- `intake_submitted_at` and `intake_authorization_confirmed_at` are present
- `intake_channel_authorization_text` preserves the exact statement confirmed by the customer
- review/start timestamps and start idempotency key are still null
- submitted artifact links, when provided by the customer, are recorded
- submitted scope fits Osiris Audit v1
- no secrets, private keys, passwords, or production credentials are required

If scope is acceptable, record the review decision by issuing the controlled start command below. Do not set `operator_reviewed_at` separately: the RPC requires it to be null and records review and start atomically.

Do not begin fulfillment without the review and explicit customer authorization.

## 2. Begin fulfillment

After the migration and server configuration are verified in the approved target environment, use `POST /api/internal/osiris/fulfillment/start` with the server-held `OSIRIS_OPERATOR_TOKEN` as a Bearer token. Never put the token in customer code, case notes, or a committed command example.

The JSON command is:

```json
{
  "subject": { "type": "stripe_session_id", "value": "cs_REPLACE_WITH_VERIFIED_SESSION" },
  "idempotency_key": "00000000-0000-4000-8000-000000000001",
  "operator": {
    "actor_id": "REPLACE_WITH_CONFIGURED_OPERATOR_ACTOR_ID",
    "reason": "Reviewed the authorized scope and approved starting this audit."
  }
}
```

Generate a fresh UUID for the first command for a case; the UUID above is illustrative and must not be reused. The actor must exactly match `OSIRIS_OPERATOR_ACTOR_ID`. Retain the original key for retries. The server creates the receipt event UUID and invokes `start_osiris_audit_fulfillment_v1` as `service_role`.

On acceptance the RPC atomically records `operator_reviewed_at`, `fulfillment_started_at`, `fulfillment_status = fulfillment_started`, the event/key, actor, and reason. Retain the returned receipt with the private case record. This transition means audit work is beginning, not merely receipt acknowledgment; it does not launch autonomous audit work.

- `STARTED`: first successful start; HTTP 200 receipt with `idempotent = false`.
- `IDEMPOTENT`: same key and case; HTTP 200 with the original receipt and `idempotent = true`. Changed retry actor/reason/event values do not replace recorded receipt fields.
- `IDEMPOTENCY_CONFLICT`: key belongs to another case; HTTP 409. Investigate the case/key association.
- `NOT_READY`: a prerequisite is missing or the case already advanced; HTTP 409. Review the case without resetting timestamps or authorization to force acceptance.
- `NOT_FOUND`: no matching case; HTTP 404.

For transport uncertainty, retry with the same case and key. Do not invent a new key just because the response was lost. `anon` and `authenticated` cannot execute the RPC.

## 3. Pause

Use `fulfillment_status = paused` when work must stop before delivery.

Do not clear existing review or start timestamps.

To resume:

- if `fulfillment_started_at` is null, return to `intake_complete`
- if `fulfillment_started_at` is present, return to `fulfillment_started`

The Operator should retain the reason for the pause with the case working notes or audit working materials.

## 4. Refund

Customer-facing refund boundary:

- before substantive audit work begins, cancellation or inability to establish authorized access receives a full refund
- a declined engagement receives a full refund
- after substantive work begins, refunds are limited to non-delivery, clear fulfillment failure, or an Operator-approved exception consistent with the published terms and engagement record
- if customer access is revoked after work begins, further review stops immediately and the Operator decides whether completed work should be delivered or whether a proportional or full refund is appropriate under the published terms

Procedure:

1. Verify the purchase, current fulfillment state, and refund basis against the case record and applicable published/engagement terms.
2. If the request occurs before substantive work begins or because authorized access cannot be established, treat the refund as required rather than discretionary.
3. Initiate the refund in Stripe against the matching payment.
4. Wait until Stripe reports the refund in a terminal successful state. If Stripe reports the refund as pending, in progress, or otherwise non-terminal, leave `fulfillment_status` unchanged and retain the pending state in the case notes.
5. Only after terminal success, set `fulfillment_status = refunded` and set `updated_at` to the current time in the same database update.
6. Do not mark a case refunded merely because a refund was requested or created.

Stripe remains the source of truth for the monetary refund itself.

## 5. Deliver

Only after the audit artifact has actually been sent to the customer contact recorded for the purchase:

- set `fulfillment_status = delivered`
- set `delivered_at` to the current time

Do not mark `delivered` for a draft, internal review copy, or planned send.

## 6. Minimum Operator case view

For each case, the Operator must be able to identify:

- who paid: `customer_email`
- what they paid for: `flow`
- payment evidence: `status` and Stripe session linkage
- intake state: `fulfillment_status`, `intake_submitted_at`
- explicit customer authorization: `intake_authorization_confirmed_at`, `intake_channel_authorization_text`
- start receipt: `fulfillment_start_event_id`, `fulfillment_start_idempotency_key`, `fulfillment_started_by`, `fulfillment_start_reason`
- review checkpoint: `operator_reviewed_at`
- work started: `fulfillment_started_at`
- work completed: `delivered_at`

## 7. First-dollar boundary

Manual fulfillment is the default for Osiris Audit v1.

This runbook does not authorize:

- autonomous audit execution
- autonomous customer delivery
- CRM expansion
- public access to private purchase/intake records
- security, legal, compliance, or governance certification claims

A real-money launch remains a separate Operator decision after the first-dollar checklist is reviewed against this procedure and the verified payment-to-intake path.

## 8. Verification and target rollout prerequisites

PR #54 database correction was verified at `4324e558feda1c5bf9846a0795007946b60f22c8`: 75 database assertions passed across repository and observed-ledger fixtures on disposable Supabase PostgreSQL 17.6. The correction rejects NULL flow/status using `IS DISTINCT FROM`. Migration SHA-256: `d3151bfc6f68a176695653803bb221b1d0bba905b31c652b877fa1d3d5983b0e`. The retained proof also covers unchanged failed rows, original receipt replay, role privileges, concurrency, and migration reruns. Application CI at that head passed 53 tests, lint, build, and TypeScript validation. These are dated verification results, not a claim of target deployment.

Before any approved rollout:

1. Verify the intended target and existing `set_guest_audit_purchases_updated_at()` trigger prerequisite. Fresh repository replay now creates this function in `20260618221629_create_guest_audit_purchases.sql` before the hardening migration references it. Previously recorded hosted migration versions are not repaired by editing that historical file; verify the actual target function and migration ledger before any separately approved rollout.
2. Inventory legacy intake_complete rows lacking authorization using read-only access. The 2026-09-06 observation found two paid Osiris cases; refresh this count before acting. Do not infer or backfill authorization.
3. Obtain approval for target database migration and application rollout. Apply `20260906142000_add_osiris_controlled_fulfillment_start.sql` before exposing code that writes its new columns. Verify RPC grants and readiness in the target.
4. Verify required server configuration by presence only: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OSIRIS_OPERATOR_TOKEN`, and `OSIRIS_OPERATOR_ACTOR_ID`. Never print their values.
5. After the separately approved application rollout, perform a bounded smoke check; a real paid-case start remains an explicit Operator action.

Existing intake_complete rows cannot resubmit through the intake_pending-only endpoint. A separate reviewed procedure is needed to collect and persist genuine authorization for those cases; do not reset their state or forge a timestamp.

**Release freeze:** the production Actions workflow is disabled in GitHub, has no push trigger, and its deployment job is unconditionally disabled. `vercel.json` sets `git.deploymentEnabled = false` for commits containing this configuration. Do not re-enable deployment as part of merging. Older branches without this configuration are not covered by the repository Vercel gate; a project-wide Git gate still requires an authenticated settings update. See [deployment gates and release sequence](../operations/DEPLOYMENT_GATES_AND_RELEASE_SEQUENCE.md) for the verified boundary and staged plan.
