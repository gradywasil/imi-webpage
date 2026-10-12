(function (root) {
  'use strict';

  // 16x16 seamless deep midnight purple/indigo tufted fabric texture
  // Diagonal diamond tufting with central button indentations and plush velvet sheen.
  // Note: asset.tile requires col 0 === col 15 on all rows for seamless horizontal wrap.
  const rows = [
    // 0: Corner tuft button & radiating folds
    "kdsbbllbbllbbsdk",
    // 1: Fold slope & cushion light
    "dkssbbllhllbbskd",
    // 2: Fold & cushion highlight
    "sdkssbbhhhhbbkds",
    // 3: Cushion body & soft shadow crease
    "bsdkssbhhhhbskdb",
    // 4: Upper cushion peak
    "lbsdkssbhhbskdbl",
    // 5: Cushion sheen
    "hlbsdkssbbskdblh",
    // 6: Deepening fold approaching center
    "bhlbsdkkkkskdblb",
    // 7: Deepening fold approaching center
    "bbhlbsdkkkskdblb",
    // 8: Center tuft button indentation
    "sbbhlbsdkkskdbls",
    // 9: Center fold
    "bbhlbsdkkkskdblb",
    // 10: Center fold
    "bhlbsdkkkkskdblb",
    // 11: Cushion sheen
    "hlbsdkssbbskdblh",
    // 12: Lower cushion peak
    "lbsdkssbhhbskdbl",
    // 13: Cushion body & soft shadow crease
    "bsdkssbhhhhbskdb",
    // 14: Fold & cushion highlight
    "sdkssbbhhhhbbkds",
    // 15: Fold slope & cushion light (seamlessly returns to row 0)
    "dkssbbllhllbbskd"
  ];

  const asset = {
    id: 'bg_dark_velvet',
    category: 'chrome',
    size: [16, 16],
    fps: 1,
    loop: true,
    still: true,
    tile: true,
    notes: 'Seamless deep midnight purple and indigo tufted velvet fabric with plush diamond sheen and button tufts',
    palette: {
      '.': null,
      // Velvet Purple Ramp (Look Bible purple ramp)
      'h': '#e4beff', // velvet highlight sheen
      'l': '#b58cf0', // velvet light
      'b': '#7a46bc', // royal velvet base
      's': '#4e2280', // velvet shadow
      'd': '#280c48', // deep velvet crease
      // Ink Midnight Shadow
      'k': '#1a0f14'  // deep button indentation tuft
    },
    frames: [
      { rows }
    ]
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
