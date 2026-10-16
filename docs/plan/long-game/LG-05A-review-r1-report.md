# LG-05A independent Folio review r1

**Disposition: FAIL for local Folio acceptance; HOLD for a narrow repair and review.** The approved cash binding path passed a fresh controlled smoke, but the shipped gallery Reorder action does not reorder the displayed completed series during its current Printing. No product files were changed by this review.

## Scope and identity

Reviewed the full LG-05A lease, approved LG-05 design and owner/parent records, approval receipt, plan READMEs, skeleton policy, actual task-only diff, and current `folio.js`, `ops.js`, `rewards.js`, Core/Economy save seams, CSS and script registration. The candidate is Group A only behind `lg05folio=1` plus `lg01a=1`; Imprints, genres and shelf are separate leases. Current SHA-256 matches all ten entries in `implementation-folio-r1/final-hashes.json` (eight product files and two helpers). `folio.js`, `ops.js`, `rewards.js` and `sw.js` pass `node --check`. The task-only diff is relative to the lease-start dirty bytes, not Git HEAD. The incidental Rewards encoding delta is absent from the final task diff.

## Finding

**F1 — Gallery Reorder has no visible effect on a series bound in the current Printing.** In `folio.js:94-97`, `proposal('reorder')` chooses `f.completed[id]` before `f.gallery[id]` and reverses only that record's leaves. The selected reading order in the card renders from `f.selection.leaves` (`folio.js:117-119`); the gallery renders from `f.gallery[id].leaves` (`folio.js:133`). Thus the action reports success and saves a changed completion record, while both displayed orders stay the same. This misses the approved free reading/reordering of completed work.

Reproduction on a fresh controlled Printing 4 save: own Bamboo, bank THE×2/APE×1/CAP×1, select Pocket leaves The ape. then The cap. with cash, Bind, then invoke the gallery's **Reorder Pocket tales** action. It returns `{ok:true}`. The completion leaves become `[1,0]`, while selection and gallery remain `[0,1]`; neither displayed reading order changes. The precise before/after is in `evidence/LG-05/review-folio-r1/reorder-followup.json`. This is a Folio presentation/state defect, not a cash duplication finding. No fix was attempted under this read-only review lease.

## Bounded lane results

| Lane | Result | Basis |
| --- | --- | --- |
| Exact series, quotes, owned desks, scope | PASS | Source has three approved series and leaf captions, two distinct ordered leaves, summed uppercase word counts, required ingredient desks, 6,250/12,500/25,000 real cash or 250/500/750 same chosen letters on an owned desk. No added book, royalty, DB, stat or reward-catalogue path in the task diff. |
| Work, production and Printing seams | PASS within controlled scope | Source keeps six desks, free displayed Printing 4 unlock, explicit work/Return, manual-book exclusion, existing keeper/practice/training hooks and online/away Publisher pause. Reused current-source 37-check receipt covers keeper, protected training, away, manual/PG, Printing, flagless identity, unknown metadata and future-version refusal. |
| Cash bind and duplicate/reload | PASS | Fresh Rewards-enabled native Core/Economy browser fixture on isolated port 8391: one Pocket bind debited exactly THE×2/APE×1/CAP×1, credited 6,250 wallet bananas and run earnings, completed once, left claims and typing stats unchanged; duplicate refused without mutation; reload retained wallet, debit and completion. `fresh-cash-smoke.json` records results and executing response hashes. |
| Partial-write recovery and marker provenance | PASS within reused controlled proof | Source uses Folio prepare, wallet credit marker and acknowledged Ops commit, with held intent on a refused final save; `final-r2-checks.json` exercises refused cash commit/reload, letter prepare/Retry, and last cash-head recognition across Printing. This is logical acknowledgement across split stores, not physical atomicity. No new fault campaign was run. |
| Completed gallery Reorder | **FAIL** | Fresh narrow follow-up reproduces F1 above. |
| Phone UI | PASS within reused visual proof | Opened all four final Pixel/Classic 360 top/preview PNGs. Folio cards use the internal pane, visible Return/Back and readable binding preview. Parent measured 44px button/select targets and no body scroll on current CSS. No material visual blocker seen in these images. |
| Default control | PASS for five-minute stable fields | Independently compared `before-default.json` with `final-default.json`: reports equal, metadata `{}` equal, errors `[]` equal. This is not full-hour or natural-play proof. |
| Broader acceptance | UNVERIFIED | Full reset execution, natural pacing, physical devices, broader accessibility/motion/lifecycle, cache transition and full-hour equality remain outside this skeleton review. |

The original fixture unload/missing reward history/default keeper/arithmetic expectation failures and initial stale CSS/entrance capture remain retained in the implementation evidence. Later passing receipts do not replace those first-failure records. The reused 37 checks were not rerun; product/helper hashes and fresh executing response hashes matched current disk bytes. The review did not run the 318/135/70/209 suites or create a new UI matrix.

## Evidence and cleanup

- Fresh cash smoke: `evidence/LG-05/review-folio-r1/fresh-cash-smoke.json`.
- Narrow Reorder reproduction: `evidence/LG-05/review-folio-r1/reorder-followup.json`.
- Review helper: `tools/long-game/lg05a-review-smoke.cjs`; it writes exclusive new evidence leaves and uses a disposable browser context with service workers bypassed.
- Reused candidate: `evidence/LG-05/implementation-folio-r1/{task-only.diff,final-hashes.json,final-r2-checks.json,final-verification.json,before-default.json,final-default.json}` and four final 360 PNGs.

The review used an incognito T3 preview tab and a task-owned 127.0.0.1:8391 server. The server was stopped after the checks. T3 exposed no tab-close operation; the hidden review tab remains isolated in the incognito profile, with the review origin no longer served. Owner ports 8000/8354/8356/8358, tabs and saves were not used. No product/task/status/history file, old helper or old evidence was written, and no stage, commit, deployment or default activation occurred.

**Readiness:** cash and recovery are credible as bounded candidate evidence, but local Folio acceptance should wait for the completed gallery Reorder behavior to match the approved contract and for one narrow verification of that repair. No Imprint work follows from this review.
