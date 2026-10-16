# UI-02 owner playtest cleanup

Status: ACCEPTED LOCALLY 2026-10-15. Bug/banner writer released ops.js and ops.css. Parent reviewed narrow source fixes, actual after-results, Pixel360 drawer, Classic360 six-buff screen and Pixel1280 layout. Drawer priority, actual final-authored/kids/library sale regression, save/reload and compact expiry checks passed in both editions; one-minute legacy control matched before. Broad lifecycle/physical APK not tested. Automation relocation now owns ops.js; retain UI02 fixes. No deployment yet.

## Goal and authority

Owner wants automation controls next to each affected system, helper purchases in Shop instead of an Automation tab, the Floor side menu above the typewriter, no repeating legacy 'all 16 titles' popup, and much shorter UI. Timed Frenzy/Golden Keys/etc banners show only name plus a duration bar. Preserve current Pixel/Classic art and normal-URL defaults. This is a playable-skeleton cleanup, not a full QA or redesign campaign. Every code line must justify its existence.

## First implementation lease

Only ops.js, ops.css, and NEW tests/playtest-cleanup.test.cjs may be edited. Evidence may be written under evidence/UI-02-playtest-cleanup/**. Read docs/plan/README.md and long-game/skeleton-validation-policy.md, related CSS shell stacking, core.js and existing tests/tools as needed. No other source edits, SW bump, commit, push, deployment, child agents, new assets or dependencies. You are not alone; preserve unrelated edits and local artifacts. Parent owns this document and the next lease.

## Deliverables

Reproduce the Floor drawer occlusion using the actual screen and identify the stacking cause. Reproduce the completion-popup trigger through its actual sales path with a controlled save. Fix the authored-title/catalogue mismatch and make any retained collection celebration edge-triggered once, without marking all generated/library books complete or changing earning/progression. Timed buff chips must visibly contain only name and a timer bar, with concise accessible names and existing expiry/held-Retry timing retained. Challenge chips can retain essential progress. Remove obsolete description-only CSS/markup when appropriate; do not hide live buttons with broad CSS. Use existing meter authority and preserve Low/reduced motion.

## Verification

Follow diagnosing-bugs for a tight symptom-specific loop; bounded deterministic reproduction instead of a broad test campaign. Inspect actual before/after mobile Floor drawer and multi-buff screenshots in both editions at 360x560 and one desktop layout; do not trust geometry alone. Use repository Chrome/Puppeteer workflow, isolated task-owned profile/origin only, preserve existing resources. Syntax check changed JS; meaningful regression test for repeated sales/banner symptom if suitable. Do not run long balance simulations. Capture source hashes, minimal diff and concise handoff with actual verified/unverified boundaries, including fixture qualifiers. Release ops.js/ops.css lease when complete.

## Handoff notes

Owner selected Legacy stars for automation purchases on 2026-10-15. Keep existing progression unlocks and existing tier costs. Any new base-helper star prices still need the promised concrete owner review before implementation. Do not implement automation purchases in this first bug/banner lease.
