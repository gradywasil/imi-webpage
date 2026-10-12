(function (root) {
  'use strict';

  function buildFrames() {
    const frames = [];

    // Page flip crest coordinates per frame: [crestX, crestY, leftArc, rightArc]
    const pageAnim = [
      { crestX: 16, crestY: 5, angle: 1 },
      { crestX: 13, crestY: 3, angle: 2 },
      { crestX: 9,  crestY: 4, angle: 3 },
      { crestX: 17, crestY: 6, angle: 1 },
      { crestX: 14, crestY: 3, angle: 2 },
      { crestX: 10, crestY: 4, angle: 3 }
    ];

    for (let f = 0; f < 6; f++) {
      const g = Array.from({ length: 24 }, () => Array(24).fill('.'));
      const anim = pageAnim[f];

      // 1. Book Spine & Base Edge (Center x=10..12, y=8..20)
      // Spine bottom
      g[20][10] = 'g'; g[20][11] = 's'; g[20][12] = 'g';
      g[21][10] = 'g'; g[21][11] = 'g';

      // Spine vertical ribbing
      for (let y = 8; y <= 19; y++) {
        g[y][10] = 'g';
        g[y][11] = (y % 3 === 0) ? 't' : 'y';
        g[y][12] = 's';
      }

      // 2. Left Cover & Page Block (x=3..10, y=10..20)
      // Bottom left cover lip
      for (let x = 4; x <= 10; x++) {
        g[20][x] = 'q';
      }
      g[20][3] = 'q'; g[19][3] = 'q';
      // Red cover outside bevel
      for (let y = 11; y <= 19; y++) {
        g[y][3] = 'q';
        g[y][4] = 'r';
      }

      // Left page block (static fanned pages laying open)
      for (let y = 10; y <= 18; y++) {
        for (let x = 5; x <= 9; x++) {
          if (y === 10) {
            g[y][x] = (x === 5) ? 'k' : 'l';
          } else if (y === 18) {
            g[y][x] = 'j';
          } else {
            g[y][x] = 'b';
          }
        }
      }
      // Left page top edge
      for (let x = 5; x <= 9; x++) {
        g[9][x] = 'k';
      }
      // Faint ink text lines on left page
      g[12][6] = 'i'; g[12][7] = 'i'; g[12][8] = 'i';
      g[14][6] = 'i'; g[14][7] = 'i'; g[14][8] = 'i';
      g[16][6] = 'i'; g[16][7] = 'i';

      // 3. Right Cover & Page Block (x=12..21, y=10..20)
      // Bottom right cover lip
      for (let x = 12; x <= 20; x++) {
        g[20][x] = 'q';
      }
      g[19][21] = 'q'; g[20][21] = 'q';
      // Red cover edge
      for (let y = 11; y <= 19; y++) {
        g[y][20] = 'c';
        g[y][21] = 'q';
      }

      // Right page block
      for (let y = 10; y <= 18; y++) {
        for (let x = 13; x <= 19; x++) {
          if (y === 10) {
            g[y][x] = 'l';
          } else if (y === 18) {
            g[y][x] = 'j';
          } else {
            g[y][x] = 'b';
          }
        }
      }
      // Right page top edge
      for (let x = 13; x <= 19; x++) {
        g[9][x] = 'k';
      }
      // Faint ink text lines on right page
      g[12][14] = 'i'; g[12][15] = 'i'; g[12][16] = 'i';
      g[14][14] = 'i'; g[14][15] = 'i'; g[14][16] = 'i';
      g[16][14] = 'i'; g[16][15] = 'i';

      // 4. Fluttering Arching Flying Page (Curves smoothly above spine)
      const cx = anim.crestX;
      const cy = anim.crestY;

      // Draw arch from spine (11, 8) through (cx, cy) to tip
      if (anim.angle === 1) {
        // Lifting from right side: tip at (19, 7)
        for (let x = 11; x <= 19; x++) {
          const t = (x - 11) / 8;
          const py = Math.round(8 * (1 - t) + 7 * t - 4 * Math.sin(t * Math.PI));
          g[py - 1][x] = 'k';
          g[py][x] = 'w';
          g[py + 1][x] = 'l';
          g[py + 2][x] = 'k';
        }
      } else if (anim.angle === 2) {
        // High arch over center: tip curling at (cx + 3, cy + 2)
        for (let x = 9; x <= 16; x++) {
          const t = (x - 9) / 7;
          const py = Math.round(7 * (1 - t) + 6 * t - 5 * Math.sin(t * Math.PI));
          g[py - 1][x] = 'k';
          g[py][x] = 'w';
          g[py + 1][x] = 'l';
          g[py + 2][x] = 'k';
        }
      } else {
        // Falling onto left side: tip at (5, 8)
        for (let x = 5; x <= 12; x++) {
          const t = (x - 5) / 7;
          const py = Math.round(8 * (1 - t) + 8 * t - 4 * Math.sin(t * Math.PI));
          g[py - 1][x] = 'k';
          g[py][x] = 'w';
          g[py + 1][x] = 'l';
          g[py + 2][x] = 'k';
        }
      }

      // 5. Gold Corner Sheen Sparkle at f=0,1
      if (f === 0) {
        g[19][21] = 't';
      } else if (f === 1) {
        g[19][21] = 't';
        g[18][21] = 'w'; g[19][20] = 'w'; g[19][22] = 'w';
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'paperback',
    category: 'deals',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Pocket vintage paperback book with red/gold cover fluttering pages seamlessly',
    palette: {
      '.': null,
      'q': '#420a06', // red deep outline
      'r': '#781c16', // red shadow
      'c': '#b8322a', // red base
      'e': '#e86a50', // red light
      'g': '#4a2e04', // gold deep
      's': '#b38004', // gold shadow
      'y': '#ffd23a', // gold base
      't': '#fff08c', // gold light
      'k': '#786842', // paper dark outline
      'j': '#c9b88a', // paper shadow
      'b': '#ede0b8', // paper base
      'l': '#fff6d6', // paper light
      'w': '#ffffff', // highlight / sparkle
      'i': '#1a0f14'  // ink text lines
    },
    sparkles: [
      [21, 18], [20, 19], [22, 19], [21, 20]
    ],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
