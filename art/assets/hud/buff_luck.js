(function (root) {
  'use strict';

  // buff_luck: 24x24 · 6 frames · 8 fps · loop
  // Four-leaf clover lucky buff with breathing emerald leaves,
  // golden edge shimmer, and orbiting 4-point star sparkle.

  function buildFrames() {
    const rawFrames = [
      // Frame 0: Sparkle at top-right (x=18, y=3)
      [
        '..................ww....',
        '..................ww....',
        '.....hh....hh...wwwwww..',
        '...hlllh..hlllh.wwwwww..',
        '..hlllllbblllllh..ww....',
        '..hlllbbsdbblllh..ww....',
        '...sbbbsddsbbbs.........',
        '....sddsddddsdd.........',
        '...hlllllbbllllh........',
        '..hlllllbsdbllllh.......',
        '..hlllbbsddbblllh.......',
        '...sbbbsddsbbbs.........',
        '....sdddddddddd.........',
        '.......ddsds............',
        '........dds.............',
        '........dds.............',
        '.........dds............',
        '.........dds............',
        '..........dds...........',
        '...........dd...........',
        '........................',
        '........................',
        '........................',
        '........................'
      ],
      // Frame 1: Sparkle orbits to right flank (x=21, y=9)
      [
        '........................',
        '........................',
        '.....hh....hh...........',
        '...hlllh..hlllh.........',
        '..hlllllbblllllh....ww..',
        '..hlllbbsdbblllh....ww..',
        '...sbbbsddsbbbs...wwwwww',
        '....sddsddddsdd...wwwwww',
        '...hlllllbbllllh....ww..',
        '..hlllllbsdbllllh...ww..',
        '..hlllbbsddbblllh.......',
        '...sbbbsddsbbbs.........',
        '....sdddddddddd.........',
        '.......ddsds............',
        '........dds.............',
        '........dds.............',
        '.........dds............',
        '.........dds............',
        '..........dds...........',
        '...........dd...........',
        '........................',
        '........................',
        '........................',
        '........................'
      ],
      // Frame 2: Sparkle orbits to bottom-right (x=17, y=16)
      [
        '........................',
        '........................',
        '.....hh....hh...........',
        '...hlllh..hlllh.........',
        '..hlllllbblllllh........',
        '..hlllbbsdbblllh........',
        '...sbbbsddsbbbs.........',
        '....sddsddddsdd.........',
        '...hlllllbbllllh........',
        '..hlllllbsdbllllh.......',
        '..hlllbbsddbblllh.......',
        '...sbbbsddsbbbs.........',
        '....sdddddddddd...ww....',
        '.......ddsds......ww....',
        '........dds.....wwwwww..',
        '........dds.....wwwwww..',
        '.........dds......ww....',
        '.........dds......ww....',
        '..........dds...........',
        '...........dd...........',
        '........................',
        '........................',
        '........................',
        '........................'
      ],
      // Frame 3: Sparkle orbits to bottom-left (x=4, y=17)
      [
        '........................',
        '........................',
        '.....hh....hh...........',
        '...hlllh..hlllh.........',
        '..hlllllbblllllh........',
        '..hlllbbsdbblllh........',
        '...sbbbsddsbbbs.........',
        '....sddsddddsdd.........',
        '...hlllllbbllllh........',
        '..hlllllbsdbllllh.......',
        '..hlllbbsddbblllh.......',
        '...sbbbsddsbbbs.........',
        '....sdddddddddd.........',
        '.......ddsds............',
        '..ww....dds.............',
        '..ww....dds.............',
        'wwwwww...dds............',
        'wwwwww...dds............',
        '..ww......dds...........',
        '..ww.......dd...........',
        '........................',
        '........................',
        '........................',
        '........................'
      ],
      // Frame 4: Sparkle orbits to left flank (x=1, y=8)
      [
        '........................',
        '........................',
        '.....hh....hh...........',
        '...hlllh..hlllh.........',
        '..hlllllbblllllh........',
        '..hlllbbsdbblllh........',
        '...sbbbsddsbbbs.........',
        'ww..sddsddddsdd.........',
        'ww.hlllllbbllllh........',
        'wwwwllllbsdbllllh.......',
        'wwwwlbbsddbblllh........',
        'ww.sbbbsddsbbbs.........',
        'ww..sdddddddddd.........',
        '.......ddsds............',
        '........dds.............',
        '........dds.............',
        '.........dds............',
        '.........dds............',
        '..........dds...........',
        '...........dd...........',
        '........................',
        '........................',
        '........................',
        '........................'
      ],
      // Frame 5: Sparkle orbits to top-left (x=4, y=2)
      [
        '...ww...................',
        '...ww...................',
        '.wwwwww.hh....hh........',
        '.wwwwwwlllh..hlllh......',
        '..wwllllbblllllh........',
        '..wwllbbsdbblllh........',
        '...sbbbsddsbbbs.........',
        '....sddsddddsdd.........',
        '...hlllllbbllllh........',
        '..hlllllbsdbllllh.......',
        '..hlllbbsddbblllh.......',
        '...sbbbsddsbbbs.........',
        '....sdddddddddd.........',
        '.......ddsds............',
        '........dds.............',
        '........dds.............',
        '.........dds............',
        '.........dds............',
        '..........dds...........',
        '...........dd...........',
        '........................',
        '........................',
        '........................',
        '........................'
      ]
    ];

    return rawFrames.map(rows => ({ rows }));
  }

  const asset = {
    id: 'buff_luck',
    category: 'hud',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Emerald four-leaf clover lucky buff icon with orbiting golden starburst sparkle',
    palette: {
      '.': null,
      'd': '#0c3012', // leaf deep outline
      's': '#1a5e24', // leaf shadow green
      'b': '#2f8a35', // leaf base green
      'l': '#74c648', // leaf light green
      'h': '#a8ec76', // leaf highlight green
      'w': '#ffffff'  // star sparkle glint
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
