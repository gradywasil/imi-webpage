(function (root) {
  'use strict';

  // Band 5: Imperial Lexicon (TYPEWRITERS) - 14x46, 8 frames, 8 fps
  // Imperial royal purple leather, 4 raised gilded ribs, gold title cartouche with "TYPEWRITERS",
  // woven headband, imperial gold silk bookmark tassel with gold bead, traveling glint.

  const P = {
    '.': null,
    // Royal Purple Leather Ramp (from RAMPS.purple)
    'k': '#280c48', // deep purple outline
    's': '#4e2280', // shadow purple
    'b': '#7a46bc', // base purple
    'l': '#b58cf0', // light purple
    'h': '#e4beff', // highlight purple
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

  // Base rows for book body (y: 0..38)
  // Columns: 0 is margin, 1..12 is spine body, 13 is margin (width 14)
  function getSpineRow(glintY, curY) {
    if (curY === 0) return '..............';
    if (curY === 1) return '.kkkkkkkkkkkk.'; // top cap
    if (curY === 2) return '.kghyblgbosdk.'; // woven headband
    if (curY === 3) return '.klhbbbbbbsssk.'; // top leather collar

    // Rib 1 at y=4,5
    if (curY === 4) {
      return glintY === 4 ? '.kwwggggggggyd.' : '.kgyyyyyyyyyyod.';
    }
    if (curY === 5) {
      return glintY === 4 ? '.kgyyooooooooed.' : '.kdoodddddddddk.';
    }

    if (curY === 6) return '.klhbbbbbbsssk.'; // leather spacing

    // Title Cartouche: y=7..26 (inset parchment plate with gold frame)
    if (curY === 7) {
      return glintY === 7 ? '.kwwggggggggyd.' : '.kgyyyyyyyyyyod.'; // cartouche top frame
    }
    if (curY === 8) {
      return glintY === 7 ? '.gyppppppppppmod.' : '.oyppppppppppmod.'; // cartouche inner top
    }
    // Letters 'T', 'Y' (y=9..12)
    if (curY === 9) {
      return glintY === 11 ? '.oypwwwwwwwwpmod.' : '.oyptttttttttmpod.';
    }
    if (curY === 10) {
      return glintY === 11 ? '.oyppppwwppppmod.' : '.oyppppmmppmpmod.';
    }
    if (curY === 11) {
      return glintY === 11 ? '.oytwwppwwptpmod.' : '.oytmppmwpmttmpod.';
    }
    if (curY === 12) {
      return glintY === 11 ? '.oyppppwwppppmod.' : '.oyppppmmppmpmod.';
    }
    // Letters 'P', 'E' (y=13..16)
    if (curY === 13) {
      return glintY === 11 ? '.oytwwwwwwwwpmod.' : '.oytmmmmmmttmpod.';
    }
    if (curY === 14) {
      return glintY === 11 ? '.oytwppwwptppmod.' : '.oytmppmmpmppmod.';
    }
    if (curY === 15) {
      return glintY === 17 ? '.oypwwwwwwwwpmod.' : '.oyptttttttttmpod.';
    }
    if (curY === 16) {
      return glintY === 17 ? '.oypwwppwwppwmod.' : '.oyptmmpttmpmtmod.';
    }
    // Letters 'W', 'R' (y=17..20)
    if (curY === 17) {
      return glintY === 17 ? '.oytwppwwppwwtod.' : '.oytmppmwppmwmtod.';
    }
    if (curY === 18) {
      return glintY === 17 ? '.oytwwwwwwwwwtod.' : '.oytmmmmmmmmmtod.';
    }
    if (curY === 19) {
      return glintY === 17 ? '.oytwwwwwwwwttod.' : '.oytmmmmmmmmttod.';
    }
    if (curY === 20) {
      return glintY === 17 ? '.oytwppwwptpptod.' : '.oytmppmmpmpptod.';
    }
    // Letters 'I', 'T', 'E', 'R', 'S' glyphs (y=21..24)
    if (curY === 21) {
      return glintY === 25 ? '.oyppwwwwwwppmod.' : '.oyppttttttmpmod.';
    }
    if (curY === 22) {
      return glintY === 25 ? '.oypwwwwwwwwpmod.' : '.oyptttttttttmpod.';
    }
    if (curY === 23) {
      return glintY === 25 ? '.oypwwppwwppwmod.' : '.oyptmmpttmpmtmod.';
    }
    if (curY === 24) {
      return glintY === 25 ? '.oypwwwwwwwwpmod.' : '.oyptttttttttmpod.';
    }
    if (curY === 25) {
      return glintY === 25 ? '.gwppppppppppmod.' : '.oyppppppppppmod.'; // cartouche inner bottom
    }
    if (curY === 26) {
      return glintY === 25 ? '.kwwggggggggyd.' : '.kgyyyyyyyyyyod.'; // cartouche bottom frame
    }

    // Rib 2 at y=27,28
    if (curY === 27) {
      return glintY === 27 ? '.kwwggggggggyd.' : '.kgyyyyyyyyyyod.';
    }
    if (curY === 28) {
      return glintY === 27 ? '.kgyyooooooooed.' : '.kdoodddddddddk.';
    }

    // Emblem compartment (y=29,30)
    if (curY === 29) return '.klhbbboyobbbssk.';
    if (curY === 30) return '.klhbboyyyobbbssk.';

    // Rib 3 at y=31,32
    if (curY === 31) {
      return glintY === 31 ? '.kwwggggggggyd.' : '.kgyyyyyyyyyyod.';
    }
    if (curY === 32) {
      return glintY === 31 ? '.kgyyooooooooed.' : '.kdoodddddddddk.';
    }

    if (curY === 33) return '.klhbbbbbbsssk.';
    if (curY === 34) return '.klhbbbbbbsssk.';

    // Rib 4 at y=35,36
    if (curY === 35) {
      return glintY === 36 ? '.kwwggggggggyd.' : '.kgyyyyyyyyyyod.';
    }
    if (curY === 36) {
      return glintY === 36 ? '.kgyyooooooooed.' : '.kdoodddddddddk.';
    }

    // Tailband at y=37
    if (curY === 37) {
      return glintY === 36 ? '.kwwglgbosdk.' : '.kghyblgbosdk.';
    }
    if (curY === 38) return '.kkkkkkkkkkkk.'; // bottom cap

    return '..............';
  }

  // Golden silk tassel patterns across 8 frames (y: 39..45):
  // dx = [0, 1, 2, 1, 0, -1, -2, -1]
  const tasselPatterns = [
    // Frame 0: dx = 0
    [
      '......yy......', // y=39: cord
      '......yy......', // y=40: cord
      '......gg......', // y=41: gold bead
      '.....yoyo.....', // y=42: bell top
      '.....yoyo.....', // y=43: bell mid
      '.....dood.....', // y=44: bell low
      '......oo......'  // y=45: fringe tip
    ],
    // Frame 1: dx = +1
    [
      '......yy......',
      '.......yy.....',
      '.......gg.....',
      '......yoyo....',
      '......yoyo....',
      '......dood....',
      '.......oo.....'
    ],
    // Frame 2: dx = +2
    [
      '......yy......',
      '.......yy.....',
      '........gg....',
      '.......yoyo...',
      '.......yoyo...',
      '.......dood...',
      '........oo....'
    ],
    // Frame 3: dx = +1
    [
      '......yy......',
      '.......yy.....',
      '.......gg.....',
      '......yoyo....',
      '......yoyo....',
      '......dood....',
      '.......oo.....'
    ],
    // Frame 4: dx = 0
    [
      '......yy......',
      '......yy......',
      '......gg......',
      '.....yoyo.....',
      '.....yoyo.....',
      '.....dood.....',
      '......oo......'
    ],
    // Frame 5: dx = -1
    [
      '......yy......',
      '.....yy.......',
      '.....gg.......',
      '....yoyo......',
      '....yoyo......',
      '....dood......',
      '.....oo.......'
    ],
    // Frame 6: dx = -2
    [
      '......yy......',
      '.....yy.......',
      '....gg........',
      '...yoyo.......',
      '...yoyo.......',
      '...dood.......',
      '....oo........'
    ],
    // Frame 7: dx = -1
    [
      '......yy......',
      '.....yy.......',
      '.....gg.......',
      '....yoyo......',
      '....yoyo......',
      '....dood......',
      '.....oo.......'
    ]
  ];

  // Glint progression down spine: 1 step per frame
  const glintYs = [4, 7, 11, 17, 25, 27, 31, 36];

  function buildFrames() {
    const frames = [];
    for (let f = 0; f < 8; f++) {
      const gY = glintYs[f];
      const rows = [];
      for (let y = 0; y < 39; y++) {
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
      for (let y = 0; y < 46; y++) {
        const srcY = y - shift;
        if (srcY >= 0 && srcY < 46) {
          rows.push(f0[srcY]);
        } else {
          rows.push('..............');
        }
      }
      pulledFrames.push({ rows });
    }
    return pulledFrames;
  }

  const asset = {
    id: 'band5',
    category: 'library',
    size: [14, 46],
    fps: 8,
    loop: true,
    staticFrame: 0,
    title: 'TYPEWRITERS',
    notes: 'Imperial Lexicon in royal purple leather with 4 raised gilded ribs, TYPEWRITERS cartouche, and golden silk tassel',
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
