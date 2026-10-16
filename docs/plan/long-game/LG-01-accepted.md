# LG-01 accepted rewards and goals

Status: accepted locally by the orchestrator on 2026-10-12 after the owner-approved design, sequential implementation, different-model QA and parent source/raw/image review. Feature remains default off, enabled only by `?lg01a=1`. No commit, push, deployment or public rollout is authorized by this acceptance. LG-02 awaits next-task approval.

## Result and changed files

New `rewards.js` implements the approved 68-award catalogue and five first clears, a finite 109-Diamond-Banana existing-content allocation, deterministic ordinary rewards, stored Royalty Rush tokens, historical backfill and an earned/bought source ledger. All original award identifiers, names, predicates and +1% income remain. Future layers, spending, prices and payments are outside this task.

Historical awards receive Diamond-only backfill where assigned, with ordinary rewards explicitly waived. Known durable claim IDs prevent repeat delivery through reload, Retry and Printing. Initial migration persists before new progression. Unknown save metadata remains. A failed preparation holds progression without paying an unacknowledged claim; acknowledged retries use current-run deltas rather than restoring stale runs. Offline continuation conserves its cursor and work budgets. Golden tokens give the approved x7 royalties/division income for 15 game seconds and retain the specified Printing behavior.

Award cards show reward estimates or locked/waived receipts. Three stable unfinished goals respect reachable actions, progressive reveal and current/lifetime metrics. Phones replace the visible ticker slot with one Goals button; desktop retains its ticker. Awards contains full descriptions, quiet historical summary and token inventory. During save holds the existing effect/challenge chips move between the original status message and Retry. Bounded internal scrolling keeps Retry reachable; recovery restores the original nodes and hosts.

Production changes are `rewards.js`, narrow reward/persistence/away/goal/presentation additions in `ops.js`, `ops.css`, wallet acknowledgement and writer guards in `core.js`/`economy.js`, startup gates in `app.js`/`classic.js` and dependent `pickups.js`/`tour.js`/edition FX wrappers, script/startup ordering in `index.html`, `classic.html`, `tools/balance.html`, and `sw.js` at `imi-v27`. New focused reward tests, verification helpers, plans and evidence accompany them. LG-00 bot/profile work and unrelated dirty files are preserved, not attributed to this task.

## Accepted source and verification

The final repair was written by Sol6.1; independent acceptance review used GPT-6-Astra. Read [full runtime QA r1](LG-01-QA-runtime-r1.md), [focused QA r2](LG-01-QA-runtime-r2.md), and [final QA r3](LG-01-QA-runtime-r3.md) together with the prerequisite [A acceptance](LG-01A-accepted.md) and [B acceptance](LG-01B-accepted.md). Unchanged engine/catalogue lanes retain their recorded source boundaries; final r3 is focused repair verification, not a fresh exhaustive cross-product of every engine case.

| File | Accepted SHA-256 |
| --- | --- |
| rewards.js | b66a6273d2c43842322c078f4e60c4a492ef537f1c8ea3a0aba7a9cd3e8fd903 |
| ops.js | 89fb850f37f59af6ec9dda1d7a643f4f5bf2b2b0a1169f5e73e04bd0ecde1353 |
| ops.css | 6b083e4c399d50f1171e806f60ef4b32803f51a83f60318f74d86d742e9989b5 |
| sw.js | befff3f46666f0448d8a5abf37af1a14dc361d82e77d4b518ac4a206139c5079 |

