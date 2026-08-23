# Draft 02 — Capability Continuity Invariant v0.1

**Status:** DRAFT / NOT PUBLISHED

A production AI system should not lose a critical business function merely because one model provider, API token, model session, context window, or compute host disappears.

That sounds obvious. Most architectures do not actually guarantee it.

## The invariant

For each critical function, define the acceptance contract outside the model:

- required inputs;
- required outputs;
- allowed tools;
- side-effect boundaries;
- evidence requirements;
- authority ceiling;
- failure behavior;
- acceptance tests.

Then require at least one independently operable execution path under organizational control that can satisfy that contract without depending exclusively on one metered third-party cognition API.

A model becomes eligible for the function because it passes the contract—not because its API is available.

## What this changes

It changes the meaning of “fallback.”

A fallback is not:

> Provider A failed, so send the workload to Provider B and hope the output is good enough.

A governed fallback is:

> Provider A is unavailable. Provider B is already qualified for this function at this acceptance threshold, so the function can be reassigned without changing the authority or evidence contract.

If no eligible substrate remains, the system should report the function unavailable rather than silently lowering the standard.

## What survives a substrate change

Three things matter most:

### Required capability

The business function exists independently of one model prompt or provider-specific API.

### Explicit authority boundaries

Changing the model does not change who may mutate, approve, execute, publish, or deliver.

### Verifiable evidence

The operating record survives outside model memory and can reconstruct what was observed, reviewed, authorized, and done.

## What does not follow from this invariant

The invariant does not mean:

- every model is equivalent;
- local inference is automatically safer;
- open weights are automatically sovereign;
- hosted frontier models should be avoided;
- a multi-model gateway proves continuity;
- a benchmark score grants governance authority.

Use the best eligible substrate for the function.

Keep the control system around it yours.

## MIRRORNODE's current boundary

MIRRORNODE is building toward this architecture. It does not currently claim a production cloud-GPU inference fabric or universal workload portability.

Thea provides an owned deterministic verification kernel with bounded current claims. MOPCON provides a developing control/operations surface. The provider-independent inference path is an architectural target that still requires capability inventories, acceptance suites, benchmarked model eligibility, authenticated transport, and recovery testing.

That limitation is part of the design record, not a footnote to hide.

## Why publish the invariant before the full infrastructure exists?

Because the rule determines what the infrastructure must eventually prove.

Without the invariant, “provider independent” can collapse into a marketing synonym for “we support multiple APIs.”

With it, the question becomes testable:

> If this substrate disappears, which critical functions remain available at the same governed acceptance standard, with the same authority ceiling and reconstructable evidence?

That is the test MIRRORNODE intends to build against.
