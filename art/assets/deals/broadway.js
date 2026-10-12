(function (root) {
  'use strict';

  function buildFrames() {
    const frames = [];

    // 16 bulbs around perimeter of marquee
    const bulbs = [
      [4, 2], [8, 2], [12, 2], [16, 2], [20, 2], // top
      [20, 6], [20, 10], [20, 14], [20, 18],     // right
      [16, 21], [12, 21], [8, 21], [4, 21],      // bottom
      [3, 18], [3, 14], [3, 10], [3, 6]          // left
    ];

    for (let f = 0; f < 6; f++) {
      const g = Array.from({ length: 24 }, () => Array(24).fill('.'));

      // 1. Marquee Outer Metal Frame / Arch (x=2..21, y=1..22)
      // Top bar
      for (let x = 3; x <= 20; x++) {
        g[1][x] = 'k';
        g[3][x] = 'd';
      }
      // Bottom bar
      for (let x = 3; x <= 20; x++) {
        g[20][x] = 'd';
        g[22][x] = 'k';
      }
      // Left bar
      for (let y = 2; y <= 21; y++) {
        g[y][2] = 'k';
        g[y][4] = 'd';
      }
      // Right bar
      for (let y = 2; y <= 21; y++) {
        g[y][19] = 'd';
        g[y][21] = 'k';
      }

      // Marquee corner brackets
      g[1][2] = 'k'; g[1][21] = 'k';
      g[22][2] = 'k'; g[22][21] = 'k';
      g[2][3] = 's'; g[2][20] = 's';
      g[21][3] = 's'; g[21][20] = 's';

      // 2. Chasing Marquee Bulbs
      // 3 bright bulbs chasing clockwise around the frame (steps of 3 per frame)
      const chasePhase = (f * 3) % bulbs.length;

      bulbs.forEach(([bx, by], idx) => {
        // Distance in chase ring
        const dist = (idx - chasePhase + bulbs.length) % bulbs.length;
        if (dist === 0) {
          // Brilliant flashing bulb with glow
          g[by][bx] = 'w';
        } else if (dist === 1 || dist === bulbs.length - 1) {
          // Warm glowing bulb
          g[by][bx] = 't';
        } else if (dist === 2) {
          // Mid lit bulb
          g[by][bx] = 'y';
        } else {
          // Unlit socket bulb
          g[by][bx] = 's';
        }
      });

      // 3. Central Stage Ticket (Crimson and Gold with Perforated Edges)
      // Bounding box: x=5..18, y=5..18
      for (let y = 5; y <= 18; y++) {
        for (let x = 6; x <= 17; x++) {
          // Notched stub perforations at x=6 and x=17, rows 11..12
          if ((x === 6 || x === 17) && (y === 11 || y === 12)) {
            continue; // punched-out notch
          }
          if (x === 6 || x === 17 || y === 5 || y === 18) {
            g[y][x] = 'q'; // dark red outline
          } else if (x === 7 || y === 6) {
            g[y][x] = 'e'; // ticket highlight bevel
          } else if (x === 16 || y === 17) {
            g[y][x] = 'r'; // ticket shadow
          } else {
            g[y][x] = 'c'; // crimson ticket base
          }
        }
      }

      // Notch outlines
      g[10][6] = 'q'; g[13][6] = 'q'; g[11][7] = 'q'; g[12][7] = 'q';
      g[10][17] = 'q'; g[13][17] = 'q'; g[11][16] = 'q'; g[12][16] = 'q';

      // Golden Star Crest in Ticket Center (x=10..13, y=9..14)
      // Star pulses brightness
      const starLit = (f % 2 === 0);
      const starCol = starLit ? 'w' : 'y';
      const starMid = starLit ? 'y' : 't';

      g[9][11] = starCol; g[9][12] = starCol;
      g[10][10] = starCol; g[10][11] = starMid; g[10][12] = starMid; g[10][13] = starCol;
      g[11][9]  = starCol; g[11][10] = starMid; g[11][11] = 'p'; g[11][12] = 'p'; g[11][13] = starMid; g[11][14] = starCol;
      g[12][10] = starCol; g[12][11] = starMid; g[12][12] = starMid; g[12][13] = starCol;
      g[13][10] = starCol; g[13][13] = starCol;
      g[14][9]  = starCol; g[14][14] = starCol;

      // "ADMIT" miniature text stripe
      g[7][9] = 'k'; g[7][11] = 'k'; g[7][13] = 'k'; g[7][14] = 'k';
      g[16][9] = 'k'; g[16][11] = 'k'; g[16][13] = 'k'; g[16][14] = 'k';

      // 4. Outer glow / silhouette pulse at corner lights
      if (f % 2 === 1) {
        g[0][3] = 's'; g[0][20] = 's';
        g[23][3] = 's'; g[23][20] = 's';
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'broadway',
    category: 'deals',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Broadway theater marquee sign with chasing perimeter bulbs framing a crimson admission ticket',
    palette: {
      '.': null,
      'k': '#1a0f14', // ink dark outline
      'd': '#4a2e04', // gold deep
      's': '#b38004', // gold shadow
      'y': '#ffd23a', // gold base
      't': '#fff08c', // bulb light
      'w': '#ffffff', // bulb highlight / star glint
      'q': '#420a06', // red deep
      'r': '#781c16', // red shadow
      'c': '#b8322a', // red base
      'e': '#e86a50', // red light
      'p': '#fffbe0'  // star center glint
    },
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
