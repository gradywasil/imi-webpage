(function (root) {
  // 12-frame authored sequence for monsoon (32x32, 8 fps, loop)
  // Heavy two-lobed dark cloud with diagonal rain sheets sweeping across.

  const bobs = [0, 0, -1, -1, -1, -1, 0, 0, 1, 1, 1, 0];

  const cloudRows = [
    [3,  18, 'dddddd'],
    [4,   7, 'dddddd...ddwhhhhhdd'],
    [5,   5, 'ddwhhhhhdddwhhhhhhhbbd'],
    [6,   4, 'dwhhhhhhhwhhhhhbbbbbbbbd'],
    [7,   3, 'dwhhhhhhhhwhhhbbbbbbbbbbbd'],
    [8,   3, 'dhbbhhhhhhwhhbbbbbbbbbbbbd'],
    [9,   2, 'dhbbbbhhhhhwhbbbbbbbbbbbbbbd'],
    [10,  2, 'dhbbbbbbbbbwhbbbbbbbbbbbbbbsd'],
    [11,  2, 'dhbbbbbbbbbbbbbbbbbbbbbbbbbssd'],
    [12,  2, 'dssbbbbbbbbbbbbbbbbbbbbbbbsssd'],
    [13,  3, 'dsssssbbbbbbbbbbbbbbbbbssssd'],
    [14,  3, 'ddssssssssssssssssssssssssd'],
    [15,  5, 'ddddssssssddsssssssdddd'],
    [16,  9, 'dddddd..ddddddd']
  ];

  function buildFrames() {
    const frames = [];

    for (let f = 0; f < 12; f++) {
      const g = Array.from({ length: 32 }, () => Array(32).fill('.'));
      const dy = bobs[f];

      // Draw heavy two-lobed dark storm cloud
      cloudRows.forEach(([baseY, leftPad, str]) => {
        const y = baseY + dy;
        for (let c = 0; c < str.length; c++) {
          const ch = str[c];
          if (ch !== '.') {
            g[y][leftPad + c] = ch;
          }
        }
      });

      // Diagonal rain sheets sweeping across (sheet spacing 8 px, dx=2 px/frame)
      const spacing = 8;
      for (let s = -3; s <= 5; s++) {
        const baseX = s * spacing + (f * 2);
        for (let ry = 17; ry <= 29; ry += 2) {
          const rx = Math.round(baseX + (ry - 17) * 0.7);
          if (rx >= 2 && rx <= 29) {
            g[ry][rx] = 'l';
            g[ry + 1][rx] = 'r';
            if (rx + 1 <= 29) {
              g[ry][rx + 1] = 'r';
              g[ry + 1][rx + 1] = 'k';
            }
          }
        }
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'monsoon',
    category: 'weather',
    size: [32, 32],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Heavy two-lobed dark cloud with diagonal rain sheets sweeping across',
    palette: {
      '.': null,
      'w': '#9aa8c8', // cloud highlight
      'h': '#6a7796', // cloud light
      'b': '#454f6e', // cloud base
      's': '#28304a', // cloud shadow
      'd': '#141828', // cloud deep outline
      'l': '#d6f0ff', // rain light
      'r': '#7ec8f0', // rain base
      'k': '#3a8ec8', // rain shadow
      'o': '#184c78'  // rain deep
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
