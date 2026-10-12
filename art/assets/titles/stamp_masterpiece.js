(function (root) {
  'use strict';

  // Stamp 4: MASTERPIECE - 24x24, 4 frames, 8 fps, loop: true
  // Crimson heraldic crest stamp with golden coronet, "MASTERPIECE" banner,
  // traveling glint, and twinkling starbursts.

  const P = {
    '.': null,
    // Crimson Heraldic Ramp (from RAMPS.red)
    'k': '#420a06', // deep crimson outline
    's': '#781c16', // shadow crimson
    'b': '#b8322a', // base crimson
    'l': '#e86a50', // light crimson
    'h': '#ffaba0', // highlight crimson
    // Gold Coronet & Starburst Ramp (from RAMPS.gold)
    'd': '#4a2e04', // deep gold
    'o': '#b38004', // shadow gold
    'y': '#ffd23a', // base gold
    'g': '#fff08c', // light gold
    'w': '#fffbe0'  // specular glint / starburst
  };

  const sparkleCoords = [
    [4, 4], [4, 3], [4, 5], [3, 4], [5, 4],
    [19, 4], [19, 3], [19, 5], [18, 4], [20, 4],
    [11, 2], [12, 2]
  ];

  function buildCrestFrame(frameIdx) {
    const g = Array.from({ length: 24 }, () => Array(24).fill('.'));

    // 1. Golden Coronet / 3-Point Crown (rows 3..6, cols 7..16)
    // Crown peaks (row 3)
    g[3][8] = 'd'; g[3][9] = 'g';
    g[3][11] = 'd'; g[3][12] = 'w';
    g[3][14] = 'g'; g[3][15] = 'd';
    // Crown upper body (row 4)
    g[4][7] = 'd'; g[4][8] = 'y'; g[4][9] = 'y'; g[4][10] = 'd';
    g[4][11] = 'w'; g[4][12] = 'y'; g[4][13] = 'd';
    g[4][14] = 'y'; g[4][15] = 'y'; g[4][16] = 'd';
    // Crown base circlet with jewels (rows 5..6)
    for (let x = 6; x <= 17; x++) {
      g[5][x] = (x === 6 || x === 17) ? 'd' : (x % 3 === 0) ? 'w' : 'y';
      g[6][x] = (x === 6 || x === 17) ? 'd' : 'o';
    }

    // 2. Crimson Shield Body (rows 7..20, cols 3..20)
    // Row 7
    g[7][4] = 'k'; g[7][5] = 'h';
    for (let x = 6; x <= 17; x++) g[7][x] = 'h';
    g[7][18] = 'h'; g[7][19] = 'k';

    // Row 8: Upper shield
    g[8][3] = 'k'; g[8][4] = 'l';
    for (let x = 5; x <= 18; x++) g[8][x] = 'l';
    g[8][19] = 's'; g[8][20] = 'k';

    // Rows 9..14: Inset Gold Banner with "MASTERPIECE"
    // Banner top border (row 9)
    g[9][3] = 'k'; g[9][4] = 'd';
    for (let x = 5; x <= 18; x++) g[9][x] = 'y';
    g[9][19] = 'd'; g[9][20] = 'k';

    // Banner cloth rows (10..13)
    for (let y = 10; y <= 13; y++) {
      g[y][3] = 'k'; g[y][4] = 'd';
      for (let x = 5; x <= 18; x++) {
        g[y][x] = (y === 10) ? 'l' : (y === 13) ? 's' : 'b';
      }
      g[y][19] = 'd'; g[y][20] = 'k';
    }

    // Lettering: "MASTERPIECE" in gold across x: 5..18, y: 11..12
    g[11][5] = 'w'; g[11][6] = 'y'; g[11][7] = 'w'; g[11][8] = 'y';
    g[11][9] = 'w'; g[11][10] = 'y'; g[11][11] = 'w'; g[11][12] = 'y';
    g[11][13] = 'w'; g[11][14] = 'y'; g[11][15] = 'w'; g[11][16] = 'y';
    g[11][17] = 'w'; g[11][18] = 'y';

    g[12][5] = 'o'; g[12][6] = 'd'; g[12][7] = 'o'; g[12][8] = 'd';
    g[12][9] = 'o'; g[12][10] = 'd'; g[12][11] = 'o'; g[12][12] = 'd';
    g[12][13] = 'o'; g[12][14] = 'd'; g[12][15] = 'o'; g[12][16] = 'd';
    g[12][17] = 'o'; g[12][18] = 'd';

    // Banner bottom border (row 14)
    g[14][3] = 'k'; g[14][4] = 'd';
    for (let x = 5; x <= 18; x++) g[14][x] = 'o';
    g[14][19] = 'd'; g[14][20] = 'k';

    // Rows 15..20: Lower Tapering Shield
    // Row 15
    g[15][4] = 'k';
    for (let x = 5; x <= 18; x++) g[15][x] = 'b';
    g[15][19] = 'k';

    // Row 16
    g[16][5] = 'k';
    for (let x = 6; x <= 17; x++) g[16][x] = 'b';
    g[16][18] = 'k';

    // Row 17
    g[17][6] = 'k';
    for (let x = 7; x <= 16; x++) g[17][x] = 's';
    g[17][17] = 'k';

    // Row 18
    g[18][8] = 'k';
    for (let x = 9; x <= 14; x++) g[18][x] = 's';
    g[18][15] = 'k';

    // Row 19: Point
    g[19][10] = 'k'; g[19][11] = 's'; g[19][12] = 's'; g[19][13] = 'k';
    // Row 20: Tip
    g[20][11] = 'k'; g[20][12] = 'k';

    // 3. Starburst Twinkles & Ribbon Tails Flutter
    if (frameIdx === 0) {
      // Starburst 2 large cross at [19, 4]
      g[4][19] = 'w';
      g[4][18] = 'g'; g[4][20] = 'g';
      g[3][19] = 'g'; g[5][19] = 'g';
      // Starburst 1 small dot at [4, 4]
      g[4][4] = 'w';
    } else if (frameIdx === 1) {
      // Starburst 1 large cross at [4, 4]
      g[4][4] = 'w';
      g[4][3] = 'g'; g[4][5] = 'g';
      g[3][4] = 'g'; g[5][4] = 'g';
      // Starburst 2 small dot at [19, 4]
      g[4][19] = 'w';
      // Left tail dips 1px
      g[21][9] = 'k'; g[21][10] = 'k';
    } else if (frameIdx === 2) {
      // Crown center gem glint
      g[2][11] = 'w'; g[2][12] = 'w';
      // Starburst 1 diamond
      g[4][4] = 'w'; g[4][3] = 'g'; g[4][5] = 'g';
      // Right tail dips 1px
      g[21][13] = 'k'; g[21][14] = 'k';
    } else if (frameIdx === 3) {
      // Starburst 2 budding
      g[4][19] = 'g';
      g[3][19] = 'g';
    }

    return g;
  }

  function buildFrames() {
    const frames = [];
    for (let f = 0; f < 4; f++) {
      const g = buildCrestFrame(f);
      frames.push({ rows: g.map(r => r.join('')) });
    }
    return frames;
  }

  const asset = {
    id: 'stamp_masterpiece',
    category: 'titles',
    size: [24, 24],
    fps: 8,
    loop: true,
    notes: 'Crimson heraldic crest stamp "MASTERPIECE" with gold coronet and starburst twinkle',
    palette: P,
    sparkles: sparkleCoords,
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || {}).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
