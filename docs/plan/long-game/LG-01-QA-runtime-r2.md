# LG-01 focused repair acceptance QA r2

**HOLD — not acceptable for parent full-LG-01 acceptance.** Accessible focused scope is complete. R1-01, R1-02, R1-04 and R1-05 pass repair review. R1-03's original single-chip viewport collision is repaired in the measured cases, but the held-layout acceptance lane still fails two current-content edge cases below.

Independent reviewer: GPT-6-Astra, medium reasoning, through T3/Codex, separate from the Sol6.1 repair author. Branch `long-game`, HEAD `8284174589cfd6ee0850434c28cbc25adc2d2710`. No source repair, delegation, dependency installation, staging, commit, push, deployment, default enable or LG-02. Parent retains acceptance authority.

**Q** below is [new QA evidence](evidence/LG-01/qa-runtime-r2/); **R** is [immutable repair evidence](evidence/LG-01/repair-runtime-r2/). Native JSON contains the executed expression and complete tool result. Review includes the original authority/design/amendment, parent/C/completion/repair briefs, original full r1 brief/report, accepted A/B and prior findings/responses, C/C2 handoffs, frozen raw evidence, exact repair diffs and current source/tests. Historical failures retain their original meaning.

## Findings

### R2-01 — P2: Retry can enlarge the status without updating held buff placement

**Location:** ops.js:2815–2831, especially the four observed targets at2830; rewards.js:10–20 and hold/retry status updates.

**Both editions, actual Core.** Establish a genuine rejected l1k preparation, retained owner and paused progression with one current Snack Break chip. At1280x800 the short rejection message and chip do not intersect. Click actual Retry and reject the candidate with the browser's normal quota-error message. The product changes the status text/height, but none of the four observed containers changes size. The chip remains at its previous top and is partly hidden behind the status.

| Edition | Buff vertical interval | New status interval | Available placement after one-pixel resize |
|---|---|---|---|
| Pixel |283–305.34375|288–512|627–649.34375, above info669.921875|
| Classic |282–310.5|294–506|639–667.5, above info675.640625|

The one-pixel1280→1281 resize is a diagnostic control: the same algorithm immediately selects the existing free space. This is a missed invalidation, not insufficient screen space. All four container rectangles are retained before/after. Entire serialized state, raw Ops/wallet keys, buff deadlines, owner and paused state remain unchanged. Retry remains focused. Only the explicitly attempted rejected writes increase. No new observer-driven save or gameplay change was found.

Evidence: Q/[pixel-repeat-quota-arm.json](evidence/LG-01/qa-runtime-r2/pixel-repeat-quota-arm.json), [pixel-repeat-quota-result.json](evidence/LG-01/qa-runtime-r2/pixel-repeat-quota-result.json), [pixel screenshot](evidence/LG-01/qa-runtime-r2/pixel-repeat-quota.png), pixel-repeat-quota-resize-control.json; classic-repeat-quota-correction/result/resize-control.json and [Classic screenshot](evidence/LG-01/qa-runtime-r2/classic-repeat-quota.png).

Fault boundary: these are real product persistence/hold/Retry calls with task-only storage rejection injection. Classic obtained the native QuotaExceededError message from a rejected oversized task probe; no probe key was stored. Pixel uses that standard message format for imi-ops-v1. This does not claim ordinary play actually exhausted storage. The initial Classic probe was intercepted by the existing JSON-parsing tracer and produced a SyntaxError instead; that diagnostic remains in classic-repeat-long-*.json and is not the quota proof. Successful actual Retry subsequently commits one50-letter reward, and reload retains the same receipt in both editions.

Required repair outcome: placement must respond to current status-size changes while keeping the transaction paused and avoiding a gameplay render/save/frame loop.

### R2-02 — P2: current multiple chips overlap the rail despite available horizontal space

**Location:** ops.css:489–491 and ops.js:2815–2831. The held intrinsic-width rule retains viewport-centered left50%; the new placement measures/changes only vertical position.

Use current Frenzy + Snack Break + Vowel Drought content, then a genuine rejected l1k preparation. These are existing buff/challenge fixtures, not invented future chips. Actual stage press reaches the hold. Perform real native viewport transitions.

- **Pixel700x390:** bar width606, x47–653; the actual Frenzy chip measured x44.90–169.10 at the captured pulse phase and visibly crosses the60px rail. The stage spans x66–694, width628. The current row fits there, including the measured pulse extent, with an appropriate horizontal placement. Vertical placement358–380.34375 clears keyboard/status.
- **Classic390x700:** two-row bar width320 centered at x35; actual Frenzy chip x42.43–152.39 crosses the60px rail and covers part of Train. Current occupied chip content fits within the318px game region after a horizontal shift. Its vertical194–257 range clears the status starting268.

