(function (root) {
  'use strict';

  // Band 2: Poetry Chapbook (SONG) - 11x34, 8 frames, 8 fps
  // Rich amber/cognac leather, raised gilded ribs, gold title cartouche with "SONG",
  // woven headband, emerald green silk bookmark tassel with gold bead, traveling glint.

  const P = {
    '.': null,
    // Amber / Bronze Leather Ramp (from RAMPS.bronze)
    'k': '#3e1e08', // deep bronze outline
    's': '#6e3c16', // shadow amber
    'b': '#a86834', // base amber
    'l': '#dca06a', // light amber
    'h': '#ffe6cc', // highlight amber
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
    // Silk Ribbon Tassel (from RAMPS.leaf)
    'r': '#1a5e24', // dark ribbon shadow
    'c': '#2f8a35'  // base emerald ribbon
  };

  // Base rows for book body (y: 0..27)
  // Columns: 0 is margin, 1..9 is spine body, 10 is margin (width 11)
  function getSpineRow(glintY, curY) {
    if (curY === 0) return '...........';
    if (curY === 1) return '.kkkkkkkkk.'; // top cap
    if (curY === 2) return '.kghygbosdk.'; // woven headband
    if (curY === 3) return '.klhbbbsssk.'; // top leather collar

    // Rib 1 at y=4,5
    if (curY === 4) {
      return glintY === 4 ? '.kwwgggggyd.' : '.kgyyyyyyod.';
    }
    if (curY === 5) {
      return glintY === 4 ? '.kgyyoooood.' : '.kdoodddddk.';
    }

    if (curY === 6) return '.klhbbbsssk.'; // leather spacing

    // Title Cartouche: y=7..22 (inset parchment plate with gold frame)
    if (curY === 7) {
      return glintY === 7 ? '.kwwgggggyd.' : '.kgyyyyyyod.'; // cartouche top frame
    }
    if (curY === 8) {
      return glintY === 7 ? '.gyppppppmod.' : '.oyppppppmod.'; // cartouche inner top
    }
    // Letter 'S' (y=9..11)
    if (curY === 9) {
      return glintY === 10 ? '.oypwwpppmod.' : '.oypttpppmod.';
    }
    if (curY === 10) {
      return glintY === 10 ? '.oypwwwwpmod.' : '.oyptmmtpmod.';
    }
    if (curY === 11) {
      return glintY === 10 ? '.oyppwwppmod.' : '.oyppttppmod.';
    }
    // Letter 'O' (y=12..14)
    if (curY === 12) {
      return glintY === 13 ? '.oypwwwwpmod.' : '.oypttttpmod.';
    }
    if (curY === 13) {
      return glintY === 13 ? '.oytwppwtmod.' : '.oytmppmwmod.';
    }
    if (curY === 14) {
      return glintY === 13 ? '.oypwwwwpmod.' : '.oypttttpmod.';
    }
    // Letter 'N' (y=15..17)
    if (curY === 15) {
      return glintY === 16 ? '.oytwppwtmod.' : '.oytmppmwmod.';
    }
    if (curY === 16) {
      return glintY === 16 ? '.oytwwpwtmod.' : '.oytmmpmtmod.';
    }
    if (curY === 17) {
      return glintY === 16 ? '.oytwppwtmod.' : '.oytmppmwmod.';
    }
    // Letter 'G' (y=18..20)
    if (curY === 18) {
      return glintY === 19 ? '.oypwwwwpmod.' : '.oypttttpmod.';
    }
    if (curY === 19) {
      return glintY === 19 ? '.oytwppwtmod.' : '.oytmpmttmod.';
    }
    if (curY === 20) {
      return glintY === 19 ? '.oypwwwwpmod.' : '.oypttttpmod.';
    }
    if (curY === 21) {
      return glintY === 22 ? '.gwppppppmod.' : '.oyppppppmod.'; // cartouche inner bottom
    }
    if (curY === 22) {
      return glintY === 22 ? '.kwwgggggyd.' : '.kgyyyyyyod.'; // cartouche bottom frame
    }

    // Rib 2 at y=23,24
    if (curY === 23) {
      return glintY === 23 ? '.kwwgggggyd.' : '.kgyyyyyyod.';
    }
    if (curY === 24) {
      return glintY === 23 ? '.kgyyoooood.' : '.kdoodddddk.';
    }

    // Tailband at y=25
    if (curY === 25) {
      return glintY === 25 ? '.kwwgggosdk.' : '.kghygbosdk.';
    }
    if (curY === 26) return '.klhbbbsssk.'; // bottom collar
    if (curY === 27) return '.kkkkkkkkk.'; // bottom cap

    return '...........';
  }

  // Emerald green silk tassel patterns across 8 frames (y: 28..33):
  // dx = [0, 1, 2, 1, 0, -1, -2, -1]
  const tasselPatterns = [
    // Frame 0: dx = 0
    [
      '.....cc....', // y=28: cord
      '.....cc....', // y=29: cord
      '.....yy....', // y=30: gold bead
      '....crcr...', // y=31: bell
      '....crcr...', // y=32: bell
      '....krk....'  // y=33: fringe tip
    ],
    // Frame 1: dx = +1
    [
      '.....cc....',
      '......cc...',
      '......yy...',
      '.....crcr..',
      '.....crcr..',
      '.....krk...'
    ],
    // Frame 2: dx = +2
    [
      '.....cc....',
      '......cc...',
      '.......yy..',
      '......crcr.',
      '......crcr.',
      '......krk..'
    ],
    // Frame 3: dx = +1
    [
      '.....cc....',
      '......cc...',
      '......yy...',
      '.....crcr..',
      '.....crcr..',
      '.....krk...'
    ],
    // Frame 4: dx = 0
    [
      '.....cc....',
      '.....cc....',
      '.....yy....',
      '....crcr...',
      '....crcr...',
      '....krk....'
    ],
    // Frame 5: dx = -1
    [
      '.....cc....',
      '....cc.....',
      '....yy.....',
      '...crcr....',
      '...crcr....',
      '...krk.....'
    ],
    // Frame 6: dx = -2
    [
      '.....cc....',
      '....cc.....',
      '...yy......',
      '..crcr.....',
      '..crcr.....',
      '..krk......'
    ],
    // Frame 7: dx = -1
    [
      '.....cc....',
      '....cc.....',
      '....yy.....',
      '...crcr....',
      '...crcr....',
      '...krk.....'
    ]
  ];

  // Glint progression down spine: 1 step per frame
  const glintYs = [4, 7, 10, 13, 16, 19, 22, 25];

  function buildFrames() {
    const frames = [];
    for (let f = 0; f < 8; f++) {
      const gY = glintYs[f];
      const rows = [];
      for (let y = 0; y < 28; y++) {
        rows.push(getSpineRow(gY, y));
      }
      const tassel = tasselPatterns[f];
      for (let ty = 0; ty < 6; ty++) {
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
      for (let y = 0; y < 34; y++) {
        const srcY = y - shift;
        if (srcY >= 0 && srcY < 34) {
          rows.push(f0[srcY]);
        } else {
          rows.push('...........');
        }
      }
      pulledFrames.push({ rows });
    }
    return pulledFrames;
  }

  const asset = {
    id: 'band2',
    category: 'library',
    size: [11, 34],
    fps: 8,
    loop: true,
    staticFrame: 0,
    title: 'SONG',
    notes: 'Poetry Chapbook in amber cognac leather with raised gilded ribs, SONG cartouche, and emerald silk tassel',
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
