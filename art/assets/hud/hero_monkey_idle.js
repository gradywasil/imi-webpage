(function (root) {
  'use strict';

  // hero_monkey_idle: 32x32 · 8 frames · 8 fps · loop
  // Hero mascot chimp sitting at vintage typewriter typing enthusiastically,
  // breathing chest, bouncing ears, and confident grin.

  function buildFrames() {
    const frames = [];

    // Distinct motion on each of the 8 frames:
    // Left hand Y positions across 8 frames:   [25, 24, 22, 23, 22, 22, 23, 24]
    // Right hand Y positions across 8 frames:  [22, 22, 23, 24, 25, 24, 22, 23]
    // Chest breath Y offsets:                  [ 0,  0, -1, -1, -1, -1,  0,  0]
    // Ear bob Y offsets:                       [ 0,  1,  1,  0,  0, -1, -1,  0]
    // Paper X offsets:                         [ 0,  0,  1,  1,  1,  1,  0,  0]
    // Typewriter carriage position X offsets:  [ 0,  0,  1,  1,  1,  1,  0,  0]

    const lHandY = [25, 24, 22, 23, 22, 22, 23, 24];
    const rHandY = [22, 22, 23, 24, 25, 24, 22, 23];
    const breathY = [0, 0, -1, -1, -1, -1, 0, 0];
    const earY = [0, 1, 1, 0, 0, -1, -1, 0];
    const paperX = [0, 0, 1, 1, 1, 1, 0, 0];

    for (let f = 0; f < 8; f++) {
      const g = Array.from({ length: 32 }, () => Array(32).fill('.'));

      const breath = breathY[f];
      const earDy = earY[f];
      const ly = lHandY[f];
      const ry = rHandY[f];
      const pxOffset = paperX[f];

      // 1. Chimp Ears (left ear at x=3..8; right ear at x=23..28)
      const ey = 7 + earDy;
      // Left ear
      for (let y = ey - 2; y <= ey + 3; y++) {
        for (let x = 3; x <= 8; x++) {
          const d2 = (x - 6) * (x - 6) + (y - ey) * (y - ey);
          if (d2 <= 8) {
            g[y][x] = (d2 > 5) ? 'k' : ((d2 > 2) ? 'b' : 'c');
          }
        }
      }
      g[ey][5] = 's'; // ear canal highlight

      // Right ear
      for (let y = ey - 2; y <= ey + 3; y++) {
        for (let x = 23; x <= 28; x++) {
          const d2 = (x - 25) * (x - 25) + (y - ey) * (y - ey);
          if (d2 <= 8) {
            g[y][x] = (d2 > 5) ? 'k' : ((d2 > 2) ? 'b' : 'o');
          }
        }
      }
      g[ey][26] = 'c';

      // 2. Head & Fur Tuft (center at 16, y=4..15)
      // Top fur cowlick wiggles slightly with ear
      const cowlickX = (f % 2 === 0) ? 15 : 16;
      g[2][cowlickX] = 'k'; g[2][cowlickX + 1] = 'k';
      g[3][14] = 'k'; g[3][15] = 'F'; g[3][16] = 'f'; g[3][17] = 'k';

      // Head shape
      for (let y = 4; y <= 15; y++) {
        for (let x = 8; x <= 23; x++) {
          const dx = x - 15.5;
          const dy = y - 9.5;
          if ((dx * dx) / 50 + (dy * dy) / 36 <= 1.0) {
            g[y][x] = 'B';
          }
        }
      }

      // 3. Face Mask (skin area, y=7..15, x=10..21)
      for (let y = 7; y <= 15; y++) {
        for (let x = 10; x <= 21; x++) {
          const dx = x - 15.5;
          const dy = y - 11;
          if (y <= 10) {
            if ((Math.abs(dx) <= 4.8 && dy >= -4) || (y === 7 && Math.abs(dx) <= 3.5)) {
              g[y][x] = 'c';
            }
          } else {
            if ((dx * dx) / 24 + (dy * dy) / 16 <= 1.0) {
              g[y][x] = 'c';
            }
          }
        }
      }

      // Brow & Forehead shading
      g[6][12] = 'f'; g[6][13] = 'f'; g[6][18] = 'f'; g[6][19] = 'f';
      g[7][13] = 's'; g[7][14] = 's'; g[7][17] = 's'; g[7][18] = 'c';

      // Eyes (y=9, x=13 and x=18)
      // Subtle pupil shift on typing cadence
      const pupilShift = (f >= 4) ? 1 : 0;
      g[9][12] = 'k'; g[9][13 + pupilShift] = 'S'; g[9][14] = 'k';
      g[9][17] = 'k'; g[9][18 + pupilShift] = 'S'; g[9][19] = 'k';

      // Cheeks
      g[10][11] = 's'; g[10][12] = 'c'; g[10][19] = 'c'; g[10][20] = 'o';
      g[11][12] = 's'; g[11][13] = 'c'; g[11][18] = 'c'; g[11][19] = 'o';

      // Cute nostrils
      g[12][15] = 'k'; g[12][16] = 'k';

      // Grin / Smile (y=13..14)
      if (f === 6 || f === 7) {
        // Broad playful grin showing white teeth
        g[13][13] = 'k'; g[13][14] = 'S'; g[13][15] = 'S'; g[13][16] = 'S'; g[13][17] = 'S'; g[13][18] = 'k';
        g[14][14] = 'k'; g[14][15] = 'o'; g[14][16] = 'o'; g[14][17] = 'k';
      } else {
        g[13][13] = 'k'; g[13][14] = 'S'; g[13][15] = 'S'; g[13][16] = 'S'; g[13][17] = 'S'; g[13][18] = 'k';
        g[14][14] = 'k'; g[14][15] = 'k'; g[14][16] = 'k'; g[14][17] = 'k';
      }

      // 4. Body & Chest (y=16..22) affected by breath
      const by = 16 + breath;
      for (let y = by; y <= by + 5; y++) {
        for (let x = 9; x <= 22; x++) {
          if (y < 30) {
            const dx = x - 15.5;
            if (dx * dx <= 32) {
              g[y][x] = (x <= 13) ? 'f' : ((x >= 18) ? 'b' : 'B');
            }
          }
        }
      }
      if (breath < 0) {
        g[by + 1][14] = 'F'; g[by + 1][15] = 'F'; g[by + 1][16] = 'f';
      }

      // 5. Vintage Typewriter (Foreground y=20..30, x=4..27)
      // Paper sheet sticking up behind carriage
      const paperLeft = 12 + pxOffset;
      for (let y = 16; y <= 21; y++) {
        for (let x = paperLeft; x <= paperLeft + 6; x++) {
          if (g[y][x] === '.' || g[y][x] === 'B' || g[y][x] === 'b') {
            g[y][x] = (y === 16 || x === paperLeft || x === paperLeft + 6) ? 'd' : 'p';
          }
        }
      }
      // Typed ink line on paper
      g[18][paperLeft + 2] = 'd'; g[18][paperLeft + 3] = 'd'; g[18][paperLeft + 4] = 'd';

      // Typewriter Carriage platen roller (y=21, x=6..25)
      for (let x = 6; x <= 25; x++) {
        g[21][x] = 'd';
      }
      // Carriage lever on left (x=4..5, y=19..21)
      g[19][4] = 'm'; g[19][5] = 'M';
      g[20][5] = 'd';
      g[21][5] = 'd';

      // Typewriter Main Body Chassis (y=22..29, x=5..26)
      for (let y = 22; y <= 29; y++) {
        for (let x = 5; x <= 26; x++) {
          if (y === 22 || y === 29 || x === 5 || x === 26) {
            g[y][x] = 'd';
          } else if (y === 23 || x === 6) {
            g[y][x] = 'm';
          } else {
            g[y][x] = (x <= 15) ? 'M' : 'a';
          }
        }
      }

      // Typewriter Keyboard sloped front (y=26..28, x=8..23)
      for (let x = 8; x <= 23; x++) {
        if (x % 2 === 0) {
          g[26][x] = 'm';
          g[27][x] = 'M';
          g[28][x] = 'p';
        } else {
          g[26][x] = 'd';
          g[27][x] = 'd';
          g[28][x] = 'd';
        }
      }

      // Space bar (y=29, x=12..19)
      for (let x = 12; x <= 19; x++) {
        g[29][x] = 'm';
      }

      // Typewriter rubber feet
      g[30][7] = 'd'; g[30][8] = 'd';
      g[30][23] = 'd'; g[30][24] = 'd';

      // 6. Left Arm & Hand (striking at ly)
      // Arm connection from shoulder (10, 18) down to ly
      for (let y = 19; y < ly - 1; y++) {
        g[y][9] = 'B'; g[y][10] = 'B';
      }
      // Wrist and hand
      g[ly - 2][8] = 'c'; g[ly - 2][9] = 's'; g[ly - 2][10] = 'k';
      g[ly - 1][8] = 's'; g[ly - 1][9] = 'S'; g[ly - 1][10] = 'k';
      g[ly][8] = 's'; g[ly][9] = 'c';

      // 7. Right Arm & Hand (striking at ry)
      // Arm connection from shoulder (21, 18) down to ry
      for (let y = 19; y < ry - 1; y++) {
        g[y][21] = 'b'; g[y][22] = 'b';
      }
      // Wrist and hand
      g[ry - 2][21] = 'c'; g[ry - 2][22] = 'o'; g[ry - 2][23] = 'k';
      g[ry - 1][21] = 'S'; g[ry - 1][22] = 'c'; g[ry - 1][23] = 'k';
      g[ry][21] = 'c'; g[ry][22] = 'o';

      // Outline pass around upper head and ears to ensure pixel purity
      for (let y = 1; y <= 15; y++) {
        for (let x = 1; x < 31; x++) {
          if (g[y][x] !== '.' && g[y][x] !== 'k') {
            if (g[y - 1][x] === '.' || g[y + 1][x] === '.' ||
                g[y][x - 1] === '.' || g[y][x + 1] === '.') {
              if (y <= 5 || x <= 3 || x >= 28) g[y][x] = 'k';
            }
          }
        }
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'hero_monkey_idle',
    category: 'hud',
    size: [32, 32],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Hero mascot chimp typing enthusiastically at typewriter with breathing chest and playful grin',
    palette: {
      '.': null,
      'k': '#261208', // fur deep outline / eye pupil
      'b': '#4a2814', // fur shadow
      'B': '#6e4220', // fur base
      'f': '#9a6232', // fur light
      'F': '#ba8248', // fur highlight
      'o': '#b97c4c', // skin shadow
      'c': '#e0aa76', // skin base
      's': '#f6d6a8', // skin light
      'S': '#fff4e4', // skin highlight / eye white / teeth
      'd': '#343444', // metal chassis outline
      'a': '#626274', // metal shadow
      'M': '#a4a4b4', // metal base
      'm': '#d8d8e4', // metal highlight
      'p': '#ede0b8'  // paper cream
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
