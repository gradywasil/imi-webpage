(function (root) {
  'use strict';

  // tab_studios: 16x16 · 4 frames · 8 fps · loop
  // Classic cinema film reel with spinning spokes and celluloid film strip.

  function buildFrames() {
    const rawFrames = [
      // Frame 0: Spokes aligned orthogonally (+), film tail rest
      [
        '................',
        '.....dddd.......',
        '...ddhhhhdd.....',
        '..dhhssssmmd....',
        '.dhm.dddd.hmd...',
        '.dhs.dppd.smd...',
        '.dhs.dppd.smd...',
        '.dhm.dddd.hmd...',
        '..dmmssssmmd....',
        '...ddmmmmdd.i...',
        '.....dddd..iid..',
        '..........isii..',
        '.........isiid..',
        '..........idd...',
        '................',
        '................'
      ],
      // Frame 1: Spokes rotate 22 degrees clockwise, film tail flexes
      [
        '................',
        '.....dddd.......',
        '...ddhhhhdd.....',
        '..dhh.ss.mmd....',
        '.dhm..dd..hmd...',
        '.dhs.dppd.smd...',
        '.dhs.dppd.smd...',
        '.dhm..dd..hmd...',
        '..dmm.ss.mmd....',
        '...ddmmmmdd.i...',
        '.....dddd..iid..',
        '..........isii..',
        '.........isii...',
        '..........idd...',
        '................',
        '................'
      ],
      // Frame 2: Spokes rotated to diagonal (x), film tail advances
      [
        '................',
        '.....dddd.......',
        '...ddhhhhdd.....',
        '..dh.ssss.md....',
        '.dh..dddd..md...',
        '.dh..dppd..md...',
        '.dh..dppd..md...',
        '.dh..dddd..md...',
        '..dm.ssss.md....',
        '...ddmmmmdd.i...',
        '.....dddd..iid..',
        '..........isii..',
        '.........isiid..',
        '..........idd...',
        '................',
        '................'
      ],
      // Frame 3: Spokes rotated 67 degrees clockwise, completing 90 deg cycle
      [
        '................',
        '.....dddd.......',
        '...ddhhhhdd.....',
        '..dhh.ss.mmd....',
        '.dhm..dd..hmd...',
        '.dhs.dppd.smd...',
        '.dhs.dppd.smd...',
        '.dhm..dd..hmd...',
        '..dmm.ss.mmd....',
        '...ddmmmmdd..i..',
        '.....dddd..iid..',
        '..........isii..',
        '.........isiid..',
        '..........idd...',
        '................',
        '................'
      ]
    ];

    return rawFrames.map(rows => ({ rows }));
  }

  const asset = {
    id: 'tab_studios',
    category: 'hud',
    size: [16, 16],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Classic cinema 35mm film reel tab icon with rotating spoke cutouts and celluloid film leader',
    palette: {
      '.': null,
      'd': '#343444', // reel metal deep outline
      's': '#626274', // reel shadow
      'm': '#a4a4b4', // reel metal base
      'h': '#d8d8e4', // reel metal highlight
      'w': '#ffffff', // film sheen
      'i': '#1a0f14', // celluloid film deep ink
      'p': '#ffd23a'  // brass center spindle rivet
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
