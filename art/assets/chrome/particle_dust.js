(function (root) {
  'use strict';

  function buildFrames() {
    function makeGrid() {
      return Array.from({ length: 16 }, () => Array(16).fill('.'));
    }

    const frames = [];

    // Frame 0: Impact puff - dense warm sand mound at ground level
    {
      const g = makeGrid();
      for (let x = 6; x <= 9; x++) g[14][x] = 'p';
      for (let x = 5; x <= 10; x++) g[15][x] = 'b';
      g[13][7] = 'w'; g[13][8] = 'w';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 1: Billowing upward - two expanding cloud lobes
    {
      const g = makeGrid();
      // Left lobe
      g[10][4] = 'w'; g[10][5] = 'w';
      g[11][3] = 'p'; g[11][4] = 'b'; g[11][5] = 'b'; g[11][6] = 's';
      g[12][3] = 'b'; g[12][4] = 'b'; g[12][5] = 's'; g[12][6] = 's';
      // Right lobe
      g[10][10] = 'w'; g[10][11] = 'w';
      g[11][9] = 'p'; g[11][10] = 'b'; g[11][11] = 'b'; g[11][12] = 's';
      g[12][9] = 'b'; g[12][10] = 'b'; g[12][11] = 's'; g[12][12] = 's';
      // Lower center wisp
      g[13][7] = 'b'; g[13][8] = 'b';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 2: Maximum billow - rounded cloud lobes expand wide, center hollows
    {
      const g = makeGrid();
      // Left outer cloud
      g[7][3] = 'w'; g[7][4] = 'w';
      g[8][2] = 'p'; g[8][3] = 'b'; g[8][4] = 'b'; g[8][5] = 's';
      g[9][2] = 'b'; g[9][3] = 'b'; g[9][4] = 's';
      g[10][3] = 's'; g[10][4] = 's';
      // Right outer cloud
      g[7][11] = 'w'; g[7][12] = 'w';
      g[8][10] = 'p'; g[8][11] = 'b'; g[8][12] = 'b'; g[8][13] = 's';
      g[9][11] = 'b'; g[9][12] = 'b'; g[9][13] = 's';
      g[10][11] = 's'; g[10][12] = 's';
      // Upper wisps
      g[5][5] = 'p'; g[5][6] = 'p';
      g[5][9] = 'p'; g[5][10] = 'p';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 3: Dissipating wisps drifting outward and upward
    {
      const g = makeGrid();
      // Left thinning wisp
      g[5][2] = 'p'; g[5][3] = 'b';
      g[6][1] = 'b'; g[6][2] = 's';
      g[7][2] = 's'; g[7][3] = 'd';
      // Right thinning wisp
      g[5][12] = 'p'; g[5][13] = 'b';
      g[6][13] = 'b'; g[6][14] = 's';
      g[7][12] = 's'; g[7][13] = 'd';
      // Top fading puffs
      g[4][6] = 's'; g[4][7] = 's';
      g[4][8] = 's'; g[4][9] = 's';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 4: Final faint dust motes
    {
      const g = makeGrid();
      g[4][1] = 's'; g[4][2] = 'd';
      g[4][13] = 's'; g[4][14] = 'd';
      g[3][7] = 's'; g[3][8] = 'd';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 5: One-shot hold frame (identical to Frame 4)
    frames.push({ rows: frames[4].rows.slice() });

    return frames;
  }

  const asset = {
    id: 'particle_dust',
    category: 'chrome',
    size: [16, 16],
    fps: 10,
    loop: false,
    notes: 'Soft warm sand dust cloud puff expanding upward in two billowing lobes and dissipating',
    palette: {
      '.': null,
      // Warm Sand Dust Ramp (Look Bible paper ramp)
      'w': '#ffffff', // bright dust highlight
      'p': '#fff6d6', // light dust tone
      'b': '#ede0b8', // warm sand base
      's': '#c9b88a', // dust shadow tone
      'd': '#786842'  // dust outline / deep wisp
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
