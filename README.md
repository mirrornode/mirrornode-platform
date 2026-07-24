# MIRRORNODE

> Public projection and interaction surface for the MIRRORNODE orchestration system.

## Architecture

`mirrornode-platform` is the public-facing Next.js application for MIRRORNODE.

It is not the canonical governance surface and it is not the authoritative agent runtime.

Current authority boundaries:

- `MIRRORNODE-CORE-HUB` — governance, canon, schemas, promotion records
- `mirrornode-agent-runtime` — controlled agent execution and approval-gated runtime
- `mirrornode-operator-console` — private Operator control surface
- `mirrornode-platform` — public projection, service pages, and approved runtime-facing interfaces

## Current Runtime Agents

The current headless runtime allowlists eight agents:

| Agent | Runtime role |
|---|---|
| Hermes | Coordination and messaging |
| Lucian | Orchestration |
| Merlin | Planning / orchestration |
| Oracle | Analysis / advisory |
| Osiris | Audit |
| Ptah | Implementation |
| Theia | Integration / interface |
| Thoth | Security / knowledge review |

Runtime truth should be verified against `mirrornode-agent-runtime` rather than inferred from this README.

## Stack

- **Framework:** Next.js 16
- **Runtime UI:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Commerce:** Stripe
- **Data services:** Supabase

## Current Public Surfaces

The repository includes public and runtime-facing routes such as:

- `/`
- `/osiris-audit`
- `/little-fox`
- runtime proxy/API surfaces

Route availability should be verified from the current application source and production deployment rather than treated as fixed by this document.

## Local Development

```bash
npm install
npm run dev

##Governance Boundary

This repository may expose approved public projections of MIRRORNODE state.

It must not independently redefine canonical governance, Operator authority, runtime policy, or private continuity records.

See ' MIRRORNODE-CORE-HUB' for ratified governance and promotion records.

MIRRORNODE — public projection surface
