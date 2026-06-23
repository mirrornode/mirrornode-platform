# Architecture — mirrornode-platform

## Role
Next.js 14 (App Router) frontend and API layer for the MIRRORNODE system. Handles user-facing flows: authentication, document ingestion via Librarian, Stripe checkout, and the Osiris audit product surface.

## Stack
- **Framework**: Next.js 14 (App Router, TypeScript)
- **Auth**: Supabase Auth (Bearer token, server-side session helpers in `utils/supabase/`)
- **Vector store**: Pinecone (`mirrornode-vault` index, namespaces: `librarian`, `lucian`, `osiris`, `thoth`)
- **Embeddings**: OpenAI `text-embedding-3-small` (1536 dims) via `lib/embeddings.ts`
- **Payments**: Stripe Checkout via `app/api/stripe/`
- **Node version**: 20.x

## Key Surfaces
| Route | Purpose |
|---|---|
| `app/librarian/` | Document upload, triage, and checkout UI |
| `app/api/librarian/ingest/` | Auth → extract → embed → Pinecone upsert |
| `app/api/stripe/create-checkout/` | Stripe session creation |
| `app/api/debug/pinecone/` | Internal Pinecone health check |

## Singletons
- `lib/pinecone.ts` — lazy Pinecone client, do not instantiate elsewhere
- `lib/embeddings.ts` — OpenAI embed wrapper, 8k char truncation guard

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
PINECONE_API_KEY
PINECONE_INDEX_NAME   # default: mirrornode-vault
OPENAI_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

## Dependencies
- Reads/writes to `mirrornode-vault` Pinecone index (shared with mirrornode-py agents)
- Auth state managed by Supabase; no direct dependency on mirrornode-backend at runtime
