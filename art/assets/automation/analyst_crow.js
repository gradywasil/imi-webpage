(function (root) {
  'use strict';

  // 32x32, 8 frames, 8 fps
  // Corvid auditor with ledger scroll and abacus bead click
  const W = 32;
  const H = 32;

  const palette = {
    '.': null,
    'k': '#0a0408', // deep selective outline
    'd': '#1a0f14', // feather deep shadow
    'f': '#3a2a30', // feather body shadow
    'u': '#4e2280', // iridescent purple sheen shadow
    'U': '#7a46bc', // iridescent purple sheen highlight
    'm': '#626274', // beak slate shadow
    'M': '#a4a4b4', // beak slate light
    'w': '#ffffff', // eye glint / spark / paper light
    'y': '#ffd23a', // gold abacus bead / amber eye
    'Y': '#fff08c', // gold highlight
    'b': '#5a3517', // wood desk / abacus frame base
    'B': '#8a5a2b', // wood light
    'r': '#b8322a', // ruby abacus bead
    'p': '#ede0b8', // ledger scroll parchment
    'P': '#fff6d6'  // ledger scroll light
  };

  function buildFrames() {
    const frames = [];

    // Animation trajectory:
    // Head position: [dx, dy]
    const headOffsets = [
      [0, 0], [-1, 0], [-1, 1], [0, 1],
      [0, 0], [0, -1], [0, 0], [0, 0]
    ];
    // Wing breathing / fluff offset:
    const wingFluffs = [0, 0, 1, 1, 1, 0, 0, 0];
    // Eye blink: 0=open, 1=half, 2=shut
    const eyeBlinks = [0, 0, 0, 0, 0, 2, 1, 0];
    // Abacus beads:
    const bead1X = [5, 6, 7, 9, 9, 9, 7, 5];
    const bead2X = [9, 8, 7, 5, 5, 5, 7, 9];
    // Claw offset:
    const clawOffsets = [0, 1, 2, 3, 2, 1, 0, 0];
    // Spark on impact (frame 3 and 4)
    const sparks = [false, false, false, true, true, false, false, false];

    for (let f = 0; f < 8; f++) {
      const g = Array.from({ length: H }, () => Array(W).fill('.'));
      const [hdx, hdy] = headOffsets[f];
      const wf = wingFluffs[f];
      const blink = eyeBlinks[f];
      const b1 = bead1X[f];
      const b2 = bead2X[f];
      const cdx = clawOffsets[f];
      const spark = sparks[f];

      // 1. Desk Surface (rows 27..30, cols 2..29)
      for (let x = 3; x <= 28; x++) {
        g[27][x] = 'k';
        g[28][x] = (x % 3 === 0) ? 'B' : 'b';
        g[29][x] = 'b';
        g[30][x] = 'k';
      }
      g[28][2] = 'k'; g[29][2] = 'k';
      g[28][29] = 'k'; g[29][29] = 'k';

      // 2. Corvid Auditor Body & Wings (cols 14..27, rows 12..27)
      const rx = 26 + wf;
      for (let y = 14; y <= 26; y++) {
        for (let x = 16; x <= rx; x++) {
          const isSheen = ((x + y + f) % 3 === 0);
          g[y][x] = (x <= 18) ? (isSheen ? 'U' : 'u') : (isSheen ? 'u' : 'f');
        }
        g[y][rx + 1] = 'k';
      }
      g[27][17] = 'k';
      for (let x = 18; x <= rx; x++) g[27][x] = 'k';

      // 3. Crow Head & Piercing Eye (rows 4+hdy .. 14+hdy, cols 11+hdx .. 23+hdx)
      const cy = 6 + hdy;
      const cx = 15 + hdx;

      // Crown feathers
      g[cy - 2][cx + 1] = 'k'; g[cy - 2][cx + 2] = 'k';
      g[cy - 1][cx - 1] = 'k'; g[cy - 1][cx] = 'U'; g[cy - 1][cx + 1] = 'U'; g[cy - 1][cx + 2] = 'u'; g[cy - 1][cx + 3] = 'k';

      for (let y = cy; y <= cy + 5; y++) {
        g[y][cx - 2] = 'k';
        for (let x = cx - 1; x <= cx + 6; x++) {
          g[y][x] = (x <= cx + 1) ? 'U' : ((x <= cx + 4) ? 'u' : 'f');
        }
        g[y][cx + 7] = 'k';
      }

      // Eye
      if (blink === 0) {
        // Open piercing eye
        g[cy + 1][cx] = 'k'; g[cy + 1][cx + 1] = 'k';
        g[cy + 2][cx - 1] = 'y'; g[cy + 2][cx] = 'w'; g[cy + 2][cx + 1] = 'd'; g[cy + 2][cx + 2] = 'k';
        g[cy + 3][cx] = 'y'; g[cy + 3][cx + 1] = 'k';
      } else if (blink === 1) {
        g[cy + 1][cx] = 'k'; g[cy + 1][cx + 1] = 'k';
        g[cy + 2][cx - 1] = 'y'; g[cy + 2][cx] = 'd'; g[cy + 2][cx + 1] = 'd'; g[cy + 2][cx + 2] = 'k';
      } else {
        // Closed slit
        g[cy + 2][cx - 1] = 'k'; g[cy + 2][cx] = 'k'; g[cy + 2][cx + 1] = 'k';
      }

      // Sharp Slate Beak (projecting forward-left)
      g[cy + 1][cx - 3] = 'k'; g[cy + 1][cx - 2] = 'k';
      g[cy + 2][cx - 6] = 'k'; g[cy + 2][cx - 5] = 'k'; g[cy + 2][cx - 4] = 'M'; g[cy + 2][cx - 3] = 'M';
      g[cy + 3][cx - 8] = 'k'; g[cy + 3][cx - 7] = 'M'; g[cy + 3][cx - 6] = 'M'; g[cy + 3][cx - 5] = 'M'; g[cy + 3][cx - 4] = 'M'; g[cy + 3][cx - 3] = 'M';
      g[cy + 4][cx - 7] = 'k'; g[cy + 4][cx - 6] = 'm'; g[cy + 4][cx - 5] = 'm'; g[cy + 4][cx - 4] = 'm'; g[cy + 4][cx - 3] = 'k';
      g[cy + 5][cx - 5] = 'k'; g[cy + 5][cx - 4] = 'k';

      // White collar / chest ruff
      g[cy + 6][cx] = 'w'; g[cy + 6][cx + 1] = 'P';
      g[cy + 7][cx] = 'P'; g[cy + 7][cx + 1] = 'p';

      // 4. Ledger Scroll unrolling vertically across desk (cols 11..16, rows 17..29)
      // Top roll
      g[16][12] = 'k'; g[16][13] = 'P'; g[16][14] = 'P'; g[16][15] = 'k';
      g[17][11] = 'k'; g[17][12] = 'p'; g[17][13] = 'P'; g[17][14] = 'p'; g[17][15] = 'k';

      for (let y = 18; y <= 27; y++) {
        g[y][11] = 'k';
        g[y][12] = 'P';
        // Tally digits on scroll
        g[y][13] = ((y + f) % 2 === 0) ? 'd' : 'p';
        g[y][14] = ((y * 2 + f) % 3 === 0) ? 'd' : 'p';
        g[y][15] = 'p';
        g[y][16] = 'k';
      }
      g[28][11] = 'k'; g[28][12] = 'p'; g[28][13] = 'p'; g[28][14] = 'p'; g[28][15] = 'k';
      g[29][12] = 'k'; g[29][13] = 'k'; g[29][14] = 'k';

      // 5. Wooden Abacus (cols 3..11, rows 19..26)
      // Outer frame
      for (let x = 3; x <= 11; x++) g[19][x] = 'k';
      for (let x = 4; x <= 10; x++) g[20][x] = 'B';
      for (let y = 20; y <= 25; y++) {
        g[y][3] = 'k'; g[y][4] = 'b';
        g[y][10] = 'b'; g[y][11] = 'k';
      }
      for (let x = 4; x <= 10; x++) g[25][x] = 'b';
      for (let x = 3; x <= 11; x++) g[26][x] = 'k';

      // Brass wire rods
      for (let x = 5; x <= 9; x++) {
        g[22][x] = 'm';
        g[24][x] = 'm';
      }

      // Sliding Beads
      // Rod 1 (gold)
      g[21][b1] = 'Y';
      g[22][b1] = 'y';
      g[23][b1] = 'k';

      // Rod 2 (ruby)
      g[24][b2] = 'r';
      g[25][b2] = 'k';

      // 6. Crow Wing / Claw advancing to click the bead (cols 7-cdx .. 11)
      const clawX = 10 - Math.floor(cdx * 0.8);
      g[21][clawX] = 'k';
      g[22][clawX] = 'd'; g[22][clawX + 1] = 'd';
      g[23][clawX] = 'k';

      // Impact spark!
      if (spark) {
        g[21][9] = 'w';
        g[22][9] = 'w';
        g[23][10] = 'w';
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'analyst_crow',
    category: 'automation',
    size: [W, H],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Sleek corvid auditor in iridescent plumage auditing ledger scroll and rapidly flicking abacus beads with sharp precision',
    palette: palette,
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
