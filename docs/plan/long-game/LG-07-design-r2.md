# LG-07 Estate and Complete Works, revision 2

2026-10-15. Proposed design for parent review, then owner approval. Every new mechanic and number below is unapproved. LG06 acceptance covers a local default-off skeleton, not mastery or pacing. Source anchors and contradictions are in [source basis](evidence/LG-07/design-r2/source-basis.md).

## Estate reset

Show Estate preview after three Imprints in the current Estate cycle. Endow requires five, introduction complete, displayed Printing >=8, and D>=360 awarded Legacy stars. T=`legacy.total`; B=new `estate.starBaseline`, initially zero; D=T-B. Gain `floor(sqrt(D/40))` Charters. Spending stars changes neither T nor D. Pending `starsNow()` is excluded. There is no automatic cash-out. First gain is three Charters, opening Archive curation immediately.

Each successful Estate sets both B and the Imprint foundation baseline to T. Stars already exchanged for Charters cannot generate new Seals after that reset. Subsequent Imprints still require 60 newly awarded stars each. No existing lifetime counter measures Estate cycles; add explicit optional fields rather than interpreting the Seal wallet as earnings.

Keep `layers.count` monotonically increasing as lifetime foundations. Add `localImprints`, initialized to existing count on first supported activation, incremented by founding and zeroed by Estate. Existing earned A6-A9 gates retain lifetime foundation semantics. Their eligibility does not disappear when local Imprints restart. This is a proposed resolution of the master's ambiguous retirement wording.

Add a monotonically increasing `resetEpoch`, advanced by every progression reset, distinct from displayed Printing, local Imprints and Estate count. Once initialized, the shared reset seam advances it even without feature flags; flag-off old saves acquire no new fields. New Folio, pitch, media, crop, helper-proof and reset intents bind epoch plus their retained sequence and content ID. Adopt new provenance schemas before enabling Estate. Preserve historical IDs and claims verbatim; recognize old pending formats only in their original recovery path, settle them before advancing epoch. Never reinterpret an old receipt as a new command. Do not reset media/cash sequences. A copied stale command fails epoch validation even when local Printing/Imprint numbers repeat.

| State | Estate action | Printing / Imprint afterward |
| --- | --- | --- |
| Room, wallet, run earnings, local Printing | Starting Bamboo, displayed1, Seed Money and Veteran Crew from retained Legacy; seed excluded from earnings | Existing room rules; no implied reset rewrite |
| Crew/coaching/Mk/upgrades, letters/trays/words | Reset | Existing room rules |
| Garden/crops, Muse inventory/seats, divisions, deals, shop/Publisher/lamp/market | Reset; permanent premium capacity/lamp entitlements remain | Existing room rules |
| Legacy wallet/total/purchased upgrades | Retain all; no new stars | Retain |
| Local Imprints / lifetime foundations | Zero / retain; highest historical values retained | Printing keeps both; foundation increments both |
| Current Seals | Zero, explicitly shown as sacrificed | Existing earning/spending |
| Genre press/Folio charter/Mixed shelf purchases | Retain paid investment; owned charter keeps Folio available immediately at Printing1 | Retain |
| Active genre | Clear, neutral until new foundation | Printing keeps; foundation permits choice |
| Stamps/shelf/gallery | Retain, including shelf effect; do not hide history | Retain |
| Written/editions/pitches | Written rolls into editions once; clear written; keep editions, pitch recipes and IDs | Existing rollover |
| Helpers, paid levels/floors/completed manual proof/settings | Retain; clear cadence and incomplete proof | Existing retention; local gates still apply where already defined |
| Twelve clears, awards, looks, stats, daily history | Retain; first clears remain first clears, never medals | Retain |
| Claims/locked descriptors/stored gold | Retain; settle pending work first; clear transient buffs | Existing retention |
| DB, entitlements, receipts, unknown premium fields | Retain verbatim; no new DB | Retain |
| Inspiration/fraction/tree/attempts/refill/session IDs | Retain; no refill, grant or factory earning | Retain |
| PG/training preferences/reserves | Retain; clear temporary work/focus | Existing retention |
| Charters/Archive/Works | Retain and add reset gain; no reward replay | Retain |

Estate first clear also prepares one existing L0 balanced Letters reward from projected starting Bamboo, under new permanent `layer:estate:first`. Use the existing three-minute floor50/cap5000 rule, locked before publication. No DB. Unsupported retained namespaces block the reset without erasing data.

## Archive curation

