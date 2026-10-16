# LG-01 independent full runtime QA r1

**HOLD — full LG-01 candidate is not acceptable for parent acceptance.** Accessible assigned review completed on 2026-10-12 by GPT-6-Astra, medium reasoning, separate from the Sol6.1 implementer. Five findings below include three goal-policy defects, a genuine held-resize overlap, and a smaller zero-balance display violation. The passing 95-test run and exact default parity do not cover or cancel these findings.

No product, test, old helper, acceptance, execution or design edits. No repair, installation, delegation, staging, commit, push, deployment, default activation or LG-02. Parent alone accepts. Evidence links below are relative to this document; **Q** means [qa-runtime-r1](evidence/LG-01/qa-runtime-r1/), **C2** means [implementation-c-r2](evidence/LG-01/implementation-c-r2/). Native JSON retains the executed expression and raw tool result, including fixture setup and failures.

## Authority and source identity

Reviewed the runtime brief, original LG-01 parent, amended approved reward design, original C and completion-r2 briefs, plan/long-game authority and execution material, LG-00/A/B handoffs and prior QA/repair records, C/C2 handoffs and raw manifests, BALANCE, current implementation and frozen pre-C deltas. The height amendment authorizes normal 44px and content-driven enlarged height with all three summaries; it does not waive overlap, focus, full accessible text or scrolling requirements.

Working branch long-game, HEAD `8284174589cfd6ee0850434c28cbc25adc2d2710`. Initial and final audits match 22 candidate paths, with no disk/served mismatch. Native loaded-function/source receipts cover both editions, registered /sw.js and imi-v25 caches. Frozen comparison is C/before/source, not an assumption that HEAD contains this dirty candidate.

| File | SHA-256 |
|---|---|
| rewards.js | 8ba502cb569ecdb5423832199200fec5d48ad2286884ea806bcc221f6d96f6af |
| ops.js | b45f4afa41e2d8b0aa7e6827179d3d3ead245961c44bf7127c013a3210367095 |
| ops.css | da6a6b62dcdf72ec70b3d8debda73b515fe2dafe120fd5f89bbb6d212fed8cb8 |
| sw.js | 0962806da3f65444d22519e6547efb1149184c3ff979fb078804d9657aae88ef |
| core.js | 0ab61043f94bef1f89ed64b717721ddcbbc50439df4add1d53d1c7e18827fbe3 |
| economy.js | 7e3eaf72624b9881f520485df2b4000191fcdb1cfa5ff929164b8b370693d248 |
| tools/balance.html | 229e511471ebfac8e381357da094d3057d6f94b51806dc285f9e112ee5b027f5 |

Evidence: Q/initial-audit.json, final-audit.json, native-pixel-source.json, native-classic-source.json, source-review.json and four frozen-source diff files. Final HEAD/index match initial; index SHA `7434ee20aa036bd4e094e4a6e6d96b29e825d4eb0c83fb4cfa15caccc00990e1`. Default remains off. SW asset list is unchanged except version; both registered shells include the guarded module. Local loaded-source evidence is not deployment evidence.

## Findings

### R1-01 — P2: reachable garden goals disappear while the planted letters grow

Source: ops.js:1336 and rewards.js:494, 524–550. Garden reachability requires an empty or ripe bed. With all beds occupied and growing, the predicate becomes false even though harvesting remains reachable through the action already in progress. Selection removes the stored unfinished garden goal and saves another goal. This violates approved design line145: keep each unfinished reachable goal.

Reproduction: select gar1 with Lab available and two empty beds; use the actual plant controls for bed0 and bed1. Before either harvest, both beds are growing, harvested remains0 and gar1 remains unearned. Its stored slot changes from gar1 to w10. This is an actual product-control transition from a fixture precondition, not an injected completion boolean.

Evidence: [native-garden-after-plant.json](evidence/LG-01/qa-runtime-r1/native-garden-after-plant.json), including growing bed deadlines and changed IDs. Keep the goal while the existing crop can mature; this report does not implement that correction.

### R1-02 — P2: No Hands removes lifetime letter goals that automatic typists can earn

Source: ops.js:1326 supplies the same !chal('hands') reachability for lifetime letters and manual streaks; rewards.js:473–474 applies it to both chains. Ops manual pressing is restricted, but automatic press still increments lifetime letters and earns the original letter award.

