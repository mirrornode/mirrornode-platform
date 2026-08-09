# Osiris Audit v1 — Operator Fulfillment Runbook

Status: First-dollar manual procedure
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
- submitted artifact links, when provided by the customer, are recorded
- submitted scope fits Osiris Audit v1
- no secrets, private keys, passwords, or production credentials are required

If scope is acceptable, set `operator_reviewed_at` to the current time.

Do not begin fulfillment without this checkpoint.

## 2. Begin fulfillment

Only after `operator_reviewed_at` is present:

- set `fulfillment_status = fulfillment_started`
- set `fulfillment_started_at` to the current time

This transition means audit work has actually begun. Do not use it merely to acknowledge receipt.

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
