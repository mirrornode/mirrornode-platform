# Guest Audit Purchases Schema Reconciliation Tests

These SQL files are fixture-and-assertion tests for the Schema Baseline
Reconciliation PR. They deliberately avoid introducing pgTAP or another new
test dependency.

## Scope

The reconciliation contract is limited to:

- internal relational identity: `id uuid primary key`;
- external Stripe/payment command subject: `stripe_session_id text unique`;
- a legacy upgrade from `stripe_session_id` primary key;
- a no-op path for the already-correct live UUID-primary-key shape;
- preservation of row data and stable UUID identities on rerun;
- preservation of RLS, policy definitions, and table grants.

These tests must not add or validate any fulfillment receipt table, RPC,
operator command endpoint, credential, actor-binding mechanism, release or
delivery authority, or MOPCON mutation surface.

## Disposable database only

Run these tests only against a disposable PostgreSQL or Supabase test
database. The runner requires an explicit `DATABASE_URL`; it has no implicit
default connection. It also requires both an explicit destructive-test
acknowledgement and a marker table carrying the exact guard comment.

The runner refuses a connection string containing the known production project
reference:

```text
zomnswctmwjqnvftiayc
```

This string check is a guardrail, not authorization to use any other shared or
production environment. The operator remains responsible for supplying a
disposable database.

Create the guard only inside the disposable database:

```sql
create table public.mirrornode_schema_reconciliation_disposable_guard (
  singleton boolean primary key default true check (singleton)
);

comment on table public.mirrornode_schema_reconciliation_disposable_guard is
  'MIRRORNODE_DISPOSABLE_SCHEMA_RECONCILIATION_TEST_DATABASE';
```

The runner checks the marker before executing any fixture. The marker and the
explicit acknowledgement are independent safeguards; neither one alone is
sufficient.

## Running

```bash
SCHEMA_RECONCILIATION_TEST_ACK=I_UNDERSTAND_THIS_DROPS_PUBLIC_GUEST_AUDIT_PURCHASES \
DATABASE_URL="$DISPOSABLE_DATABASE_URL" \
  supabase/tests/schema-reconciliation/run.sh
```

`run.sh` resolves the reconciliation migration to an absolute filesystem path
and passes that exact path to every success-path SQL fixture as:

```bash
-v migration_file="$absolute_migration_path"
```

The success-path fixtures include the migration through:

```sql
\i :migration_file
```

They do not depend on the shell working directory or on repository-relative
include resolution.

## Expected-success cases

The runner requires exit status zero for:

1. `001_target_schema_contract.sql`
2. `002_legacy_to_target_upgrade.sql`
3. `003_target_to_target_noop.sql`
4. `005_data_preservation_and_rerun.sql`

Any nonzero exit status stops the runner.

## Expected-failure case

`004_incompatible_state_rejection.sql` is intentionally a **persistent
disposable fixture**. It commits an unsupported table shape so the migration
under test can run in a separate `psql` invocation.

The fixture captures, before the migration attempt:

- the exact primary-key constraint definition;
- the row count;
- the canonical fixture-row payload.

The runner then invokes the reconciliation migration and requires it to fail.
The runner fails if:

- the migration exits with status zero;
- the expected reconciliation-abort message is absent;
- verbose PostgreSQL output does not report the `P0001` SQLSTATE;
- `004_incompatible_state_assert_unchanged.sql` finds any change to the
  primary-key definition, row count, or canonical fixture-row payload.

The post-failure assertion removes its disposable snapshot table after
verification and commits that cleanup in the disposable database.

The runner also constructs a supported legacy table with an inbound foreign
key. It requires the migration to reject that shape with SQLSTATE `P0001`,
then verifies that the parent key, inbound relationship, and fixture rows are
unchanged before cleaning up the fixture.

## Test convention

Fixtures create and replace `public.guest_audit_purchases`. Do not run these
files against production or a shared environment.

The success fixtures operate transactionally and roll back their changes. The
incompatible-state fixture intentionally commits because it spans separate
`psql` invocations; its state exists only for the duration of the disposable
test run.
