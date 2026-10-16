# LG-03 owner review, scope r1

Documents-only proposal, 2026-10-14, `long-game`. Base Auto-hire is already specified; later recommendations below require owner disposition. MG-01/MG-02 remain accepted opt-in skeletons. No runtime acceptance, activation, prices, legal approval or new Diamond Banana allocation follows from this package.

## Build order and authority

Build framework plus A1 first, then A3, A2, A4/A5, and the tier/challenge package within LG-03. Follow with LG-04 Printings. Do not wait for the four new constraints to build A1. Keep LG-05/LG-07 design gates and LG-13 long-horizon tuning. MG-03 adapters can follow Printings.

Master `README.md:45-71,149-170` specifies displayed Printing2 A1, Printing3 A3, No Hands A2, Haiku A4, Deadline A5, three-to-five tiers, and challenge4->8 for LG-03. The broader twelve-challenge target belongs to later work. Automation is earned, never sold; Inspiration is unnecessary.

## Actual actions and gaps

`ops.js:187-223` initializes optional metadata and loads existing saves. Displayed Printing is `S.printing+1`, confirmed at `1048`; gate A1 at `S.printing>=1`, A3 at `>=2`. `doPrint:986-1004` retains current `meta`, rewards, premium and completed challenges; full reset at `3073` replaces state with `fresh()`.

Hiring is `buyUp('paw'):2113-2124`. It depends on selected desk and UI quantity. `upPlan/upLock:2086-2106` compute cost/cap/locks; letters come from largest piles through `takeLetter`. First-letter costs `[100,35,50,70,100,140]`, desk factor `1+.35*i`, growth `1.55`, are current tunables at `70-73`, not automation prices. Reuse this purchase body with explicit desk and quantity one; do not temporarily change selection or Max.

`coachTypist:2071` spends `coachCost`, capped at ten; base costs at `82` use `cash`, grow x1.35. Coaching level is `coach`, distinct from XP `lv`. `buy:2126-2168` owns banana affordability and locks: Haiku permits only desks0/1; desks require predecessor; Publisher needs three authored sales; agent/analyst need two; metro/dbl/contracts require desk2; dbl requires Hold. `SHOP:93` prices are cash-scaled. Restore uses `mkCost:1068`, Mk III x12, Haiku discount20%, owned desk and max Mk III checks.

Ordinary collection uses `pickup.collect:1889-1896`; `pickups.js:56-95` owns one active item, expiry and visibility/modal eligibility. Golden click closure `ops.js:1830-1873` owns single consumption and calls existing `goldEffect`; rotten events are separate. No current shared auto-catch API exists. Add narrow consume helpers there later, never synthetic clicks or duplicate payouts. Rewards `rewards.js:697-709` consumes first-clear events; preserve existing reward IDs, award names and perks.

## First implementation lease

Own new `automation.js`, `automation.css`, and narrow edits to `ops.js`, `index.html`, `classic.html`, `tools/balance.html`, `sw.js`; task evidence only. One Ops owner. Add script/style in both editions, headless script loading and cache inclusion. No Core/Economy/Rewards changes needed for A1.

Use extension registration/render/actions/init/reset/tick at `ops.js:1910-1971,3082,3205`. New module exits before registration unless proposed `?lg03=1`; absent flag must add no fields, controls or actions. Registered Automation pane provides per-desk off toggle, reserve slider initially25%, unlock text and save Retry. Proposed reserve range0-100%, step5%. Missing metadata means all off.

Persist only versioned `S.meta.automation` configuration, per-desk enabled/reserve and later earned levels. Add dedicated `commitAutomation(expected,next)` beside `commitMinigames:1912`, using guarded `Economy.saveStateAcknowledged` candidate write, preserving other metadata and publishing config only after actual success. Require existing save ownership/progression guards; no generic setter or rewardCommit reuse. Failed enable stays off; failed disable suspends locally immediately and retries durable off. Retain settings on Printing via existing meta retention; full reset clears them. Re-read current state each tick; clear runtime cursors/cooldowns on reset/load/toggle, avoiding stale desk references.

Add narrow quote/hire-one methods backed by the same manual purchase helper. Check owned desk, gate, cap, locks and cost again at execution. Require remaining total desk letters >= ceil(pre-purchase letters * reserve). Reserve is aggregate letters, not each letter type. Ordinary purchases retain existing save behavior; config acknowledgment does not create a new transaction platform.

Proposed clock is visible active game seconds from tick payload, respecting production pause and Game Speed. Every20s attempt one hire globally, round-robin across at most six desks. Drop excess elapsed time, never catch up. No offline automation/replay in this skeleton; disclose this limitation for owner approval. Scheduler later allows at most one economy mutation per tick and one catch per spawned item.

## Later LG-03 slices and three owner choices

1. **Gates.** Recommend A4 displayed Printing5 AND Haiku clear; A5 Printing6 AND Deadline clear. Both conditions preserve the schedule and earned mastery; both are reachable through existing resets/challenges. A2 stays No Hands. A3 stays Printing3. Later defaults: one purchase/20 game seconds, A2 lowest `coach` first with cost <=5% wallet, A3 ordered SHOP-only list hold, contracts, metro, dbl, agent, analyst with strict cost <10% wallet, skipping locked entries; A4 owned desks round-robin, wallet >=2x cost. Defer other shop families. Recommend A5 deterministic three catches per five eligible ordinary/golden spawns, never rotten, using existing effects. Approve this explicit interpretation of60% before A5.

2. **Tiers and clock.** Recommend three purchased upgrades beyond free base, paid with earned Legacy stars, retained on Printing. Initial proposed costs1/3/8 stars per automation. A1/A2/A3 intervals20/15/10/5s; A4 wallet margins2/1.75/1.5/1x; A5 catch fractions60/70/80/100%. Keep reserve and spend caps player-controlled within approved limits. Approve active-game-time/no-offline semantics before relying on later tiers. These are prototype tunables, not final prices.

3. **Four constraints and medals.** Stage after A1. Recommend unlock at Printing5: Small Crew, max two typists/desk; Quiet Shop, no SHOP toggles; Patient Press, Publisher disabled; Bare Metal, no restorations. Bronze/silver/gold require6/10/14 authored sales under the same restriction, no timer. First bronze grants one free tier-upgrade entitlement for A1/A3/A2/A4 respectively; higher medals record mastery without new DB. Keep existing four definitions, first-clear rewards/perks unchanged, historical clears bronze, future silver/gold goals proposed at current goal+4/+8. Add separate medal metadata; preserve `chDone` and prevent `ch4` Oulipian from expanding its historical condition. Owner must approve constraints, medal progression and entitlement consumption before this slice.

## Focused acceptance

For first implementation: changed-JS syntax; controlled Printing1 locked/Printing2 unlock; one hire after20s, exact reserve refusal, no Max/selection interference; on/off; acknowledged config failure/Retry; reload, Printing retention and full reset clearing. One short economy smoke with manual hiring disabled, plus stable default control. Inspect affected pane in pixel/classic at360x560, internal scroll only, >=40px controls. Check other sizes only if breakpoint changes warrant it. No broad QA campaign or six-week claim.
