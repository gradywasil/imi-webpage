# LG-01 reward and three-goal design

Status: OWNER-APPROVED FOR IMPLEMENTATION, 2026-10-12, following independent design review r2 PASS. The owner approved the resulting catalogue, amounts, backfill, golden semantics, finite DB policy, layout and narrow persistence/startup scope. This document records the approved implementation contract; earlier proposal wording is its review history. Runtime acceptance remains required. Each worker must use its concrete slice lease. Original r1 QA/evidence remain history. See LG-01-QA-design-r2.md and execution.md.

## Scope and authority

Keep the existing 68 award IDs, names, tests, tier order and +1% income per award. Add one known reward to each and one first-clear reward to each of the four existing challenges and the first successful Second Printing. Goals point to awards and never pay a second reward. No 250-award expansion, new challenge, automation, layer, premium spending, store, checkout, prices, legal copy, art or factory escape game belongs here.

Owner authorization now covers this design and its narrowly expanded implementation scope. The proposed transaction pause, blocked second-tab and unsupported-lock behavior are approved for implementation, with independent runtime proof still required. Accepted LG-00 foundations alone do not prove these protocols. Premium purchases and their full-reset retention remain outside this approval.

Read in the required order: plan README, long-game README, premium-currency, execution, LG-00-accepted, LG-01 brief. Current source, BALANCE.md and existing LG-00 screenshots supply the implementation and layout constraints. Source/evidence receipts are in [evidence/LG-01/design-source-review.md](evidence/LG-01/design-source-review.md). Historical memory supplied only a reminder to retrieve live state and distinguish parity from enabled behavior; current acceptance and source supersede the old HOLD notes.

Q5 consumables, Q6 accounts/recovery, Q8 NG+, Q9 absolute premium minimum and Q10 prices stay open. Stored gameplay gold below does not decide whether premium consumables exist. No ads ever, gacha, new random prizes, countdown offers or pay-only progression. Automations remain earned, never sold. The deferred Casual/Hardcore/Away endpoints and historical-wallet exception remain exactly as accepted in LG-00.

## Owner decisions

The owner approved the following set on 2026-10-12. The recommendation wording below records what was reviewed; it is no longer a pending approval request. Later changes to these design decisions require owner review:

1. The explicit 68-row reward catalogue below, its minutes/floors/caps and draft Diamond amounts. Recommended existing-content pool is 109 DB, including first clears. It is a subset of the provisional capstone pool, not a promise about catalogue buying power.
2. Pay old awards and proven first clears only their fixed DB rewards; record other historical rewards as waived. This avoids a large retroactive cash/letter windfall. Alternatives are specified below.
3. Keep progression DB finite. Remove the proposed recurring daily DB line in a later owner-authorized plan reconciliation; leave today's ordinary daily crate unchanged. This document does not edit that spec or activate a daily reward.
4. One stored gold token means x7 royalties and division income for 15 game seconds. Never draw a reward from GOLD_FX, never count activation as a caught golden banana, never award DB from it.
5. Show all three goal summaries in one 44px Goals button on phones, replacing the news ticker's visible slot after the intro and Awards reveal. Preserve the ticker simulation. Show full goal rows in Awards. This is a proposed geometry tradeoff, not a verified new UI.
6. Review the acknowledged preparation, transaction pause and browser-owned single-writer proposals below, plus future Core/Economy and app.js/classic.js bootstrap lease additions. The Ops-only lease cannot guarantee interrupted cash claims or exclusion before wallet loading. Storage-failure and blocked-tab UX remain owner choices.
7. Acknowledge the full-reset interaction. Recommended LG-01 contract is once per continuing local save across Printings; current full reset starts over. Permanent purchases, paid receipts and ownership retention require an LG-02 owner decision before purchases exist. LG-01 must not settle that decision.

## Reward amounts and production basis

Letters, cash, stored gold and DB are mutually exclusive reward kinds per catalogue row. Existing +1% income remains additional. Quantities are in real game units. The following values are recommended drafts, including non-Diamond values. Event-time locking in these formulas means sampling the retry candidate; persistence becomes guaranteed only at the acknowledged boundary below.

| Tier | Letter minutes | Letter floor/cap | Cash minutes | Cash floor/cap |
| --- | ---: | ---: | ---: | ---: |
| Bronze | 3 | 50 / 5,000 | 5 | cash(250) / cash(10,000) |
| Silver | 5 | 50 / 20,000 | 10 | cash(250) / cash(1,000,000) |
| Gold | 10 | 50 / 100,000 | 30 | cash(250) / cash(100,000,000) |

Cash is `Economy.round(clamp(60 * minutes * B, floor, cap))`. Economy.scale is 25; cash(250) is 6,250 actual bananas. The caps are 250,000 / 25,000,000 / 2,500,000,000 actual bananas. Round to the nearest 25 actual bananas, ties upward, after bounding. Never multiply an already scaled rate by cash again. A silver cash reward at B=100 actual bananas/second is 60,000; at B=0 it is 6,250. Wallet balance does not enter the formula.

