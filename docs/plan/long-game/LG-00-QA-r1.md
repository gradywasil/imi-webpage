# LG-00 independent QA, round 1

**Verdict: HOLD.** This is a candidate, not accepted. The default-speed seam is well supported by byte parity and a new 90-minute comparison, but the speed-2 offline Deadline case violates the game-time deadline. The current content endpoint is also not measured. LG-01 should remain undispatched until the manager decides which LG-00 gates must be closed and a correction is reviewed.

## Material findings, ordered

1. **FAIL, Deadline can clear after expiry during accelerated offline publisher work.** `ops.js:1420-1461` bulk-simulates all away production and sells through `autoSellAway` (`ops.js:1121-1129`) without checking the Deadline at sale time. `checkChallenge` (`ops.js:953-957`) then checks sold count before elapsed time. Repro: load the real balance page; set a Deadline with 10 game seconds remaining, prebank eight authored titles, enable tier-3 publisher, skip 60 real seconds, call `simulateAway(60)`, then advance one second. At speed 2, all eight sold and `chDone.timed=true`, although the 1200-game-second deadline had expired. Expected: expired sales cannot clear Deadline. Actual speed-1 current and frozen-old runs sell four and fail; the bulk-ordering weakness predates LG-00, while the accelerated path makes this failing case reachable. Raw inputs/results and loaded Ops hashes: [adversarial.json](evidence/LG-00/qa-r1/adversarial.json). Its `elapsedRealSeconds` field is a fallback after the challenge object is cleared, not a timed measurement. This is a required clock behavior blocker.
2. **FAIL for a supported slow provider, pickup lifetime uses a real-time fallback.** `pickups.js:42,56-59` schedules `setTimeout(clear, 14000)` alongside the production-clock expiry. In the T3 Classic page at speed 0.5, a native pickup existed after 10.00 real/4.97 game seconds and was gone after about 15.01 real/7.49 game seconds, while still eligible. Expected: 14 game seconds of pickup lifetime. This does not affect the proposed paid ladder (x1.25 to x2), so it is a seam correctness issue, not evidence of a shipped paid-speed failure. [slow-pickup.json](evidence/LG-00/qa-r1/slow-pickup.json). The preceding 15-second T3 evaluate timeout is retained in that receipt and is not used for timing.
3. **Future permanent-purchase contract is unresolved at full reset.** `ops.js:2722` creates a fresh `prem` and `rewards`; a controlled extension with `prem.owned.speed=1` lost it on native full reset. Second Printing correctly retains the namespace at `ops.js:962-978`. The premium spec promises permanent purchases, and LG-02 starts free-only, so the owner/manager needs an explicit full-reset preservation or recoverable-ownership rule before a Vault purchase is implemented. No paid item or restore exists in LG-00, so this is a downstream contract blocker rather than a current purchase-loss report. [full-reset.json](evidence/LG-00/qa-r1/full-reset.json).
4. **UNVERIFIED finite endpoint and duration.** The endpoint is precisely defined as six desks, all authored titles, four challenge clears, full Legacy tree, finite desk training/keeper/restoration caps, and max lamp/publisher. The selected Regular run stopped at calendar 7200.15/active 300.15 minutes, and Hardcore at 2430/330; Casual and Away reached seven days but not a first reset. None reached six desks, full Legacy, or finite completion. The claimed one-to-two-day gap and month pacing cannot be accepted from these runs. Host guards and an expensive second-by-second online bot are the measurement limit, not a game endpoint. Safe next step: preserve these partials, optimize or checkpoint the **measurement harness only**, then continue a fixed, documented profile/seed through the same endpoint with bounded chunks and raw state/source receipts; never splice separate policy trajectories or extrapolate a finish time.
5. **Baseline wallet provenance deviation.** `before/old-save.json` contains the real `imi-score` value `35525` as an unversioned numeric string. A correctly versioned wallet was captured later from frozen pre-edit Ops, and native play/save/reload kept 35525, but this does not satisfy the exact pre-edit versioned-wallet artifact requirement. This is a provenance shortfall, not observed wallet loss.

