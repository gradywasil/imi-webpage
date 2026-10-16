# LG-00 independent acceptance review, round 3

Verdict: HOLD for full LG-00 acceptance. The repaired non-default-speed Deadline calculation and pickup implementation pass the exercised native/gameplay paths. I recommend accepting those repairs technically, subject to the small zero-duration API difference below. This is a review recommendation, not manager acceptance or permission to dispatch LG-01.

I completed the assigned review rather than stopping at the first discrepancy. Casual/Hardcore/Away completion, actual reduced-motion media, and the missing historical wallet artifact still require explicit disposition. No new player-facing production failure was reproduced in the supported welcome-back intervals. Production, tools, previous documents and evidence were read-only. Only this report and `evidence/LG-00/qa-r3/**` were written. No children, dependencies, branch changes, commits, deployment, user-storage cleanup or system-preference changes occurred.

## Ordered findings and required dispositions

1. **UNVERIFIED, three profile completion measurements remain incomplete.** Requirement: `LG-00-foundations.md:32,43`; outstanding gate: `LG-00-results-r2.md:84`. Expected: either measured defined endpoints or an explicit owner/manager decision about the incomplete measurements. Actual, independently read from the historical raw reports: Casual stopped at 33,608.34999999723 calendar / 376.3499999999864 active minutes at its 450-second guard; Hardcore at 3,861.3000000027537 / 501.29999999987274 at its 900-second guard; Away reached 43,200.000000004584 / 150.0000000000115, its thirty-day horizon. All three have `finiteComplete=false` and empty runtime/HTTP errors. Casual and Hardcore reached six desks and all four challenges, but not the defined final caps/Legacy endpoint. Away reached its first reset and Haiku only. Reproduction: inspect the three `repair-r2/{Casual,Hardcore,Away}.json` reports or run `qa-r3/audit.mjs` into a fresh output lease. `qa-r3/audit.json` preserves their complete endpoint maps. Guards are measurement limits, not game defects or finish times. The owner originally placed full multiweek profile acceptance in LG-13, while the LG-00 review brief added finite endpoints. The manager must either retain this gate and schedule bounded complete measurements, or ask the owner to explicitly defer the three full endpoints to LG-13 while accepting these LG-00 partials. I have not approved that deferral.

2. **UNVERIFIED, actual CSS/system reduced-motion behavior on this candidate.** Requirement: `LG-00-foundations.md:41`; relevant implementation: `core.js:9,107` captures the actual media preference, separately from mutable `IMI.reduceMotion`. Expected: real `prefers-reduced-motion: reduce` coverage of Core and CSS. Actual: both fresh editions and all six historical stable captures report `matchMedia(...).matches=false`. Runtime reduced=true and Effects Low=true produce a stationary pickup, and both editions fit all three sizes, but that does not exercise Core's captured preference or CSS media blocks. Reproduction: `qa-r3/{pixel-layout,classic-layout,native-runtime-low}.json` and `repair-r2/screens/stable/manifest.json`. T3 opened successfully and exposes no media-emulation operation; I did not switch browsers for that reason or change system preferences. Disposition: an explicitly authorized media-capable lane must test the actual preference, or the owner must explicitly defer that gate. No physical-phone, global 40px, whole-game animation or listening acceptance is inferred. The native save tab logged AudioContext autoplay warnings; no sound was auditioned.

3. **FAIL against the historical capture requirement, with functional save/load passing.** Requirement: `LG-00-foundations.md:26`; prior disclosure: `LG-00-results-r2.md:41`. Expected: a correctly versioned wallet artifact captured before editing. Actual: `before/old-save.json` contains unversioned `35525`; the correctly versioned `{economyVersion:1,score:35525}` capture was made later by replaying frozen Ops. Recomputing identities and repeating functional tests cannot repair that chronology. The mixed-format original remains intact. Fresh real Core play/pagehide-save/fresh-document reload retained the later fixture's wallet and namespaces. In the shorter native sample the wallet was 35,550 at observation, save and reload; `royTotal` increased from the fixture's 325 to 350, exactly accounting for the additional 25 during real time before observation. The longer native sample similarly retained 35,650. These are not relabeled as immediate 35,525 observations. Reproduction: `qa-r3/native-fixture.html`, `native-save-immediate.json`, `native-reload-immediate.json`, and `consolidated.json`. Disposition: the owner must explicitly accept this specific historical provenance exception or keep the capture gate failed. Do not invent a replacement pre-edit receipt.

