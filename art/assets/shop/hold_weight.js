(function (root) {
  // 12-frame authored sequence for hold_weight (32x32)
  // Heavy cast-iron 5KG scale weight with polished brass ring.
  // 12-frame loop: anticipate lift, heavy impact THUD (1 px squash), dust puff, and settle.

  // Pre-drawn dust puff particles per frame (x, y, colorKey)
  const dustByFrame = {
    5: [
      [3, 27, 'p'], [4, 27, 'q'], [4, 28, 'p'],
      [27, 27, 'p'], [28, 27, 'q'], [27, 28, 'p']
    ],
    6: [
      [2, 26, 'p'], [3, 26, 'q'], [2, 27, 'q'], [3, 27, 'p'], [4, 28, 'q'],
      [27, 28, 'q'], [28, 27, 'p'], [29, 27, 'q'], [28, 26, 'q'], [29, 26, 'p']
    ],
    7: [
      [1, 25, 'p'], [2, 25, 'q'], [2, 26, 'p'],
      [29, 25, 'q'], [30, 25, 'p'], [29, 26, 'p']
    ],
    8: [
      [1, 24, 'q'], [2, 24, 'p'],
      [30, 24, 'p'], [31, 24, 'q']
    ]
  };

  // Sparkles array to exempt dust particles from orphan check
  const sparkles = [
    [1, 24], [2, 24], [30, 24], [31, 24],
    [1, 25], [2, 25], [2, 26], [29, 25], [30, 25], [29, 26],
    [2, 26], [3, 26], [2, 27], [3, 27], [4, 28],
    [27, 28], [28, 27], [29, 27], [28, 26], [29, 26],
    [3, 27], [4, 27], [4, 28], [27, 27], [28, 27]
  ];

  // 12-frame animation states with dynamic easing, ring sway, and sheen travel
  const animStates = [
    { dy: 0, squash: false, ringDy: 0, ringDx: 0, glint: 0 },  // 0: rest
    { dy: 0, squash: false, ringDy: 0, ringDx: 1, glint: 1 },  // 1: anticipate shift
    { dy: -1, squash: false, ringDy: -1, ringDx: 1, glint: 1 }, // 2: lift start
    { dy: -2, squash: false, ringDy: -2, ringDx: 0, glint: 2 }, // 3: lift apex
    { dy: -1, squash: false, ringDy: -2, ringDx: -1, glint: 1 },// 4: fall
    { dy: 0, squash: true, ringDy: 1, ringDx: 0, glint: 0 },   // 5: IMPACT + SQUASH
    { dy: 0, squash: false, ringDy: 0, ringDx: 1, glint: 0 },  // 6: rebound + dust
    { dy: -1, squash: false, ringDy: -1, ringDx: 1, glint: 1 }, // 7: secondary apex
    { dy: -1, squash: false, ringDy: 0, ringDx: 0, glint: 1 },  // 8: secondary hold
    { dy: 0, squash: false, ringDy: 0, ringDx: -1, glint: 0 }, // 9: settle down
    { dy: 0, squash: false, ringDy: 0, ringDx: 0, glint: 1 },  // 10: ring settle
    { dy: 0, squash: false, ringDy: 0, ringDx: 0, glint: 0 }   // 11: rest (loops to 0)
  ];

  // Brass ring rows (relY from ringTop = 5)
  const ringRows = [
    [0, 13, 'gggggg'],
    [1, 11, 'gwwyybbogg'],
    [2, 10, 'gwwi....ogg'],
    [3, 10, 'gyyy....ogg'],
    [4, 10, 'gbbb....ogk'],
    [5, 10, 'gooo....ogk'],
    [6, 11, 'ggoooggggk'],
    [7, 13, 'gkkkkk']
  ];

  // Normal weight body rows (relY from bodyTop = 13)
  const normalBodyRows = [
    // bracket
    [0, 13, 'kkkkkk'],
    [1, 13, 'kmssmk'],
    // shoulder
    [2, 8, 'kkkkkkkkkkkkkkkk'],
    [3, 7, 'klliiimmmssssstk'],
    [4, 6, 'klliimmmssssssttk'],
    // main body
    [5, 5, 'klliimmmsssssssssttk'],
    [6, 5, 'kllimmmssssssssssttk'],
    // "5KG" engraved rows
    [7, 5, 'kllim' + 'lll' + 's' + 'ltl' + 's' + 'lll' + 'sssttk'],
    [8, 5, 'kllim' + 'ltt' + 's' + 'llt' + 's' + 'ltt' + 'sssttk'],
    [9, 5, 'kllim' + 'lll' + 's' + 'llt' + 's' + 'ltl' + 'sssttk'],
    [10, 5, 'kllim' + 'ttl' + 's' + 'llt' + 's' + 'ltl' + 'sssttk'],
    [11, 5, 'kllim' + 'lll' + 's' + 'ltl' + 's' + 'lll' + 'sssttk'],
    // base
    [12, 5, 'klliimmmsssssssssttk'],
    [13, 5, 'kllmmmmssssssssssttk'],
    [14, 5, 'kkkkkkkkkkkkkkkkkkkk']
  ];

  // Squashed weight body rows (relY from bodyTop = 14: 1 px shorter, 2 px wider)
  const squashedBodyRows = [
    // bracket
    [0, 13, 'kkkkkk'],
    [1, 13, 'kmssmk'],
    // shoulder
    [2, 8, 'kkkkkkkkkkkkkkkk'],
    [3, 6, 'klliiimmmmsssssstk'],
    [4, 5, 'klliimmmssssssssttk'],
    // main body (expanded by 1 px left and right)
    [5, 4, 'kllliimmmsssssssssstttk'],
    [6, 4, 'klllimmmssssssssssstttk'],
    // "5KG" squashed rows
    [7, 4, 'klllim' + 'lll' + 's' + 'ltl' + 's' + 'lll' + 'sssstttk'],
    [8, 4, 'klllim' + 'ltt' + 's' + 'llt' + 's' + 'ltt' + 'sssstttk'],
    [9, 4, 'klllim' + 'lll' + 's' + 'llt' + 's' + 'ltl' + 'sssstttk'],
    [10, 4, 'klllim' + 'ttl' + 's' + 'llt' + 's' + 'ltl' + 'sssstttk'],
    [11, 4, 'klllim' + 'lll' + 's' + 'ltl' + 's' + 'lll' + 'sssstttk'],
    // base
    [12, 4, 'kllliimmmsssssssssstttk'],
    [13, 4, 'kkkkkkkkkkkkkkkkkkkkkk']
  ];

  function buildFrames() {
    const frames = [];

    for (let f = 0; f < 12; f++) {
      const grid = Array.from({ length: 32 }, () => Array(32).fill('.'));
      const st = animStates[f];

      // Draw brass ring
      const ry0 = 5 + st.dy + st.ringDy;
      const rx0 = st.ringDx || 0;
      ringRows.forEach(([relY, leftPad, rowStr]) => {
        const y = ry0 + relY;
        if (y < 0 || y >= 32) return;
        for (let c = 0; c < rowStr.length; c++) {
          const ch = rowStr[c];
          if (ch !== '.') {
            grid[y][leftPad + rx0 + c] = ch;
          }
        }
      });

      // Draw body
      const by0 = 13 + st.dy + (st.squash ? 1 : 0);
      const bRows = st.squash ? squashedBodyRows : normalBodyRows;
      bRows.forEach(([relY, leftPad, rowStr]) => {
        const y = by0 + relY;
        if (y < 0 || y >= 32) return;
        for (let c = 0; c < rowStr.length; c++) {
          grid[y][leftPad + c] = rowStr[c];
        }
      });

      // Traveling metallic glint on shoulder bevel
      if (!st.squash) {
        const gy = by0 + 3;
        if (gy >= 0 && gy < 32) {
          if (st.glint === 1) {
            grid[gy][10] = 'i';
            grid[gy][11] = 'i';
          } else if (st.glint === 2) {
            grid[gy][13] = 'i';
            grid[gy][14] = 'i';
          }
        }
      }

      // Draw dust puff particles if present
      if (dustByFrame[f]) {
        dustByFrame[f].forEach(([x, y, col]) => {
          if (x >= 0 && x < 32 && y >= 0 && y < 32) {
            grid[y][x] = col;
          }
        });
      }

      frames.push({ rows: grid.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'hold_weight',
    category: 'shop',
    size: [32, 32],
    fps: 10,
    loop: true,
    staticFrame: 0,
    notes: 'Heavy cast-iron 5KG foundry scale weight with polished brass eyelet ring, 12-frame bounce-settle, and impact dust puff',
    palette: {
      '.': null,
      'w': '#fffbe0', // brass highlight (gold highlight)
      'y': '#fff08c', // brass light (gold light)
      'b': '#ffd23a', // brass base (gold base)
      'o': '#b38004', // brass shadow (gold shadow)
      'g': '#4a2e04', // brass outline (gold deep)
      'i': '#ffffff', // iron specular glint (metal highlight)
      'l': '#9aa8c8', // iron highlight (storm highlight)
      'm': '#6a7796', // iron light (storm light)
      's': '#454f6e', // iron body base (storm base)
      't': '#28304a', // iron body shadow / engraving (storm shadow)
      'k': '#141828', // iron body outline (storm deep)
      'p': '#d2e2f0', // dust puff light (cloud base)
      'q': '#a4bcd4'  // dust puff shadow (cloud shadow)
    },
    sparkles: sparkles,
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
