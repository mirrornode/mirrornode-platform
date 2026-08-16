# Public Surface Boundary Implementation

This slice standardizes the MIRRORNODE public exposure vocabulary and applies it to the homepage hero, node map, and inspector.

## Included

- Typed exposure states: Static, Live Preview, Reviewed, Deferred, Internal Only.
- Shared badge, inline notice, and expandable detail treatment.
- Public-safe inspector fields for function, authority, relations, public basis, and one focused action.
- Agent Stack hero language governed by the same source-precedence and reconciliation rules as the inspector.
- Boundary-state regression coverage.

## Public node copy source rule

Public node language is a projection of source-backed MIRRORNODE records, not a parallel authority registry.

When role or authority descriptions differ across records, public copy is reconciled in this order:

1. explicit Operator disposition;
2. ratified or merged CORE-HUB governance and canonical-governance records;
3. current CORE-HUB source/registry reconciliation records;
4. current dedicated implementation manifests for capability evidence only;
5. draft design records;
6. historical runtime snapshots.

A repository manifest, runtime allowlist, UI placement, or technical capability does not by itself establish governance authority. Where current records explicitly leave identity, seat placement, or authority unresolved, the public surface must show that state as unresolved/deferred rather than infer a stronger classification.

### Current copy alignment

- **CORE-HUB** — organization-level governance / canonical-governance record.
- **Theia** — architectural integration, coherence, drift awareness, and cross-lane continuity; integration does not manufacture authority.
- **Thoth** — security and authority-boundary review; review constrains unsafe paths without becoming execution authorization or a certification claim.
- **Merlin** — planning, sequencing, dependency mapping, and orchestration advice; not dispatcher, approval authority, or executor by implication.
- **Osiris** — bounded structural-review/evidence and commercial audit-delivery lane; findings do not authorize autonomous remediation.
- **Librarian** — knowledge-stewardship capability whose exact seat/node placement remains under reconciliation; public presentation must not silently resolve that question.

Primary reconciliation anchors are maintained in `mirrornode/MIRRORNODE-CORE-HUB`, especially `docs/continuity/NAMING_AND_SOURCE_SCOPE_RECONCILIATION_2026-08-13.md` and `docs/continuity/AGENT_REGISTRY_EVIDENCE_SNAPSHOT_2026-08-13.md`, together with applicable reviewed Council positions.

## Excluded

- Runtime controls or operator-console behavior.
- Deployment secret changes.
- GitHub Actions or Vercel workflow refactors.
- Claims that a static public representation is live execution.
- Silent promotion of unresolved node/seat placement through presentation copy.

Production promotion remains gated on preview verification, copy review, and normal repository checks.
