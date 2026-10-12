(function (root) {
  'use strict';

  function buildFrames() {
    const frames = [];

    // 8 frames, 8 fps
    const leftWave  = [ 0,  1,  2,  1,  0, -1, -2, -1];
    const rightWave = [ 2,  1,  0, -1, -2, -1,  0,  1];

    for (let f = 0; f < 8; f++) {
      const g = Array.from({ length: 32 }, () => Array(32).fill('.'));

      // 1. Rosette Head (Rows 2..17)
      // Row 2: top pleated tips
      g[2][14] = 'k'; g[2][15] = 'k'; g[2][16] = 'k'; g[2][17] = 'k';

      // Row 3: pleated top petals
      g[3][11] = 'k'; g[3][12] = 'k'; g[3][13] = 'l'; g[3][14] = 'h'; g[3][15] = 'h'; g[3][16] = 'l'; g[3][17] = 'l'; g[3][18] = 'k'; g[3][19] = 'k';

      // Row 4: upper petal arc
      g[4][9] = 'k'; g[4][10] = 'l'; g[4][11] = 'h'; g[4][12] = 'h'; g[4][13] = 'l'; g[4][14] = 'b';
      g[4][15] = 'b'; g[4][16] = 'l'; g[4][17] = 'b'; g[4][18] = 'y'; g[4][19] = 'b'; g[4][20] = 'k';

      // Row 5: outer rosette petal notches
      g[5][7] = 'k'; g[5][8] = 'l'; g[5][9] = 'h'; g[5][10] = 'l'; g[5][11] = 'b';
      for (let x = 12; x <= 18; x++) g[5][x] = 'g';
      g[5][19] = 'b'; g[5][20] = 'y'; g[5][21] = 'b'; g[5][22] = 'k';

      // Row 6: gold trim upper bevel
      g[6][6] = 'k'; g[6][7] = 'l'; g[6][8] = 'h'; g[6][9] = 'b';
      g[6][10] = 'g'; g[6][11] = 't'; g[6][12] = 'p'; g[6][13] = 't'; g[6][14] = 'c'; g[6][15] = 'c'; g[6][16] = 'c'; g[6][17] = 's'; g[6][18] = 's'; g[6][19] = 'g';
      g[6][20] = 'b'; g[6][21] = 'y'; g[6][22] = 'y'; g[6][23] = 'k';

      // Rows 7..12: Gold Medallion with central blue emblem
      // Row 7:
      g[7][6] = 'k'; g[7][7] = 'h'; g[7][8] = 'l'; g[7][9] = 'g';
      g[7][10] = 't'; g[7][11] = 'p'; g[7][12] = 't'; g[7][13] = 'c'; g[7][14] = 'c'; g[7][15] = 'k'; g[7][16] = 'c'; g[7][17] = 's'; g[7][18] = 's'; g[7][19] = 'g';
      g[7][20] = 'b'; g[7][21] = 'y'; g[7][22] = 'k';

      // Row 8:
      g[8][5] = 'k'; g[8][6] = 'h'; g[8][7] = 'l'; g[8][8] = 'b'; g[8][9] = 'g';
      g[8][10] = 't'; g[8][11] = 't'; g[8][12] = 'c'; g[8][13] = 'c'; g[8][14] = 'k'; g[8][15] = 'b'; g[8][16] = 'c'; g[8][17] = 's'; g[8][18] = 's'; g[8][19] = 'g';
      g[8][20] = 'b'; g[8][21] = 'y'; g[8][22] = 'y'; g[8][23] = 'k';

      // Row 9:
      g[9][5] = 'k'; g[9][6] = 'h'; g[9][7] = 'l'; g[9][8] = 'b'; g[9][9] = 'g';
      g[9][10] = 't'; g[9][11] = 't'; g[9][12] = 'c'; g[9][13] = 'c'; g[9][14] = 'c'; g[9][15] = 'b'; g[9][16] = 'c'; g[9][17] = 's'; g[9][18] = 's'; g[9][19] = 'g';
      g[9][20] = 'b'; g[9][21] = 'y'; g[9][22] = 'y'; g[9][23] = 'k';

      // Row 10:
      g[10][5] = 'k'; g[10][6] = 'h'; g[10][7] = 'l'; g[10][8] = 'b'; g[10][9] = 'g';
      g[10][10] = 'c'; g[10][11] = 'c'; g[10][12] = 'c'; g[10][13] = 'c'; g[10][14] = 'c'; g[10][15] = 'b'; g[10][16] = 's'; g[10][17] = 's'; g[10][18] = 's'; g[10][19] = 'g';
      g[10][20] = 'b'; g[10][21] = 'y'; g[10][22] = 'y'; g[10][23] = 'k';

      // Row 11:
      g[11][5] = 'k'; g[11][6] = 'l'; g[11][7] = 'b'; g[11][8] = 'b'; g[11][9] = 'g';
      g[11][10] = 'c'; g[11][11] = 'c'; g[11][12] = 'c'; g[11][13] = 'b'; g[11][14] = 'b'; g[11][15] = 'b'; g[11][16] = 's'; g[11][17] = 's'; g[11][18] = 'g';
      g[11][19] = 'b'; g[11][20] = 'y'; g[11][21] = 'y'; g[11][22] = 'k';

      // Row 12:
      g[12][6] = 'k'; g[12][7] = 'b'; g[12][8] = 'b'; g[12][9] = 'g';
      g[12][10] = 's'; g[12][11] = 's'; g[12][12] = 's'; g[12][13] = 's'; g[12][14] = 's'; g[12][15] = 's'; g[12][16] = 's'; g[12][17] = 's'; g[12][18] = 'g';
      g[12][19] = 'y'; g[12][20] = 'y'; g[12][21] = 'k';

      // Row 13:
      g[13][6] = 'k'; g[13][7] = 'b'; g[13][8] = 'b'; g[13][9] = 'g';
      for (let x = 10; x <= 18; x++) g[13][x] = 'g';
      g[13][19] = 'y'; g[13][20] = 'y'; g[13][21] = 'k';

      // Row 14:
      g[14][7] = 'k'; g[14][8] = 'b'; g[14][9] = 'b';
      for (let x = 10; x <= 19; x++) g[14][x] = (x < 15 ? 'b' : 'y');
      g[14][20] = 'y'; g[14][21] = 'k';

      // Row 15:
      g[15][9] = 'k'; g[15][10] = 'b'; g[15][11] = 'b';
      for (let x = 12; x <= 18; x++) g[15][x] = 'y';
      g[15][19] = 'k';

      // Row 16:
      g[16][12] = 'k'; g[16][13] = 'y'; g[16][14] = 'y'; g[16][15] = 'y'; g[16][16] = 'y'; g[16][17] = 'k';

      // Sparkle glint on medallion at frames 2..4
      if (f === 2) {
        g[7][11] = 'p';
      } else if (f === 3) {
        g[6][11] = 'p';
        g[7][10] = 'p'; g[7][11] = 'p'; g[7][12] = 'p';
        g[8][11] = 'p';
      } else if (f === 4) {
        g[7][11] = 'p';
      }

      // 2. Two Silk Ribbon Tails (Rows 16..28)
      // Left tail base x=9..13 (width 5), hangs down to y=28
      // Right tail base x=18..22 (width 5), hangs down to y=28
      const lTip = leftWave[f];
      const rTip = rightWave[f];

      for (let y = 16; y <= 28; y++) {
        const t = (y - 16) / 12;
        const lOff = Math.round(lTip * t);
        const rOff = Math.round(rTip * t);

        // Left tail
        const lx = 9 + lOff;
        if (y === 28) {
          g[y][lx] = 'k'; g[y][lx + 1] = 'l'; g[y][lx + 3] = 'b'; g[y][lx + 4] = 'k';
        } else if (y === 27) {
          g[y][lx] = 'k'; g[y][lx + 1] = 'l'; g[y][lx + 2] = 'k'; g[y][lx + 3] = 'b'; g[y][lx + 4] = 'k';
        } else {
          g[y][lx] = 'k';
          g[y][lx + 1] = 'l';
          g[y][lx + 2] = 'b';
          g[y][lx + 3] = 'y';
          g[y][lx + 4] = 'k';
        }

        // Right tail
        const rx = 18 + rOff;
        if (y === 28) {
          g[y][rx] = 'k'; g[y][rx + 1] = 'l'; g[y][rx + 3] = 'y'; g[y][rx + 4] = 'k';
        } else if (y === 27) {
          g[y][rx] = 'k'; g[y][rx + 1] = 'l'; g[y][rx + 2] = 'k'; g[y][rx + 3] = 'y'; g[y][rx + 4] = 'k';
        } else {
          g[y][rx] = 'k';
          g[y][rx + 1] = 'l';
          g[y][rx + 2] = 'b';
          g[y][rx + 3] = 'y';
          g[y][rx + 4] = 'k';
        }
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'ribbon_blue',
    category: 'awards',
    size: [32, 32],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Silk blue first prize rosette with gold button and out-of-phase swinging ribbon tails',
    palette: {
      '.': null,
      'k': '#0c1442', // deep blue outline
      'y': '#1a2872', // blue shadow
      'b': '#2e44a8', // blue base
      'l': '#5470d8', // blue light
      'h': '#8caef8', // blue highlight
      'g': '#4a2e04', // gold outline
      's': '#b38004', // gold shadow
      'c': '#ffd23a', // gold base
      't': '#fff08c', // gold light
      'p': '#fffbe0'  // gold highlight / sparkle
    },
    sparkles: [
      [11, 7], [11, 6], [10, 7], [12, 7], [11, 8]
    ],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
