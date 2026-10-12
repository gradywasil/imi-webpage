(function (root) {
  'use strict';

  // 32x32, 8 frames, 8 fps
  // Wise ginger orangutan with teetering scroll pile and magnifying glass
  const W = 32;
  const H = 32;

  const palette = {
    '.': null,
    'k': '#261208', // deep dark outline
    'f': '#6e3c16', // ginger fur shadow
    'F': '#a86834', // ginger fur base
    'H': '#dca06a', // ginger fur highlight
    'd': '#3a1e0b', // face deep shadow
    's': '#7d4f26', // face shadow
    'S': '#b97c4c', // face light
    'w': '#ffffff', // lens glint / eye white
    'g': '#ffd23a', // brass magnifying glass base
    'G': '#fff08c', // brass highlight
    'o': '#b38004', // brass shadow
    'l': '#7ec8f0', // lens crystal blue tint
    'p': '#ede0b8', // parchment scroll base
    'P': '#fff6d6', // parchment highlight
    'r': '#b8322a', // wax seal / ribbon red
    'b': '#5a3517'  // archive desk wood
  };

  function buildFrames() {
    const frames = [];

    // Scroll stack wobble dx offsets (top scroll shifts more than bottom)
    const scrollWobbles = [0, 1, 1, 0, -1, -1, 0, 0];
    // Magnifying glass scanning motion [dx, dy]
    const lensOffsets = [
      [0, 0], [1, 0], [1, 1], [0, 1],
      [-1, 1], [-1, 0], [0, 0], [0, 0]
    ];
    // Wise blink states: 0=open, 1=half, 2=shut
    const blinks = [0, 0, 0, 0, 1, 2, 0, 0];

    for (let f = 0; f < 8; f++) {
      const g = Array.from({ length: H }, () => Array(W).fill('.'));
      const sw = scrollWobbles[f];
      const [ldx, ldy] = lensOffsets[f];
      const blink = blinks[f];

      // 1. Desk Surface (rows 28..30, cols 2..29)
      for (let x = 3; x <= 28; x++) {
        g[28][x] = 'b';
        g[29][x] = (x % 3 === 0) ? 'f' : 'b';
        g[30][x] = 'k';
      }
      g[28][2] = 'k'; g[29][2] = 'k';
      g[28][29] = 'k'; g[29][29] = 'k';

      // 2. Wise Ginger Orangutan (centered around cols 14..27, rows 6..27)
      // Shaggy Dome / Ginger Head (rows 6..14, cols 15..26)
      g[5][20] = 'k'; g[5][21] = 'k';
      g[6][18] = 'k'; g[6][19] = 'H'; g[6][20] = 'H'; g[6][21] = 'F'; g[6][22] = 'k';
      g[7][16] = 'k'; g[7][17] = 'H'; g[7][18] = 'H'; g[7][19] = 'F'; g[7][20] = 'F'; g[7][21] = 'f'; g[7][22] = 'f'; g[7][23] = 'k';

      for (let y = 8; y <= 12; y++) {
        g[y][15] = 'k';
        for (let x = 16; x <= 25; x++) {
          g[y][x] = (x <= 18) ? 'H' : ((x <= 22) ? 'F' : 'f');
        }
        g[y][26] = 'k';
      }

      // Cheek Flanges (wide pads on either side of face)
      // Left flange (cols 14..16, rows 12..17)
      for (let y = 13; y <= 16; y++) {
        g[y][13] = 'k';
        g[y][14] = 'H';
        g[y][15] = 's';
      }
      // Right flange (cols 24..26, rows 12..17)
      for (let y = 13; y <= 16; y++) {
        g[y][24] = 's';
        g[y][25] = 'f';
        g[y][26] = 'k';
      }

      // Face (rows 12..17, cols 16..23)
      for (let y = 12; y <= 17; y++) {
        for (let x = 16; x <= 23; x++) {
          g[y][x] = (y <= 14) ? 'S' : 's';
        }
      }

      // Eyes (deep set, intelligent)
      if (blink === 0) {
        g[13][17] = 'k'; g[13][18] = 'k';
        g[13][21] = 'k'; g[13][22] = 'k';
        g[14][17] = 'w'; g[14][18] = 'd';
        g[14][21] = 'w'; g[14][22] = 'd';
      } else if (blink === 1) {
        g[13][17] = 'k'; g[13][18] = 'k';
        g[13][21] = 'k'; g[13][22] = 'k';
        g[14][17] = 'd'; g[14][18] = 'd';
        g[14][21] = 'd'; g[14][22] = 'd';
      } else {
        g[13][17] = 'k'; g[13][18] = 'k';
        g[13][21] = 'k'; g[13][22] = 'k';
        g[14][17] = 's'; g[14][18] = 's';
        g[14][21] = 's'; g[14][22] = 's';
      }

      // Broad Nose & Muzzle
      g[15][19] = 'd'; g[15][20] = 'd';
      g[16][18] = 'k'; g[16][19] = 'd'; g[16][20] = 'd'; g[16][21] = 'k';

      // Shaggy Ginger Beard (rows 18..22, cols 15..25)
      for (let y = 18; y <= 21; y++) {
        g[y][14] = 'k';
        for (let x = 15; x <= 25; x++) {
          g[y][x] = (x <= 18) ? 'H' : ((x <= 22) ? 'F' : 'f');
        }
        g[y][26] = 'k';
      }
      g[22][16] = 'k'; g[22][17] = 'H'; g[22][18] = 'F'; g[22][19] = 'F';
      g[22][20] = 'F'; g[22][21] = 'f'; g[22][22] = 'k';

      // Shaggy Orangutan Body & Arm (rows 22..27, cols 14..28)
      for (let y = 23; y <= 27; y++) {
        g[y][15] = 'k';
        for (let x = 16; x <= 27; x++) {
          g[y][x] = (x <= 19) ? 'H' : ((x <= 23) ? 'F' : 'f');
        }
        g[y][28] = 'k';
      }

      // 3. Teetering Scroll Pile (cols 3..12, rows 10..27)
      // Bottom scroll (row 25..27, wide parchment roll)
      g[25][4] = 'k'; g[25][12] = 'k';
      for (let x = 5; x <= 11; x++) g[25][x] = 'P';
      g[26][3] = 'k'; g[26][4] = 'p'; g[26][12] = 'p'; g[26][13] = 'k';
      for (let x = 5; x <= 11; x++) g[26][x] = (x === 8) ? 'r' : 'p'; // red ribbon
      g[27][4] = 'k'; g[27][12] = 'k';
      for (let x = 5; x <= 11; x++) g[27][x] = 'f';

      // Middle scroll (row 20..24, slightly offset)
      const mx = 6 + Math.round(sw * 0.5);
      g[20][mx - 2] = 'k'; g[20][mx + 5] = 'k';
      for (let x = mx - 1; x <= mx + 4; x++) g[20][x] = 'P';
      g[21][mx - 3] = 'k'; g[21][mx - 2] = 'p'; g[21][mx + 5] = 'p'; g[21][mx + 6] = 'k';
      for (let x = mx - 1; x <= mx + 4; x++) g[21][x] = (x === mx + 1) ? 'r' : 'p';
      g[22][mx - 2] = 'k'; g[22][mx + 5] = 'k';
      for (let x = mx - 1; x <= mx + 4; x++) g[22][x] = 'f';

      // Top scroll (teetering dramatically rows 14..18, offset by sw)
      const tx = 6 + sw;
      g[15][tx - 2] = 'k'; g[15][tx + 4] = 'k';
      for (let x = tx - 1; x <= tx + 3; x++) g[15][x] = 'P';
      g[16][tx - 3] = 'k'; g[16][tx - 2] = 'p'; g[16][tx + 4] = 'p'; g[16][tx + 5] = 'k';
      for (let x = tx - 1; x <= tx + 3; x++) g[16][x] = (x === tx) ? 'r' : 'p';
      g[17][tx - 2] = 'k'; g[17][tx + 4] = 'k';
      for (let x = tx - 1; x <= tx + 3; x++) g[17][x] = 'f';

      // Very top rolled parchment roll (row 11..14, tip teetering)
      const vx = 7 + sw * 2;
      g[11][vx - 1] = 'k'; g[11][vx] = 'P'; g[11][vx + 1] = 'P'; g[11][vx + 2] = 'k';
      g[12][vx - 2] = 'k'; g[12][vx - 1] = 'p'; g[12][vx] = 'p'; g[12][vx + 1] = 'p'; g[12][vx + 2] = 'p'; g[12][vx + 3] = 'k';
      g[13][vx - 1] = 'k'; g[13][vx] = 'r'; g[13][vx + 1] = 'r'; g[13][vx + 2] = 'k';
      g[14][vx - 1] = 'k'; g[14][vx] = 'f'; g[14][vx + 1] = 'f'; g[14][vx + 2] = 'k';

      // 4. Magnifying Glass (held by orangutan's hand, positioned at cols 10..17, rows 19..26)
      const gx = 13 + ldx;
      const gy = 20 + ldy;

      // Brass Rim (round circular frame)
      g[gy - 2][gx] = 'G'; g[gy - 2][gx + 1] = 'G'; g[gy - 2][gx + 2] = 'g';
      g[gy - 1][gx - 1] = 'G'; g[gy - 1][gx + 3] = 'o';
      g[gy][gx - 2] = 'G'; g[gy][gx + 4] = 'o';
      g[gy + 1][gx - 2] = 'G'; g[gy + 1][gx + 4] = 'o';
      g[gy + 2][gx - 1] = 'g'; g[gy + 2][gx + 3] = 'o';
      g[gy + 3][gx] = 'o'; g[gy + 3][gx + 1] = 'o'; g[gy + 3][gx + 2] = 'o';

      // Glass Lens Center (cyan/blue reflection + white glint)
      for (let y = gy - 1; y <= gy + 2; y++) {
        for (let x = gx; x <= gx + 2; x++) {
          g[y][x] = 'l';
        }
      }
      g[gy - 1][gx] = 'w'; // glint top-left
      g[gy][gx] = 'w';

      // Brass Handle slanting down to orangutan's gripping paw
      g[gy + 3][gx + 3] = 'G';
      g[gy + 4][gx + 4] = 'g';
      g[gy + 5][gx + 5] = 'o';

      // Shaggy hairy hand holding handle
      g[gy + 4][gx + 5] = 'H'; g[gy + 4][gx + 6] = 'k';
      g[gy + 5][gx + 6] = 'F'; g[gy + 5][gx + 7] = 'k';
      g[gy + 6][gx + 5] = 'k'; g[gy + 6][gx + 6] = 'f';

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'orangutan_archivist',
    category: 'automation',
    size: [W, H],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Wise ginger orangutan inspecting parchment through magnifying glass beside a teetering wobble of ancient scrolls',
    palette: palette,
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
