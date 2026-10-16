# LG-01B repair r2: Recover the away wallet baseline boundary

## Goal

Repair B-R1-1 and B-R1-2 from LG-01B-QA-r1.md without changing the approved reward design or disabled mechanics. A failed away wallet baseline flush must not lose an assistant payment or repeat lifetime royalty/division totals. Produce a source-bound candidate and meaningful red/green regressions, then stop for separate independent review. B remains HOLD; C has not started.

## Files owned

- rewards.js: narrowly repair away payment preparation/recovery at the fallible baseline boundary, preserving existing claim/startup/ownership/marker contracts.
- ops.js: only the necessary enclosing away sale/royalty/division operation ordering, effects/counter/cursor integration. Preserve all disabled branches and original awards/challenges/production formulas. Keep the transaction engine in Rewards.
- sw.js: cache version only, preserve the assets.
- New tests/rewards-away-baseline.test.cjs: meaningful real-module/caller regressions for these defects. Existing tests are read-only.
- New docs/plan/long-game/evidence/LG-01/repair-b-r2/**, including narrow repair helpers/frozen source/fixtures; this brief Status/Handoff only.
- New docs/plan/long-game/evidence/LG-01/implementation-b/fixture-repair-b-r2-20261012/** solely for the existing fixture helper's exclusive test outputs, with LG01_RUN=repair-b-r2-20261012. Label these repair evidence.

Core/Economy/balance bridge/shells/CSS/Goals/UI/FX/art/bot policies/old helpers/tests/all prior evidence/plans/reports are read-only. Do not modify LG-01B-QA-r1.md, the original B brief or execution.md. If this narrow runtime lease cannot satisfy the approved contract, stop and report the concrete missing ownership rather than edit another file. You are not alone; preserve unrelated dirty work on long-game. No staging/commits/push/deploy/install/delegation. Every line must justify its existence.

## Files it may read

Read docs/plan/README.md, long-game README/premium-currency/execution, approved LG-01-reward-design.md, original LG-01-rewards-and-goals.md, LG-01B-reward-transactions.md, LG-01B-QA-r1-brief.md and full LG-01B-QA-r1.md, LG-01A-accepted.md and this brief before source. Read prior A QA/repair findings and responses as relevant prerequisites. Read current B HANDOFF/final-working-tree receipt, before frozen sources, QA audit/native/module failures/controls and all relevant current call paths. Read C:/Users/arran/.agents/skills/diagnosing-bugs/SKILL.md and use its red-capable feedback loop; preserve artifacts required by this lease instead of deleting historical diagnostic evidence. Check CONTEXT.md/nearby ADRs if present. BALANCE.md explains the harness.

## Findings and responses carried forward

B-R1-1: checkpointPayment flushes wallet baseline before recording cp.credit, after quiet writeTitle has consumed words, marked the title written, incremented sale/lump totals and advanced the sale budget. Native Pixel and Classic wallet250 remains250 after Retry for a 3,400 sale, while bank is empty and title written. No pending credit remains and the completed checkpoint is removed.

B-R1-2: roy/div phases increment lifetime totals before the same fallible flush. Failed flush leaves the phase unchanged and no pending credit. Retry pays once but increments the total again. Native Classic wallet250 becomes189250, run189000, but divTotal378000. Independent royalty control25 becomes50 in the fault case. Both findings are real supported-write-boundary bugs, not a design choice.

QA covered accessible scope and otherwise passed 48 tests, twelve identities, exact complete disabled hour, representative claims/reloads, gold, visuals/media and current actual hidden/bfcache in both editions. Those passes remain historical evidence for their source. Early QA wrong-import/call/award-count/deletion-injection errors are retained separately; corrected native/module results actually assert the targeted rejection. Do not copy a green fixture that never reached the failing boundary.

Manager independently read raw native scalar snapshots and source ordering, confirmed both unpaid native sales and doubled division total, verified all six current runtime hashes and independently recomputed QA fresh raw default parity. No repair has occurred. Original B untracked long-game-bot hash-inventory omission remains documented; no retrospective capture. A shape-loader/callback safeguards remain accepted prerequisites, not permission to weaken them. Enabled desk2 acceleration6.7 vs13.5 remains for later balance review; Q5/Q6/Q8/Q9/Q10/prices/paid ownership remain open.

## Exact deliverables

1. Before any runtime change, seal relevant current source bytes/hashes/status/index and a NEW fresh complete disabled sixty-minute report. Capture correctly versioned native wallet/Ops task fixtures in both editions and assert serialization. Preserve old reports. The candidate before hashes are in QA r1 and current B receipt, but these do not replace this task's own pre-edit capture.

2. Establish a deterministic real-call-site regression that goes red on untouched current source for unpaid sale and duplicated roy/div totals. Assert an actual baseline write rejection, exact wallet/run/lifetime totals, consumed bank/written/sale-budget/report state and eventual checkpoint completion. Include paired no-fault controls. Name and run the command before applying a fix. Use the diagnosing-bugs loop with falsifiable boundary hypotheses and explicitly justified reductions to existing verified evidence; do not silently skip the red run because the old 48 tests pass.

3. Make the enclosing operation, locked amount, effects and continuation recoverable across the baseline flush and later preparation/wallet/final Ops acknowledgements. No fallible boundary may leave already-applied sale/counter effects with neither a recoverable payment nor a safe continuation. Apply effects exactly once and preserve existing sequence/head receipts, current-run delta, pending claim ordering and pause propagation. Do not restore a stale whole-run snapshot, resample a locked amount, replay the full absence, delete ambiguous metadata or bypass acknowledgement/ownership guards. Explain the chosen ordering in the handoff rather than silently changing semantics.

4. Prove same-process Retry and a fresh reload from the actually acknowledged raw keys for sale, royalty and division baseline failures. If the first failure leaves only volatile preparation, label that boundary honestly and show reload resumes the last durable cursor safely without double work/payment; do not invent a durable record that never saved. Repeat failures/Retry and adjacent prepare/wallet/final Ops/deletion cases must preserve locked amounts, sequence/current-run deltas and completion. Include ordinary bulk and the affected timed-sale path, multiple sales or successive income phases to catch cursor/sequence aliasing, unknown fields and failed initial preparation. Keep all old green recovery guards intact.

5. Reproduce original native failures through actual Core in T3 in both editions after repair, including sale and representative roy/div cases. Preserve raw failed/final writes and loaded source identities. Use task-owned contexts and actual Retry; simulated bridge tests remain explicitly separate. Check live challenge/award holds where affected operation paths pass them.

6. Run syntax, all existing 48 tests plus new regressions, and a fresh complete disabled sixty-minute report with exact raw-derived before/after equality. Only capturedAt/sourceCommit/sourceHashes/url/wallSeconds exclusions; no gameplay/RNG/wallet/state exclusions. Preserve all68 award block and +1% byte equality, unrelated source bytes, default-off lg01a flag and script registration. SW cache version follows source changes. Confirm no change to approved gold timing, timed prefix budgets/RNG/keeper traversal or ordinary economy. No price/reward/bot-policy retune.

7. Capture current-source normal/hold states at1280x800/390x700/360x560 in both editions, open images, actual focused40px+ Retry, no page scroll and Low/reduced-motion checks. Source CSS remains unchanged. Use T3 for ordinary functional/UI checks. Owner's isolated Chrome permission persists ONLY for LG-01 actual reduced-motion/hidden/bfcache; actual lifecycle acceptance after the repair belongs the separate review unless a targeted worker probe is needed. Do not claim B-source lifecycle passes apply automatically to changed persistence code. Known Pixel360 wrapping stays out of scope.

## Acceptance criteria

Red-before/green-after real-module regressions and corrected actual Core both-edition failures, exact counters/wallet/once-only effects through Retry/reload, no new source/preservation defect and exact full disabled parity. Handoff states PASS/FAIL/UNVERIFIED, source changes and justification, commands, old/new evidence boundaries and remaining limits. Candidate only; no self-acceptance of B/LG-01 or start of C. An independent different-model focused review follows.

## How to verify

Existing external Puppeteer/Chrome without installation. Set PUPPETEER_MODULE=C:/Users/arran/AppData/Local/Temp/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js explicitly in each shell, GUARD=240, LG01_RUN=repair-b-r2-20261012. Existing helper hardcodes implementation-b base; use only the leased NEW fixture leaf. New helpers may live in repair-b-r2; do not modify existing helper or rerun into sealed outputs. Test command includes existing Economy/startup/transactions/offline plus the new baseline test, serial concurrency. Retain exact logs/commands, including failures; PowerShell logs may be UTF-16.

Revalidate existing server127.0.0.1:8162 previousPID68788/root/served bytes. QA r1's cacheable8165 server was stopped, so do not assume it remains. T3 preview_status then preview_open when needed; correct actionable preview failures rather than switch browsers. Temporary QA profiles/task-owned saves only. Any new helper server/process must be hidden and identified by root/PID/port. Clean only verified owned temporary targets, never existing services or historical evidence. Required headless balance/fixture lane is separately authorized; no owner's storage or system preference changes.

## Status

CANDIDATE REPAIR READY FOR INDEPENDENT REVIEW, 2026-10-12. Red-before/green-after real-call-site regressions and both-edition native Core reproductions pass. LG-01B remains HOLD for separate different-model review, LG-01 is unaccepted and C has not started. No design retune, delegation, install, staging, commit, push or deployment. Sole runtime owner: codex/gpt-6.1-sol, medium reasoning, standard tier. Task ID: node:delegated-task:command%3Amcp%3Af8872b1e-8ac1-46bc-ad70-2ea3b9d676f0%3Adelegate-task%3Aimi-long-game-lg01b-repair-r2-20261012. Client request: imi-long-game-lg01b-repair-r2-20261012. No pending child runs.

## Handoff notes

Independent report/evidence: LG-01B-QA-r1.md and evidence/LG-01/qa-b-r1/**. Original reproduction helpers native-away.js/supplement.mjs are read-only; derive new outputs/helpers instead of overwriting their artifacts. Current Rewards62eccd9..., Ops88047df..., SWa4c485d... imi-v22. No conflicting runtime worker or pending child. Stop with candidate repair and explicit limits for the manager's separate review.

Repair response: [repair-b-r2/HANDOFF.md](evidence/LG-01/repair-b-r2/HANDOFF.md), final audits, exact diffs and red/green/native/raw parity/media captures in that owned directory. Rewards retains volatile locked credit/continuation before the baseline flush, then uses the existing acknowledged preparation/wallet/final-Ops protocol. Ops needed no edit; original awards/income/production/keeper/timed budgets and formulas stay byte-identical. SW is imi-v23, assets unchanged. The original handoff tuple above is pre-repair history; complete current identities are in final-audit-after-handoff.json.

All48 existing tests passed in the combined candidate run; final new tests pass37/37. The earlier combined run retains one new-test oracle failure followed by corrected source-bound new runs; no single final85-test all-green invocation is claimed. Exact complete60-minute disabled before/after parity uses only five provenance exclusions. Native both-edition sale3,400, royalty25 and division189,000 survive repeated baseline Retry and acknowledged-key reload with once-only effects/counters; live Deadline first-clear hold/continuation also passes. Twelve media and eighteen T3 images were opened, including settled normal captures, focused44px Retry, no page scroll and Low. Actual changed-source hidden/bfcache acceptance belongs the separate reviewer. Historical QA results/failures and open policy/pacing decisions remain unchanged.
