# MIRRORNODE

MIRRORNODE is a governed AI coordination platform and public orientation surface. It organizes how work moves through context, routing, review, governed reference/canon, and delivery without treating presentation or runtime capability as automatic authority.

## Production

- Front door: https://mirrornode.xyz
- Osiris Audit v1: https://mirrornode.xyz/osiris-audit
- Short audit route: https://mirrornode.xyz/audit
- Active production-surface record: [`docs/operations/ACTIVE_PRODUCTION_SURFACES.md`](docs/operations/ACTIVE_PRODUCTION_SURFACES.md)

Osiris Audit v1 is the currently transactable public service: a one-pass structural audit of an AI system, workflow, or automation stack. Current price is **$149 USD, one time**.

Stripe Checkout URLs are generated per Checkout Session. A `checkout.stripe.com/c/pay/cs_live_...` address is therefore transaction/session specific and is not the canonical purchase URL; customers should enter through the Osiris Audit product surface.

## Public system model

The current public presentation uses the sequence:

`Input → Routing → Review → Canon → Output`

The public node map is a selected, source-backed representation. It is **not** a claim of the complete Agent Stack or current runtime registry. Role, status, and authority language must follow current MIRRORNODE governance and reconciliation records rather than older platform copy.

Selected public representations currently include CORE-HUB, Theia, Thoth, Merlin, Osiris, and Librarian. Their inclusion on the site does not manufacture runtime authority, approval authority, or settled registry status.

## Osiris commercial flow

The active production path is:

`mirrornode.xyz/osiris-audit`

→ MIRRORNODE server creates a fresh Stripe Checkout Session

→ Stripe-hosted secure checkout

→ `mirrornode.xyz/osiris-audit/success?session_id={CHECKOUT_SESSION_ID}`

→ paid-session verification and authorized intake

→ MOPCON / Osiris engagement state

→ human-reviewed delivery

The current post-intake customer state presents payment confirmation, recorded intake, queued review status, and a target delivery of within three business days.

## Architecture and implementation

- **Framework:** Next.js 16 App Router
- **UI:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Deployment:** Vercel
- **Payments:** Stripe
- **Purchase / intake persistence:** Supabase

The public platform is intentionally bounded. Technical material and UI wording must not imply unreleased production capability, automatic remediation, or authority that is not established by the appropriate source record.

## Source precedence

For public-copy disputes or ambiguity, follow this order:

1. applicable canonical / governance source record;
2. current reconciliation or reviewed source record;
3. implementation contract or tested behavior;
4. public presentation copy.

Public presentation never resolves an open governance question by itself.

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Documentation

- [`docs/operations/ACTIVE_PRODUCTION_SURFACES.md`](docs/operations/ACTIVE_PRODUCTION_SURFACES.md) — verified production and commercial surfaces
- [`docs/PUBLIC_COPY_SOURCE_PRECEDENCE.md`](docs/PUBLIC_COPY_SOURCE_PRECEDENCE.md) — public-copy/source-precedence boundary, if present on the current branch

## Project

MIRRORNODE platform repository maintained by the MIRRORNODE project.
