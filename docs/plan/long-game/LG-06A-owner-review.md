# LG-06A owner review

2026-10-14. Documents-only candidate. All A6 rules below are proposals requiring approval. Accepted Folio, Imprints, genres and shelf remain the basis; LG05's helper cadence, predecessor, challenges and tiers were excluded from approval.

Recommend one earned, default-Off Auto-garden base. Require enabled, valid Layers with `Layers.identity(S)>=1`, introduction complete, acknowledged save ownership and the manual record below. No Seal/star/DB price, premium entitlement or hard-minigame gate.

Capture one ordinary manual plant-to-ripe-harvest cycle, not LG05's draft harvest/replant sequence. Optional version1 `meta.automation.garden` holds settings and `manual:{pending,complete}`. After an acknowledged manual `ACTIONS.plant`, pending records Imprint count, internal Printing, bed index, letter, desk and a stable crop token assigned with that acknowledged plant. Current ready time is used for ripeness, never as the sole identity, because speed and recovery shift it. Acknowledged manual `harvest` or `harvestall` of that exact crop sets complete permanently and clears pending. Automation never earns it. No inference from `stats.harvested`, existing crops or old saves. Returning players plant then harvest once, even before founding; Bamboo E takes the existing 30 game seconds. This adds no wall-clock gate. Reset or replacement invalidates incomplete evidence.

| Rule | Proposed base / owner |
| --- | --- |
| Configuration | Exactly one existing bed index, one A-Z letter, one owned desk ID. Initial Off, bed 0, E, Bamboo. No automatic bed purchase. |
| Cadence | One attempt every 60 eligible active game seconds, newly proposed. Empty bed: plant. Matching ripe crop: harvest only. Replant on the next 60-second attempt. |
| Refusal | Unripe, mismatched crop, absent bed, locked/unowned desk: skip without replacement or grant. Full garden never selects another bed. Ready letters do not suppress planting; planting consumes none. |
| Fair service | Fifth round-robin slot alongside hire/shop/coach/restore, at most one of these crop/economic actions per tick. A5 keeps its accepted independent item service. |
| Activity | Visible game, including active hosted minigames, follows A1-A4. Save hold, replay, hidden/menu/offline: no actions. Zero A6 elapsed on suspension/resume, reload, edit or reset; cap at one due attempt, no catch-up. |
| Retention | Printing/Imprint retain enabled preference, bed/letter/desk and completed record; clear pending record and runtime cadence. Actual crops follow existing room reset. Flagless loads preserve dormant fields and issue no actions. |

Reuse `plant`/`harvest`, timing, yields and inventory/tray/stat updates through narrow explicit desk/action-origin arguments, without changing `S.sel`. No second crop formula, reward routine or RNG. Planting currently costs zero bananas/letters, so reserve is zero. E yields 6 in 30 seconds on Bamboo; Z yields 20 in 124 seconds. Desk time factors are 1/2/5/12/30/80. Default E first plants at 60, harvests at 120, replants at 180. Existing wall deadlines/away growth continue; A6 never harvests offline. There is no crop expiry today. Cleared, stale or unripe crops pay nothing; harvest empties the bed once.

Before any new automatic grant, make only these manual and automatic crop actions acknowledged: run the shared action against a narrow candidate containing affected crop/inventory/tray/stats/record, save before publishing, and reject stale crop identity. Failed writes leave live state unchanged, pause A6 and expose Retry that revalidates rather than replaying a grant. Reuse existing owner/guard/ack/Retry conventions; no generic transaction framework. Preserve unknown fields; unsupported owned versions block edits/actions without erasure. Settings Off suspends immediately even if saving fails.

First future lease: existing `automation.js` configuration/scheduler/card and minimal `ops.js` crop/manual/ack hooks; `automation.css` only if incumbent controls need fit, `sw.js` cache update. No new module or tabs. Use existing lg03 plus lg01a/lg05folio/lg05layers opt-ins and actual owner. The new manual acknowledgement/evidence branch is opt-in only; absent flags keep the incumbent garden behavior. No default activation. Both incumbent styles use one compact card with >=40px controls, internal scrolling at 360x560, Low/reduced-motion support. Preserve current garden/premium beds, Folio focus, PG and protected training without new reservations or targeting overrides.

Verification later: syntax; one unlock/use/reload/reset path; one failed-save/Retry plus duplicate-harvest refusal; short default-control/economy smoke and both-style smallest-phone inspection. No runtime checks performed here. Paid tiers, challenge rewards, new currency/DB/star allocations and remaining helper catalogue need separate approval. LG13 owns full pacing.

Owner choice: approve this entire base package, including plant-to-harvest evidence, zero planting cost, separate 60-second stages, retention and narrow acknowledged crop boundary, for a later precise implementation lease; or return the package with requested changes?

OWNER APPROVED2026-10-14 entire base package with parent clarifications. Receipt evidence/LG-06/owner-approval-garden/receipt.json. Implementation under LG-06A-auto-garden.md; no tiers/challenges/default activation/commit/deploy.
