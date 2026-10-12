(function (root) {
  'use strict';

  function buildFrames() {
    const frames = [];

    // Wave ring radius per frame (progressing from 1 to 3 stages)
    for (let f = 0; f < 6; f++) {
      const g = Array.from({ length: 24 }, () => Array(24).fill('.'));

      // 1. Radio Broadcast Microphone (Center x=10..13, y=5..19)
      // "ON AIR" indicator jewel on top (x=11..12, y=3..4)
      const onAirGlow = (f % 2 === 0);
      g[3][11] = onAirGlow ? 'e' : 'r';
      g[3][12] = onAirGlow ? 'e' : 'r';
      g[4][11] = onAirGlow ? 'r' : 'q';
      g[4][12] = onAirGlow ? 'r' : 'q';

      // Outer circular suspension shock-ring (solid orthogonal connections)
      for (let x = 10; x <= 13; x++) { g[5][x] = 'm'; g[13][x] = 's'; }
      for (let x = 8; x <= 10; x++)  { g[6][x] = 'm'; g[12][x] = 's'; }
      for (let x = 13; x <= 15; x++) { g[6][x] = 'm'; g[12][x] = 's'; }
      for (let y = 7; y <= 11; y++)  {
        g[y][6] = (y <= 9) ? 'm' : 's';
        g[y][7] = (y <= 9) ? 'm' : 's';
        g[y][16] = (y <= 9) ? 'm' : 's';
        g[y][17] = (y <= 9) ? 'm' : 's';
      }

      // Internal suspension springs
      g[7][8] = 'd'; g[7][15] = 'd';
      g[11][8] = 'd'; g[11][15] = 'd';

      // Microphone Capsule Body (x=9..14, y=6..12)
      for (let y = 6; y <= 12; y++) {
        g[y][9]  = 'd';
        g[y][10] = 'h';
        g[y][11] = 'w';
        g[y][12] = 'm';
        g[y][13] = 's';
        g[y][14] = 'd';
      }
      // Horizontal art-deco grill cutouts
      g[8][10]  = 'k'; g[8][11]  = 'k'; g[8][12]  = 'k'; g[8][13]  = 'k';
      g[10][10] = 'k'; g[10][11] = 'k'; g[10][12] = 'k'; g[10][13] = 'k';

      // Desk Stand Stem & Swivel Joint (y=14..18)
      g[14][11] = 's'; g[14][12] = 'd';
      g[15][11] = 'm'; g[15][12] = 's';
      g[16][11] = 'h'; g[16][12] = 's';
      g[17][11] = 'm'; g[17][12] = 's';
      g[18][11] = 'h'; g[18][12] = 's';

      // Stepped Circular Desk Base (y=19..21, x=8..15)
      for (let x = 9; x <= 14; x++) {
        g[19][x] = (x < 12) ? 'h' : 'm';
      }
      g[19][8] = 'd'; g[19][15] = 'd';

      for (let x = 7; x <= 16; x++) {
        g[20][x] = (x === 7 || x === 16) ? 'd' : ((x < 11) ? 'h' : ((x < 14) ? 'm' : 's'));
        g[21][x] = 'd';
      }

      // 2. Pulsing Radio Waves (Expanding soundwave arcs on left and right)
      // Arcs are built with 2-pixel continuous spans so no orphan pixels exist
      const phase = f % 6;

      // Inner wave arc (radius 6..8)
      const rInner = 6 + (phase % 3);
      const colInner = (phase % 3 === 2) ? 'c' : 'l';

      const lX = 11 - rInner;
      if (lX >= 2) {
        g[7][lX] = colInner; g[7][lX + 1] = colInner;
        g[8][lX] = colInner; g[8][lX + 1] = colInner;
        g[9][lX] = 'p';      g[9][lX + 1] = colInner;
        g[10][lX] = colInner; g[10][lX + 1] = colInner;
        g[11][lX] = colInner; g[11][lX + 1] = colInner;
      }

      const rX = 12 + rInner;
      if (rX <= 21) {
        g[7][rX - 1] = colInner; g[7][rX] = colInner;
        g[8][rX - 1] = colInner; g[8][rX] = colInner;
        g[9][rX - 1] = colInner; g[9][rX] = 'p';
        g[10][rX - 1] = colInner; g[10][rX] = colInner;
        g[11][rX - 1] = colInner; g[11][rX] = colInner;
      }

      // Outer wave arc (radius 9..10)
      if (phase % 3 !== 2) {
        const rOuter = 9 + (phase % 3);
        const colOuter = (phase % 3 === 1) ? 'b' : 'c';

        const loX = 11 - rOuter;
        if (loX >= 1) {
          g[8][loX] = colOuter; g[8][loX + 1] = colOuter;
          g[9][loX] = colOuter; g[9][loX + 1] = colOuter;
          g[10][loX] = colOuter; g[10][loX + 1] = colOuter;
        }

        const roX = 12 + rOuter;
        if (roX <= 22) {
          g[8][roX - 1] = colOuter; g[8][roX] = colOuter;
          g[9][roX - 1] = colOuter; g[9][roX] = colOuter;
          g[10][roX - 1] = colOuter; g[10][roX] = colOuter;
        }
      }

      frames.push({ rows: g.map(r => r.join('')) });
    }

    return frames;
  }

  const asset = {
    id: 'radio_rights',
    category: 'deals',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Art-deco broadcast microphone with pulsing radio soundwaves and flashing ON-AIR jewel',
    palette: {
      '.': null,
      'k': '#12090e', // ink deep outline
      'd': '#303c4a', // silver deep outline
      's': '#687a8c', // silver shadow
      'm': '#b8c6d4', // silver base
      'h': '#e8f0f8', // silver light
      'w': '#ffffff', // chrome highlight
      'b': '#184c78', // soundwave deep
      'c': '#3a8ec8', // soundwave base
      'l': '#7ec8f0', // soundwave light
      'p': '#d6f0ff', // soundwave highlight
      'q': '#420a06', // red deep
      'r': '#b8322a', // red base
      'e': '#ffaba0'  // red highlight
    },
    sparkles: [],
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
