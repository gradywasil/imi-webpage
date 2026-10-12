(function (root) {
  'use strict';

  // Bookshelf Wood Tile - 32x16, tile: true, still: true
  // Seamless horizontal repeat of dark polished oak shelf
  // with backboard shadow, luster highlight bevel, rich oak woodgrain,
  // and deep underside cast shadow.

  const P = {
    '.': null,
    // Dark Polished Oak Ramp (from RAMPS.woodD and RAMPS.wood)
    'k': '#200e05', // deep oak grain / groove
    's': '#3a1e0b', // shadow dark oak
    'b': '#5a3517', // base polished oak
    'm': '#7d4f26', // medium oak grain
    'l': '#b07844', // light oak grain
    'h': '#eed0a4', // specular luster highlight
    'w': '#fffbe0', // pure glint
    // Alcove Backboard (from RAMPS.furD)
    'd': '#140a04', // deepest alcove shadow
    'u': '#261208'  // alcove shadow panel
  };

  const rows = [
    /* 00 */ 'dduuuuudddduuuuudduuuuudddduuuud', // backboard top
    /* 01 */ 'dduuuuudddduuuuudduuuuudddduuuud',
    /* 02 */ 'dduuuuudddduuuuudduuuuudddduuuud',
    /* 03 */ 'ddkkkkkddddkkkkkdduuuuuudddkkkkd',
    /* 04 */ 'ddsssssddddsssssdduuuuuudddssssd',
    /* 05 */ 'ddkkkkkddddkkkkkdduuuuuudddkkkkd',
    /* 06 */ 'bbmmmbbsbbbmmmbbsbbmmmbbsbbbmmmb', // shelf top surface
    /* 07 */ 'blllmmbbbmmllmmbbblllmmbbbmmllmb', // shelf surface grain
    /* 08 */ 'hhwhhhhhhlhhhhhlhhwhhhhhhlhhhhhh', // top edge specular bevel
    /* 09 */ 'bmmlllmmbbbmmlllmmbmmlllmmbbbmmb', // shelf front face
    /* 10 */ 'ssbmmmmbbssssbmmmmbbssbmmmmbbsss', // front face grain (ends with s)
    /* 11 */ 'kkssbbsskkkkkssbbsskkkssbbsskkkk', // lower face shade
    /* 12 */ 'skkkkkkkkkskkkkkkkkskkkkkkkkskks', // undercut groove
    /* 13 */ 'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk', // cast shadow dense
    /* 14 */ 'dddddddddddddddddddddddddddddddd', // cast shadow soft
    /* 15 */ '................................'  // air / book space below
  ];

  // Verify all row lengths are exactly 32 and left/right edges match
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].length !== 32) {
      throw new Error(`Row ${i} length is ${rows[i].length}, expected 32`);
    }
    if (rows[i][0] !== rows[i][31]) {
      throw new Error(`Row ${i} seam mismatch: col 0 '${rows[i][0]}' !== col 31 '${rows[i][31]}'`);
    }
  }

  const asset = {
    id: 'bookshelf_wood',
    category: 'titles',
    size: [32, 16],
    fps: 1,
    loop: true,
    still: true,
    tile: true,
    notes: 'Seamless dark polished oak bookshelf with shadow edge and luster highlight',
    palette: P,
    sparkles: [],
    frames: [{ rows }]
  };

  (root.ArtV2 = root.ArtV2 || {}).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
