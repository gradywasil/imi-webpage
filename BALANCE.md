# Typewriter Ops balance notes

## Current playtest curve, 7 October 2026

The current measured curve is in [playtest-results.md](docs/plan/playtest-results.md), compared with [the preserved baseline](docs/plan/playtest-baseline.md). The older sections below record earlier tuning rounds and use their historical monetary units.

`economy.js` defines real banana units at x25, shared denomination-aware rounding, compact numbers and independently versioned save migration. Monetary `__TUNE` inputs remain nominal values and scale once in Ops. Letter training costs, recipe quantities, rates and multipliers retain their own units. Machine prices now resolve to 0 / 75K / 750K / 9.375M / 125M / 1.5625B; the additional machine-price rise is separate from the currency conversion.

The first hire costs 100 letters and the required introduction protects those letters from keeper consumption. Train appears after 25 manual taps; Words and Titles open together ten manual taps after hiring. After the first sale, Shop opens and the coach can finish. In the first-hour seeds, active second machines arrive at 13.7-17.3 minutes; the idle opening reaches a first sale at 3.0-3.2 minutes. No standard idle seed buys the second machine in the first hour.

Ordinary pickups use saved visible gameplay time: `max(125 * (1 + floor(playSecs / 600)), 2 * (sustainedRoyalties + sustainedDivisions))`, rounded to the 25-banana denomination. Offline time and menu time do not advance this clock. One 14-second pickup appears every 40-60 seconds when the Floor has room and no coach/modal covers it. Low effects and reduced motion keep a stationary catch. Measured ordinary income was 2.39% at a 60-second collection schedule and 2.95% at an aggressive 50-second schedule, both in seed 1.

The twelve first-hour and six overnight comparisons record held and earned currency, crew, letter balances, intro milestones and actual duration. The overnight fixture advances the clock without running online timers, then applies the real cap/efficiency calculation. The runner accepts `--url`, `--output`, `--commit`, `--session` and `--away`, plus `PUPPETEER_MODULE` for an existing external dependency. `BALANCE_TUNE` can supply JSON without Windows argument-quoting loss. Guarded runs report their actual endpoint rather than claiming the requested hours.

