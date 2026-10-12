(function (root) {
  'use strict';

  function buildFrames() {
    function makeGrid() {
      return Array.from({ length: 16 }, () => Array(16).fill('.'));
    }

    const frames = [];

    // Frame 0: Initial impact flash - 2x2 white core, gold cardinal caps
    {
      const g = makeGrid();
      g[6][7] = 'h'; g[6][8] = 'h';
      g[7][6] = 'h'; g[7][7] = 'w'; g[7][8] = 'w'; g[7][9] = 'h';
      g[8][6] = 'h'; g[8][7] = 'w'; g[8][8] = 'w'; g[8][9] = 'h';
      g[9][7] = 'h'; g[9][8] = 'h';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 1: Rapid 4-point spike expansion - brilliant white/yellow core, cardinal arms extend
    {
      const g = makeGrid();
      // North spike
      g[3][7] = 'h'; g[3][8] = 'h';
      g[4][7] = 'w'; g[4][8] = 'w';
      g[5][7] = 'w'; g[5][8] = 'w';
      // South spike
      g[10][7] = 'w'; g[10][8] = 'w';
      g[11][7] = 'w'; g[11][8] = 'w';
      g[12][7] = 'h'; g[12][8] = 'h';
      // West spike
      g[7][3] = 'h'; g[8][3] = 'h';
      g[7][4] = 'w'; g[8][4] = 'w';
      g[7][5] = 'w'; g[8][5] = 'w';
      // East spike
      g[7][10] = 'w'; g[8][10] = 'w';
      g[7][11] = 'w'; g[8][11] = 'w';
      g[7][12] = 'h'; g[8][12] = 'h';
      // Center body
      for (let y = 6; y <= 9; y++) {
        for (let x = 6; x <= 9; x++) {
          g[y][x] = (x >= 7 && x <= 8 && y >= 7 && y <= 8) ? 'w' : 'y';
        }
      }
      // Diagonal motes (paired)
      g[5][5] = 'y'; g[5][6] = 'y';
      g[5][9] = 'y'; g[5][10] = 'y';
      g[10][5] = 'y'; g[10][6] = 'y';
      g[10][9] = 'y'; g[10][10] = 'y';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 2: Maximum star burst - tips detach into flying sparklets, core hollows
    {
      const g = makeGrid();
      // North sparklet
      g[1][7] = 'h'; g[1][8] = 'h';
      g[2][7] = 'w'; g[2][8] = 'w';
      // South sparklet
      g[13][7] = 'w'; g[13][8] = 'w';
      g[14][7] = 'h'; g[14][8] = 'h';
      // West sparklet
      g[7][1] = 'h'; g[8][1] = 'h';
      g[7][2] = 'w'; g[8][2] = 'w';
      // East sparklet
      g[7][13] = 'w'; g[8][13] = 'w';
      g[7][14] = 'h'; g[8][14] = 'h';
      // Diagonal sparklets
      g[4][4] = 'w'; g[4][5] = 'y';
      g[4][10] = 'y'; g[4][11] = 'w';
      g[11][4] = 'w'; g[11][5] = 'y';
      g[11][10] = 'y'; g[11][11] = 'w';
      // Hollow center ring
      g[6][7] = 'y'; g[6][8] = 'y';
      g[9][7] = 'y'; g[9][8] = 'y';
      g[7][6] = 'y'; g[8][6] = 'y';
      g[7][9] = 'y'; g[8][9] = 'y';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 3: Dissipating embers drifting outward and dimming
    {
      const g = makeGrid();
      // North/South ember tips
      g[0][7] = 'y'; g[0][8] = 'y';
      g[15][7] = 'y'; g[15][8] = 'y';
      // West/East ember tips
      g[7][0] = 'y'; g[8][0] = 'y';
      g[7][15] = 'y'; g[8][15] = 'y';
      // Diagonal drifting sparks
      g[3][3] = 's'; g[3][4] = 's';
      g[3][11] = 's'; g[3][12] = 's';
      g[12][3] = 's'; g[12][4] = 's';
      g[12][11] = 's'; g[12][12] = 's';
      // Center fading ember pair
      g[7][7] = 's'; g[7][8] = 's';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 4: Dying ember motes
    {
      const g = makeGrid();
      g[2][3] = 'd'; g[2][4] = 'd';
      g[2][11] = 'd'; g[2][12] = 'd';
      g[13][3] = 'd'; g[13][4] = 'd';
      g[13][11] = 'd'; g[13][12] = 'd';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 5: One-shot hold frame (identical to Frame 4)
    frames.push({ rows: frames[4].rows.slice() });

    return frames;
  }

  const asset = {
    id: 'particle_spark',
    category: 'chrome',
    size: [16, 16],
    fps: 10,
    loop: false,
    notes: '4-point yellow and white impact spark bursting outward into dissipating ember motes',
    palette: {
      '.': null,
      'w': '#ffffff', // bright specular core
      'h': '#fff08c', // gold light
      'y': '#ffd23a', // gold base
      's': '#b38004', // amber shadow
      'd': '#4a2e04'  // deep amber ember outline
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
