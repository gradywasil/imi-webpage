(function (root) {
  'use strict';

  const asset = {
  "id": "astronaut",
  "category": "crew",
  "size": [
    16,
    16
  ],
  "fps": 8,
  "loop": true,
  "staticFrame": 0,
  "notes": "Space helmet with reflective golden visor and blinking antenna beacon",
  "palette": {
    ".": null,
    "d": "#28304a",
    "s": "#5a7490",
    "b": "#a4bcd4",
    "h": "#d2e2f0",
    "w": "#ffffff",
    "r": "#e86a50",
    "x": "#781c16",
    "g": "#ffd23a",
    "y": "#fff4a0",
    "o": "#d97a0c"
  },
  "frames": [
    [
      "............rr..",
      "............rx..",
      "............dd..",
      "....dddddd..dd..",
      "..ddwhhhhhdddd..",
      ".dwhhhyyyyygosd.",
      ".dwhyywwyyygosd.",
      ".dwhyyyyyyygosd.",
      ".dbssggggggosdd.",
      "..ddbssssssdd...",
      "...dddddddddd...",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "............ww..",
      "............rr..",
      "............dd..",
      "....dddddd..dd..",
      "..ddwhhhhhdddd..",
      ".dwhhhywwyygosd.",
      ".dwhyyyyyyygosd.",
      ".dwhyyyyyyygosd.",
      ".dbssggggggosdd.",
      "..ddbssssssdd...",
      "...dddddddddd...",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      ".............rr.",
      "............dd..",
      "............dd..",
      "....dddddd..dd..",
      "..ddwhhhhhdddd..",
      ".dwhhhyyyyygosd.",
      ".dwhyywwyyygosd.",
      ".dwhyyyyyyygosd.",
      ".dbssggggggosdd.",
      "..ddbssssssdd...",
      "...dddddddddd...",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "............xx..",
      "............dd..",
      "............dd..",
      "....dddddd..dd..",
      "..ddwhhhhhdddd..",
      ".dwhhhyyyyygosd.",
      ".dwhhhywwyygosd.",
      ".dwhyyyyyyygosd.",
      ".dbssggggggosdd.",
      "..ddbssssssdd...",
      "...dddddddddd...",
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
