# LG-00 implementation candidate

Status: candidate for manager acceptance. Independent QA has not run. No staging, commit, push, deployment, dependency installation, subagent dispatch, art replacement, reward, Vault or layer implementation occurred. The pre-existing ROADMAP.md change and other planning documents were preserved.

## Changed files

`ops.js` adds named extension callbacks, optional namespaces and production clocks. `pickups.js` changes gameplay scheduling. `tools/bot.js` and `tools/balance.html` add opt-in policies and save fixtures. `sw.js` receives the single imi-v11 to imi-v12 bump. New files are `tools/long-game.mjs`, `tools/long-game-bot.js` and focused capture, clock, native-save, UI and manifest helpers in `tools/long-game/`. `tools/balance.mjs` is unchanged. No new runtime script was needed; both editions already load Ops/pickups. Economy version remains 1, with no price or efficiency change.

## API and lifecycle

`IMI.ops.extensions` exposes `register(id, hooks)`, `state()`, `save()`, `mark()`, `morph(element, html)`, `setTab(id)` and `clock`. Always call state() when acting; a previously returned S becomes stale after Printing. Registration uses stable lowercase IDs; duplicate registration returns false without initialization or RNG consumption. A second speed provider throws.

Future scripts loaded before Ops append `[id, hooks]` to `window.__OPS_EXTENSIONS`. Ops registers them before startup awards and welcome-back calculation. This is required for a future Vault provider to affect startup offline production. Registering after Ops cannot retroactively affect that work.

Callbacks are synchronous and run in registration order. `init(reason, api)` receives load on registration, printing after replacement/wallet/crew preparation, and full-reset after fresh state creation. Printing initialization precedes the existing runtime/UI rebuild. Other named hooks receive `(event, api)`:

- award observes the flag after it is set, with id, tier and silent fields. No payout is activated.
- challenge observes existing completion/failure/abandonment after existing state/reward updates, with id, kind and first fields.
- reset distinguishes printing, gain and previousPrinting from full-reset.
- tick receives realSeconds/gameSeconds after production and before render/save checks.
- away receives counted realSeconds, gameSeconds and the complete offline report.
- afterRender receives tab/pane. It is separate from a tab's renderer.

An extension may supply one tab using the existing TABS format, optional visible(api), and render(api, pane). Use api.morph for DOM updates. Delegated markup uses `data-act="extension-id:action"`; hooks.actions[action] receives element/api. Existing built-in actions retain priority.

S.meta, S.rewards and S.prem default to empty objects. Unknown loaded fields remain intact. Second Printing retains these namespaces. Full reset creates empty namespaces before initialization. Extensions must clear their own run-specific namespace fields on printing. LG-00 defines no ledger, ownership schema or reward policy. The controlled test extension survived save/reload and Printing without duplicate registration or stale state.

## Clock ownership and limits

IMI.ops.clock exposes speed(), wallNow() and productionNow(). One optional provider defaults to 1. Online production dt scales once. Typists, held production, keepers, publisher, royalties/divisions, premiere and golden spawn scheduling consume game time. Market/weather, real session statistics, save/render cadence, royalty particles and presentation retain real time. Visible pickup progression uses game time. Existing Date garden/Deadline and performance buff timestamps keep their formats; extra game time moves their deadlines.

Offline caps count real away seconds. Existing typist, keeper, royalty, division and publisher work within the counted interval scales once. Weather samples and market history retain the real interval. Garden/buff extra time uses the counted interval; Deadline extra time uses the full away interval. Ordinary pickup time does not advance while offline/hidden. wallNow() is the documented future API for daily eligibility, Seasons and Commission expiries; those future systems are not implemented.

The original offline calculation does not run online premiere/pickup schedulers or apply runtime typing buffs to offlineDist. That policy was preserved. Online premiere scaling was measured; an offline premiere payout policy is not implemented or accepted. Long rare-garden cap behavior, changing providers during an absence, and Deadline/publisher completion around expiry require independent QA. Pickup lifetime below speed 1 is not established; the future catalogue specifies speeds at or above 1. Broad animation/sound timing and listening are not established by the stationary reduced-motion checks.

## Frozen parity and hashes

Before editing gameplay, `evidence/LG-00/before/` captured twelve 60-minute active/idle, collect/hoard scenarios with seeds 1/2/3, six 15-minute session / 480-minute true away / 30-minute return cases, an actual save/wallet value, source identities and source copies. The repeated active/collect seed-1 canonical report was byte-identical before editing. Active first-hour policy taps for the first 30 minutes.

The canonical serializer retains all deterministic inputs, report/overnight fields, completion/stop state and errors. It excludes only capturedAt, sourceCommit, sourceHashes, url and wallSeconds. No gameplay field is filtered, rounded, sorted or normalized.

All 19 selected final-source canonical reports match their frozen counterparts. The final selected receipts are in after-render-fix, except active/hoard seeds 1/3 selected from after-retry-hoard1 and after-retry-hoard3 following HTTP-load failures. Failed raw reports and earlier rounds remain retained. `evidence/LG-00/manifest.json` lists every selected raw/canonical path and SHA-256, source identity, profile endpoint and evidence-file hash.

