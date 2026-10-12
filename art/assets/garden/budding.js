(function (root) {
  // 8-frame handcrafted animated pixel art: budding
  // Terracotta pot with bamboo stake; coiling alphabet vine sways in the breeze
  // with a 1-frame lag at the tip while the golden calyx bud swells by 1 px.

  // Palette (16 distinct colors <= 16):
  // Terracotta pot:
  // 't' : #ffe6cc (rim highlight)
  // 'h' : #dca06a (pot light)
  // 'b' : #a86834 (pot base)
  // 's' : #6e3c16 (pot shadow)
  // 'd' : #3e1e08 (pot outline / bamboo node)
  // Soil / Loam:
  // 'o' : #86592e (crumb light)
  // 'u' : #563418 (loam base)
  // 'v' : #381e0c (loam shadow)
  // 'z' : #1e0e04 (deep crevice / ground shadow)
  // Bamboo stake:
  // 'j' : #eed0a4 (bamboo highlight)
  // 'i' : #c08a4a (bamboo base)
  // Vine & Calyx:
  // 'g' : #a8ec76 (leaf highlight)
  // 'l' : #74c648 (leaf light)
  // 'm' : #2f8a35 (leaf shadow)
  // 'k' : #0c3012 (leaf outline)
  // Calyx Golden Core:
  // 'y' : #ffd23a (gold bud glow)

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
    'j': '#eed0a4',
    'i': '#c08a4a',
    'g': '#a8ec76',
    'l': '#74c648',
    'm': '#2f8a35',
    'k': '#0c3012',
    'y': '#ffd23a'
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

  // Overlays per frame (rows 4..18)
  // Bamboo stake is at x = 11..12, y = 5..18 with nodes at 9, 14.
  // Vine coils around stake, mid-stem sways, tip sways with 1-frame lag.
  // Calyx pod at top swells by 1 px on frames 2..5.
  const overlays = [
    // Frame 0: Neutral rest position (calyx 4x4, tip dx=0, mid dx=0)
    [
      { y: 5,  x: 11, str: 'ji' },
      { y: 6,  x: 11, str: 'ji...kggk' },
      { y: 7,  x: 11, str: 'ji..kgyylk' },
      { y: 8,  x: 11, str: 'ji..kgyylk' },
      { y: 9,  x: 11, str: 'dd...kmmk' }, // bamboo node
      { y: 10, x: 11, str: 'ji...kmk' },
      { y: 11, x: 10, str: 'kllkji.kmk' },
      { y: 12, x: 9,  str: 'kglmkji.kmk' },
      { y: 13, x: 9,  str: '.kkk.klllmk' },
      { y: 14, x: 11, str: 'ddkglmk' }, // bamboo node
      { y: 15, x: 11, str: 'kllmk.kmk' },
      { y: 16, x: 11, str: 'jimk.kglmk' },
      { y: 17, x: 11, str: 'ji..kglmk' },
      { y: 18, x: 11, str: 'ji..kmmmk' }
    ],
    // Frame 1: Mid-stem sways right (+1), tip still at dx=0 (calyx normal)
    [
      { y: 5,  x: 11, str: 'ji' },
      { y: 6,  x: 11, str: 'ji...kggk' },
      { y: 7,  x: 11, str: 'ji..kgyylk' },
      { y: 8,  x: 11, str: 'ji..kgyylk' },
      { y: 9,  x: 11, str: 'dd...kmmk' },
      { y: 10, x: 11, str: 'ji....kmk' },
      { y: 11, x: 10, str: 'kllkji..kmk' },
      { y: 12, x: 10, str: 'kglmkji.kmk' },
      { y: 13, x: 10, str: '.kkk.klllmk' },
      { y: 14, x: 11, str: 'dd.kglmk' },
      { y: 15, x: 11, str: '.kllmk.kmk' },
      { y: 16, x: 11, str: 'jimk..kglmk' },
      { y: 17, x: 11, str: 'ji..kglmk' },
      { y: 18, x: 11, str: 'ji..kmmmk' }
    ],
    // Frame 2: Mid-stem peak right (+1), tip follows right (+1) (calyx swells by 1 px!)
    [
      { y: 5,  x: 11, str: 'ji....kggk.' },
      { y: 6,  x: 11, str: 'ji...kggyglk' }, // swollen calyx
      { y: 7,  x: 11, str: 'ji...kgyyylk' },
      { y: 8,  x: 11, str: 'ji...kgyyylk' },
      { y: 9,  x: 11, str: 'dd...kmmmmlk' },
      { y: 10, x: 11, str: 'ji....kmmk.' },
      { y: 11, x: 10, str: 'kllkji..kmk' },
      { y: 12, x: 10, str: 'kglmkji.kmk' },
      { y: 13, x: 10, str: '.kkk.klllmk' },
      { y: 14, x: 11, str: 'dd.kglmk' },
      { y: 15, x: 11, str: '.kllmk.kmk' },
      { y: 16, x: 11, str: 'jimk..kglmk' },
      { y: 17, x: 11, str: 'ji..kglmk' },
      { y: 18, x: 11, str: 'ji..kmmmk' }
    ],
    // Frame 3: Mid-stem eases to 0, tip lags at right (+1) (calyx swollen)
    [
      { y: 5,  x: 11, str: 'ji....kggk.' },
      { y: 6,  x: 11, str: 'ji...kggyglk' },
      { y: 7,  x: 11, str: 'ji...kgyyylk' },
      { y: 8,  x: 11, str: 'ji...kgyyylk' },
      { y: 9,  x: 11, str: 'dd...kmmmmlk' },
      { y: 10, x: 11, str: 'ji....kmmk.' },
      { y: 11, x: 10, str: 'kllkji.kmk.' },
      { y: 12, x: 9,  str: 'kglmkji.kmk' },
      { y: 13, x: 9,  str: '.kkk.klllmk' },
      { y: 14, x: 11, str: 'ddkglmk' },
      { y: 15, x: 11, str: 'kllmk.kmk' },
      { y: 16, x: 11, str: 'jimk.kglmk' },
      { y: 17, x: 11, str: 'ji..kglmk' },
      { y: 18, x: 11, str: 'ji..kmmmk' }
    ],
    // Frame 4: Mid-stem sways left (-1), tip eases to 0 (calyx swollen)
    [
      { y: 5,  x: 11, str: 'ji...kggk.' },
      { y: 6,  x: 11, str: 'ji..kggyglk' },
      { y: 7,  x: 11, str: 'ji..kgyyylk' },
      { y: 8,  x: 11, str: 'ji..kgyyylk' },
      { y: 9,  x: 11, str: 'dd..kmmmmlk' },
      { y: 10, x: 11, str: 'ji...kmmk.' },
      { y: 11, x: 9,  str: 'kllkji.kmk' },
      { y: 12, x: 8,  str: 'kglmkji.kmk' },
      { y: 13, x: 8,  str: '.kkk.klllmk' },
      { y: 14, x: 11, str: 'ddkglmk' },
      { y: 15, x: 11, str: 'kllmk.kmk' },
      { y: 16, x: 11, str: 'jimk.kglmk' },
      { y: 17, x: 11, str: 'ji..kglmk' },
      { y: 18, x: 11, str: 'ji..kmmmk' }
    ],
    // Frame 5: Mid-stem peak left (-1), tip follows left (-1) (calyx relaxes to normal)
    [
      { y: 5,  x: 11, str: 'ji' },
      { y: 6,  x: 11, str: 'ji..kggk' },
      { y: 7,  x: 11, str: 'ji.kgyylk' },
      { y: 8,  x: 11, str: 'ji.kgyylk' },
      { y: 9,  x: 11, str: 'dd..kmmk' },
      { y: 10, x: 11, str: 'ji..kmk' },
      { y: 11, x: 9,  str: 'kllkji.kmk' },
      { y: 12, x: 8,  str: 'kglmkji.kmk' },
      { y: 13, x: 8,  str: '.kkk.klllmk' },
      { y: 14, x: 11, str: 'ddkglmk' },
      { y: 15, x: 11, str: 'kllmk.kmk' },
      { y: 16, x: 11, str: 'jimk.kglmk' },
      { y: 17, x: 11, str: 'ji..kglmk' },
      { y: 18, x: 11, str: 'ji..kmmmk' }
    ],
    // Frame 6: Mid-stem eases to 0, tip lags at left (-1) (calyx normal)
    [
      { y: 5,  x: 11, str: 'ji' },
      { y: 6,  x: 11, str: 'ji..kggk' },
      { y: 7,  x: 11, str: 'ji.kgyylk' },
      { y: 8,  x: 11, str: 'ji.kgyylk' },
      { y: 9,  x: 11, str: 'dd..kmmk' },
      { y: 10, x: 11, str: 'ji..kmk' },
      { y: 11, x: 10, str: 'kllkji.kmk' },
      { y: 12, x: 9,  str: 'kglmkji.kmk' },
      { y: 13, x: 9,  str: '.kkk.klllmk' },
      { y: 14, x: 11, str: 'ddkglmk' },
      { y: 15, x: 11, str: 'kllmk.kmk' },
      { y: 16, x: 11, str: 'jimk.kglmk' },
      { y: 17, x: 11, str: 'ji..kglmk' },
      { y: 18, x: 11, str: 'ji..kmmmk' }
    ],
    // Frame 7: Mid-stem at 0, tip eases back to 0 (calyx normal)
    [
      { y: 5,  x: 11, str: 'ji' },
      { y: 6,  x: 11, str: 'ji...kggk' },
      { y: 7,  x: 11, str: 'ji..kgyylk' },
      { y: 8,  x: 11, str: 'ji..kgyylk' },
      { y: 9,  x: 11, str: 'dd...kmmk' },
      { y: 10, x: 11, str: 'ji...kmk' },
      { y: 11, x: 10, str: 'kllkji.kmk' },
      { y: 12, x: 9,  str: 'kglmkji.kmk' },
      { y: 13, x: 9,  str: '.kkk.klllmk' },
      { y: 14, x: 11, str: 'ddkglmk' },
      { y: 15, x: 11, str: 'kllmk.kmk' },
      { y: 16, x: 11, str: 'jimk.kglmk' },
      { y: 17, x: 11, str: 'ji..kglmk' },
      { y: 18, x: 11, str: 'ji..kmmmk' }
    ]
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
      frames.push({ rows: grid.map(r => r.join('')) });
    }
    return frames;
  }

  const asset = {
    id: 'budding',
    category: 'garden',
    size: [32, 32],
    fps: 8,
    loop: true,
    staticFrame: 2,
    notes: 'Terracotta pot with bamboo stake; living vine sways with 1-frame tip lag while the golden calyx bud swells',
    palette,
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
