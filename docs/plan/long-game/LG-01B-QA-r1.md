# LG-01B independent QA r1 — HOLD

2026-10-12. Reviewer: GPT-6-Astra, medium reasoning; independent of the Sol6.1 author. Checkout: `C:\Users\arran\Projects\monkeyOS-v2`, branch `long-game`, HEAD `8284174589cfd6ee0850434c28cbc25adc2d2710`. This is a review recommendation, not acceptance of B or LG-01. Do not start C from this report.

**HOLD.** Two material defects remain in the enabled away-payment failure path. A failed wallet baseline save occurs after the caller has consumed a sale or incremented lifetime income, but before a recoverable payment exists. Same-process Retry can permanently omit the sale payment or count income twice. The 48 existing tests pass; independent boundary probes and actual Core in T3 reproduce these defects. Review continued through all accessible assigned lanes.

## Findings

### B-R1-1 — P1: Retry can complete an away sale without paying for it

Locations: `rewards.js:432–441`, `ops.js:1146–1150`, `ops.js:1872–1885`, `ops.js:1586–1596`.

`checkpointPayment` attempts `wallet().saveAcknowledged()` before recording `cp.credit`. Its caller has already decremented `saleLeft`, removed the required bank words, set `S.written[id]`, incremented lump income and recorded the sold count/payment. If that baseline write fails, the hold contains no pending credit. Retry resumes the bulk phase with the title already sold. It subsequently acknowledges the completed checkpoint and removes it, without paying the missing sale.

Reproduction using the actual modules: enable `lg01a=1`; use the task fixture in `qa-b-r1/native-fixture.json`, mark `s1` historical, enable a tier-3 assistant, and fill the bank with the first authored recipe's exact `need`. Run `native-away.js` with `window.__qaLane='sale'`. It rejects one `imi-score` write when the current checkpoint is in `bulk` and has no credit, calls `simulateAway(3600)`, captures the hold, then calls the real `Rewards.retry()`. The helper sets a duration directly; this is not a claim of an hour spent outside the app.

Independent controls in `supplement-sale-control.json` pay **3,400** bananas and add 3,400 to run income. The identical fault case pays **0**, yet consumes the same words and marks `ape-in-the-cape` written. In actual native Core, both Pixel and Classic begin at wallet **250** and end at **250**, run income **0**, with the title written and bank empty. The stopped checkpoint already reports one sale and 3,400 payment without a `credit`; Retry returns true and removes the checkpoint. Final raw Ops/wallet records retain this unpaid sale.

Evidence: [Pixel native failure](evidence/LG-01/qa-b-r1/native-pixel-away-baseline-sale.json), [Classic native failure](evidence/LG-01/qa-b-r1/native-classic-away-baseline-sale.json), [independent control/fault summary](evidence/LG-01/qa-b-r1/supplement-summary.json), [reproduction helper](evidence/LG-01/qa-b-r1/native-away.js). The full simulated write streams are retained in the paired `supplement-sale-*` files. This is a payment-loss defect in the explicitly promised recovery seam, not a balance-policy disagreement.

### B-R1-2 — P2: Retry double-counts royalty/division lifetime totals

Locations: `ops.js:1576`, `ops.js:1581`, `rewards.js:437–440`.

The royalty and division phases increment `S.royTotal` or `S.divTotal` before the same fallible baseline save. A rejected baseline leaves the phase unchanged and no pending credit. Retry re-enters that phase and increments the total again, while paying the wallet only once.

Use `native-away.js` with `__qaLane='div'`, a single song division and a 3,600-second simulated absence. Native Classic starts with wallet250; the stopped total is189,000; Retry produces wallet189,250 and run189,000, but **divTotal378,000**. Independent module controls show royalty25 becoming50 and division189,000 becoming378,000 under the fault, despite unchanged single wallet/run payments. These permanent totals feed progression/award predicates, so this is more than a cosmetic report discrepancy.

Evidence: [native division result](evidence/LG-01/qa-b-r1/native-classic-away-baseline-div.json), eight individual `qa-b-r1/native-div-write-0.json` through `-7.json`, and paired `supplement-roy-*` / `supplement-div-*` control/fault records. Each probe asserts the intended write was actually rejected. The initial deletion probe did not reach its intended boundary and is not counted as a passing failure test.

Both findings require the enclosing operation and its payment/counters to remain recoverable across **every** fallible boundary, including the baseline flush. Preserve the locked amount and next phase before the caller can lose them, and apply sale/counter effects once. A repair must demonstrate same-process Retry and reload controls for this previously uncovered boundary. No repair was made during this review.

## Lane verdicts

