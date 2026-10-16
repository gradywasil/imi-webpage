# LG-01B focused independent repair QA r2

Recommendation: **ACCEPTABLE for parent review of B's engine repair.** No material repair defect or scoped preservation violation was found. B-R1-1 and B-R1-2 are repaired at the reached baseline boundary in the actual modules and actual Core in both editions. This recommendation does not accept B or LG-01, authorize C, or enable the partial feature. Parent acceptance and its own image review remain outstanding.

Review completed 2026-10-12 on `long-game`, using GPT-6-Astra at medium reasoning as requested, independently of the Sol6.1 author. No delegation, production edit, install, staging, commit, push or deployment. Only the leased new report/evidence/helper-output paths and current QA brief Status/Handoff were written. Prior reports and failures retain their original verdicts.

## Findings and verification qualifications

No new material product finding. Three review qualifications are retained explicitly:

1. The first independent combined invocation completed **84/85**, exit 1. The existing timed first-clear continuation test timed out in `lg01-b-fixture.mjs:47`, waiting for `IMI.ops` in its deliberately missing-budget fixture, called at `rewards-offline.test.cjs:148`. It did not fail a recovery assertion. All 37 new repair tests passed. A fresh combined repeat completed **85/85**, exit 0, on identical source. The first run has no captured page diagnostic sufficient to determine the startup timeout's cause; it is not silently attributed to load or called a production fix. Both logs remain. The repeat used an evidence-path-only preload to keep every earlier exclusive artifact intact, explained below.
2. The initial Pixel division native capture continued ordinary gameplay between the focused Retry click and the next inspection. It ended at wallet189,300/run189,050/divTotal189,050. Raw writes prove the away transaction itself committed wallet189,250/run189,000/divTotal189,000, followed by two ordinary25 wallet writes with the same marker. This is retained as live continuation evidence. A separately named settled probe stops progression in the same click event after the product handler. It returns exactly189,250/189,000/189,000 and matches the no-fault control and acknowledged-key reload. No subtraction or rewritten snapshot was used to force equality.
3. The first T3 orchestration evaluation used top-level `await` inside plain `eval` and failed before making browser calls. It was rerun inside an async function. An attempted read of nonexistent `qa-b-r1/server.py` also failed; the actual `cacheable-server.py` was then read. These tool-only diagnostics did not mutate production or generate passing test evidence.

## Lane verdicts

| Lane | Verdict | Evidence and boundary |
| --- | --- | --- |
| Authority, frozen/current/served identities and narrow repair diff | PASS | [audit.json](evidence/LG-01/qa-b-r2/audit.json), [final-audit.json](evidence/LG-01/qa-b-r2/final-audit.json). All99 sealed inputs verified; only Rewards/SW changed runtime. Later execution chronology is authorized documentation. |
| Syntax and combined automated suite | PASS after retained timeout | Nine syntax targets pass. First84/85 and repeat85/85 are separate runs; final repeat exit0. No old test/helper source was edited. |
| Fresh complete disabled hour | PASS | Fresh60-minute seed1 active/collect,30 active minutes; exact raw equality with repair before and after. Established canonical SHA-256 remains `5ef60fd274a856b386ae15ecebc5ac5b7ac3dfd37768bd08d4b060d8ee20a6a9`. |
| Meaningful red-before regression | PASS | Independent frozen Rewards response reproduces unpaid sale and tripled roy/div totals after two rejections. Paired current controls/faults pass. Historical red-exact records and original failed oracles remain unchanged. |
| Baseline repeated Retry, saved-key reload and controls in actual Core | PASS | Six cases across Pixel/Classic, with individually retained raw wallet/Ops writes, reached fault assertions, focused Retry and separate no-fault controls. |
| Adjacent save boundaries, sequence/head, current-run delta, timed/bulk continuation | PASS | All37 new regressions rerun; raw initial/deletion oracle audit, successive head2 payments, paid recovery baseline and current-run+9000 checked. Simulated bridge coverage remains labeled. |
| Live Deadline hold after sale recovery | PASS within measured scope | Fresh actual-module regression and reviewed source-bound worker native both-edition records show a second hold at the first-clear commit, then one9-DB reward and completion. Worker native evidence is not relabeled as a fresh reviewer native Deadline run. |
| Actual changed-source hidden ownership and resume | PASS | Both editions, durable pending cash and interrupted away payment; nonwriting contender. Additional timestamped away receipts measure32.010s Pixel and32.012s Classic hidden, with actual visibility events. |
| Actual changed-source native bfcache | PASS | Both editions, both payment kinds, `pageshow.persisted=true` on original document, followed by fresh document/current-key recovery. Separate control and stale-write probes pass. |
| Source-bound visual fit and actual media | PASS | Personally opened24 required repair images; all six edition/size pairs and normal/status/media states. Fresh pre-load reduce/High, reduce/Low, no-preference/High controls pass both editions. |
| Original unaffected r1 lanes | PASS with explicit applicability | Catalogue/formulas, claim/backfill/gold, guards and default behavior retain their reviewed source boundaries and rerun test coverage. No new full historical UI/catalogue or long-profile acceptance claimed. |
| Physical crash, arbitrary rollback, physical phones, paid ownership, deployment and final pacing | UNVERIFIED | Outside this evidence and unchanged from the brief. |

