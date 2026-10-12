(function (root) {
  'use strict';

  const asset = {
  "id": "blush",
  "category": "crew",
  "size": [
    16,
    16
  ],
  "fps": 8,
  "loop": true,
  "staticFrame": 0,
  "notes": "Cute rosy blushing monkey cheeks with smiling squint eyes and floating hearts",
  "palette": {
    ".": null,
    "d": "#8a2040",
    "b": "#c8486c",
    "m": "#f08aa4",
    "r": "#ffb8cc",
    "w": "#ffffff",
    "s": "#724220",
    "p": "#e0aa76"
  },
  "frames": [
    [
      "................",
      "................",
      "..rbr......rbr..",
      "..dbd......dbd..",
      "...s........s...",
      "..sss......sss..",
      ".s...s....s...s.",
      ".rmmr......rmmr.",
      "dmbmmd....dmbmmd",
      ".dbbd......dbbd.",
      "....s......s....",
      ".....ssssss.....",
      "......ssss......",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "..rbr......rbr..",
      "..dbd......dbd..",
      "...d........d...",
      "...s........s...",
      "..sss......sss..",
      ".s...s....s...s.",
      "drmmrd....drmmrd",
      "dmbmmd....dmbmmd",
      ".dbbd......dbbd.",
      "....s......s....",
      ".....ssssss.....",
      "......ssss......",
      "................",
      "................",
      "................"
    ],
    [
      "..wbw......wbw..",
      "..dbd......dbd..",
      "...d........d...",
      "................",
      "...s........s...",
      "..sss......sss..",
      ".s...s....s...s.",
      "drmmrd....drmmrd",
      "dmbbmd....dmbbmd",
      ".dbbd......dbbd.",
      "....s......s....",
      ".....ssssss.....",
      "......ssss......",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "..rbr......rbr..",
      "..dbd......dbd..",
      "................",
      "...s........s...",
      "..sss......sss..",
      ".s...s....s...s.",
      "drmmrd....drmmrd",
      "dmbmmd....dmbmmd",
      ".dbbd......dbbd.",
      "....s......s....",
      ".....ssssss.....",
      "......ssss......",
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
