# LG-02B1 independent repaired-validator QA r2

Recommendation: **TECHNICALLY ACCEPTABLE FOR PARENT REVIEW WITH HISTORICAL HOLD.** The three validator repairs pass independent source review, fresh tests and focused T3 native controls. This is not B1 acceptance, an exception for historical output ownership, or a coordinator lease. Parent image review and owner disposition remain outstanding.

Completed 2026-10-13 by GPT-6-Astra, medium reasoning, independently of the Sol6 repair author, on `long-game`, HEAD `8284174589cfd6ee0850434c28cbc25adc2d2710`. No production/test/helper/history repair, child, installation, commit, deployment, purchase, grant, effect or admission occurred.

## Ordered findings and repair disposition

1. **B1-R1-04 — historical output ownership remains FAIL / HOLD; exact prior path identities remain UNVERIFIED.** Original B1 wrote and moved 212 outputs outside its lease: 69 initial fixture, 37 initial away, 69 current fixture and 37 current away. The actual move commands, rejected time guard, corrected guard, collisions and moved artifacts remain unchanged. Exclusive-create writers and EEXIST failures constrain overwrite risk; bounded preserved identities do not prove every moved path's prior ownership. No missing pre-run inventory was reconstructed. The [parent deviation record](LG-02B1-evidence-deviation.md) remains unresolved. A validator fix or clean run cannot repair this historical fact. No product-code repair is proposed for it.

