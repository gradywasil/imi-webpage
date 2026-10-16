# MG-00: scope minigames into long-game progression

## Goal

Produce a concrete, small design proposal and revised implementation sequence for integrating the existing minigames into the idle game's progression. The owner wants a playable progression skeleton soon, followed by personal playtesting and later deeper QA. Documents only; no game edits or testing pipeline expansion.

## Owner decisions to follow

The owner accepted LG-02B2 on2026-10-14 and explicitly reduced immediate QA breadth. Read skeleton-validation-policy.md; do not reopen the accepted historical exit-code exception.

The owner then chose ONE shared side resource earned ONLY from minigames, with NO idle-game earning fallback. It funds a separate optional meta-upgrade tree, small stat boosts that persist between progression resets. Rewarded game attempts can have a real-time recharge/timer so players return to check their idle factory and have active things to do. The idle game should receive NORMAL ONLINE production while they play minigames, not move into offline simulation merely because a minigame is open.

Avoid requiring skill at a particular game. All participating games grant the same shared resource, and low-performing/losing players can still make progress in this side tree. The main Printing/Imprint/Estate/capstone path remains clearable without purchasing side-tree boosts or beating a particular minigame. The owner wants minigames encouraged through desirable optional permanent bonuses, not compulsory score gates.

The earlier proposal of an ordinary idle-game fallback is REJECTED by the latest owner message. Treat the above as settled direction; names, numbers, specific nodes, unlock schedule, attempt capacity/recharge and precise reset handling still need the concrete design review. Do not invent final premium prices or DB grants.

## Files owned

- docs/plan/long-game/minigame-progression-scope.md: complete concise owner proposal.
- docs/plan/long-game/evidence/MG-00/discovery.json: bounded factual code inventory/source pointers.
- This task's Status/Handoff only.

All other files, game source, minigame worktree, tests, helpers, master plans/statuses and historical evidence are READ-ONLY. You are not alone; preserve others' edits. No children, code/build edits, commits/staging/push/deploy, browser state changes, test runs, broad filesystem inventories or production activation.

## Files to read and code questions

Read docs/plan/README.md, docs/plan/long-game/README.md, premium-currency.md, execution.md latest owner direction, skeleton-validation-policy.md, LG-02B2-accepted.md, this brief, and relevant LG-00 extension contract/API records. Read minigames/CONCEPTS.md, minigames/index.html, mg-core.js, mg.css, representative existing game shells and each game's finish/score/controls contract. Inspect the actual Ops extension seams/save/default/reset/normal tick paths and main shell/tabs/scripts/service worker only as needed for the integration map.

Answer narrowly: how many games actually exist in the root and attached minigame worktree, which use MG.shell/S.finish, what score/end/duration differences matter, how MG.boot/storage/back navigation behaves, where the parent would keep production alive, how optional save fields and prestige retention work, and what the minimum bridge/metadata/hooks need to be. Root and .claude/worktrees/minigames currently show the same clean minigame commit7d1e3863. The owner mentions more recent games; verify bounded current worktree status rather than claiming unseen work is integrated or blocking this design. Support future games through a common adapter/config entry.

## Exact deliverables

