(function (root) {
  // 8-frame handcrafted animated pixel art: blooming
  // Terracotta pot with mature letter bloom; petals pulse in an out-of-phase
  // 2-ring pattern, golden pollen motes sparkle, and center disc holds
  // the handcrafted golden letter glyph 'E'.

  // Palette (16 distinct colors <= 16):
  // Terracotta pot:
  // 't' : #ffe6cc (rim highlight)
  // 'h' : #dca06a (pot light)
  // 'b' : #a86834 (pot base)
  // 's' : #6e3c16 (pot shadow)
  // 'd' : #3e1e08 (pot outline)
  // Soil / Loam:
  // 'o' : #86592e (crumb light)
  // 'u' : #563418 (loam base)
  // 'v' : #381e0c (loam shadow)
  // 'z' : #1e0e04 (deep crevice / ground shadow)
  // Stem & Leaves:
  // 'g' : #a8ec76 (leaf highlight)
  // 'l' : #74c648 (leaf light)
  // 'm' : #2f8a35 (leaf shadow)
  // 'k' : #0c3012 (leaf outline)
  // Flower Bloom & Glyph 'E':
  // 'y' : #ffd23a (gold petal & glyph base)
  // 'q' : #fffbe0 (petal highlight / pollen glint)
  // 'r' : #781c16 (velvet core disc background)

  const palette = {
    '.': null,
    't': '#ffe6cc',
    'h': '#dca06a',
    'b': '#a86834',
    's': '#6e3c16',
    'd': '#3e1e08',
    'o': '#86592e',
    'u': '#563418',
    'v': '#381e0c',
    'z': '#1e0e04',
    'g': '#a8ec76',
    'l': '#74c648',
    'm': '#2f8a35',
    'k': '#0c3012',
    'y': '#ffd23a',
    'q': '#fffbe0',
    'r': '#781c16'
  };

  const basePot = [
    '................................', // 0
    '................................', // 1
    '................................', // 2
    '................................', // 3
    '................................', // 4
    '................................', // 5
    '................................', // 6
    '................................', // 7
    '................................', // 8
    '................................', // 9
    '................................', // 10
    '................................', // 11
    '................................', // 12
    '................................', // 13
    '................................', // 14
    '................................', // 15
    '................................', // 16
    '..........zzzzzzzzzzzz..........', // 17
    '........zzuuoouuvvvuuuzz........', // 18
    '......ddhhttbbbsssssssssdd......', // 19
    '......dthhbbbbbbsssssssssd......', // 20
    '.......dhhbbbbbbssssssssd.......', // 21
    '.......dhhbbbbbbssssssssd.......', // 22
    '........dhbbbbbbsssssssd........', // 23
    '........dhbbbbbbsssssssd........', // 24
    '.........dhbbbbbssssssd.........', // 25
    '.........dhbbbbbssssssd.........', // 26
    '..........dhbbbbsssssd..........', // 27
    '..........dhbbbbsssssd..........', // 28
    '..........dddddddddddd..........', // 29
    '.........zzzzzzzzzzzzzz.........', // 30
    '................................'  // 31
  ];

  // Overlays for 8 frames:
  // Flower center is at (16, 8).
  // The center disc (rows 6..10, cols 13..19) holds crimson background 'r' and golden glyph 'E'.
  // Glyph 'E':
  // row 6: 'qyyyy'
  // row 7: 'yy...'
  // row 8: 'qyyy.'
  // row 9: 'yy...'
  // row 10: 'qyyyy'
  // Outer petals pulse wide on frames 0..3, inner ring contracts.
  // Inner ring pulses wide on frames 4..7, outer ring eases in.
  // Pollen sparkles drift upward.

  const overlays = [
    // Frame 0: Outer ring wide expand, inner ring compact, pollen rising
    [
      { y: 2,  x: 13, str: '..ddqydd..' },
      { y: 3,  x: 10, str: '.ddqqyydd.' },
      { y: 4,  x: 9,  str: 'ddqqyyyqqdd' },
      { y: 5,  x: 8,  str: 'dqqyrrrrrryqd' },
      { y: 6,  x: 7,  str: 'dqyyrqyyyyrryqd' },
      { y: 7,  x: 7,  str: 'dyyyrqy..rryyyd' },
      { y: 8,  x: 7,  str: 'dyyyrqyyyrryyyd' },
      { y: 9,  x: 7,  str: 'dyyyrqy..rryyyd' },
      { y: 10, x: 7,  str: 'dqyyrqyyyyrryqd' },
      { y: 11, x: 8,  str: 'dssyrrrrrrysd' },
      { y: 12, x: 9,  str: 'ddssyyyssdd' },
      { y: 13, x: 10, str: '.ddssdd.' },
      { y: 14, x: 7,  str: '.kkk...kglmk...kkk.' }, // foliage leaves
      { y: 15, x: 6,  str: 'kglmk..kglmk..kglmk' },
      { y: 16, x: 6,  str: 'kllmk..kglmk..kmlmk' },
      { y: 17, x: 7,  str: '.kk....kglmk....kk.' },
      { y: 18, x: 14, str: 'kmmmk' }
    ],
    // Frame 1: Outer ring hold wide, inner ring expands 1 px, pollen mote at (23, 3)
    [
      { y: 2,  x: 13, str: '..ddqydd..' },
      { y: 3,  x: 10, str: '.ddqqyydd.' },
      { y: 4,  x: 9,  str: 'ddqqyyyqqdd' },
      { y: 5,  x: 8,  str: 'dqqyrrrrrryqd' },
      { y: 6,  x: 7,  str: 'dqyyrqyyyyrryqd' },
      { y: 7,  x: 7,  str: 'dyyyrqy..rryyyd' },
      { y: 8,  x: 7,  str: 'dyyyrqyyyrryyyd' },
      { y: 9,  x: 7,  str: 'dyyyrqy..rryyyd' },
      { y: 10, x: 7,  str: 'dqyyrqyyyyrryqd' },
      { y: 11, x: 8,  str: 'dssyrrrrrrysd' },
      { y: 12, x: 9,  str: 'ddssyyyssdd' },
      { y: 13, x: 10, str: '.ddssdd.' },
      { y: 14, x: 7,  str: '.kkk...kglmk...kkk.' },
      { y: 15, x: 6,  str: 'kglmk..kglmk..kglmk' },
      { y: 16, x: 6,  str: 'kllmk..kglmk..kmlmk' },
      { y: 17, x: 7,  str: '.kk....kglmk....kk.' },
      { y: 18, x: 14, str: 'kmmmk' }
    ],
    // Frame 2: Outer petals reach peak flare, glint sweeps across top petals
    [
      { y: 1,  x: 14, str: '.qq.' },
      { y: 2,  x: 12, str: '..ddqqydd..' },
      { y: 3,  x: 9,  str: '..ddqqyydd..' },
      { y: 4,  x: 8,  str: 'ddqqyyyyqqdd' },
      { y: 5,  x: 7,  str: 'dqqyrrrrrryyqd' },
      { y: 6,  x: 7,  str: 'dqyyrqyyyyrryqd' },
      { y: 7,  x: 7,  str: 'dyyyrqy..rryyyd' },
      { y: 8,  x: 7,  str: 'dyyyrqyyyrryyyd' },
      { y: 9,  x: 7,  str: 'dyyyrqy..rryyyd' },
      { y: 10, x: 7,  str: 'dqyyrqyyyyrryqd' },
      { y: 11, x: 7,  str: 'dssyrrrrrryssd' },
      { y: 12, x: 8,  str: 'ddssyyyyssdd' },
      { y: 13, x: 10, str: '..ddssdd..' },
      { y: 14, x: 7,  str: '.kkk...kglmk...kkk.' },
      { y: 15, x: 6,  str: 'kglmk..kglmk..kglmk' },
      { y: 16, x: 6,  str: 'kllmk..kglmk..kmlmk' },
      { y: 17, x: 7,  str: '.kk....kglmk....kk.' },
      { y: 18, x: 14, str: 'kmmmk' }
    ],
    // Frame 3: Outer petals ease slightly, pollen burst at (7, 4) and (25, 4)
    [
      { y: 2,  x: 13, str: '..ddqydd..' },
      { y: 3,  x: 10, str: '.ddqqyydd.' },
      { y: 4,  x: 9,  str: 'ddqqyyyqqdd' },
      { y: 5,  x: 8,  str: 'dqqyrrrrrryqd' },
      { y: 6,  x: 7,  str: 'dqyyrqyyyyrryqd' },
      { y: 7,  x: 7,  str: 'dyyyrqy..rryyyd' },
      { y: 8,  x: 7,  str: 'dyyyrqyyyrryyyd' },
      { y: 9,  x: 7,  str: 'dyyyrqy..rryyyd' },
      { y: 10, x: 7,  str: 'dqyyrqyyyyrryqd' },
      { y: 11, x: 8,  str: 'dssyrrrrrrysd' },
      { y: 12, x: 9,  str: 'ddssyyyssdd' },
      { y: 13, x: 10, str: '.ddssdd.' },
      { y: 14, x: 7,  str: '.kkk...kglmk...kkk.' },
      { y: 15, x: 6,  str: 'kglmk..kglmk..kglmk' },
      { y: 16, x: 6,  str: 'kllmk..kglmk..kmlmk' },
      { y: 17, x: 7,  str: '.kk....kglmk....kk.' },
      { y: 18, x: 14, str: 'kmmmk' }
    ],
    // Frame 4: Outer ring contracts 1 px, inner ring pulses outward with golden fluff
    [
      { y: 3,  x: 12, str: '.ddqydd.' },
      { y: 4,  x: 10, str: '.ddqqyydd.' },
      { y: 5,  x: 9,  str: 'dqqyrrrrrryqd' },
      { y: 6,  x: 8,  str: 'dqyyrqyyyyrryqd' },
      { y: 7,  x: 8,  str: 'dyyyrqy..rryyyd' },
      { y: 8,  x: 8,  str: 'dyyyrqyyyrryyyd' },
      { y: 9,  x: 8,  str: 'dyyyrqy..rryyyd' },
      { y: 10, x: 8,  str: 'dqyyrqyyyyrryqd' },
      { y: 11, x: 9,  str: 'dssyrrrrrrysd' },
      { y: 12, x: 10, str: '.ddssyydd.' },
      { y: 13, x: 12, str: '.ddssdd.' },
      { y: 14, x: 6,  str: '..kkk...kglmk...kkk..' }, // leaves lift slightly
      { y: 15, x: 6,  str: 'kglmk...kglmk...kglmk' },
      { y: 16, x: 7,  str: '.kkk....kglmk....kkk.' },
      { y: 17, x: 14, str: 'kglmk' },
      { y: 18, x: 14, str: 'kmmmk' }
    ],
    // Frame 5: Inner ring peak swell, pollen motes float high at (12, 1) and (20, 1)
    [
      { y: 3,  x: 12, str: '.ddqydd.' },
      { y: 4,  x: 10, str: '.ddqqyydd.' },
      { y: 5,  x: 9,  str: 'dqqyrrrrrryqd' },
      { y: 6,  x: 8,  str: 'dqyyrqyyyyrryqd' },
      { y: 7,  x: 8,  str: 'dyyyrqy..rryyyd' },
      { y: 8,  x: 8,  str: 'dyyyrqyyyrryyyd' },
      { y: 9,  x: 8,  str: 'dyyyrqy..rryyyd' },
      { y: 10, x: 8,  str: 'dqyyrqyyyyrryqd' },
      { y: 11, x: 9,  str: 'dssyrrrrrrysd' },
      { y: 12, x: 10, str: '.ddssyydd.' },
      { y: 13, x: 12, str: '.ddssdd.' },
      { y: 14, x: 6,  str: '..kkk...kglmk...kkk..' },
      { y: 15, x: 6,  str: 'kglmk...kglmk...kglmk' },
      { y: 16, x: 7,  str: '.kkk....kglmk....kkk.' },
      { y: 17, x: 14, str: 'kglmk' },
      { y: 18, x: 14, str: 'kmmmk' }
    ],
    // Frame 6: Inner ring eases down, outer ring prepares expansion
    [
      { y: 2,  x: 13, str: '..ddqydd..' },
      { y: 3,  x: 11, str: 'ddqqyydd' },
      { y: 4,  x: 9,  str: 'ddqqyyyqqdd' },
      { y: 5,  x: 8,  str: 'dqqyrrrrrryqd' },
      { y: 6,  x: 8,  str: 'dqyyrqyyyyrryqd' },
      { y: 7,  x: 8,  str: 'dyyyrqy..rryyyd' },
      { y: 8,  x: 8,  str: 'dyyyrqyyyrryyyd' },
      { y: 9,  x: 8,  str: 'dyyyrqy..rryyyd' },
      { y: 10, x: 8,  str: 'dqyyrqyyyyrryqd' },
      { y: 11, x: 8,  str: 'dssyrrrrrrysd' },
      { y: 12, x: 9,  str: 'ddssyyyssdd' },
      { y: 13, x: 11, str: 'ddssdd' },
      { y: 14, x: 7,  str: '.kkk...kglmk...kkk.' },
      { y: 15, x: 6,  str: 'kglmk..kglmk..kglmk' },
      { y: 16, x: 6,  str: 'kllmk..kglmk..kmlmk' },
      { y: 17, x: 7,  str: '.kk....kglmk....kk.' },
      { y: 18, x: 14, str: 'kmmmk' }
    ],
    // Frame 7: Transition back toward Frame 0, pollen glints drift off
    [
      { y: 2,  x: 13, str: '..ddqydd..' },
      { y: 3,  x: 10, str: '.ddqqyydd.' },
      { y: 4,  x: 9,  str: 'ddqqyyyqqdd' },
      { y: 5,  x: 8,  str: 'dqqyrrrrrryqd' },
      { y: 6,  x: 7,  str: 'dqyyrqyyyyrryqd' },
      { y: 7,  x: 7,  str: 'dyyyrqy..rryyyd' },
      { y: 8,  x: 7,  str: 'dyyyrqyyyrryyyd' },
      { y: 9,  x: 7,  str: 'dyyyrqy..rryyyd' },
      { y: 10, x: 7,  str: 'dqyyrqyyyyrryqd' },
      { y: 11, x: 8,  str: 'dssyrrrrrrysd' },
      { y: 12, x: 9,  str: 'ddssyyyssdd' },
      { y: 13, x: 10, str: '.ddssdd.' },
      { y: 14, x: 7,  str: '.kkk...kglmk...kkk.' },
      { y: 15, x: 6,  str: 'kglmk..kglmk..kglmk' },
      { y: 16, x: 6,  str: 'kllmk..kglmk..kmlmk' },
      { y: 17, x: 7,  str: '.kk....kglmk....kk.' },
      { y: 18, x: 14, str: 'kmmmk' }
    ]
  ];

  // Pollen sparkles definitions per frame: [x, y, char]
  const sparklesPerFrame = [
    [[11, 2, 'q'], [21, 2, 'y']],
    [[23, 3, 'q'], [9, 3, 'y']],
    [[6, 4, 'y'], [25, 4, 'q']],
    [[5, 3, 'q'], [26, 3, 'y']],
    [[12, 1, 'q'], [20, 1, 'y']],
    [[13, 0, 'q'], [19, 0, 'y']],
    [[15, 1, 'q'], [17, 1, 'y']],
    [[16, 2, 'q']]
  ];

  // Sparkles whitelist for orphan lint check
  const sparkles = [
    [11, 2], [21, 2], [23, 3], [9, 3], [6, 4], [25, 4], [5, 3], [26, 3],
    [12, 1], [20, 1], [13, 0], [19, 0], [15, 1], [17, 1], [16, 2],
    [14, 1], [15, 1]
  ];

  function buildFrames() {
    const frames = [];
    for (let f = 0; f < 8; f++) {
      const grid = basePot.map(row => row.split(''));
      const overlay = overlays[f];
      overlay.forEach(({ y, x, str }) => {
        for (let c = 0; c < str.length; c++) {
          const ch = str[c];
          if (ch !== '.') {
            grid[y][x + c] = ch;
          }
        }
      });

      // Overlay pollen sparkles
      const spList = sparklesPerFrame[f] || [];
      spList.forEach(([sx, sy, ch]) => {
        if (sy >= 0 && sy < 32 && sx >= 0 && sx < 32) {
          grid[sy][sx] = ch;
        }
      });

      frames.push({ rows: grid.map(r => r.join('')) });
    }
    return frames;
  }

  const asset = {
    id: 'blooming',
    category: 'garden',
    size: [32, 32],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Terracotta pot with golden harvest flower; petals pulse in a 2-ring pattern, pollen sparkles, and center core holds letter glyph E',
    palette,
    sparkles,
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