2. **B1-R1-01 — RESOLVED, with the two original numeric-domain qualifications kept distinct.** [vault.js:8](../../../vault.js#L8) accepts finite signed numeric milliseconds within inclusive ±8.64e15. Lines 73–76 validate appropriate history fields without imposing created-to-terminal wall ordering. Backward active/refund history now passes. Fresh controls exercise all three timestamp fields at both boundaries, adjacent in-domain values, signed/fractional values, NaN, infinities, strings and out-of-domain values. Amounts, sequences and Printing remain safe nonnegative integers. Negative/fractional history acceptance implements the parent's structural clarification; those two QA1 differences are not rewritten as former proven defects. This validates metadata, not elapsed Undo time or historical chronology.

3. **B1-R1-02 — RESOLVED.** Lines 83 and 86 require an unresolved reservation to be the latest acknowledged receipt and a lower tier prerequisite to be active. Pending lower → active higher, pending → another-family active, and pending → later refunded purchase are rejected. Active lower → pending higher remains valid. A refunded prerequisite alone cannot support the next tier; refund → repurchase → next tier is valid. Highest-effective-active selection remains a defensible documented encoding: lower tier ownership/history/active receipt status survives, while the map selects the effective stage. Malicious lower-only map references, unknown keys and inconsistent status fail. No tiers are multiplied.

4. **B1-R1-03 — RESOLVED.** Lines 80–83 require retained sequences 1..N and nextSequence=N+1. Empty history requires 1. Missing first/gapped/erased refunded history, skips, collisions and overflow are rejected. Reverse object insertion order passes because sequence, not map order, controls history. This is structural completeness of the supplied record; it cannot detect coordinated deletion and renumbering of an untrusted save without external trusted history.

5. **Evidence qualification Q2-E1 — original pre-edit “real Core wallet capture” is not established.** The actual original and repair capture helpers navigate `tools/balance.html`, run Bot, save Ops and call Economy.saveScore on the balance page's explicitly simulated IMI wallet bridge. That page does not load Core. The retained wallet/Ops records are correctly versioned, source-bound and captured before production edits; the original capture command completes at 08:17:42.731Z before the first Vault edit at 08:18:41.266Z. This supports real Ops/Economy capture, not literal native Core pre-edit capture. Later original/QA1/current native Core loading and acknowledged saves pass, but cannot retroactively supply that temporal requirement. No earlier wallet-capture exception is adopted. The original deliverable's exact Core clause remains UNVERIFIED from available evidence, and the demonstrated capture method does not satisfy it.

6. **Evidence qualification Q2-E2 — the repair HANDOFF names an unavailable inventory.** `repair-runtime-b1-r2/historical-risk-inventory.json` is absent. Durable repair tool position 53 shows the attempted command: the fixture count array was emitted separately; only a filtered away-file array was piped to Set-Content. Its retained output is empty. That is not a retained exact before/after identity inventory. No file was manufactured. The actual route audit below supports the exercised repair writes independently; it does not promote this missing inventory to a pass or repair B1-R1-04.

No further product-code repair is requested within this pure validation subset. These evidence qualifications accompany the technical recommendation and must not be omitted from parent disposition.

## Exact source boundary

Current SHA-256:

- Vault: `f030e66a90e196d5a538d557d6209833952a57e6d824af732f3c74fbc4d8950c`.
- Worker: `fd8973b202923eb2c3df3f3e55035684441a8dc2d95475f0b08a03a3a632b11e`, imi-v31.
- Pixel shell: `1f2c5728394d549f7fc7d62af61e022de8f031b9cbfeff639f7d7b15acacc66b`.
- Classic shell: `44221f5f23a6434fc9d99c04376d3651163e2984a16db49a2bac3423aae6b224`.
- Balance shell: `0ea577ed1fa02fdc4f4f4865a65c6216f47c15ee903272b53ad7695aaf37a1db`.

The independently generated [Vault diff](evidence/LG-02/qa-runtime-b1-r2/vault.js.diff) contains only the three rules and associated validation ordering. [Worker diff](evidence/LG-02/qa-runtime-b1-r2/sw.js.diff) is v30→v31 only. Repair current-before Vault/worker equal the parent's pre-edit copies. Removing precisely the one Vault tag immediately after Rewards in each shell reproduces the original B1 frozen bytes. From original v29 the entire worker delta is the Vault asset plus version31.

The [audit](evidence/LG-02/qa-runtime-b1-r2/audit-results.json) rehashes 483 available QA1 closing inputs. Only Vault, worker and two parent history/status records (original B1 task and execution) differ from QA1; all are sealed as current inputs before this review's work. Eleven original frozen source copies match their recorded hashes. The new start seal covers 717 bounded files. This is not a whole-tree or retrospective historical inventory.

Catalogue, API, flags, gate, Rewards, Core, Economy, Ops, CSS, edition wrappers, ordinary clocks, award/goal/Printing paths and script ordering are unchanged by repair. Vault only defines a frozen catalogue and pure validator. It registers no extension, provider, initializer, timer, listener or gameplay callback. The selected catalogue remains 14 entries: G/T incremental150/300/500/800 and factors1.25/1.5/1.75/2; Plus100/200/400 and24/36/48h; seat4 one seat300; beds7–8 two beds200; Endless null-priced/nonpurchasable. Seat/bed priorTier0→targetTier1 encodes entitlement stage, not capacity. No cosmetics, paid offers, extra891DB, award changes or price reinterpretation were introduced.

## Fresh tests and retained failures

Fresh immutable serial command, GUARD240:
`node --test --test-concurrency=1 tests/vault-schema.test.cjs tests/vault-startup-strictness.test.cjs tests/vault-schema-repair.test.cjs`
passes **27/27**, zero failures/skips. Exact command, source/test hashes and output are retained in [focused-command.json](evidence/LG-02/qa-runtime-b1-r2/focused-command.json) and focused-tests.txt.

The unchanged independent QA1 harness was copied byte-for-byte to this new evidence directory and run against actual current Vault: **56/56 expected outcomes**, zero ambient import/validation touches. Its complete input/result pairs are [schema-results.json](evidence/LG-02/qa-runtime-b1-r2/schema-results.json). Original QA1 45/56 and all eleven differences remain immutable. Nine substantive defects are repaired; two date-domain qualifications now match the clarified contract.

A further [64 controls](evidence/LG-02/qa-runtime-b1-r2/date-controls.json) pass. They add timestamp edge/type controls across creation/activation/refund, noninteger/negative/unsafe sequence/amount/Printing controls and reverse insertion order. These are fixture counts, not additional Node test-runner groups. Catalogue deep freezing, repeated frozen-input purity, unknown metadata, static diagnostics/private identifier non-disclosure, overflow before equality, source totals/refunds/re-purchase and malicious maps/references are covered by the actual VM suites.

The 109 earned /100 synthetic bought /150 cost example and later4 earned refund remain pure ledger fixtures with exact source credits. They grant nothing. Structural bought credits are not verified paid provenance. The validator does not infer historic earned-first availability from today's balance. Absence is not complete prem/Rewards admission. Unknown revisions/cost policies, deferred cosmetic selection, unpriced Endless and OPEN recovery remain unsupported. No constructor defaults, destructive normalization, public generic setter, transaction engine or save admission was added.

Fresh syntax checks pass for nine relevant JS/test/helper files and eight executable inline scripts. The source-bound final author serial suite remains **159/159**, zero skips; original B1's final155/155 remains historical. No new concern warranted another full suite after focused checks and source/routing audit.

First failures remain visible:
- Original unavailable PowerShell SHA256.HashData freeze attempt, VM Math trap setup error, suite missing-module/collision failures, move guard failure and moves.
- Repair red regressions: 1 pass /3 fail on old source.
- Repair first focused run:26/27, diagnostic-order assertion failure (durable position36); source validation ordering corrected (38), then27/27 (40). No old test assertion was changed.
- Repair first serial run:115 pass /44 fail, historical mkdir refused. Final corrected routing159/159 is a separate pass, not erasure.
- Reviewer setup/read/probe limitations are recorded in review-failures.md. No failed product expectation was suppressed.

## Actual forward output isolation

[route-audit.json](evidence/LG-02/qa-runtime-b1-r2/route-audit.json) inspects actual immutable writers, routing source, route logs, destination files and old-prefix paths. The actual writers use fs.writeFileSync for37 away results and fs/promises mkdir/writeFile for69 fixture results. The preload wraps those methods and synchronizes built-in ESM exports; assertions/product/browser parameters are unchanged.

There are **213 recorded mappings:144 writes and69 mkdirs**. Writes comprise preflight1 + initial away37 + final away37 + final fixture69. Every mapped output is contained in the repair's new test-output directory and exists. Recorded original paths are absent now. The failed first mkdir was refused during route argument evaluation, before the underlying mkdir could mutate that historical path. Successful away writes from that failed suite were already routed.

Recording-fs VM probes (no disk writes to historical roots) cover relative/absolute paths, exact root equality, sibling prefixes, nested fixture paths, unsupported children and actual caller method semantics. Exact root equality and a sibling prefix pass through; a nested immediate fixture parent is flattened; deeper unsupported children throw. Thus the helper is sufficient for these inspected immutable writers, **not a universal filesystem safety boundary** or reusable authorization for other callers/operations. Route exit0 alone is not containment evidence.

Fourteen apparent output-source mismatches were independently reconciled against the helper's explicit frozen Ops/Rewards/Economy inputs and RNG-instrumented balance bytes; all match in [source-aware-routes.json](evidence/LG-02/qa-runtime-b1-r2/source-aware-routes.json). They are intentional test variants, not current native source proof.

The absent repair inventory remains a proof limitation. Current old-prefix absence and bounded start/close hashes are forward observations, not retroactive proof for the original212 moves. This reviewer executed only read-only focused suites; every new output was directed into QA2 evidence before creation. No historical-root write, move, deletion or reconstruction was performed.

## Whole captured raw and fixture chronology

Independently recomputed eight existing raw artifacts: original before, all five original after reports, repair current-before and repair after. Entire objects match after removing **only** capturedAt/sourceCommit/sourceHashes/url/wallSeconds. Canonical pretty JSON plus newline:
`017fae08d71fe4064f0ef4cd05a75dfecc449b5581677e351934bda54dd507ee`.

Each uses seed1, active/collect, activeMinutes180, tune{}, requested/session/actual60, complete=true, no captured errors or HTTP errors. Recorded commands use GUARD240. Original before captured08:17:14.800Z; original final sealed08:44:49.751Z; repair before09:28:02.659Z and after09:33:20.262Z. Corrected freeze and fixture chronology precede source edits. No intermediate or failure was replaced.

The raw itself hashes balance/Economy/World/Ops/Bot, not Vault. Contemporary repair source, current source equality and fresh loaded/served/cached evidence establish the pure-module binding. This is equality of captured output, not exhaustive RNG/heap equivalence, a new reviewer hour, or a newly captured pre-edit baseline. Historical activeMinutes30 is not substituted. Fixture version1/unknown-field chronology passes at the Ops/Economy bridge boundary; Q2-E1 qualifies the exact Core claim.

## Fresh native, source/cache and images

T3 preview_status/open first; new unused origin8193 with empty local/session/cache/registration state; hidden owned Node server; one game document throughout. Actual repair current-before fixture was planted from inert /qa-inert before game navigation, without rewriting its timestamps or reseeding a departing game.

Pixel LG01-only ordinary play increased manual3446→3447, acknowledged save succeeded, and a new both-flags document retained3447/version1/root and prem unknown objects/no Vault. Classic both-flags ordinary play increased3447→3448, acknowledged save/reload retained3448 and unknowns. Actual native typewriter clicks and normal overlay controls were used.

After inert planting of an empty pure-valid Vault, both editions remained blocked under both flags: Rewards disabled, no IMI, all saved keys unchanged. **Both Pixel and Classic direct Core.boot, Economy.loadScore/loadState, saveScoreAcknowledged and saveStateAcknowledged were exercised.** Core/loaders refuse; acknowledgements return not-owner; post-load storage instrumentation records no writes. This closes the repair's missing Pixel direct-call lane. Post-load instrumentation is not relabeled early-startup observation; unchanged gate/prologues and strict startup tests support that separate boundary. Balance was also navigated sequentially and blocked with unchanged keys.

The real worker at8193/sw.js was activated and controlling; imi-v31 cached Vault bytes match served bytes and disk. [native-source-check.json](evidence/LG-02/qa-runtime-b1-r2/native-source-check.json), actual HTTP receipts and three-shell script arrays bind source/order. Worker itself is not a shell cache entry. No synthetic cache, version-text-only proof or current/stale writer support claim is made. The unchanged worker behavior may carry accepted A2 transition evidence; no fresh v30→v31 replacement transition is claimed.

Fetched current Vault executed in a separately instrumented inert browser realm with zero ambient touches, unchanged DOM/keys and absent result. VM traps cover the stronger import/storage/IMI/DOM/listener/timer/RNG/clock boundary. No Vault fixture was admitted.

Four current exported images were personally opened: [Pixel normal](evidence/LG-02/qa-runtime-b1-r2/pixel-normal.png), [Classic normal](evidence/LG-02/qa-runtime-b1-r2/classic-normal.png), [Pixel blocked](evidence/LG-02/qa-runtime-b1-r2/pixel-blocked.png), [Classic blocked](evidence/LG-02/qa-runtime-b1-r2/classic-blocked.png). Normal desktops are1280×800; blocked controls360×560 CSS, no document scroll, visible Retry focus,268×53CSS target. The original15 images and QA1's4 were also personally opened; all23 hashes/dimensions are in images-reviewed.json.

Original images predate final pure-validator refinements and are not fresh current-source media. Unchanged CSS/DOM/edition/media/lifecycle source plus no-effect import supports qualified carry of original six-size visuals and previously accepted reduced-motion/Low/hidden/persisted-bfcache routes. No new concern justified rerunning that matrix. Existing ordinary phone truncation/welcome/daily overlays remain limitations. Raster device scaling is not native zoom. Physical device, native zoom, screenreader and audio remain distinct/unverified. The repair author's four viewed states had no exported files; none were manufactured. Parent must inspect the actual current files separately.

## All original eleven deliverables

| Original deliverable | Disposition in this review |
| --- | --- |
| 1. Before freeze/versioned capture/complete60 | PASS bounded freeze, version1 Ops/Economy fixture and whole raw chronology; UNVERIFIED exact pre-edit native Core clause (Q2-E1). |
| 2. Immutable approved catalogue | PASS exact selected IDs/effects/costs/null Endless; no future historical repricing authority. |
| 3. Pure definitions/read-only validator | PASS VM/native import and source; no default namespace, hook or startup/write. |
| 4. Receipt/ledger/source/sequence accounting | PASS current structural subset; B1-R1-01/03 resolved; no paid trust/current-context earned-first inference. |
| 5. Chains/ownership/reservation/Printing | PASS current subset; B1-R1-02 resolved; stage encoding retained; no ordinary historical prerequisites fabricated. |
| 6. Unknown/unsupported/preservation | PASS nonmutation/static diagnostics; unknown versions/effects/deferred/OPEN fail closed. |
| 7. No setters/effects/admission/default route | PASS source plus fresh both-edition direct loader/writer refusals; all Vault-bearing saves remain blocked. |
| 8. Meaningful tests | PASS fresh27 immutable groups,56 unchanged independent fixtures and64 added controls; original failures preserved. |
| 9. Syntax/regression/raw/default behavior | PASS fresh syntax/focused tests, source-bound159 history and recomputed complete raw; no fresh full-hour/full-suite claim. |
| 10. Native/source/cache/images | PASS fresh focused both-edition and three-shell/v31 controls; qualified unchanged full-matrix/media carry; physical/zoom/audio/screenreader UNVERIFIED. |
| 11. Evidence ownership/cleanup/handoff | FAIL original212 writes/moves and missing historical proof; Q2-E2 inventory unavailable. PASS exercised repair routing and this review's exclusive outputs/cleanup/closing preservation. |

## Cleanup and stop boundary

From inert8193: local/session keys cleared, caches empty, registrations0. Owned T3 tab closed. Node PID77576 was stopped only after executable, full command, root, creation epoch1791885160232 and8193 listener matched the launch receipts. No separate Chrome profile was created or deleted. Old8181/8189/8191/8192 and new8193 listeners are absent; unrelated8123/8147/8148/8162 retain their original PIDs. Historical8181 browser erasure remains UNVERIFIED and was never adopted.

The closing seal separates raw index identity from staged-content identity and records only the authorized QA2 brief Status/Handoff change among sealed preexisting inputs. Production/test/helper/history bytes remain unchanged by this reviewer. New report/evidence hashes are retained separately.

Shared/current-current/stale writers, all-loader atomic admission, coordinator/current-state persistence/recovery, purchases/effects/Undo execution, paid provenance, full Vault/UI/wholeLG02 and LG13 six-week/all-profile55% capstone/80% layers2/3 including Away remain unaccepted.

**STOP: TECHNICALLY ACCEPTABLE FOR PARENT REVIEW WITH HISTORICAL HOLD.** No B1-R1-04 exception, B1 acceptance, owner question or next-task authorization is issued.