4. **LOW, zero-second direct API calls do not conserve the original keeper minimum.** Locations: `ops.js:1428,1434,1441,1480`. Expected under the repair's literal original-batch-budget rule: the same keeper allowance for identical direct calls differing only in timed selection. Actual: at speed 2 with one staffed desk, active keeper, 100 each of A/B/E, target ABE=100, no sales, and `simulateAway(0)`, the ordinary path banks two ABE while the timed path banks zero. Both type zero and leave the same next RNG value. The timed Set collapses to `[0]`, so its loop never enters; the ordinary path still has its original one zero-length batch with minimum-two service. Reproduction: `node .../qa-r3/adversarial.mjs`, case `zero-away`; raw inventories and counters are in `adversarial.json`, independently classified in `consolidated.json`. This is not the previous positive-duration arithmetic defect: the tested positive intervals down to 0.01 seconds conserve work. Native `welcomeBack` rejects intervals below 30 seconds on visibility return and 60 seconds at startup (`ops.js:1581-1584,2831,2839`), and the profile runner skips nonpositive gaps. No player route to this edge was found. Recommendation: settle the exposed API's zero-duration precondition or add a narrow follow-up; do not silently claim every possible direct input is identical. Manager disposition is still required if the API contract includes zero.

Full reset is a **downstream LG-02 contract decision**, not another current loss finding. `ops.js:2769` clears `prem`/`meta` and invokes initialization; `ops.js:966` retains them through Printing. Native tests verified both behaviors. Permanent purchases do not exist yet. LG-02 must define preservation or recoverable ownership before enabling purchases.

## Full acceptance matrix

