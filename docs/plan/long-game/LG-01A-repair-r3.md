# LG-01A repair r3: Contain startup errors in both callback orders

## Goal

Restore the approved blocked/Retry contract when enabled startup rejects an unsupported save. R2's initial rejection preserves data, but Retry can reload into an owned document without IMI or a status panel. Contain failures consistently whether startup callbacks are queued before lock acquisition or registered after ownership. Complete the previously interrupted save-shape matrix after the guard works.

## Files owned

rewards.js, startup invocation/error containment and retry/ownership lifecycle only; sw.js, VERSION bump only; new tests/rewards-startup.test.cjs if a meaningful deterministic regression seam is available; this brief and LG-01A-save-and-startup.md Status/Handoff only; new evidence/LG-01/repair-a-r3/** with narrow helpers. Economy/Core/Ops/edition bootstraps/shells/CSS/prior briefs/reports/evidence and all other runtime source are read-only. Do not alter the r2 Economy preflight without a further lease. No stage, commit, push, deploy, install or delegation. Preserve unrelated work; you are not alone. Every line must justify its existence.

## Files it may read

docs/plan/README.md, main/premium/execution/approved reward design, LG-01A parent brief, QA r1, r2 brief and handoff/failure receipts; relevant actual startup scripts and tests. Read C:/Users/arran/.agents/skills/diagnosing-bugs/SKILL.md and apply its feedback-loop procedure. Look for CONTEXT.md/relevant ADRs only if present.

## Exact deliverables

1. Seal current Rewards/SW bytes and unchanged source identities before edits. Reproduce the missing-panel symptom with a sharp fast assertion, not merely an error-free run. Exercise the real Rewards module with controlled lock/callback ordering and retain failing before-source outputs. Use a small local module test for deterministic ordering only if it reproduces the actual caller pattern; native actual-page reproduction remains required. Do not label a synthetic DOM/lock harness as browser evidence.
2. Confirm the failing callback sequence, minimise it and rank falsifiable hypotheses before choosing a fix. The r2 handoff suggests the already-owned Rewards.start direct callback bypasses acquire's catch, but that is not yet an independently proven cause. Rule out cached source and navigation/startup timing against the retained receipt. Keep instrumenting/outputs concise.
3. Ensure startup exceptions in both queued and already-owned registration routes reach the same failure behavior: cancel/refuse game callbacks, cease ownership/writes, release the held lock, display the existing blocked status with reachable Retry. Later script registrations must not hide the failure panel, silently continue boot or cause an automatic reload loop. Retry must deliberately reload/reacquire fresh state; unsupported saved records remain untouched across repeated attempts. Preserve successful boot order and default-off behavior. Do not add a generic scheduling framework or redesign startup/UI.
4. Add a regression test at the correct module/caller seam before fixing. Test externally observable contract and both relevant registration orders, including a later dependent callback and deliberate retry. No implementation-mirroring or duplicated production functions. If no meaningful seam can be built, record why rather than claim regression proof.
5. Finish the r2 both-edition native matrix: unsupported wallet strings/arrays/booleans/null/unversioned or invalid-version objects; Ops strings/numbers/booleans/null/arrays/parse failures; repeated Retry; supported numeric wallet/object Ops legacy conversion; valid versioned/metadata/marker saves; missing-key fresh start; valid convertible key paired with invalid other key. Preserve both raw record bytes, unrelated fixture data and no backup writes for blocked pairs. Native outcomes must come from actual edition pages using current Economy/Rewards bytes.
6. Bump imi-v17 cache version for Rewards changes. No other runtime edits.

## Acceptance criteria

Meaningful deterministic regression goes red before and green after; node --check changed JS; existing economy tests; a fresh complete sixty-minute seed-1 active/collect disabled harness report compared to sealed LG-01A before raw/canonical with only approved provenance exclusions. Preserve old source-bound passing reports and failures unchanged. Full payouts/backfill/gold/Goals are not implemented or accepted here.

Native T3 pages in both editions must retain Retry/status after repeated reloads, hold no writer lock following rejection, perform no invalid-data replacement and allow valid startup/second-tab handoff. Open fresh blocked/error captures and bind served hashes plus loaded functions. Existing UI/CSS remains read-only, so older screenshots keep their historical identity; do not relabel them as current captures.

Actual hidden-tab resume, bfcache restoration and reduced-motion media remain UNVERIFIED until the separate browser-choice request is answered and those checks run. This repair cannot waive them or assume permission. No next slice starts before safeguard acceptance.

## How to verify

Use diagnosing-bugs red loop and original native scenario. Native browser is T3 preview_status then preview_open, task-owned origins/tabs only, no owner save cleanup. Revalidate 8162 server identity before use; previous PID 68788. Required headless economy may use existing external Puppeteer/Chrome without installation. No alternate native browser unless new authorization is recorded. Store all new raw results and diagnostic/helper artifacts under repair-a-r3; the meaningful regression test may live at the named test path. Retain failures, intermediate identities and stale-source receipts.

## Status

CANDIDATE REPAIR READY FOR INDEPENDENT REVIEW, 2026-10-12. The real-module regression went red before and green after; the native Classic Retry defect was reproduced before editing and the complete both-edition shape/Retry matrix now passes. This is candidate delivery only. LG-01A acceptance remains HOLD pending independent review and the unverified actual hidden-tab/bfcache/reduced-motion lanes. R2 and QA r1 retain their original HOLD evidence.

## Handoff notes

Current Economy SHA-256: 7c79b75cce79aec964403be5b1f1cfcebc29276ddd55b9e9f83a1409cc2fd00e. Current Rewards: b958dc4adc04c97be8bdeb885ad90ba0adfd669cdefd56c92751e3ceaed720fc. SW version imi-v17. Manager independently raw-derived r2's complete report parity, pretty canonical hash 5ef60fd274a856b386ae15ecebc5ac5b7ac3dfd37768bd08d4b060d8ee20a6a9. This does not complete the native matrix or prove error recovery. R2's retry-diagnostic-failure.json retains the missing status/IMI and owner=true symptom. All prior approval limits, open premium decisions and endpoint/provenance dispositions remain unchanged.

R3 handoff: [evidence/LG-01/repair-a-r3/HANDOFF.md](evidence/LG-01/repair-a-r3/HANDOFF.md). Rewards SHA-256 is now c0fa53868c13e165c60f5fc14f066ff965e7ae0419021fff67af85fad2512047; SW is 832a97f0dae4a248b5456ee4e3a28bffbacf44ef7d5fc96ac610b9c9148315a3, imi-v18. Economy retains the r2 hash above. Shared callback containment and a failed-document latch release ownership, cancel queued/scoped work and preserve the existing status/Retry. Later script registration cannot reacquire or reload; explicit Retry reloads after a startup failure. Public APIs, successful ordering and the default-off synchronous path are unchanged.

Native evidence covers 20 invalid key-pair cases in each edition, initial block plus two distinct Retry reloads each; six positive fixtures per edition through acknowledged save/reload; fresh-state Retry recovery and actual shared-context contention/handoff in both directions. Served identities and loaded functions accompany results. Both new 1280x800 blocked captures were opened. Five regression tests, five Economy tests, syntax checks and fresh complete disabled sixty-minute raw-derived parity passed, with the same canonical hash above. The module scheduling fixture is synthetic, not browser proof. The final seal/lease audit, exact diffs, commands and retained intermediate failures are in the new directory. No next slice, acceptance, alternate native browser, install, delegation, staging, commit, push or deployment occurred.
