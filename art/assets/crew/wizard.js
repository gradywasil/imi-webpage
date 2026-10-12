(function (root) {
  'use strict';

  const asset = {
  "id": "wizard",
  "category": "crew",
  "size": [
    16,
    16
  ],
  "fps": 8,
  "loop": true,
  "staticFrame": 0,
  "notes": "Mystic crooked wizard hat with magical hovering tip and starlight sparkles",
  "palette": {
    ".": null,
    "d": "#280c48",
    "s": "#4e2280",
    "b": "#7a46bc",
    "l": "#b58cf0",
    "w": "#e4beff",
    "y": "#ffd23a",
    "g": "#fff7b0",
    "k": "#624406"
  },
  "frames": [
    [
      "................",
      "..........ddd...",
      ".........dwlsd..",
      "........dwlsd...",
      ".......dwlsd....",
      "......dwlbsd....",
      ".....dwlybsd....",
      "....dwlbsssd....",
      "...dwlybbsssd...",
      "..dddddddddddd..",
      ".dwllllbbbssssd.",
      "..dddddddddddd..",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "..........g.....",
      ".........dgd....",
      "........dwlsd...",
      ".......dwlsd....",
      "......dwlbsd....",
      ".....dwlgbsd....",
      "....dwlbsssd....",
      "...dwlybbsssd...",
      "..dddddddddddd..",
      ".dwllllbbbssssd.",
      "..dddddddddddd..",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      ".........gkg....",
      "..........d.....",
      ".........dwlsd..",
      "........dwlsd...",
      "......dwlbsd....",
      ".....dwlybsd....",
      "....dwlbsssd....",
      "...dwlybbsssd...",
      "..dddddddddddd..",
      ".dwllllbbbssssd.",
      "..dddddddddddd..",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "..........d.....",
      ".........dwlsd..",
      "........dwlsd...",
      ".......dwlsd....",
      "......dwlbsd....",
      ".....dwlybsd....",
      "....dwlbsssd....",
      "...dwlybbsssd...",
      "..dddddddddddd..",
      ".dwllllbbbssssd.",
      "..dddddddddddd..",
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
