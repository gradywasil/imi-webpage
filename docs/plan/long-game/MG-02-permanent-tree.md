# MG-02 permanent Inspiration tree

## Goal

Build the five approved single-purchase upgrades in the Break Room so earned Inspiration produces optional permanent benefits. Keep the hosted games playable and the feature opt-in. This follows the accepted MG-01 implementation and the owner's skeleton-first order; no new design approval is needed for these approved nodes.

## Files owned

- `minigame-progression.js`: optional nodes, purchase logic, attempts capacity and tree presentation.
- `minigame-progression.css`: tree layout in both editions.
- `ops.js`: the smallest named default-zero contributions to typistSpeed, keeperPeriod and salePay, through the registered minigame extension. No other mechanics, premium or reset redesign.
- `sw.js`: bump the cache version for changed assets; existing cache strategy unchanged.
- NEW `tools/long-game/mg02-*` helpers only if needed for focused verification.
- NEW `docs/plan/long-game/evidence/MG-02/implementation-r1/**`, excluding parent dispatch.json, plus NEW task-owned fixture/output leaves with `mg02-r1-20261014` names.
- This task's Status and Handoff notes only.

All other files are read-only, including Core, Economy, Rewards, Vault/gate, tour, existing game adapters/bridge, other tests/helpers/evidence, master plans and other worktrees. You are the sole Ops owner and are not alone in this checkout; preserve unrelated dirty work and do not revert it. Every line of code must justify its existence. No children, new dependencies/build tooling, art, staging, commits, push, deployment or default/public activation.

## Required reading

Read `docs/plan/README.md`, `docs/plan/long-game/README.md`, `minigame-progression-scope.md`, `skeleton-validation-policy.md`, `MG-01-accepted.md`, the actual parent module and narrow Ops save seam. Read `premium-currency.md` for constraints only; premium effects and prices are outside this lease. Inspect the live shared production and offline callers before adding the three stat contributions. Read `BALANCE.md` and the MG-01 commands for the existing harness invocation. Do not work from this brief alone.

## Exact deliverables

1. Keep `?mg01=1` as the only development opt-in for this integrated prototype. Flag-off behavior remains unchanged, including old saves and RNG/rates. Do not initialize nodes or write optional minigame data when off. Ordinary factory work never grants Inspiration.
2. Add optional owned-node IDs to version1 `S.meta.minigames`. Existing MG-01 saves without nodes behave as an empty tree. Preserve current wallet, fractional credit, active break, attempts, refill and unknown fields. Use current state() after Printing. Unsupported future data is retained and refused, not stripped or guessed. Do not add a second ledger or alter full-reset/Vault policy.
3. Implement exactly these one-time purchases: Warm-up costs10 and adds2% automatic typist rate; Nimble paws costs40 and adds3% more; Fresh eyes costs40 and adds3% keeper work rate; Good stories costs40 and adds3% title sale income; Room for play costs60 and raises attempt capacity from6 to8. Warm-up opens the other four. No game-specific prerequisite, main-layer gate, DB conversion or purchased attempt/refill-speed item. Use stable node IDs and visible Owned/locked/affordable states with clear costs and effects.
4. Spend Inspiration and record ownership atomically through the actual MG-01 acknowledged commit method. Publish only after a successful write. Insufficient funds, unmet prerequisite and repeated clicks never charge. A failed purchase leaves the wallet/effects unchanged and offers one Retry that can commit once. Do not bypass ownership/guards or assume an undefined save return means success. Integrate with existing pending handling rather than adding a separate transaction engine. Prevent purchases from conflicting with an open break or pending save through the existing UI/guards.
5. Keep node rules and effects in the parent module; Ops receives narrowly named contributions rather than knowing node IDs/prices. Typing contributions add within the family to5%, keeper and sales cap at3% each. Apply each family exactly once to its named existing calculation, shared by online and relevant offline callers. Typing is automatic only; manual press/hold gains no new rate boost. Keeper period divides by1.03 at full effect, rather than subtracting3%. Sales apply before the existing money rounding. Royalties, divisions, simulation speed, calendar/world clock, offline efficiency/cap and attempt refill speed remain unchanged. Do not commandeer the single production-speed provider. Verify callbacks are available before startup offline simulation and use current state on reload/reset.
6. Room for play changes the capacity and display/validation bounds to8 only when owned. It does not grant two immediate attempts. Refill remains one per two real hours, preserves the current timestamp and clamps backwards movement. Reconcile existing refill at the old capacity before purchase so prior full-bank time cannot manufacture attempts. Missing nodes continue capacity6. Keep reward amounts and meaningful-input timing unchanged.
7. Present the tree within the established Break Room, with Inspiration balance and useful owned effects. Both editions use their current style and internally scroll at360x560 without page scroll. Targets>=40px, keyboard usable, reduced-motion/Low support. No new art, animations or redesign. A source separator encoding correction in this module is allowed only if it is confirmed to be an actual visible defect, not a console decoding artifact.
8. Preserve wallet, nodes and bank through existing Printing retention. Future Imprint/Estate implementations must carry this metadata; do not build those layers here. NG+ remains unresolved and outside this task.

