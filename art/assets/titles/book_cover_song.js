(function (root) {
  'use strict';

  // Book Cover 2: Song Folio - 24x32, still: true
  // Amber woven cloth cover with gilded concert harp, melodic filigree,
  // and an ivory lyric ribbon banner.

  const P = {
    '.': null,
    // Amber Cloth Ramp (from RAMPS.bronze)
    'a': '#3e1e08', // deep amber outline
    's': '#6e3c16', // shadow amber cloth
    'b': '#a86834', // base amber cloth
    'l': '#dca06a', // light amber cloth
    'h': '#ffe6cc', // highlight amber cloth
    // Gilded Harp Gold Ramp (from RAMPS.gold)
    'd': '#4a2e04', // deep gold shadow
    'o': '#b38004', // shadow gold
    'y': '#ffd23a', // base gold
    'g': '#fff08c', // light gold
    'w': '#fffbe0', // specular glint
    // Lyric Ribbon Ramp (from RAMPS.paper)
    'r': '#786842', // ribbon fold shadow / ink notation
    'e': '#c9b88a', // ribbon shadow
    'm': '#ede0b8', // ribbon base ivory
    'n': '#fff6d6', // ribbon highlight ivory
    // Cast shadow
    'q': '#200e05'  // bottom cast shadow
  };

  const rows = [
    /* 00 */ '........................',
    /* 01 */ '..ahhhhhhhhhhhhhhhhha...',
    /* 02 */ '.alllbbbbbbbbbbbbbblla..',
    /* 03 */ '.albggooddddddooggblaem.',
    /* 04 */ '.albgwwgyyyyyygwwgblaemq',
    /* 05 */ '.albogdygoooogyddgblaemq',
    /* 06 */ '.albodobbbbbbbbbodoblaem',
    /* 07 */ '.albdbbgwwyyogbbodblaemq',
    /* 08 */ '.albdbgwywwyyobbbdblaemq',
    /* 09 */ '.albdbgyodoyyyobbdblaemq',
    /* 10 */ '.albdbgyobgyyyobbdblaemq',
    /* 11 */ '.albdbgyobwbgydbbdblaemq',
    /* 12 */ '.albdbgyobgbyydbbdblaemq',
    /* 13 */ '.albdbgyobybyydbbdblaemq',
    /* 14 */ '.albdbgyobyboydbbdblaemq',
    /* 15 */ '.albdbgyobyboydbbdblaemq',
    /* 16 */ '.albdbgyobyboydbbdblaemq',
    /* 17 */ '.albdbbgybyboddbbdblaemq',
    /* 18 */ '.albdbbbgywyyydbbdblaemq',
    /* 19 */ '.albdbbgwwyyyyydbdblaemq',
    /* 20 */ '.albdbemnnmnnmnnerblaemq',
    /* 21 */ '.albdoemnmrmrmrmnmeodlae',
    /* 22 */ '.albdoenmrrmrrmrnmeodlae',
    /* 23 */ '.albodoemnnmnnmnneodobla',
    /* 24 */ '.albogdbreerbreerddgbla.',
    /* 25 */ '.albgwwgyyyyyygwwgblaemq',
    /* 26 */ '.albggooddddddooggblaemq',
    /* 27 */ '.assbbbbbbbbbbbbbbsslaem',
    /* 28 */ '..assssssssssssssssa.emq',
    /* 29 */ '...aqqqqqqqqqqqqqqqa.emq',
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
    id: 'book_cover_song',
    category: 'titles',
    size: [24, 32],
    fps: 1,
    loop: true,
    still: true,
    notes: 'Amber cloth book cover with gilded harp, intricate corner filigree, and ivory lyric ribbon',
    palette: P,
    sparkles: [],
    frames: [{ rows }]
  };

  (root.ArtV2 = root.ArtV2 || {}).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
