# PG-00 owner review

Documents-only proposal, 2026-10-14. Design and initial scaling are unapproved. Source review on `long-game`; no replay of the reported 19k/20 save, runtime proof, or product change. Auto-coach remains the sole Ops writer.

## Production goal first

`ops.js:67,159-174` separates desk word bands from recipe collections. A five-letter-cap library story has longest-word band 1 but also needs shorter words. Collections are kids, library cap 5/7/9, authored readers, and commissioned pitches. Shelf Word max is exact recipe-band filtering, stored in view state, not production policy (`ops.js:222-225,2746-2763,3124`).

Persistent `S.focus` names one unsold title. `pickAutoFocus` keeps it until sold, then searches every in-play, desk-accessible recipe using missing-word effort divided by baked recipe pay, with a lower-pay tie break (`ops.js:457-472,2088-2089,2196`). It does not constrain the next choice to the newly unlocked band. This explains a possible return to short titles without proving the owner's particular history. `inPlay` limits the rolling kids list, not library bands (`ops.js:416-423`).

Recommend a shared Production goal card on Floor and Titles: buttons for 3/5/7/9/11/13 word max, a collection selector, and “Advance when complete” off by default. “Legacy Auto” preserves today's behavior. Selecting a set persists an exact longest-word band plus collection; “All collections” is explicit. Library membership uses `r.lib`, not just longest-word band. Within that set, retain the existing effort ranking to choose the next title.

All goal-aware typing biases, keeper banking and Publisher candidates use one resolver. Manual taps retain randomness; no guaranteed letters or rate bonus. Keepers make missing ingredients from their original desks, including lower-band words needed by the selected book. In set mode they stop unrelated stock banking. Completed desks can accumulate surplus. Publisher sells only set members and retains its online market rule. Offline tier-3 selling remains average-market x1 without the online threshold, but respects set membership and the existing sale budget (`ops.js:1128-1155`). Wire both `roll` and `offlineDist`, both `keeperStep` and `keeperBulk`; otherwise the saved goal would break while away (`ops.js:515-568,1447-1489,2046-2060`).

An explicit title focus temporarily overrides the set, even outside it. Preserve today's manual-sale protection for that title; after its sale or “Return to set”, resume the saved set. Do not convert an automatically selected focus into a manual override on load.

Show current title, set sold/total, missing words by desk, “Waiting for letters”, “Waiting for desk”, “Ready, waiting for Publisher/price”, or “Set complete”. A new desk unlock leaves the selection unchanged. Exhaustion means no unsold collection members at that band, not merely no currently eligible members. A temporarily locked or rolling-list-ineligible remainder waits. Kids list replenishment must not falsely exhaust the set.

If advancement is enabled, move upward to the next nonempty band in the same collection only after exhaustion; never descend. If its desk is missing or challenge-blocked, show that reason. At the final band, stop complete. Manual collection changes are explicit. Reload retains selection and overrides; Printing retains set preferences, clears the title override and recomputes against the reset run, potentially waiting for desks. Preserve kids/library exclusions from `soldCount` and all existing challenge restrictions: No Hands blocks taps, Vowel Drought controls odds, Haiku blocks later desks, Deadline retains its clock (`ops.js:405-415,940-957,987-1004`).

## Training-only shared spending experiment

Recommend optional pooling for letter-priced Train hires and desk upgrades. This explicitly revises the root plan's deferred shared-pool fallback into spending-only pooling. Book ingredients remain per desk; banked words, trays and saved inventories remain intact. Coaching/rerolls cost bananas and stay outside pooling (`ops.js:2125-2141`), so current Coach work can finish unchanged.

Today `upPlan` prices Buy 1/10/Max against local totals; `buyUp` deducts individual letters from largest piles. Later desks receive one typist on purchase. The apparent 35-letter Hibiscus base is actually round(35 × 1.35) = 47 for its first extra hire (`ops.js:70-73,2143-2179,2196`). Pooling at those prices would spend old surplus too cheaply.

For an initial, separately approved experiment, retain existing level growth and restoration caps but multiply later-desk starting bases for every letter-priced Train item by a desk factor. Try a factor proportional to sqrt(desk purchase price / Hibiscus price), with a calibrated starting coefficient. Use banana prices only as relative economics, never as a conversion currency. Choose that coefficient so a 19k spendable-surplus fixture buys useful early training but cannot purchase all accessible hires/upgrades on Hibiscus in one Max sequence. Check the cumulative basket rather than one price. These are candidate scaling rules, not final prices or a pacing claim. Bamboo's local startup remains affordable; later desks still start with their supplied typist and can produce ingredients while saving for training.

Compute spendable letters per owned donor desk. Protect held letters up to the active title's full remaining per-letter requirements, stronger than the keepers' current one-copy protection. Also retain ceil(pre-purchase held total × that donor's reserve percentage); combine the floors without double counting. In pooling mode apply reserves to manual and automated training, including donors with Auto-hire off. Label that changed policy explicitly. Spend only above both protections, largest surplus piles first, deterministic desk/letter tie order. Requote immediately before deduction; insufficient total means no purchase. Unowned desks neither donate nor receive upgrades. Buy Max uses protected pooled affordability.

Current Auto-hire checks only the target desk's post-hire total against its pre-hire percentage and calls the manual `buyUp` (`ops.js:1924-1935,1965-1966`; `automation.js:16,96,127`). Replace both quote paths with one cost/spend plan when pooling is enabled. Preserve unlocks, caps, round-robin and one hire per20 active seconds; no offline hires. Local mode retains today's reserve semantics.

A surplus-to-bananas exchange is simpler to describe but adds recurring income and pricing pressure. Training pooling directly helps new-desk startup while consuming real surplus, so prefer it. Add no premium, DB or Inspiration income; Inspiration remains minigame-only.

## Small approval package

Optional `S.meta.productionGoal` stores version, enabled=false, band, collection, advance=false and manual override. Optional `S.meta.trainingPool` stores version, enabled=false and approved cost-profile ID. Missing fields preserve mechanics; unknown versions suspend new behavior without deleting data. Printing retains preferences, not inventories beyond its existing reset rules. No conversion migration or silent repricing.

After Coach releases Ops, propose PG-01 only: one owner leases NEW `production-goal.js`, narrow resolver/consumer/reset/UI seams in `ops.js`, goal-card rules in `ops.css`, script registration in both shells and `tools/balance.html`, cache registration in `sw.js`, and NEW focused goal checks. No automation.js edits. Check syntax, default short control, one selected-set online/offline path, exhaustion/advancement, manual override and reload/Printing; inspect both editions at smallest phone. Pool experiment follows separate approval, then resume dependent LG-03/LG-04 work. Long-horizon balance remains deferred.

Owner choices: approve exact-band set selection with optional upward advancement? Approve manual override/manual-sale precedence? Approve protected training-only pooling and initial desk-scaled cost experiment as a later slice?
