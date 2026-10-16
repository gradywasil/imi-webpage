# MG-01: playable hosted Break Room and Inspiration

## Goal and approval

Build the first playable slice of the owner-approved minigame design: Barrel and Shuffle hosted inside the idle game, saved rewarded breaks, Inspiration earned from active play, free practice and safe return while factory production stays online. The owner approved minigame-progression-scope.md and the bridge -> tree -> Printings sequence on2026-10-14. Use skeleton-validation-policy.md; keep this forward-moving and proportionate.

The approved prototype knobs: six shared rewarded attempts, one refill per two real hours, stored attempts do not expire. One attempt covers three minutes of actual active play in the selected game, with free retries inside it. Base10 Inspiration accrues over the first60 seconds across losses/retries, with fractional credit preserved between breaks. Countdown/menu/pause/hidden time earns none. At least one actual gameplay input is required. Bank once at the first natural finish after the minute, on quit for earned partial credit, or with Bank and keep practising at three active minutes. Practice never pays. Performance bonus0-5 is approved later after per-game calibration; MG-01 uses base only, as allowed by the approved design. No regular idle earning or conversion of local Diamond icons to DB.

## Read first

docs/plan/README.md, long-game/README.md, minigame-progression-scope.md, skeleton-validation-policy.md, LG-02B2-accepted.md, this task. Then actual extension/save/Printing/tick paths in ops.js, common shell contracts in minigames/mg-core.js, both selected games/HTML, main script order/styles and worker. Read discovery.json for source pointers instead of broadly exploring unrelated systems. Existing B2/Premium work is accepted within its limited scope; do not reopen historical evidence or complete the Vault here.

## Files owned

