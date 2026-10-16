# LG-05 Folio, Imprints and genres

2026-10-14, design r1. DOCUMENTS-ONLY PROPOSAL for parent review, then owner approval. The route receipt authorizes design only. Every new rule and number below is proposed.

## Preserved basis

Displayed Printing is `S.printing + 1`. Six typing desks cover 2-3/4-5/6-7/8-9/10-11/12-13 letters. Keep their prices, recipes, manual sales, Publisher, commissions, deals and category identities. Keep LG03 gates, earned tiers and eight challenges; PG production sets, shared training and opted-in capped royalties; minigame Inspiration and tree. No DB allocations, premium prices, new random rewards or economic retune here.

| Current source arithmetic | Value |
| --- | --- |
| Legacy costs, Seed/Crew/Speed/Sales/Golden | 12 + 2 + 30 + 35 + 12 = 91 stars |
| Five helper paid ladders before earned floors | 5 x [1+2+4] = 35 current stars |
| Lifetime Legacy income / completed Printing sale factor | `1+.02*legacy.total` / `1+.35*S.printing` |
| Current reset gain | `floor(sqrt(run.earned/12,500,000))` |
| Monetary units | `cash(n)=25*n`; letters/words/stars never scale |

## Folio first

Folio is a series workstation, separately identified as `folio`, available free at displayed Printing 4 with intro complete. Keep DESKS and `S.desks` length six. Folio has no typists, letter pool, Mk level, typing rate or machine-count credit. It assembles word-bank material from existing desks. Do not ship its navigation until binding works.

Ship exactly three series with three leaf recipes each. Choose two different leaves, arrange their reading order, then choose a binding reward. The material trade-off is short versus scarce words and cash versus targeted training letters. Reading order is expressive, with no hidden optimal order. Repeated words across selected leaves add their quantities. No duplicate leaf within a series.

| Series ID/name | Exact leaf text, each token once | Available with | Bind reward, choose one |
| --- | --- | --- | --- |
| pocket / Pocket tales | The ape. / The cap. / The sun. | Bamboo | 6,250 bananas or 250 letters |
| journey / Little journeys | Pan Wendy. / Gold pass. / Sweet fudge. | Required desks through Hibiscus | 12,500 bananas or 500 letters |
| wonder / Forest wonders | Alice tunnel. / Gorilla forest. / Captain whale. | Required desks through Lagoon | 25,000 bananas or 750 letters |

Leaf captions are exact recipes. All words occur in authored readers. Only selected leaves require their constituent desks owned. Pocket is reachable immediately on Printing 4 using Bamboo. Six bands remain supported; initial content needs three. No 14-letter vocabulary or new book catalogue.

Select series, two leaves and reward before production. Letter binding selects one owned typing desk and one A-Z letter, all letters identical, with an exact preview. Cash is fixed real bananas, unaffected by market, genre, multipliers or premium speed. Cash counts as ordinary run earnings, never as a title sale. Letters use the ordinary inventory path without counting as typing, taps or word-production awards. No books, editions or letters are consumed directly. Bind atomically consumes the summed banked words and credits the selected reward. Selection consumes/reserves nothing; no partial submission or cancellation refund exists.

While explicitly working on Folio, its aggregate missing words become the shared keeper/practice goal and protect missing ingredient letters under existing shared-training floors. Publisher pauses. Book word banking remains available. A pending manual book must be sold or explicitly returned before entering Folio; selecting a manual book exits Folio. Return to production restores the saved production-set policy. Do not rewrite PG collection/band/advance preferences. Paused keepers and original desk inventories still matter; other desks can donate protected surplus at the accepted training factors. No letter transfers for book production.

Bind once per series per Printing. Keep a three-entry completion map keyed to Imprint/local Printing, replaced after a successful reset, and a lifetime gallery. Detect Printing changes made while flags were absent. A stale second bind fails before debit. Completed recipes can be read/reordered freely without payout or cost. Rewarded replay requires another Printing. Next choose another series, a book goal or reset. Folio never enters RECIPES/RBY, written, editions, soldCount, pitchSold, royalties, deals, book awards or existing reward firsts. Emit a separate completion, never `sold`. No automatic bind.

