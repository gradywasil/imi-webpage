# LG-02B1 independent catalogue/schema QA r1

**Recommendation: HOLD.** Independent GPT-6-Astra medium review of the Sol6 candidate, 2026-10-13, root `C:/Users/arran/Projects/monkeyOS-v2`, branch `long-game`. All accessible original review lanes were completed. Three validator defects and one evidence-ownership deviation prevent acceptance. Parent final image review and acceptance remain separate. No repair or next coordinator work was performed.

## Ordered findings

### B1-R1-01 — wall history incorrectly imposes transaction chronology — FAIL

[vault.js](../../../vault.js:8) accepts only nonnegative safe-integer timestamps; active/refunded receipts additionally require their wall time to be at least createdWallMs (lines73–75). The selected design separates monotonic Undo capability and acknowledged sequence from wall history: design71,76,129,158 explicitly allow backward wall adjustment and prohibit history dates deciding Undo.

The real-source fixtures `backwards activation wall` and `backwards refund wall` use createdWallMs1000 and terminal wall900, otherwise valid ledger/history. The candidate returns RECEIPT_ACTIVATION / RECEIPT_REFUND. A legitimate activation or accepted refund after a backward clock adjustment therefore becomes unsupported. A pure structural validator cannot establish elapsed transaction order from those dates.

Smallest proposed repair: validate the selected representable wall-date domain independently of sequence/status ordering; remove the created-to-terminal wall ordering requirement. Keep amount/sequence/Printing integer checks and malformed/nonfinite rejection. Add both backward-clock cases to meaningful real-source tests. No clock, timer, capability or coordinator implementation belongs in this repair.

Supplementary fixtures at createdWallMs -1000 and1000.5 also return RECEIPT_HISTORY. The design expressly says finite representable timestamps for its later transition descriptor and signed compensation, but does not separately spell out every receipt-date numeric boundary. These two failures expose the candidate's undocumented narrower domain; they are retained as **contract-domain qualification**, not two additional proven backward-clock defects. Parent should settle the exact receipt numeric domain against the existing selected contract without silently inventing a new policy.

### B1-R1-02 — a pending reservation can precede another purchase and satisfy a higher tier — FAIL

[vault.js](../../../vault.js:85) puts every nonrefunded receipt into `live`, then uses presence alone as the lower-tier prerequisite. It checks only the total undoable count, not whether that receipt is the latest acknowledged purchase or whether a prerequisite is active.

Three independent inputs are incorrectly valid: undoable game-speed:1 sequence1 followed by active game-speed:2 sequence2; the same pending lower receipt followed by active typist-speed:1; and followed by refunded typist-speed:1. These contradict selected design71/76: no new purchase while the one reservation remains unresolved; old active effects remain until activation. The third case still required an impermissible later purchase before its refund.

Smallest proposed repair: require the unresolved reservation, if any, to be the latest purchase in retained sequence history, and require an active lower-tier receipt for a later tier. Preserve legitimate active lower + pending higher, refunds, and repurchase. Positive and negative controls for those relationships are in the independent fixture set. This is structural validation, not a fabricated purchase engine.

### B1-R1-03 — retained purchase history can have holes or be erased — FAIL

[vault.js](../../../vault.js:56) checks only that nextSequence is positive/bounded and each key matches its sequence below nextSequence. It accepts: only sequence2; refunded sequence1 plus active sequence3; sequence1 with nextSequence4; and an empty purchase map with nextSequence2.

Design58–60 retains full structured history after refunds and never rolls sequence back. Original B1 deliverable4 explicitly forbids nextSequence erasing history. The empty example erases a zero-net-spend refunded receipt without triggering spend attribution; gap examples make missing receipts invisible.

Smallest proposed repair: validate the contiguous acknowledged receipt sequence from its defined initial value and nextSequence as its exact safe successor, including refunded rows. Failed unsaved intents do not authorize unexplained durable gaps. This detects those structural holes; it cannot authenticate a wholly forged/re-numbered local save, prove paid provenance, or replace later current-state transaction ownership.

### B1-R1-04 — test outputs were written/moved outside the authorized leaves — FAIL; historical completeness partly UNVERIFIED

The original lease owned new B1 evidence and explicitly named new tools output leaves. Actual immutable helpers instead wrote under LG-01 roots. Four move receipts and durable author tool entries establish:

