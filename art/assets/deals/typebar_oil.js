(function (root) {
  'use strict';

  function buildFrames() {
    const frames = [];

    for (let f = 0; f < 6; f++) {
      const g = Array.from({ length: 24 }, () => Array(24).fill('.'));

      // 1. Vintage Brass Oiler Can Body (x=11..21, y=3..13)
      // Rounded conical dome reservoir
      for (let y = 6; y <= 12; y++) {
        for (let x = 12; x <= 20; x++) {
          const dx = x - 16;
          const dy = y - 9;
          const d2 = dx * dx + dy * dy;
          if (d2 <= 16) {
            g[y][x] = (dx + dy < -1) ? 'h' : ((dx + dy > 2) ? 's' : 'm');
          }
        }
      }
      // Oiler dome outline
      for (let x = 14; x <= 18; x++) { g[5][x] = 'k'; g[13][x] = 'k'; }
      for (let y = 7; y <= 11; y++) { g[y][11] = 'k'; g[y][21] = 'k'; }
      g[6][12] = 'k'; g[6][13] = 'k'; g[6][19] = 'k'; g[6][20] = 'k';
      g[12][12] = 'k'; g[12][13] = 'k'; g[12][19] = 'k'; g[12][20] = 'k';

      // Brass dome highlight stripe
      g[7][14] = 'w'; g[7][15] = 'w';
      g[8][13] = 'w'; g[8][14] = 'w';

      // Thumb pump lever on top-right of can (x=18..21, y=2..5)
      // Thumb presses slightly on frame 1
      const thumbPress = (f === 1);
      const ty = thumbPress ? 3 : 2;
      g[ty][19] = 'k'; g[ty][20] = 'w'; g[ty][21] = 'k';
      g[ty + 1][19] = 'k'; g[ty + 1][20] = 'h'; g[ty + 1][21] = 'k';
      g[ty + 2][19] = 's'; g[ty + 2][20] = 's';

      // 2. Long Tapered Brass Nozzle Spout (Extends down-left from [13, 8] to [6, 14])
      g[8][12]  = 'k'; g[8][13]  = 'h'; g[8][14]  = 'k';
      g[9][11]  = 'k'; g[9][12]  = 'h'; g[9][13]  = 'k';
      g[10][10] = 'k'; g[10][11] = 'h'; g[10][12] = 'k';
      g[11][9]  = 'k'; g[11][10] = 'h'; g[11][11] = 'k';
      g[12][8]  = 'k'; g[12][9]  = 'w'; g[12][10] = 'k';
      g[13][7]  = 'k'; g[13][8]  = 'h'; g[13][9]  = 'k';
      // Brass nozzle tip
      g[14][6]  = 'k'; g[14][7]  = 'm'; g[14][8]  = 'k';

      // 3. Dripping Amber Oil Droplet Sequence (f=0..5)
      if (f === 0) {
        // Bead swelling at nozzle tip (connected to spout)
        g[15][6] = 'y'; g[15][7] = 't';
        g[16][6] = 'b'; g[16][7] = 'd';
      } else if (f === 1) {
        // Droplet elongating with neck
        g[15][6] = 'y'; g[15][7] = 'y';
        g[16][6] = 't'; g[16][7] = 'y';
        g[17][6] = 'p'; g[17][7] = 'b';
        g[18][6] = 'y'; g[18][7] = 'd';
      } else if (f === 2) {
        // Droplet pinched off, falling mid-air (2x3 cluster)
        g[15][6] = 't'; // tiny residual tip meniscus
        g[18][5] = 'd'; g[18][6] = 't'; g[18][7] = 'd';
        g[19][5] = 'y'; g[19][6] = 'p'; g[19][7] = 'b';
        g[20][5] = 'd'; g[20][6] = 'b'; g[20][7] = 'd';
      } else if (f === 3) {
        // Impact splash on typebar segment
        g[19][4] = 't'; g[19][5] = 't'; g[19][7] = 't'; g[19][8] = 't';
        g[20][3] = 'd'; g[20][4] = 'y'; g[20][5] = 'p'; g[20][6] = 'p'; g[20][7] = 'y'; g[20][8] = 'd';
        g[21][4] = 'b'; g[21][5] = 'b'; g[21][6] = 'b'; g[21][7] = 'b';
      } else if (f === 4) {
        // Spreading lubricated oil sheen puddle
        for (let x = 4; x <= 9; x++) {
          g[20][x] = (x === 6 || x === 7) ? 'p' : 't';
          g[21][x] = 'b';
        }
      } else if (f === 5) {
        // Lubricated sheen settling, fresh meniscus forming at tip
        g[15][6] = 't'; g[15][7] = 'b';
        for (let x = 5; x <= 8; x++) {
          g[20][x] = 'y';
          g[21][x] = 'b';
        }
      }

      // 4. Steel Typebar Linkage Segment underneath (y=21..23, x=2..12)
      for (let x = 2; x <= 12; x++) {
        if (g[21][x] === '.') g[21][x] = 'c';
        g[22][x] = 'g';
      }
      // Pivot rivet peg
      g[21][6] = (f >= 3 && f <= 4) ? 'p' : 'w';

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'typebar_oil',
    category: 'deals',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Vintage brass oiler can with thumb-pump dripping amber oil droplet onto steel typebar',
    palette: {
      '.': null,
      'k': '#3e1e08', // bronze deep outline
      's': '#6e3c16', // bronze shadow
      'm': '#a86834', // bronze base
      'h': '#dca06a', // bronze light
      'w': '#ffe6cc', // bronze highlight
      'd': '#5a3a06', // oil deep outline
      'b': '#c98f0e', // oil shadow
      'y': '#ffd23a', // oil base
      't': '#fff08c', // oil light
      'p': '#ffffff', // specular glint & sparkle
      'g': '#343444', // metal dark
      'c': '#a4a4b4'  // metal base
    },
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