| Assigned lane | Verdict | Evidence and practical scope |
| --- | --- | --- |
| Current source, frozen delta, registration and default-off behavior | PASS | Twelve current receipt identities match; six runtime changes only among the 23 scoped frozen files; all 22 inventoried frozen hashes match. See provenance boundary below. |
| Syntax and existing automated tests | PASS | Eleven JS/CJS/MJS syntax checks, both nonempty inline balance scripts parsed, independently rerun48/48 tests. This does not cover the newly found baseline boundary. |
| Complete disabled seed-1 hour parity | PASS | Fresh complete60 minutes, no game/HTTP errors, exact raw-derived canonical equality with B's before run using only the five approved exclusions. |
| Catalogue, formula tiers, migration and stable identities | PASS |68 original awards;73 assignments;76 award DB plus33 first-clear DB =109. Source and actual-module tests reviewed. |
| Representative L/C/D/G claims, cash markers, run deltas and watchers | PASS | Actual-module failure/reload evidence plus fresh T3 native Pixel/Classic cash cases; final receipt and watcher behavior verified. |
| Conserved away processing and recovery | **FAIL** | B-R1-1 and B-R1-2. Other paid-checkpoint, timed-prefix and deletion-boundary checks pass within their measured scope. |
| Exact stored gold | PASS | Actual-module online/away speed0.5/1/1.25/2 tests, fractional remainder, overlapping timers, cap/efficiency and Printing checks pass. Worker native away captures audited separately. |
| Current actual hidden-tab behavior | PASS | Both editions actually hidden32 seconds with durable pending cash, retained ownership, nonwriting contender, visible recovery and one missing run delta. |
| Current browser-native bfcache | PASS | Both editions have actual `pageshow.persisted=true`; old document loses ownership and fresh document reacquires current saves and reconciles pending cash. Separate control/stale-write probe passes. |
| Current visuals and actual reduced motion | PASS | Personally opened24 source-bound images; all six geometries, normal/status; fresh pre-load media/control checks in both editions; actual focused Retry exercised. |
| Enabled first-hour observation | PASS, bounded | Raw claim sums reproduced; desk2 at6.7 versus13.5 disabled is material and must enter balance review. No final pacing acceptance. |
| Hardware crash, arbitrary rollback/deletion, physical phones, paid ownership and six-week pacing | UNVERIFIED | Not established by these fixtures, browser captures or this lease. LG-13 deferred endpoints and acceptance rules remain intact. |

## Source and preservation audit

I read the plan README, long-game README, premium-currency and execution documents, approved reward design, original LG-01 and B briefs, A acceptance, A QA r1/r2 and repair r2/r3, B HANDOFF, before seal/call paths/frozen sources, current final-working-tree receipt, relevant raw reports/captures, tests and helper sources. The A shape-loss and callback-escape repairs were treated as prerequisites to recheck, not B acceptance. The scoped diff is against B's sealed working tree, not HEAD.

Current runtime SHA-256 values, unchanged at the final check:

```text
rewards.js         62eccd9ccae3bfc4f2aca31163c8c2d7b9500c1d320a7bdb21d3a42659b5328c
ops.js             88047df1acd519c96342c1253f75873d9101c6e7a71e7a7319c4e361c981752e
core.js            0ab61043f94bef1f89ed64b717721ddcbbc50439df4add1d53d1c7e18827fbe3
economy.js         7e3eaf72624b9881f520485df2b4000191fcdb1cfa5ff929164b8b370693d248
tools/balance.html 229e511471ebfac8e381357da094d3057d6f94b51806dc285f9e112ee5b027f5
sw.js              a4c485d9c43462e94b91797c392edc79564faa5c037757c9bcf7e73def07726d
```

[audit.json](evidence/LG-01/qa-b-r1/audit.json) includes all12 final identities, scoped frozen hashes, served identities and syntax results. [final-audit.json](evidence/LG-01/qa-b-r1/final-audit.json) independently rechecks them and derives the worker native write matrices, geometry, pacing sums and both server receipts. Loaded native function captures in `native-{pixel,classic}-reload-identity.json` and actual response-body hashes in `lifecycle.json` bind runtime behavior to these sources. The existing8162 server's `qa=startup-hold` injects a test stop into HTML; the JS is unchanged. Cacheable8165 serves byte-identical shells and runtime without that injection.

All six runtime files have original inventory hashes and frozen copies. Seventeen other scoped frozen files match current bytes. `tools/long-game-bot.js` is one of those unchanged copies but has **no original inventory hash**. This proves present frozen/current equality, not a retrospectively sealed pre-edit identity. I did not rewrite that receipt or rehash the unrelated art/library trees. The wider6,482-file preservation count remains the implementer's receipt, not an independent broad audit here.

The complete original AWARDS block is byte-equal to the frozen source, including IDs/names/order/predicates; income's +1% award behavior is preserved. The first extraction counter mistakenly searched object `id:` syntax and returned0; the retained [correction](evidence/LG-01/qa-b-r1/award-count-correction.json) enumerates the68 actual `AW(...)` entries. Registration still precedes Ops, disabled Rewards returns without engine registration, opt-in remains `lg01a=1`, and SW remains `imi-v22`. No prices, sold automation, random reward source or unresolved product policy were added by this delta.

