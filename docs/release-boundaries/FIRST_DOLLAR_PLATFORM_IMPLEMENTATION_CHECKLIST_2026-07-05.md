# FIRST_DOLLAR_PLATFORM_IMPLEMENTATION_CHECKLIST_2026-07-05

Status: Draft
Source Authority: MIRRORNODE-CORE-HUB PR #24
Execution Repo: mirrornode-platform
Scope: Osiris Audit v1 first-dollar lane
Boundary:
- documentation-only checklist
- no deployment authorization
- no payment launch authorization
- no canon mutation
- no automation expansion

## Purpose

Translate the CORE-HUB first-dollar release boundary into concrete platform implementation checks.

This checklist does not authorize build or launch by itself. It prepares the work package for review.

## Required Platform Checks

- Confirm public Osiris Audit offer route.
- Confirm checkout route and Stripe Checkout creation path.
- Confirm metadata identifies `osiris-audit-v1`.
- Confirm customer email capture or equivalent fulfillment contact.
- Confirm success and cancel routes.
- Confirm webhook receives checkout completion.
- Confirm successful payment creates or preserves fulfillment evidence.
- Confirm operator can identify:
  - who paid
  - what they paid for
  - how to contact them
  - whether fulfillment has started
  - whether fulfillment has completed
- Confirm refund or pause path exists.
- Confirm customer-facing copy avoids canon, legal, security, compliance, or governance certification claims.

## Hard Launch Blockers

- No payment-to-fulfillment record path.
- No customer contact path.
- No way to identify purchased offer.
- No operator review checkpoint.
- No customer-facing boundary language.
- No pause/refund procedure.
- Any public claim implying MIRRORNODE canon approval, legal verification, security clearance, or compliance certification.

## Build May Proceed Only If

- The work stays inside Osiris Audit v1.
- Launch remains unauthorized.
- Manual fulfillment remains the default.
- Deferred risks remain visible.
- No platform file claims canonical authority.

## Platform Files To Inspect Before Code

- `app/audit/page.tsx`
- `app/api/checkout/route.ts`
- `app/api/webhook/route.ts`
- `app/osiris-audit/success/page.tsx`
- any fulfillment, intake, or Supabase helper used by checkout/webhook
- any public copy describing Osiris Audit v1

## Output Expected From Implementation Review

Before code changes, produce:

- current route map
- payment-to-fulfillment state map
- missing hard blockers
- smallest safe implementation patch
- test plan
- launch gate checklist

## Controlled release checks (2026-09-06 addendum)

- [ ] Exact SHA and required independent review, lint, tests, build, Canon Gate and database evidence recorded.
- [ ] Automatic deployment gates verified, including branches without the current configuration.
- [ ] Vercel project, GitHub repository and Supabase target identities match the release manifest.
- [ ] Preview data/credentials isolated from production.
- [ ] Approved migration and its legacy trigger prerequisite verified before application rollout.
- [ ] Required Operator token/actor and other server configuration verified without printing values.
- [ ] Genuine authorization present; legacy cases remain blocked until a separately reviewed procedure records consent.
- [ ] Separate migration, application deployment and case-start approvals retained.
- [ ] Runtime verification, recovery plan and final receipt completed.

These are release acceptance items, not completed checkboxes. See [deployment gates and release sequence](../operations/DEPLOYMENT_GATES_AND_RELEASE_SEQUENCE.md).
