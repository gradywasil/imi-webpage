(function (root) {
  'use strict';

  function buildFrames() {
    function makeGrid() {
      return Array.from({ length: 16 }, () => Array(16).fill('.'));
    }

    const frames = [];

    // Frame 0: High spawn - 4 square paper bits face-on
    {
      const g = makeGrid();
      // Ruby red piece [r/R] at (3, 1)
      g[1][3] = 'r'; g[1][4] = 'r';
      g[2][3] = 'R'; g[2][4] = 'R';
      // Gold yellow piece [y/Y] at (10, 0)
      g[0][10] = 'y'; g[0][11] = 'y';
      g[1][10] = 'Y'; g[1][11] = 'Y';
      // Emerald green piece [e/E] at (6, 2)
      g[2][6] = 'e'; g[2][7] = 'e';
      g[3][6] = 'E'; g[3][7] = 'E';
      // Sapphire blue piece [u/U] at (12, 3)
      g[3][12] = 'u'; g[3][13] = 'u';
      g[4][12] = 'U'; g[4][13] = 'U';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 1: 3/4 tilt tumble & drift down
    {
      const g = makeGrid();
      // Red piece tilted 1x2 at (4, 3)
      g[3][4] = 'r';
      g[4][4] = 'R';
      // Gold piece tilted 2x1 at (9, 3)
      g[3][9] = 'y'; g[3][10] = 'Y';
      // Green piece tilted 1x2 at (5, 5)
      g[5][5] = 'e';
      g[6][5] = 'E';
      // Blue piece tilted 2x1 at (13, 6)
      g[6][13] = 'u'; g[6][14] = 'U';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 2: Edge-on flip passing mid screen
    {
      const g = makeGrid();
      // Red piece edge sliver 2x1 at (3, 6)
      g[6][3] = 'r'; g[6][4] = 'R';
      // Gold piece edge sliver 1x2 at (9, 6)
      g[6][9] = 'y';
      g[7][9] = 'Y';
      // Green piece edge sliver 2x1 at (6, 8)
      g[8][6] = 'e'; g[8][7] = 'E';
      // Blue piece edge sliver 1x2 at (12, 8)
      g[8][12] = 'u';
      g[9][12] = 'U';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 3: Back-face rotation & lateral air flutter
    {
      const g = makeGrid();
      // Red piece flipped 2x2 at (2, 9)
      g[9][2] = 'R'; g[9][3] = 'R';
      g[10][2] = 'r'; g[10][3] = 'r';
      // Gold piece flipped 2x2 at (10, 9)
      g[9][10] = 'Y'; g[9][11] = 'Y';
      g[10][10] = 'y'; g[10][11] = 'y';
      // Green piece flipped 2x2 at (5, 11)
      g[11][5] = 'E'; g[11][6] = 'E';
      g[12][5] = 'e'; g[12][6] = 'e';
      // Blue piece flipped 2x2 at (13, 11)
      g[11][13] = 'U'; g[11][14] = 'U';
      g[12][13] = 'u'; g[12][14] = 'u';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 4: Lower settling on ground
    {
      const g = makeGrid();
      // Red piece settled at (3, 13)
      g[13][3] = 'r'; g[13][4] = 'r';
      g[14][3] = 'R'; g[14][4] = 'R';
      // Gold piece settled at (9, 13)
      g[13][9] = 'y'; g[13][10] = 'y';
      g[14][9] = 'Y'; g[14][10] = 'Y';
      // Green piece settled at (6, 14)
      g[14][6] = 'e'; g[14][7] = 'e';
      g[15][6] = 'E'; g[15][7] = 'E';
      // Blue piece settled at (12, 14)
      g[14][12] = 'u'; g[14][13] = 'u';
      g[15][12] = 'U'; g[15][13] = 'U';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 5: One-shot hold frame (identical to Frame 4)
    frames.push({ rows: frames[4].rows.slice() });

    return frames;
  }

  const asset = {
    id: 'particle_confetti',
    category: 'chrome',
    size: [16, 16],
    fps: 10,
    loop: false,
    notes: 'Multi-colored paper confetti bits tumbling downward with fluttering rotations and settling',
    palette: {
      '.': null,
      // Ruby Red
      'r': '#e86a50',
      'R': '#b8322a',
      // Gold Yellow
      'y': '#ffd23a',
      'Y': '#b38004',
      // Emerald Green
      'e': '#74c648',
      'E': '#2f8a35',
      // Sapphire Blue
      'u': '#5470d8',
      'U': '#2e44a8'
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
