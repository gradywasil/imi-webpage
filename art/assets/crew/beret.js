(function (root) {
  'use strict';

  const asset = {
  "id": "beret",
  "category": "crew",
  "size": [
    16,
    16
  ],
  "fps": 8,
  "loop": true,
  "staticFrame": 0,
  "notes": "French artist beret in rich indigo with gold pin and swaying tab",
  "palette": {
    ".": null,
    "d": "#0c1442",
    "s": "#1a2872",
    "b": "#2e44a8",
    "h": "#5470d8",
    "w": "#8caef8",
    "k": "#4a2e04",
    "g": "#ffd23a",
    "y": "#fff08c"
  },
  "frames": [
    [
      "................",
      "................",
      "......dd........",
      "......db........",
      "....dddddddd....",
      "..ddwhhhhbbbdd..",
      ".dwhhhhbbsssssd.",
      "dwhhbbgbbssssssd",
      "dbbbbbbbsssssssd",
      ".dddbbsssssddd..",
      "....ddddddd.....",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "................",
      ".......dd.......",
      ".......db.......",
      "....dddddddd....",
      "..ddwhhhhbbbdd..",
      ".dwhhhhbbsssssd.",
      "dwhhbbybbssssssd",
      "dbbbbbbbsssssssd",
      ".dddbbsssssddd..",
      "....ddddddd.....",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "................",
      ".......dd.......",
      ".......db.......",
      "...dddddddddd...",
      "..ddwhhhhbbbdd..",
      ".dwhhhhbbsssssd.",
      "dwhhbbgbbssssssd",
      "dbbbbbbbsssssssd",
      "..dddbbssssddd..",
      "....ddddddd.....",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "................",
      "......dd........",
      "......db........",
      "...dddddddddd...",
      "..ddwhhhhbbbdd..",
      ".dwhhhhbbsssssd.",
      "dwhhbbgbbssssssd",
      "dbbbbbbbsssssssd",
      "..dddbbssssddd..",
      "....ddddddd.....",
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
