(function (root) {
  // 8-frame handcrafted animated pixel art: soil_empty
  // Terracotta pot with rich dark humus furrows; a cute earthworm pokes up,
  // looks around with a segment wiggle, and retracts smoothly.

  // Palette (12 distinct colors <= 16):
  // '.' : transparent
  // Terracotta pot:
  // 't' : #ffe6cc (terracotta rim highlight)
  // 'h' : #dca06a (terracotta light)
  // 'b' : #a86834 (terracotta base)
  // 's' : #6e3c16 (terracotta shadow)
  // 'd' : #3e1e08 (terracotta deep outline)
  // Soil / Loam:
  // 'o' : #86592e (soil furrow crumb light)
  // 'u' : #563418 (rich loam base)
  // 'v' : #381e0c (loam shadow furrow)
  // 'z' : #1e0e04 (deep loam crevice / ground shadow)
  // Earthworm:
  // 'p' : #ffb8cc (worm highlight)
  // 'w' : #f08aa4 (worm base pink)
  // 'r' : #c8486c (worm segment shadow)
  // 'c' : #4a0a1e (worm eye / deep outline)

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
    'p': '#ffb8cc',
    'w': '#f08aa4',
    'r': '#c8486c',
    'c': '#4a0a1e'
  };

  // Base Pot & Soil template (32x32)
  // Rows 0..16: empty air above pot
  // Rows 17..19: soil mound & furrow bed
  // Rows 20..29: terracotta pot
  // Row 30: cast shadow
  // Row 31: transparent
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
    '..........zzzzzzzzzzzz..........', // 17 - soil crest
    '........zzuuoouuvvvuuuzz........', // 18 - soil furrow bed
    '......ddhhttbbbsssssssssdd......', // 19 - pot rim lip
    '......dthhbbbbbbsssssssssd......', // 20 - pot rim face
    '.......dhhbbbbbbssssssssd.......', // 21 - under-rim neck
    '.......dhhbbbbbbssssssssd.......', // 22 - pot belly
    '........dhbbbbbbsssssssd........', // 23
    '........dhbbbbbbsssssssd........', // 24
    '.........dhbbbbbssssssd.........', // 25 - pot taper
    '.........dhbbbbbssssssd.........', // 26
    '..........dhbbbbsssssd..........', // 27
    '..........dhbbbbsssssd..........', // 28
    '..........dddddddddddd..........', // 29 - pot base
    '.........zzzzzzzzzzzzzz.........', // 30 - cast shadow
    '................................'  // 31
  ];

  // Earthworm sprites per frame overlaid on rows 10..18
  // Frame 0: worm barely peeking tip at furrow (x = 15..16, y = 16)
  // Frame 1: worm rises 3 px (y = 14..17)
  // Frame 2: worm arches up (y = 12..17)
  // Frame 3: worm reaches peak height (y = 10..17), eye looks left
  // Frame 4: worm wiggles head (y = 10..17), eye looks right
  // Frame 5: worm retracts down (y = 12..17)
  // Frame 6: worm low in furrow (y = 14..17)
  // Frame 7: worm tip almost gone (y = 16..17), soil crumbs settle

  const wormOverlays = [
    // Frame 0: tiny tip peek + furrow crumbs
    [
      { y: 16, x: 15, str: 'cwpc' },
      { y: 17, x: 14, str: 'zuwwuz' },
      { y: 18, x: 13, str: 'zuuoouuz' },
      { y: 19, x: 11, str: 'hhttb' }
    ],
    // Frame 1: emerging head + neck
    [
      { y: 14, x: 15, str: 'cppc' },
      { y: 15, x: 15, str: 'crwc' },
      { y: 16, x: 14, str: 'cpwwrc' },
      { y: 17, x: 14, str: 'zouwoz' },
      { y: 18, x: 13, str: 'zvuuovuz' },
      { y: 19, x: 11, str: 'htthb' }
    ],
    // Frame 2: body extending, cute curve
    [
      { y: 12, x: 14, str: 'ccpc' },
      { y: 13, x: 13, str: 'cpwpc' },
      { y: 14, x: 14, str: 'crwc' },
      { y: 15, x: 14, str: 'cpwrc' },
      { y: 16, x: 14, str: 'crwwc' },
      { y: 17, x: 13, str: 'zouuwuz' },
      { y: 18, x: 13, str: 'zvoouuvz' },
      { y: 19, x: 11, str: 'thhtb' }
    ],
    // Frame 3: peak height, looking left with eye dot
    [
      { y: 10, x: 13, str: '.cpc.' },
      { y: 11, x: 12, str: 'cpwwc' },
      { y: 12, x: 12, str: 'ccwrc' }, // eye at 13
      { y: 13, x: 13, str: 'cpwrc' },
      { y: 14, x: 14, str: 'crwc' },
      { y: 15, x: 14, str: 'cpwrc' },
      { y: 16, x: 14, str: 'crwwc' },
      { y: 17, x: 13, str: 'zouuwuz' },
      { y: 18, x: 13, str: 'zuuoovvz' },
      { y: 19, x: 11, str: 'hthtb' }
    ],
    // Frame 4: head wiggles right, looking forward
    [
      { y: 10, x: 14, str: '.cpc.' },
      { y: 11, x: 13, str: 'cpwwc' },
      { y: 12, x: 13, str: 'crwcc' }, // eye at 16
      { y: 13, x: 13, str: 'crwpc' },
      { y: 14, x: 14, str: 'cpwrc' },
      { y: 15, x: 14, str: 'crwc' },
      { y: 16, x: 14, str: 'crwwc' },
      { y: 17, x: 13, str: 'zuouwoz' },
      { y: 18, x: 13, str: 'zvuuoovz' },
      { y: 19, x: 11, str: 'hhttb' }
    ],
    // Frame 5: smooth retraction downwards
    [
      { y: 12, x: 14, str: 'cprc' },
      { y: 13, x: 14, str: 'cpwwc' },
      { y: 14, x: 14, str: 'crwrc' },
      { y: 15, x: 14, str: 'cpwwc' },
      { y: 16, x: 14, str: 'crwrc' },
      { y: 17, x: 13, str: 'zouwooz' },
      { y: 18, x: 13, str: 'zuuvouuz' },
      { y: 19, x: 11, str: 'thhbb' }
    ],
    // Frame 6: low in the burrow, just rounded crown visible
    [
      { y: 14, x: 15, str: 'cpc.' },
      { y: 15, x: 14, str: 'cpwwc' },
      { y: 16, x: 14, str: 'crwrc' },
      { y: 17, x: 14, str: 'zuwwuz' },
      { y: 18, x: 13, str: 'zuououuz' },
      { y: 19, x: 11, str: 'tthbb' }
    ],
    // Frame 7: slipping under, soil crumbs tumbling into furrow
    [
      { y: 16, x: 15, str: 'cprc' },
      { y: 17, x: 14, str: 'zouuoz' },
      { y: 18, x: 13, str: 'zuoouuvz' },
      { y: 19, x: 11, str: 'hhttb' }
    ]
  ];

  function buildFrames() {
    const frames = [];
    for (let f = 0; f < 8; f++) {
      const grid = basePot.map(row => row.split(''));
      const overlay = wormOverlays[f];
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
    id: 'soil_empty',
    category: 'garden',
    size: [32, 32],
    fps: 8,
    loop: true,
    staticFrame: 3,
    notes: 'Terracotta pot with fertile garden furrow loam and an animated earthworm that pokes up, looks around, and retracts',
    palette,
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
