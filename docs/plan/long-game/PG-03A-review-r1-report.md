# PG-03A independent review r1

**PASS for local default-off prototype acceptance.** No blocker found in the approved royalty delta. This is not final balance, default activation, deployment, or LG-13 pacing acceptance.

## Source and scope

- Read the full review and prototype briefs, plan/long-game README, skeleton policy, PG-03 owner/parent reviews and approval receipt, current source, original before/final patches, manifest, focused/native evidence, fixture failures, and controls.
- Current `ops.js` and `sw.js` SHA256 match the implementation manifest. The before-to-final patch adds only `royaltyScale` and its use by `bookRoy` and `royBase`; `sw.js` changes `imi-v40` to `imi-v41`. No other product delta appears in those patches. `node --check` passed for both files.
- The flag is exactly `pg03=1`; absent flag returns 1. The factor is `2*(1+.35*Math.min(S.printing,7))`, read from current `S`. Existing `ROY_BASE = TUNE.ROY_BASE || .00001` remains. No save/init/schema edit appears in the delta. Deal, sale, category, progression, passive, speed, online/offline, and rounding code is outside it.
- Independently compared the two five-minute control JSONs: stable `result` and `errors` are exactly equal; `result.meta` is `{}` in both. `identities` differ and are expressly excluded. This proves that bounded control, not wrapper equality or full-hour parity.

## Runtime proof

- **Fresh:** On a task-owned T3 incognito tab and isolated port 8399, sold `ape-in-the-cape` through the actual dev sale API. With the same shelf and Printing 0, actual `royBase()` was 0.0303/s with `pg03=1` and 0.01515/s after removing the query via `history.replaceState`: ratio 2. Stored meta remained `{}`. Fetched `ops.js`/`sw.js` hashes match disk and the cache names were `imi-v41` and `imi-v41-runtime`. See [royalty-smoke.json](evidence/PG-03/review-a-r1/royalty-smoke.json). This same-document test checks the live rate path, not cold reload behavior.
- **Reused, with current hashes:** Focused actual-function evidence reports factors 2/4.8/6.9/6.9 at Printings 0/4/7/12, book/aggregate parity with `TUNE.ROY_BASE=.000023`, actual Printing replacing `S` and clearing shelf/deals, Reprints duplicate refusal and acknowledged reload, and positive 630-second offline payout of 25 at 40% efficiency. Native evidence covers sale, Reprints, duplicate refusal, acknowledged reload and Shop/shelf/Records text at 360x560 in both editions. Parent viewed all six images; Shop and shelf rates are visible, while Records screenshots sit below the rate, so Records support is native computed text only.
- Original fixture failures remain recorded: wrong deal ID, synthetic Printing history refused on acknowledgement, and two pending award reconciliations on reload. Final fixtures use actual deal ID, reset Printing for the transaction, and settle awards before wallet comparison. They are fixture corrections, not product fixes or erased failures.

## Boundary

Higher `royBase` also raises royalty-derived daily prizes, pickups and repitch costs under existing formulas; this is disclosed in the approved prototype. Shared-training prices still need owner review. Final balance and LG-13 long-horizon/profile pacing are open. Physical phone and broad lifecycle/fault/cache-transition acceptance are unverified under the skeleton policy. No source changes, commits, activation, or deployment in this review.
