(function (root) {
  'use strict';

  // streak_banner: 32x16 · 6 frames · 8 fps · loop
  // Golden ribbon banner "x10 STREAK" with traveling specular sheen sweep
  // and fluttering ribbon swallowtail ends.

  function buildFrames() {
    const rawFrames = [
      // Frame 0: Sheen on left ribbon tail, left tail flutter up
      [
        '................................',
        '..ww............................',
        '.kwwkkkkkkkkkkkkkkkkkkkkkkkkbbk.',
        '.kwwwbbbbbbbbbbbbbbbbbbbbbbbbbk.',
        'kswbii.i.iii.ii.iii.ii.ii.i.iisb',
        'ksbb.i.i.i.i.i...i..i.i.i.i.i.sb',
        'ksbb.i.i.i.i.ii..i..ii.ii.iii.sb',
        'ksbb.i.i.i.i...i.i..i.i.i.i.i.sb',
        'kswbii.i.iii.ii..i..i.i.ii.iiisb',
        '.kwwwbbbbbbbbbbbbbbbbbbbbbbbbbk.',
        '.kwwkkkkkkkkkkkkkkkkkkkkkkkkbbk.',
        '..kk........................kk..',
        '................................',
        '................................',
        '................................',
        '................................'
      ],
      // Frame 1: Sheen sweeps over "x10", left tail dips
      [
        '................................',
        '................................',
        '.kllkkkkkkkkkkkkkkkkkkkkkkkkbbk.',
        '.kllwbbbbbbbbbbbbbbbbbbbbbbbbbk.',
        'kslbww.i.iii.ii.iii.ii.ii.i.iisb',
        'kslb.w.i.i.i.i...i..i.i.i.i.i.sb',
        'kslb.w.i.i.i.ii..i..ii.ii.iii.sb',
        'kslb.w.i.i.i...i.i..i.i.i.i.i.sb',
        'kslbww.i.iii.ii..i..i.i.ii.iiisb',
        '.kllwbbbbbbbbbbbbbbbbbbbbbbbbbk.',
        '.kllkkkkkkkkkkkkkkkkkkkkkkkkbbk.',
        '..kk........................kk..',
        '..kk............................',
        '................................',
        '................................',
        '................................'
      ],
      // Frame 2: Sheen sweeps over "STR", tails level
      [
        '................................',
        '................................',
        '.kbbkkkkkkkkkkkkkkkkkkkkkkkkbbk.',
        '.kbbbbbbwwbbbbbbbbbbbbbbbbbbbbk.',
        'ksbbii.i.iww.ii.www.ii.ii.i.iisb',
        'ksbb.i.i.i.w.i...w..i.i.i.i.i.sb',
        'ksbb.i.i.i.w.ii..w..ii.ii.iii.sb',
        'ksbb.i.i.i.w...i.w..i.i.i.i.i.sb',
        'ksbbii.i.iww.ii..w..i.i.ii.iiisb',
        '.kbbbbbbwwbbbbbbbbbbbbbbbbbbbbk.',
        '.kbbkkkkkkkkkkkkkkkkkkkkkkkkbbk.',
        '..kk........................kk..',
        '................................',
        '................................',
        '................................',
        '................................'
      ],
      // Frame 3: Sheen sweeps over "EAK", right tail flutters up
      [
        '................................',
        '............................ww..',
        '.kbbkkkkkkkkkkkkkkkkkkkkkkkkbbk.',
        '.kbbbbbbbbbbbbwwbbbbbbbbbbbbbbk.',
        'ksbbii.i.iii.ii.iii.ww.ww.w.iisb',
        'ksbb.i.i.i.i.i...i..w.w.w.w.w.sb',
        'ksbb.i.i.i.i.ii..i..ww.ww.www.sb',
        'ksbb.i.i.i.i...i.i..w.w.w.w.w.sb',
        'ksbbii.i.iii.ii..i..w.w.ww.wwwsb',
        '.kbbbbbbbbbbbbwwbbbbbbbbbbbbbbk.',
        '.kbbkkkkkkkkkkkkkkkkkkkkkkkkbbk.',
        '..kk........................kk..',
        '................................',
        '................................',
        '................................',
        '................................'
      ],
      // Frame 4: Sheen reaches right ribbon tail
      [
        '................................',
        '................................',
        '.kbbkkkkkkkkkkkkkkkkkkkkkkkkwwk.',
        '.kbbbbbbbbbbbbbbbbbbbbbbbbbbwwk.',
        'ksbbii.i.iii.ii.iii.ii.ii.i.iisw',
        'ksbb.i.i.i.i.i...i..i.i.i.i.i.sb',
        'ksbb.i.i.i.i.ii..i..ii.ii.iii.sb',
        'ksbb.i.i.i.i...i.i..i.i.i.i.i.sb',
        'ksbbii.i.iii.ii..i..i.i.ii.iiisw',
        '.kbbbbbbbbbbbbbbbbbbbbbbbbbbwwk.',
        '.kbbkkkkkkkkkkkkkkkkkkkkkkkkwwk.',
        '..kk........................kk..',
        '............................kk..',
        '................................',
        '................................',
        '................................'
      ],
      // Frame 5: Tail ribbon flickers and glint resets
      [
        '................................',
        '................................',
        '.kbbkkkkkkkkkkkkkkkkkkkkkkkkllk.',
        '.kbbbbbbbbbbbbbbbbbbbbbbbbbbllk.',
        'ksbbii.i.iii.ii.iii.ii.ii.i.iisl',
        'ksbb.i.i.i.i.i...i..i.i.i.i.i.sb',
        'ksbb.i.i.i.i.ii..i..ii.ii.iii.sb',
        'ksbb.i.i.i.i...i.i..i.i.i.i.i.sb',
        'ksbbii.i.iii.ii..i..i.i.ii.iiisl',
        '.kbbbbbbbbbbbbbbbbbbbbbbbbbbllk.',
        '.kbbkkkkkkkkkkkkkkkkkkkkkkkkllk.',
        '..kk........................kk..',
        '................................',
        '................................',
        '................................',
        '................................'
      ]
    ];

    return rawFrames.map(rows => ({ rows }));
  }

  const asset = {
    id: 'streak_banner',
    category: 'hud',
    size: [32, 16],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Golden ribbon banner displaying x10 STREAK with traveling specular sheen sweep',
    palette: {
      '.': null,
      'k': '#4a2e04', // gold deep outline
      's': '#b38004', // gold shadow
      'b': '#ffd23a', // gold base
      'l': '#fff08c', // gold light
      'w': '#ffffff', // specular white sheen
      'i': '#261208'  // embossed dark text
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
