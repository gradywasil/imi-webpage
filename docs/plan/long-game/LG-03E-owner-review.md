# LG-03E owner review: base Banana net

Documents-only recommendation, 2026-10-14, long-game. OWNER APPROVED full package including unchanged existing golden effects; receipt evidence/LG-03/owner-approval-a5/receipt.json. LG-03E-banana-net.md is the authorized implementation lease. Original proposal text retained below.

## One approval package

Approve free, earned base A5 at displayed Printing 6 AND Deadline clear AND introduction complete: `S.printing >= 5 && S.chDone.timed && S.intro.done`. Keep `lg03=1`, default Off, with no purchase, stars or Inspiration requirement. Existing repeatable Printing and the existing eight-title/20-minute Deadline challenge structurally support this gate; this is not measured pacing.

Approve two separate ordinary/golden streams so ordinary collection cannot determine the next golden catch. Each repeats Catch, Skip, Catch, Skip, Catch, starting at phase zero. This selects exactly three of five admitted items per stream, not a promise of three payouts despite manual collection or disappearance. No new RNG; existing spawn randomness remains unchanged.

An admission is a newly created, non-rotten, live item while net On, unlocked, supported, save/progression allowed and unblocked, when it first intersects the viewport. Golden flight starts outside the viewport; allow initial entry only, never re-entry after blocking. Assign once per actual instance, never by scan count. Advance its stream once at admission, including Skip; manual collection, expiration and failed capture never refund a slot. Failed spawn, Off, rotten, hidden, blocked and replay events do not advance. Existing items when enabling/loading are excluded. Off cancels pending catches; re-enabling never readmits them.

Persist optional versioned net config with enabled=false and ordinary/golden phases 0..4 under `S.meta.automation`. Retain phases and toggle through load and Printing; full reset clears them. Acknowledge phase advancement through existing `commitAutomation(expected,next)` before admitting the item. Failure leaves phase unchanged, excludes that instance, pauses net and exposes Retry. Retry saves only configuration/phase, never resurrects a claim. Preserve unknown keys and other helpers; malformed/unknown versions disable edits and capture without rewriting data. Re-read current S each time.

## Timing, claims and budget

Catch on the first non-replay visible tick at least one production-game-second after admission. Recheck gate, On, pending/local suspension, `automationAllowed`, item identity, actual lifetime, viewport, inert/hidden state and blockers. If blocked before then, cancel permanently for that instance; no deferred catch after a modal closes. Manual input before capture wins. Skips remain manually collectible.

Ordinary `active === item` and golden closure `done` already enforce single consumption. Extract one ordinary instance claim function shared by click and net, clearing before unchanged `pickup.collect(item.value, at)`. Extract one golden instance claim function shared by click and net, ending before unchanged `goldEffect(roulette(GOLD_FX), x, y)`. Never synthesize clicks or recompute payouts. Net rejects rotten and productionNow >= expiry even where legacy normal-speed manual handling relies on timer/animation completion. Preserve manual behavior.

Use an item-instance budget separate from the four purchase services: at most one attempt per admitted item, at most two attempts per live tick, ordinary then golden. There is only one active ordinary and one golden-or-rotten button. Simultaneous valid items can both pay once; rotten takes no net slot. No queue, loop over history, offline/replay catch or catch-up. Recheck guards between claims. This collects spawned items without spending, so it does not consume or alter the existing one-purchase-service-per-tick scheduler.

Ordinary spawning is Floor-only, with existing placement/hit-test checks. Hosted `mg01-overlay` covers the floor with an iframe and makes existing body children inert; do not invent ordinary spawns there. Golden spawning lacks Floor/modal/hidden checks; net must independently exclude `.mg01-overlay`, `.o-modal`, `.o-celebrate`, visible Settings and active tour, including inert items. A hosted game continuing production does not authorize catches behind its dialog.

## Approval blocker and UI

The legacy weighted golden roulette conflicts literally with the premium promise of no random prizes. Recommend explicitly grandfathering this existing behavior for A5 only, unchanged weights, effects, spawn/drop odds and rewards. Owner must approve that exception before code; otherwise hold golden capture rather than redesign rewards. No DB drops or new draws.

Add one incumbent `.o-card` inside `.lg03-panel`, earned-gate explanation, Off/On button with aria-pressed, status and existing Retry. Explain three-of-five selection and visible/unblocked play. Reuse both editions' button rules, internal pane scrolling and 44px controls. Correct the purchase-only introductory timing copy for this item-based helper.

Keep tiers, prices, constraints, medals, DB allocation and tuning staged within LG-03 before LG-04.

## Compact future lease and checks

Future single-owner lease only: pickups.js instance claim/admission/clear; ops.js golden claim/admission/end and narrow guarded extension methods; automation.js config/phases/card/live tick; sw.js cache bump. No implementation task created. CSS/HTML unchanged unless demonstrated necessary.

Check changed-JS syntax; gate/default control; both five-item streams; simultaneous/manual-first/single-consumption; expiry/rotten/modal/iframe/replay exclusions; ACK failure/Retry/load/Printing/full reset; short automation economy smoke; affected Pixel/Classic 360x560 UI. Defer broad lifecycle, devices and pacing under skeleton policy.

Source anchors: pickups.js:13-15,56-100; ops.js:24-25,990-1040,1864-1945,1961-1987,3270,3393-3403; automation.js:3-42,153-230; automation.css:1-18; minigame-progression.js:94-100; long-game README:49-69,147-148; premium-currency.md:7-16; LG-03-owner-review.md; LG-03D-accepted.md; skeleton-validation-policy.md.
