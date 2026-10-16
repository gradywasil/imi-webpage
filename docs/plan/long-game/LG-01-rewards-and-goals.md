# LG-01: Reward engine, award cards and next goals

Read `docs/plan/README.md`, this folder's `README.md`, `premium-currency.md`, `execution.md`, and `LG-00-accepted.md` first. Size: M. Depends on: accepted LG-00 and approved reward decisions. Second exclusive long-game owner of `ops.js` during the later implementation phase only.

## Goal

Use the LG-00 extension API to pay known rewards for awards and first clears, display the reward before it is earned, and offer three unfinished award goals. Diamond Bananas are a source-tagged ledger only; spending and payments belong to later tasks.

## Files owned

The documents-only design phase is complete and owner-approved on 2026-10-12. Runtime work is sequential within LG-01 and must use the current slice's concrete lease; this parent brief is not a blanket edit lease.

Approved implementation scope: new `rewards.js`; narrow Ops reward/persistence/away seams; reward/goal and blocked-startup styles in `ops.css`; edition/script ordering in `index.html`, `classic.html`, `tools/balance.html`; `sw.js` registration/cache version. The owner also approved narrow Core/Economy wallet acknowledgement and writer guards plus app.js/classic.js boot gates and dependent startup sequencing. Additional runtime files may receive only a specifically leased startup wrapper if necessary, with their mechanics preserved. Existing balance policies remain read-only. Runtime leases are complete. The accepted source and verification boundaries are in [LG-01-accepted.md](LG-01-accepted.md). No current Ops writer is leased.

You are not alone in the workspace. Preserve all unrelated edits. Core/Economy ownership is limited to the named persistence/startup functions in the current slice. Economy prices, art, other layers, automation and payments remain outside LG-01.

## Files it may read

Required plans; accepted foundation sources/API and evidence; `BALANCE.md`; reward, award, challenge and printing sections of `ops.js`; page shells/CSS and existing directly relevant tests.

## Exact deliverables

1. First produce `LG-01-reward-design.md` with deterministic reward assignment, scaling basis, persistent claim identifiers, earned/bought ledger shape, stored golden buff behavior, award-goal selection, old-award backfill options and preview behavior. No hidden random reward choices. Every existing award keeps its identifier, name and +1% income.
2. Stop for owner approval before implementing final Diamond amounts, backfill behavior or golden reward semantics. Resolve finite progression Diamond income versus recurring daily income explicitly. Do not implement a full 250-award expansion in this task.
3. After approval, implement letters, denomination-rounded bananas, stored golden buffs and earned Diamond Bananas in `rewards.js`. Scale ordinary rewards by current sustained production within approved bounds and floors. Claim exactly once across reloads, retries and printings. Follow LG-00 save lifecycle, including state replacement.
4. Display deterministic rewards on award cards before earning; add three meaningful unfinished award goals without duplicating automatic payouts. Preserve `morph`, delegated actions, existing progressive reveal and both editions. Source tags must support later earned-first spending without implementing spending now.
5. Add explicit feature-disabled verification so legacy gameplay remains byte-identical, and functional reward-enabled evidence separately. Do not compare enabled payouts to unchanged economy and call that parity.

## Acceptance criteria

Syntax checks; frozen canonical harness parity with new rewards disabled; real enabled payout/duplicate/reset/save tests; preserved old awards and wallet; no dropped save data; six edition/viewport screenshots at 1280x800, 390x700 and 360x560; no document scroll; touched targets at least 40px; reduced motion and Effects: Low. The manager opens screenshots and independently reviews results before acceptance.

No ads, gacha, random prizes, countdown offers, pay-only progression, price finalization, store, legal text, new tooling, unrelated fixes, commits or deployment.

## How to verify

Reuse accepted LG-00 reproduction commands, external tools, canonical reports and save fixtures. Capture a new before-task baseline. Use the T3 preview for interactive browser evidence and the required headless harness for economy evidence. Preserve raw reports, served source identities, exact deterministic comparisons and all failures. Add named limitations rather than substituting mocked evidence.

## Status

ACCEPTED locally2026-10-12 after independent QA r3 and parent source/raw/image review. See [LG-01-accepted.md](LG-01-accepted.md) for the exact accepted tuple, verification and limitations. Original failed reports remain immutable. Feature stays default off; no stage, commit, push, deployment or public activation. LG-02 documents-only design awaits next-task approval.

## Handoff notes

Historical note: backfill, stored-golden semantics and catalogue amounts were unresolved when this brief was created. They are now defined in the owner-approved reward design. Follow that contract and the current concrete slice lease; do not infer premium prices or other open decisions from this approval.

