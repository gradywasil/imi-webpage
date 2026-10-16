# Owner playtest cleanup, cache v80

Accepted for owner-authorized shipment, 2026-10-16. Includes UI02, UI03A, UI03B and UI03C. No additional approval gate remains. Paid checkout remains disabled. The APK loads the live website and needs no rebuild.

## Changes

- Automation settings are beside the feature they affect; no dedicated Auto tab. Shop Helpers lists all eleven bases at the approved 1 Legacy star each. Existing tier upgrades stay 1/2/4 stars. Buying leaves helpers Off, with earned gates/manual proofs retained.
- A once-only acknowledged admission retains helpers already eligible, used/configured, upgraded or challenge-granted. Future unlocks require purchase. Ownership and settings survive progression resets; no save is wiped.
- Floor side menu retains stacking priority above the typewriter.
- The original 16-authored-title collection celebration triggers only on its final authored sale; later kids/library sales do not repeat it. Its heading now says Original collection, distinct from the seven-play Works capstone.
- Timed buffs show name and shrinking duration bar. Productive-time/held timing authority remains.
- Progression panels use shorter copy and optional secondary rules. Costs, progress, loss consequences, claim and Retry actions remain visible when needed.

## Verification

UI02 actual-sales/drawer/buff regression passed in both editions, including reload/expiry and a short identical legacy economy control. UI03A exercised actual inline toggle/reserve/priority settings, Shop tier purchase, reload and failed-Off save/Retry; all eleven destinations and no Auto tab were checked. UI03B changed presentation strings only, with matching executable structure, 20 actual panel/overview captures and 14 keyboard disclosures. UI03C passed three focused tests covering actual base buys in both editions, exact debit/Off/reload, duplicate/stale/failureRetry, frozen grandfathering, ownership guards and Printing/Imprint/Estate projections. Its three-minute legacy control matched prior gameplay output.

Parent inspected affected Pixel/Classic mobile screenshots and desktop captures. Representative sizes were 360x560, 390x700 and 1280x800; Low/reduced motion preserved. Final different-model UI03C review PASS is in evidence/UI-03C-review/review.md. Parent config tests pass with cache v80. The whole-batch Impeccable detector reported existing bounce/paint conventions in unchanged lines; incumbent game art was preserved.

Evidence uses controlled saves, not natural progression. Physical APK/device, screen-reader, natural pacing and broad lifecycle/fault/cache-transition campaigns remain deferred. Deployment uses a committed runtime-only export, excluding local QA captures, certificates, tools and nested worktrees. Live source hashes and normal-URL smoke receipts will be retained under evidence/UI-cleanup-release/.