## Claims, formula and offline observations

Actual-module tests exercise all live assignments and historical migration, tier floors/caps, x25 cash denomination, highest-owned desk sampling, sustained income basis and deterministic balanced letters. Letter delivery does not inflate typed/manual/XP counters or consume gameplay RNG. Existing claims override backfill; historical ordinary claims are explicitly waived; DB migration is silent and bought/unknown metadata is preserved. Missing durable L/C samples and contradictory markers hold instead of resampling. Fixed D/G recovery retains origin and identity. The first sale award, award receipt, challenge first clear and first Printing remain distinct; each actual challenge's repeat/failure/abandon path was checked in the suite. Printing retains continuing receipts/tokens and retrieves current state through the extension API. Full reset follows the existing empty-timeline policy; this does not settle paid-reset retention.

Independent `reload-boundaries.mjs` adds durable rejected-commit reloads: l100 yields exactly50 balanced letters (A–X twice, Y/Z once), s8 yields2 earned DB, g1 yields one stored token. These use actual Ops/Rewards/shared Economy with a **simulated balance bridge**, not native Core. The48-test suite's formula checks sometimes obtain a basis from the same API under test; I therefore also traced source against the approved design and used separate boundary/control oracles rather than treating green assertions as comprehensive proof.

Native Core cash probes in T3 cover prepared/wallet/committed boundaries in Pixel and wallet/committed in Classic, supplemented by the audited six-case worker matrix. A current-run reload test in each edition installs run9000 with a durable paid claim; startup produces15250 without another wallet credit, retaining new metadata. Synchronous watchers attempt Print/spend while the claim is unsettled and are blocked; the enclosing award stops. Same-process Retry retains unrelated in-memory run progress. Native Classic's actual focused Retry button also resolves the hold. The worker matrix's raw writes show one intended rejection per case,6250 fixed reward and one committed receipt; it is supporting evidence, not substituted for these fresh probes.

Away source and tests cover sampled absence/cap/efficiency/speed/return epoch, inventories and timed budgets, stage/index and keeper traversal, paid wallet head, delayed `lastSeen`, report totals and missing-budget holds. The captured Deadline prefix is compared with a frozen-before control using the same work RNG; UI rebuild draws are kept separate. A new deletion-boundary probe rejects the first Ops write removing an already acknowledged `complete` checkpoint. Reload keeps wallet3175 and completes without paying twice. This corrects the initial supplement deletion attempt that reported `rejected:false`.

Stored gold uses15,000 game milliseconds, not integer seconds. Independent rerun covers0.5/1/1.25/2 speed online and away, expiry inside a frame/batch, fractional remainder, efficiency affecting payout only, capped-out time, native/stored max7 rather than49, Critic half and separate native timers. Activation rejection, Retry/reload, consumed-token preservation and Printing ending active rush pass. The worker's two actual native away reloads retain the paid1,102,500 wallet/run amount and expire the token without duplicate work; these captures are reviewed evidence distinct from the simulated suite. Captured checkpoint replay does not prove physical-crash durability or serialization of native random state.

## Actual browser and visual evidence

[lifecycle.json](evidence/LG-01/qa-b-r1/lifecycle.json) and [stale-restore.json](evidence/LG-01/qa-b-r1/stale-restore.json) record Chrome155.0.8059.39, complete launch flags, temporary profiles, events, raw saves and cleanup. Default Puppeteer flags were retained; no added/removed bfcache workaround flags or owner/system preferences. Isolated Chrome was used only for the expressly authorized media/hidden/bfcache lane; ordinary native work used T3 preview_status/open and focused operations.

For each edition, a genuine hidden page retained the lock through32 seconds with a durable paid-but-uncommitted cash claim. A contender could not initialize/write. Actual visibility returned to visible, Retry committed once, wallet remained9450 and run gained only6250. For bfcache, navigation restored the original document with `persisted=true`, then the product's reload produced a different timeOrigin, fresh ownership and current saved metadata/run9000→15250. A blank control also restored natively. In the stale capture listener, spend returnedfalse, acknowledged save returned `Not the save owner`, Retry returnedfalse, storage stayed unchanged and the cancelled timer did not execute. End-of-probe progression stops are test cleanup, not product stalls.

I personally opened all12 `implementation-b/ui-final-*.png` and all12 `implementation-b/media-final/*.png`: Pixel/Classic,1280×800/390×700/360×560, normal/status. Current geometry and source hashes support reuse. Retry is44px high, focused and accessible; fresh T3 click evidence confirms behavior. Page documents fit the viewport; transformed overflow-hidden floor art can exceed it (Pixel360 floor415×612), so equal scroll geometry is not asserted for that element. Known Pixel360 information wrapping remains outside B. CSS is unchanged and no new motion was introduced.

