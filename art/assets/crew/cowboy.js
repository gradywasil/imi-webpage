(function (root) {
  'use strict';

  const asset = {
  "id": "cowboy",
  "category": "crew",
  "size": [
    16,
    16
  ],
  "fps": 8,
  "loop": true,
  "staticFrame": 0,
  "notes": "Brown leather Stetson cowboy hat with dipping brim and glinting gold band",
  "palette": {
    ".": null,
    "d": "#30180a",
    "s": "#5a3517",
    "b": "#8a5a2b",
    "l": "#b57d3e",
    "h": "#eed0a4",
    "k": "#4a2e04",
    "g": "#ffd23a",
    "w": "#fffbe0"
  },
  "frames": [
    [
      "................",
      "................",
      "....dddddd......",
      "...dhlllssbd....",
      "...dlhlllsbd....",
      "...dhhlllssd....",
      "...dlhlllsbd....",
      "...dkgkgggkd....",
      "..ddkkkwkkkdd...",
      ".dhhllbbssshd...",
      "dhhllbbsssssssd.",
      ".ddddddddddddd..",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "................",
      "....dddddd......",
      "...dhlllssbd....",
      "...dlhlllsbd....",
      "...dhhlllssd....",
      "...dlhlllsbd....",
      "...dkgkgggkd....",
      "..ddkwwswkkdd...",
      ".dhhllbbssshd...",
      ".dhhllbbsssssd..",
      "..ddddddddddddd.",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "................",
      "....dddddd......",
      "...dhlllssbd....",
      "...dlhlllsbd....",
      "...dhhlllssd....",
      "...dlhlllsbd....",
      "...dkgkgggkd....",
      "..ddkkkwkkkdd...",
      ".dhhllbbssshd...",
      ".dhhllbbsssssd..",
      "..dddddddddddd..",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "................",
      "....dddddd......",
      "...dhlllssbd....",
      "...dlhlllsbd....",
      "...dhhlllssd....",
      "...dlhlllsbd....",
      "...dkgkgggkd....",
      "..ddkkkgkkkdd...",
      ".dhhllbbssshd...",
      "dhhllbbsssssssd.",
      ".ddddddddddddd..",
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
