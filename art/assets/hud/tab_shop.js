(function (root) {
  'use strict';

  // tab_shop: 16x16 · 4 frames · 8 fps · loop
  // Wooden market vendor cart heaped with glowing golden bananas,
  // rotating cart wheel spokes and traveling glint.

  function buildFrames() {
    const rawFrames = [
      // Frame 0: Glint on left banana tip, wheel spoke vertical (+)
      [
        '................',
        '.......kk.......',
        '.....kkwlkkk....',
        '....kkllbbkkk...',
        '...kklbbbbbsk...',
        '..opppppppppod..',
        '.topttpttttttod.',
        '..ooddddddddoo..',
        '.....ddddd......',
        '....dmmmmmdd....',
        '...dmm.m.mmmd...',
        '...dmm.w.mmmd...',
        '...dmm.m.mmmd...',
        '....dmmmmmdd....',
        '.....ddddd......',
        '................'
      ],
      // Frame 1: Sheen sweeps center, wheel spoke diagonal (x)
      [
        '................',
        '.......kk.......',
        '.....kkllkkk....',
        '....kkwlbbkkk...',
        '...kkllbbbbsk...',
        '..opppppppppod..',
        '.topttpttttttod.',
        '..ooddddddddoo..',
        '.....ddddd......',
        '....dmmmmmdd....',
        '...dmm...mmmd...',
        '...dmm.w.mmmd...',
        '...dmm...mmmd...',
        '....dmmmmmdd....',
        '.....ddddd......',
        '................'
      ],
      // Frame 2: Sheen on right banana crest, wheel spoke horizontal (-)
      [
        '................',
        '.......kk.......',
        '.....kkllkkk....',
        '....kkllwbkkk...',
        '...kklbbbbwsk...',
        '..opppppppppod..',
        '.topttpttttttod.',
        '..ooddddddddoo..',
        '.....ddddd......',
        '....dmmmmmdd....',
        '...dmmmmm.mmd...',
        '...dmmmmwmmmd...',
        '...dmmmmm.mmd...',
        '....dmmmmmdd....',
        '.....ddddd......',
        '................'
      ],
      // Frame 3: Sheen fades to ambient glow, wheel resets
      [
        '................',
        '.......kk.......',
        '.....kkllkkk....',
        '....kkllbbkkk...',
        '...kklbbbbbsk...',
        '..opppppppppod..',
        '.topttpttttttod.',
        '..ooddddddddoo..',
        '.....ddddd......',
        '....dmmmmmdd....',
        '...dmm...mmmd...',
        '...dmm.w.mmmd...',
        '...dmm...mmmd...',
        '....dmmmmmdd....',
        '.....ddddd......',
        '................'
      ]
    ];

    return rawFrames.map(rows => ({ rows }));
  }

  const asset = {
    id: 'tab_shop',
    category: 'hud',
    size: [16, 16],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Banana vendor shop cart with gold bananas, wooden sideboard, and rolling spoke wheel',
    palette: {
      '.': null,
      'k': '#4a2e04', // banana deep outline
      's': '#c98f0e', // banana shadow
      'b': '#ffd23a', // banana gold base
      'l': '#fff08c', // banana light
      'w': '#fffbe0', // banana glint highlight
      'd': '#30180a', // wood deep outline
      'o': '#5a3517', // wood shadow
      'p': '#8a5a2b', // wood base
      't': '#b57d3e', // wood highlight
      'm': '#a4a4b4'  // wheel iron rim / hub
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
