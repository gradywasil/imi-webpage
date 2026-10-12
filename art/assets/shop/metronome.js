(function (root) {
  // 10-frame authored sequence for metronome (32x32)
  // Rosewood pyramidal metronome with calibrated brass scale plate,
  // ease-in/out pendulum swing, sliding tempo counterweight, and apex tick sparks.

  // Pre-drawn wand lines for each frame from pivot (15, 23) to tip
  // Demonstrating ease-in/out spacing across the 10 frames
  const wandLines = [
    // f=0: moving right, passing center-right (tip: 18, 9)
    [[15, 22], [16, 20], [16, 18], [17, 16], [17, 14], [18, 12], [18, 10], [18, 9]],
    // f=1: slowing down, near right apex (tip: 20, 9)
    [[15, 22], [16, 20], [17, 18], [18, 16], [18, 14], [19, 12], [19, 10], [20, 9]],
    // f=2: RIGHT APEX turnaround (tip: 21, 10) - ease-out hold
    [[15, 22], [16, 21], [17, 19], [18, 17], [19, 15], [19, 13], [20, 11], [21, 10]],
    // f=3: accelerating left from apex (tip: 20, 9)
    [[15, 22], [16, 20], [17, 18], [18, 16], [18, 14], [19, 12], [19, 10], [20, 9]],
    // f=4: swinging fast toward center (tip: 18, 9)
    [[15, 22], [16, 20], [16, 18], [17, 16], [17, 14], [18, 12], [18, 10], [18, 9]],
    // f=5: passing center-left (tip: 13, 9)
    [[16, 22], [15, 20], [15, 18], [14, 16], [14, 14], [13, 12], [13, 10], [13, 9]],
    // f=6: slowing down, near left apex (tip: 11, 9)
    [[16, 22], [15, 20], [14, 18], [13, 16], [13, 14], [12, 12], [12, 10], [11, 9]],
    // f=7: LEFT APEX turnaround (tip: 10, 10) - ease-out hold
    [[16, 22], [15, 21], [14, 19], [13, 17], [12, 15], [12, 13], [11, 11], [10, 10]],
    // f=8: accelerating right from apex (tip: 11, 9)
    [[16, 22], [15, 20], [14, 18], [13, 16], [13, 14], [12, 12], [12, 10], [11, 9]],
    // f=9: swinging fast toward center (tip: 13, 9)
    [[16, 22], [15, 20], [15, 18], [14, 16], [14, 14], [13, 12], [13, 10], [13, 9]]
  ];

  // Sliding counterweight center [x, y] along wand per frame
  // Demonstrates adjustability: slides up from y=16 (Andante) to y=13 (Allegro) and back
  const weightCenters = [
    [17, 15], // 0
    [18, 14], // 1
    [19, 13], // 2: highest position at apex
    [18, 14], // 3
    [17, 15], // 4
    [14, 16], // 5
    [13, 15], // 6
    [12, 14], // 7: apex
    [13, 15], // 8
    [14, 16]  // 9
  ];

  // Apex sparks at turnaround:
  // f=2: TIC at right apex [21, 10]
  // f=7: TOC at left apex [10, 10]
  const sparks = {
    2: [[21, 8], [20, 9], [21, 9], [22, 9], [21, 10]],
    7: [[10, 8], [9, 9], [10, 9], [11, 9], [10, 10]]
  };

  const sparkles = [
    [21, 8], [20, 9], [21, 9], [22, 9], [21, 10],
    [10, 8], [9, 9], [10, 9], [11, 9], [10, 10]
  ];

  // Rosewood Pyramid Body Rows: [y, leftPad, str]
  const pyramidBody = [
    [4, 15, 'yy'],                      // top brass finial
    [5, 14, 'kllk'],                     // top cap
    [6, 14, 'khbk'],
    [7, 13, 'kkhbbk'],
    // Recessed front aperture starts at y=8
    [8, 13, 'k' + 'cc' + 'k'],
    [9, 12, 'kh' + 'cwyyoc' + 'sk'],
    [10, 12, 'kh' + 'cwyyoc' + 'sk'],
    [11, 11, 'khh' + 'cwoyoc' + 'ssk'],
    [12, 11, 'khh' + 'cwyyoc' + 'ssk'],
    [13, 10, 'khhh' + 'cwoyoc' + 'sssk'],
    [14, 10, 'khhh' + 'cwyyoc' + 'sssk'],
    [15, 9, 'khhhh' + 'cwoyoc' + 'ssssk'],
    [16, 9, 'khhhh' + 'cwyyoc' + 'ssssk'],
    [17, 8, 'khhhhh' + 'cwoyoc' + 'sssssk'],
    [18, 8, 'khhhhh' + 'cwyyoc' + 'sssssk'],
    [19, 7, 'khhhhhh' + 'cwoyoc' + 'ssssssk'],
    [20, 7, 'khhhhhh' + 'cwyyoc' + 'ssssssk'],
    [21, 6, 'khhhhhhh' + 'cwoyoc' + 'sssssssk'],
    [22, 6, 'khhhhhhh' + 'cccccc' + 'sssssssk'],
    [23, 5, 'khhhhhhhh' + 'cddddc' + 'ssssssssk'], // pivot area
    // Bottom wood apron below aperture
    [24, 5, 'khhhhhhhllbbssssssssk'],
    [25, 4, 'khhhhhhhllbbssssssssssk'],
    // Beveled plinth base
    [26, 3, 'kkkkkkkkkkkkkkkkkkkkkkkkkk'],
    [27, 3, 'khhllbbbbbbsssssssssssdsk'],
    [28, 4, 'kkkk                kkkk']   // feet
  ];

  function buildFrames() {
    const frames = [];

    for (let f = 0; f < 10; f++) {
      const grid = Array.from({ length: 32 }, () => Array(32).fill('.'));

      // Draw base pyramid metronome body
      pyramidBody.forEach(([y, leftPad, rowStr]) => {
        for (let c = 0; c < rowStr.length; c++) {
          const ch = rowStr[c];
          if (ch !== ' ') {
            grid[y][leftPad + c] = ch;
          }
        }
      });

      // Draw pendulum wand line
      const wand = wandLines[f];
      wand.forEach(([wx, wy]) => {
        if (wx >= 0 && wx < 32 && wy >= 0 && wy < 32) {
          grid[wy][wx] = 'p'; // white/steel shine wand
        }
      });

      // Draw sliding brass counterweight (poise) at [cx, cy]
      const [cx, cy] = weightCenters[f];
      // 3x2 brass block:
      // top row: w y y
      // bot row: y o o
      if (cy >= 0 && cy < 31 && cx >= 1 && cx < 31) {
        grid[cy][cx - 1] = 'w';
        grid[cy][cx] = 'y';
        grid[cy][cx + 1] = 'y';
        grid[cy + 1][cx - 1] = 'y';
        grid[cy + 1][cx] = 'o';
        grid[cy + 1][cx + 1] = 'o';
      }

      // Draw pivot knob at (15..16, 23)
      grid[23][15] = 'd';
      grid[23][16] = 'd';

      // Draw apex tick/toc sparks if active
      if (sparks[f]) {
        sparks[f].forEach(([sx, sy]) => {
          if (sx >= 0 && sx < 32 && sy >= 0 && sy < 32) {
            grid[sy][sx] = 'p';
          }
        });
      }

      frames.push({ rows: grid.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'metronome',
    category: 'shop',
    size: [32, 32],
    fps: 10,
    loop: true,
    staticFrame: 0,
    notes: 'Rosewood pyramid metronome with ivory scale plate, ease-in/out swinging pendulum wand, sliding brass poise, and TIC/TOC apex sparks',
    palette: {
      '.': null,
      'h': '#eed0a4', // wood highlight (wood highlight)
      'l': '#b57d3e', // wood light (wood light)
      'b': '#8a5a2b', // wood base (wood base)
      's': '#5a3517', // wood shadow (wood shadow)
      'k': '#200e05', // wood deep / outline (woodD deep)
      'w': '#fffbe0', // brass / ivory glint (gold highlight)
      'y': '#ffd23a', // brass base (gold base)
      'o': '#b38004', // brass shadow / tempo tick marks (gold shadow)
      'c': '#381e0c', // recessed cavity shadow (coco shadow)
      'p': '#ffffff', // steel wand specular / tick spark (metal highlight)
      'm': '#b8c6d4', // steel mid (silver mid)
      'd': '#303c4a'  // pivot dark steel (silver deep)
    },
    sparkles: sparkles,
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