Browser/number/save acceptance is recorded separately in [the roadmap handoff](docs/plan/14-playtest-roadmap.md#completed-handoff). The bot batches taps once per second, so deliberate continuous streak rewards are a separate browser check. Physical-phone behavior and new-player comprehension still require human playtesting.

## How to measure
`tools/balance.html` runs the real `ops.js` on a virtual clock with a seeded RNG, and `tools/bot.js` plays it. Both entry points need `python -m http.server 8123` in the repo root and a local Chrome (they import `puppeteer-core`, so run copies from a folder that has it installed).

- `node tools/balance.mjs <minutes> <idle|active> <collect|hoard> <seed> <activeMinutes> '<tuneJSON>'` plays one run and prints milestone times (minutes) plus income samples.
- `node tools/sweep.mjs <profile> <minutes> <activeMinutes> <seeds> 'name={tuneJSON}' ...` runs each config under **both strategies** (`STRATS=collect,hoard`, override with the env var) and prints median milestone minutes, plus crew size (`paws`, `ups`), titles sold and kids' titles at the end. Env: `KEYS` (comma list of milestones to print), `HOARD_AT`, `GUARD` (wall-clock seconds per run before it stops early), `PROGRESS=1` (log each simulated half hour). It also prints any page errors.

The tune JSON overrides the knobs below through `window.__TUNE` (empty on the real site).

**Bot profiles.** *active* taps 3 a second (Hold speed once bought) for `activeMinutes` (30 in the table below), then idles. *idle* taps once a second until the first typist is hired, then never touches the game again.
**Bot strategies.** *collect*: keepers always on; letters are spent on typists and upgrades as they pile up. *hoard*: a desk's keeper is paused once the desk holds half the cost of its next typist or Quick-fingers purchase, then it buys and resumes.
The bot does **no manual word banking** (only the free keepers bank words), does not play Muses, the garden, rights-market timing, golden bananas, challenges or prestige, and pitches only commissions that need a bigger machine than Bamboo. Treat the numbers as a floor for a human; a person who plays those systems will be roughly 15-25% faster.

A 9 simulated-hour run takes 30-45 wall-clock minutes late game (it gets slower as the shelf grows: 300 kids' titles plus divisions). Run several configs in parallel processes, one config each.

## Keepers are free
Owning a desk means its keeper works from the first second (no purchase, task 03). All keepers chase **one shared goal** (`S.focus`, chosen by auto focus unless the player sets it) and letter pools stay **per desk**, so the tactical lever is the *Paused* toggle on each desk:

- A keeper only banks words the goal needs, and only at its own pace: **`KEEPER_PERIOD`** = seconds per banked word per desk, `[0.6, 1.2, 2, 3, 4, 5]`. Muse "hemi" doubles the rate. `keeperBulk`/`simulateAway` use the same period scaled by the away efficiency (`eff`, 0.4 at base), so offline banking is the same ballpark as online: a 2-hour test with a keeper stack target of 1000 (so the keeper never runs out of work) banked 1,946 words online and 838 offline, 43% of online at `eff` 0.4. Away, nobody sells the goal, so the keepers work down a queue of the next 8 best titles (`planAway`, the same effort-per-pay rule as auto focus, with words counted cumulatively so none is promised twice) instead of stalling once the goal is ready. A 1-hour test went from 25 words banked to 166.

**Away selling (Oct 2026).** A 27-minute absence with the Publisher's assistant (12 s, 40% effort) sold one title. Two faults: (1) the sales ran once, after all the work, from a title list that is cached for a quarter of a second of real time, so it was stale, and nothing the first sales unlocked (the next Kids' titles, the next goal) could ever be made; (2) the keepers' queue was 8 titles chosen by pay per effort, so a few high-band titles the slower desks could not finish held every slot. Now the assistant sells *as the stretch goes* (once per work step, at `effort / period` sales a step), the queue is rebuilt after each sale (`planAway` again every fourth step, `trimPlan` between), the queue holds 24 to 120 titles, titles the desks can finish in the time left come first, and a production goal narrows the queue to what it allows to sell. The money is paid after the stretch, one credit per sale in the `bulk` phase from `cp.owed` (so a failed or reloaded credit is never repeated). A small build (6/5/4/2 typists, keepers on every desk), assistant tier 1, no lamp: 27 min sold 27 to 29 titles (was 1), 60 min about 55, 2 h tier 2 about 100 to 170, 8 h about 330 to 410 (capped at 600), taking 0.2 s, 0.4 s, 0.7 s and 1.5 s to settle. A Folio goal or a challenge keeps the old end-of-stretch sale. Sales are limited by what the desks can finish, not by the 12 s period, so doubling the effort (a bigger lamp) roughly doubles them.
- Letters the goal does not need pile up. Typist hires and upgrades cost letters **from that desk**, so a collecting keeper turns the useful letters into words (progress toward titles) while a paused keeper leaves the whole pile for hiring. Hoarding therefore trades title speed for crew speed.
- Auto focus (`pickAutoFocus`, `autoEffort` in `ops.js`) now picks the best return for the crews' time: for each reachable unsold title it sums missing letters weighted by that desk's seconds per letter and divided by its crew size, then divides by the title's rights. Without this a goal on a slow desk could stall the whole room while cheap kids' titles went unwritten, and cheap kids' titles could starve the valuable authored titles.

## Knobs (defaults in `ops.js`, all overridable by `window.__TUNE`)
| Knob | Was | Now | Why |
|---|---|---|---|
| `KEEPER_PERIOD` seconds per banked word | 0.4 for all (paid keepers) | 0.6, 1.2, 2, 3, 4, 5 | Free keepers would drain letters instantly; 0.6 on Bamboo still lets a tapping player finish a 50-word kids' title in under a minute |
| `PAW_BASE` seconds per letter, per desk | 3, 9, 27, 81, 243, 729 | 1.5, 9, 27, 81, 243, 729 | Bamboo typists are twice as fast so the kids' ladder moves with no one tapping; later desks unchanged |
| `PAW_COST` letters for the first typist | 25, 35, 50, 70, 100, 140 | 200, 35, 50, 70, 100, 140 | Free keepers eat the useful letters, so the first hire needs real tapping: about 1.5 min active, 4.5 min casual |
| `PAW_GROW` cost growth per typist | 1.9 | 1.55 | Lets a typist-only idle player keep buying hires |
| `PAW_DESK_STEP` (new) | none | 0.35 | Typist cost x `1 + 0.35 * deskIndex`: later machines do not get a big crew cheaply |
| `AUTH_PAY` (new) multiplier on authored readers' pay, by band | 1 | 0.15, 0.4, 0.35, 0.2, 0.2, 0.2 | The six Bamboo books were worth 3.7K bananas, enough for Hibiscus in 2 minutes |
| `KID_PAY` (new) multiplier on the baked-in pay of kids' titles | 1 (24 per word) | 0.1 | About 100-170 bananas per kids' title, so 25 of them plus the six authored ones fund Hibiscus |
| `LIB_PAY` (new) multiplier on the baked-in pay of the 900 library stories (5-, 7-, 9-letter caps), by band | n/a | 0, 0.03, 0.018, 0.018 | Baked pay is words x `RATE[band]`; at these values a 65-word cap-5 story pays about 530, a 71-word cap-7 about 4.3K, a 77-word cap-9 about 28K. See "Library stories" below |
| `LIB_ROY` (new) share of normal royalties the library stories pay | n/a | 0.5 | Same treatment as the kids' books |
| `PUB_COST`, `PUB_PERIOD` (new) | n/a | bananas [6000, 50000, 350000]; seconds [12, 6] | Publisher's assistant, Shop > Market tools. Tier 1 sells a ready title every 12 s (needs 3 sold titles), tier 2 every 6 s. Every tier keeps selling while away at market x1.0 and at its own pace scaled by away efficiency; tier 3 (Night shift) sells away at full pace and x1.2 (`NIGHT_SHIFT`). Task 11 |
| `TIER` (cost multipliers of the tiered upgrades), `UPV` (their chances by level) | `[1, 2.5, 6]`, levels 0-3 | `[1, 2.5, 6, 24, 96]`, levels 0-5 | Levels 4 and 5 need the machine restored to Mk II and Mk III. Task 12 |
| `COACH_MAX`, `COACH_STEP`, `COACH_GROW`, `COACH_BASE` (new) | n/a | 10 levels, +2% each, x1.35, bananas [18, 215, 2700, 33500, 4.2e5, 5e6] by desk | Per-monkey coaching on the Train page. Task 12 |
| `REROLL_BASE` (new) | n/a | bananas [20, 250, 3000, 38000, 5e5, 5.6e6], x1.5 per reroll | Rerolls a monkey's trait and talent. Task 12 |
| `KEEPER_UP_STEP`, `KEEPER_UP_MAX`, `KEEPER_UP_GROW`, `KEEPER_UP_BASE` (new) | n/a | 0.9, 6 levels, x1.8, bananas [100, 600, 3000, 30000, 4e5, 5e6] by desk | Shop > Keepers. A level multiplies that desk's seconds per banked word by 0.9 (a maxed keeper is 1.9x faster). Task 10 |
| `KID_ROY` | 0.5 | 0.5 | Unchanged; 300 kids' titles at 0.5 are a small slice of royalties |
| `PITCH_PAY` rights for a standard pitched title, by band | 100, 1.26K, 15.6K, 196K, 2.44M, 30.6M | 40, 504, 5000, 39.1K, 489K, 6.12M | Pitches carried the mid game; reduced so Lagoon and Honeycomb are real goals |
| `ROY_BASE` | 0.00003 | 0.00001 | With 300 kids' titles on the shelf royalties and the Legacy star came hours too early |
| `DIV_BASE` multiplier on division income | 1 | 0.35 | Same: divisions (first one now at ~4.9 h idle / ~2.9 h active) were funding everything |
| `SHOP` | | overridable with `TUNE.SHOP` | Prices unchanged |
| `HOLD_BASE`, `RAPID_STEP`, `TITLE_SCALE`, desk prices, deals, divisions, Muse costs, garden | | unchanged | Not needed |

Existing saves: typist speed, hire costs and title pay change under them (no format change). Players mid-run will see cheaper-per-second Bamboo typists but a much dearer next hire on Bamboo, and lower pay per title. Acceptable this early; nobody has progress to protect yet.

## Milestones (bot, minutes unless noted; one seed per cell, 9 simulated hours)
Final defaults except `ROY_BASE`/`DIV_BASE` (last row group, the same values now in the defaults). *Active* = taps 3 a second for 30 minutes, then idle. *Idle* = one tap a second until the first typist, then nothing. Targets are from task 08.

| Milestone | Target active | Active (collect / hoard) | Target idle | Idle (collect / hoard) |
|---|---|---|---|---|
| First typist hired | 1.5-3 min | 1.5 / 1.5 | 5-10 min | 4.5 / 4.5 |
| First title sold | 1-3 min | 1.6 / 1.6 | 6-12 min | 4.6 / 4.6 |
| First 3 authored titles (Muse slot 1) | 5-12 min | 2.4 / 2.5 | 20-45 min | 6.9 / 6.9 |
| 25 kids' titles | 12-20 min | 18.8 / 27.7 | 45-90 min | 96 / 86 |
| Hibiscus Ribbon (2,000) | 12-20 min | 11.5 / 11.3 | 40-90 min | 50 / 50 |
| Lagoon Sprint (25K) | 1.5-3 h | 2.0 h / 2.4 h | 3-5 h | 3.3 h / 3.4 h |
| Honeycomb Ledger (312K) | 3.5-6 h | 7.0 h | 6-10 h | 8.9 h |
| First division | | 2.9 h | | 4.9 h |
| First Legacy star (500K earned) | 4-8 h | 4.9 h | 8-14 h | 6.8 h |

The last two rows and the Honeycomb row use the final knob set (collect only, one seed). Hoard rows for Hibiscus, Lagoon and the first star were run on the previous candidate (royalty and division knobs 50-100% higher) and differ by 1-25 minutes from collect in the same direction.

**Where a row moved, and why**
- *First Muse slot* is 2.4 min active / 6.9 min idle against targets of 5-12 / 20-45. The gate is three sold authored or pitched titles and the three shortest Bamboo books are only 15-19 words each. Delaying it means changing the gate or the books, which is outside this pass. Kids' titles never count towards it.
- *First title* (idle) at 4.6 min is a little before the 6-12 target and *first typist* (idle) 4.5 vs 5-10: lowering the casual tap rate or raising the first hire cost would push these out but also push the active column outside its target. 200 letters keeps active at 1.5 min.
- *Honeycomb* active (7.0 h) is a bit past the 3.5-6 h target and idle (8.9 h) is inside its window. Active and idle converge here because later machines run on typists, not taps (as the previous notes also found). I stopped at the pay values that kept the first star in range rather than pull Honeycomb in further.
- *First star* idle 6.8 h is under the 8-14 h target. Cutting royalties further would also delay Honeycomb. A human who plays the garden, Muses and golden bananas will be earlier still, so treat this as the first thing to tighten if players report the star arriving too soon.
- *Hibiscus* active at 11.5 min is just under 12; a human will be faster. If it feels quick, lower `KID_PAY` to 0.08.

## Hoard vs collect (first hour)
Three seeds, 60 simulated minutes, candidate close to the final numbers:

| | Crew (typists + upgrades) | Kids' titles written | Hibiscus |
|---|---|---|---|
| Active, collect | 41 | 103 | 11.5 min |
| Active, hoard (pause at 50%) | 43 | 61 (-41%) | 12.4 min |
| Idle, collect | 3 typists | 13 | 45 min |
| Idle, hoard | 5 typists (+67%) | 14 | 45 min |

So hoarding clearly loses titles (-40% kids' titles in the first hour active; Lagoon arrives 25 minutes later in the 9 h run) and **wins crew only slightly when the player is tapping** (+5%), **by a lot when idle** (the second and third typist arrive much earlier). The target was a 10-25% crew win; tapping already supplies plenty of leftover letters, so a deeper hoard (pause from 25% of the cost, or from the start) costs titles badly (-65%) without a bigger crew. The knobs to widen the gap if wanted are a stricter keeper (`KEEPER_PERIOD`) or costlier hires (`PAW_COST`, `PAW_DESK_STEP`).

## Early feel
- Hard tapping banks a 21-word Bamboo title in ~15 s (browser check, 1280x800 pixel, clicking the typewriter); a casual 1 tap a second takes ~4 min to the first title *and* the first typist, which is the point where the bot stops tapping and the idle column starts.
- Zero letters never stalls: Bamboo typists exist after the first hire, the first hire needs only tapping, and every desk starts with one typist.

## Things worth watching with real players
- The Hold-to-type speed (4 letters per second, up to 16 with upgrades) is still large next to a Bamboo typist (0.67 letters per second now). If early active play feels too fast, lower `HOLD_BASE` first.
- Awards add 1% each, Muses and Legacy multiply on top, and the five publishing deals total about x18 on royalties. Check late-game income if players report runaway numbers.
- The market multiplier and golden bananas are not modelled, so real income runs a little higher than the bot's.
- Auto focus now optimises per banana of rights; a manual goal is still always honoured.

## Library stories (900 titles with 5-, 7- and 9-letter caps)
`readers-w5.js`, `readers-w7.js`, `readers-w9.js` (built by `tools/build-word-readers.mjs` from the monkey-library `word-stories.json`) add 300 stories each to bands 1-3 (Hibiscus, Lagoon, Honeycomb). They are 57-91 words long, all available at once (no reading list), and, like the kids' books, **never count toward `soldCount()` progression gates** (Muse slots, deals, divisions, agent). Three awards (25, 150 and all 900 sold) add the usual +1% income each.

**What the pay has to be.** Supply was never the limit on progression: pitched titles can always be commissioned. What gates progress is pay per unit of effort. The first guess (`LIB_PAY` 0.17 / 0.09 / 0.09, a little above pitch pay per word) broke the economy: Lagoon at minute 20 instead of about 2 hours, Honeycomb at minute 30, 1.2M bananas earned in the first hour against 30K. The values below are the smallest that still get the stories used from minute 15 by the auto-focus bot (at 0.024 / 0.018 / 0.02 the bot ignores them for three hours because pitches pay better per word).

| Milestone (min) | Before | `LIB_PAY` 0.03 / 0.018 / 0.018 | Target |
|---|---|---|---|
| Active: Hibiscus | 11.5 | 11.5 | 12-20 |
| Active: Lagoon | 120.6 | 79.6 | 90-180 |
| Active: first division | 171.6 | 140.8 | |
| Active: first star | 292.8 | 226.9 | 240-480 |
| Active: Honeycomb | 421.2 | 337.9 | 210-360 |
| Active, hoard: Lagoon / star / Honeycomb | | 153.7 / 310.3 / 417.1 | |
| Idle: Lagoon | 196 | 196 | 180-300 |
| Idle: first star | 386 | 340 | |
| Idle: Honeycomb | 497 | 443 | 360-600 |

One seed each, 8-10 simulated hours, the bot's pitching rule ignores library stories (they are not "open" titles). The first library story is sold at minute 15 (active) or 255 (idle). Note the bot never browses or sorts; a human can pick the highest-paying titles with Sort > Pay, so players who do will beat these numbers a little. Re-run `node tools/balance.mjs` with `'{"LIB_PAY":[0,a,b,c,0,0]}'` before changing the knobs.

## Keeper upgrades (task 10)
Bought with bananas in the Shop, per desk. One seed each, bot with the rule "buy a keeper level only if it costs at most 15% of the next machine and you hold 3x its price". *Before* is the build with the library stories and no keeper upgrades.

| Milestone (min) | Before | With keeper upgrades | Target |
|---|---|---|---|
| Active: Hibiscus | 11.5 | 13.2 | 12-20 |
| Active: 100 kids' titles | 133.6 | 71.2 | |
| Active: Lagoon | 79.6 | 83.4 | 90-180 |
| Active: first division | 140.8 | 198.4 | |
| Active: first star | 226.9 | 245.0 | 240-480 |
| Active: Honeycomb | 337.9 | 364.2 | 210-360 |
| Active, hoard: Hibiscus / Lagoon / Honeycomb | | 12.1 / 118 / 423 | |
| Idle: Hibiscus | 50.5 | 56.2 | 40-90 |
| Idle: Lagoon | 196 | 171.6 | 180-300 |
| Idle: first star | 340.5 | 299.8 | |
| Idle: Honeycomb | 442.9 | 418.7 | 360-600 |

Keeper speed only matters when letters outrun the keeper, which is the kids' era and the early middle game; later the economy is bananas-limited, so the upgrades are most valuable early and a mild trade-off after. Naive bot rules (buying any level at 3x its price) delayed Hibiscus by up to 28 minutes idle, so a first-draft price table was cut by an order of magnitude at the top end.

## Publisher's assistant (task 11)
The assistant sells one finished title per `PUB_PERIOD` seconds, optionally holding for a market rule. Bot (one seed, active profile, collect), **selling only through the assistant once bought** (it stops selling by hand):

| Setup | Lagoon (min) | First division | First star | Honeycomb |
|---|---|---|---|---|
| By hand, instantly (baseline, no assistant) | 83.4 | 198.4 | 245.0 | 364.2 |
| Assistant, Any, 12 s | 111.4 | 245.6 | 278.0 | |
| Assistant, Any, 6 s (tier 2) | 91.7 | 210.7 | 241.2 | |
| Assistant, Fair, 12 s | 172.7 | 305.4 | 339.6 | 474.9 |
| Assistant, Fair, 6 s | 145.2 | 278.0 | 307.8 | |

So the assistant is a tax compared with a perfectly attentive player, small at tier 2 and with Any price, and **holding for a fair price costs a lot early** (income is small and compounds), which is why Any is the default and Fair/Hot are opt-in. Its value is for players who are not watching. A casual player who checks in one minute in ten: without the assistant Hibiscus at 80 min and Lagoon never within 8 hours; with it (Fair, bought at 6,000) 100 kids' titles at 265 instead of 311 minutes and Lagoon at 371. An earlier price of 20,000 arrived at about minute 80 and was cut to 6,000. Tier 3 (selling while away) has no simulation, because the harness has no away periods; it is covered by a unit test only.

Bot options for this: `BOT_SELL: "pub"`, `BOT_PUB_RULE: "any|fair|hot"`, `BOT_VISIT: N`, all via the tune JSON.

## Typist tiers, talent, coaching and rerolls (task 12)
Tiered upgrades (`vowel`, `ink`, `practice`, `stock`, `ribbon`) now have five levels; levels 4 and 5 need Mk II and Mk III. Each hired monkey rolls a **talent** (+0 to +12% typing speed), can be **coached** (+2% per level, ten levels) and **rerolled** for a new trait and talent. One seed each, bot with the tiered upgrades bought to level 5 where the restoration allows (`BOT_TIERS3` caps it at 3 for the comparison):

| Milestone (min) | Tiers capped at 3 | Tiers 4-5 | Target |
|---|---|---|---|
| Active: Lagoon | 80.5 | 80.5 | 90-180 |
| Active: first division | 184.7 | 167.5 | |
| Active: first star | 231.4 | 216.6 | 240-480 |
| Active: Honeycomb | 355.6 | 334.1 | 210-360 |
| Idle: Lagoon | 164.8 | 164.2 | 180-300 |
| Idle: first star | 330.2 | 320.8 | |
| Idle: Honeycomb | 451.7 | 431.8 | 360-600 |

**Coaching is a poor investment next to machines and divisions.** Bot variants (active, Honeycomb in minutes; baseline 334): coaching whenever one level cost at most 10% of the next machine, with 3x its price in hand: Lagoon 160, first division 474 (the cost multiplies across a dozen monkeys per machine); at most 2%: Lagoon 100, Honeycomb 431; only as a surplus purchase (holding 4x the next machine's price): identical to no coaching (it never triggers in 8 hours). The talent roll is free. A fully coached, well-rolled monkey is at most +32% speed (+12% talent, +20% coaching).

## The sky (plan 13)

Day, night and weather now follow `world.js` (a 14 minute day; weather re-rolled every 2.5 minutes, 55/15/21/9 % clear/drizzle/rain/storm) instead of toggles. The bot's virtual clock drives it. Active (30 min), seed 1: Lagoon 64.3 (was 80.5), first division 165 (167.5), first star 205.7 (216.6), Honeycomb 325.1 (334.1). Idle: Honeycomb 432.6 (431.8). Market bias averaged over two days per band: 0.064, 0.107, 0.042, 0.087, 0.035, 0.062 (the old fixed clear day gave only band 3 a flat +0.2). Storms halve typing speed, so about 9 % of the time is slower; owls and rain lovers get their boost on a schedule instead of on demand. No economy numbers were retuned.

## Late-game ramps (Oct 2026)
Numbers added in the late-game pass. None were run through the balance bot (it no longer loads); they are reasoned from the formulas below, so expect to tune them from play.

| Knob | Value | Why |
| --- | --- | --- |
| Quick fingers (`fing`) | no cap; 15% faster per level for 10 levels, then 7% per level (`FING_SOFT`, `FING_LATE`); cost x1.6 per level to level 10, then x1.4 | Every level still helps, but each one costs 25% more time to earn than the last, so the climb slows without a wall |
| Rapid touch (`rapid`) | no cap; cost x1.7 per level to 8, then x1.4 | Held typing grows by +2/s a level |
| Keeper speed | no cap; x0.9 period to level 6, then x0.95; cost x1.8 to level 6, then x1.45; period floor 0.004 s (`KEEPER_MIN_PERIOD`), with a further x0.8 every tenth level past level 6 (see Endgame scale) | Superseded: the old 0.05 s floor was the tick's four-words-a-frame ceiling; a keeper under 20 ms now banks in bulk |
| Pitch assistants (`S.pitchteam`) | 250,000 base bananas, needs 3 sold titles | A second crew per desk banks words for the best commissioned pitch that is not the goal, at `SUB_SLOW` = 2 keeper periods per word. Pitch words are banked on top of what the goal needs. Also runs while away. The Auto-pitch helper adds one more such crew (two crews halve the period), keeps title auto focus off commissions, and sells a ready commission every 6 s when the sale leaves the goal's words alone |
| Carbon paper (`S.carbon`) | 1,500,000 base bananas, needs Honeycomb Ledger | Banking a word no longer takes its letters. Training keeps back only one copy of each letter the goal needs |
| Shared training `factors` | `[1, 8, 28, 90, 280, 900]` (was `[1, 4, 8, 16, 32, 64]`) | About 1.5x the PAW_BASE ratio of each machine. A full set of upgrades on desk 3 is about 98k letters x 90, so an 8-hour stockpile (a few million) funds the first levels at once but not the last |
| Break Room games | 15 games, 5k to 64M base bananas, bought in order | Each game pays more per par run than the one before (see the Break Room section below) |

## Flat band pay and Auto aim (Oct 23 2026)

`AUTH_PAY`, `KID_PAY`, `LIB_PAY` and `PITCH_PAY` (the rows above) are gone. One knob, `BAND_PAY`, is the rights for **any** title in a word band, whether it is authored, kids', library or commissioned, and it does not change as you work through the band (the pitch ramp of +2% per pitch sold and the pay-by-word-count are gone too). The pay baked into `readers*.js` is no longer read. A pitch offer now shows the price it will actually sell for (it used to show the pre-`AUTH_PAY` figure, 2.5x to 7x too high).

| Band | Words | `BAND_PAY` | Was |
| --- | --- | --- | --- |
| 0 | 2-3 letters | 120 | kids ~134, authored ~117, pitches ~15 |
| 1 | 4-5 | 520 | library ~527, pitches ~200, authored 2,200-3,800 |
| 2 | 6-7 | 4,400 | library ~4,345, pitches ~1,750, authored 21,700-37,100 |
| 3 | 8-9 | 28,000 | library ~27,700, pitches ~7,800, authored 80,000-120,000 |
| 4 | 10-11 | 97,700 | pitches only, unchanged |
| 5 | 12+ | 1.224M | pitches only, unchanged |

Library and kids' titles anchor the table (they are the body of the game), so the four-title authored sets come down and commissions go up 2.6x to 3.6x in bands 1-3. Royalties still differ (`LIB_ROY`, `KID_ROY`).

**Auto aim.** Auto focus used to take the best `effort / pay`, which sent the keepers back to 3-letter titles whenever a new machine had few typists. It now picks the highest band that has a title the crews could finish in `AUTO_BUDGET` (1,200 s of crew time, letters counted twice for the untailored mix), then the lowest effort per pay inside that band. A band you cannot reach yet is skipped until the crews grow into it. Words stay banked when the goal changes, so the check runs every second and moves an auto goal up a band when one opens (never down, and never a goal you picked by hand). Commissions are taken highest band first. The away queue (`planAway`) still ranks by effort per pay so a stretch sells the most titles.

## Break Room v3: families, typists and floor problems (Oct 23 2026)

Everything below replaces the Shop games and the single Inspiration wallet of the section after it.

| What | Rule |
| --- | --- |
| Games | All 15 are open when the Break Room opens (3 titles written, or a Printing). Nothing is bought; the Shop's Break Room tab is gone. The old `meta.minigames.games` list is ignored |
| Families | Speed: Key Whack, Peel Dash, Road Hop, Banana Slice, Typewriter Rhythm. Keepers: Library Tidy, Crate Packer, Banana Stack. Sales: Fruit Stall, Banana Heist, Banana Barrel. Luck: Coconut Shuffle, Banana Plinko, Coconut Bowling, Vine Swing |
| Inspiration | A run pays into its game's family pool (`meta.minigames.pool`). Warm hands and Bright ideas cost Speed, Fresh eyes Keepers, Good stories Sales, Lucky streak Luck; Room for play, Quick breaks and Studio notes take any. A family's own pool pays first, then loose Inspiration (`wallet`, what an older save held, which pays for anything). The HUD shows the total |
| Par pay | The same for every game: `180 x 1.3^(machines owned - 1) x 1.2^Printings` (180 on one machine, about 670 on six, about 4,100 on six at Printing 10), x`tune` for Rhythm modes, x1.25 Fresh. A game's difficulty is already in its `par`, so the game you are best at is the one to play. The old per-game ladder (100 to 4,330) went with the purchase order |
| Ideas gate | The "games owned" requirement per level is gone; cost is the pace |
| Fresh eyes | `keeperWorkBonus` was never read by `ops.js`; keeper speed now divides `keeperPeriod` by it |

**Badges.** A rewarded run (a fixing run included, practice never) trains the typist who played: `100 x ratio^0.85` badge xp in the game's family (x1.25 if that typist has not played in the last 3 runs, shown as RESTED). Level = `floor(sqrt(xp / 60))`, so a par run is level 1 and there is no last level. A typist's badge is the family they have the highest level in. It lives on the typist (`t.bd`), so it goes with the typist through transfers and resets with the room, and is saved in the same write as the Inspiration (`commitMinigames(expected, next, badge)`).

**Set bonuses** (one machine, read by `deskFactor(i, kind)` in the typing, keeper, sale and crit paths):

| Part | Value |
| --- | --- |
| Each badge level | Speed +0.4%, Keepers +0.5%, Sales +0.3%, Luck +0.5% to that machine's typing, keeper speed, title pay, crit and lucky-sale odds |
| Set tier, by typists with that family's badge | 3: +10%, 6: +25%, 12: +60%, 24: +150%, 48: +400% (Sales x0.6) |
| Full house | +6% to all four per complete set (one badge of every family) |

A full desk of 48 split 12 / 12 / 12 / 12 at level 3 reads about +60% tier, +72% full house and +7% levels on every stat. Typing and keepers multiply the desk's rate, Sales multiplies `saleContext.desks[band]`, Luck multiplies the crit and lucky-sale odds on that desk and band.

**Floor problems** (runtime only, never saved, driven by the Break Room's `tick` hook with its own hash, never the game's `rand()`). The first arrives after 240 s of play, then every 300 to 540 s (divided by 1 + 0.1 per extra machine in use); one at a time, 4 minutes to live, only when progression runs and no modal, challenge, Folio or Works is open. Ink jam: that desk types x0.6 (Speed). Keeper nodded off: that keeper x0.5 (Keepers). Slump: that band's titles x0.85 (Sales). Jinx: no crits or lucky sales there (Luck). The old Spoiled snack and Bad review buffs show the same card and clear when fixed. Playing a game of the matching family as a typist from that desk is a free run (no break spent, full Inspiration, badge xp). At 40% of par or better it fixes the problem and tunes the machine up (+25% at par, up to +60%) for 2 to 4 minutes; below that it only halves the time left.

## Break Room: score-paid Inspiration and the Ideas (Oct 2026)

Untested by the balance bot; the numbers are reasoned. Par scores come from the games' own autoplayers (`?bot=1&warp=N`), halved for a human.

| Knob | Value | Why |
| --- | --- | --- |
| A rewarded break | one run, paid when it ends (or when you leave, for the score so far) | The old reward was play time (10 to 24 Inspiration per minute); it ignored how well you played |
| Run value | `pay x (score / par)^0.85` at or above par, `^1.15` below; score is capped at 60x par | Doubling a score pays about 1.8x, so skill matters but an outlier cannot run away; a token score earns a token reward |
| `pay` (a par run) | 100 for Banana Barrel, x1.31 per game bought: 130, 170, 220, 290, 380, 500, 650, 850, 1,120, 1,470, 1,920, 2,520, 3,300, 4,330 | Later games cost far more bananas and are harder, so a modest score on them beats a good score on the first game |
| `par` | Barrel 1,500 / Shuffle 2,500 / Road Hop 120 / Key Whack 3,500 / Fruit Stall 1,000 / Vine Swing 450 / Peel Dash 2,000 / Stack 2,500 / Slice 3,000 / Rhythm 3,500 / Tidy 3,000 / Bowling 150 / Packer 130 / Heist 300 / Plinko 1,200 | Normalises scores that differ by orders of magnitude. Rhythm modes: easy par x0.7 pays x0.6, hard par x1.3 pays x1.6 |
| Fresh | x1.25 when the game is not one of your last two rewarded breaks (needs 3+ games) | Nudges play across the whole Break Room |
| New best | +25% of the run's Inspiration when it beats a saved best | Bests are saved with the factory (`best`) and survive a reload; practice counts toward them but never pays |
| Breaks | 6 held, one back every 2 hours; a break that never got played comes back | Ideas below raise the cap to 20 and shorten the wait to 20 minutes |
| A closed tab | An interrupted break is banked for the score it had reached the next time the game loads | Checkpoints save the score every second of play |

The Ideas replace the nine one-off nodes. Each is a track bought a level at a time; a card shows the next level (`+35% > +70%`). Tracks marked "tail" never end: past the listed levels they add the stated amount per level and the cost grows x1.5 to x1.6. Levels past the first need more Break Room games owned.

| Track | Effect (cumulative per level) | Cost per level (Inspiration) | Games needed |
| --- | --- | --- | --- |
| Warm hands | automatic typing +15, +35, +70, +130, +230%, then +100% a level | 150, 600, 2.4K, 9.5K, 38K, then x1.6 | 0, 2, 4, 7, 10 |
| Fresh eyes | keeper speed, same steps | 170, 680, 2.7K, 10.5K, 42K, then x1.6 | 2, 3, 5, 8, 11 |
| Good stories | title income +10, +25, +50, +90, +150%, then +75% a level | 220, 900, 3.6K, 14K, 56K, then x1.6 | 3, 4, 6, 9, 12 |
| Bright ideas | inspired typists come x1.3, x1.6, x2, x2.5 as often and last +4, +8, +12, +18 s | 400, 1.8K, 7K, 28K | 4, 6, 8, 11 |
| Lucky streak | crit-tap odds, lucky-sale odds and Golden Hour frequency +20, +45, +80, +130, +200% | 350, 1.6K, 6.5K, 26K, 100K | 5, 6, 8, 10, 13 |
| Room for play | breaks held 8, 10, 12, 15, 20 | 120, 500, 2K, 8K, 30K | 2, 3, 5, 7, 10 |
| Quick breaks | a break returns every 90, 60, 45, 30, 20 minutes | 250, 1.2K, 5K, 20K, 75K | 3, 5, 7, 9, 12 |
| Studio notes | Inspiration per run +20, +45, +80, +130%, then +50% a level | 300, 1.5K, 6K, 24K, then x1.5 | 3, 5, 7, 10 |

The old ideas map onto the new levels on first load (Warm-up, Nimble paws and Steady hands are Warm hands 1 to 3; Fresh eyes and Quick keepers are Fresh eyes 1 to 2; Good stories and Bestsellers are Good stories 1 to 2; Room for play and Big break are Room for play 1 and Studio notes 1). Everything is additive inside a track and multiplicative with every other source, so a fully bought set is a large multiplier on typing, keepers and sales: the tail is the intended long-term sink for Inspiration.

## Letter garden rework (Oct 2026)
Untested by the bot; reasoned from the formulas.

| Knob | Value | Why |
| --- | --- | --- |
| Fields | one per owned typewriter, 1 plot each (Bamboo keeps 2), up to `PLOT_MAX` = 4; plot cost `[750, 2000, 8000]` base x `PLOT_SCALE` `[1, 4, 15, 60, 250, 1000]` | Harvests go to the plot's own machine, so the garden helps slow late machines instead of one shared pile |
| Experience | XP = base yield x (1 + 0.6 x machine index); field level = floor(sqrt(xp / 40)); head gardener level = floor(sqrt(total xp / 120)). Stored in `meta.farm`, kept through every Printing | Skill is the meta progression; plots and farmers are room items and are bought again each Printing |
| Level effect | letters x (1 + 0.12 per field level) x (1 + 0.03 per head level); growth time / ((1 + 0.06 per field level) x (1 + 0.02 per head level)); `GARDEN_DESK_YIELD` `[1, 1.3, 1.8, 2.6, 4, 6]` | Level 10 on Bamboo is about 2.2x letters in 0.6x the time |
| Farmers | tier 1/2/3 act every 12/6/3 s (harvest a ripe plot, else plant an empty one); need field level 1/5/12; cost `FARMER_BASE` per machine x `[1, 6, 36]`. Plant the letter the goal is missing most, else the one the machine holds least of | One worker per field. They also finish whole crop cycles while you are away |

## Legacy stars, x10 scale (Oct 2026)

Stars are counted in tenths of the old unit (`Economy.starScale = 10`). Saves written before this convert once on load (`legacy.k`): stars, total, the Imprint baseline and the Estate baseline are multiplied by 10.

| Thing | Value |
|---|---|
| Stars for a press | `floor(10 × sqrt(run earned / 12.5M))`, first press needs 12.5M bananas (10 stars) |
| Income per star | +0.2% (was +2% per old star, same total) |
| Imprint / Estate thresholds | 600 and 3,600 awarded stars (were 60 and 360) |
| Seed Money | 10 / 30 / 80 |
| Veteran Crew | 30 |
| Printing Press (typing +10%/lv) | 10 levels, 20 × 1.42^lv |
| Quick Keepers (keepers +10%/lv) | 8 levels, 25 × 1.5^lv (new) |
| Prestige Imprint (income +10%/lv) | 10 levels, 30 × 1.45^lv |
| Golden Touch (+25%/lv) | 5 levels, 20 × 1.6^lv |
| Helper unlock (works, slowly) | hire 10, coach 15, shop 20, restore 25, net 30, garden 20, pitch 30, media 40, muse 45, print 60, challenge 80 |
| Helper speed levels 1-3 | 20 / 50 / 120 (every tiered helper, including garden, pitch, media and muse: 60s → 45 → 30 → 15) |

## The dopamine layer (Oct 2026)

Variable rewards and ceremonies on top of the existing juice. Only the first four change income; all are small.

| Thing | Rule | Effect on income |
|---|---|---|
| Lucky sale | Each sale that is not an away-sale rolls: Jackpot 0.4% (+900% of the sale), Bestseller 2.6% (+200%), Hot sale 9% (+50%). Selling by hand within 30s of the last sale adds 1.2% per chain step (max 6) to the hot-sale odds. Skipped during Small Crew mastery and A11. | about +13% of title-sale income |
| Crit tap | 3% of manual taps type 5 letters instead of 1 (not in No Hands) | about +12% of manual typing |
| Inspired typist | One random typist every 70-180s (first after 50-110s): 2.5x speed for 14s, glowing and announced | about +1% of typist output |
| Golden Hour | Every 5-10 minutes: 20s of Frenzy and Golden Keys with no streak | small, active play only |
| Magnitude ceremony | First time the counter reaches 1K, 10K, 100K ... a stamp and a rank (Banana Intern ... Infinite Monkey). Stored as `stats.mag`, so it only fires for a new best | none |
| Buy chain | A purchase within 3.2s of the last one climbs the chime a note; stamps at x5, x10, x20 | none |
| Sale chain | CHAIN x(n) pops on hand-sales in a row | none (odds only) |
| Awards | Bronze chime, silver confetti + fanfare, gold full-screen burst; +1% income flies into the counter. Diamond Bananas from awards fly into their chip | none |
| Press, Break Room | Stars and Inspiration fly into their chips | none |
| Near-complete | Bars and the Goals tag throb at 90% | none |

## Muses added Oct 2026

Six muses tie the guest list to other systems. Costs are base bananas (scaled like the rest).

| Muse | Cost | Effect |
|---|---|---|
| William Shakespaw (`shakes`) | 11,000 | crit taps x2 (3% -> 6%) |
| Charles Chimpens (`chimpens`) | 25,000 | commissioned pitches sell x1.3 (inside `salePay`, so the Muse director sees it) |
| Homape (`homer`) | 45,000 | typist XP x1.5, online and away |
| Beatrix Potape (`potter`) | 85,000 | garden harvests x1.5 |
| F. Scott Fitzgerape (`fitz`) | 160,000 | Publisher's assistant period /2, online and away |
| Lewis Carrolangutan (`carroll`) | 300,000 | lucky-sale odds x2 (hot sale 18%, bestseller 5.2%, jackpot 0.8%); still skipped in mastery/A11 |

Untested by the bot; still three seats.

## Endgame scale: no caps (Oct 2026)
The ask: late game should feel like an industrial empire, so nothing should stop growing, every purchase should cost more as you go, and the early machines should still matter. Every number below is a `TUNE` key unless noted.

| Thing | Rule | Notes |
| --- | --- | --- |
| Pitch agency (`S.pitchteam`, now 0 to 3; older saves hold `true` = 1) | Tier 1 Pitch assistants 250K (as before: a crew banks words for pitches). Tier 2 Commissioning desk 3M: also commissions (keeps 3 open) and sells pitches, so it is Auto-pitch without the Imprint helper. Tier 3 Syndication 60M: sells twice as fast and works away at full pace | Costs are base bananas, times the 25 scale like every price. The desk ignores the market when it picks an offer and scouts a fresh set (once per 5 s) if none fits the machines owned. Sold pitches pile up at this speed, so past 160 sold the oldest are folded into one shelf total (`S.pitchShelf`: count capped at 500 for gates, full pay for royalties) and dropped from the recipe list |
| Agency levels (`S.agencyLv`) | After tier 3. +15% a level (`RUN_STEP`), and the whole thing doubles again at every tenth level (`RUN_MILE_MULT`): x1, 1.15, ... x8.1 at 10, x65 at 20, x530 at 30. Cost 20M x 1.55^level. Speeds the pitch crew, the open-commission target (3 + level/2, up to 8) and the sale pace | Sales per pitch: 6 s / 2 (Syndication) / speed |
| Press run (`S.pub.lv`) | After the Night shift. Same speed curve on the Publisher's assistant, cost 2M x 1.5^level; sells in passes of up to 12 a tick, with the fanfare (and the save it triggers) once per 1.5 s | Only the first sale of a pass is loud; the rest are silent sales (no log, no news) |
| Industry (`INDUSTRY_STEP`, `INDUSTRY_MILE`) | Every agency or press level speeds **every typewriter** by 4%, and every tenth level by a further x1.5 (x1.04^n x 1.5^(n/10)). It is part of `deskMk`, so typing, the away run and the reward basis all see it | This is the tie between the late game and the starter machine: level 30 is x3.2 x 3.4 = about x11 on Bamboo too |
| Keeper levels | Past level 6 every tenth level multiplies the period by a further 0.8 (`KEEPER_MILE`, `KEEPER_MILE_STEP`), on top of x0.95 a level; floor 0.004 s | Bulk path: a keeper quicker than 20 ms, or a pitch crew past 2 words a tick, banks all it owes in one `keeperBulk`/`subBulk` call |
| Quick fingers | Every tenth level past level 10 is a further x1.25 (`FING_MILE`, `FING_MILE_STEP`) | Level 40 on Bamboo: about x86 typing speed |
| Bulk typing (`BULK_PRESS` = 6) | A desk whose typists press 6 or more times in one tick types its letters in bulk with the away run's letter mix (`offlineDist`): no per-key work, XP and stats still counted. Replaces the old cap of 8 presses per typist per tick | Without it fast desks wasted their speed. Spare ribbon, Typebar and Dictionary swaps are not applied in bulk (the away run does not apply them either) |
| Legacy tracks | Printing Press, Quick Keepers and Publishing Power run 60 ranks (`tail` in `LegacyB`): the listed ranks are unchanged (x2, x2, x1.5), then x1.5, x1.5 and x1.25 a rank at 2.2x the stars of the last. Prestige Imprint runs 40 levels (30 x 1.45^level) | A tuned track with no `tail` still stops at its own cap (the unit tests pin both) |
| Away | Away selling uses the same periods: press-run levels shorten `awayPubPeriod`, the desk commissions and sells pitches during the stretch (pitches only if no publisher is on), the per-stretch sale limit grows with the level (x1 to x20), and a pile of more than 24 sold titles is paid in about 24 credits instead of one each | A 2 h absence, four desks, 8 typists each: 184 titles with no agency, 280 (4 pitches) with Syndication at level 0, 314 (18 pitches) at level 10. Six full desks at level 30: 2,012 titles, 814 of them pitches, in 3 s |
| Restorations past Mk III | No last restoration. Each one past Mk III is x1.2 typing (Mk II and III stay x1.25 and x1.5) and costs 6x the one before (Mk II = base, Mk III = 12x, Mk IV = 72x, ...); sales +5% per level. The machine art and the stage CSS stop at Mk III; the name goes on (Mk IV, V, ...) | `MK_TAIL`, `MK_TAIL_GROW`. Auto-restore still stops at Mk III: the manual Restore button goes on |
| Shift crews (`up.shift`) | Training upgrade, needs all 48 typists on the desk (`PAW_MAX`). Each shift adds a twelfth of the crew's output with no desk and no monkey, and every tenth shift is a further x1.5: (1 + n/12) x 1.5^(n/10). Priced in that desk's letters like a typist hire would be at number 13, then x1.5 a level | Each shift is worth a twelfth of a crew however big the crew is, so past 48 typists it is the cheaper way to keep adding output |
| Coaching | No last level (`COACH_MAX` 1000). Up to level 10 it is +2% a level as before; past that every tenth level adds a further +10% (level 20 = +50%, 30 = +80%) | Auto-coach has no cap to hit any more, so it keeps spending its wallet margin |
| Media remasters (`S.divLv`) | Any division with a release can be remastered, with no end: x1.12 income a level and x1.5 more at every tenth level, price 8 x the division's release price at level 0 and 1.6x more each level. Part of `divUnit`, so the royalty tick, the film premiere, the away run and the cards all see it. Resets with the room | Level 10 is x4.7, level 30 about x100 |
| Letters spent in bulk | A training price over 2,000 letters is taken by levelling the biggest piles down together (the same result as one at a time from the biggest) instead of one letter per loop turn | Quick fingers at level 40 costs about 1e8 letters, which the old loop could not pay in a lifetime of frames |
| Typists a desk holds | 48 (`PAW_MAX`), up from 12. The first 12 hires cost x1.55 each as before; hire 13 onward cost x1.3 each (`PAW_LATE`), so the 48th on Bamboo is about 4e8 letters. Each is still a named monkey in the save (about 0.8 KB each; six desks of 48 measured at 50 KB of save) | The Train page draws 12 crew cards a desk and a "Show all" button; the stage draws at most 8 monkeys, as before |
| Typist levels | No last level: past level 10 each level needs 1.8x the xp of the one before (level 11 at 19,800 xp), +4% typing a level as before | `levelOf`, `lvlXp` |
| Words per second | Each desk counts the words it banks over the last five seconds (live play only). Shown on the Floor page beside letters a second, and in the tooltip of the desk chip | `wordFlow` |
| Auto-remaster | After three hand remasters a switch on the Media page remasters for you: every 20 game seconds, up to three buys, the best income gain for its price, only while the wallet holds twice that price. Off while a challenge or Paper only is running | Not run away |
| Auto-restore | Now goes on past Mk III (the cap check is gone); the helper's own wallet buffer (2x, 1.75x, 1.5x, 1x of the price) is the brake | |

**Optimisation pass (typists).** Measured on the real game logic, six desks, 48 typists each, Quick fingers 25-50, keepers 30-50, agency level 10-25 (the heaviest build the game can reach): the tick went from 43 ms to 1.3 ms, and on the real page with a tab open 1.5 to 3.6 ms (all 48 crew cards drawn: 3.2 ms). What changed: typists' speeds read their shared facts (perks, drive, the sky, bonuses) once per tick (`speedContext`, only inside a tick, so nothing is stale after a purchase); `deskSpeed` sums a crew in one pass; `canWrite` stops at the first missing word instead of summing all of them, and checks the cheap things first; auto focus and the pitch goal check a title's desks from a cached list and walk the pitched titles (`GENS`) instead of the whole shelf; a pass of sales picks the next focus once; pitch sales rank the ready titles once a pass; bulk typing reuses a desk's letter mix for four ticks; the print-sample signature sums a crew instead of listing it. Two ticks of 16.7 ms is the budget; the tick is at 8% of one.


Measured with the real game logic (virtual clock, six full desks, 12 typists each, Quick fingers 50, keepers 50, agency level 25): the tick costs 5.7 ms where it cost 43 ms before bulk typing; 30 game seconds sold 65 pitches, three minutes 326 (242 folded into the shelf), and at agency level 40 with keepers at level 80 three minutes sold 1,163 pitches and banked 122K words. At agency level 0 on a mid build the desk is slow, as it should be: letters, not sales, are the limit.

Known edge: reward credits must be safe integers (about 3.6e14 bananas in one credit at the 25 scale). One away stretch can reach that only at roughly 1e11 bananas a second, so the next scale step will need split credits.