B is current sustained royalties plus sustained divisions per real second: `(royBase() + divBase()) * clock.speed()`. Include permanent shelf, deals, award income, Legacy, Printing and seated Muse factors already in these base functions. Exclude rights sale bursts, reward income, pickups, daily prizes, wallet interest, temporary Royalty Rush, Critic, premiere spikes and sampled recent earnings. This follows the pickup's sustained-income precedent rather than dailyPrize's wallet-dependent formula. The earning award's +1% is already present when its reward locks because Ops sets S.awards before emitting the event. Freeze that post-award state once; do not recursively rescale when payouts earn another award. Each award uses its own event snapshot. Reward effects may satisfy later awards in original source order or the next normal sweep, but the module never calls checkAwards recursively. The chain terminates because each of the 68 logical award claims can commit only once.

For letters choose the highest owned desk index, never the selected desk. Lock both index and quantity when earned. Define L as that desk's sustained expected letters per real second, excluding manual taps and hold, frenzy, snack, sluggishness and Golden Keys. Include owned crew, XP level, talent, coaching, rarity-scaled permanent traits, Quick-fingers, metronome, restoration, Legacy and challenge speed perks. Use the current sky and seated Muses for owl/rainy/Poe effects and the current storm slowdown. The formula is the existing autoRate calculation with only temporary pawSecs buff factors removed, multiplied by clock.speed(), with each lucky typist's contribution multiplied by its actual second-letter probability. Lucky's current extra-letter probability is `.05 * trMul(t)`. Thus L is `speed * deskMk(d) / sustainedPawSecs(d) * sum(typistSpeed(t) * (t.trait === 'lucky' ? 1 + .05 * trMul(t) : 1))`, or zero when paws=0. Here sustainedPawSecs is `PAW_BASE[index] * .85 ** d.up.fing * (S.metro ? .5 : 1) * (stormy() ? 2 : 1)`. Ribbon substitution exchanges letters and does not increase bundle size. S.dbl affects manual Hold and must not inflate this rate.

Letter quantity is `floor(clamp(60 * minutes * L, 50, tierCap))`. With no automatic crew the floor applies; no imaginary manual production rate. At L=2 a bronze reward gives 360 letters. Game speed is included exactly once; at speed 2 the same desk gives 720 before the cap. Offline efficiency and the away cap do not reduce the locked reward: it buys minutes of current online sustained capacity, whether earned online or in simulated-away work. Sample at the actual triggering event's source state, including its evaluated sky. An award detected only by checkAwards after an offline batch locks at that detection state; do not fabricate an earlier earning instant. A challenge event emitted within chronological accelerated offline sales locks there. Fixed DB firsts are unaffected by rate sampling. LG-00's accelerated chronological sale path must retain that ordering.

No random letters are rolled. Split the bundle equally across the 26 uppercase letters; distribute the integer remainder in A-to-Z order. The reward descriptor states "balanced letters". Add to the locked desk's letter pool through a bulk delivery method. Do not increment typed/manual/byLetter/harvest counters or call press, roll, bankWord or XP routines. Keepers can use the letters on their next normal step. No requested-letter variant is proposed in LG-01.

Cash credits count toward S.run.earned through the existing banana watcher and can advance Printing and wallet awards. They do not count as title sales, royalties, division income, pickup income or S.stats.lump. This effect must be measured. No additional income multiplier is applied to the reward itself.

Fixed amounts: one stored-gold token for each G row; 2 DB for each silver D row; 4 DB for each gold D row. Bronze never awards DB. L/C use the row's tier settings above. The complete source-derived catalogue follows later in this document.

## Before-earned display and payout locking

An unfinished L/C card reads "Reward now: ... balanced letters on [desk]" or "Reward now: ... bananas", followed by "Scales with your production. Amount set when earned; saved on commit." That is a current estimate. It is not an offer reserved when viewed, and there is no claim button. Fixed cards state the exact token effect or DB amount without a scaling qualifier. Keep +1% income visible on every card.

At the first qualifying event sample a versioned descriptor containing kind, integer amount, desk index if applicable, rate/minutes/floor/cap inputs, and origin. It becomes durably locked only at acknowledged preparation or atomic Ops commit below. After that boundary, income, desk selection/purchase and Printing cannot alter it. An earned card shows its receipt, including retroactive/waived status. Delivery is automatic even if the card was never viewed. `silent` suppresses celebration only; fresh offline awards still get ordinary rewards.

Use "Reward saved" only after durable claim commit succeeds. Preparation alone means pending delivery. If preparation fails, show "Progress not saved. Reward waiting to save"; the retry descriptor is volatile and can disappear on close/crash. Do not deliver from it or call it durably locked. Ops save's swallowed exception is not an acknowledgement. No toast or animation starts the transaction.

## Claim identifiers and state lifecycle

Stable logical IDs have no amount or catalogue version in their key: `award:l100`, `challenge:vowel:first`, `challenge:haiku:first`, `challenge:hands:first`, `challenge:timed:first`, `layer:printing:first`. Changing a draft amount later must never create a second claim. The current `s1` award called First Printing is a title sale; it is distinct from both `pr1` and layer:printing:first.

