# Owner progression and UI refinements

REQUESTED 2026-10-14. These additions steer the existing long-game work; approved Auto-coach continues under its lease. Record intent here before implementation proposals. No new prices, reward amounts, migration, commits or deployment are approved by this request.

## Production goals

Add easy book-set goal controls for the typing -> keeper -> Publisher pipeline. The owner reports that automation moves briefly into five-letter books after a new typewriter unlock, then returns to three-letter books and lower-value titles. A selected set must govern actual production, not merely shelf filtering, and its completed/waiting state must be clear. Investigate persistent band/collection targets and an explicit automatic advancement option. Do not silently fall back to smaller books contrary to the selection.

## Surplus letters

Give older typewriters' letters a useful role after their upgrades are capped. The owner's example is19k+ letters on the basic machine versus20 on a newly unlocked machine. Revisit shared letter spending for upgrades with higher initial costs on later machines. Compare training-only pooling against other surplus uses; account for active-goal ingredient needs, Auto-hire reserves, later-desk startup and old saves. New exact prices and pooling behavior require a concrete design decision. Inspiration remains minigame-only.

## Floor combos and timed messages

Move combo glow from the old stage rectangle to the full right-hand gameplay area on Floor. Add streak thresholds500/1000/2000/3000/4000/5000 after200. These are streak counts, not production multipliers. Exact names/rewards/limits must be proposed before implementation. Preserve existing lower milestones unless separately approved.

Clean up top-center messages such as Golden Keys: centered heading, centered explanatory subtext below, and responsive positioning within the gameplay area. The owner suggests shrinking the banner as time runs out to replace a bulky timer; compare this against a shrinking duration meter that keeps text readable. Inspect both transient milestone text and active-buff chips before selecting the change. Preserve actual effect clocks and the approved chips-inside-Retry hold behavior.

## Consistent layouts

Make buttons, card actions, alignment, centering and spacing consistent across screens. Fix misaligned or awkward left-only stacks with reusable action-row/layout rules appropriate to each card. Preserve Pixel and Classic identities and existing assets; this is refinement, not an art-track revival or rebrand. Support mobile first, no page scroll, >=40px targets, reduced motion and Low.

## Royalty usefulness

The owner reports about600k from book sales versus7 bananas per second in royalties, and requests better scaling so royalty upgrades feel useful. PG-03-royalty-scope.md prepares a source-based formula and payback proposal before economy edits. The cumulative sales timeframe and save details are unknown. Production goals and the approved UI batch retain their order; royalty rates and deal prices need concrete review.

## Implementation sequence

PG-00-production-letter-scope.md prepares the concrete economy/pipeline proposal. UI-00-layout-scope.md reviews actual representative screens and prepares a bounded cleanup proposal. Both are read-only on product source and may overlap the sole Auto-coach Ops writer. Proposed priority is to address the production goal before adding further automation that relies on it, then the letter-use prototype and a coherent UI cleanup batch. Implementation order and numbers are proposed for owner review, not silently activated. Long-horizon tuning remains LG-13 work.
