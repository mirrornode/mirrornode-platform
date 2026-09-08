# Osiris Audit v1 — Sales One-Pager

**Status:** DRAFT / NOT PUBLISHED  
**Pilot price:** $149 USD  
**Target delivery:** 3 business days after payment and complete intake

## One sentence

**Osiris Audit v1 measures where your AI system depends on one substrate, where consequential authority has blurred into the model layer, and whether the evidence needed to recover or change course actually survives.**

## The problem

A model change is not just a model problem.

When an AI system becomes part of a real business process, the surrounding architecture can quietly bind critical behavior to one provider, API, prompt, context window, credential, or machine.

That can create three structural risks:

- **Control risk** — consequential permissions are implicit, prompt-level, or difficult to attribute;
- **Continuity risk** — required functions stop or silently change when the preferred substrate changes;
- **Evidence risk** — decisions and operating history disappear with model memory or cannot be reconstructed later.

## What Osiris examines

### Control

- who/what can inspect, propose, mutate, approve, execute, publish, or deliver;
- whether consequential authority is explicit;
- whether authority can expand without an independent gate;
- whether model replacement changes the effective authority boundary.

### Continuity

- single-provider/model/token/session/machine dependencies;
- functions encoded primarily in provider-specific behavior or prompts;
- whether critical functions are specified independently enough to move;
- whether replacement eligibility is tested or assumed.

### Evidence

- exact targets and reviewed artifacts where applicable;
- durable records of review/approval/action;
- separation of observed fact, interpretation, and unknowns;
- whether the system can reconstruct what happened after a session or provider disappears.

## Deliverable

One structured, human-reviewed document containing:

1. **System & Dependency Map**
2. **Substrate Exposure Findings**
3. **Authority Boundary Findings**
4. **Evidence Continuity Gaps**
5. **Prioritized Remediation Path**
6. **Unknowns & Scope Limits**

Scope: up to five primary authorized artifacts or links, plus one clarification pass for factual issues or missed original-intake context.

## Best fit

- production or revenue-adjacent AI workflows;
- multi-model or agent systems;
- teams preparing for a provider/model change;
- builders who cannot clearly answer what stops working if one AI dependency disappears;
- security/platform/governance teams that suspect important controls live inside prompt/model behavior;
- consultants and integrators who want a structural baseline before prescribing more tooling.

## What it is not

Osiris Audit v1 is not:

- penetration testing;
- a compliance certification;
- legal/regulatory advice;
- exhaustive source-code review;
- model-quality benchmarking;
- remediation;
- a guarantee of provider portability, security, safety, or production readiness.

## Evidence discipline

The report should distinguish:

- **Observed** — supported by reviewed evidence;
- **Inferred** — reasoned interpretation from that evidence;
- **Unknown** — not established within the supplied scope.

No numeric “substrate dependence score” is offered until a validated scoring method exists.

## Why MIRRORNODE

MIRRORNODE is building toward **Capability Continuity**: critical AI functions whose required capability, explicit authority boundary, and verifiable evidence can survive substrate replacement.

Provider independence is an architecture target, not a claim that every model is equivalent today.

The audit is the first product because measurement should come before infrastructure prescription.

## CTA

**Measure your exposure — Osiris Audit v1, $149.**
