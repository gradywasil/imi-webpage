# LG-01 held buff presentation: owner decision

Status: OWNER-APPROVED FOR IMPLEMENTATION,2026-10-12. The owner explicitly selected "Approve chips inside Retry panel (Recommended)" for the concrete amendment below. Full LG-01 remains HOLD/default off pending implementation and separate acceptance review. Original QA r1/r2/repair artifacts remain immutable; approval does not imply runtime verification.

## Evidence requiring disposition

Independent QA r2 confirmed the four policy/display repairs and the original single-chip resize cases.99/99 tests and fresh complete default parity pass. Two held-layout defects remain:

- R2-01: actual Retry replaces a short save error with the browser quota message. The panel grows but observed game containers do not resize, leaving the chip behind the panel. A1px viewport change moves it into existing space, confirming missed invalidation.
- R2-02: Frenzy, Snack Break and Vowel Drought chips visibly cross the rail in Pixel landscape/Classic portrait while usable horizontal space exists in the game region.

Separately, the measured current three-chip stacks at360x560 are79.03px Pixel/97.5px Classic high. The gaps above the panel and below the keyboard cannot contain them under the current geometry. This is not a claim that a missed bottom placement could solve those cases. A broader floating-position algorithm would still need a layout fallback.

Manager read the full report/source boundaries, opened both actual Retry-quota and both current multichip failure screenshots, verified all64 current source/input hashes and independently recomputed complete raw default parity. No production edit. Detailed evidence is LG-01-QA-runtime-r2.md and evidence/LG-01/qa-runtime-r2/**.

## Recommended concrete amendment

During a reward-save hold, place the existing buff/challenge chips INSIDE the existing Retry panel, in normal flow between the error message and Retry button. This rule applies throughout the hold, avoiding a size-dependent placement switch. Retain each existing label and displayed time/progress; wrap within the panel, preserve readable fonts and focus. Example hierarchy:

```text
Progress not saved. Reward waiting to save.
[FRENZY ...] [SNACK BREAK ...]
[OULIPO: Vowel Drought ...]
[Retry]
```

Normal gameplay uses the existing floating buff bar. When the hold resolves, return the existing presentation to its normal host. Startup failures without loaded game/buffs keep the existing message/Retry form. No extra modal, reward, animation, automatic Retry, progression, reconciliation, save, timer reset or ownership change. The goal strip stays44px normal/content-driven enlarged, and all three goal summaries remain readable.

The Retry panel can grow and use a bounded internal content region when needed; Retry remains visible/reachable40px+, no page scroll, no hidden/shrunken chip or goal text. Actual layout fit, focus, accessibility/Low/reduced motion, status text changes, all current-content chips and held lifecycle must be tested in both editions and the required viewports. The hierarchy above is a proposed layout, not a tested runtime screenshot.

This replaces the present special floating-held placement policy rather than expanding it into a general scene/FX layout engine. Existing engine/cash/away/goal persistence and all normal gameplay remain within their accepted source boundaries. No price/legal/paid ownership decision or default activation follows.

## Approval boundary

The owner's orchestration brief requires design approval before a changed direction is built. Moving chips into the error panel changes the failure-state presentation, so the manager seeks explicit approval of this concrete amendment rather than silently altering it. If declined, obtain another owner-approved layout addressing the measured no-space cases before implementation. The original goal-height approval does not approve this panel-content amendment.

Owner subsequently approved this amendment. LG-01-repair-r3.md issues the narrow status-content placement/cleanup lease and verification requirements. Independent focused review follows candidate delivery. Prior reports/failed attempts remain unchanged. No premium/open-policy/default activation approval follows from this UI decision.
