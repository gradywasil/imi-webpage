(function (root) {
  // 10-frame authored sequence for golden_banana
  // Sheen position offset per frame: 0, 1, 2, 3, 4, 3, 2, 1, 0, 0
  // Vertical bob offset per frame:    0, 0, -1, -1, -2, -2, -1, -1, 0, 0

  function buildFrames() {
    const rawPatterns = [
      // row templates: [y, prefix_dots, body_string, suffix_dots]
      [4, 24, 'rrk', 5],
      [5, 23, 'trrk', 5],
      [6, 22, 'trkk', 6],
      [7, 19, 'kkkllk', 7],
      [8, 16, 'kkkwwllbbo', 6],
      [9, 14, 'kkllwllbbbbo', 6],
      [10, 12, 'kklllwwllbbbosk', 5],
      [11, 11, 'kllllwllbbbbosk', 6],
      [12, 10, 'kllllwllbbbbosk', 7],
      [13, 9, 'kllllwllbbbboskk', 7],
      [14, 8, 'kllllwllbbbboskk', 8],
      [15, 7, 'kllllwllbbbboskk', 9],
      [16, 6, 'kllllwllbbbboskk', 10],
      [17, 5, 'kllllwllbbbboskk', 11],
      [18, 4, 'kllllwllbbbboskk', 12],
      [19, 3, 'kllllwllbbbboskk', 13],
      [20, 3, 'kllwllbbbboskk', 15],
      [21, 2, 'kwllbbbbboskk', 17],
      [22, 2, 'kwbbbboskkk', 19],
      [23, 2, 'kbboskkk', 22],
      [24, 2, 'kkkkk', 25]
    ];

    const bobs = [0, 0, -1, -1, -2, -2, -1, -1, 0, 0];
    const sheenShifts = [0, 1, 2, 3, 4, 3, 2, 1, 0, 0];
    const frames = [];

    for (let f = 0; f < 10; f++) {
      const dy = bobs[f];
      const shift = sheenShifts[f];
      const grid = Array.from({ length: 32 }, () => Array(32).fill('.'));

      rawPatterns.forEach(([baseY, leftPad, str, rightPad]) => {
        const y = baseY + dy;
        if (y < 0 || y >= 32) return;

        // Shift sheen inside the body if the row contains 'w'
        let renderedStr = str;
        if (shift > 0 && str.includes('w')) {
          // move 'w' characters rightward by shift positions within the body (before 'k' or 's')
          const chars = str.split('');
          const wIndices = [];
          for (let i = 0; i < chars.length; i++) {
            if (chars[i] === 'w') wIndices.push(i);
          }
          wIndices.forEach(idx => {
            const target = Math.min(chars.length - 3, idx + shift);
            if (chars[target] === 'b' || chars[target] === 'l') {
              chars[idx] = 'l';
              chars[target] = 'w';
            }
          });
          renderedStr = chars.join('');
        }

        for (let c = 0; c < renderedStr.length; c++) {
          const x = leftPad + c;
          if (x >= 0 && x < 32) {
            grid[y][x] = renderedStr[c];
          }
        }
      });

      // Sparkles
      // Sparkle 1 at [7, 6+dy] during f=1..3
      if (f === 1) {
        grid[6 + dy][7] = 'p';
      } else if (f === 2) {
        grid[5 + dy][7] = 'p';
        grid[6 + dy][6] = 'p'; grid[6 + dy][7] = 'p'; grid[6 + dy][8] = 'p';
        grid[7 + dy][7] = 'p';
      } else if (f === 3) {
        grid[6 + dy][7] = 'p';
      }

      // Sparkle 2 at [24, 7+dy] during f=4..6
      if (f === 4) {
        grid[7 + dy][24] = 'p';
      } else if (f === 5) {
        grid[6 + dy][24] = 'p';
        grid[7 + dy][23] = 'p'; grid[7 + dy][24] = 'p'; grid[7 + dy][25] = 'p';
        grid[8 + dy][24] = 'p';
      } else if (f === 6) {
        grid[7 + dy][24] = 'p';
      }

      // Sparkle 3 at [21, 23+dy] during f=7..9
      if (f === 7) {
        grid[23 + dy][21] = 'p';
      } else if (f === 8) {
        grid[22 + dy][21] = 'p';
        grid[23 + dy][20] = 'p'; grid[23 + dy][21] = 'p'; grid[23 + dy][22] = 'p';
        grid[24 + dy][21] = 'p';
      } else if (f === 9) {
        grid[23 + dy][21] = 'p';
      }

      frames.push({ rows: grid.map(r => r.join('')) });
    }
    return frames;
  }

  const asset = {
    id: 'golden_banana',
    category: 'shop',
    size: [32, 32],
    fps: 10,
    loop: true,
    staticFrame: 0,
    notes: '24K Golden Banana with gentle breathing bob, traveling sheen, and staggered 4-point sparkles',
    palette: {
      '.': null,
      'k': '#422e02', // deep brown outline
      't': '#52301a', // stem dark
      'r': '#7a4c28', // stem light
      's': '#7a4a08', // shadow orange-brown
      'o': '#c98f0e', // mid shadow
      'b': '#ffd23a', // gold base
      'l': '#fff08c', // gold highlight
      'w': '#fffbe0', // specular glint
      'p': '#fffbe0'  // sparkle
    },
    sparkles: [
      [7, 6], [6, 6], [8, 6], [7, 5], [7, 7],
      [7, 5], [6, 5], [8, 5], [7, 4], // dy = -1
      [7, 4], [6, 4], [8, 4], [7, 3], // dy = -2
      [24, 7], [23, 7], [25, 7], [24, 6], [24, 8],
      [24, 6], [23, 6], [25, 6], [24, 5], // dy = -1
      [24, 5], [23, 5], [25, 5], [24, 4], // dy = -2
      [21, 23], [20, 23], [22, 23], [21, 22], [21, 24],
      [21, 22], [20, 22], [22, 22], [21, 21], [21, 23] // dy = -1
    ],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
