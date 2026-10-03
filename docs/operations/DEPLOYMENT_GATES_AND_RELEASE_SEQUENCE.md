# Deployment gates and release sequence

Status: platform release freeze implemented in this change; controlled release design remains a draft. Observations dated 2026-09-06. Scope: `mirrornode/mirrornode-platform` and its Vercel/Supabase release boundary. The wider project map below is an inventory, not a claim that all projects are governed or deployment-ready.

## Decisions remain separate

Proposal → code review → merge approval → merge → database release approval → verified migration → application release approval → deployment → runtime acceptance → individual case start.

A green build, merge permission, agent manifest, or public page never supplies the later approvals. The Operator remains the decision-maker. Sensitive operations need the applicable governance evaluation and attributable receipt. This document does not change CORE-HUB policy, agent capability, MOPCON scope, payment authority, or UUID reconciliation.

## Historical bootstrap correction: bounded CLI evidence

Local disposable observation, 2026-10-02: Supabase Go CLI 2.102.0 from the
installed package was invoked with an explicit loopback database URL. A synthetic
migration was applied, its SQL bytes were changed under the same version, and
`migration up` was invoked again. Both calls exited 0; the second applied nothing.
The stored row and recorded migration statements retained the original content.
This establishes version-based skip behavior for this command/version and probe,
not checksum validation or a hosted deployment receipt. The CLI wrapper's
telemetry write was blocked; the underlying Go binary completed the probe.
The local probe used debug mode because this CLI forces TLS on explicit URLs
otherwise; its trace contains only disposable schema and synthetic data.

Consequently, editing the historical guest-table creation migration repairs new
repository replays; it does not retrofit an already-applied target. Do not reset,
repair history, or force replay of old migrations to distribute this change.
Before any separately authorized database release, verify the target's existing
function/trigger definition and migration history read-only. If the prerequisite
is missing or incompatible on an already-applied target, stop and prepare a
separately reviewed forward migration. Existing-object preservation guarantees
that bootstrap does not replace the named objects; it does not certify their
security properties, timing or behavior. Full service-stack and hosted migration
handling remain outside this local probe.

