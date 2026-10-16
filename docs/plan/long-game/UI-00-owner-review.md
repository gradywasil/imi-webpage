# UI-00 owner review: combo heat, timed notices, action rows

Proposal only, no code. Source snapshot 2026-10-14 (dirty `long-game` tree; Auto-coach may shift line numbers, so anchors are named). Screens: [evidence/UI-00/scope-r1/](evidence/UI-00/scope-r1/).

Parent-reviewed implementation follows [amendments](UI-00-parent-review.md).

## What was rendered versus source-only

Rendered on my own temporary server (127.0.0.1:8391, own browser origin/save), 360x560 unless noted. Fixture: real `IMI.ops.dev.comboHit()` called 24-50 times, so the real `award()` ran and set real Frenzy and Golden Keys buffs. No 5k loop; no manufactured markup.

| Shot | Edition | Screen |
| --- | --- | --- |
| [01](evidence/UI-00/scope-r1/01-pixel-360-floor-buffs-floats.png), [02](evidence/UI-00/scope-r1/02-pixel-360-floor-combo-x24.png) | Pixel | Floor, buffs + milestone floats; x24 heat |
| [03](evidence/UI-00/scope-r1/03-pixel-360-training.png), [04](evidence/UI-00/scope-r1/04-pixel-360-titles.png), [05](evidence/UI-00/scope-r1/05-pixel-360-shop.png) | Pixel | Training, Titles, Shop |
| [06](evidence/UI-00/scope-r1/06-classic-360-floor-buffs-floats.png), [07](evidence/UI-00/scope-r1/07-classic-360-training-chips-over-tabs.png), [08](evidence/UI-00/scope-r1/08-classic-360-titles.png), [09](evidence/UI-00/scope-r1/09-classic-360-shop.png) | Classic | Floor, Training, Titles, Shop |
| [10](evidence/UI-00/scope-r1/10-classic-1280-floor-combo-x24.png) | Classic | Desktop Floor, x24 |

Source-only: Core banners (not triggered), the held Retry chip layout (read from `.o-writer-content .o-buffbar`, ops.css ~1635, and `onStatusPresentation` in ops.js), heat 3 / x50+ glow, multi-chip behaviour beyond two chips, Low and reduced-motion. Captures 01/06 were taken with two buffs and a stacked-float fixture; the overlapping description text in 06 is partly a fixture artefact (25 and 50 hit in the same instant), the clipping is real.

## Findings

