(function (root) {
  'use strict';

  // Book Cover 4: Archives Folio - 24x32, still: true
  // Navy buckram binding with crisp silver ledger lines,
  // ruled registry margins, and a gilded silver 8-point compass rose.

  const P = {
    '.': null,
    // Navy Buckram Ramp (from RAMPS.blue)
    'k': '#0c1442', // deep navy outline
    's': '#1a2872', // navy shadow
    'b': '#2e44a8', // navy base
    'l': '#5470d8', // navy light
    'h': '#8caef8', // navy highlight
    // Silver Tooling Ramp (from RAMPS.silver)
    't': '#303c4a', // deep silver shadow
    'r': '#687a8c', // shadow silver
    'm': '#b8c6d4', // base silver
    'e': '#e8f0f8', // light silver
    'w': '#ffffff', // specular silver glint
    // Gold Pivot Accents (from RAMPS.gold)
    'y': '#ffd23a', // gold pivot
    'o': '#b38004', // shadow gold
    // Page edge & drop shadow
    'p': '#ede0b8', // ledger page edge
    'c': '#786842', // page shadow
    'q': '#0a0408'  // bottom cast shadow
  };

  const rows = [
    /* 00 */ '........................',
    /* 01 */ '..khhhhhhhhhhhhhhhhkk...',
    /* 02 */ '.klllbbbbbbbbbbbbbbllk..',
    /* 03 */ '.klbmmmmrttttttrmmmblkp.',
    /* 04 */ '.klbmeewmrrrrrrmweemlbpc',
    /* 05 */ '.klbmrbtrmmmmmrtbrmblbpq',
    /* 06 */ '.klbrbbrmrrrrrmrbbbrblpc',
    /* 07 */ '.klbrbbmmmmmmmmmbbbrblpc',
    /* 08 */ '.klbrbbbbbbwbbbbbbbrblpc',
    /* 09 */ '.klbrbbbbbewebbbbbbrblpc',
    /* 10 */ '.klbrbrbbbewebbbbrbrblpc',
    /* 11 */ '.klbrbbmbbewebbmbbbrblpc',
    /* 12 */ '.klbrbbbmremertbbbbrblpc',
    /* 13 */ '.klbrbwweemoymrrmbbrblpc',
    /* 14 */ '.klbrbbbmremertbbbbrblpc',
    /* 15 */ '.klbrbbmbbemtbbmbbbrblpc',
    /* 16 */ '.klbrbrbbbtmtbbbbrbrblpc',
    /* 17 */ '.klbrbbbbbtmtbbbbbbrblpc',
    /* 18 */ '.klbrbbbbbbtbbbbbbbrblpc',
    /* 19 */ '.klbrbbmmmmmmmmmbbbrblpc',
    /* 20 */ '.klbrbbrmrrrrrmrbbbrblpc',
    /* 21 */ '.klbmrbtrmmmmmrtbrmblbpc',
    /* 22 */ '.klbmeewmrrrrrrmweemlbpc',
    /* 23 */ '.klbmmmmrttttttrmmmblbpc',
    /* 24 */ '.kllbbbbbbbbbbbbbbllkbpc',
    /* 25 */ '.kssbbbbbbbbbbbbbbsskbpc',
    /* 26 */ '.ksssssssssssssssssskbpc',
    /* 27 */ '..kkkkkkkkkkkkkkkkkk.bpc',
    /* 28 */ '...kqqqqqqqqqqqqqqk..bpc',
    /* 29 */ '.....qqqqqqqqqqqqq...qq.',
    /* 30 */ '........................',
    /* 31 */ '........................'
  ];

  // Verify all row lengths are exactly 24
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].length !== 24) {
      throw new Error(`Row ${i} length is ${rows[i].length}, expected 24: "${rows[i]}"`);
    }
  }

  const asset = {
    id: 'book_cover_archives',
    category: 'titles',
    size: [24, 32],
    fps: 1,
    loop: true,
    still: true,
    notes: 'Navy buckram book cover with silver compass rose and ledger lines',
    palette: P,
    sparkles: [],
    frames: [{ rows }]
  };

  (root.ArtV2 = root.ArtV2 || {}).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