## Proportionate verification

Before edits record the leased-source hashes and dirty/index status, then capture a NEW short five-minute seed1 active/collect default control. After edits compare stable gameplay content, excluding only explicit metadata, and retain command/output basics. This is short default parity, not full-hour proof. Do not repeat historical suites or inventory the whole checkout.

Run node --check on changed JS. In a controlled developer save, use actual APIs to purchase Warm-up, verify other nodes open, purchase the remaining nodes, confirm exact effects with matched conditions and unchanged excluded rates, save/reload and doPrint retention. Verify capacity/refill including no immediate attempt grant. Check one duplicate purchase and one real refused storage write followed by Retry. Do not stub a successful acknowledgement. A compact functional check of shared online/offline formulas is sufficient; no new long-horizon run.

Ordinary UI uses T3 preview_status/open first on an own temporary origin/save. Inspect tree in Pixel and Classic at1280x800 and360x560 and open actual screenshots.390x700 only if a distinct breakpoint or defect warrants it. Existing documented headless harness/focused browser workflow is permitted for functional checks. Preserve port8000 and unrelated servers; stop only identity-verified own helpers. Do not execute old source-mutating helpers or write historical evidence destinations. No broad lifecycle/cache-transition/profile/pacing or physical-device work. Report actual versus carried media preferences without claiming emulation.

Once these focused checks pass, stop expanding verification. Deliver a playable slice, changed files, commands/results, screenshots and a short deferred list. Parent will conduct one proportionate review.

## Status

ACCEPTED LOCALLY 2026-10-14 as an opt-in skeleton after proportionate independent review. See MG-02-accepted.md. No default activation, staging, commit or deployment.

## Handoff notes

GPT-6 Sol found no main-path blocker. Its targeted refusal after Printing preserved the wallet and showed Retry within one second; immediate marking is deferred polish. Parent inspected all four final images. Existing implementation and review evidence remains intact; no new product edit accompanies acceptance.

MG-02 adds the five approved nodes through the existing acknowledged commit, current-state stat callbacks and capacity-aware refill. Service worker is imi-v35. New focused helper and before/after controls plus personally viewed both-edition desktop/360 screenshots are in implementation-r1. Deferred checks and diagnostics are recorded in its handoff; no broad suite or pacing claim.

MG-01's current service worker is imi-v34. Its hosted bridge and two adapters are read-only. Existing mg01-focused helper checks a six-capacity MG-01 baseline; do not rewrite its historical expectations or evidence. Put any necessary MG-02 checks in new helpers/output leaves. Existing Settings style navigation can drop opt-in query flags; use direct edition URLs. The LG-02B2 historical exception is accepted and closed. Next main skeleton work after this tree is LG-03/LG-04 automation and Printings; further game adapters can follow without blocking that work.
