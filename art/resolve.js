/* ============================================================================
   MONKEYOS V2 - ART PASS 2 ASSET RESOLVER
   Turns any asset (forms a, b, c) into flat Uint8Array RGBA frames.
   Single source of truth for linting, PNG export, sheets, and gallery.
   ============================================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ArtV2 = root.ArtV2 || {};
    root.ArtV2.Resolver = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function hexToRgba(hex) {
    if (!hex) return [0, 0, 0, 0];
    const clean = hex.replace('#', '').trim();
    if (clean.length === 3) {
      const r = parseInt(clean[0] + clean[0], 16);
      const g = parseInt(clean[1] + clean[1], 16);
      const b = parseInt(clean[2] + clean[2], 16);
      return [r, g, b, 255];
    }
    if (clean.length === 6) {
      const r = parseInt(clean.slice(0, 2), 16);
      const g = parseInt(clean.slice(2, 4), 16);
      const b = parseInt(clean.slice(4, 6), 16);
      return [r, g, b, 255];
    }
    if (clean.length === 8) {
      const r = parseInt(clean.slice(0, 2), 16);
      const g = parseInt(clean.slice(2, 4), 16);
      const b = parseInt(clean.slice(4, 6), 16);
      const a = parseInt(clean.slice(6, 8), 16);
      return [r, g, b, a];
    }
    return [0, 0, 0, 0];
  }

  function resolveAsset(asset) {
    if (!asset || !asset.size || !asset.frames) {
      throw new Error(`Invalid asset structure: ${asset ? asset.id : 'null'}`);
    }

    const [w, h] = asset.size;
    const palette = asset.palette || {};
    const parsedPalette = {};
    for (const k in palette) {
      const col = palette[k];
      parsedPalette[k] = col ? hexToRgba(col) : [0, 0, 0, 0];
    }
    // '.' is always transparent if not explicitly defined
    if (!parsedPalette['.']) parsedPalette['.'] = [0, 0, 0, 0];

    const resolvedFrames = [];
    const charGrids = []; // array of 2D character grids (h rows of w characters)

    for (let fIdx = 0; fIdx < asset.frames.length; fIdx++) {
      const fDef = asset.frames[fIdx];
      // Construct character grid for this frame
      let grid = [];

      // Form (a): Array of strings directly or { rows: [...] }
      if (Array.isArray(fDef)) {
        grid = fDef.map(row => row.split(''));
      } else if (fDef.rows) {
        grid = fDef.rows.map(row => row.split(''));
      }
      // Form (b): Master + patch
      else if (fDef.base !== undefined || fDef.patch !== undefined || fDef.px !== undefined) {
        const baseIdx = fDef.base !== undefined ? fDef.base : (fIdx - 1);
        if (!charGrids[baseIdx]) {
          throw new Error(`Asset ${asset.id} frame ${fIdx} references invalid base frame ${baseIdx}`);
        }
        // Deep clone base grid
        grid = charGrids[baseIdx].map(row => row.slice());

        // Apply row patch
        if (fDef.patch) {
          for (const rowKey in fDef.patch) {
            const r = parseInt(rowKey, 10);
            if (r >= 0 && r < h) {
              const rowStr = fDef.patch[rowKey];
              for (let c = 0; c < Math.min(w, rowStr.length); c++) {
                grid[r][c] = rowStr[c];
              }
            }
          }
        }

        // Apply pixel patch: [x, y, key]
        if (fDef.px && Array.isArray(fDef.px)) {
          for (let p = 0; p < fDef.px.length; p++) {
            const [pxX, pxY, key] = fDef.px[p];
            if (pxY >= 0 && pxY < h && pxX >= 0 && pxX < w) {
              grid[pxY][pxX] = key;
            }
          }
        }
      }
      // Form (c): Parts + pose table
      else if (fDef.poses && asset.parts) {
        // Start with blank transparent grid
        grid = Array.from({ length: h }, () => Array(w).fill('.'));

        for (let pIdx = 0; pIdx < fDef.poses.length; pIdx++) {
          const pose = fDef.poses[pIdx];
          const partId = Array.isArray(pose) ? pose[0] : pose.part;
          const dx = (Array.isArray(pose) ? pose[1] : pose.x) || 0;
          const dy = (Array.isArray(pose) ? pose[2] : pose.y) || 0;
          const flipX = (Array.isArray(pose) ? pose[3] : pose.flipX) || false;

          let partRows = asset.parts[partId];
          if (!partRows && asset.parts[partId + '_0']) {
            partRows = asset.parts[partId + '_0'];
          }
          if (partRows) {
            const partH = partRows.length;
            const partW = partRows[0].length;
            for (let pr = 0; pr < partH; pr++) {
              const tr = dy + pr;
              if (tr < 0 || tr >= h) continue;
              const rowStr = partRows[pr];
              for (let pc = 0; pc < partW; pc++) {
                const srcCol = flipX ? (partW - 1 - pc) : pc;
                const tc = dx + pc;
                if (tc < 0 || tc >= w) continue;
                const ch = rowStr[srcCol];
                if (ch && ch !== '.') {
                  grid[tr][tc] = ch;
                }
              }
            }
          }
        }
      } else {
        throw new Error(`Asset ${asset.id} frame ${fIdx} unknown frame format`);
      }

      // Ensure grid is exactly w x h
      while (grid.length < h) grid.push(Array(w).fill('.'));
      for (let r = 0; r < h; r++) {
        if (!grid[r]) grid[r] = Array(w).fill('.');
        while (grid[r].length < w) grid[r].push('.');
      }

      charGrids.push(grid);

      // Convert grid to flat RGBA Uint8Array
      const rgba = new Uint8Array(w * h * 4);
      let ptr = 0;
      for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
          const ch = grid[r][c] || '.';
          const color = parsedPalette[ch] || [0, 0, 0, 0];
          rgba[ptr++] = color[0];
          rgba[ptr++] = color[1];
          rgba[ptr++] = color[2];
          rgba[ptr++] = color[3];
        }
      }

      const rowsAsStrings = grid.map(r => r.join(''));
      resolvedFrames.push({
        index: fIdx,
        width: w,
        height: h,
        rgba,
        grid,
        rows: rowsAsStrings
      });
    }

    return {
      id: asset.id,
      category: asset.category,
      size: [w, h],
      fps: asset.fps || 8,
      loop: asset.loop !== false,
      staticFrame: asset.staticFrame !== undefined ? asset.staticFrame : 0,
      sparkles: asset.sparkles || [],
      notes: asset.notes || '',
      palette: asset.palette,
      frames: resolvedFrames
    };
  }

  return {
    hexToRgba,
    resolveAsset
  };
});
