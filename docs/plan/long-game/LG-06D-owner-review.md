# Base A9 Muse director

2026-10-14. Proposed, unapproved. Documents only; A8 acceptance remains unchanged.

Recommend free, earned, default Off under existing lg03/lg01a/lg05folio/lg05layers opt-ins, intro complete, actual acknowledged save owner and valid founded Imprint count >=5. No purchases, invitations, premium activation, tiers, mastery or Fixed Cast rules.

Keep two manual changes, but require two distinct newly seated Muse IDs. Each successful manual seat assignment must change the usable seating vector and introduce an owned ID not counted by the first proof. Empty-to-occupied and replacement count; unseat, moving the same Muse, same-seat no-op and automatic actions do not. This teaches choosing patrons without rewarding unseat/reseat spam. Capture before Imprint5 while opted in and active; no old-save/statistical backfill. Retain completed proof through Printing/founding; clear incomplete proof on either reset, including identity mismatch detected after flagless play.

Use one exact lexicographic score `(Q,N)`. Q is the highest current rounded salePay among ready permitted titles, or zero. N is Poe's existing 1.25 night typing factor if seated, currently night and any owned desk has productive crew, otherwise 1. Maximize Q first, then N. Reuse all current sale factors, including Seuss/Tolken, genre fit once, genre rights and shelf. Evaluate detached seats without temporarily mutating live state.

If a manual title is selected, only that unsold title can contribute Q, and only when ready/accessible. Otherwise filter ready titles through current inPlay, desk/challenge accessibility and production-set sale permission; catalogue order breaks title ties. Pause during active Folio work. Never select/change focus, production preferences, sell or bind. No ready title means Q=0; only a useful night-Poe improvement can act. No owned Muse or usable slot means wait.

Master specifies sky/market; LG05's excluded draft specifies next-sale fit. Recommend this bounded interpretation explicitly: current market quotes choose sale benefit; current night enables Poe secondarily. No forecast or marketNext. Rain/storm influence existing demand, not an invented Muse bonus. This is not total-income optimization: replacing Austen, Twain or Hemingwape can reduce other benefits. Show that limitation beside On.

One attempt replaces/fills one usable seat with one owned, currently unseated Muse. At most 3x9 candidates; never auto-unseat, move or duplicate. Keep current vector on equal score; equal improving candidates use lowest slot then MUSES order. Filled slots may be replaced. This slowly improves immediate sale/night utility without a general optimizer.

Every exactly60 eligible active GAME seconds, become due in the eighth rotating service slot. Consume one attempt even when waiting; at most one shared service action per tick. Visible hosted play counts. Hidden/menu/dialog/tour/hold/replay/offline time produces no action or catchup. Reset only A9's clock on eligibility loss, discontinuity, load/reset, toggle, Retry or manual reseating. Manual seat/unseat immediately turns A9 Off locally and saves Off with the seat candidate; explicit re-enable resumes. No lock panel. Existing challenge restrictions still apply.

Use optional `meta.automation.muse={version:1,enabled:false,manual:{ids:[],complete:false}}`; incomplete proof also stores Imprint/Printing identity. Validate ownership when earning proof; completed proof survives lost run ownership. Protect proof from config edits, preserve unknown fields, refuse unsupported owned versions. Retain settings/completed evidence, never actual Muse inventory/seats beyond ordinary resets. Flagless data stays dormant.

Manual/auto seat and manual unseat share one detached Ops candidate containing seats, proof and any Off change. Guard, ACK `imi-ops-v1`, then publish effects/evidence. Failed save publishes neither; Retry revalidates exact state/reset identity, ownership, slots, seats/config, eligibility and auto score/context. Stale/no-op requests cannot duplicate proof. No banana debit or cross-key intent is needed.

| Rule / future ownership | Bounded change |
| --- | --- |
| `automation.js` | A9 schema, evidence, clock, eighth slot, existing card |
| `ops.js`, sole leased writer | Shared seat command, pure quote/context, proof protection, Printing clear |
| `layers.js` | Pure incomplete-proof clear in foundation projection |
| `automation.css`, `sw.js` | Only needed card rules and cache bump; no new module/tab/art |
| Core/Rewards/Economy/gate | Read-only; no cross-key prerequisite found |
| Later skeleton validation | Syntax; controlled unlock/use/reload/reset; one failed save/Retry/no duplicate; short default economy if Ops touched; both 360x560 panes, >=40px/internal scroll/Low/reduced motion; one independent review. Pacing/devices/lifecycle defer to consolidation/LG13. No checks now. |

Owner approval question: Approve this complete base package, including distinct-ID two-change proof, sale-quote-first/night-Poe-second objective and its other-income tradeoff, one-seat action, manual-change Off,60-second eighth slot, retention and single-key acknowledged save boundary, for a separately leased implementation?

Source anchors: [source basis](evidence/LG-06/muse-scope-r1/source-basis.md). This package grants no implementation authority.

OWNER APPROVED 2026-10-14: complete base Muse director package including distinct-ID proof, sale-first/night-second tradeoff, one-seat action, manual-changeOff and single-key ACK/Retry. Receipt evidence/LG-06/owner-approval-muse/receipt.json. Implementation lease LG-06D-muse-director.md. No tiers/challenges/purchases/default activation/commit/deploy. Earlier proposal status retained as history.
