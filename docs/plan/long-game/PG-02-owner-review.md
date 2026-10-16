# PG-02 owner review

Documents-only candidate, 2026-10-14, `long-game`. The owner approved protected shared-training direction, not prices or implementation. Recommend profile `pg02-r1` below for optional playtesting after a separate price decision. No final-price, production-rate or six-week pacing claim follows from this arithmetic.

## Candidate costs

Keep Bamboo's current costs. For later desks multiply every unrounded letter-priced Train cost by the exact desk factor below, then apply `Math.round` once per purchased level and sum those integers. Never multiply an already rounded local price. These are fixed coefficients, deliberately rounded near `8 × sqrt(desk purchase price / Hibiscus purchase price)`. Eight is the proposed startup coefficient; the table, rather than the approximation, defines the profile. Banana prices supply dimensionless ratios only. No currency conversion exists.

For hire exponent `l`, use `PAW_COST[i] × (1 + 0.35i) × factor × 1.55^l`. Bamboo uses current paws as `l`; later desks use `max(0, paws - 1)` because desk purchase supplies one typist. For other items use the listed base times growth at the current item level. Existing levels count normally when opting in, with no refund or catch-up grant.

All numbers below are letters. Upgrade columns are proposed level-zero bases. Local hire shows the old rounded first hire; Bamboo's is its first typist, others their first extra typist.

| Desk | Factor | Local hire | Proposed hire | Quick fingers | Rapid touch | Vowel rhythm | Fresh ink | Recipe practice | Stock-aware ink | Spare ribbon | Full Mk I basket |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Bamboo Classic | 1 | 100 | 100 | 40 | 75 | 30 | 40 | 100 | 80 | 150 | 53,211 |
| Hibiscus Ribbon | 8 | 47 | 378 | 320 | 600 | 240 | 320 | 800 | 640 | 1,200 | 232,022 |
| Lagoon Sprint | 25 | 85 | 2,125 | 1,000 | 1,875 | 750 | 1,000 | 2,500 | 2,000 | 3,750 | 936,238 |
| Honeycomb Ledger | 90 | 144 | 12,915 | 3,600 | 6,750 | 2,700 | 3,600 | 9,000 | 7,200 | 13,500 | 4,548,512 |
| Orchid Imperial | 330 | 240 | 79,200 | 13,200 | 24,750 | 9,900 | 13,200 | 33,000 | 26,400 | 49,500 | 23,803,333 |
| Moonflower Grand | 1,160 | 385 | 446,600 | 46,400 | 87,000 | 34,800 | 46,400 | 116,000 | 92,800 | 174,000 | 121,307,785 |

Quick fingers grows ×1.6 to level 10; Rapid touch ×1.7 to level 8 and requires Hold. The other five use `[1, 2.5, 6, 24, 96]`, capped at level 3 on Mk I, 4 on Mk II, 5 on Mk III. Crew caps at 12 total, hence eleven paid hires after a later desk's starter. Full baskets include Hold-unlocked Rapid touch and every permitted level from zero, not banana purchases/restorations. Later desks retain meaningful increasing costs without exponential scaling by purchase price itself. Their affordability over time remains unmeasured.

## Bounded fixture

[evidence calculation](evidence/PG-02/design-r1/calculation.json) comes from the standalone bounded helper beside it, with no game imports or simulation. Hypothetical owned Bamboo/Hibiscus hold 19,000/20 letters, Hibiscus has its starter and zero upgrades, Mk I, Hold unlocked. This is not a recovered save. Assume the current title's missing words require already-held Bamboo `a:4000,b:2000` and Hibiscus `e:10`; all other held letters are surplus. These synthetic ingredient requirements are not an asserted actual recipe.

At 25%, reserves are 4,750/5. Combined protected totals are 6,000/10, leaving 13,010 spendable. First extra Hibiscus hire costs 378. Two extra hires plus Quick fingers 1 and Recipe practice 1 cost `378 + 586 + 320 + 800 = 2,084`, leaving three typists, 16,936 held, at least 6,010 protected and 10,926 spendable against the original floors. Its whole accessible basket costs 232,022 versus the old local 29,003. Even with zero ingredient protection, only 14,265 is initially spendable; even spending all 19,020 could not max that basket. No claim depends on reserve erosion between clicks.

## Protection and deductions

For the resolved active title, sum per-letter counts of each missing word times `max(0, recipe need - banked stock)`, assigned by original word band. Protect `min(held[ch], required[ch])` in each pile. Do not protect only the residual letter deficit or keeper `oneCopy`. Missing, unheld ingredients cannot be reserved in inventory.

For each owned donor with held total H and configured reserve r, set aggregate floor `max(sum(protected piles), ceil(Hr/100))`. Ingredient letters count toward the percentage floor; adding both would double count. Spendable is H minus that floor. Auto-hire Off donors still donate above their floor; Off disables automatic hiring, not donation. Use the saved reserve, default 25%, for every donor including the target. Invalid settings suspend pooling.

Requote from current state immediately before spending. Within one Buy 1/10/Max quote freeze donor floors, simulate deductions and stop before violating any pile or total floor. Choose the largest currently removable pile, ties by desk index then letter alphabetically; recompute after each deduction. Manual and automatic hires use the same price/protected plan. Max cannot bypass reserves; repeated separate actions recompute percentage floors. Refuse unowned recipients/donors, capped or locked items, unsupported state and insufficient funds; never deduct partially or create negative letters. Preserve existing automation unlocks, cadence and no-offline-hiring rule.

## Proposed later lease and decisions

After PG-01 handoff, bind its actual resolved-title interface; no API is specified here. Request one owner for a new pure training planner, narrow Ops quote/deduction/UI seams, optional acknowledged configuration, script/cache registration and focused checks. Keep pooling independently opt-in and default off; absent/disabled metadata retains local behavior. Preserve unsupported metadata without enabling it. No conversion/migration, inventory merging or global replacement. Book letters remain per desk, banked words unchanged, coaching/rerolls banana-priced and Inspiration minigame-only.

Two owner choices remain: approve this exact cost profile for an experiment; approve the described reserve/donation policy including Off donors and per-action recalculation. Future validation should cover the fixture, one refusal, default control, acknowledged opt-in/reload and both editions' affected controls. Runtime and long-horizon tuning remain deferred.

Source anchors: `ops.js` DESKS/PAW_COST/PAW_DESK_STEP/PAW_GROW; UPS/TIER/upLevel/upCap/upLock/upCost/upPlan/buyUp; buy desk; focusNeeds/stock/bandOf/takeLetter; quoteAutomationHire/hireAutomationOne; coachCost/rerollCost. `automation.js` setting/tick supplies default reserve and cadence. `economy.js` cash scales all desk prices equally. Authority: owner-refinements approval-r1 receipt, PG-00 review, PG-01 task and skeleton-validation-policy. Source hashes and named-anchor line references are recorded in evidence; PG-01 may change Ops after this snapshot.
