# Operator Docket v0.1

Imported from the existing docket unit for the HUD integration. See [HUD integration provenance and validation](HUD_INTEGRATION.md). Historical receipts retain their original scopes; the frozen workspace card refers to checkpoint `b7540b5`, not the current integrating branch head.

1. Open `/dashboard` and reload before making a decision; freshness is evaluated per request.
2. Open one of exactly three docket panels. Read its evidence scope and observation time.
3. Read the corresponding file under `docs/operator/dockets/`. Paths shown in the UI are repository paths, not deployed document endpoints.
4. Record AUTHORIZE, HOLD, or NEED_MORE_EVIDENCE using [bounded disposition](templates/BOUNDED_DISPOSITION.md). Opening a card does not record a decision.
5. Perform only an explicitly authorized action, in its existing authenticated execution surface.
6. Capture a [receipt](templates/RECEIPT.md), including negative observations and exact implementation identity.
7. Return for review and separate Operator acknowledgement. Preserve previous receipts.

## Model and boundaries

Attention (`READY_FOR_DECISION`, `NEEDS_EVIDENCE`, `HOLD`) and placement (`ACTIVE`, `PARKED`, `REFERENCE`) are separate axes. READY_FOR_DECISION means only that a stated decision can be considered; it is never general READY, permission, or commercial proof.

The dashboard is public presentation code, not an authority store. Do not put secrets, customer identifiers, private runtime logs, or payment identifiers in its static data or these committed example documents. Store sensitive evidence in an access-controlled location and reference it with a redacted handle.

Curation source, receipt reference, observation time, and Operator acknowledgement are distinct. `null` is UNKNOWN/PENDING, never implicit acknowledgement. An acknowledgement requires both a timestamp and a record reference. Acknowledgement is not authorization. Authorization separately binds actor, exact action, target, amount if applicable, constraints, and expiry.

Selection and order are part of the reviewed diff in `lib/operator-docket/dockets.ts`. Codex curated this initial order from the Operator's explicit three-lane brief: OSIRIS commercial evidence, Radar bounded inspection, workspace reference. THEIA has no runtime writer here. Future selection, ordering, status, and evidence edits must identify curator, reason, prior/new receipt, and review disposition; use the templates. No automatic promotion or autonomous reordering exists.

## Stale and superseded evidence

Initial inspection receipts use a conservative 24-hour *presentation review interval*, not a claim that runtime stays valid for a day. Immutable source findings remain historical evidence after that interval. Revalidate any current-state claim before action even inside the interval.

- Missing/unparseable/future observation, missing/invalid review deadline, missing receipt, or mismatched card/receipt timestamp => MISSING and NEEDS_EVIDENCE.
- At or after `reviewBy` => STALE and NEEDS_EVIDENCE.
- A non-null `supersededBy` => SUPERSEDED and NEEDS_EVIDENCE. Follow the reference manually; do not inherit a successor's approval.
- HOLD remains HOLD for every evidence state. Placement never implies readiness.
- Preserve old evidence; add a successor and explicitly bind the card to it after review. Reset acknowledgement when evidence or decision scope changes. Clock validation does not detect remote head changes: discovering a changed head, deployment, configuration, or contradictory observation invalidates current readiness immediately; mark superseded and re-pin before proceeding.
- An already-open page does not refresh itself. Reload and check authoritative records before considering a decision. No authority derives from this page.

## Current documents

- [OSIRIS Audit](dockets/OSIRIS_AUDIT.md)
- [Prospect Radar](dockets/PROSPECT_RADAR.md)
- [Operator Workspace](dockets/OPERATOR_WORKSPACE.md)
- [Team sync packet](TEAM_SYNC.md)
- [Receipt template](templates/RECEIPT.md)
- [Bounded review/disposition](templates/BOUNDED_DISPOSITION.md)
- [Team handoff](templates/TEAM_HANDOFF.md)
- [OSIRIS positive/negative/reversal receipts](templates/OSIRIS_PATHS.md)
- [Radar runtime receipt](templates/RADAR_RUNTIME.md)

No new service, database, agent runtime, authority endpoint, or workflow engine was introduced. Existing workspace navigation remains available.
