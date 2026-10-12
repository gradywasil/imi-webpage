(function (root) {
  // 8-frame handcrafted animated pixel art: watering_can
  // Galvanized steel watering can with brass sprinkler rose head.
  // Tilts forward through 3 pre-drawn tilt states, releasing a streaming
  // droplet arc across 4 frames that terminates in an energetic water splash.

  // Palette (11 distinct colors <= 16):
  // Galvanized metal:
  // 'w' : #ffffff (specular highlight / glint)
  // 'h' : #e8f0f8 (metal light)
  // 'm' : #b8c6d4 (metal base)
  // 's' : #687a8c (metal shadow)
  // 'k' : #303c4a (metal deep outline)
  // Water:
  // 'a' : #d6f0ff (water highlight / spray)
  // 'b' : #7ec8f0 (water droplet blue)
  // 'c' : #3a8ec8 (water shadow stream)
  // 'd' : #184c78 (deep water / wet ground)
  // Brass sprinkler rose:
  // 'y' : #ffd23a (brass face)
  // 'x' : #b38004 (brass shadow rim)

  const palette = {
    '.': null,
    'w': '#ffffff',
    'h': '#e8f0f8',
    'm': '#b8c6d4',
    's': '#687a8c',
    'k': '#303c4a',
    'a': '#d6f0ff',
    'b': '#7ec8f0',
    'c': '#3a8ec8',
    'd': '#184c78',
    'y': '#ffd23a',
    'x': '#b38004'
  };

  // 3 Pre-drawn hand-authored tilt states:

  // State 0: Upright Rest (frames 0, 7)
  const state0 = [
    '................................', // 0
    '................................', // 1
    '................................', // 2
    '................................', // 3
    '................................', // 4
    '................................', // 5
    '................................', // 6
    '................................', // 7
    '.........kkkkk..................', // 8
    '.......kkwhhhskk................', // 9
    '......kwhk...ksssk........kk....', // 10
    '.....kwhk.....kssk.......kyyk...', // 11
    '.....kmk.......ksk......kxyyxk..', // 12
    '....kwhk........kk.....kxyyyxk..', // 13
    '....kmk...............ksskkkk...', // 14
    '...kwhk...kkkkkkk....ksshsk.....', // 15
    '...kmk...kwhhhhskk..ksssk.......', // 16
    '...ksk..kwhhhhhhskkksssk........', // 17
    '....k...kmhhhhhhssskssk.........', // 18
    '........kmhhhhhhsssssk..........', // 19
    '........kmhhhhhhsssssk..........', // 20
    '........kmmhhhhhsssssk..........', // 21
    '........kmmhhhhhsssssk..........', // 22
    '........kmmmhhhhsssssk..........', // 23
    '........kmmmhhhhsssssk..........', // 24
    '........kssssssssssssk..........', // 25
    '.........kkkkkkkkkkkk...........', // 26
    '................................', // 27
    '................................', // 28
    '................................', // 29
    '................................', // 30
    '................................'  // 31
  ];

  // State 1: Partial Tilt (frames 1, 6)
  const state1 = [
    '................................', // 0
    '................................', // 1
    '................................', // 2
    '................................', // 3
    '................................', // 4
    '................................', // 5
    '................................', // 6
    '..........kkkkk.................', // 7
    '........kkwhhhskk...............', // 8
    '.......kwhk...ksssk.............', // 9
    '......kwhk.....kssk.......kk....', // 10
    '......kmk.......ksk......kyyk...', // 11
    '.....kwhk........kk.....kxyyxk..', // 12
    '.....kmk...............kxyyyxk..', // 13
    '....kwhk...kkkkkkk....ksskkkk...', // 14
    '....kmk...kwhhhhskk..ksshsk.....', // 15
    '....ksk..kwhhhhhhskkksssk.......', // 16
    '.....k..kmhhhhhhssskssk.........', // 17
    '........kmhhhhhhsssssk..........', // 18
    '........kmhhhhhhsssssk..........', // 19
    '........kmmhhhhhsssssk..........', // 20
    '.........kmmhhhhsssssk..........', // 21
    '.........kmmmhhhsssssk..........', // 22
    '..........kmmhhhsssssk..........', // 23
    '..........kssssssssssk..........', // 24
    '...........kkkkkkkkkk...........', // 25
    '................................', // 26
    '................................', // 27
    '................................', // 28
    '................................', // 29
    '................................', // 30
    '................................'  // 31
  ];

  // State 2: Full Pouring Tilt (frames 2, 3, 4, 5)
  const state2 = [
    '................................', // 0
    '................................', // 1
    '................................', // 2
    '................................', // 3
    '................................', // 4
    '................................', // 5
    '...........kkkkk................', // 6
    '.........kkwhhhskk..............', // 7
    '........kwhk...ksssk............', // 8
    '.......kwhk.....kssk............', // 9
    '.......kmk.......ksk......kk....', // 10
    '......kwhk........kk.....kyyk...', // 11
    '......kmk...............kxyyxk..', // 12
    '.....kwhk...kkkkkkk....kxyyyxk..', // 13
    '.....kmk...kwhhhhskk..ksskkkk...', // 14
    '.....ksk..kwhhhhhhskkksshsk.....', // 15
    '......k..kmhhhhhhsssksssk.......', // 16
    '.........kmhhhhhhsssskssk.......', // 17
    '.........kmhhhhhhsssssk.........', // 18
    '..........kmmhhhhsssssk.........', // 19
    '..........kmmhhhhsssssk.........', // 20
    '...........kmmmhhsssssk.........', // 21
    '...........kmmmhhsssssk.........', // 22
    '............kssssssssk..........', // 23
    '.............kkkkkkkk...........', // 24
    '................................', // 25
    '................................', // 26
    '................................', // 27
    '................................', // 28
    '................................', // 29
    '................................', // 30
    '................................'  // 31
  ];

  // Droplet and splash overlays for frames 2..6:
  // Frame 2: First droplets emerge from sprinkler head at (25..27, 14..16)
  // Frame 3: Droplets stream mid-flight (y = 17..21)
  // Frame 4: Droplets reach near-ground (y = 22..26)
  // Frame 5: Ground impact splash (y = 26..29)
  // Frame 6: Settling puddle (y = 27..28)

  const waterOverlays = [
    // Frame 0: (State 0) glint on handle
    [
      { y: 8, x: 11, str: 'ww' },
      { y: 9, x: 9,  str: 'ww' }
    ],
    // Frame 1: (State 1) glint shifts, slight droplet at spout
    [
      { y: 7,  x: 12, str: 'ww' },
      { y: 8,  x: 10, str: 'ww' },
      { y: 14, x: 26, str: 'wa' }
    ],
    // Frame 2: (State 2) droplets emerging in cluster
    [
      { y: 6,  x: 13, str: 'ww' },
      { y: 14, x: 27, str: 'wa' },
      { y: 15, x: 26, str: 'abc' },
      { y: 16, x: 27, str: 'bc' }
    ],
    // Frame 3: (State 2) droplet arc streaming downwards
    [
      { y: 14, x: 27, str: 'wa' },
      { y: 15, x: 27, str: 'ab' },
      { y: 17, x: 27, str: 'wac' },
      { y: 18, x: 28, str: 'bc' },
      { y: 20, x: 28, str: 'ab' },
      { y: 21, x: 28, str: 'bc' }
    ],
    // Frame 4: (State 2) stream descending to ground level
    [
      { y: 15, x: 27, str: 'ab' },
      { y: 18, x: 28, str: 'bc' },
      { y: 21, x: 28, str: 'ab' },
      { y: 22, x: 29, str: 'wbc' },
      { y: 24, x: 29, str: 'abc' },
      { y: 25, x: 29, str: 'bc' }
    ],
    // Frame 5: (State 2) impact splash burst!
    [
      { y: 15, x: 27, str: 'wa' },
      { y: 23, x: 29, str: 'ab' },
      { y: 25, x: 26, str: 'a..a' }, // side splash drops
      { y: 26, x: 26, str: 'wababw' }, // splash crown
      { y: 27, x: 25, str: 'dabccbad' }, // splash ripple base
      { y: 28, x: 26, str: 'dddddd' }   // wet puddle shadow
    ],
    // Frame 6: (State 1) splash relaxes into puddle
    [
      { y: 26, x: 27, str: 'ab' },
      { y: 27, x: 26, str: 'dabbad' },
      { y: 28, x: 27, str: 'dddd' }
    ],
    // Frame 7: (State 0) puddle soaking in, can settled
    [
      { y: 27, x: 26, str: 'ddabdd' },
      { y: 28, x: 27, str: 'dddd' }
    ]
  ];

  // Whitelist of intentional droplet / splash pixels for orphan check
  const sparkles = [
    [26, 14], [27, 14], [28, 20], [28, 21], [29, 22], [29, 24], [26, 25], [29, 25]
  ];

  function buildFrames() {
    const frames = [];
    const baseStates = [state0, state1, state2, state2, state2, state2, state1, state0];

    for (let f = 0; f < 8; f++) {
      const grid = baseStates[f].map(row => row.split(''));
      const overlay = waterOverlays[f] || [];
      overlay.forEach(({ y, x, str }) => {
        for (let c = 0; c < str.length; c++) {
          const ch = str[c];
          if (ch !== '.') {
            if (y >= 0 && y < 32 && (x + c) >= 0 && (x + c) < 32) {
              grid[y][x + c] = ch;
            }
          }
        }
      });
      frames.push({ rows: grid.map(r => r.join('')) });
    }
    return frames;
  }

  const asset = {
    id: 'watering_can',
    category: 'garden',
    size: [32, 32],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Galvanized watering can tilts through 3 states, pouring an arcing water stream that splashes on the ground',
    palette,
    sparkles,
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
