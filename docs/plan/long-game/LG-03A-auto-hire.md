# LG-03A framework and base Auto-hire

## Goal

Build the first earned automation as a playable opt-in skeleton: displayed Printing2 unlocks per-desk Auto-hire, with a20-second interval and a25% starting letter reserve. Reuse existing manual hiring. Keep later A2-A5, tiers and challenge expansion staged within LG-03.

## Authority

The unlock, base interval and initial reserve are specified in the approved master. On2026-10-14 the owner approved the first active-play slice, including active-game-time scheduling, one global round-robin hire budget, operation during hosted minigames and offline hiring deferred. Later gates, tier/star costs and challenge/medal proposals remain unapproved. See evidence/LG-03/owner-approval-a1/receipt.json.

## Files owned

- NEW `automation.js`, NEW `automation.css` for configuration, scheduling and panel.
- `ops.js` only for narrowly shared manual purchase helper parameters, hire quote/hire-one APIs, guarded automation-config acknowledgement and registration seams if needed. No stat, economy, reset or reward redesign.
- `index.html`, `classic.html`, `tools/balance.html` for script/style registration only.
- `sw.js` for relevant new assets and cache bump, existing strategy unchanged.
- NEW `tools/long-game/lg03a-*` helpers and exclusive task-owned fixture/output leaves if needed.
- NEW `evidence/LG-03/implementation-a1-r1/**`, excluding parent dispatch.json, and this task's Status/Handoff only.

Everything else is read-only: Core/Economy/Rewards/Vault/gate/tour/pickups, minigame files, old tests/helpers/evidence, master documents and other worktrees. Sole Ops owner; you are not alone and must preserve unrelated dirty work. Every line of code must justify its existence. No children, dependencies/build tooling, art, staging, commits, push, deployment or public/default activation.

## Required reading

Read docs/plan/README.md, long-game/README.md, premium-currency.md, skeleton-validation-policy.md, LG-03-owner-review.md and MG-02-accepted.md. Inspect actual Ops manual training/upPlan/upLock/crew/letter consumption, extension, tick, startup, guards and reset paths, plus current acknowledged save APIs. Use existing BALANCE.md workflow. Do not work from this task alone.

## Deliverables

1. Use independent default-off `?lg03=1`. Off means no new fields, RNG, controls, timers or rates; old saves unchanged. Enabling is development only and does not enable Rewards, premium or minigames implicitly. Multiple opt-ins can coexist, with their metadata preserved.
2. Implement an Automation pane using existing extension registration. Reveal it at displayed Printing2 after intro completion; the gate is S.printing>=1. Provide each owned desk an off/on control and letter-reserve setting initially25%, proposed range0-100% in5% increments. Show the reserve purpose and active-play-only limitation plainly. Existing headless defaults stay inert. Do not sell automation, require Inspiration or add tiers/costs/challenges here.
3. Persist optional versioned S.meta.automation with only base-hire configuration. Missing state means all off without an initialization write. Defaulted settings never discard unknown fields. Future unsupported versions/data stay preserved and safely refuse automation. Read current state on each operation, never cached S/desk references. Printing retains config through current meta; reset/load clears runtime cursor/time/pending state. Full Settings reset/Vault guards remain unchanged; no NG+ decision.
4. Use a dedicated guarded commitAutomation(expected,next) for config through actual Economy.saveStateAcknowledged. Preserve current unrelated state and honor Vault/Rewards save-owner/progression guards. Publish only on success. Failed enable stays off; failed disable immediately suspends the desk locally until durable Retry succeeds. A pending config write blocks further edits and automatic spending. Keep Retry/error visible with api.mark(); no generic setter or new transaction engine. Do not reuse rewardCommit or broaden paid admission.
5. Reuse the manual training purchase body with explicit desk and quantity arguments, preserving default manual selection/Buy1/Buy10/BuyMax, RNG order, letter spending, crew generation, events and save behavior. Expose only a named hire quote and hire-one action to the registered extension. No temporary selection change or synthetic clicks. Quote/execution check gate, current ownership, locks, cap and cost. Auto-hire buys exactly one. Before spending, require total desk letters minus cost >= ceil(pre-purchase total letters * reservePercent/100); reserve is aggregate held letters, not each letter type. No discounted price or new main-game cost.
6. The approved scheduler uses tick payload gameSeconds only while visible on the game screen and existing progression is allowed. After20 seconds, inspect at most six desks round-robin and hire at most one eligible enabled desk globally. Drop excess elapsed time, with no catch-up burst. Toggle/load/Printing clears cooldown rather than manufacturing elapsed credit. No offline hiring, replay or closed-time actions in this slice; premium speed affects active game time through the existing payload only. No direct simulation/world clock change. Offline production itself retains its existing behavior.
7. Both editions keep their established styling, no page scroll, internally scrollable pane at360x560, controls>=40px, keyboard labels/focus and reduced-motion/Low support. No new animation or artwork. Status describes off, reserve/cap/affordability waiting, or waiting for next hire. Keep the framework small enough for later automation catalogue additions without prebuilding them.

