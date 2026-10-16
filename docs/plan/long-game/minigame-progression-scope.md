# Minigames in the long game

APPROVED FOR PROTOTYPE IMPLEMENTATION 2026-10-14. Owner approved the final parent-reviewed design and bridge -> tree -> Printings order. Numbers are initial playtest tunables.

## The chosen direction

Factory breaks give the monkeys ideas to bring back. All participating games earn one shared currency, provisionally **Inspiration**. Alternatives are Curiosity or Spark. Only active minigame play earns it. Spend it on a small optional permanent tree; the factory continues normal online production during play.

Factory resources and main reset currencies already have jobs. DB has its finite ledger and premium role. Reusing them would blur the side loop; unique game currencies would force particular-game farming. One shared currency preserves game choice. Existing Diamond icons remain local game effects and score modifiers, never DB grants or conversion items.

Main layers remain clearable with zero side progress. No game win, score or tree node gates them. Automation still comes from main-game accomplishments.

## What exists now

Both root and attached `.claude/worktrees/minigames` are at commit `7d1e3863c10f642b4ed786786ddda8315038ab9c`. Their game scripts match as text and are clean; checkout line endings differ. Unrelated root dirty work is preserved. Each has 15 playable entries and matching HTML/JS files. Future games join through a metadata entry and the same adapter.

All 15 call `MG.boot`, `MG.shell` and `S.finish`. These are static findings. File names below refer to `minigames/<file>.js`; exact line pointers and hashes are in [discovery.json](evidence/MG-00/discovery.json).

| Game / file | Controls | Score and natural end |
| --- | --- | --- |
| Banana Barrel / barrel-catch | arrows, drag, pointer | catch points; hearts exhausted; banana/fruit modes |
| Key Whack / key-whack | letters, space, tap | key points; misses/blots exhaust hearts |
| Coconut Shuffle / coconut-shuffle | shell tap, numbers, arrows | round points; wrong choices exhaust hearts |
| Banana Stack / banana-stack | tap, space | crate/perfect points; failed stack |
| Banana Slice / banana-slice | drag blade | slice/combo points; misses/coconuts exhaust hearts |
| Banana Plinko / banana-plinko | aim, tap, space | bin points; ten initial drops plus edge refunds exhausted |
| Vine Swing / vine-swing | hold/release | distance/collectible points; hearts exhausted |
| Peel Dash / peel-dash | swipe, arrows, jump | run/collectible points; hearts exhausted |
| Road Hop / road-hop | arrows, WASD, swipe/tap | rows/fruit points; hearts exhausted |
| Coconut Bowling / coconut-bowling | timed taps, steering | bowling total plus special-pin bonus; ten frames |
| Crate Packer / crate-packer | drag, rotate, undo/send | delivery points; rejected trucks exhaust hearts |
| Banana Heist / banana-heist | hold pointer, WASD/arrows | heist points; captures exhaust hearts |
| Typewriter Rhythm / typewriter-rhythm | DFJK, arrows, lane taps | note points; tune ends or ink depleted; three tunes |
| Fruit Stall / fruit-stall | bins, numbers | service/tip points; lost customers exhaust hearts |
| Library Tidy / library-tidy | shelves, numbers | sorting/shelf points; mistakes/drops exhaust hearts |

Most runs have no fixed duration. Rhythm has a chart length; Bowling is frame-based; Plinko refunds can extend play. Raw scores therefore cannot share one conversion divisor. Hub IDEA cards and CONCEPTS suggestions are future content, not additional playable games.

## Attempts and fair rewards

Start with a shared bank of **six attempts**, initially full, refilling **one every two real hours** up to capacity. Clamp backward clock movement to zero refill. Stored attempts never expire. A twelve-hour bank accommodates short return visits. Time spent away refills eligibility only, never Inspiration. Show the count and next refill quietly. No streaks, expiring offers, ads, paid refills or refill-speed purchases. Optional unlimited practice grants no currency.

Consume and save one attempt when rewarded play actually starts, after title/countdown. One attempt covers a **three-minute active break** in the selected game, with free retries inside that break. Cancel before play costs nothing. AGAIN retries within the same break; another charged break requires an explicit Rewarded choice. Reload or quit cannot refund a started attempt.

Earn the **10 Inspiration base over the first 60 seconds of actual play**, carrying time across losing runs and retries. Count visible, unpaused gameplay after an input; exclude countdowns, menus and hidden time. Keep partial credit rather than discard short losses. Everyone can earn the full base through participation, with a performance bonus capped at five. This makes a poor player slower at the game, not unable to advance the side tree, and avoids a two-second intentional loss paying the same base as a played break.

Bank once at the first natural finish after that minute, on quit for the earned portion, or through ?Bank reward and keep practising? at three active minutes. Preserve fractional base credit between breaks; later finishes cannot pay twice. After banking, play remains free practice. Prototype amount is `earnedBase + floor(5 * clamp(metric / target, 0, 1))`, with `earnedBase` capped at10. No input means zero. This is ordinary gameplay bookkeeping, not an anti-cheat platform.

Each game/mode declares its performance metric and target openly. Prefer accuracy for Rhythm, bowling score for Bowling, and ordinary score or completed actions for other games. Freeze the metric at the first settlement, including checkpoint. Calibrate targets with a few owner practice runs, aiming for an ordinary engaged run to earn 12 and a strong run 15. Until calibrated, grant base only rather than invent equivalent scores. Keep existing random gameplay effects, but add no random reward draw. Compare genres during playtesting so a lucky or fast game does not become the compulsory farm.

## First permanent tree

