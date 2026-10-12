(function (root) {
  'use strict';

  // 24x24 9-slice master corner/border template: aged deckle-edge vellum border with sepia ink ruling
  // Master slice: 7px corners, 10px repeating center span (cols/rows 7..16)
  // Double sepia hairline rules (outer row 2, inner row 4) with decorative loop flourishes at corners
  const rows = [
    // 0: Aged deckle paper edge with subtle deckle nibs
    "ddssddsdsdsdsdsdsdsddssd",
    // 1: Vellum margin tone
    "dppppppppppppppppppppppd",
    // 2: Outer sepia hairline & corner loop knots
    "spkSIkSSSSSSSSSSSSkISkps",
    // 3: Vellum channel between hairline rules
    "spIbpIbbbbbbbbbbbbIpbIps",
    // 4: Inner sepia hairline & corner loop turn
    "spkSIkIIIIIIIIIIIIkISkps",
    // 5: Inner vellum bevel & window margin
    "dpss................sspd",
    // 6: Window margin
    "dpss................sspd",
    // 7: Repeating left/right paper border with sepia rules
    "dsISs..............sISsd",
    // 8: Repeating left/right paper border with sepia rules
    "dsISs..............sISsd",
    // 9: Repeating left/right paper border with sepia rules
    "dsISs..............sISsd",
    // 10: Repeating left/right paper border with sepia rules
    "dsISs..............sISsd",
    // 11: Repeating left/right paper border with sepia rules
    "dsISs..............sISsd",
    // 12: Repeating left/right paper border with sepia rules
    "dsISs..............sISsd",
    // 13: Repeating left/right paper border with sepia rules
    "dsISs..............sISsd",
    // 14: Repeating left/right paper border with sepia rules
    "dsISs..............sISsd",
    // 15: Repeating left/right paper border with sepia rules
    "dsISs..............sISsd",
    // 16: Repeating left/right paper border with sepia rules
    "dsISs..............sISsd",
    // 17: Bottom window margin
    "dpss................sspd",
    // 18: Bottom window margin
    "dpss................sspd",
    // 19: Bottom inner sepia hairline & corner loop turn
    "spkSIkIIIIIIIIIIIIkISkps",
    // 20: Bottom vellum channel between hairline rules
    "spIbpIbbbbbbbbbbbbIpbIps",
    // 21: Bottom outer sepia hairline & corner loop knots
    "spkSIkSSSSSSSSSSSSkISkps",
    // 22: Bottom vellum margin tone
    "dssssssssssssssssssssssd",
    // 23: Bottom deckle paper edge with subtle nibs
    "ddssddsdsdsdsdsdsdsddssd"
  ];

  const asset = {
    id: 'frame_paper',
    category: 'chrome',
    size: [24, 24],
    fps: 1,
    loop: true,
    still: true,
    frame: true,
    notes: 'Aged deckle-edge vellum border with sepia ink ruling and corner knot flourishes',
    palette: {
      '.': null,
      // Vellum / Aged Paper Ramp
      'w': '#ffffff', // vellum highlight
      'p': '#fff6d6', // vellum light
      'b': '#ede0b8', // vellum base
      's': '#c9b88a', // vellum aged shadow
      'd': '#786842', // deckle fiber edge outline
      // Sepia Ink Ramp (stem / ink)
      'i': '#ba8860', // sepia ink light
      'I': '#7a4c28', // sepia ink base
      'S': '#52301a', // sepia ink dark ruling
      'k': '#361d0e'  // sepia deep ink flourish knot
    },
    frames: [
      { rows }
    ]
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
