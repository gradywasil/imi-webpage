(function (root) {
  'use strict';

  // Book Cover 1: Novella Folio (APE) - 24x32, still: true
  // Rich maroon leather binding with ornate gold corner scrollwork,
  // gilded fillet border frames, and an embossed gold gorilla profile crest.

  const P = {
    '.': null,
    // Maroon Leather Ramp (from RAMPS.red)
    'k': '#420a06', // deep maroon outline / groove
    's': '#781c16', // shadow maroon leather
    'b': '#b8322a', // base maroon leather
    'l': '#e86a50', // light maroon leather
    'h': '#ffaba0', // highlight maroon leather
    // Gold Tooling Ramp (from RAMPS.gold)
    'd': '#4a2e04', // deep gold shadow / groove
    'o': '#b38004', // shadow gold
    'y': '#ffd23a', // base gold
    'g': '#fff08c', // light gold
    'w': '#fffbe0', // specular glint
    // Page edge & drop shadow
    'p': '#ede0b8', // gilded page edge
    'c': '#c9b88a', // page shadow
    'q': '#200e05'  // bottom cast shadow
  };

  const rows = [
    /* 00 */ '........................',
    /* 01 */ '..khhhhhhhhhhhhhhhhhk...',
    /* 02 */ '.klllbbbbbbbbbbbbbbllk..',
    /* 03 */ '.klbggooddddddooggblkpq.',
    /* 04 */ '.klbgwwgyyyyyygwwgblkpqc',
    /* 05 */ '.klbogdygoooogyddgblkpqc',
    /* 06 */ '.klbodobbbbbbbbbodobkpqc',
    /* 07 */ '.klbdobbbgggggbbbodbkpqc',
    /* 08 */ '.klbdobbgwwyyygbbodykpqc',
    /* 09 */ '.klbdobgwyyyyyygbodbkpqc',
    /* 10 */ '.klbdobgyywwwwygbodbkpqc',
    /* 11 */ '.klbdobgywwggwygbodbkpqc',
    /* 12 */ '.klbdobgywgyyoygbodbkpqc',
    /* 13 */ '.klbdobgywyyyyygbodbkpqc',
    /* 14 */ '.klbdobgywyyyyogbodykpqc',
    /* 15 */ '.klbdobgywyyyoogbodykpqc',
    /* 16 */ '.klbdobgywwyyoodbodbkpqc',
    /* 17 */ '.klbdobgyywwwyodbodbkpqc',
    /* 18 */ '.klbdobgoyyyyoodbodbkpqc',
    /* 19 */ '.klbdobbgyyyyyddbodbkpqc',
    /* 20 */ '.klbdobbbdooddbbbodbkpqc',
    /* 21 */ '.klbdobbbbbbbbbbbodbkpqc',
    /* 22 */ '.klbdobbbwwwwwbbbodbkpqc',
    /* 23 */ '.klbodobgwyyygbbodobkpqc',
    /* 24 */ '.klbogdygyygyyddgblkpqc.',
    /* 25 */ '.klbgwwgyyyyyygwwgblkpqc',
    /* 26 */ '.klbggooddddddooggblkpqc',
    /* 27 */ '.kssbbbbbbbbbbbbbbsskpqc',
    /* 28 */ '..kssssssssssssssssk.pqc',
    /* 29 */ '...kqqqqqqqqqqqqqqk..pqc',
    /* 30 */ '.....qqqqqqqqqqqqq...qq.',
    /* 31 */ '........................'
  ];

  for (let i = 0; i < rows.length; i++) {
    if (rows[i].length !== 24) {
      throw new Error(`Row ${i} length is ${rows[i].length}, expected 24`);
    }
  }

  const asset = {
    id: 'book_cover_ape',
    category: 'titles',
    size: [24, 32],
    fps: 1,
    loop: true,
    still: true,
    notes: 'Maroon leather book cover with embossed gold gorilla silhouette and ornate corner scrollwork',
    palette: P,
    sparkles: [],
    frames: [{ rows }]
  };

  (root.ArtV2 = root.ArtV2 || {}).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
