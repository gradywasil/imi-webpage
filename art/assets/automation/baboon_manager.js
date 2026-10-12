(function (root) {
  'use strict';

  // 32x32, 8 frames, 8 fps
  // Cape baboon boss in pinstripe vest, pocketwatch checks, foot tapping
  const W = 32;
  const H = 32;

  const palette = {
    '.': null,
    'k': '#141828', // deep navy slate outline
    'd': '#28304a', // pinstripe vest / deep shadow
    'f': '#454f6e', // fur shadow
    'm': '#6a7796', // silvery cape mane
    'M': '#9aa8c8', // silvery mane highlight
    's': '#724220', // muzzle shadow
    'S': '#b97c4c', // muzzle base
    'r': '#c8486c', // baboon pink/rose nose base
    'R': '#f08aa4', // rose highlight
    'w': '#ffffff', // pinstripes / watch dial / glint
    'g': '#ffd23a', // gold pocketwatch base
    'G': '#fff08c', // gold highlight
    'o': '#b38004', // gold shadow
    'b': '#5a3517', // office floor wood base
    'B': '#8a5a2b'  // office floor wood light
  };

  function buildFrames() {
    const frames = [];

    // Foot tap: 0=flat on floor, 1=heel raised, 2=toe tap strike
    const footTaps = [0, 1, 2, 0, 1, 2, 0, 0];
    // Watch pose: 0=open inspection, 1=open glint, 2=snap shut, 3=lowered, 4=at pocket, 5=tap hold, 6=reach chain, 7=pulling out
    const watchPoses = [0, 1, 2, 3, 4, 4, 3, 2];
    // Head glance: 0=looking down at watch, 1=glance up impatiently
    const headGlances = [0, 0, 0, 1, 1, 1, 0, 0];

    for (let f = 0; f < 8; f++) {
      const g = Array.from({ length: H }, () => Array(W).fill('.'));
      const ft = footTaps[f];
      const wp = watchPoses[f];
      const hg = headGlances[f];

      // 1. Office Floor Base (rows 29..30, cols 2..29)
      for (let x = 3; x <= 28; x++) {
        g[29][x] = (x % 4 === 0) ? 'B' : 'b';
        g[30][x] = 'k';
      }
      g[29][2] = 'k'; g[29][29] = 'k';

      // 2. Silvery Cape Baboon Mane & Body (rows 5..26, cols 7..26)
      // Silver cape flowing over back and shoulders (top-left lit)
      g[4][14] = 'k'; g[4][15] = 'k';
      g[5][12] = 'k'; g[5][13] = 'M'; g[5][14] = 'M'; g[5][15] = 'm'; g[5][16] = 'k';
      g[6][10] = 'k'; g[6][11] = 'M'; g[6][12] = 'M'; g[6][13] = 'm'; g[6][14] = 'm'; g[6][15] = 'f'; g[6][16] = 'k';

      // Silvery cape mane spread
      for (let y = 7; y <= 16; y++) {
        g[y][8] = 'k';
        for (let x = 9; x <= 16; x++) {
          g[y][x] = (x <= 11) ? 'M' : ((x <= 14) ? 'm' : 'f');
        }
      }
      // Lower cape flowing down back (rows 17..24, cols 7..12)
      for (let y = 17; y <= 24; y++) {
        g[y][7] = 'k';
        for (let x = 8; x <= 12; x++) {
          g[y][x] = (x <= 9) ? 'M' : 'm';
        }
        g[y][13] = 'f';
      }

      // 3. Baboon Long Dog-like Muzzle & Head (rows 6..16, cols 14..26)
      // Sloping forehead
      for (let x = 16; x <= 20; x++) g[6][x] = 'm';
      g[6][21] = 'k';

      for (let y = 7; y <= 9; y++) {
        for (let x = 17; x <= 22; x++) {
          g[y][x] = (x <= 19) ? 'S' : 's';
        }
        g[y][23] = 'k';
      }

      // Long snout extending to the right (cols 19..25, rows 10..15)
      for (let y = 10; y <= 14; y++) {
        for (let x = 18; x <= 24; x++) {
          g[y][x] = (x <= 20) ? 'S' : 's';
        }
        g[y][25] = 'k';
      }
      g[15][19] = 'k';
      for (let x = 20; x <= 24; x++) g[15][x] = 's';
      g[15][25] = 'k';

      // Scarlet / Rose nose pad at snout tip
      g[10][23] = 'r'; g[10][24] = 'R'; g[10][25] = 'k';
      g[11][23] = 'r'; g[11][24] = 'r'; g[11][25] = 'k';
      g[12][24] = 'k';

      // Sharp Stern Eyes & Brow
      g[8][17] = 'k'; g[8][18] = 'k';
      if (hg === 0) {
        // Glancing down toward pocketwatch
        g[9][17] = 'k'; g[9][18] = 'w';
        g[10][18] = 'k';
      } else {
        // Impatient glare forward / eyebrow twitch
        g[8][18] = 'm'; // brow raised
        g[9][17] = 'w'; g[9][18] = 'k';
      }

      // Whiskers / stern jaw line
      g[14][20] = 'k'; g[14][21] = 'k'; g[14][22] = 'k'; g[14][23] = 'k';

      // 4. Pinstripe Vest (rows 16..25, cols 13..21)
      for (let y = 16; y <= 25; y++) {
        for (let x = 14; x <= 21; x++) {
          // Pinstripes: dark navy vest with vertical 1px white lines at cols 15, 18, 20
          if (x === 15 || x === 18 || x === 20) {
            g[y][x] = 'w';
          } else {
            g[y][x] = 'd';
          }
        }
        g[y][22] = 'k';
      }
      g[26][14] = 'k'; g[26][15] = 'k'; g[26][16] = 'k'; g[26][17] = 'k';
      g[26][18] = 'k'; g[26][19] = 'k'; g[26][20] = 'k'; g[26][21] = 'k';

      // Gold Chain looped across vest from button to pocket
      g[20][17] = 'g';
      g[21][18] = 'G';
      g[21][19] = 'g';

      // 5. Pocketwatch Interaction (watchPoses)
      if (wp === 0 || wp === 1) {
        // Holding round open gold watch at cols 21..25, rows 17..21
        // Open watch cover flipped open
        g[16][23] = 'g'; g[16][24] = 'G'; g[16][25] = 'k';
        // Watch body (round)
        g[17][21] = 'k'; g[17][22] = 'G'; g[17][23] = 'G'; g[17][24] = 'k';
        g[18][20] = 'k'; g[18][21] = 'w'; g[18][22] = 'w'; g[18][23] = 'o'; g[18][24] = 'k';
        g[19][20] = 'k'; g[19][21] = 'w'; g[19][22] = (wp === 1 ? 'G' : 'k'); g[19][23] = 'o'; g[19][24] = 'k';
        g[20][21] = 'k'; g[20][22] = 'o'; g[20][23] = 'o'; g[20][24] = 'k';
        // Hand holding watch
        g[19][24] = 'S'; g[19][25] = 'k';
        g[20][24] = 's'; g[20][25] = 'k';
      } else if (wp === 2) {
        // Snapped shut watch (closed gold disc)
        g[18][21] = 'k'; g[18][22] = 'G'; g[18][23] = 'k';
        g[19][20] = 'k'; g[19][21] = 'G'; g[19][22] = 'g'; g[19][23] = 'o'; g[19][24] = 'k';
        g[20][21] = 'k'; g[20][22] = 'o'; g[20][23] = 'k';
        // Hand
        g[19][24] = 'S'; g[19][25] = 'k';
      } else if (wp === 3) {
        // Watch lowering near vest pocket
        g[21][20] = 'k'; g[21][21] = 'G'; g[21][22] = 'k';
        g[22][19] = 'k'; g[22][20] = 'g'; g[22][21] = 'o'; g[22][22] = 'k';
        g[23][20] = 'k'; g[23][21] = 'o'; g[23][22] = 'k';
        // Hand
        g[22][22] = 'S'; g[22][23] = 'k';
      } else {
        // Watch tucked in vest pocket, hand on hip / tapping fingers
        g[21][19] = 'G'; g[21][20] = 'g'; // pocket rim
        g[22][22] = 'k'; g[22][23] = 'S'; g[22][24] = 'k';
        g[23][22] = 'k'; g[23][23] = 's'; g[23][24] = 'k';
      }

      // 6. Boss Legs & Foot Tapping (rows 25..29, cols 13..24)
      // Right leg (planted back)
      for (let y = 26; y <= 28; y++) {
        g[y][20] = 'd'; g[y][21] = 'd'; g[y][22] = 'k';
      }
      g[29][20] = 'k'; g[29][21] = 's'; g[29][22] = 's'; g[29][23] = 'k';

      // Left leg & Tapping Foot (cols 13..18)
      for (let y = 25; y <= 27; y++) {
        g[y][14] = 'k'; g[y][15] = 'd'; g[y][16] = 'd';
      }
      if (ft === 0) {
        // Flat on floor (row 28..29, cols 12..17)
        g[28][13] = 'k'; g[28][14] = 'S'; g[28][15] = 'S'; g[28][16] = 's'; g[28][17] = 'k';
        g[29][12] = 'k'; g[29][13] = 'S'; g[29][14] = 'S'; g[29][15] = 's'; g[29][16] = 'k';
      } else if (ft === 1) {
        // Heel raised high (row 27..28, angled up)
        g[27][13] = 'k'; g[27][14] = 'S'; g[27][15] = 'k';
        g[28][14] = 'k'; g[28][15] = 'S'; g[28][16] = 'S'; g[28][17] = 'k';
        g[29][16] = 'k'; g[29][17] = 'k';
      } else {
        // Toe tap strike (down with dust impact puff at floor)
        g[28][13] = 'k'; g[28][14] = 'S'; g[28][15] = 'S'; g[28][16] = 'k';
        g[29][12] = 'k'; g[29][13] = 'S'; g[29][14] = 'S'; g[29][15] = 's'; g[29][16] = 'k';
        // Impact dust specks
        g[28][11] = 'm'; g[28][17] = 'm';
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'baboon_manager',
    category: 'automation',
    size: [W, H],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Cape baboon boss in pinstripe vest, checking gold pocketwatch and tapping foot with impatient rhythm',
    palette: palette,
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