| Original location | Retained B1 destination | Count |
| --- | --- | --- |
| LG-01/implementation-b/fixture-r1 | tests-initial-fixture-r1 | 69 |
| LG-01/repair-b-r2/undefined-*.json | tests-initial-away-baseline | 37 |
| LG-01/implementation-b/fixture-lg02-b1-implementation-r1-20261013 | tests-current-fixture | 69 |
| LG-01/repair-b-r2 task-prefixed outputs | tests-current-away-baseline | 37 |

The exact names/hashes are in audit-results.json; original move receipts and complete selected author commands remain linked by author-selected-timeline.json. Initial guard failure and corrected timezone comparison are retained. These are actual out-of-lease writes/moves, not compliant cleanup.

Both immutable writers use `flag:'wx'`; retained EEXIST failures demonstrate refusal to overwrite colliding artifacts. Current old tests/helpers and bounded prior evidence hashes remain intact. That evidence limits the concern and does **not** show wholesale historical corruption. However, creation times and post-move lists cannot substitute for an absent pre-run inventory of these exact source paths. Complete preexisting path ownership and every moved artifact's pre-run identity are **UNVERIFIED**. This review grants no historical exception and creates no retroactive inventory. Future reruns must route output to authorized new leaves before writing. No repair to old evidence was attempted.

## Contract independently established

The API is only a deeply frozen revision1 catalogue and pure `validate(state)` returning absent/valid/unsupported metadata. Every exported function serves that narrow purpose. It defines no quote, transaction, setter, provider, extension callback, timer, listener or startup hook. It reads no live state/storage/clock/RNG at import or validation. It never grants admission, effects or purchases.

Catalogue matches all selected values: game-speed and typist-speed four incremental costs150/300/500/800 with factors1.25/1.5/1.75/2; Plus100/200/400 for24/36/48h; extra Muse seat300; two-bed package200; Endless costnull/nonpurchasable. Space receipts use stage0→1, with capacity in effect metadata. No money prices, cosmetics, supporter, automation or extra free DB are added.

Highest-active-only per family is a documented effective-tier encoding, not a material hidden narrowing: lower receipts remain active in history and owned; the selected effects replace, rather than multiply, tier factors. The design requires item-ID→purchase-ID references but does not require every superseded stage to appear simultaneously in the effective map. Malicious lower-only reference, unknown key, missing highest, duplicate family reference and reserved/refunded active reference controls fail closed. This resolves parent observation3 without manufacturing a design defect. Later consumers must retain this documented distinction.

Known ledger totals, safe arithmetic, exact historical costs/splits, credits, refunds and source-spend attribution pass tested controls. Present balances cannot establish a historical earned-first split. Unknown innocuous fields survive because input is untouched, not whitelisted. Unknown item/revision/version, deferred selections, Endless ownership, nonempty Plus credits and any transition field are unsupported. OPEN/history recovery remains deliberately outside this subset. Owned receipts after Printing do not require current ordinary unlocks. Private Rewards normalization, claim eligibility, cash/stored-gold/away checks still belong to Rewards. `absent` deliberately does not certify a complete prem ledger or reward admission. Structurally valid synthetic bought credits are not verified paid credits; LG11 owns that trust.

## Source, chronology and original eleven deliverables

Start seal records483 bounded inputs, dirty status, branch, HEAD, raw index bytes and staged patch. The baseline is the dirty source freeze, never HEAD reconstruction. Eleven frozen source hashes were recomputed; seven non-shell read-only source paths match current. Removing precisely the one new Vault tag produces byte-identical frozen content in all three shells. Worker delta is exactly imi-v29→imi-v30 plus vault.js in the existing shell list. Gate stays before Rewards and Vault immediately follows Rewards.

