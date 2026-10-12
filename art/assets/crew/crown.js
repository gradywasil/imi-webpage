(function (root) {
  'use strict';

  const asset = {
  "id": "crown",
  "category": "crew",
  "size": [
    16,
    16
  ],
  "fps": 8,
  "loop": true,
  "staticFrame": 0,
  "notes": "Golden royal crown studded with sparkling rubies and emeralds",
  "palette": {
    ".": null,
    "d": "#4a2e04",
    "s": "#b38004",
    "g": "#ffd23a",
    "y": "#fff08c",
    "w": "#fffbe0",
    "r": "#e86a50",
    "x": "#781c16",
    "p": "#ffaba0",
    "e": "#74c648",
    "m": "#1a5e24",
    "q": "#a8ec76"
  },
  "frames": [
    [
      "................",
      "................",
      ".......dd.......",
      "..dd..dwwd..dd..",
      ".dygd.dyyd.dygd.",
      ".dsgd.dsgd.dsgd.",
      ".dgyddgyyddgyd..",
      ".dgeedgrrxdgeed.",
      ".dgmddgxxddgmdd.",
      ".dgyyggsgggyyd..",
      "..dddddddddddd..",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "................",
      ".......dd.......",
      "..dd..dwwd..dd..",
      ".dygd.dwwd.dygd.",
      ".dsgd.dsgd.dsgd.",
      ".dgyddgwyddgyd..",
      ".dgqqdgrrxdgeed.",
      ".dgmedgxxddgmdd.",
      ".dgyyggsgggyyd..",
      "..dddddddddddd..",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "................",
      ".......dd.......",
      "..dd..dyyd..dd..",
      ".dygd.dyyd.dwwd.",
      ".dsgd.dsgd.dsgd.",
      ".dgyddgyyddgwyd.",
      ".dgeedgppxdgeed.",
      ".dgmddgrxddgmdd.",
      "..dgyyggsgggyyd.",
      "..dddddddddddd..",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "................",
      ".......dd.......",
      "..dd..dyyd..dd..",
      ".dwwd.dyyd.dygd.",
      ".dsgd.dsgd.dsgd.",
      ".dgwddgyyddgyd..",
      ".dgeedgrrxdgqqd.",
      ".dgmddgxxddgmed.",
      "..dgyyggsgggyyd.",
      "..dddddddddddd..",
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
