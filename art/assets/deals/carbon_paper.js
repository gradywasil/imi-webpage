(function (root) {
  'use strict';

  function buildFrames() {
    const frames = [];

    // Curl peeling depth per frame: corner rolls up and outward past top edge
    const peelStages = [0, 1, 2, 3, 2, 1];

    for (let f = 0; f < 6; f++) {
      const g = Array.from({ length: 24 }, () => Array(24).fill('.'));
      const peel = peelStages[f];
      const flapLift = (peel > 0);

      // 1. Bottom Cream Parchment Sheet (x=3..19, y=4..21)
      for (let x = 4; x <= 19; x++) g[4][x] = 'd';
      for (let y = 5; y <= 20; y++) {
        g[y][3] = 'd';
        g[y][4] = 't';
        g[y][18] = 's';
        g[y][19] = 'd';
      }
      for (let x = 3; x <= 19; x++) g[21][x] = 'd';

      // Parchment paper interior
      for (let y = 5; y <= 20; y++) {
        for (let x = 5; x <= 17; x++) {
          g[y][x] = 'm';
        }
      }

      // 2. Manifold Blue Carbon Sheet Resting on Top (x=5..17, y=6..19)
      for (let y = 6; y <= 19; y++) {
        for (let x = 5; x <= 17; x++) {
          const peelDist = (x - 13) + (10 - y);
          const isPeeled = peelDist > (5 - peel * 2);

          if (!isPeeled) {
            if (x === 5 || y === 19) {
              g[y][x] = 'k';
            } else if (y === 6) {
              g[y][x] = 'l';
            } else if (x === 17) {
              g[y][x] = 'u';
            } else {
              g[y][x] = 'b';
            }
          } else {
            // Transferred copy letters
            if ((x === 14 && y === 8) || (x === 16 && y === 8) ||
                (x === 14 && y === 10) || (x === 15 && y === 10) ||
                (x === 15 && y === 7)) {
              g[y][x] = 'k';
            }
          }
        }
      }

      // 3. Curled-Back Flap of Carbon Paper
      // When peeled, the curled leaf arches upward and outward into rows 2..3 and col 20!
      if (flapLift) {
        // High arching curled corner
        const tipY = 4 - peel; // tip rises to row 3, 2, 1
        const tipX = 18 + Math.min(2, peel);

        g[tipY][tipX - 1] = 'k'; g[tipY][tipX] = 'k';
        g[tipY + 1][tipX - 2] = 'k'; g[tipY + 1][tipX - 1] = 'h'; g[tipY + 1][tipX] = 'k';
        g[tipY + 2][tipX - 2] = 'h'; g[tipY + 2][tipX - 1] = 'w';
      }

      // Diagonal curl fold crease
      const cx = 16 - peel * 2;
      const cy = 7 + peel * 2;
      for (let step = 0; step <= peel + 1; step++) {
        const fx = cx + step;
        const fy = cy - step;
        if (fx >= 5 && fx <= 21 && fy >= 4 && fy <= 19) {
          g[fy][fx] = 'h';
          if (fx + 1 <= 21) g[fy][fx + 1] = 'l';
          if (fy + 1 <= 21) g[fy + 1][fx] = 'u';
        }
      }

      // Specular glint on curl tip on frame 2
      if (f === 2) {
        g[cy][cx] = 'w';
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'carbon_paper',
    category: 'deals',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Blue manifold carbon sheet peeling back from cream parchment revealing transferred copy type',
    palette: {
      '.': null,
      'k': '#0c1442', // blue deep outline / transferred type
      'u': '#1a2872', // blue shadow
      'b': '#2e44a8', // blue base
      'l': '#5470d8', // blue light
      'h': '#8caef8', // blue highlight / curled underside
      'd': '#786842', // paper dark outline
      's': '#c9b88a', // paper shadow
      'm': '#ede0b8', // paper base
      't': '#fff6d6', // paper light
      'w': '#ffffff'  // white specular glint
    },
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