| Original B1 deliverable | Disposition | Evidence / boundary |
| --- | --- | --- |
| 1. Fresh before/freeze/versioned capture | PASS, audited historical chronology | Corrected freeze08:16:24Z; complete before captured08:17:14.800Z; actual versioned fixture completed08:17:42; first production addition08:18:41. Unavailable SHA256.HashData failure remains earlier. Durable tool entries supplement file dates. |
| 2. Catalogue | PASS | Exact approved IDs, factors, incremental DB costs, capacity packages, null/nonpurchasable Endless, deep freeze. |
| 3. Pure module | PASS | Fresh VM ambient traps, frozen repeated input, source inspection and fresh browser import control. No game hooks or namespace creation. |
| 4. Ledger/receipt/history schema | FAIL | Source arithmetic passes controls; wall-history and retained-sequence failures above prevent schema acceptance. |
| 5. Chain/ownership/reservation | FAIL | Pending-order and active-prerequisite counterexamples above; other references/refund/repurchase controls pass. |
| 6. Unknown/future/malformed handling | PASS for bounded subset | Static diagnostics, preserved unknown fields, explicit unsupported OPEN/deferred/future cases; no raw private identifier echo in tested diagnostics. |
| 7. No writer/admission/paid engine | PASS | Definitions only; unchanged gate; fresh pure-valid fixture blocked in both editions and balance. |
| 8. Meaningful tests | PARTIAL / FAIL coverage | Author10 groups pass fresh; independent56 fixtures expose11 expectation differences (nine substantive, two qualified date-domain). No assertions weakened. |
| 9. Syntax, serial regression, complete raw parity | PASS measured lanes | Fresh23 immutable focused tests; five JS syntax and eight executable inline checks; source-preserved155/155 final suite and whole raw comparison. Output routing violates lease separately. |
| 10. Native/source/cache/images | PASS bounded controls | Fresh T3 oldsave/play/save/reload and blocked controls; actual activatedv30 and current module hash;15 historical +4 fresh images personally inspected. Media/Low/lifecycle carried only through unchanged source. |
| 11. Exclusive evidence/cleanup/handoff | FAIL original output ownership; PASS current cleanup | Out-of-lease moves and proof gap above. QA wrote only its evidence/report/brief Status/Handoff; isolated8189 cleared, tab closed, verified server stopped. |

The actual pre-edit fixture has economyVersion1 in wallet and Ops, manual3446 and retained root/prem unknown objects. SHA256 is 7c47f6e732bb637aa15e3be577bc28c6113bf7c9ed45e85e8b56638781e2b495. Author native raw observations independently show3447 Pixel save/reload and3448 Classic save/reload. Intermediate cache tuple4d03… and later1dae…/3b31… are historical, not final-source images. Final8187 tuple25b7… is separately bound by durable tool entries.

Prior QA-A2's111 bounded input hashes yield101 equal and10 changed: the four intended B1 registration files plus six parent plan/status records that evolved after that earlier seal. Those six are reported as historical identity differences, not attributed to B1 without evidence. All current read-only inputs are then protected by this review's start/close seal. No broad historical profile/tree inventory was performed.

## Fresh tests and whole-raw audit

Commands and failures are retained in this evidence directory. Fresh immutable `node --test --test-concurrency=1 tests/vault-schema.test.cjs tests/vault-startup-strictness.test.cjs`, GUARD240, exits0:23 pass, zero fail/skip. New `schema-review.cjs` executes exact current vault.js in a VM and exits1:45/56 expectations pass. Every case's complete pure-data input and actual diagnostic is retained. Coverage includes absence/empty, catalogue freeze, source overflow/totals, refund with intervening4 earned, repurchase, chain/status/sequence, unknown/prototype keys, settings/selections/revisions/cost/references, static private-safe diagnostics and repeated frozen-input purity. Its import+validation ambient-touch list is empty.

Author final immutable serial suite is155/155, zero skips,75.356s. Earlier results remain63/154 (missing module path),154/154,74/155 (fixture collisions),118/155 (away collisions), then155/155. The final schema has10 grouped tests; independent fixture counts are not advertised as equivalent test-runner counts. Correct UTF-16 summary extraction is separately retained. No duplicate full clean suite was warranted after source binding and focused checks; no old output path was used by fresh QA tests.

Before and all five after raw artifacts were independently compared as entire objects after removing **only** capturedAt/sourceCommit/sourceHashes/url/wallSeconds. All equal:
`017fae08d71fe4064f0ef4cd05a75dfecc449b5581677e351934bda54dd507ee`
using pretty JSON plus newline. Inputs are seed1, active/collect, activeMinutes180, session/requested/actual60, tune{}, complete=true, GUARD240 in recorded commands, no captured errors. Final sealed capture is08:44:49.751Z. Historical activeMinutes30 is a different policy and is not substituted.

