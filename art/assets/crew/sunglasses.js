(function (root) {
  'use strict';

  const asset = {
  "id": "sunglasses",
  "category": "crew",
  "size": [
    16,
    16
  ],
  "fps": 8,
  "loop": true,
  "staticFrame": 0,
  "notes": "Retro wayfarer sunglasses with sweeping diagonal specular glare across lenses",
  "palette": {
    ".": null,
    "d": "#0a0408",
    "k": "#1a0f14",
    "s": "#343444",
    "b": "#626274",
    "w": "#ffffff",
    "a": "#d6f0ff",
    "c": "#7ec8f0"
  },
  "frames": [
    [
      "................",
      "................",
      "................",
      "..dddddddddddd..",
      ".dssssssssssssd.",
      "dswaddddddssskkd",
      "dsacbskksdbbkkkd",
      "dsbbbskksdbbkkkd",
      ".dskbskksdbbkkd.",
      "..dddd..dddddd..",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "..w.............",
      "..dddddddddddd..",
      ".dssssssssssssd.",
      "dsbbddddddssskkd",
      "dsbacskksdbbkkkd",
      "dsbwasckkdbbkkkd",
      "dsbbbskksdbbkkkd",
      ".dskbskksdbbkkd.",
      "..dddd..dddddd..",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "........w.......",
      "..dddddddddddd..",
      ".dssssssssssssd.",
      "dsbbddddddssskkd",
      "dsbbbskksdwaskkd",
      "dsbbbskksdsackkd",
      "dsbbbskksdbbkkkd",
      ".dskbskksdbbkkd.",
      "..dddd..dddddd..",
      "................",
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
      "..dddddddddddd..",
      ".dssssssssssssd.",
      "dsbbddddddssskkd",
      "dsbbbskksdbbskkd",
      "dsbbbskksdbwackd",
      ".dskbskksdsbacd.",
      "..dddd..dddddd..",
      "................",
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