- Heat is stage-local: `.o-scene::before` plus `#oStage[data-heat]` (ops.css ~703, ~774-776; set in `comboHit`, ops.js ~605 and the reset ~618). On desktop (10) the glow covers 880x448 while the right-hand area is ~992x611 including the Keeper card, goal row and tray. Also stage-local and staying so: embers (`#oEmbers`), x-counter (`.o-fx`, top-right), `frenzy/golden` classes on the stage.
- Buff chips (`renderBuffs`, ops.js ~2912; `.o-buffbar`, ops.css ~489) centre on the viewport, not the play area (180px vs the area's 210 on 360), wrap to two lines (01, 06) and, off Floor, sit on the pane's own tab row, hiding Crew/Look book and Titles (07, 08). This is the clearest material defect.
- Milestone text is `floatText` (ops.js ~507, `.o-float` ops.css ~388, `white-space: nowrap`, fixed in the page). The 456px description line is clipped on a 360px phone (01).
- Layout: `.o-btn { align-self: flex-start }` (ops.css ~42) leaves Shop Buy / Tune up, Show locked and similar actions hugging the left under multi-line text (05, 09, 04, 08). `.o-seg` groups are content-width, so Keeper and Buy groups (03, 07) and Open/Ready and Word max groups (04, 08) end at different edges. Text stays left on both editions; this is not a case for centring.

## Owner decisions needing a pick

1. **Timed notice: shrinking meter (recommended) versus shrinking whole banner.** Scaling the banner shrinks the text just when the player needs to read the remaining time, blurs Pixel type at non-integer scales and makes tap/aria-live targets jitter. A meter (a thin inset bar under the text, `scaleX` Web Animation started once from `buffs[k]`) keeps text legible and costs nothing per frame; `fx.meterAnim` (ops.js ~612) already uses this idea for the streak. Needs a stored duration per buff (today only the end stamp is stored). The existing `buffOn`/chip clock is `performance.now()`; keep it, not `productionNow()` (which serves the pickup timer only).
2. **Off-Floor chip placement.** Recommended: a compact in-flow strip (heading + meter, no subtext) at the top of the panel, so it never covers tabs; costs ~44px of pane height only while a buff runs. Alternative: keep it floating but anchored below the tab row (fragile).
3. **Streak names/rewards** below. Thresholds are streak counts; they do not change income multipliers.

## Proposal

**1. Heat anchor.** Add `data-heat` to `#o-floor` (the right-hand area; excludes rail, menu, News) alongside the stage's, and paint the existing gradient from `#o-floor::before` (absolute, inset 0, z-index 0, `pointer-events: none`, content above it). Remove the stage `.o-scene::before` rule rather than duplicate. Opacity/colour only, no layout read per hit. Add the new selector to the existing reduce-motion and Low lists (ops.css ~835, ~1436) so the glow stays static. Not applied to other departments.

**2. Thresholds (unapproved).** Add rows to `MILES` (ops.js ~576): 500 LONG RUN, 1000 MARATHON, 2000 IRON PAWS, 3000 UNBROKEN, 4000 LEGEND, 5000 TYPING MYTH. `comboHit` already matches `MILES.find(x => x.n === combo.n)` and keeps the per-milestone 45s cooldown, so no new data store. Reward intent: recognition first (name, banner-grade float, bounded vignette/glow tint), plus at most repeats of existing buff types at existing magnitudes; no new letter or banana amounts until you approve numbers. 10/25/50/100/200 stay unchanged. Visual bound: heat stays 0-3, tier 500+ only shifts hue; ember count stays capped at 3. `#oMiles` (ops.js ~2616) shows only the next goal beyond x200 so 11 chips do not overflow on phones.

**3. Notice component.** One `.o-notice` look for buff chips: centred heading, centred subtext, meter beneath; centred within `#o-floor` (not the viewport), `max-width: calc(100% - 16px)`, subtext clamped to two lines. Multiple buffs: stack at most two with full text; further buffs collapse to heading + meter, with a `+N` count. Distinct owners stay distinct: milestone floats (transient, `award`, wrapped and clamped to the play-area width), buff chips (persistent, `renderBuffs`), Core `IMI.banner` (core.js ~145, `.banner` in styles.css/classic.css, already viewport-centred, unchanged). The approved chips-inside-Retry hold layout keeps its static in-content placement; it reuses the same notice look but not the floating position.

**4. Action-row rules** (CSS on shared classes in ops.css; edition frames/colours untouched):
- Card footer `.o-actions`: flex, gap 8px, wrap, min target 40px. Price/status at the start, primary action at the end.
- One primary action per card: full width at card widths under ~320px (Shop Buy, Tune up), auto width and end-aligned wider. Secondary actions sit before it with lighter weight and never stand alone.
- `.o-seg` and filter groups fill the row (`flex: 1 1 auto` per button, wrap to a second row allowed) so right edges align (03, 04, 07, 08).
- Headings, descriptions and tags stay left; centring is reserved for notices and empty states.
- Spacing: 8px inside rows, one card padding value, one gap between cards.

## Implementation sequence (after the Ops writer is free)

One batch, one owner, because heat, notice and row rules share `ops.css`: leases `ops.css` and `ops.js` only (named anchors: `comboHit`, `award`/`MILES`, `floatText`, `renderBuffs`, `#oMiles` render, shop/tune-up card templates). Decision-gated: the threshold rows go in only after you approve names/rewards; the rest does not depend on them. No edits to `classic.css`, `styles.css` or `core.js` expected. Check once after the fix: nine shots (Floor with buffs, Titles, Training, Shop, both editions at 360x560, plus one desktop Floor), then at most one confirmation pass. Syntax check plus the existing harness; no new test matrix.

## Cleanup

Closed my preview tab, stopped my server on 8391 (process 77728), left 8354/8356 untouched, never used port 8000 or others' tabs. My temporary save lived in the 8391 browser origin only. Retained: the ten screenshots above. No product files, stage or commit touched.
