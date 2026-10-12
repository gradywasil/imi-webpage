/* ============================================================================
   MONKEYOS V2 - ART PASS 2 LOOK BIBLE PALETTE KIT
   5-step hue-shifted ramps [highlight, light, base, shadow, deep]
   Selective colored outlines, no pure #000000, pixel purity.
   ============================================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ArtV2 = root.ArtV2 || {};
    root.ArtV2.Palette = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 5-step hue shifted ramps: [0: highlight, 1: light, 2: base, 3: shadow, 4: deep]
  // Deep/darkest tone is suitable for selective outlines (outlineOf).
  const RAMPS = {
    // Bananas & Gold
    banY:   ['#fffbe0', '#fff08c', '#ffd23a', '#c98f0e', '#5a3a06'],
    gold:   ['#fffbe0', '#fff08c', '#ffd23a', '#b38004', '#4a2e04'],
    banIn:  ['#ffffff', '#fff6c0', '#f6e08a', '#d8b44a', '#8a6820'],
    banG:   ['#f4ffe0', '#cdee74', '#9ccf3f', '#5c9a22', '#2a500e'],

    // Woods & Leathers
    wood:   ['#eed0a4', '#b57d3e', '#8a5a2b', '#5a3517', '#30180a'],
    woodD:  ['#b07844', '#7d4f26', '#5a3517', '#3a1e0b', '#200e05'],
    woodL:  ['#ffeed0', '#e8b878', '#c08a4a', '#7a4a1e', '#42240a'],
    coco:   ['#caa078', '#86592e', '#563418', '#381e0c', '#1e0e04'],
    stem:   ['#ba8860', '#7a4c28', '#52301a', '#361d0e', '#1c0c04'],
    bronze: ['#ffe6cc', '#dca06a', '#a86834', '#6e3c16', '#3e1e08'],

    // Fur & Skin
    fur:    ['#ba8248', '#9a6232', '#6e4220', '#4a2814', '#261208'],
    furD:   ['#8e5628', '#6e4220', '#4f2d14', '#351c0c', '#1c0c05'],
    skin:   ['#fff4e4', '#f6d6a8', '#e0aa76', '#b97c4c', '#724220'],

    // Foliage & Nature
    leaf:   ['#a8ec76', '#74c648', '#2f8a35', '#1a5e24', '#0c3012'],
    leafD:  ['#62c85e', '#3f9a3a', '#1f6a2a', '#12441a', '#08220c'],
    vine:   ['#a6ea72', '#6fc04a', '#2f8a35', '#17481f', '#0c2810'],

    // Metals & Inks
    metal:  ['#ffffff', '#d8d8e4', '#a4a4b4', '#626274', '#343444'],
    silver: ['#ffffff', '#e8f0f8', '#b8c6d4', '#687a8c', '#303c4a'],
    ink:    ['#5c4650', '#3a2a30', '#1a0f14', '#12090e', '#0a0408'],
    paper:  ['#ffffff', '#fff6d6', '#ede0b8', '#c9b88a', '#786842'],

    // Skies & Celestial
    drop:   ['#ffffff', '#d6f0ff', '#7ec8f0', '#3a8ec8', '#184c78'],
    sky:    ['#e4f6ff', '#9ce0ff', '#52b8ec', '#2878b4', '#123e64'],
    blue:   ['#8caef8', '#5470d8', '#2e44a8', '#1a2872', '#0c1442'],
    sun:    ['#fffbe0', '#fff4a0', '#ffc62a', '#d97a0c', '#6e3004'],
    star:   ['#ffffff', '#fff7b0', '#f4d242', '#c8981c', '#624406'],
    moon:   ['#ffffff', '#edf2fc', '#d8e0f0', '#7e8ab0', '#3a4468'],
    storm:  ['#9aa8c8', '#6a7796', '#454f6e', '#28304a', '#141828'],
    cloud:  ['#ffffff', '#eef4fb', '#d2e2f0', '#a4bcd4', '#5a7490'],

    // Rich Accents (Velvet, Rose, Ruby)
    red:    ['#ffaba0', '#e86a50', '#b8322a', '#781c16', '#420a06'],
    rose:   ['#ffb8cc', '#f08aa4', '#c8486c', '#8a2040', '#4a0a1e'],
    purple: ['#e4beff', '#b58cf0', '#7a46bc', '#4e2280', '#280c48']
  };

  // Outline helper: selects darkest ramp step or computes 50% darker tone
  function outlineColor(hex) {
    if (!hex || hex === '#000000') return '#0a0408';
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(8, Math.round(r * 0.45));
    g = Math.max(4, Math.round(g * 0.45));
    b = Math.max(8, Math.round(b * 0.45));
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  // Build a standard ramp palette map:
  // e.g. buildRampMap('gold', { prefix: 'g', transparent: '.' })
  function buildRampMap(rampName, opts = {}) {
    const ramp = RAMPS[rampName];
    if (!ramp) throw new Error(`Unknown ramp: ${rampName}`);
    const p = opts.prefix || '';
    const res = {};
    if (opts.transparent !== false) res['.'] = null;
    res[p + 'w'] = ramp[0]; // highlight / white glint
    res[p + 'h'] = ramp[1]; // light
    res[p + 'b'] = ramp[2]; // base
    res[p + 's'] = ramp[3]; // shadow
    res[p + 'd'] = ramp[4]; // deep / outline
    return res;
  }

  return {
    RAMPS,
    outlineColor,
    buildRampMap
  };
});