| Area | Result | Independent evidence and boundary |
| --- | --- | --- |
| Runtime/helper syntax and existing economy tests | PASS | Seven relevant JS syntax checks and all five existing economy tests; `consolidated.json`. |
| Source/evidence preservation | PASS | 1,085 historical artifact references across the original, r2-final and r3-sealed manifests recomputed without a mismatch; `preservation.json`. Current source identities also match. |
| Frozen default-one economy/RNG/timing | PASS | All 19 canonical comparisons re-derived from complete raw records, original raw hashes and both receipts checked, all 190 loaded identities checked; `audit.json`. Only the five original provenance fields are excluded. |
| Longer legacy comparison | PASS, audited existing sealed execution | Complete frozen/current 90-minute reports compared directly, with empty error lists; no new 90-minute run claimed. |
| Fresh empty-registration / speed-one / non-timed compatibility | PASS | Eight full selected results, including RNG and challenge state, compared to frozen r2; `compat.json`, `consolidated.json`. Non-timed speeds 0.5/1.25/1.5/2 are included. |
| Original positive-duration split-rounding regression | PASS | Independent uninstrumented six-desk publisher case produces 42/42, same inventories, XP, wallet and next RNG; `adversarial.json`. |
| Conserved production/inventory/keeper allowances | PASS for exercised positive intervals | Fresh 27-pair sweep plus 20 positive-duration independent pairs. Includes supplied ingredients, paused keepers, no crew, partial ingredients, focused work, many target words, incomplete intro, fractional batch boundaries and 300-batch transition. Zero-duration exception is finding 4. |
| Prefix cannot borrow future work | PASS for inspected formula and observed prefixes | Fresh sweep assertions reconcile counters, ingredients, cumulative typed/inventory/service floors and twelve-pass traversal with actual real-function calls. |
| XP/weather/dynamic-rate behavior | PASS within documented batching policy | Fresh owl/rainy cases cross changing skies and XP rates, retain identical end states/RNG without sales; positive-work XP guard checked. Rates/distribution are sampled at each original batch, not each inserted boundary. |
| Deadline success/failure and payouts | PASS | Fresh 11 uninstrumented chronology cases include early/late/already-expired/ready/newly banked/newly produced and just-before/exact/just-after eighth-sale boundaries; `chronology.json`. |
| Cold-start ordering and real caps | PASS | Fresh init-before-away receipt, 10,800 real seconds absent, 7,200 counted at both speeds, 7,200/14,400 game work; expired accelerated Deadline fails; `cold-timed-cap.json`. |
| Online production, world/daily, garden, buffs, keeper and premiere clocks | PASS for covered existing policies | All 22 fresh foundation cases pass with empty runtime/HTTP errors; `foundations.json`. Future Seasons/Commissions have no implementation. Existing offline premiere policy is preserved, not newly implemented or broadly approved. |
| Extension init/load/Printing/full reset/live getter | PASS for LG-00 contract | Fresh foundation save/load and unknown-field cases; native state replacement, ordered init/reset, duplicate rejection and namespace persistence; `native-lifecycle.json`. |
| Extension events, delegated action/render/afterRender | PASS | Native award observer sees the set flag, action increments current state, renderer and separate afterRender run; challenge/away hooks exercised by fresh clock cases. |
| Old save/default namespaces | PASS functionally | Frozen-old/current loaded fields compared in fresh foundation run; unknown loaded fields and optional namespaces survive save/reload. No migration/price change. |
| Actual Core wallet/native fixture | PASS functionally; historical provenance FAIL | Fresh isolated native Pixel play/Core save/Classic reload, exact royalty reconciliation; finding 3. |
| Native pickups 0.5/1/1.25/2 | PASS | Both editions, actual animation and real/game elapsed samples, original-element identity, 48x48 controls; `native-pixel.json`, `native-classic.json`. |
| Native mid-life provider changes | PASS | Both editions 2→0.5 and 0.5→2; additional Classic 1→0.5 near the old timer and 0.5→1; `native-default-transitions.json`. |
| Animation ends before slow lifetime | PASS for native pickup animation | Both slow moving pickups remain opaque after 15 real seconds while still connected; 14,000-ms animation duration retained. Default fill=auto; scaled fill=forwards. |
| Stale timers/elements and cancellation | PASS with visibility-test boundary | Forced real captured old timeout leaves replacement intact in both editions. Old clicks do not collect replacements. Collection, resize, tab/ineligible state and visibilitychange cancellation pass. A controlled hidden property rejects spawn; this is not physical OS visibility acceptance. |
| Pixel/Classic, three viewport sizes | PASS for bounded Floor layout | Personally opened six original stable images. Fresh dimensions match 1280x800/390x700/360x560 with no document scroll. No populated-stage or whole-game UI claim. |
| Runtime reduced flag / Effects Low | PASS | Both fresh layout sets true, stationary native pickup has zero animations. |
| Actual system/CSS reduced motion | UNVERIFIED | Finding 2. |
| Regular defined finite endpoint | PASS as audited historical applicable evidence | Sixteen authored IDs, four challenges, exact Legacy maxima, six desks/12 crew/Mk III/keeper 6/all specified desk training/lamp 3/publisher 3 independently verified. |
| Other three finite endpoints | UNVERIFIED | Finding 1. Bounded measurements are valid; full durations remain unknown. |
| Full-reset future permanent purchase rule | UNVERIFIED downstream | Must be resolved for LG-02, not a current premium implementation failure. |

## Arithmetic, instrumentation and default-path review

Current Ops SHA-256 is `ee1fb2d6a92d67964b4e1e2f446a063aee60fb87b235d0c4c17c7f25813de425`; pickups is `80b9a362be5a33a6a0f8e2f6453d21f7491f9f6778f27efa50ea80be2d3a37cc`; service worker is `imi-v14`. Native fetched bytes match these identities, and actual loaded `simulateAway.toString()` and `spawn.toString()` occur in those source bodies. The independent headless helper records loaded Ops response hashes without interception.

I read the sweep source transform before executing it. It wraps `keeperBulk`, calls its renamed original body with the same four arguments, and records the returned amount. It adds prefix snapshots and a time marker; it does not replace production, rounding, grants, bank consumption, sales or challenge decisions. The extra `sky()` read returns the active offline sky override. Snapshot serialization and trace pushes consume no RNG. The observed-source hash is separate from the production hash. The 21 independently authored differential cases request ordinary `/ops.js` without any transform, so conclusions do not depend only on those wrappers.

The typed allowance and each inventory Bernoulli draw are sampled once per original batch. The prefix typed floor uses the raw expectation, caps at the original rounded allowance, and releases the remainder only at batch end. Inventory cumulative floors depend on issued typed work. Independent inventory draws can legitimately total more or fewer letters than the typed statistic, so I did not incorrectly normalize those units. Keeper prefixes share the original ceil/minimum allowance and cursor/pass state. Focused banking still spends the numeric allowance; resumed general traversal cannot restart twelve successful passes at each sale boundary. Zero-production desks do not receive grantXp. The fixed-rate no-sale pairs preserve final inventory, bank, crew XP/level, wallet and next RNG; changing actual sales is allowed to affect later batches.