## Acceptance matrix

| LG-00 gate | Result | Evidence and limit |
| --- | --- | --- |
| Syntax/economy | PASS | `node --check ops.js`, `node --check pickups.js`, five economy tests passed now. |
| Frozen default-speed parity | PASS | Independently converted all 19 before/after raw reports, compared both canonical receipts and hashes, full gameplay serialization, completion/error fields; 190 loaded-source identities matched frozen/current bytes. Determinism repeat included. A new 90-minute active/collect seed-1 run had identical full Bot reports and empty errors with frozen/current Ops. [parity.json](evidence/LG-00/qa-r1/parity.json), [source-audit.json](evidence/LG-00/qa-r1/source-audit.json), [extended-parity.json](evidence/LG-00/qa-r1/extended-parity.json). The 90-minute run still omits systems listed by the legacy bot. |
| Extension lifecycle/save | PASS with future reset decision | Registration precedes startup `checkAwards` and `welcomeBack` (`ops.js:2791-2792`); the controlled foundation case showed live `state()` after Printing, namespace retention, unknown loaded fields, duplicate rejection and full-reset clearing. Cold-start speed with a pre-registered extension was source-ordered but not independently measured in this round. |
| Speed and clocks | FAIL | Existing 22 controlled cases support exactly-once production, real cap, world/daily stability, keeper/garden/buff/premiere behavior. Independent rare-Z desk-5 tests showed 9952-second growth: after two real hours speed 1 was unripe, speed 2 harvested 20; an eight-hour absence counted only 7200 seconds and shifted readiness by 7200000 ms. Deadline/publisher chronology fails as above. [rare-garden.json](evidence/LG-00/qa-r1/rare-garden.json). Future Commission/Seasons clocks have no implementation to test. |
| Old save and Core wallet | PASS with provenance deviation | Native-save receipt loads, types, saves via actual pagehide/Core wallet path, and reloads 35525 with empty runtime/HTTP errors; original pre-edit wallet format did not match the requested versioned capture. |
| Pixel/Classic visuals | PASS for bounded browser views | I opened all six `screens/headless-final-isolated` PNGs at 1280x800, 390x700 and 360x560. The floor/tutorial remained visible in both editions, with no screenshot evidence of page clipping; manifest records viewport-sized documents, reduced motion, Effects Low, and 40px Key guide. The native pickup measures 48x48. Classic's 36.25px **artificial extension fixture** button is not a shipped control and proves no global 40px result. No physical-device or broad animation/listening claim. |
| Multi-day/finite current content | UNVERIFIED | Source-bound selected raw profiles have empty errors and explicit guard stops; all four finite endpoint flags are false. No completion-duration estimate follows. |

The current source hashes matched the manifest, including `ops.js` SHA-256 `33f49cb7457d58b78c8da734267c9d1fed4e0b7232fed2aa9af32b6fbe487dc9`. PID 78676/8147 and PID 43468/8148 were rechecked as Python HTTP servers rooted in this checkout. T3 `preview_status` was initially unavailable; `preview_open` succeeded, so interactive checks used T3. The separate headless economy harness used existing Puppeteer/Chrome. No original evidence or source was changed.

## New commands and evidence

From the checkout root, with no dependency installation:

```powershell
node docs/plan/long-game/evidence/LG-00/qa-r1/check-parity.mjs
node docs/plan/long-game/evidence/LG-00/qa-r1/check-sources.mjs
$env:PUPPETEER_MODULE='C:/Users/arran/AppData/Local/Temp/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'
node docs/plan/long-game/evidence/LG-00/qa-r1/adversarial.mjs
node docs/plan/long-game/evidence/LG-00/qa-r1/extended-parity.mjs
node --check ops.js
node --check pickups.js
node --test tests/economy.test.cjs
```

The scripts use exclusive `wx` output and have already run; use fresh QA output names for any repeat. All new files are this report and `evidence/LG-00/qa-r1/**`. Nothing was staged, committed, deployed or installed.
