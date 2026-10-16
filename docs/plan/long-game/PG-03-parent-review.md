# PG-03 parent review

2026-10-14. Documents-only proposal reviewed against current named Ops formulas, deal prices, online integration and offline efficiency. Independently recomputed the three hypothetical rate/payback cases; arithmetic matches. This is not a live save or pacing test. The assumed hourly sales flow is illustrative, not measured throughput.

Recommend owner review of the bounded prototype: multiply current royalties by `2 * (1 + 0.35 * min(S.printing, 7))`. S.printing counts completed resets, so the initial run receives x2 and seven completed Printings receive x6.9. Existing deal costs and their multipliers remain intact. Applying the same factor to bookRoy and royBase keeps individual title rates and aggregate rates consistent.

The Printing cap of seven is an experimental tuning choice, not measured balance. The proposal improves early royalty return and catches up with sales' existing Printing multiplier through that point. Later Printings continue increasing sale bonuses while royalty uplift stays capped. Higher income also feeds royalty-based pickups, daily prizes and repitch costs through existing formulas; those consequences must be disclosed in the implementation handoff.

Amend the future lease to require an independent default-off `?pg03=1` prototype. No old-save metadata initialization, default economy changes or permanent migration. Multiply the current tuned base rather than overriding TUNE.ROY_BASE. This owner choice authorizes later isolated implementation and playtesting after the approved UI batch, not public activation or final balance. PG-01 remains the only current product writer. Stronger long-horizon checks remain LG-13.

Minor prose correction: Good Stories is the actual minigame node name. The task prompt's misspelling was not a new owner request. Keep its approved benefit sale-only.

Status: OWNER APPROVED 2026-10-14. Explicit response approves the capped royalty prototype described in both review documents. Receipt: evidence/PG-03/owner-approval-r1/receipt.json. Queue the narrow default-off implementation after the approved UI batch; write its exact task lease just in time. PG-03-owner-review.md supplies the concrete table and actual prices. Final balance remains open. No runtime edits, commits or activation from this approval record.
