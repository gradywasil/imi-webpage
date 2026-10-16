# LG-00 zero-duration validation, round 4

Verdict: PASS for the final zero-duration fix. Overall LG-00 remains HOLD pending the three owner dispositions. This is independent GPT-6-Astra validation of the GPT-6.1-Sol manager/implementer candidate, not LG-00 acceptance or authorization to dispatch LG-01.

Workspace: `C:/Users/arran/Projects/monkeyOS-v2`, branch `long-game`. Only this new report and `evidence/LG-00/qa-zero-r4/**` were written. Source, tools, previous evidence, the original long-game README/premium spec and unrelated `.claude` work remain unchanged. No branches, dependencies, children, staging, commits or deployment were created. The authorized headless economy lane was used; no interactive browser, media emulation or long profile run occurred.

The required plan README, foundation brief, r3 results, full r3 QA, zero-fix note, execution record and manager source boundary were read. The brief's additional long-game README and premium spec were read as context. The evidence shorthand resolves under `docs/plan/long-game/`; an initial root-relative lookup failed without changing anything.

## Source boundary

Current Ops SHA-256: `6e29d9ca0f34ff8f75ba5b6eeeaae178612acec0b565cd370bcfbb40631f62e7`.

Frozen prior Ops SHA-256: `ee1fb2d6a92d67964b4e1e2f446a063aee60fb87b235d0c4c17c7f25813de425`.

PASS: `audit.json` independently compares complete file bytes against `manager-zero-fix/before-ops.js`. Replacing exactly the single old comment and selection line produces the current full file byte-for-byte. The old pair occurs once. No other Ops bytes differ. The candidate selection is `sec > 0 && multiplier !== 1 && chal('timed')` at `ops.js:1430`. Replacing only `imi-v15` with `imi-v14` in the current service worker recreates the sealed r3 service-worker hash. The other ten entries in the sealed r3 source/document identity map also match, including pickups, both balance tools, the profile runner/bot and budget helper.

For positive counted seconds, the new first predicate is true and the former predicate evaluates unchanged. For default speed 1, both versions select the ordinary path. `chal` reads challenge state; skipping it at zero introduces no mutation or RNG draw. The changed branch selection is restricted to nonpositive counted durations with a nondefault provider and Deadline. This validation covers zero and supported positive inputs, not a new contract for negative or nonfinite direct API inputs.

The task server was revalidated as listener `127.0.0.1:8148`, PID `43468`, Python with an explicit `os.chdir('C:/Users/arran/Projects/monkeyOS-v2')`. `server.json` and `listener.json` retain those receipts. The live HTTP Ops bytes match the current file. The existing external Puppeteer module and standard Chrome executable were present.

## Fresh actual-source results

The manager fixture was copied into this lease. Named inputs, fresh output paths, an absent-provider option, complete state capture and network-error collection were added. The before fixture intercepts only `/ops.js` with the entire frozen file, without source instrumentation. The current fixture loads the ordinary server source without interception. Gameplay setup and the actual `IMI.ops.simulateAway` call remain the copied fixture's implementation. `prepare.mjs` and `fixture-provenance.json` record this derivation. Both sources execute 17 named cases with and without Deadline, totaling 68 fresh-document executions. All 68 loaded Ops hashes match their intended source, with empty runtime/request/HTTP error lists.

- PASS, original red/green reproduction: at speed 2, zero seconds, one staffed desk and active keeper with 100 A/B/E and ABE target 100, frozen timed/ordinary banking is 0/2. Current banking is 2/2. Current inventory is 98 A/B/E on both paths; typed work remains zero. Wallet, crew and next RNG agree. The complete before/current difference list contains only the expected word/bank/ingredient changes, with duplicate observations in the returned report and selected state.
- PASS, zero/default compatibility: absent provider, explicit 1 and explicit 2 each cover active keeper, paused keeper and no crew, both with and without Deadline. Current active cases bank two, paused/no-crew cases bank zero. All nine current timed/ordinary selected production states and RNG agree. For each matching challenge state, complete current state, report, wallet and RNG also equal the explicit-default-one case. Frozen versus current default and ordinary results remain unchanged.
- PASS, positive-duration compatibility: 0.01, 60, 7,200 and 10,800 real seconds at speeds 1 and 2, each with/without Deadline, yield 16 before/current comparisons. Every complete serialized game state, offline report, wallet and next RNG value is structurally equal. The 7,200-second cap is respected; 10,800 is capped to 7,200. These are bounded deterministic single-call fixtures, not new long profile trajectories.
- PASS, all 34 before/current selections: 33 are unchanged and the one active speed-2 zero-Deadline selection has exactly the expected repair difference. All cases were collected before assertions were classified.

The inherited fixture prints an additional timed/ordinary difference for speed 2 at 10,800 seconds. It exists on both sources and is retained in `diagnostics.json`. The documented timed versus ordinary capped weather-sampling policies can differ. This cross-branch diagnostic is not a regression: each corresponding complete before/current result and RNG is identical. The original raw logs are retained rather than relabeled as uniformly equal.

## Fresh legacy comparison and checks

