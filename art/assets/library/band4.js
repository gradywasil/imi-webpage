(function (root) {
  'use strict';

  // Band 4: Ledger Compendium (ARCHIVES) - 13x42, 8 frames, 8 fps
  // Rich oceanic blue leather, raised gilded ribs, gold title cartouche with "ARCHIVES",
  // woven headband, golden silk bookmark tassel with gold bead, traveling glint.

  const P = {
    '.': null,
    // Oceanic Blue Leather Ramp (from RAMPS.blue)
    'k': '#0c1442', // deep navy outline
    's': '#1a2872', // shadow blue
    'b': '#2e44a8', // base blue
    'l': '#5470d8', // light blue
    'h': '#8caef8', // highlight blue
    // Gold Tooling Ramp (from RAMPS.gold)
    'd': '#4a2e04', // deep gold shadow
    'o': '#b38004', // shadow gold
    'y': '#ffd23a', // base gold
    'g': '#fff08c', // light gold
    'w': '#fffbe0', // specular glint
    // Cartouche Parchment (from RAMPS.paper)
    'p': '#fff6d6', // light parchment
    'm': '#ede0b8', // parchment base
    't': '#786842'  // parchment shadow / ink
  };

  // Base rows for book body (y: 0..34)
  // Columns: 0 is margin, 1..11 is spine body, 12 is margin (width 13)
  function getSpineRow(glintY, curY) {
    if (curY === 0) return '.............';
    if (curY === 1) return '.kkkkkkkkkkk.'; // top cap
    if (curY === 2) return '.kghyblgbosdk.'; // woven headband
    if (curY === 3) return '.klhbbbbbsssk.'; // top leather collar

    // Rib 1 at y=4,5
    if (curY === 4) {
      return glintY === 4 ? '.kwwgggggggyd.' : '.kgyyyyyyyyod.';
    }
    if (curY === 5) {
      return glintY === 4 ? '.kgyyoooooood.' : '.kdoodddddddk.';
    }

    if (curY === 6) return '.klhbbbbbsssk.'; // leather spacing

    // Title Cartouche: y=7..24 (inset parchment plate with gold frame)
    if (curY === 7) {
      return glintY === 7 ? '.kwwgggggggyd.' : '.kgyyyyyyyyod.'; // cartouche top frame
    }
    if (curY === 8) {
      return glintY === 7 ? '.gypppppppppmod.' : '.oypppppppppmod.'; // cartouche inner top
    }
    // Letter 'A' (y=9, 10)
    if (curY === 9) {
      return glintY === 11 ? '.oyppwwppppppmod.' : '.oypptttpppppmmod.';
    }
    if (curY === 10) {
      return glintY === 11 ? '.oyptwwwwtppptod.' : '.oyptmmmmtppptod.';
    }
    // Letter 'R' (y=11, 12)
    if (curY === 11) {
      return glintY === 11 ? '.oytwwwwwwwwttod.' : '.oytmmmmmmmmttod.';
    }
    if (curY === 12) {
      return glintY === 11 ? '.oytwppwwptpptod.' : '.oytmppmmpmpptod.';
    }
    // Letter 'C' (y=13, 14)
    if (curY === 13) {
      return glintY === 11 ? '.oypwwwwwwwwpmod.' : '.oyptttttttttmpod.';
    }
    if (curY === 14) {
      return glintY === 11 ? '.oytwpppppppptod.' : '.oytmpppppppptod.';
    }
    // Letter 'H' (y=15, 16)
    if (curY === 15) {
      return glintY === 17 ? '.oytwppwwppwwtod.' : '.oytmppmwppmwmtod.';
    }
    if (curY === 16) {
      return glintY === 17 ? '.oytwwwwwwwwwtod.' : '.oytmmmmmmmmmtod.';
    }
    // Letter 'I' (y=17, 18)
    if (curY === 17) {
      return glintY === 17 ? '.oyppwwwwwwppmod.' : '.oyppttttttmpmod.';
    }
    if (curY === 18) {
      return glintY === 17 ? '.oyppppwwppppmod.' : '.oyppppmmppmpmod.';
    }
    // Letter 'V' (y=19, 20)
    if (curY === 19) {
      return glintY === 17 ? '.oytwppwwppwwtod.' : '.oytmppmwppmwmtod.';
    }
    if (curY === 20) {
      return glintY === 17 ? '.oyppwwwwwwpptod.' : '.oyppttttttmmtod.';
    }
    // Letter 'E' & 'S' (y=21, 22)
    if (curY === 21) {
      return glintY === 17 ? '.oypwwwwwwwwpmod.' : '.oyptttttttttmpod.';
    }
    if (curY === 22) {
      return glintY === 17 ? '.oypwwwwwwwwpmod.' : '.oyptttttttttmpod.';
    }
    if (curY === 23) {
      return glintY === 24 ? '.gwpppppppppmod.' : '.oypppppppppmod.'; // cartouche inner bottom
    }
    if (curY === 24) {
      return glintY === 24 ? '.kwwgggggggyd.' : '.kgyyyyyyyyod.'; // cartouche bottom frame
    }

    // Rib 2 at y=25,26
    if (curY === 25) {
      return glintY === 26 ? '.kwwgggggggyd.' : '.kgyyyyyyyyod.';
    }
    if (curY === 26) {
      return glintY === 26 ? '.kgyyoooooood.' : '.kdoodddddddk.';
    }

    // Compartment with gilded medallion tooling (y=27,28)
    if (curY === 27) return '.klhbboyobbssk.';
    if (curY === 28) return '.klhboyyyobssk.';

    // Rib 3 at y=29,30
    if (curY === 29) {
      return glintY === 29 ? '.kwwgggggggyd.' : '.kgyyyyyyyyod.';
    }
    if (curY === 30) {
      return glintY === 29 ? '.kgyyoooooood.' : '.kdoodddddddk.';
    }

    if (curY === 31) return '.klhbbbbbsssk.'; // leather collar
    if (curY === 32) return '.klhbbbbbsssk.';

    // Tailband at y=33
    if (curY === 33) {
      return glintY === 33 ? '.kwwglgbosdk.' : '.kghyblgbosdk.';
    }
    if (curY === 34) return '.kkkkkkkkkkk.'; // bottom cap

    return '.............';
  }

  // Golden silk tassel patterns across 8 frames (y: 35..41):
  // dx = [0, 1, 2, 1, 0, -1, -2, -1]
  const tasselPatterns = [
    // Frame 0: dx = 0
    [
      '......yy.....', // y=35: cord
      '......yy.....', // y=36: cord
      '......gg.....', // y=37: bright gold bead
      '.....yoyo....', // y=38: bell top
      '.....yoyo....', // y=39: bell mid
      '.....dood....', // y=40: bell low
      '......oo.....'  // y=41: fringe tip
    ],
    // Frame 1: dx = +1
    [
      '......yy.....',
      '.......yy....',
      '.......gg....',
      '......yoyo...',
      '......yoyo...',
      '......dood...',
      '.......oo....'
    ],
    // Frame 2: dx = +2
    [
      '......yy.....',
      '.......yy....',
      '........gg...',
      '.......yoyo..',
      '.......yoyo..',
      '.......dood..',
      '........oo...'
    ],
    // Frame 3: dx = +1
    [
      '......yy.....',
      '.......yy....',
      '.......gg....',
      '......yoyo...',
      '......yoyo...',
      '......dood...',
      '.......oo....'
    ],
    // Frame 4: dx = 0
    [
      '......yy.....',
      '......yy.....',
      '......gg.....',
      '.....yoyo....',
      '.....yoyo....',
      '.....dood....',
      '......oo.....'
    ],
    // Frame 5: dx = -1
    [
      '......yy.....',
      '.....yy......',
      '.....gg......',
      '....yoyo.....',
      '....yoyo.....',
      '....dood.....',
      '.....oo......'
    ],
    // Frame 6: dx = -2
    [
      '......yy.....',
      '.....yy......',
      '....gg.......',
      '...yoyo......',
      '...yoyo......',
      '...dood......',
      '....oo.......'
    ],
    // Frame 7: dx = -1
    [
      '......yy.....',
      '.....yy......',
      '.....gg......',
      '....yoyo.....',
      '....yoyo.....',
      '....dood.....',
      '.....oo......'
    ]
  ];

  // Glint progression down spine: 1 step per frame
  const glintYs = [4, 7, 11, 17, 24, 26, 29, 33];

  function buildFrames() {
    const frames = [];
    for (let f = 0; f < 8; f++) {
      const gY = glintYs[f];
      const rows = [];
      for (let y = 0; y < 35; y++) {
        rows.push(getSpineRow(gY, y));
      }
      const tassel = tasselPatterns[f];
      for (let ty = 0; ty < 7; ty++) {
        rows.push(tassel[ty]);
      }
      frames.push({ rows });
    }
    return frames;
  }

  // Shelf hover pulled variant: sliding out 3 px forward (down) in 3 frames
  function buildPulledVariant() {
    const baseFrames = buildFrames();
    const f0 = baseFrames[0].rows;
    const pulledFrames = [];

    for (let shift = 1; shift <= 3; shift++) {
      const rows = [];
      for (let y = 0; y < 42; y++) {
        const srcY = y - shift;
        if (srcY >= 0 && srcY < 42) {
          rows.push(f0[srcY]);
        } else {
          rows.push('.............');
        }
      }
      pulledFrames.push({ rows });
    }
    return pulledFrames;
  }

  const asset = {
    id: 'band4',
    category: 'library',
    size: [13, 42],
    fps: 8,
    loop: true,
    staticFrame: 0,
    title: 'ARCHIVES',
    notes: 'Ledger Compendium in oceanic blue leather with raised gilded ribs, ARCHIVES cartouche, and golden silk tassel',
    palette: P,
    sparkles: [],
    frames: buildFrames(),
    pulled: buildPulledVariant(),
    variants: {
      pulled: buildPulledVariant()
    }
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
