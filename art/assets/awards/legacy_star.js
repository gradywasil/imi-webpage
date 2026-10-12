(function (root) {
  'use strict';

  function buildFrames() {
    const frames = [];
    const pulseR = [12, 12, 13, 13, 13, 13, 12, 12];

    for (let f = 0; f < 8; f++) {
      const g = Array.from({ length: 32 }, () => Array(32).fill('.'));
      const r = pulseR[f];
      const isPulsed = (r >= 13);

      // Rotating facet sheen across 8 frames (4 sheen states rotated clockwise)
      const activeSector = f;

      function facetCol(sector) {
        const diff = (sector - activeSector + 8) % 8;
        if (diff === 0) return 'w';
        if (diff === 1 || diff === 7) return 'l';
        if (diff === 2 || diff === 6) return 'b';
        return 's';
      }

      // Central octagonal star core (rows 13..18, cols 13..18)
      for (let y = 13; y <= 18; y++) {
        for (let x = 13; x <= 18; x++) {
          const dx = x - 15.5;
          const dy = y - 15.5;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= 3.2) {
            let angle = Math.atan2(dy, dx) + Math.PI / 2;
            if (angle < 0) angle += Math.PI * 2;
            const sector = Math.floor((angle + Math.PI / 8) / (Math.PI / 4)) % 8;
            g[y][x] = facetCol(sector);
          }
        }
      }

      // 1. North Point
      const nTipY = 15 - r;
      g[nTipY][15] = 'k'; g[nTipY][16] = 'k';
      for (let y = nTipY + 1; y < 14; y++) {
        const spread = Math.floor((14 - y) * 0.4);
        g[y][15 - spread - 1] = 'k';
        for (let x = 15 - spread; x <= 15; x++) g[y][x] = facetCol(7);
        for (let x = 16; x <= 16 + spread; x++) g[y][x] = facetCol(0);
        g[y][16 + spread + 1] = 'k';
      }

      // 2. South Point
      const sTipY = 16 + r;
      g[sTipY][15] = 'k'; g[sTipY][16] = 'k';
      for (let y = 18; y < sTipY; y++) {
        const spread = Math.floor((y - 17) * 0.4);
        g[y][15 - spread - 1] = 'k';
        for (let x = 15 - spread; x <= 15; x++) g[y][x] = facetCol(4);
        for (let x = 16; x <= 16 + spread; x++) g[y][x] = facetCol(3);
        g[y][16 + spread + 1] = 'k';
      }

      // 3. West Point
      const wTipX = 15 - r;
      g[15][wTipX] = 'k'; g[16][wTipX] = 'k';
      for (let x = wTipX + 1; x < 14; x++) {
        const spread = Math.floor((14 - x) * 0.4);
        g[15 - spread - 1][x] = 'k';
        for (let y = 15 - spread; y <= 15; y++) g[y][x] = facetCol(6);
        for (let y = 16; y <= 16 + spread; y++) g[y][x] = facetCol(5);
        g[16 + spread + 1][x] = 'k';
      }

      // 4. East Point
      const eTipX = 16 + r;
      g[15][eTipX] = 'k'; g[16][eTipX] = 'k';
      for (let x = 18; x < eTipX; x++) {
        const spread = Math.floor((x - 17) * 0.4);
        g[15 - spread - 1][x] = 'k';
        for (let y = 15 - spread; y <= 15; y++) g[y][x] = facetCol(1);
        for (let y = 16; y <= 16 + spread; y++) g[y][x] = facetCol(2);
        g[16 + spread + 1][x] = 'k';
      }

      // Diagonal points (NW, NE, SW, SE)
      const diagReach = isPulsed ? 8 : 7;
      for (let d = 1; d <= diagReach; d++) {
        const x = 14 - d, y = 14 - d;
        g[y][x] = facetCol(7);
        if (d === diagReach) g[y][x] = 'k';
        else {
          if (g[y - 1][x] === '.') g[y - 1][x] = 'k';
          if (g[y][x - 1] === '.') g[y][x - 1] = 'k';
        }
      }

      for (let d = 1; d <= diagReach; d++) {
        const x = 17 + d - 1, y = 14 - d;
        g[y][x] = facetCol(1);
        if (d === diagReach) g[y][x] = 'k';
        else {
          if (g[y - 1][x] === '.') g[y - 1][x] = 'k';
          if (g[y][x + 1] === '.') g[y][x + 1] = 'k';
        }
      }

      for (let d = 1; d <= diagReach; d++) {
        const x = 14 - d, y = 17 + d - 1;
        g[y][x] = facetCol(5);
        if (d === diagReach) g[y][x] = 'k';
        else {
          if (g[y + 1][x] === '.') g[y + 1][x] = 'k';
          if (g[y][x - 1] === '.') g[y][x - 1] = 'k';
        }
      }

      for (let d = 1; d <= diagReach; d++) {
        const x = 17 + d - 1, y = 17 + d - 1;
        g[y][x] = facetCol(3);
        if (d === diagReach) g[y][x] = 'k';
        else {
          if (g[y + 1][x] === '.') g[y + 1][x] = 'k';
          if (g[y + 1][x + 1] === '.') g[y + 1][x + 1] = 'k';
        }
      }

      // Enforce clean selective colored outline
      for (let y = 1; y < 31; y++) {
        for (let x = 1; x < 31; x++) {
          if (g[y][x] !== '.' && g[y][x] !== 'k') {
            if (g[y - 1][x] === '.') g[y - 1][x] = 'k';
            if (g[y + 1][x] === '.') g[y + 1][x] = 'k';
            if (g[y][x - 1] === '.') g[y][x - 1] = 'k';
            if (g[y][x + 1] === '.') g[y][x + 1] = 'k';
          }
        }
      }

      // Cosmic starlight sparkles at pulse peak (frames 3, 4, 5)
      if (f === 3 || f === 4 || f === 5) {
        g[2][15] = 'p'; g[2][16] = 'p';
        g[29][15] = 'p'; g[29][16] = 'p';
        g[15][2] = 'p'; g[16][2] = 'p';
        g[15][29] = 'p'; g[16][29] = 'p';
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'legacy_star',
    category: 'awards',
    size: [32, 32],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: '8-point cosmic legacy star rotating through facet sheen states and pulsing',
    palette: {
      '.': null,
      'k': '#624406', // deep star gold outline
      's': '#c8981c', // star shadow
      'b': '#f4d242', // star base
      'l': '#fff7b0', // star light
      'w': '#ffffff', // star specular highlight
      'p': '#ffffff'  // cosmic starlight sparkle
    },
    sparkles: [
      [15, 1], [16, 1], [15, 30], [16, 30], [1, 15], [1, 16], [30, 15], [30, 16],
      [15, 2], [16, 2], [15, 29], [16, 29], [2, 15], [2, 16], [29, 15], [29, 16]
    ],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
