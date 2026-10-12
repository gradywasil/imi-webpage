(function (root) {
  // 1-frame handcrafted chunky pixel alphabet sheet: glyph_atlas
  // A-Z + 0-9 chunky 5x7 font with 1-px bottom-right drop shadow.
  // 36 glyphs in Gold variant (rows 0..3) and 36 glyphs in Cream variant (rows 4..7).
  // Dimensions: 64x64, still: true.

  // Palette (10 distinct colors <= 24):
  // Gold variant:
  // 'q' : #fffbe0 (gold highlight)
  // 'l' : #fff08c (gold light)
  // 'y' : #ffd23a (gold base)
  // 'x' : #b38004 (gold shadow)
  // 'k' : #4a2e04 (gold deep drop shadow)
  // Cream variant:
  // 'w' : #ffffff (cream highlight)
  // 'h' : #fff6d6 (cream light)
  // 'b' : #ede0b8 (cream base)
  // 's' : #c9b88a (cream shadow)
  // 'd' : #786842 (cream deep drop shadow)

  const palette = {
    '.': null,
    'q': '#fffbe0',
    'l': '#fff08c',
    'y': '#ffd23a',
    'x': '#b38004',
    'k': '#4a2e04',
    'w': '#ffffff',
    'h': '#fff6d6',
    'b': '#ede0b8',
    's': '#c9b88a',
    'd': '#786842'
  };

  const GLYPHS = {
    'A': ['###', '###', '###', '###', '###', '###', '###'], // placeholder, defined below
  };

  const RAW = {
    'A': ['.###.', '##.##', '##.##', '#####', '##.##', '##.##', '##.##'],
    'B': ['####.', '##.##', '##.##', '####.', '##.##', '##.##', '####.'],
    'C': ['.####', '##...', '##...', '##...', '##...', '##...', '.####'],
    'D': ['####.', '##.##', '##.##', '##.##', '##.##', '##.##', '####.'],
    'E': ['#####', '##...', '##...', '####.', '##...', '##...', '#####'],
    'F': ['#####', '##...', '##...', '####.', '##...', '##...', '##...'],
    'G': ['.####', '##...', '##...', '##.##', '##..#', '##.##', '.####'],
    'H': ['##.##', '##.##', '##.##', '#####', '##.##', '##.##', '##.##'],
    'I': ['#####', '..##.', '..##.', '..##.', '..##.', '..##.', '#####'],
    'J': ['..###', '...##', '...##', '...##', '...##', '##.##', '.###.'],
    'K': ['##.##', '##.##', '####.', '###..', '####.', '##.##', '##.##'],
    'L': ['##...', '##...', '##...', '##...', '##...', '##...', '#####'],
    'M': ['##.##', '#####', '#####', '##.##', '##.##', '##.##', '##.##'],
    'N': ['##.##', '###.#', '###.#', '##.##', '#.###', '#.###', '##.##'],
    'O': ['.###.', '##.##', '##.##', '##.##', '##.##', '##.##', '.###.'],
    'P': ['####.', '##.##', '##.##', '####.', '##...', '##...', '##...'],
    'Q': ['.###.', '##.##', '##.##', '##.##', '##.##', '##.##', '.####'],
    'R': ['####.', '##.##', '##.##', '####.', '####.', '##.##', '##.##'],
    'S': ['.####', '##...', '##...', '.###.', '...##', '...##', '####.'],
    'T': ['#####', '..##.', '..##.', '..##.', '..##.', '..##.', '..##.'],
    'U': ['##.##', '##.##', '##.##', '##.##', '##.##', '##.##', '.###.'],
    'V': ['##.##', '##.##', '##.##', '##.##', '##.##', '.###.', '..#..'],
    'W': ['##.##', '##.##', '##.##', '##.##', '#####', '#####', '##.##'],
    'X': ['##.##', '##.##', '.###.', '..#..', '.###.', '##.##', '##.##'],
    'Y': ['##.##', '##.##', '##.##', '.###.', '..##.', '..##.', '..##.'],
    'Z': ['#####', '...##', '..##.', '.###.', '..##.', '##...', '#####'],
    '0': ['.###.', '##.##', '##.##', '##.##', '##.##', '##.##', '.###.'],
    '1': ['..##.', '.###.', '..##.', '..##.', '..##.', '..##.', '#####'],
    '2': ['.###.', '##.##', '...##', '.###.', '##...', '##...', '#####'],
    '3': ['####.', '...##', '...##', '.###.', '...##', '...##', '####.'],
    '4': ['##.##', '##.##', '##.##', '#####', '...##', '...##', '...##'],
    '5': ['#####', '##...', '####.', '...##', '...##', '##.##', '.###.'],
    '6': ['.###.', '##...', '####.', '##.##', '##.##', '##.##', '.###.'],
    '7': ['#####', '...##', '...##', '..##.', '..##.', '..##.', '..##.'],
    '8': ['.###.', '##.##', '##.##', '.###.', '##.##', '##.##', '.###.'],
    '9': ['.###.', '##.##', '##.##', '.####', '...##', '...##', '.###.']
  };

  const ORDER = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
    'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
    'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0',
    '1', '2', '3', '4', '5', '6', '7', '8', '9'
  ];

  function renderGlyphCell(char, variant) {
    // variant: 'gold' or 'cream'
    const [hi, lt, base, sh, drop] = variant === 'gold'
      ? ['q', 'l', 'y', 'x', 'k']
      : ['w', 'h', 'b', 's', 'd'];

    const pattern = RAW[char];
    // Cell size: 6 wide x 8 high (5x7 body + 1px drop shadow)
    const cell = Array.from({ length: 8 }, () => Array(6).fill('.'));

    // 1. Draw 1-px drop shadow first at (r + 1, c + 1)
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 5; c++) {
        if (pattern[r][c] === '#') {
          cell[r + 1][c + 1] = drop;
        }
      }
    }

    // 2. Draw shaded glyph body on top
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 5; c++) {
        if (pattern[r][c] === '#') {
          // Shading: light from top-left
          let col = base;
          const isTopEdge = (r === 0 || pattern[r - 1][c] !== '#');
          const isLeftEdge = (c === 0 || pattern[r][c - 1] !== '#');
          const isBottomEdge = (r === 6 || pattern[r + 1][c] !== '#');
          const isRightEdge = (c === 4 || pattern[r][c + 1] !== '#');

          if (isTopEdge && isLeftEdge) {
            col = hi;
          } else if (isTopEdge || isLeftEdge) {
            col = lt;
          } else if (isBottomEdge || isRightEdge) {
            col = sh;
          } else {
            col = base;
          }
          cell[r][c] = col;
        }
      }
    }

    return cell;
  }

  function buildSheet() {
    const grid = Array.from({ length: 64 }, () => Array(64).fill('.'));

    // Layout:
    // 9 columns: each glyph 6 px wide, 1 px gap between columns
    // Left margin: 1 px (col 0 is '.')
    // Cols: x = 1, 8, 15, 22, 29, 36, 43, 50, 57
    // Right margin: col 63 is '.'

    // 8 rows: each glyph 8 px high
    // Rows 0..3: Gold variant (y = 0, 8, 16, 24)
    // Rows 4..7: Cream variant (y = 32, 40, 48, 56)

    // Render Gold variant
    for (let i = 0; i < 36; i++) {
      const char = ORDER[i];
      const colIdx = i % 9;
      const rowIdx = Math.floor(i / 9);

      const startX = 1 + colIdx * 7;
      const startY = rowIdx * 8;
      const cell = renderGlyphCell(char, 'gold');

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 6; c++) {
          if (cell[r][c] !== '.') {
            grid[startY + r][startX + c] = cell[r][c];
          }
        }
      }
    }

    // Render Cream variant
    for (let i = 0; i < 36; i++) {
      const char = ORDER[i];
      const colIdx = i % 9;
      const rowIdx = Math.floor(i / 9);

      const startX = 1 + colIdx * 7;
      const startY = 32 + rowIdx * 8;
      const cell = renderGlyphCell(char, 'cream');

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 6; c++) {
          if (cell[r][c] !== '.') {
            grid[startY + r][startX + c] = cell[r][c];
          }
        }
      }
    }

    return [{ rows: grid.map(r => r.join('')) }];
  }

  const asset = {
    id: 'glyph_atlas',
    category: 'garden',
    size: [64, 64],
    fps: 1,
    loop: true,
    still: true,
    staticFrame: 0,
    notes: 'Chunky 5x7 pixel alphabet (A-Z, 0-9) with 1-px drop shadow in Gold and Cream variants',
    palette,
    frames: buildSheet()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
