(function (root) {
  'use strict';

  // 32x32, 8 frames, 8 fps
  // Distinguished owl with tweed vest and monocle, wings rustle, head pivots
  const W = 32;
  const H = 32;

  const palette = {
    '.': null,
    'k': '#1e0e04', // deep dark brown outline
    'f': '#563418', // feather shadow
    'F': '#86592e', // feather base
    'H': '#caa078', // feather highlight
    'v': '#351c0c', // tweed vest shadow
    't': '#7d4f26', // tweed base
    'T': '#b07844', // tweed light
    'y': '#ffd23a', // amber eye / gold monocle
    'Y': '#fff08c', // gold highlight
    'o': '#c98f0e', // beak/gold shadow
    'w': '#ffffff', // monocle glint / collar white
    'i': '#1a0f14', // pupil / ink
    'l': '#7ec8f0', // monocle lens tint
    'b': '#5a3517', // perch mahogany
    'B': '#8a5a2b'  // perch light
  };

  function buildFrames() {
    const frames = [];

    // Head pivot horizontal offset: dx
    const headDx = [0, 1, 2, 2, 1, 0, -1, 0];
    // Wing fluff expand offset: dw (0=normal, 1=fluffed out)
    const wingFluff = [0, 0, 0, 0, 1, 1, 0, 0];
    // Monocle glint
    const glints = [false, false, false, true, false, false, false, false];

    for (let f = 0; f < 8; f++) {
      const g = Array.from({ length: H }, () => Array(W).fill('.'));
      const hx = headDx[f];
      const wf = wingFluff[f];
      const glint = glints[f];

      // 1. Polished Mahogany Perch / Plinth (rows 27..30, cols 4..27)
      for (let x = 5; x <= 26; x++) {
        g[27][x] = 'k';
        g[28][x] = (x % 3 === 0) ? 'B' : 'b';
        g[29][x] = 'b';
        g[30][x] = 'k';
      }
      g[28][4] = 'k'; g[29][4] = 'k';
      g[28][27] = 'k'; g[29][27] = 'k';

      // 2. Owl Talons gripping perch (rows 26..28, cols 11..13 and 18..20)
      // Left talon
      g[26][11] = 'k'; g[26][12] = 'y'; g[26][13] = 'k';
      g[27][10] = 'k'; g[27][11] = 'y'; g[27][12] = 'y'; g[27][13] = 'o'; g[27][14] = 'k';
      // Right talon
      g[26][18] = 'k'; g[26][19] = 'y'; g[26][20] = 'k';
      g[27][17] = 'k'; g[27][18] = 'y'; g[27][19] = 'y'; g[27][20] = 'o'; g[27][21] = 'k';

      // 3. Tweed Vest & Torso (rows 16..26, cols 9..22)
      // White shirt collar at neck (row 16, cols 14..17 + hx)
      g[16][14 + hx] = 'w'; g[16][15 + hx] = 'w';
      g[16][16 + hx] = 'w'; g[16][17 + hx] = 'w';

      // Tweed vest body
      for (let y = 17; y <= 25; y++) {
        for (let x = 11; x <= 20; x++) {
          // Tweed pattern: alternating houndstooth stitch
          const isTweedLight = (x + y) % 2 === 0;
          g[y][x] = (x <= 15) ? (isTweedLight ? 'T' : 't') : (isTweedLight ? 't' : 'v');
        }
      }
      // Vest buttons (gold studs down center)
      g[18][15] = 'Y'; g[20][15] = 'y'; g[22][15] = 'y'; g[24][15] = 'o';

      // 4. Wings & Feather Fluff (cols 7-wf..11 and 20..24+wf)
      // Left wing
      const lwX = 8 - wf;
      for (let y = 16; y <= 25; y++) {
        g[y][lwX] = 'k';
        for (let x = lwX + 1; x <= 11; x++) {
          g[y][x] = (x <= lwX + 2) ? 'H' : 'F';
        }
      }
      g[15][lwX + 1] = 'k'; g[15][lwX + 2] = 'k';
      g[26][lwX + 1] = 'k'; g[26][lwX + 2] = 'k';

      // Right wing
      const rwX = 23 + wf;
      for (let y = 16; y <= 25; y++) {
        for (let x = 20; x < rwX; x++) {
          g[y][x] = (x >= rwX - 2) ? 'f' : 'F';
        }
        g[y][rwX] = 'k';
      }
      g[15][rwX - 2] = 'k'; g[15][rwX - 1] = 'k';
      g[26][rwX - 2] = 'k'; g[26][rwX - 1] = 'k';

      // 5. Owl Head & Feathers (rows 3..16, cols 8+hx .. 23+hx)
      const cx = 15 + hx;

      // Feather Ear Horn Tufts (peaked feathers on top)
      // Left ear tuft
      g[3][cx - 5] = 'k';
      g[4][cx - 6] = 'k'; g[4][cx - 5] = 'H'; g[4][cx - 4] = 'k';
      g[5][cx - 6] = 'k'; g[5][cx - 5] = 'H'; g[5][cx - 4] = 'F'; g[5][cx - 3] = 'k';
      // Right ear tuft
      g[3][cx + 4] = 'k';
      g[4][cx + 3] = 'k'; g[4][cx + 4] = 'F'; g[4][cx + 5] = 'k';
      g[5][cx + 2] = 'k'; g[5][cx + 3] = 'F'; g[5][cx + 4] = 'f'; g[5][cx + 5] = 'k';

      // Crown of head
      for (let x = cx - 3; x <= cx + 2; x++) g[5][x] = (x <= cx) ? 'H' : 'F';
      g[5][cx - 4] = 'k'; g[5][cx + 3] = 'k';

      // Head facial discs (rows 6..15, cols cx-6 .. cx+5)
      for (let y = 6; y <= 14; y++) {
        g[y][cx - 7] = 'k';
        for (let x = cx - 6; x <= cx + 5; x++) {
          g[y][x] = (x <= cx - 1) ? 'H' : ((x <= cx + 2) ? 'F' : 'f');
        }
        g[y][cx + 6] = 'k';
      }
      g[15][cx - 6] = 'k';
      for (let x = cx - 5; x <= cx + 4; x++) g[15][x] = 'f';
      g[15][cx + 5] = 'k';

      // Large Round Facial Discs (feather rings around eyes)
      // Left eye disc
      for (let y = 8; y <= 12; y++) {
        for (let x = cx - 5; x <= cx - 1; x++) {
          g[y][x] = 'F';
        }
      }
      // Right eye disc
      for (let y = 8; y <= 12; y++) {
        for (let x = cx + 1; x <= cx + 5; x++) {
          g[y][x] = 'f';
        }
      }

      // Amber Eyes & Pupils
      // Left Eye (uncovered)
      g[9][cx - 4] = 'k'; g[9][cx - 3] = 'k'; g[9][cx - 2] = 'k';
      g[10][cx - 5] = 'k'; g[10][cx - 4] = 'w'; g[10][cx - 3] = 'i'; g[10][cx - 2] = 'y'; g[10][cx - 1] = 'k';
      g[11][cx - 4] = 'k'; g[11][cx - 3] = 'i'; g[11][cx - 2] = 'o'; g[11][cx - 1] = 'k';
      g[12][cx - 3] = 'k'; g[12][cx - 2] = 'k';

      // Right Eye (behind Gold Monocle)
      g[9][cx + 2] = 'k'; g[9][cx + 3] = 'k'; g[9][cx + 4] = 'k';
      g[10][cx + 1] = 'k'; g[10][cx + 2] = 'w'; g[10][cx + 3] = 'i'; g[10][cx + 4] = 'y'; g[10][cx + 5] = 'k';
      g[11][cx + 1] = 'k'; g[11][cx + 2] = 'i'; g[11][cx + 3] = 'i'; g[11][cx + 4] = 'o'; g[11][cx + 5] = 'k';
      g[12][cx + 2] = 'k'; g[12][cx + 3] = 'k'; g[12][cx + 4] = 'k';

      // Sharp Hooked Beak (cols cx-1 .. cx, rows 11..14)
      g[11][cx - 1] = 'Y'; g[11][cx] = 'y';
      g[12][cx - 1] = 'Y'; g[12][cx] = 'o';
      g[13][cx - 1] = 'y'; g[13][cx] = 'o';
      g[14][cx - 1] = 'k'; g[14][cx] = 'k';

      // 6. Monocle & Fine Chain (over right eye, cols cx+1 .. cx+5)
      // Gold rim
      g[9][cx + 2] = 'Y'; g[9][cx + 3] = 'Y'; g[9][cx + 4] = 'y';
      g[10][cx + 1] = 'Y'; g[10][cx + 5] = 'o';
      g[11][cx + 1] = 'y'; g[11][cx + 5] = 'o';
      g[12][cx + 2] = 'o'; g[12][cx + 3] = 'o'; g[12][cx + 4] = 'o';

      // Glass lens reflection
      g[10][cx + 2] = 'l';
      g[11][cx + 2] = 'l';

      // Monocle fine chain draping down to vest
      g[12][cx + 5] = 'y';
      g[13][cx + 5] = 'Y';
      g[14][cx + 5] = 'y';
      g[15][cx + 4] = 'o';
      g[16][cx + 3] = 'y';

      // Specular Glint on Monocle (frame 3)
      if (glint) {
        g[9][cx + 2] = 'w';
        g[10][cx + 2] = 'w';
        g[10][cx + 3] = 'w';
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'publisher_owl',
    category: 'automation',
    size: [W, H],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Distinguished owl publisher with tweed vest and glinting monocle, wings rustling as head pivots with keen editorial scrutiny',
    palette: palette,
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
