---
name: code-review
description: Review pull requests in mirrornode-platform, especially public integration, security, evidence, dependency, and release claims. Use for Copilot code review to check exact-head evidence and report actionable findings without granting release authority.
---

# MIRRORNODE platform code review

1. Bind the review to the PR head SHA and base SHA. Distinguish source at the head, CI's tested checkout commit and tree, and deployed behavior. Recheck claims when the head advances.
2. Read the changed implementation and tests before relying on PR prose or security records. Compare time-stamped documentation claims with current PR status, reviews, workflow runs, and job logs. Flag a stale claim with the contradicting evidence and a specific correction.
3. Trace public routes and privileged operations through caller identity, authorization, upstream authentication, input handling, logging, and response boundaries. Treat preview and development as production-adjacent unless isolation is proved. Inspect negative tests for denial, non-execution, and disclosure.
4. Keep distinct evidence labels: **OBSERVED** (direct source or run), **REPORTED** (unverified receipt or prose), **INFERRED** (reasoned consequence), and **UNKNOWN**. Preserve contradictory results, including different installers and lockfiles, until their environment and dependency tree are reconciled.
5. Check whether automated tests actually cover the claim. A passing build, lint run, contract gate, or agent review is bounded to its implemented checks. Neither a check named “review” nor a log saying “merge authorized” supplies an eligible approving review or Operator release disposition.
6. For dependency findings, identify the package, advisory, installed version, dependency path, environment, and runtime reachability when evidence permits. Treat a summary count as an open triage item; do not infer that repeated job counts are distinct vulnerabilities.
7. Identify the smallest reproducible defect and cite the changed file and line, the evidence that contradicts the current claim, and the effect on a reviewer or operator. State what remains unverified. Do not manufacture approval, resolve a thread, waive a hold, or claim production containment from repository checks.
8. Respect the repository's `AGENTS.md` and `.github/copilot-instructions.md`. Capability changes require explicit API boundaries and CORE-HUB reflection. Review findings are advisory; merge, deployment, credential changes, and promotion remain separate decisions.

Use repository source, PR metadata, checks, reviews and logs as read-only evidence. Do not require external MCP access to apply this skill. If a needed record is unavailable, name the gap instead of guessing.
