(function (root) {
  'use strict';

  // 32x32, 8 frames, 8 fps
  // Slick fox in fedora with contract folder, tail swishes, sly wink
  const W = 32;
  const H = 32;

  const palette = {
    '.': null,
    'k': '#261208', // deep selective outline
    'f': '#6e3c16', // russet shadow
    'F': '#a86834', // russet fox fur base
    'H': '#dca06a', // russet fur light
    'w': '#ffffff', // white fur / eye white / star glint
    'p': '#ede0b8', // white fur shadow
    'd': '#1a0f14', // fedora band / pupil / nose
    'u': '#3a2a30', // fedora charcoal base
    'U': '#5c4650', // fedora light
    'm': '#c98f0e', // contract folder shadow
    'y': '#ffd23a', // contract folder / gold seal base
    'Y': '#fff08c', // folder highlight
    'r': '#b8322a', // silk tie red
    'R': '#e86a50'  // tie red light
  };

  function buildFrames() {
    const frames = [];

    // Tail swish horizontal offsets: [bodyX, tipX]
    const tailSwishes = [
      [0, 0], [1, 0], [2, 1], [1, 2],
      [0, 1], [-1, 0], [-2, -1], [-1, -1]
    ];
    // Wink states: 0=open, 1=half, 2=full wink with star glint
    const winkStates = [0, 0, 1, 2, 2, 0, 0, 0];
    // Fedora tilt offset: dy
    const hatTilts = [0, -1, -1, 0, 0, 0, 0, 0];

    for (let f = 0; f < 8; f++) {
      const g = Array.from({ length: H }, () => Array(W).fill('.'));
      const [tbx, ttx] = tailSwishes[f];
      const wink = winkStates[f];
      const hdy = hatTilts[f];

      // 1. Bushy Fox Tail with White Tip (cols 2..10, rows 16..29)
      // Base of tail behind body (swaying with tbx)
      const tx = 5 + tbx;
      for (let y = 20; y <= 26; y++) {
        g[y][tx - 2] = 'k';
        for (let x = tx - 1; x <= tx + 3; x++) {
          g[y][x] = (x <= tx) ? 'H' : 'F';
        }
        g[y][tx + 4] = 'k';
      }

      // Mid tail curving up
      for (let y = 17; y <= 19; y++) {
        g[y][tx - 3] = 'k';
        for (let x = tx - 2; x <= tx + 2; x++) {
          g[y][x] = (x <= tx - 1) ? 'H' : 'F';
        }
        g[y][tx + 3] = 'k';
      }

      // Fluffy White Tip (swaying with ttx lag, rows 13..16)
      const tipX = 4 + ttx;
      g[13][tipX] = 'k'; g[13][tipX + 1] = 'k';
      g[14][tipX - 1] = 'k'; g[14][tipX] = 'w'; g[14][tipX + 1] = 'w'; g[14][tipX + 2] = 'k';
      g[15][tipX - 1] = 'k'; g[15][tipX] = 'w'; g[15][tipX + 1] = 'p'; g[15][tipX + 2] = 'k';
      g[16][tipX] = 'k'; g[16][tipX + 1] = 'p'; g[16][tipX + 2] = 'k';

      // 2. Fox Legs & Trenchcoat / Suit (rows 22..29, cols 10..22)
      // Trenchcoat bottom
      for (let y = 22; y <= 27; y++) {
        g[y][10] = 'k';
        for (let x = 11; x <= 20; x++) {
          g[y][x] = (x <= 14) ? 'U' : 'u';
        }
        g[y][21] = 'k';
      }
      for (let x = 11; x <= 20; x++) g[28][x] = 'k';

      // Slick black agent shoes
      g[29][11] = 'd'; g[29][12] = 'd'; g[29][13] = 'k';
      g[29][18] = 'd'; g[29][19] = 'd'; g[29][20] = 'k';

      // Red Silk Tie & White Shirt Collar (rows 17..22, cols 14..16)
      g[17][15] = 'w';
      g[18][14] = 'w'; g[18][15] = 'R'; g[18][16] = 'w';
      g[19][15] = 'R';
      g[20][15] = 'r';
      g[21][15] = 'r';

      // 3. Contract Folder in Hand (cols 18..27, rows 19..28)
      // Folder held under arm / in right hand
      // Manila legal folder
      for (let y = 20; y <= 27; y++) {
        g[y][21] = 'k';
        for (let x = 22; x <= 27; x++) {
          g[y][x] = (y === 20 || x === 22) ? 'Y' : ((x >= 26 || y >= 26) ? 'm' : 'y');
        }
        g[y][28] = 'k';
      }
      g[19][22] = 'k'; g[19][23] = 'k'; g[19][24] = 'k'; g[19][25] = 'k'; g[19][26] = 'k'; g[19][27] = 'k';
      g[28][22] = 'k'; g[28][23] = 'k'; g[28][24] = 'k'; g[28][25] = 'k'; g[28][26] = 'k'; g[28][27] = 'k';

      // Red Wax Seal & Ribbon on folder
      g[23][24] = 'R'; g[23][25] = 'r';
      g[24][24] = 'r'; g[24][25] = 'k';

      // Fox gloved paw holding folder
      g[21][20] = 'k'; g[21][21] = 'd'; g[21][22] = 'd'; g[21][23] = 'k';
      g[22][20] = 'k'; g[22][21] = 'd'; g[22][22] = 'k';

      // 4. Fox Head & Sharp Muzzle (rows 7..17, cols 10..22)
      // Russet cheeks
      for (let y = 11; y <= 16; y++) {
        g[y][10] = 'k';
        for (let x = 11; x <= 20; x++) {
          g[y][x] = (x <= 13) ? 'H' : 'F';
        }
      }

      // White cheek ruffs & muzzle (cols 13..21, rows 13..17)
      for (let y = 14; y <= 16; y++) {
        for (let x = 13; x <= 18; x++) {
          g[y][x] = (x <= 15) ? 'w' : 'p';
        }
      }

      // Sharp pointed black nose at muzzle tip
      g[14][18] = 'd'; g[14][19] = 'd'; g[14][20] = 'k';
      g[15][18] = 'k'; g[15][19] = 'k';

      // Sly smirking mouth
      g[16][15] = 'k'; g[16][16] = 'k'; g[16][17] = 'k';

      // Eyes: Left eye winks, Right eye watchful
      // Right eye (open, confident)
      g[12][16] = 'k'; g[12][17] = 'k';
      g[13][16] = 'w'; g[13][17] = 'd';

      // Left eye (winks!)
      if (wink === 0) {
        // Open
        g[12][12] = 'k'; g[12][13] = 'k';
        g[13][12] = 'w'; g[13][13] = 'd';
      } else if (wink === 1) {
        // Half closed
        g[12][12] = 'k'; g[12][13] = 'k';
        g[13][12] = 'd'; g[13][13] = 'k';
      } else {
        // Full sly wink arc with a shiny glint
        g[12][11] = 'k'; g[12][12] = 'H'; g[12][13] = 'k';
        g[13][12] = 'k'; g[13][13] = 'k';
        // Wink sparkle glint!
        g[11][11] = 'w';
      }

      // 5. Slick Fedora Hat (rows 3+hdy .. 11+hdy, cols 8..23)
      const fy = 4 + hdy;

      // Hat Crown (creased top)
      g[fy - 1][14] = 'k'; g[fy - 1][15] = 'k'; g[fy - 1][16] = 'k';
      g[fy][12] = 'k'; g[fy][13] = 'U'; g[fy][14] = 'u'; g[fy][15] = 'U'; g[fy][16] = 'u'; g[fy][17] = 'k';
      g[fy + 1][11] = 'k';
      for (let x = 12; x <= 18; x++) g[fy + 1][x] = (x <= 15) ? 'U' : 'u';
      g[fy + 1][19] = 'k';

      // Hat Ribbon Band (deep black ribbon)
      g[fy + 2][11] = 'k';
      for (let x = 12; x <= 18; x++) g[fy + 2][x] = 'd';
      g[fy + 2][19] = 'k';

      // Fedora Curved Brim (tilted sharply over eyes)
      g[fy + 3][8] = 'k'; g[fy + 3][9] = 'k';
      for (let x = 10; x <= 21; x++) g[fy + 3][x] = (x <= 14) ? 'U' : 'u';
      g[fy + 3][22] = 'k';
      // Underside shadow of brim
      g[fy + 4][9] = 'k';
      for (let x = 10; x <= 20; x++) g[fy + 4][x] = 'd';
      g[fy + 4][21] = 'k';

      // Fox Ear poking out behind fedora (right ear, black tipped)
      g[fy - 1][18] = 'd'; g[fy - 1][19] = 'k';
      g[fy][18] = 'F'; g[fy][19] = 'd'; g[fy][20] = 'k';
      g[fy + 1][20] = 'k';

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'agent_fox',
    category: 'automation',
    size: [W, H],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Slick literary agent fox in tilted fedora with contract folder, swishing bushy tail and delivering a confident sly wink',
    palette: palette,
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
