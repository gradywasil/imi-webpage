(function (root) {
  'use strict';

  function buildFrames() {
    const frames = [];

    // Spool rotation phases (3 spoke positions rotating around center)
    const spokeRotations = [
      { lSpoke: 0, rSpoke: 1 },
      { lSpoke: 1, rSpoke: 2 },
      { lSpoke: 2, rSpoke: 0 },
      { lSpoke: 0, rSpoke: 1 },
      { lSpoke: 1, rSpoke: 2 },
      { lSpoke: 2, rSpoke: 0 }
    ];

    for (let f = 0; f < 6; f++) {
      const g = Array.from({ length: 24 }, () => Array(24).fill('.'));
      const rots = spokeRotations[f];
      // Type guide fork clicks up on frames 1 and 4
      const forkUp = (f === 1 || f === 4);

      // 1. Central Type Guide / Ribbon Vibrator Fork (x=10..13, y=6..12)
      // Fork tines
      const forkY = forkUp ? 5 : 6;
      g[forkY][10] = 'd'; g[forkY][11] = 'h';
      g[forkY][12] = 'h'; g[forkY][13] = 'd';

      g[forkY + 1][10] = 'd'; g[forkY + 1][11] = 'm';
      g[forkY + 1][12] = 'm'; g[forkY + 1][13] = 'd';

      g[forkY + 2][10] = 'd'; g[forkY + 2][13] = 'd';
      g[forkY + 3][11] = 'm'; g[forkY + 3][12] = 's';
      g[forkY + 4][11] = 's'; g[forkY + 4][12] = 'd';
      g[forkY + 5][11] = 'd'; g[forkY + 5][12] = 'd';

      // 2. Left Ribbon Spool (Center [6, 15], radius ~5)
      // Spool rim circle
      for (let y = 11; y <= 19; y++) {
        for (let x = 2; x <= 10; x++) {
          const dx = x - 6;
          const dy = y - 15;
          const d2 = dx * dx + dy * dy;
          if (d2 <= 20) {
            g[y][x] = (dx + dy < -1) ? 'h' : ((dx + dy > 2) ? 's' : 'm');
          }
        }
      }
      // Left spool circular outline
      for (let x = 4; x <= 8; x++) { g[10][x] = 'd'; g[20][x] = 'd'; }
      for (let y = 13; y <= 17; y++) { g[y][1] = 'd'; g[y][11] = 'd'; }
      g[11][2] = 'd'; g[11][3] = 'd'; g[11][9] = 'd'; g[11][10] = 'd';
      g[12][2] = 'd'; g[12][10] = 'd';
      g[18][2] = 'd'; g[18][10] = 'd';
      g[19][2] = 'd'; g[19][3] = 'd'; g[19][9] = 'd'; g[19][10] = 'd';

      // Center arbor & spoke holes for left spool
      g[15][6] = 'k';
      if (rots.lSpoke === 0) {
        g[13][6] = 'd'; g[16][4] = 'd'; g[16][8] = 'd';
      } else if (rots.lSpoke === 1) {
        g[14][8] = 'd'; g[14][4] = 'd'; g[17][6] = 'd';
      } else {
        g[14][5] = 'd'; g[14][7] = 'd'; g[17][6] = 'd';
      }

      // 3. Right Ribbon Spool (Center [17, 15], radius ~5)
      for (let y = 11; y <= 19; y++) {
        for (let x = 13; x <= 21; x++) {
          const dx = x - 17;
          const dy = y - 15;
          const d2 = dx * dx + dy * dy;
          if (d2 <= 20) {
            g[y][x] = (dx + dy < -1) ? 'h' : ((dx + dy > 2) ? 's' : 'm');
          }
        }
      }
      for (let x = 15; x <= 19; x++) { g[10][x] = 'd'; g[20][x] = 'd'; }
      for (let y = 13; y <= 17; y++) { g[y][12] = 'd'; g[y][22] = 'd'; }
      g[11][13] = 'd'; g[11][14] = 'd'; g[11][20] = 'd'; g[11][21] = 'd';
      g[12][13] = 'd'; g[12][21] = 'd';
      g[18][13] = 'd'; g[18][21] = 'd';
      g[19][13] = 'd'; g[19][14] = 'd'; g[19][20] = 'd'; g[19][21] = 'd';

      // Center arbor & spoke holes for right spool
      g[15][17] = 'k';
      if (rots.rSpoke === 0) {
        g[13][17] = 'd'; g[16][15] = 'd'; g[16][19] = 'd';
      } else if (rots.rSpoke === 1) {
        g[14][19] = 'd'; g[14][15] = 'd'; g[17][17] = 'd';
      } else {
        g[14][16] = 'd'; g[14][18] = 'd'; g[17][17] = 'd';
      }

      // 4. Two-Tone Ribbon Advancing Across Spools (x=6..17, y=8..12)
      // Path feeds from left spool (x=7, y=11) up through vibrator fork (x=11..12, y=forkY+2) to right spool
      for (let x = 6; x <= 17; x++) {
        const ry = forkUp ? 8 : 9;

        // Advancing texture grain offset
        const grain = (x + f * 2) % 3;

        // Top black ribbon band
        g[ry][x] = (grain === 0) ? 'b' : ((grain === 1) ? 'i' : 'c');
        // Bottom red ribbon band
        g[ry + 1][x] = (grain === 0) ? 'l' : ((grain === 1) ? 'e' : 'r');
      }

      // Ribbon upper and lower border lines
      for (let x = 6; x <= 17; x++) {
        const ry = forkUp ? 8 : 9;
        g[ry - 1][x] = 'k';
        g[ry + 2][x] = 'q';
      }

      // 5. Specular Chrome Glint on spools
      if (f % 2 === 0) {
        g[11][5] = 'w';
        g[11][16] = 'w';
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'ribbon_cartridge',
    category: 'deals',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Dual typewriter spools advancing two-tone black/red ribbon with clicking type guide fork',
    palette: {
      '.': null,
      'd': '#343444', // metal dark outline
      's': '#626274', // metal shadow
      'm': '#a4a4b4', // metal base
      'h': '#d8d8e4', // metal light
      'w': '#ffffff', // chrome highlight
      'k': '#0a0408', // deep ink outline
      'i': '#1a0f14', // black ink base
      'c': '#3a2a30', // ink shadow
      'b': '#5c4650', // ink light
      'q': '#420a06', // red deep outline
      'r': '#781c16', // red shadow
      'e': '#b8322a', // red base
      'l': '#e86a50'  // red light
    },
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
