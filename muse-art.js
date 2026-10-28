/* MUSE ART: animated portraits for the Muses (ops.js renderMuses).
   Every muse is a typist monkey (crew-art.js) dressed as their namesake, standing in a little scene with props that move.
   Pixel: six 34x39 frames are drawn once per muse onto one strip and played by CSS steps() (ops.css .ma-strip).
   Coordinates are in the typists' 64x64 sprite space. Pixel: head centre about 32,28, paws about 20,43 and 44,43, crop x 15-49, y 10-49.
   MuseArt.html(id, veiled) returns the portrait's inner markup for the running edition. */
(() => {
  const SX = 15, SY = 10, FW = 34, FH = 39, N = 6, K = '#1a0f14';
  const CA = window.CrewArt;

  /* ---------- outfits: a typist look with a few slots swapped ---------- */
  const OUTFIT = {
    seuss:    { base: 'v14', fur: 'capuchin_cream', set: { headgear: 'none', eyewear: 'cheerful_gourmet', facial: 'confectioner_smile', prop: 'none' }, colors: { jacketDark: '#1a3478', jacketBase: '#2b4fa8', jacketLight: '#4a72d0', suedePatch: '#2b4fa8', bowDark: '#8a1418', bowBase: '#e23a3a', bowDot: '#ffffff', slacksBase: '#2b3a6a' } },
    poe:      { base: 'v13', fur: 'chestnut_chimp', set: { headgear: 'none', eyewear: 'stern_gaze', prop: 'none' }, colors: { tweedDark: '#0c0b10', tweedBase: '#1c1a22', tweedLight: '#2c2a36', tweedHi: '#3a3846', tieDark: '#0c0b10', tieBase: '#2a2632', tieLight: '#3a3644', mustache: '#120c0c' } },
    dick:     { base: 'v27', fur: 'chestnut_chimp', set: { headgear: 'none', eyewear: 'observant', facial: 'clean', prop: 'none', legs: 'flowing_robe_skirt' }, colors: { scarfRed: '#ffffff', robeDark: '#c8c0cc', robeBase: '#ffffff', robeLight: '#ffffff', robeHi: '#ffffff', checkDark: '#e8e0ea', checkWhite: '#ffffff' } },
    hemi:     { base: 'v25', fur: 'silverback_gray', set: { headgear: 'none', eyewear: 'squinting_focus', facial: 'clean', prop: 'none', hands: 'weathered_paws' }, colors: { scarfDark: '#162c4a', scarfBase: '#162c4a', scarfLight: '#2a4a70', shortsBase: '#b8a47a' } },
    christie: { base: 'v13', fur: 'chestnut_chimp', set: {}, colors: {} },
    woolf:    { base: 'v14', fur: 'chestnut_chimp', set: { headgear: 'none', eyewear: 'observant', facial: 'clean', prop: 'none' }, colors: { jacketDark: '#4a5a3c', jacketBase: '#6d7f5a', jacketLight: '#8ea078', suedePatch: '#6d7f5a', bowDark: '#4a5a3c', bowBase: '#6d7f5a', bowDot: '#6d7f5a', slacksBase: '#4a5a40' } },
    austen:   { base: 'v27', fur: 'chestnut_chimp', set: { headgear: 'none', eyewear: 'observant', facial: 'clean', prop: 'none' }, colors: { coatWhite: '#cfe2f6', coatShade: '#9ebce0', buttonDark: '#5a8ad8', scarfRed: '#5a8ad8', checkDark: '#bcd6f0', checkWhite: '#cfe2f6', clogBase: '#e8d8c8' } },
    tolken:   { base: 'v14', fur: 'chestnut_chimp', set: { eyewear: 'determined', facial: 'clean', prop: 'none', headgear: 'none' }, colors: { jacketDark: '#4a3e26', jacketBase: '#6a5a3a', jacketLight: '#8a7a52', suedePatch: '#5a4a2e', bowDark: '#1e3a1a', bowBase: '#3a5a2a', bowDot: '#3a5a2a' } },
    twain:    { base: 'v14', fur: 'silverback_gray', set: { eyewear: 'observant', facial: 'clean', prop: 'none' }, colors: { jacketDark: '#c8c8c0', jacketBase: '#f0f0e8', jacketLight: '#ffffff', suedePatch: '#e0e0d8', bowDark: '#0c0c0c', bowBase: '#1a1a1a', bowDot: '#1a1a1a', shirtCream: '#ffffff', slacksBase: '#e8e8e0' } },
    chimpens: { base: 'v13', fur: 'chestnut_chimp', hat: 2, set: { eyewear: 'standard_focused', facial: 'trimmed_whiskers', prop: 'none', headgear: 'none' }, colors: { tweedDark: '#22161e', tweedBase: '#3a2a3a', tweedLight: '#54405a', tweedHi: '#6a5470', tieDark: '#8a6a1a', tieBase: '#c8a040', tieLight: '#e8c860' } },
    potter:   { base: 'v07', fur: 'chestnut_chimp', set: { headgear: 'none', eyewear: 'observant', facial: 'clean', prop: 'none' }, colors: { denimBase: '#3a6aa8', denimDark: '#24487a', denimLight: '#6a98d0' } },
    fitz:     { base: 'v28', fur: 'chestnut_chimp', set: { headgear: 'none', prop: 'none' }, colors: { capeLining: '#12141a', capeHi: '#22242c' } },
    shakes:   { base: 'v14', fur: 'chestnut_chimp', set: { headgear: 'none', eyewear: 'determined', facial: 'neat_mustache', prop: 'none' }, colors: { jacketDark: '#0e0e14', jacketBase: '#1a1a22', jacketLight: '#2c2c38', suedePatch: '#2a2a34', bowDark: '#1a1a22', bowBase: '#1a1a22', bowDot: '#d8a840', slacksBase: '#2a2a34' } },
    carroll:  { base: 'v28', fur: 'golden_tamarin', set: { headgear: 'none', eyewear: 'cheerful_gourmet', facial: 'confectioner_smile', prop: 'none' }, colors: { tuxBase: '#2f5e34', capeLining: '#d8a840', capeHi: '#f0c860' } },
    homer:    { base: 'v24', fur: 'silverback_gray', set: { headgear: 'none', eyewear: 'squinting_focus', facial: 'clean', prop: 'none' }, colors: { robeDark: '#c8c4b8', robeBase: '#f4f2ea', robeLight: '#ffffff', robeHi: '#ffffff', runeGold: '#d8a830', vialGreen: '#f4f2ea', vialCyan: '#f4f2ea', vialMagenta: '#f4f2ea', vaporBubble: '#f4f2ea', bandolier: '#d8a830', shoeBase: '#c89a50' } }
  };
  const vid = id => 'muse_' + id;
  function register() {
    if (!CA) return;
    for (const [id, o] of Object.entries(OUTFIT)) {
      const B = CA.getVariant(o.base), key = vid(id);
      CA.VARIANTS[key] = { ...B, ...o.set, id: key, slug: key, fur: CA.FUR_PALETTES[o.fur] || B.fur, skin: CA.SKIN_PALETTES[o.fur] || B.skin, colors: { ...B.colors, ...o.colors } };
    }
  }
  register();

  /* ---------- pixel helpers ---------- */
  const px = (g, x, y, c, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const spr = (g, x, y, rows, pal, flip = false) => {
    for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) {
      const c = pal[rows[j][i]]; if (c) px(g, flip ? x + rows[j].length - 1 - i : x + i, y + j, c);
    }
  };
  const disc = (g, cx, cy, r, c) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * .6) px(g, cx + x, cy + y, c); };
  const fill = (g, c) => px(g, 0, 0, c, 64, 64);
  const wave = (f, a = [0, 0, -1, -1, 0, 0]) => a[f % a.length];
  const alpha = (g, a, fn) => { g.save(); g.globalAlpha = a; fn(); g.restore(); };

  const FISH = ['.kkk..k', 'kcccckk', 'kwcccck', '.kkk..k'];
  const BEE = ['.ww.', 'kyky', '.kk.'];
  const QMARK = ['qq.', '..q', '.q.', '...', '.q.'];
  const NOTE = ['..n', '..n', 'nnn', 'nn.'];
  const SKULL = ['.bbb.', 'bbbbb', 'bkbkb', 'bbsbb', '.b.b.'];
  const RAVEN = ['...kk....', '..kkkk...', 'gkekkk...', '..kkkkk..', '..kkkkkk.', '...kkkkkk', '....kkk.k', '...y..y..'];
  const BANANA = ['......k', '....kyk', '..kyyk.', 'kyyyk..', '.kkk...'];
  const BUNNY = ['.kk.kk..', '.kpkpk..', '.kbkbk..', 'kbbbbbk.', 'kbebbbbk', '.kbbbbk.', '.kjjjjk.', '..kk.kk.'];
  const RABBIT = ['k.k.', 'kpkp', 'kwkw', 'kwwwk', 'wwrww', 'wwwww', 'kwwwk'];

  /* each scene draws three layers: bg (behind the monkey), wear (on the monkey, also kept in the veiled silhouette) and fg (props in front) */
  const PX = {
    seuss: {
      bg(g, f) { fill(g, '#86d8cf'); for (const [x, y] of [[19, 14], [45, 30], [22, 33]]) px(g, x, y - f % 3, '#c8f4ee');
        spr(g, 15 + [0, 1, 1, 2, 1, 1][f], 30 + wave(f), FISH, { k: K, c: '#e23a3a', w: '#ffffff' });
        spr(g, 41 - [0, 1, 1, 2, 1, 1][f], 16 + wave(f + 3), FISH, { k: K, c: '#3a6ad8', w: '#ffffff' }, true); },
      wear(g, f) {
        const sway = [0, 1, 1, 0, -1, -1][f];
        for (let y = 11; y <= 20; y++) {
          const x0 = 27 + Math.round(sway * (20 - y) / 9);
          px(g, x0 - 1, y, K); px(g, x0 + 11, y, K);
          px(g, x0, y, Math.floor((y - 11) / 2) % 2 ? '#fdf6ea' : '#e23a3a', 11);
          px(g, x0 + 9, y, Math.floor((y - 11) / 2) % 2 ? '#e0d8c8' : '#b82424');
        }
        px(g, 27 + sway - 1, 10, K, 13);
        px(g, 23, 21, K, 19, 3); px(g, 24, 22, '#e23a3a', 17); px(g, 24, 21, '#ff6a6a', 17);
      }
    },
    poe: {
      bg(g, f) { fill(g, '#43356e'); alpha(g, .25, () => disc(g, 19, 16, 6, '#f4ecc8')); disc(g, 19, 16, 3, '#f4ecc8'); disc(g, 20, 15, 3, '#43356e');
        for (const [x, y, k] of [[44, 13, 0], [24, 12, 1], [47, 22, 2], [16, 26, 1], [38, 11, 2]]) if ((f + k) % 3) px(g, x, y, '#e8e0ff'); },
      wear(g, f) {
        const H = '#141018'; px(g, 26, 20, H, 13); px(g, 24, 21, H, 17); px(g, 24, 22, H, 5); px(g, 35, 22, H, 6); px(g, 24, 23, H, 2); px(g, 39, 23, H, 2);
        /* "perched, and sat, and nothing more": the raven sits on his head */
        const flap = f === 2 || f === 3, pal = { k: '#16121f', e: '#ffd84a', g: '#9a9aa6', y: '#7a7a86', s: '#6a5aa8' };
        spr(g, 29, 12, RAVEN, pal);
        px(g, 32, 15, pal.s, 3); px(g, 33, 16, pal.s, 3); px(g, 31, 13, pal.s);
        if (flap) spr(g, 33, 8, ['...k', '..ks', '.kks', 'kks.'], pal);
        if (f === 3) px(g, 28, 15, pal.g);
      }
    },
    dick: {
      bg(g, f) { fill(g, '#f6cad8'); for (const [x, y0] of [[18, 12], [46, 20], [24, 30], [43, 8]]) { const y = 10 + (y0 + f * 3) % 40; px(g, x + (f % 2), y, '#ff8fb1'); px(g, x + 1 + (f % 2), y, '#ffb8cf'); } },
      wear(g) {
        const H = '#3a2216', L = '#5a3a26';
        px(g, 27, 20, H, 11); px(g, 25, 21, H, 15); px(g, 24, 22, H, 17); px(g, 32, 21, '#24140c', 1, 2);
        px(g, 24, 23, H, 4); px(g, 37, 23, H, 4); px(g, 23, 24, H, 3, 4); px(g, 39, 24, H, 3, 4);
        px(g, 27, 21, L, 3); px(g, 35, 21, L, 2);
      },
      fg(g, f) {
        px(g, 21, 37, '#4a9a3a', 1, 6); px(g, 22, 39, '#6abc4a');
        for (const [x, y] of [[20, 35], [22, 35], [21, 34], [21, 36], [20, 34], [22, 36], [20, 36], [22, 34]]) px(g, x, y, '#ffffff');
        px(g, 21, 35, '#ffd23a');
        const [bx, by] = [[42, 16], [45, 14], [46, 17], [43, 19], [40, 17], [41, 14]][f];
        spr(g, bx, by, f % 2 ? BEE.slice(1) : BEE, { k: K, y: '#ffd23a', w: '#ffffff' });
      }
    },
    hemi: {
      bg(g, f) { fill(g, '#8ecbf0'); disc(g, 45, 15, 3, '#ffe27a'); px(g, 0, 43, '#2a6fb8', 64, 21); px(g, 0, 43, '#4a8fd0', 64, 1);
        for (let k = 0; k < 6; k++) { const x = 15 + (k * 6 + f) % 34; px(g, x, 43, '#ffffff', 2); px(g, x + 3, 46, '#7ab4e8', 2); }
        const [mx, my] = [[16, 44], [17, 40], [19, 37], [21, 37], [23, 40], [24, 44]][f];
        if (my < 43) spr(g, mx, my, ['...kkk.k', 'kkbbbbkk', '...kkk.k'], { k: '#1a3a5a', b: '#5a8aba' }); else px(g, mx + 2, 42, '#ffffff', 3);
      },
      wear(g) {
        const W = '#f4f4f0', S = '#c9c9c4';
        px(g, 24, 30, W, 2, 6); px(g, 39, 30, W, 2, 6); px(g, 29, 34, W, 7);
        px(g, 25, 36, W, 15); px(g, 26, 37, W, 13); px(g, 27, 38, S, 11); px(g, 29, 39, S, 7); px(g, 31, 40, S, 3);
      }
    },
    christie: {
      bg(g) { fill(g, '#6a4c9c'); for (let y = 12; y < 50; y += 6) for (let x = 15 + (y / 6 % 2) * 3; x < 50; x += 6) px(g, x, y, '#7d62b2'); },
      fg(g, f) {
        spr(g, 41, 44, BANANA, { k: K, y: '#ffd23a' });
        if (f === 1 || f === 4) { px(g, 44, 45, '#ffffff'); px(g, 43, 44, '#fff6c0'); px(g, 45, 46, '#fff6c0'); }
        if (f < 4) spr(g, 17, 24 - f * 2, QMARK, { q: '#ffe680' });
        const [gx, gy] = [[46, 37], [47, 37], [48, 38], [48, 39], [47, 40], [46, 39]][f]; px(g, gx, gy, '#ffffff');
      }
    },
    woolf: {
      bg(g, f) {
        fill(g, '#86c2b4'); px(g, 0, 44, '#3d7f9a', 64, 20);
        for (let k = 0; k < 5; k++) px(g, 15 + (k * 7 + f) % 34, 44, '#d8f0f0', 2);
        px(g, 16, 24, '#f4f4ee', 4, 20); for (const y of [28, 34, 40]) px(g, 16, y, '#d04040', 4, 2);
        px(g, 15, 21, K, 6, 3); px(g, 17, 22, '#ffe27a', 2); px(g, 16, 19, '#d04040', 4, 2);
        if (f < 3) alpha(g, .35, () => { for (let k = 0; k < 18; k++) px(g, 20 + k, 22 - Math.floor(k / 3), '#fff4b8', 1, 1 + Math.floor(k / 3) * 2); });
        else px(g, 19, 21, '#fff4b8', 1, 3);
      },
      wear(g) {
        const H = '#7a5032', L = '#9a6a44';
        px(g, 27, 20, H, 11); px(g, 25, 21, H, 15); px(g, 24, 22, H, 17); px(g, 32, 21, '#5a3a22', 1, 2);
        px(g, 24, 23, H, 3); px(g, 38, 23, H, 3); px(g, 23, 24, H, 2, 3); px(g, 40, 24, H, 2, 3);
        disc(g, 41, 20, 2, H); px(g, 40, 19, L, 2); px(g, 28, 21, L, 3);
      }
    },
    austen: {
      bg(g) { fill(g, '#f2d79a'); for (let x = 15; x < 50; x += 4) px(g, x, 0, '#e8c87e', 1, 64); },
      wear(g) {
        const S = '#e8c070', D = '#c49a48', R = '#5a8ad8';
        px(g, 28, 15, K, 9); px(g, 26, 16, K, 13); px(g, 24, 17, K, 17, 6);
        px(g, 28, 16, S, 9); px(g, 26, 17, S, 13); px(g, 25, 18, S, 15, 4);
        px(g, 21, 21, K, 4, 10); px(g, 40, 21, K, 4, 10); px(g, 22, 21, S, 2, 9); px(g, 41, 21, S, 2, 9); px(g, 22, 29, D, 2); px(g, 41, 29, D, 2);
        px(g, 25, 21, R, 15); px(g, 25, 22, D, 15);
        px(g, 25, 30, R, 1, 4); px(g, 39, 30, R, 1, 4); px(g, 29, 35, R, 7); px(g, 31, 36, R, 3); px(g, 28, 36, R); px(g, 35, 36, R);
      },
      fg(g, f) {
        px(g, 41, 42, '#ffffff', 6, 3); px(g, 41, 41, '#5a8ad8', 6); px(g, 47, 42, K, 1, 2); px(g, 40, 45, '#ffffff', 8); px(g, 41, 44, '#dfe8f2', 6);
        alpha(g, .75, () => { for (let k = 0; k < 2; k++) for (let j = 0; j < 4; j++) px(g, 42 + k * 3 + [0, 1, 0, -1][(j + f + k * 2) % 4], 39 - j - (f % 2), '#ffffff'); });
      }
    },
    tolken: {
      bg(g) { fill(g, '#a8d8f0'); for (let y = 34; y < 64; y++) { const w = Math.min(64, (y - 34) * 4 + 18); px(g, 32 - w / 2 - 8, y, '#6fb04a', w + 16, 1); }
        px(g, 15, 37, '#7a5030', 7, 9); px(g, 16, 38, '#2f7a3a', 5, 8); px(g, 16, 37, '#7a5030', 5); px(g, 20, 41, '#ffd23a'); px(g, 18, 38, '#4aa04a', 1, 7); },
      wear(g, f) {
        px(g, 34, 35, K, 6, 2); px(g, 34, 35, '#7a4a24', 5); px(g, 39, 31, K, 5, 6); px(g, 40, 32, '#8a5a2c', 3, 4); px(g, 40, 32, '#a8743c', 1, 4); px(g, 40, 31, f % 3 ? '#ff8a3a' : '#ffd23a', 3);
      },
      fg(g, f) {
        for (let k = 0; k < 2; k++) { const s = (f + k * 3) % 6, x = 39 + Math.floor(s / 2), y = 27 - s * 3; if (y > 10) alpha(g, 1 - s / 8, () => spr(g, x, y, ['.oo.', 'o..o', 'o..o', '.oo.'], { o: '#ffffff' })); }
        const y = 20 + [0, -1, -1, 0, 1, 1][f];
        spr(g, 17, y, ['.gg.', 'g..g', 'g..d', '.dd.'], { g: '#ffd23a', d: '#c8901a' });
        if (f === 2) { px(g, 16, y - 1, '#ffffff'); px(g, 21, y + 1, '#fff6c0'); }
      }
    },
    twain: {
      bg(g, f) {
        fill(g, '#f4c58a'); px(g, 0, 26, '#f0a878', 64, 8); px(g, 0, 34, '#e88a70', 64, 6); px(g, 0, 40, '#4f8fc0', 64, 24);
        for (let k = 0; k < 5; k++) px(g, 15 + (k * 7 + f * 2) % 34, 41 + k % 3 * 2, '#9ccbf0', 2);
        px(g, 15, 35, '#f4f4ee', 8, 2); px(g, 16, 33, '#f4f4ee', 5, 2); px(g, 15, 37, K, 8); px(g, 17, 30, K, 1, 3); px(g, 19, 30, K, 1, 3);
        px(g, 22, 34, '#c83a3a', 2, 3); px(g, 22 + f % 2, 34 + f % 2, '#ffd0c0');
        for (let k = 0; k < 2; k++) { const s = (f + k * 3) % 6; alpha(g, 1 - s / 7, () => px(g, 17 + k * 2 + (s >> 1), 28 - s * 2, '#bdbdbd', 2, 2)); }
      },
      wear(g) { const W = '#f4f4f0', S = '#c9c9c4'; px(g, 28, 33, W, 9); px(g, 26, 34, W, 13); px(g, 26, 35, S, 3); px(g, 36, 35, S, 3); px(g, 26, 36, S, 2); px(g, 37, 36, S, 2); px(g, 28, 33, K); px(g, 36, 33, K); }
    },
    chimpens: {
      bg(g, f) {
        fill(g, '#55657e'); px(g, 0, 40, '#6a7a92', 64, 24);
        alpha(g, .3, () => disc(g, 17, 21, 5, '#ffe9a8'));
        px(g, 17, 24, '#2a2a34', 1, 26); px(g, 15, 20, K, 5, 4); px(g, 16, 21, '#ffe9a8', 3, 2);
        for (const [x, y0] of [[22, 3], [45, 11], [28, 25], [40, 31], [47, 2], [19, 34], [35, 17]]) px(g, x + (f >> 1) % 2, 10 + (y0 + f * 2) % 40, '#ffffff');
      },
      fg(g, f) {
        px(g, 38, 43, '#f8f0d8', 10, 6); px(g, 38, 49, '#d8ccac', 10);
        for (const y of [44, 46]) px(g, 39, y, '#3a2a2a', Math.max(0, f + (y === 46 ? -2 : 1)));
        const tx = 40 + f, ty = 44 + (f % 2);
        for (let k = 0; k < 9; k++) px(g, tx + Math.round(k * .45), ty - k, k < 2 ? '#3a2a2a' : k > 4 ? '#ffffff' : '#e8e8e8');
        px(g, tx + 3, ty - 7, '#ffffff', 2, 2);
      }
    },
    potter: {
      bg(g, f) {
        fill(g, '#a8dc84'); for (const [x, y] of [[44, 14], [19, 18], [46, 26]]) { px(g, x, y, '#ff8fb1'); px(g, x + 1, y + 1, '#ffd23a'); }
        px(g, 0, 47, '#7a5030', 64, 17); for (const x of [36, 41, 46]) { px(g, x, 45 + (f + x) % 2, '#4aa03a', 1, 2); px(g, x + 1, 45, '#4aa03a'); px(g, x, 47, '#ff8a3a', 2, 2); }
      },
      wear(g) {
        const S = '#e9c46a', D = '#c9a24a';
        px(g, 26, 15, K, 13, 6); px(g, 27, 16, S, 11, 4); px(g, 27, 20, '#d06a8a', 11);
        px(g, 20, 21, K, 25, 3); px(g, 21, 22, S, 23); px(g, 21, 21, D, 23);
      },
      fg(g, f) { spr(g, 15, 41 + [0, -2, -3, -2, 0, 0][f], BUNNY, { k: K, b: '#d8b088', p: '#f0b0b8', e: K, j: '#4a7ad0' }); }
    },
    fitz: {
      bg(g, f) {
        fill(g, '#14323a');
        alpha(g, .45, () => { for (let a = -3; a <= 3; a++) for (let k = 0; k < 40; k++) px(g, 32 + Math.round(a * k / 4), 63 - k, '#c8a040'); });
        px(g, 0, 31, '#0e2a30', 64, 1);
        const on = f !== 4 && f !== 5; px(g, 17, 28, on ? '#4cff7a' : '#2a8a4a'); if (f === 1) alpha(g, .4, () => disc(g, 17, 28, 2, '#4cff7a'));
      },
      wear(g) { px(g, 25, 20, '#1a1410', 15, 3); px(g, 24, 22, '#1a1410', 3, 3); px(g, 38, 22, '#1a1410', 3, 3); px(g, 28, 21, '#5a4a3a', 4); },
      fg(g, f) {
        px(g, 42, 35, '#e8f4f8', 7); px(g, 43, 36, '#e8f4f8', 5); px(g, 43, 35, '#f8d860', 5); px(g, 44, 36, '#f8d860', 3);
        px(g, 45, 37, '#e8f4f8', 1, 4); px(g, 43, 41, '#e8f4f8', 5);
        for (let k = 0; k < 3; k++) { const s = (f + k * 2) % 6; if (s < 5) px(g, 44 + k, 33 - s, '#fff8d0'); }
      }
    },
    shakes: {
      bg(g, f) {
        fill(g, '#3a0c16');
        alpha(g, f === 3 ? .12 : .2, () => { for (let y = 10; y < 50; y++) { const w = 6 + Math.floor((y - 10) / 2); px(g, 32 - w, y, '#ffe8b0', w * 2, 1); } });
        for (const x0 of [15, 46]) { px(g, x0, 0, '#b0182a', 4, 64); px(g, x0 + 1, 0, '#7a0e1c', 1, 64); }
        px(g, 15, 10, '#b0182a', 35, 3); px(g, 15, 13, '#d8a840', 35);
      },
      wear(g) {
        const W = '#fbfaf4', S = '#cfcfc8';
        px(g, 26, 37, W, 13); px(g, 23, 38, K, 19); px(g, 22, 39, K, 21, 3); px(g, 23, 42, K, 19);
        px(g, 23, 39, W, 19); for (let x = 23; x <= 41; x++) px(g, x, 40, x % 2 ? S : W); px(g, 24, 41, S, 17); px(g, 24, 39, '#ffffff', 17);
        px(g, 22, 31, '#ffd23a');
      },
      fg(g, f) { spr(g, 17, 35 + [0, -1, -2, -2, -1, 0][f], SKULL, { b: '#efe8d4', s: '#c8bfa8', k: K }); }
    },
    carroll: {
      bg(g) { fill(g, '#82c8b8'); for (let y = 44; y < 50; y += 2) for (let x = 15; x < 50; x += 2) px(g, x, y, ((x + y) / 2) % 2 ? '#2a2a34' : '#f4f4ee', 2, 2); },
      wear(g, f) {
        const B = '#7a4a2a', D = '#5a3220', bob = f >= 3 ? 1 : 0;
        for (let y = 9; y <= 20; y++) {
          const grow = Math.floor((20 - y) / 4), tilt = Math.floor((20 - y) / 4), x0 = 27 - grow + tilt, w = 11 + grow * 2;
          px(g, x0 - 1, y + bob, K, w + 2); px(g, x0, y + bob, B, w); px(g, x0 + w - 2, y + bob, D, 2);
        }
        px(g, 26, 18 + bob, '#d84a4a', 13, 2); px(g, 35, 14 + bob, '#fdfaf0', 4, 4); px(g, 36, 15 + bob, K); px(g, 37, 16 + bob, K, 1, 2);
        px(g, 23, 21, K, 19, 2); px(g, 24, 21, B, 17);
      },
      fg(g, f) {
        const dx = [-2, -1, 1, 2, 1, -1][f], cx = 20 + dx;
        for (let k = 0; k < 4; k++) px(g, 20 + Math.round(dx * k / 4), 44 + k, '#d8b040');
        px(g, cx - 1, 47, K, 4, 3); px(g, cx, 47, '#ffd23a', 2, 3); px(g, cx, 48, '#ffffff', 2); px(g, cx, 48, K);
        const ear = f === 2 || f === 3;
        spr(g, 44, 42, ear ? ['.k.k', 'kpkp', 'kwkw', 'kwwwk', 'wwrww', 'wwwww', 'kwwwk'] : RABBIT, { k: K, p: '#f4a8b8', w: '#f8f8f8', r: '#d83a4a' });
      }
    },
    homer: {
      bg(g, f) {
        fill(g, '#5aa0e0'); px(g, 0, 42, '#2a68b0', 64, 22); for (let k = 0; k < 5; k++) px(g, 15 + (k * 7 + f) % 34, 42 + k % 2 * 3, '#d8ecff', 2);
        px(g, 15, 18, '#f2f0e8', 5, 32); px(g, 16, 18, '#cfccc0', 1, 32); px(g, 18, 18, '#cfccc0', 1, 32); px(g, 14, 15, '#f2f0e8', 7, 3); px(g, 14, 17, '#cfccc0', 7);
      },
      wear(g) {
        const W = '#ece6d6', S = '#c9c1ad';
        px(g, 24, 30, W, 2, 6); px(g, 39, 30, W, 2, 6); px(g, 29, 34, W, 7);
        px(g, 25, 36, W, 15); px(g, 25, 37, W, 15); px(g, 26, 38, W, 13); px(g, 27, 39, W, 11); px(g, 28, 40, S, 9); px(g, 30, 41, S, 5); px(g, 31, 42, K, 3);
        for (let x = 23; x <= 41; x += 2) { px(g, x, 21, '#8cc860'); px(g, x + 1, 20 + (x % 4 === 1 ? 0 : 2), '#4f8a2e'); px(g, x, 22, '#5f9a3a'); }
        px(g, 31, 19, '#d8b030'); px(g, 33, 19, '#d8b030');
      },
      fg(g, f) {
        const G = '#d8a830';
        px(g, 43, 34, G, 6); px(g, 43, 34, G, 1, 8); px(g, 48, 34, G, 1, 8); px(g, 43, 41, G, 6, 2); px(g, 42, 33, G); px(g, 49, 33, G);
        px(g, 45, 35, '#fff4d0', 1, 6); px(g, 46, 35, '#fff4d0', 1, 6);
        for (let k = 0; k < 2; k++) { const s = (f + k * 3) % 6; if (s < 5) alpha(g, 1 - s / 6, () => spr(g, 44 + k * 3 + (s % 2), 29 - s * 2, NOTE, { n: '#ffffff' })); }
      }
    }
  };

  /* ---------- pixel: one strip of six frames, plus a still silhouette for muses you have not met ---------- */
  const strips = {}, stills = {};
  function frame(id, f, veiled) {
    const cv = document.createElement('canvas'); cv.width = FW; cv.height = FH;
    const g = cv.getContext('2d'), sc = PX[id] || {}, o = OUTFIT[id] || {}, bob = !veiled && f >= 3 ? 1 : 0;
    g.imageSmoothingEnabled = false; g.translate(-SX, -SY);
    if (!veiled) sc.bg?.(g, f);
    g.save(); g.translate(0, bob);
    if (CA) g.drawImage(CA.pose(vid(id), 'idle', { hat: o.hat || 0 }), 0, 0);
    sc.wear?.(g, f);
    g.restore();
    if (!veiled) sc.fg?.(g, f);
    return cv;
  }
  function stripURL(id) {
    if (strips[id]) return strips[id];
    const cv = document.createElement('canvas'); cv.width = FW * N; cv.height = FH;
    const g = cv.getContext('2d'); for (let f = 0; f < N; f++) g.drawImage(frame(id, f, false), f * FW, 0);
    return (strips[id] = cv.toDataURL());
  }
  const stillURL = id => stills[id] || (stills[id] = frame(id, 0, true).toDataURL());

  const ids = Object.keys(OUTFIT);
  window.MuseArt = {
    ids,
    has: id => ids.includes(id),
    html(id, veiled = false) {
      if (!ids.includes(id)) return '';
      if (veiled) return `<img alt="" src="${stillURL(id)}" class="ma-still">`;
      return `<i class="ma-strip" style="background-image:url(${stripURL(id)})"></i>`;
    }
  };
})();
