# Public exposure containment

The platform integration routes `POST /api/agent` and `POST /api/event` return
503 without reading, logging, or forwarding caller payloads. The public Osiris
page retains read-only refresh and no longer offers event submission.

This is temporary containment of integrations without a defined caller
authorization contract. A Supabase session alone must not imply permission to
invoke agents or submit operator events. This change does not grant agent
capabilities, change CORE-HUB policy, or enable fulfillment.

Before re-enabling either route, review the caller identity, permitted operations,
server-side authorization, upstream authentication, payload/logging limits, and
negative authorization tests. Reflect any new capability contract in CORE-HUB.
Keep upstream error bodies private; return a bounded public error response.

Python caches are removed from the tracked tree and ignored. One stale cache
contained a development authentication fallback absent from the fail-closed
source. Do not restore cached bytecode or accept a published development default.
Review deployed configuration separately; removal from source does not revoke a
credential or prove the cache was never executed. If that default was accepted,
replace it through the deployment's secret-management process and review access.

Publication, required independent review, merge, and deployment remain distinct.
The existing deployment freeze remains in place. Repository corrections alone
are not a claim of production containment. No history rewrite is required by
this patch, and no credential values are reproduced here.
