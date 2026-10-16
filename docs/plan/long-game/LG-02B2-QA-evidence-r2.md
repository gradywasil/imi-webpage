# LG-02B2 evidence disposition review, round 2

**HOLD only for explicit owner disposition of the unrecovered historical numeric process exit codes. The original default command/environment/stdout evidence is recovered and independently verified.** The remaining exception is smaller than finding 1 in the prior whole-slice QA report. No product repair is indicated by this review.

Reviewer: GPT-6-Astra, low, 2026-10-13 America/Denver, receipts 2026-10-14 UTC. Workspace `C:/Users/arran/Projects/monkeyOS-v2`, branch `long-game`, HEAD `7d1e3863c10f642b4ed786786ddda8315038ab9c`. No children. This supersedes the evidence disposition of [QA finding 1](LG-02B2-QA-runtime-r1.md) only to the extent proved below. Original reports, failures and HOLD records remain immutable. It is not owner acceptance.

## Contract and review scope

The exact lease is [LG-02B2-evidence-review-r2.md](LG-02B2-evidence-review-r2.md). I read it and the original coordinator, completion r2, tutorial repair r3, whole-QA brief and independent runtime report in full. I also read the full Vault design, selected owner package, governing plan/premium records, accepted LG-01/A/B1 boundaries, B1 QA2 and its accepted exceptions, B2 preflight/runtime scope, relevant execution and reward-contract records, r2/r3 handoffs and failures, and the named preservation, prerequisite, source, parity and recovery evidence. Large identity lists were parsed and rehashed rather than treated as narrative claims. Current documents control; memory was only a routing aid.

Coordinator deliverable 1 literally requires a fresh pre-edit default `raw/command/exit/hash`. Deliverable 12 requires a fresh complete AFTER under the exact BEFORE policy and whole-report comparison with only five named exclusions. Deliverable 14 requires retained source, raw and handoff receipts. The whole-QA brief explicitly requires actual command/environment/stdout/stderr/exit/source receipts for its fresh runs. Nothing in those requirements makes a separate r2-era JSON filename the sole acceptable form of original command/output evidence. The exit requirement remains substantive.

This was a read-only historical evidence assessment, not another runtime execution or a new independent source audit of every caller. No passing 209-test suite, browser matrix or hour run was repeated. The two minimal new helpers hash preserved files and compare retained JSON/timeline records; they write exclusively to the new review evidence directory.

## Independently recovered original records

I called `mcp__t3_code__t3_thread_read` directly against original child thread `thread:delegated-task:command%3Amcp%3A690947cf-9f9b-4721-ae0b-a2b953366e58%3Adelegate-task%3Aimi-long-game-lg02b2-completion-r2-20261013`, using activity view and each complete provider item ID. Both returned exactly one untruncated item, with `nextTextOffset:null`. Independent current exports are [BEFORE](evidence/LG-02/qa-evidence-b2-r2/before-independent-timeline.json) and [AFTER](evidence/LG-02/qa-evidence-b2-r2/after-independent-timeline.json). These JSON files were created during this review, not during r2.

- BEFORE: position 28, `turn-item:provider:codex:native-item:exec-7b32b3ce-c751-4d67-b368-be53ada37271`, updated `2026-10-13T21:06:49.146Z`, 1,876 UTF-16 text units.
- AFTER: position 224, `turn-item:provider:codex:native-item:exec-06ec4855-097b-421c-9dad-61c03b5c02da`, updated `2026-10-13T22:57:08.908Z`, 2,810 UTF-16 text units.

Both contain the original PowerShell command, explicit `PUPPETEER_MODULE`, `GUARD=240`, `BALANCE_TUNE={}`, and `node tools/balance.mjs 60 active collect 1 180 '{}' --session 60`, exact commit, origin8312 URL and original output filename. Both contain the full console completion line, milestones and `FINAL` object. AFTER additionally invokes `node tools/long-game/lg02-b2-r2-parity.mjs final` and retains its final three-pair comparison output. These are the original durable execution records, distinct from the handoff reconstruction.

[Independent binding validation](evidence/LG-02/qa-evidence-b2-r2/independent-binding-validation.json) proves deep equality of each entire retrieved item with the corresponding parent's exported `item`, including text, IDs, provenance, status and timestamps. Each console `FINAL` exactly equals its original raw `report.final`. Both raw reports record complete60, exact requested policy, no stopped reason, no captured simulation errors and no HTTP errors.

The preserved original byte hashes are:

- `before-hour.raw.json`: `929397a189b2f2045f6c5e9a5a09c17667f969bf6a3c7d74783c28d760a108ef`.
- `after-hour-final.raw.json`: `0c9399695b9286ae1a6a195533507b2b4c182ec03ff0cb9cd3ab7b60f8182b38`.

