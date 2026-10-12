(function (root) {
  'use strict';

  const asset = {
  "id": "tophat",
  "category": "crew",
  "size": [
    16,
    16
  ],
  "fps": 8,
  "loop": true,
  "staticFrame": 0,
  "notes": "Victorian silk top hat with red velvet band and traveling sheen gleam",
  "palette": {
    ".": null,
    "d": "#0a0408",
    "k": "#1a0f14",
    "s": "#343444",
    "b": "#626274",
    "h": "#a4a4b4",
    "w": "#ffffff",
    "r": "#b8322a",
    "l": "#e86a50",
    "x": "#781c16"
  },
  "frames": [
    [
      "................",
      "................",
      "....dddddddd....",
      "....dhhhhhsd....",
      "....dwhhsskd....",
      "....dwhhsskd....",
      "....dwhhsskd....",
      "....dwhhsskd....",
      "....dllrxxkd....",
      "..dddddddddddd..",
      ".dhhhhbbssssskd.",
      "..dddddddddddd..",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "................",
      "....dddddddd....",
      "....dhhhhhsd....",
      "....dhwhsskd....",
      "....dhwhsskd....",
      "....dhwhsskd....",
      "....dhwhsskd....",
      "....dllrxxkd....",
      "..dddddddddddd..",
      "..dhhhbbssssskd.",
      "..ddddddddddddd.",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "................",
      "....dddddddd....",
      "....dhhhhhsd....",
      "....dhhwsskd....",
      "....dhhwsskd....",
      "....dhhwsskd....",
      "....dhhwsskd....",
      "....dlrlxxkd....",
      "..dddddddddddd..",
      "..dhhhbbssssskd.",
      "..ddddddddddddd.",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "................",
      "....dddddddd....",
      "....dhhhhhsd....",
      "....dhwhsskd....",
      "....dhwhsskd....",
      "....dhwhsskd....",
      "....dhwhsskd....",
      "....dlrlxxkd....",
      "..dddddddddddd..",
      ".dhhhhbbssssskd.",
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
