(function (root) {
  'use strict';

  const asset = {
  "id": "gold_teeth",
  "category": "crew",
  "size": [
    16,
    16
  ],
  "fps": 8,
  "loop": true,
  "staticFrame": 0,
  "notes": "Wide grin with pearly white teeth and an upper gold tooth flashing a 4-point sparkle cross",
  "palette": {
    ".": null,
    "d": "#261208",
    "m": "#724220",
    "p": "#e0aa76",
    "k": "#1a0f14",
    "w": "#ffffff",
    "e": "#e8f0f8",
    "g": "#ffd23a",
    "y": "#fff08c",
    "s": "#b38004",
    "x": "#fffbe0"
  },
  "frames": [
    [
      "................",
      "................",
      ".....dddddd.....",
      "..dddpmpmppddd..",
      ".dpmppppppppmpd.",
      "dppkkkkkkkkkppd.",
      "dpmkwweegyskpmd.",
      "dpkkkkwkkskkkpd.",
      ".dpmkkkkkkkmpd..",
      "..dddpmpmppdd...",
      "....dddddd......",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "..........x.....",
      ".....dddddx.....",
      "..dddpmpmpxddd..",
      ".dpmpppppxxxmpd.",
      "dppkkkkkkxxskpd.",
      "dpmkwweegyskpmd.",
      "dpkkkkwkkskkkpd.",
      ".dpmkkkkkkkmpd..",
      "..dddpmpmppdd...",
      "....dddddd......",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "..........x.....",
      ".....dddddx.....",
      "..dddpmpmpxddd..",
      ".dpmppppxxxympd.",
      "dppkkkkkxxygkpd.",
      "dpmkwweegyskpmd.",
      "dpkkkkwkkskkkpd.",
      ".dpmkkkkkkkmpd..",
      "..dddpmpmppdd...",
      "....dddddd......",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "................",
      ".....dddddd.....",
      "..dddpmpmppddd..",
      ".dpmpppppxxpmpd.",
      "dppkkkkkkxygkpd.",
      "dpmkwweegyskpmd.",
      "dpkkkkwkkskkkpd.",
      ".dpmkkkkkkkmpd..",
      "..dddpmpmppdd...",
      "....dddddd......",
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
