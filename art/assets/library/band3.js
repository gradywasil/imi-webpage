(function (root) {
  'use strict';

  // Band 3: Adventure Chronicle (JUNGLE) - 12x38, 8 frames, 8 fps
  // Rich leaf green leather, raised gilded ribs, gold title cartouche with "JUNGLE",
  // woven headband, crimson silk bookmark tassel with gold bead, traveling glint.

  const P = {
    '.': null,
    // Leaf Green Leather Ramp (from RAMPS.leaf)
    'k': '#0c3012', // deep green outline
    's': '#1a5e24', // shadow green
    'b': '#2f8a35', // base green
    'l': '#74c648', // light green
    'h': '#a8ec76', // highlight green
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

  // Base rows for book body (y: 0..30)
  // Columns: 0 is margin, 1..10 is spine body, 11 is margin (width 12)
  function getSpineRow(glintY, curY) {
    if (curY === 0) return '............';
    if (curY === 1) return '.kkkkkkkkkk.'; // top cap
    if (curY === 2) return '.kghylgbosdk.'; // woven headband
    if (curY === 3) return '.klhbbbbsssk.'; // top leather collar

    // Rib 1 at y=4,5
    if (curY === 4) {
      return glintY === 4 ? '.kwwggggggyd.' : '.kgyyyyyyyod.';
    }
    if (curY === 5) {
      return glintY === 4 ? '.kgyyooooood.' : '.kdooddddddk.';
    }

    if (curY === 6) return '.klhbbbbsssk.'; // leather spacing

    // Title Cartouche: y=7..24 (inset parchment plate with gold frame)
    if (curY === 7) {
      return glintY === 7 ? '.kwwggggggyd.' : '.kgyyyyyyyod.'; // cartouche top frame
    }
    if (curY === 8) {
      return glintY === 7 ? '.gyppppppppmod.' : '.oyppppppppmod.'; // cartouche inner top
    }
    // Letter 'J' (y=9, 10)
    if (curY === 9) {
      return glintY === 10 ? '.oypwwppppmod.' : '.oyptttpppmmod.';
    }
    if (curY === 10) {
      return glintY === 10 ? '.oyptwwppptod.' : '.oyptmmppptod.';
    }
    // Letter 'U' (y=11, 12)
    if (curY === 11) {
      return glintY === 10 ? '.oytwwppwwtod.' : '.oytmppptmtod.';
    }
    if (curY === 12) {
      return glintY === 10 ? '.oypwwwwwwpmod.' : '.oypttttttpmod.';
    }
    // Letter 'N' (y=13, 14)
    if (curY === 13) {
      return glintY === 14 ? '.oytwwppwwtod.' : '.oytmppmwmtod.';
    }
    if (curY === 14) {
      return glintY === 14 ? '.oytwwwwwwtod.' : '.oytmmwmmmtod.';
    }
    // Letter 'G' (y=15, 16)
    if (curY === 15) {
      return glintY === 14 ? '.oypwwwwwwpmod.' : '.oypttttttpmod.';
    }
    if (curY === 16) {
      return glintY === 14 ? '.oytwppwwwwod.' : '.oytmpmttttod.';
    }
    // Letter 'L' (y=17, 18)
    if (curY === 17) {
      return glintY === 18 ? '.oytwpppppmod.' : '.oytmpppppmod.';
    }
    if (curY === 18) {
      return glintY === 18 ? '.oytwwwwwwpod.' : '.oyttttttmpod.';
    }
    // Letter 'E' (y=19, 20)
    if (curY === 19) {
      return glintY === 18 ? '.oypwwwwwwpod.' : '.oypttttttmpod.';
    }
    if (curY === 20) {
      return glintY === 18 ? '.oypwwppwwpod.' : '.oyptmmpttmpod.';
    }
    if (curY === 21) {
      return glintY === 18 ? '.oypwwwwwwpod.' : '.oypttttttmpod.';
    }
    if (curY === 22) return '.oyppppppppmod.'; // inner parchment space
    if (curY === 23) {
      return glintY === 24 ? '.gwppppppppmod.' : '.oyppppppppmod.'; // cartouche inner bottom
    }
    if (curY === 24) {
      return glintY === 24 ? '.kwwggggggyd.' : '.kgyyyyyyyod.'; // cartouche bottom frame
    }

    // Rib 2 at y=25,26
    if (curY === 25) {
      return glintY === 26 ? '.kwwggggggyd.' : '.kgyyyyyyyod.';
    }
    if (curY === 26) {
      return glintY === 26 ? '.kgyyooooood.' : '.kdooddddddk.';
    }

    if (curY === 27) return '.klhbbbbsssk.'; // leather collar

    // Tailband / Rib 3 at y=28,29
    if (curY === 28) {
      return glintY === 29 ? '.kwwggggggyd.' : '.kgyyyyyyyod.';
    }
    if (curY === 29) {
      return glintY === 29 ? '.kwwglgbosdk.' : '.kghylgbosdk.';
    }
    if (curY === 30) return '.kkkkkkkkkk.'; // bottom cap

    return '............';
  }

  // Crimson silk tassel patterns across 8 frames (y: 31..37):
  // dx = [0, 1, 2, 1, 0, -1, -2, -1]
  const tasselPatterns = [
    // Frame 0: dx = 0
    [
      '.....cc.....', // y=31: cord
      '.....cc.....', // y=32: cord
      '.....yy.....', // y=33: gold bead
      '....crcr....', // y=34: bell
      '....crcr....', // y=35: bell
      '....krrk....', // y=36: bell low
      '.....rr.....'  // y=37: fringe tip
    ],
    // Frame 1: dx = +1
    [
      '.....cc.....',
      '......cc....',
      '......yy....',
      '.....crcr...',
      '.....crcr...',
      '.....krrk...',
      '......rr....'
    ],
    // Frame 2: dx = +2
    [
      '.....cc.....',
      '......cc....',
      '.......yy...',
      '......crcr..',
      '......crcr..',
      '......krrk..',
      '.......rr...'
    ],
    // Frame 3: dx = +1
    [
      '.....cc.....',
      '......cc....',
      '......yy....',
      '.....crcr...',
      '.....crcr...',
      '.....krrk...',
      '......rr....'
    ],
    // Frame 4: dx = 0
    [
      '.....cc.....',
      '.....cc.....',
      '.....yy.....',
      '....crcr....',
      '....crcr....',
      '....krrk....',
      '.....rr.....'
    ],
    // Frame 5: dx = -1
    [
      '.....cc.....',
      '....cc......',
      '....yy......',
      '...crcr.....',
      '...crcr.....',
      '...krrk.....',
      '....rr......'
    ],
    // Frame 6: dx = -2
    [
      '.....cc.....',
      '....cc......',
      '...yy.......',
      '..crcr......',
      '..crcr......',
      '..krrk......',
      '...rr.......'
    ],
    // Frame 7: dx = -1
    [
      '.....cc.....',
      '....cc......',
      '....yy......',
      '...crcr.....',
      '...crcr.....',
      '...krrk.....',
      '....rr......'
    ]
  ];

  // Glint progression down spine: 1 step per frame
  const glintYs = [4, 7, 10, 14, 18, 24, 26, 29];

  function buildFrames() {
    const frames = [];
    for (let f = 0; f < 8; f++) {
      const gY = glintYs[f];
      const rows = [];
      for (let y = 0; y < 31; y++) {
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
      for (let y = 0; y < 38; y++) {
        const srcY = y - shift;
        if (srcY >= 0 && srcY < 38) {
          rows.push(f0[srcY]);
        } else {
          rows.push('............');
        }
      }
      pulledFrames.push({ rows });
    }
    return pulledFrames;
  }

  const asset = {
    id: 'band3',
    category: 'library',
    size: [12, 38],
    fps: 8,
    loop: true,
    staticFrame: 0,
    title: 'JUNGLE',
    notes: 'Adventure Chronicle in leaf green leather with raised gilded ribs, JUNGLE cartouche, and crimson silk tassel',
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
