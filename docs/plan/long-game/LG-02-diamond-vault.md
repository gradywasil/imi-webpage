# LG-02: Diamond Vault, free-only first

Read `docs/plan/README.md`, this folder's `README.md`, `premium-currency.md`, `execution.md`, `LG-00-accepted.md`, `LG-01-reward-design.md` and `LG-01-accepted.md` before technical work. Size L. Depends on accepted LG-01. The owner approved starting this documents-only initial design lease on 2026-10-12. Runtime implementation still requires the resulting design approval.

## Goal

Specify a Vault where players spend earned Diamond Bananas on the permanent catalogue without real-money flows. Preserve the approved x1.25/x1.5/x1.75/x2 game/typist ladders, offline speed and uncapped Endless Night Lamp, earned automation and child-safe store rules. Settle the exact flow, persistence and unresolved owner choices before implementation.

## Files owned

- NEW `docs/plan/long-game/LG-02-vault-design.md`.
- NEW `docs/plan/long-game/evidence/LG-02/design-r1/**` only for concise source/decision receipts.
- This task file's Status and Handoff notes only.

No runtime, test, shell, service-worker, master-plan, premium-spec, ROADMAP or existing evidence edits. No Ops owner is leased. You are not alone in the codebase; preserve others' work and do not revert it. Do not install, stage, commit, push, deploy or activate a flag. Do not dispatch another task yourself.

Later implementation is expected in new `vault.js`, narrowly leased Ops seams/CSS and both shell/balance/SW script registrations. That is a separate concrete lease issued only after design approval; this paragraph grants no edit permission.

## Files it may read

Required plans and accepted evidence; `BALANCE.md`; `ops.js` extension API, clocks, fresh/load/reset, typist production, garden/Muses/LAMP/away/render/action sections; `rewards.js` ledger/ownership/save/hold APIs; relevant Core/Economy startup/persistence code; `ops.css`, both edition shells, `tools/balance.html`, `sw.js`; existing reward tests/helpers. Read two art-integration task files for document format only; art implementation remains retired.

## Exact deliverables

1. Write a source-grounded design contract with catalogue IDs, staged effects/prerequisites, owned-item/save shape, purchase history, earned-first debit, preview, confirmation and ten-second local Undo. Show exactly how an acknowledged purchase and Undo preserve source balances, claims, unknown data and item effects across failed saves, repeated Retry, reload, ownership loss and Printing. Do not reuse stale whole-state snapshots. Explain the runtime changes needed, without writing them.
2. Inventory all draft DB costs from the premium spec and mark every unapproved cost DRAFT. Keep final Endless and pack prices unset/tunable; never treat the 1200 placeholder as owner approval. Calculate Night Lamp+ credit toward Endless without charging twice, insufficient-funds/owned/max-tier states and the finite 109-DB current pool's actual buying power. Future roughly-1000-DB income is provisional, not newly allocated here. Ask for the required catalogue approvals in one concrete decision list.
3. Specify game speed applied once online/offline through the accepted clock/provider and typist speed on typist production separately. Preserve world/weather/daily/Seasons/Commission-expiry/news/presentation clocks, offline efficiency, native buff duration and Deadline fairness. Document actual base/tier offline values from code and cap ordering with Infinity. Show boundary tests for combined speed/typist/Legacy, mid-session purchases/Undo, long offline and exactly disabled/default-one parity. Do not reduce the owner-required x2 maxima or silently retune pacing. LG-13 retains 55% capstone and 80% layers-2/3 calendar requirements including Away.
4. Ground seats/beds in actual code. Current fresh garden starts at two, ordinary GARDEN_COSTS permits plots three through six; draft premium beds are seven/eight. Define entitlement versus currently purchased ordinary plots, purchase/reveal prerequisites, Printing persistence and unavailable-department behavior. Fourth Muse seat must preserve existing seating rules. Report any real mismatch with a concrete recommendation rather than changing the catalogue silently.
5. Resolve the Supporter's Shelf draft against the hard no-player-name/no-shared-text rule. Recommend a local badge/ribbon without a name field, and explicitly flag that design correction for the owner. A future verified paid purchase of 500+ DB total grants it, not earned DB spending; no free-only fabricated payment history or receipt verifier. Specify an inactive future interface or defer the badge until LG-11, with that choice presented for approval. Existing looks may support a small proposed cosmetics list; no new art, sound packs, themes or assets are produced under this lease. Do not revive the retired art track.
6. Define Settings Hide the Diamond store and the quiet free-only Vault navigation, exact visible content and retained earned-item functions. No paid offer badges/popups/tutorial nudges, money flows, player data, chat, name/email/age fields or external game links. Any eventual checkout must be parent-gated in LG-11/LG-12; no placeholder checkout bypass. Propose exact Settings/Vault promise and purchase copy as DRAFT for owner review, including the decided ad-free-forever promise. Do not finalize user-facing legal text.
7. Specify both pixel/classic layout at 1280x800, 390x700 and 360x560 with actual existing rail/panel/Goals constraints, no page scroll, internal content scrolling, 40px+ targets, accessible names/focus, reduced motion and Effects: Low. Include empty/low balance, all/max owned, confirmation/Undo, held-save and store-hidden states. Document mobile footprint without changing the approved visual world. Static source geometry or existing screenshots can inform the design; no new game navigation/save mutation or runtime results are authorized here.
8. Present full-reset/permanent ownership as an explicit unresolved owner choice. Current reset clears namespaces. Give concrete options and consequences for earned items, bought balance, verified receipts and restore; no assumption that a purchase can be erased or recovered through an unapproved account/code design. Q5 consumables, Q6 accounts, Q8 New Game+, Q9 absolute heavy-payer minimum, Q10 prices remain OPEN. Identify which are actual LG-02 blockers and which can stay deferred because the free-only scope does not rely on them. Factory escape does not settle Q8.
9. Give ordered small implementation slices, exact prospective file ownership/API additions, script order/cache update, frozen before/default parity and enabled functional tests, old-save migration, real persistence failure/Retry, native both-edition screenshots and media/lifecycle checks. Payments/Worker/policy pages remain LG-11/LG-12. Stop with DESIGN READY FOR INDEPENDENT REVIEW and a concise findings/decisions/handoff list. Independent different-model review and owner design/cost/copy decisions precede runtime dispatch.