Example, active/collect seed 1:

- Before raw `before/hour-active-collect-1.raw.json`: SHA-256 2ff6654be2b06e50ba1aa5cf323b5463c348016896f53a4270a1ac02816e2b04.
- After raw `after-render-fix/hour-active-collect-1.raw.json`: SHA-256 fadef0ef1008d6b0c55eb21bcd355f09476165dde941e538d58e969551464383.
- Both canonical files: SHA-256 5ef60fd274a856b386ae15ecebc5ac5b7ac3dfd37768bd08d4b060d8ee20a6a9.
- Ops before 2cb3089f8a7e9cf0440ce5bd6c751f22ad2c6ebeb7ff51141f98d8cf42f09545; final 33f49cb7457d58b78c8da734267c9d1fed4e0b7232fed2aa9af32b6fbe487dc9.

## Save and clock verification

All changed/new JS passes node --check; all five existing economy tests pass. foundations.json records real-function checks for online/fixed-crew offline exactly-once production, real cap accounting, world/daily stability, old Deadline format and slow/fast behavior, online/offline garden and buff deadlines, keeper work, online premiere scheduling, unknown fields, registration, replacement and reset lifecycle. Failed assertions and transport captures remain separate. Final accepted foundation/runtime/HTTP error lists are empty.

There is a strict baseline deviation. The already-running pre-edit capture process wrote the actual 35,525 wallet value as an unversioned numeric string, rather than through the current wallet writer. Its original artifact before/old-save.json was preserved. Both frozen old Ops and final Ops handle this mixed-version fixture identically, including the existing x25 wallet migration. A later replay of the frozen pre-change Ops source captured the actual versioned wallet through Economy.saveScore; its complete records are the frozen-runtime-versioned-wallet-capture case in foundations.json. That writer capture happened after editing, so the requirement for a correctly versioned pre-edit wallet artifact was not fully met.

native-save.json additionally plants those frozen versioned records into a fresh Pixel document, types a real letter, saves using Ops and Core's actual pagehide wallet persistence, then loads resulting records in a fresh Classic document. Wallets remained 35,525 at load, save and reload, with no runtime/HTTP failures. Date.now is bound to the fixture epoch to avoid inventing several years of absence. Offline chronology is tested separately. Inventory, shelf, Legacy, optional fields and economy version are retained. Startup's existing silent award scan was compared with frozen old Ops rather than excluded.

## Profiles and finite endpoint

The opt-in policy is distinct from default legacy invocation. Schedules, in minutes from cycle start, are:

- Casual: 8 minutes at 0/488 each 1,440-minute day. Actual gaps are 480/944 minutes, so an 8-hour gap never collapses the calendar day.
- Regular: 20 minutes at 0/480/960 daily.
- Hardcore: 30 minutes at 0/240/480/720/960/1200 daily.
- Away: 15 minutes at 0 each 4,320-minute cycle. The existing game has no Endless Night Lamp; this measures existing caps, not uncapped premium ownership.

Policies use the legacy collecting purchase priorities as a base. Casual/Away tap once per real second before Hold; Regular/Hardcore tap three times. All use real Hold rate after purchase. They buy the existing publisher and use a fair-price rule; enabled publisher prevents manual sales. Pitches use the real delegated commissioning action. The bot plants/harvests E, buys Legacy in crew/seed/speed/sales/golden order, and finishes Rapid touch to its real cap. Regular/Hardcore collect ordinary rewards each 50 session seconds and catch visible non-rotten golds; Casual/Away do neither. Ordinary collection uses the existing eligible/value/collect simulation API, not hit testing. Daily crates, Muses, manual word banking, optimal market timing and coaching are omitted. Hardcore is the stated policy with longer sessions, not globally optimal play. No future reward/automation policy is enabled.

The first real reset starts Haiku. Subsequent resets choose unfinished vowel/hands/timed challenges; Veteran Crew is required before hands/timed. Once challenges are done, the bot waits for enough stars to buy the remaining tree before resetting. No money, progress, ingredients or unlocks are injected. Away skips online timers and calls actual offline logic.

The finite LG-00 endpoint was defined before the final measurements: all six desks reached, all authored titles sold at least once across printings, four challenge clears, full Legacy tree, all six desks at Mk III with keeper and finite training caps, and max lamp/publisher. Repeating pitches, division purchases and XP are not a finish line. Other collections/awards and omitted policies are not claimed complete. Every component is stamped separately; first star is never called content completion.

## Final-source measurements