The raw harness hashes balance/economy/world/ops/bot, not Vault itself. Final Vault binding therefore also uses the contemporaneous sealed source check, final native tuple, current module hash and demonstrated no-effect import boundary. This is captured-output equality, not exhaustive heap/RNG equality. No fresh reviewer sixty-minute run or invented fresh pre-edit capture is claimed.

## Fresh native and image evidence

T3 preview_status/open was used first. The review verified unused loopback8189 (empty local/session/cache/registrations), hidden task server, one owned game document and inert planting of the actual pre-edit fixture. Pixel LG01-only play increments3446→3447 with acknowledged save; bothflags new-document reload retains3447, root/prem unknown data, version1 and no Vault. Classic bothflags actual click/save/reload retains3448 with the same unknowns. Ordinary welcome/daily overlays were dismissed through real controls; no departing game reseed occurred.

After inert planting of an empty pure-valid Vault, Pixel and Classic bothflags block. IMI is undefined, Rewards disabled, unchanged saved keys, Core.boot refuses, Economy loaders refuse and acknowledged saves return not-owner. Post-load write instrumentation observes no writes during direct calls; that is distinguished from source/strict-test evidence for early startup. Balance also loads gate→Rewards→Vault and remains blocked with unchanged keys. Actual served HTTP logs bind all three shells/module requests to disk bytes.

Fresh worker is activated and controlling via8189/sw.js; imi-v30 contains exact Vault and shell/source hashes. Worker itself is not a shell cache entry, as expected. Since behavior differs only by version/list addition, the accepted A2 real v28→v29 worker transition is qualified supporting history; this review does not claim a fresh v29→v30 transition or old-loaded writer safety.

Browser import executed fetched current source in an inert document with storage/timer/listener/RNG/Date.now traps: zero hits, unchanged keys/DOM, absent result. The stronger VM traps additionally cover global/window IMI, DOM, navigator, performance, extension list, Date construction/properties and microtasks.

All15 original native images were personally opened: Pixel normal/cleared/blocked and Classic normal/blocked at1280×800,390×700,360×560. Four fresh final-source images show both normal desktops and both blocked360×560 controls. Panels fit; Retry focus is visible and measured268×53CSSpx; no blocked document scroll, and both fresh normal desktops measure1280×800 document/viewport. Phone raster2× dimensions are device scaling, not native zoom. Existing ordinary phone truncation, welcome and daily overlays are carried limitations, not repaired or relabeled new failures.

CSS/DOM/edition/media/lifecycle sources are unchanged, and Vault registers no hook. Thus accepted actual reduced-motion, Low, hidden and persisted-bfcache results carry only for those unchanged routes; no fresh media/lifecycle run is claimed or required by a demonstrated new effect. New Vault recovery behavior does not exist and receives no such acceptance. Native zoom, physical device, screenreader and audio remain distinct/unverified. Parent must separately inspect the images before any later acceptance.

## Cleanup, seals and stop boundary

Origin cleanup ran from inert /qa-inert: local/session keys empty, caches empty, registrations0. Owned T3 tab closed. Server PID99640 was stopped only after exact command/root/listener/creation epoch revalidation; initial date-serialization comparison refused safely. No temporary Chrome profile was created. Ports8173/8179/8181/8183/8185/8186/8187/8189 are absent at close. Unrelated8123/8147/8148/8162 retain the same PIDs. Prior8185/8186/8187 author cleanup receipts are historical; prior8181 browser erasure stays UNVERIFIED and was never adopted.

[Evidence HANDOFF](evidence/LG-02/qa-runtime-b1-r1/HANDOFF.md), [counterexamples](evidence/LG-02/qa-runtime-b1-r1/schema-results.json), [audit](evidence/LG-02/qa-runtime-b1-r1/audit-results.json), [failures](evidence/LG-02/qa-runtime-b1-r1/review-failures.md) and [closing seal](evidence/LG-02/qa-runtime-b1-r1/close-seal.json) retain the review. Final seal separates raw index SHA from empty staged-patch SHA and records only the authorized QA brief change among preexisting inputs.

Shared/current-current/stale writers, all-loader atomic admission, coordinator/current-state recovery, purchases/effects/Undo execution, paid trust, reset retention, full Vault/UI/wholeLG02 and LG13 six-week/all-profile55% capstone/80% layers2/3 including Away remain unaccepted. No prices, legal text, mechanics or selected policy were changed. **STOP HOLD.**

