/* ============================================================
   MINI-GAME CREW: the main game's typewriter monkeys (crew-art.js, 64x64) as the stars of the side games.
   MGCrew.look()            the player's monkey: ?look=v07 (or a slug) wins, then the saved pick (mg:look), then v01
   MGCrew.frame(name, o)    a cached 64x64 canvas for a named pose (feet rest on row FOOT of the frame, body centred on column 32)
   MGCrew.draw(st, name, x, footY, o)   draw a pose on a stage with the feet at (x, footY) in game units
   MGCrew.perk(game)        the small buff this monkey brings to a game (null when it has none): { id, label, ... }
   Standalone: it reads only its own "mg:" keys. Later the main game can hand over the crew member's look + hat.
   ============================================================ */
(() => {
  'use strict';
  const FOOT = 55, K = 3;
  const params = new URLSearchParams(location.search);
  const ids = () => (window.CrewArt ? CrewArt.VARIANT_IDS : []);
  function look() {
    const want = params.get('look') || (() => { try { return JSON.parse(localStorage.getItem('mg:look')); } catch (e) { return null; } })();
    return want && ids().includes(want) ? want : (ids().includes('v01') ? 'v01' : ids()[0]);
  }
  const setLook = id => { try { localStorage.setItem('mg:look', JSON.stringify(id)); } catch (e) { /* private mode */ } };
  const hat = () => +params.get('hat') || 0;

  /* arm / leg targets are hand and foot positions relative to the body, as in crew-art's POSES */
  const POSE = {
    idle:    { sx: 1, sy: 1, y: 0, expr: 'determined', armL: [-11, 8], armR: [11, 8], legL: [-6, 17], legR: [6, 17] },
    breathe: { sx: 1.04, sy: .96, y: 1, expr: 'determined', armL: [-11, 9], armR: [11, 9], legL: [-6, 17], legR: [6, 17] },
    crouch:  { sx: 1.25, sy: .74, y: 5, expr: 'determined', armL: [-13, 12], armR: [13, 12], legL: [-8, 15], legR: [8, 15], headY: 3 },
    launch:  { sx: .86, sy: 1.22, y: -3, expr: 'screech', armL: [-12, -10], armR: [12, -10], legL: [-4, 19], legR: [4, 19] },
    air:     { sx: .97, sy: 1.03, y: -2, expr: 'giggle', armL: [-14, -2], armR: [14, -2], legL: [-8, 14], legR: [8, 14] },
    fall:    { sx: .88, sy: 1.18, y: -3, expr: 'screech', armL: [-8, 6], armR: [8, 6], legL: [-6, 19], legR: [6, 19] },
    squish:  { sx: 1.42, sy: .64, y: 9, expr: 'screech', armL: [-16, 12], armR: [16, 12], legL: [-12, 11], legR: [12, 11], headY: 3, impact: true },
    scared:  { sx: 1, sy: 1, y: 0, expr: 'screech', armL: [-12, 0], armR: [12, 0], legL: [-6, 17], legR: [6, 17] },
    cheer:   { sx: .95, sy: 1.06, y: -1, expr: 'giggle', armL: [-13, -12], armR: [13, -12], legL: [-5, 18], legR: [5, 18] },
    run1:    { sx: 1, sy: 1, y: -1, expr: 'determined', armL: [-12, 2], armR: [10, 10], legL: [-10, 15], legR: [8, 18], tilt: .25 },
    run2:    { sx: 1, sy: 1, y: -1, expr: 'determined', armL: [-9, 10], armR: [12, 2], legL: [-4, 18], legR: [10, 15], tilt: .25 },
    hang:    { sx: .9, sy: 1.1, y: -3, expr: 'determined', armL: [-5, -16], armR: [5, -16], legL: [-4, 19], legR: [5, 18] },
    swing:   { sx: .9, sy: 1.1, y: -3, expr: 'giggle', armL: [-5, -16], armR: [5, -16], legL: [-6, 17], legR: [4, 19] },
    leap:    { sx: .94, sy: 1.06, y: -2, expr: 'giggle', armL: [-15, -9], armR: [15, -9], legL: [-6, 17], legR: [8, 15] },
    sneak:   { sx: 1.12, sy: .84, y: 3, expr: 'determined', armL: [-12, 11], armR: [12, 11], legL: [-9, 16], legR: [8, 16], headY: 2 },
    sneak2:  { sx: 1.12, sy: .84, y: 3, expr: 'determined', armL: [-10, 12], armR: [13, 10], legL: [-4, 17], legR: [11, 15], headY: 2 },
    carry:   { sx: 1, sy: 1, y: 0, expr: 'giggle', armL: [-8, -9], armR: [8, -9], legL: [-6, 17], legR: [6, 17] },
    carry2:  { sx: 1, sy: 1, y: -1, expr: 'giggle', armL: [-8, -9], armR: [8, -9], legL: [-9, 16], legR: [9, 17] },
    freeze:  { sx: 1.04, sy: .98, y: 1, expr: 'screech', armL: [-9, 3], armR: [9, 3], legL: [-6, 17], legR: [6, 17] },
  };
  const cache = new Map();
  function frame(name = 'idle', o = {}) {
    const P = POSE[name] || POSE.idle, lk = o.look || look(), ex = o.expr || P.expr, h = o.hat == null ? hat() : o.hat, key = [lk, name, ex, h, o.tilt || 0].join('|');
    let cv = cache.get(key);
    if (!cv) {
      cv = CrewArt.renderCustomMonkey64(lk, 'stomp', {
        x: 32, y: 34 + P.y, facing: 1, squashX: P.sx, squashY: P.sy, headY: P.headY || 0, expr: ex, armL: P.armL, armR: P.armR, legL: P.legL, legR: P.legR,
        squatImpact: !!P.impact, hat: h, bodyTilt: (o.tilt != null ? o.tilt : P.tilt) || 0, headTilt: -((o.tilt != null ? o.tilt : P.tilt) || 0) * .8, prop: P.prop || null,
      });
      cv.hi = true; cache.set(key, cv);
    }
    return cv;
  }
  /* centre of the frame sits on column 32, feet on row 55: place that point at (x, footY) */
  function draw(st, name, x, footY, o = {}) {
    const cv = frame(name, o), g = st.g, k = st.K || K, rx = Math.round((x - 32 / k) * k) / k, ry = Math.round((footY - FOOT / k) * k) / k, w = cv.width / k, hh = cv.height / k;
    if (o.alpha != null) g.globalAlpha = o.alpha;
    if (o.flip) { g.save(); g.translate(Math.round((x + 32 / k) * k) / k, ry); g.scale(-1, 1); g.drawImage(cv, 0, 0, w, hh); g.restore(); } else g.drawImage(cv, rx, ry, w, hh);
    if (o.alpha != null) g.globalAlpha = 1;
  }

  /* what each costume brings to each game: small, readable, optional. A game asks perk(id) and applies the numbers it understands. */
  const PERKS = {
    roadhop:   { v01: { id: 'quick', label: 'RUNNER · quicker hops', hop: .85 }, v07: { id: 'tough', label: 'DOCKWORKER · +1 heart', hearts: 1 }, v03: { id: 'soft', label: 'GYMNAST · garbage stuns half as long', soft: 1 } },
    vineswing: { v01: { id: 'reach', label: 'RUNNER · longer reach', reach: 1.12 }, v20: { id: 'glide', label: 'PILOT · gentler falls', glide: 1 }, v26: { id: 'hook', label: 'PIRATE · hook grabs farther', reach: 1.2 } },
    heist:     { v29: { id: 'ninja', label: 'NINJA · guards see less', stealth: .85 }, v11: { id: 'gloves', label: 'WELDER · carries loot faster', carry: 1.15 }, v01: { id: 'sprint', label: 'RUNNER · quicker legs', speed: 1.08 } },
  };  const perk = game => (PERKS[game] && PERKS[game][look()]) || null;

  window.MGCrew = { look, setLook, frame, draw, perk, POSE, FOOT, hat, ids };
})();