Final reports are profiles/*-render-fix.json and have empty runtime/HTTP errors. None reached six desks, full Legacy or the finite endpoint. Calendar/active minutes below are display-rounded; raw values are retained without normalization.

- Casual completed seven days / 112 active minutes. Desk 2: 1440.38/16.38; Bamboo keeper max: 1445.40/21.40; first Bamboo restoration: 4812.48/60.48. No first star/reset or challenge clear. Real caps observed 2/4 hours, efficiency 40/50%.
- Away completed seven days / 45 active minutes. Desk 2: 4322.22/17.22; Bamboo keeper max: 4324.70/19.70. No star/reset, challenge or restoration. Cap 2 hours at 40%.
- Regular requested seven days and stopped at a 360-second host guard at 7200.15 calendar / 300.15 active minutes. First star/reset: 2884.52/124.52. Haiku: 2894.65/134.65; vowel: 4808.25/208.25; hands: 6243.18/263.18; Deadline: 6726.53/286.53. Desk 4: 6738.85/298.85. Authored completion had not been observed at this final-source stop. Caps 2/4/8 hours, efficiency 40/50/60%. This is partial five-day evidence.
- Hardcore requested seven days and stopped at a 360-second host guard at 2430 calendar / 330 active minutes. First star/reset: 977.65/137.65. Haiku: 987.30/147.30; vowel: 1687.78/217.78; hands: 2178.47/288.47; Deadline: 2420.90/320.90. Desk 4: 2424.32/324.32. Authored completion and publisher max: 2426.63/326.63; Bamboo training max: 2429.23/329.23. Caps 2/4 hours, efficiency 40/50%. This is partial 1.6875-day evidence.

Every desk's restoration, keeper and training milestones remains in raw endpoint maps. Earlier policies/guarded rounds are separate, not combined trajectories. No run supports a one-to-two-day finite completion claim. The specific limit is expensive actual online simulation under bounded host guards; missing content endpoints and later horizons remain unmeasured.

## Browser evidence and deviations

T3 preview was used first. A cached 127.0.0.1 pickup body had the old hash; that receipt/initial captures are blocked provenance. Fresh localhost loaded current sources without deleting storage or altering service workers. A subsequent index capture followed the saved Classic preference and was retained as incorrect-edition evidence. Explicit s=pixel/s=classic plus actual-edition checks produced screens/verified.

An extension test found and corrected a render/observer collision; the observer is now afterRender. T3 then explicitly reported its desktop host unavailable with a no-retry instruction. Existing external Puppeteer used fresh temporary browser data as the allowed fallback. Final-source screenshots and successful checks are in screens/headless-final-isolated/manifest.json and its six PNGs, with separate temporary contexts for each edition. Both editions loaded/played at 1280x800, 390x700 and 360x560 without document scroll, using actual reduced-motion media and Effects: Low. Pickups were 48x48 and stationary. After claiming the real daily crate, the original pickup expired with no modal and continued eligibility: Pixel at 7817.1 real milliseconds / 15620.2 game milliseconds; Classic at 7812.4 / 15650.4. The one-second pickup scheduler samples expiry after the 14-game-second deadline. Existing Key guide controls were 40px high. The manager must open these six images before visual acceptance; these are browser-sized views, not physical devices.

The artificial delegated button's bare .o-btn class measured 36.25px in Classic. This is retained as a future UI sizing warning, not a shipped LG-00 control or a global 40px pass. A native daily crate legitimately blocked Classic pickup eligibility; the final fixture opened/collected it through real actions. Earlier fixture failures remain retained. No CSS outside the lease was changed.

Remaining review: independent QA/manager acceptance; finite endpoint/duration and longer horizons; broad presentation/listening; adversarial offline Deadline/publisher chronology; slow pickup lifetime, long garden cap semantics and any intended offline premiere policy; the correctly versioned pre-edit wallet deviation. No source hash or controlled fixture is treated as profile completion or whole-game acceptance.

## Reproduction and task-owned services

Existing Puppeteer/Chrome paths were verified; no installation occurred. server.json records root C:/Users/arran/Projects/monkeyOS-v2, PID 78676, port 8147. server-verification.json records the second unused port 8148 with backlog 128 and its PID/command. A verified task-created duplicate server was removed; no unrelated service was stopped. Initial 8147 HTTP failures remain preserved; the 8148 foundation/native-save captures completed without errors. Revalidate process identity before managing either server.

```powershell
$env:PUPPETEER_MODULE='C:/Users/arran/AppData/Local/Temp/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'
$env:BALANCE_TUNE='{}'
$env:GUARD='360'
node tools/balance.mjs 60 active collect 1 30 --url http://127.0.0.1:8148/tools/balance.html --output <new-report-path>
node tools/balance.mjs 45 active collect 1 45 --session 15 --away 480 --url http://127.0.0.1:8148/tools/balance.html --output <new-report-path>
$env:LG00_URL='http://127.0.0.1:8148'
node tools/long-game.mjs Regular 7 1 <new-profile-path>
node tools/long-game/verify.mjs
node tools/long-game/verify-native-save.mjs
node tools/long-game/verify-ui.mjs -new-suffix
node --test tests/economy.test.cjs
node tools/long-game/manifest.mjs
```

Never rerun before into its frozen folder. Legacy suffixes create separate rounds; its optional fourth argument selects a named retry. Foundation helpers write named outputs, so preserve previous results before rerunning. Prefer T3 again when its host is available.

LG-01 must settle reward/backfill decisions with the manager, register before Ops for startup events or initialize explicitly from saved awards, retrieve current S, use stable claim IDs and preserve namespaces. LG-00 grants no payout acceptance or art prerequisite. This candidate has not been accepted.
