(function (root) {
  'use strict';

  const asset = {
  "id": "viking",
  "category": "crew",
  "size": [
    16,
    16
  ],
  "fps": 8,
  "loop": true,
  "staticFrame": 0,
  "notes": "Iron horned spangenhelm with bone horns and glinting horn tips",
  "palette": {
    ".": null,
    "d": "#343444",
    "s": "#626274",
    "m": "#a4a4b4",
    "h": "#d8d8e4",
    "w": "#ffffff",
    "k": "#786842",
    "i": "#fff6d6",
    "p": "#ede0b8",
    "t": "#c9b88a"
  },
  "frames": [
    [
      "..kk........kk..",
      ".kik........kik.",
      ".kpk........kpk.",
      "..ktk.dddd.ktk..",
      "..kpkdhhhhsdpk..",
      "...kdhmwwmhsdk..",
      "....dhmssmhsd...",
      "....dhmssmhsd...",
      "...ddhmmmmmsdd..",
      "..dddddddddddd..",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      ".kww........kk..",
      ".kwk........kik.",
      ".kpk........kpk.",
      "..ktk.dddd.ktk..",
      "..kpkdhhhhsdpk..",
      "...kdhmwwmhsdk..",
      "....dhmssmhsd...",
      "....dhmssmhsd...",
      "...ddhmmmmmsdd..",
      "..dddddddddddd..",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "..kk........kk..",
      ".kik........kik.",
      ".kpk........kpk.",
      "..ktk.dddd.ktk..",
      "..kpkdhwwxsdpk..",
      "...kdhmssmhsdk..",
      "....dhmssmhsd...",
      "....dhmssmhsd...",
      "...ddhmmmmmsdd..",
      "..dddddddddddd..",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "..kk........wwk.",
      ".kik........kwk.",
      ".kpk........kpk.",
      "..ktk.dddd.ktk..",
      "..kpkdhhhhsdpk..",
      "...kdhmhsmhsdk..",
      "....dhmssmhsd...",
      "....dhmssmhsd...",
      "...ddhmmmmmsdd..",
      "..dddddddddddd..",
      "................",
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
