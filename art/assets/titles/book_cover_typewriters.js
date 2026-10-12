(function (root) {
  'use strict';

  // Book Cover 5: Typewriters Folio - 24x32, still: true
  // Imperial purple buckram binding with art-deco escapement corners
  // and a circular ring of vintage enamel typewriter keycaps with gilded bezels.

  const P = {
    '.': null,
    // Imperial Purple Ramp (from RAMPS.purple)
    'k': '#280c48', // deep purple outline
    's': '#4e2280', // shadow purple
    'b': '#7a46bc', // base purple
    'l': '#b58cf0', // light purple
    'h': '#e4beff', // highlight purple
    // Gold Bezel Ramp (from RAMPS.gold)
    'd': '#4a2e04', // deep gold shadow
    'o': '#b38004', // shadow gold
    'y': '#ffd23a', // base gold
    'g': '#fff08c', // light gold
    'w': '#fffbe0', // specular gold glint
    // Keycap Enamel & Metal (from RAMPS.metal)
    't': '#343444', // keycap type slug dark
    'm': '#a4a4b4', // metal rim
    'f': '#ffffff', // white keycap face
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
    /* 07 */ '.klbdbbbbgwwgbbbbdblkpqq',
    /* 08 */ '.klbdbbbgftmfgbbbdblkpqq',
    /* 09 */ '.klbdbbbbgoygbbbbdblkpqq',
    /* 10 */ '.klbdbgwwgbbgwwgbdblkpqq',
    /* 11 */ '.klbdgftmfbbgftmfdblkpqq',
    /* 12 */ '.klbdbgoygbbgoygbdblkpqq',
    /* 13 */ '.klbdbbbbgwwgbbbbdblkpqq',
    /* 14 */ '.klbdbbbgftmfgbbbdblkpqq',
    /* 15 */ '.klbdbbbbgoygbbbbdblkpqq',
    /* 16 */ '.klbdbgwwgbbgwwgbdblkpqq',
    /* 17 */ '.klbdgftmfbbgftmfdblkpqq',
    /* 18 */ '.klbdbgoygbbgoygbdblkpqq',
    /* 19 */ '.klbdbbbbgwwgbbbbdblkpqq',
    /* 20 */ '.klbdbbbgftmfgbbbdblkpqq',
    /* 21 */ '.klbdbbbbgoygbbbbdblkpqq',
    /* 22 */ '.klbodbbbbbbbbbbdoblkpqq',
    /* 23 */ '.klbogdygoooogyddgblkpqq',
    /* 24 */ '.klbgwwgyyyyyygwwgblkpqq',
    /* 25 */ '.klbggooddddddooggblkpqq',
    /* 26 */ '.kssbbbbbbbbbbbbbbsskpqq',
    /* 27 */ '.ksssssssssssssssssskpqq',
    /* 28 */ '..kkkkkkkkkkkkkkkkkk.pqq',
    /* 29 */ '...kqqqqqqqqqqqqqqk..pqq',
    /* 30 */ '.....qqqqqqqqqqqqq...qq.',
    /* 31 */ '........................'
  ];

  for (let i = 0; i < rows.length; i++) {
    if (rows[i].length !== 24) {
      throw new Error(`Row ${i} length is ${rows[i].length}, expected 24: "${rows[i]}"`);
    }
  }

  const asset = {
    id: 'book_cover_typewriters',
    category: 'titles',
    size: [24, 32],
    fps: 1,
    loop: true,
    still: true,
    notes: 'Imperial purple book cover with golden typewriter keycap circle and art-deco corners',
    palette: P,
    sparkles: [],
    frames: [{ rows }]
  };

  (root.ArtV2 = root.ArtV2 || {}).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
