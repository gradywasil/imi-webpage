# Writing a repair

A repair is a WarioWare-style microgame that fixes a floor problem in IMI. It has one verb, lasts 8-15 s (long ones 40-45 s) and ends with a grade from 0 to 1. Each repair is a single classic-script IIFE, `repairs/<id>.js`. The runner `repair.html?game=<id>` loads the kit, checks the id against `MGRepair.LIST`, then injects the file. The reference is **`repairs/leak.js`**. Copy it.

Script order (`repair.html`): `../pixel.js`, `../crew-art.js`, `mg-art.js`, `mg-art3.js`, `mg-crew.js`, `hosted-bridge.js`, `mg-core.js`, `repair-kit.js` (with `data-runner`), then `repairs/<id>.js`.

**Shared files belong to the kit.** Do not edit `mg-core.js`, `mg.css`, `hosted-bridge.js`, `repair-kit.js` or `repair.html`. Every id is already in `MGRepair.LIST`. Anything you need to change (stage size, seconds, title) goes into your own `setup()` call. If the kit itself is missing something, say so in your report.

## The template, section by section (as in leak.js)

```js
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { R: AR, shapes: { ell, box, poly, and, or } } = MGArt, { make, hl, cvs, text, textW } = MGArt3;
  /* 1. sprites that don't need the desk colour: MGArt3.make(wHi, hHi, px => px.shape(test, ramp, part)), 3 hi-res px per unit */
  /* 2. setup */
  const R = MGRepair.setup({ id: 'mop', verb: 'MOP', how: 'Drag the mop over the <em>puddles</em>', scoreIcon: SPR });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;
  /*    sprites in the desk colour (R.deskR is a ramp id for px.shape), the room painted once into a cvs() */
  /* 3. TUNE: every number that level (LV, 0..1) and progress (R.progress, 0..1 over the run) move, in one object */
  /* 4. state: let G; function reset() { G = {...} }   grade() 0..1 and stats() rows read G */
  /* 5. verbs: the player's actions, as functions the input hooks and the bot both call */
  /* 6. update(dt): fixed 60 Hz. Score only while R.live; it keeps running ~0.8 s after end() so things can settle */
  /* 7. bot(dt): ?bot=1, called before update every step */
  /* 8. draw(): back to front, in units */
  /* 9. window.MOP = { get G() { return G; } };  R.run({ reset, update, draw, grade, stats, bot, ended, down, move, up, key }); */
})();
```

- **Start.** It starts by itself: no title card, a quick `GO!`, then the VERB slams for 0.6 s and the `how` hint shows for 2.8 s. The time bar drains along the top.
- **End.** Time running out calls `R.end()`, which grades with your `grade()` hook. Call `R.end()` yourself to finish early (everything fixed, or the thing broke). It is idempotent. It stings, waits 0.8 s, then shows the card.
- **Hosted.** IMI's overlay shows CONTINUE only. Standalone keeps AGAIN, so `reset()` must rebuild all state.

## MGRepair API (`repair-kit.js`)

`const R = MGRepair.setup(o)`. Every option is optional, and options win over `LIST`:

| Option | Meaning |
|---|---|
| `id` | the repair id; defaults to `?game=` |
| `verb` | upper-cased for the slam; `!` is added |
| `title` | plain text; the card heading |
| `how` | one-line hint (HTML; use `<em>` for the key word) |
| `seconds` | base time; `?extra=N` adds to it |
| `W`, `H` | stage size in units, default **120×160** |
| `scoreIcon` | canvas for the HUD counter |
| `padY` | standalone vertical padding, default 40 |
| `legend` | `[[canvas, html]]` for the (rarely seen) title card |
| `hint` | title-card hint line |
| `howAt` | `'bottom'` (default), `'top'`, or a top offset in units, to keep the hint off the action |
| `cursor` | CSS cursor for the stage, default `pointer` |

`R` gives you:

| Field | What it is |
|---|---|
| `st, g, W, H` | the stage. `g` draws in units at 1/3-unit precision. `st.hi(img, x, y, flipX)` draws a hi-res sprite. `st.toArt(ev)` maps a pointer event to units. |
| `ui, fx, A3` | the HUD, particles and `MGArt3.build()` sprites. `ui.setScore`, `ui.floatText(x, y, txt, 'gold'/'bad'/'ice'/'big')`, `ui.say(html, 'good'/'warn'/'bad'/'ice')`, `ui.bump`, `ui.setCombo(n, m)`, `ui.pulseCombo`, `ui.doFlash(col)`, `ui.setMeter(frac)` (free for your own use). `fx.burst/spark/ring/shock/confetti/puff/trail`. |
| `timer` | `MG.countdownTimer(seconds)`. The kit ticks it and drives the bar; don't tick it yourself. `timer.left`, `.frac`, `.total`, `.add(s)` for bonus time. |
| `rng(a=1, b)` | a seeded stream for this repair (from `?seed=` + the id). Use it for **all gameplay** randomness. `MG.rng` is fine for cosmetic noise. |
| `level` | 0..1 from `?level=` (default .3). The difficulty knob. |
| `desk` | 0..5 |
| `deskColour` | hex base colour |
| `deskRamp` | `[shadow, base, light]` |
| `deskR` | a ramp id for `px.shape` |
| `deskName` | e.g. `Lagoon` |
| `bot`, `seed`, `seconds`, `baseSeconds`, `extra` | the run parameters |
| `t`, `progress` | seconds of live play; `t / seconds`, 0..1 |
| `live` | playing and not yet ended. **Gate scoring and input on this.** |
| `done` | `end()` was called |
| `won` | the result is FIXED or PERFECT |
| `result` | `{ grade, stats, verdict }` after `end()` |
| `ptr` | `{ x, y, down, type, sx, sy, st, moved }`: the live pointer in units, with its press start and the farthest distance moved |
| `held(...keys)` | is any of these keys down? (lower-case `ev.key` names: `'arrowleft'`, `'a'`, `' '`) |
| `axisX()`, `axisY()` | -1/0/1 from the arrows or WASD |
| `shake(n=3)` | screen shake |
| `crew(x, footY, pose, o)` | the fixer monkey (below) |
| `end(grade?, stats?, verdict?)` | finish. Grade and stats default to your hooks. Returns true the first time. |
| `run(hooks)` | start the repair. Call it once, last. |
| `shell` | the `MG.shell` |

Hooks for `R.run({...})`. All are optional, but you want most of them.
- `reset()`: fresh state. Runs on start and on standalone AGAIN.
- `update(dt)` and `draw(alpha)`. `draw` also runs under the card and the pause screen.
- `grade()`: 0..1, live.
- `stats()`: `[[LABEL, value], …]`, 2-4 rows for the card.
- `bot(dt)`.
- `ended(result)`: once, at the whistle (clear hazards, tape the crack…).
- `down(x, y, ev)`, `move(x, y, ev)`, `up(x, y, ev, tap)`: units. `tap` means a press under 280 ms that moved less than 6 units. `down` and `move` only fire while live; `up` always fires.
- `key(ev, k)` while live (`k` = lower-case `ev.key`; arrows and Space get `preventDefault`), and `keyup(ev, k)`.
- `idle(dt)`: when not playing.

Helpers on `MGRepair`:
- `crew(st, x, footY, pose, o)`: `MGCrew.draw` with the fixer's `?look`/`?hat`.
  - Poses: `idle hold0 hold1 hold2 holdhit carry carry2 cheer scared crouch launch freeze run1 run2 sneak sneak2 air fall squish hang swing leap breathe`.
  - `o`: `{ flip, alpha, expr, tilt }`.
  - The figure is about 16 units tall. In the `hold*` poses the hands are about 12.3 units above the feet.
- `deskColour(i)`: `#78d9a0 #f08aa4 #5fa8f0 #f2b23a #b58cf0 #dfe3f2`. `deskRamp(i)` gives the ramp; `deskR(i)` gives a ramp id for `px.shape`. `DESKS[i]` gives `{ name, short, ramp }`.
- `parts` (cached hi-res canvases; draw them with `st.hi`):
  - `keycap(ch, { face, down, mush, blot })`: 13×14 units
  - `typebar(ch, { ink })`: 7×22
  - `spool(wound 0..1, { ramp })`: 15×15
  - `typewriter(desk, { paper })`: 46×33, in the desk colour
- `LIST`: `{ id, file, title, verb, seconds, size, W, H }` for all 20 ids. `byId[id]`, `STAGE`, `params` (`{ id, level, desk, seed, bot, warp, extra }`), `fail(msg)`, `current`.

From `mg-core.js`:
- `MG.verdictOf(g)`: `NOT FIXED` for g ≤ 0, `PATCHED` below .4, `FIXED` below .85, `PERFECT` otherwise. `MG.VERDICT_AT = { patched: 0, fixed: .4, perfect: .85 }`.
- Stars: ≥ .4, ≥ .65, ≥ .85.
- `MG.seeded(n)` gives a private rng.
- `MG.hitstop(sec)` gives a short freeze on big moments.
- `sfx`: `ding(n) golden diamond bonk rotten miss thud tick clack(n) bell typo tone(f0, f1, dur, type, vol, delay) noise(dur, vol, lowpass, delay)`.

