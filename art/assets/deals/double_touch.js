(function (root) {
  'use strict';

  function buildFrames() {
    const frames = [];

    // Exact half-period 3-frame symmetry ensures wrapDiff(5 -> 0) === diff(2, 3)
    for (let f = 0; f < 6; f++) {
      const g = Array.from({ length: 24 }, () => Array(24).fill('.'));

      // Left finger touches down on f=0 (bounces back up on f=1..2)
      // Right finger touches down on f=3 (bounces back up on f=4..5)
      const lY = (f === 0) ? 0 : ((f === 1) ? -1 : -2);
      const rY = (f === 3) ? 0 : ((f === 4) ? -1 : -2);

      // 1. Left Pointer Finger (x=4..9, y=2..14)
      for (let y = 3; y <= 12; y++) {
        const ry = y + lY;
        if (ry >= 1 && ry <= 14) {
          g[ry][5] = 'k';
          g[ry][6] = (ry < 7 + lY) ? 'h' : 'm';
          g[ry][7] = (ry < 7 + lY) ? 'p' : 'h';
          g[ry][8] = 's';
          g[ry][9] = 'k';
        }
      }
      const lTipY = 13 + lY;
      if (lTipY <= 14) {
        g[lTipY][6] = 'k'; g[lTipY][7] = 'k'; g[lTipY][8] = 'k';
      }

      // 2. Right Pointer Finger (x=14..19, y=2..14)
      for (let y = 3; y <= 12; y++) {
        const ry = y + rY;
        if (ry >= 1 && ry <= 14) {
          g[ry][14] = 'k';
          g[ry][15] = (ry < 7 + rY) ? 'h' : 'm';
          g[ry][16] = (ry < 7 + rY) ? 'p' : 'h';
          g[ry][17] = 's';
          g[ry][18] = 'k';
        }
      }
      const rTipY = 13 + rY;
      if (rTipY <= 14) {
        g[rTipY][15] = 'k'; g[rTipY][16] = 'k'; g[rTipY][17] = 'k';
      }

      // 3. Shockwave Ripple from Left Tap:
      // Active for 3 frames: f=0 (spawn/flash), f=1 (expand), f=2 (fade)
      if (f === 0 || f === 1 || f === 2) {
        const rad = 2 + f * 2;
        const col = (f === 0) ? 'w' : ((f === 1) ? 'l' : 'c');
        const cx = 7;
        const cy = 16;

        for (let dy = -1; dy <= 1; dy++) {
          const py = cy + dy;
          const x1 = Math.max(1, cx - rad);
          const x2 = Math.min(22, cx + rad);
          g[py][x1] = col; g[py][x1 + 1] = col;
          g[py][x2 - 1] = col; g[py][x2] = col;
        }
        if (f === 0) {
          g[14][6] = 'w'; g[14][7] = 'w'; g[14][8] = 'w';
        }
      }

      // 4. Shockwave Ripple from Right Tap:
      // Active for 3 frames: f=3 (spawn/flash), f=4 (expand), f=5 (fade)
      if (f === 3 || f === 4 || f === 5) {
        const stage = f - 3;
        const rad = 2 + stage * 2;
        const col = (stage === 0) ? 'w' : ((stage === 1) ? 'l' : 'c');
        const cx = 16;
        const cy = 16;

        for (let dy = -1; dy <= 1; dy++) {
          const py = cy + dy;
          const x1 = Math.max(1, cx - rad);
          const x2 = Math.min(22, cx + rad);
          g[py][x1] = col; g[py][x1 + 1] = col;
          g[py][x2 - 1] = col; g[py][x2] = col;
        }
        if (stage === 0) {
          g[14][15] = 'w'; g[14][16] = 'w'; g[14][17] = 'w';
        }
      }

      // 5. Surface Horizon Line (y=19..20, x=2..21)
      for (let x = 2; x <= 21; x++) {
        if (g[19][x] === '.') g[19][x] = 'd';
        if (g[20][x] === '.') g[20][x] = 'd';
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'double_touch',
    category: 'deals',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Dual tap glyph with staggered fingertip impacts emitting expanding concentric shockwave ripples',
    palette: {
      '.': null,
      'k': '#724220', // skin deep outline
      's': '#b97c4c', // skin shadow
      'm': '#e0aa76', // skin base
      'h': '#f6d6a8', // skin light
      'p': '#fff4e4', // skin highlight
      'd': '#123e64', // sky deep outline
      'b': '#2878b4', // sky shadow
      'c': '#52b8ec', // sky base
      'l': '#9ce0ff', // sky light
      'w': '#ffffff'  // impact flash / ring crest
    },
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