Evidence: Q/pixel-multichip-{arm,baseline,700x390,landscape-children}.json, [Pixel landscape image](evidence/LG-01/qa-runtime-r2/pixel-multichip-landscape.png); classic-multichip-{arm,baseline,390x700,portrait-children}.json and [Classic portrait image](evidence/LG-01/qa-runtime-r2/classic-multichip-portrait.png). The eight multichip geometry records retain state/key/deadline/write/focus equality. I checked actual child rectangles and opened the images; a container-only rail intersection is not treated as proof of visible obstruction.

**Separate space limit:** Pixel390 three-row height79.03125 reaches the status; both360x560 cases also intersect it. At360 the normal stage-top/status and below-keyboard/info gaps cannot contain the current79.03/97.5px stack. Those are no-free-vertical-space cases under the present stacking geometry, not evidence of a missed usable bottom slot. Pixel390's preferred stage-top gap is also too short for79px; this report does not claim a comfortably separated alternate vertical slot. Classic700 multichip passes. Arbitrary future stacks are not promised. These limits do not erase the two concrete available-horizontal-space failures.

No prior frozen multichip runtime comparison was made; this is a failure of the current repair's required no-rail-overlap acceptance, not a claim that every underlying centering behavior originated in r2.

## Coverage and results

| Lane | Result | Evidence and practical boundary |
|---|---|---|
| Current/frozen/served/loaded identity | PASS | Q/initial-audit.json, final-audit.json;64 current inputs and all frozen seal bytes match;8 served inputs match. Both native current-source receipts include actual Core, current function body and68 three-field rewardAwards entries. |
| Original68 predicates/names/order/+1%,73 assignments/109DB, engine/API/default preservation | PASS | Exact frozen diffs and independently recomputed worker raw audit. Original AWARDS block and +1% multiplier unchanged;68 assignments plus five first clears,76+33DB retained. Rewards engine before goal policy and after afterRender is byte-equal; Core/Economy/shells/accepted away/gold/payment/startup paths unchanged in the scoped seal. |
| Syntax and combined tests | PASS | Independent first combined99/99, fail0, exit0,63,447.8489ms; Q/tests-first.log and exit receipt. All95 existing tests plus4 new real-caller regressions. Duration is a measurement, not a causal performance claim. |
| Frozen red provenance | PASS, source-bound | R/tests-red-final-frozen-r2.log has4 assertion failures, exit1: growing slot replacement, NoHands l1k removal, false4/4 and DB0 visibility. Frozen server mapping and seal reviewed; final test source hash bound. Earlier setup/observer-root failures are not red proof. No additional frozen rerun was necessary. |
| Fresh disabled60 seed1 active/collect | PASS | Complete60,30 active minutes, errors/httpErrors empty. Q/disabled-fresh.raw.json and canonical receipt. Exact equality with R/before and final2 raw-derived reports. |
| R1-01 garden | PASS with capture qualification | Actual Plant controls in both editions, growing beds retain gar1; actual Harvest earns once, other s4/d1 slots stay, unknown metadata/focus retained, saved-key reload agrees. Q/*garden*, *growing*, *ripe*, *harvest*. Worker current garden raw/write matrices also re-audited. |
| R1-02 NoHands | PASS | Both actual Core production manual/automatic press paths: manual stays999, automatic becomes1000 and commits l1k; l1k retained, c10 excluded. Q/*policy*. Automatic caller invoked through dev probe; not a timed autonomous typist audition. |
| R1-04 challenge metric | PASS | Known truthy3/4 matches unearned ch4; unknown true and false entries and timed:false survive reload. Original ch1/ch4 earning predicates untouched. Combined real-caller test subsequently marks known timed true and verifies actual ch4 earning. |
| R1-05 balance reveal | PASS | Both native read-only header projections for0/0,1/0,0/1,2/3; no state/key/write change, inventory retained. These ledger fixtures prove display only, not bought-currency issuance. |
| Selection failure/Retry/reload | PASS | Both native metadata saves reject twice; old acknowledged IDs/keys persist, owner/focus held; actual successful Retry installs l1k/s4/d1 once with unchanged claims/wallet and unknown fields. Q/*metadata*. |
| Original R1-03 single-chip resize | PASS for measured matrix | Both actual rejected reward holds:1280x800,700x390,390x700,360x560; no Goals/title/keyboard/info/status/rail intersection, full state/keys/deadlines/write count and focus equal. Worker final2 text200 and final geometry raw re-audited. |
| Held-layout edge acceptance | **FAIL** | R2-01 and R2-02. Passing ordinary matrix does not establish complete layout acceptance. |
| Observer guard/cleanup/feedback | PASS for reviewed/measured boundary | Four stable nodes exist at registration after root markup. Callback checks owner/held/Floor/content/connected stage; bounded rect reads, class/top only. No gameplay/save/reconcile/timer/scene/resume/release call. Q/observer-lifecycle.json proves pending-hold stability, idle callback plateau and actual pagehide disconnect in both editions. |
| Approved normal/enlarged Goals geometry | PASS | Fresh16 native DOM measurements:both phone sizes/styles at100/125/150/200 CSS text stress,44/53.75/63.5/83px. Three rows/progress/full accessible description remain; document equals viewport, Floor overflow:hidden/scrollTop0. Q/*text* corrected records. |
| Current images | PASS for represented states | Personally opened all30 corrected R/screens-current images:both styles ×3 sizes ×enabled Floor/Awards/inventory and disabled Floor/Awards. Used final3 Awards/inventory replacements, not diagnostic final2 scroll offsets. Opened all8 final2 held images,12 fresh actual-media images, own text and defect images. |
| Fresh actual preload media | PASS | Both reduce/High, reduce/Low and no-preference/High controls:matchMedia/Core/IMI agree; none versus o-enterx. Applied before navigation. Chrome155.0.8059.39, isolated profiles, current response hashes. Q/media-report.json. |
| Fresh actual hidden owner/contender/resume | PASS | Pixel32,006ms; Classic32,014ms. Owner retained while actually hidden; same-context contender nonowning/nonwriting; return visible with same goals. |
| Fresh native bfcache/current-key restoration | PASS | Both persisted=true, oldOwner=false, changed timeOrigin/fresh owner and current metadata. Additional pending-hold lifecycle probe repeats this with observer disconnected once and an unacknowledged claim absent after reload. |
| Native text zoom/physical/hardware/account/deployment | UNVERIFIED | CSS stress and viewport resizing are not native zoom, physical safe areas, screen-reader audition or hardware durability. |

### Garden and verification qualifications

The initial Pixel “ripe” capture was taken before its actual deadline and is not ripeness proof. The subsequent real Harvest interaction waited for the control, then earned6 harvested letters and one50-letter receipt. Its immediate stopped-render capture retained the old goal until the production afterRender reconciliation ran. Separate pixel-harvest-reconciled and pixel-garden-reload-r2 captures prove one-slot replacement and durable reload. Classic has an explicit ripe-before-Harvest capture. The worker's final current native matrices provide independently parsed ripe records and every listed raw write in both editions. I do not relabel the initial Pixel timestamp.

Pixel reconciliation was on Floor and selected l1k; Classic was in Lab and selected w10. Both legitimately replace only gar1 and retain s4/d1. The first local evidence checker incorrectly demanded w10 in both contexts; its failure remains in independent-results.json. The corrected one-slot oracle in independent-results-r2.json checks only the contract, including saved-key equality. No product/test assertion was edited.

### Source and runtime reasoning

Garden availability now uses existing bed capacity; Lab/department visibility remains a separate candidate gate. It does not claim planting is immediately available while beds grow. NoHands letter capability requires an owned automatic typist when manual action is forbidden; manual streak reachability remains independently false. The known challenge metric reads the existing table without rewriting raw chDone. Balance display only adds a threshold around the paragraph.

The observer's target changes do not feed the observed containers: the fixed body-level bar's class/top writes are outside normal flow, and identical top writes are skipped. Source inspection finds no added per-frame layout path. In the fresh observational wrapper, the new observer has exactly four targets; a separate preexisting opsRoot observer is not miscounted as a new one. Calls stabilized at3 after resize and stayed3 during700ms idle. Full serialized state/raw keys/deadlines/write stream stayed equal while held. On actual bfcache restoration the old new-observer record reports disconnects1 and no ownership, followed by a new document/current-key load. This is bounded runtime evidence plus source review, not an unbounded performance guarantee.

The pending claim remains volatile after failed preparation. Retry raw writes preserve its descriptor, then acknowledge preparation and commit once. No payout is attributed to a geometry callback. Normal rendering removes the held class on release. Disabled execution creates no repair observer because writer is absent; disabled default parity and source boundary agree.

## Identities and exact parity

| File | SHA-256 |
|---|---|
| ops.js |ea478918e8b7c05a6c90cbd8d0bd4cc4b270d80f8dcf4fc463b15de0d412fbb7|
| rewards.js |3a30312d9bc34783942ae379890cb6356e5197be4edcac0e0c909b452f98cb6a|
| ops.css |72d826af2b86276d3396e9974852667da0f85f12e192546ed9ef1370777b759b|
| sw.js |5c6541b92cc2d4ad9fc1130e7e36d67793f758ad1ae4b5a7c58fe4f48bb4b948|

SW imi-v26 changes version only against frozen imi-v25; asset list/registration preserved. Current HEAD/index remain initial; indexSHA7434ee20aa036bd4e094e4a6e6d96b29e825d4eb0c83fb4cfa15caccc00990e1. All64 scoped inputs and50 worker image hashes match initial/final audits. This does not audit unrelated artwork/library content.

Canonical exclusions are **only capturedAt, sourceCommit, sourceHashes, url, wallSeconds**. No gameplay/RNG/wallet/state exclusion. Pretty JSON plus newline SHA256:
`5ef60fd274a856b386ae15ecebc5ac5b7ac3dfd37768bd08d4b060d8ee20a6a9`.
The fresh full report matches the frozen before, worker final2 and accepted canonical. No compact/sorted hash is substituted. This is a virtual-clock harness hour using the established simulated module bridge, not a native elapsed hour.

## Applicability of full r1 passes

The original [full r1 report](LG-01-QA-runtime-r1.md) completed the original accessible scope. Its unaffected catalogue/formulas/locked descriptors/waivers, summary acknowledgement and lost-acknowledgement reload, Printing/current-state, keyboard/earned-card targeting, inventory activation, accepted transaction/away/reentrancy and bounded enabled-hour results retain applicability **through the reviewed unchanged source paths**, supported by the fresh99-test run. They are not claimed as a newly executed native engine cross-product.

The quiet history summary remains Awards-only, durably dismissible, and requires the player to open Awards; that discoverability limit remains defensible and explicit. No new Floor summary is required by this review. Approved44px normal/content-driven enlarged height is preserved. Desktop ticker plus44px row/8px gap remains within52px incremental cost. Known Pixel360 bottom information wrapping appears in enabled and disabled images and is not assigned to this repair. Original inset stress remains simulated, not physical.

Original A shape/callback and B away-baseline/current-run/counter repairs remain accepted. The earlier C fixed-height HOLD was resolved by the owner amendment. Original failed oracles/setup/API/captures/zoom/timeout/provenance and intermediate top-only/hidden-info held-layout failures remain unchanged. The worker's final2 matrices are current-source geometry proof only for their captured states.

## Execution, retained diagnostics and cleanup

Independent commands and environment are recorded in Q/run-manifest.json. Required test/helper outputs occupy only the explicitly new fixture-qa-lg01-runtime-r2-20261012 and qa-lg01-runtime-r2-* leases. Old tests/helpers were not edited. New worker-raw-audit.mjs is a copied read-only-input verifier redirected to Q; it recomputes the worker's assertions against raw evidence and does not rerun historical exclusive outputs. Its results support, rather than replace, this independent review and adversarial probes.

Retained diagnostics include: first media command's incorrect Puppeteer module path/MODULE_NOT_FOUND before browser launch, corrected media-r2 run; transient native host/Harvest selector failures and corrected actual coordinate click; initial Pixel premature-ripe/stopped-render records; text capture attempts before startup-hold had rendered Goals (null selector), followed by corrected render setup and16 passing measurements; initial quota tracer SyntaxError; evidence-checker heterogeneous-record shape errors and the overly specific replacement-ID oracle described above. No original log or failed receipt was overwritten. PowerShell UTF16 logs are decoded by BOM. Tool-call records retain shell/read failures that did not produce standalone files.

Existing8162/PID68788 was revalidated as the root implementation-a Python service and left running; disk/served identities matched. New8171/PID85432 server was launched hidden with root/command receipt, used only for authorized isolated media/lifecycle, then command/port ownership was revalidated before stopping. Repair8170 remains closed. Both isolated profile prefixes were resolved/verified and removed by their helpers. The task T3 tab was closed through the native lifecycle. Q/cleanup.json and preview-close.json retain receipts. No owner profile/system preference changes.

## Parent handoff

**Recommendation: HOLD.** Address R2-01 and R2-02 under a separately issued repair lease, retaining the passing source/state/transaction boundaries and the no-free-space qualifications. Parent's outstanding full final-image review remains its own acceptance step; this reviewer has completed its assigned image review.

No default activation or next task. Full profiles, six-week completion,55%/80%, Q5/Q6/Q8/Q9/Q10, prices/legal, paid ownership/reset recovery, native zoom/physical/hardware/account/deployment remain open or UNVERIFIED. Retired art integration and factory escape remain outside scope. Review stops with this report.

