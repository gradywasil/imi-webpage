# Art integration: bringing the gemini-art pixel set into the game

**Read this file first, then only your task file (`AI-NN-*.md`).** It is the shared contract for every agent on this track. It sits next to, and does not replace, `docs/plan/README.md`, whose hard rules (no page scroll, both editions' CSS, mobile first, reduced motion, harness green, no build tooling in the game, stay in scope) still apply.

Date written: 2026-10-07. Status: **plan only, nothing executed.**

> **Update 2026-10-11:** the `gemini-art/` lab folder was deleted. What survived lives in `art/`: `assets/<category>/*.js` (the 143 art-v2 pixel assets, which self-register on `ArtV2.assets`), `resolve.js` and `palette.js` (the art-v2 kit), and `typewriter-engine.js` + `typewriter-styles.js` (the typewriter renderer and its 6 models x 3 tiers). The 30 monkey variants are already in `crew-art.js`. Everywhere below, read `gemini-art/` as "the old lab, now `art/` (or `crew-art.js` for monkeys)"; the lab's pages, PNG exports, sheets, concept art and its own docs are gone (recoverable from git history before this commit).

## Goal

Replace the pixel edition's typewriter stage and, later, its icons and decor with the hand-authored art in `gemini-art/` (30 monkey variants, 6 typewriters x 3 restoration tiers, and the `art-v2/` asset set), **without changing a single game mechanic**.

The headline change is the Floor stage. Today the typists hang from ropes above a CSS-built typewriter (`ops.js` `buildStage`, `syncTypists`, `.o-dangle`, `.o-tw`). After this track the crew **works on the machine**:

| Crew slot (`crew[p]`) | What the player sees |
| --- | --- |
| `p = 0` (first typist) | **Key Stomper**: hops from key to key on the keyboard. |
| `p = 1..4` (next four) | **Side assistants**, one per machine station: Carriage Slammer, Platen Inspector, Ribbon Mischief, Escapement Mechanic. |
| `p = 5..11` (the last seven of the full crew of 12) | **More Key Stompers**: extra typists hopping on the keyboard. |

Everything that is a number (speed, costs, letters, XP, traits, talent, coaching, rerolls, keepers, hats, offline progress) stays exactly as it is. The art reads game state; it never writes it.

## Decisions already made

1. **Mechanics are frozen.** No edit may change what `press`, `tick`, `typistSpeed`, `autoRate`, `simulateAway`, costs or saves compute. Proof: the balance harness (`tools/balance.mjs`) must give byte-identical output before and after (AI-11 enforces this).
2. **gemini-art stays a separate lab.** The game never loads a file from `gemini-art/` at runtime. Finished art is **baked** into a new top-level `art/` folder (PNG atlases + JSON manifests) by a script, and the game loads from there. `gemini-art/` keeps working as the source and comparison page.
3. **Pixel edition only.** The classic edition keeps its emoji monkeys and CSS machine. Nothing in this track edits `classic.*` except a guard if a shared function needs it.
4. **Feature-flagged, old stage kept as fallback** until AI-12: new stage on with `?art=2` or `localStorage['imi-art2']='1'`. If the atlas fails to load, the old stage is built. The old DOM stage is deleted only in AI-12, after sign-off.
5. **One owner of `ops.js` at a time.** (Lesson from the playtest batch.) Only AI-04, AI-06, AI-07, AI-08 touch `ops.js`, strictly in that order. Everything else works in new files, `pixel.js`, CSS, `tools/`, `art/`.
6. **Looks belong to the monkey, roles belong to the slot.** A typist's *look* (one of the 30 variants) is chosen once at hire and saved; its *role* is computed from its crew index every render. See "Crew model".

## Open questions for the owner (defaults in bold, change before AI-04 starts)

| # | Question | Default |
| --- | --- | --- |
| Q1 | Order of the four side assistants | **Carriage, Platen, Ribbon, Escapement** (carriage is the most visible and rings the bell). One constant, `STATION_ORDER`, so this is trivial to change. |
| Q2 | Seven extra stompers at once on a phone | **Show all, in two depth rows**. AI-01 may recommend capping visible hoppers at 5 plus a "crowd" silhouette if it is unreadable. |
| Q3 | Game hats vs variant costumes | **A hat the player picks replaces the variant's own headgear** (needs a `headgear: none` render param); unhatted monkeys wear their costume. |
| Q4 | Keyboard | **Letters A-Z plus space only** (the game's `fx.keys`); the prototype's digit keys are decoration or dropped. |
| Q5 | Classic edition later | **No** (out of scope). |

## Crew model (used by AI-02, 04, 05, 06)

```
role(p)  = p === 0 ? 'stomper' : p <= 4 ? STATION_ORDER[p - 1] : 'stomper'      // stations: carriage | platen | ribbon | escapement
slot(p)  = p === 0 ? 0 : p <= 4 ? (station slot) : (p - 4)                        // hopper index 1..7 for p = 5..11
```

- `crew[p].look` (new optional field): a variant slug from `monkey-variants.js` (`runner`, `dockworker`, ...). Missing on old saves: derive it deterministically from the typist's name hash on first read and let the normal save persist it. **No schema bump, no migration that can lose data.**
- Assignment at hire: draw from a per-desk shuffled bag so no two typists on a machine share a look until the bag is exhausted. Assistants prefer their station's archetype (carriage: blue-collar, platen: scholarly, escapement: industrial, ribbon: whimsical); stompers prefer athletic. Any variant can play any role; the prototype's 30 variants all support all actions.
- Reroll, coaching, hats and XP never change `look`.
- Display cap today is `Math.min(paws, 8)`; the new stage shows all `paws` (max 12 per desk, `UPS` `paw.max`).
- Machine parts always animate from game state (letters pressed). The assistants are **actors added on top**: an unhired station's part still moves by itself, exactly as today.

### What each role does when it presses (`press(i, auto, p)` knows `ch` and `p`)

| Role | Its own press | Machine-wide event |
| --- | --- | --- |
| Key Stomper / hopper | Parabolic hop to the pressed key, stomp compresses it, dust puff | Cheer: victory dance on the spot |
| Carriage Slammer | Shoves the carriage one step | Pulls the return lever on the bell "ding" (every 9th letter, `r.col % 9 === 0`, by anyone) |
| Platen Inspector | Rides the roller one step | Peeks over the sheet when a page tears (`tearPage`) |
| Ribbon Mischief | Tugs the ribbon, a spool turns | Leaves an ink paw print on the desk occasionally |
| Escapement Mechanic | Taps the cog with the wrench | Cog ticks on every press (also by others) |

Manual player taps are answered by the next idle stomper/hopper (round robin). With no crew at all, a ghost paw cue (from `art-v2` particles) shows the tap; nothing else changes.

## Architecture

```
gemini-art/*.js + art-v2/assets/*   (source, untouched)
        |  tools/bake-art.mjs   (one-off dev script, puppeteer-core + Chrome like tools/shot.mjs)
        v
art/monkeys/<variant>.png + .json     one strip per variant: idle, stomp, slam, roll, tap, tug, victory, expressions; manifest has fps, loop/one-shot, contact frame, anchors (head, hands, feet)
art/typewriters/<desk>-mk<0..2>.png + .json     base body + static keyboard per machine/tier
art/typewriters/parts.png + .json     moving parts and upgrade overlays (carriage, platen frames, spools, typebars, bell, lever, cog, brass keys, vowel tint, ribbon2, keeper LED)
art/ui/*.png + .json                  icons, badges, particles, chrome (AI-08..10)
        |  loaded lazily, listed in sw.js
        v
stage-art.js  (window.StageArt)       canvas renderer + DOM overlays; called from ops.js behind the flag
```

- **Why baked, not generated at runtime:** `monkey-variants.js` + `proto-engine.js` + `typewriter-styles.js` are about 260 KB of JS that re-renders the whole 384x240 scene procedurally every frame. Baked strips render with `drawImage` and cost almost nothing on a phone. It also respects the game's no-build-tooling rule: baking is a dev script whose *output* is committed, like `readers-*.js`.
- **Rendering:** one `<canvas>` at a fixed logical size (chosen by AI-01), scaled by an **integer** factor in device pixels, `image-rendering: pixelated`, all positions rounded. Names, speech bubbles, letter pops and the `want` key hints stay **DOM overlays** positioned from logical coordinates, so the existing CSS, `morph()` and tests keep working.
- **Keys:** the 26 letter keys and space keep invisible `<b class="o-key" data-k="Q">` hit/aria/`want` elements over the canvas, so `renderFloorInfo`'s `.want` toggling, the key guide, tooltips and tour spotlights (`#oStage`) work unchanged.
- **Budget:** 30 fps normal, 15 fps with Settings > Effects: Low (`IMI.fx.low`), static first frame with reduced motion (`IMI.reduceMotion`), canvas paused when the tab is not Floor or the page is hidden. No per-frame allocation, no layout reads in the loop.
- **Known gaps in the prototype art that the pipeline must close (AI-02/03):** the prototype animates actions (stomp, slam, roll, tap, tug, victory) but has **no idle/waiting loop** per role and no baked layered typewriter (it redraws everything per frame). Both are new work, not copy-paste.

## What exists vs what the game needs (honest status)

`gemini-art/art-v2/REPORT.md` says 143 assets, 100% lint, average critic 4.75. Treat that as the output of a self-reviewing pipeline, **not a design sign-off**: the critic scores are model-assigned, and the report's own table shows mismatches with the game (for example a logo reading "MONKEY OS" where the game is "Infinite Monkey Industries"; crew art that is hats/dice rather than the game's 7 hats and 7 traits; only 6 of the 9 department icons; no side-rail toys, parallax layers or keeper art matching the game's keepers). AI-00 produces the real coverage matrix and the owner spot-checks it. Missing art goes to a new Gemini pass (the same directive pattern as `gemini-art/GEMINI_DIRECTIVE.md`), not into this track's code tasks.

## Task order

| ID | Task | Size | Needs vision | Depends on | Touches `ops.js` |
| --- | --- | --- | --- | --- | --- |
| AI-00 | Preflight, baseline evidence, asset coverage audit | S | yes | none | no |
| AI-01 | Stage rendering spike and decisions (GATE) | M | yes | 00 | no |
| AI-02 | Monkey bake pipeline: strips, manifests, anchors, idle loops | L | yes | 01 | no |
| AI-03 | Typewriter layers and upgrade-part overlays | L | yes | 01 | no |
| AI-04 | Crew look/role model, save-safety, harness | S | no | 00 (Q1-Q3 answered) | **yes (1st)** |
| AI-05 | `StageArt` runtime renderer | L | yes | 01, 02, 03 | no |
| AI-06 | Wire `StageArt` into `ops.js` behind the flag | M | yes | 04, 05 | **yes (2nd)** |
| AI-07 | Moods, buffs, hats, shiny, cheer, scene reskin | M | yes | 06 | **yes (3rd)** |
| AI-08 | UI wave 1: Train page, crew card, traits, ranks | M | yes | 00, 07 | **yes (4th)** |
| AI-09 | UI wave 2: department icons, shop, keepers, publisher, deals, awards, muses, media | L | yes | 08 | shares (5th) |
| AI-10 | UI wave 3: menu, logo, toys, sky, parallax, particles, chrome | L | yes | 00 | no (CSS, `pixel.js`, `app.js`) |
| AI-11 | QA, performance, accessibility, old-save and harness proof | M | yes | 07 and any of 08-10 shipped | no |
| AI-12 | Rollout, flag flip, cleanup, docs | S | no | 11 + owner sign-off | yes (removal) |

Parallelism: after AI-01, run **AI-02, AI-03 and AI-04 together** (disjoint files). AI-10 is independent of the stage and can run any time after AI-00, in parallel with AI-05..07, because it touches CSS, `pixel.js` and `app.js` only. Never run two `ops.js` tasks at once.

## Model guidance (any model family; the rule is capability, not brand)

| Task type | Needs |
| --- | --- |
| Orchestrator | Strongest reasoning model available. Reads this file, owns the order, merges, runs the gates, never edits `ops.js` while a task owns it. |
| AI-01, 05, 06 (architecture and the stage loop) | Strong coding model with high reasoning, **and image viewing** for screenshots. |
| AI-02, 03 (bake/layers) | Strong coding model with image viewing; these live or die on looking at contact sheets. |
| AI-04, 12 (small, careful logic) | Mid-tier coding model is enough. |
| AI-08..10 (surface-by-surface swaps) | Mid-tier model per surface; fan out one agent per surface once the swap helper exists. |
| AI-11 (QA) | A **different** model from the implementer, with image viewing; independence is the point. |

Every sub-agent must be given: this README, its task file, and the list of files it owns. If a model cannot view images, it must say so and stop before any "does it look right" decision, not guess.

## Verification protocol (every task ends with this)

1. `node --check` on every changed `.js`; `node tools/balance.mjs` (or the quick scenario in `BALANCE.md`) shows no exceptions.
2. Screenshots with `tools/shot.mjs` (needs `puppeteer-core` and Chrome) at **1280x800, 390x700, 360x560**, pixel edition, desks 0, 2 and 5, crew counts 0, 1, 3, 5, 8, 12, day and night, clear and storm. Store under `docs/plan/art-integration/evidence/AI-NN/`.
3. Both flag states (`?art=2` and off) load without console errors; classic edition unchanged.
4. Old save (copy a save from before this track into `localStorage['imi-ops-v1']`) loads and plays.
5. Reduced motion and Effects: Low checked.
6. The task file's Status and Handoff notes are updated; list files changed and what was **not** verified.

## File ownership

| Area | Owner task(s) | Others may |
| --- | --- | --- |
| `tools/bake-art.mjs`, `art/monkeys/**` | AI-02 | read |
| `art/typewriters/**` | AI-03 | read |
| `stage-art.js` (+ its CSS section in `ops.css`) | AI-05, then AI-06/07 for wiring tweaks | read |
| `ops.js` | AI-04, 06, 07, 08, 09 in that order, one at a time | nobody else |
| `pixel.js`, `app.js`, `styles.css` | AI-10 | read |
| `sw.js` (precache list, `VERSION` bump) | whoever adds a file, one line each | keep alphabetical |
| `gemini-art/**` | art-generation passes only | read; never edited by this track |

## Risks

| Risk | Mitigation |
| --- | --- |
| Fixed-resolution canvas vs the fluid `container-type: size` stage; a phone may only afford ~1 CSS px per art px | AI-01 measures and decides logical size, scale policy, and the phone layout (crop vs reduced hopper count) before any build work. |
| 12 sprites on a keyboard are unreadable | Depth rows, per-slot scale/offset table, cap-plus-crowd fallback (Q2). |
| Uncommitted playtest batch in the working tree | AI-00 requires the owner to commit or stash it and branch `art-integration` first. |
| Baked art too large for the service worker / first load | Lazy per-variant strips, a byte budget in AI-02 (target: first stage load under 400 KB, each extra variant under 80 KB), and only the stage's own atlas in the `sw.js` shell list. |
| Self-assigned art quality scores | Owner spot-check gate in AI-00; AI-11 reviewer is a different model. |
| Name/brand drift in generated art | Coverage matrix flags it; fixes go to the next Gemini pass. |
