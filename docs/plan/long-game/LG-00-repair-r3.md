# LG-00 repair round 3: conserved offline work

Status: implementation candidate returned after repair round 3, awaiting manager and different-model review. No LG-00 acceptance or LG-01 dispatch. See LG-00-results-r3.md.

## Goal and confirmed failure

The manager reproduced the review's failure against Ops `492797b34933346467ee00e9fae59a2c14971bf40da619115a078826c6d2e155`: the same sixty-second absence at speed two records 38 typed letters in the Deadline path and 42 without the added boundaries. Neither path sells a title or throws. The additional publisher/deadline boundaries must order work without changing its budget through rounding. Keeper `ceil` and minimum-two allowances need the same examination.

The manager's red-capable command is `node docs/plan/long-game/evidence/LG-00/manager-repro-r3/split-rounding-before.mjs`, with the documented external `PUPPETEER_MODULE` environment. It has already run and failed the conservation assertion in about two seconds. Its raw report is retained beside it. An earlier manager attempt lacked that environment variable; it did not measure the game and is not the reproduced failure.

## Required reads and scope

Read the original LG-00 brief, shared plans, all prior results and both independent QA reports, this brief, and `C:/Users/arran/.agents/skills/diagnosing-bugs/SKILL.md`. Check `CONTEXT.md` and directly relevant ADRs if they exist. Use the diagnosis feedback loop and document any skipped phase with a concrete reason. Minimize the failing fixture, then present ranked falsifiable hypotheses in commentary before testing them. No permission gate is added by this procedure.

Every added line must justify its existence. You are not alone in the codebase. Art integration is retired. The factory-breakout idea remains future exploratory work.

Own only `ops.js`'s activated-speed Deadline offline calculation; `sw.js` cache version; new `tools/long-game/verify-budget-r3.mjs` if a reusable focused regression helper is justified; this brief and the original foundation brief's Status/Handoff notes; new `LG-00-results-r3.md`; and new `evidence/LG-00/repair-r3/**`. All other production/tools/plans and all previous evidence, including manager repro, are read-only. Do not revert others, install dependencies, stage, commit, deploy or dispatch children.

## Deliverables

1. Freeze the current candidate and reproduce the original failure in a fresh output with a meaningful assertion before editing. Minimize it and distinguish changes from rounding, weather sample/rate changes, XP/traits and RNG consumption. Tight assertions must catch the observed error rather than only checking for exceptions.
2. Repair chronological ordering without re-rounding a complete original production/keeper allowance at every inserted boundary. Define and enforce conserved work budgets at the original offline batching boundaries, or justify an equally small robust approach. Prefix allocations cannot borrow letters/keeper effort from future time, multiply the minimum keeper allowance, or lose cumulative rounding remainders. Use real game actions and bounded loops. Genuine focus/weather/XP/sale effects may change later production, but a no-sale, fixed-rate pair cannot differ merely from split bookkeeping.
3. Lock down all affected units: per-desk typed counts and totals, actual letter inventories and their existing stochastic rounding semantics, keeper service capacity and banked words, sale slots and payouts. Vary speeds 0.5/1.25/1.5/2, absence lengths around original boundaries, deadline positions, publisher on/off and keepers active/paused. Use small deterministic differential/property cases, not an enormous test matrix. Separate legitimate state-driven changes from artificial new budgets. Preserve the full original Deadline success/failure cases, cold-start cap behavior and payouts.
4. Speed one, empty registration and non-timed behavior remain frozen. No economy, RNG, price, efficiency, reset-policy, pickup or profile changes. Preserve all nineteen original raw-derived legacy pairs and the ninety-minute frozen/current comparison against new source, in fresh outputs. Failed captures and source identities remain retained.
5. Report whether the unchanged speed-one Regular duration run remains applicable by an explicit reviewed code-path boundary. Its historical Ops hash must remain `492797...`; do not relabel its 139 checkpoints as new-source captures or rerun a 73-minute trajectory simply to change its hash. Other profile completion, actual reduced-motion media and the historical wallet provenance gap remain separate open gates, not part of this arithmetic repair.

## Verification and handoff

Use existing external Puppeteer/Chrome and verified task-owned servers. The headless economy reproduction is an authorized separate lane; any interactive browser use follows T3 preview preference. No user-storage cleanup, system preference change or unrelated process stop.

Run changed/new JS syntax and the relevant existing economy checks. Retain the original repro red result, minimized/property regressions, repaired chronology cases, raw-derived parity and explicit source comparison. Preserve prior pickup candidate and its tests for the independent reviewer; do not spend this repair changing unrelated UI or art.

Write `LG-00-results-r3.md` with the diagnosis, conserved-budget rules, exact commands and new evidence paths, changed lines, default behavior boundary, old-run applicability argument and every unmet gate. Status remains a candidate for a different-model review. The next review must continue through the assigned acceptance areas and record all material issues rather than stopping after the first finding.

## Handoff notes

Final Ops SHA-256 is ee1fb2d6a92d67964b4e1e2f446a063aee60fb87b235d0c4c17c7f25813de425. Before source/red receipts, minimal regression, intermediate keeper failure, final conservation/chronology/cold-start/compatibility checks, nineteen fresh raw-derived pairs, 190 loaded identities and fresh 90-minute parity are retained under evidence/LG-00/repair-r3/. The real keeper's optional traversal cursor is necessary because its twelve-pass limit also reset at inserted boundaries; only the activated timed caller supplies it. All other production and existing evidence remain read-only. Historical Regular keeps its 492797... identity and 139 checkpoints, with a documented default-path applicability argument. No profiles were rerun to replace historical hashes. No children, installs, branch switches, staging, commits, pushes or deployments occurred. Next independent review is mandatory and must finish all assigned acceptance areas; pickups, other profile endpoints, actual reduced-motion media, historical wallet provenance and downstream full-reset policy retain their stated limits.
