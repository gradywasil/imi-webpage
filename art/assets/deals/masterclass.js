(function (root) {
  'use strict';

  function buildFrames() {
    const frames = [];

    // Tassel swing pendulum horizontal offsets across 6 frames
    const swingX = [-2, -1, 1, 2, 1, -1];

    for (let f = 0; f < 6; f++) {
      const g = Array.from({ length: 24 }, () => Array(24).fill('.'));
      const sw = swingX[f];

      // 1. Wood Lectern Top (x=4..20, y=5..8)
      // Slanted top shelf
      for (let x = 5; x <= 19; x++) {
        g[5][x] = (x < 11) ? 'm' : 'u';
        g[6][x] = (x < 11) ? 'm' : 'u';
      }
      g[5][4] = 'k'; g[5][20] = 'k';
      g[6][4] = 'k'; g[6][20] = 'k';

      // Lip railing
      for (let x = 4; x <= 20; x++) {
        g[7][x] = (x === 4 || x === 20) ? 'k' : ((x < 12) ? 'm' : 'u');
        g[8][x] = 'k';
      }

      // 2. Velvet Podium Drape (x=6..18, y=9..20)
      // Deep red velvet fabric with vertical pleated folds
      for (let y = 9; y <= 18; y++) {
        for (let x = 6; x <= 18; x++) {
          if (x === 6 || x === 18) {
            g[y][x] = 'q'; // deep outline
          } else {
            // Vertical pleat stripes
            const pleat = (x - 6) % 3;
            if (pleat === 0) g[y][x] = 'e';
            else if (pleat === 1) g[y][x] = 'c';
            else g[y][x] = 'r';
          }
        }
      }

      // Gold bullion fringe along bottom of drape (y=19..20, x=6..18)
      for (let x = 6; x <= 18; x++) {
        g[19][x] = (x % 2 === 0) ? 'y' : 't';
        g[20][x] = (x % 2 === 0) ? 's' : 'g';
      }

      // Wooden base pedestal underneath (y=21..22, x=5..19)
      for (let x = 5; x <= 19; x++) {
        g[21][x] = (x < 12) ? 'm' : 'u';
        g[22][x] = 'k';
      }

      // 3. Certificate Parchment with Golden Wax Seal (x=11..19, y=2..7)
      // Rolled parchment sitting on lectern
      for (let x = 12; x <= 18; x++) {
        g[3][x] = 'p';
        g[4][x] = 'l';
      }
      g[2][12] = 'k'; g[2][13] = 'p'; g[2][14] = 'p'; g[2][15] = 'p'; g[2][16] = 'p'; g[2][17] = 'p'; g[2][18] = 'k';
      g[3][11] = 'k'; g[3][19] = 'k';
      g[4][11] = 'k'; g[4][19] = 'k';

      // Golden Ribbon & Wax Seal on Certificate (x=14..16, y=2..5)
      g[2][15] = 'y';
      g[3][14] = 'y'; g[3][15] = 'w'; g[3][16] = 'y';
      g[4][14] = 's'; g[4][15] = 'y'; g[4][16] = 's';
      g[5][15] = 'g'; // hanging ribbon tip

      // 4. Swinging Graduation Tassel (Hangs from button at x=6, y=5)
      // Tassel anchor button
      g[5][6] = 'w';
      // Cord drops to y=9 with tilt
      g[6][6] = 'y';
      g[7][6] = 'y';
      const midX = 6 + Math.round(sw * 0.4);
      g[8][midX] = 'y';
      g[9][midX] = 'y';

      // Tassel bell knot (y=10..11)
      const knotX = 6 + Math.round(sw * 0.7);
      g[10][knotX] = 't'; g[10][knotX + 1] = 'y';
      g[11][knotX] = 's'; g[11][knotX + 1] = 's';

      // Tassel silk skirt (y=12..16)
      const tipX = 6 + sw;
      for (let ty = 12; ty <= 15; ty++) {
        g[ty][tipX] = 'w';
        g[ty][tipX + 1] = 'y';
        g[ty][tipX + 2] = 's';
      }
      g[16][tipX] = 's';
      g[16][tipX + 1] = 'g';
      g[16][tipX + 2] = 'g';

      // 5. Wax Seal Sparkle on f=0,1
      if (f === 0) {
        g[3][15] = 'w';
      } else if (f === 1) {
        g[3][15] = 'w';
        g[3][14] = 'w'; g[3][16] = 'w'; g[2][15] = 'w'; g[4][15] = 'w';
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'masterclass',
    category: 'deals',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Velvet podium with gold-fringed drape, parchment certificate with wax seal, and swinging graduation tassel',
    palette: {
      '.': null,
      'q': '#420a06', // velvet deep outline
      'r': '#781c16', // velvet shadow
      'c': '#b8322a', // velvet base
      'e': '#e86a50', // velvet light
      'g': '#4a2e04', // gold deep outline
      's': '#b38004', // gold shadow
      'y': '#ffd23a', // gold base
      't': '#fff08c', // gold light
      'w': '#fffbe0', // gold highlight / glint
      'k': '#30180a', // wood deep outline
      'u': '#5a3517', // wood shadow
      'm': '#8a5a2b', // wood base
      'p': '#ffffff', // parchment white
      'l': '#ede0b8'  // parchment base
    },
    sparkles: [
      [15, 2], [14, 3], [16, 3], [15, 4]
    ],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
