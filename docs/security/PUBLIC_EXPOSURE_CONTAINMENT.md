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
source. The Python route now rejects that retired default even if explicitly configured,
using its digest without reproducing the credential. Do not restore cached bytecode.
Review deployed configuration separately; removal from source does not revoke a
credential or prove the cache was never executed. If that default was accepted,
replace it through the deployment's secret-management process and review access.

Publication, required independent review, merge, and deployment remain distinct.
The existing deployment freeze remains in place. Repository corrections alone
are not a claim of production containment. No history rewrite is required by
this patch, and no credential values are reproduced here.

## Local qualification and evidence boundaries

The Operator accepted the October 1, 2026 F2 investigation. On unchanged
version-9 pnpm lockfile bytes, pnpm 8.15.9 failed with a lockfile-processing
error; pinned pnpm 10.17.1 under Node 20.20.2 returned zero reported advisory
counts for default, development-only and production-only audits. This is a
time-specific registry result, not proof of vulnerability absence or deployed
dependency equivalence. The original unversioned audit invocation remains unknown.

Checked-in installation intent is npm: Vercel configuration uses npm install,
CI uses npm install and the deployment workflow uses npm ci. Both lockfiles
remain present and package.json has no packageManager pin. Provider overrides,
actual deployed installer and installed dependency tree remain unverified.
The July dependency disposition is historical and is not a current audit result.

The local F3/F5 candidate adds eight Python standard-library tests covering
missing, empty and retired-key rejection before client creation; non-retired
startup; matching and mismatching bearers; Unicode inputs; and invalid schemes.
Bearer comparisons use hmac.compare_digest with UTF-8 byte operands. This
avoids content-based short circuiting; it is not a timing measurement or a
claim of uniform request timing.

Run with Python 3.14 and the pinned historical Git blob available:

```sh
python -B -m unittest discover -s tests/python -p 'test_*.py' -v
```

The historical bytecode is inspected for constants, never executed. The retired
value is selected by its pinned digest in memory and is not printed or saved.
Tests clear the environment and stub third-party dependencies; they exercise
startup ordering and bearer logic without service calls, not integration or
deployed behavior. The CI candidate uses Python 3.14 and full Git history, with
ci/test depending on ci/rotan-startup and ci/lint. Remote execution of this
unpublished candidate remains unverified.

Historical F3/F5 validation passed all eight final tests and detected six
deliberate regressions on disposable source copies. The F3 application run
passed 52 tests under Node 20.20.2. Consolidated revalidation must record its
own observation time and logs; these historical results are not a fresh run.

F4 credential revocation remains UNKNOWN/open. Its previously accepted
non-blocking Gate 0 sequencing does not clear release. Required independent
review, publication, remote CI, merge, provider verification and deployment
remain separate decisions. Overall release HOLD remains in force.

Consolidated qualification (2026-10-03T06:58:31.612782+00:00): eight Python tests, all six
regression probes, 52 application tests across 11 files, lint, production build,
workflow configuration checks and git diff --check passed locally. Application
checks used Node 20.20.2; Python checks used Python 3.14. Dependency audits
above remain the accepted October 1 observation and were not rerun here.
