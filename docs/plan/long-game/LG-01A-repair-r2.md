# LG-01A repair r2: Preserve unsupported saved records

## Goal

Repair the enabled-startup data-loss finding in LG-01A-QA-r1.md. Unsupported existing wallet/state representations must block startup before replacement, migration or backup writes. Preserve the default-off legacy behavior exactly. This is a narrow repair within the approved save-preservation contract, not a new design.

## Files owned

economy.js, only enabled-path parsing/shape preflight and load guards; sw.js, cache-version bump only; this repair brief and LG-01A-save-and-startup.md Status/Handoff only; new evidence/LG-01/repair-a-r2/** with narrowly needed verification helpers there. Every other file, source, plan, prior report/evidence and fixture is read-only. Core/Rewards/Ops changes need an amended lease before editing. No stage, commit, push, deployment, install or delegation. Preserve unrelated work; you are not alone. Every line must justify its existence.

## Files it may read

docs/plan/README.md, long-game README, premium-currency.md, execution.md, approved LG-01-reward-design.md, LG-01A-save-and-startup.md, LG-01A-QA-r1.md, current Economy/Core/Rewards load order, sealed LG-01A sources/reports/fixtures and native QA shape reproductions. Read authority and task before source.

## Exact deliverables

1. Seal current Economy/SW bytes and relevant unchanged source identities before edits. Retain raw unsupported-shape reproductions and fixture values. Use existing complete before/candidate/independent reports as the sealed disabled regression references; do not overwrite them or reconstruct capture history.
2. In the enabled path, distinguish a missing localStorage key from an existing JSON null or unsupported parsed representation. Accept only the established legacy nonnegative finite numeric wallet or a supported versioned wallet object with valid score; preserve unknown metadata inside accepted objects. Reject strings, booleans, arrays, null and unsupported objects without resetting them to zero. For Ops accept an object save compatible with the existing optional-field migration; reject existing null/primitives/arrays and parse failures rather than treating them as a new game. Missing keys still support a genuine fresh start.
3. Validate both existing records before either is migrated, backed up or replaced. This includes a convertible legacy wallet paired with invalid Ops, and invalid wallet paired with a convertible Ops save. Failed enabled startup/Retry must leave both raw records and existing unrelated storage untouched. Keep validation narrow; do not invent a new general save schema or silently normalize unknown future data.
4. Preserve supported numeric wallet conversion, object Ops migration, valid versioned saves, unknown wallet/state/namespace data and marker metadata. Do not change economy version, multiplier, denomination, prices, reward markers or startup UX. Existing startup error/Retry should handle the rejected load.
5. Bump imi-v16 cache version because served Economy changes. No other runtime edits.

## Acceptance criteria

node --check changed JS, existing economy tests, and one fresh complete sixty-minute seed-1 active/collect disabled harness run compared against the sealed pre-edit baseline, raw-derived with only the five approved provenance exclusions. Never remove gameplay/wallet/state/RNG fields.

Actual T3 native cases in both editions: the two reported overwrites now block with byte-identical retained records; wallet string/array/boolean/null/unsupported object and Ops string/number/boolean/null/array/parse error; absent keys; valid versioned records; supported legacy conversion; valid legacy record paired with an invalid other record; Retry still preserves bytes; valid unknown fields/markers remain. Source identities and loaded functions must match the new Economy. Focused meaningful loader tests may supplement native evidence but must be labeled; mocks cannot replace actual startup reproductions.

No new CSS or markup; original twelve UI captures retain their original source identities and are not relabeled as fresh. Open a fresh native blocked-startup capture in each edition to verify error UI remains reviewable. Actual hidden-tab/bfcache/reduced-motion lanes remain UNVERIFIED until the separate pending browser choice and tests; do not call the slice accepted.

## How to verify

Use T3 preview_status then preview_open for native browser work. Only task-owned fixture origins/tabs, never owner saves. Revalidate servers before use; identified native task server at 127.0.0.1:8162 was PID 68788. Headless economy harness uses the already authorized external Puppeteer module and Chrome, no installs. Do not use an alternate native browser unless a new owner choice is explicitly recorded. Save new evidence under repair-a-r2 with exact source identities, raw failures and commands. Retain r1 HOLD and all old evidence unchanged.

## Status

HOLD, REPAIR STOPPED AT SOURCE LEASE BOUNDARY, 2026-10-12. Economy preflight and imi-v17 are implemented, syntax and five economy tests pass, and the fresh complete disabled sixty-minute report matches the sealed baseline. Native initial Classic string-wallet and Pixel array-Ops cases retain raw data. Classic Retry reload exposed a bootstrap error-path failure outside this Economy-only lease. The required repeated-Retry and complete both-edition native matrix are not verified. CANDIDATE REPAIR READY FOR INDEPENDENT REVIEW is not asserted. QA r1 remains HOLD; missing native lifecycle/media checks are not waived.

## Handoff notes

The r1 review's fresh disabled raw report independently matches the sealed baseline. Manager recomputation and stored pretty canonical artifact both hash to 5ef60fd274a856b386ae15ecebc5ac5b7ac3dfd37768bd08d4b060d8ee20a6a9. R1 report quotes a3e015... for its independent normalization; later review should distinguish that representation from the stored pretty artifact, without rewriting the historical report. No reward engine or next slice is authorized by this repair.

Repair evidence: [repair-a-r2/HANDOFF.md](evidence/LG-01/repair-a-r2/HANDOFF.md). Before-edit source bytes/status and raw r1 repro inputs are sealed there. Enabled Economy reads and validates both existing records before either loader can back up or migrate; disabled branches and serialization are retained. The native Pixel case pairs wallet raw `25` with the reported Ops array and preserves both without creating a backup. Fresh blocked-startup images in both editions were opened.

Stop condition: the first Classic Retry clicked successfully and reloaded, retaining all fixture storage. The resulting document reported ownership with no IMI and no status panel; the second Retry click timed out because no button existed. Retained raw snapshot/state/action evidence is retry-diagnostic-failure.json. Existing Rewards.start invokes an already-owned callback directly, outside acquire's startup catch. This is the source-based explanation for the timing-sensitive missing panel, not a repaired or independently accepted diagnosis. Rewards/bootstrap are read-only in this lease. Manager must disposition or amend that lease before repairing the error route and resuming the remaining native checks. No alternate browser, source outside the lease, reward engine or next slice was used.
