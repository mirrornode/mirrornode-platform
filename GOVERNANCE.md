# Governance — mirrornode-platform

## Decision Authority
Changes to payment flows, auth logic, webhook behavior, Pinecone upsert behavior, audit entry points, or tier pricing require human review before merge.

## Branch Model
- main — production-deployed through Vercel.
- Feature branches use `feat/<scope>-<description>`.
- Fix branches use `fix/<scope>-<description>`.
- Documentation branches use `docs/<scope>`.

## PR Requirements
- TypeScript/build checks must pass before merge.
- Payment, auth, webhook, and data-ingest changes require extra review.
- Commit messages should follow `type(scope): description`.

## Supabase / Vercel Environment Sync
Production, Preview, and Development environment sync are enabled through the Supabase ↔ Vercel integration.

Preview and Development deployments must be treated as production-adjacent unless Supabase branching or separate database credentials are explicitly verified.

Do not assume Preview or Development are isolated from production data without checking the Vercel environment target and Supabase project/branch binding.

## Prohibited Actions
- Do not commit secrets, tokens, API keys, webhook secrets, or database passwords.
- Do not bypass auth on routes that touch user data, payment state, or vector storage.
- Do not change pricing or checkout behavior without checking code and live Stripe configuration.
- Do not add new vector namespaces without updating architecture and agent documentation.

## Documentation Priority
If repository structure, runtime behavior, deployment configuration, or system contracts differ from documentation, the discrepancy must be corrected.

Documentation describes reality; reality does not change to satisfy documentation.
