(function (root) {
  'use strict';

  // tab_garden: 16x16 · 4 frames · 8 fps · loop
  // Seedling sprout in terracotta pot with gently waving spring leaves and dewdrop glint.

  function buildFrames() {
    const rawFrames = [
      // Frame 0: Resting pose, left leaf lifted, right leaf broad
      [
        '................',
        '....hh..........',
        '...hllh...ll....',
        '..hlllb..lbbl...',
        '..ebbe..sbbe....',
        '....s.eebes.....',
        '....sbblss......',
        '.....ebbe.......',
        '.....ebbe.......',
        '....tttttt......',
        '...dppppppd.....',
        '...dooooppd.....',
        '....dooppd......',
        '.....dddd.......',
        '................',
        '................'
      ],
      // Frame 1: Breeze wave: leaves flex up, dewdrop shines on tip
      [
        '................',
        '...whh..........',
        '..hllh....ll....',
        '..hlllb..lbbl...',
        '...ebbe.sbbe....',
        '....s.eebes.....',
        '....sbblss......',
        '.....ebbe.......',
        '.....ebbe.......',
        '....tttttt......',
        '...dppppppd.....',
        '...dooooppd.....',
        '....dooppd......',
        '.....dddd.......',
        '................',
        '................'
      ],
      // Frame 2: Right leaf waves up, dewdrop slides
      [
        '................',
        '....hh....ww....',
        '...hllh..lllh...',
        '..hllb...lbbl...',
        '..ebbe..sbbe....',
        '....s.eebes.....',
        '....sbblss......',
        '.....ebbe.......',
        '.....ebbe.......',
        '....tttttt......',
        '...dppppppd.....',
        '...dooooppd.....',
        '....dooppd......',
        '.....dddd.......',
        '................',
        '................'
      ],
      // Frame 3: Leaves settling softly back down
      [
        '................',
        '....hh..........',
        '...hllh..lllh...',
        '..hllb...lbbl...',
        '..ebbe..sbbe....',
        '....s.eebes.....',
        '....sbblss......',
        '.....ebbe.......',
        '.....ebbe.......',
        '....tttttt......',
        '...dppppppd.....',
        '...dooooppd.....',
        '....dooppd......',
        '.....dddd.......',
        '................',
        '................'
      ]
    ];

    return rawFrames.map(rows => ({ rows }));
  }

  const asset = {
    id: 'tab_garden',
    category: 'hud',
    size: [16, 16],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Seedling sprout in terracotta pot with waving green leaves and dewdrop glint',
    palette: {
      '.': null,
      'e': '#0c3012', // leaf deep outline
      's': '#1a5e24', // leaf shadow
      'b': '#2f8a35', // leaf base green
      'l': '#74c648', // leaf light green
      'h': '#a8ec76', // leaf highlight
      'w': '#ffffff', // dewdrop sparkle
      'd': '#30180a', // pot deep outline
      'o': '#5a3517', // pot terracotta shadow
      'p': '#8a5a2b', // pot terracotta base
      't': '#b57d3e'  // pot rim highlight
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
