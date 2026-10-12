(function (root) {
  'use strict';

  function buildFrames() {
    const frames = [];

    // Flutter wave for paper tail and silhouette motion
    const waves = [0, 1, 2, 1, 0, -1];

    for (let f = 0; f < 6; f++) {
      const g = Array.from({ length: 24 }, () => Array(24).fill('.'));
      const wave = waves[f];

      // 1. Heavy Industrial Press Roller (Left column x=3..8, y=3..19)
      // Top cap of cylinder
      g[3][4] = 'd'; g[3][5] = 's'; g[3][6] = 's'; g[3][7] = 'd';
      g[4][3] = 'd'; g[4][4] = 'h'; g[4][5] = 'w'; g[4][6] = 'm'; g[4][7] = 's'; g[4][8] = 'd';

      // Cylinder body (rows 5..18)
      // Rotating specular highlight down the roller
      const sheen = (f % 3);
      for (let y = 5; y <= 18; y++) {
        g[y][2] = 'd';
        g[y][3] = (sheen === 0) ? 'w' : 'h';
        g[y][4] = (sheen === 0) ? 'h' : ((sheen === 1) ? 'w' : 'h');
        g[y][5] = (sheen === 2) ? 'w' : 'm';
        g[y][6] = 'm';
        g[y][7] = 's';
        g[y][8] = 'd';
      }

      // Bottom cap / axle bracket
      g[19][3] = 'd'; g[19][4] = 's'; g[19][5] = 's'; g[19][6] = 's'; g[19][7] = 's'; g[19][8] = 'd';
      g[20][5] = 'd'; g[20][6] = 'd'; // axle peg

      // Small secondary tension roller (x=16..19, y=16..19)
      for (let y = 17; y <= 19; y++) {
        g[y][16] = 'd'; g[y][17] = 'm'; g[y][18] = 's'; g[y][19] = 'd';
      }

      // 2. Continuous Paper Ribbon Web Feeding from Roller (x=8..21)
      // Width is 5 pixels, moving diagonally downwards
      for (let step = 0; step <= 12; step++) {
        const cx = 8 + step;
        const cy = 6 + Math.floor(step * 0.75) + (step > 6 ? Math.round(wave * (step - 6) / 6) : 0);

        if (cy >= 2 && cy < 21 && cx >= 1 && cx < 23) {
          g[cy - 2][cx] = 'k'; // top outline
          g[cy - 1][cx] = 'w'; // paper highlight
          g[cy][cx]     = 'l'; // paper light
          g[cy + 1][cx] = 'b'; // paper base
          g[cy + 2][cx] = 'j'; // paper shadow
          g[cy + 3][cx] = 'k'; // bottom outline
        }
      }

      // 3. Advancing Headline Text Ribbons and Red "EXTRA" stamp
      // Offset cycles 0..5, shifting text markers diagonally along the ribbon
      const offset = (f * 2) % 6;

      for (let pos = -2; pos <= 12; pos += 4) {
        const textPos = pos + offset;
        if (textPos >= 1 && textPos <= 11) {
          const tx = 8 + textPos;
          const ty = 6 + Math.floor(textPos * 0.75) + (textPos > 6 ? Math.round(wave * (textPos - 6) / 6) : 0);

          if (ty >= 2 && ty < 20 && tx >= 2 && tx < 22) {
            // Alternate red headline bar vs black ink column
            if (pos % 8 === 0) {
              g[ty][tx] = 'r';
              g[ty + 1][tx] = 'q';
            } else {
              g[ty][tx] = 'i';
              g[ty + 1][tx] = 'i';
            }
          }
        }
      }

      // Ribbon exit tail with animated flapping curl
      const tailX = 21;
      const tailY = 15 + wave;
      g[tailY - 2][tailX] = 'k';
      g[tailY - 1][tailX] = 'w';
      g[tailY][tailX]     = 'l';
      g[tailY + 1][tailX] = 'b';
      g[tailY + 2][tailX] = 'k';

      if (f % 2 === 1) {
        g[tailY][tailX + 1] = 'k';
      }

      // Sparkle on roller chrome at f=1,2
      if (f === 1) {
        g[6][3] = 'w';
      } else if (f === 2) {
        g[5][3] = 'w'; g[6][2] = 'w'; g[6][4] = 'w'; g[7][3] = 'w';
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'syndication',
    category: 'deals',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Newspaper press roll feeding a spinning headline ribbon with cycling red & ink print marks',
    palette: {
      '.': null,
      'd': '#343444', // metal dark outline
      's': '#626274', // metal shadow
      'm': '#a4a4b4', // metal base
      'h': '#d8d8e4', // metal light
      'w': '#ffffff', // metal highlight / white
      'k': '#786842', // paper dark outline
      'j': '#c9b88a', // paper shadow
      'b': '#ede0b8', // paper base
      'l': '#fff6d6', // paper light
      'i': '#1a0f14', // ink black
      'q': '#420a06', // red deep
      'r': '#b8322a'  // red base
    },
    sparkles: [
      [3, 5], [2, 6], [4, 6], [3, 7], [3, 6]
    ],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