## Source review and why the ordering works

Read the plan README, long-game README/premium/execution, approved reward design, parent LG-01 and original B briefs, original QA r1 brief/report, A acceptance/QA/repair responses, repair-r2 brief/HANDOFF, before seal/frozen source, final receipt, exact diffs, regression/probe/fixture sources and relevant raw native/control evidence. Review compared working-tree bytes against the repair's frozen bytes, not HEAD. Original A JSON-shape preservation and callback-error containment remain prerequisites.

The runtime change is exactly the recorded Rewards ordering diff and SW `imi-v22` to `imi-v23`, with the asset list unchanged. Ops, Core, Economy, CSS, shells, old tests and scoped helpers are byte-identical. The final audit rechecked all99 current input hashes against this review's initial audit. The worker receipt differs only for subsequent `execution.md` chronology. The current review brief was not one of those worker receipt entries; its only edit is this review's Status/Handoff.

Current source identities:

```text
rewards.js a985e1142504dbfee4f0547685cbda6665889e34a955a84f967b44e9db6d35fd
sw.js      eb8f177f33d8e60e32e9aa69e8140fb6ee315d515e3df8f28645d5ffb944e4c6
ops.js     88047df1acd519c96342c1253f75873d9101c6e7a71e7a7319c4e361c981752e
core.js    0ab61043f94bef1f89ed64b717721ddcbbc50439df4add1d53d1c7e18827fbe3
economy.js 7e3eaf72624b9881f520485df2b4000191fcdb1cfa5ff929164b8b370693d248
```

`rewards.js:432` now retains amount, previous/next sequence, Printing identity and continuation before the fallible baseline flush. The caller has already consumed sale words/budget and recorded written/lump/sold effects, or incremented the royalty/division lifetime total. A baseline rejection therefore leaves a recoverable volatile payment. `retry()` runs `reconcile()` before `rewardContinue()`, and `reconcile()` handles this credit before pending claims. It pays or recognizes payment, commits the current-run delta and phase, then resumes the phase. It does not re-enter the counter-producing phase first.

Sampling the sequence before the baseline flush is valid for the actual adapter. Core's `flushAcknowledged` cancels its pending save and synchronously writes its current score with Economy's existing marker. It does not advance that marker or publish a watcher. The browser lock and transaction/progression guards exclude a cooperating second writer and synchronous ordinary mutation. A failed flush leaves the same candidate; a successful flush does not invalidate its preceding sequence. Subsequent payments sample the newly acknowledged marker. The fresh successive roy/div tests reach sequence2, including repeated faults at baseline, prepared Ops, wallet and final Ops.

Re-flushing an existing credit also preserves a paid wallet. The baseline contains the current score and marker. `Economy.creditReward` recognizes matching id/sequence/amount as a duplicate and returns without another credit or watcher. Final Ops adds the missing amount to the current run. A failed final Ops commit never publishes its candidate run or cleared credit. `rewardCommit` retains the live checkpoint/report/sold references when acknowledging, so the enclosing loop sees the changed phase without replacing its local cursor with stale data. The recovery-baseline test changes current division ownership and adds9,000 run income, rejects the repeated baseline, then finishes with locked wallet189,000, divTotal189,000 and run198,000.

Reviewed `normalize`, `persist`, `guard`, `deliver`, `reconcile`, `retry`, `checkpointPayment`, Core's ordinary/acknowledged saves and watcher publication, Economy's marker logic, Ops save routes/rewardCommit/rewardContinue, `writeTitle`, `autoSellAway`, every affected away phase and startup/pagehide/visibility paths. Contradictory markers still hold; unknown metadata survives; progression/reset/ordinary saves cannot run through a pending transaction. Phase completion is acknowledged before deletion. The repair does not change timed budgets, keeper traversal, gold consumption, awards, prices, production formulas or the default branch.

## Independent failure, reload and oracle evidence

