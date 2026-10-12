(function (root) {
  // 12-frame authored sequence for drizzle (32x32, 8 fps, loop)
  // Gentle pale cloud with 3 staggered falling raindrops looping seamlessly.

  const bobs = [0, -1, -1, -2, -2, -1, -1, 0, 0, 1, 1, 0];

  const cloudRows = [
    [5,  11, 'dddddd'],
    [6,   8, 'dddwhhhhhddd'],
    [7,   6, 'ddwhhhhhhhhhhhdddd'],
    [8,   5, 'dwhhhhhhhhhhhhhwhhhdd'],
    [9,   4, 'dwhhhhhhhhhhhhhhwhhhhhdd'],
    [10,  3, 'dwhhhhhhhhhhhhhhhbbhhhhhhd'],
    [11,  3, 'dwhhhhhhhhhhhhhhhbbbbhhhhhd'],
    [12,  3, 'dhbbhhhhhhhhhhhhhbbbbbbhhhd'],
    [13,  3, 'dshbbbbhhhhhhhhhbbbbbbbbshd'],
    [14,  3, 'dsbbbbbbbbbbbbbbbbbbbbbbssd'],
    [15,  4, 'dssbbbbbbbbbbbbbbbbbbssssd'],
    [16,  5, 'ddssssddssssssddsssssdd'],
    [17,  7, 'dddd..dddddd..ddddd']
  ];

  function buildFrames() {
    const frames = [];

    for (let f = 0; f < 12; f++) {
      const g = Array.from({ length: 32 }, () => Array(32).fill('.'));
      const dy = bobs[f];

      // Draw cloud body with gentle buoyant floating bob
      cloudRows.forEach(([baseY, leftPad, str]) => {
        const y = baseY + dy;
        for (let c = 0; c < str.length; c++) {
          const ch = str[c];
          if (ch !== '.') {
            g[y][leftPad + c] = ch;
          }
        }
      });

      // 3 staggered raindrops falling beneath the cloud lobes
      // Drop 1: under left lobe (x=9)
      // Drop 2: under center lobe (x=16)
      // Drop 3: under right lobe (x=23)
      const drops = [
        { x: 9, phase: 0 },
        { x: 16, phase: 4 },
        { x: 23, phase: 8 }
      ];

      drops.forEach(d => {
        const step = (f + d.phase) % 12;
        const dropY = 18 + step;
        if (dropY <= 29) {
          g[dropY][d.x] = 'l';
          if (dropY + 1 <= 30) {
            g[dropY + 1][d.x] = 'k';
          }
        }
      });

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'drizzle',
    category: 'weather',
    size: [32, 32],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Gentle pale cloud with 3 staggered falling raindrops looping seamlessly',
    palette: {
      '.': null,
      'w': '#ffffff', // cloud highlight
      'h': '#eef4fb', // cloud light
      'b': '#d2e2f0', // cloud base
      's': '#a4bcd4', // cloud shadow
      'd': '#5a7490', // cloud deep outline
      'l': '#d6f0ff', // drop light
      'k': '#3a8ec8'  // drop shadow
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