Working mode never enables a disabled keeper, purchases upgrades or binds automatically. Its saved override applies to online and offline word banking on owned desks, and pauses Publisher in both paths; leaving work restores ordinary book targeting. Offline progress can finish ingredients but cannot issue a binding payout.

## Found an Imprint

Show a quiet Legacy preview at displayed Printing 8, even below 60 lifetime stars. Eligibility requires intro complete, displayed Printing >=8, lifetime `legacy.total >=60`, no active challenge, no unsettled save/reward/minigame transaction, and at least 60 newly earned Legacy stars since the last foundation. This resolves the master's visibility/eligibility ambiguity as a proposal. Existing code implements neither Imprint gate.

Let T be lifetime Legacy stars already awarded, B the last-foundation lifetime baseline, initially zero, and D=T-B. Gain `floor(sqrt(D/15))` Press Seals. Unclaimed `starsNow()` is excluded: print first to award those stars. Retaining T cannot repay a foundation; successful founding atomically sets B=T and returns local displayed Printing to 1. Require D>=60 every time. Current unspent stars are never the threshold. Spending on the 91-star tree or 35-star helper branch cannot lower T or D.

| D awarded since foundation | Seals this foundation | Interpretation |
| --- | --- | --- |
| 60 | 2 | First eligible foundation |
| 120 | 2 | Twice the stars does not double currency |
| 135 | 3 | Next integer threshold |
| 240 | 4 | Four times the stars, twice the currency |

Keep current Legacy stars, lifetime total and purchased Legacy upgrades. Reset the room, local Printing multiplier and run earnings. This preserves earned investment while restarting production. Show the exact lost room and retained items before confirmation. Do not cash out an unfinished run or convert it to extra Seals.

| Permanent purchase | Seal cost | Exact benefit |
| --- | --- | --- |
| Genre press | 1 | All six genre choices, one choice per Imprint run |
| Folio charter | 1, requires Genre press | Folio accessible from displayed Printing 1 after foundation |
| Mixed shelf | 2, requires Folio charter | Three curated genre slots and the combo rule below |

Parent-review proposal for the universal first-clear rule: the first successful foundation also creates exactly one existing Letters L tier0 claim, ID layer:imprint:first. Lock floor(max(50,min(5000,180*rate))) from the projected post-reset productive basis on starting Bamboo before publication, using a narrow candidate-state sampling seam. Deliver through existing prepare/commit/Retry; the locked descriptor survives reload and later founding never repays it. No DB allocation. Founding stays unavailable until this mapping and candidate-state sampling are implemented together with the reset. This new amount rule requires owner approval with Group B.

The first two Seals buy Genre press and Folio charter, immediately adding a genre decision and early Folio work. Purchases are manual, once-only, acknowledged; no automatic purchase or income-per-Seal multiplier. Until Genre press is bought the room is neutral. First genre choice is free and locked for that Imprint; later founding includes the next choice. Ordinary Printing keeps it. A later mixed shelf purchase is an explicit next goal.

| State | Ordinary Printing | Found an Imprint, proposed |
| --- | --- | --- |
| Bananas, run earnings | Existing seed/reset | Wallet reset then existing Seed Money; run earned zero, seed excluded |
| Desk ownership, crew/traits/coaching, upgrades/Mk, letters/trays, words | Existing reset | Same reset to starting Bamboo; no seventh desk |
| written / editions / pitches | Existing edition rollover; pitches retained | Rollover written into editions once; clear written; retain pitches and IDs |
| Local Printing | Increment | Zero internal, displayed 1; archive highest Printing separately |
| Current stars / lifetime stars / Legacy ups | Retain plus existing gain | All retain; no extra stars; baseline T updated |
| Helpers, levels, earned floors, preferences | Retain, reset cadence | Retain; eligibility gates still apply; clear cadence/live pickups |
| chDone, mastery records, awards, stats/looks | Retain | Retain; no first-clear reissue; active challenge blocks founding |
| Claims, locked descriptors, stored golden rewards | Retain | Retain unchanged; settle prepared work first; clear active transient buffs only |
| DB earned/bought/spent, premium ownership, receipts/settings | Retain | Retain every entitlement, capacity and ledger; no DB grant |
| Minigame Inspiration/fraction/tree, attempts/refill/session IDs | Retain | Retain, no refill or free attempts; active saved break blocks founding |
| PG band/collection/advance, training preference/reserves | Retain; clear manual override | Same; no temporary Folio override survives |
| Folio selections/current completions | Clear proposed run fields | Clear; lifetime gallery and genre stamps retained |
| Seals, purchases, Imprint count, genre shelf | Retain | Add Seals/count, retain purchases/stamps/shelf; select next genre |
| Garden crops, Muse invites/seating, divisions, deals, Shop/pub/lamp/market | Existing room reset | Same reset; premium bed/seat/lamp entitlements still apply |
| Intro/daily history, best streak, historical totals | Existing retained fields | Retain; do not repay daily or lifetime claims |
| Unknown optional fields | Preserve | Preserve verbatim; unsupported owned namespaces block action |

