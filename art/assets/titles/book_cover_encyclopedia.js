(function (root) {
  'use strict';

  // Book Cover 6: Encyclopedia Folio - 24x32, still: true
  // Heavy dark mahogany calfskin binding with gilded baroque corners
  // and an imperial double-headed eagle grasping an azure celestial globe crest.

  const P = {
    '.': null,
    // Dark Mahogany Ramp (from RAMPS.woodD)
    'k': '#200e05', // deep mahogany outline
    's': '#3a1e0b', // shadow mahogany
    'b': '#5a3517', // base mahogany
    'l': '#7d4f26', // light mahogany
    'h': '#b07844', // highlight mahogany
    // Gilded Eagle Crest Ramp (from RAMPS.gold)
    'd': '#4a2e04', // deep gold shadow
    'o': '#b38004', // shadow gold
    'y': '#ffd23a', // base gold
    'g': '#fff08c', // light gold
    'w': '#fffbe0', // specular gold glint
    // Globe Enamel Azure (from RAMPS.sky)
    'u': '#2878b4', // ocean base
    'e': '#9ce0ff', // meridian light
    'i': '#123e64', // ocean shadow
    // Page edge & drop shadow
    'p': '#ede0b8', // gilded page edge
    'q': '#1a0f14'  // bottom cast shadow
  };

  const rows = [
    /* 00 */ '........................',
    /* 01 */ '..khhhhhhhhhhhhhhhhkk...',
    /* 02 */ '.klllbbbbbbbbbbbbbbllk..',
    /* 03 */ '.klbggooddddddooggblkpq.',
    /* 04 */ '.klbgwwgyyyyyygwwgblkpqq',
    /* 05 */ '.klbogdygoooogyddgblkpqq',
    /* 06 */ '.klbodbbbbbbbbbbdoblkpqq',
    /* 07 */ '.klbdbbgwwbbwwgbbdblkpqq',
    /* 08 */ '.klbdbbdywbbwydbbdblkpqq',
    /* 09 */ '.klbdbgwgdyooydgwdblkpqq',
    /* 10 */ '.klbdbgyyddyydygbdblkpqq',
    /* 11 */ '.klbdgyygdwggwddygblkpqq',
    /* 12 */ '.klbdgyygdiueidyyyblkpqq',
    /* 13 */ '.klbdoyyddieeeidyyblkpqq',
    /* 14 */ '.klbdoyyddiuyuidyyblkpqq',
    /* 15 */ '.klbdgyygdiueidyyyblkpqq',
    /* 16 */ '.klbdgyygddoodddygblkpqq',
    /* 17 */ '.klbdbgyybdyydbygbblkpqq',
    /* 18 */ '.klbdbgwgbdyydbwwgblkpqq',
    /* 19 */ '.klbdbbddbgyygbddbblkpqq',
    /* 20 */ '.klbdbbbbbdoodbbbdblkpqq',
    /* 21 */ '.klbodbbbbbbbbbbdoblkpqq',
    /* 22 */ '.klbogdygoooogyddgblkpqq',
    /* 23 */ '.klbgwwgyyyyyygwwgblkpqq',
    /* 24 */ '.klbggooddddddooggblkpqq',
    /* 25 */ '.kllbbbbbbbbbbbbbbllkpqq',
    /* 26 */ '.kssbbbbbbbbbbbbbbsskpqq',
    /* 27 */ '.ksssssssssssssssssskpqq',
    /* 28 */ '..kkkkkkkkkkkkkkkkkk.pqq',
    /* 29 */ '...kqqqqqqqqqqqqqqk..pqq',
    /* 30 */ '.....qqqqqqqqqqqqq...qq.',
    /* 31 */ '........................'
  ];

  // Verify all row lengths are exactly 24
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].length !== 24) {
      throw new Error(`Row ${i} length is ${rows[i].length}, expected 24: "${rows[i]}"`);
    }
  }

  const asset = {
    id: 'book_cover_encyclopedia',
    category: 'titles',
    size: [24, 32],
    fps: 1,
    loop: true,
    still: true,
    notes: 'Dark mahogany book cover with double-headed eagle holding celestial globe crest',
    palette: P,
    sparkles: [],
    frames: [{ rows }]
  };

  (root.ArtV2 = root.ArtV2 || {}).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