All five recorded BEFORE response hashes match the frozen pre-edit source files. All five AFTER response hashes match current disk. This is the harness's actual recorded Balance/Economy/World/Ops/Bot coverage, not a claim that the raw report independently hashes every game module. The broader module identity comes from the preserved source seals and whole-QA evidence.

I independently retrieved the [position62 Vault edit](evidence/LG-02/qa-evidence-b2-r2/edit-independent-timeline.json), updated `21:12:29.004Z`, and inspected the narrowly bounded early command/file-change timeline. BEFORE raw capture at `21:06:49.100Z` and its completed command record precede that first displayed product file change. The source seal at `21:06:08.835Z`, native Core prerequisite and frozen/raw source identities support the same pre-edit boundary. This is displayed timeline chronology plus retained source binding, not a claim of an exhaustive filesystem mutation trace. AFTER raw capture is `22:54:33.685Z`; its item update includes completion of the bundled comparison. Item update time is not relabelled as process start or raw capture time.

I recomputed all three original full-report parity pairs, deleting only `capturedAt`, `sourceCommit`, `sourceHashes`, `url`, `wallSeconds`. Default canonical pretty-JSON-plus-newline SHA256 remains `017fae08d71fe4064f0ef4cd05a75dfecc449b5581677e351934bda54dd507ee`; LG01-only and both-flags controls remain `b6e4d97e55210a176066bd17606202733540e202c5ee09263ed238f39f0561b6`. The original AFTER console comparison exactly matches the preserved comparison receipt. No gameplay field was excluded and no simulation was rerun.

## Superseding finding 1 disposition

**CLOSED: original exact command, explicit environment and console stdout capture.** Durable contemporaneous tool records satisfy that part of the evidence requirement despite their later export to standalone JSON. Calling those command/stdout records absent is no longer accurate. The absence of separate JSON files created during r2 remains historical bookkeeping, not an additional invented format blocker. The existing `default-command-policy-readback.json` remains a reconstruction and was not promoted to original evidence.

**PASS: preserved raw bytes, complete/error-free captured results, five-exclusion parity, source bindings and pre-edit chronology.** Error-free here means the report's captured simulation/HTTP diagnostics and retained console output. It does not establish a separately captured empty stderr stream or a successful process exit.

**UNVERIFIED, residual HOLD: historical numeric process exit codes for those two default execution records.** The API exposes `status:completed`, but no `exitCode` or equivalent numeric field, signal or separately labelled stderr channel. The original text does not print a numeric exit. The API's run completion status does not supply it either. AFTER bundles the default balance process and parity process with a PowerShell semicolon; even a hypothetical shell completion code alone would not automatically establish both child process exit codes.

I inspected the unchanged harness, SHA256 `73bc4d5e0c816cb9b664108bc22e504f1ed6f2baf9e7acd0ea533fabb4788224`, equal to its frozen pre-edit copy. It writes raw at line66 before printing FINAL at line70 and sets `process.exitCode=1` when incomplete at line74. This supports the raw/stdout relationship and explains expected behavior. It is not observation of a historical exit0. No new run, passing current test, complete raw flag or inferred code path fills that missing fact.

The accessible original records therefore close the broad command/stdout objection, but not the literal exit requirement. I recommend owner acceptance of this narrow evidence exception because the original commands/output/raw/source chronology are now bound and unchanged current-source independent technical proof is complete. The proof is sufficient for a qualified internal-slice recommendation; it is insufficient to mark historical numeric exit capture PASS without an explicit exception. No code repair or historical rerun is requested.

## Source-bound technical results carried forward

[Preservation receipts](evidence/LG-02/qa-evidence-b2-r2/preservation-after.json) bridge the existing whole-QA results to the current six source hashes, all equal to its exact brief:

- Core `dc28915b44f6d6635cfded59a90f05afef6cc5501c95b6cf60c776722f9b1650`.
- Ops `95493e39f1426562da4677696fde0e4024c83f2e50ff76aa4693d311848dbab7`.
- Rewards `3d6637758c20bb71b0d717dcd33120f5e3baa51d99f06d643da10d0b4b2e087f`.
- Vault `09d31120fa187327acf61c93ce1c047b51c65ebc0d405bc28792639f2fa112c7`.
- Tour `83a991fb6c52e4e3577957e3b352dadd4ac6e01b402d7711b41d18ccf36a2f8e`.
- Worker `7b64c1de657481b30a499a979704f5f5076f5a487e31817b0aa61fdfcccb12b0`, current v33.

