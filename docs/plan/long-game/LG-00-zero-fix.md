# LG-00 final zero-duration edge

Status: independent validation PASS. Overall acceptance remains conditional on the three requested owner gate decisions. See LG-00-QA-zero-r4.md.

The full Astra review supports positive-duration arithmetic, native pickups, extension lifecycle, functional saves, default parity and historical Regular applicability. It identified only a small direct-call discrepancy at `simulateAway(0)`: the legacy ordinary path serves its minimum two keeper words while the activated Deadline path serves none.

The manager reproduced this with an asserted, uninstrumented real-game fixture before changing source. The original and fixed receipts are under `evidence/LG-00/manager-zero-fix/`. The before assertion failed with 0 versus 2 words; the fixed assertion passes with equal inventories, crew and wallet and no runtime/HTTP errors.

Only the timed-selection predicate changes from `multiplier !== 1 && chal('timed')` to `sec > 0 && multiplier !== 1 && chal('timed')`, with its explanatory comment. Zero-duration calls therefore retain the old bulk behavior. Positive-duration and all default-one paths select exactly the same branches as before. Service-worker version changes from imi-v14 to imi-v15. No payout, rounding, price, efficiency, save, pickup, UI, profile or art change accompanies this fix.

`source-boundary.json` compares the full source bytes against the retained previous source and permits only that exact comment/predicate replacement. Changed JS syntax and the five economy tests pass. Independent validation will check this boundary and a fresh legacy report before acceptance.

## Owner decisions requested

- Defer the unfinished Casual/Hardcore/Away finite baseline endpoints to LG-13, preserving their current UNVERIFIED status, or complete them before LG-00 acceptance.
- Explicitly authorize isolated headless Chrome/Puppeteer actual reduced-motion media testing because available T3 preview has no media-emulation control; otherwise keep that media gate unverified.
- Accept the disclosed historical correctly versioned pre-edit wallet capture exception, with the original artifact retained, or keep that capture gate failed.

Elapsed time or a recommended option is not approval. No dependent work or LG-01 dispatch proceeds without the required answer.
