# Operator HUD integration

## Identity and scope

Target checkout: `/Users/platform/code/mirrornode-platform`.
Branch: `feat/usable-operator-workspace-v0-1`.
Base: `b7540b552d13a0f3177feb7b6898dac36a1c176b`.
Initial tracked state was clean; existing `.tmp/mirrornode-slice2a-20260915-192155.txt` is preserved and excluded from the commit.

The existing :3249 preview belongs to the separate clean clone at `/Users/platform/Documents/Codex/2026-09-17/referenced-chatgpt-conversation-this-is-an/work/operator-docket`, branch `feat/operator-docket-v0-1`, commit `44981f5204c9c50272d75844e1a437c38535f052`. Its process and files were left unchanged.

The requested base contained four surface links but no docket records. This integration imports the existing `lib/operator-docket/` data/types/freshness logic and tests, disclosure component/test, and linked `docs/operator/` evidence packet from that exact clone. Records, timestamps, receipt scopes, acknowledgement fields, and evidence-state logic are unchanged. Historical validation is explicitly labeled. No independent verification of those historical findings is claimed. Frozen-workspace statements describe the recorded base at its observation time, not the branch after this integration.

`DESIGN.md` preserves the Operator-supplied `/Users/platform/Desktop/DESIGN.md` with a draft-status preface. The conversation screenshot and design text guided the port; the referenced HTML prototype was unavailable. Design guidance is not canon or authority.

The shell adds scoped design tokens and Plex fonts, a single Newsreader manifesto, a surface rail, attention chips, docket disclosures, honest surface tiles, a bound pane, and a persistent “Presentation is not authority” seal. Below 1100px the bound pane follows the docket; below 760px navigation becomes a horizontally scrollable strip. Native details controls change local presentation only. Existing navigation destinations are retained; prefetch is disabled. Radar links to its docket only.

Freshness is evaluated on each server request. The fixed timestamp is localized in the browser after hydration; it is not a live clock. No polling, new APIs, mutation controls, credentials, runtime selection, merge, push, or deployment. No API/auth/payment source, dependency lockfile, or global page styling changed.

## Validation

Final validation runtime: Node v20.20.2 (repository engine: 20.x), Next 16.2.12, Vitest 3.2.7.

- `npm run lint -- --ignore-pattern '.vercel/**' --ignore-pattern '.claude/**'`: PASS. These exclusions cover generated deployment output and the unrelated nested worktree, not application source. Unqualified `npm run lint` initially failed on 91 errors and 6383 warnings in existing generated `.vercel` output; no generated files were changed or removed. Repository lint configuration remains unchanged.
- `node_modules/.bin/tsc --noEmit`: PASS.
- `npm run build`: PASS using default Turbopack under Node 20. Dashboard is dynamic. Existing edge-runtime/static-generation warning remains. Initial build also passed under Node 25; final Node 20 result is controlling.
- `npm test -- --exclude '.claude/**'`: PASS, 13 files / 66 tests in this checkout. Includes all 26 existing Osiris regressions (checkout 4, intake 10, controlled fulfillment start 12), 10 imported evidence-boundary checks, and 3 imported disclosure tests. Negative-path fixture logs are expected. Initial unfiltered run passed 119 tests, but 53 were duplicate tests discovered in the nested worktree; do not count them as added coverage.
- Browser checks at 1440×1000, 1024×900, and 390×844: no document-width overflow; desktop bound pane is sticky and 280px wide; tablet/mobile bound pane follows docket; mobile rail scrolls horizontally; authority seal remains visible while scrolling. Three native disclosure cards start collapsed. Radar opens with a click and closes with Enter. Osiris expansion exposes MISSING evidence, UNKNOWN observation, and the historical-claims warning. No browser warnings/errors observed during these checks.
- Actual Newsreader and Plex font families were confirmed in the rendered page; Newsreader is restricted to the manifesto.
- Local production preview used `127.0.0.1:3250/dashboard`, separate from the existing :3249 preview. No external execution flows were invoked.
- `git diff --check`: PASS before checkpoint.

## Remaining evidence gaps

OSIRIS has no attached deployment/commercial-loop receipt in these records; positive payment-to-delivery, failed-payment boundary, and controlled reversal remain unestablished here. Radar stays HOLD; its imported inspection is exact-head source evidence, not current hosted runtime proof. Access/spend controls, error redaction, provenance, persistence rules and runtime receipts remain unresolved in that packet. The frozen workspace receipt identifies historical source only; no new capability usage receipt, deployment verification, or cross-node execution proof is created by this HUD.

CURRENT only describes the imported receipt within its review interval. Remote head/configuration changes are not detected. Reload does not fetch or certify runtime; it re-evaluates the locally curated records. No freshness date or acknowledgement was renewed to make the UI appear ready.

Codex role: bounded coding agent. Allowed: requested local HUD integration, preservation of existing evidence, local validation and one passing checkpoint. Forbidden: APIs/effects expansion, credential changes, merge/deploy or unrelated checkout edits. Invocation/context/tool/checkpoint events are recorded in task history; no MIRRORNODE runtime telemetry or external-agent handoff is claimed.
