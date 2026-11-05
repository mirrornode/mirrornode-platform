# Operation Clear Path — review gate recovery proposal

**Status:** STAGED / UNAPPLIED. **Date:** 2026-11-05.
**No ruleset modification, merge, release, or THOTH/PTAH verdict is implied.**

## Verified failure

The owner \`mirrornode\` is a personal GitHub User account. Main-branch rulesets for platform (\`21815948\`) and workspace (\`21815959\`) require one approving review and have no bypass actors. Existing PRs examined are authored by that same account, which cannot approve itself. Copilot/Codex COMMENTED reviews do not qualify. The platform ruleset currently does not require the CI checks that run. The workspace ruleset also sets \`require_last_push_approval: true\`. Thus the documented approval route is unavailable while checks are advisory.

## Sequence — do not blindly replace existing rules

1. Read the **live full** ruleset(s), applicable branch policies, and PR gate conditions immediately before changes. Back up the unmodified JSON for rollback and compare exact settings. Preserve other rules.
2. **Workspace pilot first.** Operator changes only \`required_approving_review_count\` from 1 to 0 and \`require_last_push_approval\` from true to false in ruleset \`21815959\`, retaining PR requirement, resolved threads, squash-only, linear history, deletion/force-push protection. Inspect workspace PR #5, confirm internal-content and no-publication claims, check actual GitHub merge box, and merge only upon a specific Operator disposition. Record merge SHA and outcome. This does **not** establish independent review.
3. **Platform bootstrap.** Stage workflow \`.github/workflows/tier-gate.yml\` in a protected PR. On an authorized, tightly controlled bootstrap window, remove the impossible approval requirement while retaining all other main protections. Do not merge unrelated Tier C work during bootstrap. Merge only the independently examined gate setup PR after present checks and Operator clearance.
4. **Verify before enforcing.** Test a benign docs PR and a protected-path PR, checking fresh head, current labels, authenticated owner receipt, stale receipt, re-label, new push, and actual merge-box status-check recognition. Verify the check is associated with the PR **at the SHA GitHub requires** and that it can fire after label changes. Only after successful observations add the correctly named CI/check contexts and \`tier-gate\` to required status checks. Never require a context that has not actually reported.
5. **Rollback.** Preserve original effective ruleset in a secure administrative location. A rollback to the impossible one-approval rule will intentionally reblock work; use only as an emergency fail-closed hold while resolving independent review. The plan must document the disruption rather than call that rollback an operating solution.

## Interim Tier C gate

\`.github/workflows/tier-gate.yml\` operates read-only on **trusted default-branch workflow source**, with \`pull_request_target\`, without checkout or execution of PR code. It treats all PR metadata as untrusted data. The risk path list is **conservative and incomplete**: API, Osiris, migration, auth, security, payment, webhook, CI/workflows, scripts and deployment/configuration changes are included, but a harmless-looking filename can still contain dangerous code. Manual semantic risk review remains necessary.

For Tier C it requires BOTH label \`tier-c:cleared\` and an owner-authored issue comment with **exact** format:

\`\`\`text
TIER-C OPERATOR ATTESTATION v1
HEAD_SHA=<full current 40-character PR head SHA>
EVIDENCE_URL=https://<recorded review / decision evidence>
\`\`\`

A new commit changes the head; the earlier comment fails matching even if the label remains. The label is an advisory visual marker, **not** independent clearance. The workflow verifies the owner identity and SHA, **not** the authenticity of an external THOTH verdict, the merits of the evidence URL, or human reviewer independence. Operator must inspect substantive evidence before commenting. If a genuinely independent security review is a requirement, the work remains HOLD until that review exists; this workflow does not substitute for it.

## Critical GitHub 2026 Actions dependency

GitHub's 2026 default policy for public repositories will block \`pull_request_target\` on affected repositories starting **December 2, 2026** unless an applicable Actions event policy explicitly allows it. Before enforcing this gate, check actual repository Actions-policy eligibility and future availability. If the default policy will block it, move to an eligible external GitHub App check or an explicitly reviewed event policy; do **not** create a new impossible required check. \`pull_request_target\` must never check out and run untrusted PR code.

Reference: https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target

## CI and independent review are separate

Existing platform CI workflow at \`.github/workflows/ci.yml\` advertises job names \`ci/lint\`, \`ci/test\`, \`ci/build\`; \`canon-gate.yml\` advertises \`Contract Compliance Check\`. Verify real checks on test PRs. Existing CodeQL and Vercel checks may be conditional. Choose required contexts only after observing how they report to this repository.

GitHub ruleset documentation: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets

**A valid GitHub check is not an independent review.** Retain a genuinely distinct human or governed external reviewer route for cases where independence is materially required, and test eligibility on the actual repository. No single account controlled by the same Operator becomes an independent human by changing its display identity.

## Known unknowns / acceptance

- Check \`pull_request_target\` workflow run association with the current PR head; do not assume required-context eligibility.
- Ensure the policy and review packet describe exactly who may attest and which security verdicts are actually required.
- Add explicit negative tests (missing label, wrong SHA, wrong actor, stale receipt, workflow-edit PR) before enabling enforcement.
- Completion: workspace PR #5 demonstrably progresses through the actual rule; platform gate tested across scenarios; Tier C stays held until real substantive gate and Operator disposition; no claim that this proposal is deployed until GitHub confirms it.
