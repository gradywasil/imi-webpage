# LG-03B base Auto-shop

## Goal and authority

Extend the accepted framework with A3, unlocked at displayed Printing3, buying by a player-ordered priority list only when an item costs strictly less than10% of the wallet. On2026-10-14 the owner approved this first slice:20 active-game-second scheduling, the six existing room/market upgrades, hosted minigame operation, a shared one-hire-or-purchase-per-tick limit and offline shopping deferred. See evidence/LG-03/owner-approval-a3/receipt.json. No tiers, new challenges or prices are approved by this task.

## Files owned

- automation.js/.css for optional shop configuration, scheduling and controls.
- ops.js only for named SHOP quote/purchase APIs and reuse of its existing six-item manual lock/purchase path. Do not rewrite other buy families.
- sw.js cache version bump, strategy unchanged.
- NEW tools/long-game/lg03b-* helpers and exclusive output leaves if needed, NEW evidence/LG-03/implementation-a3-r1/** excluding parent dispatch.json, and this task's Status/Handoff.

Everything else is read-only, including shells already registered, minigames, Core/Economy/Rewards/Vault/gate/pickups/tour, historical tests/helpers/evidence/master plans and worktrees. Sole Ops owner, not alone; preserve others' edits. Every code line must justify its existence. No children, dependencies/build tooling, art, staging/commits/push/deploy/default activation.

## Required reading

Read docs/plan/README.md, long-game/README.md, premium-currency.md, skeleton-validation-policy.md, LG-03-owner-review.md, LG-03A-accepted.md, actual automation module and Ops SHOP/manual buy/config/tick/guard/reset paths. BALANCE.md supplies harness workflow. Do not work from this task alone.

## Exact deliverables

1. Keep independent `?lg03=1` default off. Missing new shop config means off without initialization writes. A1 still unlocks at Printing2; A3 gates at S.printing>=2 with completed intro. Show its Printing3 lock within Automation while A1 remains available.
2. First slice supports only Hold to type, Writing contracts, Paw metronome, Double touch, Literary agent and Market analyst. Default priority follows that order; player can reorder with accessible up/down buttons. Fixed spending limit is strict price <10% of current wallet before each purchase. No new prices, discounts, resource conversions or adjustable ceiling above10%. Skip owned, locked or unaffordable entries and buy the first eligible item in priority order. Do not wait forever behind a locked item. Other shop families remain manual.
3. Reuse current manual SHOP eligibility and purchase code with narrow named quote and buy-one APIs. Existing checks include Double touch needing Hold, agent/analyst needing two authored sales, and metronome/double/contracts needing Lagoon. Use actual current SHOP prices/cash units, wallet, locks and ownership at execution, not stale quote data. Purchase at most one item per serviced attempt and preserve manual shop behavior/RNG with all features off. No synthetic clicks or unrestricted buy/set-state API.
4. Add optional version1 shop config under S.meta.automation, preserving per-desk A1 settings and unknown metadata. Absent fields default safely; unsupported future config remains preserved and automation refused. Save toggles/priority through existing guarded commitAutomation expected/next and actual acknowledgement. Failed enable stays off; failed disable suspends locally immediately; a pending config blocks edits and automated spending with visible Retry. No second transaction system. Read current state across Printing; retain config and clear runtime cooldowns through existing reset behavior. Full-reset/Vault policy unchanged.
5. Approved A3 clock is20 visible active game seconds, including hosted minigames, with no offline or historical replay purchases. Each automation retains its own20-second cooldown; the module permits at most one automated economy mutation per tick. If both A1 and A3 are due, service one and keep the other due for the next eligible tick, using fair order. Never starve either or accelerate A1 beyond its approved limit. A serviced attempt resets its cooldown even when nothing is eligible; discard excess elapsed instead of catch-up bursts. Manual actions remain available under existing rules. No production/world/calendar/offline clocks change.
6. Show off/on, ordered items, current owned/locked/price status, fixed10% rule and active-only limitation in the existing pane. Keep A1 controls intact. Both editions match existing styling; internal scrolling only, targets>=40px, keyboard labels/focus and reduced-motion/Low. No art/animations/redesign. Settings/ownership are permanent across Printing but purchased run upgrades follow existing reset rules.

## Proportionate verification

Before edits capture leased hashes/dirty/index status and a NEW five-minute seed1 active/collect default control. After edits compare stable gameplay with explicit metadata exclusions, no full-hour claim. Check changed JS syntax.

Controlled main paths: Printing2 shop locked/Printing3 unlocked; off inert; first eligible priority purchase after20s; skip locked/owned item; strict10% boundary including equality refused; current wallet/locks rechecked; simultaneous A1/A3 due produces one mutation per tick and both eventually execute; selection/manual purchases preserved; config save/reload/Printing; one genuine refused config write and Retry/failed-disable suspension. Small enabled smoke must advance without manual SHOP purchases. Use actual APIs, no successful acknowledgement stubs. Label timing fixtures. No need to repeat all A1/minigame/premium tests.

Ordinary UI uses T3 preview first, own temporary origin/save; documented headless functional workflow allowed. Inspect actual both-edition screenshots at1280x800 and360x560;390 only for a distinct breakpoint or defect. Report carried versus emulated media. Preserve user8000/retained8354/unrelated services and saves. Stop only identity-verified own helpers. Do not execute old source-mutating helpers or write historical output leaves. Defer broad lifecycle/cache/profile/pacing/device suites. Stop when focused checks pass and hand back playable URLs/files/results/limits for one proportionate review.

## Status

ACCEPTED LOCALLY 2026-10-14 as an opt-in skeleton after one proportionate independent review. See LG-03B-accepted.md. No default activation, staging, commit or deployment.

## Handoff notes

Independent GPT-6 Sol review found no concrete A3 main-path blocker. Parent inspected10 settled images. Fresh hosted Return remains UNVERIFIED after its preserved timeout, without a demonstrated Auto-shop regression. Broader checks remain deferred; acceptance changes no product code or historical evidence.

Candidate changes only automation.js/.css, narrow Ops SHOP quote/buy-one/manual-lock reuse and sw.js imi-v37. Optional version1 shop config stays off when absent, preserves A1/unknown meta and survives Printing. Each A1/A3 has its own20-second active clock, fair simultaneous service and shared one-mutation-per-tick budget. Failed enable stays off; failed disable suspends locally; pending edits/spend pause until actual acknowledged Retry.

Evidence: `evidence/LG-03/implementation-a3-r1/`. New5-minute seed1 active/collect default reports match exactly with wrapper capture/source/timing metadata excluded. Focused controlled checks cover strict equality/+1 boundary, current wallet/locks, owned/locked skipping/order, A1 clock/selection preservation, off/replay/offline, config reload/actual Printing, real quota refusal/Retry/failed-disable and native Rewards progression guard. Two-minute enabled virtual Ops production smoke advances without manual SHOP. Native T3 hosted Banana Barrel practice bought Writing contracts using ordinary game time while iframe remained open; labelled Lagoon/wallet fixture, no successful ACK stub.

Personally opened settled Pixel/Classic screenshots at1280x800 and360x560, top/priority/A1 controls. Internal pane scrolling, no page/horizontal scroll and all15 automation controls >=40px passed geometry. T3 ordinary UI ran first on task-owned8356/save. Screens use carried default media, desktop UA and CSS viewport sizing, not physical-device or reduced-motion/Low proof. First tool/locator/Return timeouts and pre-settle screenshots are retained; Return interaction remains unverified and was not repaired outside lease.

Play URLs: `http://127.0.0.1:8356/index.html?lg03=1#play` and `http://127.0.0.1:8356/classic.html?lg03=1#play`; add `&mg01=1` for hosted Break Room. Own server retained for review, pid/identity recorded. Own native fixture shop was durably disabled before handoff. Existing8354/user8000/unrelated services and saves untouched. New helpers `tools/long-game/lg03b-*` only. No children, staging or commits.

Deferred: broad lifecycle/cache/profile matrices, true reduced-motion/Low, screen-reader/physical-device checks, long-horizon pacing and offline shopping. Other automations, tiers and challenges remain unapproved. Stop after this focused candidate; LG-04 remains the subsequent planned progression work.

Owner selected "Approve this Auto-shop slice (Recommended)" for the explicit Printing3/ordered-six-item/20-active-game-seconds/strict10-percent/hosted-play/shared-one-action-per-tick proposal with offline shopping deferred. Implement this slice without requesting approval again.

A1 accepted under LG-03A-accepted.md; cache imi-v36. No A2/A4/A5, tiers/star costs, new challenges/medals, premium or offline buying. Later LG-03 content stays staged and LG-04 Printings remains next after the automation skeleton. Approval of A3 does not approve the remaining LG-03-owner-review.md recommendations.
