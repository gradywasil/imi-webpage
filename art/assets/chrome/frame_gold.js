(function (root) {
  'use strict';

  // 24x24 9-slice master corner/border template: gilded ornate rococo frame with corner scroll rosettes
  // Master slice: 7px corners, 10px repeating center span (cols/rows 7..16)
  // Rococo corner rosettes at [2..5, 2..5], [18..21, 2..5], [2..5, 18..21], [18..21, 18..21]
  const rows = [
    // 0: Outer gilded rococo rim outline
    "ddddkkyddddddddddykkdddd",
    // 1: Outer gold highlight bead & scroll crests
    "dwwwhhsssssssssssshhwwwd",
    // 2: Rococo scroll curl & fluted molding
    "dwhywdhhhhhhhhhhhhdwyhsd",
    // 3: Rosette floret core with specular glints
    "dwwyydyyyyyyyyyyyydyywwd",
    // 4: Rosette lower petals & inner shadow
    "dshsdsssssssssssssssdhsd",
    // 5: Inner rosette relief curl & window margin
    "kddk................kddk",
    // 6: Window margin transition
    "kddk................kddk",
    // 7: Repeating left/right gilded rococo borders
    "dwhydd............ddhscd",
    // 8: Repeating left/right gilded rococo borders
    "dwhydd............ddhscd",
    // 9: Repeating left/right gilded rococo borders
    "dwhydd............ddhscd",
    // 10: Repeating left/right gilded rococo borders
    "dwhydd............ddhscd",
    // 11: Repeating left/right gilded rococo borders
    "dwhydd............ddhscd",
    // 12: Repeating left/right gilded rococo borders
    "dwhydd............ddhscd",
    // 13: Repeating left/right gilded rococo borders
    "dwhydd............ddhscd",
    // 14: Repeating left/right gilded rococo borders
    "dwhydd............ddhscd",
    // 15: Repeating left/right gilded rococo borders
    "dwhydd............ddhscd",
    // 16: Repeating left/right gilded rococo borders
    "dwhydd............ddhscd",
    // 17: Bottom window margin transition
    "kddk................kddk",
    // 18: Bottom window margin transition
    "kddk................kddk",
    // 19: Bottom rosette relief & inner bevel reflection
    "dshsdhhhhhhhhhhhhhhsdhsd",
    // 20: Bottom rosette floret core
    "dwwyydyyyyyyyyyyyydyywwd",
    // 21: Bottom scroll curl & cove molding
    "dwhywdssssssssssssdwyhsd",
    // 22: Bottom shadow rim & scroll bases
    "dssshhzzzzzzzzzzzzhhsssd",
    // 23: Bottom outer outline
    "kkkkkkykkkkkkkkkkykkkkkk"
  ];

  const asset = {
    id: 'frame_gold',
    category: 'chrome',
    size: [24, 24],
    fps: 1,
    loop: true,
    still: true,
    frame: true,
    notes: 'Gilded ornate rococo frame with corner scroll rosettes and fluted molding',
    palette: {
      '.': null,
      'w': '#fffbe0', // gold specular highlight
      'h': '#fff08c', // gold light
      'y': '#ffd23a', // gold rich base
      's': '#b38004', // gold shadow
      'd': '#4a2e04', // gold deep carving outline
      'c': '#a86834', // antique bronze midtone
      'z': '#6e3c16', // antique bronze deep shadow
      'k': '#3e1e08'  // deep hollow / cleft shadow
    },
    frames: [
      { rows }
    ]
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
