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

## Long game rollout

Goal: a game people play for a month or more, built from nested loops (do it by hand, beat a hard version, automate it, then a new layer gives you something new to do by hand), with a premium currency and no ads, ever. Full design: [docs/plan/long-game/README.md](docs/plan/long-game/README.md); premium currency: [premium-currency.md](docs/plan/long-game/premium-currency.md). Phases are meant to be built in order; the design-spec phases are reviewed by the owner before any code.

- [x] **10. Foundations**: extension seams, a default-one game-speed hook, and multi-day Casual / Regular / Hardcore / Away profiles. LG-00 is accepted locally with independent parity/save/clock/media verification and the Regular finite endpoint measured at about 21 calendar days. The other full baseline endpoints are explicitly deferred to LG-13; see [the accepted handoff](docs/plan/long-game/LG-00-accepted.md). Not committed or deployed.
- [x] **11. Reward engine**: the existing 68 awards and five first clears have deterministic reward assignments, a finite 109-DB allocation, durable historical backfill/Retry, stored Royalty Rush and stable next goals. LG-01 is accepted locally after independent QA and both-edition fit/media/save verification; future layer rewards are still queued. Feature remains default off, not committed or deployed. See [acceptance and limits](docs/plan/long-game/LG-01-accepted.md).
- [ ] **12. Diamond Vault (free-only first)**: the premium catalogue spendable with Diamond Bananas earned in play: Game Speed and Typist Speed ladders (x1.25 -> x2), a longer Night Lamp, extra seats and beds, cosmetics. No money flows yet.
- [ ] **13. Automation framework**: auto-hire, auto-coach, auto-shop, auto-restore, banana net; each unlocked by clearing a challenge or a printing, never sold. Oulipo challenges grow from 4 to 12.
- [ ] **14. Layer 1: Printings retuned** (days 2-9), then **Layer 2: Imprints** with genres (days 9-18) and **Layer 3: the Estate** (days 18-30), each preceded by a design spec.
- [ ] **15. The Complete Works**: the capstone meter (the infinite monkey theorem, one play at a time) and a New Game+.
- [ ] **16. Live objectives**: commission board, weekly Seasons, Hall of Monkeys, awards from 68 to about 250.
- [ ] **17. Payments**: a small Worker for Diamond Bananas packs, receipts and restore-by-email; privacy, refund and terms pages; the written no-ads promise.
- [ ] **18. Pacing QA**: all profiles over weeks, and a fully upgraded premium bot must still need at least 55% of the free bot's calendar time to reach the capstone.
