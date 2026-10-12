(function (root) {
  'use strict';

  // buff_coffee: 24x24 · 6 frames · 8 fps · loop
  // Steaming high-voltage espresso cup buff icon crackling with electric energy lightning.

  function buildFrames() {
    const rawFrames = [
      // Frame 0: Steam wafts up, small electric spark on lip
      [
        '........................',
        '.........www............',
        '........wcccw...........',
        '.......wcmmcw...........',
        '........wccw............',
        '..........w..ye.........',
        '.........ye.yyee........',
        '........yyeyyyy.........',
        '.......dddddddddd.......',
        '......dwwgssssggwd......',
        '.....dssbkkkkkkbssd.dd..',
        '.....dwwbkkkkkkbwwddmmd.',
        '.....dccbbbbbbbbccdm..md',
        '.....dccbbbbbbbbccdm..md',
        '......dmmmmmmmmmd.dmmd..',
        '......dmmmmmmmmmd..dd...',
        '.......dcccccccdd.......',
        '.......ddddddddd........',
        '.....ddddddddddddd......',
        '....dcccccccccccccdd....',
        '....dmmmmmmmmmmmmmdd....',
        '.....dddddddddddddd.....',
        '........................',
        '........................'
      ],
      // Frame 1: Electric bolt zaps upwards through steam!
      [
        '........................',
        '........wyyew...........',
        '.......wyyeyyw..........',
        '......wcyyeymcw.........',
        '........wccw............',
        '.........wye............',
        '........yyyyee..........',
        '.......yyeyyyye.........',
        '.......dddddddddd.......',
        '......dwwgssssggwd......',
        '.....dssbkkkkkkbssd.dd..',
        '.....dwwbkkkkkkbwwddmmd.',
        '.....dccbbbbbbbbccdm..md',
        '.....dccbbbbbbbbccdm..md',
        '......dmmmmmmmmmd.dmmd..',
        '......dmmmmmmmmmd..dd...',
        '.......dcccccccdd.......',
        '.......ddddddddd........',
        '.....ddddddddddddd......',
        '....dcccccccccccccdd....',
        '....dmmmmmmmmmmmmmdd....',
        '.....dddddddddddddd.....',
        '........................',
        '........................'
      ],
      // Frame 2: Steam billows right, crackle branches
      [
        '........................',
        '..........www...........',
        '.........wcccw...ye.....',
        '........wcmmcw..yyee....',
        '.........wccw..yyey.....',
        '..........w...yye.......',
        '.........w...ye.........',
        '........yyeyyyy.........',
        '.......dddddddddd.......',
        '......dwwgssssggwd......',
        '.....dssbkkkkkkbssd.dd..',
        '.....dwwbkkkkkkbwwddmmd.',
        '.....dccbbbbbbbbccdm..md',
        '.....dccbbbbbbbbccdm..md',
        '......dmmmmmmmmmd.dmmd..',
        '......dmmmmmmmmmd..dd...',
        '.......dcccccccdd.......',
        '.......ddddddddd........',
        '.....ddddddddddddd......',
        '....dcccccccccccccdd....',
        '....dmmmmmmmmmmmmmdd....',
        '.....dddddddddddddd.....',
        '........................',
        '........................'
      ],
      // Frame 3: Dual electric sparks dancing over rim
      [
        '........................',
        '...........www..........',
        '..........wcccw.........',
        '.........wcmmcw.........',
        '..........wccw..........',
        '.....ye...w.ye..........',
        '....yyee.ye.yyee........',
        '...yyey.yyeyyyy.........',
        '.......dddddddddd.......',
        '......dwwgssssggwd......',
        '.....dssbkkkkkkbssd.dd..',
        '.....dwwbkkkkkkbwwddmmd.',
        '.....dccbbbbbbbbccdm..md',
        '.....dccbbbbbbbbccdm..md',
        '......dmmmmmmmmmd.dmmd..',
        '......dmmmmmmmmmd..dd...',
        '.......dcccccccdd.......',
        '.......ddddddddd........',
        '.....ddddddddddddd......',
        '....dcccccccccccccdd....',
        '....dmmmmmmmmmmmmmdd....',
        '.....dddddddddddddd.....',
        '........................',
        '........................'
      ],
      // Frame 4: Giant surge of espresso lightning bolt!
      [
        '........................',
        '.......wyyeyyw..........',
        '......wcyyeymcw.........',
        '.....wcyyyeyymcw........',
        '........wccw............',
        '........wyyee...........',
        '.......yyyyee...........',
        '......yyeyyyye..........',
        '.......dddddddddd.......',
        '......dwwgssssggwd......',
        '.....dssbkkkkkkbssd.dd..',
        '.....dwwbkkkkkkbwwddmmd.',
        '.....dccbbbbbbbbccdm..md',
        '.....dccbbbbbbbbccdm..md',
        '......dmmmmmmmmmd.dmmd..',
        '......dmmmmmmmmmd..dd...',
        '.......dcccccccdd.......',
        '.......ddddddddd........',
        '.....ddddddddddddd......',
        '....dcccccccccccccdd....',
        '....dmmmmmmmmmmmmmdd....',
        '.....dddddddddddddd.....',
        '........................',
        '........................'
      ],
      // Frame 5: Discharge fading, steam curls re-form
      [
        '........................',
        '........www.............',
        '.......wcccw............',
        '......wcmmcw............',
        '.......wccw.............',
        '.........w...ye.........',
        '........ye..yyee........',
        '.......yyeyyyy..........',
        '.......dddddddddd.......',
        '......dwwgssssggwd......',
        '.....dssbkkkkkkbssd.dd..',
        '.....dwwbkkkkkkbwwddmmd.',
        '.....dccbbbbbbbbccdm..md',
        '.....dccbbbbbbbbccdm..md',
        '......dmmmmmmmmmd.dmmd..',
        '......dmmmmmmmmmd..dd...',
        '.......dcccccccdd.......',
        '.......ddddddddd........',
        '.....ddddddddddddd......',
        '....dcccccccccccccdd....',
        '....dmmmmmmmmmmmmmdd....',
        '.....dddddddddddddd.....',
        '........................',
        '........................'
      ]
    ];

    return rawFrames.map(rows => ({ rows }));
  }

  const asset = {
    id: 'buff_coffee',
    category: 'hud',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Steaming high-voltage espresso cup buff icon crackling with electric energy lightning',
    palette: {
      '.': null,
      'd': '#3a4468', // cup deep ceramic/plate outline
      'm': '#7e8ab0', // cup shadow ceramic
      'c': '#d8e0f0', // cup light ceramic
      'w': '#ffffff', // porcelain highlight / steam
      'k': '#200e05', // dark espresso liquid
      'b': '#5a3517', // espresso rich body
      's': '#8a5a2b', // crema shadow
      'g': '#ffd23a', // golden crema highlight
      'y': '#fff08c', // electric lightning yellow
      'e': '#52b8ec'  // electric cyan spark
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
