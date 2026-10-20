/* MUSE ART: animated portraits for the Muses (ops.js renderMuses).
   Every muse is a typist monkey (crew-art.js / crew-svg.js) dressed as their namesake, standing in a little scene with props that move.
   Pixel: six 34x39 frames are drawn once per muse onto one strip and played by CSS steps() (ops.css .ma-strip).
   Classic: one inline SVG on top of CrewSvg, with parts animated by CSS classes (ops.css .ma-*).
   Coordinates are in the typists' 64x64 sprite space. Pixel: head centre about 32,28, paws about 20,43 and 44,43, crop x 15-49, y 10-49.
   Classic (a bigger vector monkey): head centre 32,22, paws 20.5,46.6 and 43.5,46.6, crop x 10-54, y 0-50.
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
  /* the same outfits as CrewSvg looks (classic) */
  const CLASSIC = {
    seuss:    { top: ['jacket', '#2b4fa8', '#ffffff', '#e23a3a'], sleeves: '#2b4fa8', bottom: '#2b3a6a', shoes: '#1a1a22', head: [] },
    poe:      { top: ['vest', '#f4f2ee', '#1c1a22', '#2a2632'], sleeves: '#1c1a22', bottom: '#1c1a22', shoes: '#0c0c10', head: [] },
    dick:     { top: ['chef', '#ffffff', '#c8b8c8'], sleeves: '#ffffff', bottom: '#ffffff', robe: 1, shoes: '#5a3a2a', head: [] },
    hemi:     { top: ['stripes', '#ffffff', '#162c4a'], sleeves: '#ffffff', bottom: '#b8a47a', shoes: '#5a3a1e', head: [] },
    christie: { top: ['vest', '#f4f6f4', '#4b6136', '#871632'], sleeves: '#f4f6f4', bottom: '#16191d', shoes: '#5a3a1e', head: ['temples', '#c8d0d8'], eyes: 'monocle', stache: 1, prop: ['magnifier'] },
    woolf:    { top: ['jacket', '#6d7f5a', '#f8f2e4'], sleeves: '#6d7f5a', bottom: '#4a5a40', robe: 1, shoes: '#3a2a1a', head: [] },
    austen:   { top: ['chef', '#cfe2f6', '#5a8ad8'], sleeves: '#cfe2f6', bottom: '#cfe2f6', robe: 1, shoes: '#e8d8c8', head: [], scarf: '#5a8ad8' },
    tolken:   { top: ['jacket', '#6a5a3a', '#f8f2e4', '#3a5a2a'], sleeves: '#6a5a3a', bottom: '#8e7454', shoes: '#462412', head: [] },
    twain:    { top: ['jacket', '#f0f0e8', '#ffffff', '#1a1a1a'], sleeves: '#f0f0e8', bottom: '#e8e8e0', shoes: '#3a2a1a', head: [] },
    chimpens: { top: ['jacket', '#3a2a3a', '#f8f2e4', '#c8a040'], sleeves: '#3a2a3a', bottom: '#4a4a52', shoes: '#141418', head: [] },
    potter:   { top: ['overalls', '#e6dcbe', '#3a6aa8'], sleeves: '#e6dcbe', bottom: '#3a6aa8', shoes: '#5a3a1e', head: [] },
    fitz:     { top: ['tux', '#12141a', '#ffffff', '#12141a'], sleeves: '#12141a', bottom: '#12141a', shoes: '#0c0c10', head: [], hands: '#ffffff' },
    shakes:   { top: ['jacket', '#1a1a22', '#2a2a34'], sleeves: '#1a1a22', bottom: '#2a2a34', shoes: '#141418', head: [] },
    carroll:  { top: ['tux', '#2f5e34', '#ffffff', '#d8a840'], sleeves: '#2f5e34', bottom: '#d8a840', shoes: '#1a1a22', head: [], hands: '#ffffff' },
    homer:    { top: ['robe', '#f4f2ea', '#d8a830'], sleeves: '#f4f2ea', bottom: '#f4f2ea', robe: 1, shoes: '#c89a50', head: [] }
  };
  const vid = id => 'muse_' + id;
  function register() {
    if (!CA) return;
    for (const [id, o] of Object.entries(OUTFIT)) {
      const B = CA.getVariant(o.base), key = vid(id);
      CA.VARIANTS[key] = { ...B, ...o.set, id: key, slug: key, fur: CA.FUR_PALETTES[o.fur] || B.fur, skin: CA.SKIN_PALETTES[o.fur] || B.skin, colors: { ...B.colors, ...o.colors } };
    }
    if (window.CrewSvg?.define) for (const [id, spec] of Object.entries(CLASSIC)) CrewSvg.define(vid(id), spec);
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

  /* ---------- classic: SVG scene around the CrewSvg monkey ---------- */
  const O = '#3d2410';
  const st = (c, w = 1.2) => `fill="${c}" stroke="${O}" stroke-width="${w}" stroke-linejoin="round"`;
  const ln = (c, w = 1.4) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const sky = c => `<rect x="0" y="0" width="64" height="64" fill="${c}"/>`;
  const anim = (cls, ox, oy, extra = '') => `class="${cls}"${extra ? ` style="${extra}"` : ''}`;   // pivots live in ops.css (fill-box), so the crop never moves them
  const fishSvg = (x, y, c, flip) => `<g transform="translate(${x} ${y})${flip ? ' scale(-1 1)' : ''}"><path d="M-3 0 C-1 -2.6 3 -2.6 4.5 0 C3 2.6 -1 2.6 -3 0 Z M4 0 L7 -2.4 L7 2.4 Z" ${st(c, .8)}/><circle cx="-1.2" cy="-.4" r=".6" fill="#fff"/></g>`;
  const beard = (long) => `<path d="M24.5 27 C25 34 28 ${long ? 42 : 37} 32 ${long ? 43 : 38} C36 ${long ? 42 : 37} 39 34 39.5 27 C37 31 35 32 32 32 C29 32 27 31 24.5 27 Z" ${st('#f4f4f0', .9)}/><path d="M29.4 30.2 q2.6 1.4 5.2 0" ${ln(O, 1)}/>`;
  const SV = {
    seuss: {
      bg: `${sky('#86d8cf')}<g ${anim('ma-bob', 18, 42)}>${fishSvg(18, 42, '#e23a3a')}</g><g ${anim('ma-bob', 45, 18, 'animation-delay:-1s')}>${fishSvg(45, 18, '#3a6ad8', true)}</g>`,
      wear: `<g ${anim('ma-sway', 32, 13)}><path d="M26 13 L27 1 L37 1 L38 13 Z" ${st('#fdf6ea')}/>${[0, 4, 8].map(y => `<path d="M26.6 ${9 - y} L37.4 ${9 - y} L37.6 ${12.4 - y} L26.4 ${12.4 - y} Z" fill="#e23a3a"/>`).join('')}<path d="M20 13 C22 11 42 11 44 13 C42 15.5 22 15.5 20 13 Z" ${st('#e23a3a')}/></g>`
    },
    poe: {
      bg: `${sky('#2b2046')}<path d="M17 12 a5 5 0 1 0 5 7 a4 4 0 1 1 -5 -7 Z" fill="#f4ecc8"/>${[[44, 13], [24, 12], [47, 22], [38, 11]].map(([x, y], k) => `<circle cx="${x}" cy="${y}" r=".7" fill="#e8e0ff" class="ma-twinkle" style="animation-delay:${-k * .4}s"/>`).join('')}`,
      wear: `<path d="M28.4 27.4 q1.8 -1.6 3.6 0 q1.8 -1.6 3.6 0" ${ln('#120c0c', 1.6)}/><path d="M20 15 C22 9 42 9 44 15 C40 12.6 24 12.6 20 15 Z" fill="#1c1418"/>`,
      fg: `<g transform="translate(43 30)"><path d="M-4 1 C-4 -4 3 -5 4 0 L6 6 L-1 7 Z" ${st('#1a1622', .8)}/><path d="M-4 -1 L-7 0 L-4 1 Z" fill="#6a6a74"/><circle cx="-2" cy="-1.4" r=".8" fill="#ffd84a"/><path ${anim('ma-flap', 1, 1)} d="M0 1 C3 -4 7 -4 8 -1 C6 0 3 2 1 4 Z" ${st('#2a2634', .8)}/></g>`
    },
    dick: {
      bg: `${sky('#f6cad8')}${[[18, 0], [46, -1], [26, -2], [41, -.5]].map(([x, d]) => `<ellipse cx="${x}" cy="10" rx="1.2" ry=".8" fill="#ff8fb1" class="ma-fall" style="animation-delay:${d}s"/>`).join('')}`,
      wear: `<path d="M20.5 24 C19 12 45 12 43.5 24 C42 20 38 16 32 16.5 C26 16 22 20 20.5 24 Z" fill="#3a2216"/><path d="M32 13.6 v4" ${ln('#24140c', 1)}/>`,
      fg: `<path d="M21 46 L21 37" ${ln('#4a9a3a', 1.2)}/>${[0, 60, 120, 180, 240, 300].map(r => `<ellipse cx="21" cy="33.6" rx=".9" ry="1.7" transform="rotate(${r} 21 35.3)" fill="#fff" stroke="${O}" stroke-width=".4"/>`).join('')}<circle cx="21" cy="35.3" r="1.1" fill="#ffd23a"/><g class="ma-buzz"><ellipse cx="44" cy="16" rx="1.8" ry="1.3" ${st('#ffd23a', .6)}/><path d="M43.4 14.8 v2.4 M44.6 14.8 v2.4" ${ln('#1a0f14', .6)}/><ellipse cx="43.6" cy="14.2" rx="1.1" ry=".7" fill="#fff" opacity=".85"/></g>`
    },
    hemi: {
      bg: `${sky('#8ecbf0')}<circle cx="46" cy="15" r="3.4" fill="#ffe27a"/><rect x="0" y="40" width="64" height="24" fill="#2a6fb8"/><g class="ma-drift"><path d="M0 40.6 q2 -1.2 4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0" ${ln('#ffffff', .8)}/></g><g class="ma-leap"><path d="M11 41 C13 39 17 39 19 41 C17 43 13 43 11 41 Z M19 41 l3 -2 v4 Z M11 41 l-3 -.6" ${st('#5a8aba', .7)}/></g>`,
      wear: beard(false)
    },
    christie: {
      bg: `${sky('#6a4c9c')}${Array.from({ length: 30 }, (_, k) => `<path d="M${15 + (k % 6) * 6 + (Math.floor(k / 6) % 2) * 3} ${12 + Math.floor(k / 6) * 7} l1 1 -1 1 -1 -1 Z" fill="#7d62b2"/>`).join('')}`,
      fg: `<path d="M41 49 C46 49 49 46 49 42 C47 45 44 46 41 46 Z" ${st('#ffd23a', .8)}/><circle cx="46" cy="45.5" r=".9" fill="#fff" class="ma-twinkle"/><text x="17" y="26" font-size="6" font-weight="900" fill="#ffe680" class="ma-rise">?</text><circle cx="48.8" cy="38.4" r=".8" fill="#fff" class="ma-twinkle" style="animation-delay:-.6s"/>`
    },
    woolf: {
      bg: `${sky('#86c2b4')}<path ${anim('ma-beam', 13.5, 19)} d="M13.5 19 L50 11 L50 27 Z" fill="#fff4b8" opacity=".45"/><rect x="0" y="41" width="64" height="23" fill="#3d7f9a"/><path d="M11 41 L12 21 L15 21 L16 41 Z" ${st('#f4f4ee', .8)}/><path d="M11.8 27h3.4M11.6 33h3.8M11.4 39h4.2" ${ln('#d04040', 1.6)}/><rect x="11" y="17.5" width="5" height="3.5" ${st('#2a2a34', .8)}/><circle cx="13.5" cy="19.2" r="1.1" fill="#ffe27a"/><path d="M11 17.5 L13.5 15 L16 17.5 Z" fill="#d04040"/><g class="ma-drift"><path d="M0 41.6 q2 -1 4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0" ${ln('#d8f0f0', .7)}/></g>`,
      wear: `<path d="M20.5 24 C19 12 45 12 43.5 24 C42 20 38 16.5 32 17 C26 16.5 22 20 20.5 24 Z" fill="#7a5032"/><circle cx="42" cy="15" r="3" fill="#7a5032" stroke="${O}" stroke-width=".8"/>`
    },
    austen: {
      bg: `${sky('#f2d79a')}${[17, 21, 25, 29, 33, 37, 41, 45].map(x => `<path d="M${x} 0 v64" ${ln('#e8c87e', 1)}/>`).join('')}`,
      wear: `<path d="M18 30 C15 12 49 12 46 30 L42 30 C43 18 21 18 22 30 Z" ${st('#e8c070')}/><path d="M23 13.6 C26 7 38 7 41 13.6 Z" ${st('#e8c070')}/><path d="M21 17 C27 14 37 14 43 17" ${ln('#5a8ad8', 1.8)}/><path d="M29.5 37 l2.5 -1.4 2.5 1.4 -2.5 1.4 Z" fill="#5a8ad8"/>`,
      fg: `<path d="M41 41 h7 l-1 4 h-5 Z" ${st('#ffffff', .8)}/><path d="M41 41 h7" ${ln('#5a8ad8', 1)}/><path d="M48 42 q2 0 1.4 2 l-1.6 .4" ${ln(O, .7)}/><ellipse cx="44.5" cy="45.6" rx="4.6" ry="1" ${st('#ffffff', .6)}/>${[0, 1].map(k => `<path d="M${43 + k * 2.4} 39 q1.2 -1.6 0 -3.2 q-1.2 -1.6 0 -3.2" ${ln('#ffffff', .8)} class="ma-steam" style="animation-delay:${-k * .8}s"/>`).join('')}`
    },
    tolken: {
      bg: `${sky('#a8d8f0')}<ellipse cx="32" cy="66" rx="40" ry="31" fill="#6fb04a"/><circle cx="14" cy="41" r="4.2" ${st('#7a5030', .8)}/><circle cx="14" cy="41" r="3" fill="#2f7a3a"/><circle cx="15.7" cy="41.4" r=".7" fill="#ffd23a"/>`,
      wear: `<path d="M34 30.4 L38.4 31.6" ${ln('#5a3418', 1.2)}/><path d="M37.4 27.6 h3.4 v3.4 q-1.7 1.4 -3.4 0 Z" ${st('#7a4a24', .7)}/><ellipse cx="39.1" cy="27.6" rx="1.5" ry=".5" fill="#ff8a3a" class="ma-twinkle"/>`,
      fg: `${[0, 1].map(k => `<circle cx="40" cy="25" r="1.3" ${ln('#eef0f6', .7)} class="ma-ring" style="animation-delay:${-k * 1.2}s"/>`).join('')}<g ${anim('ma-bob', 13.5, 9)}><circle cx="13.5" cy="9" r="1.8" ${ln('#ffd23a', 1)}/><circle cx="12.6" cy="7.8" r=".5" fill="#fff" class="ma-twinkle"/></g>`
    },
    twain: {
      bg: `<rect width="64" height="26" fill="#f4c58a"/><rect y="26" width="64" height="8" fill="#f0a878"/><rect y="34" width="64" height="6" fill="#e88a70"/><rect y="40" width="64" height="24" fill="#4f8fc0"/><g class="ma-drift"><path d="M0 42 h3 M8 44 h3 M16 42 h3 M24 44 h3 M32 42 h3 M40 44 h3 M48 42 h3 M56 44 h3 M64 42 h3 M72 44 h3" ${ln('#9ccbf0', .8)}/></g><path d="M10 36 h8 l-1 2 h-6 Z" ${st('#f4f4ee', .6)}/><rect x="11" y="33.6" width="5" height="2.4" ${st('#f4f4ee', .6)}/><path d="M12 33.6 v-3 M14.3 33.6 v-3" ${ln('#1a1a22', 1)}/><g ${anim('ma-spin', 18, 36)}><circle cx="18" cy="36" r="1.6" ${st('#c83a3a', .5)}/><path d="M16.4 36 h3.2 M18 34.4 v3.2" ${ln('#ffd0c0', .5)}/></g>${[0, 1].map(k => `<circle cx="${12 + k * 2.3}" cy="29.4" r="1" fill="#d8d8d8" class="ma-puff" style="animation-delay:${-k * .9}s"/>`).join('')}`,
      wear: `${[[21, 13, -1], [43, 13, 1]].map(([x, y, d]) => `<path d="M${x} ${y + 6} c${-3 * d} -1 ${-4 * d} -5 ${-1 * d} -6 c0 -3 ${4 * d} -4 ${6 * d} -2 c2 -2 ${5 * d} 0 ${4 * d} 2" ${st('#f4f4f0', .8)}/>`).join('')}<path d="M26 11.6 c2 -3 10 -3 12 0" ${st('#f4f4f0', .8)}/><path d="M26.6 28.6 C28 26.6 31 26.8 32 28 C33 26.8 36 26.6 37.4 28.6 C37.6 30.6 36.4 31.6 35 30.4 C34 29.6 33 29.4 32 29.6 C31 29.4 30 29.6 29 30.4 C27.6 31.6 26.4 30.6 26.6 28.6 Z" ${st('#f4f4f0', .7)}/>`
    },
    chimpens: {
      bg: `${sky('#55657e')}<rect y="40" width="64" height="24" fill="#6a7a92"/><circle cx="13" cy="15" r="5" fill="#ffe9a8" opacity=".3" class="ma-glow"/><path d="M13 18 v32" ${ln('#2a2a34', 1.2)}/><rect x="11" y="13" width="4" height="4.4" ${st('#ffe9a8', .8)}/>${[[22, 0], [45, -1], [28, -2], [40, -.6], [47, -1.6], [35, -2.4]].map(([x, d]) => `<circle cx="${x}" cy="10" r=".6" fill="#fff" class="ma-snow" style="animation-delay:${d}s"/>`).join('')}`,
      fg: `<rect x="38" y="43" width="10" height="6" ${st('#f8f0d8', .6)}/><path d="M39.4 45 h5 M39.4 47 h3" ${ln('#3a2a2a', .5)} class="ma-write"/><g ${anim('ma-scribble', 44, 44)}><path d="M44 44 L49 34 C51 35 50 39 46 41 Z" ${st('#ffffff', .6)}/><path d="M44 44 L48 36" ${ln('#c8c8c8', .5)}/></g>`
    },
    potter: {
      bg: `${sky('#a8dc84')}${[[44, 14], [19, 18], [46, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="#ff8fb1"/><circle cx="${x}" cy="${y}" r=".4" fill="#ffd23a"/>`).join('')}<rect y="45" width="64" height="19" fill="#7a5030"/>${[47, 51].map((x, k) => `<g ${anim('ma-wiggle', x, 45, `animation-delay:${-k * .3}s`)}><path d="M${x} 45 l-1 -3 M${x} 45 l1 -3 M${x} 45 v-3.4" ${ln('#4aa03a', .9)}/></g>`).join('')}`,
      wear: `<path d="M24 14 C25 6 39 6 40 14 Z" ${st('#e9c46a')}/><path d="M25 12.6 h14" ${ln('#d06a8a', 1.6)}/><path d="M14 15 C20 11 44 11 50 15 C44 18 20 18 14 15 Z" ${st('#e9c46a')}/>`,
      fg: `<g class="ma-hop"><ellipse cx="15" cy="46" rx="3.6" ry="3" ${st('#b08058', .7)}/><path d="M13 45 h4 v2.6 h-4 Z" fill="#4a7ad0"/><circle cx="15.6" cy="41.4" r="2.4" ${st('#b08058', .7)}/><path d="M14.4 39.4 l-.8 -4.2 M16.6 39.4 l.6 -4.2" ${ln('#b08058', 1.4)}/><circle cx="16.4" cy="41" r=".5" fill="${O}"/></g>`
    },
    fitz: {
      bg: `${sky('#14323a')}<g opacity=".45">${[-3, -2, -1, 0, 1, 2, 3].map(a => `<path d="M32 64 L${32 + a * 10} 20" ${ln('#c8a040', .6)}/>`).join('')}</g><path d="M0 31 h64" ${ln('#0e2a30', 1)}/><circle cx="17" cy="28" r="1" fill="#4cff7a" class="ma-blink"/><circle cx="17" cy="28" r="2.6" fill="#4cff7a" opacity=".3" class="ma-blink"/>`,
      wear: `<path d="M21 21 C20 11 44 11 43 21 C40 16 26 15 21 21 Z" fill="#1a1410"/><path d="M26 15.6 q3 -1.4 6 -.4" ${ln('#5a4a3a', .8)}/>`,
      fg: `<path d="M41.6 35 h7.4 C48.6 38 46 39 45.3 39 C44.6 39 42 38 41.6 35 Z" ${st('#e8f4f8', .6)}/><path d="M42.4 35.8 h5.8 C47.6 37.4 46 38 45.3 38 C44.6 38 43 37.4 42.4 35.8 Z" fill="#f8d860"/><path d="M45.3 39 v4 M43 43 h4.6" ${ln('#e8f4f8', .8)}/>${[0, 1, 2].map(k => `<circle cx="${44 + k * 1.2}" cy="34" r=".45" fill="#fff8d0" class="ma-bubble" style="animation-delay:${-k * .4}s"/>`).join('')}`
    },
    shakes: {
      bg: `${sky('#3a0c16')}<path d="M26 0 L38 0 L52 50 L12 50 Z" fill="#ffe8b0" opacity=".18" class="ma-glow"/><path d="M15 0 q3 25 0 50 h-6 v-50 Z M49 0 q-3 25 0 50 h6 v-50 Z" fill="#b0182a"/><path d="M12 0 v50 M52 0 v50" ${ln('#7a0e1c', 1)}/><path d="M9 0 h46 v4 q-23 4 -46 0 Z" fill="#b0182a"/><path d="M9 4 q23 4 46 0" ${ln('#d8a840', .8)}/>`,
      wear: `<path d="M23 35 C24 32 40 32 41 35 C40 38 24 38 23 35 Z" ${st('#fbfaf4', .8)}/><path d="M25 34 l1.4 2 1.4 -2 1.4 2 1.4 -2 1.4 2 1.4 -2 1.4 2 1.4 -2 1.4 2 1.4 -2" ${ln('#cfcfc8', .5)}/><circle cx="19.5" cy="26" r=".8" fill="#ffd23a"/>`,
      fg: `<g ${anim('ma-bob', 18, 37)}><path d="M15 36 C15 32.4 21 32.4 21 36 C21 38 20 38.6 19.4 39.6 h-2.8 C16 38.6 15 38 15 36 Z" ${st('#efe8d4', .7)}/><circle cx="16.8" cy="36" r=".9" fill="${O}"/><circle cx="19.2" cy="36" r=".9" fill="${O}"/></g>`
    },
    carroll: {
      bg: `${sky('#82c8b8')}${Array.from({ length: 36 }, (_, k) => { const x = 14 + (k % 12) * 3, y = 44 + Math.floor(k / 12) * 2; return `<rect x="${x}" y="${y}" width="3" height="2" fill="${(k % 12 + Math.floor(k / 12)) % 2 ? '#2a2a34' : '#f4f4ee'}"/>`; }).join('')}`,
      wear: `<g ${anim('ma-bob', 32, 13)}><path d="M26 13.4 L24.8 1 L40.2 1.8 L38 13.4 Z" ${st('#7a4a2a')}/><path d="M25.6 10 L38.4 10.4 L38.2 12.6 L25.8 12.4 Z" fill="#d84a4a"/><rect x="34" y="5" width="4.4" height="3.4" transform="rotate(6 36 6.7)" ${st('#fdfaf0', .5)}/><text x="34.4" y="7.8" font-size="2.4" font-weight="700" fill="${O}" transform="rotate(6 36 6.7)">10/6</text><path d="M19.6 13.4 C22 11.6 42 11.6 44.4 13.4 C42 15.4 22 15.4 19.6 13.4 Z" ${st('#7a4a2a')}/></g>`,
      fg: `<g ${anim('ma-swing', 27, 40)}><path d="M27 40 V45" ${ln('#d8b040', .7)}/><circle cx="27" cy="46.4" r="2" ${st('#ffd23a', .6)}/><circle cx="27" cy="46.4" r="1.2" fill="#fff"/></g><g transform="translate(46 44)"><path ${anim('ma-twitch', 0, 0)} d="M-1.6 0 C-2.4 -4 -2.2 -6 -1.2 -6.4 C-.4 -6 -.4 -3 -.4 0 Z" ${st('#f8f8f8', .5)}/><path d="M1.6 0 C2.4 -4 2.2 -6 1.2 -6.4 C.4 -6 .4 -3 .4 0 Z" ${st('#f8f8f8', .5)}/><circle cx="0" cy="2.4" r="3.2" ${st('#f8f8f8', .6)}/><circle cx="-1.1" cy="2" r=".5" fill="#d83a4a"/><circle cx="1.1" cy="2" r=".5" fill="#d83a4a"/></g>`
    },
    homer: {
      bg: `${sky('#5aa0e0')}<rect y="40" width="64" height="24" fill="#2a68b0"/><g class="ma-drift"><path d="M0 41 q2 -1 4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0" ${ln('#d8ecff', .7)}/></g><rect x="10.6" y="12" width="5" height="38" ${st('#f2f0e8', .6)}/><path d="M12.2 13 v36 M14 13 v36" ${ln('#cfccc0', .5)}/><rect x="9.6" y="9.4" width="7" height="2.8" ${st('#f2f0e8', .6)}/>`,
      wear: `${beard(true)}<path d="M21 17 C25 11.6 39 11.6 43 17" ${ln('#5f9a3a', 2.4)}/>${[22.6, 25.6, 28.8, 32, 35.2, 38.4, 41.4].map((x, k) => `<ellipse cx="${x}" cy="${15.6 - (k > 1 && k < 5 ? 1.4 : 0)}" rx="1.4" ry=".7" transform="rotate(${(k - 3) * 14} ${x} 15)" fill="#8cc860"/>`).join('')}`,
      fg: `<path d="M43 34 C42 38 43 41 45.5 42 C48 41 49 38 48 34 M43 34 h5" ${ln('#d8a830', 1.2)}/><path d="M44.8 35 v6 M46.2 35 v6" ${ln('#fff4d0', .4)}/>${[0, 1].map(k => `<text x="${45 + k * 2}" y="32" font-size="4" fill="#fff" class="ma-rise" style="animation-delay:${-k * 1}s">♪</text>`).join('')}`
    }
  };
  function svgHTML(id, veiled) {
    const sc = SV[id] || {}, o = OUTFIT[id] || {};
    const monkey = window.CrewSvg ? CrewSvg.svg(vid(id), o.hat || 0).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '') : '';
    return `<svg class="ma-svg" viewBox="10 0 44 50" aria-hidden="true">${veiled ? '' : sc.bg || ''}<g class="ma-fig">${monkey}${sc.wear || ''}</g>${veiled ? '' : sc.fg || ''}</svg>`;
  }

  const ids = Object.keys(OUTFIT);
  window.MuseArt = {
    ids,
    has: id => ids.includes(id),
    html(id, veiled = false) {
      if (!ids.includes(id)) return '';
      if (window.IMI?.edition !== 'pixel') return svgHTML(id, veiled);
      if (veiled) return `<img alt="" src="${stillURL(id)}" class="ma-still">`;
      return `<i class="ma-strip" style="background-image:url(${stripURL(id)})"></i>`;
    }
  };
})();