Use `IMI.ops.extensions` and pre-Ops `window.__OPS_EXTENSIONS` registration from LG-00-accepted.md. Claim state belongs under S.rewards and the source-tagged ledger under S.prem; retrieve current S through the API after Printing. Award events include id/tier/silent; first-clear and reset hooks provide the other seam points. Printing preserves namespaces, full reset currently clears them. No future permanent ownership/reset policy should be invented here. Disabled rewards must retain legacy gameplay; approved enabled payouts get separate evidence. The initial design must quantify any three-goal strip footprint against actual 390x700 and 360x560 geometry without redesigning the existing visual world.

LG-01 design delivery recommends a finite 109-DB existing-content pool, DB-only historical backfill with explicit ordinary-reward waivers, bounded sustained-production formulas, deterministic balanced letters and one fixed stored x7 Royalty Rush for 15 game seconds. All values and new semantics are drafts for owner approval. The complete 68-ID/name catalogue and first-clear policy are in the design. The recurring daily DB proposal conflicts with the finite pool; recommended resolution is no recurring daily DB, without changing today's ordinary crate.

Source review found separate, delayed Core wallet persistence and swallowed Ops save errors. Exactly-once interrupted cash delivery needs a narrow future Core/Economy acknowledgement/marker lease and a single-writer policy; the current planned runtime lease is insufficient. Persisted gold also needs an offline duration boundary before work, since the accepted away event is emitted afterward. Neither gap was fixed. Printing/live-state behavior uses the accepted API. Full reset still clears namespaces; permanent ownership/purchase retention remains an LG-02 owner decision.

Four historical source-matched phone captures were personally opened in both editions at 390x700 and 360x560. The proposed 44px three-summary Goals button replaces the visible phone news slot after progressive reveal; full rows stay in Awards. New markup fit is unverified. Existing pixel 360x560 information text wraps into fragments, an out-of-scope layout handoff. T3 preview_status then preview_open succeeded on a blank isolated tab; no game navigation or save mutation, alternate browser, fresh screenshot, reward test or implementation acceptance occurred. Evidence is under evidence/LG-01/. Q5/Q6/Q8/Q9/Q10, deferred endpoints and the historical-wallet exception remain unchanged.

Repair r2 narrows descriptor durability to acknowledged preparation/atomic Ops commit. Failed preparation retains only volatile progress/sample, with no payout or saved claim. Proposed transaction pause blocks conflicting progression/writes until recovery; cash reconciliation uses a per-claim run delta marker, never a stale run snapshot. Initial migration must persist before new events. Missing later nonhistorical L/C metadata is held for repair without inventing rates; fixed DB/G reconciliation retains new origin. These are owner proposals awaiting independent review and later failure tests.

The concrete writer proposal uses one browser-owned exclusive Web Lock for both editions before enabled wallet/Ops reads, migration or startup. Second tabs remain nonwriting and blocked with Retry; unsupported/rejected acquisition fails closed. Hidden ownership, pagehide release, crash/unload cleanup, bfcache reacquisition and fresh-state reload are specified. Source requires future boot-gate leases for app.js and classic.js plus shell sequencing and narrow Core/Economy guards. Disabled legacy behavior remains unchanged; no implementation/support proof is claimed.

Stored-gold behavior now directly requires the already-proposed pre/during-away seam: split permitted game time at the remaining 15-second timer, preserving away caps, efficiency, original batch budgets/RNG and Deadline chronology. The existing after-away event is insufficient. Exact offline behavior remains UNVERIFIED. R2 performed source/document checks only, without browser/runtime/save mutations; r1 phone/image receipts remain historical.

Independent review r2 passed all three repaired document contracts and rechecked all 68 catalogue IDs/names/tiers with zero mismatches. This supports owner presentation only. The manager rechecked eight runtime/shell identities after review with zero mismatches. Payout, recovery, browser support, new UI fit and pacing remain UNVERIFIED until implementation acceptance; the owner has not yet approved this resulting design or the expanded persistence/bootstrap lease.

Owner subsequently approved the resulting design and narrowly expanded implementation scope on 2026-10-12. This includes the 109-DB existing-content catalogue, its rate/floor/cap assignments, DB-only historical backfill, fixed stored rush/reset behavior, progressive phone ticker replacement, finite DB/no recurring daily DB, transaction pause and writer policy. Q5/Q6/Q8/Q9/Q10, prices and paid full-reset ownership remain open. Prior proposal/review entries above remain chronological history, not current approval status. No runtime proof follows from approval.


Parent acceptance2026-10-12 supersedes the earlier candidate/HOLD status only for the current source. Different-model QA r3 found no material in-scope defect. Parent checked 72 input hashes, exact complete disabled raw equality and mapped/current images. Historical failures, diagnostics, old provenance and all unverified boundaries remain in LG-01-accepted.md. Next-task approval is still required before LG-02 design dispatch.