Recommended optional S.rewards fields: version=1; catalogueVersion=1; claims map; migration={version, policy, oldAwardIds, oldChallengeIds, oldPrinting}; goals={version, ids}; storedGold={tokens keyed by original claim ID}; activeGold={remainingGameMs, activationId} or null. Each claim stores status prepared/committed/waived, origin, locked descriptor and, for cash, a monotonic wallet transaction number. Unknown fields and future claims survive normalization. Null/invalid quantities must be held for repair, never silently recredited or deleted. Claims and gold token maps are bounded by the finite catalogue. Goals store at most three IDs.

Registration remains pre-Ops through window.__OPS_EXTENSIONS, but enabled bootstrap first acquires the writer lock below. Under ownership, load fresh wallet/Ops state, normalize without losing unknown fields, recover durable prepared claims, record migration and reconcile milestones before startup checkAwards(true), welcomeBack, daily work or runtime writers. Every callback retrieves api.state(); never cache S across replacement. Printing preserves claims/goals/tokens and pays the layer first only for previousPrinting=0 with no claim. Resolve prior transactions before doPrint replaces S or retires the wallet. Full reset starts a new local timeline under the proposed LG-01 policy, with an acknowledged empty migration snapshot before new rewards. Paid ownership remains open.

Durably record the first-enabled migration snapshot of old award IDs, chDone and printing, even when empty, before any new reward events. On failure, do not run startup awards, away work or gameplay. Retry the same snapshot while this process lives; after death, restart from the last saved game, which never progressed past this gate. Existing claims override backfill. Only membership in the durable snapshot establishes historical eligibility. Later durable awards outside it are new, including silent awards.

Normal eligibility is absent -> acknowledged prepared descriptor -> committed, or one atomic Ops commit for Ops-only delivery. Collect the event sample together with its award boolean or first-clear milestone. Every enabled save route, including periodic, explicit, lifecycle and migration writes, must refuse to persist newly eligible milestones without their descriptor or committed/waived receipt. Current unlockAward sets its boolean before the event; the handler and save guard must cooperate. Include challenge saves and Printing. Failed/abandoned challenges and repeat clears create no new first claim.

For letters, DB and tokens, recommend one synchronous Ops transaction containing the milestone, descriptor, destination delta and committed receipt. Persist the complete candidate imi-ops-v1 snapshot through an explicit success/failure acknowledgement before publishing destination changes or success. An acknowledged prepared snapshot may precede delivery. Prepared claims retry fixed descriptors; committed/waived claims do nothing on repeat events/reload. Gold consumption and remainder likewise commit together before activation. Failed delivery rolls back only its staged delta/status, retaining durable preparation. Failed initial preparation retains only a volatile retry sample and gives no balance/token.

Recommended failure UX is a narrow transaction pause while migration, preparation or cross-key reconciliation is unresolved. Hold enabled progression, wallet mutation, Printing/reset and ordinary writes; allow quiet read-only display and Retry. This needs owner approval. Preserve qualifying in-memory progress and the volatile descriptor for same-process retry, and resume the interrupted operation once without replaying a whole away batch. Roll back only reward destination changes, never unrelated earlier earnings or the whole game. If the owner rejects the pause, revise the guarantee before implementation.

The hold must reach the enclosing Ops operation immediately, including an award sweep, challenge completion or ongoing away batch; blocking only the next timer is insufficient. Any durable preparation during away work must checkpoint already-counted progress so later recovery cannot replay the full absence. Unprocessed work is not reported saved. The future narrow Ops lease must cover this stop/continuation boundary; its interrupted-away behavior requires proof alongside reward recovery.

Later-load order is fresh load under the lock, durable prepared recovery, acknowledged migration if absent, milestone reconciliation, then startup/progression. Compare award booleans, chDone and printing with claims and the durable snapshot. A durable nonhistorical milestone missing metadata is an invariant failure, never historical backfill. For fixed DB/G, propose a new-origin recovery receipt at its existing fixed value after durable preparation. First inspect source-tagged DB credits and token/activation receipts: reconstruct a consistent existing delivery receipt without recredit, and hold contradictory/ambiguous evidence for repair. For L/C, hold for repair and owner disposition: there is no prior sampled desk/rate/amount to recover, so do not invent it or silently sample today's rate. A wholly unacknowledged event lost with unsaved progress may qualify anew under its ordinary test after reload and sample then. Lost challenge/Printing progress is not guaranteed to reappear.

Cash crosses Core's imi-score and Ops' imi-ops-v1. Core schedules persistence 1.5 seconds later; Ops/Economy swallow failures. `bananas.earn(); api.save()` cannot acknowledge a transaction. Propose a synchronous Core/Economy adapter persisting score plus monotonic reward marker together, exposing the loaded acknowledgement and preserving it in ordinary writes/migration. Under the pause, finish pending ordinary wallet saves and acknowledge the current Ops baseline, including unrelated run earnings, before preparation. Failure keeps the pause. This needs a future lease, not a general repair of legacy unsaved-state behavior.

Cash protocol: persist milestone plus prepared claim with fixed amount, expected marker n, preceding marker and current Printing identity; credit and persist wallet score plus n; persist committed Ops receipt, reward run-earned delta and a per-claim delta-applied marker together. The watcher must apply that delta once. Recovery seeing wallet n commits missing Ops receipt/delta without recredit; the preceding marker permits fixed-credit retry. Unexplained marker/Printing mismatch stays blocked for repair. Add only a missing reward delta to the current loaded run. Never restore S.run.earned from a stale preparation snapshot or replay unrelated earnings. Future progression, rewards, Printing/reset and other wallet/Ops writes, including delayed Core saves and visibility/unload callbacks, wait for reconciliation.

