# Repairs: the catalogue

Things break on IMI's Floor, and every problem has its own repair: a WarioWare-style microgame with one verb, 8-15 s long (the three big ones 40-45 s), graded 0 to 1. A typist from the problem's desk plays it over the Floor (`.mg01-overlay`, hosted through `hosted-bridge.js`).

- **Writing one:** [REPAIRS.md](REPAIRS.md). The reference is `repairs/leak.js`.
- **Checking one:** `node tools/repairs/check-repair.mjs <id> --level 0,.5,1`. It saves screenshots outside the repo in `.plan/shots/<id>/`.
- **Trying one by hand:** `minigames/index.html`, the dev index, links `repair.html?game=<id>` for every id.
- **Where things live:**
  - The economy (family, scope, penalty, spawn weight and gate, pay, tune-ups, copy) is `REPAIRS` in `../minigame-progression.js`.
  - The runner's list (title, verb, seconds, size, stage) is `MGRepair.LIST` in `repair-kit.js`.
  - The numbers are in `../BALANCE.md`, under Repairs.

The 15 Break Room games (Banana Barrel, Key Whack, Coconut Shuffle and the rest) moved to monkey-hub as arcade cabinets (`monkey-hub/public/arcade/`). Their notes are in git history (`minigames/CONCEPTS.md` before this change).

## The verdict
Grades are mapped by `MG.verdictOf`, using the thresholds in `MG.VERDICT_AT`:

| Grade | Verdict | What happens |
| --- | --- | --- |
| 0, or the repair was never touched | NOT FIXED | Nothing changes. |
| Under .4 | PATCHED | The problem's time left is halved. |
| .4 to under .85 | FIXED | The problem clears and the machine is tuned up. |
| .85 or more | PERFECT | The problem clears with a bigger tune-up. |

A problem pays once, and the first repair that scores above 0 is paid. A patched problem can be repaired again without pay to clear it. Quitting part-way pays nothing and leaves the problem.

## The twenty repairs

Scope is *desk* (one machine), *all* (every machine) or *global* (from a rotten banana). The weight is the spawn weight. Long repairs are about 1 spawn in 9 and never come twice in a row.

| id | Family | Scope | Verb | The repair | Weight / gate |
| --- | --- | --- | --- | --- | --- |
| leak | Keepers | desk | CATCH | Slide a bucket under the drips (they speed up and split); a full bucket must be flicked out of the window; puddles that land cost grade | 2, ×4 in rain |
| jam | Speed | desk | SCRUB | Rub blotted typebar heads clean with a rag before the ink sets | 3 |
| keys | Speed | desk | POP | Tap the stuck-down keys back up; clean keys are decoys | 2 |
| carriage | Speed | desk | SLAM | Yank the return lever when the swinging needle is in the green zone, three times; the zone shrinks | 2 |
| ribbon | Speed | desk | REEL | Circle-drag the spool to wind the slack; too fast redlines the tension and snaps a loop back out (keyboard: alternate ←/→) | 2 |
| overheat | Speed | desk | FAN | Mash or tap to wave a palm leaf; keep the needle out of the red as heat spikes come in | 2 |
| nap | Keepers | desk | WAKE | Drop a banana on the snoozing keeper's nose at the bottom of each snore; three good bonks wake it | 3 |
| termites | Keepers | desk | SQUISH | Whack termites crawling toward the word cards; protected cards set the grade | 2 |
| cards | Keepers | desk | SORT | Drag letter cards into the slot for their word length, using real words | 2 |
| slump | Sales | desk | SERVE | Readers queue with a wish bubble; hand each the right book before their patience runs out | 3 |
| typos | Sales | desk | SPOT | A proof line scrolls past; tap the one misspelt word in each line | 2 |
| shelf | Sales | desk | SHELVE | Spines tumble; drop each on the shelf of its colour band while the shelf sways | 2 |
| jinx | Luck | desk | BLOW | Hold to blow the little storm cloud to the window; it drifts back and zaps the keys if it reaches them | 3 |
| raven | Luck | desk | SHOO | Clap only while it looks away; clapping while it watches makes it settle in | 2, ×2 at night |
| coconut | Luck | desk | GLUE | Hold the halves together and keep the drifting crack inside the band while the glue sets | 2 |
| snack | Speed | global | SORT | Bananas roll down the snack belt; flick rotten ones off and let good ones through | rotten banana only |
| critic | Sales | global | STAMP | Clippings slide by; slam RAVE on the bad reviews only | rotten banana only |
| flood | Keepers | all | BAIL & PATCH | Patch 3 roof holes, bail the water under the line, then fish the floating word cards back (long, 45 s) | heavy rain only: 1, ×2 in storm |
| fuses | Speed | all | LIGHT | A dark room and a headlamp cone; find and flip 4-6 breakers, avoid the sparking wires (long, 40 s) | storm or night: 1 |
| tangle | Speed | all | UNTANGLE | 5-7 spools in the six desk colours; drag them until no ribbons cross (long, 40 s) | 1 |

## The penalties
These are applied through `deskFactor` while a problem is up:

| Family | Effect |
| --- | --- |
| Speed | Typing ×.6 |
| Keepers | Keeper ×.5 |
| Sales | Sales ×.85 |
| Luck | No crits or lucky sales |

The exceptions:
- fuses: typing ×.5
- snack: typing ×.75 on every machine
- critic: sales ×.8 on every machine

## On the Floor
`#opsRoot[data-problem="<id>"]` is set while the machine on screen is hit, and always for a problem that hits every machine. `../minigame-progression.css` uses it to draw the problem on the stage:

| Problem | On the stage |
| --- | --- |
| leak | Drips and a puddle |
| jam | Inked typebars |
| keys | Mushy stuck keys |
| nap | The keeper's light goes out, with Zzz |
| jinx | A black cloud |
| raven | A raven on the carriage |
| overheat | Steam and a glowing body |
| fuses | Lights out |
| tangle | Ribbons across the room |
| snack | Green typists |
| flood | Rising water |
