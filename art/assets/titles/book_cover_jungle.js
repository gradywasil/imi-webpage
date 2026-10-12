(function (root) {
  'use strict';

  // Book Cover 3: Jungle Folio - 24x32, still: true
  // Deep emerald binding with creeping vine borders, lush tendrils,
  // and an embossed gilded Mayan stepped pyramid temple with solar crest.

  const P = {
    '.': null,
    // Emerald Leather Ramp (from RAMPS.leafD)
    'k': '#08220c', // deep emerald outline
    's': '#12441a', // shadow emerald
    'b': '#1f6a2a', // base emerald
    'l': '#3f9a3a', // light emerald
    'h': '#62c85e', // highlight emerald
    // Creeping Vines (from RAMPS.vine)
    'v': '#a6ea72', // bright vine leaf tip
    'u': '#6fc04a', // vine leaf body
    // Gold / Stone Temple Ramp (from RAMPS.gold)
    'd': '#4a2e04', // deep carved stone shadow / doorway
    'o': '#b38004', // shadow gold stone
    'y': '#ffd23a', // base gold stone
    'g': '#fff08c', // light gold stone
    'w': '#fffbe0', // specular sunbeam highlight
    // Page edge & drop shadow
    'p': '#ede0b8', // gilded page edge
    'c': '#786842', // page shadow
    'q': '#1a0f14'  // bottom cast shadow
  };

  const rows = [
    /* 00 */ '........................',
    /* 01 */ '..khhhhhhhhhhhhhhhhkk...',
    /* 02 */ '.klllbbbbbbbbbbbbbbllk..',
    /* 03 */ '.klbvuukkuuuuuukkuublkp.',
    /* 04 */ '.klu..uvllvvllvvu..ulbpc',
    /* 05 */ '.kluv....sbbss....vulkpq',
    /* 06 */ '.klu..s..swwws..s..ulbpc',
    /* 07 */ '.klu.sk.swwgyws.ks.ulbpc',
    /* 08 */ '.klbsk..sgyyygs..ksblbpc',
    /* 09 */ '.klbs....dyyyd....sblbpc',
    /* 10 */ '.klu..s.gwwgyyg.s..ulbpc',
    /* 11 */ '.klu.sk.gyyddyg.ks.ulbpc',
    /* 12 */ '.klbsk..gyyddyg..ksblbpc',
    /* 13 */ '.klbs..gwwyyyyyg..sblbpc',
    /* 14 */ '.klu..sgyyoyyoyyg..ulbpc',
    /* 15 */ '.klu.skgyyoyyoyygksulbpc',
    /* 16 */ '.klbskgyyyoyyoyyygksblpc',
    /* 17 */ '.klbs.gyyyoyyoyyyg.sblpc',
    /* 18 */ '.klu.gwwyyyyyyyyyygulbpc',
    /* 19 */ '.kluugyyyyooyyyoyyguubpc',
    /* 20 */ '.klvuuyyyyyyyyyyyyuuvbpc',
    /* 21 */ '.klv.dddddddddddddd.vbpc',
    /* 22 */ '.kluv..............vulkp',
    /* 23 */ '.klu..uvllvvllvvu..ulbpc',
    /* 24 */ '.klbvuukkuuuuuukkuublkpc',
    /* 25 */ '.kllbbbbbbbbbbbbbbllkbpc',
    /* 26 */ '.kssbbbbbbbbbbbbbbsskbpc',
    /* 27 */ '.ksssssssssssssssssskbpc',
    /* 28 */ '..kkkkkkkkkkkkkkkkkk.bpc',
    /* 29 */ '...kqqqqqqqqqqqqqqk..bpc',
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
    id: 'book_cover_jungle',
    category: 'titles',
    size: [24, 32],
    fps: 1,
    loop: true,
    still: true,
    notes: 'Emerald cloth book cover with creeping vine borders and jungle temple motif',
    palette: P,
    sparkles: [],
    frames: [{ rows }]
  };

  (root.ArtV2 = root.ArtV2 || {}).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
