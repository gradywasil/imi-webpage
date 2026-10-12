(function (root) {
  'use strict';

  const asset = {
  "id": "chef",
  "category": "crew",
  "size": [
    16,
    16
  ],
  "fps": 8,
  "loop": true,
  "staticFrame": 0,
  "notes": "Pleated white toque blanche with gentle culinary bounce",
  "palette": {
    ".": null,
    "w": "#ffffff",
    "h": "#fff6d6",
    "b": "#ede0b8",
    "s": "#c9b88a",
    "d": "#786842"
  },
  "frames": [
    [
      "................",
      ".....dddddd.....",
      "...ddwwhhhwdd...",
      "..dwhbwhhbwhbd..",
      ".dwhbwhbwhbwhbd.",
      ".dwhbwhbwhbwhbd.",
      "..dhbwhbwhbwhd..",
      "...dwhbwhbwhd...",
      "...dwhbwhbwhd...",
      "...dwhhhhhhsd...",
      "...dddddddddd...",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "....dddddd......",
      "..ddwwhhhwdd....",
      ".dwhbwhhbwhbd...",
      "dwhbwhbwhbwhbd..",
      "dwhbwhbwhbwhbd..",
      ".dhbwhbwhbwhd...",
      "...dwhbwhbwhd...",
      "...dwhbwhbwhd...",
      "...dwhhhhhhsd...",
      "...dddddddddd...",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      ".....dddddd.....",
      "...ddwwhhhwdd...",
      "..dwhbwhhbwhbd..",
      ".dwhbwhbwhbwhbd.",
      ".dwhbwhbwhbwhbd.",
      "..dhbwhbwhbwhd..",
      "...dwhbwhbwhd...",
      "...dwhbwhbwhd...",
      "...dwhhhhhhsd...",
      "...dddddddddd...",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "......dddddd....",
      "....ddwwhhhwdd..",
      "...dwhbwhhbwhbd.",
      "..dwhbwhbwhbwhbd",
      "..dwhbwhbwhbwhbd",
      "...dhbwhbwhbwhd.",
      "...dwhbwhbwhd...",
      "...dwhbwhbwhd...",
      "...dwhhhhhhsd...",
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
