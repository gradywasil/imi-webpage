# LG-07 Estate and Complete Works

2026-10-15. Proposed design for parent review, then owner approval. Every new mechanic and number below is unapproved. LG06 acceptance covers a local default-off skeleton, not mastery or pacing. Source anchors and contradictions are in [source basis](evidence/LG-07/design-r1/source-basis.md).

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

## Two worked reset/Archive examples

| Example | Arithmetic and outcome |
| --- | --- |
| First Estate | Local Imprints5, Printing8, T360, B0, star wallet7 after spending353. D360 gives floor(sqrt(9))=3 Charters. Retain7 stars, T360 and upgrades; set Estate/Imprint baselines360. Buy slot1 for1, keep2 Charters. An earlier `ape-in-the-cape` copy has P=400*.15*25=1,500 bananas. Endow one of2 editions: history stays2, available copies1, future sale blocked while curated. Stage0 pays1,500/3,600=0.416667 bananas/game-second. Twelve real hours plus one recipe deposit unlock stage1, 0.833333/s. At speed2 and away efficiency.4, one counted hour wholly at stage1 earns2,400 bananas, not4,800. |
| Later Estate | Five new foundations, Printing8, T1800, B360. D1440 gives floor(sqrt(36))=6 Charters, four times the awarded stars for twice the currency. Baselines become1800. Old entry retains48h age/stage2 if both deposits were made. A new `midsummer-chimp` copy has P=600,000*.2*25=3,000,000, stage0 rate833.333333/s. Swap retires the Ape entry without restoring its consumed copy; Chimp starts age0. Its stage2 rate3,333.333333/s never feeds its own P. Repeat reset immediately gives D0 and is refused. |

## Complete Works

Preview the locked anthology from Printing4. Unlock after Estate3 and two currently curated stage2 classics, without minigames or gold mastery. Once unlocked, retain access permanently. This is a proposed seven-play monkey anthology, not a claim to reproduce Shakespeare's entire canon. Obtain owner agreement to that scope before implementation.

| Order | Play/content basis | Status |
| --- | --- | --- |
| 1 | A Midsummer Night's Chimp, exact23-token/150-letter text in readers.js | Initial playable abridgement; not the 1,586-word Library Screech |
| 2 | The Chimpest | Library source exists; safe capstone adaptation missing |
| 3 | Groomio and Juliet | Same; final script requires editorial approval |
| 4 | Ookthello | Same |
| 5 | Macaquebeth | Same |
| 6 | King Lemur | Same |
| 7 | Chimplet | Same; final line/finish copy missing |

Recommend eventual100-200-word child-safe scripts for plays2-7, using those sources after review. These are content budgets, not approved texts or measured pacing. Existing poisoning, death and coercion passages cannot be imported unchanged. Initial one-play skeleton shows1/7 and cannot claim the final win. Never silently replace a published script's material requirements.

Manually select "Introduce this play" and enter Works mode. Show exact text, next word, letters missing and full remaining letter bill. Normalize body text to uppercase A-Z tokens, dropping punctuation; include single-letter words. Freeze ordered tokens/content version/hash before production. Consume all letters of the next word atomically from owned desk drawers, lowest desk index first, then advance one token. For LANTERNS, debit L/A/T/E/R/S once and N twice, eight letters total. No word-length gate, random transcript, cash conversion or consumption of banked words. A bounded batch stops at the first unaffordable word. Surplus letters stay in their drawers; no overflow transfers to an unintroduced play.

Keep normal manual/hold and typist letter generation and its existing speed effects. Works changes neither letter odds nor output; pause keepers/Publisher on participating desks while explicitly working, preserve preferences and restore on exit. Folio/Archive work and Works are mutually exclusive; pause Works during challenges. Ordinary passive income continues. Offline generates letters through the existing cap/speed/efficiency path, then debits only this introduced play's affordable prefix. It cannot introduce, claim or start the next play. Return at completion to manually sign the final line. A reset retains transcript progress, but resets unconsumed room letters and exits work mode.

