(function (root) {
  'use strict';

  // 16x16 seamless ledger grid paper in pale cream with subtle blue ruling
  // Dual 8x8 ledger grid cells (ruled at row 0, 8, 15 and col 0, 8, 15).
  // Note: asset.tile requires col 0 === col 15 on all rows for seamless horizontal wrap.
  const rows = [
    // 0: Horizontal major ledger blue ruling (with line intersections at 0, 8, 15)
    "CbbbbbbCbbbbbbCC",
    // 1: Cream paper field with fine paper fibers
    "bppwppppbpwppppb",
    // 2: Cream paper field
    "bpppppppbppppppb",
    // 3: Cream paper field with subtle fiber speckle
    "bppfppppbpffpppb",
    // 4: Cream paper field
    "bpppppppbppppppb",
    // 5: Cream paper field
    "bpwpppppbppwpppb",
    // 6: Cream paper field
    "bpppppppbppppppb",
    // 7: Cream paper field
    "bpppppppbppppppb",
    // 8: Horizontal mid ledger blue ruling
    "CbbbbbbCbbbbbbCC",
    // 9: Cream paper field
    "bpppppppbppppppb",
    // 10: Cream paper field with subtle fiber speckle
    "bpffppppbpwppppb",
    // 11: Cream paper field
    "bpppppppbppppppb",
    // 12: Cream paper field
    "bppwppppbpffpppb",
    // 13: Cream paper field
    "bpppppppbppppppb",
    // 14: Cream paper field
    "bpppppppbppppppb",
    // 15: Horizontal lower ledger blue ruling (loops back to row 0)
    "CbbbbbbCbbbbbbCC"
  ];

  // Validate dimensions and tile seam
  rows.forEach((r, y) => {
    if (r.length !== 16) throw new Error(`Row ${y} length is ${r.length}, expected 16`);
    if (r[0] !== r[15]) throw new Error(`Row ${y} seam mismatch: col 0 is '${r[0]}', col 15 is '${r[15]}'`);
  });

  const asset = {
    id: 'bg_paper_grid',
    category: 'chrome',
    size: [16, 16],
    fps: 1,
    loop: true,
    still: true,
    tile: true,
    notes: 'Seamless vintage ledger grid paper in pale cream with subtle blue ruling and paper grain',
    palette: {
      '.': null,
      // Cream Ledger Paper Ramp
      'w': '#ffffff', // paper bright fiber highlight
      'p': '#fff6d6', // ledger pale cream base
      'f': '#ede0b8', // subtle parchment fiber speck
      // Vintage Blue Ledger Ruling (blue ramp)
      'b': '#5470d8', // subtle blue ruling line
      'C': '#2e44a8'  // grid ruling intersection dot
    },
    frames: [
      { rows }
    ]
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
