(function (root) {
  'use strict';

  const asset = {
  "id": "monocle",
  "category": "crew",
  "size": [
    16,
    16
  ],
  "fps": 8,
  "loop": true,
  "staticFrame": 0,
  "notes": "Circular gold-rimmed monocle over eye with sweeping lens sheen and swaying chain",
  "palette": {
    ".": null,
    "d": "#4a2e04",
    "y": "#ffd23a",
    "g": "#fff08c",
    "s": "#b38004",
    "w": "#fffbe0",
    "c": "#e4f6ff",
    "a": "#7ec8f0",
    "b": "#3a8ec8",
    "f": "#4a2814",
    "e": "#9a6232"
  },
  "frames": [
    [
      "................",
      "....fffff.......",
      "...feeeeed......",
      "..ffdddddff.....",
      "..ddyyyyyddd....",
      ".dyywcabbbyyd...",
      ".dywcaaaabyyd...",
      ".dycaaabaayyd...",
      ".dybaaaaabyyd...",
      "..ddyyyyyddsd...",
      "....dddd.dsd....",
      "..........dyd...",
      "...........dsd..",
      "...........ddd..",
      "................",
      "................"
    ],
    [
      "................",
      "....fffff.......",
      "...feeeeed......",
      "..ffdddddff.....",
      "..ddyyyyyddd....",
      ".dyyaacbbbyyd...",
      ".dyawcaaabyyd...",
      ".dyawcaaaayyd...",
      ".dybaaaaabyyd...",
      "..ddyyyyyddsd...",
      "....dddd..dsd...",
      "...........dyd..",
      "............dsd.",
      "............ddd.",
      "................",
      "................"
    ],
    [
      "................",
      "....fffff.......",
      "...feeeeed......",
      "..ffdddddff.....",
      "..ddyyyyyddd....",
      ".dyyaaaccbyyd...",
      ".dybaawcabyyd...",
      ".dybaawcaayyd...",
      ".dybaaawcaayd...",
      "..ddyyyyyddsd...",
      "....dddd..dsd...",
      "...........dyd..",
      "............dsd.",
      "............ddd.",
      "................",
      "................"
    ],
    [
      "................",
      "....fffff.......",
      "...feeeeed......",
      "..ffdddddff.....",
      "..ddyyyyyddd....",
      ".dyyaaaccbyyd...",
      ".dybaaaacbyyd...",
      ".dybaaaaacyyd...",
      ".dybaaaaabyyd...",
      "..ddyyyyyddsd...",
      "....dddd.dsd....",
      "..........dyd...",
      "...........dsd..",
      "...........ddd..",
      "................",
      "................"
    ]
  ]
};

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