- NEW minigame-progression.js: parent state/session/UI/host integration through extension seams.
- NEW minigame-progression.css: shared layout plus both edition treatments, reusable current art.
- NEW minigames/hosted-bridge.js: narrow same-origin child messaging and hosted navigation.
- minigames/mg-core.js: only opt-in hosted phase/input/start/finish/retry/back hooks; standalone behavior unchanged.
- minigames/barrel-catch.html and coconut-shuffle.html: hosted bridge script registration only, plus minimal hosted accessibility/config attributes if necessary.
- minigames/barrel-catch.js and coconut-shuffle.js: only small end-reason/input/metric adapter hooks if common shell cannot supply them. No retuning/art/gameplay rewrite.
- ops.js: ONLY the narrow acknowledged save/publication seam needed to commit S.meta.minigames and reset-time integration if necessary. Do not change existing save behavior/default mechanics, speed provider, production formulas or B2/reward/premium guards. Sole Ops owner.
- index.html, classic.html, tools/balance.html: parent script/CSS registration only, no shell redesign.
- sw.js: add new relevant assets and bump imi-v33 -> imi-v34; existing worker behavior unchanged.
- NEW minimal tests/minigame-hosted.test.cjs and/or tools/long-game/mg01-* helpers only if necessary for the focused checks below.
- NEW evidence/MG-01/implementation-r1/** except parent dispatch.json; NEW tools/long-game/fixture-mg01-r1-20261014/** and qa-mg01-r1-20261014-* leaves only.
- This task's Status/Handoff notes only.

All other source, rewards.js/core.js/economy.js/vault/gate/tour, old tests/helpers/evidence, worktree/main branch, other minigames, master plans/statuses and premium are read-only. You are not alone; preserve others' dirty work and do not revert it. No children, new build tooling/dependencies, art generation, commits/staging/push/deployment or default/public activation.

## Exact deliverables

1. Use a development opt-in ?mg01=1, independent of whether the owner also enables LG01. When absent, do not initialize new save data, consume RNG, change rates or alter ordinary screens. Add a quiet Break Room entry after the mandatory intro is complete; use an explicit controlled test save to reach it, no bypass/skip tutorial in production. Headless balance must remain inert with flag off. New scripts register in both editions, Balance and worker.
2. Parent overlay/panel hosts the two allowlisted existing game pages in an iframe. Parent stays on IMI game screen and keeps its normal tick/auto typing/keeper/royalty work. Opening/closing does not navigate the main page, pause the parent, invoke simulateAway or manufacture away rewards. Real browser hiding retains existing offline behavior. Hosted Back/Quit closes or returns within the parent; never loads an idle index.html in the iframe. Standalone pages continue functioning normally when not hosted.
3. Implement optional versioned S.meta.minigames with wallet/fractional credit, attempts/refill timestamp, monotonic next session, one active break and settled identity. Keep it compact; no second premium/reward ledger or accounts. Retain through Printing via existing meta/reset seams and use current state() rather than a stale S reference. Unsupported future data is preserved and feature refused safely. Existing guarded full Settings reset policy unchanged; no NG+ decision here.
4. Attempts are shared across both games, initially six on first feature initialization. Real-time refill applies only to attempts, not currency, and is independent of premium/game speed. Clamp backward elapsed refill to zero and capacity to six for MG-01. Save charged start before enabling rewarded play; cancel/countdown before actual play costs nothing. Free retries within the same charged break carry actual play time, and another charged break needs an explicit Rewarded choice. No paid/ad refills, expires/streaks, random currency rewards or public scoreboards.
5. Parent owns main state and all reward calculation. Child reports structured phase, gameplay input, end reason and bounded elapsed/metrics through a small origin/source/game/session-checked protocol. Use actual host/phase/time signals, not display-stat parsing or arbitrary client currency amounts. Count visible unpaused gameplay after meaningful input, excluding menus/countdown/hidden, across retries to the180s break cap; base capped10 after60s. Preserve partial/fractional progress and acknowledge a single settlement. Results from wrong frame/session or duplicate past settlement cannot pay. Closed/reloaded breaks cannot refund or manufacture elapsed time; resume persisted credit without charging again or bank saved partial via explicit choice. No complex anti-cheat platform, telemetry or full crash-durability promise.
6. Save start/progress/settlement through actual acknowledged storage. Existing extension save returns no success in the legacy path, and existing saveAcknowledged requires Rewards ownership; inspect actual code and add the smallest conditional minigame-only seam needed. Do not infer success from an undefined legacy return or fake a successful ack. Publish attempted grant/spend state only after the actual write succeeds, preserving unrelated current state/unknown fields. If storage refuses, keep the pending result for a simple Retry, forbid a second payout and show a clear state; do not broaden B2/premium readiness or commandeer its statusPresentation callback. Respect writer ownership/guards whenever Rewards is enabled. Do not expose an unrestricted generic setter or bypass the Vault gate.
7. UI shows Inspiration, attempts/quiet next refill, Rewarded/Practice selection, progress and safe bank/return. Both editions use their established parent visual language while the games reuse pixel art. Targets>=40px, no main page scroll, workable360x560 wrapper/internal overflow, keyboard focus reaches the iframe and close/return; avoid parent typing shortcuts firing while user plays. Respect reduced-motion/Low using existing patterns; no new-art redesign. No tree purchases/stat boosts in this slice; those are MG-02.

## Focused verification only

Before edits record changed-source hashes and current dirty status; capture a short5-minute seed1 active/collect default balance control using a NEW output. No full historical inventories,209-suite repeats, cache transition matrix or numeric-exit investigation. Verify after edits with same short policy, compare stable report content excluding only metadata, and retain command/output basics. It is a short default regression check, not full-hour parity proof.

Check syntax for changed/new JS. Focused main paths: rewarded start charges once; natural short losses retry within same break;60s accumulated play grants10 base once; quit banks partial; duplicate result refused; practice gives0; saved wallet/attempt/partial state reloads; Printing retains meta; one real failed storage write followed by Retry grants once. Use actual APIs/storage, never a rewritten model, real-success stub or production guard bypass. A controlled developer fixture may advance the dedicated minigame clock for a functional check, clearly labelled; also play a genuine short native game and observe factory state/counters growing while child is active. No full long-horizon/pacing claim.

Native T3 preview_status/open first, own temporary origin/save, one main game document plus the approved hosted minigame iframe. The one-document rule refers to the main save owner; the iframe contains only the minigame, no second Core/Ops game. Check both editions at desktop and smallest phone, opening/playing/back and inspect actual screenshots yourself.390x700 only if a distinct layout/breakpoint warrants it. Report browser media preferences carried versus actually emulated. Use existing documented headless harness for smoke/focused tests; ordinary UI T3. No browser-tool expansion or unnecessary permission requests. Preserve user port8000 and unrelated services; stop only identity-verified own helper, clear only own task keys/origin from inert and close own tabs/profile.

Do not execute old helpers that mutate source or write historical destinations. New outputs exclusive; small targeted routing only if the chosen helper actually has a historical writer. Preserve first relevant failure but do not build another evidence platform. Once focused checks pass, stop expanding verification and hand back the playable slice with launch URL, changed files, checks and short deferred list. Parent will perform a proportionate review.

## Status

ACCEPTED LOCALLY 2026-10-14 as an opt-in skeleton after one proportionate independent review. See MG-01-accepted.md. Default off; no commit/staging/deployment. Next approved slice is MG-02.

## Handoff notes

Independent GPT-6 Sol review found no playable/save/reward blocker. Parent personally opened all four final screenshots. Natural-duration feel, broad lifecycle/pacing and true reduced-motion remain deferred. Original implementation evidence is preserved; acceptance adds no product code.

See [implementation-r1/handoff.md](evidence/MG-01/implementation-r1/handoff.md) for launch URLs, changed files, actual/carried browser preferences, source identity, screenshots, commands and limits. Final focused-r4 passes26 actual-browser checks across default and lg01a writer contexts; syntax and short5-minute seed1 default control comparison pass. First failures in focused-r1/r2 remain preserved. All four final desktop/360x560 screenshots were personally opened.

Parent factory continued online while native Barrel was active; hosted Back returned to the same main URL with no second Core/Ops document. Real quota refusal followed by Retry granted once. Printing already retains meta, so no reset formula change was needed. Progress checkpoints about once per second and at the180s cap; only acknowledged saved credit can resume after reload.

Pixel launch: http://127.0.0.1:8341/index.html?s=pixel&mg01=1#play. Classic: http://127.0.0.1:8341/classic.html?mg01=1#play. Serve the root on8341; the task helper was stopped after cleanup. The feature still requires the real completed intro, with the controlled check save recorded separately. Existing style-swap may drop development flags on Settings navigation; reopen the direct opt-in URL.

Bonuses await calibration, tree implementation is MG-02, and broad profiles/lifecycle/hardware/pacing remain deferred. No paid admission or default activation. B2's explicit owner acceptance remains closed. Index and unrelated dirty work preserved.
