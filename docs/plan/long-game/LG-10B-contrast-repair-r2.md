# LG-10B Pixel locked-award contrast repair

## Goal and authority

Resolve the one concrete finding from LG-10B-review-r1.md and evidence/LG-10/awards-review-r1/Handoff.md/result.json. Functional local opt-in PASS; presentation HOLD because Pixel locked awards have whole-card opacity .5, exposing the patterned background behind task/reward text at360x560. This is a routine readability correction within approved UI requirements, not a new reward/design direction. No new owner approval needed. Existing ten-award logic/rewards/historical policy remain approved and unchanged.

## Ownership

Own only ops.css for a minimal Pixel locked-award contrast correction, and sw.js ONLY cache-version bump from imi-v72 to imi-v73. No asset-list rewrite. All other product files and all prior evidence/docs are read-only. Own NEW tools/long-game/lg10b-contrast-r2-* if needed; NEW evidence/LG-10/awards-contrast-r2/** excluding parent-dispatch.json; this Status/Handoff. Do not edit original LG10B task or review evidence. Sole CSS/SW writer, not alone in dirty checkout; preserve unrelated bytes and line endings. Every code line justifies existence. No children/dependencies/art/generic styling refresh/stage/commit/push/deploy/default activation.

Read docs/plan/README.md, skeleton-validation-policy.md, LG-10A-approved-awards.md, LG-10B implementation and review briefs, exact reviewer finding and relevant current Ops award CSS/card rendering. No full-source campaign needed. Parent inspected ops.css:530 whole-card grayscale+opacity .5 and final Pixel image, agrees concrete contrast failure. Original user also requested consistent/readable UI. Unowned prerequisite must be reported before edits.

## Deliverable

Restore readable opaque Pixel locked-card text/background while retaining a clear unfinished appearance using existing grayscale/icon/border cues. Prefer one scoped html[data-style="pixel"] .o-award.locked override; do not change Classic styling, layout/fonts/spacing/touch targets, unrelated locked cards, or reward/Goals mechanics. Actual before/after rendering decides if one override suffices. This may repair all Pixel locked award cards sharing the defect, not only the ten new rows. Do not introduce a feature flag or JS for a CSS contrast repair.

## Proportionate verification

Capture exact dirty-before CSS/SW bytes and hashes before editing; new two-file patch/raw reconstruction, final hashes. Rehash the seven non-SW candidate product files against awards-r1/final-source.json and prove unchanged. SW must differ only version72->73; node --check sw.js. CSS-only repair needs NO harness or reward-runtime rerun, original source-matched functional evidence stays valid with that qualification.

Use existing final actual fixture/display helper after reading, adapt read-only setup into NEW helper. Open ACTUAL active Awards pane with unfinished new cards in Pixel360x560, Effects Low/native reduced motion; capture and personally inspect task descriptions/reward previews for legibility and no body overflow. Capture corresponding Classic360x560 pane to show style/layout intact. No broader size/device/accessibility campaign or unrelated polish. Existing default/functional suites reused, not rerun or called fresh.

Ordinary browser preview_status then preview_open if needed. Repository isolated Chrome/Puppeteer authorized, task-only saves/origin/profile/ephemeral server, capture ownership and close only owned browser/server. Chrome C:/Program Files/Google/Chrome/Application/chrome.exe; module C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js. Protect ports8000/8354/8356/8358/unknown8397, all user/prior profiles/tabs/services/storage and unrelated art stderr. No process-wide kills/profile deletion/cleanup campaign. Preserve failed attempts uniquely.

## Status

CANDIDATE COMPLETE 2026-10-15. Sole ops.css/SW-version writer lease RELEASED. One Pixel locked-award opacity override and imi-v73 only. Functional review PASS retained with seven non-SW source hashes unchanged. Overall local acceptance awaits bounded different-model visual recheck.

## Handoff notes

Return Handoff.md with exact two-file diff/hashes, seven untouched candidate equality, raw patch, SW version-only/syntax, before/after Pixel and Classic actual images/fit/source/resource identity. Update this Status/Handoff, release writer and stop. Parent will use one small review round to close only the finding; do not claim acceptance or rerun functional campaigns.

Repair evidence: evidence/LG-10/awards-contrast-r2/Handoff.md, result.json, task.patch, exact before/final bytes and four actual Awards images. Raw patch reconstructs both files; SW version-only and syntax pass. Pixel text/reward previews personally read as legible; Classic before/after PNG bytes identical. Both360x560 Low/native Reduce panes fit without page overflow. Task-owned browser/server handles closed, profiles retained. No functional rerun or acceptance claim. Writer released; stop for parent review.