Reproduction: in a No Hands challenge with a typist, lifetime letters999 and selected l1k, refresh goals. l1k is removed while unfinished. Invoke the actual automatic press path and checkAwards: letters becomes1000, l1k is earned and its locked129-letter receipt commits. The source metric is therefore reachable despite the goal filter. Challenge/crew/counter setup is a fixture; earning uses production logic.

Evidence: Q/native-nohands-reachable-before.json and [native-nohands-actual-earning.json](evidence/LG-01/qa-runtime-r1/native-nohands-actual-earning.json). This is separate from the legitimate exclusion of a manual streak goal during No Hands.

### R1-03 — P2: real viewport changes during a reward hold move the new goal row under fixed buffs

Source: ops.js:2740–2752 fixed buff positioning uses cached stage geometry; held progression stops normal rendering. The added goal host reflows with viewport changes. Reproduced in **both Pixel and Classic**, with actual rejected reward preparation and retained ownership.

Reproduction: start on a phone-sized Floor with a native Rush buff, place the letter counter one actual stage press below its award, reject that award's Ops write, and click the stage. Verify held=true/running=false/owner=true. Resize to1280x800 (also exercise phone landscape/portrait). The fixed buff retains old top coordinates and visibly covers goal text. Pixel buff vertical range192–214.343 overlaps goals180.093–224.093; Classic buff193.0035–223.4965 overlaps goals181.289–225.289. The hold retained exactly one rejected write throughout the resize sequence. Clicking actual Awards navigation during this hold was refused; no forced inaccessible navigation is called a normal bug.

Evidence: [Pixel image](evidence/LG-01/qa-runtime-r1/pixel-held-resize.png), [Classic image](evidence/LG-01/qa-runtime-r1/classic-held-resize.png), Q/native-pixel-held-later-r3.json, native-pixel-held-desktop-to-phone.json, native-pixel-held-return-desktop.json, native-classic-held-arm.json, native-classic-held-desktop.json, native-classic-held-landscape.json, native-classic-held-portrait.json, native-classic-held-buff-geometry.json and both held-navigation records.

Qualification: the fixed-coordinate mechanism is byte-unchanged from frozen pre-C source. This establishes a new goal-row collision with an existing positioning limitation, not that C invented the positioning mechanism. No pre-C runtime resize run is claimed. C2 fixed-viewport settled held captures pass and do not answer this real resize case. No scene/FX correction is authorized here.

### R1-04 — P2: unknown challenge metadata falsely shows all four challenges complete

Source: ops.js:1320 counts Object.keys(S.chDone), while the original ch4 predicate at1273 requires each of the four known challenge IDs to be truthy.

Reproduction: preserve completed vowel/haiku/hands and an unknown futureChallenge:true entry, with timed missing. The visible ch4 goal says4/4, but actual checkAwards leaves ch4 unearned. Unknown fields must survive; they must not count toward a fixed known-content predicate. False-valued keys are also counted by this implementation.

Evidence: [native-challenge-metric.json](evidence/LG-01/qa-runtime-r1/native-challenge-metric.json). This does not change or dispute the preserved original award predicate; it identifies a new goal metric mismatch.

### R1-05 — P3: zero Diamond Banana balance is shown before its approved reveal threshold

Source: rewards.js:585 renders Diamond Bananas:0 unconditionally whenever the inventory is shown. Approved design line101 says display earned+bought total only once total>=1. Zero-ledger Awards captures and native card/inventory inspection show the early0 balance.

Evidence: current source rewards.js:585 and inspected zero-ledger Awards/inventory presentation. The native all68-card record covers card text, not the inventory balance. No price/store/spending issue is inferred. This smaller contract violation is not the sole reason for HOLD.

## Coverage and result

