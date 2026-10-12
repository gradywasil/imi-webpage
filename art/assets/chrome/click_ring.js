(function (root) {
  'use strict';

  function buildFrames() {
    function makeGrid() {
      return Array.from({ length: 16 }, () => Array(16).fill('.'));
    }

    const frames = [];

    // Frame 0: Initial click shockwave point - tight bright diamond
    {
      const g = makeGrid();
      g[6][7] = 'l'; g[6][8] = 'l';
      g[7][6] = 'l'; g[7][7] = 'w'; g[7][8] = 'w'; g[7][9] = 'l';
      g[8][6] = 'l'; g[8][7] = 'w'; g[8][8] = 'w'; g[8][9] = 'l';
      g[9][7] = 'l'; g[9][8] = 'l';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 1: Small circular ripple - expanding with cyan light
    {
      const g = makeGrid();
      for (let x = 6; x <= 9; x++) { g[4][x] = 'l'; g[11][x] = 'b'; }
      for (let y = 6; y <= 9; y++) { g[y][4] = 'l'; g[y][11] = 'b'; }
      // Quadrant corner bridges
      g[5][5] = 'w'; g[5][6] = 'w'; g[6][5] = 'w';
      g[5][10] = 'l'; g[5][9] = 'l'; g[6][10] = 'l';
      g[10][5] = 'b'; g[10][6] = 'b'; g[9][5] = 'b';
      g[10][10] = 's'; g[10][9] = 's'; g[9][10] = 's';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 2: Mid-size circular shockwave with hollow center
    {
      const g = makeGrid();
      for (let x = 6; x <= 9; x++) { g[2][x] = 'w'; g[13][x] = 's'; }
      for (let y = 6; y <= 9; y++) { g[y][2] = 'w'; g[y][13] = 's'; }
      // Arc bridges
      g[3][4] = 'w'; g[3][5] = 'w'; g[4][3] = 'w'; g[5][3] = 'w'; g[4][4] = 'l';
      g[3][10] = 'l'; g[3][11] = 'l'; g[4][12] = 'l'; g[5][12] = 'l'; g[4][11] = 'b';
      g[12][4] = 'b'; g[12][5] = 'b'; g[10][3] = 'b'; g[11][3] = 'b'; g[11][4] = 's';
      g[12][10] = 's'; g[12][11] = 's'; g[10][12] = 's'; g[11][12] = 's'; g[11][11] = 'd';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 3: Wide expanding shockwave ripple
    {
      const g = makeGrid();
      for (let x = 6; x <= 9; x++) { g[1][x] = 'l'; g[14][x] = 'd'; }
      for (let y = 6; y <= 9; y++) { g[y][1] = 'l'; g[y][14] = 'd'; }
      // Arc bridges
      g[2][3] = 'l'; g[2][4] = 'l'; g[2][5] = 'l'; g[3][2] = 'l'; g[4][2] = 'l'; g[5][2] = 'l'; g[3][3] = 'b';
      g[2][10] = 'b'; g[2][11] = 'b'; g[2][12] = 'b'; g[3][13] = 'b'; g[4][13] = 'b'; g[5][13] = 'b'; g[3][12] = 's';
      g[13][3] = 's'; g[13][4] = 's'; g[13][5] = 's'; g[10][2] = 's'; g[11][2] = 's'; g[12][2] = 's'; g[12][3] = 'd';
      g[13][10] = 'd'; g[13][11] = 'd'; g[13][12] = 'd'; g[10][13] = 'd'; g[11][13] = 'd'; g[12][13] = 'd'; g[12][12] = 'd';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 4: Outer rim dissipation ripple
    {
      const g = makeGrid();
      for (let x = 6; x <= 9; x++) { g[0][x] = 's'; g[15][x] = 'd'; }
      for (let y = 6; y <= 9; y++) { g[y][0] = 's'; g[y][15] = 'd'; }
      // Corner arc fragments
      g[1][2] = 's'; g[1][3] = 's'; g[2][1] = 's'; g[3][1] = 's'; g[2][2] = 's';
      g[1][12] = 'd'; g[1][13] = 'd'; g[2][14] = 'd'; g[3][14] = 'd'; g[2][13] = 'd';
      g[14][2] = 'd'; g[14][3] = 'd'; g[12][1] = 'd'; g[13][1] = 'd'; g[13][2] = 'd';
      g[14][12] = 'd'; g[14][13] = 'd'; g[12][14] = 'd'; g[13][14] = 'd'; g[13][13] = 'd';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 5: One-shot hold frame (identical to Frame 4)
    frames.push({ rows: frames[4].rows.slice() });

    return frames;
  }

  const asset = {
    id: 'click_ring',
    category: 'chrome',
    size: [16, 16],
    fps: 10,
    loop: false,
    notes: 'Expanding circular ripple shockwave with electric cyan-blue glow',
    palette: {
      '.': null,
      // Electric Cyan / Ripple Water Ramp (drop ramp)
      'w': '#ffffff', // bright ripple crest highlight
      'l': '#d6f0ff', // light cyan ripple
      'b': '#7ec8f0', // cyan ripple base
      's': '#3a8ec8', // deep ripple shadow
      'd': '#184c78'  // outer edge dissipation outline
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
