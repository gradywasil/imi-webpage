(function (root) {
  'use strict';

  // 32x32, 8 frames, 8 fps
  // Young eager chimp with oversized pencil, ears twitch, eye blink, eager bob
  const W = 32;
  const H = 32;

  // Palette: 14 colors + transparent = 15 keys (<= 16 colors)
  const palette = {
    '.': null,
    'k': '#200e05', // deep dark outline
    'f': '#6e4220', // fur base
    'F': '#ba8248', // fur highlight
    's': '#f6d6a8', // face skin light
    'S': '#e0aa76', // face skin base
    'd': '#b97c4c', // face skin shadow
    'w': '#ffffff', // eye glint / collar / specular
    'i': '#1a0f14', // pupil / graphite tip / ink
    'Y': '#fff08c', // pencil yellow light
    'y': '#ffd23a', // pencil yellow base
    'o': '#c98f0e', // pencil yellow shadow
    'm': '#a4a4b4', // ferrule metal
    'r': '#e86a50', // eraser / tie red
    'b': '#8a5a2b'  // desk wood
  };

  function buildFrames() {
    const frames = [];

    // Animation cycle (8 frames):
    // f0: rest pose, eyes open, ears alert
    // f1: eager dip (-1 px down, anticipate)
    // f2: perk up (+1 px up), ears twitch outward/up
    // f3: high bob (+1 px up), ear twitch hold, pencil sparkle
    // f4: ease down (0), eyes half-blink
    // f5: eyes shut (blink), ears relaxed
    // f6: eyes pop open, eager grin
    // f7: ease back to rest

    const bobs = [0, 1, -1, -1, 0, 0, 0, 0];
    const earTwitch = [0, 0, 1, 1, 0, 0, 0, 0];
    const blinks = [0, 0, 0, 0, 1, 2, 0, 0]; // 0: open, 1: half, 2: closed
    const pencilGlints = [false, false, false, true, false, false, false, false];

    for (let f = 0; f < 8; f++) {
      const g = Array.from({ length: H }, () => Array(W).fill('.'));
      const dy = bobs[f];
      const earUp = earTwitch[f];
      const blink = blinks[f];
      const glint = pencilGlints[f];

      // 1. Desk at bottom (rows 27..30, cols 4..27)
      for (let x = 5; x <= 26; x++) {
        g[27][x] = 'k';
        g[28][x] = (x % 3 === 0) ? 'F' : 'b';
        g[29][x] = 'b';
        g[30][x] = 'k';
      }
      g[28][4] = 'k'; g[29][4] = 'k';
      g[28][27] = 'k'; g[29][27] = 'k';

      // 2. Chimp Torso / clerical vest (rows 20..26 + dy, cols 11..21)
      const ty = 20 + dy;
      for (let y = ty; y <= ty + 6; y++) {
        if (y > 27) continue; // behind desk
        for (let x = 11; x <= 21; x++) {
          g[y][x] = 'f';
        }
        g[y][10] = 'k';
        g[y][22] = 'k';
      }
      // Red bow tie / collar at center (ty, ty+1, cols 15..17)
      g[ty][15] = 'w'; g[ty][16] = 'r'; g[ty][17] = 'w';
      g[ty + 1][16] = 'r';

      // Hands resting on desk / holding pencil
      g[26][12] = 'S'; g[26][13] = 'S'; g[26][14] = 'k';
      g[26][18] = 'S'; g[26][19] = 'S'; g[26][20] = 'k';

      // 3. Head & Ears (base center around x=16, y=12 + dy)
      const hy = 12 + dy;

      // Ears (cols 5..8 and 24..27)
      const ey = hy - earUp;
      // Left ear
      g[ey - 3][7] = 'k'; g[ey - 3][8] = 'k';
      g[ey - 2][6] = 'k'; g[ey - 2][7] = 'f'; g[ey - 2][8] = 'd';
      g[ey - 1][5] = 'k'; g[ey - 1][6] = 'f'; g[ey - 1][7] = 's'; g[ey - 1][8] = 'S';
      g[ey][5] = 'k'; g[ey][6] = 'f'; g[ey][7] = 's'; g[ey][8] = 'S';
      g[ey + 1][6] = 'k'; g[ey + 1][7] = 'd'; g[ey + 1][8] = 'k';

      // Right ear
      g[ey - 3][23] = 'k'; g[ey - 3][24] = 'k';
      g[ey - 2][23] = 'd'; g[ey - 2][24] = 'f'; g[ey - 2][25] = 'k';
      g[ey - 1][23] = 'S'; g[ey - 1][24] = 's'; g[ey - 1][25] = 'f'; g[ey - 1][26] = 'k';
      g[ey][23] = 'S'; g[ey][24] = 's'; g[ey][25] = 'f'; g[ey][26] = 'k';
      g[ey + 1][23] = 'k'; g[ey + 1][24] = 'd'; g[ey + 1][25] = 'k';

      // Head Silhouette (cols 9..22, rows hy-7 .. hy+5)
      // Top fur tuft
      g[hy - 8][15] = 'k'; g[hy - 8][16] = 'F'; g[hy - 8][17] = 'k';
      g[hy - 7][14] = 'k'; g[hy - 7][15] = 'F'; g[hy - 7][16] = 'F'; g[hy - 7][17] = 'f'; g[hy - 7][18] = 'k';

      for (let x = 11; x <= 20; x++) g[hy - 6][x] = (x <= 15) ? 'F' : 'f';
      g[hy - 6][10] = 'k'; g[hy - 6][21] = 'k';

      for (let y = hy - 5; y <= hy + 5; y++) {
        g[y][9] = 'k';
        g[y][22] = 'k';
        for (let x = 10; x <= 21; x++) {
          g[y][x] = (x <= 13 && y <= hy - 2) ? 'F' : 'f';
        }
      }
      g[hy + 6][11] = 'k';
      for (let x = 12; x <= 19; x++) g[hy + 6][x] = 'k';
      g[hy + 6][20] = 'k';

      // Face mask (peach skin, rows hy-3 .. hy+4, cols 11..20)
      for (let y = hy - 3; y <= hy + 4; y++) {
        for (let x = 11; x <= 20; x++) {
          g[y][x] = (y <= hy) ? 's' : 'S';
        }
      }
      // Shading around muzzle edges
      g[hy + 3][11] = 'd'; g[hy + 3][20] = 'd';
      g[hy + 4][11] = 'd'; g[hy + 4][12] = 'd'; g[hy + 4][19] = 'd'; g[hy + 4][20] = 'd';

      // Eyes & Brows
      if (blink === 0) {
        // Wide open curious eyes
        // Left eye
        g[hy - 1][12] = 'k'; g[hy - 1][13] = 'k'; g[hy - 1][14] = 'k';
        g[hy][12] = 'k'; g[hy][13] = 'w'; g[hy][14] = 'i';
        g[hy + 1][12] = 'k'; g[hy + 1][13] = 'i'; g[hy + 1][14] = 'k';
        // Right eye
        g[hy - 1][17] = 'k'; g[hy - 1][18] = 'k'; g[hy - 1][19] = 'k';
        g[hy][17] = 'k'; g[hy][18] = 'w'; g[hy][19] = 'i';
        g[hy + 1][17] = 'k'; g[hy + 1][18] = 'i'; g[hy + 1][19] = 'k';
      } else if (blink === 1) {
        // Half closed
        g[hy - 1][12] = 'k'; g[hy - 1][13] = 'k'; g[hy - 1][14] = 'k';
        g[hy][12] = 'd'; g[hy][13] = 'i'; g[hy][14] = 'i';
        g[hy + 1][12] = 's'; g[hy + 1][13] = 's'; g[hy + 1][14] = 's';

        g[hy - 1][17] = 'k'; g[hy - 1][18] = 'k'; g[hy - 1][19] = 'k';
        g[hy][17] = 'd'; g[hy][18] = 'i'; g[hy][19] = 'i';
        g[hy + 1][17] = 's'; g[hy + 1][18] = 's'; g[hy + 1][19] = 's';
      } else {
        // Closed blink smile arc
        g[hy][12] = 'k'; g[hy][13] = 'd'; g[hy][14] = 'k';
        g[hy + 1][13] = 'k';
        g[hy][17] = 'k'; g[hy][18] = 'd'; g[hy][19] = 'k';
        g[hy + 1][18] = 'k';
      }

      // Nose / nostrils
      g[hy + 2][15] = 'd'; g[hy + 2][16] = 'd';

      // Cheerful smiling mouth
      g[hy + 3][14] = 'k'; g[hy + 3][15] = 'r'; g[hy + 3][16] = 'r'; g[hy + 3][17] = 'k';
      g[hy + 4][15] = 'k'; g[hy + 4][16] = 'k';

      // 4. Oversized Diagonal Pencil propped against shoulder
      // Slanted across from (x=27, y=3+dy) down to (x=6, y=24+dy)
      const py = dy;
      // Eraser (pink/red, rows 3..5)
      g[3 + py][26] = 'k'; g[3 + py][27] = 'k';
      g[4 + py][25] = 'k'; g[4 + py][26] = 'r'; g[4 + py][27] = 'r'; g[4 + py][28] = 'k';
      g[5 + py][24] = 'k'; g[5 + py][25] = 'r'; g[5 + py][26] = 'r'; g[5 + py][27] = 'k';

      // Metal Ferrule (rows 6..7)
      g[6 + py][23] = 'k'; g[6 + py][24] = 'm'; g[6 + py][25] = 'w'; g[6 + py][26] = 'k';
      g[7 + py][22] = 'k'; g[7 + py][23] = 'm'; g[7 + py][24] = 'm'; g[7 + py][25] = 'k';

      // Yellow Pencil Shaft (rows 8..18)
      // 3 facets: Highlight (Y), Base (y), Shadow (o)
      const shaft = [
        [8, 21], [9, 20], [10, 19], [11, 18], [12, 17], [13, 16],
        [14, 15], [15, 14], [16, 13], [17, 12], [18, 11]
      ];
      shaft.forEach(([sy, sx]) => {
        const ry = sy + py;
        // Don't overwrite face, only right side / shoulder
        if (ry < hy - 3 || sx > 19 || ry > hy + 4) {
          g[ry][sx - 1] = 'k';
          g[ry][sx] = 'Y';
          g[ry][sx + 1] = 'y';
          g[ry][sx + 2] = 'o';
          g[ry][sx + 3] = 'k';
        }
      });

      // Wooden cone & graphite lead tip (rows 19..23)
      g[19 + py][10] = 'k'; g[19 + py][11] = 's'; g[19 + py][12] = 'S'; g[19 + py][13] = 'k';
      g[20 + py][9] = 'k'; g[20 + py][10] = 's'; g[20 + py][11] = 'S'; g[20 + py][12] = 'k';
      g[21 + py][8] = 'k'; g[21 + py][9] = 'i'; g[21 + py][10] = 'i'; g[21 + py][11] = 'k';
      g[22 + py][7] = 'k'; g[22 + py][8] = 'i'; g[22 + py][9] = 'k';
      g[23 + py][6] = 'k'; g[23 + py][7] = 'k';

      // Specular glint on pencil during frame 3
      if (glint) {
        g[9 + py][20] = 'w';
        g[10 + py][20] = 'w';
      }

      // Convert grid to row strings
      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'chimp_intern',
    category: 'automation',
    size: [W, H],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Young eager chimp intern with oversized pencil, twitching ears, blinking eyes, eager desk bob',
    palette: palette,
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
