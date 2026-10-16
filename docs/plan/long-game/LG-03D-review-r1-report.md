# LG-03D independent review r1

**Result: PASS for local default-Off prototype acceptance.** No blocker found in the authorized Auto-restore slice. This does not activate the feature, approve later LG-03 work, or establish broad product acceptance.

## Fresh reviewer checks

- Read the full review brief, original LG-03D task, planning rules, approval receipt, implementation handoff, retained failures, current source, and relevant evidence. `node --check` passed for automation.js, ops.js, sw.js, and the new review helper.
- All 11 product/helper SHA-256 identities matched implementation-a4-r1/handoff.json. Ops matched its retained before source after removing only the two new restore methods. SW differed from its before source only by `imi-v42` to `imi-v43`. Stable five-minute default `result` (report and meta) and `errors` matched before/final exactly, excluding capture and source-identity wrappers. This is five-minute evidence, not a full-hour claim.
- In a fresh headless browser on owned port 8366, with the service worker bypassed and cache disabled, response bytes for automation.js and ops.js matched disk/handoff hashes. The actual enabled scheduler refused a Mk II restoration at wallet 199,999 against the current discounted price 100,000 without a level change or spend. At wallet 200,000 it bought exactly one level through the Ops manual-buy path and left 100,000. No page errors. See `evidence/LG-03/review-a4-r1/fresh-smoke.json` and `tools/long-game/lg03d-review-smoke.cjs`.
- T3 preview opened the owned origin and loaded the ordinary Pixel menu. Functional arithmetic used the task's documented headless workflow; no fresh T3 functional/UI PASS is claimed.

## Source and retained evidence assessment

- The current gate is displayed Printing 5 (`S.printing >= 4`), Haiku clear, and introduction done. Optional restore settings default Off without writing on absence. Unsupported/future config preserves data and prevents spending/editing. Quote checks integer owned desk, cap, automationAllowed, current `mkCost`, and inclusive doubled wallet; execution requotes and calls unchanged `buy('mk',i)`.
- The A4 clock is independent and capped at 20 active game seconds. Scheduler services one due helper per tick in rotating order, limits A4 scans to six desks, advances the cursor for examined desks, and drops failed or excess attempts. Source guards replay, hidden/menu play, pending ACK, unsupported config, and save ownership. A4 setting edits reset its clock/cursor without resetting A1/A2/A3 clocks.
- Retained 57 focused and six bounded checks, native Pixel/Classic 360 images, and hosted-iframe restoration support the broader main path. I inspected both On images. The card is legible and contained in the internal pane; prior native measurements show a >=40 px button and no page overflow. These are reused implementation observations, not fresh reviewer runtime results. Original fixture/UI failures remain recorded. The two stale T3 predecessor failures are not counted as passing current-source preview evidence; the later native browser run records matching loaded source hashes.
- Full reset remains source-only: retained `fresh()`/extension-reset analysis shows the optional config clears, but no destructive full reset was run in this review. Physical device, full accessibility, reduced motion/Low, lifecycle and worker transition matrices, profiles, and long pacing remain **UNVERIFIED** under the proportionate skeleton policy.

**Boundary:** PASS for parent consideration of local `lg03=1`, default-Off A4 acceptance. No Banana net, tiers, challenges, deployment, or default activation is approved by this review.
