# Guest Audit Purchases Schema Baseline

**Status:** Schema reconciliation reference
**Scope:** `public.guest_audit_purchases` identity baseline only
**Non-goals:** Osiris fulfillment receipts, transactional command RPCs, HTTP
command endpoints, command credentials, actor binding, release/delivery
authority, workflow orchestration, and MOPCON mutation

## Purpose

This record establishes the reproducible schema baseline for
`public.guest_audit_purchases`.

The repository contained an older creation migration that represented
`stripe_session_id` as the table primary key. The verified live Supabase
database instead has:

- `id uuid` as the physical primary key;
- `stripe_session_id text` as a unique external identifier.

The live shape is authoritative for the intended relational design. It is not
a production defect to repair.

The reconciliation migration exists to make repository replay and legacy
repository-shaped databases converge to that live shape without changing an
already-correct live target.

## Identity contract

| Field | Contract | Role |
|---|---|---|
| `id` | `uuid`, `not null`, `default gen_random_uuid()`, primary key | Internal immutable relational identity |
| `stripe_session_id` | `text`, `not null`, unique | Authoritative Stripe/payment and bounded-command subject |

The two identifiers must remain distinct.

`id` is the internal key that future relational tables may reference. A future
Osiris receipt table, if separately approved, must use
`purchase_id uuid references public.guest_audit_purchases(id)`.

`stripe_session_id` remains the external Stripe authority key and the subject
of any future bounded fulfillment-start command. A future receipt may store
it as an immutable audit snapshot, but it must not replace `purchase_id` as
the internal relationship.

## Reconciliation behavior

The reconciliation migration recognizes two supported states.

### Target state: no-op

The target state is:

```text
id uuid primary key not null default gen_random_uuid()
stripe_session_id text unique not null
```

When the table already matches that state, the migration takes the target-state
branch without issuing table DML or DDL. It does not change:

- purchase rows;
- RLS enabled state;
- RLS policies;
- grants, including `service_role` grants;
- triggers;
- fulfillment fields or state;
- any public API surface.

This is the required production path.

### Legacy state: upgrade

The supported legacy state is:

```text
stripe_session_id text primary key
```

with no incompatible incoming foreign keys.

The migration:

1. adds/backfills `id uuid`;
2. sets `id` to `not null default gen_random_uuid()`;
3. replaces the legacy Stripe-session primary key with `id` primary key;
4. establishes a unique constraint on `stripe_session_id`.

The primary-key replacement occurs transactionally. The migration fails closed
rather than guessing if the table has an unexpected primary-key shape,
inbound foreign keys, an incompatible non-UUID `id`, missing session IDs, or
duplicate session IDs.

## Replay gates

The Schema Baseline Reconciliation PR may merge only after automated tests
demonstrate:

1. A target-shaped fixture satisfies the exact identity contract.
2. A seeded legacy Stripe-session-primary-key table upgrades to target shape
   without losing rows or changing business/fulfillment values.
3. A target-shaped fixture matching the observed live key shape is a strict
   no-op.
4. The no-op fixture retains identical RLS enablement, policy definitions, and
   table grants, including `service_role`.
5. Unexpected primary-key shapes and legacy inbound foreign keys fail closed
   without changing the rejected fixture.
6. A rerun after upgrade preserves assigned UUID identities.

## Boundary

Passing this baseline PR does not authorize a fulfillment mutation command.
Receipt schema, idempotency behavior, operator identity binding, privileged
database RPCs, command authentication, release/delivery state, and MOPCON
mutations remain separately reviewed work.
