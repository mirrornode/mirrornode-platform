# Architecture — mirrornode-platform

## Role
Primary public-facing platform surface for MIRRORNODE. Hosts user flows, audit entry, payment workflows, document ingestion, and operational interfaces. Acts as the integration boundary between human operators and backend agent systems.

## Stack
- Framework: Next.js App Router, TypeScript
- Auth: Supabase Auth
- Payments: Stripe Checkout
- Primary vector store: Pinecone (current implementation)
- Embeddings: OpenAI text-embedding-3-small
- Runtime: Vercel — production deployment target verified

## Key Surfaces
| Route | Purpose |
|---|---|
| app/audit/ | Public Osiris Audit entry point |
| app/success/ | Checkout success landing path |
| app/librarian/ | Document upload and triage flow |
| app/api/checkout/ | Audit checkout session creation |
| app/api/stripe/webhook/ | Stripe webhook fulfillment path |
| app/api/librarian/ingest/ | Document ingest pipeline |
| app/api/debug/pinecone/ | Pinecone debug endpoint |

## Vector Namespaces
- librarian
- lucian — experimental / evolving
- osiris
- thoth

## Triage Tiers
Triage tiers are documented as current implementation notes. Any change to pricing, tier thresholds, or checkout behavior must be checked against both application code and live Stripe product configuration before merge.

## Dependencies
- Supabase — auth and environment integration
- Stripe — checkout and webhook fulfillment
- Pinecone — vector storage
- OpenAI — embeddings
- Vercel — deployment target
- MIRRORNODE-CORE-HUB — governance and canonical source mapping
