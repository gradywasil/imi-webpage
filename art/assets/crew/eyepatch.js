(function (root) {
  'use strict';

  const asset = {
  "id": "eyepatch",
  "category": "crew",
  "size": [
    16,
    16
  ],
  "fps": 8,
  "loop": true,
  "staticFrame": 0,
  "notes": "Pirate leather eyepatch with diagonal buckle strap and twitching squint brow",
  "palette": {
    ".": null,
    "d": "#0a0408",
    "k": "#1a0f14",
    "s": "#343444",
    "b": "#626274",
    "f": "#4a2814",
    "m": "#9a6232",
    "g": "#ffd23a",
    "w": "#fffbe0"
  },
  "frames": [
    [
      "..dd............",
      "..dsd...ffff....",
      "...dsd.fmmmf....",
      "....ddddddff....",
      "....dskksd......",
      "...dskkkksd.....",
      "..dskkwgkkksd...",
      "..dskkggkkksd...",
      "..dskkkkkkksd...",
      "...dskkkksddsd..",
      "....dssssd..dsd.",
      ".....dddd....dd.",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "..dd............",
      "..dsd...........",
      "...dsd..ffff....",
      "....dddfmmmf....",
      "....dskddddf....",
      "...dskkkksd.....",
      "..dskkwwkkksd...",
      "..dskkwgkkksd...",
      "..dskkkkkkksd...",
      "...dskkkksddsd..",
      "....dssssd..dsd.",
      ".....dddd....dd.",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "..dd............",
      "..dsd...........",
      "...dsd..ffff....",
      "....dddfmmmf....",
      "....dskddddf....",
      "...dskkkksd.....",
      "..dskkwgkkksd...",
      "..dskkggkkksd...",
      "..dskkkkkkksd...",
      "...dskkkksddsd..",
      "....dssssd..dsd.",
      ".....dddd....dd.",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "..dd............",
      "..dsd...ffff....",
      "...dsd.fmmmf....",
      "....ddddddff....",
      "....dskksd......",
      "...dskkkksd.....",
      "..dskkggkkksd...",
      "..dskkggkkksd...",
      "..dskkkkkkksd...",
      "...dskkkksddsd..",
      "....dssssd..dsd.",
      ".....dddd....dd.",
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
