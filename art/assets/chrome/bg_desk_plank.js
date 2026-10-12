(function (root) {
  'use strict';

  // 32x32 seamless horizontal wood plank tile with fine grain lines and wooden peg nails
  // Two 16px horizontal planks (rows 0..15 and 16..31).
  // Note: asset.tile requires col 0 === col 31 on all rows for seamless horizontal wrap.
  const rows = [
    // --- PLANK 1 (rows 0..15) ---
    // 0: Top bevel highlight of Plank 1
    "WllllbbbbllllWWWWbbbbllllbbbbllW",
    // 1: Upper face
    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    // 2: Upper fine grain line
    "sssssssssbbbbbbbbsssssssssbbbbbs",
    // 3: Mid face
    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    // 4: Grain streak
    "lllllbbbbbbbbblllllbbbbbbbbbllll",
    // 5: Face approaching peg nail 1 at [8..10, 6..8]
    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    // 6: Peg nail 1 top chamfer
    "bbbbbbppsbbbbbbbbbbbbbbbbbbbbbbb",
    // 7: Peg nail 1 body
    "bbbbbbpbkbbbbbbbbbbbbbbbbbbbbbbb",
    // 8: Peg nail 1 shadow rim
    "bbbbbbkksbbbbbbbbbbbbbbbbbbbbbbb",
    // 9: Grain curving past peg nail
    "ssssssssbbbbbbbbbbbbbbbbssssssss",
    // 10: Face
    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    // 11: Lower fine grain ripple
    "bbbbbbbbbllllbbbbbbbbbbllllbbbbb",
    // 12: Lower face
    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    // 13: Deep grain strand
    "ssssbbbbssssbbbbbbbbssssbbbbssss",
    // 14: Plank 1 lower shadow bevel
    "ssssssssssssssssssssssssssssssss",
    // 15: Recessed groove seam between planks
    "dddddddddddddddddddddddddddddddd",

    // --- PLANK 2 (rows 16..31) ---
    // 16: Top bevel highlight of Plank 2
    "WllllbbbbllllWWWWbbbbllllbbbbllW",
    // 17: Upper face
    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    // 18: Grain streak
    "bbbbblllllbbbbbbbbbblllllbbbbbbb",
    // 19: Mid face
    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    // 20: Fine grain line
    "ssssssssbbbbbbbbssssssssbbbbssss",
    // 21: Face approaching peg nail 2 at [23..25, 22..24]
    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    // 22: Peg nail 2 top chamfer
    "bbbbbbbbbbbbbbbbbbbbppsbbbbbbbbb",
    // 23: Peg nail 2 body
    "bbbbbbbbbbbbbbbbbbbbpbkbbbbbbbbb",
    // 24: Peg nail 2 shadow rim
    "bbbbbbbbbbbbbbbbbbbbkksbbbbbbbbb",
    // 25: Grain curve
    "bbbbbbbbbbbbbbsssssssssbbbbbbbbb",
    // 26: Face
    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    // 27: Lower grain ripple
    "llllbbbbbbbbllllbbbbbbbbllllbbbl",
    // 28: Lower face
    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    // 29: Deep grain strand
    "sssssbbbbbbssssssbbbbbbssssssbbs",
    // 30: Plank 2 lower shadow bevel
    "ssssssssssssssssssssssssssssssss",
    // 31: Recessed groove seam at bottom (loops back to row 0)
    "dddddddddddddddddddddddddddddddd"
  ];

  // Validate width and tile seam
  rows.forEach((r, y) => {
    if (r.length !== 32) throw new Error(`Row ${y} length is ${r.length}, expected 32`);
    if (r[0] !== r[31]) throw new Error(`Row ${y} seam mismatch: col 0 is '${r[0]}', col 31 is '${r[31]}'`);
  });

  const asset = {
    id: 'bg_desk_plank',
    category: 'chrome',
    size: [32, 32],
    fps: 1,
    loop: true,
    still: true,
    tile: true,
    notes: 'Seamless horizontal mahogany wood planks with fine grain ripple and wooden peg nails',
    palette: {
      '.': null,
      'p': '#ffeed0', // peg chamfer highlight
      'W': '#eed0a4', // plank top bevel highlight
      'l': '#b57d3e', // wood light grain
      'b': '#8a5a2b', // wood warm base
      's': '#5a3517', // wood shadow grain
      'd': '#30180a', // recessed plank seam groove
      'k': '#200e05'  // peg shadow / dark outline
    },
    frames: [
      { rows }
    ]
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
