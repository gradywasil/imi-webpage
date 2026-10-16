# Owner-directed skeleton development and proportionate validation

## Authority and purpose

On2026-10-14 the owner accepted LG-02B2 and changed the immediate development priority: build enough of the progression to see how it scales, refine after personal playtesting, and stop spending disproportionate time on small edge cases and exhaustive testing. This is the current direction for upcoming prototype/skeleton tasks and supersedes older per-task blanket demands for exhaustive acceptance matrices at this stage. It does not rewrite completed QA or turn deferred checks into passes.

## Minimum check for a normal skeleton task

- Check syntax for changed JavaScript.
- Play the changed main path once from a controlled development save: unlock, use the feature, save/reload and confirm the expected state. Check one relevant failure or duplicate-action path when grants/spending/resets are involved.
- Use a short economy smoke run when production, resets or automation changes. Capture the existing default control and compare its stable gameplay output when touching ops.js; use a full before/after run only if the change or a smoke failure warrants it. Do not claim byte-identical full-hour proof from a short run.
- For a UI change, inspect the affected screen in both editions, including the smallest phone layout. Check other specified sizes when layout actually changes across a breakpoint or a defect justifies it. Keep no page scroll, >=40px targets, reduced-motion and Low support as design requirements; full fresh matrices can wait for consolidation.
- Report what works, one or two practical limitations and the next feature. Do not repeatedly rerun completed lanes without a new change, failure or unresolved concern.

Preserve local saves and unrelated dirty work. New save fields remain optional/defaulted; no schema change drops data. Scope and one-owner-per-file rules still apply. No commits, deployment or public/default activation without authorization.

## Deliberately deferred until the progression takes shape

Full209-test repeats, large service-worker transition matrices, exhaustive browser lifecycle/fault injection, all-profile long-horizon/free-versus-premium tuning, physical devices, native zoom, screen-reader review, fine balance and polishing can be batched into a later consolidation pass. A specific new bug can pull its relevant check forward; a hypothetical corner case does not automatically justify another broad review round.

No incomplete lane is marked PASS. Keep a short deferred-check list with the prototype handoff. The six-week pacing goal and LG-13 acceptance targets remain later requirements, not claims of the skeleton build.

## Features that retain stronger gates

Paid checkout, paid grants/restoration, irreversible save migration/deletion and public shared-save purchase use need focused correctness review before activation. They can remain disabled while free progression is built. No ads, loot boxes, random reward draws, pay-only progression or sold automations. Child/family constraints and unsettled prices/legal text remain in force.

## Workflow

Owner approves the mechanic/design before implementation. Use a small precise file lease, one implementation owner and one proportionate review. Read-only scoping needs no new implementation approval. Build recognizable mechanics and reachable unlocks first; automate/tune/polish after the owner can play the loop. If a change affects an unsettled design choice, ask about that choice while continuing independent work.

Status: ACTIVE OWNER DIRECTION 2026-10-14. Detailed retrospective evidence remains preserved; future skeleton tasks use this proportionate policy.
