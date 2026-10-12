(function (root) {
  'use strict';

  // 32x32, 8 frames, 8 fps
  // Massive hulking gorilla clerk with ledger and brass spectacles sliding down snout
  const W = 32;
  const H = 32;

  const palette = {
    '.': null,
    'k': '#0a0408', // deep selective outline
    'd': '#1a0f14', // gorilla fur deep
    'f': '#3a2a30', // gorilla fur shadow
    'F': '#5c4650', // gorilla fur midtone
    'h': '#8a7480', // silverback highlight / shoulder rim
    's': '#724220', // muzzle/skin shadow
    'S': '#b97c4c', // muzzle/skin midtone
    'z': '#e0aa76', // muzzle/skin highlight
    'g': '#ffd23a', // spectacles brass base
    'G': '#fff08c', // spectacles highlight
    'o': '#b38004', // spectacles shadow
    'w': '#ffffff', // lens glint / eye white
    'p': '#ede0b8', // ledger paper base
    'P': '#fff6d6', // ledger paper light
    'b': '#7d4f26'  // ledger leather binding
  };

  function buildFrames() {
    const frames = [];

    // Spec positions: dy offset relative to base nose
    // Hand pushing glasses: on frames 4 and 5
    const specDy = [0, 1, 2, 2, 0, 0, 0, 0];
    const fingerUp = [0, 0, 0, 1, 2, 1, 0, 0];
    const glints = [false, false, false, false, false, true, false, false];

    for (let f = 0; f < 8; f++) {
      const g = Array.from({ length: H }, () => Array(W).fill('.'));
      const sdy = specDy[f];
      const fing = fingerUp[f];

      // 1. Massive Shoulders and Torso (rows 12..25, cols 3..28)
      // Left shoulder (light from top-left)
      for (let y = 14; y <= 24; y++) {
        for (let x = 4; x <= 10; x++) {
          g[y][x] = (x === 4 || y === 14) ? 'h' : 'F';
        }
        g[y][3] = 'k';
      }
      g[13][4] = 'k'; g[13][5] = 'k'; g[13][6] = 'k'; g[13][7] = 'k';

      // Right shoulder (shadow side)
      for (let y = 14; y <= 24; y++) {
        for (let x = 21; x <= 27; x++) {
          g[y][x] = (x >= 26) ? 'd' : 'f';
        }
        g[y][28] = 'k';
      }
      g[13][24] = 'k'; g[13][25] = 'k'; g[13][26] = 'k'; g[13][27] = 'k';

      // Chest / clerk collar (rows 18..24, cols 11..20)
      for (let y = 18; y <= 24; y++) {
        for (let x = 11; x <= 20; x++) {
          g[y][x] = (x <= 15) ? 'F' : 'f';
        }
      }

      // 2. Hulking Head & Sagittal Crest (rows 2..18, cols 9..22)
      // Top crest (peaked brow)
      g[2][15] = 'k'; g[2][16] = 'k';
      g[3][14] = 'k'; g[3][15] = 'h'; g[3][16] = 'F'; g[3][17] = 'k';
      g[4][13] = 'k'; g[4][14] = 'h'; g[4][15] = 'h'; g[4][16] = 'F'; g[4][17] = 'f'; g[4][18] = 'k';

      for (let y = 5; y <= 9; y++) {
        g[y][9] = 'k';
        g[y][22] = 'k';
        for (let x = 10; x <= 21; x++) {
          g[y][x] = (x <= 13) ? 'h' : ((x <= 17) ? 'F' : 'f');
        }
      }

      // Heavy Brow Ridge (rows 9..10, cols 10..21)
      for (let x = 10; x <= 21; x++) {
        g[9][x] = (x <= 15) ? 'h' : 'F';
        g[10][x] = 'd'; // heavy shadow under brow
      }

      // Broad Muzzle / Snout (rows 11..17, cols 10..21)
      for (let y = 11; y <= 17; y++) {
        g[y][9] = 'k';
        g[y][22] = 'k';
        for (let x = 10; x <= 21; x++) {
          g[y][x] = (x <= 13) ? 'z' : ((x <= 17) ? 'S' : 's');
        }
      }
      g[18][11] = 'k'; g[18][12] = 'k';
      for (let x = 13; x <= 18; x++) g[18][x] = 's';
      g[18][19] = 'k'; g[18][20] = 'k';
      g[19][13] = 'k'; g[19][14] = 'k'; g[19][15] = 'k'; g[19][16] = 'k'; g[19][17] = 'k'; g[19][18] = 'k';

      // Eyes (deep under brow)
      // Left eye
      g[10][12] = 'k'; g[10][13] = 'k';
      g[11][12] = (sdy === 2) ? 'w' : 'd'; g[11][13] = 'k';
      // Right eye
      g[10][18] = 'k'; g[10][19] = 'k';
      g[11][18] = (sdy === 2) ? 'w' : 'd'; g[11][19] = 'k';

      // Nostrils (broad gorilla nose pad)
      g[14][13] = 'd'; g[14][14] = 'd';
      g[14][17] = 'd'; g[14][18] = 'd';

      // Stern Clerk Mouth line
      g[16][13] = 'd';
      for (let x = 14; x <= 17; x++) g[16][x] = 'd';
      g[16][18] = 'd';

      // 3. Brass Spectacles (sliding down snout with sdy)
      const gy = 11 + sdy;
      // Left rim (round 4x4)
      g[gy][11] = 'G'; g[gy][12] = 'g'; g[gy][13] = 'G'; g[gy][14] = 'o';
      g[gy + 1][10] = 'G'; g[gy + 1][11] = 'w'; g[gy + 1][12] = 'w'; g[gy + 1][13] = 'g'; g[gy + 1][14] = 'o';
      g[gy + 2][11] = 'o'; g[gy + 2][12] = 'g'; g[gy + 2][13] = 'o';

      // Bridge connecting rims
      g[gy + 1][15] = 'G'; g[gy + 1][16] = 'g';

      // Right rim (round 4x4)
      g[gy][17] = 'G'; g[gy][18] = 'g'; g[gy][19] = 'g'; g[gy][20] = 'o';
      g[gy + 1][17] = 'g'; g[gy + 1][18] = 'w'; g[gy + 1][19] = 'w'; g[gy + 1][20] = 'o';
      g[gy + 2][17] = 'o'; g[gy + 2][18] = 'g'; g[gy + 2][19] = 'o';

      // Temple earpiece stems running back into fur
      g[gy][9] = 'o'; g[gy][10] = 'G';
      g[gy][21] = 'g'; g[gy][22] = 'o';

      // Specular glint on spectacles frame 5
      if (glints[f]) {
        g[gy][11] = 'w';
        g[gy + 1][15] = 'w';
      }

      // 4. Massive Hand / Finger pushing glasses up (fingerUp > 0)
      if (fing === 1) {
        // Finger raising toward bridge (row 15..17, col 15..16)
        g[15][15] = 'k'; g[15][16] = 'k';
        g[16][14] = 'k'; g[16][15] = 'z'; g[16][16] = 'S'; g[16][17] = 'k';
        g[17][14] = 'k'; g[17][15] = 'S'; g[17][16] = 's'; g[17][17] = 'k';
      } else if (fing === 2) {
        // Finger pushing right at spectacles bridge (row 12..15, col 15..16)
        g[12][15] = 'k'; g[12][16] = 'k';
        g[13][14] = 'k'; g[13][15] = 'z'; g[13][16] = 'S'; g[13][17] = 'k';
        g[14][14] = 'k'; g[14][15] = 'S'; g[14][16] = 's'; g[14][17] = 'k';
        g[15][15] = 's'; g[15][16] = 's';
      }

      // 5. Open Ledger Book at the bottom desk (rows 23..30, cols 5..26)
      // Leather binding base
      for (let x = 6; x <= 25; x++) {
        g[30][x] = 'k';
        g[29][x] = 'b';
      }
      g[29][5] = 'k'; g[29][26] = 'k';

      // Open Pages: Left page (cols 6..14), Spine (col 15..16), Right page (cols 17..25)
      // Left Page
      g[23][7] = 'k'; g[23][8] = 'k'; g[23][9] = 'k'; g[23][10] = 'k'; g[23][11] = 'k'; g[23][12] = 'k'; g[23][13] = 'k'; g[23][14] = 'k';
      for (let y = 24; y <= 28; y++) {
        g[y][6] = 'k';
        for (let x = 7; x <= 14; x++) {
          // Ruled lines alternating
          g[y][x] = (y % 2 === 0 && x >= 8 && x <= 13) ? 'f' : 'P';
        }
      }

      // Central spine crevice
      for (let y = 23; y <= 28; y++) {
        g[y][15] = 'd';
        g[y][16] = 'd';
      }

      // Right Page
      g[23][17] = 'k'; g[23][18] = 'k'; g[23][19] = 'k'; g[23][20] = 'k'; g[23][21] = 'k'; g[23][22] = 'k'; g[23][23] = 'k'; g[23][24] = 'k';
      for (let y = 24; y <= 28; y++) {
        for (let x = 17; x <= 24; x++) {
          // Ruled lines alternating on right page
          g[y][x] = (y % 2 === 0 && x >= 18 && x <= 23) ? 'd' : 'p';
        }
        g[y][25] = 'k';
      }

      // Heavy knuckles holding bottom corners of ledger
      g[27][5] = 'k'; g[27][6] = 'z'; g[27][7] = 'S'; g[27][8] = 'k';
      g[28][5] = 'k'; g[28][6] = 'S'; g[28][7] = 's'; g[28][8] = 'k';

      if (fing === 0) {
        g[27][23] = 'k'; g[27][24] = 'S'; g[27][25] = 's'; g[27][26] = 'k';
        g[28][23] = 'k'; g[28][24] = 's'; g[28][25] = 'd'; g[28][26] = 'k';
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'gorilla_clerk',
    category: 'automation',
    size: [W, H],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Massive hulking gorilla clerk with open ledger and brass spectacles sliding down snout and pushed back up',
    palette: palette,
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