[red-control-summary.json](evidence/LG-01/qa-b-r2/red-control-summary.json) records12 independent actual-module cases. The helper intercepts only the sealed pre-repair Rewards response for the red group; all other modules match the current/frozen repair inputs. Served hashes identify old Rewards `62eccd9...` and current Rewards `a985e114...`. A baseline fault leaves the old sale wallet250 despite consumed words, while royalty25 becomes75 and division189,000 becomes567,000 after two rejections. Current fault/control pairs agree on wallet/run/lifetime values. This supplements the retained historical red-exact provenance without reconstructing its execution chronology.

The new native probe requires an existing `cp.credit` and a wallet write whose marker has not reached that credit's sequence. It asserts the rejection, rather than reusing r1's now-ineffective `!cp.credit` predicate. Both editions finish as follows, including saved-key reload and paired no-fault control:

| Payment | Starting wallet | Final wallet | Run delta | Lifetime income |
| --- | ---: | ---: | ---: | ---: |
| Assistant sale |250|3,650|3,400|lump3,400; title written once, bank consumed|
| Royalty |250|275|25|royTotal25|
| Division |250|189,250|189,000|divTotal189,000|

Each settled fault sequence has nine retained raw writes: acknowledged early checkpoint, two rejected baselines, successful baseline, prepared Ops, paid wallet, final Ops, complete checkpoint, deletion. The first stopped in-memory state has the credit/effects, but its actual saved Ops record is `early` without that credit or those effects. Fresh load uses these exact keys and recomputes only unacknowledged work. It is not recovery of a durable descriptor that never saved. Ordinary T3 setup navigates fully to a blank task page before planting keys, then loads a fresh game; no synthetic pagehide was used for this review's planting or lifecycle proof.

Evidence is `qa-b-r2/native-{pixel,classic}-{sale,roy,div}-*`, with the separate `native-settled-pixel-div-*` exact observation. Pixel sale's first focused retry is `retry1`; its successful retry is `final`. Native identities include served hashes and actual loaded functions. The8162 `qa=startup-hold` shell injection is disclosed; game JS is unchanged. Actual Core remains distinct from the headless fixture's simulated UI bridge using the real shared Economy adapter.

The final evidence audit also checks the worker's six corrected native matrices and both live Deadline results against their raw writes. The original Printing0 planting captures are excluded from intended-fixture acceptance. Worker synthetic pagehide remains setup history only.

Corrected regression oracles are justified by raw keys:

- Initial request rejection leaves no saved checkpoint. The test first compares the fresh load with the pre-request scalar state. It then explicitly issues a NEW absence request and compares with a separately fresh-loaded control receiving that same new request. It does not assert preservation of the rejected request's sampling state.
- Deletion injection reads the last acknowledged Ops record, requires its phase to be `complete`, and rejects the candidate without a checkpoint. It reaches that boundary even though the in-memory property is already removed. Reload completes deletion without another payment.
- Successive timed/bulk sales, prepared/wallet/final boundaries and later-head income remain separate reached-fault cases. The regression's scalar comparison is supplemented by explicit expected native values, raw wallet markers/current-run records and independent frozen/current controls.

## Actual lifecycle, media and images

[lifecycle.json](evidence/LG-01/qa-b-r2/lifecycle.json) has six fresh media checks, four hidden cases and four bfcache cases, with no failures or page errors. Chrome155.0.8059.39 used a temporary task profile and its recorded default Puppeteer launch flags. No bfcache workaround flags, owner profile or system preference changes. [hidden-timed.json](evidence/LG-01/qa-b-r2/hidden-timed.json) adds measured wall-clock timestamps and actual visibility events for interrupted away payments in both editions.

For hidden cases, a durable paid-but-uncommitted cash claim or away credit remained paused while the page was genuinely hidden. A same-context other-edition contender had no IMI, no ownership and no wallet/Ops writes. Ownership stayed with the hidden page. Returning it to the foreground and clicking Retry completed one missing delta. The timestamped hidden intervals were32,010ms Pixel and32,012ms Classic. The earlier four hidden cases each used the32-second wait but lacked timestamp fields; the additional measured receipts make that distinction explicit.

For bfcache, each original document reported `pageshow.persisted=true` on its original timeOrigin with ownership false. Product reload created a new document, reacquired ownership and loaded intervening metadata/run9,000. Cash ended run15,250 and away ended run12,400, without another wallet credit. [stale-restore.json](evidence/LG-01/qa-b-r2/stale-restore.json) separately proves a cacheable blank control and both old game documents' spend/save/Retry refusal with byte-identical before/after keys. Its timer marker was absent at observation; the short observation alone is not a timed proof that a future callback could never fire. Source cancellation and owner guards provide the corresponding static boundary.

