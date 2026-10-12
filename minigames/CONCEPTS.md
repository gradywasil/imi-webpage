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

### Coconut Shuffle (`coconut-shuffle.html`)
Banana under a coconut shell. 3 shells in round 1, 4 from round 2, 5 from round 4. Swaps get faster (down to 0.085s), from round 3 two swaps happen at once, from round 4 some are fake-outs (the shells slide halfway and snap back), and from round 5 you have a pick timer. The banana is shown for less time each round. Golden round x5 (+heart), Diamond round x10 (the banana only flashes). A wrong pick or a timeout costs a heart.

### Banana Stack (`banana-stack.html`)
Monkey rides a swinging crate; tap to drop. Overhang is sliced off; perfect drops (within about 1.5px) keep full width and chain, and 3 in a row grow the crate back. Every 10th crate is Golden (+50, +6 width); a rare Diamond crate gives +200 and restores full width. A complete miss ends the run. The camera climbs and the tower sways.

### Banana Slice (`banana-slice.html`)
Drag to slice tossed bananas. Slicing a coconut or dropping a banana costs a heart. 3+ in one swipe is a bonus. Golden = 6s frenzy (no miss penalty, x2); Diamond = 3.5s slow-mo (25 per banana).

### Banana Plinko (`banana-plinko.html`)
The chip is a banana: a rigid crescent body with spin, friction and five collision circles along its curve, so it hooks on wooden pegs, pivots and flips. Three coconut bumpers fire it away pinball-style (scoring on the first three bumps per banana), a worker monkey paces a ledge with a crate and shoves it, and two monkeys swing on vines across the middle. 10 bananas; edge bins (100) refund one. Golden banana x3; the Diamond banana bursts into five on its first peg.

### Vine Swing (`vine-swing.html`)
Hold = grab/swing (staying on builds the swing), release = fly, hold again near a vine to catch it (a gentle magnet helps, and a catch always keeps at least a decent speed). A dotted preview shows where a release right now would take you; it turns gold and highlights the vine when it would catch one. Three hearts: falling in the river costs one and puts you back on the nearest vine. Bats knock you off. Golden banana = wider grab, Diamond = banana magnet. Landscape stage.

### Peel Dash (`peel-dash.html`)
Three lanes, speed ramps up. Swipe/arrows to change lane, swipe up/Space to jump. Rocks must be dodged; logs and peels can be jumped. A hit costs a heart and slows you. Golden = 5s invincible dash that smashes obstacles; Diamond = 5s banana river (x3).

### Road Hop (`road-hop.html`)
Crossy-Road-style hopper in the city: sidewalks, grass and roads with cars, trucks and buses. Fruit scores, garbage costs points and stuns you, trees/bushes/bins block hops. A garbage truck creeps up from behind (the camera floor rises), so you have to keep moving. Golden = traffic crawls; Diamond = traffic stops and all garbage becomes bananas.

### Coconut Bowling (`coconut-bowling.html`)
Real ten-frame bowling scoring (strikes, spares, tenth-frame bonus balls). A throw is three taps: the coconut slides along the foul line, the aim arrow swings, the power bar fills. Steer a little while it rolls (arrows or the pointer). Pins are simulated as circles with simple collisions. A Golden pin is +50; the rare Diamond pin is +200 and makes your next coconut heavier and faster. Scores shown are bowling score plus bonus.

### Crate Packer (`crate-packer.html`)
Tetris with a spin: every job is a truck (box truck, pickup, van with wheel wells, flatbed, dump truck, semi) seen from behind with its own loading bay mask. Stacks of 3-5 crates are cut from the real bay shape, so a perfect pack always exists, and arrive on a conveyor (up to 4 waiting; if it backs up the oldest falls off). Rotate with R / Q / tapping the selected stack / right-click / scroll / the on-screen button; Z undoes; N or the send button advances the belt. 85% full and the truck leaves; 100% is a perfect pack (x2, +heart); less loses a heart. Golden crate fits any single gap (+50); Diamond crate fills whatever is left (+300).

### Banana Heist (`banana-heist.html`)
Top-down stealth. Hold to creep (steer toward your finger / arrows); release to freeze. Three kinds of guard: sweepers swing a short beam, watchmen on the walls see across the entire yard with a wide cone and barely move, and patrols walk a beat (horizontal or vertical) and pause to look around. Crates block every beam. Moving in a beam fills the alert bar fast, standing still slowly. Rounds add guards (round 2 a watchman, round 3 a patrol, and so on). Under 30% alert is a GHOST run (x2). Golden bunch x3, Diamond bunch x10.

### Typewriter Rhythm (`typewriter-rhythm.html`)
Four lanes (D F J K or arrow keys, or tap a lane). Three tunes: Jungle Groove (96 BPM), Carriage Return (118), Banana Rush (146). The backing track is synthesised and scheduled just ahead of the playhead; each hit plays a pentatonic note. Misses drain the ink bar; empty = out. Golden key = x2 for 8s, Diamond key = auto-play for 6s. Ends with a rank (S/A/B/C).

### Fruit Stall (`fruit-stall.html`)
Customers order up to four fruits; tap a bin (or 1-5) and the fruit goes to the most impatient customer who needs it. Each bin holds 5 and must be restocked with a tap when empty. Difficulty ramps over about 50 seconds (shorter patience, faster arrivals, bigger orders); rush hour every 22s. Fast service earns tips; leaving costs a heart. Golden VIP and Diamond customer as before.

### Library Tidy (`library-tidy.html`)
Real Library titles (a 70-title-per-shelf snapshot in `library-titles.js`, rebuilt with `python minigames/tools/make-titles.py`) fall in quick succession (up to 7 at once, faster over about 55s); tap the shelf each belongs on. Spines are always colour-coded to their shelf. A run uses 5 of the 7 shelves, starting with 3 (4th at 14s, 5th at 34s). Full shelf = bonus. Golden Edition x3 and slows the room; Diamond First Edition tidies everything on screen.

## Remaining ideas

| Game | Loop | Input |
| --- | --- | --- |
| **Paper Plane** | Steer a paper plane through jungle gaps on updrafts, scooping letters. | drag |
| **Drum Circle** | Four-lane rhythm game on coconut bongos, perfect hits glow. | D F J K / tap |
| **Simon Says Monkey** | Growing sequence of notes played on three typewriter keys; repeat it. | tap / A S D |
| **Word Match** | Match-3 on letter tiles, bonus for runs that spell real words (ties into the word economy). | tap / drag |
| **Rain Leaf** | Barrel-catch cousin: catch rain with a leaf, dodge lightning; could read `weather.js`. | drag / arrows |
| **Fishing for Letters** | Lower a banana hook through the pond, reel in letter tiles, avoid piranhas. | hold / release |
| **Arm Wrestle** | Mash a button to out-pull a rival monkey; stamina meter. | tap / mash |

## Open questions for integration (later)
- Reward model: separate "side game tokens", cosmetic only, or a small capped boost to existing currencies?
- Entry point: a toy in the rail, a menu button, or a random "banana crate" pickup (see `pickups.js`)?
- Cooldown/limits so they stay a break, not the main loop.