Fresh pre-load media emulation checks both editions with reduce+High, reduce+Low and no-preference+High controls. Actual matchMedia, Core and IMI flags agree; reduced motion/Low yields no pane animation, while the no-preference High control animates. These are real media-query checks, not merely accessibility flags. Browser-sized captures are not physical-phone evidence.

## Commands, parity and retained failures

Every execution shell for the test/balance/helper lanes explicitly used:

```powershell
$env:PUPPETEER_MODULE='C:/Users/arran/AppData/Local/Temp/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'
$env:GUARD='240'
$env:LG01_RUN='qa-b-r1-20261012'
node --test --test-concurrency=1 tests/economy.test.cjs tests/rewards-startup.test.cjs tests/rewards-transactions.test.cjs tests/rewards-offline.test.cjs
node tools/balance.mjs 60 active collect 1 30 --url http://127.0.0.1:8162/tools/balance.html --output docs/plan/long-game/evidence/LG-01/qa-b-r1/disabled-fresh.raw.json
node tools/long-game/lg01-a-canonical.mjs docs/plan/long-game/evidence/LG-01/qa-b-r1/disabled-fresh.raw.json docs/plan/long-game/evidence/LG-01/qa-b-r1/disabled-fresh.ordered-canonical.json docs/plan/long-game/evidence/LG-01/implementation-b/before/hour-active-collect-1.canonical.json
```

Independent fixture artifacts occupy only the new `implementation-b/fixture-qa-b-r1-20261012/` leaf. Logs are `qa-b-r1/tests.log` and `balance.log` (PowerShell UTF-16). The fresh raw report is complete60 minutes with seed1, active/collect,30 active minutes. Only capturedAt/sourceCommit/sourceHashes/url/wallSeconds are removed. Gameplay, RNG and wallet/state report fields remain. Canonical pretty SHA-256 is **5ef60fd274a856b386ae15ecebc5ac5b7ac3dfd37768bd08d4b060d8ee20a6a9**. Initial sorted canonical artifacts are retained as a different representation; final-audit independently repeats equality with top-level-only exclusions, and the ordered canonical helper produces the established hash. A compact or sorted hash is not mislabeled as this pretty hash.

Additional exact helper commands were `node <qa>/audit.mjs`, `node <qa>/supplement.mjs`, `node <qa>/reload-boundaries.mjs`, `node <qa>/lifecycle.cjs`, `node <qa>/stale-restore.cjs`, and `python <qa>/final-audit.py`, where `<qa>` is `docs/plan/long-game/evidence/LG-01/qa-b-r1`. Native helpers are evaluated through T3, trimmed at the call boundary, against the task saves; their source and captured results are retained.

Preserved review failures: `supplement.log` contains a wrong relative import before game execution; corrected run is `supplement-r2.log`. Initial `native-pixel-*-failed/final.json` contain T3 whitespace/undefined-watcher invocation errors; corrected `native-r2-pixel-*` captures are separate. The native division full write-array capture exceeded64KB; its failure is retained and all eight writes were captured separately. The initial deletion injection missed the boundary and the award counter used the wrong source syntax; neither is silently promoted into a pass. Original worker private-call/RNG mistakes, integer-only gold remainder failure, capture limits and receipt assumptions remain intact. The manager's first missing-PUPPETEER_MODULE setup failure has no claimed complete raw stream; manager-tests-r1 is only the corrected48-pass support run.

## Balance and handoff limits

Raw enabled first-hour claim sums independently recompute to5,906 letters,56,250 bananas and10 DB. Under unchanged policy, second desk unlocks at6.7 minutes versus13.5 disabled, and the first sale at0.9 versus1.2. Carry this acceleration into balance review; no prices or reward policy were retuned. This is one bounded profile/seed and cannot establish six-week pacing. LG-13 Casual/Hardcore/Away full endpoints,55% capstone and80% layers2–3 acceptance remain deferred. Q5/Q6/Q8/Q9/Q10, prices, legal text and paid-reset retention remain open. Art is retired; the factory-escape experiment is outside scope.

No production edits, installs, staging, commits, pushes or deployments. Only leased QA outputs and this brief's Status/Handoff were written. Existing server8162/PID68788 was revalidated and left running; task server8165/PID27740 was separately identified before cleanup. Temporary profile deletion is bounded to helper-created paths. See `qa-b-r1/cleanup.json` for final cleanup and source-identity verification. Hardware/account-level durability, arbitrary hostile storage edits and physical-device results remain unverified. **Recommendation: HOLD for the two away-baseline defects, then a bounded independent repair review; B/LG-01 remain unaccepted and C remains unauthorized.**
