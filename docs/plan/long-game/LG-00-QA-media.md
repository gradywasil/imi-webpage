# LG-00 actual reduced-motion media QA

Verdict: **PASS with one native-pickup exception** for actual reduced-motion media, edition boot flags, Effects Low/High controls, reduced-motion pane CSS, and six viewport captures. Pixel's native reduced-pickup interaction is **UNVERIFIED** because the legitimate onboarding tour overlay remained active and blocked placement. Overall LG-00 and LG-01 disposition remain with the owner; this report closes only the actual-media gate.

## Method and provenance

Workspace: `C:/Users/arran/Projects/monkeyOS-v2`, branch `long-game`. The authorized listener was revalidated at `127.0.0.1:8148`, PID `43468`, Python 3.11 with `os.chdir('C:/Users/arran/Projects/monkeyOS-v2')`. The external Puppeteer module and `C:/Program Files/Google/Chrome/Application/chrome.exe` were used. No user browser profile, system media preference, source file, dependency, or branch was changed.

Command: `node docs/plan/long-game/evidence/LG-00/authorized-media/run-07/capture.mjs`. The helper uses fresh Puppeteer pages; each page receives `emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}])` before navigation. It verifies actual `matchMedia`, `Core.reduceMotion`, `IMI.reduceMotion`, edition, viewport/document dimensions, loaded response SHA-256s, runtime/request/HTTP errors and screenshots. It waits for network idle, fonts and two animation frames. Effects Low is selected by the actual Settings button. A temporary `.o-pane.enter` class probes the shipped CSS computed style and is removed immediately. A separate fresh no-preference page selects Effects High through Settings.

Expected and loaded SHA-256 identities matched in all 30 source responses: `core.js` `830fba7de26ef4e84df0bb37c038bedaa0c7b6fe4224d9d02d8d3b6eb60302a2`; `ops.js` `6e29d9ca0f34ff8f75ba5b6eeeaae178612acec0b565cd370bcfbb40631f62e7`; `ops.css` `2b138720f720a3313ea1691027198f2898881e2ca09b083a7cf94d3a203fb06d`; `pickups.js` `80b9a362be5a33a6a0f8e2f6453d21f7491f9f6778f27efa50ea80be2d3a37cc`; Pixel shell `index.html` `bfff8800c93d9b0d092606307ea9cb698d48327fceaf2a7b6554bbef13df856f`; Classic shell `classic.html` `849acf2a1b006e6813e9b6686b3dd56b7b5bdfed0d98428c7eda177343846a2c`.

## Results

All six reduced-media pages report `matchMedia=true`, `Core.reduceMotion=true`, `IMI.reduceMotion=true`, and the expected edition. Every document width/height equals its viewport: Pixel and Classic at 1280×800, 390×700 and 360×560 have no page scroll. Six screenshots are in the run-07 directory (listed below). These are actual reduced-media/Effects-Low captures, not a claim that every gameplay surface was exercised.

At 1280×800, both editions selected Effects Low from Settings (`data-fx=low`). On the real `.o-pane.enter` element, computed `animationName=none` and `animationDuration=0s` under reduce media. In separate fresh 1280×800 no-preference contexts, both editions report media/Core/IMI flags false, select High (`data-fx=high`), and the same pane computes `animationName=o-enterx`. This is a media-specific computed-style contrast; it is not an assertion that Low itself disables all motion.

Classic native pickup: after the already-completed intro, the real pickup API spawned a 48×48 pickup under reduce media and Low. Its position remained `[1134.109375,480.890625]` across a 500ms wait; clicking the real pickup collected it (`stats.pickups=1`). This establishes the actual reduced stationary/collectible path for Classic only.

Pixel native pickup: **UNVERIFIED**. The fresh Pixel 1280×800 profile booted with the real intro and tour active. The existing legitimate `IMI.ops.completeIntro()` completed intro state in the isolated page, but the tour coach-mark remained active and its visible controls did not dismiss it. `IMI.pickup.eligible()` was true, yet `IMI.pickups.spawn()` returned false twice because the tour overlay blocked every placement attempt (20 visible placement blockers recorded). No element was fabricated or overlay hidden/removed. This is retained as a test limitation, not a production defect finding. The initial attempt also used a browser page that resolved to 800×600 and is preserved in run-01; subsequent captures explicitly set and verified viewport dimensions.

Run-07 collected eight cases with empty runtime exception, failed-request and HTTP-error lists. The failed setup attempts and exact diagnostics are preserved in run-01 through run-06; they are not relabeled as passes. The final run produced six screenshots and had no errors. Pixel screenshots show the actual intro coach-mark; the mobile captures also show constrained Floor layout, while the document remains non-scrolling.

## Screenshot paths

- `evidence/LG-00/authorized-media/run-07/pixel-1280x800-reduce-low.png`
- `evidence/LG-00/authorized-media/run-07/pixel-390x700-reduce-low.png`
- `evidence/LG-00/authorized-media/run-07/pixel-360x560-reduce-low.png`
- `evidence/LG-00/authorized-media/run-07/classic-1280x800-reduce-low.png`
- `evidence/LG-00/authorized-media/run-07/classic-390x700-reduce-low.png`
- `evidence/LG-00/authorized-media/run-07/classic-360x560-reduce-low.png`

## Scope boundary

The owner deferred Casual, Hardcore and Away endpoints to LG-13 and accepted the specific historical wallet-capture provenance exception. Neither is remeasured or reconsidered here. Historical pickup speed/provider cases were not repeated. No sound audition, physical-device claim, source fix, LG-01 dispatch, whole-game accessibility claim, commit, staging or deployment is included.

The manifest at `evidence/LG-00/authorized-media/manifest.json` binds this report, the successful helper and run receipt/log, and all six screenshots by path, SHA-256 and byte length. Failed captures remain preserved separately under the same authorized evidence root.
