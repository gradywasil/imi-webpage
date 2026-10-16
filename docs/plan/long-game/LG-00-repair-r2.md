# LG-00 repair and measurement, round 2

Read the original LG-00 brief, results, manager review and independent `LG-00-QA-r1.md`, in addition to the shared plan READMEs and premium spec. The owner has authorized LG-00, not LG-01. Art-integration remains retired. Every added line must justify its existence.

## Goal

Close the accelerated offline Deadline and pickup-lifetime failures, preserve frozen default-speed gameplay, and obtain actual current-content duration measurements. A repair is not accepted until reviewed by a different model.

## Files owned

- `ops.js`: only the accelerated Deadline/offline publisher chronology repair and its strictly necessary clock support.
- `pickups.js`: only production-clock lifetime correctness with original default-speed behavior and real-time animation cadence preserved.
- `tools/long-game.mjs`, `tools/long-game-bot.js`, and necessary helpers in `tools/long-game/`: only measured harness performance/continuation and repair verification. Legacy bot/harness default policy and all original captures are read-only.
- `sw.js`: a cache-version bump if runtime code changes.
- This file; the original LG-00 brief's Status/Handoff notes; new `LG-00-results-r2.md`; new `evidence/LG-00/repair-r2/**` only.

All other production files, master plans, manager/QA reports, evidence manifests and original evidence are read-only. You are not alone in the workspace. Never revert others, overwrite old receipts, stage, commit, deploy, install dependencies or dispatch children.

## Required repairs

1. QA's real repro has eight ready titles, a tier-3 publisher, ten Deadline game seconds remaining and sixty real seconds away. Frozen old/current speed 1 sold four and failed; current speed 2 sold eight and incorrectly cleared the expired challenge. Reproduce this from `qa-r1/adversarial.mjs` before editing, in a new output. Make accelerated offline challenge credit respect when production/sales actually occurred, not merely the return-time bulk total. A longer absence must not disqualify a clear that legitimately occurred before the deadline. Words produced only after expiry must not count before it. Include initially ready, newly produced, insufficient-prefix, already expired, successful-prefix/long-absence, and non-timed challenge cases. Preserve normal offline payouts and real caps.
2. Default-one compatibility is mandatory, including the old frozen behavior. Do not silently fix the older bulk-ordering weakness across all saves or weaken parity. Restrict any intentional new chronology behavior to the activated speed feature if needed, and document that boundary clearly. If correctness truly cannot coexist with the frozen rule, escalate with concrete evidence instead of changing the contract.
3. Fix the native speed-0.5 pickup's early disappearance while keeping 14 game seconds of eligibility. The provider currently accepts positive finite speeds and existing foundation tests use slow providers. Do not restrict the provider to avoid testing. Preserve exact default-one behavior, real animation rate, bounded timers, visibility/eligibility cancellation and no stale callbacks after collecting/clearing. Exercise speed 0.5, 1, 1.25 and 2, plus a provider change during a live pickup. Do not make a faded/removed pickup count as visibly collectible.

## Measurement requirement

All four profiles lack the defined finite completion measurement. Do not replace this with an estimate or splice prior trajectories. Diagnose the actual expensive harness operation before optimizing. Any optimization must be opt-in, harness-only, and demonstrate equivalent gameplay/state on a fixed-seed paired window. Do not approximate online production, change RNG, skip game actions or retune the economy.

Continue fixed profile/seed trajectories in bounded execution chunks, retaining the same live browser simulation when continuation requires runtime/RNG/timer state. A save-only restart is not an exact continuation unless that equivalence is established. Record source identities, cumulative calendar/active time and checkpoints/receipts per chunk. At least finish the Regular trajectory through the stated finite endpoint and extend the other profiles toward theirs; the full LG-00 endpoint gate remains open if any required endpoint is still unmeasured. Keep raw failures and explicit horizon limits. An uninterrupted long trajectory with periodic durable snapshots is acceptable; do not pretend a partial snapshot resumes RNG/closures exactly. If a policy stalls or a finite endpoint is unreachable, reproduce the cause and report it without granting progress or changing the endpoint.

Use bounded wall guards, and explain any required continuation rather than running unattended without a limit. Long actual simulations need no extra agent reasoning or repetitive output. The purpose is measured current length, not a headless performance refactor.

## Verification and handoff

Capture candidate source hashes before repair. Run syntax checks on changed/new JS. Retain all 19 frozen original parity pairs and rerun against repaired source with the existing policies. Run the independent 90-minute default-speed comparison and focused adversarial clock cases in fresh outputs. Review cold-start registered speed with the real old save/away path. Do not regenerate prior manifests to erase their source identities.

Follow the T3 preview protocol for native/browser evidence; use the existing external headless harness as its separate authorized lane. Revalidate task-owned server identity and served source. Capture both editions at the three required sizes on repaired sources, reduced motion and Effects Low, and native pickup measurements. Preserve wallet provenance limits; the missed pre-edit artifact cannot be repaired retroactively.

Full-reset permanent ownership is a downstream LG-02 decision; do not change reset semantics or implement purchases in this repair. Likewise no art, rewards, Vault, new layers, prices, legal text or unrelated bug fixes.

Write `LG-00-results-r2.md` with files/lines changed, precise chronology policy, default-speed boundary, before/after reproductions, every new evidence path, profile completion times or actual stops, optimization equivalence, all unmet gates and recommended next steps. Status is candidate for independent review, never self-accepted.

## Status

Candidate after LG-00 repair round 2, awaiting manager and different-model review. Accelerated offline Deadline and pickup lifetime repairs are verified; Regular reached the original finite endpoint. Other profile endpoints and the explicit media/provenance limits remain open. See LG-00-results-r2.md. LG-01 remains undispatched.

## Handoff notes

QA passed 19 original raw-derived pairs, 190 loaded-source checks, a fresh 90-minute frozen/current comparison, syntax and five economy tests. Required clock failure and incomplete duration measurements prevent acceptance. All prior results and failures remain historical evidence.

Round 2 handoff: final Ops SHA-256 492797b34933346467ee00e9fae59a2c14971bf40da619115a078826c6d2e155; final pickup SHA-256 80b9a362be5a33a6a0f8e2f6453d21f7491f9f6778f27efa50ea80be2d3a37cc. Nineteen fresh final-Ops legacy pairs and 190 loaded identities match; the fresh 90-minute comparison matches. Regular seed 1 completed at 30,240.0167 calendar / 1,260.0167 active minutes on one uninterrupted final-source browser trajectory, with 139 raw snapshots and empty errors. Casual/Hardcore/Away were extended but remain finite-incomplete. All original evidence remains historical and read-only. Round-2 raw data, failed cases, hashes and six settled images are under evidence/LG-00/repair-r2/. Default-one bulk behavior is preserved; intentionally new chronology is limited to non-default-speed Deadline work. Full-reset permanent ownership remains downstream LG-02, and the missed correctly versioned pre-edit wallet artifact cannot be repaired retroactively. Runtime reduced flag plus Effects Low were measured; actual system-media coverage is still explicit. No acceptance, children, dependency installation, staging, commit, push or deployment is claimed.
