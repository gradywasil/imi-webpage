(function (root) {
  'use strict';

  function buildFrames() {
    const frames = [];

    // 6-frame animation: globe meridian shifts, bubbles breathe, glyphs drift
    for (let f = 0; f < 6; f++) {
      const g = Array.from({ length: 24 }, () => Array(24).fill('.'));

      // Breathing scale: alternating 0 and 1
      const pulse = (f === 1 || f === 2 || f === 4) ? 1 : 0;

      // 1. Upper-Left Speech Bubble ('A' in Sky Blue)
      // Body bounding box: x=2..12, y=2..11 (with pulse slight expansion)
      // Outline: 'D' (#0c1442)
      // Fill: 'W' (#ffffff), shadow edge: 'B' (#52b8ec)
      const bx1 = 3 - pulse;
      const bx2 = 12;
      const by1 = 2;
      const by2 = 10 + pulse;

      // Draw rounded speech bubble
      for (let y = by1; y <= by2; y++) {
        for (let x = bx1; x <= bx2; x++) {
          const isCorner = (x === bx1 && y === by1) || (x === bx2 && y === by1) ||
                           (x === bx1 && y === by2) || (x === bx2 && y === by2);
          const isEdge = (x === bx1 || x === bx2 || y === by1 || y === by2);

          if (isCorner) {
            // skip sharp corner for rounded appearance
            continue;
          } else if (isEdge) {
            g[y][x] = 'D';
          } else if (x === bx2 - 1 || y === by2 - 1) {
            g[y][x] = 'B'; // subtle shadow
          } else {
            g[y][x] = 'W';
          }
        }
      }
      // Corner roundings
      g[by1 + 1][bx1] = 'D'; g[by1][bx1 + 1] = 'D';
      g[by1 + 1][bx2] = 'D'; g[by1][bx2 - 1] = 'D';
      g[by2 - 1][bx1] = 'D'; g[by2][bx1 + 1] = 'D';
      g[by2 - 1][bx2] = 'D'; g[by2][bx2 - 1] = 'D';

      // Bubble pointer tail (pointing down-right)
      g[by2 + 1][8] = 'D'; g[by2 + 1][9] = 'B'; g[by2 + 1][10] = 'D';
      g[by2 + 2][9] = 'D'; g[by2 + 2][10] = 'D';
      if (pulse === 1) g[by2 + 3][10] = 'D';

      // Crisp 'A' glyph inside left bubble (x=6..8, y=4..8)
      g[4][7] = 'i';
      g[5][6] = 'i'; g[5][8] = 'i';
      g[6][6] = 'i'; g[6][7] = 'i'; g[6][8] = 'i';
      g[7][6] = 'i'; g[7][8] = 'i';
      g[8][6] = 'i'; g[8][8] = 'i';

      // 2. Lower-Right Speech Bubble (Eastern Glyph in Warm Gold)
      // Body bounding box: x=11..21, y=12..21
      const rx1 = 11;
      const rx2 = 20 + pulse;
      const ry1 = 12 - pulse;
      const ry2 = 21;

      for (let y = ry1; y <= ry2; y++) {
        for (let x = rx1; x <= rx2; x++) {
          const isCorner = (x === rx1 && y === ry1) || (x === rx2 && y === ry1) ||
                           (x === rx1 && y === ry2) || (x === rx2 && y === ry2);
          const isEdge = (x === rx1 || x === rx2 || y === ry1 || y === ry2);

          if (isCorner) {
            continue;
          } else if (isEdge) {
            g[y][x] = 'G';
          } else if (x === rx2 - 1 || y === ry2 - 1) {
            g[y][x] = 's';
          } else if (x === rx1 + 1 || y === ry1 + 1) {
            g[y][x] = 'p';
          } else {
            g[y][x] = 't';
          }
        }
      }
      // Corner roundings
      g[ry1 + 1][rx1] = 'G'; g[ry1][rx1 + 1] = 'G';
      g[ry1 + 1][rx2] = 'G'; g[ry1][rx2 - 1] = 'G';
      g[ry2 - 1][rx1] = 'G'; g[ry2][rx1 + 1] = 'G';
      g[ry2 - 1][rx2] = 'G'; g[ry2][rx2 - 1] = 'G';

      // Bubble pointer tail (pointing up-left)
      g[ry1 - 1][13] = 'G'; g[ry1 - 1][14] = 't'; g[ry1 - 1][15] = 'G';
      g[ry1 - 2][13] = 'G'; g[ry1 - 2][14] = 'G';

      // Stylized '文' character inside right bubble
      // Top dot:
      g[ry1 + 2][16] = 'i';
      // Horizontal bar:
      g[ry1 + 3][14] = 'i'; g[ry1 + 3][15] = 'i'; g[ry1 + 3][16] = 'i'; g[ry1 + 3][17] = 'i'; g[ry1 + 3][18] = 'i';
      // Crossed legs:
      g[ry1 + 4][15] = 'i'; g[ry1 + 4][17] = 'i';
      g[ry1 + 5][14] = 'i'; g[ry1 + 5][18] = 'i';

      // 3. Central Mini Globe Emblem (x=9..15, y=9..15)
      // Rotating longitude line: shift varies with f (0..5)
      const longShift = (f % 4) - 1; // -1, 0, 1, 2, -1, 0

      // Globe circle
      const globeCoords = [
        [10, 10], [11, 10], [12, 10], [13, 10], [14, 10],
        [9, 11], [15, 11],
        [9, 12], [15, 12],
        [9, 13], [15, 13],
        [10, 14], [11, 14], [12, 14], [13, 14], [14, 14]
      ];
      globeCoords.forEach(([gx, gy]) => {
        g[gy][gx] = 'D';
      });

      // Globe interior fill
      for (let y = 11; y <= 13; y++) {
        for (let x = 10; x <= 14; x++) {
          g[y][x] = 'H';
        }
      }
      // Equator
      g[12][10] = 'g'; g[12][11] = 'g'; g[12][12] = 'g'; g[12][13] = 'g'; g[12][14] = 'g';
      // Rotating meridian line
      const mX = 12 + longShift;
      if (mX >= 10 && mX <= 14) {
        g[11][mX] = 'g';
        g[13][mX] = 'l';
      }

      // 4. Floating rune particles between bubbles (drifting upward)
      const pY = (18 - (f * 2)) % 12 + 5;
      if (pY >= 4 && pY <= 17) {
        g[pY][2] = 'H'; g[pY][3] = 'H';
      }
      const pY2 = (14 - (f * 2)) % 10 + 6;
      if (pY2 >= 5 && pY2 <= 18) {
        g[pY2][21] = 't'; g[pY2][22] = 't';
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'translation',
    category: 'deals',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Twin speech bubbles (English A and foreign kanji) with spinning globe and floating particles',
    palette: {
      '.': null,
      'D': '#0c1442', // deep blue outline
      'S': '#2878b4', // sky shadow
      'B': '#52b8ec', // sky base
      'H': '#9ce0ff', // sky highlight
      'W': '#ffffff', // white highlight
      'G': '#4a2e04', // gold deep outline
      's': '#b38004', // gold shadow
      'y': '#ffd23a', // gold base
      't': '#fff08c', // gold light
      'p': '#fffbe0', // gold highlight
      'i': '#1a0f14', // ink dark
      'g': '#2f8a35', // foliage base (globe)
      'l': '#74c648'  // foliage light (globe)
    },
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