## Grade guidance
- **Continuous, not pass/fail.** Usually `good / (good + bad)`, or a weighted mix of how much was fixed and how cleanly. Show it to the player as the score counter.
- **No input means < .4, and ideally 0.** Make sure nothing gets fixed by itself (in leak, the fixer starts clear of every drip).
- **Hitting 1.0 should be possible but hard.** FIXED (≥ .4) should be easy for a person paying attention. PERFECT (≥ .85) should take skill at level .5.
- **Make `level` change the game, not the scale.** It should mean more items, faster hazards and tighter windows, so `grade()` keeps the same meaning at every level. Put the level and progress curves in `TUNE`.
- **Keep a clear early-finish rule.** If everything is fixed, `R.end()` at once (and the grade can reward the time left). If a fail state ends it, `R.end()` with the current grade.

## Bot guidance (`?bot=1`)
- **Act like a person.** The bot sees only what a player can see (things on screen, tells) and acts through the same verb functions or the same aim the pointer sets. Never let it write the score.
- **Make it human.** Give it a reaction delay (about .08-.25 s), aim error, and a rare real fumble (5-10%), all from `R.rng`. Target a grade of about .6-.95 at levels 0, .5 and 1, and never PERFECT every time.
- **Check it over many seeds,** not just seed 7.

## Look and feel checklist
- **One verb.** Make the broken thing obvious in the first frame, and keep the `how` to one short line.
- **Art.** Hi-res kit style: `MGArt3.make` with `px.shape(test, MGArt.R.<ramp>, part)` (ramps: `fur furD skin ink red banY stem coco leaf leafD wood woodD woodL metal paper star orange grape pine ice gold drop rotten`, plus the desk ramps). Use `#1a0f14` ink outlines, light from the top-left, and positions rounded to thirds (`Math.round(x * 3) / 3`). Paint static scenery once into a `cvs()`. Canvas text uses `MGArt3.text(g, str, x, y, col, scale)`.
- **Tint the problem desk's machine or tool** with the desk colour. Use the fixer monkey where it fits.
- **Juice.** Use `fx` bursts on every hit, `sfx` on every action, `ui.floatText` for callouts, `MG.hitstop(.05-.1)` and `R.shake` on big moments, and a combo where it makes sense.
- **Controls.** Pointer and touch always (drag with `R.ptr`; a `tap` flag on `up`), plus keys where they fit (`R.axisX()`, Space, arrows). Remember the input hooks only fire while `R.live`.
- **Self-contained.** No external assets, no fetch, no new dependencies, and no globals other than one debug handle (`window.LEAK`-style, upper-case id).

## Running and checking
- **Dev URL:** `minigames/repair.html?game=<id>&level=.5&desk=2&seed=7&bot=1&warp=5&extra=2&look=v07&hat=3`.
  - `warp=N` fast-forwards N seconds once play starts.
  - `flat=1` hides the jungle backdrop.
  - Serve the imi-webpage root over http; `file://` won't do.
- **Check:** `node tools/repairs/check-repair.mjs <id> [--level .5 | --level 0,.5,1] [--seed 7] [--desk 0..5] [--extra N] [--shots dir] [--no-idle] [--q "k=v&..."]`.
  - It serves the repo on a free port, so it is safe to run several at once. It drives headless Chrome (420×700, or 700×420 when W > H).
  - For each level it does a bot run (screenshots at 0.5 s, mid-run and the over card), then a no-input run.
  - It prints one JSON line per level: `{ id, level, seed, botGrade, botVerdict, idleGrade, idleVerdict, idleOverAfter, errors, warnings, shots, ok }`.
  - `ok` means no console or page errors, the bot reached the card, and the idle grade is < .4 with the card shown within `seconds + 5` s. A bot grade outside .6-.95 is a warning. The exit code is 1 if any level is not ok.
  - Screenshots go to `.plan/shots/<id>/<id>-L<level*100>-{0.5s,mid,over,idle-over}.png`, outside the repo.
- **Read your screenshots and judge them.** Check that they are legible, on-theme, unclipped and consistent with leak.
- **Debug global:** `window.__repair = { id, phase, grade, verdict, t, live, liveGrade, level, desk, seed, bot, seconds, W, H, shell }`.
  - `phase` is one of `loading`, `error`, `title`, `count`, `waiting`, `play`, `pause`, `over`, `closed`.
  - `grade` is null until the card shows.
