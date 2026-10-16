# LG-02B2 r3: keep tutorial guidance clear of save recovery

## Goal

Repair the confirmed first-run tutorial obstruction of the existing held Retry panel. The existing tour promises a coach mark that never blocks its target, and already hides during busy/modal states. Extend that behavior to actual save recovery: temporarily hide the bubble and ring while a visible writer recovery panel requires attention, then resume the same tour or tip when recovery finishes. Preserve the approved Retry panel, chips, focus, copy, mandatory introduction and ordinary tutorial behavior. This is a scoped defect repair, not a new tutorial design.

## Files owned

- tour.js: only busy-state recognition and the minimal notification/observation wiring necessary for immediate hide/restore. No new tutorial steps, copy, completion/reset/skip policy or game mutations.
- sw.js: cache version only imi-v32 to imi-v33 so the changed tour is served. Asset list and worker behavior unchanged.
- NEW tests/tour-save-hold.test.cjs, if needed for meaningful timing/state/focus/ownership regressions.
- NEW tools/long-game/lg02-b2-r3-* verification helpers only.
- NEW docs/plan/long-game/evidence/LG-02/tutorial-repair-b2-r3/**, except parent dispatch.json.
- NEW tools/long-game/fixture-lg02-b2-r3-20261013/** and qa-lg02-b2-r3-20261013-* output leaves only.
- This task's Status and Handoff notes only.

No other product file is leased. Rewards, Ops, Core, Vault, gate, Economy, HTML, CSS, minigames, prior tests/helpers/evidence, master/design documents and original/r2 task Status sections are read-only. You are not alone in the checkout; preserve others' changes, staged/index state and historical bytes. The r2 runtime author has finished; no concurrent Ops writer exists.

## Files to read

Read docs/plan/README.md, docs/plan/long-game/README.md, premium-currency.md, LG-02B2-coordinator.md and LG-02B2-completion-r2.md. Read LG-02B2-vault references via LG-02-vault-design.md and LG-02-owner-review.md where relevant to recovery. Read the actual r2 HANDOFF.md, FAILURES.md, final-image-review.json and final-classicHeldFailure.json in evidence/LG-02/implementation-b2-r2/. Inspect actual tour.js, Rewards status/timers/ownership API and Ops onStatusPresentation caller. The callback onStatusPresentation already has one owner in Ops; never replace it with a second consumer.

## Prior findings and current state

Original implementation round was cancelled during prerequisites. Completion r2 implemented the original coordinator lease and completed accessible verification, but remains HOLD. Its 201/201 serial tests, three complete raw parity pairs and eight native lifecycle/media cases are author results, pending different-model review. Parent rehashed all 1,303 closing-seal records on 2026-10-13 with zero differences and personally opened both 390x700 failing held images. Actual Retry hit test returns p.tour-txt in both editions. Keyboard Retry recovers once; that does not satisfy pointer access.

Keep all original failures immutable. Default raw before/after reports are complete; separate contemporaneous command/stdout JSONs were missed. Handoff-time command-policy readback is explicitly not an original capture. This qualification remains for independent review; do not fabricate or erase it. New executions must retain actual command/stdout/source receipts.

Current HEAD is 7d1e3863c10f642b4ed786786ddda8315038ab9c, branch long-game. Minigames are locally merged into main and read-only here, with separate mg: scores. The r2 tested runtime hashes are Core dc28915b44f6d6635cfded59a90f05afef6cc5501c95b6cf60c776722f9b1650, Ops 95493e39f1426562da4677696fde0e4024c83f2e50ff76aa4693d311848dbab7, Rewards 3d6637758c20bb71b0d717dcd33120f5e3baa51d99f06d643da10d0b4b2e087f, Vault 09d31120fa187327acf61c93ce1c047b51c65ebc0d405bc28792639f2fa112c7. These four files must stay byte-identical during this repair.

## Exact deliverables

1. Before edits, freeze exact leased source/index and the four runtime hashes, ownership/read-only inventory and actual pre-repair obstruction evidence at both editions. Use the real first-run tutorial and existing held panel; no mocked successful ack, writer/gate bypass, injected alternative UI or artificial removal of the tutorial. Internal boundary-only invocation in an admitted task document remains the original approved fixture scope, not economic/UI activation.
2. Apply the smallest justified tour-only fix. Respond immediately when the recovery panel becomes visible, including insertion, movement into the Ops pane and repeated Retry failure. Do not rely on productive timers that are themselves suspended during holds. Avoid broad redraws or leaking observers/listeners after owner loss. Preserve ordinary default/off behavior, mandatory introduction, current step/tip/persistence and existing Ops status-presentation ownership. Hide the tour without finishing/skipping or stealing Retry focus; restore the same pending guidance after success.
3. Update only the service-worker version to v33. Verify fetched/disk/activated controller/cache tour identity in both game shells, plus Balance cache identity where accessible. Version text alone is insufficient.
4. Meaningful checks must cover visible recovery insertion and subsequent hide/show, both genuine failure and success, pointer retry with a continued failure then one successful continuation, keyboard/focus behavior, same tutorial step before/after, no premature intro completion or lost tip, current holder/owner-loss and no recovery/default paths. Call actual DOM/caller APIs and real failing storage writes, not a rewritten test model. Preserve failure injections and first failures.
5. Native T3 checks at 1280x800,390x700,360x560 in both editions. Export and personally open held and restored-tour states, with normal no-hold and blocked-save controls. At the Retry center and actionable corners, elementFromPoint must identify Retry/its child and real pointer activation must reach recovery. Keep chips between message and Retry, targets >=40px, no page scroll, internal held scroll, reduced motion and Effects Low. Check the original enlarged text fixture with an explicit limit on native text-zoom claims.
6. Check JS syntax, meaningful focused tests and fresh complete 60-minute default raw parity with exactly the original seed1 active collect activeMinutes180/session60/tune{} GUARD240 policy. Preserve contemporaneous commands/stdout/results and compare only the five approved metadata exclusions. No Ops/runtime mutation is leased; if such a change is needed, return a dependency instead of broadening scope. Do not rerun historical writers without validated exclusive routing to NEW destinations. Parent independent full coordinator QA follows this small repair.
7. Complete all accessible lanes, retain immutable failure/source/image/geometry/storage/callback/cache/command receipts and read-back audit. HANDOFF must state exact files/changes, baseline, unchanged four runtime hashes, original qualification, remaining failures and UNVERIFIED boundaries. No coordinator acceptance, native Vault admission, shared/public safety, economic/provider readiness or pacing claims.

## How to verify and environment

T3 preview_status/open first, then own tab and a new verified-unused task origin with one game document and task saves. Do not use or modify the user's port8000 origin. Prior task8312 is reported cleaned; historical8194 server and8181 erasure remain unverified, never blindly adopt/kill/clear. Preserve unrelated8123/8147/8148/8162 listeners. Temporary headless balance and actual reduced-motion preference use the existing documented workflow and owner-authorized isolated Chrome scope; ordinary UI uses T3. Track exact PID, root, command, numeric creation epoch and listener ownership before stopping own server. Clear only own origin from an inert document and close own tab/profile. No packages or build tooling. Use new exclusive writes and a real existing-output inventory before any routed suite; no moves/overwrites of old output.

## Status

ACCEPTED LOCALLY 2026-10-14 by explicit owner instruction. See LG-02B2-accepted.md. Historical numeric exit codes remain UNVERIFIED under the accepted exception. No runtime activation or whole-LG-02 completion.

Historical round result retained:

REPAIR CANDIDATE FOR INDEPENDENT WHOLE-B2 REVIEW 2026-10-13. Narrow tour busy recognition/immediate recovery wiring and version-only imi-v33 repair complete. All accessible r3 lanes pass: 8/8 focused actual-caller tests, complete default60 raw parity, six native T3 size/edition pointer-failure/recovery cases, personally opened images, enlarged-text/internal-scroll qualification, 4/4 actual media/Low cases, source/cache/read-back preservation and owned cleanup. Original B2/r2 HOLD and its command-capture qualification persist. No acceptance, default/economic activation, staging/commit/push/deploy or child work. See evidence/LG-02/tutorial-repair-b2-r3/HANDOFF.md and FAILURES.md.

## Handoff notes

Existing panel/chips/copy/Retry focus and Ops' sole onStatusPresentation consumer remain unchanged. Bubble/ring hide at real panel insertion/movement/hidden changes without productive timers; the same pending step/tip resumes after success. Protected Core/Ops/Rewards/Vault bytes and all 26,734 read-only inventoried entries remain unchanged; index unchanged. Fresh native pointer Retry fails storage again then resumes once in both styles at all required sizes, without finishing introduction or page scroll. Fresh six blocked-byte controls preserve exact acknowledged keys. 200% held-content DOM text is not native browser zoom; fresh independent whole-B2 QA, native Vault admission, shared/public/economic/provider/lifetime/hardware/physical/accessibility/pacing lanes remain UNVERIFIED as mapped in HANDOFF. Original/r2 failure evidence stays immutable.