Wallet-write failure undoes only the staged credit and its watcher delta/lastBananas change; durable Ops preparation remains. Wallet n with failed Ops commit stays prepared and paused, then reconciles without another credit. Celebrate/report saved only after final Ops acknowledgement. L/DB/G delivery begins at atomic Ops commit; cash's descriptor becomes durable at preparation and its delivery completes only after both keys reconcile. These are owner proposals requiring later failure-injection proof. Unacknowledged progress shares the game's unsaved-state limitation. Storage deletion, external save rollback and full reset can start/repeat a timeline. No hardware-durability, account-level exactly-once, anti-cheat or paid-ownership promise follows.

## Single-writer startup and lifecycle proposal

Recommend a browser-owned exclusive Web Lock named `imi-save-writer`, shared by pixel/classic for the same-origin save. rewards.js owns acquisition/guard, using `mode: 'exclusive', ifAvailable: true` before any enabled-game/Core wallet read, Economy migration/write, Ops load, startup reward/offline/daily work or runtime writer. Keep its callback promise pending throughout ownership. Only the holder progresses, mutates or saves. A second tab stays quietly blocked and nonwriting with Retry; it never boots a second game with rewards merely disabled. Retry acquires then loads fresh state before progression. This UX remains an owner proposal.

Source requires boot gates at app.js:184 and classic.js:177: Core.boot reaches core.js:90 Economy.loadScore before Ops. Shell sequencing must also prevent ops.js and dependent runtime scripts evaluating while acquisition is pending/refused; delaying Core.boot alone is insufficient. Load rewards.js's guard before edition bootstraps and use one continuation after acquisition. Future lease additions must name app.js/classic.js, shell ordering and narrow Core/Economy writer checks. No art redesign, polyfill or dependency. Feature-disabled execution keeps the original synchronous legacy path, without lock, reward state or RNG/timing changes.

Hidden tabs retain ownership; permitted hidden saves and resume/away processing remain guarded. Never force-steal by timeout/heartbeat while a hidden/frozen tab can still write. On pagehide, stop writers, attempt guarded final persistence, cancel writer callbacks, then settle the lock callback to release. Before bfcache restoration restarts any timer/action/save/away work, treat ownership as absent, reacquire and reload both keys/recover fresh state. Lock loss or request rejection blocks writers and stale callbacks; stale memory cannot save or resume. Navigation/reload uses the same fresh acquisition. Browser unloading/agent termination releases ownership; no stale-lock timestamp is needed. Unload saving remains best effort.

If navigator.locks is absent, acquisition rejects or the callback receives no lock, enabled gameplay fails closed before wallet/Ops reads/writes. Show a quiet limitation and Retry where useful. Do not substitute localStorage compare-and-swap or silently boot legacy gameplay. Runtime support is UNVERIFIED. This coordinates cooperating pages in shared storage scope, not legacy/old builds or external writers bypassing the guard; disabled parity does not prove safe mixed-build play.

