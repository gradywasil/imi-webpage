from pathlib import Path
import json,hashlib
out=Path('docs/plan/long-game/evidence/LG-09/works-demo-r1')
manifest=json.loads((out/'verified-manifest.json').read_text());manifest['bodySha256']=hashlib.sha256(manifest['body'].encode()).hexdigest();manifest['orderedTokensSha256']=hashlib.sha256('\n'.join(manifest['tokens']).encode()).hexdigest();(out/'demo-manifest.json').write_text(json.dumps(manifest,indent=2))
(out/'generation-sources.md').write_text('''# Actual generation source table

| Existing source | Routing | Evidence |
| --- | --- | --- |
| Manual press and held-input call to press | Base rolled character passes generatedLetter, reserved once or original drawer | Actual controlled manual press and conservation; held-input call source checked |
| Automatic typist press | Same base output route, producing desk retained | Actual controlled auto press completion, actual offline crew generation; live timer calls source checked |
| Lucky trait extra actual press output | Its existing second roll uses generatedLetter with unchanged odds | Source qualified; no dedicated natural lucky outcome assertion |
| Golden Keys extra actual manual press output | Its existing second roll uses generatedLetter with unchanged odds | Source qualified; no dedicated buff timing assertion |
| Offline typist per-character batch c | Reserve min(c, remaining per-letter bill), credit c-reserved to original drawer | Actual speed2/eff.4 60-second and capped7200-second paths, per-letter conservation and completed-checkpoint replay |
| Streak milestone burst grants | Existing generic addLetter, ordinary | Source qualified; unchanged bonus routine |
| Coconut toy grant | Existing generic addLetter, ordinary | Actual grant left trays unchanged |
| Letter shower / other gold-effect grant | Existing generic addLetter, ordinary | Source qualified |
| Ribbon replacement | Existing takeLetter/addLetter on ordinary drawer only | Source qualified; no chance change |
| Garden, rewards, Folio letters, conversions/transfers | Existing ordinary inventory owners, no generic addLetter wrapper | Read-only source inspection; accepted owner protocols reused |
| Tray release | Acknowledged once-only move to original drawer, working exits | Actual twice-release no duplicate, unowned producing desk after Printing |

No content, pick-up, RNG reward, odds, base stats calculation, or second drawer credit was added. Actual output continues through the existing sheet/animatePress path. Reserved letters do not enter the drawer tray display.
''')
(out/'schema-handoff.md').write_text('''# Demo schema, acknowledgement, income and retention

`S.meta.worksDemo` is absent until explicit eligible introduction is acknowledged. Flag is `lg09demo=1`, dependent on existing Archive, Estate, Layers, Folio and Rewards flags. Preview uses displayed Printing4; introduction checks Estate3 and two active curated stage2 classics. Retained `unlocked:true` grants access after gate loss. All gates are free and have no minigame/mastery requirement.

Version1 fields are `content` (the full stable JSON manifest identity), `unlocked:true`, nonnegative safe `revision`, `index` in0..46, boolean `working`, and six per-desk `trays` containing safe A-Z counts. Index0..22 is the ordinary first pass;23..45 is the fresh second pass;46 is complete. The remaining fresh bill is derived from the ordered second-pass suffix, never from a separate grant counter. Unknown ledger fields survive every supported mutation. Unknown/unsafe content, version, index, count or over-bill trays refuse validation. Ordinary drawer counts are validated before material planning/release. Future rewarded Works has no namespace, counter, reward or migration here.

All explicit commands carry original action, reset epoch, exact content identity and an expected snapshot of ledger, owned drawers/trays, challenge, focus, bank, PG/Folio and Archive work selection. Ops derives the candidate itself; callers cannot supply candidate state, letters or currency. Rewards prevalidates and executes its named Works command under the actual transaction owner. Ops saves one candidate through Economy.saveStateAcknowledged before publishing it. A refused save retains old live state and the fixed volatile request. Retry reuses that request; successful revision/snapshot/epoch changes reject a copied stale request. There is no new persistent pending envelope, wallet operation or early-gate change. Reload after an unsaved request returns the last acknowledged save rather than manufacturing a benefit.

Generation routes only at the existing actual press sites and per-character offline batch output. Generation, drawer credit, tray reservation, exact prefix debit and progress share the same state object before a normal short-window or existing away checkpoint save. No per-keypress/per-frame storage write was added. Offline retains the original phase/st/rounding/cap/speed/efficiency logic. A completed actual checkpoint was replayed as a labelled fixture, with no new generation or consumption. Introduction refuses unfinished away or original pending owners, and settles Archive income through its own protocol first.

An existing distinction matters for evidence: offline report/stats.letters count rounded nominal presses n; stats.byLetter and inventory count stochastic per-letter c. In the controlled60-second fixture n=33 and actual c=45; eight consumed letters leave inventory+37. The capped fixture counted7200 of10000 real seconds at speed2/.4, n=4572 and actual c=6534;72 consumed leave+6462. This existing calculation is unchanged. Works routes c, never invents inventory from n.

Works leaves the existing focus/PG recipe and all practice/ink/ribbon odds alone. Pass1 excludes the original goal's protected ingredients before drawing lowest desk first; its next-word floor also enters shared/local upgrade spending. Every owned desk participates while working, so its keeper and Publisher pause without changing saved settings. Folio work/binding and Archive work/deposit refuse an active demo. A challenge pauses supply/progress. Pause/return resumes ordinary policies. Reserved inventories remain outside all ordinary donors.

Printing uses current demo validation before resetting, retains committed prefix/trays/unlock and clears only working. Shared Layers validation/finishRoom supplies equivalent Imprint/Estate protection and exit; these new hooks are source qualified, supported by accepted LG08 reset semantics rather than new actual Imprint/Estate runs. Fresh trays retain original desk positions even if a reset unowns that desk. Actual Printing and subsequent release from unowned desk1 passed. Released stock is ordinary and subject to future room reset losses. Repeat returns unspent stock, clears consumed prefix without refund and pauses; no main progress/reward reset.

Normal royalties/divisions and Archive productive spans continue. Works does not replace Archive cursor, fraction, sequence, wallet receipts or away phase. The actual fixture contains two mature Archive entries and settles income through introduction, commands, Printing and away. Accepted LG08C income/reset proofs are reused for unchanged lanes. Short-window online prefixes can be lost before an ordinary save. No physical cross-key atomicity, arbitrary cold fault matrix or multiple-document writer claim is made.
''')
(out/'Handoff.md').write_text('''# LG-09A candidate handoff

Candidate complete2026-10-15. Sole product writer RELEASED. Stop here for one independent different-model review. This is local/default-off skeleton evidence, not acceptance or activation.

## Product changes

New works.js holds the frozen existing Midsummer demo, separate schema, pure bounded planner, source-tagged reservation policy, fixed commands and internal UI. Narrow Ops seams route real generation and pause keepers/Publisher; retain original ingredient floors and offline boundaries; use the acknowledged save owner. Layers validates retained data and clears temporary working on shared resets. Folio/Archive enforce work conflicts. Rewards owns the fixed volatile command Retry. Both shells and balance register Works after Archive before Ops; SW cache62 includes it. Existing layers.css supplies both styles,40px controls and internal modal scrolling; no new CSS/art.

Core/Economy/Vault/early gate/Estate/content/pickups/PG/training-pool/automation are byte-identical to captured dirty-before. No children, build, dependencies, staging, commit, deployment or default activation occurred. Parent-dispatch.json was not touched.

Open a task-owned origin with `index.html?lg01a=1&lg05folio=1&lg05layers=1&lg08estate=1&lg08archive=1&lg09demo=1#play` or classic equivalent. An eligible acknowledged introduction is still required; flags/preview alone create no metadata.

## Evidence

- verified-results.json:43 actual-owner native checks PASS, no page errors. Controlled gate/hoard fixture; exact pass1 consumes150 and stalls at pass2 despite large old stock. Two actual manual/automatic letters reserve first, then148 actual controlled auto presses complete fresh pass2 with exact150 debit. Final completion is not seeded fresh inventory. Reward/claims/premium/editions unchanged by completion.
- Command save refusal preserves live state/revision/policy; Retry succeeds once; stale copied request refuses. Save/reload, pause/resume, missing-word stop, release twice, repeat, actual Printing, retained unowned-desk release, actual offline60/capped7200, completed-checkpoint replay all pass.
- pure-source-checks.json:9 compact checks PASS for gates, supported unknown data, unsafe counters/trays, repeated Ns, single A, other protected floors, challenge pause, per-letter cap, retained unlock and registrations.
- syntax.json:7 changed JS syntax exits0. before-default and frozen-default match full stable five-minute report/meta/errors; optional meta stays empty. Earlier final/stable controls are intermediate, frozen is final.
- Six verified-*-360.png images opened and inspected by implementation. Work/completion/loss modal in both editions; measured no page scroll or width overflow. Pixel pane buttons40/50px; Classic modal buttons41px. Internal scrolling exposes remaining actions. Parent should open these final images for its own review.
- demo-manifest.json, generation-sources.md and schema-handoff.md specify exact content, source eligibility, ACK, away and retained material rules.
- dirty-before.json and before/ retain exact leased input bytes. final-source.json records final product identity; task.patch/taskpatch-check.json reconstruct changes against dirty-before. line-ending-source-equivalence.json proves verified native bytes differ from packaged final bytes only in restoration of original line endings. New works.js bytes are unchanged after verified native evidence. Final default/syntax/pure checks ran against packaged bytes.

## Historical failures and corrections

No failed run was overwritten. Initial integration helper expected three identical Publisher condition strings but there were two; it stopped at its assertion and resumed from that point after correction. The first native helper called nonexistent IMI.ops.pickup as a function; the corrected fixture uses the actual coconut perk. The next assertion compared nominal offline n against actual c inventory; corrected to exact byLetter conservation without altering production. A subsequent image check found a pre-existing tour tip obscuring its click; the final controlled UI fixture marks tour tips off. Main/confirmation/final results remain historical UNVERIFIED attempts; verified-results is the final actual path. Compact VM helper initially needed a document event stub and then used the last actual Ops script registration rather than an earlier comment mention. These were fixture/package issues, not retroactive passes or an expanded old fault suite.

## Deferred limits

No natural gathering/random grind, long pacing, six-week/LG13 ratios, full-hour/all-profile simulation, full lifecycle/cold-fault/cache transition suite, physical device, native zoom, screen-reader review or full responsive matrix. Held input and Lucky/Golden actual bonus sites are source qualified rather than separately timed outcome runs. New Imprint/Estate retention hooks are source qualified; actual fresh reset proof is Printing. Dedicated full Archive income assertions reuse accepted LG08C evidence; the Works path uses the real Archive owner without re-running its broad suite. No performance benchmark for extended held input is claimed.

All owned native Chrome instances and ephemeral HTTP servers were closed by finally cleanup. Each run selected a nonprotected ephemeral port. Protected8000/8354/8356/8358/8397, user tabs/services/saves and prior reviewer Temp folder were untouched. Cleanup receipts are included. No running task server is needed for handoff.

Final seven scripts/manifests/bills/permanent benefits, playbills/signatures/anthology/win, NG+, A10/A11, mastery and new DB remain unapproved. This candidate awards none of them.
''')
p=Path('docs/plan/long-game/LG-09A-works-demo.md');raw=p.read_bytes();raw=raw.replace(b'Pending implementation. This demo cannot count as a finished long-game track or prove six-week/LG13 ratios. Do not populate unapproved final anthology content or silently turn the demo into permanent progress.',b'CANDIDATE COMPLETE 2026-10-15. Sole writer RELEASED; awaiting independent different-model review. Handoff: evidence/LG-09/works-demo-r1/Handoff.md, with exact manifest, generation source table, schema/ACK/away/retention notes, final-source/taskpatch, 43-check actual-owner result, 9 pure/source checks, seven syntax checks, matching frozen five-minute default control and six both-edition360 images. No acceptance/default activation is implied. Historical fixture failures and deferred lanes are retained in the handoff. This demo cannot count as a finished long-game track or prove six-week/LG13 ratios. Final rewarded content remains unapproved.');p.write_bytes(raw)