| Lane | Result | Evidence and limits |
|---|---|---|
| Original68 IDs/names/order/predicates/+1% | PASS | Frozen original award block byte-equal; actual68 rendered card names/requirements/+1% inspected; catalogue68 plus five first-clear assignments. |
| Reward catalogue/formulas/109DB | PASS | 76 award DB +33 first-clear DB =109; 73 stable assignments. Actual-module tests exercise all assignments, rate tiers, speed0.5/1/1.25/2, zero-rate floors, caps, lucky expectation, highest owned desk, balanced letters and cash rounding. |
| Estimates/waived/locked/waiting/receipts | PASS with evidence split | Native all68 cards plus display/transaction tests and source. Variable L/C previews are labeled; committed/prepared descriptors stay locked, volatile failure says unsaved, historical waiver retains+1%. Prepared-delivery branches are module/source evidence, not a claim of68 native failure injections. |
| Private goal policy and metric accuracy | FAIL | Complete table/source predicate comparison below; R1-01/02/04. Passing examples do not establish all prerequisites. |
| Selection persistence/rejected metadata/Retry | PASS | Fresh actual Core both editions: selection rejects twice, actual Retry, acknowledged-key reload; retained unknown fields, ownership, receipts and wallet. Q/native-{pixel,classic}-selection-* and writes records. |
| Summary acknowledgement | PASS, interpretation below | Both editions actual Dismiss, two rejected writes, successful Retry and reload; separate lost acknowledgement reload restores summary. Q/native-*-summary-*; Classic lost-summary-r3 is valid corrected attempt. |
| Printing/current-state/focus | PASS | Both actual Print controls and reloads; current-state getter follows replacement state, current shelf resets, lifetime goals/reveal and first receipt persist, unreachable desk goal changes. Q/native-*-print*; worker raw one-slot/early/fewer/complete evidence independently decoded. |
| Keyboard and earned-card targeting | PASS | Both phone Goals Enter targets full award card without wallet/claims/keeper-focus changes; earned l1k target stays focused across mark/render. Q/native-*-keyboard-*, native-pixel-earned-target, native-classic-earned-target-final; C2 one-slot-earned-focus raw. |
| Existing stored-token activation | PASS | Both actual inventory control, two rejected Ops writes, Retry and reload. Consumption and15000ms active remainder are in the same acknowledged snapshot. Fixture awards earned through checkAwards; this is not physical gold-catching proof. Q/native-*-activation-*. |
| Pending rewards/away/reentrancy | PASS for reviewed engine paths | All95 tests plus fresh UI holds; original B accepted native payment/reload evidence remains source-bound. Controls do not bypass held ownership/metadata guards; no render/save recursion or per-progress-tick selection writes in unchanged-ID branch/test. |
| Fixed-viewport layout/text/insets | PASS for stated fixtures | Personal final images/DOM review both editions at1280x800,390x700,360x560; proportional CSS100/125/150/200, insets, long text, six desks, rail, modal, buffs and settled holds. R1-03 makes overall held-layout lane FAIL. |
| Media/hidden/bfcache | PASS for fresh local lane | Actual preload media and real visibility/pageshow discriminators both editions. Q/media-report.json, final-audit.json and12 personally opened images. |
| Disabled preservation | PASS | Fresh complete60-minute seed1 active/collect, exact raw-derived canonical equality; default off and production/RNG/wallet fields retained. |
| Enabled pacing | BOUNDED evidence only | Independent derivation of source-bound worker hour below; no full-profile/endpoint acceptance. |
| Physical/deployed/actual browser text zoom | UNVERIFIED | CSS text/inset fixtures are not native zoom or physical safe areas; no physical/hardware/premium/deployed claims. |

### All private goal groups checked against the source

Reviewed every entry in rewards.js:473–498 against AWARDS and goalFacts, including candidates deliberately absent from suggestions.

| Group | Metric / prerequisite assessment |
|---|---|
| l100/l1k/l10k/l100k; c10/c50/c100/c200 | stats.letters versus best; actual manual/automatic distinction fails R1-02. |
| w10/w100/w1k/keep | Lifetime words; keeper/intro availability. Same chain prevents multiple simultaneous word thresholds. |
| s1/s4/s8/s12; s16 | Current sold count versus authored subset/total; Titles availability and unowned-content gates. Printing label/current-state correct. |
| k10/k50/k300; m25/m150/m900 | Current kids/library shelf, existing reading lists, band/desk availability and source totals. |
| d1–d5 | Binary next desk; predecessor and challenge purchase gates. No invented percentage. |
| p8/p20/p40 | Current crew with owned-room capacity; excludes thresholds requiring unavailable desks. |
| b10k/b1m/b1b | Actual scaled wallet thresholds250000/25000000/25000000000; shelf earning availability. Holdings, not lifetime earned. |
| lv5/lv10; hat1; hold; lamp3; mk1/mk3 | Level, binary hat/hold, lamp, max restoration with owned eligible desk/tool gates. mk3's source threshold is2, preserved. |
| p1/p10/p50 | Lifetime pitched versus sold pitches, title/offer availability. |
| dv1/dv100/dv5/dvall | Current released totals, active division count, catalogue binary; departments/content gates. |
| mu1/mu3 | Owned Muses versus seated first three; existing department/unlock gates. |
| gar1/gar500 | Lifetime harvested, but growth incorrectly invalidates reachability: R1-01. |
| pr1/pr3 | Lifetime Printing count and actual Legacy gate. |
| ch1/ch4 | Challenge department/gates; numerator mismatch: R1-04. |
| deal; roy100 | Current known deals versus current royalty base; actual source targets. |
| Absent policy entries | Passive weather/night/away/pickup/rotten and other deliberately excluded primary suggestions retain original Awards cards/predicates/rewards. No new predicate or reward source added. |

