(function (root) {
  // 10-frame authored sequence for publishing_contracts (32x32)
  // Vellum legal scroll with calligraphic text lines.
  // White feather quill signs a flourish squiggle 1 px at a time (frames 0-6),
  // then lifts and eases back to start (frames 7-9).
  // Feather plume extends outside the scroll silhouette at top-right [22..28, 2..6].
  // Scarlet wax seal presses on the last 3 frames (7-9), embossing a gleaming gold crest.

  // Sparkles array to exempt ink nib, feather tip, or spark pixels from orphan check
  const sparkles = [
    [10, 20], [11, 20], [12, 19], [13, 20], [14, 19], [15, 20], [16, 19],
    [27, 2], [28, 2], [26, 3], [27, 3], [28, 3], [25, 4], [26, 4]
  ];

  // Base Vellum Scroll Rows: [y, leftPad, str]
  // Bounded between y=5 and y=25, x=4 and x=25 so feather and ribbons extend outside
  const scrollBase = [
    // Top rolled wooden spindle
    [5, 4,  'nuuwwwwwwwwwwwwwwwwuun'],
    [6, 5,  'nuvvvvvvvvvvvvvvvvuun'],
    // Main parchment sheet
    [7, 6,  'nppppppppppppppppppn'],
    [8, 6,  'npvvvvvvvvvvvvvvvvpn'],
    // Calligraphic legal text lines
    [9, 6,  'np' + 'iiiiiiiiiiiiii' + 'vvn'],
    [10, 6, 'npvvvvvvvvvvvvvvvvpn'],
    [11, 6, 'npvvvvvvvvvvvvvvvvpn'],
    [12, 6, 'np' + 'iiiiiiiiiiii' + 'vvvpn'],
    [13, 6, 'npvvvvvvvvvvvvvvvvpn'],
    [14, 6, 'npvvvvvvvvvvvvvvvvpn'],
    [15, 6, 'np' + 'iiiiiiiiiiiii' + 'vvn'],
    [16, 6, 'npvvvvvvvvvvvvvvvvpn'],
    [17, 6, 'npvvvvvvvvvvvvvvvvpn'],
    [18, 6, 'np' + 'iiiiiiiii' + 'vvvvvvpn'],
    [19, 6, 'npvvvvvvvvvvvvvvvvpn'],
    // Signature underline
    [20, 6, 'npvvvvvvvvvvvvvvvvpn'],
    [21, 6, 'np' + 'uuuuuuuu' + 'vvvvvvvpn'],
    [22, 6, 'npvvvvvvvvvvvvvvvvpn'],
    [23, 6, 'npvvvvvvvvvvvvvvvvpn'],
    // Bottom rolled wooden spindle
    [24, 5, 'nuvvvvvvvvvvvvvvvvuun'],
    [25, 4, 'nuuwwwwwwwwwwwwwwwwuun']
  ];

  // Progressive signature squiggle points (1 px at a time during writing frames 0..6):
  const squigglePts = [
    [10, 20], // f=0
    [11, 20], // f=1
    [12, 19], // f=2
    [13, 20], // f=3
    [14, 19], // f=4
    [15, 20], // f=5
    [16, 19]  // f=6
  ];

  // Quill nib positions per frame:
  // f=0..6: writing squiggle
  // f=7..9: lift up, loop gracefully back to starting position (10, 20)
  const quillTips = [
    [10, 20], // 0: start writing
    [11, 20], // 1
    [12, 19], // 2
    [13, 20], // 3
    [14, 19], // 4
    [15, 20], // 5
    [16, 19], // 6: finish squiggle
    [15, 17], // 7: lift off
    [12, 17], // 8: ease back left
    [10, 19]  // 9: hover right above start point (1-px step to frame 0)
  ];

  // Draw angled feather quill from nib (tx, ty) extending up-right into rows 2..8, cols 22..28
  function drawQuill(grid, tx, ty) {
    // Ink on nib
    if (tx >= 0 && tx < 32 && ty >= 0 && ty < 32) {
      grid[ty][tx] = 'i';
    }

    // Slender quill shaft extending diagonally up-right
    for (let step = 1; step <= 13; step++) {
      const sx = tx + Math.round(step * 1.1);
      const sy = ty - step;
      if (sx >= 0 && sx < 32 && sy >= 0 && sy < 32) {
        grid[sy][sx] = 'w';

        // Wide feather vanes along upper-left side of shaft (plume)
        if (step >= 6 && step <= 13) {
          if (sx - 1 >= 0) grid[sy][sx - 1] = 'w';
          if (step >= 8 && step <= 12 && sx - 2 >= 0) {
            grid[sy][sx - 2] = 'p';
          }
        }
        // Vanes along lower-right side of shaft
        if (step >= 9 && step <= 12 && sx + 1 < 32) {
          grid[sy][sx + 1] = 'p';
        }
      }
    }
  }

  // Draw scarlet wax seal and fluttering ribbon tails
  // Last 3 frames (7, 8, 9): seal presses down, squashing into parchment and embossing gold crest
  function drawSeal(grid, f) {
    const cx = 21, cy = 20;

    // Fluttering ribbon tails extending down below scroll (into rows 26..29)
    const ribCycle = [0, 1, 1, 0, -1, -1, 0, 1, 0, 0];
    const wave = ribCycle[f];

    // Left ribbon (continuous 2px width)
    grid[23][cx - 1] = 's'; grid[23][cx] = 's';
    grid[24][cx - 1] = 's'; grid[24][cx] = 'd';
    grid[25][cx - 2 + wave] = 's'; grid[25][cx - 1 + wave] = 'd';
    grid[26][cx - 2 + wave] = 's'; grid[26][cx - 1 + wave] = 'd';
    grid[27][cx - 2 + wave] = 'd'; grid[27][cx - 1 + wave] = 'd';

    // Right ribbon
    grid[23][cx + 2] = 's'; grid[23][cx + 3] = 'd';
    grid[24][cx + 2] = 's'; grid[24][cx + 3] = 'd';
    grid[25][cx + 2 - wave] = 's'; grid[25][cx + 3 - wave] = 'd';
    grid[26][cx + 2 - wave] = 's'; grid[26][cx + 3 - wave] = 'd';
    grid[27][cx + 2 - wave] = 'd'; grid[27][cx + 3 - wave] = 'd';

    if (f < 7) {
      // Normal resting scarlet wax seal (5x5 circular seal)
      const rows = [
        'kkkkk',
        'krrsk',
        'krsgk', // soft gold glint
        'ksddk',
        'kkkkk'
      ];
      rows.forEach((r, dy) => {
        for (let dx = 0; dx < r.length; dx++) {
          grid[cy - 2 + dy][cx - 2 + dx] = r[dx];
        }
      });
    } else if (f === 7) {
      // FRAME 7: Press begins! Pressure squeezes wax 1 px flatter
      const rows = [
        'kkkkkk',
        'krrssk',
        'krsbbk',
        'ksdddk',
        'kkkkkk'
      ];
      rows.forEach((r, dy) => {
        for (let dx = 0; dx < r.length; dx++) {
          grid[cy - 2 + dy][cx - 2 + dx] = r[dx];
        }
      });
    } else if (f === 8) {
      // FRAME 8: MAXIMUM PRESS! Wax squashes wide, golden crest pops with bright specular glint
      const rows = [
        'kkkkkkk',
        'keerrsk',
        'krsggbk', // bright white/gold crest glint!
        'krsbbdk',
        'kdddddk'
      ];
      rows.forEach((r, dy) => {
        for (let dx = 0; dx < r.length; dx++) {
          grid[cy - 2 + dy][cx - 3 + dx] = r[dx];
        }
      });
    } else if (f === 9) {
      // FRAME 9: Seal settles into finished round 5x5 seal with crisp golden monogram
      const rows = [
        'kkkkk',
        'krrsk',
        'krsgk', // golden monogram shines
        'ksddk',
        'kkkkk'
      ];
      rows.forEach((r, dy) => {
        for (let dx = 0; dx < r.length; dx++) {
          grid[cy - 2 + dy][cx - 2 + dx] = r[dx];
        }
      });
    }
  }

  function buildFrames() {
    const frames = [];

    for (let f = 0; f < 10; f++) {
      const grid = Array.from({ length: 32 }, () => Array(32).fill('.'));

      // 1. Base parchment scroll
      scrollBase.forEach(([y, leftPad, rowStr]) => {
        for (let c = 0; c < rowStr.length; c++) {
          grid[y][leftPad + c] = rowStr[c];
        }
      });

      // 2. Progressive signature squiggle
      // Frames 0..6: squiggle grows 1 px at a time
      // Frames 7..9: fully signed squiggle stays on contract
      const visibleSquiggle = Math.min(f + 1, 7);
      for (let i = 0; i < visibleSquiggle; i++) {
        const [sx, sy] = squigglePts[i];
        grid[sy][sx] = 'i';
      }

      // 3. Scarlet wax seal & pressing action
      drawSeal(grid, f);

      // 4. Feather quill with plume extending outside scroll
      const [qx, qy] = quillTips[f];
      drawQuill(grid, qx, qy);

      frames.push({ rows: grid.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'publishing_contracts',
    category: 'shop',
    size: [32, 32],
    fps: 10,
    loop: true,
    staticFrame: 0,
    notes: 'Vellum legal scroll with progressive 1-px quill signature, fluttering ribbon tails, and scarlet wax seal pressed on frames 7-9 with golden crest',
    palette: {
      '.': null,
      'w': '#ffffff', // paper / feather highlight (paper highlight)
      'p': '#fff6d6', // vellum light body (paper light)
      'v': '#ede0b8', // vellum base (paper base)
      'u': '#c9b88a', // vellum shadow / spindle (paper shadow)
      'n': '#786842', // scroll edge outline (paper deep)
      'i': '#1a0f14', // calligraphic ink (ink base)
      'e': '#ffaba0', // scarlet seal highlight (red highlight)
      'r': '#e86a50', // scarlet seal light (red light)
      's': '#b8322a', // scarlet seal base (red base)
      'd': '#781c16', // scarlet seal shadow (red shadow)
      'k': '#420a06', // seal deep outline (red deep)
      'g': '#fffbe0', // brass glint / gold monogram (gold highlight)
      'b': '#ffd23a', // brass stamper base (gold base)
      'o': '#b38004'  // brass stamper shadow (gold shadow)
    },
    sparkles: sparkles,
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
