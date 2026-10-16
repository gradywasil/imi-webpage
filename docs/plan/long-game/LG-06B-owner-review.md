# Base A7 Auto-pitch owner proposal

2026-10-14. Documents only, pending owner approval. [Source basis](evidence/LG-06/pitch-scope-r1/source-basis.md); LG-06B-parent-review.md clarifies recovery.

Recommend a free, default-Off helper after introduction completion, founded Imprint 2 and one newly acknowledged manual commission followed by sale of that exact title. Track the commission from this implementation onward, even before Imprint 2. Commission a reachable offer, bank its words and sell during visible play. No historical backfill or extra payment/wait/minigame gate. Recommend allowing the existing active Publisher to sell that manually commissioned title and complete the predecessor. Offline sales do not establish completion. A manual title lock still requires manual sale or explicit release.

Implemented economics: commissioning spends nothing. Rights are sale proceeds. Repitch alone costs max(cash(25), rounded 20 seconds of base royalties). Three offers remain fixed until commissioned or manually repitched; commissioning replaces just its slot with genPitch of its actual recipe band. Generation uses existing random text/title/pay/ID choices. Reuse it unchanged, once per prepared replacement. No new reward draws, DB, currency, ingredients or free sales.

Proposed selection: wanted means marketMult(band) >= 1.00, with an unsold offer whose every ingredient desk is owned and challenge-accessible. With an active production set, require its exact band and collection all or pitches. Pause for unsupported PG state, PG manual override, an unsold manually focused title, or working Folio. Cheapest means lowest band index because all commission prices are zero; ties use current offer slot order. Refuse duplicate/registered IDs, absent offers and eight open commissions. Do not generate offers just to seek a match, auto-repitch, change focus/settings manually, or buy desks. Auto focus may resolve after registration. Patient Press still blocks automatic sales; Haiku excludes ingredient bands above 1. Add no new challenges or tiers.

Propose one attempt each 60 eligible active game seconds, sixth fair service slot alongside hire/shop/coach/restore/garden. One shared action per tick; A5 pickups stay separate. A due A7 attempt consumes its interval even on refusal. Saturate at one due attempt, no catch-up. Visible hosted minigames count. Hidden/menu, owner/save hold, replay/offline, tour, Settings and blocking dialogs refuse A7 and reset its clock. Off/edit/reload/reset clear only A7 timing.

Commission must prepare a detached candidate containing exact selected offer, replacement, pitches, stats and origin evidence. Guard ownership/current offers/config/capacity again on Retry. Acknowledge Ops before registerPitch touches RECIPES/RBY/VOCAB/BAND_WORDS, focus, UI or events. Failed writes publish nothing; retain the same replacement for Retry, discard stale requests without rerolling. Reload after failed preparation leaves original offers unchanged.

The existing sale mutates words/written/stats before wallet credit and ignores its failure. Prerequisite: a fixed tracked-pitch-sale command in Rewards/Ops, covering only the pending predecessor title. Prepare a durable intent with exact recipe, bank deduction, sale quote, origin and wallet baseline; use existing sequenced wallet credit semantics, then acknowledge final Ops state/completion before publishing. Retry resumes that intent without another sale or credit; reload recovery precedes progression/reset. Never infer completion from written/stats. Core already exposes sequenced creditReward; authorize it only through this fixed Rewards sale command. Record the settled wallet head so later reward checks recognize the payment. Cold recognition must block unfinished tracked sales before legacy writers when recovery flags are absent, offering Resume with the existing four flags; malformed/future intents stay blocked without writes. No unrelated sale rewrite. Offline Publisher must defer this one tracked title until visible settlement.

Propose optional meta.automation.pitch version 1, enabled false, manual {complete:false,pending:null}, plus a validated optional sale intent. Pending evidence stores exact title ID/content and Printing/Imprint identity. Missing fields grant nothing. Preserve unknown fields; unsupported owned pitch/intent state blocks actions without deletion. Retain complete eligibility/settings through Printing/founding; clear incomplete commission evidence and runtime after settling any sale intent. Existing resets retain pitches/IDs, roll written into editions, clear written/offers, and reset desks; retained unsold pitches therefore consume capacity again. Do not alter that behavior.

Later lease: automation.js, narrow ops.js commission/tracked-sale/reset seams, rewards.js fixed command/recovery, vault-save-gate.js cold intent recognition only, layers.js pure incomplete-evidence clear, scoped automation.css and sw.js. Existing lg03/lg01a/lg05folio/lg05layers opt-ins and actual save ownership are required; absent flags keep incumbent actions unless an unfinished intent requires safe recovery. Reuse the compact Automation card in both styles: eligibility, rule, On/Off, status and Retry. At 360x560 use one column, internal scrolling, >=40px targets, no page scroll/art/new tab/module/motion.

Later skeleton checks: syntax, controlled unlock/commission/tracked sale/reload, one failed-write Retry with unchanged replacement and no ghost recipe, one focused tracked-sale interruption/reload recovery including flagless cold refusal, short default-control economy comparison, affected both-style phone views. Full pacing belongs to LG-13. No runtime checks here.

Approve this bundled base A7 package, including wanted >=1.00, band-order selection, 60-second cadence, active Publisher predecessor credit and the narrow acknowledged commission/tracked-sale prerequisite with cold recovery protection?

| Rule | Owner / boundary |
| --- | --- |
| Gate, settings, sixth fair slot | Automation; base only, existing development opt-ins |
| Offer validation and detached generation | Ops; zero fee, no automatic repitch |
| Registration after acknowledgement | Ops; shared recipe/vocabulary tables included |
| Tracked sale intent, credit, recovery | Rewards/Ops; existing Core sequenced-credit bridge |
| Cold recovery | Early gate recognition only; four existing flags, no unrelated Vault change |
| Retention | Ops/ Layers; completed evidence survives, incomplete clears |
| Review | Parent then owner; every new rule above remains unapproved |


OWNER APPROVED 2026-10-14: base package including parent cold-recovery clarifications. Receipt evidence/LG-06/owner-approval-pitch/receipt.json. Implementation lease LG-06B-auto-pitch.md; no tiers/challenges/default activation/commit/deploy. Earlier proposal status is retained as history.
