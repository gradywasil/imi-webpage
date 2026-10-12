(function (root) {
  'use strict';

  // Wax Seal 2: 24K Gold Wax Seal - 24x24, 4 frames, 8 fps, loop: true
  // Molten 24K gold wax seal with embossed imperial crown matrix,
  // traveling specular glint, and swaying imperial purple ribbon tails.

  const P = {
    '.': null,
    // 24K Gold Ramp (from RAMPS.gold)
    'k': '#4a2e04', // deep gold shadow / wax groove
    's': '#b38004', // shadow gold
    'b': '#ffd23a', // base gold
    'l': '#fff08c', // light gold
    'w': '#fffbe0', // specular 24k glint
    // Imperial Purple Ribbon Ramp (from RAMPS.purple)
    'd': '#280c48', // deep purple outline
    'p': '#4e2280', // purple shadow
    'u': '#7a46bc', // purple base
    'm': '#b58cf0', // purple light
    'h': '#e4beff'  // purple highlight
  };

  function buildGoldWaxFrame(frameIdx) {
    const g = Array.from({ length: 24 }, () => Array(24).fill('.'));

    // 1. Molten 24K Gold Circular Rim (y: 2..17, x: 4..19)
    // Row 2: Top organic gold rim
    g[2][8] = 'k'; g[2][9] = 'w'; g[2][10] = 'w'; g[2][11] = 'w';
    g[2][12] = 'w'; g[2][13] = 'l'; g[2][14] = 'k';

    // Row 3
    g[3][6] = 'k'; g[3][7] = 'w';
    for (let x = 8; x <= 14; x++) g[3][x] = (x <= 11) ? 'w' : 'l';
    g[3][15] = 's'; g[3][16] = 'k';

    // Row 4
    g[4][5] = 'k'; g[4][6] = 'w'; g[4][7] = 'l';
    for (let x = 8; x <= 14; x++) g[4][x] = 'b';
    g[4][15] = 's'; g[4][16] = 's'; g[4][17] = 'k';

    // Rows 5..14: Wax Body & Recessed Crown Matrix
    for (let y = 5; y <= 14; y++) {
      const isTop = y <= 7;
      const isBot = y >= 12;
      const leftEdge = (y === 5 || y === 14) ? 4 : 3;
      const rightEdge = (y === 5 || y === 14) ? 18 : 19;

      g[y][leftEdge] = 'k';
      g[y][leftEdge + 1] = isTop ? 'w' : 'l';
      g[y][leftEdge + 2] = isTop ? 'l' : 'b';

      for (let x = leftEdge + 3; x <= rightEdge - 3; x++) {
        g[y][x] = 'b';
      }

      g[y][rightEdge - 2] = isBot ? 's' : 's';
      g[y][rightEdge - 1] = isBot ? 'k' : 's';
      g[y][rightEdge] = 'k';
    }

    // Row 15
    g[15][5] = 'k'; g[15][6] = 's'; g[15][7] = 'b';
    for (let x = 8; x <= 14; x++) g[15][x] = 's';
    g[15][15] = 's'; g[15][16] = 's'; g[15][17] = 'k';

    // Row 16
    g[16][6] = 'k'; g[16][7] = 's';
    for (let x = 8; x <= 14; x++) g[16][x] = 's';
    g[16][15] = 'k'; g[16][16] = 'k';

    // Row 17: Molten droplet rim
    g[17][8] = 'k'; g[17][9] = 's'; g[17][10] = 'k';
    g[17][12] = 'k'; g[17][13] = 's'; g[17][14] = 'k';

    // 2. Embossed Imperial Crown in Matrix (y: 6..13, x: 7..15)
    for (let x = 7; x <= 15; x++) {
      g[6][x] = 'k';
      g[13][x] = 'k';
    }
    for (let y = 7; y <= 12; y++) {
      g[y][7] = 'k';
      g[y][15] = 'k';
    }

    // Crown Peaks & Jewels (y: 7..12)
    // Row 7: 3 Crown peaks
    g[7][9] = 'w'; g[7][11] = 'w'; g[7][13] = 'w';
    // Row 8: Crown points
    g[8][8] = 'l'; g[8][9] = 'l'; g[8][10] = 'b'; g[8][11] = 'w';
    g[8][12] = 'b'; g[8][13] = 'l'; g[8][14] = 's';
    // Row 9: Crown arches
    g[9][8] = 'l'; g[9][9] = 'b'; g[9][10] = 's'; g[9][11] = 'l';
    g[9][12] = 's'; g[9][13] = 'b'; g[9][14] = 's';
    // Row 10: Crown band
    g[10][8] = 'l'; g[10][9] = 'l'; g[10][10] = 'l'; g[10][11] = 'l';
    g[10][12] = 'l'; g[10][13] = 'l'; g[10][14] = 's';
    // Row 11: Jeweled circlet
    g[11][8] = 's'; g[11][9] = 'w'; g[11][10] = 's'; g[11][11] = 'w';
    g[11][12] = 's'; g[11][13] = 'w'; g[11][14] = 'k';
    // Row 12: Base
    g[12][8] = 'k'; g[12][9] = 's'; g[12][10] = 's'; g[12][11] = 's';
    g[12][12] = 's'; g[12][13] = 's'; g[12][14] = 'k';

    // 3. Specular Glint Sweep Across Gold Matrix & Rim
    if (frameIdx === 0) {
      g[7][8] = 'w'; g[7][9] = 'w'; g[8][8] = 'w';
      g[4][6] = 'w'; g[5][5] = 'w';
    } else if (frameIdx === 1) {
      g[8][10] = 'w'; g[8][11] = 'w'; g[9][10] = 'w';
      g[3][10] = 'w'; g[3][11] = 'w';
    } else if (frameIdx === 2) {
      g[9][12] = 'w'; g[10][12] = 'w'; g[10][13] = 'w';
      g[4][14] = 'w'; g[5][15] = 'w';
    } else if (frameIdx === 3) {
      g[11][13] = 'w'; g[12][13] = 'w';
      g[6][16] = 'w'; g[7][16] = 'w';
    }

    // 4. Swaying Imperial Purple Ribbon Tails (rows 16..22)
    // dx across frames: [0, +1, 0, -1]
    const dx = (frameIdx === 1) ? 1 : (frameIdx === 3) ? -1 : 0;

    // Left Ribbon Tail (cols 8..11)
    const lx = 8 + dx;
    g[17][lx] = 'd'; g[17][lx + 1] = 'm'; g[17][lx + 2] = 'h'; g[17][lx + 3] = 'd';
    g[18][lx] = 'd'; g[18][lx + 1] = 'm'; g[18][lx + 2] = 'h'; g[18][lx + 3] = 'd';
    g[19][lx] = 'd'; g[19][lx + 1] = 'u'; g[19][lx + 2] = 'm'; g[19][lx + 3] = 'd';
    g[20][lx] = 'd'; g[20][lx + 1] = 'p'; g[20][lx + 2] = 'u'; g[20][lx + 3] = 'd';
    g[21][lx] = 'd'; g[21][lx + 1] = 'd'; g[21][lx + 2] = 'p'; g[21][lx + 3] = 'd';
    g[22][lx] = 'd'; g[22][lx + 3] = 'd'; // V-notch

    // Right Ribbon Tail (cols 13..16)
    const rx = 13 + dx;
    g[17][rx] = 'd'; g[17][rx + 1] = 'm'; g[17][rx + 2] = 'u'; g[17][rx + 3] = 'd';
    g[18][rx] = 'd'; g[18][rx + 1] = 'm'; g[18][rx + 2] = 'u'; g[18][rx + 3] = 'd';
    g[19][rx] = 'd'; g[19][rx + 1] = 'u'; g[19][rx + 2] = 'p'; g[19][rx + 3] = 'd';
    g[20][rx] = 'd'; g[20][rx + 1] = 'p'; g[20][rx + 2] = 'p'; g[20][rx + 3] = 'd';
    g[21][rx] = 'd'; g[21][rx + 1] = 'd'; g[21][rx + 2] = 'd'; g[21][rx + 3] = 'd';
    g[22][rx] = 'd'; g[22][rx + 3] = 'd'; // V-notch

    return g;
  }

  function buildFrames() {
    const frames = [];
    for (let f = 0; f < 4; f++) {
      const g = buildGoldWaxFrame(f);
      frames.push({ rows: g.map(r => r.join('')) });
    }
    return frames;
  }

  const asset = {
    id: 'wax_seal_gold',
    category: 'titles',
    size: [24, 24],
    fps: 8,
    loop: true,
    notes: '24k gold wax seal with imperial purple ribbon tails and traveling specular glint',
    palette: P,
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || {}).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
