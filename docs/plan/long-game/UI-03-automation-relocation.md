# UI-03 automation relocation

Status: research accepted; relocation implemented and locally accepted. Owner APPROVED each base A1-A11 at 1 Legacy star on 2026-10-16, retaining existing tier prices 1/2/4, progression gates and helpers already earned or used without another charge. Regular-banana draft below is superseded. UI02/UI03A/UI03B leases released; UI03C implements the approved acquisition policy.

Source references below are repo-root file:line, read at HEAD e2d6ff06. Concurrent UI02 changes can move them; resolve by function name before editing.

## Placement contract

Remove the dedicated Auto tab. Put settings beside their affected feature; put every helper acquisition and paid tier in a Shop Helpers group. A Shop card can link to its settings. Keep global helpers global, rather than inventing per-monkey/per-division configuration. Existing tab names/IDs are in ops.js:86-92.

| Helper | Inline settings destination and real insertion point | Current base gate, plus completed introduction |
|---|---|---|
| A1 Auto-hire | Train `training`, Crew `crew`, beside selected desk's hiring card in `renderTraining`, ops.js:4232-4247. Render only that desk's toggle/reserve, keyed by persistent desk ID. | Displayed Printing 2, `S.printing >= 1` |
| A2 Auto-coach | Train / Crew, immediately above `.o-crew`, ops.js:4248. One global toggle; crew cards retain manual Coach. | No Hands clear |
| A3 Auto-shop | Shop `shop`, beside Room-wide upgrades, ops.js:4459-4465. Toggle and six-item priority order. | Displayed Printing 3 |
| A4 Auto-restore | Shop / Restorations, before per-desk `mkCard` list, ops.js:4450, function at :2246. One global toggle. | Displayed Printing 5 + Haiku |
| A5 Banana net | Floor `floor`, compact control in `renderFloorInfo`, ops.js:4193, near room information. Purchase remains in Shop. | Displayed Printing 6 + Deadline |
| A6 Auto-garden | Words `lab`, directly after `gardenHTML()`, ops.js:4282. Bed/letter/desk and toggle. Shop's Garden plots card is only plot expansion, :4427-4431. | Imprint 1 + saved manual plant/harvest cycle |
| A7 Auto-pitch | Titles `press`, Pitches `pitches`, beside `pitchHTML()`, ops.js:4390. | Imprint 2 + saved manual pitch proof |
| A8 Auto-media | Media `studios`, above division cards, ops.js:1198-1202. One global toggle and next release. | Imprint 3 + saved manual release |
| A9 Muse director | Muses `muses`, beside Seated heading, ops.js:1317-1321. One global toggle. | Imprint 5 + saved manual seating proof |
| A10 Auto-print | Legacy `legacy`, Press `press`, after Second Printing card, ops.js:2197-2203. Toggle, threshold, sample and Retry. | Estate 1 + new saved manual Printing |
| A11 Auto-challenge | Legacy / Challenges `challenges`, beside Small Crew/mastery, ops.js:2204-2209. Keep one-run enable, progress, Continue/Abandon and exit-only recovery. | Estate 3 + Small Crew clear + genuine manual Gold + purchased Veteran Crew |

Gate authority: automation.js:11-15, :98-103, :108-110, :136-138, :171-173, :377-379; auto-challenge.js:47-55. Preserve feature flags and normal-URL behavior. All bases currently cost zero; relocation alone must not add a charge.

## Smallest rendering changes

Keep the `automation` extension registered without `hooks.tab`, `visible` and tab renderer at automation.js:596-599. Registration without a tab already works in ops.js:3539-3552. Preserve init/tick/reset/actions, validators and owner callbacks. Do not remove the extension with the tab.

Use existing `afterRender({tab,pane})`, ops.js:4577, and `api.morph` to fill stable empty inline slots added at the insertion points above. Slots belong in host markup so host morphing does not repeatedly destroy appended controls. Split existing card-string builders from automation.js:98-208, :312-315, :375-379, :582-594 into small reusable fragments. No new event bus or exported state owner. Slot attributes can carry selected desk ID; no new selected-desk getter is needed. Scope slots to the current subtab and retain them when search-input rendering is deferred.

Preserve root click delegation and `automation:*` actions, ops.js:4764-4771. Preserve dataset names `data-desk`, `data-helper`, `data-level`, `data-item`, `data-direction`; garden `data-lg06a` and reserve `data-lg03-reserve` use the single document change listener at automation.js:734. Do not bind listeners on each render. Preserve A11 handover guards at ops.js:4768, :4776. `print-apply` reads unique `#lg08h-N`, automation.js:625; render it once. Replace obsolete `ui.tab === 'automation'` refresh checks at ops.js:3148, :3152 with normal dirty rendering. Update Auto-print's “Off in Automation” disclosure at automation.js:365.

