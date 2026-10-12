(function (root) {
  'use strict';

  function buildFrames() {
    const frames = [];

    // Specular sweep X position travels across platen
    const sweepOffsets = [6, 8, 10, 12, 14, 16];

    for (let f = 0; f < 6; f++) {
      const g = Array.from({ length: 24 }, () => Array(24).fill('.'));
      const sweepX = sweepOffsets[f];
      const leverFlick = (f === 1 || f === 2);
      const paperLift = (f >= 2 && f <= 4);

      // 1. Fresh Parchment Sheet Fed Behind Platen (x=7..17, y=3..6)
      // Silhouette moves as paper advances/flutters
      const paperTopY = paperLift ? 2 : 3;
      for (let y = paperTopY; y <= 6; y++) {
        for (let x = 7; x <= 17; x++) {
          if (y === paperTopY) {
            g[y][x] = (x === 7 || x === 17) ? 'd' : 'p';
          } else {
            g[y][x] = (x === 7 || x === 17) ? 'd' : 'w';
          }
        }
      }

      // 2. Carriage Return Lever on Top-Left (x=2..4, y=4..8)
      // Lever flicks up during carriage advance
      if (leverFlick) {
        g[3][2] = 'd'; g[3][3] = 'h';
        g[4][3] = 'd'; g[4][4] = 'h';
        g[5][4] = 'd'; g[5][5] = 'm';
      } else {
        g[4][1] = 'd'; g[4][2] = 'h';
        g[5][2] = 'd'; g[5][3] = 'h';
        g[6][3] = 'd'; g[6][4] = 'm';
      }

      // 3. Left Platen Knob & Ratchet Gear (x=1..5, y=9..15)
      g[10][1] = 'd'; g[10][2] = 'h'; g[10][3] = 'm';
      g[11][1] = 'd'; g[11][2] = 'p'; g[11][3] = 'h';
      g[12][1] = 'd'; g[12][2] = 'm'; g[12][3] = 'd';
      g[13][1] = 'd'; g[13][2] = 'm'; g[13][3] = 'd';
      g[14][2] = 'd'; g[14][3] = 'd';

      // Ratchet gear teeth
      g[9][4]  = 'h'; g[9][5]  = 'd';
      g[10][4] = 'm'; g[10][5] = 'd';
      g[11][4] = 'h'; g[11][5] = 'd';
      g[12][4] = 'm'; g[12][5] = 'd';
      g[13][4] = 'h'; g[13][5] = 'd';
      g[14][4] = 'd'; g[14][5] = 'd';

      // Ratchet pawl tooth poking out on alternating frames
      if (f % 2 === 0) {
        g[8][4] = 'd'; g[8][5] = 'h';
      }

      // 4. Right Platen Knob (x=19..22, y=9..15)
      g[10][19] = 'd'; g[10][20] = 'm'; g[10][21] = 'h'; g[10][22] = 'd';
      g[11][19] = 'd'; g[11][20] = 'h'; g[11][21] = 'p'; g[11][22] = 'd';
      g[12][19] = 'd'; g[12][20] = 'm'; g[12][21] = 'd'; g[12][22] = 'd';
      g[13][19] = 'd'; g[13][20] = 'm'; g[13][21] = 'd'; g[13][22] = 'd';
      g[14][20] = 'd'; g[14][21] = 'd';

      // 5. Paper Bail Metal Bar (Horizontal chrome bar across top, y=6..7, x=5..19)
      for (let x = 6; x <= 18; x++) {
        g[6][x] = (x % 3 === 0) ? 'p' : 'h';
        g[7][x] = 'd';
      }
      // Paper bail rubber rollers on bar
      g[6][8]  = 'k'; g[6][9]  = 'k';
      g[7][8]  = 'k'; g[7][9]  = 'k';
      g[6][15] = 'k'; g[6][16] = 'k';
      g[7][15] = 'k'; g[7][16] = 'k';

      // 6. Solid 24K Gold Cylinder Platen (x=6..18, y=8..15)
      for (let x = 6; x <= 18; x++) {
        g[8][x] = 'g';
      }

      for (let x = 6; x <= 18; x++) {
        g[9][x]  = 't';
        g[10][x] = 'y';
        g[11][x] = 'y';
        g[12][x] = 's';
        g[13][x] = 's';
        g[14][x] = 'g';
      }

      for (let x = 6; x <= 18; x++) {
        g[15][x] = 'g';
      }

      // 7. Traveling Brilliant Specular Sheen
      for (let y = 9; y <= 14; y++) {
        const sx = sweepX + (y - 9);
        if (sx >= 6 && sx <= 18) {
          g[y][sx] = 'p';
          if (sx > 6) g[y][sx - 1] = 'w';
          if (sx < 18) g[y][sx + 1] = 'w';
        }
      }

      // Carriage bed frame underneath platen (y=16..17, x=5..19)
      for (let x = 5; x <= 19; x++) {
        g[16][x] = (x === 5 || x === 19) ? 'd' : 'm';
        g[17][x] = (x === 5 || x === 19) ? 'd' : 'd';
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'golden_platen',
    category: 'deals',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: '24k gold typewriter platen cylinder with rotating ratchet clicks, lever flick, and sweeping specular sheen',
    palette: {
      '.': null,
      'g': '#4a2e04', // gold deep outline
      's': '#b38004', // gold shadow
      'y': '#ffd23a', // gold base
      't': '#fff08c', // gold light
      'w': '#fffbe0', // gold highlight
      'd': '#343444', // metal dark outline
      'm': '#a4a4b4', // metal base
      'h': '#d8d8e4', // metal light
      'p': '#ffffff', // specular white
      'k': '#1a0f14'  // ink dark
    },
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
