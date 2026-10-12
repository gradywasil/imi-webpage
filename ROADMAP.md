# Typewriter Ops roadmap

The writing-room game is the whole site: a title menu and a full-screen game (`index.html` / `classic.html`; shell in `core.js`, game in `ops.js` + `ops.css`).
Titles sell once for a lump sum; this roadmap turns that into a long-term idle loop. Phases are meant to be built in order.

Implemented batch: [Brother playtest roadmap](docs/plan/14-playtest-roadmap.md). It covers keyboard clarity, required first-run progression, condensed upgrade cards, collectible background bananas, and a larger banana economy. The source changes and automated acceptance are complete; follow-up player feedback remains. The art lab (formerly `gemini-art/`) is outside that batch; see `art/`. See [measured results](docs/plan/playtest-results.md).

- [x] **1. Royalties + golden bananas**: every sold title pays bananas per second (Publishing deals multiply it); the header shows the rate; golden and rotten bananas drift across the page; a global buff bar.
- [x] **2. Ticker, Awards, stats**: a news ticker that reacts to game state; a trophy row under the bookshelf with small permanent bonuses; a stats page; buy x10 / x100 and big-number abbreviations.
- [x] **3. Offline progress**: typists, keepers and royalties keep working while away (capped); a welcome-back report; a "Night Lamp" raises the cap.
- [x] **4. Rights Market**: per-band demand swings; weather and night move it; time your sales.
- [x] **5. Named typists**: names, levels and traits per monkey; hats from awards shown on the pixel monkeys.
- [x] **6. Endless titles**: a pitch generator; 10-11 and 12-13 letter machines; Mk II restorations.
- [x] **7. Divisions**: songs, TV, radio, sketches and films from the Archive as passive-income divisions with their own quirks.
- [x] **8. Muses + Letter garden**: three patron slots with passive effects; a Coconut R&D minigame for growing wanted letters.
- [x] **9. Second Printing + Oulipo challenges**: a prestige that keeps the shelf and pays reissues; lipogram-style constraint runs.

- [x] **Balance pass**: a headless simulation harness and bot (`tools/`, see `BALANCE.md`); typist speed and cost scale by machine, pitched title pay and royalties reduced, divisions and the garden retuned.

Dev hooks: `IMI.news(text)` pushes a headline to the ticker; `IMI.ops.spawnGold(true|false)` spawns a rotten or golden banana; `IMI.ops.royRate()` returns royalties per second; `IMI.ops.genPitch(band)` returns a generated pitch for a band (0-5); `IMI.ops.simulateAway(seconds)` runs the offline simulation (it mutates the save).
