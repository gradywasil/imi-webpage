(function (root) {
  'use strict';

  // Stamp 1: DRAFT - 24x24, 4 frames, 8 fps, loop: true
  // Faded blue rubber ink stamp "DRAFT" with worn distress,
  // rubber stamp box, and slight impact shake / ink bleed vibration.

  const P = {
    '.': null,
    // Faded Blue Rubber Ink Ramp (from RAMPS.sky)
    'k': '#123e64', // deep ink / heavy pressure
    's': '#2878b4', // stamp ink shadow
    'b': '#52b8ec', // base rubber stamp ink
    'l': '#9ce0ff', // light ink fade / paper bleed
    'h': '#e4f6ff'  // faint ink dusting
  };

  // 24x12 Stamp Grid definition (x: 2..21, y: 0..11)
  // Box: outer border, inner border, letters D R A F T
  function getStampRows(variant) {
    if (variant === 0) { // Crisp firm imprint
      return [
        '..kkssbbssssbbsskk..', // y=0: top outer border
        '.ksllbbssssssssllsk.', // y=1: top inner bevel
        '.sl................ls.', // y=2
        '.sb.kk..kk..k...kk.kkb.', // y=3: letters top
        '.sb.k.k.k.k.k.k.k...k.b.', // y=4
        '.sb.k.k.kk..kkk.kk..k.b.', // y=5: letters mid
        '.sb.k.k.k.k.k.k.k...k.b.', // y=6
        '.sb.kk..k.k.k.k.k...k.b.', // y=7: letters bot
        '.sl................ls.', // y=8
        '.ksllbbssssssssllsk.', // y=9: bot inner bevel
        '..kkssbbssssbbsskk..', // y=10: bot outer border
        '....................'  // y=11
      ];
    }
    if (variant === 1) { // Impact recoil: shifted slightly with ink splatter
      return [
        '..skssbbssssbbssks..',
        '.ksllbbssssssssllsk.',
        '.sl................ls.',
        '.sb.kk..kk..k...kk.kkb.',
        '.sb.k.k.k.k.k.k.k...k.b.',
        '.sb.k.k.kk..kkk.kk..k.b.',
        '.sb.k.k.k.k.k.k.k...k.b.',
        '.sb.kk..k.k.k.k.k...k.b.',
        '.sl................ls.',
        '.ksllbbssssssssllsk.',
        '..skssbbssssbbssks..',
        '....................'
      ];
    }
    if (variant === 2) { // Settling bounce with darker pressure bleed
      return [
        '..kkssbbssssbbsskk..',
        '.klllbbsssssssslllk.',
        '.sl................ls.',
        '.sb.kk..kk..k...kk.kkb.',
        '.sb.k.k.k.k.k.k.k...k.b.',
        '.sb.k.k.kk..kkk.kk..k.b.',
        '.sb.k.k.k.k.k.k.k...k.b.',
        '.sb.kk..k.k.k.k.k...k.b.',
        '.sl................ls.',
        '.klllbbsssssssslllk.',
        '..kkssbbssssbbsskk..',
        '....................'
      ];
    }
    // Variant 3: Rest state with soft bleed
    return [
      '..kkssbbssssbbsskk..',
      '.ksllbbssssssssllsk.',
      '.sl................ls.',
      '.sb.sk..sk..s...sk.skb.',
      '.sb.s.s.s.s.s.s.s...s.b.',
      '.sb.s.s.sk..sss.sk..s.b.',
      '.sb.s.s.s.s.s.s.s...s.b.',
      '.sb.sk..s.s.s.s.s...s.b.',
      '.sl................ls.',
      '.ksllbbssssssssllsk.',
      '..kkssbbssssbbsskk..',
      '....................'
    ];
  }

  function buildFrames() {
    const frames = [];

    // Frame 0: firm imprint at y=6
    // Frame 1: recoil shake at y=5 + tiny ink spatter
    // Frame 2: bounce settling at y=6
    // Frame 3: resting bleed at y=6

    const yOffsets = [6, 5, 6, 6];
    const variants = [0, 1, 2, 3];

    for (let f = 0; f < 4; f++) {
      const g = Array.from({ length: 24 }, () => Array(24).fill('.'));
      const stamp = getStampRows(variants[f]);
      const yOff = yOffsets[f];

      for (let sy = 0; sy < stamp.length; sy++) {
        const row = stamp[sy];
        const ty = yOff + sy;
        if (ty >= 0 && ty < 24) {
          for (let sx = 0; sx < row.length; sx++) {
            const ch = row[sx];
            const tx = 2 + sx;
            if (tx >= 0 && tx < 24 && ch !== '.') {
              g[ty][tx] = ch;
            }
          }
        }
      }

      // Add paired ink spatter dots on frame 1 (recoil) to ensure no orphans
      if (f === 1) {
        g[3][4] = 's'; g[3][5] = 's';
        g[19][18] = 's'; g[19][19] = 's';
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'stamp_draft',
    category: 'titles',
    size: [24, 24],
    fps: 8,
    loop: true,
    notes: 'Faded blue rubber ink stamp "DRAFT" with slight impact shake and ink spatter',
    palette: P,
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || {}).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
