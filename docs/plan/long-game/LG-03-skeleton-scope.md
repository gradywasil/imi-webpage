# LG-03 automation skeleton scoping

## Goal

Turn the approved automation catalogue into the next precise implementation slice. Identify actual open design choices and propose a small concrete owner-review package. Do not redesign the long game or hold the skeleton up for exhaustive testing.

## Files owned

Documents only: NEW `LG-03-owner-review.md` and NEW `evidence/LG-03/scope-r1/**`, excluding parent dispatch.json. This task's Status/Handoff notes only. All product code, old evidence, master plans, branches and other worktrees are read-only. Preserve unrelated dirty work. No children, staging, commits, deployment or activation. Every line of code must justify its existence.

## Required reading

Read `docs/plan/README.md`, `docs/plan/long-game/README.md`, `premium-currency.md`, `skeleton-validation-policy.md`, `MG-02-accepted.md`, and current relevant Ops/extension/save/Rewards/banana/pickup APIs. Use rg and bounded reads. Art integration is retired; premium/payment work is deferred. LG-02B2's accepted historical exception is closed.

## Deliverables

Write an owner-review package of at most1200 words covering A1-A5, challenge4->8 and an incremental build order. Separate master-specified behavior from concrete proposed defaults and genuine blocking decisions. No implementation or price/reward decision may be silently accepted by this document.

1. Verify current Printing numbering, manual hire/coach/shop/restore/pickup actions, costs, lock checks and available extension seams. Auto-hire base is one hire per20s, reserves25% of that desk's letters, unlocked at displayed Printing2. Auto-shop base unlocks at Printing3 and buys only under10% of wallet using an ordered priority list. Give exact first-slice ownership, controls, optional persistence, existing action reuse and focused verification. Recommend building the framework plus Auto-hire first if that avoids unresolved challenge/tier work. Each later slice must have a reachable earned unlock and a bounded action budget. No sold automation or Inspiration requirement.
2. Resolve through proposal, not assumption, the conflicting master schedule versus catalogue gates: Auto-restore at Printing5 versus Haiku Run clear; Banana net at Printing6 versus Deadline clear. Recommend AND/OR/another explicit rule with a concrete reason. Do not re-litigate established layer names, six-week target, kid-friendly constraints or minigame rewards.
3. Identify missing3-5 upgrade tiers, their earned purchase resource/costs, clock semantics and the four new constraints with clear bronze/silver/gold behavior. Propose compact initial tunables only where needed for a playable later slice. Existing four challenges, reward IDs, award names and perks must remain. No unapproved Diamond Banana assignments, final prices or legal copy. If a full eight-challenge design would delay the first automation, stage it explicitly later within LG-03 rather than omitting it from the track.
4. Show how default-off and toggle-off control, current-state reset retention, actual acknowledged configuration writes and reuse of existing economy/actions can work without a generic state setter or large Ops rewrite. Automated actions must obey manual locks/affordability and existing save ownership. Do not require a new transaction platform for the prototype. Offline automation can be staged if clearly disclosed and owner approved; do not invent offline actions or elapsed replay.
5. List no more than three owner decisions that genuinely block implementation beyond the already specified base Auto-hire. Recommend the smallest next implementation task and what can proceed from the existing authorization. Output a concise change-free handoff. No browser work, testing campaigns, historical recovery or extensive inventories.

## Acceptance and verification

Documents only, actual source pointers for proposed seams, no product diff. Provide a concrete first task with files owned and minimum syntax/main-path/save/reset/default-control/both-edition-small-phone checks. Preserve final long-horizon tuning and LG-05/LG-07 design gates. MG-03 remaining game adapters can follow Printings and must not block main mechanics.

## Status

COMPLETED DOCUMENTS-ONLY 2026-10-14. Parent reviewed LG-03-owner-review.md and current manual-hire source. Concrete first lease is LG-03A-auto-hire.md; runtime dispatch awaits owner disposition of its timer/budget/offline proposal. No product change.

## Handoff notes

The owner wants a playable progression skeleton and proportionate review. Avoid another large up-front plan. Auto-hire's basic numbers and Printing2 unlock are already approved in the master; gates/tier/challenge gaps must be made concrete before relying on them. Existing product cache is imi-v35; no change here.
