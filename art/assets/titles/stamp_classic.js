(function (root) {
  'use strict';

  // Stamp 3: CLASSIC - 24x24, 4 frames, 8 fps, loop: true
  // Gold laurel wreath stamp with ruby ribbon tie, "CLASSIC" cartouche,
  // traveling glint, and pulsing laurel leaf tips.

  const P = {
    '.': null,
    // Gold Ramp (from RAMPS.gold)
    'k': '#4a2e04', // deep gold outline
    's': '#b38004', // shadow gold
    'b': '#ffd23a', // base gold
    'l': '#fff08c', // light gold
    'w': '#fffbe0', // specular glint
    // Ruby Ribbon Tie & Accents (from RAMPS.red)
    'r': '#b8322a', // ruby base
    'd': '#781c16', // ruby shadow
    'e': '#e86a50'  // ruby light
  };

  function buildClassicFrame(pulseFrame) {
    const g = Array.from({ length: 24 }, () => Array(24).fill('.'));

    // 1. Central Banner Plate (y: 9..14, x: 5..18)
    for (let x = 6; x <= 17; x++) {
      g[9][x] = 'k';
      g[14][x] = 'k';
    }
    g[10][5] = 'k'; g[10][18] = 'k';
    g[11][5] = 'k'; g[11][18] = 'k';
    g[12][5] = 'k'; g[12][18] = 'k';
    g[13][5] = 'k'; g[13][18] = 'k';

    // Banner background and glint
    for (let y = 10; y <= 13; y++) {
      for (let x = 6; x <= 17; x++) {
        g[y][x] = (y === 10) ? 'l' : (y === 13) ? 's' : 'b';
      }
    }

    // Letters "CLASSIC" across x: 6..17, y: 11..12
    // C L A S S I C
    // Row 11:
    g[11][6] = 'k'; g[11][7] = 'k'; // C
    g[11][8] = 'k';                // L
    g[11][9] = 'k'; g[11][10] = 'k'; // A
    g[11][11] = 'k'; g[11][12] = 'k'; // S
    g[11][13] = 'k'; g[11][14] = 'k'; // S
    g[11][15] = 'k';                 // I
    g[11][16] = 'k'; g[11][17] = 'k'; // C

    // Row 12:
    g[12][6] = 'k'; g[12][7] = 'k'; // C
    g[12][8] = 'k'; g[12][9] = 'k'; // L
    g[12][10] = 'k';                // A
    g[12][11] = 'k'; g[12][12] = 'k'; // S
    g[12][13] = 'k'; g[12][14] = 'k'; // S
    g[12][15] = 'k';                 // I
    g[12][16] = 'k'; g[12][17] = 'k'; // C

    // 2. Laurel Branches (Curved stems on left x: 4..6 and right x: 17..19)
    // Left stem
    g[6][6] = 'k'; g[6][7] = 's';
    g[7][5] = 'k'; g[7][6] = 's';
    g[8][4] = 'k'; g[8][5] = 's';
    g[9][4] = 'k'; g[9][5] = 's';
    g[14][4] = 'k'; g[14][5] = 's';
    g[15][5] = 'k'; g[15][6] = 's';
    g[16][6] = 'k'; g[16][7] = 's';
    g[17][7] = 'k'; g[17][8] = 's';
    g[18][8] = 'k'; g[18][9] = 's';

    // Right stem
    g[6][16] = 's'; g[6][17] = 'k';
    g[7][17] = 's'; g[7][18] = 'k';
    g[8][18] = 's'; g[8][19] = 'k';
    g[9][18] = 's'; g[9][19] = 'k';
    g[14][18] = 's'; g[14][19] = 'k';
    g[15][17] = 's'; g[15][18] = 'k';
    g[16][16] = 's'; g[16][17] = 'k';
    g[17][15] = 's'; g[17][16] = 'k';
    g[18][14] = 's'; g[18][15] = 'k';

    // 3. Laurel Leaves (Base pairs)
    // Top crown leaves (y: 3..5)
    g[4][7] = 'k'; g[4][8] = 'b'; g[4][9] = 'l'; g[4][10] = 'k';
    g[3][8] = 'k'; g[3][9] = 'l'; g[3][10] = 'w'; g[3][11] = 'k';

    g[4][13] = 'k'; g[4][14] = 'l'; g[4][15] = 'b'; g[4][16] = 'k';
    g[3][12] = 'k'; g[3][13] = 'w'; g[3][14] = 'l'; g[3][15] = 'k';

    // Left Upper Leaf (y: 5..7, x: 2..5)
    g[5][4] = 'k'; g[5][5] = 'l';
    g[6][3] = 'k'; g[6][4] = 'l'; g[6][5] = 'b';
    g[7][3] = 'k'; g[7][4] = 'b';

    // Right Upper Leaf (y: 5..7, x: 18..21)
    g[5][18] = 'l'; g[5][19] = 'k';
    g[6][18] = 'b'; g[6][19] = 'l'; g[6][20] = 'k';
    g[7][19] = 'b'; g[7][20] = 'k';

    // Left Mid Leaf (y: 10..12, x: 2..4)
    g[10][2] = 'k'; g[10][3] = 'l'; g[10][4] = 'k';
    g[11][1] = 'k'; g[11][2] = 'l'; g[11][3] = 'b'; g[11][4] = 'k';
    g[12][2] = 'k'; g[12][3] = 'b'; g[12][4] = 'k';

    // Right Mid Leaf (y: 10..12, x: 19..22)
    g[10][19] = 'k'; g[10][20] = 'l'; g[10][21] = 'k';
    g[11][19] = 'k'; g[11][20] = 'b'; g[11][21] = 'l'; g[11][22] = 'k';
    g[12][19] = 'k'; g[12][20] = 'b'; g[12][21] = 'k';

    // Left Lower Leaf (y: 15..17, x: 3..6)
    g[15][3] = 'k'; g[15][4] = 'l';
    g[16][3] = 'k'; g[16][4] = 'l'; g[16][5] = 'b';
    g[17][4] = 'k'; g[17][5] = 'b';

    // Right Lower Leaf (y: 15..17, x: 17..20)
    g[15][19] = 'l'; g[15][20] = 'k';
    g[16][18] = 'b'; g[16][19] = 'l'; g[16][20] = 'k';
    g[17][18] = 'b'; g[17][19] = 'k';

    // 4. Ruby Ribbon Tie at base (y: 18..21, x: 9..14)
    g[18][10] = 'd'; g[18][11] = 'r'; g[18][12] = 'r'; g[18][13] = 'd';
    g[19][9] = 'd'; g[19][10] = 'e'; g[19][11] = 'r'; g[19][12] = 'r'; g[19][13] = 'e'; g[19][14] = 'd';
    g[20][9] = 'd'; g[20][10] = 'r'; g[20][11] = 'd'; g[20][12] = 'd'; g[20][13] = 'r'; g[20][14] = 'd';

    // 5. Leaf Pulse & Glint across the 4 frames:
    if (pulseFrame === 1) {
      // Top leaves pulse outward by 1px
      g[2][8] = 'k'; g[2][9] = 'w'; g[2][10] = 'k';
      g[2][13] = 'k'; g[2][14] = 'w'; g[2][15] = 'k';
      // Upper leaves gleam
      g[5][3] = 'k'; g[5][4] = 'w';
      g[5][19] = 'w'; g[5][20] = 'k';
    } else if (pulseFrame === 2) {
      // Mid leaves pulse outward by 1px
      g[11][0] = 'k'; g[11][1] = 'w';
      g[11][22] = 'w'; g[11][23] = 'k';
      // Center banner gleam
      g[10][10] = 'w'; g[10][11] = 'w';
    } else if (pulseFrame === 3) {
      // Lower leaves pulse outward by 1px
      g[16][2] = 'k'; g[16][3] = 'w';
      g[16][20] = 'w'; g[16][21] = 'k';
      // Ruby ribbon tails flutter
      g[21][9] = 'd'; g[21][10] = 'r';
      g[21][13] = 'r'; g[21][14] = 'd';
    }

    return g;
  }

  function buildFrames() {
    const frames = [];
    for (let f = 0; f < 4; f++) {
      const g = buildClassicFrame(f);
      frames.push({ rows: g.map(r => r.join('')) });
    }
    return frames;
  }

  const asset = {
    id: 'stamp_classic',
    category: 'titles',
    size: [24, 24],
    fps: 8,
    loop: true,
    notes: 'Gold laurel wreath stamp "CLASSIC" with ruby ribbon tie and pulsing leaf tips',
    palette: P,
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || {}).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
