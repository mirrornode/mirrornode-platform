# OSIRIS commercial-loop receipt bundle

Status: TEMPLATE / NOT EXECUTED. Complete design/expected outcomes for all paths before authorizing a rehearsal. Use [receipt metadata](RECEIPT.md). Test/rehearsal purchase rows never prove live commerce. Agent-work credits do not authorize a purchase or refund.

## Authority and target

Exact implementation SHA / deployed version / target environment:
Operator authorization reference for payment, amount, currency, payer, target, expiry:
Separate refund/reversal authorization, amount, rule, expected downstream state:
Fulfillment/delivery authority and recipient consent/reference:
Expected state transitions, reconciliation owner, retry/idempotency rules, stop conditions:
Access-controlled evidence location (keep sensitive identifiers out of Git/dashboard):

## Positive real-money path

1. Capture redacted session reference before payment; bind actual live/test mode independently.
2. Perform only the authorized purchase; correlate payment event, session, amount/currency, purchase row and case.
3. Verify authorized intake binds to that paid case; record retries/duplicate-event behavior.
4. Verify controlled fulfillment starts once through its existing authorization boundary.
5. Correlate result/artifact with case and payment, capture delivery and recipient receipt. Payment success alone is insufficient.
6. Record actual terminal states, elapsed time, exceptions, and external effects.

Expected / observed / evidence reference / PASS|FAIL|NOT OBSERVED:

## Failed or declined-payment negative path

Use an explicitly approved safe failure method/environment; do not invent a live decline technique. If only test-mode failure can be exercised, label it and preserve the remaining live evidence gap.

Correlate failed/declined session and event with non-case terminal state. Verify no valid paid case, accepted intake, fulfillment, or delivery. Check retries and delayed/duplicate webhook handling; specify the observation window and post-window reconciliation. Do not infer absence from an empty UI alone.

Expected / observed / evidence reference / PASS|FAIL|NOT OBSERVED:

## Controlled refund / reversal path

Bind to the same authorized positive purchase and separate refund authority. Record pre-state, expected rule for already-delivered work, refund amount/currency, redacted refund/event reference, actual payment and case state, and downstream restrictions. Check duplicate/replayed refund events and delayed reconciliation. Stop and escalate on mismatch. Refund is not automatically a dispute/chargeback test; record dispute behavior as untested unless separately authorized and observed.

Expected / observed / evidence reference / PASS|FAIL|NOT OBSERVED:

## Closure

Reconcile all three paths and delivery. Unresolved findings / remediation scope:
Review disposition / Operator acknowledgement / remaining commercial-proof limits:
No marketing, readiness-to-sell claim, credential change, deployment, or unrelated transaction is authorized by this receipt.