## Focused verification

Record only leased-source hashes and dirty/index status before edits. Capture a NEW five-minute seed1 active/collect default control and compare stable content after edits, excluding explicit metadata only. No full-hour claim. Run node --check on changed/new JS.

Check controlled displayed Printing1 refusal and Printing2 unlock; off produces no hires; on performs exactly one after20 game seconds; reserve refusal and exact boundary; no manual selection/BuyMax interference; caps/locked or unowned desk refusal; reload and Printing retention; one genuine refused config write with Retry plus a failed disable that suspends local auto action. Use actual APIs/writes, not successful acknowledgement stubs. A compact enabled economy smoke must advance with bot/manual hiring disabled. Label clock fixtures honestly. No need to rerun all minigame/reward/premium checks.

Ordinary UI uses native T3 preview_status/open first on an own temporary origin/save, and the documented headless harness is allowed for functional checks. Inspect actual panel screenshots in Pixel/Classic at1280x800 and360x560;390 only if breakpoint/defect warrants it. Report carried versus emulated media. Preserve user port8000 and unrelated services. Stop only identity-verified own helpers; no historical output overwrites or source-mutating old helpers. Defer full lifecycle/cache/profile/pacing/device suites. Stop expanding checks once the focused path passes and deliver a concise playable handoff.

## Status

ACCEPTED LOCALLY 2026-10-14 as an opt-in skeleton after one proportionate independent review. See LG-03A-accepted.md. Independent ?lg03=1 remains default off. No staging, commit, push or deployment.

## Handoff notes

GPT-6 Sol found no concrete hiring/save/default regression blocker. Parent inspected all six final images. Broad lifecycle, motion/device and pacing remain deferred. Original implementation and review evidence is unchanged; acceptance adds no product code.

Automation appears after intro completion at displayed Printing2. Each owned desk has Off/On and a0-100% reserve in5% steps, default25%. One global hire per20 visible active game seconds cycles eligible desks. Hosted minigames remain active play; offline and historical replay do not hire. All purchases use the actual manual training body with explicit desk/quantity one. Manual selection and Buy1/10/Max are preserved.

Optional version1 meta.automation defaults all off without an initialization write, retains unknown data, and stays inert for unsupported data/version. Current state is read for each operation. Printing retains config and clears runtime scheduling. Configuration uses only guarded commitAutomation(expected,next) and actual Economy acknowledgement. Failed enable stays off; failed disable suspends locally immediately; pending writes block edits/automatic spending until Retry succeeds.

Checks: changed/new JavaScript syntax; NEW seed1 five-minute active/collect default before/final report exact equality; controlled actual unlock/20s one-hire/round-robin/reserve/cap/ownership/affordability/manual quantities; actual quota refusal/Retry and failed-disable suspension; actual Printing/current-state/config retention; native shell reload; actual Rewards progression stop/resume guard; two-minute enabled production smoke with no Bot.run/manual hires. Explicit payload fixtures and virtual clocks are labelled in focused-results.json. Paw has no additional manual lock today; actual upLock is reused. No full-hour parity claim.

Native T3 own-origin Pixel/Classic pane screenshots personally inspected at1280x800 and360x560, including scrolled phone controls. No page overflow and controls>=44 CSS pixels. Carried reduced-motion=false and Low=false, CSS viewport resize only. No new motion. Media/physical devices, screen-reader review, full lifecycle/cache/profile/pacing matrices remain deferred. Existing shell transient weather/toast effects are outside this lease.

Evidence: evidence/LG-03/implementation-a1-r1/. Before leased hashes and dirty/index status are preserved. bounded-edit-proof.json reconstructs each original leased source hash by reversing only task edits. First cached-predecessor UI failure is retained; UI checks continued on fresh own8354 origin with matching source hashes. focused-first-failure.json preserves a fixture error that tried to mutate the immutable cold gate; corrected checks use actual Rewards progression stop/resume and real quota refusal. Parent dispatch.json untouched.

Playable URLs: http://127.0.0.1:8354/index.html?lg03=1#play and http://127.0.0.1:8354/classic.html?lg03=1#play . The native preview profile has a controlled displayedPrinting2 save. Fresh profiles must earn Printing2. Add &mg01=1 only to include the independently opted-in Break Room. Task-owned8354 preview server retained for play;8353 verification helper stopped after PID/command identity checks. User8000 and unrelated services/saves untouched.

Changed product files only: new automation.js/.css; narrow Ops helper/config APIs and replay marker; script/style registration in both shells and tools/balance.html; SW assets and imi-v36. New lg03a-edit.py and lg03a-focused.mjs helpers, task-owned evidence and these Status/Handoff notes. Earlier unrelated dirty work preserved. No children or dependencies.

Later A2-A5, tiers, challenge/medal proposals, premium prices/rewards, offline hiring and NG+ remain outside this slice. Next approved progression work follows parent direction, with staged A3 Auto-shop and LG-04 Printings still ahead.