Each signed play gives a permanent +1 percentage point automatic typist rate, additive within a new Works family, cap7%, plus a numbered text playbill using existing typography. No new art. The signature and benefit/claim ID `works:<play-id>:first` save together once, with content version locked in the descriptor. Content revisions never create repeat reward eligibility. Existing109DB is untouched. Stage all new DB allocations separately, including master Estate50/play10 placeholders.

After play7's final signature, show the anthology, seven playbills, saved completion and "Continue the room". Ordinary play/resets remain available; no automatic destructive reset. Q8 New Game+ is a separate optional future approval. Preserve purchases/history/Inspiration if later designed. The break-free idea remains later exploration.

## Later helpers and delivery

| Hook | Minimal later proposal, separately approved before code |
| --- | --- |
| A10 | Estate1 plus one newly acknowledged ordinary manual Printing. DefaultOff; N=30 real minutes, editable5-240. Every60 active game seconds, require >=1 pending star and no challenge/work/pending save. E=run.earned; k=floor(sqrt(E/12,500,000)); gap=(k+1)^2*12,500,000-E. Estimate minutes=gap/(60*R), where R is non-reward earned bananas over the last300 visible real seconds. Require full window and R>0; otherwise "insufficient sample", never Infinity-trigger. Print only if estimate>N; preview E/k/gap/R/estimate. Reset sample after reset/speed change. Never auto-found/endow |
| A11 | Estate3 plus separately designed, genuinely earned gold mastery and manual introduction/clear of chosen challenge. Only owner-selected gold challenges, defaultOff; visible restriction/reward preview; no offline starts or automatic new medals. Stage mastery design and implementation first. Twelve chDone flags provide no gold eligibility |

Optional versioned `meta.estate`, `meta.archive`, `meta.works` remain absent when disabled. Preserve unknown fields; reject unsupported owned versions. Use Layers for reset planning and focused Archive/Works modules through narrow Ops seams. No new generic transaction engine.

| ACK boundary | Fixed command obligation |
| --- | --- |
| Estate | Settle away/rewards/helpers/breaks; freeze quote, candidate, seed, first reward and epochs; durable intent, exact wallet replacement, acknowledged candidate, then publish |
| Archive | Capacity/endowment/restoration/removal commit cost or materials plus entry/copy ledger together; income checkpoint and exact wallet credit before effects publish |
| Works | Exact prefix debit/progress ACK together; signature and permanent reward ACK together; no callback-only reward |
| Failure | Old live effects until ACK; held Retry resumes same intent once. Cold gate recognizes pending Estate/Archive/Works before any flagless boot writer, away or reset. No claimed physical atomicity across storage keys |

Recommend LG08 slices: identity/retention plus Estate and first reward; Archive; first Works play; approved remaining scripts/finish. Each gets an exact one-writer file lease. Identity slice must include Folio/Automation/Rewards/Core/gate consumers before Estate opens. Helper designs and mastery follow separately. New scripts need both editions, balance HTML and SW registration. Future checks follow skeleton policy, not a new campaign now.

Use existing internal panes: Legacy > Estate > loss/retain > confirm; Archive > slot > sacrifice preview > restoration; Works > introduce > transcript > sign. Both styles,360x560/390x700/1280x800, >=40px targets, internal scroll only, Low/reduced motion. No art pipeline.

Six weeks remains the free Regular completion target; Estate18-30/capstone30+ are provisional. Aim for2-3days of choices per big loop through star thresholds, curated copies, restoration material and manuscript size. Forty-eight-hour classic aging is concurrent and unskippable by payment, not proof of a whole loop's duration. Pure speed2 and typist2 bottlenecks can approach25% time, violating55%/80%; sqrt alone cannot establish either ratio. The short first play also proves no duration. Tune material/threshold/content depth after measurement, rather than add pay-skippable waits or relax ratios. LG13 must measure entry and completion separately, all profiles including uncapped-but-inefficient Away, free/max premium55% capstone and80% layer2/3. Q5/Q6/Q9/Q10 remain open; this design needs no account, consumable, final price or absolute three-week policy.
