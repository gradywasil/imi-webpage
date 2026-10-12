(function (root) {
  'use strict';

  function buildFrames() {
    const frames = [];

    // Radial track sectors (16 sectors around center [11.5, 11.5])
    const sectors = [
      [[11, 4], [12, 4]],
      [[13, 4], [14, 5]],
      [[15, 6], [16, 7]],
      [[17, 9], [17, 10]],
      [[17, 12], [17, 13]],
      [[16, 15], [15, 16]],
      [[14, 17], [13, 18]],
      [[11, 18], [12, 18]],
      [[9, 18], [10, 18]],
      [[7, 17], [8, 16]],
      [[6, 15], [5, 14]],
      [[5, 12], [5, 11]],
      [[5, 10], [5, 9]],
      [[6, 7], [7, 6]],
      [[8, 5], [9, 4]],
      [[10, 4], [10, 5]]
    ];

    // Radial charge progression across 6 frames
    const activeSectors = [
      [0, 1, 2, 3],
      [0, 1, 2, 3, 4, 5, 6, 7],
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      [14, 15, 0, 1, 2, 3]
    ];

    for (let f = 0; f < 6; f++) {
      const g = Array.from({ length: 24 }, () => Array(24).fill('.'));

      // 1. Inset Bezel Casing (Center [11.5, 11.5], radius ~8)
      // Strictly inside x=2..21, y=2..21 (row 0, 23 and col 0, 23 remain empty)
      for (let y = 3; y <= 19; y++) {
        for (let x = 3; x <= 19; x++) {
          const dx = x - 11.5;
          const dy = y - 11.5;
          const d2 = dx * dx + dy * dy;
          if (d2 <= 64 && d2 >= 49) {
            g[y][x] = (dx + dy < -2) ? 'h' : ((dx + dy > 3) ? 'd' : 'm');
          } else if (d2 < 49 && d2 >= 25) {
            g[y][x] = 'c'; // track groove
          } else if (d2 < 25) {
            g[y][x] = 'k'; // center hub
          }
        }
      }

      // Outer bezel 4-connected rim outline
      for (let x = 7; x <= 15; x++) { g[2][x] = 'd'; g[20][x] = 'd'; }
      for (let y = 7; y <= 15; y++) { g[y][2] = 'd'; g[y][20] = 'd'; }
      g[3][5] = 'd'; g[3][6] = 'd'; g[4][3] = 'd'; g[4][4] = 'd';
      g[3][16] = 'd'; g[3][17] = 'd'; g[4][18] = 'd'; g[4][19] = 'd';
      g[19][3] = 'd'; g[19][4] = 'd'; g[20][5] = 'd'; g[20][6] = 'd';
      g[19][18] = 'd'; g[19][19] = 'd'; g[20][16] = 'd'; g[20][17] = 'd';

      // Center hub pin
      g[11][11] = 'w'; g[11][12] = 'w';
      g[12][11] = 'm'; g[12][12] = 'd';

      // 2. Active Radial Track Sectors
      const act = activeSectors[f];
      act.forEach(idx => {
        const pts = sectors[idx];
        const col = (f === 4) ? 'w' : ((f === 3) ? 't' : 'y');
        pts.forEach(([px, py]) => {
          g[py][px] = col;
        });
      });

      // 3. Dial Pointer Needle
      if (f === 0) {
        g[11][13] = 'w'; g[11][14] = 't'; // 3 o'clock
      } else if (f === 1) {
        g[13][11] = 'w'; g[14][11] = 't'; // 6 o'clock
      } else if (f === 2) {
        g[11][9] = 'w'; g[11][8] = 't';   // 9 o'clock
      } else if (f === 3 || f === 4) {
        g[9][11] = 'w'; g[8][11] = 't';   // 12 o'clock
      } else if (f === 5) {
        g[10][13] = 'w'; g[9][14] = 't';  // 2 o'clock
      }

      // 4. Sparkling Energy Flares at Full Charge (f=4) and Discharge (f=5)
      // Flares extend into rows 1 & 21 and cols 1 & 21 (rows 0, 23 and cols 0, 23 remain clean)
      if (f === 4) {
        g[1][11] = 'w'; g[1][12] = 'w';
        g[21][11] = 'w'; g[21][12] = 'w';
        g[11][1] = 'w'; g[12][1] = 'w';
        g[11][21] = 'w'; g[12][21] = 'w';
      } else if (f === 5) {
        g[1][11] = 't'; g[1][12] = 't';
        g[11][21] = 't'; g[12][21] = 't';
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'hold_meter',
    category: 'deals',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Circular radial progress charge meter filling clockwise and sparkling at 100% full',
    palette: {
      '.': null,
      'g': '#4a2e04', // gold deep outline
      's': '#b38004', // gold shadow
      'y': '#ffd23a', // gold base
      't': '#fff08c', // gold light
      'w': '#ffffff', // charge burst / white glint
      'd': '#343444', // metal dark outline
      'm': '#a4a4b4', // metal base
      'h': '#d8d8e4', // metal light
      'k': '#1a0f14', // dial deep dark
      'c': '#3a2a30'  // dial track groove
    },
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