All 607 whole-QA closing records, 1,303 r2 records and 432 r3 records rehash without drift. The QA seal itself remains `db4649844d3b27f2a0480e17244d4380e1fd87ba4ef7c347c11b88c89e44c9a7`. The review's 27,796-file preservation baseline includes the existing QA inventory paths, all three seals and their records, current plan/report documents, parent exports and this review's parent dispatch. Final readback finds zero drift; raw index, staged content, tracked status, branch and HEAD remain unchanged. This is a current review preservation baseline, not a recreated r2 inventory.

The following remain the prior independent Astra-medium QA's results, carried through that identity bridge, not freshly executed by this evidence reviewer:

- 209/209 unchanged serial tests, zero failures/skips/cancellations, observed exit0 in the QA receipt; five additional adversarial groups; exact visible work/RNG conservation and malformed source/wallet refusals. Two native actual pending-wallet-timer hold cases preserve both saved keys.
- Six complete frozen/current60-minute runs form all three raw parity pairs, with their own actual commands/stdout/stderr/exit receipts. Original and fresh controls match only under the five approved exclusions. This proves captured-report parity, not exhaustive heap/RNG identity or pacing.
- Current v33 both-edition old-save/Core play/save/reload and unknown-field controls; default/LG01/both no-intent paths; all six exact blocked-byte controls and direct loader/ack refusals. Full-shell Vault saves remain blocked.
- Native Pixel/Classic at1280x800,390x700,360x560: Retry pointer failure then one successful continuation, immediate tutorial hide, same-step/tip/focus restoration, target size and no page scroll. Both chips remain accessible through internal scrolling, including exact200% paragraph/chip DOM fixtures. The prior independent image inspection carries with unchanged images; no fresh visual inspection or browser mutation is claimed here.
- Eight current real media cases across reduce/no-preference and High/Low; actual hidden/resume intervals; both-edition native `pageshow.persisted=true`, old-owner inertness and tutorial disposal. Executed/fetched source and activated v33/cache checks, including75 fetched/cache-to-disk comparisons across the three shells, pass in their recorded lanes. Balance cache identity is not executed game Core/tour proof.

Original fourteen-item mapping is preserved: items2-11 retain their bounded whole-QA passes; item13 retains its current bounded native pass. Item1 now passes retained native/raw/source/command/stdout chronology with historical exit capture unverified. Item12 retains current syntax/209/raw passes and recovered original comparison, with the same historical exit qualification. Item14 retains current preservation/cleanup/handoff proof, qualified by that residual historical exception. All seven r3 technical dispositions carry unchanged; acceptance remains held for the narrowed owner decision. Prior findings2 and3 stay technically resolved/qualified as recorded. No new product defect was identified in this evidence-only review.

## Recommended owner disposition text

> I accept the specific historical evidence exception for the LG-02B2 r2 default BEFORE and final AFTER executions: their numeric process exit codes were not recovered and remain unverified. Their original durable commands, explicit environment, full console output, exact raw reports, source bindings and pre-edit chronology have now been independently verified. Together with the unchanged v33 independent technical QA, this is sufficient to authorize parent acceptance of the internal coordinator and r3 tutorial repair only. Preserve the original failures, prior HOLD reports and this exception. This approval does not authorize native Vault admission, economic/provider activation, shared/public or paid use, hardware durability, physical-device/zoom/accessibility acceptance, volatile lifetime fairness, pacing, deployment, default activation or a new implementation lease.

This is proposed wording for parent presentation, not an approval received or requested by this sub-agent. The requirement for owner disposition comes from the literal original coordinator exit clause and this evidence-review lease's instruction not to waive a required unrecoverable fact.

## Status and handoff

Review complete. Technically suitable for parent consideration of this internal slice, with HOLD narrowed to historical numeric exit disposition. No requirement for a particular JSON format was added. No historical export was called contemporaneous on disk, no exit0 was invented, and no prior finding or failure was overwritten.

Full-shell native Vault recovery/admission; economic debit/refund/activation and installed providers; shared/public/current-current/stale-writer safety; paid provenance, backend/legal/prices; pickup/native-gold/buff/production-object lifetime fairness; store/Undo/slots/reset/automation; hardware crash/durability; physical/touch/native zoom/safe-area/audio/screen-reader or broader accessibility acceptance; all-profile/long-horizon/six-week/55%-80% pacing remain outside or UNVERIFIED. Historical8181 browser erasure and unrelated service ownership remain untouched.

Only this new report, new `qa-evidence-b2-r2` artifacts and two minimal `lg02-b2-evidence-r2-*` audit helpers were written. No original brief Status/Handoff needed editing. Product, tests, old helpers/reports/evidence, parent exports, plans, source and index remained read-only. No browser/server/save mutation, child, staging, commit, push, deployment, activation or next-slice work occurred. Inspection tool errors and their corrections are retained in `review-observations.json`; no product result was suppressed. The final seal binds this report, helpers and new receipts.
