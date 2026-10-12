(function (root) {
  // 10-frame authored sequence for rotten_banana (32x32)
  // Bruised overripe peel, sickly green mold specks,
  // 2 fruit flies orbiting, 2 rising wavy stink lines.

  // Pre-drawn 10-frame positions for 2 flies:
  // Each fly has [x, y, wingDx, wingDy]
  const fly1Path = [
    [13, 9,  -1, -1],
    [15, 7,   1, -1],
    [18, 8,   1,  0],
    [21, 11,  1,  1],
    [19, 13, -1,  1],
    [15, 14, -1,  0],
    [12, 12, -1, -1],
    [13, 8,   0, -1],
    [17, 7,   1, -1],
    [20, 9,   1,  0]
  ];

  const fly2Path = [
    [7,  19, -1,  1],
    [5,  16, -1, -1],
    [7,  14,  1, -1],
    [10, 15,  1,  0],
    [11, 18,  1,  1],
    [9,  21, -1,  1],
    [5,  20, -1,  0],
    [4,  17, -1, -1],
    [6,  14,  0, -1],
    [9,  16,  1,  0]
  ];

  function buildFrames() {
    // Base banana shape with bruise spots and mold colonies
    // Rows: [y, leftPad, str]
    const baseBanana = [
      [5, 23, 'kk'],
      [6, 22, 'dkk'],
      [7, 19, 'kkkddk'],
      [8, 16, 'kkkyybbddk'],
      [9, 14, 'kkyyybbggddk'],
      [10, 12, 'kkyyybggllmgddk'],
      [11, 11, 'kyyyybggllmgdddk'],
      [12, 10, 'kyyhhybbgmgddddk'],
      [13, 9, 'kyyhhyybbddbddkk'],
      [14, 8, 'kyyhhhyybbddddkk'],
      [15, 7, 'kyyhhhyybbddddkk'],
      [16, 6, 'kbyhhhyybbgmgddk'],
      [17, 5, 'kbbyhhybbgllmgdk'],
      [18, 4, 'kbbbyybbggllmgdk'],
      [19, 3, 'kdbbbyybbggmdddk'],
      [20, 3, 'kddbbbyybbdddkk'],
      [21, 2, 'kkddbbbbbbddkk'],
      [22, 2, 'kddddbbbddkkk'],
      [23, 2, 'kdddbbddkkk'],
      [24, 2, 'kkkkkk']
    ];

    // Pre-drawn rising wavy stink lines across 10 frames
    // 2 wavy streamers that cycle vertically seamlessly every 10 frames
    // Streamer 1 emerges from ~y=13, x=10 up to y=2
    // Streamer 2 emerges from ~y=11, x=18 up to y=2
    const stinkLine1 = (f) => {
      // Wave shape shifted upward by f pixels (mod 10)
      const pts = [];
      for (let i = 0; i < 9; i++) {
        const y = 12 - i;
        if (y < 2) continue;
        // Wavy S-curve: x varies with (y + f)
        const phase = (y + f * 1.0) * 0.7;
        const x = Math.round(9 + Math.sin(phase) * 1.5);
        pts.push([x, y, i > 6 ? 'w' : 's']);
      }
      return pts;
    };

    const stinkLine2 = (f) => {
      const pts = [];
      for (let i = 0; i < 9; i++) {
        const y = 10 - i;
        if (y < 2) continue;
        const phase = (y + f * 1.0 + 3) * 0.7;
        const x = Math.round(18 + Math.cos(phase) * 1.5);
        pts.push([x, y, i > 6 ? 'w' : 's']);
      }
      return pts;
    };

    const frames = [];

    for (let f = 0; f < 10; f++) {
      const grid = Array.from({ length: 32 }, () => Array(32).fill('.'));

      // Draw base rotten banana
      baseBanana.forEach(([y, leftPad, str]) => {
        for (let c = 0; c < str.length; c++) {
          grid[y][leftPad + c] = str[c];
        }
      });

      // Subtle rot festering: mold pixels gently shifting brightness
      if (f % 2 === 1) {
        grid[10][19] = 'm';
        grid[17][13] = 'm';
        grid[18][12] = 'l';
      } else {
        grid[10][19] = 'l';
        grid[17][13] = 'l';
        grid[18][12] = 'm';
      }

      // Draw stink lines
      const st1 = stinkLine1(f);
      st1.forEach(([x, y, col]) => {
        if (x >= 0 && x < 32 && y >= 0 && y < 32) {
          if (grid[y][x] === '.') grid[y][x] = col;
          // Connect horizontally if needed to avoid orphans
          if (grid[y][x + 1] === '.' && x + 1 < 31) grid[y][x + 1] = col;
        }
      });

      const st2 = stinkLine2(f);
      st2.forEach(([x, y, col]) => {
        if (x >= 0 && x < 32 && y >= 0 && y < 32) {
          if (grid[y][x] === '.') grid[y][x] = col;
          if (grid[y][x + 1] === '.' && x + 1 < 31) grid[y][x + 1] = col;
        }
      });

      // Draw Fly 1
      const f1 = fly1Path[f];
      grid[f1[1]][f1[0]] = 'f';
      grid[f1[1] + f1[3]][f1[0] + f1[2]] = 'i';

      // Draw Fly 2
      const f2 = fly2Path[f];
      grid[f2[1]][f2[0]] = 'f';
      grid[f2[1] + f2[3]][f2[0] + f2[2]] = 'i';

      frames.push({ rows: grid.map(r => r.join('')) });
    }

    return frames;
  }

  // Collect all fly coordinates and stink vapor positions for sparkle/orphan immunity
  const sparkles = [];
  fly1Path.forEach(([x, y, dx, dy]) => {
    sparkles.push([x, y], [x + dx, y + dy]);
  });
  fly2Path.forEach(([x, y, dx, dy]) => {
    sparkles.push([x, y], [x + dx, y + dy]);
  });
  // Also add stink line possible positions
  for (let x = 6; x <= 22; x++) {
    for (let y = 1; y <= 13; y++) {
      sparkles.push([x, y]);
    }
  }

  const asset = {
    id: 'rotten_banana',
    category: 'shop',
    size: [32, 32],
    fps: 10,
    loop: true,
    staticFrame: 0,
    notes: 'Overripe bruised banana with green penicillin mold colonies, 2 orbiting flies, and rising sulfur stink lines',
    palette: {
      '.': null,
      'k': '#200e05', // deep rot outline (woodD deep)
      'd': '#3a1e0b', // dark brown rot shadow (woodD shadow)
      'b': '#5a3517', // brown bruise base (woodD base)
      'y': '#c98f0e', // dull yellow body (banY shadow)
      'h': '#ffd23a', // dull yellow highlight (banY base)
      'g': '#2a500e', // deep mold green (banG deep)
      'm': '#5c9a22', // sickly mold shadow (banG shadow)
      'l': '#9ccf3f', // spore green base (banG base)
      's': '#cdee74', // stink vapor light green (banG light)
      'w': '#f4ffe0', // stink vapor glint (banG highlight)
      'f': '#1a0f14', // fruit fly body (ink base)
      'i': '#d6f0ff'  // fruit fly wing (drop light)
    },
    sparkles: sparkles,
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
