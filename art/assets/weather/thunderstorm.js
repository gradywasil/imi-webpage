(function (root) {
  // 12-frame authored sequence for thunderstorm (32x32, 8 fps, loop)
  // Deep indigo thundercloud; lightning bolt flashes bright for 2 frames with a 1-frame illumination flash across the cloud body.

  const bobs = [0, 0, -1, -1, 0, 0, 0, 1, 1, 0, 0, 0];

  const darkCloudRows = [
    [3,  16, 'dddddd'],
    [4,   8, 'dddddd.ddwhhhhhdd'],
    [5,   6, 'ddwhhhhhdddwhhhhhhhbbd'],
    [6,   5, 'dwhhhhhhhwhhhhhbbbbbbbbd'],
    [7,   4, 'dwhhhhhhhhwhhhbbbbbbbbbbbd'],
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

  // Flash cloud: cloud body illuminates on frame 4
  const flashCloudRows = darkCloudRows.map(([baseY, leftPad, str]) => {
    const flashStr = str.split('').map(ch => {
      if (ch === 'w' || ch === 'h') return 'F';
      if (ch === 'b') return 'L';
      if (ch === 's') return 'S';
      return ch;
    }).join('');
    return [baseY, leftPad, flashStr];
  });

  function drawBolt(g, dy, frame) {
    if (frame === 4) {
      // Frame 4: bright full lightning bolt
      g[16 + dy][16] = 'z'; g[16 + dy][17] = 'F'; g[16 + dy][18] = 'y';
      g[17 + dy][15] = 'z'; g[17 + dy][16] = 'F'; g[17 + dy][17] = 'y';
      g[18 + dy][14] = 'z'; g[18 + dy][15] = 'F'; g[18 + dy][16] = 'y';
      g[19 + dy][13] = 'z'; g[19 + dy][14] = 'F'; g[19 + dy][15] = 'y';
      // Sharp zig-zag jog right at row 20
      g[20 + dy][13] = 'z'; g[20 + dy][14] = 'F'; g[20 + dy][15] = 'F'; g[20 + dy][16] = 'F'; g[20 + dy][17] = 'y';
      // Down-left segment
      g[21 + dy][15] = 'z'; g[21 + dy][16] = 'F'; g[21 + dy][17] = 'y';
      g[22 + dy][14] = 'z'; g[22 + dy][15] = 'F'; g[22 + dy][16] = 'y';
      g[23 + dy][13] = 'z'; g[23 + dy][14] = 'F'; g[23 + dy][15] = 'y';
      g[24 + dy][12] = 'z'; g[24 + dy][13] = 'F'; g[24 + dy][14] = 'y';
      // Sharp jog right at row 25
      g[25 + dy][12] = 'z'; g[25 + dy][13] = 'F'; g[25 + dy][14] = 'F'; g[25 + dy][15] = 'y';
      // Lower segment to sharp tip
      g[26 + dy][13] = 'z'; g[26 + dy][14] = 'F'; g[26 + dy][15] = 'y';
      g[27 + dy][12] = 'z'; g[27 + dy][13] = 'F'; g[27 + dy][14] = 'y';
      g[28 + dy][12] = 'y'; g[28 + dy][13] = 'F';
      g[29 + dy][12] = 'y';
    } else if (frame === 5) {
      // Frame 5: incandescent afterglow bolt channel
      g[16 + dy][17] = 'y';
      g[17 + dy][16] = 'F'; g[17 + dy][17] = 'y';
      g[18 + dy][15] = 'F'; g[18 + dy][16] = 'y';
      g[19 + dy][14] = 'F'; g[19 + dy][15] = 'y';
      g[20 + dy][14] = 'F'; g[20 + dy][15] = 'F'; g[20 + dy][16] = 'y';
      g[21 + dy][16] = 'F'; g[21 + dy][17] = 'y';
      g[22 + dy][15] = 'F'; g[22 + dy][16] = 'y';
      g[23 + dy][14] = 'F'; g[23 + dy][15] = 'y';
      g[24 + dy][13] = 'F'; g[24 + dy][14] = 'y';
      g[25 + dy][13] = 'F'; g[25 + dy][14] = 'y';
      g[26 + dy][14] = 'F'; g[26 + dy][15] = 'y';
      g[27 + dy][13] = 'F'; g[27 + dy][14] = 'y';
      g[28 + dy][13] = 'y';
    }
  }

  // Sparkles list for bolt coords
  const boltSparkles = [];
  for (let y = 15; y <= 31; y++) {
    for (let x = 10; x <= 20; x++) {
      boltSparkles.push([x, y]);
    }
  }

  function buildFrames() {
    const frames = [];

    for (let f = 0; f < 12; f++) {
      const g = Array.from({ length: 32 }, () => Array(32).fill('.'));
      const dy = bobs[f];

      // 1-frame illumination flash across cloud body on frame 4
      const rows = (f === 4) ? flashCloudRows : darkCloudRows;

      rows.forEach(([baseY, leftPad, str]) => {
        const y = baseY + dy;
        for (let c = 0; c < str.length; c++) {
          const ch = str[c];
          if (ch !== '.') {
            g[y][leftPad + c] = ch;
          }
        }
      });

      // Lightning bolt flashes bright for 2 frames (frame 4 and frame 5)
      if (f === 4 || f === 5) {
        drawBolt(g, dy, f);
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'thunderstorm',
    category: 'weather',
    size: [32, 32],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Deep indigo thundercloud with bright 2-frame lightning bolt and 1-frame illumination flash across the cloud body',
    palette: {
      '.': null,
      'w': '#9aa8c8', // cloud highlight
      'h': '#6a7796', // cloud light
      'b': '#454f6e', // cloud base
      's': '#28304a', // cloud shadow
      'd': '#141828', // cloud deep outline
      'F': '#ffffff', // flash pure white / bolt core
      'L': '#d2e2f0', // flash light
      'S': '#a4bcd4', // flash shadow
      'y': '#fff7b0', // bolt bright yellow
      'z': '#f4d242', // bolt yellow base
      'g': '#c8981c'  // bolt gold edge
    },
    sparkles: boltSparkles,
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