The independent focused fixture initially appeared unequal only because `JSON.stringify` retained different bank-key insertion order. `consolidated.json` compares the parsed states with deep structural equality and confirms identical values and RNG. That diagnostic is preserved and is not reported as an economy defect. The zero-away case remains a real difference.

For the fresh eighth-sale cases, Deadline remaining 119.999 game seconds fails with seven qualifying titles at decision, while 120 and 120.001 succeed with eight. All three still pay the eight real sales, 139,025 total. The seven-ready case pays 71,025. The newly produced successful case types 540,913, banks 2,263, sells 42 total titles and pays 31,285,025; the post-expiry case types 68,448, banks 845, sells 23 and pays 14,906,150 while failing the challenge. Total publisher sales and progression `soldCount` are distinct. The latter excludes kids/library titles and can include generated pitches; it should not generically be called authored-only. These receipts use actual game functions, not a payout reimplementation.

The r3 diff changes only `keeperBulk` and `simulateAway` within Ops. I recomputed identical bytes outside those two functions. `multiplier !== 1 && chal('timed')` at line 1430 excludes all default-one cases, including Regular's Deadline challenge. Without `work`, the indexed keeper traversal preserves the original word order, twelve-pass bound and early stop. The ordinary offline path retains the original arithmetic operation order, distribution draws, XP grant and keeper/sale order. Eight fresh direct compatibility selections and the nineteen raw-derived legacy pairs corroborate this inspection. Online tick, extensions, reset logic, rendering and the profile policy did not change in r3.

The 300 production-batch and 200-sale bounds remain. Timed capped weather samples the departure-start counted interval; ordinary weather samples the return-ending counted interval. That documented feature boundary is not falsely treated as a no-sale conservation failure when the sampled weather actually differs. The old speed-one goal-before-expiry weakness remains frozen. Offline premiere scheduling remains the prior policy.

## Historical duration and image applicability

The Regular run retains Ops `492797b34933346467ee00e9fae59a2c14971bf40da619115a078826c6d2e155`, seed 1, default speed and its original plain-bank profile policy. I verified all 139 checkpoint source identities, monotonic calendar/active time, empty errors, and cumulative away/reset/challenge prefixes against successive snapshots. The unchanged runner keeps one browser and has no save-only continuation path. The final report stops normally after the completion session. This supports the recorded uninterrupted trajectory; it is not a new-source execution.

The raw final state reaches all sixteen IDs from `readers.js` across `written`/`editions`. Legacy maxima are seed 3, crew 1, speed 5, sales 5, golden 3. Each desk has 12 crew, Mk III, keeper 6, fing 10, rapid 8, and vowel/ink/practice/stock/ribbon 5. Lamp and publisher are tier 3; all four challenge flags are true. These are the predeclared desk-training caps, not a claim that omitted per-monkey coaching, every award or every collection is complete.

Distinct milestones, in calendar / active minutes:

| Milestone | Historical measurement |
| --- | --- |
| All authored titles | 7,200.349999999195 / 300.3500000000555, about day 5 |
| Six desks | 9,120.016666664702 / 380.0166666666497, about day 6.33 |
| Full Legacy | 12,480.183333329329 / 520.1833333331889, about day 8.67 |
| Defined finite caps | 30,240.016666651896 / 1,260.0166666658495, day 21 plus one second |
| Final session stop | 30,259.99999998494 / 1,279.9999999991646 |

The unchanged speed-one code boundary, current profile/runner identities and fresh compatibility checks support applying this historical duration to the candidate. Repeating a 73-minute host run simply to attach a new hash would add little evidence. No new-source long trajectory was run. Day 21 is a cap-maxing endpoint, not proof of new unlocks continuing to day 21, nor acceptance of the future six-week/premium pacing plan.

I personally opened `repair-r2/screens/stable/{pixel,classic}-{1280x800,390x700,360x560}.png`. All six show the fitted zero-crew Floor. Their source remains historical `492797...`. Current CSS, shells, rendering and pickup source remain unchanged relative to that visual candidate; r3 only changes the two offline functions and service-worker version. That supports their limited visual applicability. Fresh DOM measurements independently confirm all six viewport/document dimension pairs. Native pickups measure 48x48; the historical touched Key guide is 40px high. No global target-size result follows.

## Execution and evidence

