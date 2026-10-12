(function (root) {
  'use strict';

  const asset = {
  "id": "mustache",
  "category": "crew",
  "size": [
    16,
    16
  ],
  "fps": 8,
  "loop": true,
  "staticFrame": 0,
  "notes": "Waxed handlebar mustache with jaunty twitching tips and lustrous grooming",
  "palette": {
    ".": null,
    "d": "#261208",
    "s": "#4a2814",
    "b": "#6e4220",
    "l": "#9a6232",
    "h": "#ba8248"
  },
  "frames": [
    [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      ".ddd........ddd.",
      "dhlddddddddddlhd",
      ".dhhllbbbbllhhd.",
      "..dhllssssllhd..",
      "...dddddddddd...",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "................",
      "................",
      "................",
      "................",
      ".ddd........ddd.",
      "dhld........dlhd",
      ".dhlddddddddlhd.",
      ".dhhllbbbbllhhd.",
      "..dhllssssllhd..",
      "...dddddddddd...",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "................",
      "................",
      "................",
      "..dd........dd..",
      ".dhld......dlhd.",
      ".dhld......dlhd.",
      "..dldddddddld...",
      ".dhhllbbbbllhhd.",
      "..dhllssssllhd..",
      "...dddddddddd...",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "................",
      "................",
      "................",
      "................",
      ".ddd........ddd.",
      "dhld........dlhd",
      ".dhlddddddddlhd.",
      ".dhhllbbbbllhhd.",
      "..dhllssssllhd..",
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
