(function (root) {
  // 8-frame handcrafted animated pixel art: fortune_cookie (24x24, 8 fps, loop)
  // Crisp golden-baked fortune cookie cracking open along its central seam
  // to reveal an unfurling white paper slip with lucky crimson text.

  const palette = {
    '.': null,
    'w': '#fffbe0', // golden bake highlight
    'h': '#e8b878', // golden crust light
    'b': '#c08a4a', // baked cookie base
    's': '#7a4a1e', // crust shadow
    'd': '#42240a', // deep crust outline
    'k': '#30180a', // hollow inner cavity
    'p': '#ffffff', // paper slip white
    'l': '#fff6d6', // paper slip light tone
    'm': '#c9b88a', // paper slip shadow
    'r': '#b8322a', // lucky red ink lettering
    'g': '#ffd23a'  // crumb flake sparkle
  };

  const frames = [
    // Frame 0: Whole closed fortune cookie resting
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '.........dddddd.........',
      '.......ddwhhhhhdd.......',
      '.....ddwhhhbbhhhdd......',
      '....dwhhhbbddbbhhhwd....',
      '...dwhhbbbddddbbhhwwd...',
      '..dwhhbbbdd..ddbbhhwwd..',
      '..dhhbbsdd....ddsbhhwd..',
      '..dhbbssdd....ddssbbhd..',
      '..dsbsssdd....ddsssbsd..',
      '...dssssd......dssssd...',
      '....dddd........dddd....',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ],
    // Frame 1: Micro-crack along center crease, crumb sparks appear
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '..........gg............',
      '.........dddddd.........',
      '.......ddwhhhhhdd.......',
      '.....ddwhhhbbhhhdd......',
      '....dwhhhbbgkbbhhhwd....',
      '...dwhhbbbdgddbbhhwwd...',
      '..dwhhbbbdd..ddbbhhwwd..',
      '..dhhbbsdd....ddsbhhwd..',
      '..dhbbssdd....ddssbbhd..',
      '..dsbsssdd....ddsssbsd..',
      '...dssssd......dssssd...',
      '....dddd........dddd....',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ],
    // Frame 2: Halves crack apart 1px, tip of fortune slip peeking out
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '..........ppll..........',
      '.........plrrld.........',
      '........dddddddd........',
      '......ddwhhh.hhhhdd.....',
      '....ddwhhhbb.bbhhhdd....',
      '...dwhhhbbkk.kkbbhhhwd..',
      '..dwhhbbbdd...ddbbhhwwd.',
      '.dwhhbbbdd.....ddbbhhwwd',
      '.dhhbbsdd.......ddsbhhwd',
      '.dhbbssdd.......ddssbbhd',
      '.dsbsssdd.......ddsssbsd',
      '..dssssd.........dssssd.',
      '...dddd...........dddd..',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ],
    // Frame 3: Halves parted, paper slip rising and arching
    [
      '........................',
      '........................',
      '........................',
      '.........ppllll.........',
      '........plrrrrrmd.......',
      '........pllllllmd.......',
      '.........dddddd.........',
      '........dkkkkkkd........',
      '......ddwhh...hhdd......',
      '....ddwhhhb...bhhhdd....',
      '...dwhhhbbk...kbbhhhwd..',
      '..dwhhbbbdd...ddbbhhwwd.',
      '.dwhhbbbdd.....ddbbhhwwd',
      '.dhhbbsdd.......ddsbhhwd',
      '.dhbbssdd.......ddssbbhd',
      '.dsbsssdd.......ddsssbsd',
      '..dssssd.........dssssd.',
      '...dddd...........dddd..',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ],
    // Frame 4: Slip fully unfurled waving right, red text clear
    [
      '........................',
      '........................',
      '..........ppllll........',
      '.........pllrrrrm.......',
      '........pllrrrrrmd......',
      '........pllllllmmd......',
      '.........dddddd.........',
      '........dkkkkkkd........',
      '......ddwhh...hhdd......',
      '....ddwhhhb...bhhhdd....',
      '...dwhhhbbk...kbbhhhwd..',
      '..dwhhbbbdd...ddbbhhwwd.',
      '.dwhhbbbdd.....ddbbhhwwd',
      '.dhhbbsdd.......ddsbhhwd',
      '.dhbbssdd.......ddssbbhd',
      '.dsbsssdd.......ddsssbsd',
      '..dssssd.........dssssd.',
      '...dddd...........dddd..',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ],
    // Frame 5: Slip waves left with flutter
    [
      '........................',
      '........................',
      '........ppllll..........',
      '.......plrrrrllm........',
      '........plrrrrrmd.......',
      '........pmllllmmd.......',
      '.........dddddd.........',
      '........dkkkkkkd........',
      '......ddwhh...hhdd......',
      '....ddwhhhb...bhhhdd....',
      '...dwhhhbbk...kbbhhhwd..',
      '..dwhhbbbdd...ddbbhhwwd.',
      '.dwhhbbbdd.....ddbbhhwwd',
      '.dhhbbsdd.......ddsbhhwd',
      '.dhbbssdd.......ddssbbhd',
      '.dsbsssdd.......ddsssbsd',
      '..dssssd.........dssssd.',
      '...dddd...........dddd..',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ],
    // Frame 6: Slip dipping downwards, halves beginning to draw together
    [
      '........................',
      '........................',
      '........................',
      '.........ppllll.........',
      '........plrrrrrmd.......',
      '.........pmlllmd........',
      '........dddddddd........',
      '.......ddwhh.hhdd.......',
      '.....ddwhhhb.bhhhdd.....',
      '....dwhhhbbk.kbbhhhwd...',
      '...dwhhbbbdd.ddbbhhwwd..',
      '..dwhhbbbdd...ddbbhhwwd.',
      '..dhhbbsdd.....ddsbhhwd.',
      '..dhbbssdd.....ddssbbhd.',
      '..dsbsssdd.....ddsssbsd.',
      '...dssssd.......dssssd..',
      '....dddd.........dddd...',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ],
    // Frame 7: Slip tucking inside, halves closing towards 0
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '..........ppll..........',
      '.........plrrld.........',
      '.........dddddd.........',
      '.......ddwhhhhhdd.......',
      '.....ddwhhhbbhhhdd......',
      '....dwhhhbbkkbbhhhwd....',
      '...dwhhbbbddddbbhhwwd...',
      '..dwhhbbbdd..ddbbhhwwd..',
      '..dhhbbsdd....ddsbhhwd..',
      '..dhbbssdd....ddssbbhd..',
      '..dsbsssdd....ddsssbsd..',
      '...dssssd......dssssd...',
      '....dddd........dddd....',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ]
  ];

  const asset = {
    id: 'fortune_cookie',
    category: 'sky',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Crisp golden fortune cookie cracking open to reveal waving fortune slip',
    palette,
    frames
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
