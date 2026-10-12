(function (root) {
  // 8-frame handcrafted animated pixel art: sprout
  // Terracotta pot with rich dark loam; two cotyledon leaves unfurl and relax
  // with elastic breathing ease while a glistening dewdrop rolls, drops, and splashes.

  // Palette (15 distinct colors <= 16):
  // Terracotta pot:
  // 't' : #ffe6cc (rim highlight)
  // 'h' : #dca06a (terracotta light)
  // 'b' : #a86834 (terracotta base)
  // 's' : #6e3c16 (terracotta shadow)
  // 'd' : #3e1e08 (pot outline)
  // Soil / Loam:
  // 'o' : #86592e (crumb light)
  // 'u' : #563418 (loam base)
  // 'v' : #381e0c (loam shadow)
  // 'z' : #1e0e04 (deep crevice / ground shadow)
  // Cotyledon plant:
  // 'g' : #a8ec76 (leaf highlight)
  // 'l' : #74c648 (leaf light)
  // 'm' : #2f8a35 (leaf base/shadow)
  // 'k' : #0c3012 (leaf outline)
  // Dewdrop:
  // 'w' : #ffffff (water glint / specular)
  // 'a' : #7ec8f0 (water blue)

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
    'w': '#ffffff',
    'a': '#7ec8f0'
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

  // Plant and dewdrop overlays per frame (rows 9..20)
  // Cotyledons unfurl/relax by ~2 px across the 8 frames.
  // Dewdrop rolls along left leaf, detaches, falls, and creates a splash.
  const overlays = [
    // Frame 0: Resting pose, dewdrop on top curve of left leaf
    [
      { y: 10, x: 11, str: '..kk......kk..' },
      { y: 11, x: 10, str: '.kgwgk..kglgk.' }, // dewdrop 'w' at (12, 11)
      { y: 12, x: 9,  str: 'kglalgkkglllgk' }, // dewdrop 'a' at (11, 12)
      { y: 13, x: 9,  str: 'kllmmkkkkmmllk' },
      { y: 14, x: 10, str: '.kmkkglmlkkmk.' },
      { y: 15, x: 12, str: '..kkgllkk..' },
      { y: 16, x: 14, str: 'kglmk' },
      { y: 17, x: 14, str: 'kglmk' },
      { y: 18, x: 14, str: 'kmmmk' }
    ],
    // Frame 1: Lift anticipation, leaves curl slightly up (1 px)
    [
      { y: 9,  x: 11, str: '..kk......kk..' },
      { y: 10, x: 10, str: '.kgwgk..kglgk.' }, // dewdrop moves to tip edge
      { y: 11, x: 9,  str: 'kglalgkkglllgk' },
      { y: 12, x: 9,  str: 'kllmmkkkkmmllk' },
      { y: 13, x: 10, str: '.kmkkglmlkkmk.' },
      { y: 14, x: 12, str: '..kkgllkk..' },
      { y: 15, x: 14, str: 'kglmk' },
      { y: 16, x: 14, str: 'kglmk' },
      { y: 17, x: 14, str: 'kglmk' },
      { y: 18, x: 14, str: 'kmmmk' }
    ],
    // Frame 2: High crest, dewdrop slides to leaf tip
    [
      { y: 9,  x: 10, str: '..kk......kk..' },
      { y: 10, x: 9,  str: '.kwagk..kglgk.' }, // dewdrop at (10..11, 10)
      { y: 11, x: 8,  str: 'kgaallkkglllgk' },
      { y: 12, x: 8,  str: 'kllmmkkkkmmllk' },
      { y: 13, x: 9,  str: '.kmkkglmlkkmk.' },
      { y: 14, x: 12, str: '..kkgllkk..' },
      { y: 15, x: 14, str: 'kglmk' },
      { y: 16, x: 14, str: 'kglmk' },
      { y: 17, x: 14, str: 'kglmk' },
      { y: 18, x: 14, str: 'kmmmk' }
    ],
    // Frame 3: Leaves unfurl outward, dewdrop teardrops at tip (8, 12..13)
    [
      { y: 10, x: 9,  str: '..kk......kk..' },
      { y: 11, x: 8,  str: '.kgglk..kglgk.' },
      { y: 12, x: 7,  str: 'wkglllkkglllgk' }, // droplet teardrop at 7, 12
      { y: 13, x: 7,  str: 'akkmmkkkkmmllk' },
      { y: 14, x: 8,  str: '.kkmkglmlkkmk.' },
      { y: 15, x: 11, str: '..kkgllkk..' },
      { y: 16, x: 14, str: 'kglmk' },
      { y: 17, x: 14, str: 'kglmk' },
      { y: 18, x: 14, str: 'kmmmk' }
    ],
    // Frame 4: Leaves wide unfurl, dewdrop detaches and falls freely
    [
      { y: 10, x: 8,  str: '...kk........kk...' },
      { y: 11, x: 7,  str: '..kgglk....kglgk..' },
      { y: 12, x: 6,  str: '.kgglllk..klllgk.' },
      { y: 13, x: 6,  str: '.kllmmmkkkkmmmllk.' },
      { y: 14, x: 7,  str: '..kmmkglmlkkmk...' },
      { y: 15, x: 6,  str: 'wa..kkgllkk......' }, // falling drop at (6, 15), (7, 15)
      { y: 16, x: 14, str: 'kglmk' },
      { y: 17, x: 14, str: 'kglmk' },
      { y: 18, x: 14, str: 'kmmmk' }
    ],
    // Frame 5: Leaves peak stretch, dewdrop descends further
    [
      { y: 11, x: 8,  str: '...kk........kk...' },
      { y: 12, x: 7,  str: '..kgglk....kglgk..' },
      { y: 13, x: 6,  str: '.kgglllk..klllgk.' },
      { y: 14, x: 6,  str: '.kllmmmkkkkmmmllk.' },
      { y: 15, x: 7,  str: '..kmmkglmlkkmk...' },
      { y: 16, x: 14, str: 'kglmk' },
      { y: 17, x: 6,  str: 'wa......kglmk.....' }, // falling drop at (6, 17), (7, 17)
      { y: 18, x: 14, str: 'kmmmk' }
    ],
    // Frame 6: Dewdrop impacts pot rim/soil - splash burst! Leaves ease in
    [
      { y: 10, x: 9,  str: '..kk......kk..' },
      { y: 11, x: 8,  str: '.kgglk..kglgk.' },
      { y: 12, x: 8,  str: 'kgglllkkglllgk' },
      { y: 13, x: 8,  str: 'kllmmkkkkmmllk' },
      { y: 14, x: 9,  str: '.kmkkglmlkkmk.' },
      { y: 15, x: 12, str: '..kkgllkk..' },
      { y: 16, x: 14, str: 'kglmk' },
      { y: 17, x: 14, str: 'kglmk' },
      { y: 18, x: 5,  str: '.w.a.....kmmmk' }, // splash droplets at (6, 18), (8, 18)
      { y: 19, x: 5,  str: 'aawddhhttbbbsssssssssdd' } // splash on rim
    ],
    // Frame 7: Splash absorbs, leaves settle back to rest
    [
      { y: 10, x: 10, str: '..kk......kk..' },
      { y: 11, x: 9,  str: '.kgglk..kglgk.' },
      { y: 12, x: 9,  str: 'kgglllkkglllgk' },
      { y: 13, x: 9,  str: 'kllmmkkkkmmllk' },
      { y: 14, x: 10, str: '.kmkkglmlkkmk.' },
      { y: 15, x: 12, str: '..kkgllkk..' },
      { y: 16, x: 14, str: 'kglmk' },
      { y: 17, x: 14, str: 'kglmk' },
      { y: 18, x: 14, str: 'kmmmk' },
      { y: 19, x: 6,  str: 'a.ddhhttbbbsssssssssdd' } // wet glint fading
    ]
  ];

  // List of intentional lone pixels (droplets / splash) for orphan lint check
  const sparkles = [
    [7, 12], [6, 15], [7, 15], [6, 17], [7, 17], [6, 18], [8, 18], [5, 19], [6, 19]
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
    id: 'sprout',
    category: 'garden',
    size: [32, 32],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Terracotta pot with twin cotyledon leaves unfurling and relaxing while a dewdrop rolls, drops, and splashes',
    palette,
    sparkles,
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