Render shared pending notice/`automation:retry` next to affected controls and in Shop, not only the deleted tab. Keep feature-specific Retry buttons and unsupported-save status. Retarget `.lg03-panel` control/focus/edition rules in automation.css:1-20 to a reusable inline wrapper; preserve 40px minimum targets and internal pane scrolling. Do not impose its 760px whole-panel width on Floor.

## Money, grants and retention

Only A1-A5 have paid tiers today: levels 1/2/3 cost **1/2/4 Legacy stars** each. `quoteAutomationTier` and `buyAutomationTier`, ops.js:3401-3423, bind expected level/config, debit stars and publish only after acknowledged save. Keep these costs and transactions. A4's tiers change wallet margin, not its fixed 20-second interval. Base settings use `commitAutomation`, :3389-3399; do not route tier purchases through it. Ordinary helper actions still pay their existing letters/bananas through :3425-3485. A11 has no purchase/wallet authority, auto-challenge.js:1, :47-55.

First clears grant minimum tier 1 to hire/shop/coach/restore without reducing higher levels, automation.js:603-608. Garden/pitch/media/Muse clears improve attempts from 60 to 45 seconds, :33. Preserve all grants, proofs, settings, priority, reserves and net sequences. `reset()` at :401 clears runtime clocks/pending references, not saved ownership. Printing uses ops.js:1989-2013 and retained room projection in layers.js:97-107; legacy Printing also retains meta at ops.js:2124. Incomplete manual evidence is cleared or rebound; completed proof survives. Full Reset deliberately replaces state with `fresh()`, ops.js:4758. Do not change that explicit wipe.

If charging for bases is approved, add optional versioned ownership under retained `meta.automation`, with one acknowledged banana debit plus ownership grant through the existing wallet/save owner. A settings write is not payment. Reject stale quotes before mutation; preserve exact Retry and failed-Off suspension. Grandfather every currently earned base, existing helper record, paid tier and challenge grant at migration; preserve unknown/unsupported records and do not initialize absent config on render. Check pre-reset eligibility so an earned helper is not lost after a reset lowers a gate. Bought ownership must survive ordinary Printing/Imprint/Estate room resets, reload and edition switches; preserve existing reset retention rather than creating another reset path. Buying must not enable a helper or manufacture manual proof. Parent must verify Estate retention before leasing paid ownership.

One candidate table if **regular bananas** are chosen, **UNAPPROVED, unbalanced, no DB**. One-time base acquisition only; keep current gates/proofs, grandfathering and star tiers. These round numbers are review inputs, not pacing evidence.

| A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9 | A10 | A11 |
|---|---|---|---|---|---|---|---|---|---|---|
| 25k | 50k | 100k | 250k | 500k | 1m | 2m | 5m | 10m | 25m | 50m |

Owner chose Legacy stars after dispatch and approved 1 star for every base A1-A11 on 2026-10-16. This banana table is superseded. Existing paid tiers stay 1/2/4. Keep existing earned/accessed helpers and challenge grants usable without another charge. New purchase ownership and settings persist through progression resets. Purchase never turns a helper On or bypasses its manual proof or unlock gate.

## Copy and next lease

Within these controls, show name, On/Off, current rule and one actionable status. Move scheduler/tie-break explanations and repeated retention paragraphs from automation.js:588-594 into optional “How it works” details. Examples: “Spend under 10% of bananas” for Shop, “Reserve 25% of letters” for hire, “One garden action every 60s”. Preserve strict versus inclusive spending limits. Keep reset losses and durable-action/Off limits in A10/A11 consent dialogs, :305, :365; shorten wording without removing consent. Keep “Retry to save Off”, manual-proof locks and challenge pauses visible. Shorten only nearby Train/Words/Media/Muses introductions at ops.js:4237, :4281, :1199, :1318. No broad copy rewrite.

Next lease should separate relocation/copy from any approved paid-base migration. Verify one inline toggle/reserve/priority path, Shop tier purchase, failed save/Retry and retained old save, then actual Pixel/Classic mobile fit under README sizes. This research ran no browser, economy or runtime acceptance tests. Only this new document was written; no product files or other docs were modified by this researcher. Stop for parent handoff.