Selection uses stored IDs, family/chain diversity, earliest eligible chain target, current-department preference then original order/ID. It does not sort by live percentage. Existing eligible slots survive; completion replaces one slot. Known metadata is bounded and unknown fields merge through save/reload. Fewer/all-complete render truthful state; reveal waits for intro/Awards availability and persists across Printing. These source and positive checks are qualified by the concrete invalidation/metric findings.

## Test audit, parity and balance evidence

One independent final test invocation ran the exact seven files, concurrency1: **95 passed,0 failed**, exit0, about63.886s. Q/tests-first.log and tests-first-exit.txt preserve the first run; there was no quiet replacement run.

| Test file | Count | Meaningful scope / limitation |
|---|---:|---|
| economy | 5 | Denomination/migration/interruption/malformed records/storage failures; not native UI. |
| rewards-startup | 5 | Registration order, rejected boot/Retry/default-off synchronous path; callback bridge simulation. |
| rewards-transactions | 27 | Actual module assignment/formula catalogue, prepare/wallet/commit/reload failures, contradictions, reentrancy, challenge history, Printing, L/D/G publication boundaries. |
| rewards-offline | 11 | Rush expiry/speed/native overlap/Critic/caps, activation atomicity, saved continuation, real caller conservation and RNG against frozen source. |
| rewards-away-baseline | 37 | Sale/royalty/division baseline and subsequent phases, repeated/reload/Deadline and successive bulk/timed operations. |
| rewards-goals | 7 | Family/stability/reveal/capacity/failed metadata/Printing/fewer-complete. Does not cover growing beds, automatic No Hands or unknown challenge numerator. |
| rewards-display | 3 | All68 previews/status/inventory summary; does not establish real responsive layout or browser lifecycle. |

Fixtures load production modules but use the balance bridge's simulated Core where applicable. Fresh T3 native actions use actual Core. The two evidence classes are not interchangeable. Source-review.json retains every test name and20 passing syntax checks including inline bridge scripts. Tests and old helpers were not edited.

Fresh default report:60/60 simulated minutes, seed1, active/collect, activeMinutes30, tune{}, no errors/HTTP errors/guard stop, wall26.496s. Only capturedAt/sourceCommit/sourceHashes/url/wallSeconds excluded. Pretty canonical SHA:
`5ef60fd274a856b386ae15ecebc5ac5b7ac3dfd37768bd08d4b060d8ee20a6a9`.
Raw SHA `ecf13def592656bc387234baac591537e5dbe80c6820b0b2fb55d7b08cb08068`. Evidence Q/disabled-fresh.raw.json, canonical and receipt. No gameplay/RNG/wallet/state removal.

Independently derived C2 enabled-hour committed descriptors:12 letter claims total5906,9 cash claims total56250,4 DB claims total10. Worker raw60-minute report and source binding retained; not rerun without a new balance concern. Hibiscus6.7 versus default13.5 minutes. First hire.6/.7, first sale.9/1.2, first deal7.5/14.8, kids10032.5/38.6. This is not uniform acceleration proof: default records library1 at36.7 whereas enabled has no corresponding milestone. No retune or final pacing verdict follows.

## Visual, accessibility and lifecycle qualifications

Personally opened final enabled/disabled Floor and Awards/inventory captures for both editions and all three geometries, relevant text/inset/long/six-desk/rail/modal/held sets, and fresh media images. Also inspected worker raw DOM/native manifests rather than accepting contact-sheet labels. Some captures labeled inventory at desktop scroll positions show cards; actual native activation and inventory records supply that lane's evidence. Earlier diagnostics remain evidence of their captured states, not155 claimed passing images. Final audit hashes all155 candidate images and validates143 screen-receipt hashes;12 fresh media hashes also match.

