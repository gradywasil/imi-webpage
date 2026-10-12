(function (root) {
  'use strict';

  // 32x32, 8 frames, 8 fps
  // Brass pressure barometer with pulsing amber needle and steam valve puff
  const W = 32;
  const H = 32;

  const palette = {
    '.': null,
    'k': '#3e1e08', // deep bronze outline
    'o': '#6e3c16', // brass shadow
    'g': '#a86834', // brass midtone
    'G': '#ffd23a', // brass bright base
    'h': '#fff08c', // brass highlight
    'w': '#ffffff', // specular glint / steam white
    'p': '#ede0b8', // dial cream base
    'P': '#fff6d6', // dial cream light
    'i': '#1a0f14', // dial ticks / pivot rivet
    'a': '#d97a0c', // amber needle base
    'A': '#ffc62a', // amber needle light
    'r': '#b8322a', // red danger arc
    'R': '#e86a50', // red light
    's': '#d2e2f0', // steam cloud shadow
    'S': '#eef4fb'  // steam cloud light
  };

  function buildFrames() {
    const frames = [];

    // Needle positions: angle / tip offset [tipX, tipY] relative to center (15, 18)
    const needleTips = [
      [11, 14], // f0: pointing upper-left (safe)
      [12, 13], // f1: climbing
      [15, 12], // f2: top center (high)
      [18, 13], // f3: red zone spike!
      [19, 15], // f4: red zone peak (pop!)
      [16, 13], // f5: venting drop
      [13, 14], // f6: dropping safe
      [11, 15]  // f7: return to f0
    ];

    // Valve cap lift offset dy:
    const valveLifts = [0, 0, 1, 2, 2, 1, 0, 0];
    // Steam puff state: 0=none, 1=initial jet, 2=billowing plume, 3=expanding cloud, 4=dissipating
    const steamStates = [0, 0, 0, 1, 2, 3, 4, 0];

    for (let f = 0; f < 8; f++) {
      const g = Array.from({ length: H }, () => Array(W).fill('.'));
      const [ntx, nty] = needleTips[f];
      const vl = valveLifts[f];
      const steam = steamStates[f];

      // 1. Lower Mounting Bracket & Inlet Pipe (rows 26..30, cols 11..19)
      for (let y = 26; y <= 29; y++) {
        g[y][13] = 'k';
        g[y][14] = 'h';
        g[y][15] = 'G';
        g[y][16] = 'g';
        g[y][17] = 'o';
        g[y][18] = 'k';
      }
      // Pipe flange mounting bolts
      g[29][11] = 'k'; g[29][12] = 'G'; g[29][19] = 'o'; g[29][20] = 'k';
      g[30][11] = 'k'; g[30][12] = 'k';
      for (let x = 13; x <= 18; x++) g[30][x] = 'k';
      g[30][19] = 'k'; g[30][20] = 'k';

      // 2. Main Circular Brass Barometer Body (center at 15.5, 17.5, radius ~9)
      const cx = 15.5;
      const cy = 17.5;

      for (let y = 8; y <= 26; y++) {
        for (let x = 6; x <= 25; x++) {
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Outer bezel ring (dist 8.2 .. 9.8)
          if (dist <= 9.8 && dist > 8.2) {
            // Highlight from top-left
            if (dx + dy < -4) {
              g[y][x] = 'h';
            } else if (dx + dy < 4) {
              g[y][x] = 'G';
            } else {
              g[y][x] = 'o';
            }
          }
          // Inner brass bezel step (dist 7.0 .. 8.2)
          else if (dist <= 8.2 && dist > 6.8) {
            g[y][x] = (dx < 0 && dy < 0) ? 'G' : 'g';
          }
          // Dial Face (dist <= 6.8)
          else if (dist <= 6.8) {
            // Light from top-left on dial paper
            g[y][x] = (dx + dy < -2) ? 'P' : 'p';
          }
        }
      }

      // Selective outer outline around brass bezel
      for (let y = 7; y <= 27; y++) {
        for (let x = 5; x <= 26; x++) {
          if (g[y][x] !== '.') {
            if (g[y - 1][x] === '.') g[y - 1][x] = 'k';
            if (g[y + 1][x] === '.') g[y + 1][x] = 'k';
            if (g[y][x - 1] === '.') g[y][x - 1] = 'k';
            if (g[y][x + 1] === '.') g[y][x + 1] = 'k';
          }
        }
      }

      // Bezel Rivet / Bolt details at octagonal points
      g[9][15] = 'h'; g[9][16] = 'k';
      g[26][15] = 'G'; g[26][16] = 'k';
      g[17][7] = 'h'; g[18][7] = 'k';
      g[17][24] = 'g'; g[18][24] = 'k';
      g[11][10] = 'h'; g[12][10] = 'k';
      g[11][21] = 'G'; g[12][21] = 'k';
      g[23][10] = 'G'; g[24][10] = 'k';
      g[23][21] = 'o'; g[24][21] = 'k';

      // 3. Dial Face Calibration Markings & Red Danger Arc
      // Red Danger Arc (upper right quadrant, dist ~5.5..6.5, x > 16, y < 17)
      g[12][18] = 'R'; g[12][19] = 'r';
      g[13][19] = 'R'; g[13][20] = 'r';
      g[14][20] = 'R'; g[14][21] = 'r';
      g[15][21] = 'r';

      // Tick marks on dial
      g[13][12] = 'i'; // left tick
      g[12][15] = 'i'; // top center tick
      g[17][11] = 'i'; // 9 oclock tick
      g[19][12] = 'i'; // 8 oclock tick

      // 4. Pulsing Amber Needle & Center Brass Pivot
      // Center brass hub (rows 17..19, cols 15..16)
      g[17][15] = 'G'; g[17][16] = 'G';
      g[18][15] = 'G'; g[18][16] = 'o';
      g[18][15] = 'i'; // center pivot rivet

      // Needle shaft from center (15, 17) to (ntx, nty)
      const midX = Math.round((15 + ntx) / 2);
      const midY = Math.round((17 + nty) / 2);
      g[midY][midX] = 'A';
      g[nty][ntx] = 'a';
      // Needle sharp tip specular glint
      if (f === 3 || f === 4) {
        g[nty][ntx] = 'w';
      }

      // Counterweight tail behind needle
      const tailX = 15 - (ntx - 15);
      const tailY = 17 - (nty - 17);
      if (tailY >= 18 && tailY <= 22 && tailX >= 11 && tailX <= 20) {
        g[tailY][tailX] = 'o';
      }

      // 5. Top Steam Relief Valve (rows 4..8, cols 19..24)
      // Steam valve pipe neck (rows 6..8, cols 20..22)
      g[7][20] = 'k'; g[7][21] = 'h'; g[7][22] = 'G'; g[7][23] = 'k';
      g[8][20] = 'k'; g[8][21] = 'G'; g[8][22] = 'o'; g[8][23] = 'k';

      // Valve Cap (lifts up by vl pixels, rows 5-vl .. 6-vl, cols 19..23)
      const vy = 5 - vl;
      g[vy - 1][20] = 'k'; g[vy - 1][21] = 'k'; g[vy - 1][22] = 'k';
      g[vy][19] = 'k'; g[vy][20] = 'h'; g[vy][21] = 'h'; g[vy][22] = 'G'; g[vy][23] = 'k';
      g[vy + 1][19] = 'k'; g[vy + 1][20] = 'G'; g[vy + 1][21] = 'G'; g[vy + 1][22] = 'o'; g[vy + 1][23] = 'k';

      // 6. Steam Valve Puff & Cloud Dissipation (steamStates)
      if (steam === 1) {
        // High pressure jet shooting out from valve (rows 2..4, cols 22..26)
        g[3][23] = 'w'; g[3][24] = 'w';
        g[4][22] = 'w'; g[4][23] = 'S'; g[4][24] = 'w';
        g[5][22] = 'w';
      } else if (steam === 2) {
        // Plume expanding into billowing white cloud (rows 1..5, cols 21..28)
        g[1][24] = 'w'; g[1][25] = 'w';
        g[2][23] = 'w'; g[2][24] = 'w'; g[2][25] = 'S'; g[2][26] = 'w';
        g[3][22] = 'w'; g[3][23] = 'S'; g[3][24] = 's'; g[3][25] = 'S'; g[3][26] = 'w'; g[3][27] = 'w';
        g[4][22] = 'w'; g[4][23] = 's'; g[4][24] = 's'; g[4][25] = 'w';
      } else if (steam === 3) {
        // Large expanding puff drifting up and right (rows 1..6, cols 22..30)
        g[1][25] = 'w'; g[1][26] = 'w'; g[1][27] = 'w';
        g[2][24] = 'w'; g[2][25] = 'S'; g[2][26] = 'S'; g[2][27] = 'w'; g[2][28] = 'w';
        g[3][24] = 'w'; g[3][25] = 's'; g[3][26] = 's'; g[3][27] = 'S'; g[3][28] = 'w'; g[3][29] = 'w';
        g[4][25] = 'w'; g[4][26] = 's'; g[4][27] = 's'; g[4][28] = 'w';
        g[5][26] = 'w'; g[5][27] = 'w';
      } else if (steam === 4) {
        // Dissipating wisps (rows 1..4, cols 25..30)
        g[1][27] = 'S'; g[1][28] = 'w';
        g[2][26] = 'w'; g[2][28] = 's'; g[2][29] = 'w';
        g[3][27] = 'w'; g[3][29] = 'S';
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'clack_meter',
    category: 'automation',
    size: [W, H],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Brass pressure barometer with pulsing amber needle that climbs into red danger zone and pops steam valve with billowing exhaust puff',
    palette: palette,
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
