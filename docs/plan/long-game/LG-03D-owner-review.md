# LG-03D Auto-restore owner review

Documents-only proposal, 2026-10-14. OWNER APPROVED with LG-03D-auto-restore.md; receipt evidence/LG-03/owner-approval-a4/receipt.json. Original proposal below retained. Existing A1/A2/A3 and protected shared training remain accepted.

## One approval choice

Approve this base A4 package as written, including displayed Printing 5 AND Haiku clear, 20-active-game-second attempts, 2x-wallet margin and active-only operation, or return it for revision. These are proposed rules, not approvals inherited from LG-03-owner-review.

## Earned gate and current rules

Resolve the master's Printing 5 schedule versus Haiku catalogue entry by requiring both, plus intro completion. Displayed Printing is `S.printing+1`, so require `S.printing>=4` and `S.chDone.haiku`. Haiku can be selected for any next Printing with at least one earned reset star. It needs ten progression-counted sales and restricts desk purchases to Bamboo/Hibiscus. The first ten authored recipes use words of at most five letters, available from those desks. Completing Haiku before Printing 5 is structurally reachable; no new shelf or reward is necessary. This is source reasoning, not measured pacing proof.

Keep `mkCost(i)` exact: `roundMoney(MK_BASE[i] * (mk ? 12 : 1) * (HaikuClear ? .8 : 1))`. Existing bases are `cash([5000,40000,500000,6000000,80000000,1000000000])`; cash multiplies by 25 and rounding uses 25-banana units. Mk II uses base, Mk III costs twelve times base; Haiku permanently discounts either by 20%. Manual restoration requires owned desk, `mk<2`, and successful banana spend. It has no separate challenge lock; Haiku limits desk acquisition. Preserve these rules, effects, log, sound, mark and ordinary save path.

## Small implementation shape

One global default-Off Auto-restore toggle behind existing `?lg03=1`. Every 20 visible active game seconds, including hosted minigames, scan at most six desks from a runtime round-robin cursor. Skip unowned, capped or unaffordable desks; restore at most one level when current wallet is at least twice current rounded cost, equality included. Advance past each examined desk. A failed scan consumes this attempt. Requote immediately before purchase; never retain desk objects across state replacement.

Add A4's independent capped clock to existing fair service rotation with A1/A2/A3. Service at most one helper per tick, including refusals, and at most one economy mutation. Reset serviced elapsed time to zero, discard excess time, and reset runtime clocks/cursors on load, Printing and setting edits. No offline/replay, catch-up, selection or Buy1/10/Max changes. Preserve A2's XP-level-first, then coaching, then stable-order choice. Restoration spends bananas only; shared-training planners, floors, reserves and letter inventories remain untouched.

Proposed Ops interfaces: `quoteAutomationRestore(i)` returns eligibility, price and reason; `restoreAutomationOne(i)` requotes and calls `buy('mk',i)`. Both enforce earned gate and `automationAllowed()` using current S. Do not add a general state setter or transaction system.

Optional `meta.automation.restore={version:1,enabled:false}` defaults Off. Clone current configuration, preserve unknown fields, validate supported shape, and reuse `commitAutomation(expected,next)` with actual acknowledged success before publishing. Refused enable stays Off; refused disable suspends locally immediately. Pending/unsupported config pauses spending, preserves data and offers existing Retry. Printing retains config through current S metadata; full reset clears it.

Use one existing Automation card in both editions: unlock requirements, On/Off, current next eligible cost/wait reason, and shared Retry. Retain internal scrolling, 40px minimum targets, reduced-motion/Low support; no new pane.

## Future focused verification

Check syntax; gate combinations; exact discounted Mk II/III costs and 2x equality/refusal; ownership/cap/requote; round-robin and four-helper fairness; config refusal/Retry, reload/Printing/full reset; unchanged selection/Max, XP-first coaching and shared training. Run one enabled production smoke without manual restoration and a stable default control. Inspect Pixel/Classic at 360x560. Broad lifecycle, devices and long-profile pacing remain deferred. No runtime checks executed for this proposal.

Banana net, earned upgrade tiers and challenge expansion 4->8 remain staged LG-03 decisions before LG-04. Do not approve their earlier proposed star prices, constraints, medals, rewards or DB amounts here.

## Proposed future file lease

One implementation owner: `automation.js` for config/card/scheduler; `ops.js` only for the two narrow APIs reusing manual restoration; `sw.js` cache version; new LG-03D task/evidence. Existing CSS and shell registrations suffice. Everything else read-only, including training-pool.js, Core/Economy/Rewards and master/history documents. One proportionate independent review follows implementation.
