(function (root) {
  'use strict';

  // buff_inspiration: 24x24 · 6 frames · 8 fps · loop
  // Glowing Edison lightbulb buff icon with flashing incandescent filament and radiant inspiration rays.

  function buildFrames() {
    const rawFrames = [
      // Frame 0: Warm idle glow, filament steady
      [
        '........................',
        '........................',
        '..........wwww..........',
        '........wwyyyyww........',
        '.......wyybbbbyyw.......',
        '......wybb....bbyw......',
        '.....wyb..kowk..byw.....',
        '.....wyb..kwwk..byw.....',
        '.....wyb...kk...byw.....',
        '......wyb..oo..byw......',
        '.......wyybbbbyyw.......',
        '........wwyyyyww........',
        '.........kddddk.........',
        '.........kmmmmk.........',
        '.........kssssk.........',
        '.........kmmmmk.........',
        '..........kddk..........',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................'
      ],
      // Frame 1: Filament heats up, small rays shoot out
      [
        '...........yy...........',
        '..........yyyy..........',
        '....yy....wwww....yy....',
        '.....yy.wwyyyyww.yy.....',
        '.......wyybbbbyyw.......',
        '......wybb....bbyw......',
        '..yy.wyb..kwwk..byw.yy..',
        '...yywyb..kwwk..bywyy...',
        '.....wyb...kk...byw.....',
        '......wyb..ww..byw......',
        '.......wyybbbbyyw.......',
        '.....yy.wwyyyyww.yy.....',
        '....yy...kddddk...yy....',
        '.........kmmmmk.........',
        '.........kssssk.........',
        '.........kmmmmk.........',
        '..........kddk..........',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................'
      ],
      // Frame 2: Brilliant flash! Specular white core, rays expand
      [
        '...........ww...........',
        '..ww......wwww......ww..',
        '...ww.....wwww.....ww...',
        '....ww..wwyyyyww..ww....',
        '.......wyywwwwyyw.......',
        '..ww..wyww....wwyw..ww..',
        'wwwwwwyb..wwww..bywwwwww',
        '..ww.wyb..wwww..byw.ww..',
        '......wyb..ww..byw......',
        '.......wyb.ww.byw.......',
        '....ww.wyybbbbyyw.ww....',
        '...ww...wwyyyyww...ww...',
        '..ww.....kddddk.....ww..',
        '.........kmmmmk.........',
        '.........kssssk.........',
        '.........kmmmmk.........',
        '..........kddk..........',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................'
      ],
      // Frame 3: Radiant pulse peak, diagonal rays
      [
        '...........yy...........',
        '..yy......yyyy......yy..',
        '...yy.....wwww.....yy...',
        '....yy..wwyyyyww..yy....',
        '.......wyybbbbyyw.......',
        '..yy..wybb....bbyw..yy..',
        'yyyyywyb..kwwk..bywyyyyy',
        '..yy.wyb..kwwk..byw.yy..',
        '......wyb..oo..byw......',
        '.......wyb.oo.byw.......',
        '....yy.wyybbbbyyw.yy....',
        '...yy...wwyyyyww...yy...',
        '..yy.....kddddk.....yy..',
        '.........kmmmmk.........',
        '.........kssssk.........',
        '.........kmmmmk.........',
        '..........kddk..........',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................'
      ],
      // Frame 4: Rays dissipating, glow softens
      [
        '...........yy...........',
        '..........yyyy..........',
        '....yy....wwww....yy....',
        '.....yy.wwyyyyww.yy.....',
        '.......wyybbbbyyw.......',
        '......wybb....bbyw......',
        '..yy.wyb..kowk..byw.yy..',
        '...yywyb..kwwk..bywyy...',
        '.....wyb...kk...byw.....',
        '......wyb..oo..byw......',
        '.......wyybbbbyyw.......',
        '.....yy.wwyyyyww.yy.....',
        '....yy...kddddk...yy....',
        '.........kmmmmk.........',
        '.........kssssk.........',
        '.........kmmmmk.........',
        '..........kddk..........',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................'
      ],
      // Frame 5: Resetting to calm incandescent warmth
      [
        '........................',
        '........................',
        '..........wwww..........',
        '........wwyyyyww........',
        '.......wyybbbbyyw.......',
        '......wybb....bbyw......',
        '.....wyb..kowk..byw.....',
        '.....wyb..kowk..byw.....',
        '.....wyb...kk...byw.....',
        '......wyb..oo..byw......',
        '.......wyybbbbyyw.......',
        '........wwyyyyww........',
        '.........kddddk.........',
        '.........kmmmmk.........',
        '.........kssssk.........',
        '.........kmmmmk.........',
        '..........kddk..........',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................',
        '........................'
      ]
    ];

    return rawFrames.map(rows => ({ rows }));
  }

  const asset = {
    id: 'buff_inspiration',
    category: 'hud',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Glowing vintage Edison lightbulb buff icon with flashing incandescent filament and radiant inspiration rays',
    palette: {
      '.': null,
      'k': '#624406', // filament / glass dark shadow outline
      'o': '#d97a0c', // glowing orange filament
      'b': '#ffc62a', // golden inner glow
      'y': '#fff4a0', // bright radiant yellow
      'w': '#ffffff', // white-hot filament flash / glass specular
      'd': '#303c4a', // screw base deep outline
      'm': '#687a8c', // screw base metal thread
      's': '#b8c6d4'  // screw base metal highlight
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
