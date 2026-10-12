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

### Key Whack (`key-whack.html`)
A typewriter keyboard (QWERTY rows plus space bar); keys pop up lit and you press or tap the matching key before it snaps back. Every hit stamps its letter on a paper sheet, with a bell at the end of each line.
- **Controls:** type the letters / space, or tap the keys. Esc pauses.
- **Keys:** lit key (10-20, faster = more), ink blot (decoy: touching it costs a heart), banana space bar (50 + heart), Golden key (100, 6s frenzy: more keys, more time), Diamond key (100, lights the whole keyboard for a 5s mash at 30 per key).
- **Rules:** a lit key that expires costs a heart; pressing an unlit key is a typo (breaks combo only). 3 hearts, same combo scale as Banana Barrel. Concurrent lit keys grow from 1 to 4, and lifetimes shrink.
- Dev flags: `?autostart=1&bot=1&rare=1&warp=30`.

## Pitches (not built)

| Game | Loop | Input | Why it fits |
| --- | --- | --- | --- |
| **Vine Swing** | Pendulum timing: release at the top of the arc, grab the next vine; bananas trace the ideal arc. | one button | Uses the vines already in the backdrop. |
| **Coconut Shuffle** | Banana hides under one of three shells, shells swap faster each round. | tap | Pure thumb game, great reward pops. |
| **Peel Dash** | Three-lane auto-runner: hop logs, slide under vines, avoid peels. | swipe / arrows | Classic endless-runner shape, easy to juice. |
| **Banana Stack** | Swinging crate, tap to drop; perfect drops keep full width. | tap | Tiny, endlessly replayable, shows the canopy climbing. |
| **Rain Leaf** | Barrel-catch cousin: catch rain with a leaf, dodge lightning. | drag / arrows | Could read the live weather from `weather.js`. |

### More ideas (rougher)
| Game | Loop | Input |
| --- | --- | --- |
| **Banana Slice** | Bananas arc up; swipe through them, avoid coconuts, multi-slice splash. | swipe |
| **Paper Plane** | Steer a paper plane through jungle gaps on updrafts, scooping letters. | drag |
| **Banana Plinko** | Drop a banana down a pegboard of typewriter keys into scoring bins. | tap |
| **Drum Circle** | Four-lane rhythm game on coconut bongos, perfect hits glow. | D F J K / tap |
| **Simon Says Monkey** | Growing sequence of notes played on three typewriter keys; repeat it. | tap / A S D |
| **Word Match** | Match-3 on letter tiles, bonus for runs that spell real words (ties into the word economy). | tap / drag |
| **Lily-pad Hop** | Frogger: hop across river logs and lily pads with a banana in hand. | swipe / arrows |
| **Fishing for Letters** | Lower a banana hook through the pond, reel in letter tiles, avoid piranhas. | hold / release |
| **Arm Wrestle** | Mash a button to out-pull a rival monkey; stamina meter. | tap / mash |

## Open questions for integration (later)
- Reward model: separate "side game tokens", cosmetic only, or a small capped boost to existing currencies?
- Entry point: a toy in the rail, a menu button, or a random "banana crate" pickup (see `pickups.js`)?
- Cooldown/limits so they stay a break, not the main loop.
