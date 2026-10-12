(function (root) {
  'use strict';

  const asset = {
  "id": "propeller",
  "category": "crew",
  "size": [
    16,
    16
  ],
  "fps": 8,
  "loop": true,
  "staticFrame": 0,
  "notes": "Whimsical segmented beanie with spinning propeller blades",
  "palette": {
    ".": null,
    "d": "#12090e",
    "w": "#ffffff",
    "m": "#a4a4b4",
    "k": "#626274",
    "r": "#b8322a",
    "l": "#e86a50",
    "u": "#2e44a8",
    "c": "#5470d8",
    "y": "#ffd23a",
    "g": "#fff08c",
    "p": "#5a3517"
  },
  "frames": [
    [
      "................",
      "...dwwdkdwwd....",
      "....ddmddmdd....",
      ".......dd.......",
      ".....ddppdd.....",
      "....dccrryydd...",
      "...dccuurrryyd..",
      "..dccuuuurryyyd.",
      ".dcccuuuurryyyyd",
      ".dddddddddddddd.",
      "..dddddddddddd..",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "..dwwd..........",
      "...ddmd..dd.....",
      ".....dd.dwwd....",
      "......dkdmdd....",
      ".....ddppdd.....",
      "....dccrryydd...",
      "...dccuurrryyd..",
      "..dccuuuurryyyd.",
      ".dcccuuuurryyyyd",
      ".dddddddddddddd.",
      "..dddddddddddd..",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      ".......dd.......",
      "......dwwd......",
      "......dmmd......",
      ".......dk.......",
      ".....ddppdd.....",
      "....dccrryydd...",
      "...dccuurrryyd..",
      "..dccuuuurryyyd.",
      ".dcccuuuurryyyyd",
      ".dddddddddddddd.",
      "..dddddddddddd..",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "..........dwwd..",
      ".....dd..dmdd...",
      "....dwwd.dd.....",
      "....ddmdkd......",
      ".....ddppdd.....",
      "....dccrryydd...",
      "...dccuurrryyd..",
      "..dccuuuurryyyd.",
      ".dcccuuuurryyyyd",
      ".dddddddddddddd.",
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