PASS: one fresh run of the existing `tools/balance.mjs` completed 60/60 minutes, active/collect, seed 1, `activeMinutes=30`, empty tuning, against port 8148 with `GUARD=360`. The 30-minute active cutoff exactly matches the frozen named original report. It completed in 27.26 host seconds, with `complete=true`, `stopped=null` and empty runtime/HTTP errors.

`audit.mjs` recomputes both complete canonical reports from raw JSON, excluding only top-level `capturedAt`, `sourceCommit`, `sourceHashes`, `url` and `wallSeconds`. It checks the frozen canonical receipt and original manifest raw identity, then compares fresh and frozen canonical bytes. Both canonical hashes are `5ef60fd274a856b386ae15ecebc5ac5b7ac3dfd37768bd08d4b060d8ee20a6a9`. All ten loaded identities across these two raw reports match the corresponding frozen/current files. No gameplay, input, completion or error field was excluded.

Fresh raw report: `evidence/LG-00/qa-zero-r4/hour-active-collect-1.raw.json`, SHA-256 `df7b2433b683af2db3c3ed0f0d8dc035727e238369ddecba5e1494228a03cbd3`.

PASS: `node --check` for Ops, pickups, service worker and both copied fixture helpers. All five `tests/economy.test.cjs` tests pass. `audit.json` records 254 checks, no failed assertions. Check counts include repeated identities and are not 254 independent gameplay scenarios.

The preparation inventory initially encountered EISDIR on a git-listed directory. It was corrected to distinguish files and directory entries before any capture ran. That diagnostic is recorded in `diagnostics.json`. The successful preservation audit compares 6,091 preexisting git-listed tracked/untracked entries, hashes for files and type markers for directory entries, with no differences. It does not claim recursive inspection of a git-listed directory entry. All historical evidence files included in that inventory retain their bytes.

## Applicability and remaining gates

The full r3 QA remains applicable within its original limits. This exact source boundary preserves all positive-duration calculations, online logic, extension lifecycle, save/reset code, native pickup logic and rendering. The fresh positive fixtures support that boundary. The full r3 27-pair conservation sweep, 20 independent positive pairs, eleven chronology cases, 22 foundation cases, native pickups in both editions at four speeds and provider/stale-callback cases, lifecycle/Core save/reload and limited Floor layout remain previously completed evidence. They were not rerun in r4.

Only one of the nineteen legacy comparisons was freshly executed here. The other eighteen remain the historical raw-derived comparisons and loaded-source audits completed in full r3 QA. Default-one branch exclusion and unchanged harness/policy support their applicability; no claim of nineteen fresh r4 runs is made.

The historical Regular endpoint remains 30,240.016666651896 calendar minutes and 1,260.0166666658495 active minutes, with 139 checkpoints on original Ops `492797b34933346467ee00e9fae59a2c14971bf40da619115a078826c6d2e155`. Its unchanged speed-one path and profile policy support the r3 applicability conclusion. R4 did not rerun or relabel that roughly 21-day endpoint or its 73-minute host trajectory. The six historical images retain their limited early zero-crew Floor coverage; this round makes no new visual claim.

The low zero-away finding is resolved for the exercised API contract. The following dispositions remain pending exactly as recorded by the manager:

- Casual, Hardcore and Away finite endpoints remain UNVERIFIED. Deferral to LG-13 requires explicit owner disposition.
- Actual reduced-motion media remains UNVERIFIED. No alternate media browser was used and no authorization or waiver is inferred.
- The historical correctly versioned pre-edit wallet capture requirement remains FAIL, despite passing functional save/load. The owner must explicitly accept that specific provenance exception or retain the failed gate.

Full-reset permanent ownership remains a downstream LG-02 contract decision. No waiver, LG-00 self-acceptance, LG-01 dispatch, art work, premium policy or pacing acceptance follows from this narrow PASS.

## Commands and new paths

Commands were run from the checkout root. Helpers use retained output paths and exclusive writes; reproduction must copy them to a fresh lease and change only output paths before rerunning.

```powershell
$env:PUPPETEER_MODULE='C:/Users/arran/AppData/Local/Temp/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'
$env:GUARD='360'
$env:BALANCE_TUNE='{}'
node docs/plan/long-game/evidence/LG-00/qa-zero-r4/prepare.mjs
node docs/plan/long-game/evidence/LG-00/qa-zero-r4/before.mjs
node docs/plan/long-game/evidence/LG-00/qa-zero-r4/current.mjs
node tools/balance.mjs 60 active collect 1 30 --url http://127.0.0.1:8148/tools/balance.html --output docs/plan/long-game/evidence/LG-00/qa-zero-r4/hour-active-collect-1.raw.json
node --check ops.js
node --check pickups.js
node --check sw.js
node --test tests/economy.test.cjs
node docs/plan/long-game/evidence/LG-00/qa-zero-r4/audit.mjs
```

Fixture, legacy, audit and economy output was retained through PowerShell `Tee-Object` in matching `.log` paths. Source/fixture syntax exit statuses are also retained in the audit. New artifacts are exclusively this report and `evidence/LG-00/qa-zero-r4/`: setup/capture/audit helpers, before/current complete receipts and logs, raw/canonical legacy receipt and log, economy log, source preservation inventory, server/listener receipts, diagnostic/provenance receipts, status records and manifest. The manifest binds the report and all retained artifacts except itself.
