(function (root) {
  'use strict';

  function buildFrames() {
    const frames = [];

    // Spoke hole angular positions for 6 frames (continuous 360/6 = 60 deg rotation)
    const spokeOffsets = [
      [[10, 6], [7, 12], [13, 12]],
      [[12, 7], [7, 10], [11, 13]],
      [[13, 9], [8, 8], [9, 13]],
      [[10, 14], [13, 8], [7, 8]],
      [[8, 13], [13, 10], [9, 7]],
      [[7, 11], [12, 12], [11, 7]]
    ];

    // Ribbon flutter vertical waves for frames 0..5
    const waves = [0, 1, 2, 1, 0, -1];

    for (let f = 0; f < 6; f++) {
      const g = Array.from({ length: 24 }, () => Array(24).fill('.'));
      const wave = waves[f];

      // 1. Golden Film Reel Disc (Center [10, 10], radius ~7.5)
      for (let y = 3; y <= 17; y++) {
        for (let x = 3; x <= 17; x++) {
          const dx = x - 10;
          const dy = y - 10;
          const d2 = dx * dx + dy * dy;

          if (d2 <= 56) {
            if (d2 >= 42) {
              // Outer gold rim
              g[y][x] = (dx + dy < 0) ? 'w' : 's';
            } else {
              // Inner gold disc
              g[y][x] = (dx + dy < -2) ? 't' : ((dx + dy > 3) ? 's' : 'y');
            }
          }
        }
      }

      // Continuous 4-connected rim outline
      for (let x = 7; x <= 13; x++) { g[2][x] = 'g'; g[18][x] = 'g'; }
      for (let y = 7; y <= 13; y++) { g[y][2] = 'g'; g[y][18] = 'g'; }
      g[3][5] = 'g'; g[3][6] = 'g'; g[4][4] = 'g'; g[4][5] = 'g'; g[5][3] = 'g'; g[6][3] = 'g';
      g[3][14] = 'g'; g[3][15] = 'g'; g[4][15] = 'g'; g[4][16] = 'g'; g[5][17] = 'g'; g[6][17] = 'g';
      g[14][3] = 'g'; g[15][3] = 'g'; g[16][4] = 'g'; g[16][5] = 'g'; g[17][5] = 'g'; g[17][6] = 'g';
      g[14][17] = 'g'; g[15][17] = 'g'; g[16][15] = 'g'; g[16][16] = 'g'; g[17][14] = 'g'; g[17][15] = 'g';

      // Center spindle hub (x=9..11, y=9..11)
      g[9][10] = 'k'; g[10][9] = 'k'; g[10][10] = 'w'; g[10][11] = 'k'; g[11][10] = 'k';

      // 3 Spoke Cutout Holes (Rotating each frame)
      const holes = spokeOffsets[f];
      holes.forEach(([hx, hy]) => {
        g[hy][hx] = 'k';
        g[hy][hx + 1] = 'k';
        g[hy + 1][hx] = 'k';
        g[hy + 1][hx + 1] = 'k';
      });

      // 2. Unwinding Celluloid Film Ribbon (Feeding from bottom of reel x=12, y=17 to x=22, y=19)
      for (let step = 0; step <= 9; step++) {
        const rx = 12 + step;
        const ry = 17 + Math.floor(step * 0.3) + (step > 4 ? Math.round(wave * (step - 4) / 5) : 0);

        if (rx >= 12 && rx <= 21 && ry >= 15 && ry <= 21) {
          // Top edge
          g[ry - 2][rx] = 'k';
          // Top sprocket track
          g[ry - 1][rx] = (step % 2 === (f % 2)) ? 'p' : 'i';
          // Middle celluloid frame
          g[ry][rx]     = 'c';
          // Bottom sprocket track
          g[ry + 1][rx] = (step % 2 === (f % 2)) ? 'p' : 'i';
          // Bottom edge
          g[ry + 2][rx] = 'k';
        }
      }

      // Ribbon curling tail tip at x=22
      const tailY = 19 + wave;
      g[tailY - 2][22] = 'k';
      g[tailY - 1][22] = 'c';
      g[tailY][22]     = 'i';
      g[tailY + 1][22] = 'k';

      // 3. Golden Rim Specular Sparkle at top-left (f=0, 1)
      if (f === 0) {
        g[3][5] = 'w';
      } else if (f === 1) {
        g[3][5] = 'w';
        g[2][5] = 'w'; g[3][4] = 'w'; g[3][6] = 'w'; g[4][5] = 'w';
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'film_rights',
    category: 'deals',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Golden 35mm film reel spinning smoothly with unwinding fluttering celluloid ribbon',
    palette: {
      '.': null,
      'g': '#4a2e04', // gold deep outline
      's': '#b38004', // gold shadow
      'y': '#ffd23a', // gold base
      't': '#fff08c', // gold light
      'w': '#fffbe0', // gold highlight / glint
      'k': '#1a0f14', // ink black outline & hub
      'i': '#3a2a30', // celluloid dark base
      'c': '#5c4650', // celluloid sheen
      'p': '#ffffff'  // sprocket hole white
    },
    sparkles: [
      [5, 2], [4, 3], [6, 3], [5, 4]
    ],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