Use five single-purchase nodes. Costs are Inspiration only. Buy Warm-up first; it opens the other four choices. No game-specific prerequisites.

| Node | Cost | Permanent effect |
| --- | --- | --- |
| Warm-up | 10 | +2% automatic typist rate |
| Nimble paws | 40 | another +3% automatic typist rate |
| Fresh eyes | 40 | +3% keeper work rate |
| Good stories | 40 | +3% title sale income |
| Room for play | 60 | attempt capacity six to eight; refill unchanged |

One minute of played breaks buys Warm-up, even across losing runs. All nodes cost 190, or nineteen full base-paying breaks, without a duration promise. Typing nodes add within their family to a 5% ceiling. Keeper and sale families cap at 3% each. Do not compound nodes, boost simulation speed, grant automation, or boost royalties/divisions implicitly. Existing main modifiers retain their behavior; apply each side family once to its named calculation, online and relevant offline work. Later nodes need another design review. LG-13 must assess combined bonuses and premium pacing; six weeks and the 55%/80% targets are not proved here.

## Where the break fits

Reveal a quiet Break room after the opening tutorial completes. Initially offer Barrel, Shuffle, Stack and Plinko, giving movement, observation and one-button alternatives. At the first Second Printing, reveal the remaining games as the monkeys explore beyond their desks. Two games limit the prototype only.

Printings keep the break available. Imprints may add genre-themed recommendations; Estate may give it a leisure-room wrapper. Neither adds a mandatory task or exclusive currency. No rotation removes a favorite. Both editions use their own parent wrapper and reuse the existing pixel minigame art initially.

Retain wallet, nodes, bank and refill timestamp through Printing, Imprint and Estate resets. Second Printing already retains `S.meta`; future layers must explicitly carry it. Preserve the guarded Settings full-reset policy. If an otherwise permitted full reset succeeds, clear this optional side progress with the rest of the game. Do not bypass Vault guards. New Game+ retention remains for LG-07/owner decision.

## Small technical plan

Host an allowlisted same-origin game iframe in a parent overlay. Keep the parent document, game screen and tick running; do not navigate to the standalone hub or call `simulateAway` on opening/closing. Actual browser hiding still follows existing offline behavior. Hosted back closes to the parent, never loads `index.html` inside the iframe and starts another idle document.

`mg-core.js:183-268` already centralizes mode/start/finish/quit/pause. `store` uses separate `mg:` best-score keys at lines 14-16; `boot` installs pixel visuals at 118-126. Add small hosted hooks there and a child bridge file, preserving standalone behavior. Game adapters expose structured metrics/end reason only where the shared score callback is insufficient. Do not parse display-stat strings.

Parent `minigame-progression.js` owns rewards and purchases through `IMI.ops.extensions`. Use current `state()`, init/reset, tab/render/actions and `clock.wallNow()` from `ops.js:1910-1963`; never retain stale S after Printing. Proposed optional `S.meta.minigames` holds version, wallet, node IDs, attempts, refillAt, monotonic nextRun and one active rewarded break with time credit and settlement status. Absent fields default safely. A development flag defaults off. Parent alone writes the main save; child keeps local scores.

Check message origin, `event.source === iframe.contentWindow`, game/mode allowlist, active run ID and finite bounded metrics. Refuse duplicate settlement. Parent calculates the amount and saves attempt/grant/spend before showing success; failed storage holds the result for retry without a second grant. Abandoned persisted runs receive no invented result. Reuse acknowledged save handling where enabled; do not pretend the default legacy save reports durable success. Any missing acknowledgement seam gets a narrow parent implementation lease.

The existing speed seam allows only one provider, so do not commandeer it. Add narrowly named default-zero stat contributions at `typistSpeed:347`, `keeperPeriod:1071` and `salePay:1109`, shared with offline callers. Tick remains at `3093-3203`, scheduled at `3228`. Shell registration belongs in both editions, balance shell and SW; minigame assets currently use runtime caching, not explicit shell precache.

## Proposed skeleton order and owner choices

The owner approved this skeleton order on2026-10-14. LG-02B2 remains accepted with its historical qualification; whole LG-02 remains incomplete. Remaining premium/payment work is deferred while free progression takes shape.

| Slice | Proposed exclusive ownership | Proportionate check |
| --- | --- | --- |
| MG-01 bridge | new parent/child bridge, mg-core hooks, wrapper CSS, shell/SW registration; two adapters; narrow Ops save-ack seam if required | syntax, hosted start/finish/back, duplicate result, save/reload, parent production; both editions/smallest phone |
| MG-02 tree | parent module; one leased Ops owner for three stat seams | purchase/reload/Printing retention, failed save, short default control/economy smoke |
| MG-03 choice | metadata/adapters for remaining games, small batches | each changed end/control path and relevant phone fit |
| Main skeleton | LG-03/LG-04 automation/Printings, then LG-05 design and LG-06 Imprints, LG-07 design and LG-08 Estate/capstone | reachable mechanic, save/reset, short economy/control smoke per slice |

MG-03 can follow the next Printing slice; fifteen-game completion must not hold up main mechanics. Remaining premium effects/payment rigor, broad lifecycle/all-profile QA and polish wait while free progression becomes playable. Focused paid/deletion/public-activation gates still apply. LG-05/LG-07 owner design gates remain. The approved sequence is recorded in the master execution notes; default activation still needs its own authorization.

Owner approved name, bank/refill, participation reward, starter nodes, unlocks and this prototype order. Next: MG-01, host Barrel and Shuffle with a saved rewarded break, retry/time credit, single result and safe return while checking parent production.

OWNER APPROVED 2026-10-14
