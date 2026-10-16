# PG-02 shared-training price decision

Documents-only parent recommendation, 2026-10-14. Protected shared training is the approved direction; exact costs and donation rules await this decision. PG-02-owner-review.md remains the original proposal. This document proposes a gentler experimental profile, not an unapproved code change or final pacing claim.

## Recommended initial costs

Use factors `[1,4,8,16,32,64]` for Bamboo through Moonflower. Multiply each existing unrounded letter-priced training level cost by that desk's factor, then Math.round once; sum rounded levels for Buy10/Max. Existing growth curves, levels, caps and unlocks remain. Bamboo is unchanged; later desks still start with their existing free typist. Coaching/rerolls and banana-priced purchases stay outside pooling.

| Desk | Factor | First typist purchase in letters | Whole zero-level Mk I training basket |
|---|---:|---:|---:|
| Bamboo | 1 | 100 | 53,211 |
| Hibiscus | 4 | 189 | 116,012 |
| Lagoon | 8 | 680 | 299,595 |
| Honeycomb | 16 | 2,296 | 808,624 |
| Orchid | 32 | 7,680 | 2,308,202 |
| Moonflower | 64 | 24,640 | 6,692,844 |

The basket includes every Mk I letter upgrade, Rapid touch with Hold unlocked, and hires to12 total typists, starting from the free typist on later desks. Restoration levels4/5 retain existing formulas multiplied by the same factor when unlocked. These are cumulative costs, not claims about how quickly letters arrive.

The original factors were `[1,8,25,90,330,1160]`, making Moonflower's basket121,307,785. We have no measured pooled-letter production curve to justify that steep increase. Even today's local Hibiscus basket29,003 exceeds the hypothetical19,020 combined stock. The gentler profile still increases later-desk costs substantially and gives a more useful first playtest.

## Useful startup without instant maxing

Reuse the original labeled hypothetical fixture: Bamboo19,000/Hibiscus20 held,25% reserves, and6,010 already-held ingredient letters protected. Initially13,010 are spendable. Two extra Hibiscus typists189+293, Quick fingers1 for160 and Recipe practice1 for400 cost1,042 total. This leaves17,978 held and11,968 spendable against the original floors, with three typists on Hibiscus. Full Hibiscus training116,012 remains unaffordable even without reserves. These synthetic ingredient counts are not a recovered player save or a real recipe assertion.

Arithmetic: evidence/PG-02/parent-price-review-r1/calculation.json. Parent rechecked current PAW_COST/PAW_DESK_STEP/PAW_GROW, UPS/TIER/upPlan/upCap and donor reserve settings. No runtime or long-horizon simulation.

## Donation policy to approve

Keep per-desk inventories and banked words. When pooling is explicitly enabled, all owned desks may fund hires and letter-priced upgrades, including desks with Auto-hire Off. Off disables hiring, not surplus donation. Each donor retains its configured letter reserve, default25%, and all already-held letters needed for missing words in the resolved active title. Ingredient protection counts toward the reserve floor rather than adding the two.

Use per-letter ingredient floors plus aggregate `max(protected ingredient total, ceil(current held * reservePercent / 100))`. Freeze floors for one Buy1/10/Max quote; refuse insufficient transactions without partial deductions. Spend largest removable piles first, stable desk/alphabetic ties. Manual and Auto-hire use the same prices and protection. Repeated separate clicks recompute reserve from current inventory;25% is a current-balance reserve, not permanent protection of the original stock. Invalid/future settings suspend pooling.

No inventory conversion/migration, letter transfers for books or idle earning of Inspiration. Implementation is a separate default-off pooling prototype with an acknowledged opt-in, readable protected/spendable amounts and retained preference through Printing. Absent/disabled pooling keeps local costs/spending. Bind the accepted PG-01 resolved-title behavior; no new production selector or manual-sale policy. Exact pure planner/Ops seam lease follows approval.

Status: OWNER APPROVED 2026-10-14. Explicit response selects gentler factors1/4/8/16/32/64 and approves protected donation rules. Receipt evidence/PG-02/owner-approval-r1/receipt.json. Original proposal/evidence retained. Separate default-off implementation may proceed under a narrow task lease; no product changes, activation or commits from this approval record.