Servers 8148/PID 43468 and 8147/PID 78676 were revalidated as Python servers rooted in `C:/Users/arran/Projects/monkeyOS-v2`; see `qa-r3/servers.json`. The branch remained `long-game`. Existing external Puppeteer and Chrome ran the explicitly authorized headless economy lane. Interactive/native work used T3 `preview_status`, successful `preview_open`, and focused preview tools throughout. No fallback browser was used for missing media emulation.

New raw receipts are under `evidence/LG-00/qa-r3/`. `audit.json` records 702 checks; `consolidated.json` records 568 further checks with no failed assertions, while explicitly preserving the zero-duration diagnostic. `preservation.json` separately validates 1,085 historical artifact references, including prior failed captures. `manifest.json` binds the new evidence and report. Check counts overlap and are not claimed as that many independent gameplay scenarios.

Actual terminal commands, from the checkout root:

```powershell
$env:PUPPETEER_MODULE='C:/Users/arran/AppData/Local/Temp/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'
$env:LG00_URL='http://127.0.0.1:8148'
node docs/plan/long-game/evidence/LG-00/qa-r3/audit.mjs
node tools/long-game/verify-budget-r3.mjs sweep docs/plan/long-game/evidence/LG-00/qa-r3/sweep.json
node docs/plan/long-game/evidence/LG-00/qa-r3/adversarial.mjs
node docs/plan/long-game/evidence/LG-00/repair-r3/chronology-boundaries.mjs docs/plan/long-game/evidence/LG-00/qa-r3/chronology.json
node docs/plan/long-game/evidence/LG-00/qa-r3/foundations.mjs
node tools/long-game/verify-budget-r3.mjs compat docs/plan/long-game/evidence/LG-00/qa-r3/compat.json
node docs/plan/long-game/evidence/LG-00/repair-r3/cold-timed-cap.mjs docs/plan/long-game/evidence/LG-00/qa-r3/cold-timed-cap.json
node docs/plan/long-game/evidence/LG-00/qa-r3/consolidate.mjs
node docs/plan/long-game/evidence/LG-00/qa-r3/preservation.mjs
node --check ops.js
node --check pickups.js
node --check sw.js
node --test tests/economy.test.cjs
```

The foundation copy differs from the read-only original helper only in its output path. Use new paths or a new output lease to reproduce; the retained receipts must not be overwritten. The adversarial helper collects all cases before reporting differences and intentionally includes zero-away. The audit/consolidation helpers collect failures rather than stopping before remaining scope.

Native reproduction uses a fresh isolated preview at `/index.html?s=pixel#play` or `/classic.html?s=classic#play`, invokes `IMI.tour.skip()` in that fixture, then evaluates `qa-r3/native-driver.js` and later reads `qaNative`. The saved native receipts retain every fifth 200-ms sample, plus each final observation and change point. Timeout identity tests temporarily capture the real spawn timeout callback, clear its item, spawn a replacement, then call the captured callback and old element click. No production source was replaced. The extra provider-transition receipt covers the old 14-second default timer boundary explicitly.

Failed fixture/transport work is not hidden: `native-pixel-fixture-failure.json` records the initial tutorial eligibility block. The first `preview_evaluate` rejected trailing whitespace and was retried with trimmed text. An early same-origin save setup returned zero and is retained as `native-save-play.json` / `native-save-reload.json`; it is rejected setup evidence, not a passing wallet test. The successful loader uses the separate localhost origin, explicitly adjusts only the saved `lastSeen` to present time, and adds an unknown-field marker. A too-early evaluation during its redirect had no value and was retried after navigation completed. `native-network.json` has no captured HTTP failures or exception entries, but retains the save tab's autoplay warnings.

## Recommendation to the manager

Accept the repaired positive-duration offline conservation/chronology and native pickup behavior as technically supported by this review. Preserve the zero-duration API exception as a small explicit follow-up or contract decision. The tested default paths, extension seams and functional save behavior are supported. The Regular duration and six stable images can be used with their original identities and the limited applicability argument above.

Keep overall LG-00 and LG-01 dispatch on hold until the manager records the owner dispositions for the three incomplete profile endpoints, actual reduced-motion media and historical wallet capture. If the owner elects to defer a gate, name that exact gate and its later task; do not convert it to PASS. Carry the full-reset permanent-ownership rule into LG-02. No art replacement, factory-breakout scope, premium policy or long-game pacing waiver is authorized by this review.
