from pathlib import Path
import json,hashlib
out=Path('docs/plan/long-game/evidence/LG-09/hall-r1')
text='''# LG-09I candidate handoff

2026-10-15. CANDIDATE READY FOR ONE DIFFERENT-MODEL FOCUSED REVIEW. Implementation writer released. Local opt-in only with `lg09hall=1&lg01a=1`. No independent acceptance, default activation, commit or deployment.

The authoritative final package is **release-seal/**, the final actual path is **release-main-*.json**, and the final phone evidence is **visual-release-*.png / visual-release-results.json**. Earlier `main-r*`, `sealed`, `candidate`, `final-main`, `final-source`, `seal/` and `final-seal/` artifacts are preserved intermediate history, not the final source reference.

## Candidate

Nine product files: new hall.js/hall.css; narrow ops.js, rewards.js and vault-save-gate.js; registrations only in index.html, classic.html and tools/balance.html; sw.js assets and cache imi-v70. No new art, renderer change, RNG call, acquisition action, odds/price change or dependency.

Train > Look book becomes Hall only when both flags are enabled. It uses the canonical Ops catalogue and static portrait function: 30 existing IDs, 16 Common, 7 Rare, 5 Epic and 2 Legendary. Talent remains separate. Saved observations and current owned-crew counts are distinct. All five Track team names, status and fixed reward appear before completion.

The first enabled writer acknowledges raw pre-ensureCrew history before publishing Hall progress. Manual Save discoveries acknowledges a frozen current seen/owned-crew union with the accompanying room. Claim acknowledges one fixed receipt and stored token together. No token or claim publishes after a failed save. The public Hall action accepts only save/claim and takes no caller evidence or token; initialization obtains raw history privately. Ops accepts Hall commits only during the Rewards writer transaction and against the exact captured full-state source.

See schema-token-recovery.md for fields, source invariants and failure behavior. Hall action snapshots update lastSeen for ordinary live saves, while initialization and away checkpoints retain their original offline boundary.

## Evidence and exact source

- release-seal/final-source.json and release-seal/final-source/** bind all nine product files by raw SHA-256, byte count and individual line-ending counts.
- release-seal/task.patch applies to dirty-before/** in a temporary reconstruction with core.autocrlf=false. Check and apply succeeded; all nine reconstructed files equal current raw bytes. No HEAD-based patch claim.
- release-main-results.json and visual-release-results.json match every final product hash exactly. No main-source qualification is needed for the final package.
- release-seal/syntax.json: all five changed JavaScript files exit 0.
- before-default.json and release-default.json: fresh five-minute seed-1 active/collect Bot report, meta and errors are deeply equal. Meta remains empty. This is a five-minute control, not full-hour or pacing equivalence.
- release-seal/unchanged-owners.json: all 20 captured read-only owner files unchanged, including Core/Economy, both renderers, Layers/Estate/Archive, Automation/A11, board, PG/training, Folio/Works/MG/OpsCSS and sampled content. All edits were confined to the lease and new task helpers/evidence/task Status/Handoff.
- release-seal/registrations.json: both shells and balance have exactly one Hall JS/CSS registration; SW includes the assets and cache imi-v70. Browser tests bypassed SW; transition behavior is deferred.

## Actual main path

release-main-raw-history-fixture.json explicitly labels historical v01..v04 and an explicit saved v01 owned crew member. Unknown looks and nonstandard values are retained in the raw source. Wallet funding, intro eligibility and one pending Printing star were seeded before acquisition. No Hall progress, claim token, final look, odds or RNG was injected.

The final run used **17 calls to the existing rerollTypist owner**, paying its ordinary price each time, until the actual random final missing v05 appeared. This drives the real acquisition function through the existing dev hook; it does not retest the animated acquisition overlay. Progress remained historical 4/5 until an actual Save discoveries control click. Discovery and eligibility survived reload.

One deliberate atomic Claim storage failure left no live or stored Hall receipt/token. release-main-held-claim.json preserves that exact raw predecessor. The actual existing Retry button committed the frozen receipt plus exactly one token. Duplicate Claim/Retry did not grant again. Awards and premium ledger were unchanged by this Hall Claim.

The actual existing Rewards activation owner accepted the Hall token with a 15000ms budget. The controlled tick advanced 15.25 game seconds to pass expiry. Consumed status and activationId remained valid after reload, and duplicate Claim/activation did not renew or regrant. Existing x7/nonstacking/native/offline income arithmetic is source-qualified from accepted LG-01 foundations; this check does not claim a fresh income-factor matrix.

An actual legacy ordinary Printing changed printing 0 to 1, retained Hall/consumed token/old.looks byte-equivalent, and survived reload. Ordinary Printing awards and first-clear DB are separate existing rewards. Typed Printing, challenge-entry, Imprint and Estate retention are source-qualified through the existing copy/projection and writer guards, not freshly exercised.

Browser cold checks for neither flag, only Hall and only Rewards held the acknowledged save before boot and preserved exact raw bytes. final-cold-envelope.json separately checks unsupported namespace/backfill/claim-rule/token-status envelopes in a VM. Full missing/orphan/inconsistent claim/token rejection and stored/consumed recognition are checked by final-source-pure-validation.json and the Rewards normalize/reconcile call sites. Unsupported consistency never triggers recredit.

## Phone evidence

visual-release-results.json records active Hall at 360x560 in Pixel and Classic, Low and native reduced motion. Both have 30 cells, enabled final Claim, 40px Hall buttons and no document width/height overflow. The top, set, Claim and catalogue captures are separate scroll positions inside the existing Train pane. Existing sticky sub-tabs intentionally cover content that has scrolled behind them. Final images were opened for inspection; the existing o-btn style fixes the initial light-button contrast defect.

Primary captures: visual-release-index-claim-360.png, visual-release-classic-claim-360.png, visual-release-index-catalogue-360.png and visual-release-classic-catalogue-360.png. Top and set images accompany them. The Pixel title/copy occupies more vertical space than Classic; internal scrolling is expected.

## Preserved failures and limits

main-r1-results.json records a fixture calling an acknowledged wallet method that does not exist with Rewards off. main-r2-results.json records wrong fixture sub-tab sequencing under the controlled clock. main-r3-results.json records a Node-side reference to browser-global Hall. All failures remain; later outputs have unique names. package-r1-failure.txt records Windows cp1252 reading during packaging; UTF-8 reads fixed the checker. Earlier visual captures retain the light-button defect. None is relabelled as a pass.

Source hardening after the earlier successful path made init private, required active transaction ownership, covered Hall initialization after older reward recovery, used the ordinary live-save lastSeen boundary, and preserved each existing seam's local line endings. The final release main/visual/control/raw package were captured after those changes.

No natural collection timing, free/premium pacing, broad acquisition/reset/fault campaign, physical device, native zoom, screen reader, audio or SW lifecycle acceptance. Startup/discovery save failures and process loss of volatile snapshots are source-qualified/deferred; only the Claim failure was injected in the main path. Historical local observations are not purchase provenance or anti-cheat proof, and already lost history cannot be recovered.

All task-owned native browsers and ephemeral HTTP servers closed through their retained object handles, as recorded in release-main-cleanup.json, visual-release-cleanup.json and release-control-cleanup.json. No process-wide kill or user-resource cleanup occurred. The task-created blank T3 preview tab was also closed; protected ports and prior profiles/artstderr were not operated on. parent-dispatch.json was not edited. No child agent, stage, commit, push, deploy or default activation.

Writer is released. Stop here for the parent's independent review and separate acceptance decision.
'''
with (out/'Handoff.md').open('x',encoding='utf8',newline='\n') as f:f.write(text)
schema='''# LG-09I schema, fixed token and recovery

`meta.hall` is optional. Feature-off absence remains absent. Supported version 1 / backfillPolicy 1 contains `historical`, `discovered` and `claims` maps. Unknown fields and unknown map keys remain preserved without counting.

Only canonical v01..v30 with exact bit 1 or true count. The raw historical capture also counts recognized explicit look IDs in persisted owned desks' crew, before ensureCrew repair/newTypist. It excludes prev looks, renderer fallback, nonstandard bits and unowned desks. Current live observation uses the same recognized bits plus actual current owned crew. After init, later saved seen bits are not automatically historical or acknowledged discovered evidence.

The sole recognized set ID is `hall:athletic-five:first`, independent of catalogue version, reset epoch, time or acquisition roll. Eligibility is the acknowledged historical/discovered union containing v01/v02/v03/v04/v05. Quantity, duplicate crew, talent, shiny and hats do not multiply it.

The committed receipt at `meta.hall.claims["hall:athletic-five:first"]` has:

```json
{"version":1,"rule":1,"id":"hall:athletic-five:first","status":"committed","reward":"RoyaltyRush","members":["v01","v02","v03","v04","v05"]}
```

The same acknowledged full-state save contains `rewards.storedGold.tokens["hall:athletic-five:first"]`:

```json
{"status":"stored","origin":"hall:athletic-five:first"}
```

Activation uses the existing Rewards engine, updating that entry to:

```json
{"status":"consumed","origin":"hall:athletic-five:first","activationId":"hall:athletic-five:first"}
```

`activeGold` uses its existing activationId/remainingGameMs fields and a 15000ms initial budget. Expiry may clear activeGold; the consumed source stays valid permanently. Ordinary progression resets may clear the active effect under existing rules but retain the consumed source and committed Hall receipt. No Hall entry is fabricated in ordinary award claims, no award assignment is relaxed and no wallet action occurs.

`Hall.goldSource` is the single fixed Hall predicate. Rewards' shared goldSource wrapper uses it for normalize/coupling checks, active source checks, reconciliation, inventory/count, activation and activation Retry. It requires supported Hall rule/evidence/receipt plus the exact token origin and either stored-without-activationId or consumed-with-matching-activationId. Missing receipt, missing token, orphan token, wrong source, wrong members, unsupported rule or inconsistent consumed ID holds rather than recredits. Unknown unrelated fields survive.

Private Hall initialization, Save discoveries and Claim freeze a detached full-state candidate with an exact JSON source signature. Init uses only the captured raw history and grants nothing. Save discoveries freezes recognized live observations; Claim derives the fixed supported rule itself. Ops checks current ownership, an active Rewards transaction, no local boundary disposition and unchanged full state before acknowledging and publishing Hall/rewards together. Save/Claim use the ordinary live lastSeen boundary, except during an away checkpoint. Init retains the old offline boundary.

On storage failure, the writer holds progression and retains the same in-memory candidate/source. Normal saves and resets cannot overtake it. Actual Retry revalidates that candidate and unchanged source, without resampling history, observations or reward. Changed source holds before mutation. A process exit can lose a volatile failed operation; reload returns the last acknowledged state. Claim may then be requested anew if still unclaimed and eligible; an acknowledged receipt never reopens. No durable arbitrary transaction journal is added.

Present Hall or the fixed token is recognized before Core/default/away boot. Supported envelopes require both lg09hall=1 and lg01a=1; missing flags offer Resume with those exact flags. Unsupported version/backfill/claim rule/token status offers held recovery with raw preservation. Early recognition is only an envelope check; current Hall/Rewards validates complete claim/token consistency before progression. Full Settings reset retains the existing local timeline/wipe policy, not paid restoration.

Retention source map: legacy doPrint copies old.looks only while Hall is enabled, before ensureCrew. Existing meta/rewards retention carries Hall and token through legacy Printing/challenge entry. Layers.projectRoom clones the source and overwrites only room fields, retaining looks/meta/rewards for typed Printing/Imprint/Estate. Their current writers/guards remain unchanged. Only actual legacy Printing was exercised here.
'''
with (out/'schema-token-recovery.md').open('x',encoding='utf8',newline='\n') as f:f.write(schema)
with (out/'resource-cleanup.json').open('x',encoding='utf8') as f:json.dump({'nativeBrowserCleanup':'retained task-owned browser.close handles','serverCleanup':'retained task-owned server.close handles','main':'release-main-cleanup.json','visual':'visual-release-cleanup.json','default':'release-control-cleanup.json','t3PreviewTabClosed':'tab_8_5b17d656-e753-4dcf-add7-171817aafb8b','protectedPortsTouched':False,'userProfilesOrProcessesKilled':False,'writerReleased':True},f,indent=2)
p=Path('docs/plan/long-game/LG-09I-hall.md');b=p.read_bytes();old=b'READY FOR AUTHORIZED IMPLEMENTATION 2026-10-15. Existing-look Hall/one Track team token only; no art/default activation/deployment/pacing acceptance.';new=b'CANDIDATE READY FOR INDEPENDENT REVIEW 2026-10-15. Implementation writer released. Existing-look Hall/one Track team token only; no art/default activation/deployment/pacing acceptance. Final evidence: evidence/LG-09/hall-r1/Handoff.md and release-seal/.';assert b.count(old)==1
with (out/'dirty-before/LG-09I-hall.md').open('xb') as f:f.write(b)
b=b.replace(old,new);b+=b'\r\nImplementation handoff 2026-10-15: nine product files; raw dirty-before reconstruction exact, five changedJS syntax exits0, final source-matched actual acquisition/Save/Claim failure/Retry/activation/consumed reload/duplicate/legacy Printing, default five-minute equality and both360 images. Source/schema/recovery/limits in evidence/LG-09/hall-r1/Handoff.md. Sole writer released for one different-model focused review; no acceptance/defaultactivation/commit/deploy.\r\n';p.write_bytes(b)
manifest=json.loads((out/'release-seal/final-source.json').read_text(encoding='utf8'));assert all(hashlib.sha256(Path(f).read_bytes()).hexdigest()==r['sha256'] for f,r in manifest.items())
print('Handoff/schema/task status written. Final product hashes still match release seal. Writer released.')
