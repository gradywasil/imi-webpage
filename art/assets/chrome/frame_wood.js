(function (root) {
  'use strict';

  // 24x24 9-slice master corner/border template: mahogany wood with brass corner brackets
  // Master slice: 7px corners, 10px repeating center span (cols/rows 7..16)
  const rows = [
    // 0: Top outer outline with brass bracket caps
    "kkkkoyddddddddddddyokkkk",
    // 1: Brass bracket top highlight & wood top highlight
    "kggghyWWWWWWWWWWWWyhokkk",
    // 2: Brass bracket body with rivet studs [2,2] and [21,2]
    "kgkhhyllllllllllllhhyokk",
    // 3: Brass bracket lower shelf & wood base
    "kyhooybbbbbbbbbbbbhooyyk",
    // 4: Brass bracket inner bevel & inner bevel shadow
    "khooobssssssssssssbooohk",
    // 5: Brass vertical strap extension with rivet [2,5] and [21,5]
    "kgkhyk............kyhkok",
    // 6: Brass vertical strap rounded tip
    "kyoykd............dkyoyk",
    // 7: Repeating left/right borders
    "dWlbs..............lbssd",
    // 8: Repeating left/right borders
    "dWlbs..............lbssd",
    // 9: Repeating left/right borders
    "dWlbs..............lbssd",
    // 10: Repeating left/right borders
    "dWlbs..............lbssd",
    // 11: Repeating left/right borders
    "dWlbs..............lbssd",
    // 12: Repeating left/right borders
    "dWlbs..............lbssd",
    // 13: Repeating left/right borders
    "dWlbs..............lbssd",
    // 14: Repeating left/right borders
    "dWlbs..............lbssd",
    // 15: Repeating left/right borders
    "dWlbs..............lbssd",
    // 16: Repeating left/right borders
    "dWlbs..............lbssd",
    // 17: Bottom brass vertical strap rounded tip
    "kyoykd............dkyoyk",
    // 18: Bottom brass vertical strap extension with rivet [2,18] and [21,18]
    "kgkhyk............kyhkok",
    // 19: Bottom brass bracket inner bevel & wood bevel
    "khooobllllllllllllbooohk",
    // 20: Bottom brass bracket body & wood base
    "kyhooybbbbbbbbbbbbhooyyk",
    // 21: Bottom brass bracket with rivet studs [2,21] and [21,21]
    "kgkhhybbbbbbbbbbbbhhyokk",
    // 22: Bottom brass bracket lower rim & wood shadow
    "kggghyssssssssssssyhokkk",
    // 23: Bottom outer outline
    "kkkkoyddddddddddddyokkkk"
  ];

  const asset = {
    id: 'frame_wood',
    category: 'chrome',
    size: [24, 24],
    fps: 1,
    loop: true,
    still: true,
    frame: true,
    notes: 'Beveled mahogany frame with brass corner brackets and rivet studs',
    palette: {
      '.': null,
      // Mahogany Wood Ramp (wood / woodD)
      'W': '#eed0a4', // wood highlight
      'l': '#b57d3e', // wood light
      'b': '#7d4f26', // wood base
      's': '#5a3517', // wood shadow
      'd': '#200e05', // wood deep outline
      // Brass Corner Brackets (gold ramp)
      'g': '#fffbe0', // brass glint / highlight
      'h': '#fff08c', // brass light
      'y': '#ffd23a', // brass base
      'o': '#b38004', // brass shadow
      'k': '#4a2e04'  // brass deep outline / screw core
    },
    frames: [
      { rows }
    ]
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
