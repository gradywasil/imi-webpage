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
Banana under a coconut shell, shells swap faster each round (3 shells, 4 from round 4, 5 from round 9). Tap a shell, or 1-5 / arrows + Space. Quick picks (under 2.2s) get +25%. Golden round (x5, +heart) and Diamond round (x10; the banana only shows for 0.45s and the shuffle is twice as long and fast). A wrong pick costs a heart.

### Banana Stack (`banana-stack.html`)
Monkey rides a swinging crate; tap to drop. Overhang is sliced off; perfect drops (within about 1.5px) keep full width and chain, and 3 in a row grow the crate back. Every 10th crate is Golden (+50, +6 width); a rare Diamond crate gives +200 and restores full width. A complete miss ends the run. The camera climbs and the tower sways.

### Banana Slice (`banana-slice.html`)
Drag to slice tossed bananas. Slicing a coconut or dropping a banana costs a heart. 3+ in one swipe is a bonus. Golden = 6s frenzy (no miss penalty, x2); Diamond = 3.5s slow-mo (25 per banana).

### Banana Plinko (`banana-plinko.html`)
10 balls; aim with the mouse/finger, tap/Space to drop. Bins 100/25/10/5/10/25/100; edge bins refund a ball. Peg hits play rising notes. Golden ball x3; Diamond ball splits into five on its first bounce (each x5).

### Vine Swing (`vine-swing.html`)
Hold = grab/swing (staying on builds the swing), release = fly, hold again near a vine to catch it. Bats knock you off; the river ends the run. Golden banana = wider grab, Diamond banana = banana magnet. Score is distance + bananas. Landscape stage.

### Peel Dash (`peel-dash.html`)
Three lanes, speed ramps up. Swipe/arrows to change lane, swipe up/Space to jump. Rocks must be dodged; logs and peels can be jumped. A hit costs a heart and slows you. Golden = 5s invincible dash that smashes obstacles; Diamond = 5s banana river (x3).

### Road Hop (`road-hop.html`)
Crossy-Road-style hopper in the city: sidewalks, grass and roads with cars, trucks and buses. Fruit scores, garbage costs points and stuns you, trees/bushes/bins block hops. A garbage truck creeps up from behind (the camera floor rises), so you have to keep moving. Golden = traffic crawls; Diamond = traffic stops and all garbage becomes bananas.

### Coconut Bowling (`coconut-bowling.html`)
Real ten-frame bowling scoring (strikes, spares, tenth-frame bonus balls). A throw is three taps: the coconut slides along the foul line, the aim arrow swings, the power bar fills. Steer a little while it rolls (arrows or the pointer). Pins are simulated as circles with simple collisions. A Golden pin is +50; the rare Diamond pin is +200 and makes your next coconut heavier and faster. Scores shown are bowling score plus bonus.

### Crate Packer (`crate-packer.html`)
Block-Blast-style: three stacks at a time dragged onto an 8x8 bay (or 1-3, arrows, Space). Full rows/columns ship; the multiplier follows a chain (resets after 3 placements without a shipment). Golden crate = ships its row and column (+100); Diamond crate = ships the whole bay (+500). Clearing the bay is +300. Ends when none of the three stacks fit.

### Banana Heist (`banana-heist.html`)
Top-down stealth. Hold to creep (steer toward your finger / arrows); release to freeze. Keepers' flashlights sweep; moving in the beam fills the alert bar fast, standing still slowly, crates block the beam. Grab the bunch at the stall, then carry it back down. Caught = lose a heart and start over. Under 30% alert on a heist is a GHOST run (x2). Golden bunch x3, Diamond bunch x10.

### Typewriter Rhythm (`typewriter-rhythm.html`)
Four lanes (D F J K or arrow keys, or tap a lane). Three tunes: Jungle Groove (96 BPM), Carriage Return (118), Banana Rush (146). The backing track is synthesised and scheduled just ahead of the playhead; each hit plays a pentatonic note. Misses drain the ink bar; empty = out. Golden key = x2 for 8s, Diamond key = auto-play for 6s. Ends with a rank (S/A/B/C).

### Fruit Stall (`fruit-stall.html`)
Customers (monkey, orangutan, gorilla, parrot) order 1-3 fruits; tap a bin (or 1-5) and the fruit goes to the most impatient customer who needs it. Fast service earns tips; leaving costs a heart. Rush hour every 35s. Golden VIP (3 items, x3, heart) and Diamond customer (one of everything, x10, full hearts).

### Library Tidy (`library-tidy.html`)
Real Library titles (a 70-title-per-shelf snapshot in `library-titles.js`, rebuilt with `python minigames/tools/make-titles.py`) fall toward the floor; tap the right shelf (books, films, songs, TV, kids, radio, sketches; a run uses 5 of the 7, starting with 3). Spines are colour-coded early and fade out over ~75s. Full shelf = bonus. Golden Edition x3 and slows the room; Diamond First Edition tidies everything on screen.

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