This vault is separate from the existing read-only manuscript catalogue and media releases. It endows finite earlier editions of the 16 authored readers only. Exclude generated, kids', library and media manuscripts. Available copies=`editions[id]-archive.usedCopies[id]`, never negative. Current written copies become eligible only after normal rollover. Keep editions/history intact; the new monotonic used-copy ledger records explicit sacrifices.

| Choice | Candidate rule |
| --- | --- |
| Capacity | Buy slot1 for1 Charter; slot2 for2; slot3 for4. Sequential, permanent; maximum three |
| Endow | Manually choose an available copy and empty slot; one title per vault. Permanently spend one copy. Preview lost future sale access and exact income |
| Opportunity cost | While curated, that title cannot be sold/reissued again. Already-written royalties remain until ordinary reset; no past sale/claim is removed |
| Restore pages | Deposit one complete original recipe from banked words for stage1, then two complete recipes for stage2. Separate manual confirmations; no partial deposits |
| Aging | Real elapsed time since endowment, backward-clamped, capped48h; stage0 immediately; stage1 requires12h plus first deposit; stage2 requires48h plus second deposit |
| Income | Lock authored default recipe pay P at endowment, before all live multipliers. Rate=`P/3600 * [1,2,4][stage]` bananas per productive game second |
| Exclusions | No market/genre/shelf/Legacy/deal/award/rush/typist multiplier on this rate; no Archive-on-Archive basis |
| Rearrange | Move between owned empty slots freely; no income/age change |
| Remove/swap | Explicitly retire old entry, stop income, retain memorial/history/used copy. No copy/Charter refund. New copy starts age0/stage0; no age transfer |

P is the built recipe value under default authored pay factors and x25 currency conversion, stored with basis version. It is not a current sale quote. Freeze existing entries across later tuning; never read current total income into P.

Income credits automatically, without collection clicks or storage cap. Online integrate rate over game seconds; offline integrate over counted real absence times game speed times existing away efficiency, each once. Integrate stage transitions chronologically. Real aging uses the full absence even beyond the lamp cap, but excluded absence earns nothing. Endless removes the time cap, not efficiency. Typist speed only helps produce restoration materials. No auto-endow, auto-deposit or auto-swap. Entries/age/material stages/income survive all progression resets. Reconcile and acknowledge income before removal or reset; retain fractional bananas until a 25-banana payout is possible.

First visit buys a slot, chooses an edition, sees its shelf withdrawal and income, then works toward the first page restoration. Archive restoration borrows Folio's explicit work targeting/protected ingredients and pauses Publisher while working. It never consumes old claims. No randomness, paid gates, expiring rewards or login streak is added.

### Curated-title availability clarification

One availability rule must cover manual sales/reissues, Publisher/ready lists, PG manual validation/resolution, Auto focus, keeper targets and upgrade ingredient protection. Curated titles remain visible as "Archived, retire entry to resume sales". Endowment atomically clears that title's temporary/manual focus, returns PG to its saved set and recomputes eligible targets/caches. PG excludes curated titles from its actionable set and denominator, labels the excluded count, and never counts withdrawal as a sale, award or historical completion. An all-excluded set waits with "All titles archived" and does not auto-advance. Other set completion/advancement uses available members, with exclusions displayed.

Keepers/practice/shared-training protection stop targeting the unavailable title. Restoration has its own explicit protected recipe while working. Retirement or swap restores the old title's ordinary eligibility immediately, still subject to written-this-run, desk, challenge and collection rules. It does not permit a second same-run sale or auto-reselect an old manual focus. Refresh PG membership and ingredients. Editions, sold history, awards and claims never change. Income remains the R1 proposal: Midsummer/Ape is 2,000:1 at every stage, an unresolved selection-balance risk requiring owner review.

## Retained reset/Archive arithmetic

| Example | Arithmetic and outcome |
| --- | --- |
| First Estate | Local Imprints5, Printing8, T360, B0, star wallet7 after spending353. D360 gives floor(sqrt(9))=3 Charters. Retain7 stars, T360 and upgrades; set Estate/Imprint baselines360. Buy slot1 for1, keep2 Charters. An earlier `ape-in-the-cape` copy has P=400*.15*25=1,500 bananas. Endow one of2 editions: history stays2, available copies1, future sale blocked while curated. Stage0 pays1,500/3,600=0.416667 bananas/game-second. Twelve real hours plus one recipe deposit unlock stage1, 0.833333/s. At speed2 and away efficiency.4, one counted hour wholly at stage1 earns2,400 bananas, not4,800. |
| Later Estate | Five new foundations, Printing8, T1800, B360. D1440 gives floor(sqrt(36))=6 Charters, four times the awarded stars for twice the currency. Baselines become1800. Old entry retains48h age/stage2 if both deposits were made. A new `midsummer-chimp` copy has P=600,000*.2*25=3,000,000, stage0 rate833.333333/s. Swap retires the Ape entry without restoring its consumed copy; Chimp starts age0. Its stage2 rate3,333.333333/s never feeds its own P. Repeat reset immediately gives D0 and is refused. |

