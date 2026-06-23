# Copilot Instructions — mirrornode-platform

## Stack Context
This is a Next.js App Router project written in TypeScript. It hosts the public MIRRORNODE platform surface, including audit entry points, checkout flows, ingestion routes, and operational UI.

## Critical Rules
- Inspect implementation before assuming documentation is current.
- Do not commit secrets or log secret values.
- Keep payment logic isolated to approved checkout and webhook routes.
- Keep auth checks explicit on routes that touch user data, payment state, or vector storage.
- Use named vector namespaces. Do not write to a default namespace.
- Read environment variables inside runtime paths where appropriate; avoid build-time secret assumptions.

## Patterns to Follow
- Route shape: authenticate or validate → validate input → execute business logic → return structured JSON/response.
- Log errors with route context, but never log credentials or full tokens.
- Keep pricing and tier logic centralized and documented.
- Treat Preview and Development environments as production-adjacent unless isolation is verified.

## Patterns to Avoid
- Do not suppress build or lint failures with `|| true`.
- Do not add payment code outside approved payment surfaces.
- Do not add vector namespaces without documentation updates.
- Do not assume Supabase preview/dev environments are isolated from production data.

## Commit Convention
type(scope): description

Examples:
- docs(platform): add architecture guidance
- fix(checkout): validate audit checkout metadata
- chore(env): document Supabase Vercel sync behavior
