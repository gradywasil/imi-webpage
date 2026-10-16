# LG-01A independent QA r2

**Recommendation: ACCEPTABLE LG-01A prerequisite candidate for root review.** I found no material defect within the default-off startup/save lease. This does not accept LG-01 rewards or settle the owner decisions left open by its approved design. The root still makes the acceptance decision after reviewing the images.

## Material findings

None in the tested LG-01A lease. The two r1 data-loss inputs now block before replacement, and the r2 missing-panel Retry route now retains status and releases the lock. The initial bfcache attempt on the existing QA server failed for an environmental `Cache-Control: no-store` response; a positive control and the game restored on a separate task-owned server serving identical source bytes without that header. Both outcomes are retained. The known Pixel 360px information wrapping is visible in historical disabled images and remains outside this lease.

## Decision matrix

| Gate | Result | Evidence and limit |
| --- | --- | --- |
| Lease, source identity, default-off path | PASS | [audit.json](evidence/LG-01/qa-a-r2/audit.json) compares the named runtime sources with sealed working-tree inputs rather than HEAD. Only r2 Economy preflight and r3 Rewards containment/SW version changed after the implementation candidate. Both shells, balance shell and SW register `rewards.js`; `?lg01a=1` alone enables the partial path. |
| Syntax and focused regression | PASS | All 12 named JS/test syntax checks passed. Current Economy and actual-Rewards-module tests pass 10/10 in [tests.log](evidence/LG-01/qa-a-r2/tests.log). Frozen pre-r3 Rewards source fails 2/5 in [red-before.log](evidence/LG-01/qa-a-r2/red-before.log), specifically the queued and already-owned rejection contracts. The VM test is synthetic scheduling evidence. |
| Disabled 60 minute economy | PASS | Fresh seed-1 active/collect run completed 60 actual minutes, 30 active minutes, with empty error arrays. Raw-derived output matches the sealed pre-edit baseline with only `capturedAt`, `sourceCommit`, `sourceHashes`, `url`, and `wallSeconds` excluded. [Raw](evidence/LG-01/qa-a-r2/disabled-fresh.raw.json), [canonical](evidence/LG-01/qa-a-r2/disabled-fresh.canonical.json), [receipt](evidence/LG-01/qa-a-r2/disabled-fresh.canonical.json.receipt.json). No gameplay, wallet, save, or RNG field was excluded. |
| Enabled invalid and valid saves | PASS for covered cases | Native T3 [subset](evidence/LG-01/qa-a-r2/native-subset.json) reproduces the prior JSON-string wallet and Ops-array inputs, repeated Classic Retry, a valid-wallet/null-Ops pair, missing keys, legacy conversion, and current metadata/marker save/reload. The independent [r3 evidence audit](evidence/LG-01/qa-a-r2/audit.json) checked 40 invalid pair records, 120 distinct blocked documents and 12 positive fixtures/24 documents against current hashes, raw-key preservation, lock state and loaded functions. That audit reviews r3 recordings; it does not turn them into fresh r2 runs. |
| Actual reduced-motion media and UI | PASS for measured surfaces | Isolated Chrome applied `prefers-reduced-motion: reduce` before loading each edition. Native `matchMedia`, Core and IMI flags were true; High and Low panes computed `animation-name: none`, while fresh no-preference High controls computed `o-enterx`. Blocked pages remained nonwriting with focused 44px Retry. Six new Low/reduce images were opened at 1280x800, 390x700 and 360x560; each document matched its viewport without page scroll. [Browser receipt and captures](evidence/LG-01/qa-a-r2/browser-check.json). This is not a whole-game animation audit. |
| Real hidden/foreground ownership | PASS | A real headless tab switch produced `document.hidden === true` and `visibilityState === hidden`. The owner retained the exclusive lock; a same-context Classic contender had no IMI and could not own it. After 32 seconds, foreground visibility was real, Ops logged the return, `awayMax` became 32.273 and an acknowledged save persisted that value. [Raw receipt](evidence/LG-01/qa-a-r2/hidden-30.json). Source and module tests cover cancellation of scoped stale callbacks; this run did not force every pending callback kind. |
| Actual bfcache restore | PASS | With the existing no-store server, both a blank control and the game produced fresh `back_forward` documents; CDP reported `MainResourceHasCacheControlNoStore` among its reasons in [diagnostic](evidence/LG-01/qa-a-r2/bfcache-diagnostic.json). [Chrome's bfcache diagnostic guidance](https://developer.chrome.com/docs/devtools/application/back-forward-cache) identifies that response header as a common blocker. On task-owned port 8164, the blank control produced `pageshow.persisted=true`. The game then produced `persisted=true` on its original `timeOrigin`, with `Rewards.owns() === false` in that restored old document. Its handler reloaded, and the new document acquired the lock and read an intervening wallet score 250 plus Ops meta/run values 50. [Control and game](evidence/LG-01/qa-a-r2/bfcache-cacheable-r2.json), [fresh-key receipt](evidence/LG-01/qa-a-r2/bfcache-fresh-r2.json). A navigation label alone was never counted as restoration. |

## Source, browser and visual boundaries

Current SHA-256: Rewards `c0fa53868c13e165c60f5fc14f066ff965e7ae0419021fff67af85fad2512047`; Economy `7c79b75cce79aec964403be5b1f1cfcebc29276ddd55b9e9f83a1409cc2fd00e`; SW `832a97f0dae4a248b5456ee4e3a28bffbacf44ef7d5fc96ac610b9c9148315a3` (`imi-v18`); Core `f6eedb2a3b63c248e5d10c4c8ad2c049b6c2cbcf8a27d4b3652db92e942fafe9`; Ops `9fad7155dd102130c70f719d1c8e4de01a85db677af661e9451c171e86e6528b`. The [source receipt](evidence/LG-01/qa-a-r2/served-source.json) proves 16/16 served files from both ports matched disk; native loaded `Rewards.start` and `Economy.loadScore` strings matched the current functions. The r2 Economy preflight checks both raw keys before migration/backup; absent differs from JSON null, and valid versioned unknown fields/markers survive. R3 uses one guarded callback path and a failed-document latch, releasing ownership before showing Retry. SW changes only its cache version from r3's frozen input. Other named source files match the repair seals. The source audit deliberately did not scan the art/library/evidence tree.

Chrome was `155.0.8059.39`, from `C:/Program Files/Google/Chrome/Application/chrome.exe`, with the preinstalled Puppeteer Core module at `C:/Users/arran/AppData/Local/Temp/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js`. [Browser receipt](evidence/LG-01/qa-a-r2/browser-check.json) records default and actual launch arguments; no flag was removed or added to obtain bfcache. The cacheable QA server was a hidden process rooted at this checkout, PID 85676 on 8164; [start](evidence/LG-01/qa-a-r2/cacheable-server.json), [stop](evidence/LG-01/qa-a-r2/cacheable-server-stop.json). Its source bytes matched the existing 8162 server. Temporary Chrome profiles were verified under the task temp prefix and removed; PID 68788 on 8162 was left running.

I opened the original twelve candidate disabled/blocked images with their historical candidate identity, both r2 blocked images, both new r3 blocked images, and this QA's six media images plus two reduced-motion blocked images. The original blocked set shows focused Retry in both editions at all three sizes; the current captures show no page scroll and 44px Retry in blocked states. Keyboard focus is preserved in the native blocked receipts. Historical screenshots are not relabeled as current media evidence. Pixel 360px body information wraps as already documented; no new LG-01A status/layout defect was found.

The compact normalized JSON hash is `a3e015257c106618420b1dfba7c802f94e97b9e9c4af4ba2a14552b1247ea7be` on both before and current raw reports. The pretty/newline canonical file hash is `5ef60fd274a856b386ae15ecebc5ac5b7ac3dfd37768bd08d4b060d8ee20a6a9` on both. These are two representations of the same compared fields, not competing gameplay results.

## Commands and limits

From `C:/Users/arran/Projects/monkeyOS-v2`, the core commands were:

```powershell
node --test tests/economy.test.cjs tests/rewards-startup.test.cjs
$env:REWARDS_SOURCE='docs/plan/long-game/evidence/LG-01/repair-a-r3/before/rewards.js'
node --test tests/rewards-startup.test.cjs
Remove-Item Env:REWARDS_SOURCE
$env:PUPPETEER_MODULE='C:/Users/arran/AppData/Local/Temp/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'
$env:GUARD='240'
node tools/balance.mjs 60 active collect 1 30 --url http://127.0.0.1:8162/tools/balance.html --output docs/plan/long-game/evidence/LG-01/qa-a-r2/disabled-fresh.raw.json
node tools/long-game/lg01-a-canonical.mjs docs/plan/long-game/evidence/LG-01/qa-a-r2/disabled-fresh.raw.json docs/plan/long-game/evidence/LG-01/qa-a-r2/disabled-fresh.canonical.json docs/plan/long-game/evidence/LG-01/implementation-a/before/hour-active-collect-1.canonical.json
python docs/plan/long-game/evidence/LG-01/qa-a-r2/audit.py
```

`node --check` was also run on Rewards, Economy, Core, Ops, both edition boot files, SW, Tour, Pickups, both FX files and the startup test. The new browser helpers in this evidence directory were run without installs. No production edit, staging, commit, push or deployment was done.

This recommendation covers the default-off prerequisite interfaces and measured lifecycle only. Claim journal/recovery, historical payouts and backfill, interrupted-away checkpoints, stored gold, Goals UI, reward amounts in running play and final pacing remain future LG-01 work. Q5/Q6/Q8/Q9/Q10, prices and paid full-reset ownership remain open; art is retired, and the LG-00 endpoint deferral and historical-wallet exception are unchanged.
