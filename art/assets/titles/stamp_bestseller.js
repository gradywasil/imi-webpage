(function (root) {
  'use strict';

  // Stamp 2: BESTSELLER - 24x24, 4 frames, 8 fps, loop: true
  // Emerald ribbon banner stamp with gold star trim, "BESTSELLER" lettering,
  // traveling specular sheen, and fluttering fishtail ribbon ends.

  const P = {
    '.': null,
    // Emerald Ribbon Ramp (from RAMPS.leafD)
    'k': '#08220c', // deep emerald outline
    's': '#12441a', // shadow emerald
    'b': '#1f6a2a', // base emerald ribbon
    'l': '#3f9a3a', // light emerald ribbon
    'h': '#62c85e', // highlight emerald ribbon
    // Gold Trim & Sheen Ramp (from RAMPS.gold)
    'd': '#4a2e04', // deep gold
    'o': '#b38004', // shadow gold
    'y': '#ffd23a', // base gold
    'g': '#fff08c', // light gold
    'w': '#fffbe0'  // specular glint / traveling sheen
  };

  // Base ribbon structure (y: 5..15)
  // Left fishtail tail: cols 1..4, y: 14..18
  // Right fishtail tail: cols 19..22, y: 14..18
  function buildBannerFrame(sheenX, flutter) {
    const g = Array.from({ length: 24 }, () => Array(24).fill('.'));

    // 1. Central Banner Body (y: 6..14, x: 3..20)
    // Top border (row 6)
    for (let x = 4; x <= 19; x++) g[6][x] = 'k';
    // Top gold filigree (row 7)
    g[7][3] = 'k'; g[7][4] = 'y';
    for (let x = 5; x <= 18; x++) g[7][x] = (x % 2 === 0) ? 'g' : 'y';
    g[7][19] = 'y'; g[7][20] = 'k';

    // Banner cloth rows (8..12)
    for (let y = 8; y <= 12; y++) {
      g[y][3] = 'k';
      for (let x = 4; x <= 19; x++) {
        g[y][x] = (y === 8) ? 'l' : (y === 12) ? 's' : 'b';
      }
      g[y][20] = 'k';
    }

    // Gilded Star Crests & "BESTSELLER" Lettering Imprint (rows 9..11)
    // Left Star at x=5,6
    g[10][5] = 'w'; g[10][6] = 'y'; g[9][5] = 'g'; g[11][5] = 'o';
    // Right Star at x=17,18
    g[10][17] = 'y'; g[10][18] = 'w'; g[9][18] = 'g'; g[11][18] = 'o';

    // Letters: B E S T S E L L E R (compact 1px type bars across x: 8..15)
    // row 9: top of letters
    g[9][8] = 'g'; g[9][9] = 'g'; g[9][10] = 'g'; g[9][11] = 'g';
    g[9][12] = 'g'; g[9][13] = 'g'; g[9][14] = 'g'; g[9][15] = 'g';
    // row 10: mid of letters
    g[10][8] = 'y'; g[10][9] = 'y'; g[10][10] = 'y'; g[10][11] = 'w';
    g[10][12] = 'y'; g[10][13] = 'y'; g[10][14] = 'y'; g[10][15] = 'y';
    // row 11: bot of letters
    g[11][8] = 'o'; g[11][9] = 'o'; g[11][10] = 'o'; g[11][11] = 'o';
    g[11][12] = 'o'; g[11][13] = 'o'; g[11][14] = 'o'; g[11][15] = 'o';

    // Bottom gold filigree (row 13)
    g[13][3] = 'k'; g[13][4] = 'o';
    for (let x = 5; x <= 18; x++) g[13][x] = (x % 2 === 0) ? 'y' : 'o';
    g[13][19] = 'o'; g[13][20] = 'k';
    // Bottom border (row 14)
    for (let x = 4; x <= 19; x++) g[14][x] = 'k';

    // 2. Folded Ribbon Corners (rosettes / folds behind banner)
    g[8][2] = 'k'; g[9][2] = 'k'; g[10][2] = 'k';
    g[8][21] = 'k'; g[9][21] = 'k'; g[10][21] = 'k';

    // 3. Left Fishtail Ribbon Tail (cols 1..5)
    g[13][2] = 'k'; g[13][3] = 's';
    g[14][1] = 'k'; g[14][2] = 'b'; g[14][3] = 's';
    g[15][1] = 'k'; g[15][2] = 'b'; g[15][3] = 'b'; g[15][4] = 'k';
    g[16][1] = 'k'; g[16][2] = 'l'; g[16][3] = 'b'; g[16][4] = 'k';
    g[17][1] = 'k'; g[17][2] = 'b'; g[17][3] = 'b'; g[17][4] = 'k';

    if (flutter === 0) {
      // Resting tails
      g[18][1] = 'k'; g[18][2] = 's'; g[18][4] = 'k';
      g[19][1] = 'k'; g[19][2] = 'k';
    } else if (flutter === 1) {
      // Left tail dips 1px
      g[18][1] = 'k'; g[18][2] = 'b'; g[18][3] = 's'; g[18][4] = 'k';
      g[19][1] = 'k'; g[19][2] = 's'; g[19][4] = 'k';
      g[20][1] = 'k'; g[20][2] = 'k';
    } else {
      // Tail normal
      g[18][1] = 'k'; g[18][2] = 's'; g[18][4] = 'k';
      g[19][1] = 'k'; g[19][2] = 'k';
    }

    // 4. Right Fishtail Ribbon Tail (cols 19..22)
    g[13][21] = 's'; g[13][22] = 'k';
    g[14][20] = 's'; g[14][21] = 'b'; g[14][22] = 'k';
    g[15][19] = 'k'; g[15][20] = 'b'; g[15][21] = 'b'; g[15][22] = 'k';
    g[16][19] = 'k'; g[16][20] = 'b'; g[16][21] = 'l'; g[16][22] = 'k';
    g[17][19] = 'k'; g[17][20] = 'b'; g[17][21] = 'b'; g[17][22] = 'k';

    if (flutter === 2) {
      // Right tail dips 1px
      g[18][19] = 'k'; g[18][20] = 's'; g[18][21] = 'b'; g[18][22] = 'k';
      g[19][19] = 'k'; g[19][21] = 's'; g[19][22] = 'k';
      g[20][21] = 'k'; g[20][22] = 'k';
    } else {
      g[18][19] = 'k'; g[18][21] = 's'; g[18][22] = 'k';
      g[19][21] = 'k'; g[19][22] = 'k';
    }

    // 5. Apply Traveling Specular Sheen (x around sheenX)
    for (let y = 7; y <= 13; y++) {
      const sx = sheenX + Math.floor((y - 10) * 0.5);
      for (let dx = -1; dx <= 1; dx++) {
        const px = sx + dx;
        if (px >= 4 && px <= 19 && g[y][px] !== 'k' && g[y][px] !== '.') {
          if (dx === 0) g[y][px] = 'w';
          else if (g[y][px] === 'b' || g[y][px] === 's') g[y][px] = 'h';
          else if (g[y][px] === 'y' || g[y][px] === 'o') g[y][px] = 'g';
        }
      }
    }

    return g;
  }

  function buildFrames() {
    const sheens = [5, 9, 14, 18];
    const flutters = [0, 1, 2, 0];
    const frames = [];

    for (let f = 0; f < 4; f++) {
      const g = buildBannerFrame(sheens[f], flutters[f]);
      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'stamp_bestseller',
    category: 'titles',
    size: [24, 24],
    fps: 8,
    loop: true,
    notes: 'Emerald ribbon stamp "BESTSELLER" with traveling sheen and fluttering fishtail ends',
    palette: P,
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || {}).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
