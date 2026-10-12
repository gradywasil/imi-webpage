(function (root) {
  'use strict';

  function buildFrames() {
    function makeGrid() {
      return Array.from({ length: 16 }, () => Array(16).fill('.'));
    }

    const frames = [];

    // Frame 0: Resting keycap tile at typewriter basket baseline
    {
      const g = makeGrid();
      for (let x = 4; x <= 11; x++) { g[9][x] = 'k'; g[14][x] = 'k'; }
      for (let y = 9; y <= 14; y++) { g[y][4] = 'k'; g[y][11] = 'k'; }
      for (let y = 10; y <= 13; y++) {
        for (let x = 5; x <= 10; x++) {
          g[y][x] = (y === 10 || x === 5) ? 'w' : (y === 13 || x === 10) ? 's' : 'b';
        }
      }
      // Letter 'A' glyph in deep ink
      g[10][7] = 'I'; g[10][8] = 'I';
      g[11][6] = 'I'; g[11][9] = 'I';
      g[12][6] = 'I'; g[12][7] = 'I'; g[12][8] = 'I'; g[12][9] = 'I';
      g[13][6] = 'I'; g[13][9] = 'I';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 1: Explosive upward leap with vertical speed lines
    {
      const g = makeGrid();
      for (let x = 4; x <= 11; x++) { g[5][x] = 'k'; g[10][x] = 'k'; }
      for (let y = 5; y <= 10; y++) { g[y][4] = 'k'; g[y][11] = 'k'; }
      for (let y = 6; y <= 9; y++) {
        for (let x = 5; x <= 10; x++) {
          g[y][x] = (y === 6 || x === 5) ? 'w' : (y === 9 || x === 10) ? 's' : 'b';
        }
      }
      // Letter 'A'
      g[6][7] = 'I'; g[6][8] = 'I';
      g[7][6] = 'I'; g[7][9] = 'I';
      g[8][6] = 'I'; g[8][7] = 'I'; g[8][8] = 'I'; g[8][9] = 'I';
      g[9][6] = 'I'; g[9][9] = 'I';
      // Vertical speed lines underneath (paired)
      g[12][6] = 'l'; g[13][6] = 'l'; g[14][6] = 'l';
      g[11][8] = 'l'; g[12][8] = 'l'; g[13][8] = 'l';
      g[12][9] = 'l'; g[13][9] = 'l'; g[14][9] = 'l';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 2: Apex flight with specular glint on letter and drifting energy motes
    {
      const g = makeGrid();
      for (let x = 4; x <= 11; x++) { g[1][x] = 'k'; g[6][x] = 'k'; }
      for (let y = 1; y <= 6; y++) { g[y][4] = 'k'; g[y][11] = 'k'; }
      for (let y = 2; y <= 5; y++) {
        for (let x = 5; x <= 10; x++) {
          g[y][x] = (y === 2 || x === 5) ? 'w' : (y === 5 || x === 10) ? 's' : 'b';
        }
      }
      // Letter 'A' with highlight
      g[2][7] = 'w'; g[2][8] = 'w';
      g[3][6] = 'I'; g[3][9] = 'I';
      g[4][6] = 'I'; g[4][7] = 'I'; g[4][8] = 'I'; g[4][9] = 'I';
      g[5][6] = 'I'; g[5][9] = 'I';
      // Speed motes (paired)
      g[9][5] = 'l'; g[9][6] = 'l';
      g[10][9] = 'l'; g[10][10] = 'l';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 3: Descending float
    {
      const g = makeGrid();
      for (let x = 4; x <= 11; x++) { g[4][x] = 'k'; g[9][x] = 'k'; }
      for (let y = 4; y <= 9; y++) { g[y][4] = 'k'; g[y][11] = 'k'; }
      for (let y = 5; y <= 8; y++) {
        for (let x = 5; x <= 10; x++) {
          g[y][x] = (y === 5 || x === 5) ? 'w' : (y === 8 || x === 10) ? 's' : 'b';
        }
      }
      // Letter 'A'
      g[5][7] = 'I'; g[5][8] = 'I';
      g[6][6] = 'I'; g[6][9] = 'I';
      g[7][6] = 'I'; g[7][7] = 'I'; g[7][8] = 'I'; g[7][9] = 'I';
      g[8][6] = 'I'; g[8][9] = 'I';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 4: Impact landing squash
    {
      const g = makeGrid();
      for (let x = 3; x <= 12; x++) { g[10][x] = 'k'; g[15][x] = 'k'; }
      for (let y = 10; y <= 15; y++) { g[y][3] = 'k'; g[y][12] = 'k'; }
      for (let y = 11; y <= 14; y++) {
        for (let x = 4; x <= 11; x++) {
          g[y][x] = (y === 11 || x === 4) ? 'w' : (y === 14 || x === 11) ? 's' : 'b';
        }
      }
      // Squashed letter glyph
      g[11][7] = 'I'; g[11][8] = 'I';
      g[12][5] = 'I'; g[12][10] = 'I';
      g[13][5] = 'I'; g[13][6] = 'I'; g[13][7] = 'I'; g[13][8] = 'I'; g[13][9] = 'I'; g[13][10] = 'I';
      g[14][5] = 'I'; g[14][10] = 'I';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    // Frame 5: Rebound & settle with corner glint (seamless loop to Frame 0)
    {
      const g = makeGrid();
      for (let x = 4; x <= 11; x++) { g[9][x] = 'k'; g[14][x] = 'k'; }
      for (let y = 9; y <= 14; y++) { g[y][4] = 'k'; g[y][11] = 'k'; }
      for (let y = 10; y <= 13; y++) {
        for (let x = 5; x <= 10; x++) {
          g[y][x] = (y === 10 || x === 5) ? 'w' : (y === 13 || x === 10) ? 's' : 'b';
        }
      }
      // Letter 'A' with glint
      g[10][7] = 'w'; g[10][8] = 'I';
      g[11][6] = 'I'; g[11][9] = 'I';
      g[12][6] = 'I'; g[12][7] = 'I'; g[12][8] = 'I'; g[12][9] = 'I';
      g[13][6] = 'I'; g[13][9] = 'I';
      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'letter_fly',
    category: 'chrome',
    size: [16, 16],
    fps: 10,
    loop: true,
    notes: 'Typewriter letter glyph bouncing up with vertical speed lines, apex flutter, and settle bounce',
    palette: {
      '.': null,
      // Cream Keycap Ramp (paper)
      'w': '#ffffff', // keycap highlight
      'b': '#ede0b8', // keycap cream base
      's': '#c9b88a', // keycap shadow bevel
      // Letter Ink
      'I': '#3a2a30', // ink glyph
      'k': '#1a0f14', // deep ink outline
      // Speed Line Gold
      'l': '#ffd23a'  // energetic speed line
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