1. A short inventory table of current playable games and common-shell support, based on actual code. Do not copy every game's entire rules. State any checkout mismatch and source limits honestly.
2. Recommended shared resource theme/name, with one or two alternatives. Inspiration is a useful working name, not an approved player-facing decision. One currency only; no per-game mandatory currencies, no DB payout from random pickups, and no mistaken conversion of existing minigame Diamond icons into premium currency.
3. Timed rewarded attempts: suggest a simple shared bank of attempts across games, real-time refill, a modest bank capacity to reduce pressure, no expiry of stored attempts and no pay/ad refill. Clearly distinguish rewarded play from optional free practice. User chose timed attempts as encouragement; no countdown offers, streak punishment, hidden reward draws or FOMO promises. Give a FEW explicitly prototype/tunable starting numbers and their reason; no hour-by-hour balance study.
4. Transparent deterministic side-resource reward rules across different games. Baseline progress for an engaged natural losing run, a small bounded skill bonus and a common reward range across game genres. Do not make one game the compulsory farm or require wins/highscores for main progression. Handle very short failure, restart/quit and long-session games with a clear understandable rule, avoiding heavy anti-cheat/telemetry/security machinery. Local solo-game rewards still need basic duplicate-result refusal and ordinary save correctness.
5. A small first permanent tree, roughly3-5 nodes with bounded bonuses and visible first purchase. Suggestions include typing, keeper work, title sale income or mini-attempt capacity; propose a modest total ceiling and additive within-family stacking so a new premium multiplier spiral is not silently introduced. Nodes cost ONLY the shared resource. Explicitly separate side-tree progression from existing main-layer entry/automation prerequisites. Cross-reference later LG13 pacing instead of pretending tuned six-week proof.
6. Unlock/reset integration: where players see/play games in The Room/Printings, optional later expansion at Imprints/Estate and thematic connection to the monkeys discovering other activities. Persist side wallet/tree through Printing/Imprint/Estate progression resets; do not override the existing guarded full Settings reset or decide New Game+ implicitly. No forced capstone delay, unique-game score gate or dependency on retired art. Keep early content choice broad enough that different skills have alternatives.
7. Minimal architecture grounded in actual code: hosted in-game panel/overlay with the parent idle document alive, likely an iframe for existing standalone games rather than rewriting15 games. Parent remains the only owner of the main save; child retains local best scores and reports finite results through a narrow same-origin/source-checked bridge. Hosted back/quit must exit to the parent UI, never navigate a nested second idle-game document. Inspect common hooks before proposing them. New systems belong in new files and register through seams; define a minimal optional persisted shape and activation toggle, not a payment-grade platform or general mutation API. Both editions share gameplay with edition-appropriate wrapper; minigame pixel art is reused, not redesigned.
8. Revised SKELETON build order for owner approval: finish a thin minigame bridge/one or two representative games/tree first or alongside the next Printings/automation skeleton, then bring remaining games through the common hook and expand main layers. Propose explicitly deferring remaining premium/payment rigor while free progression takes shape; do not silently change the original task ordering or declare wholeLG02 complete. LG05/LG07 design approvals and later LG13 pacing still stand. No premature art work. Each suggested implementation slice must be small, own files clearly, have one main-path/save check and a proportionate review.
9. End with a short list of the actual owner choices left, recommended defaults and one concrete next task. Keep the complete proposal around1200-1800 words maximum, in plain language with useful tables. Separate confirmed direction, proposed knobs and deferred polishing. No speculative dozens of contracts/evidence gates. This is a scope document for the owner to approve before game changes.

## Acceptance and verification

The proposal must match the owner's latest resource-only-minigames decision, permanent optional tree, timed return loop and continued online idle production. No reintroduction of idle earnings or minigame skill gates to main layers. Use source pointers for technical assertions; static reads are enough for this task, no runtime acceptance claims. Preserve kid-friendly/ad-free/free progression and earned automation rules. A pure bonus tree must not sell automation or fake paid trust.

Status/Handoff should describe the document as READY FOR OWNER DESIGN REVIEW, never approved or implemented. Return concise summary, files, source limitations and recommended next implementation. Parent will review the actual proposal; broader QA waits for the progression skeleton under current owner direction.

## Status

DESIGN APPROVED 2026-10-14 by owner. Final parent-reviewed proposal uses accumulated active time within a rewarded break and free retries, superseding the initial full short-loss payout. Implementation starts with MG-01; discovery remains static historical evidence.

## Handoff notes

Keep work proportional and forward-moving. The owner wants the game built, not another evidence remediation cycle. The latest owner message specifically excludes an idle resource fallback and asks for active online progression while minigames are open.

MG-00 handoff 2026-10-14: proposal in minigame-progression-scope.md; factual pointers and checkout hashes in evidence/MG-00/discovery.json. Both checkouts at 7d1e3863, 15 playable common-shell games, clean minigames; JS text matches with checkout line-ending differences. Unrelated root dirty work preserved. Proposed six attempts/two-hour refill, deterministic base 10 plus bounded 0-5 bonus, five optional persistent nodes and bridge-first skeleton order await owner review. Static reads only, no runtime/pacing proof or historical evidence chase. Next after approval: MG-01 hosted Barrel/Shuffle bridge, saved attempt/result, safe back and continued parent online production. No children, product/test/master-plan changes, packages, staging, commit, deployment or activation.
