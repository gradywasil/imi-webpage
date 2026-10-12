(function (root) {
  'use strict';

  // 32x32, 8 frames, 8 fps
  // Vibrant scarlet/cobalt mandrill typing frantically on typebar machine
  const W = 32;
  const H = 32;

  const palette = {
    '.': null,
    'k': '#12090e', // deep outline
    'f': '#4a2814', // fur shadow
    'F': '#8e5628', // fur midtone
    'r': '#b8322a', // scarlet nose ridge base
    'R': '#e86a50', // scarlet nose highlight
    'c': '#2e44a8', // cobalt blue cheek base
    'C': '#5470d8', // cobalt blue cheek light
    'y': '#ffd23a', // golden beard/tuft base
    'Y': '#fff08c', // golden beard highlight
    'w': '#ffffff', // paper / specular glint / eye white
    'm': '#626274', // typewriter metal base
    'M': '#a4a4b4', // typewriter metal light
    'p': '#ede0b8', // paper cream
    'b': '#5a3517'  // desk wood
  };

  function buildFrames() {
    const frames = [];

    // Rapid alternating typing animation
    // Typebar striking paper: 0=none, 1=left bar up, 2=right bar up
    const typebars = [1, 0, 2, 0, 1, 0, 2, 0];
    // Hand positions: [leftHandY, rightHandY]
    const handOffsets = [
      [1, 0], [0, 0], [0, 1], [0, 0],
      [1, 0], [0, 0], [0, 1], [0, 0]
    ];
    // Head eager bob:
    const headBobs = [0, 1, 1, 0, 0, 1, 0, 0];
    // Carriage offset:
    const carriageOffsets = [0, 0, 1, 1, 1, 2, 1, 0];

    for (let f = 0; f < 8; f++) {
      const g = Array.from({ length: H }, () => Array(W).fill('.'));
      const tbar = typebars[f];
      const [lhy, rhy] = handOffsets[f];
      const hdy = headBobs[f];
      const cdx = carriageOffsets[f];

      // 1. Desk Surface (rows 28..30, cols 3..28)
      for (let x = 4; x <= 27; x++) {
        g[28][x] = 'b';
        g[29][x] = (x % 3 === 0) ? 'F' : 'b';
        g[30][x] = 'k';
      }
      g[28][3] = 'k'; g[29][3] = 'k';
      g[28][28] = 'k'; g[29][28] = 'k';

      // 2. Mandrill Head & Mane (rows 2..17 + hdy, cols 8..23)
      const y0 = 3 + hdy;

      // Crown mane / crest
      g[y0 - 2][15] = 'k'; g[y0 - 2][16] = 'k';
      g[y0 - 1][14] = 'k'; g[y0 - 1][15] = 'F'; g[y0 - 1][16] = 'f'; g[y0 - 1][17] = 'k';
      for (let x = 12; x <= 19; x++) g[y0][x] = (x <= 15) ? 'F' : 'f';
      g[y0][11] = 'k'; g[y0][20] = 'k';

      // Mane silhouette
      for (let y = y0 + 1; y <= y0 + 9; y++) {
        g[y][9] = 'k';
        g[y][22] = 'k';
        for (let x = 10; x <= 21; x++) {
          g[y][x] = (x <= 13) ? 'F' : 'f';
        }
      }

      // Scarlet Nose Ridge down center (rows y0+3 .. y0+9, cols 15..16)
      for (let y = y0 + 3; y <= y0 + 8; y++) {
        g[y][15] = 'R';
        g[y][16] = 'r';
      }
      // Bulbous scarlet nose tip
      g[y0 + 9][14] = 'R'; g[y0 + 9][15] = 'R'; g[y0 + 9][16] = 'r'; g[y0 + 9][17] = 'r';
      g[y0 + 10][14] = 'k'; g[y0 + 10][15] = 'r'; g[y0 + 10][16] = 'r'; g[y0 + 10][17] = 'k';

      // Cobalt Blue Cheek Ridges (ribbed flanks)
      // Left cheek (cols 12..14, rows y0+4..y0+8)
      for (let y = y0 + 4; y <= y0 + 8; y++) {
        g[y][12] = (y % 2 === 0) ? 'C' : 'c';
        g[y][13] = (y % 2 === 0) ? 'C' : 'c';
        g[y][14] = 'k';
      }
      // Right cheek (cols 17..19, rows y0+4..y0+8)
      for (let y = y0 + 4; y <= y0 + 8; y++) {
        g[y][17] = 'k';
        g[y][18] = (y % 2 === 0) ? 'c' : 'k';
        g[y][19] = (y % 2 === 0) ? 'C' : 'c';
      }

      // Intense Amber/Brown Eyes with white glint
      g[y0 + 3][12] = 'k'; g[y0 + 3][13] = 'k';
      g[y0 + 3][18] = 'k'; g[y0 + 3][19] = 'k';
      g[y0 + 4][13] = 'w'; // eye glint left
      g[y0 + 4][18] = 'w'; // eye glint right

      // Golden Yellow Beard / Mane Tuft (rows y0+10 .. y0+14, cols 12..19)
      for (let y = y0 + 11; y <= y0 + 13; y++) {
        g[y][11] = 'k';
        for (let x = 12; x <= 19; x++) {
          g[y][x] = (x <= 15) ? 'Y' : 'y';
        }
        g[y][20] = 'k';
      }
      g[y0 + 14][13] = 'k'; g[y0 + 14][14] = 'Y'; g[y0 + 14][15] = 'y';
      g[y0 + 14][16] = 'y'; g[y0 + 14][17] = 'y'; g[y0 + 14][18] = 'k';
      g[y0 + 15][15] = 'k'; g[y0 + 15][16] = 'k';

      // 3. Vintage Typewriter Machine (rows 18..27, cols 7..24)
      // Moving Carriage & Platen (roller) + Paper
      const cx = 13 + cdx;
      // Paper sheet sticking up from carriage (rows 16..20)
      for (let py = 16; py <= 20; py++) {
        for (let px = cx - 3; px <= cx + 3; px++) {
          if (px >= 6 && px <= 25) g[py][px] = (py % 2 === 0 && px >= cx - 2 && px <= cx + 2) ? 'm' : 'p';
        }
      }
      // Top outline of paper
      for (let px = cx - 3; px <= cx + 3; px++) {
        if (px >= 6 && px <= 25) g[15][px] = 'k';
      }

      // Carriage Roller / Platen (row 21, cols 8..23)
      for (let x = 8; x <= 23; x++) {
        g[21][x] = (x === cx - 4 || x === cx + 4) ? 'M' : 'k';
      }

      // Typewriter Chassis Basket (rows 22..27, cols 6..25)
      g[22][6] = 'k'; g[22][25] = 'k';
      for (let x = 7; x <= 24; x++) g[22][x] = (x <= 15) ? 'M' : 'm';

      for (let y = 23; y <= 26; y++) {
        g[y][5] = 'k';
        g[y][6] = 'M';
        for (let x = 7; x <= 24; x++) {
          g[y][x] = (y === 24 || y === 26) ? 'm' : 'k'; // keyboard stepped rows
        }
        g[y][25] = 'm';
        g[y][26] = 'k';
      }
      for (let x = 5; x <= 26; x++) g[27][x] = 'k';

      // Typewriter round keycaps glints (rows 24 and 25)
      g[24][8] = 'w'; g[24][11] = 'w'; g[24][14] = 'w'; g[24][17] = 'w'; g[24][20] = 'w'; g[24][23] = 'w';
      g[25][9] = 'w'; g[25][12] = 'w'; g[25][15] = 'w'; g[25][18] = 'w'; g[25][21] = 'w';

      // 4. Typebar mechanism & Striking Bar
      if (tbar === 1) {
        // Left typebar striking paper at (cx, 19..22)
        g[22][cx - 2] = 'M';
        g[21][cx - 1] = 'M';
        g[20][cx] = 'M';
        g[19][cx] = 'w'; // spark impact
      } else if (tbar === 2) {
        // Right typebar striking paper
        g[22][cx + 2] = 'M';
        g[21][cx + 1] = 'M';
        g[20][cx] = 'M';
        g[19][cx] = 'w'; // spark impact
      }

      // 5. Frantic Typing Hands (brown furry hands perched over keyboard)
      // Left hand (cols 9..12, row 23 + lhy)
      const ly = 23 + lhy;
      g[ly - 1][9] = 'k'; g[ly - 1][10] = 'F'; g[ly - 1][11] = 'k';
      g[ly][8] = 'k'; g[ly][9] = 'F'; g[ly][10] = 'Y'; g[ly][11] = 'F'; g[ly][12] = 'k';
      g[ly + 1][9] = 'k'; g[ly + 1][10] = 'k'; g[ly + 1][11] = 'k';

      // Right hand (cols 19..22, row 23 + rhy)
      const ry = 23 + rhy;
      g[ry - 1][20] = 'k'; g[ry - 1][21] = 'F'; g[ry - 1][22] = 'k';
      g[ry][19] = 'k'; g[ry][20] = 'F'; g[ry][21] = 'Y'; g[ry][22] = 'F'; g[ry][23] = 'k';
      g[ry + 1][20] = 'k'; g[ry + 1][21] = 'k'; g[ry + 1][22] = 'k';

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'mandrill_typist',
    category: 'automation',
    size: [W, H],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Vibrant scarlet and cobalt mandrill typing frantically on vintage typebar machine with flying hammers and carriage motion',
    palette: palette,
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
