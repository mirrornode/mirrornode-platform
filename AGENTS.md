# Agents — mirrornode-platform

## Resident Runtime
No agent runtime is hosted in this repository. This repository is the public-facing platform and integration surface.

## Agent Integrations
| Agent | Primary location | Platform relationship |
|---|---|---|
| Osiris | external/runtime layer | Audit entry and checkout flow |
| Thoth | external/runtime layer | Retrieval integration |
| Hermes | external/runtime layer | Event and coordination layer |
| Merlin | mirrornode-merlin | Planning and orchestration |
| Lucian | evolving | Experimental / evolving surface |

## Constraints
- Platform routes may invoke agent-facing flows only through explicit API boundaries.
- Agents must not bypass platform auth, payment, or webhook controls.
- Vector namespace use must remain explicit and documented.
- Any change to agent capability boundaries must be reflected in MIRRORNODE-CORE-HUB.

## Coding Agent Instructions
See `.github/copilot-instructions.md`.
