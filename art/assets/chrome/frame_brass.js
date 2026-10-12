(function (root) {
  'use strict';

  // 24x24 9-slice master corner/border template: polished nautical brass frame with rivet studs
  // Master slice: 7px corners, 10px repeating center span (cols/rows 7..16)
  // Domed nautical rivets at [2..4, 2..4], [19..21, 2..4], [2..4, 19..21], [19..21, 19..21]
  const rows = [
    // 0: Outer top outline
    "dddddddddddddddddddddddd",
    // 1: Top specular rim highlight
    "dggggggggggggggggggggggd",
    // 2: Brass plate with corner domed rivets
    "dghwwsyyhhyyhhyyhhswwhsd",
    // 3: Rivet center with specular highlight
    "dgwyyshhyyhhyyhhyysyywsd",
    // 4: Rivet base & inner bevel shadow
    "dysscksssssssssssskcskkd",
    // 5: Inner border & window interior
    "dhsk................kskd",
    // 6: Repeating border transition
    "dhsk................kskd",
    // 7: Left & right repeating brass borders
    "dgyhk..............ksskd",
    // 8: Left & right repeating brass borders
    "dgyhk..............ksskd",
    // 9: Left & right repeating brass borders
    "dgyhk..............ksskd",
    // 10: Left & right repeating brass borders
    "dgyhk..............ksskd",
    // 11: Left & right repeating brass borders
    "dgyhk..............ksskd",
    // 12: Left & right repeating brass borders
    "dgyhk..............ksskd",
    // 13: Left & right repeating brass borders
    "dgyhk..............ksskd",
    // 14: Left & right repeating brass borders
    "dgyhk..............ksskd",
    // 15: Left & right repeating brass borders
    "dgyhk..............ksskd",
    // 16: Left & right repeating brass borders
    "dgyhk..............ksskd",
    // 17: Bottom corner transition
    "dhsk................kskd",
    // 18: Bottom corner transition
    "dhsk................kskd",
    // 19: Bottom inner bevel & rivet top
    "dgsskkllllllllllllkksskd",
    // 20: Bottom rivet center
    "dgwyyshhyyhhyyhhyysyywsd",
    // 21: Bottom rivet base
    "dghwwsyyhhyyhhyyhhswwhsd",
    // 22: Bottom shadow rim
    "dssssssssssssssssssssssd",
    // 23: Bottom outer outline
    "kkkkkkkkkkkkkkkkkkkkkkkk"
  ];

  const asset = {
    id: 'frame_brass',
    category: 'chrome',
    size: [24, 24],
    fps: 1,
    loop: true,
    still: true,
    frame: true,
    notes: 'Polished nautical brass frame with rivet studs and beveled luster',
    palette: {
      '.': null,
      'w': '#ffffff', // specular glint
      'g': '#fffbe0', // gold highlight
      'h': '#fff08c', // gold light
      'y': '#ffd23a', // gold base
      'l': '#e8b878', // warm reflection light
      's': '#b38004', // gold shadow
      'c': '#6e3c16', // bronze deep shadow
      'd': '#4a2e04', // gold deep outline
      'k': '#3e1e08'  // deep nautical rivet outline
    },
    frames: [
      { rows }
    ]
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
