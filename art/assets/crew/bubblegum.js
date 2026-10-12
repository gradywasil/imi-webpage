(function (root) {
  'use strict';

  const asset = {
  "id": "bubblegum",
  "category": "crew",
  "size": [
    16,
    16
  ],
  "fps": 8,
  "loop": true,
  "staticFrame": 0,
  "notes": "Chewing gum inflating into glossy round bubble with curved shine then popping back",
  "palette": {
    ".": null,
    "d": "#8a2040",
    "s": "#c8486c",
    "b": "#f08aa4",
    "h": "#ffb8cc",
    "w": "#ffffff",
    "k": "#724220",
    "m": "#b97c4c"
  },
  "frames": [
    [
      "................",
      "................",
      "................",
      "....mmmmmmmm....",
      "...mkkkkkkkkm...",
      "..mkkkddddkkkm..",
      "..mkkdwhhbdkkm..",
      "..mkkdhhbbdkkm..",
      "..mkkkddddkkkm..",
      "...mkkkkkkkkm...",
      "....mmmmmmmm....",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "................",
      ".....dddddd.....",
      "....dwhhhbbd....",
      "...dwhhhhbbbd...",
      "..mdwhhhhhbbsdm.",
      "..mdhhhhbbbbsdm.",
      "..mdhhbbbbsssdm.",
      "...dsbbsssssd...",
      "....dddddddd....",
      "....mmmmmmmm....",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "....dddddddd....",
      "...dwwwhhhhhbd..",
      "..dwhhhhhbbbbd..",
      "..dwhhhhhbbbbd..",
      ".dwhhhhbbbbbbsd.",
      ".dwhhhhbbbbbbsd.",
      ".dhhhhbbbbssssd.",
      "..dbbbbbsssssd..",
      "..dsbbsssssssd..",
      "...dddddddddd...",
      "....mmmmmmmm....",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "................",
      "................",
      "....mmmmmmmm....",
      "...mkkkddkkkm...",
      "..mkkdwhhbdkkm..",
      "..mkkdhhbbdkkm..",
      "..mkkdsbbsdkkm..",
      "..mkkkddddkkkm..",
      "...mkkkkkkkkm...",
      "....mmmmmmmm....",
      "................",
      "................",
      "................",
      "................",
      "................"
    ]
  ]
};

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
