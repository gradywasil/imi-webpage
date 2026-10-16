# PG-03A capped royalty playtest prototype

## Goal and authority

Implement the exact owner-approved formula from PG-03-owner-review.md and PG-03-parent-review.md: current royalties times `2 * (1 + 0.35 * min(S.printing, 7))`. Approval receipt evidence/PG-03/owner-approval-r1/receipt.json. Initial run gets x2, four completed Printings x4.8, seven or more x6.9. UI-01 is now accepted. Final economy balance remains open.

## Files owned and required reading

Own ops.js only for the independent prototype flag, shared royalty scale and bookRoy/royBase contributions plus directly necessary dev visibility; sw.js cache bump; NEW pg03a-* helpers and exclusive evidence/PG-03/implementation-a-r1/** excluding parent dispatch.json; this Status/Handoff only. All other source/task files/evidence are read-only, including Ops CSS, Core, Economy, Rewards, Vault, PG/MG/automation modules and HTML. Sole Ops writer; not alone, preserve dirty work. No children, dependencies, staging/commits/deploy/default activation. Every code line must justify existence.

Read docs/plan/README.md, long-game/README.md, skeleton-validation-policy.md, both PG-03 review documents, owner approval, UI-01-accepted.md, BALANCE.md and actual royalty/deal/tick/offline/reset/UI/dev source. Named anchors override drifting line numbers.

## Exact deliverables

1. Independent default-off `?pg03=1`. No absent-flag save initialization, metadata, schema/migration or automatic activation. Preserve current ROY_BASE/TUNE behavior and multiply that current tuned base, not a replacement literal. With flag absent use scale1 and old mechanics.
2. One shared current-state royalty factor in bookRoy and royBase so per-title and aggregate readings agree. Keep royRate/passive, actual online/offline integration, game speed, efficiency, cap, rounding, accumulated fractional income and held/checkpoint behavior untouched. Printing changes the factor through current S; it still resets shelf/deals under existing rules.
3. Keep DEALS prices/gates/multipliers, category weights, sale formula, Good Stories sale-only bonus, progression exclusions, native/stored Rush x7 and all durations unchanged. No Estate Archive feature or premium effects. Rate-based existing consumers such as dailyPrize, pickups and repitchCost naturally see the higher royBase; disclose these inherited consequences, do not retune them or add new currencies.
4. Existing Shop/shelf/Records rate display paths must reflect the formula consistently. No UI redesign or new panels; avoid adding copy unless needed for correctness. No separate royalty timer or economic transaction system.

## Proportionate verification

Save a fresh pre-edit five-minute default control/source identities, then compare final stable output and missing new metadata. Syntax changed JS. Bounded actual formula checks at completed Printings0/4/7/above7 and a TUNE override; verify cap and both per-title/aggregate paths. Use existing actual APIs or a narrow test-only lexical accessor, not a fabricated calculation presented as product proof.

One controlled native sale -> Reprints -> acknowledged save/reload path, plus duplicate purchase refusal without a second spend. Verify reset uses current S and clears old shelf/deals. One bounded offline income check against the same expected factor and unchanged efficiency/rounding; preserve existing checkpoints, do not build a lifecycle suite. No extra fault campaign if the real duplicate check suffices. Reuse shared-logic checks across editions and inspect representative current royalty readouts in both editions at360x560, T3 preview first ordinary UI. Desktop/390 only if a material display issue warrants them. No CSS changes, fresh page matrix, full-hour/all-profile pacing or broad old tests.

Protect user services8000/8354/8356/8358 and tabs/saves. Use fresh task-owned origins/profiles, correct output paths and identity-checked cleanup. Do not run historical fixed-output/source-mutating helpers. Return concise candidate handoff, source identities, actual checked paths and deferred limits. One independent review follows before acceptance; no public/default activation.

## Status and handoff

ACCEPTED LOCALLY 2026-10-14 after independent GPT-6 Sol review and parent source/image checks. See PG-03A-accepted.md. Prior candidate/failure records retained below. Default-off pg03=1; final balance remains open. No default activation, commit or deployment.

CANDIDATE IMPLEMENTED 2026-10-14; independent review next, not acceptance. Exact default-off pg03=1 factor is shared by bookRoy and royBase. Current tuned ROY_BASE semantics remain unchanged. sw.js imi-v40 -> imi-v41. Ops writer released.

Handoff: evidence/PG-03/implementation-a-r1/manifest.json, focused-results-final.json, native-results.json and exclusive before/after controls. Product delta is ops.js three lines and sw.js cache version only; before-source snapshots and patches distinguish it from existing dirty work. New tools/long-game/pg03a-{control.cjs,edit.py,check.cjs,native.cjs,handoff.py} are task-owned helpers. Parent dispatch.json untouched.

PASS: changed-JS syntax; fresh pre-edit/final five-minute active collect seed1 default results exactly equal with empty meta; actual lexical functions at Printings0/4/7/12 with TUNE.ROY_BASE=.000023, bookRoy/royBase parity and cap; actual Printing replaces S, factor follows current S and clears shelf/deals. One bounded630-second offline check pays25 at40% efficiency with denomination flooring. Native controlled sale/Reprints/duplicate/acknowledged save/reload in both editions; actual Shop/shelf/Records rates agree at0.0459/s, 360x560 with no page overflow. Native loaded Ops/CSS match disk SHA256. T3 ordinary UI first on fresh8397 incognito; fetched identities match final source, caches only imi-v41 and imi-v41-runtime. Images inspected for representative readouts. No protected origin/tab/save used.

Preserved fixture failures: nonexistent reprint ID refused correctly; arithmetic-only Printing12 lacked reward history and acknowledged save refused; native wallet reload initially reconciled pending sale/deal awards. Final native fixture settles actual awards before comparing saved wallet. No product repairs for these setup errors. Earlier focused offline zero-payout result retained; final bounded check exercises positive payout.

Higher royBase naturally raises royalty-based daily prizes, pickups and repitch costs. These consumers are not retuned. All DEALS prices/gates/multipliers, categories/progression exclusions, sales/Good Stories, Rush and online/offline integration remain outside the exact two-path multiplier delta.

Deferred under skeleton policy: long-horizon/full-hour/profile pacing, physical phones, broad lifecycle/fault/cache-transition/accessibility campaigns. No final balance or shared-training price approval. No children, dependencies, staging, commits, deployment or default activation. Independent review must assess this candidate before acceptance.