The owned8166 server changes only response caching. Both ports' eleven checked source/shell/bridge files match disk bytes. No synthetic event or fresh `back_forward` navigation was accepted as bfcache proof. The server command/root/PID and source/cache headers are recorded. Owned PID27836 was revalidated and stopped; existing8162/PID68788 was preserved. All three isolated browser helper profiles were verified under their temporary prefixes and removed. The T3 task tab was closed.

Personally opened six settled `repair-b-r2/ui-final-*-normal` images, six `ui-*-status` images and twelve `media/*` images, covering Pixel/Classic at1280x800,390x700,360x560. The final audit lists all24 paths/hashes and relevant geometry. Documents equal viewports. Status Retry is focused and104x44 CSS pixels; actual T3 focused clicks recover in both editions. The known Pixel360 information wrapping remains; no equal Floor scrollHeight assertion or physical-phone claim. Source CSS/Ops rendering is unchanged. Fresh pre-load reduce/High and reduce/Low checks report actual matchMedia/Core/IMI agreement and no pane animation; no-preference/High controls animate with `o-enterx`. This verifies the touched status/pane behavior, not every historical game animation. Parent must still open the required images before accepting.

## Commands, retained artifacts and handoff

Core shell environment, explicitly set for each test/balance/browser execution:

```powershell
$env:PUPPETEER_MODULE='C:/Users/arran/AppData/Local/Temp/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'
$env:GUARD='240'
$env:LG01_RUN='qa-b-r2-20261012'
$env:REPAIR_PHASE='qa-r2'
node --test --test-concurrency=1 tests/economy.test.cjs tests/rewards-startup.test.cjs tests/rewards-transactions.test.cjs tests/rewards-offline.test.cjs tests/rewards-away-baseline.test.cjs
node tools/balance.mjs 60 active collect 1 30 --url http://127.0.0.1:8162/tools/balance.html --output docs/plan/long-game/evidence/LG-01/qa-b-r2/disabled-fresh.raw.json
node tools/long-game/lg01-a-canonical.mjs docs/plan/long-game/evidence/LG-01/qa-b-r2/disabled-fresh.raw.json docs/plan/long-game/evidence/LG-01/qa-b-r2/disabled-fresh.canonical.json docs/plan/long-game/evidence/LG-01/repair-b-r2/before/disabled.canonical.json
```

Repeat suite uses the same command with `--require ./docs/plan/long-game/evidence/LG-01/qa-b-r2/rerun-paths.cjs` before `--test`. That new evidence helper changes only Node output filenames: `qa-r2-*` becomes `qa-r2-rerun-*` within the expressly leased repair output prefix, and fixture filenames gain `rerun-` within the same leased fixture leaf. Exclusive writes remain exclusive. It changes no browser code, timing, assertions, tests or existing helper source. First-run and repeat logs/exit files remain separate and decode correctly as PowerShell UTF-16 where applicable.

Other commands: `python <qa>/audit.py`; `node <qa>/red-control.mjs`; `node <qa>/lifecycle.cjs`; `node <qa>/stale-restore.cjs`; `node <qa>/hidden-timed.cjs`; `python <qa>/final-audit.py`, where `<qa>` is `docs/plan/long-game/evidence/LG-01/qa-b-r2`. Native helpers are evaluated through T3, with the retained `native-t3-sequence.js`, `native-probe.js` and synchronous settled variant. `server.json` and `cleanup.json` preserve process identity. Canonical comparison excludes only capturedAt/sourceCommit/sourceHashes/url/wallSeconds; no gameplay, RNG, wallet or state field is removed.

R1's catalogue109DB/73 assignments, original68 awards/+1%, deterministic formulas, migration/waivers, claim guards, stored gold and bounded enabled evidence remain applicable within the unchanged source and rerun suites. Its lifecycle proof stays historical; this report supplies changed-source replacements. Original LG-00 wallet-capture exception and B helper-inventory omission are preserved, not retrospectively repaired. No broad unrelated art/evidence audit is claimed.

Historical enabled second desk6.7 minutes versus13.5 disabled remains a material balance-review input, with5,906 letters/56,250 reward bananas/10DB in the bounded original enabled hour. It was not retuned or rerun as a long profile. Six-week free Regular, deferred Casual/Hardcore/Away endpoints,55% capstone and80% layers2-3 requirements remain open for LG-13. Q5/Q6/Q8/Q9/Q10, prices, legal text and paid-reset retention remain unsettled. Hardware crash durability, native RNG serialization across termination, arbitrary external rollback/deletion, mixed old/disabled writers, physical devices and deployed behavior remain unverified. Art is retired; factory escape is out of scope.

Stop with this report. Parent owns acceptance or further repair routing. The feature remains default off and C remains unreleased by this review.