The [W3C Web Locks draft](https://www.w3.org/TR/web-locks/) supplies the API contract: section 3.2.1 conditional acquisition, section 2.4 callback settlement, section 2.6 unloading/agent termination cleanup and section 4.2 release. Browser compatibility is not asserted. Later acceptance must prove both-edition boot exclusion/contention, hidden resume, close/crash, bfcache/reload fresh state, unsupported/rejected requests and stale-callback suppression.

## Diamond ledger

Recommended S.prem additions, merged with all future/unknown fields: version=1; earned=0; bought=0; earnedTotal=0; boughtTotal=0; spentEarned=0; spentBought=0; credits={sourceId: {source, amount, origin}}. Balances and totals are nonnegative safe integers. A reward uses its logical claim ID as sourceId and source='earned'; the premium balance plus credit entry plus reward claim commit in the same Ops snapshot. Bought remains untouched by LG-01. Reserve receipt-prefixed IDs for a later verified payment adapter; do not implement that adapter or accept arbitrary bought-credit actions.

Display total=earned+bought only once total>=1, in Awards for LG-01. Do not add a tiny second mobile rail balance in this task. The premium top-bar display belongs to later Vault layout work. Source balances support future earned-first spending: debit min(cost, earned), then the remainder from bought, update the corresponding spent totals. No debit, undo or purchase UI is implemented now. Existing premium fields with unverifiable provenance stay intact and require migration review; never guess that an old aggregate was bought or zero it.

## Stored golden reward

G always grants one "Stored Royalty Rush: x7 royalties and division income for 15 game seconds" token. Store a token keyed by its source claim. Activate manually from an Awards inventory row, one 44px minimum button with the exact effect in text. No expiry while stored, no wall-clock deadline, no daily eligibility and no roulette. A token is a gameplay award, never sold. Activation does not increase S.gold, gold-catching awards, typed counters or first-clear IDs. Use current production rates while active; there is no cash lump or DB drop.

Consume the token and persist remainingGameMs=15000 atomically. Permit one reward rush at a time. Disable activation while either native Royalty Rush or reward rush is active; if a native rush arrives during a reward rush, take max(7,7), never x49 and never add durations. The two timers expire independently. Critics retain their existing half-income multiplier. The reward timer consumes simulated game milliseconds online and offline, respecting actual permitted away work/caps. Speed multiplies time once. Slice an offline interval at reward expiry before paying royalties/divisions; do not apply x7 to an entire long absence. Stored tokens survive Printing. Recommend ending an active rush on Printing, as today's buffs are cleared, without refunding the used token; clear after reset hooks as appropriate. Save/reload continues remaining time and processes absence before UI display. Effects Low/reduced motion retain text and disable any new decoration.

The offline rule requires the pre/during-away seam already specified in "Minimum later seams" to be explicitly leased. Current ops.js:1507 emits away after payout and cannot implement it. Split only permitted simulated work at persisted remainingGameMs, initially 15000. Consume min(remainder, permitted game milliseconds); x7 applies only to that portion. Efficiency scales payout, not timer duration. Preserve original away caps, clock/Deadline chronology, batch rounding/keeper budgets, sampled sky/rates and RNG traversal across the boundary. Do not rerun simulateAway as independently sampled absences, boost the whole absence, consume capped-out time or resample a claim to repair timing. Keep the disabled path exact. Offline rush expiry/conservation remain UNVERIFIED until implemented and independently accepted; no timing rule or away endpoint is waived.

Q5 stays open: this fixed earned token does not authorize premium consumables. Owner approval is required for this particular stored-golden outcome and consumption/reset policy.

## First clears and finite DB pool

| Claim | Existing condition | Proposed fixed reward |
| --- | --- | ---: |
| layer:printing:first | First successful doPrint, previousPrinting=0 | 5 DB |
| challenge:vowel:first | Vowel Drought first done | 5 DB |
| challenge:haiku:first | Haiku Run first done | 7 DB |
| challenge:hands:first | No Hands first done | 7 DB |
| challenge:timed:first | Deadline first done within its existing clock | 9 DB |

Keep existing stars and permanent challenge perks. Award pr1/ch1/ch4 rewards are separate advertised milestones, not duplicates of the first-clear claim. Total first-clear DB is 33. Eight silver awards at 2 DB and fifteen gold awards at 4 DB add 76, giving a finite 109 DB existing-content maximum per continuing local save. No repeated Printing, repeated challenge or goal-selection reward exists. No future-layer payout is assigned here.

premium-currency.md, "Currency rules", proposes about 1,000 free DB by capstone with none from repeatable grind, but also day-7 daily +1 up to four/month. An uncapped monthly source is infinite over continued play. long-game README, "New objectives", also anticipates Seasons and commissions; execution.md explicitly requires resolving finite versus recurring income before LG-01 payouts. Recommend reserving all DB for once-only progression claims. Daily crate keeps ordinary cash/buff behavior; later commissions/Seasons should give ordinary gameplay rewards unless the owner approves a different DB policy. An alternative is a fixed lifetime daily DB allowance with durable IDs and a cap inside the same total pool, but it creates a calendar incentive and is not recommended. A genuinely recurring allowance requires explicitly abandoning the finite-pool promise. No daily implementation or plan rewrite is in this lease.

The draft 1,000 pool and catalogue fraction remain future tuning targets. LG-01 does not allocate the other 891 DB, finalize catalogue prices or decide Q9. Six-week free Regular pacing and mandatory 55% capstone / 80% layer ratios still apply in LG-13.

## Historical backfill

Snapshot old awards, chDone and printing only on the first enabled load with no migration marker, under the writer lock. Acknowledge persistence before startup checkAwards or any new reward events, as required in "Claim identifiers and state lifecycle". Only this durable snapshot defines historical eligibility. Do not use silent=true, lastSeen age or missing claims as a proxy. Existing claims retain their state; later durable milestones outside the snapshot use new-origin reconciliation, never historical waiver.

| Option | Historical awards/firsts | Consequence |
| --- | --- | --- |
| A, recommended | Pay fixed DB for proven DB milestones; waive L/C/G with an explicit historical receipt | Existing players retain free progression currency without a large burst at today's high rates |
| B | Full catalogue, lock L/C at first enabled load's rates and caps | Can produce many caps simultaneously, accelerate stars and erase early goals; requires its own pacing approval |
| C | Waive all historical rewards | Smallest economy change but veterans lose finite DB opportunities permanently |

Under A an old all-awards/four-challenges/Printing save receives at most 109 DB once. Show one quiet summary after intro/modal dismissal; no 68-toast storm. Old achievements and their income stay unchanged. Waived cards read "Earned before rewards were added" and their +1% income, never a claim button. First-clear history is accepted only from chDone and printing>=1, not inferred from an unrelated award. Repeat loads do not retroactively issue waived rewards. Owners may later approve a one-time correction claim with a distinct published policy ID; catalogue version changes alone never repay claims.

## Three meaningful unfinished goals

Use unfinished awards only. Never add a task to claim an automatically paid reward. Unlock the compact Goals button after intro.done and the existing records gate; before that keep the authored introduction, focus-title guidance and news intact. This intentionally refines the older "always-visible" plan to respect the shipped progressive reveal. Once revealed, retain it through Printing using intro completion and persistent awards/history. When fewer than three eligible unfinished awards exist show the available number and "More goals as your room grows"; never invent or duplicate goals. At full completion show "All 68 awards earned".

Store selected IDs. Keep each while unfinished and reachable, without sorting by live percentage every render. On a completion replace only its slot, preserving other goals and focus. On Printing remove only goals whose prerequisite department/tool is no longer reachable in the current run. Reveal does not auto-navigate or override S.focus. Deterministic tie-break is original AWARDS order, then ID. No timers or shuffle button.

Candidate prerequisites use current tabVisible and actual resources. Typing/streak/words need intro.done; shelf awards need Titles visible; kids/library awards also need their existing reading list/band availability; desks need the predecessor desk owned and its purchase allowed by the challenge; crew/coaching/restoration need Train/Shop and an owned eligible desk; gold requires native spawn eligibility; media/Muse/garden/deal/printing/challenge goals require their existing department and unlock condition. Exclude historical waived/committed awards and already-earned booleans. Do not recommend intentional rotten touching r1 or waiting for weather/night, away time or pickups as primary goals. These awards remain earnable and displayed in Awards; hiding them from suggestions does not alter their tests.

Choose one current typing/word/crew improvement, one publishing/shelf improvement, and one expansion/room/Legacy improvement when available. Within a family prefer the next unfinished threshold in each chain, then a condition within the current accessible department, then original order. Fill missing families with other accessible primary candidates in that order, avoiding two thresholds from the same chain. Lock this selection until a specified replacement event. Provide a private deterministic goal descriptor table in rewards.js, keyed by award ID; Ops supplies current metric/prerequisite descriptors rather than copying achievement tests across modules.

Concrete first-sale example, if those awards remain unfinished: "Type 1K letters 430/1K", "Sell 4 titles 1/4", "Hire 8 typists 1/8". If l1k is already earned, choose its next accessible threshold. Store lifetime counters where the award uses stats/best, and current-run holdings/shelf counts where its actual test uses them. After Printing a shelf goal can lose progress; label it "this printing" in Awards. Do not falsely present editions history as progress toward current-run s16. Cap displayed numerator at its goal target. Binary goals show an action such as "Install Hibiscus" and no fabricated percentage.

Each goal opens Awards with its card in view and full requirement/reward; it can offer a separate "Go to Train/Titles/..." action only if that department is visible. It never buys, changes keeper focus or spends. All summaries are keyboard-readable, with full accessible text. Announce earned/replaced goals politely once, not every progress tick.

## Footprint and existing visual world

Personally opened the four historical Low/actual-reduced-motion manager-final phone PNGs in both editions, at 390x700 and 360x560. Their source identities match the current Ops/CSS/Core hashes. These are early Floor views with no crew, not new reward UI acceptance. The existing pixel 360x560 bottom information text visibly wraps into fragments; record that as an out-of-scope existing layout limitation. Do not fix it during LG-01 design.

Source geometry: collapsed rail is 60px plus left safe inset. Root widths are 330/300px at the named phones with zero inset; wrap padding takes 20px, leaving 310/280px. The Floor stage flexes with min-height:0; only other panes scroll. The screenshot news slot is about 38px pixel and 35px classic, including its frame. Adding a 132px three-row strip above the Floor would materially shrink the machine, so reject that layout.

Phones: a single 44px-high at normal text size, full-content-width Goals button occupies the news slot after reveal; no added flex gap. The owner approved content-driven height growth with enlarged text on 2026-10-12, while retaining all three summaries. Normal text remains13px/13px, with39px content and5px combined inset; at125% text-only enlargement the measured minimum is53.75px, about54px. Let line and host heights follow enlarged content rather than clip, hide or shrink it. Each line has short action text on the left and progress on the right, min-width:0 and ellipsis only for the action. Full goal name, requirement and preview remain in its accessible description and Awards. Use readable Pixelify Sans body text at13px normal size in pixel, Fredoka at13px normal size in classic; keep existing card headings. Do not fit three separate40px buttons across280px. Approval changes the fixed-height rule only; other footprint, no-page-scroll and accessibility requirements remain.

Proposed height cost compared with the inspected Floor is about +6px pixel or +9px classic at both phones, not +52 or +140px. Preserve news simulation and its ticker element, but hide its visible slot only while Goals occupies it; Awards Log may show existing logged news if already supported, otherwise do not invent a news history. Returning all goals complete can restore the ticker after displaying the completion summary in Awards. At desktop 1280x800, use one 44px row with three individually actionable goal buttons above the pane; keep ticker, adding at most 52px including existing gap. Width with the current 268px rail is 1,012px root / 992px wrap content before pane padding. All desktop goal targets are at least 40px high.

Awards has three 44px-minimum full rows at its top in the scrolling pane, followed by the existing 68-card list. Cards gain a reward line; no nested tiny claim controls. A separate stored-gold inventory uses one full-width activation button per available effect, not one button per token. DB balance is quiet text here. The minimum future markup is one stable goal host in .o-wrap and stable reward-line/card ID anchors in renderRecords. Use morph and afterRender with bounded keyed nodes, not innerHTML replacement or query-every-card work every tick.

Pixel uses existing dark frame, cream text, leaf green and hard edges; classic uses wood-dark borders, rounded corners and the same cream/green palette. Reuse existing icons if needed, with text as the meaning. No new art. No autonomous flashing or progress animation is needed. Low and reduced motion are static. Selected/focus states use the existing focus treatment. Card descriptions wrap inside the Awards pane; no page scroll. Never overlay the typewriter, focus-title strip, buff bar, keyboard or rail.

Owner-approved held presentation amendment2026-10-12: throughout a reward-save hold, place existing buff/challenge chips in normal flow inside the existing Retry panel, between its message and Retry button. Preserve labels/displayed time/progress, readable wrapping/fonts/focus; use bounded internal content space if necessary, keep Retry visible/reachable40px+ and no page scroll. Normal gameplay retains its floating bar; recovery restores the original host. Startup failures without loaded game/buffs retain message/Retry. This replaces special floating-held positioning only; no extra modal, reward, animation, automatic Retry, gameplay/save/reconciliation/timer/ownership change. See LG-01-held-layout-disposition.md and the specific repair-r3 lease. Approved goal normal/enlarged sizing and all other acceptance rules remain.

These dimensions are a source-grounded proposal. They do not prove fit with long names, six desks, active buffs, safe insets, open rail, text zoom or new reward markup. Those states require the later six screenshots and DOM measurements. If three lines cannot remain readable at these exact sizes, implementation must return the design for revision, not hide a goal or shrink text below the proposed size.

## Minimum later seams

Accepted api.state/save/mark/morph/setTab, init/reset/award/challenge/away/afterRender and namespaced delegated actions are the starting point. Load rewards.js before ops.js in both shells and balance.html and register one rewards extension through window.__OPS_EXTENSIONS. Never use IMI.ops.dev as production integration.

Propose only these narrow additions inside Ops, with implementations beside their existing private functions:

- Read-only rewardBasis returns sustained banana rate, per-owned-desk expected letter rate, highest owned index and clock speed, with temporary factors excluded as specified.
- Read-only goal descriptors for the existing catalogue return id, tier, name, description, source order, progress/target, family, destination and eligibility. AWARDS and its test functions stay private. Rewards.js owns reward assignments and stable goal selection.
- Deliver locked letters in bulk without typing/XP statistics, and activate the separate deterministic stored rush. Cash delivery delegates to the acknowledged wallet adapter; no new economy pricing function.
- Two tiny markup anchors, reward-line rendering callback/slot and goal host. Existing award event remains id/tier/silent; do not expect name/test/claim data in it. Rendering gets descriptors through the read API.
- A game-time tick/away duration boundary for persisted rush remainder, including offline slicing at expiry. The existing away event arrives after work and cannot retrospectively apply a buff correctly; a narrowly approved before/during-away hook is necessary. No speed provider belongs to rewards.js.

No general mutation API, new tab, public AWARDS array or large Ops catalogue is needed. Shared logic/state machine and writer guard live in rewards.js; CSS belongs to ops.css. Future lease must explicitly cover acknowledged Ops writes and milestone metadata gating, narrow Core/Economy acknowledgement/marker guards, app.js/classic.js boot gates, both shell startup sequencing, dependent writers and before/during-away slicing. tools/balance.html and sw.js integration remain later leased work. All remain read-only now; init/after-away hooks alone are insufficient.

## Later acceptance, separate from this design

Capture new before-task source hashes, raw reports, baseline save and staged/untracked status before runtime edits. This design has run no reward, balance or payout tests.

1. Disabled feature registers no effective reward hooks, adds no reward state, awards no DB/letters/cash/gold, consumes no random numbers and changes no gameplay timing. Namespace defaults must match LG-00 exactly. Compare frozen raw-derived full canonical gameplay fields with the new disabled build using accepted seeds/profiles and complete durations. Do not remove reward fields, wallet fields or RNG positions to force a pass. CSS/DOM/source metadata is separately reviewed.
2. Enabled behavior gets separate deterministic reports. Check every assignment and tier against the 68 source rows, original tests/names/+1%, first-sale versus first-Printing IDs, each challenge done/fail/abandon/repeat and all fixed DB totals. Verify cash floor/caps/25-unit ties, letter rate/floor/caps/distribution/highest-owned desk, speed 0.5/1/1.25/2, zero crew/income, changing sky, buffs and offline chronology. Compare expected enabled payouts, not legacy equality.
3. Inject failure/interruption before and after migration, prepare, wallet and Ops acknowledgements. Prove no delivery/saved report before commit; process death can lose unacknowledged progress. Verify same-process fixed retries, durable descriptor retries, milestone metadata on every save route, missing L/C sample holds, fixed new-origin reconciliation, no stale run-earned overwrite and no cash recredit. Cover repeated/silent events, historical migration, Printing/reset, gold, lifecycle writes and unknown namespaces/versioned wallet. Prove both-edition lock boot exclusion, hidden resume, close/crash, bfcache fresh load, unsupported/rejected requests and stale callback blocking. No crash-safe reward claim until adapters/guards/recovery pass.
4. Golden tests prove exact 15 game seconds online/away, no roulette/RNG consumption, no caught-gold/stat inflation, x7 without x49, independent native rush overlap, Critic interaction, disabled activation and no reuse of consumed tokens.
5. Goals prove stable IDs across renders/reload, only one-slot replacement, family/chain diversity, no already-earned or inaccessible goals, no goal double payout, progressive reveal, correct current/lifetime metrics and complete/less-than-three handling.
6. Fresh enabled/disabled screenshots in both editions at 1280x800, 390x700 and 360x560. Manager opens all six enabled captures and measures document=viewport, Floor no internal scroll, target rectangles>=40px, full-three-goal visibility, keyboard reachability, no clipping and safe insets. Include six desks, long goal text, active buff/overlays, Low and actual pre-load reduced-motion media. Historical captures cannot substitute for these.
7. Measure enabled pacing with identical policies and raw payout breakdowns: first hire/sale/machine, first star/Printing, library growth, letter stock and active rush time. Cash rewards can trigger wallet awards and stars; bundles can buy crew or feed books; rush scales royalties; fixed DB has no speed effect until LG-02 spending. Bounded reports remain bounded. Retuning source economy or bot policy needs a separate lease, not an LG-01 parity exception.
8. LG-13 retains deferred profile endpoints, free/premium final targets and the unchanged historical-wallet exception. Syntax and required existing economy checks run only once runtime changes are authorized. No implementation acceptance follows from this document.

## Catalogue legend

L = balanced letters at the tier's formula; C = cash at the tier's formula; G = one fixed stored Royalty Rush token; D = fixed draft DB, silver 2 or gold 4. The rows below copy ID/name/tier from current UTF-8 Ops source. Every row also keeps its original +1% income and condition.

| ID | Existing name | Tier | Proposed reward |
| --- | --- | --- | --- |
| l100 | Warming Up | Bronze | L |
| l1k | Ink Fingers | Bronze | L |
| l10k | Ribbon Burner | Silver | L |
| l100k | Infinite Monkey | Gold | D 4 DB |
| c10 | Tap Dancer | Bronze | L |
| c50 | Key Storm | Silver | G |
| c100 | Thumb Marathon | Silver | L |
| c200 | Monkey Mania | Gold | G |
| w10 | Word Hoarder | Bronze | L |
| w100 | Lexicon | Silver | L |
| w1k | Thesaurus | Gold | L |
| s1 | First Printing | Bronze | C |
| s4 | Back List | Bronze | C |
| s8 | Prolific | Silver | D 2 DB |
| s12 | Bestselling Author | Silver | D 2 DB |
| s16 | The Complete Works | Gold | D 4 DB |
| k10 | Story Time | Bronze | C |
| k50 | Reading Corner | Silver | D 2 DB |
| k300 | Library Card | Gold | D 4 DB |
| m25 | Middle Shelf | Bronze | C |
| m150 | Stacks Regular | Silver | D 2 DB |
| m900 | Head Librarian | Gold | D 4 DB |
| d1 | In the Pink | Bronze | C |
| d2 | Making Waves | Silver | D 2 DB |
| d3 | Sweet as Honey | Gold | D 4 DB |
| p8 | Typing Pool | Bronze | L |
| p20 | Open-Plan Office | Silver | D 2 DB |
| p40 | Monkey Business | Gold | D 4 DB |
| g1 | Shiny! | Bronze | G |
| g10 | Banana Spotter | Silver | G |
| g25 | Gold Rush | Gold | G |
| r1 | Rotten Luck | Bronze | L |
| deal | Mogul | Gold | D 4 DB |
| storm | Stormy Weather | Silver | L |
| night | Night Owl | Bronze | L |
| b10k | Banana Stand | Bronze | C |
| b1m | Banana Republic | Silver | C |
| b1b | Banana Empire | Gold | C |
| keep | Auto Clerk | Bronze | L |
| hold | Heavy Hitter | Bronze | C |
| away1 | Welcome Back | Bronze | C |
| lamp3 | Night Light | Silver | C |
| mk15 | Market Timing | Silver | C |
| mk19 | Perfect Pitch | Gold | D 4 DB |
| lv5 | Promotion | Bronze | L |
| lv10 | Master Typist | Silver | L |
| hat1 | Dapper | Bronze | L |
| d4 | Orchid Season | Gold | D 4 DB |
| d5 | Moonstruck | Gold | D 4 DB |
| p1 | Pitch Perfect | Bronze | C |
| p10 | Idea Factory | Silver | L |
| p50 | Literary Empire | Gold | D 4 DB |
| mk1 | Restoration Drama | Bronze | C |
| mk3 | Concours d'Elegance | Silver | C |
| dv1 | On Air | Bronze | C |
| dv100 | Back Catalogue | Silver | C |
| dv5 | Media Mogul | Gold | D 4 DB |
| dvall | The Whole Catalogue | Gold | D 4 DB |
| mu1 | Patron of the Arts | Bronze | C |
| mu3 | Full Salon | Silver | C |
| gar1 | Green Thumb | Bronze | L |
| gar500 | Letter Farmer | Silver | L |
| pr1 | Second Printing | Silver | D 2 DB |
| pr3 | Collector's Edition | Gold | D 4 DB |
| ch1 | Constraint Satisfied | Silver | D 2 DB |
| ch4 | Oulipian | Gold | D 4 DB |
| roy100 | Passive Income | Silver | C |
| roy1m | Mailbox Money | Silver | C |