- Syntax and executable shell/balance inline scripts pass. Final combined serial tests pass 101/101, exit 0. The first QA run remains a 100/101 failure: an existing away-baseline fixture timed out waiting for startup before its recovery assertion. Cause is undetermined. The unchanged-source rerun changed output paths only. Both reports remain intact.
- Fresh feature-disabled seed-1 active/collect run completes all 60 minutes. Parent independently compared raw reports, excluding only capturedAt, sourceCommit, sourceHashes, url and wallSeconds. Gameplay equality is exact; accepted canonical SHA is `5ef60fd274a856b386ae15ecebc5ac5b7ac3dfd37768bd08d4b060d8ee20a6a9`. No state, RNG or wallet field was removed.
- Parent recomputed all 72 audited current input hashes and 66 mapped original image hashes with zero mismatches. Receipt: [parent-acceptance-r3.json](evidence/LG-01/parent-acceptance-r3.json). This receipt precedes the acceptance-document updates.
- Real Core old-save/migration, claim failure/Retry/reload, exact-key recovery, unknown fields, writer contention and Printing pass within A/B/full QA coverage. Final native both-edition quota holds preserve state, keys, chip identities and deadlines through layout changes; successful actual Retry restores hosts synchronously and commits once. Saved recovery gives letters 1000, pool 51 and unchanged wallet 6250 in the named fixture.
- Parent personally opened the six current enabled Floor originals and mapped current enabled Awards/inventory plus disabled Floor/Awards sheets, covering all 30 settled views at 1280x800, 390x700 and 360x560 in both editions. Parent also opened current held small-phone/landscape originals, top/bottom enlarged-text and inset sheets, both-edition High/Low three-size media sheets and selected held reduced-motion images. No new material visual defect found. Independent QA additionally inspected every listed current media image.
- Geometry shows no document scroll or new rail/Goals collision, measured targets at least 40px, normal Goals height 44px and 125/150/200% CSS text heights 53.75/63.5/83px. Keyboard reaches the named scroll region, lower labels and visible Retry. These are CSS viewport/text/inset measurements.
- Fresh isolated Chrome sets actual reduced-motion preference before load in both editions, with matchMedia/Core/IMI agreement and no pane entry animation. Effects: Low and no-preference High controls are distinct. Fresh held hidden intervals exceed 32 seconds in both editions with unchanged state/keys/deadlines. Native bfcache returns pageshow.persisted=true; the departed document restores its hosts and refuses Retry/save/spend, and a fresh owner loads current keys. Temporary QA profiles/tab/server were cleaned; existing 8162 server remains.

## Amendments, historical evidence and limits

The owner explicitly approved content-driven phone Goals height for enlarged text and chips inside the Retry panel during reward-save holds. Both amendments are recorded in the design and execution log. They change presentation only. Original C/r1/r2 HOLD reports, frozen reds, startup timeout, setup failures and earlier source-bound results remain immutable. The frozen held-presentation red contains one failing new test; the second test was added later and is not claimed as a second red.

The quiet historical summary remains Awards-only with a discoverability limitation. Known Pixel 360 bottom-information wrapping predates the changes and remains an out-of-scope handoff. Full reset currently clears reward/premium namespaces; paid permanent ownership must be decided before Vault implementation. Web Lock support fails closed in the enabled flow; unsupported browsers do not gain an untested fallback.

Physical devices, native browser zoom, real safe areas, screen-reader/audio/hardware audition, real crashes, accounts, payments, deployment and public activation remain UNVERIFIED. Deferred Casual/Hardcore/Away full baseline endpoints, new-layer durations, the six-week target and 55%/80% premium pacing remain for LG-13. LG-00's historical-wallet exception remains the explicitly accepted exception, not retroactive evidence. Q5/Q6/Q8/Q9/Q10, catalogue/pack/Endless prices, legal copy and paid retention remain open. Art is retired; factory escape/minigames remain a separate future idea.

## Next task

[LG-02-diamond-vault.md](LG-02-diamond-vault.md) is a concrete documents-only initial design lease. After next-task approval, specify free-earned spending, permanent items, layout, clocks and purchase/recovery safety using the accepted ledger. Present unresolved costs/reset ownership/copy for owner review before runtime implementation. No checkout, backend, new art or Ops writer is authorized by that initial lease.