This is a voluntary layer reset, not Settings full reset. Existing premium full-reset policy is untouched.

## Genres and mixed shelves

Genre affects existing fallback letter draws, band rights and a seated Muse fit. It never filters title eligibility. In the following table boosted letters receive weight x1.25; every other letter x1.00. For base F and challenge modifier C, probability is `F[ch]*C[ch]*G[ch]/sum(F*C*G)`. Apply once to fallback and vowel-only weighted draws online/offline. Preserve existing practice/completer probabilities and trait effects. All weights remain positive, including Vowel Drought's x.35 vowels. No new reward draw.

| Genre | Boosted letters | Neutral denominator, base sum 100.5 | Rights bands x1.15 | Fit Muse | Safe text example |
| --- | --- | --- | --- | --- | --- |
| Mystery | CDELN | 108 | 4-5, 6-7 | christie | The lost hat was under the map. |
| Romance | AEHRT | 110.75 | 2-3, 4-5 | austen | Two shy apes share a picnic and a kind note. |
| Sci-fi | JKQXZ | 101 | 10-11, 12-13 | tolken | Our moon robot grows a pea. |
| Horror | GHOTU | 107.5 | 8-9, 10-11 | poe | The attic ghost just wants a warm hat. |
| Comedy | BFMPY | 103.125 | 2-3, 8-9 | twain | The mayor slipped into a tub of jam. |
| Poetry | AEIOU | 110 | 6-7, 12-13 | dick | Rain taps; leaves clap; we nap. |

All other bands get x.95 rights. Here rights means the title-sale demand multiplier only; existing DEALS purchases, royalty rights and their prices remain unchanged. Apply after existing market floor to title sale only, with existing rounding once at the end; show the effective quote. Genre changes no base royalty/deal/PG03 factor. Example mystery C probability is 3.75/108=3.4722%, versus 3/100.5=2.9851%; E becomes 15/108=13.8889%. Genre fit adds x1.05 title-sale income when the listed Muse is actually active in a usable seat, once maximum, without changing its original perk or price. No minigame is required.

Completing any Folio series stamps the active genre permanently, once per genre. Pre-Imprint completions stay neutral; no retroactive genre assignment. Mixed shelf manually seats up to three distinct earned stamps. Three different stamps give +5% title sale; any complementary pair gives another +5%: mystery+horror, romance+poetry, sci-fi+comedy. These bonuses add, cap10%, then multiply existing sale factors. Two complementary stamps give5%; three without a pair give5%; three with a pair give10%. No extra per-copy/stamp power. Slots are freely rearrangeable, persist through Printing/founding, and affect neither royalties nor Folio payouts. Choose current genre for production/rights or for a missing complementary stamp.

Mystery uses puzzles without crime threats; romance uses friendship, kindness and optional innocent crushes without sexual content or coercion; sci-fi uses helpful inventions; horror uses funny pretend spookiness with safe endings, no gore, death threats or jump scares; comedy avoids cruelty; poetry uses nature and wordplay. Examples illustrate tone, not additional recipes. No chat, links, ads, gacha or countdown offers.

## Walkthrough and automation boundary

On Printing 4, open Folio, choose Pocket's The ape/The cap, choose 250 A on Bamboo, and Work on series. Need THE x2, APE x1, CAP x1. Bank them, bind, receive exactly250 A, then return to the production set or choose Journey. Words vanish; books and soldCount do not change. Save/reload retains completion. At Printing8/T60/D60, found for2 Seals, buy both first purchases, choose mystery. Printing1 now offers Pocket. Bind it for the first mystery stamp. A later romance/poetry Imprint can supply a complementary shelf choice. There is no calendar claim.

