# PG-03 owner review: useful royalties

Documents-only proposal, 2026-10-14. Owner approved the exact prototype together with PG-03-parent-review.md. Receipt: evidence/PG-03/owner-approval-r1/receipt.json. Implementation is queued after the approved UI batch as a separate default-off playtest; final balance remains open. No economy code changed by this document.

## What the report establishes

600,000 cumulative sales and 7 bananas/second describe different quantities. Seven/second yields 25,200 per productive hour. Without the sales timeframe, save, Printing, shelf and multipliers, neither royalty share nor a defect is established. At an assumed 600,000 sales/hour, that rate would contribute 4.03% of sales-plus-royalties. That assumption is illustrative only.

## Current formula and prices

All amounts below are real bananas. `economy.js` defines `cash(n)=25*n`; fractional rates remain fractional, while payouts use 25-banana units.

In `ops.js`, `soldStats` sums current sold recipe pay into weighted shelf value W: authored and pitched titles count fully; kids and library titles count at 0.5. `royBase = W * 0.00001 * D * A * L * U`. D multiplies owned deals, including Book clubs' `1 + 0.03*soldCount()`. A is `1 + 0.01*awardCount()`. L is `(1 + 0.02*legacy.total)*(1 + 0.1*PrestigeImprintLevel)`. U is 1.25 with Austen seated, otherwise 1.

`editionMult = 1 + 0.35*S.printing` currently affects sales only. Sales also use market, contracts x1.25, restoration, sale Muses and the minigame sale bonus, then round to denomination. Royalties use recipe pay, not the credited sale amount. Good Stories, called God Stories in the request, remains intentionally sale-only.

Verified current DEALS, in order, with eligible sold-title gates: Reprints 62,500, gate 1, x1.5; Book tour 375,000, gate 3, x1.5; Translations 3,000,000, gate 6, x2; Book clubs 10,000,000, gate 9, +3% per eligible title; Film option 37,500,000, gate 12, x2. Kids/library never count toward these gates or club synergy; authored-only counts stay separate.

Shop displays `royBase`; shelf/Records display `royRate = royBase*passive()`. Passive is x7 during native or stored Rush, without stacking, and x0.5 during Bad Review. Actual online earnings integrate game-speed-scaled seconds and accumulate until denomination payout. Enabled Rewards integrates partial buff durations. Offline applies capped wall seconds times game speed, efficiency 0.4/0.5/0.6/0.7 by Lamp, plus 0.15 for Woolf, then floors payout. Earlier editions do not earn: Printing resets written shelf and deals; titles must sell again.

## Alternatives and recommendation

A flat base increase from 0.00001 to 0.00002 halves deal payback everywhere, but leaves royalties falling behind Printing's sales multiplier. Repricing Reprints to 31,250 halves its payback without improving unupgraded income. Sustained-sales scaling adds accounting and risks feeding passive earnings back into their own rate if total income is used.

Recommend one prototype: `Rnew = Rcurrent * 2 * (1 + 0.35*min(S.printing,7))`. Keep prices and every existing multiplier unchanged. The base coefficient becomes 0.00002; Printing catch-up stops at x3.45, so total uplift is bounded at x6.9. It depends only on completed Printings, never wallet, royalties earned or total income. Reinvestment can still accelerate purchases; it cannot increase this multiplier directly.

## Comparable arithmetic

Hypothetical fixed portfolios, not recovered saves. All other multipliers, speed and passive are 1; no deals owned, at least one eligible title. Sale flow is an independently assumed hourly benchmark equal to W times current sale edition multiplier. Hold that flow and shelf fixed across before/after. Share is royalties divided by sales plus royalties, excluding divisions/pickups. Reprints payback uses only its extra 50% royalties, not total income; no spending, growth or reset during repayment.

| Printing shown / S.printing | W | Assumed sales/hour | Royalty/s old -> new | Royalty share old -> new | Reprints payback hours old -> new |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 / 0 | 600,000 | 600,000 | 6 -> 12 | 3.47% -> 6.72% | 5.79 -> 2.89 |
| 5 / 4 | 6,000,000 | 14,400,000 | 60 -> 288 | 1.48% -> 6.72% | 0.579 -> 0.121 |
| 8 / 7 | 6,000,000 | 20,700,000 | 60 -> 414 | 1.03% -> 6.72% | 0.579 -> 0.0839 |

## Decision and future lease

Approve this exact capped x2 prototype for a later isolated implementation and playtest, or retain current royalties pending save/timeframe evidence. Recommendation: approve prototype, not final balance.

Future lease: one Ops owner after PG-01 releases it, royalty formula and directly affected rate copy only; no prices, sale formula, progression/category gates, persisted schema or activation changes. Preserve native Rush x7/15 seconds, stored Rush x7/15 game seconds and all golden effects/durations. Check bounded arithmetic, one controlled sale/deal/save/reload path, reset and offline rate parity in both editions, plus one duplicate purchase check and short economy smoke. Higher passive earnings may compress banana gates and income-scaled rewards/pickups. Estate Archive ownership/aging stays open for LG-07; six-week and premium pacing acceptance stays with LG-13.
