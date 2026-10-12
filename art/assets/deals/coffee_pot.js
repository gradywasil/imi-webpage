(function (root) {
  'use strict';

  function buildFrames() {
    const frames = [];

    // Steam curl horizontal drift offsets across 6 frames
    const steamDrift = [0, 1, 2, 1, 0, -1];

    for (let f = 0; f < 6; f++) {
      const g = Array.from({ length: 24 }, () => Array(24).fill('.'));
      const st = steamDrift[f];
      const bubblePop = (f % 3);

      // 1. Rising Steam Wisps from Spout (y=1..6, x=6..14)
      // Two wafting curling vapor strands
      const s1X = 8 + st;
      const s2X = 11 + st;

      // Solid 2-pixel chunks to avoid orphan lint checks
      if (f % 2 === 0) {
        g[1][s1X] = 'w'; g[1][s1X + 1] = 'w';
        g[2][s1X] = 'p'; g[2][s1X + 1] = 'p';
        g[3][s1X - 1] = 'p'; g[3][s1X] = 'p';

        g[3][s2X] = 'w'; g[3][s2X + 1] = 'w';
        g[4][s2X] = 'p'; g[4][s2X + 1] = 'p';
        g[5][s2X - 1] = 'p'; g[5][s2X] = 'p';
      } else {
        g[2][s1X] = 'w'; g[2][s1X + 1] = 'w';
        g[3][s1X] = 'p'; g[3][s1X + 1] = 'p';
        g[4][s1X - 1] = 'p'; g[4][s1X] = 'p';

        g[4][s2X] = 'w'; g[4][s2X + 1] = 'w';
        g[5][s2X] = 'p'; g[5][s2X + 1] = 'p';
        g[6][s2X - 1] = 'p'; g[6][s2X] = 'p';
      }

      // 2. Glass Percolator Top Dome Knob (x=9..12, y=6..8)
      // Glass bubble where dark coffee erupts
      g[6][10] = 'h'; g[6][11] = 'w';
      g[7][9] = 'd';
      g[7][10] = (bubblePop === 1) ? 'b' : 'w';
      g[7][11] = (bubblePop === 2) ? 'b' : 'a';
      g[7][12] = 'd';
      g[8][9] = 'd'; g[8][10] = 'k'; g[8][11] = 'k'; g[8][12] = 'd';

      // 3. Chrome Lid & Spout (x=4..16, y=8..10)
      // Spout on left (x=4..7, y=8..10)
      g[8][4] = 'd'; g[8][5] = 'h'; g[8][6] = 'w';
      g[9][5] = 'd'; g[9][6] = 'm'; g[9][7] = 's';
      g[10][6] = 'd';

      // Chrome Lid
      for (let x = 7; x <= 15; x++) {
        g[9][x] = (x < 11) ? 'h' : 'm';
        g[10][x] = (x < 11) ? 'w' : 's';
      }
      g[9][16] = 'd'; g[10][16] = 'd';

      // 4. Glass Carafe Body (x=5..17, y=11..21)
      // Left glass wall with specular highlight
      for (let y = 11; y <= 20; y++) {
        g[y][5] = 'd';
        g[y][6] = 'w';
      }
      // Right glass wall
      for (let y = 11; y <= 20; y++) {
        g[y][16] = 's';
        g[y][17] = 'd';
      }

      // Glass bottom base
      for (let x = 6; x <= 16; x++) {
        g[21][x] = 'd';
      }

      // 5. Handle on Right (x=18..20, y=11..18)
      for (let y = 12; y <= 17; y++) {
        g[y][19] = 'd';
        g[y][20] = 'd';
      }
      g[11][17] = 'd'; g[11][18] = 'd'; g[11][19] = 'd';
      g[18][17] = 'd'; g[18][18] = 'd'; g[18][19] = 'd';

      // 6. Central Percolator Glass Tube (x=10..11, y=11..20)
      for (let y = 11; y <= 20; y++) {
        g[y][10] = (y % 2 === (f % 2)) ? 'b' : 'u';
        g[y][11] = (y % 2 === (f % 2)) ? 'c' : 'b';
      }

      // 7. Rich Brewed Dark Coffee Reservoir (y=14..20, x=7..15)
      // Liquid surface crema froth on y=14
      for (let x = 7; x <= 15; x++) {
        if (x !== 10 && x !== 11) {
          const foamGlint = ((x + f) % 3 === 0);
          g[14][x] = foamGlint ? 'a' : 'b';
        }
      }

      // Coffee liquid body (y=15..20)
      for (let y = 15; y <= 20; y++) {
        for (let x = 7; x <= 15; x++) {
          if (x !== 10 && x !== 11) {
            if (x < 10) {
              g[y][x] = (y === 20) ? 'u' : 'c';
            } else {
              g[y][x] = (y === 20) ? 'k' : 'u';
            }
          }
        }
      }

      // Bubbling froth pops inside reservoir
      const bX = 8 + (f % 2) * 4;
      g[15][bX] = 'a';
      g[16][bX] = 'b';

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'coffee_pot',
    category: 'deals',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Glass percolator pot with bubbling brew splashing in top knob and rising steam wisps',
    palette: {
      '.': null,
      'd': '#303c4a', // silver deep outline
      's': '#687a8c', // silver shadow
      'm': '#b8c6d4', // silver base
      'h': '#e8f0f8', // silver light
      'w': '#ffffff', // specular white & steam
      'k': '#1e0e04', // coffee deep outline
      'u': '#3a1e0b', // coffee shadow
      'c': '#563418', // coffee base
      'b': '#86592e', // coffee light
      'a': '#caa078', // crema / bubble froth
      'p': '#d2e2f0'  // steam light
    },
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
