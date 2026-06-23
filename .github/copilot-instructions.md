# Copilot Instructions — mirrornode-platform

## What This Repo Is
Next.js 14 App Router frontend and API for MIRRORNODE. TypeScript throughout. Handles document ingestion, Pinecone vector storage, Stripe payments, and Supabase auth.

## Language and Patterns
- TypeScript strict mode. No `any` without explicit justification.
- App Router conventions: server components by default, `'use client'` only where state or browser APIs are needed
- All API routes live under `app/api/` and use `NextResponse.json()`
- Auth is always validated via `getUserFromBearer(req)` from `utils/supabase/server` before any data operation

## Critical Rules
- **Never instantiate Pinecone directly** — always use `getPinecone()` from `lib/pinecone.ts`
- **Never instantiate OpenAI directly for embeddings** — use `embedText()` from `lib/embeddings.ts`
- **Never commit secrets** — all keys via environment variables only
- **Never bypass auth** — every API route that touches user data must call `getUserFromBearer` first

## Naming Conventions
- API routes: kebab-case directories matching the feature (`librarian/ingest`, `stripe/create-checkout`)
- Lib files: camelCase (`pinecone.ts`, `embeddings.ts`)
- Components: PascalCase

## Pinecone Namespaces
Defined in `lib/pinecone.ts` as `NS`. Current: `librarian`, `lucian`, `osiris`, `thoth`. Do not add namespaces inline in route handlers.

## Payment Flows
Stripe checkout is initiated server-side only. Never expose `STRIPE_SECRET_KEY` to client components. The `mode: 'payment'` one-time flow is the current pattern — do not switch to subscriptions without explicit instruction.
