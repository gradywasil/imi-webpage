(function (root) {
  'use strict';

  // toast_sparkle: 24x24 · 6 frames · 8 fps · loop
  // 4-point golden starburst explosion notification fx with expanding diamond rays,
  // radiant specular flash, and dispersing outer sparkles.

  function buildFrames() {
    const rawFrames = [
      // Frame 0: Compact charging energy core at center
      [
        '........................',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................',
        '...........kk...........',
        '..........kllk..........',
        '........kklwwlkk........',
        '........klwwwwlk........',
        '........klwwwwlk........',
        '........kklwwlkk........',
        '..........kllk..........',
        '...........kk...........',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................'
      ],
      // Frame 1: Explosive burst begins, 4 diamond points extend
      [
        '........................',
        '........................',
        '...........kk...........',
        '...........ww...........',
        '..........kllk..........',
        '..........kllk..........',
        '.........klwwlk.........',
        '.........klwwlk.........',
        '..kk....kllwwllk....kk..',
        '..ww...klllwwlllk...ww..',
        '.kllk.kllwwwwwwllk.kllk.',
        '.kllllwwwwwwwwwwwwllllk.',
        '.kllllwwwwwwwwwwwwllllk.',
        '.kllk.kllwwwwwwllk.kllk.',
        '..ww...klllwwlllk...ww..',
        '..kk....kllwwllk....kk..',
        '.........klwwlk.........',
        '.........klwwlk.........',
        '..........kllk..........',
        '..........kllk..........',
        '...........ww...........',
        '...........kk...........',
        '........................',
        '........................'
      ],
      // Frame 2: Maximum starburst detonation! Long 4 points and diamond core
      [
        '...........kk...........',
        '...........ww...........',
        '..........kllk..........',
        '..........klwk..........',
        '..........klwk..........',
        '.........kllwwk.........',
        '.........kllwwk.........',
        '........klllwwlk........',
        '..kk...kllllwwllk...kk..',
        '..ww..klllllwwlllk..ww..',
        '.kllkkllwwwwwwwwllkkllk.',
        '.kwwwwwwwwwwwwwwwwwwwwk.',
        '.kwwwwwwwwwwwwwwwwwwwwk.',
        '.kllkkllwwwwwwwwllkkllk.',
        '..ww..klllllwwlllk..ww..',
        '..kk...kllllwwllk...kk..',
        '........klllwwlk........',
        '.........kllwwk.........',
        '.........kllwwk.........',
        '..........klwk..........',
        '..........klwk..........',
        '..........kllk..........',
        '...........ww...........',
        '...........kk...........'
      ],
      // Frame 3: Tips detaching into flying sparks, core contracts
      [
        '...........ww...........',
        '...........ww...........',
        '........................',
        '..........kllk..........',
        '..........klwk..........',
        '.........kllwwk.........',
        '.........kllwwk.........',
        '..ww....klllwwlk....ww..',
        '..ww...kllllwwllk...ww..',
        '......kllwwwwwwllk......',
        '.....kllwwwwwwwwllk.....',
        '.ww.klwwwwwwwwwwwwlk.ww.',
        '.ww.klwwwwwwwwwwwwlk.ww.',
        '.....kllwwwwwwwwllk.....',
        '......kllwwwwwwllk......',
        '..ww...kllllwwllk...ww..',
        '..ww....klllwwlk....ww..',
        '.........kllwwk.........',
        '.........kllwwk.........',
        '..........klwk..........',
        '..........kllk..........',
        '........................',
        '...........ww...........',
        '...........ww...........'
      ],
      // Frame 4: Dispersing glitter sparks expanding outwards
      [
        '...........ll...........',
        '........................',
        '..ll................ll..',
        '..ll......kllk......ll..',
        '..........klwk..........',
        '.........kllb.............',
        '........................',
        '..ll....klllwwlk....ll..',
        '..ll...kllllwwllk...ll..',
        '......kllwwwwwwllk......',
        '.....kllwwwwwwwwllk.....',
        '.ll.klwwwwwwwwwwwwlk.ll.',
        '.ll.klwwwwwwwwwwwwlk.ll.',
        '.....kllwwwwwwwwllk.....',
        '......kllwwwwwwllk......',
        '..ll...kllllwwllk...ll..',
        '..ll....klllwwlk....ll..',
        '........................',
        '............bllk........',
        '..........kwlk..........',
        '..ll......kllk......ll..',
        '..ll................ll..',
        '........................',
        '...........ll...........'
      ],
      // Frame 5: Soft dissipating warm glow before resetting
      [
        '........................',
        '........................',
        '........................',
        '...........kk...........',
        '..........kllk..........',
        '..........klwk..........',
        '.........kllwwk.........',
        '........klllwwlk........',
        '........klllwwlk........',
        '.......kllwwwwwwlk......',
        '.......klwwwwwwwwlk.....',
        '..kk...klwwwwwwwwlk...kk',
        '..kk...klwwwwwwwwlk...kk',
        '.......klwwwwwwwwlk.....',
        '.......kllwwwwwwlk......',
        '........klllwwlk........',
        '........klllwwlk........',
        '.........kllwwk.........',
        '..........klwk..........',
        '..........kllk..........',
        '...........kk...........',
        '........................',
        '........................',
        '........................'
      ]
    ];

    return rawFrames.map(rows => ({ rows }));
  }

  const asset = {
    id: 'toast_sparkle',
    category: 'hud',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: '4-point golden starburst explosion notification fx with expanding diamond rays and dispersing glitter',
    palette: {
      '.': null,
      'k': '#624406', // deep star gold outline
      'b': '#c8981c', // star gold shadow
      's': '#c8981c', // star shadow
      'l': '#f4d242', // star gold base
      'w': '#ffffff'  // star specular white core
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
