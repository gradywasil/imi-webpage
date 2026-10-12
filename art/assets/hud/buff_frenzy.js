(function (root) {
  'use strict';

  // buff_frenzy: 24x24 · 6 frames · 8 fps · loop
  // Raging typing frenzy buff icon: crackling electric lightning bolt
  // surrounded by leaping flame tongues and surging plasma pulses.

  function buildFrames() {
    const rawFrames = [
      // Frame 0: Flames base rise, lightning charging
      [
        '........................',
        '..........kB............',
        '.........kRRB...........',
        '........kRgRRB..........',
        '........kggoRB..........',
        '.......kggyygoB...kB....',
        '......kgyyyyyooB.kRkB...',
        '......kgywwyyygoBkRgB...',
        '.....kggyyywyyygggyoB...',
        '.....kgooyyywyyygyoB....',
        '....kRooggyyywyyyoB.....',
        '....kRoggggggyyyyyoB....',
        '.....kRggwwyyyyyyyoB....',
        '......kgyyyywyyyygoB....',
        '......kyyyyywwyyggoB....',
        '.....kgyyyyyyywwygoB....',
        '.....kgyyywyyyyyygoB....',
        '....kRgyywyyyyyyygoB....',
        '....kRggwyyyyyyygoB.....',
        '....kRggooyyyyggoB......',
        '.....kRRgggooooRB.......',
        '......kRRRBBBBRB........',
        '........kBBBBk..........',
        '........................'
      ],
      // Frame 1: Electric flash surge! Core turns specular white, flame peaks
      [
        '........................',
        '.........kRB............',
        '........kRgRB...........',
        '.......kRgggRB..........',
        '.......kggyygoB.........',
        '......kgyywwygoB..kRB...',
        '......kgywwwwyyggkRgoB..',
        '.....kgyywwyyyyygggyoB..',
        '.....kggyyyyywyyyyyoB...',
        '....kRooyyyyywwyygyoB...',
        '....kRoggyyyyywyyyoB....',
        '.....kRggwwyyyyyyyoB....',
        '......kgyyywwyyyygoB....',
        '......kyyyyywwyyggoB....',
        '.....kgyyyyyywwyygoB....',
        '.....kgyyywwyywwygoB....',
        '....kRgyywwyyyyyygoB....',
        '....kRggwyyyyyyygoB.....',
        '....kRggooyyyyggoB......',
        '.....kRRgggooooRB.......',
        '......kRRRBBBBRB........',
        '........kBBBBk..........',
        '........................',
        '........................'
      ],
      // Frame 2: Flames curl right, lightning discharge
      [
        '........................',
        '..........kB............',
        '.........kRRB...........',
        '........kRggRB...kRB....',
        '.......kRggygoB.kRgoB...',
        '.......kggyyygoBkgygoB..',
        '......kgyyyyyygggyygoB..',
        '.....kgyywwyyyyyyyyoB...',
        '.....kggyyywwyyyyyyoB...',
        '....kRooyyyywwyygyoB....',
        '....kRoggyyyywwyyyoB....',
        '....kRggggggyywwyyoB....',
        '.....kRggwwyyyywwyoB....',
        '......kgyyyywyyywgoB....',
        '......kyyyyywwyyggoB....',
        '.....kgyyyyyyywwygoB....',
        '.....kgyyywyyyyyygoB....',
        '....kRgyywyyyyyyygoB....',
        '....kRggwyyyyyyygoB.....',
        '....kRggooyyyyggoB......',
        '.....kRRgggooooRB.......',
        '......kRRRBBBBRB........',
        '........kBBBBk..........',
        '........................'
      ],
      // Frame 3: Flame tongues split, energy arcs
      [
        '........................',
        '...........kB...........',
        '..........kRRB..........',
        '.........kRggRB.........',
        '........kRggygoB..kRB...',
        '.......kggyyyygoBkRgoB..',
        '......kgyyyyyyygggygoB..',
        '......kgywwyyyyyyyyoB...',
        '.....kggyyywyyyyyyyoB...',
        '.....kgooyyywyyygyoB....',
        '....kRooggyyywyyyoB.....',
        '....kRoggggggywyyyoB....',
        '.....kRggwwyyywwyoB.....',
        '......kgyyyywyywwgoB....',
        '......kyyyyywwyyggoB....',
        '.....kgyyyyyyywwygoB....',
        '.....kgyyywyyyyyygoB....',
        '....kRgyywyyyyyyygoB....',
        '....kRggwyyyyyyygoB.....',
        '....kRggooyyyyggoB......',
        '.....kRRgggooooRB.......',
        '......kRRRBBBBRB........',
        '........kBBBBk..........',
        '........................'
      ],
      // Frame 4: Second lightning pulse snap! White core sparks
      [
        '........................',
        '..........kRB...........',
        '.........kRgRB..........',
        '........kRgggRB.........',
        '........kggyygoB..kRB...',
        '.......kgyywwygoBkRgoB..',
        '......kgyywwwwyygggyoB..',
        '......kgyywwyyyyyyyoB...',
        '.....kggyyyyywwyyyyoB...',
        '.....kgooyyyyywwygyoB...',
        '....kRooggyyyyywyyyoB...',
        '....kRoggggggyywwyyoB...',
        '.....kRggwwyyyyyyyoB....',
        '......kgyyywwyyyygoB....',
        '......kyyyyywwyyggoB....',
        '.....kgyyyyyywwyygoB....',
        '.....kgyyywwyyyyygoB....',
        '....kRgyywwyyyyyygoB....',
        '....kRggwyyyyyyygoB.....',
        '....kRggooyyyyggoB......',
        '.....kRRgggooooRB.......',
        '......kRRRBBBBRB........',
        '........kBBBBk..........',
        '........................'
      ],
      // Frame 5: Flames recede toward cycle start, embers glow
      [
        '........................',
        '..........kB............',
        '.........kRRB...........',
        '........kRgRRB..........',
        '........kggoRB..........',
        '.......kggyygoB...kB....',
        '......kgyyyyyooB.kRkB...',
        '......kgywwyyygoBkRgB...',
        '.....kggyyywyyygggyoB...',
        '.....kgooyyywyyygyoB....',
        '....kRooggyyywyyyoB.....',
        '....kRoggggggyyyyyoB....',
        '.....kRggwwyyyyyyyoB....',
        '......kgyyyywyyyygoB....',
        '......kyyyyywwyyggoB....',
        '.....kgyyyyyyywwygoB....',
        '.....kgyyywyyyyyygoB....',
        '....kRgyywyyyyyyygoB....',
        '....kRggwyyyyyyygoB.....',
        '....kRggooyyyyggoB......',
        '.....kRRgggooooRB.......',
        '......kRRRBBBBRB........',
        '........kBBBBk..........',
        '........................'
      ]
    ];

    return rawFrames.map(rows => ({ rows }));
  }

  const asset = {
    id: 'buff_frenzy',
    category: 'hud',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Typing frenzy buff icon with crackling electric lightning bolt and leaping fire flames',
    palette: {
      '.': null,
      'k': '#420a06', // deep crimson flame outline
      'B': '#6e3004', // deep flame shadow outline
      'S': '#781c16', // shadow red
      'R': '#e86a50', // bright flame red
      'o': '#d97a0c', // fire orange
      'g': '#ffc62a', // gold flame light
      'y': '#fff4a0', // lightning hot yellow
      'w': '#ffffff'  // electric specular white core
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
