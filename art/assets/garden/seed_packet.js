(function (root) {
  // 8-frame handcrafted animated pixel art: seed_packet
  // Kraft paper seed envelope with botanical sprout medallion, red label ribbon,
  // 2-frame shake, settling bounce, and phonetic golden sparkles.

  // Palette keys (14 distinct colors <= 16):
  // '.' : transparent
  // 'k' : #422e02 (deep kraft outline)
  // 'w' : #ffffff (paper highlight / glint)
  // 'h' : #fff6d6 (paper light)
  // 'b' : #ede0b8 (kraft base)
  // 's' : #c9b88a (kraft shadow)
  // 'd' : #786842 (kraft deep crease)
  // 'g' : #a8ec76 (sprout highlight)
  // 'l' : #74c648 (sprout base)
  // 'm' : #2f8a35 (sprout shadow)
  // 'e' : #0c3012 (crest deep outline)
  // 'r' : #e86a50 (banner red base)
  // 't' : #781c16 (banner red shadow)
  // 'y' : #ffd23a (gold sparkle)
  // 'q' : #fffbe0 (sparkle core)

  const palette = {
    '.': null,
    'k': '#422e02',
    'w': '#ffffff',
    'h': '#fff6d6',
    'b': '#ede0b8',
    's': '#c9b88a',
    'd': '#786842',
    'g': '#a8ec76',
    'l': '#74c648',
    'm': '#2f8a35',
    'e': '#0c3012',
    'r': '#e86a50',
    't': '#781c16',
    'y': '#ffd23a',
    'q': '#fffbe0'
  };

  // Master envelope body (32x32 template)
  const masterRows = [
    '................................', // 0
    '................................', // 1
    '................................', // 2
    '................................', // 3
    '................................', // 4
    '.........kkkkkkkkkkkkkk.........', // 5
    '........khhhhhhhhhhhhhhk........', // 6
    '........khbbbbbbbbbbbbhk........', // 7
    '........khdbbbbbbbbbbdhk........', // 8
    '........khbdbbbbbbbdbbhk........', // 9
    '........khbbdbbbbbdbbbhk........', // 10
    '........khbbbdbbdbbbbbhk........', // 11
    '........khbbbbddbbbbbbhk........', // 12
    '........khbbbeeeebbbbbhk........', // 13
    '........khbbeeggeebbbbhk........', // 14
    '........khbeellggeebbbhk........', // 15
    '........khbeelmmleebbbhk........', // 16
    '........khbeelllleebbbhk........', // 17
    '........khbbbeeeebbbbbhk........', // 18
    '........khbbbbbbbbbbbbhk........', // 19
    '........khbbbbbbbbbbbbhk........', // 20
    '........khrrrrrrrrrrrrhk........', // 21
    '........khttstttstttthk........', // 22
    '........khbbbbbbbbbbbbhk........', // 23
    '........khsssssssssssssk........', // 24
    '.........kkkkkkkkkkkkkk.........', // 25
    '................................', // 26
    '................................', // 27
    '................................', // 28
    '................................', // 29
    '................................', // 30
    '................................'  // 31
  ];

  // Offsets per frame: [dx, dy]
  // f0: rest (0, 0)
  // f1: anticipation squash down (0, 1)
  // f2: shake left (-1, 0)
  // f3: shake right (+1, -1)
  // f4: shake left (-1, 0)
  // f5: rebound settle (+1, 0)
  // f6: hold high (0, -1)
  // f7: settle to rest (0, 0)
  const offsets = [
    [0, 0],
    [0, 1],
    [-1, 0],
    [1, -1],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 0]
  ];

  // Sparkles definitions per frame: array of [x, y, char]
  const sparklesPerFrame = [
    [[24, 4, 'y']],                                // f0: tiny seed mote
    [[24, 3, 'y'], [21, 5, 'y']],                  // f1: rising motes
    [[25, 2, 'q'], [24, 2, 'y'], [26, 2, 'y'], [21, 4, 'y']], // f2: spark growing
    [[25, 1, 'q'], [24, 2, 'y'], [26, 2, 'y'], [25, 3, 'y'], [25, 2, 'w']], // f3: big 4-pt sparkle
    [[25, 1, 'y'], [23, 2, 'y'], [27, 2, 'y']],    // f4: sparkles dispersing
    [[26, 2, 'y'], [7, 8, 'w']],                   // f5: packet sheen glint at corner
    [[7, 9, 'w'], [8, 9, 'w']],                    // f6: packet sheen sweeps
    [[8, 10, 'w']]                                 // f7: glint finishes
  ];

  // Allowed lone sparkle pixels for lint
  const sparkles = [
    [24, 4], [24, 3], [21, 5], [25, 2], [24, 2], [26, 2], [21, 4],
    [25, 1], [25, 3], [23, 2], [27, 2], [26, 2], [7, 8], [7, 9],
    [8, 9], [8, 10]
  ];

  function buildFrames() {
    const frames = [];
    for (let f = 0; f < 8; f++) {
      const [dx, dy] = offsets[f];
      const grid = Array.from({ length: 32 }, () => Array(32).fill('.'));

      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const ch = masterRows[y][x];
          if (ch !== '.') {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < 32 && nx >= 0 && nx < 32) {
              grid[ny][nx] = ch;
            }
          }
        }
      }

      // Add sparkles for this frame
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
    id: 'seed_packet',
    category: 'garden',
    size: [32, 32],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Kraft paper seed packet with botanical sprout emblem, snappy shake, and floating phonetic spore glints',
    palette,
    sparkles,
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
