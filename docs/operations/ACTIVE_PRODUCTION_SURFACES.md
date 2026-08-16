# MIRRORNODE Active Production Surfaces

**Status:** Operational reference  
**Last verified:** 2026-08-16  
**Scope:** Public and server-facing production surfaces for the current MIRRORNODE / Osiris Audit commercial path.

This document records working production surfaces. It is an operational inventory, not a governance record and not a source of runtime authority.

## Customer-facing surfaces

| Surface | URL | Current role | Status |
|---|---|---|---|
| MIRRORNODE front door | https://mirrornode.xyz | Primary public site and entry point | ACTIVE |
| Osiris Audit v1 | https://mirrornode.xyz/osiris-audit | Product scope, terms, pricing, audit sequence, and checkout entry | ACTIVE |
| Audit alias | https://mirrornode.xyz/audit | Public short route to the Osiris Audit surface | ACTIVE |
| Osiris post-purchase handoff | `https://mirrornode.xyz/osiris-audit/success?session_id={CHECKOUT_SESSION_ID}` | Verified paid-session intake and MOPCON/Osiris engagement handoff | ACTIVE / SESSION-GATED |

## Checkout boundary

Osiris Audit checkout is **not represented by one permanent `checkout.stripe.com/c/pay/cs_live_...` URL**.

The product page calls the MIRRORNODE server checkout route, which creates a fresh Stripe Checkout Session for the canonical Osiris Audit price and returns the session-specific Stripe-hosted checkout URL.

Operational flow:

`/osiris-audit` → `POST /api/checkout` → fresh Stripe Checkout Session → `/osiris-audit/success?session_id={CHECKOUT_SESSION_ID}`

A specific `cs_live_...` checkout URL is therefore evidence that live Checkout Session creation works, but it is **transaction/session specific and must not be published as the canonical purchase link**.

### Canonical commercial parameters currently enforced

- Product: Osiris Audit v1
- Price: **$149 USD**
- Payment shape: one-time payment
- Checkout mode: `payment`
- Flow metadata: `osiris-audit-v1`
- Canonical Stripe price ID: `price_1SrmFq2KpbDc8r9FNLp0rCfW`
- Quantity: `1`
- Paid intake entitlement requires the canonical price, correct flow metadata, payment mode, and `payment_status=paid`

## Server-facing production surface

| Surface | URL | Current role | Status |
|---|---|---|---|
| Stripe checkout-completion webhook | https://mirrornode.xyz/api/webhook | Receives and verifies Stripe `checkout.session.completed` events and reconciles purchase evidence | ACTIVE / SERVER-TO-SERVER |

The webhook is not a customer navigation target.

## Current post-purchase state model

After a valid paid Checkout Session and completed intake, the customer-facing engagement surface presents:

- Payment: **Confirmed**
- Intake: **Recorded**
- Audit status: **Queued for review**
- Target delivery: **Within 3 business days**

Positioning currently used on the engagement surface:

> Secure access. Distinctive delivery. Uncompromising service.

MIRRORNODE reviews the submitted system context and authorized references. If clarification or additional access is required, contact is made through the email used at checkout. Otherwise, no additional customer action is required until delivery.

## Verification boundary

As of the verification date:

- production front door resolves successfully;
- `/audit` resolves to the Osiris Audit product surface;
- the product page presents the live $149 one-time offer;
- live Stripe Checkout Session creation is wired to the canonical price;
- the Osiris success route fails closed without a valid Checkout Session reference;
- intake entitlement verifies the live paid session and canonical Osiris price;
- the live Stripe webhook endpoint is enabled for checkout completion;
- purchase and intake persistence are wired to `guest_audit_purchases` in Supabase;
- CI, tests, build, Canon Gate, and production Vercel deployment passed on the zero-cost commercial closeout.

The remaining irreducible acceptance test is a real customer payment completing the full production chain:

`card accepted → Stripe completion event → webhook delivery → purchase reconciliation → success redirect → intake submission → fulfillment state`

No owner-funded $149 test purchase is required merely to keep this surface documented or deployable.

## External business-management surfaces

Administrative and discovery systems should be tracked separately from the customer transaction path. Candidate surfaces for the next business-operations pass include:

- Stripe Dashboard — payments, disputes, refunds, receipts, business presentation, and payout operations
- Google Business Profile — only if MIRRORNODE meets Google's current eligibility requirements for a customer-facing or service-area business
- Google Search Console — domain ownership, indexing, sitemap/search visibility, and search diagnostics
- Google Analytics or another intentionally selected analytics surface — only after a privacy/measurement decision
- Business email and domain administration — official customer communication and account recovery boundaries
- Business-directory / professional listings — chosen selectively rather than mass-submitted
- Invitation / referral workflow — a controlled way to send prospects directly to the canonical MIRRORNODE or Osiris Audit surface

These external systems are not automatically authoritative records for MIRRORNODE architecture or governance. Their operational state should be reconciled into internal documentation when activated.
