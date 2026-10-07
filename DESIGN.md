> Design-law draft, imported unchanged below from the Operator-supplied Desktop artifact. Implementation guidance only; not canon or authority. The referenced HTML prototype was not available.

# Operator Workspace — HUD Design

Presentation layer only. This file is design law for the surface at `127.0.0.1` / Operator Workspace. It does not grant authority, invent runtime, or promote a lane.

## What was wrong with the current page

The structure is correct. The *instrument* is not.

- One long document column. Attention and reference share the same visual weight.
- Docket items are identical fat slabs. The operator cannot scan severity in under a second.
- Status is buried in a grey sentence (`Attention: NEEDS_EVIDENCE · Lane: ACTIVE · Evidence: MISSING`).
- Surface tiles (Osiris Audit, AI Nodes) are empty dark boxes with a late link.
- No rail, no freshness instrument, no bound pane. The page reads as a README with rounded corners.
- Accent teal exists in the platform tokens (`#4f98a3`) but is only used on text links.

The page already refuses to manufacture uptime, task counts, and coherence scores. Keep that refusal. Design the refusal.

## Invariants the HUD must keep

1. **HUD ≠ Engine.** This surface presents declared attention. It does not execute, certify, or invent state.
2. **Presentation is not authority.** Visual polish cannot promote a lane or close a docket.
3. **No manufactured telemetry.** No fake uptime, task counters, coherence rings, spark lines of invented load.
4. **Evidence is a first-class field.** `MISSING` and `CURRENT` must be readable at scan distance.
5. **Freshness is load-time.** State is as-of page load. Reload is an operator act, not a live socket cosplay.
6. **Decisions live off-canvas.** Receipts and rulings stay in `docs/operator/`. The HUD points. It does not become the ledger.

## Layout

Three registers, one scan path.

```
┌─ mark ──────────────────────────────── freshness / bound seal ─┐
│  left rail          main instrument              bound pane     │
│  surfaces           docket + surfaces            law + as-of    │
└────────────────────────────────────────────────────────────────┘
```

- **Rail (212px):** surfaces the operator can open. Active item is a lit row, not a filled app-icon candy bar.
- **Main:** manifesto (short), then the docket as the work queue, then a 2-up surface grid.
- **Bound pane (280px):** the law the page already states, kept visible while scrolling the docket. Freshness, curator, record path.

On viewports under 1100px the bound pane tucks under the docket. Under 760px the rail collapses to a top strip.

## Attention language (visual)

| Field | Meaning | Color | Shape |
|---|---|---|---|
| `NEEDS_EVIDENCE` | Operator must obtain or attach evidence before treating the card as actionable | copper `#E8A87C` | filled chip |
| `HOLD` | Bounded correction required; do not advance | amber `#D4A017` | filled chip |
| `ACTIVE` lane | Requested commercial / live lane | verdigris `#4F98A3` | outline chip |
| `REFERENCE` lane | Frozen base; consult, do not extend as if live | slate | outline chip |
| `MISSING` evidence | No current evidence object | copper, emphasized | chip + left rail stripe |
| `CURRENT` evidence | Evidence object exists *as declared on load* | sage `#8FBF9F` | chip |

Priority sort on the docket (already in the copy: commercial evidence, Radar review, frozen workspace):

1. `MISSING` + `ACTIVE`
2. `HOLD` + `ACTIVE`
3. `REFERENCE` regardless of evidence

Each docket row has a 3px left stripe in the attention color. That is the scan glyph. Do not replace it with icons that imply health.

## Type

- Display: **Newsreader** (the manifesto line). One sentence. Max two lines.
- UI: **IBM Plex Sans**.
- Specimens / field names: **IBM Plex Mono**, 11px, tracked.

Do not set the whole page in mono. Mono is for fields (`NEEDS_EVIDENCE`), not for reading.

## Color (extends platform tokens)

```
--void:        #07080B
--ink:         #0C0D12
--panel:       #101218
--panel-2:     #161821
--hair:        rgba(232,232,237,0.08)
--hair-strong: rgba(232,232,237,0.14)
--paper:       #E8E8ED
--mute:        #8B90A0
--faint:       #5C6170
--verd:        #4F98A3
--verd-dim:    rgba(79,152,163,0.16)
--copper:      #E8A87C
--amber:       #D4A017
--sage:        #8FBF9F
```

Background is a void with a 12% verdigris radial in the upper-left — presence, not decoration fog. No aurora, no particle field, no fake constellation map.

## Components

**Docket case.** One row collapsed: title, one-line condition, three chips, open/close. Expanded: curator note, bound statement, actions. Actions are text commands (`Open docket`, `Close docket`) not primary marketing buttons. Closing a docket on the HUD is a local presentation act unless the engine emits a receipt.

**Surface tile.** Title, one-sentence function, bound reminder, single text command. Empty body is honest. Do not fill with placeholder charts.

**Freshness strip.** `As of page load · reload before a decision.` Timestamp is wall-clock local. No pulsing green “LIVE”.

**Bound seal.** Small mark in the header: `PRESENTATION ≠ AUTHORITY`. Always visible.

## What we deliberately will not add

- KPI row
- Coherence ring / orb
- Agent “online” dots that are not backed by an evidence surface
- Toast celebrations
- Gradient buttons
- Glassmorphism stacks
- A chat drawer pretending to be Hermes

## Drop-in

`index.html` in this folder is a static HUD prototype. Open it locally or serve it. Wire later to the same declared records the current page already reads. Do not invent a live API to make the chips blink.
