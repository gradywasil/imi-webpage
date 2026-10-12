(function (root) {
  'use strict';

  // Band 6: Grand Encyclopedia (ENCYCLOPEDIA) - 14x48, 8 frames, 8 fps
  // Dark mahogany leather with 5 raised gilded ribs, gold title cartouche with "ENCYCLOPEDIA",
  // woven headband, crimson silk bookmark tassel with gold bead, traveling glint.

  const P = {
    '.': null,
    // Dark Mahogany Leather Ramp (from RAMPS.woodD)
    'k': '#200e05', // deep mahogany outline
    's': '#3a1e0b', // shadow mahogany
    'b': '#5a3517', // base mahogany
    'l': '#7d4f26', // light mahogany
    'h': '#b07844', // highlight mahogany
    // Gold Tooling Ramp (from RAMPS.gold)
    'd': '#4a2e04', // deep gold shadow
    'o': '#b38004', // shadow gold
    'y': '#ffd23a', // base gold
    'g': '#fff08c', // light gold
    'w': '#fffbe0', // specular glint
    // Cartouche Parchment (from RAMPS.paper)
    'p': '#fff6d6', // light parchment
    'm': '#ede0b8', // parchment base
    't': '#786842', // parchment shadow / ink
    // Silk Ribbon Tassel (from RAMPS.red)
    'r': '#781c16', // dark red ribbon shadow
    'c': '#b8322a'  // base crimson ribbon
  };

  // Base rows for book body (y: 0..40)
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

    // Title Cartouche: y=7..28 (inset parchment plate with gold frame)
    if (curY === 7) {
      return glintY === 7 ? '.kwwggggggggyd.' : '.kgyyyyyyyyyyod.'; // cartouche top frame
    }
    if (curY === 8) {
      return glintY === 7 ? '.gyppppppppppmod.' : '.oyppppppppppmod.'; // cartouche inner top
    }
    // Letter 'E', 'N' (y=9..12)
    if (curY === 9) {
      return glintY === 11 ? '.oypwwwwwwwwpmod.' : '.oyptttttttttmpod.';
    }
    if (curY === 10) {
      return glintY === 11 ? '.oypwwppwwppwmod.' : '.oyptmmpttmpmtmod.';
    }
    if (curY === 11) {
      return glintY === 11 ? '.oytwppwwppwwtod.' : '.oytmppmwppmwmtod.';
    }
    if (curY === 12) {
      return glintY === 11 ? '.oytwwwwwwwwwtod.' : '.oytmmmmmmmmmtod.';
    }
    // Letters 'C', 'Y' (y=13..16)
    if (curY === 13) {
      return glintY === 11 ? '.oypwwwwwwwwpmod.' : '.oyptttttttttmpod.';
    }
    if (curY === 14) {
      return glintY === 11 ? '.oytwpppppppptod.' : '.oytmpppppppptod.';
    }
    if (curY === 15) {
      return glintY === 17 ? '.oytwwppwwptpmod.' : '.oytmppmwpmttmpod.';
    }
    if (curY === 16) {
      return glintY === 17 ? '.oyppppwwppppmod.' : '.oyppppmmppmpmod.';
    }
    // Letters 'C', 'L', 'O' (y=17..20)
    if (curY === 17) {
      return glintY === 17 ? '.oypwwwwwwwwpmod.' : '.oyptttttttttmpod.';
    }
    if (curY === 18) {
      return glintY === 17 ? '.oytwpppppppptod.' : '.oytmpppppppptod.';
    }
    if (curY === 19) {
      return glintY === 17 ? '.oytwwwwwwwwpmod.' : '.oytmmmmmmttmpod.';
    }
    if (curY === 20) {
      return glintY === 17 ? '.oytwppwwptppmod.' : '.oytmppmmpmppmod.';
    }
    // Letters 'P', 'E', 'D', 'I', 'A' (y=21..26)
    if (curY === 21) {
      return glintY === 26 ? '.oypwwwwwwwwpmod.' : '.oyptttttttttmpod.';
    }
    if (curY === 22) {
      return glintY === 26 ? '.oytwppwwptppmod.' : '.oytmppmmpmppmod.';
    }
    if (curY === 23) {
      return glintY === 26 ? '.oypwwwwwwwwpmod.' : '.oyptttttttttmpod.';
    }
    if (curY === 24) {
      return glintY === 26 ? '.oytwppwwppwwtod.' : '.oytmppmwppmwmtod.';
    }
    if (curY === 25) {
      return glintY === 26 ? '.oyppwwwwwwppmod.' : '.oyppttttttmpmod.';
    }
    if (curY === 26) {
      return glintY === 26 ? '.oypwwwwwwwwpmod.' : '.oyptttttttttmpod.';
    }
    if (curY === 27) {
      return glintY === 26 ? '.gwppppppppppmod.' : '.oyppppppppppmod.'; // cartouche inner bottom
    }
    if (curY === 28) {
      return glintY === 26 ? '.kwwggggggggyd.' : '.kgyyyyyyyyyyod.'; // cartouche bottom frame
    }

    // Rib 2 at y=29,30
    if (curY === 29) {
      return glintY === 29 ? '.kwwggggggggyd.' : '.kgyyyyyyyyyyod.';
    }
    if (curY === 30) {
      return glintY === 29 ? '.kgyyooooooooed.' : '.kdoodddddddddk.';
    }

    // Volume compartment "VOL. I" / crest tooling (y=31,32)
    if (curY === 31) return '.klhbbboyobbbssk.';
    if (curY === 32) return '.klhbboyyyobbbssk.';

    // Rib 3 at y=33,34
    if (curY === 33) {
      return glintY === 33 ? '.kwwggggggggyd.' : '.kgyyyyyyyyyyod.';
    }
    if (curY === 34) {
      return glintY === 33 ? '.kgyyooooooooed.' : '.kdoodddddddddk.';
    }

    if (curY === 35) return '.klhbbbbbbsssk.';
    if (curY === 36) return '.klhbbbbbbsssk.';

    // Rib 4 at y=37,38
    if (curY === 37) {
      return glintY === 37 ? '.kwwggggggggyd.' : '.kgyyyyyyyyyyod.';
    }
    if (curY === 38) {
      return glintY === 37 ? '.kgyyooooooooed.' : '.kdoodddddddddk.';
    }

    // Tailband / Rib 5 at y=39
    if (curY === 39) {
      return glintY === 37 ? '.kwwglgbosdk.' : '.kghyblgbosdk.';
    }
    if (curY === 40) return '.kkkkkkkkkkkk.'; // bottom cap

    return '..............';
  }

  // Crimson silk tassel patterns across 8 frames (y: 41..47):
  // dx = [0, 1, 2, 1, 0, -1, -2, -1]
  const tasselPatterns = [
    // Frame 0: dx = 0
    [
      '......cc......', // y=41: cord
      '......cc......', // y=42: cord
      '......yy......', // y=43: gold bead
      '.....crcr.....', // y=44: bell top
      '.....crcr.....', // y=45: bell mid
      '.....krrk.....', // y=46: bell low
      '......rr......'  // y=47: fringe tip
    ],
    // Frame 1: dx = +1
    [
      '......cc......',
      '.......cc.....',
      '.......yy.....',
      '......crcr....',
      '......crcr....',
      '......krrk....',
      '.......rr.....'
    ],
    // Frame 2: dx = +2
    [
      '......cc......',
      '.......cc.....',
      '........yy....',
      '.......crcr...',
      '.......crcr...',
      '.......krrk...',
      '........rr....'
    ],
    // Frame 3: dx = +1
    [
      '......cc......',
      '.......cc.....',
      '.......yy.....',
      '......crcr....',
      '......crcr....',
      '......krrk....',
      '.......rr.....'
    ],
    // Frame 4: dx = 0
    [
      '......cc......',
      '......cc......',
      '......yy......',
      '.....crcr.....',
      '.....crcr.....',
      '.....krrk.....',
      '......rr......'
    ],
    // Frame 5: dx = -1
    [
      '......cc......',
      '.....cc.......',
      '.....yy.......',
      '....crcr......',
      '....crcr......',
      '....krrk......',
      '.....rr.......'
    ],
    // Frame 6: dx = -2
    [
      '......cc......',
      '.....cc.......',
      '....yy........',
      '...crcr.......',
      '...crcr.......',
      '...krrk.......',
      '....rr........'
    ],
    // Frame 7: dx = -1
    [
      '......cc......',
      '.....cc.......',
      '.....yy.......',
      '....crcr......',
      '....crcr......',
      '....krrk......',
      '.....rr.......'
    ]
  ];

  // Glint progression down spine: 1 step per frame
  const glintYs = [4, 7, 11, 17, 26, 29, 33, 37];

  function buildFrames() {
    const frames = [];
    for (let f = 0; f < 8; f++) {
      const gY = glintYs[f];
      const rows = [];
      for (let y = 0; y < 41; y++) {
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
      for (let y = 0; y < 48; y++) {
        const srcY = y - shift;
        if (srcY >= 0 && srcY < 48) {
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
    id: 'band6',
    category: 'library',
    size: [14, 48],
    fps: 8,
    loop: true,
    staticFrame: 0,
    title: 'ENCYCLOPEDIA',
    notes: 'Grand Encyclopedia in dark mahogany leather with 5 raised gilded ribs, ENCYCLOPEDIA cartouche, and crimson silk tassel',
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
