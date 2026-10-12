(function (root) {
  'use strict';

  const asset = {
  "id": "pirate",
  "category": "crew",
  "size": [
    16,
    16
  ],
  "fps": 8,
  "loop": true,
  "staticFrame": 0,
  "notes": "Captain tricorn hat with gold trim, skull badge and fluttering crimson plume",
  "palette": {
    ".": null,
    "d": "#12090e",
    "k": "#1a0f14",
    "s": "#343444",
    "g": "#ffd23a",
    "y": "#fff08c",
    "t": "#b38004",
    "w": "#ffffff",
    "r": "#b8322a",
    "l": "#e86a50",
    "x": "#781c16"
  },
  "frames": [
    [
      "................",
      "..........dd....",
      ".........dllxd..",
      "....dd..dlrrxd..",
      "..ddggdddrrxd...",
      ".dgyyysggggd....",
      "dgykkssskksgyd..",
      "dgkkskwwksksgd..",
      "dgkkskwkksksgd..",
      ".dgksssssssgd...",
      "..ddgggggggdd...",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "...........dd...",
      "..........dllxd.",
      "....dd...dlrrxd.",
      "..ddggdd..drrxd.",
      ".dgyyysggggdd...",
      "dgykkssskksgyd..",
      "dgkkskwwksksgd..",
      "dgkkskwkksksgd..",
      ".dgksssssssgd...",
      "..ddgggggggdd...",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "...........dd...",
      "..........dllxd.",
      "....dd...dlrrxd.",
      "..ddggdd..drrxd.",
      ".dgyyysggggdd...",
      "dgykkssskksgyd..",
      "dgkksywwksksgd..",
      "dgkkskwkksksgd..",
      "..dgksssssssgd..",
      "..ddgggggggdd...",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "..........dd....",
      ".........dllxd..",
      "....dd..dlrrxd..",
      "..ddggdddrrxd...",
      ".dgyyysggggd....",
      "dgykkssskksgyd..",
      "dgkkskwwksksgd..",
      "dgkkskwkksksgd..",
      "..dgksssssssgd..",
      "..ddgggggggdd...",
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
