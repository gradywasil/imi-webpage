(function (root) {
  'use strict';

  function buildFrames() {
    function makeGrid() {
      return Array.from({ length: 16 }, () => Array(16).fill('.'));
    }

    const frames = [];

    // Frame 0: Rest position (y=9..13, x=4..10) - round gold coin face
    {
      const g = makeGrid();
      g[9][6] = 'd'; g[9][7] = 'd'; g[9][8] = 'd'; g[9][9] = 'd';
      g[10][4] = 'd'; g[10][5] = 'g'; g[10][6] = 'h'; g[10][7] = 'y'; g[10][8] = 'y'; g[10][9] = 's'; g[10][10] = 'd';
      g[11][4] = 'd'; g[11][5] = 'h'; g[11][6] = 'w'; g[11][7] = 'y'; g[11][8] = 'y'; g[11][9] = 's'; g[11][10] = 'd';
      g[12][4] = 'd'; g[12][5] = 'y'; g[12][6] = 'y'; g[12][7] = 's'; g[12][8] = 's'; g[12][9] = 'd'; g[12][10] = 'd';
      g[13][6] = 'd'; g[13][7] = 'd'; g[13][8] = 'd'; g[13][9] = 'd';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 1: Jump up & 45 degree rotation with rising motion lines
    {
      const g = makeGrid();
      g[5][7] = 'd'; g[5][8] = 'd';
      g[6][6] = 'd'; g[6][7] = 'g'; g[6][8] = 'h'; g[6][9] = 'd';
      g[7][5] = 'd'; g[7][6] = 'h'; g[7][7] = 'w'; g[7][8] = 'y'; g[7][9] = 's'; g[7][10] = 'd';
      g[8][5] = 'd'; g[8][6] = 'y'; g[8][7] = 'y'; g[8][8] = 's'; g[8][9] = 's'; g[8][10] = 'd';
      g[9][6] = 'd'; g[9][7] = 's'; g[9][8] = 'd'; g[9][9] = 'd';
      g[10][7] = 'd'; g[10][8] = 'd';
      // Motion line underneath (paired pixels to avoid orphans)
      g[12][7] = 'h'; g[12][8] = 'h';
      g[13][7] = 'y'; g[13][8] = 'y';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 2: Apex edge-on slit with brilliant specular gleam across milled edge
    {
      const g = makeGrid();
      g[2][7] = 'd'; g[2][8] = 'd';
      g[3][7] = 'w'; g[3][8] = 'w';
      g[4][6] = 'd'; g[4][7] = 'w'; g[4][8] = 'w'; g[4][9] = 'd';
      g[5][6] = 'd'; g[5][7] = 'w'; g[5][8] = 'h'; g[5][9] = 'd';
      g[6][6] = 'd'; g[6][7] = 'h'; g[6][8] = 's'; g[6][9] = 'd';
      g[7][7] = 'd'; g[7][8] = 'd';
      // Specular shine sparkles (paired)
      g[4][4] = 'g'; g[4][5] = 'g';
      g[4][10] = 'g'; g[4][11] = 'g';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 3: Descending flip - 45 degree back face
    {
      const g = makeGrid();
      g[5][7] = 'd'; g[5][8] = 'd';
      g[6][6] = 'd'; g[6][7] = 'h'; g[6][8] = 'y'; g[6][9] = 'd';
      g[7][5] = 'd'; g[7][6] = 'y'; g[7][7] = 's'; g[7][8] = 's'; g[7][9] = 'd'; g[7][10] = 'd';
      g[8][5] = 'd'; g[8][6] = 's'; g[8][7] = 's'; g[8][8] = 'd'; g[8][9] = 'd'; g[8][10] = 'd';
      g[9][6] = 'd'; g[9][7] = 'd'; g[9][8] = 'd'; g[9][9] = 'd';
      g[10][7] = 'd'; g[10][8] = 'd';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 4: Impact landing squash
    {
      const g = makeGrid();
      for (let x = 6; x <= 9; x++) g[10][x] = 'd';
      g[11][4] = 'd'; g[11][5] = 'g'; g[11][6] = 'h'; g[11][7] = 'y'; g[11][8] = 'y'; g[11][9] = 's'; g[11][10] = 's'; g[11][11] = 'd';
      g[12][3] = 'd'; g[12][4] = 'g'; g[12][5] = 'h'; g[12][6] = 'y'; g[12][7] = 'y'; g[12][8] = 's'; g[12][9] = 's'; g[12][10] = 'd'; g[12][11] = 'd'; g[12][12] = 'd';
      g[13][4] = 'd'; g[13][5] = 's'; g[13][6] = 's'; g[13][7] = 's'; g[13][8] = 'd'; g[13][9] = 'd'; g[13][10] = 'd'; g[13][11] = 'd';
      for (let x = 5; x <= 10; x++) g[14][x] = 'd';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 5: Rebound & settle with golden rim glint (seamless loop to Frame 0)
    {
      const g = makeGrid();
      g[9][6] = 'd'; g[9][7] = 'd'; g[9][8] = 'd'; g[9][9] = 'd';
      g[10][4] = 'd'; g[10][5] = 'w'; g[10][6] = 'g'; g[10][7] = 'h'; g[10][8] = 'y'; g[10][9] = 's'; g[10][10] = 'd';
      g[11][4] = 'd'; g[11][5] = 'g'; g[11][6] = 'h'; g[11][7] = 'y'; g[11][8] = 'y'; g[11][9] = 's'; g[11][10] = 'd';
      g[12][4] = 'd'; g[12][5] = 'y'; g[12][6] = 'y'; g[12][7] = 's'; g[12][8] = 's'; g[12][9] = 'd'; g[12][10] = 'd';
      g[13][6] = 'd'; g[13][7] = 'd'; g[13][8] = 'd'; g[13][9] = 'd';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'coin_pop',
    category: 'chrome',
    size: [16, 16],
    fps: 10,
    loop: true,
    notes: 'Golden coin jumping up, spinning at apex with brilliant edge sheen, and settling with squash bounce',
    palette: {
      '.': null,
      'w': '#ffffff', // specular glint
      'g': '#fffbe0', // gold highlight
      'h': '#fff08c', // gold light
      'y': '#ffd23a', // gold base
      's': '#b38004', // gold shadow
      'd': '#4a2e04'  // gold deep outline
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
