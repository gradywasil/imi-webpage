(function (root) {
  'use strict';

  // tab_desk: 16x16 · 4 frames · 8 fps · loop
  // Vintage typewriter silhouette with carriage return lever swing and paper advance.

  function buildFrames() {
    // 4-frame cycle:
    // f0: Carriage at resting center, lever up
    // f1: Carriage moving right (+1 px), lever swinging back
    // f2: Carriage at return position, lever pressed
    // f3: Carriage returning to center, lever rebounding

    // Rows: 16 rows of 16 characters each
    // Bounds: row 0 is '.', row 15 is '.', col 0 is '.', col 15 is '.'
    const rawFrames = [
      // Frame 0: rest
      [
        '................',
        '......wwww......',
        '......wppw......',
        '..h...wppw......',
        '..s...dppd......',
        '..mmmmmmmmmmmm..',
        '.dssssssssssssd.',
        '.dmmmmmmmmmmmmd.',
        '.dmhgdmhgdmhpmd.',
        '.dssssssssssssd.',
        '.dmhgdmhgdmhpmd.',
        '.dssssssssssssd.',
        '..dmmmmmmmmmmd..',
        '..kddk....kddk..',
        '................',
        '................'
      ],
      // Frame 1: swing lever back, paper shifts right
      [
        '................',
        '.......wwww.....',
        '.......wppw.....',
        '.sh....wppw.....',
        '.sd...dppd......',
        '..mmmmmmmmmmmm..',
        '.dssssssssssssd.',
        '.dmmmmmmmmmmmmd.',
        '.dmhgdmhgdmhpmd.',
        '.dssssssssssssd.',
        '.dmhgdmhgdmhpmd.',
        '.dssssssssssssd.',
        '..dmmmmmmmmmmd..',
        '..kddk....kddk..',
        '................',
        '................'
      ],
      // Frame 2: lever striking forward, carriage shifts
      [
        '................',
        '.......wwww.....',
        '.......wppw.....',
        '...h...wppw.....',
        '..sd..dppd......',
        '.dmmmmmmmmmmmm..',
        '.dssssssssssssd.',
        '.dmmmmmmmmmmmmd.',
        '.dmhgdmhgdmhpmd.',
        '.dssssssssssssd.',
        '.dmhgdmhgdmhpmd.',
        '.dssssssssssssd.',
        '..dmmmmmmmmmmd..',
        '..kddk....kddk..',
        '................',
        '................'
      ],
      // Frame 3: lever returning
      [
        '................',
        '......wwww......',
        '......wppw......',
        '..h...wppw......',
        '..sd..dppd......',
        '..mmmmmmmmmmmm..',
        '.dssssssssssssd.',
        '.dmmmmmmmmmmmmd.',
        '.dmhgdmhgdmhpmd.',
        '.dssssssssssssd.',
        '.dmhgdmhgdmhpmd.',
        '.dssssssssssssd.',
        '..dmmmmmmmmmmd..',
        '..kddk....kddk..',
        '................',
        '................'
      ]
    ];

    return rawFrames.map(rows => ({ rows }));
  }

  const asset = {
    id: 'tab_desk',
    category: 'hud',
    size: [16, 16],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Vintage typewriter tab icon with carriage return lever swing and mechanical paper advance',
    palette: {
      '.': null,
      'k': '#1a0f14', // ink deep outline
      'd': '#343444', // metal deep outline
      's': '#626274', // metal shadow
      'm': '#a4a4b4', // metal base
      'h': '#d8d8e4', // metal highlight
      'w': '#ffffff', // paper highlight
      'p': '#ede0b8', // paper cream
      'g': '#ffd23a'  // gold accent on keys
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