Reference: [Supabase database migration workflow](https://supabase.com/docs/guides/deployment/database-migrations).

## Implemented containment

| Path | Gate | Verification / limit |
|---|---|---|
| GitHub production workflow | Workflow ID `285764863` disabled through GitHub | State read back as `disabled_manually` |
| Push to main → Actions deploy | `deploy.yml` has no push trigger | Only manual dispatch remains |
| Manual dispatch / accidental workflow re-enable | Deployment job has literal `if: ${{ false }}` | No job can deploy until a reviewed source change removes the freeze |
| Git event → Vercel for gated commits | `vercel.json`: `git.deploymentEnabled: false` | Applies to every branch whose commit contains this configuration; verify no deployment after the gated push and merge |
| Existing deployed application | No alias, deployment, or database mutation | Preserve current production while code changes are reviewed |

The project-level Vercel Git setting was observed as `createDeployments = enabled`. Its update could not be completed because the CLI login expired and the available browser was not authenticated. **Older branches without the configuration remain outside the repository Vercel gate.** Do not claim a team-wide freeze. Complete the authenticated project-wide gate before other branch activity or reactivating any release path.

No Vercel deploy hooks were configured for the platform at observation. The GitHub repository hook listing was empty; app integrations such as Vercel are separate from that listing. Direct CLI/API credentials and undiscovered external jobs are not revoked by this freeze. Inventory and control them before declaring universal deployment containment.

The CLI login refresh write was not permitted. Opening another browser was rejected by automatic approval review due to unrelated-content exposure. Neither boundary was bypassed.

## Verified platform wiring

| Connection | Evidence | State |
|---|---|---|
| GitHub → Vercel | Vercel project `prj_me6Jqod7ceuaBKoacmAxThKpyyCI`, team `team_TTy8bODIwk1poZ3MUVVEDsea`, repo ID `1159698708`, `mirrornode/mirrornode-platform`, production branch `main` | Linked; automatic path constrained as above |
| GitHub Actions → Vercel | Production environment holds secret names `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VERCEL_TOKEN` | Names present; secret values and token permissions not exposed or independently validated |
| Production environment approval | GitHub Production environment had no protection rules | Missing approval gate; disabled workflow is the current containment |
| GitHub merge controls | Active ruleset requires one approval, latest-push approval, stale-review dismissal, resolved threads, linear history and squash; no bypass actors | Independent approval required; user merge authorization does not satisfy this provider rule |
| Required CI | Classic main protection requires Contract Compliance Check, ci/lint, ci/test; strict/up-to-date; admins enforced | ci/build passes but was not required by that policy at observation; add in a reviewed gate update |
| Vercel → Supabase | Vercel metadata includes SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY entries targeting both preview and production; deploy workflow names public target `zomnswctmwjqnvftiayc` | Runtime host/key matching not verified; environment isolation is not established |
| Osiris Operator configuration | Project environment metadata had no OSIRIS_OPERATOR_TOKEN or OSIRIS_OPERATOR_ACTOR_ID | Missing in observed project metadata; shared environment sources were not audited |
| Supabase target | Mirrornode OS `zomnswctmwjqnvftiayc`, PostgreSQL 17.6 | Reachable read-only; legacy trigger present |
| Target migration readiness | New RPC and authorization column absent; migration absent from hosted history | Not ready for the new application code |
| GitHub → Supabase migration automation | No migration deployment job in platform workflows; Supabase branch listing showed default main with empty git_branch | No automatic migration path proven; dashboard integration settings remain to be checked |
| Legacy case readiness | Two Osiris intake_complete cases lack authorization | Intentionally blocked; no consent backfill |

The environment inventory is metadata-only from the successful project read. Sensitive values were neither printed nor used to infer runtime access. Refresh metadata after authentication is restored. Sharing a single environment entry across preview and production does not establish that preview is safe for test writes.

Hosted migration history contains timestamps/names differing from repository history. Do not run an indiscriminate `db push`, reset, repair, or schema reconciliation. Review the exact target delta; preserve the existing legacy trigger prerequisite and unrelated schemas.

## Controlled-release plan

### 1. Complete identity and trigger inventory

Record repository ID, production branch, Vercel team/project ID, production aliases, Supabase project/branch, data classification, accountable Operator and backup contact for each row in the project map. Inventory GitHub workflows (push, pull_request, workflow_run, schedules, dispatch), reusable workflows, Vercel Git automation/deploy hooks, dashboard redeploys, CLI/API tokens, third-party automations, and Supabase Git/branch integrations. Mark unknowns explicitly. Obtain an authenticated Vercel session and disable Git-created deployments at project level; verify the read-back. Apply equivalent gates to other projects only within an approved project scope.

### 2. Make configuration changes reviewable

Keep repository Git deployments off. Add CODEOWNERS/required review for `.github/workflows/**`, `vercel.json`, `supabase/**`, release policy and env accessors with actual designated reviewers, not invented identities. Require build and database integration evidence alongside current lint/tests/Canon Gate. Use pinned tool/action versions where practical. Do not weaken existing review requirements to finish a merge. Keep an Operator-visible gate-change receipt and a restoration plan.

### 3. Separate environments and credentials

Verify runtime URLs by host identity and keys by scoped metadata without exposing them. Development/preview must use an isolated disposable or sanctioned test Supabase target, test payment configuration and no production service-role key. Bind production credentials only to a protected production release job. Add the Operator token/actor through the approved secret-management process. Do not copy production rows into preview or silently reuse the production key. Define rotation, revocation and least-privilege ownership for CLI/API credentials.

### 4. Replace the frozen job with an explicit release workflow

Use manual dispatch with a full reviewed commit SHA and an Operator approval receipt reference. Validate the SHA is reachable from protected main, has the required checks and reviews, and matches the reviewed release manifest. An arbitrary input string is not proof of approval: resolve and validate the receipt before obtaining production credentials. Configure a production environment approval gate and branch restrictions where supported. For a single-Operator account or provider plan lacking native protection, design a verifiable external approval control; do not pretend a checkbox or comment is equivalent to enforcement.

### 5. Release the database first under separate approval

Build a target-specific migration manifest: file hash, expected preconditions, target identity, legacy trigger/schema facts, grants, affected rows and rollback/forward-recovery strategy. Verify backup/recovery readiness. Apply only the approved migration to the approved target; run read-only verification and approved non-customer probes. Record target, migration hash/version, actor, time, outcome and receipt hash. A migration failure blocks application deployment. Never recreate consent timestamps to pass a readiness test.

### 6. Build, approve and deploy the application

Validate the database receipt against the application manifest. Build once from the reviewed SHA using pinned tooling and the correct target configuration; never promote a preview artifact containing the wrong backend or payment settings. Record artifact identity and Vercel project/target. Require application release approval separately from merge and migration approval. Deploy or promote only the approved artifact to the approved aliases, then capture the returned deployment ID and resolved commit. Keep the automatic Git path off so it cannot race the controlled path.

### 7. Runtime verification, recovery and closure

Verify public routing and health with read-only requests; verify unauthorized/malformed controlled-start requests cannot advance state. A paid-case STARTED probe is a separate Operator action, not a deployment smoke test. Check webhook/configuration status without sending live payments or customer messages. Define stop conditions, rollback alias/artifact, database forward-recovery path, and owner intervention. Retain secrets-free evidence of before/after production deployment identity and database readiness. Do not enable autonomous fulfillment or delivery.

### 8. Drift and bypass audit

Before every release re-read workflow state, source hashes, branch protection, Vercel Git/deploy-hook settings, approved target identities, environment scopes, and pending runs. Alert or stop on drift. Keep `queued`, `running`, `waiting_for_governance`, `waiting_for_operator`, `completed`, `failed`, `cancelled` lifecycle states observable. Suggested events: release.proposed, gate.checked, governance.requested, approval.recorded, merge.completed, migration.verified, deployment.completed, runtime.verified, release.failed. This is a proposed release telemetry contract, not an assertion of a deployed agent runtime.

## Release evidence contract (draft)

Record at least: release ID; repository ID; base and full head SHA; approved scope and non-goals; requirement/source references; required checks with run IDs; reviewer decision; Operator approval reference; target Vercel and Supabase identities; migration and artifact hashes; environment metadata validation; before/after deployment IDs; timestamps; actor; outcome; exceptions; recovery disposition. Never include tokens, secrets, customer intake content or inferred approvals. Each boundary must fail closed when evidence is missing or mismatched.

## Wider Vercel project inventory

Read-only inventory of the inphase team. Only the platform gates are implemented here. The Supabase mapping, requirements and release status of every other row remain unverified; they require an individual wiring record before rollout.

| GitHub repository | Vercel projects observed |
|---|---|
| mirrornode/mirrornode-platform | mirrornode-platform |
| mirrornode/mirrornode | oracle, mirrornode-oracle, branchofio, mirrornode, templeofio |
| mirrornode/theia-core | theia-core |
| mirrornode/mirrornode-parallax | public |
| mirrornode/mirrornode-py | mirrornode-backend, mirrornode-py |
| mirrornode/osiris | osiris |
| mirrornode/osiris-ui | osiris-ui, osiris-ui-gl6f, osiris-ui-agent |
| mirrornode/rotan-resonance | rotan-resonance, rotan-resonance-zx1o |
| mirrornode/vite-react | vite-react, spiral-app-react |
| mirrornode/biometric-integrated-meditative-RPG | biometric-integrated-meditative-rpg |
| mirrornode/Rotan-neural-modality-kids-game | rotan-neural-modality-kids-game |
| mirrornode/Fusion-Energy-Display-Web-Component---Grok_files | fusion-energy-display-web-component-grok-files |
| mirrornode/flags-sdk-hypertune-nextjs | flags-sdk-hypertune-nextjs |
| No Git link returned | mirrornode-homepage, osiris-pay, mirrornode-hub |

Multiple projects attached to the same repo are separate release targets. Inventory which are active, historical, preview-only or retired; do not delete or relink based on names. Mirrornode OS and mirrornode-schema-reconciliation-replay are separate Supabase projects; the latter is not automatically an approved preview target.

## Document review disposition

| Document / source | Action in this change |
|---|---|
| README.md | Link this release boundary; separate code availability from production state |
| Operator fulfillment runbook | Correct atomic start sequence, add consent and receipt handling, replace obsolete merge/deploy coupling statement |
| ACTIVE_PRODUCTION_SURFACES.md | Preserve dated production facts; add separate release-freeze note without marking new code deployed |
| FIRST_DOLLAR_PLATFORM_IMPLEMENTATION_CHECKLIST_2026-07-05.md | Correct outdated route paths and add migration, environment and release gates |
| PUBLIC_SURFACE_BOUNDARY_IMPLEMENTATION.md | Link release gate; keep original public-copy scope exclusions historical |
| SYSTEM_CONTRACT.md, REPO_MAP.md, AGENTS.md, AGENTS_TODO.md | Read as governing context; no policy or agent authority mutation |
| Structural review standard, runtime audit studio schema, dependency disposition | Inventory as adjacent product/security references; not deployment approval sources; broader reconciliation remains a later review |
| Retained PR #54 proof / final review | Keep immutable dated evidence; new code head must retain the tested migration hash |
| Workflow and Vercel config | Enforce the current release freeze, not merely describe it |

Official configuration references: [Vercel Git deployment controls](https://vercel.com/docs/project-configuration/git-configuration), [GitHub deployment environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments). Provider capabilities and plan restrictions must be checked before implementing the future approval design.
