(function (root) {
  'use strict';

  // Band 1: Novella Folio (APE) - 10x30, 8 frames, 8 fps
  // Rich maroon leather, raised gilded ribs, gold title cartouche with "APE",
  // woven headband, swaying silk bookmark tassel with gold bead, traveling glint.

  const P = {
    '.': null,
    // Maroon Leather Ramp (from RAMPS.red)
    'k': '#420a06', // deep maroon outline
    's': '#781c16', // shadow maroon
    'b': '#b8322a', // base maroon
    'l': '#e86a50', // light maroon
    'h': '#ffaba0', // highlight maroon
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

  // Base rows for book body (y: 0..24)
  // Columns: 0 is margin, 1..8 is spine body, 9 is margin
  function getSpineRow(glintY, curY) {
    if (curY === 0) return '..........';
    if (curY === 1) return '.kkkkkkkk.'; // top cap
    if (curY === 2) return '.kghgbosd.'; // woven headband
    if (curY === 3) return '.klbbbssk.'; // top leather collar

    // Rib 1 at y=4,5
    if (curY === 4) {
      return glintY === 4 ? '.kwwgggyd.' : '.kgyyyyod.';
    }
    if (curY === 5) {
      return glintY === 4 ? '.kgyooood.' : '.kdoodddk.';
    }

    if (curY === 6) return '.klbbbssk.'; // leather spacing

    // Title Cartouche: y=7..19 (inset parchment plate with gold frame)
    if (curY === 7) {
      return glintY === 7 ? '.kwwgggyd.' : '.kgyyyyod.'; // cartouche top frame
    }
    if (curY === 8) {
      return glintY === 7 ? '.gyppppmod.' : '.oyppppmod.'; // cartouche inner top
    }
    // Letter 'A' (y=9..11)
    if (curY === 9) {
      return glintY === 10 ? '.oypwwpmod.' : '.oypttpmod.';
    }
    if (curY === 10) {
      return glintY === 10 ? '.oywwwwmod.' : '.oytmmtmod.';
    }
    if (curY === 11) {
      return glintY === 10 ? '.oytwwtmod.' : '.oytpptmod.';
    }
    // Letter 'P' (y=12..14)
    if (curY === 12) {
      return glintY === 13 ? '.oywwwwmod.' : '.oyttmpmod.';
    }
    if (curY === 13) {
      return glintY === 13 ? '.oytwwtmod.' : '.oytmmtmod.';
    }
    if (curY === 14) {
      return glintY === 13 ? '.oytwwpmod.' : '.oytpppmod.';
    }
    // Letter 'E' (y=15..17)
    if (curY === 15) {
      return glintY === 16 ? '.oywwwwmod.' : '.oytttpmod.';
    }
    if (curY === 16) {
      return glintY === 16 ? '.oytwwmpod.' : '.oytmmpmod.';
    }
    if (curY === 17) {
      return glintY === 16 ? '.oywwwwmod.' : '.oytttpmod.';
    }
    if (curY === 18) {
      return glintY === 18 ? '.gwppppmod.' : '.oyppppmod.'; // cartouche inner bottom
    }
    if (curY === 19) {
      return glintY === 18 ? '.kwwgggyd.' : '.kgyyyyod.'; // cartouche bottom frame
    }

    // Rib 2 at y=20,21
    if (curY === 20) {
      return glintY === 20 ? '.kwwgggyd.' : '.kgyyyyod.';
    }
    if (curY === 21) {
      return glintY === 20 ? '.kgyooood.' : '.kdoodddk.';
    }

    // Tailband at y=22
    if (curY === 22) {
      return glintY === 22 ? '.kwwggosd.' : '.kghgbosd.';
    }
    if (curY === 23) return '.klbbbssk.'; // bottom collar
    if (curY === 24) return '.kkkkkkkk.'; // bottom cap

    return '..........';
  }

  // Tassel positions across 8 frames:
  // dx = [0, 1, 2, 1, 0, -1, -2, -1]
  const tasselPatterns = [
    // Frame 0: dx = 0
    [
      '....bb....', // y=25: cord
      '....bb....', // y=26: cord
      '....yy....', // y=27: gold bead
      '...bsbs...', // y=28: tassel bell
      '...kssk...'  // y=29: fringe tip
    ],
    // Frame 1: dx = +1
    [
      '....bb....', // y=25
      '.....bb...', // y=26
      '.....yy...', // y=27
      '....bsbs..', // y=28
      '....kssk..'  // y=29
    ],
    // Frame 2: dx = +2
    [
      '....bb....', // y=25
      '.....bb...', // y=26
      '......yy..', // y=27
      '.....bsbs.', // y=28
      '.....kssk.'  // y=29
    ],
    // Frame 3: dx = +1
    [
      '....bb....', // y=25
      '.....bb...', // y=26
      '.....yy...', // y=27
      '....bsbs..', // y=28
      '....kssk..'  // y=29
    ],
    // Frame 4: dx = 0
    [
      '....bb....', // y=25
      '....bb....', // y=26
      '....yy....', // y=27
      '...bsbs...', // y=28
      '...kssk...'  // y=29
    ],
    // Frame 5: dx = -1
    [
      '....bb....', // y=25
      '...bb.....', // y=26
      '...yy.....', // y=27
      '..bsbs....', // y=28
      '..kssk....'  // y=29
    ],
    // Frame 6: dx = -2
    [
      '....bb....', // y=25
      '...bb.....', // y=26
      '..yy......', // y=27
      '.bsbs.....', // y=28
      '.kssk.....'  // y=29
    ],
    // Frame 7: dx = -1
    [
      '....bb....', // y=25
      '...bb.....', // y=26
      '...yy.....', // y=27
      '..bsbs....', // y=28
      '..kssk....'  // y=29
    ]
  ];

  // Glint progression down spine: 1 step per frame
  const glintYs = [4, 7, 10, 13, 16, 18, 20, 22];

  function buildFrames() {
    const frames = [];
    for (let f = 0; f < 8; f++) {
      const gY = glintYs[f];
      const rows = [];
      for (let y = 0; y < 25; y++) {
        rows.push(getSpineRow(gY, y));
      }
      const tassel = tasselPatterns[f];
      for (let ty = 0; ty < 5; ty++) {
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
      for (let y = 0; y < 30; y++) {
        const srcY = y - shift;
        if (srcY >= 0 && srcY < 30) {
          rows.push(f0[srcY]);
        } else {
          rows.push('..........');
        }
      }
      pulledFrames.push({ rows });
    }
    return pulledFrames;
  }

  const asset = {
    id: 'band1',
    category: 'library',
    size: [10, 30],
    fps: 8,
    loop: true,
    staticFrame: 0,
    title: 'APE',
    notes: 'Novella Folio in crimson maroon leather with raised gilded ribs, APE cartouche, and swaying silk tassel',
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