## Complete Works

Preview at Printing4; unlock permanently at Estate3 plus two curated stage2 classics. No minigame/gold gate. Seek explicit approval for this seven-play monkey anthology, a narrowing of the master's undefined Complete Works scope.

| Order | Proposed play | Content status |
| --- | --- | --- |
| 1 | A Midsummer Night's Chimp | Existing 23-token/150-letter reader is demo only; final adaptation missing |
| 2 | The Chimpest | Library basis exists; final adaptation missing |
| 3 | Groomio and Juliet | Same |
| 4 | Ookthello | Same |
| 5 | Macaquebeth | Same |
| 6 | King Lemur | Same |
| 7 | Chimplet | Same; final signature/finish copy missing |

### One finite edition structure

Each final script must contain exactly 200 uppercase A-Z tokens totaling 1,000 letters after punctuation removal, including single-letter words. Approve each funny, kid-appropriate adaptation individually against its Library source. These are proposed editorial constraints, not existing texts. Freeze exact body, ordered tokens, per-letter bill, version/hash and 100-pass quantity before a rewarded release. A pass repeats that identical script in order; label progress "Edition 37/100, word 82/200". No new text per edition is required.

Manually introduce only the next play after signing its predecessor. Each play requires 100 passes, 20,000 token occurrences and 100,000 actual letters. Pass1 can consume ordinary drawer stock. Passes2-100 require 99,000 newly produced letters routed to this play after introduction. No later play can pre-accumulate eligible material. This finite production requirement prevents any size pre-introduction hoard from completing a play. Passes advance automatically; no 100 confirmation clicks.

Settle pending away output and other writers before acknowledging introduction. Start this play's fresh tray empty. While Works mode is active, route newly generated manual/hold/typist letters, including their actual typing bonuses, into a dedicated per-desk A-Z tray up to the remaining fresh bill for each letter. Route excess to the original drawer. No altered odds, guaranteed characters, retroactive stock tagging or second letter credit. Garden harvests, reward letters, conversions/ribbon replacements and transfers stay ordinary, never fresh. Offline newly generated typist batches use the same routing after existing cap, speed and efficiency exactly once. A pre-introduction checkpoint cannot mint fresh eligibility.

Pass1 debits whole next-word multisets from ordinary owned drawers, lowest desk first. Later passes debit only fresh trays, preserving order. LANTERNS costs eight letters, including two Ns. Batches stop at the first missing word; no banked-word/cash substitution. Supply for later passes may accumulate during pass1, but never for an unintroduced play. Progress and remaining bill share one ledger, so every letter is consumed once.

The fresh tray is reserved real inventory, excluded from upgrade/shared-training donors and keeper banking. Ordinary drawers retain normal upgrade costs, ingredient floors and Auto-hire reserves. Pass1 protects its next-word ingredients through the same training seam; it cannot consume another active goal's protected stock. Concurrent purchases recalculate against the current acknowledged inventory. Releasing tray letters returns them to their originating drawers and permanently surrenders their fresh status; replacing them requires new typing. No balance is cloned or deleted.

Works pauses keepers on participating desks and Publisher while working, preserves settings, and excludes simultaneous Folio/Archive work. Challenges pause Works. Exit restores ordinary production/settings; trays and consumed progress remain saved. Ordinary income continues; ordinary drawers/upgrades remain usable. Progress/trays survive Printing, Imprint and Estate as committed Works materials, while ordinary room letters follow their existing reset losses. Reset exits work mode. Re-enter manually. Offline can supply/advance only the current introduced play, never introduce, sign or start another.

### Two static production examples

Assume a hoard covers all 1,000 pass1 letters immediately. Inputs below are hypothetical useful fresh-letter throughput with the exact required mix, after all production effects. They are not raw random keystrokes or measured profiles. Real mix shortages, pauses and upgrades can increase elapsed time.