## Acceptance criteria

Documents cover every LG-02 catalogue line and approved child/speed/ownership constraint with source references. Draft costs and actual open choices are unmistakable. No new Diamond allocation, pricing, legal claim, consumable policy, account policy, reset retention or pacing relaxation is treated as approved. No ads, gacha, random prizes, FOMO, pay-only progression or sold automation. No code, dependencies, new tooling or assets.

Design verification is static and documents-only. Runtime fit, purchases, byte-identical harness, old-save behavior, actual media and pacing remain UNVERIFIED until their separate authorized implementation/QA. A clean document review is not runtime acceptance.

## How to verify

Record starting branch/status and hashes of the accepted sources read. Reconcile catalogue values and clock/slot/cap APIs with actual code. Check computed draft totals and earned-pool examples. Audit every proposed field/action against save ownership, exact claims and full-reset uncertainty. Cross-reference owner decisions in execution.md rather than inferring from defaults. Confirm changed paths are only the document lease and preserve original evidence. No browser or balance run is necessary for this document phase.

## Status

OWNER-APPROVED SELECTED DESIGN/PACKAGE2026-10-12; LG-02A and LG-02B1 ACCEPTED LOCALLY2026-10-13. LG-02B1-accepted.md records independentreview and owner-accepted historicalexceptions. Next ownedtransactioncoordinator needs concrete source/API/ownership mapping and a new codelease before recovery/store activation. LG-02-owner-review.md records selected costs/copy/reset/hold/support/Muse/QA dispositions. Concrete sequential leases only; no blanket edits or shared/public release. Full LG02/runtime/pacing acceptance remains open.

## Handoff notes

LG-01 is accepted locally with `?lg01a=1` opt-in, source and limitations in LG-01-accepted.md. Its earned/bought ledger exists but spending does not. Reuse the current state and acknowledgement/hold/writer rules; do not reopen accepted reward amounts or add broad Ops refactors. Full-reset paid ownership and all unapproved prices remain owner gates. The draft Shelf name conflicts with the hard child-safe rule; source confirms ordinary garden expansion to six, so the two-starting-bed count alone is not a contradiction.

Design r1 reconciles actual private/public APIs, all catalogue lines, draft arithmetic and finite109DB buying power, source-specific debit/refund history, inactive ten-second local Undo reservations, fresh-load/Retry/Printing/ownership rules, explicit clock/cap/slot seams, both-edition source geometry and child-safe hidden-store content. The reservation/hold/reset/copy/prerequisite policies are proposals for owner disposition, not accepted runtime semantics. Existing screenshots inform layout only; new fit, runtime persistence/media/lifecycle and all pacing remain UNVERIFIED.

Material findings: unique placeholder-Endless catalogue estimate is6700 rather than7400 because Plus credit overlaps; actual offline efficiency is40-70% before Woolf and55-85% with it; stop/resume does not itself freeze absolute timers; current rewardCommit is not a general purchase API; Infinity needs explicit saved away-checkpoint encoding; changing an existing look currently affects rarity/traits; no saved paint-selection API exists. Keep both x2 maxima. Recommend a badge without a name field, deferred toLG11, and present full-reset ownership as a blocker. Garden ordinary3-6 and premium7/8 remain consistent. Do not dispatch implementation from this handoff. Parent owns different-model QA and owner presentation; no child was spawned.


Independent QA r3 is complete with READY FOR OWNER REVIEW for the restricted proposal only. Prior findings resolved at design level, including interval/clock handoff and honest supported-use restriction. Parent verified203 current sealed inputs before readiness/history updates. LG-02-owner-review.md selects already-reviewed first-build alternatives for explicit owner disposition, not approval or whole LG02 acceptance. No runtime writer until that response and a concrete slice lease. Historical HOLD reports and candidate source unchanged.
