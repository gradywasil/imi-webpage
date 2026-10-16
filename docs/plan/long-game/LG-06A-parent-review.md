# LG-06A parent source review

2026-10-14. Documents-only scope completed, no pending children. Recommend the base package with these implementation clarifications, incorporated in owner-review.

Actual source confirms free planting, E30seconds/6letters, Z124seconds/20letters and existing yield/tray/stat paths. No runtime/pacing proof.

Crop ready timestamp cannot be the sole identity: advanceDeadlines moves it for speed and recovery shifts it during holds. Assign an optional stable crop token with the acknowledged manual planting and track that same token through the ripe manual harvest. Use current ready only for ripeness. No old-crop backfill; retain unknown crop fields. Reset/replacement clears incomplete evidence.

Prototype uses existing lg03 automation plus lg01a/lg05folio/lg05layers. New acknowledged manual-record/action path applies only under that opt-in and actual owner, so default/absent flags preserve the incumbent garden and default harness behavior. Completed record can be earned before first Imprint in that prototype. Only foundedImprint1 enables automation.

A6 is one configured bed, one letter, one owneddesk, defaultOff/free, one action per60eligibleactivegameSeconds. Harvest and replant separate attempts in the shared fifth fair slot. Pause/hidden/resume resets only A6 clock; do not reset or retune accepted A1-A5. Existing crop growth may continue away, helper never acts offline.

The broad open-loop cadence is deliberately slow: empty at0 -> plant60 -> harvest120 -> replant180 for BambooE. Later tiers/challenges are separately approved work. No paidtiers/new reward allocation in this package.

Status: OWNER APPROVED2026-10-14, receipt evidence/LG-06/owner-approval-garden/receipt.json. LG-06A-auto-garden.md authorizes the first narrow implementation. All excluded tiers/challenges remain later; no default activation, commit or deployment.
