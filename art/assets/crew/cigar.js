(function (root) {
  'use strict';

  const asset = {
  "id": "cigar",
  "category": "crew",
  "size": [
    16,
    16
  ],
  "fps": 8,
  "loop": true,
  "staticFrame": 0,
  "notes": "Lit Cuban cigar with pulsing glowing ember and rising curled smoke wisps",
  "palette": {
    ".": null,
    "d": "#30180a",
    "s": "#5a3517",
    "b": "#8a5a2b",
    "l": "#b57d3e",
    "g": "#ffd23a",
    "w": "#ffffff",
    "r": "#b8322a",
    "e": "#e86a50",
    "y": "#ffc62a",
    "c": "#a4a4b4"
  },
  "frames": [
    [
      "................",
      "....ww..........",
      "...wccw.........",
      "....ww..........",
      "................",
      "................",
      "................",
      "..rrdddddddd....",
      ".ryedlbglbbld...",
      ".reedlbslssld...",
      "..rrdddddddd....",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "...ww...........",
      "..wccw..........",
      "...ww...........",
      "....ww..........",
      "...wccw.........",
      "....ww..........",
      "................",
      "..yydddddddd....",
      ".yyedlbglbbld...",
      ".reedlbslssld...",
      "..rrdddddddd....",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "....ww..........",
      "...wccw.........",
      "....ww..........",
      ".....ww.........",
      "....wccw........",
      ".....ww.........",
      "................",
      "..eedddddddd....",
      ".yyedlbglbbld...",
      ".ryedlbslssld...",
      "..rrdddddddd....",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      ".....ww.........",
      "....wccw........",
      ".....ww.........",
      "................",
      "....ww..........",
      "...wccw.........",
      "....ww..........",
      "..rrdddddddd....",
      ".ryedlbglbbld...",
      ".reedlbslssld...",
      "..rrdddddddd....",
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
