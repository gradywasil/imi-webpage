# LG-00 independent QA, capacity retry round 2b

**Verdict: HOLD.** The accelerated Deadline repair is not accepted. An independent final-source repro found that adding chronological boundaries changes offline production totals because production is rounded separately in each new segment. The test stopped at this defect as instructed; no source repair or further runtime testing was performed. LG-01 remains undispatched.

## Findings, ordered

1. **FAIL — Deadline chronology splitting changes total offline letter production.** In [`ops.js`](../../../ops.js), `simulateAway` builds the new per-sale/per-deadline boundaries at lines 1427–1431, then rounds production per segment with `Math.round` at line 1444. The parallel keeper path also uses per-segment `Math.ceil`/`Math.max(2, …)` at line 1454, so its total work may also vary with segmentation. The added boundaries must preserve total counted production while ordering sales; the current rounded batches do not.

   Independent repro: [`split-rounding-repro.mjs`](evidence/LG-00/qa-r2b/split-rounding-repro.mjs) runs the real `IMI.ops.simulateAway` from the existing balance harness at `http://127.0.0.1:8148/tools/balance.html`, with final `ops.js` hash `492797b34933346467ee00e9fae59a2c14971bf40da619115a078826c6d2e155`. It resets seed 1 and initializes the same six one-typist desks, empty banks, no keepers, speed provider 2, active tier-3 publisher, and a 60-second away interval. The paired case changes only whether the active challenge selects the timed chronological path. Neither case sold a title or raised an error.

   **Expected:** same total production for the same 60 real seconds, speed 2, and state; chronological boundaries only order production and sales. **Actual:** unsplit existing bulk path recorded 42 letters; timed split path recorded 38. Both report 60 seconds counted. This difference is attributable to applying `Math.round` at a different number of segment boundaries; it cannot be accepted as an exact-once speed result. Raw state and run inputs are retained in [`split-rounding-repro.json`](evidence/LG-00/qa-r2b/split-rounding-repro.json), with source/server and artifact hashes in [`review-receipt.json`](evidence/LG-00/qa-r2b/review-receipt.json).

## Acceptance matrix

| Gate | Result | Evidence / limit |
| --- | --- | --- |
| Accelerated Deadline chronology | **FAIL** | New repro proves counted production varies when chronological boundaries split the offline batches. The implementer’s eight chronology cases do not cover this path-invariance check. |
| Extra letters, words, keeper work, and income under resplitting | **FAIL / not fully quantified** | Letter production differs in the repro. Keeper batching also rounds per new interval (`ops.js:1454`); a dedicated bank/income repro was not run after the first defect. |
| Frozen default-speed parity, 190 source identities, and 90-minute comparison | **UNVERIFIED by round 2b** | Reviewed the candidate’s reports and manager receipts, but did not independently recompute their raw-derived comparisons before the reproduced defect. |
| Pickup lifetime at speeds 0.5, 1, 1.25, 2; provider changes and stale callbacks | **UNVERIFIED by round 2b** | Candidate receipts are present; independent native rerun not reached because review stopped at the production defect. |
| Regular finite endpoint and full authored/Legacy definition | **UNVERIFIED by round 2b** | Manager receipt reports the source-bound endpoint; no 73-minute trajectory was rerun or independently recomputed here. |
| Casual, Hardcore, Away finite endpoints | **OPEN** | Candidate records show guard-truncated Casual/Hardcore and a 30-day Away horizon; none is a finite endpoint. |
| Pixel/Classic images | **PASS for personal opening only** | Opened all six stable supplied captures at 1280×800, 390×700 and 360×560. This is image review only, not fresh browser/media acceptance. |
| Actual system reduced-motion media | **OPEN** | Candidate reports `matchMedia` false; runtime flag and Effects Low do not establish system-media behavior. |
| Old-save wallet provenance | **OPEN deviation** | The correctly versioned pre-edit wallet artifact remains unavailable; the later replay does not repair that historical gap. |
| Full-reset permanent-purchase policy | **Downstream decision** | No purchases exist; preserve for LG-02. |

## Recommendation

Keep LG-00 on hold. Correct the accelerated chronological calculation so split boundaries cannot add or remove production through per-segment rounding, then rerun this repro plus the retained chronology cases, specifically checking keeper words and sale payouts against expected-versus-actual totals. Preserve the frozen speed-1 ordering and the older goal-before-expiry behavior. After a corrected candidate is available, restart independent repair review for pickups, parity, saves, endpoint receipts, and remaining open gates. Do not dispatch LG-01 yet.

No production files, original evidence, manager receipts, manifests, or existing round-2 outputs were changed. New files are limited to this report and `evidence/LG-00/qa-r2b/**`.

