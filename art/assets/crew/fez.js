(function (root) {
  'use strict';

  const asset = {
  "id": "fez",
  "category": "crew",
  "size": [
    16,
    16
  ],
  "fps": 8,
  "loop": true,
  "staticFrame": 0,
  "notes": "Crimson felt fez with golden stud and swinging black silk tassel",
  "palette": {
    ".": null,
    "d": "#420a06",
    "s": "#781c16",
    "b": "#b8322a",
    "l": "#e86a50",
    "h": "#ffaba0",
    "g": "#ffd23a",
    "w": "#fffbe0",
    "k": "#1a0f14",
    "t": "#3a2a30"
  },
  "frames": [
    [
      "................",
      ".......dd.......",
      "......dwgd......",
      ".....dddddd.....",
      "....dhhllssd....",
      "....dhllssbdk...",
      "....dhhllssbkt..",
      "....dhllssbd.k..",
      "....dhhllssbdk..",
      "...dhhlllsssbkd.",
      "...dddddddddddd.",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      ".......dd.......",
      "......dwgd......",
      ".....dddddd.....",
      "....dhhllssd....",
      "....dhllssbd.k..",
      "....dhhllssbd.k.",
      "....dhllssbd..kt",
      "....dhhllssbd.k.",
      "...dhhlllsssbd..",
      "...ddddddddddd..",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      ".......dd.......",
      "......dwgd......",
      ".....dddddd.....",
      "....dhhllssd....",
      "....dhllssbd..k.",
      "....dhhllssbd..k",
      "....dhllssbd..kt",
      "....dhhllssbd.k.",
      "...dhhlllsssbd..",
      "...ddddddddddd..",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      ".......dd.......",
      "......dwgd......",
      ".....dddddd.....",
      "....dhhllssd....",
      "....dhllssbd.k..",
      "....dhhllssbkt..",
      "....dhllssbdk...",
      "....dhhllssbdk..",
      "...dhhlllsssbkd.",
      "...dddddddddddd.",
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
