# Agents — mirrornode-platform

## Agents Resident in This Repo
This repository does not host autonomous agents. It is the human-facing frontend and API surface layer.

## Agent Integrations (Inbound)
| Agent | Namespace | Interaction |
|---|---|---|
| Librarian | `librarian` | Documents are embedded and upserted here via `/api/librarian/ingest` |
| Thoth | `thoth` | Semantic retrieval queries via `queryVault()` in `lib/pinecone.ts` |
| Osiris | `osiris` | Audit results surface through this platform after payment unlock |
| Lucian | `lucian` | Reserved namespace in `lib/pinecone.ts` |

## Constraints
- This repo does not call mirrornode-py or mirrornode-backend directly at runtime
- All agent namespaces are defined in `lib/pinecone.ts` — do not add namespaces outside that file
- Payment state (paid/vaulted) is metadata on Pinecone records; agents must respect this gate

## Adding a New Agent Integration
1. Add namespace constant to `NS` in `lib/pinecone.ts`
2. Document the agent and its interaction pattern in this file
3. Do not expose internal agent endpoints through public-facing routes without auth guard
