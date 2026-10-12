(function (root) {
  'use strict';

  // Wax Seal 1: Scarlet Wax Seal - 24x24, 4 frames, 8 fps, loop: true
  // Circular scarlet wax seal with organic molten droplets, embossed crest sheen,
  // and swaying gilded silk ribbon ends.

  const P = {
    '.': null,
    // Scarlet Wax Ramp (from RAMPS.red)
    'k': '#420a06', // deep wax groove / outline
    's': '#781c16', // shadow scarlet wax
    'b': '#b8322a', // base scarlet wax
    'l': '#e86a50', // light scarlet wax
    'h': '#ffaba0', // highlight wax sheen
    // Gilded Ribbon & Crest Glint (from RAMPS.gold)
    'd': '#4a2e04', // deep gold shadow
    'o': '#b38004', // shadow gold
    'y': '#ffd23a', // base gold
    'g': '#fff08c', // light gold
    'w': '#fffbe0'  // specular glint
  };

  function buildWaxFrame(frameIdx) {
    const g = Array.from({ length: 24 }, () => Array(24).fill('.'));

    // 1. Molten Wax Circular Rim (y: 2..17, x: 4..19)
    // Row 2: Top organic wax rim
    g[2][8] = 'k'; g[2][9] = 'h'; g[2][10] = 'h'; g[2][11] = 'h';
    g[2][12] = 'h'; g[2][13] = 'l'; g[2][14] = 'k';

    // Row 3
    g[3][6] = 'k'; g[3][7] = 'h';
    for (let x = 8; x <= 14; x++) g[3][x] = (x <= 11) ? 'h' : 'l';
    g[3][15] = 's'; g[3][16] = 'k';

    // Row 4
    g[4][5] = 'k'; g[4][6] = 'h'; g[4][7] = 'l';
    for (let x = 8; x <= 14; x++) g[4][x] = 'b';
    g[4][15] = 's'; g[4][16] = 's'; g[4][17] = 'k';

    // Rows 5..14: Wax Body & Recessed Crest
    for (let y = 5; y <= 14; y++) {
      const isTop = y <= 7;
      const isBot = y >= 12;
      const leftEdge = (y === 5 || y === 14) ? 4 : 3;
      const rightEdge = (y === 5 || y === 14) ? 18 : 19;

      g[y][leftEdge] = 'k';
      g[y][leftEdge + 1] = isTop ? 'h' : 'l';
      g[y][leftEdge + 2] = isTop ? 'l' : 'b';

      for (let x = leftEdge + 3; x <= rightEdge - 3; x++) {
        g[y][x] = 'b';
      }

      g[y][rightEdge - 2] = isBot ? 's' : 's';
      g[y][rightEdge - 1] = isBot ? 'k' : 's';
      g[y][rightEdge] = 'k';
    }

    // Row 15
    g[15][5] = 'k'; g[15][6] = 's'; g[15][7] = 'b';
    for (let x = 8; x <= 14; x++) g[15][x] = 's';
    g[15][15] = 's'; g[15][16] = 's'; g[15][17] = 'k';

    // Row 16
    g[16][6] = 'k'; g[16][7] = 's';
    for (let x = 8; x <= 14; x++) g[16][x] = 's';
    g[16][15] = 'k'; g[16][16] = 'k';

    // Row 17: Bottom molten droplet
    g[17][8] = 'k'; g[17][9] = 's'; g[17][10] = 'k';
    g[17][12] = 'k'; g[17][13] = 's'; g[17][14] = 'k';

    // 2. Embossed Heraldic Gorilla Crest in Matrix (y: 6..13, x: 7..15)
    // Matrix inner groove
    for (let x = 7; x <= 15; x++) {
      g[6][x] = 'k';
      g[13][x] = 'k';
    }
    for (let y = 7; y <= 12; y++) {
      g[y][7] = 'k';
      g[y][15] = 'k';
    }

    // Embossed Crest Matrix floor & Gorilla profile
    // Row 7
    g[7][9] = 's'; g[7][10] = 'l'; g[7][11] = 'h'; g[7][12] = 'l'; g[7][13] = 's';
    // Row 8: Crest brow
    g[8][8] = 's'; g[8][9] = 'l'; g[8][10] = 'h'; g[8][11] = 'h'; g[8][12] = 'l'; g[8][13] = 's';
    // Row 9: Muzzle / eyes
    g[9][8] = 's'; g[9][9] = 'h'; g[9][10] = 'l'; g[9][11] = 'l'; g[9][12] = 's'; g[9][13] = 'k';
    // Row 10: Jaw
    g[10][8] = 's'; g[10][9] = 'l'; g[10][10] = 'h'; g[10][11] = 'l'; g[10][12] = 's'; g[10][13] = 'k';
    // Row 11: Shoulders
    g[11][8] = 's'; g[11][9] = 'l'; g[11][10] = 'l'; g[11][11] = 's'; g[11][12] = 's'; g[11][13] = 'k';
    // Row 12: Base
    g[12][9] = 's'; g[12][10] = 's'; g[12][11] = 's'; g[12][12] = 's';

    // 3. Specular Sheen Sweep Across Matrix
    // Frame 0: Sheen at top-left [9, 7]..[10, 8]
    // Frame 1: Sheen at center [10, 9]..[11, 10]
    // Frame 2: Sheen at center-right [10, 11]..[11, 12]
    // Frame 3: Sheen at bottom-right [12, 12]..[13, 13]
    if (frameIdx === 0) {
      g[7][10] = 'w'; g[7][11] = 'w'; g[8][9] = 'w';
    } else if (frameIdx === 1) {
      g[8][10] = 'w'; g[9][10] = 'w'; g[9][9] = 'w';
    } else if (frameIdx === 2) {
      g[10][11] = 'w'; g[10][12] = 'w'; g[11][11] = 'w';
    } else if (frameIdx === 3) {
      g[11][12] = 'w'; g[12][12] = 'w'; g[12][13] = 'w';
    }

    // 4. Swaying Gilded Silk Ribbon Ends (rows 16..22)
    // Left ribbon tail (x: 8..11) & Right ribbon tail (x: 12..15)
    // dx across frames: [0, +1, 0, -1]
    const dx = (frameIdx === 1) ? 1 : (frameIdx === 3) ? -1 : 0;

    // Left Ribbon Tail
    const lx = 8 + dx;
    g[17][lx] = 'd'; g[17][lx + 1] = 'y'; g[17][lx + 2] = 'g'; g[17][lx + 3] = 'd';
    g[18][lx] = 'd'; g[18][lx + 1] = 'y'; g[18][lx + 2] = 'g'; g[18][lx + 3] = 'd';
    g[19][lx] = 'd'; g[19][lx + 1] = 'o'; g[19][lx + 2] = 'y'; g[19][lx + 3] = 'd';
    g[20][lx] = 'd'; g[20][lx + 1] = 'o'; g[20][lx + 2] = 'y'; g[20][lx + 3] = 'd';
    g[21][lx] = 'd'; g[21][lx + 1] = 'd'; g[21][lx + 2] = 'o'; g[21][lx + 3] = 'd';
    g[22][lx] = 'd'; g[22][lx + 3] = 'd'; // V-notch

    // Right Ribbon Tail
    const rx = 13 + dx;
    g[17][rx] = 'd'; g[17][rx + 1] = 'y'; g[17][rx + 2] = 'o'; g[17][rx + 3] = 'd';
    g[18][rx] = 'd'; g[18][rx + 1] = 'y'; g[18][rx + 2] = 'o'; g[18][rx + 3] = 'd';
    g[19][rx] = 'd'; g[19][rx + 1] = 'y'; g[19][rx + 2] = 'o'; g[19][rx + 3] = 'd';
    g[20][rx] = 'd'; g[20][rx + 1] = 'o'; g[20][rx + 2] = 'o'; g[20][rx + 3] = 'd';
    g[21][rx] = 'd'; g[21][rx + 1] = 'd'; g[21][rx + 2] = 'd'; g[21][rx + 3] = 'd';
    g[22][rx] = 'd'; g[22][rx + 3] = 'd'; // V-notch

    return g;
  }

  function buildFrames() {
    const frames = [];
    for (let f = 0; f < 4; f++) {
      const g = buildWaxFrame(f);
      frames.push({ rows: g.map(r => r.join('')) });
    }
    return frames;
  }

  const asset = {
    id: 'wax_seal_red',
    category: 'titles',
    size: [24, 24],
    fps: 8,
    loop: true,
    notes: 'Circular scarlet wax seal with embossed crest sheen and swaying ribbon ends',
    palette: P,
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || {}).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
