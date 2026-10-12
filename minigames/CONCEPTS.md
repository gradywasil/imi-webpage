# Side games: concepts

Standalone mini-games in the main game's pixel style. They reuse `pixel.js` art (monkey, banana, coconut, leaf), the jungle backdrop and `styles.css`, but share no state with the main game yet. Each game is one HTML page plus one JS file, built on `mg-art.js` (sprite kit), `mg-core.js` (stage, loop, sound, storage) and `mg.css`.

Open `minigames/index.html` (any static server, e.g. `python -m http.server`) to see the hub.

## Built

### Banana Barrel (`barrel-catch.html`)
Monkey holds a barrel overhead; move left/right to catch what falls.
- **Controls:** ← → / A D, or drag / move the mouse (the monkey chases the cursor and leans into the run). Esc / P pauses.
- **Falls:** banana (10), letter bundle (25, +3 letters), coconut (-1 heart, stuns), rotten banana (-15, breaks combo).
- **Rare:** Golden Banana (100, +heart, 7s *Golden Hour*: wider barrel, banana rain). Diamond Banana (500, slow-mo, 8s *jackpot* rain). Diamond weight creeps up the longer you go without one.
- **Combo:** every 6 catches in a row adds +0.5x (max 3x). Misses and rotten bananas reset it. Three hearts.
- **Modes:** *Banana Run* (bananas + letters) and *Fruit Fall* (apple, orange, grapes, pineapple, banana).
- Dev flags: `?autostart=1&mode=fruit&rare=1&bot=1&warp=30` (autostart, force rares, autoplayer, fast-forward seconds).

## Pitches (not built)

| Game | Loop | Input | Why it fits |
| --- | --- | --- | --- |
| **Vine Swing** | Pendulum timing: release at the top of the arc, grab the next vine; bananas trace the ideal arc. | one button | Uses the vines already in the backdrop. |
| **Coconut Shuffle** | Banana hides under one of three shells, shells swap faster each round. | tap | Pure thumb game, great reward pops. |
| **Key Whack** | Typewriter keys pop up with letters; tap/type the match. Ink blots are decoys. | tap / keyboard | On-brand: it is the typewriter. Doubles as typing practice. |
| **Peel Dash** | Three-lane auto-runner: hop logs, slide under vines, avoid peels. | swipe / arrows | Classic endless-runner shape, easy to juice. |
| **Banana Stack** | Swinging crate, tap to drop; perfect drops keep full width. | tap | Tiny, endlessly replayable, shows the canopy climbing. |
| **Rain Leaf** | Barrel-catch cousin: catch rain with a leaf, dodge lightning. | drag / arrows | Could read the live weather from `weather.js`. |

## Open questions for integration (later)
- Reward model: separate "side game tokens", cosmetic only, or a small capped boost to existing currencies?
- Entry point: a toy in the rail, a menu button, or a random "banana crate" pickup (see `pickups.js`)?
- Cooldown/limits so they stay a break, not the main loop.
