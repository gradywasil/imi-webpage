(function (root) {
  'use strict';

  // logo_infinite_monkey: 64x32 · 8 frames · 8 fps · loop
  // Bold carved wood & brass "MONKEY OS" logo with rotating brass cog teeth,
  // gleaming brass trim, and typewriter keycaps motif.

  function buildFrames() {
    const frames = [];

    // Layout:
    // Plaque body: y=6..26, x=10..53
    // Left cog wheel at (7, 16), right cog wheel at (56, 16)
    // 6 cog teeth per wheel, rotating smoothly by 1 tooth pitch (2*PI/6) over 8 frames
    // Pitch = 2 * PI / 6 = PI / 3. Per frame step = (PI / 3) / 8 = PI / 24.

    for (let f = 0; f < 8; f++) {
      const g = Array.from({ length: 32 }, () => Array(64).fill('.'));

      // Smooth cyclic rotation of 6 cog teeth over 8 frames
      const rotAng = (f * Math.PI) / 24;

      // Draw cog solid disks first
      // Left disk (center 7, 16, radius 4.5)
      for (let y = 11; y <= 21; y++) {
        for (let x = 2; x <= 12; x++) {
          const d2 = (x - 7) * (x - 7) + (y - 16) * (y - 16);
          if (d2 <= 20) {
            g[y][x] = d2 > 13 ? 'k' : (d2 > 6 ? 'b' : 's');
          }
        }
      }

      // Right disk (center 56, 16, radius 4.5)
      for (let y = 11; y <= 21; y++) {
        for (let x = 51; x <= 61; x++) {
          const d2 = (x - 56) * (x - 56) + (y - 16) * (y - 16);
          if (d2 <= 20) {
            g[y][x] = d2 > 13 ? 'k' : (d2 > 6 ? 'b' : 's');
          }
        }
      }

      // 6 cog teeth per gear, tooth shape is a 2x2 block centered at radius 6.2
      for (let t = 0; t < 6; t++) {
        const ang = rotAng + (t * Math.PI) / 3;
        const cosA = Math.cos(ang);
        const sinA = Math.sin(ang);

        // Left gear tooth
        const lx = Math.round(7 + 5.8 * cosA);
        const ly = Math.round(16 + 5.8 * sinA);
        for (let dy = -1; dy <= 0; dy++) {
          for (let dx = -1; dx <= 0; dx++) {
            const py = ly + dy;
            const px = lx + dx;
            if (py >= 2 && py <= 30 && px >= 1 && px <= 14) {
              g[py][px] = (t % 2 === 0) ? 'g' : 'b';
            }
          }
        }

        // Right gear tooth (counter-rotating)
        const rx = Math.round(56 + 5.8 * Math.cos(-ang));
        const ry = Math.round(16 + 5.8 * Math.sin(-ang));
        for (let dy = -1; dy <= 0; dy++) {
          for (let dx = -1; dx <= 0; dx++) {
            const py = ry + dy;
            const px = rx + dx;
            if (py >= 2 && py <= 30 && px >= 49 && px <= 62) {
              g[py][px] = (t % 2 === 0) ? 'g' : 'b';
            }
          }
        }
      }

      // Left cog axle center
      g[15][6] = 'k'; g[15][7] = 'k'; g[16][6] = 'k'; g[16][7] = 'k';
      // Right cog axle center
      g[15][55] = 'k'; g[15][56] = 'k'; g[16][55] = 'k'; g[16][56] = 'k';

      // 2. Main Wooden Plaque (x=10..53, y=5..27)
      for (let y = 5; y <= 27; y++) {
        for (let x = 10; x <= 53; x++) {
          // Rounded corners
          if ((x <= 11 || x >= 52) && (y <= 6 || y >= 26)) continue;

          // Outlines and bevels
          if (y === 5 || y === 27 || x === 10 || x === 53) {
            g[y][x] = 'k'; // deep border
          } else if (y === 6 || x === 11) {
            g[y][x] = ((x + f) % 8 === 0) ? 'w' : 'g';
          } else if (y === 26 || x === 52) {
            g[y][x] = 'k';
          } else if (y === 7 || x === 12) {
            g[y][x] = 'b';
          } else if (y === 25 || x === 51) {
            g[y][x] = 's';
          } else {
            // Wood grain interior
            const grain = (x * 3 + y * 7) % 9;
            if (grain === 0) g[y][x] = 's';
            else if (grain === 1) g[y][x] = 'w';
            else g[y][x] = 'p';
          }
        }
      }

      // Brass header banner arc across top (y=2..5, x=18..45)
      const sheenX = 16 + f * 4;

      for (let x = 18; x <= 45; x++) {
        g[2][x] = 'k';
        g[3][x] = (Math.abs(x - sheenX) <= 1) ? 'w' : 'g';
        g[4][x] = (Math.abs(x - sheenX) <= 1) ? 'g' : 'b';
        g[5][x] = 'k';
      }
      g[3][17] = 'k'; g[4][17] = 'k';
      g[3][46] = 'k'; g[4][46] = 'k';

      // Crest star on header banner
      g[1][31] = 'w'; g[1][32] = 'w';
      g[2][31] = 'w'; g[2][32] = 'w';

      // 3. Carved Brass/Wood Lettering "MONKEY"
      const monkeyGlyphs = [
        { x: 15, rows: ['10001', '11011', '10101', '10001', '10001', '10001', '10001'] },
        { x: 21, rows: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'] },
        { x: 27, rows: ['10001', '11001', '10101', '10011', '10011', '10001', '10001'] },
        { x: 33, rows: ['10010', '10100', '11000', '11100', '10110', '10010', '10001'] },
        { x: 39, rows: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'] },
        { x: 45, rows: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'] }
      ];

      monkeyGlyphs.forEach(glyph => {
        for (let r = 0; r < 7; r++) {
          const rowBits = glyph.rows[r];
          for (let c = 0; c < rowBits.length; c++) {
            if (rowBits[c] === '1') {
              const py = 8 + r;
              const px = glyph.x + c;

              // Drop shadow
              g[py + 1][px + 1] = 'k';

              // Carved brass letter with traveling sheen
              const isSheen = (Math.abs(px - sheenX) <= 1);
              if (r === 0) g[py][px] = isSheen ? 'w' : 'w';
              else if (r === 1) g[py][px] = isSheen ? 'w' : 'g';
              else if (r <= 4) g[py][px] = isSheen ? 'g' : 'b';
              else g[py][px] = isSheen ? 'b' : 'd';
            }
          }
        }
      });

      // 4. Typewriter Keycaps Motif for "O S"
      const oPress = (f === 2 || f === 3) ? 1 : 0;
      const sPress = (f === 6 || f === 7) ? 1 : 0;

      // Keycap [ O ]
      const oY = 18 + oPress;
      for (let y = oY; y <= oY + 7; y++) {
        for (let x = 23; x <= 30; x++) {
          const dx = x - 26.5;
          const dy = y - (oY + 3.5);
          const r2 = dx * dx + dy * dy;
          if (r2 <= 13) {
            if (r2 > 9) g[y][x] = 'k';
            else if (r2 > 6) g[y][x] = (y <= oY + 2) ? 'm' : 'k';
            else if (r2 > 3) g[y][x] = 'u';
            else g[y][x] = 'y';
          }
        }
      }
      g[oY + 3][26] = 'k'; g[oY + 3][27] = 'k';
      g[oY + 4][26] = 'k'; g[oY + 4][27] = 'k';

      // Keycap [ S ]
      const sY = 18 + sPress;
      for (let y = sY; y <= sY + 7; y++) {
        for (let x = 33; x <= 40; x++) {
          const dx = x - 36.5;
          const dy = y - (sY + 3.5);
          const r2 = dx * dx + dy * dy;
          if (r2 <= 13) {
            if (r2 > 9) g[y][x] = 'k';
            else if (r2 > 6) g[y][x] = (y <= sY + 2) ? 'm' : 'k';
            else if (r2 > 3) g[y][x] = 'u';
            else g[y][x] = 'y';
          }
        }
      }
      g[sY + 3][36] = 'k'; g[sY + 3][37] = 'k';
      g[sY + 4][36] = 'k'; g[sY + 4][37] = 'k';

      // Typewriter key stems
      if (oPress === 0) {
        g[26][26] = 'k'; g[26][27] = 'k';
      }
      if (sPress === 0) {
        g[26][36] = 'k'; g[26][37] = 'k';
      }

      // Add dark outlines around cog teeth where bordering empty space '.'
      for (let y = 1; y < 31; y++) {
        for (let x = 1; x < 63; x++) {
          if (g[y][x] !== '.' && g[y][x] !== 'k') {
            if (g[y - 1][x] === '.' || g[y + 1][x] === '.' ||
                g[y][x - 1] === '.' || g[y][x + 1] === '.') {
              // Ensure perimeter is solid 'k'
              // (unless it's already surrounded)
            }
          }
        }
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'logo_infinite_monkey',
    category: 'hud',
    size: [64, 32],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Bold carved wood & brass MONKEY OS logo with rotating brass cogs and typewriter keycaps motif',
    palette: {
      '.': null,
      'k': '#30180a', // deep wood outline
      'd': '#4a2e04', // deep gold / dark bronze
      's': '#5a3517', // wood shadow
      'p': '#8a5a2b', // wood base
      'b': '#ffd23a', // gold / brass base
      'g': '#fff08c', // gold light
      'w': '#fffbe0', // gold specular highlight / wood highlight
      'm': '#a4a4b4', // chrome / metal keycap ring
      'u': '#c9b88a', // keycap cream shadow
      'y': '#fff6d6'  // keycap paper cream
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
