(function (root) {
  'use strict';

  function buildFrames() {
    const frames = [];

    for (let f = 0; f < 10; f++) {
      const g = Array.from({ length: 32 }, () => Array(32).fill('.'));

      // 1. Pedestal / Plinth Base
      // Plinth bottom outline (row 29)
      for (let x = 5; x <= 26; x++) g[29][x] = 'k';

      // Plinth foot (row 28)
      g[28][5] = 'k'; g[28][6] = 's'; g[28][7] = 'l'; g[28][8] = 'w';
      for (let x = 9; x <= 19; x++) g[28][x] = 'b';
      g[28][20] = 's'; g[28][21] = 's'; g[28][22] = 'k'; g[28][23] = 'k'; g[28][24] = 'k'; g[28][25] = 'k'; g[28][26] = 'k';

      // Plinth body with chromium horizontal reflection band (rows 26, 27)
      for (let y = 26; y <= 27; y++) {
        g[y][6] = 'k'; g[y][7] = 's'; g[y][8] = 'l';
        for (let x = 9; x <= 18; x++) g[y][x] = (y === 26 && x >= 11 && x <= 16) ? 'w' : 'b';
        g[y][19] = 's'; g[y][20] = 's'; g[y][21] = 'k'; g[y][22] = 'k'; g[y][23] = 'k'; g[y][24] = 'k'; g[y][25] = 'k';
      }

      // Plinth upper bevel (row 25)
      g[25][7] = 'k'; g[25][8] = 's'; g[25][9] = 'l';
      for (let x = 10; x <= 18; x++) g[25][x] = 'b';
      g[25][19] = 's'; g[25][20] = 's'; g[25][21] = 'k'; g[25][22] = 'k'; g[25][23] = 'k'; g[25][24] = 'k';

      // Pedestal tier 1 (rows 23, 24)
      for (let y = 23; y <= 24; y++) {
        g[y][8] = 'k'; g[y][9] = 's'; g[y][10] = 'l';
        for (let x = 11; x <= 17; x++) g[y][x] = 'b';
        g[y][18] = 's'; g[y][19] = 's'; g[y][20] = 'k'; g[y][21] = 'k'; g[y][22] = 'k'; g[y][23] = 'k';
      }

      // Pedestal upper collar (row 22)
      g[22][10] = 'k'; g[22][11] = 'l';
      for (let x = 12; x <= 16; x++) g[22][x] = 'b';
      g[22][17] = 's'; g[22][18] = 's'; g[22][19] = 'k'; g[22][20] = 'k'; g[22][21] = 'k';

      // 2. Stem & Turned Knops (rows 18..21)
      g[21][11] = 'k'; g[21][12] = 'l'; g[21][13] = 'w'; g[21][14] = 'b'; g[21][15] = 'b'; g[21][16] = 's'; g[21][17] = 's'; g[21][18] = 'k'; g[21][19] = 'k'; g[21][20] = 'k';
      for (let y = 19; y <= 20; y++) {
        g[y][12] = 'k'; g[y][13] = 'l'; g[y][14] = 'b'; g[y][15] = 'b'; g[y][16] = 's'; g[y][17] = 's'; g[y][18] = 'k'; g[y][19] = 'k';
      }
      g[18][11] = 'k'; g[18][12] = 'l'; g[18][13] = 'w'; g[18][14] = 'b'; g[18][15] = 'b'; g[18][16] = 's'; g[18][17] = 's'; g[18][18] = 'k'; g[18][19] = 'k'; g[18][20] = 'k';

      // 3. Chalice Bowl (rows 8..17)
      // Bowl bottom round (row 17)
      g[17][10] = 'k'; g[17][11] = 'l'; g[17][12] = 'w';
      for (let x = 13; x <= 16; x++) g[17][x] = 'b';
      g[17][17] = 's'; g[17][18] = 's'; g[17][19] = 'k'; g[17][20] = 'k'; g[17][21] = 'k';

      // Bowl lower taper (row 16)
      g[16][9] = 'k'; g[16][10] = 'l'; g[16][11] = 'w';
      for (let x = 12; x <= 17; x++) g[16][x] = 'b';
      g[16][18] = 's'; g[16][19] = 's'; g[16][20] = 'k'; g[16][21] = 'k'; g[16][22] = 'k';

      // Bowl body (rows 8..15) with polished chromium sheen
      for (let y = 8; y <= 15; y++) {
        g[y][8] = 'k'; g[y][9] = 'l'; g[y][10] = 'w';
        for (let x = 11; x <= 17; x++) g[y][x] = 'b';
        g[y][18] = 's'; g[y][19] = 's'; g[y][20] = 'k'; g[y][21] = 'k'; g[y][22] = 'k'; g[y][23] = 'k';
      }

      // 4. Chalice Rim (rows 5..7)
      g[7][7] = 'k'; g[7][8] = 'l'; g[7][9] = 'w';
      for (let x = 10; x <= 17; x++) g[7][x] = 'b';
      g[7][18] = 's'; g[7][19] = 's'; g[7][20] = 'k'; g[7][21] = 'k'; g[7][22] = 'k'; g[7][23] = 'k'; g[7][24] = 'k';

      g[6][8] = 'k'; g[6][9] = 'w';
      for (let x = 10; x <= 18; x++) g[6][x] = 'l';
      g[6][19] = 'b'; g[6][20] = 's'; g[6][21] = 's'; g[6][22] = 'k'; g[6][23] = 'k';

      g[5][9] = 'k';
      for (let x = 10; x <= 17; x++) g[5][x] = 'l';
      for (let x = 18; x <= 21; x++) g[5][x] = 's';
      g[5][22] = 'k';

      // 5. Chromium Handles (left x=2..7, right x=24..29)
      g[8][4] = 'k'; g[8][5] = 'l'; g[8][6] = 'k'; g[8][7] = 'k';
      g[9][3] = 'k'; g[9][4] = 'w'; g[9][5] = 'k';
      g[10][2] = 'k'; g[10][3] = 'w'; g[10][4] = 'k';
      g[11][2] = 'k'; g[11][3] = 'w'; g[11][4] = 'k';
      g[12][2] = 'k'; g[12][3] = 'w'; g[12][4] = 'k';
      g[13][2] = 'k'; g[13][3] = 'l'; g[13][4] = 'k';
      g[14][3] = 'k'; g[14][4] = 'l'; g[14][5] = 'k';
      g[15][4] = 'k'; g[15][5] = 'l'; g[15][6] = 'k'; g[15][7] = 'k';

      g[8][24] = 'k'; g[8][25] = 'k'; g[8][26] = 's'; g[8][27] = 'k';
      g[9][26] = 'k'; g[9][27] = 's'; g[9][28] = 'k';
      g[10][27] = 'k'; g[10][28] = 'k'; g[10][29] = 'k';
      g[11][27] = 'k'; g[11][28] = 'k'; g[11][29] = 'k';
      g[12][27] = 'k'; g[12][28] = 'k'; g[12][29] = 'k';
      g[13][27] = 'k'; g[13][28] = 'k'; g[13][29] = 'k';
      g[14][26] = 'k'; g[14][27] = 's'; g[14][28] = 'k';
      g[15][24] = 'k'; g[15][25] = 'k'; g[15][26] = 's'; g[15][27] = 'k';

      // 6. Bright Traveling Gleam Sweep
      const sweepX = Math.round(9 + (f % 10) * 1.3);
      for (let y = 7; y <= 16; y++) {
        const sx = Math.round(sweepX - (y - 7) * 0.25);
        for (let dx = -1; dx <= 1; dx++) {
          const px = sx + dx;
          if (px >= 8 && px <= 22 && g[y][px] !== 'k' && g[y][px] !== '.') {
            if (dx === 0) g[y][px] = 'w';
            else if (g[y][px] !== 'w') g[y][px] = 'l';
          }
        }
      }

      // Secondary chrome plinth gleam sweep on rows 24..27
      const plinthSweepX = Math.round(7 + ((f + 3) % 10) * 1.8);
      for (let y = 24; y <= 27; y++) {
        if (plinthSweepX >= 7 && plinthSweepX <= 24 && g[y][plinthSweepX] !== 'k' && g[y][plinthSweepX] !== '.') {
          g[y][plinthSweepX] = 'w';
        }
      }

      // Rim sparkle glint at [11, 4]
      if (f === 4) {
        g[4][11] = 'p';
      } else if (f === 5) {
        g[3][11] = 'p';
        g[4][10] = 'p'; g[4][11] = 'p'; g[4][12] = 'p';
        g[5][11] = 'p';
      } else if (f === 6) {
        g[4][11] = 'p';
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'trophy_silver',
    category: 'awards',
    size: [32, 32],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Polished chromium trophy with bright traveling gleam and rim sparkle',
    palette: {
      '.': null,
      'k': '#303c4a', // deep silver outline
      's': '#687a8c', // silver shadow
      'b': '#b8c6d4', // silver base
      'l': '#e8f0f8', // silver light
      'w': '#ffffff', // bright chromium white
      'p': '#ffffff'  // gleam sparkle
    },
    sparkles: [
      [11, 4], [11, 3], [10, 4], [12, 4], [11, 5]
    ],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
