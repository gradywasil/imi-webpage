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

- A keeper only banks words the goal needs, and only at its own pace: **`KEEPER_PERIOD`** = seconds per banked word per desk, `[0.6, 1.2, 2, 3, 4, 5]`. Muse "hemi" doubles the rate. `keeperBulk`/`simulateAway` use the same period scaled by the away efficiency (`eff`, 0.4 at base), so offline banking is the same ballpark as online: a 2-hour test with a keeper stack target of 1000 (so the keeper never runs out of work) banked 1,946 words online and 838 offline, 43% of online at `eff` 0.4.
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
| `PUB_COST`, `PUB_PERIOD` (new) | n/a | bananas [6000, 50000, 350000]; seconds [12, 6] | Publisher's assistant, Shop > Market tools. Tier 1 sells a ready title every 12 s (needs 3 sold titles), tier 2 every 6 s, tier 3 also sells while away at market x1.0. Task 11 |
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
| Keeper speed | no cap; x0.9 period to level 6, then x0.95; cost x1.8 to level 6, then x1.45; period floor 0.05 s (`KEEPER_MIN_PERIOD`) | The tick banks four words at most, so 0.05 s is the real ceiling |
| Pitch assistants (`S.pitchteam`) | 250,000 base bananas, needs 3 sold titles | A second crew per desk banks words for the best commissioned pitch that is not the goal, at `SUB_SLOW` = 2 keeper periods per word. Also runs while away |
| Carbon paper (`S.carbon`) | 1,500,000 base bananas, needs Honeycomb Ledger | Banking a word no longer takes its letters. Training keeps back only one copy of each letter the goal needs |
| Shared training `factors` | `[1, 8, 28, 90, 280, 900]` (was `[1, 4, 8, 16, 32, 64]`) | About 1.5x the PAW_BASE ratio of each machine. A full set of upgrades on desk 3 is about 98k letters x 90, so an 8-hour stockpile (a few million) funds the first levels at once but not the last |
| Break Room games | 14 games, 5k to 64M base bananas, bought in order | Each game owned adds 1 Inspiration to a full first minute of a rewarded break (base 10) |

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