Independent proportional text fixtures both phone widths and editions measure44,53.75,63.5,83px at100/125/150/200%. All three lines/progress remain within the growing button, with document dimensions equal viewport. Font-only diagnostic attempts that retained fixed line-height are not relabeled as passing proportional text stress. Native text zoom remains UNVERIFIED. Desktop row44px with <=52px added cost; target controls meet40px minimum. Accessible descriptions retain full action/requirement/reward while only short action text ellipsizes. Awards uses its scrolling pane. No new user Floor/document scroll was established; unchanged overflow:hidden and DOM geometry are distinct from the worker's programmatic scroll/wheel-tool diagnostics. Known Pixel360 bottom wrapping is outside scope and does not excuse R1-03.

Fresh pre-load reduce/High and reduce/Low report matchMedia/Core/IMI=true and computed animation none; no-preference/High controls match false and o-enterx. Both editions' touched goals/status are static under reduce/Low. Temporary isolated Chrome used only the authorized media/lifecycle lane; versions/flags/source response hashes are in media-report.json.

Actual hidden intervals32004ms Pixel and32007ms Classic retain owner, return visible, preserve goals; contenders have owner=false, IMI=false, writes=[]. Native bfcache reports pageshow.persisted=true, oldOwner=false, a new final timeOrigin, fresh cFresh metadata and stable goals. This fresh lane uses settled metadata. Accepted B pending-payment lifecycle matrices remain separately applicable because the engine/Core payment path is unchanged; no new exhaustive cross-product claim.

Quiet historical summary interpretation: Awards-only after intro/modal dismissal, with durable Dismiss and no Floor toast, is a defensible reading of the approved quiet once-only design, which does not explicitly demand auto-opening or a Floor notice. User must open Awards to discover it. I do not invent an alternate surface or make this ambiguity alone a HOLD. Durable acknowledgement prevents repeat presentation; lost acknowledgement returns it.

## Provenance, prior objections and handoff

Prior A JSON-shape-loss and callback escape repairs remain accepted; separate goalAwards preserves accepted rewardAwards shape. B's original HOLD/unpaid sale/double lifetime findings and repair retain locked cp.credit before baseline save. B r2 first84/85 startup timeout remains cause-undetermined; its final85 pass is not retroactive diagnosis. C r1 fixed44px overflow HOLD remains historical evidence; approved growth resolves that original conflict. It does not resolve R1-03.

Native setup/capture failures remain in Q with original filenames: whitespace/invalid initial probe, stopped-before-click lost-summary attempts (Classic r3 valid), stale dev-state inventory setup (Classic r2 valid), disabled-control timeouts/host recovery,64KB raw capture overflow, immediate pre-hold captures followed by verified held captures, and missing-selector buff measurements followed by .o-buff geometry. Pixel earned-target's diagnostic “earned:false” checks an unused .got class; the actual award flag/committed receipt/card text and later Classic check establish earned targeting. No failed capture is silently promoted to runtime acceptance.

The existing8162 qa=startup-hold fixture stops progression on extension init, including Printing init. The immediate post-Print raw capture therefore precedes the goal refresh; the recorded explicit resume/render and reload establish current-state selection after the actual Print action. Test saves were task-owned and could continue between edition checks; edition query/loaded-source identity determines the edition, not an older unknown metadata marker. This fixture behavior is not attributed to production Printing.

Existing8162/PID68788 revalidated against root and served source and preserved. Own hidden8169/PID93268 server was identity-checked and stopped; first immediate cleanup probe still saw the exiting process, cleanup-confirmed.json proves it absent/no listener with original server alive. Media profile cleanup is true. Task T3 tab closed. No owner's profile/system preferences changed.

Commands/environment, raw native expressions, browser flags, logs and hashes are retained in Q; commands.md gives the reproducible principal invocation forms. Final source audit found no tuple changes; initial unrelated dirty work retained. Only QA report/evidence and brief Status/Handoff changed under this lease.

**Handoff: HOLD.** Findings R1-01 through R1-04 require parent disposition before full LG-01 acceptance; R1-05 is a concrete lower-priority contract discrepancy. No repair is made or authorized by this report. Physical hardware, actual browser text zoom, deployed builds, premium/full profiles, six-week/deferred endpoints,55%/80%, Q5/Q6/Q8/Q9/Q10, prices/legal/paid-reset retention remain UNVERIFIED/open. Retired art and factory escape are outside scope. Parent retains final acceptance, default activation and subsequent-task authority.

