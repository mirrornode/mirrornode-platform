# Draft 01 — What Actually Breaks When the Model Changes

**Status:** DRAFT / NOT PUBLISHED

AI teams often describe models as interchangeable. At the API layer, sometimes they are.

The harder question is whether the **system around the model** is interchangeable.

When a production AI workload changes model, provider, credential, context boundary, or infrastructure, the failure is rarely limited to “the answer quality changed.” The surrounding system may have quietly coupled business logic, authorization assumptions, memory, evidence, tool behavior, and operational recovery to one substrate.

That is a different class of risk.

## Five things that can break

### 1. The function was never defined independently of the model

If “what this agent does” exists only as a long system prompt, changing the model can change the function itself.

A portable function needs a specification outside the model: required inputs, required outputs, allowed tools, side-effect boundaries, failure behavior, and acceptance tests.

Otherwise model replacement is not substitution. It is an uncontrolled redesign.

### 2. Authority lives inside cognition

A prompt can tell a model not to do something. That is useful guidance. It is not the same thing as an external authority boundary.

If consequential permissions depend on a model remembering and obeying prose, a model upgrade can change the effective control surface even when the application code does not change.

Critical authority should be explicit, independently enforced, and unable to expand merely because the model became more capable.

### 3. Memory disappears with the session

A model conversation can contain valuable operating context. It is still an ephemeral cognition surface.

If decisions, unresolved findings, approvals, evidence, handoffs, or customer state exist only inside that conversation, continuity belongs to the session rather than the organization.

The durable operating record has to live outside the model.

### 4. “Multi-model” is mistaken for continuity

Routing to several providers can improve reliability. It does not prove that the providers are equivalent for the business function.

A replacement substrate should earn eligibility against the same acceptance contract. If no remaining substrate meets it, the correct state is `UNAVAILABLE`—not a silent quality downgrade disguised as failover.

### 5. The evidence needed to recover is missing

After an incident or forced migration, an operator needs to know:

- what was running;
- what version or target was reviewed;
- what authority existed;
- what changed;
- what was observed versus inferred;
- what remains unknown;
- what can safely resume.

If that evidence cannot be reconstructed, the migration problem becomes an investigation problem at the worst possible moment.

## The architectural distinction

Models supply cognition.

They should not own the definition of the required function, the consequential authority boundary, or the durable operating record.

That separation is what MIRRORNODE calls **Capability Continuity**.

> Models are replaceable. Your capability, authority, and evidence should not be.

Provider independence is not a claim that every model is equivalent. It is the discipline of defining what must survive, proving which substrates are eligible, and refusing to lower the contract silently when one disappears.

## Why this matters now

Recent enterprise research supports the dependency problem without proving any specific MIRRORNODE solution. IBM reported in June 2026 that 71% of 1,000 surveyed senior executives said switching their primary AI vendor or model would be difficult, while 91% did not fully understand their AI dependencies across vendors, models, and infrastructure. BCG has separately described the emerging risk as “cognitive lock-in” and recommended keeping business rules, proprietary context, and decision logic in a governed enterprise layer that remains under organizational control.

The issue is no longer whether enterprises will use multiple models.

It is whether the organization still owns the system when the preferred model changes.

## First measurement

MIRRORNODE's first paid product is Osiris Audit v1, a bounded structural assessment across three dimensions:

- **Control** — where consequential authority actually lives;
- **Continuity** — which required functions are coupled to one substrate;
- **Evidence** — what survives outside model memory.

It does not certify portability, security, compliance, or production readiness. It measures the current system and preserves unsupported conclusions as unknowns.

That is intentionally the first product.

Before selling a control architecture, measure what the customer actually has.
