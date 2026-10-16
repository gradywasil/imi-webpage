# LG-03F owner review

Documents-only proposal, 2026-10-14, long-game. Base A1-A5 are locally accepted; LG03 remains incomplete until earned tiers and four additional constraints are implemented and accepted. Current disposition: both packages OWNER APPROVED 2026-10-14, under the staged leases clarified in LG-03F-parent-review.md. Receipt evidence/LG-03/owner-approval-tiers-constraints/receipt.json. Sources are current dirty-worktree files, not a committed release.

## Choice 1: tiers first

Recommend incremental prices **1/2/4 Legacy stars per helper**, three earned upgrades beyond free base, four levels total. Reject the earlier 1/3/8 candidate for this skeleton. Current Seed Money costs 1/3/8, Veteran Crew 2, Printing Press 2/4/6/8/10, Prestige Imprint 3/5/7/9/11 and Golden Touch 2/4/6. Their total is 91 stars. All first levels cost 10. One-star Printing plus Vowel Drought's first clear yields 4 stars: Seed Money plus Veteran Crew leaves 1, enough for one automation upgrade. The four old challenge firsts yield 16 stars total. Old automation pricing consumes 12 per helper, 60 across five, versus proposed 7 each, 35 total. All five first upgrades still compete for 5 stars. Prestige earnings for 1/2/3 stars require 12.5M/50M/112.5M bananas in one run. These are arithmetic comparisons, not pacing claims.

| Helper | Free / upgrade 1 / upgrade 2 / upgrade 3 |
| --- | --- |
| A1 hire, A2 coach, A3 shop | 20 / 15 / 10 / 5 active game seconds |
| A4 restore | Wallet >= 2 / 1.75 / 1.5 / 1 times current price; retain 20-second clock |
| A5 net | 60 / 70 / 80 / 100%; separate ordinary and golden streams |

All accepted base gates stay. Levels retain through Printing; full reset clears them. Spend only current acknowledged stars, never lifetime total, bananas, DB or Inspiration. Extend the narrow acknowledged Ops candidate write to atomically debit stars and raise exactly one expected level. Recheck gate, ownership, expected level, balance and pending state. Refusal publishes neither debit nor level; duplicate/stale requests do nothing. Retry revalidates, never blindly repeats a debit. No transaction framework.

A5 uses denominator 10 for each kind independently. C means select, S skip. Exact sequences are base `CSCSCCSCSC`, upgrade1 `CCCSCCSCSC`, upgrade2 `CCCCCCSCSC`, upgrade3 `CCCCCCCCCC`. Base repeats the accepted five-slot sequence twice. Convert each legacy phase p=0..4 to phase p, not 2p; this preserves its next base decision. Thereafter persist phases 0..9. Upgrades preserve the exact next phase, never modulo-reduce or reset it. Commit phase-format conversion with the level write. Cancel live references on upgrade; previously admitted/skipped/cancelled items cannot return, and consumed slots are not refunded. Admission still acknowledges phase before selection, separately from star spending. Retry saves state only, never claims. Keep the one-second manual-first delay, actual eligible instances, existing golden routine and two-item budget. No new RNG or timers.

Keep reserves, protected shared-training ingredients/donors, manual prices, coach XP-first ordering and <=5% cap, shop strict <10% cap, active-only/no-catch-up clocks and fair one-purchase-mutation scheduler. PG-03A royalties remain unchanged.

## Choice 2: constraints next

Propose all four selectable at displayed Printing5, intro complete, through the existing next-Printing entry and >=1-star reset requirement. Each starts a fresh run; restrictions apply to manual and automatic paths, including offline simulation and Legacy starter grants. New IDs below are proposals.

| Proposed ID/name | Restriction and first-clear target | Once-only retained automation benefit |
| --- | --- | --- |
| smallcrew / Small Crew | At most 2 typists per desk; sell 6 progression titles | Set A1 level to at least upgrade1 |
| quietshop / Quiet Shop | No hold/contracts/metro/dbl/agent/analyst acquisition or effects, including Veteran Crew's Hold; sell 6 | Set A3 level to at least upgrade1 |
| patientpress / Patient Press | Publisher disabled; manual title selling allowed; sell 8 | Set A2 level to at least upgrade1 |
| baremetal / Bare Metal | No Mk II/III restoration; sell 8 | Set A4 level to at least upgrade1 |

These direct level floors are tools earned from challenges, not transferable entitlement currency or a fifth Rewards kind. They never bypass base gates, refund stars, stack after purchase or pay again on replay. Propose zero new challenge stars. For the unresolved universal first-clear payout, smallest recommendation is one existing Letters-kind reward using its current formula and 50-letter floor per new first-clear ID, subject to owner approval. No new DB allocation; existing 109 DB stays fixed.

Targets use existing soldCount: distinct current-run authored plus pitched sales, excluding kids/library, not authored-only or lifetime sales. Recipes allow 10 authored titles with two desks: first six need <=3-letter words, next four <=5. Haiku's 10 is reachable; proposed old gold18 is not authored-only reachable. Pitches provide renewable distinct recipes within owned bands; eight is the concurrent unsold commission cap, not lifetime sales. Band0 has valid templates without adverbs, so two-desk pitches remain structurally available. All four new restrictions leave typing, keepers, desks and commissioning available. No completion-time promise follows.

Recommend explicitly staging bronze/silver/gold for separate owner approval after eight first clears work. Do not adopt 6/10/14 or old goal+4/+8 now. Existing clears stay ordinary clears, without invented historical medals. LG03 skeleton acceptance would require this staging disposition; mastery remains recorded future work.

Preserve vowel/haiku/hands/timed IDs, 6/10/8/8 goals, Deadline20 minutes, perks and 3/4/4/5-star firsts; Rewards firsts remain 5/7/7/9 DB. Keep 68 award names/+1%, historical ch4 requiring exactly those four IDs, and existing goal/reward identity.

Future leases: tiers owns automation.js and narrow Ops acknowledgment/quote edits plus sw.js and slice evidence. Constraints follows accepted tiers, owning narrow Ops definitions/restriction paths, automation level-floor handling, explicit Rewards Letters mapping and sw.js. No other files without a revised lease.

Verification checklist: source-bound syntax; unlock/use/reload/Printing; one refusal/duplicate spend; independent A5 phase/upgrade/Retry without resurrection; protected training/XP-first/fair service; reachable challenge sales and replay refusal; old ch4/rewards/default control; short enabled smoke and affected Pixel/Classic smallest-phone inspection. No checks run here. LG04 follows accepted LG03. Folio/genres/Estate and 55%/80%/six-week LG13 work stay later.

1. Approve 1/2/4-star upgrades and the exact tier/phase policy for tiers-first implementation?
2. Approve the four constraints, level-floor benefits, existing Letters first-clear mapping and explicit mastery staging for the next separate slice?
