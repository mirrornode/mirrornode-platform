# Radar extended runtime receipt

Status: TEMPLATE / NOT EXECUTED. Use with [receipt metadata](RECEIPT.md).

- Exact repo/head re-pinned; patch/review receipt and deployment identity recorded separately.
- Runtime target, access restriction, caller identity, budget/rate limit, and explicit provider execution authority observed. Provider request cost is a side effect.
- Credential exists only server-side; inspect client imports/build/network without recording its value. No configuration performed by this template.
- `/api/radar/status`: distinguish credential configured, provider reachable, and successful scan. Record exact safe response shape.
- API result explicitly classifies fixture vs provider result and binds provider/model, scan ID/time, and source references. Provider result is not independently VERIFIED truth.
- Authorized live scan succeeds; non-fixture result renders with matching provenance. Capture redacted request/response/render correlation, not raw sensitive payloads.
- Draft enforcement verified on live parse, persistence, restored records, malformed records; saved is not approved. No social posting/messaging authority or tool path.
- Negative cases: absent key, unauthenticated caller, denied caller, malformed input, rate/budget limit, provider failure/timeout, hostile error payload, malformed result, altered local storage.
- Server errors/logs inspected: no credential or uncontrolled raw payload. Static absence of logging is not hosted-log verification. Include hosting/proxy log scope and NOT OBSERVED areas.
- Inventory every persistence destination. Bind records to DRAFT, fixture/live provenance, scan/receipt identity and retention/deletion rule. Verify browser storage expiry/reset and safe rehydration; inspect server stores if any.
- Confirm no social posts, DMs, follows, automatic outreach, merge, deployment, credential change, or public promotion occurred.

Result per check: PASS / FAIL / NOT OBSERVED / NOT APPLICABLE with reason and evidence reference. Overall disposition stays HOLD with unresolved authority/security constraints. Operator acknowledgement: PENDING.
