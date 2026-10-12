(function (root) {
  // 8-frame authored sequence for double_hammer (32x32)
  // Two vintage typewriter typebar hammers striking alternately:
  // Hammer 1 strikes on frames 0-3 (impact & spark at frame 1)
  // Hammer 2 strikes on frames 4-7 (impact & spark at frame 5)
  // Tension return springs coil and stretch dynamically.

  // Sparks at impact:
  // f=1: H1 impact spark around (15, 5)
  // f=5: H2 impact spark around (16, 5)
  const sparks = {
    1: [
      [15, 3, 'p'], [16, 3, 'g'],
      [14, 4, 'g'], [15, 4, 'p'], [16, 4, 'p'], [17, 4, 'b'],
      [15, 5, 'p'], [16, 5, 'y'],
      [13, 2, 'b'], [18, 2, 'y']
    ],
    5: [
      [16, 3, 'p'], [15, 3, 'g'],
      [15, 4, 'b'], [16, 4, 'p'], [17, 4, 'p'], [18, 4, 'g'],
      [16, 5, 'p'], [15, 5, 'y'],
      [14, 2, 'y'], [19, 2, 'b']
    ]
  };

  // Sparkles array to exempt spark particles from orphan check
  const sparkles = [
    [15, 3], [16, 3], [14, 4], [15, 4], [16, 4], [17, 4], [15, 5], [16, 5], [13, 2], [18, 2],
    [16, 3], [15, 3], [15, 4], [16, 4], [17, 4], [18, 4], [16, 5], [15, 5], [14, 2], [19, 2],
    [14, 3], [17, 3], [13, 4], [18, 3]
  ];

  // Base segment comb / mounting bracket at bottom (fixed across frames)
  // Rows: [y, leftPad, str]
  const baseSegment = [
    [24, 7,  'kcccccccccccccccck'],
    [25, 6,  'kcttttttttttttttttck'],
    [26, 5,  'kcttk' + 'mm' + 'kttttttttk' + 'mm' + 'kttck'],
    [27, 5,  'kcttk' + 'dd' + 'kttttttttk' + 'dd' + 'kttck'],
    [28, 6,  'kkkkkkkkkkkkkkkkkkkk']
  ];

  // Continuous line drawing for typebar rods
  function drawBar(grid, x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0, y = y0;
    while (true) {
      if (x >= 0 && x < 32 && y >= 0 && y < 32) {
        grid[y][x] = 'm';
        if (x + 1 < 32 && grid[y][x + 1] === '.') {
          grid[y][x + 1] = 's';
        }
      }
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
  }

  // Draw 4x4 steel slug block:
  function drawSlug(grid, sx, sy) {
    const slugRows = [
      'kppk',
      'kwwsk',
      'kmmtk',
      'kkkk'
    ];
    for (let r = 0; r < slugRows.length; r++) {
      const row = slugRows[r];
      const y = sy + r;
      if (y < 0 || y >= 32) continue;
      for (let c = 0; c < row.length; c++) {
        const x = sx + c;
        if (x >= 0 && x < 32) {
          grid[y][x] = row[c];
        }
      }
    }
  }

  // Draw coiled return spring (connected pixels, no orphan gaps)
  function drawSpring(grid, x, state) {
    if (state === 'stretched') {
      // Extended tension spring: coils stretch from y=16 down to y=23
      for (let y = 16; y <= 23; y++) {
        const xOffset = (y % 2 === 0) ? 0 : 1;
        grid[y][x + xOffset] = (y % 2 === 0) ? 'b' : 'y';
        grid[y][x + xOffset + 1] = 'o';
      }
    } else if (state === 'rebound') {
      // Rebound coils
      for (let y = 18; y <= 23; y++) {
        const xOffset = (y % 2 === 0) ? 0 : 1;
        grid[y][x + xOffset] = (y % 2 === 0) ? 'b' : 'y';
        grid[y][x + xOffset + 1] = 'o';
      }
    } else {
      // Coiled tight at rest (y=20 to y=23)
      for (let y = 20; y <= 23; y++) {
        const xOffset = (y % 2 === 0) ? 0 : 1;
        grid[y][x + xOffset] = 'y';
        grid[y][x + xOffset + 1] = 'b';
        grid[y][x + xOffset + 2] = 'o';
      }
    }
  }

  // Hammer 1 states per frame (0..7):
  // { slug: [x, y], armTip: [x, y], spring: 'rest'|'stretched'|'rebound' }
  const h1States = [
    { slug: [9, 7],   armTip: [11, 10], spring: 'stretched' }, // 0: swing forward
    { slug: [13, 5],  armTip: [15, 8],  spring: 'stretched' }, // 1: IMPACT
    { slug: [10, 8],  armTip: [12, 11], spring: 'rebound' },   // 2: rebound
    { slug: [6, 12],  armTip: [8, 15],  spring: 'rest' },      // 3: rest
    { slug: [6, 12],  armTip: [8, 15],  spring: 'rest' },      // 4: rest
    { slug: [6, 12],  armTip: [8, 15],  spring: 'rest' },      // 5: rest
    { slug: [6, 12],  armTip: [8, 15],  spring: 'rest' },      // 6: rest
    { slug: [6, 12],  armTip: [8, 15],  spring: 'rest' }       // 7: rest
  ];

  // Hammer 2 states per frame (0..7):
  const h2States = [
    { slug: [21, 12], armTip: [23, 15], spring: 'rest' },      // 0: rest
    { slug: [21, 12], armTip: [23, 15], spring: 'rest' },      // 1: rest
    { slug: [21, 12], armTip: [23, 15], spring: 'rest' },      // 2: rest
    { slug: [21, 12], armTip: [23, 15], spring: 'rest' },      // 3: rest
    { slug: [18, 7],  armTip: [20, 10], spring: 'stretched' }, // 4: swing forward
    { slug: [15, 5],  armTip: [17, 8],  spring: 'stretched' }, // 5: IMPACT
    { slug: [18, 8],  armTip: [20, 11], spring: 'rebound' },   // 6: rebound
    { slug: [21, 12], armTip: [23, 15], spring: 'rest' }       // 7: rest
  ];

  function buildFrames() {
    const frames = [];

    for (let f = 0; f < 8; f++) {
      const grid = Array.from({ length: 32 }, () => Array(32).fill('.'));

      // 1. Base segment casting
      baseSegment.forEach(([y, leftPad, rowStr]) => {
        for (let c = 0; c < rowStr.length; c++) {
          grid[y][leftPad + c] = rowStr[c];
        }
      });

      // 2. Coiled return springs
      const h1 = h1States[f];
      const h2 = h2States[f];
      drawSpring(grid, 12, h1.spring);
      drawSpring(grid, 17, h2.spring);

      // 3. Hammer 1 typebar rod (from left pivot 10, 25 to armTip)
      drawBar(grid, 10, 25, h1.armTip[0], h1.armTip[1]);

      // 4. Hammer 2 typebar rod (from right pivot 21, 25 to armTip)
      drawBar(grid, 21, 25, h2.armTip[0], h2.armTip[1]);

      // 5. Hammer 1 slug
      drawSlug(grid, h1.slug[0], h1.slug[1]);

      // 6. Hammer 2 slug
      drawSlug(grid, h2.slug[0], h2.slug[1]);

      // 7. Spark at impact
      if (sparks[f]) {
        sparks[f].forEach(([sx, sy, col]) => {
          if (sx >= 0 && sx < 32 && sy >= 0 && sy < 32) {
            grid[sy][sx] = col;
          }
        });
      }

      frames.push({ rows: grid.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'double_hammer',
    category: 'shop',
    size: [32, 32],
    fps: 10,
    loop: true,
    staticFrame: 0,
    notes: 'Tandem typewriter typebar hammers striking alternately with impact sparks and coiling return tension springs',
    palette: {
      '.': null,
      'p': '#ffffff', // spark bright white / specular steel glint
      'w': '#d8d8e4', // steel light highlight (metal light)
      'm': '#a4a4b4', // steel body (metal mid)
      's': '#626274', // steel shadow (metal shadow)
      'k': '#141828', // deep metal outline (storm deep)
      'g': '#fffbe0', // spark outer glow (gold highlight)
      'y': '#fff08c', // spring light brass (gold light)
      'b': '#ffd23a', // spring brass base (gold base)
      'o': '#b38004', // spring shadow (gold shadow)
      'd': '#4a2e04', // spring deep shadow (gold deep)
      'c': '#454f6e', // segment casting base (storm base)
      't': '#28304a'  // segment casting shadow (storm shadow)
    },
    sparkles: sparkles,
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
