# Governance — mirrornode-platform

## Decision Authority
All production changes require human review and approval. No agent or automated process may merge to `main` without an approved PR.

## Branch Strategy
- `main` — production-deployed via Vercel. Protected.
- Feature branches: `feat/<scope>-<description>`
- Fix branches: `fix/<scope>-<description>`

## Release Flow
1. Open PR against `main` with passing lint and build
2. Human review required (no self-merge)
3. Merge triggers Vercel production deployment automatically
4. Stripe webhook secrets and Supabase keys are managed in Vercel environment — do not commit secrets

## Audit Gate
Before any PR touching payment or auth flows (`app/api/stripe/`, `utils/supabase/`, `app/api/librarian/`), the following must pass:
- `next build` clean (zero type errors)
- Manual smoke test of ingest → checkout flow in preview environment

## Supabase Branching
- Preview deployments inherit production Supabase credentials unless Supabase branching is explicitly configured
- Do not run destructive migrations against preview without confirmation

## Dependency Updates
- Pinecone SDK and OpenAI SDK updates require re-validation of `lib/pinecone.ts` and `lib/embeddings.ts` singletons
- Next.js major version upgrades require full build + Vercel preview validation before merging
