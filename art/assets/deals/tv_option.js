(function (root) {
  'use strict';

  function buildFrames() {
    const frames = [];

    // Scanline position rolls down from y=9 to y=14
    for (let f = 0; f < 6; f++) {
      const g = Array.from({ length: 24 }, () => Array(24).fill('.'));
      const scanY = 9 + f;

      // 1. Rabbit-Ear Antenna on Top (x=6..16, y=1..6)
      // Base mount on top of cabinet
      g[6][10] = 'k'; g[6][11] = 's'; g[6][12] = 's'; g[6][13] = 'k';

      // Left antenna rod (angled up-left)
      g[5][9] = 's'; g[5][10] = 's';
      g[4][8] = 's'; g[4][9] = 's';
      g[3][7] = 's'; g[3][8] = 's';
      g[2][6] = 's'; g[2][7] = 's';
      // Tip bead
      g[1][5] = 'p'; g[1][6] = 'p';
      g[2][5] = 's';

      // Right antenna rod (angled up-right)
      g[5][12] = 's'; g[5][13] = 's';
      g[4][13] = 's'; g[4][14] = 's';
      g[3][14] = 's'; g[3][15] = 's';
      g[2][15] = 's'; g[2][16] = 's';
      // Tip bead
      g[1][16] = 'p'; g[1][17] = 'p';
      g[2][17] = 's';

      // Antenna electric reception spark at f=1,2,4,5
      if (f === 1 || f === 2) {
        g[0][5] = 'p'; g[0][6] = 'p';
      } else if (f === 4 || f === 5) {
        g[0][16] = 'p'; g[0][17] = 'p';
      }

      // 2. Wood TV Cabinet (x=2..21, y=7..21)
      // Top cabinet bevel
      for (let x = 3; x <= 20; x++) {
        g[7][x] = (x < 11) ? 'w' : 'm';
      }
      g[7][2] = 'k'; g[7][21] = 'k';

      // Side pillars and cabinet body
      for (let y = 8; y <= 20; y++) {
        g[y][2] = 'k';
        g[y][3] = 'w';
        g[y][20] = 'u';
        g[y][21] = 'k';
      }

      // Bottom cabinet base & feet
      for (let x = 2; x <= 21; x++) {
        g[20][x] = (x === 2 || x === 21) ? 'k' : 'u';
        g[21][x] = 'k';
      }
      // TV feet pegs
      g[22][4] = 'k'; g[22][5] = 'k';
      g[22][18] = 'k'; g[22][19] = 'k';

      // 3. Right Control Panel (Knobs & Speaker Slits at x=16..19, y=8..19)
      for (let y = 8; y <= 19; y++) {
        for (let x = 16; x <= 19; x++) {
          g[y][x] = 'm';
        }
      }
      // Channel knob (y=9..11, x=17..18)
      const knobRot = (f % 4);
      g[9][17]  = 'k'; g[9][18]  = 'k';
      g[10][17] = (knobRot === 0 || knobRot === 1) ? 'w' : 'd';
      g[10][18] = (knobRot === 2 || knobRot === 3) ? 'w' : 'd';
      g[11][17] = 'k'; g[11][18] = 'k';

      // Volume knob (y=13..14, x=17..18)
      g[13][17] = 'd'; g[13][18] = 'd';
      g[14][17] = 'd'; g[14][18] = 'd';

      // Speaker grille slots (y=16..18)
      g[16][17] = 'k'; g[16][18] = 'k';
      g[17][17] = 'k'; g[17][18] = 'k';
      g[18][17] = 'k'; g[18][18] = 'k';

      // 4. Cathode Tube Screen Glass & Test Bars (x=4..15, y=8..19)
      // Screen bezel outline
      for (let y = 8; y <= 19; y++) {
        g[y][4] = 'd';
        g[y][15] = 'd';
      }
      for (let x = 4; x <= 15; x++) {
        g[8][x] = 'd';
        g[19][x] = 'd';
      }

      // Vertical Peacock Color Bars (width 2 each: Yellow, Cyan, Green, Red, Blue)
      // x=5..6: Yellow, x=7..8: Cyan, x=9..10: Green, x=11..12: Red, x=13..14: Blue
      const barColors = ['y', 'c', 'g', 'r', 'b'];

      // Bars glitch cycle: on frame 3, glitch horizontal shift by 1 column
      const glitch = (f === 3) ? 1 : 0;

      for (let y = 9; y <= 18; y++) {
        for (let col = 0; col < 5; col++) {
          const colorKey = barColors[(col + glitch) % 5];
          const x1 = 5 + col * 2;
          const x2 = x1 + 1;

          if (x1 <= 14) g[y][x1] = colorKey;
          if (x2 <= 14) g[y][x2] = colorKey;
        }

        // Horizontal scanline darkening
        if (y === scanY) {
          for (let x = 5; x <= 14; x++) {
            g[y][x] = 'd';
          }
        }
      }

      // CRT curved glass glare / reflection at top-left corner
      g[9][5] = 'p'; g[9][6] = 'p';
      g[10][5] = 'p';

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'tv_option',
    category: 'deals',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Retro wood CRT TV screen flashing peacock test bars with rolling scanline and rabbit-ear spark',
    palette: {
      '.': null,
      'w': '#eed0a4', // wood highlight
      'm': '#8a5a2b', // wood base
      'u': '#5a3517', // wood shadow
      'k': '#30180a', // wood deep outline
      'd': '#1a0f14', // CRT chassis & dark scanline
      'y': '#ffd23a', // test yellow
      'c': '#52b8ec', // test cyan
      'g': '#74c648', // test green
      'r': '#e86a50', // test red
      'b': '#2e44a8', // test blue
      'p': '#ffffff', // CRT glare / antenna spark
      's': '#a4a4b4'  // antenna silver
    },
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
