(function (root) {
  'use strict';

  function buildFrames() {
    const frames = [];

    // Pull chain sway offsets per frame (pendulum cycle)
    const swayOffsets = [-1, 0, 1, 2, 1, 0];

    for (let f = 0; f < 6; f++) {
      const g = Array.from({ length: 24 }, () => Array(24).fill('.'));
      const sw = swayOffsets[f];
      const pulse = (f % 2 === 0);

      // 1. Emerald Green Banker's Lamp Shade (x=5..19, y=3..7)
      for (let x = 6; x <= 18; x++) {
        g[3][x] = (x < 11) ? 'h' : 'l';
      }
      g[3][5] = 'v'; g[3][19] = 'v';

      for (let x = 5; x <= 19; x++) {
        g[4][x] = (x === 5 || x === 19) ? 'v' : ((x < 12) ? 'l' : 'g');
        g[5][x] = (x === 5 || x === 19) ? 'v' : 'g';
        g[6][x] = (x === 5 || x === 19) ? 'v' : 'd';
      }

      for (let x = 4; x <= 20; x++) {
        g[7][x] = 'v';
      }
      for (let x = 7; x <= 17; x++) {
        g[7][x] = 't';
      }
      g[7][11] = 'w'; g[7][12] = 'w';

      // 2. Brass Lamp Arm and Heavy Base (x=12..21, y=5..22)
      g[5][4] = 'k'; g[5][20] = 'k';
      g[6][4] = 'y'; g[6][20] = 'y';

      for (let y = 8; y <= 9; y++)   { g[y][19] = 'k'; g[y][20] = 'y'; g[y][21] = 'k'; }
      for (let y = 10; y <= 11; y++) { g[y][18] = 'k'; g[y][19] = 't'; g[y][20] = 'k'; }
      for (let y = 12; y <= 13; y++) { g[y][17] = 'k'; g[y][18] = 'y'; g[y][19] = 'k'; }
      for (let y = 14; y <= 16; y++) { g[y][16] = 'k'; g[y][17] = 'y'; g[y][18] = 'k'; }
      g[17][15] = 'k'; g[17][16] = 'y'; g[17][17] = 'k';
      g[18][14] = 'k'; g[18][15] = 'y'; g[18][16] = 'k';

      // Stepped Brass Base
      for (let x = 13; x <= 18; x++) {
        g[19][x] = (x < 16) ? 't' : 'y';
      }
      g[19][12] = 'k'; g[19][19] = 'k';

      for (let x = 11; x <= 20; x++) {
        g[20][x] = (x === 11 || x === 20) ? 'k' : ((x < 15) ? 't' : ((x < 18) ? 'y' : 's'));
        g[21][x] = 'k';
      }

      // 3. Swaying Pull-Chain (Connected solid line)
      g[8][10] = 's';
      const c1X = 10 + Math.round(sw * 0.4);
      g[9][c1X] = 'y';
      g[10][c1X] = 'y';
      const c2X = 10 + Math.round(sw * 0.7);
      g[11][c2X] = 's';
      g[11][c2X + 1] = 's';

      // Bead fob at end
      const fobX = 10 + sw;
      g[12][fobX] = 'y'; g[12][fobX + 1] = 't';
      g[13][fobX] = 's'; g[13][fobX + 1] = 'k';

      // 4. Solid Warm Cone Light Beam (Continuous rows 8..21)
      const leftEdge = pulse ? 3 : 4;
      for (let y = 8; y <= 20; y++) {
        const spread = Math.floor((y - 8) * 0.4);
        const lx = Math.max(2, 6 - spread - (pulse ? 1 : 0));
        const rx = Math.min(13, 10 + spread);

        g[y][lx] = 'b';
        g[y][lx + 1] = 'b';
        if (rx - 1 > lx + 1 && g[y][rx] === '.') {
          g[y][rx] = 'b';
          g[y][rx - 1] = 'b';
        }
      }

      // Desk illuminated pool (rows 21..22, connected directly to beam)
      for (let x = leftEdge; x <= 11; x++) {
        g[21][x] = (x % 2 === 0) ? 't' : 'b';
        g[22][x] = 'b';
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'desk_lamp',
    category: 'deals',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Emerald green banker lamp with warm pulsing light cone and swaying brass pull chain',
    palette: {
      '.': null,
      'v': '#0c3012', // leaf deep outline
      'd': '#1a5e24', // leaf shadow
      'g': '#2f8a35', // leaf base
      'l': '#74c648', // leaf light
      'h': '#a8ec76', // leaf highlight
      'k': '#4a2e04', // gold deep outline
      's': '#b38004', // gold shadow
      'y': '#ffd23a', // gold base
      't': '#fff08c', // gold light
      'b': '#fffbe0', // warm light glow
      'w': '#ffffff'  // bulb glint
    },
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