| Input | One play after hoard-funded pass1 | Seven plays, with manual introductions/signatures |
| --- | --- | --- |
| 10 useful letters/real second | 99,000/10 = 9,900 seconds = 165 productive minutes | 693,000/10 = 69,300 seconds = 1,155 productive minutes |
| 40 useful letters/real second | 99,000/40 = 2,475 seconds = 41.25 productive minutes | 693,000/40 = 17,325 seconds = 288.75 productive minutes |

At introduction zero fresh letters means zero completed fresh passes, regardless of hoard. These inputs demonstrate work, not natural days, six-week pacing or premium ratios. Fourfold throughput still quarters this bottleneck. Keep that contradiction explicit; recommend later measurement/tuning of work quantity before permanent release, without relaxing LG13 or adding paid/calendar waits.

### Demo, rewards and finish

Initial functional slice uses the existing 150-letter reader in a separate "Pipeline demo, no completed play" namespace. Exercise ordinary then fresh passes with a two-pass demo, 300 letters total. No permanent reward, playbill, anthology count, win or migration of demo progress to final scripts. Demo reset/repeat stays harmless. Before a permanent play ships, owner must approve its final text/manifest, 100-pass bill and reward descriptor. All seven final adaptations remain missing.

Retain R1's candidate reward: manually sign a fully completed final play for +1 percentage point automatic typist rate, additive Works cap7%, and a numbered text playbill. Amounts remain unapproved. Claim `works:<play-id>:first` with frozen content descriptor once; new content versions never repay it or silently change released work. Existing109DB unchanged; Estate50/play10 placeholders and any new DB stay separate. Clarify existing 16-reader "Complete Works" display without changing its award identity. Seven final signatures unlock saved anthology completion and Continue; ordinary play/resets stay available. Finish/playbill copy needs approval. Q8 NG+ and break-free exploration remain separate.

## Helpers, persistence and delivery

| Hook | Retained R1 proposal, separately approved |
| --- | --- |
| A10 | Estate1 and newly ACKed manual Printing; defaultOff. N30 real minutes, editable5-240. Check every60 active game seconds, >=1 pending star, no work/challenge/pending save. E=run.earned; k=floor(sqrt(E/12,500,000)); gap=(k+1)^2*12,500,000-E; estimate=gap/(60*R). R is non-reward income over300 visible real seconds. Full window/R>0 required; reset sample on reset/speed change. Print only estimate>N; preview metrics. Never auto-found/endow |
| A11 | Estate3 plus separately approved genuine gold mastery and manual introduction/clear. Owner-selected gold challenges, defaultOff, visible rules/rewards; no offline starts/new medals. Twelve first clears are not gold |
| Save | Optional versioned estate/archive/works namespaces absent when disabled; preserve unknown fields, refuse unsupported versions. Focused modules/Layers seams |
| Estate ACK | Settle pending work, including legacy recovery; freeze quote/seed/reward/epochs, durable intent, exact wallet replacement, acknowledged candidate, then publish |
| Archive ACK | Cost/material/entry/copy ledger and availability together; checkpoint income before retirement/reset |
| Works ACK | Introduction boundary; generation routing, exact debit and prefix/pass progress together; signature/reward together. Tray release moves inventory atomically |
| Failure | Keep old live effects until ACK; Retry same intent once. Cold gate must recognize all new pending types before boot/away/reset writers. No cross-key physical atomicity claim |

Retain identity-first LG08 sequencing, then Archive, non-rewarding Works demo, approved final scripts/finish. Exact future leases must cover Folio/Automation/Rewards/Core/gate provenance consumers before Estate, plus both editions/balanceHTML/SW for new scripts. No code lease here. Use internal panes, both styles,360x560/390x700/1280x800, >=40px controls, internal scrolling, Low/reduced motion; no art.

Six-week free Regular completion, provisional Estate18-30/capstone30+ and 2-3day loop ambitions remain unproved. LG13 must measure entry/completion and free/max-premium55% capstone/80% layers2/3, including uncapped-but-inefficient Away. No guarantee follows from fixed passes or48h aging. Q5/Q6/Q9/Q10 stay open. Inspiration remains optional/minigame-only; no new mastery/helper catalogue, payment/account decision or global redesign.

OWNER APPROVED 2026-10-15: Group A Estate/Archive local prototype and Group B staged capstone mechanics. Receipt evidence/LG-07/owner-approval-ab/receipt.json; boundary LG-07-approved-prototype.md. Final capstone texts/manifests/bills/permanent rewarded release, NG+, full A10/A11, mastery/newDB/default activation/commit/deploy remain excluded. Identity prerequisite first under LG-08A-reset-identity.md. Earlier proposal status retained as history.
