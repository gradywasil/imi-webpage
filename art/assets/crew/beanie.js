(function (root) {
  'use strict';

  const asset = {
  "id": "beanie",
  "category": "crew",
  "size": [
    16,
    16
  ],
  "fps": 8,
  "loop": true,
  "staticFrame": 0,
  "notes": "Warm knit winter beanie with bobbing fluffy pom-pom and ribbed cuff",
  "palette": {
    ".": null,
    "d": "#420a06",
    "s": "#781c16",
    "b": "#b8322a",
    "l": "#e86a50",
    "h": "#ffaba0",
    "y": "#ffd23a",
    "w": "#fffbe0",
    "k": "#b38004"
  },
  "frames": [
    [
      "................",
      "......dd........",
      ".....dwwd.......",
      ".....dykd.......",
      "....dddddd......",
      "...dhhllssbd....",
      "..dwwykkwwykd...",
      "..dhlllsssbbd...",
      "..dwwykkwwykd...",
      ".dhhllssbhhld...",
      ".dddddddddddd...",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      ".....dd.........",
      "....dwwd........",
      "....dykd........",
      "....dddddd......",
      "...dhhllssbd....",
      "..dwwykkwwykd...",
      "..dhlllsssbbd...",
      "..dwwykkwwykd...",
      ".dhhllssbhhld...",
      ".dddddddddddd...",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "......dd........",
      ".....dwwd.......",
      ".....dwyd.......",
      "....dddddd......",
      "...dhhllssbd....",
      "..dwwykkwwykd...",
      "..dhlllsssbbd...",
      "..dwwykkwwykd...",
      ".dhhllssbhhld...",
      ".dddddddddddd...",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      ".......dd.......",
      "......dwwd......",
      "......dykd......",
      "....dddddd......",
      "...dhhllssbd....",
      "..dwwykkwwykd...",
      "..dhlllsssbbd...",
      "..dwwykkwwykd...",
      ".dhhllssbhhld...",
      ".dddddddddddd...",
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
