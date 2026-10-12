(function (root) {
  'use strict';

  // tab_crew: 16x16 · 4 frames · 8 fps · loop
  // Chimp crew mascot wearing nautical captain hat with gold insignia,
  // ear bob and animated wink/nod.

  function buildFrames() {
    const rawFrames = [
      // Frame 0: Hat upright, attentive eyes
      [
        '................',
        '.....wwwww......',
        '....wwwwwww.....',
        '...nnnnnnnnn....',
        '...NggGgGggN....',
        '..b.NNNNNNN.b...',
        '.bBb.cBBBc.bBb..',
        '.bcbcssssscbcb..',
        '..b.ckwckwc.b...',
        '....csssssc.....',
        '....c.k.k.c.....',
        '.....cSSSc......',
        '.....bBBBb......',
        '......bbb.......',
        '................',
        '................'
      ],
      // Frame 1: Slight jaunty hat tilt left, ears twitch
      [
        '................',
        '....wwwww.......',
        '...wwwwwww......',
        '..nnnnnnnnn.....',
        '..NggGgGggN.....',
        '.b..NNNNNNN.b...',
        '.bBb.cBBBc.bBb..',
        '.bcbcssssscbcb..',
        '..b.ckwckwc.b...',
        '....csssssc.....',
        '....c.k.k.c.....',
        '.....cSSSc......',
        '.....bBBBb......',
        '......bbb.......',
        '................',
        '................'
      ],
      // Frame 2: Hat tip dip, playful wink
      [
        '................',
        '....wwwww.......',
        '...wwwwwww......',
        '..nnnnnnnnn.....',
        '..NggGgGggN.....',
        '....NNNNNNN.....',
        '.bBb.cBBBc.bBb..',
        '.bcbcssssscbcb..',
        '..b.ckw.cc..b...',
        '....csssssc.....',
        '....c.k.k.c.....',
        '.....csssc......',
        '.....bBBBb......',
        '......bbb.......',
        '................',
        '................'
      ],
      // Frame 3: Returning to center, confident grin
      [
        '................',
        '.....wwwww......',
        '....wwwwwww.....',
        '...nnnnnnnnn....',
        '...NggGgGggN....',
        '..b.NNNNNNN.b...',
        '.bBb.cBBBc.bBb..',
        '.bcbcssssscbcb..',
        '..b.ckwckwc.b...',
        '....csssssc.....',
        '....c.k.k.c.....',
        '.....csssc......',
        '.....bBBBb......',
        '......bbb.......',
        '................',
        '................'
      ]
    ];

    return rawFrames.map(rows => ({ rows }));
  }

  const asset = {
    id: 'tab_crew',
    category: 'hud',
    size: [16, 16],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Chimp crew mascot in nautical captain cap with jaunty hat tilt and wink',
    palette: {
      '.': null,
      'k': '#261208', // fur deep outline / eye pupil
      'b': '#4a2814', // fur shadow
      'B': '#6e4220', // fur base
      'c': '#e0aa76', // skin base
      's': '#f6d6a8', // skin light
      'S': '#fff4e4', // skin highlight / teeth
      'w': '#ffffff', // captain hat crown / eye glint
      'n': '#1a2872', // navy blue hat band
      'N': '#0c1442', // dark navy hat visor outline
      'g': '#ffd23a', // gold emblem base
      'G': '#fff08c'  // gold emblem highlight
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