Later A6/A7/A8/A9 gates are founded Imprints1/2/3/5 plus retained manual predecessor records: harvest/replant one bed; commission/sell one pitch; release one manuscript; change a Muse seat twice. Record acknowledged actions, no guessed backfill. Base cadence60 active game seconds, one action, default Off, no offline actions. A6 repeats the same letter/desk in one bed; A7 picks cheapest wanted band from existing offers/fees, no repitch; A8 releases the next eligible manuscript in existing catalogue order, interpreting master 'oldest' without invented timestamps; A9 re-seats owned Muses to maximize next-sale fit, retaining seats on ties. Paid actions spend <=5% wallet. Preserve manual locks/challenge restrictions; no free materials/invites/releases.

Propose four additional challenges at Imprint1/displayed Printing5 with existing >=1-star next-Printing entry: Hand-planted, disable A6,6 progression sales; One brief, at most one unsold pitch,8 sales; Paper only, no media releases,8 sales; Fixed cast, no seating changes after first sale,8 sales. Each first clear raises its corresponding A6/A7/A8/A9 level to at least1, cadence45s, never bypassing its base gate. Higher levels retained, no refunds. No new stars/DB; grant the existing locked Letters L tier0 once under distinct first-clear IDs. Old eight/ch4/68 awards/109DB stay unchanged. These are proposed constraints, not implemented content. The named helper rules,60/45-second cadences and four constraint designs remain draft candidates outside Group C approval. Final action quotes, challenge enforcement and remaining tier catalogue/costs require a separate small design lease and explicit owner approval before helper code. Bronze/silver/gold mastery remains staged before gold-dependent A11.

## Implementation leases after approval

1. Folio: new folio.js, narrow Ops focus/protection/bind/reset and Rewards coordinator seams, ops.css; register in both editions/tools/balance.html/sw.js with cache bump. One Ops owner. Optional version1 `meta.folio`, default-off `lg05folio=1`; require acknowledged Rewards owner. Missing fields retain legacy behavior; absent flag preserves dormant data without effects. Atomically commit inventory/reward/completion; stale/failed writes leave live values unchanged with Retry. No generic rewardCommit use.
2. Imprints and genre effects: new layers.js with optional version1 `meta.layers`, narrow Ops reset/retention/frequency/sale seams and Rewards coordinator extension. `lg05layers=1` requires Folio and save ownership. Include functional Genre press/charter, online/offline normalization and first benefit before exposing founding. Settle away work, revalidate, persist whole candidate wallet/state before publication. Never mutate doPrint then save. Unsupported data blocks without erasure. No economyVersion bump or extra speed hook.
3. Mixed shelf: extend layers.js/stamp UI. Separately lease helpers/challenges in automation.js/Ops/Rewards after detailed design. Register scripts in both shells/balance/SW. No backend, dependencies or build.

Both styles use existing panes: More > Folio > series > leaves/reward > work > bind preview; Legacy > Imprints > loss/retain preview > confirm > purchases/genre; Folio > genre shelf. At360x560 use one column, internal pane/modal scrolling, >=40px controls and visible Back/Return. Pixel uses existing square typography; Classic existing rounded cards. No art, redesign, body scroll or effects required; honor Low/reduced motion.

Per lease: syntax, one controlled unlock/use/save/reload, one duplicate or refused-write path, short economy smoke/default control when Ops changes, and affected both-style360 views. Reset lease additionally compares this retention table. Genre lease checks normalized positive odds and identical online/offline modifiers. No broad campaign. LG13 owns natural pacing, tuning and free/premium six-week/55%/80% acceptance. Candidate levers are series quantities/payouts, Seal divisor/thresholds and genre strength; none retunes current systems here. Historical Regular timings do not prove this combined prototype. Q5/Q6/Q8/Q9/Q10 remain open.

Current disposition2026-10-14: owner APPROVED GroupsA/B/C including parentclarifications, receipt evidence/LG-05/owner-approval-abc/receipt.json. Foliofirst under LG-05A-folio.md; Imprints/genres/mixedshelf separate laterleases. Draftlaterhelper/challenge details excluded; no defaultactivation/commit/deploy.
