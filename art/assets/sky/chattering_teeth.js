(function (root) {
  // 8-frame handcrafted animated pixel art: chattering_teeth (24x24, 8 fps, loop)
  // Retro novelty wind-up chatter teeth with bright crimson gums, pearly white chompers,
  // and a brass butterfly winding key spinning on the back as it clatters.

  const palette = {
    '.': null,
    'w': '#ffaba0', // gum highlight
    'r': '#e86a50', // gum light red
    'R': '#b8322a', // gum base cherry red
    'd': '#781c16', // gum shadow
    'o': '#420a06', // gum deep outline
    't': '#ffffff', // teeth bright enamel
    'h': '#fff6d6', // teeth light ivory
    'b': '#ede0b8', // teeth base
    's': '#c9b88a', // teeth interstice shadow
    'y': '#fffbe0', // brass key highlight
    'g': '#ffd23a', // brass key base gold
    'k': '#b38004', // brass key shadow
    'x': '#4a2e04', // brass key outline
    'm': '#1a0f14'  // mouth cavity deep darkness
  };

  const frames = [
    // Frame 0: Mouth shut, teeth clenched. Key flat horizontal.
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........ooooooo.........',
      '......oorrrrrrroo.......',
      '.....owwrrrrrRRRRo......',
      '....owwrrrrrRRRRRdo.....',
      '....orrrrRRRRRRRddo.....',
      '....ottttthhhhssddo.xxx.',
      '....otthbthhbbssddoxggyx',
      '....otthbthhbbssddoxgykx',
      '....ottttthhhhssddo.xxx.',
      '....orrrrRRRRRRRddo.....',
      '....owwrrrrrRRRRRdo.....',
      '.....owwrrrrrRRRRo......',
      '......oodddddddoo.......',
      '........ooooooo.........',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ],
    // Frame 1: Upper jaw parting up 1px. Key tilting 22.5 deg.
    [
      '........................',
      '........................',
      '........................',
      '........ooooooo.........',
      '......oorrrrrrroo.......',
      '.....owwrrrrrRRRRo......',
      '....owwrrrrrRRRRRdo.....',
      '....orrrrRRRRRRRddo.xx..',
      '....ottttthhhhssddoxggyx',
      '....otthbthhbbssddoxgykx',
      '....ommmmmmmmmmmddoxkx..',
      '....otthbthhbbssddo.x...',
      '....ottttthhhhssddo.....',
      '....orrrrRRRRRRRddo.....',
      '....owwrrrrrRRRRRdo.....',
      '.....owwrrrrrRRRRo......',
      '......oodddddddoo.......',
      '........ooooooo.........',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ],
    // Frame 2: Mouth wide open, gaping jaw. Key diagonal 45 deg.
    [
      '........................',
      '........................',
      '........ooooooo.........',
      '......oorrrrrrroo.......',
      '.....owwrrrrrRRRRo......',
      '....owwrrrrrRRRRRdo.xx..',
      '....orrrrRRRRRRRddoxggyx',
      '....ottttthhhhssddoxgykx',
      '....otthbthhbbssddo.xx..',
      '....ommmmmmmmmmmddo.x...',
      '....ommmmmmmmmmmddoxkx..',
      '....otthbthhbbssddoxgykx',
      '....ottttthhhhssddoxggyx',
      '....orrrrRRRRRRRddo.xx..',
      '....owwrrrrrRRRRRdo.....',
      '.....owwrrrrrRRRRo......',
      '......oodddddddoo.......',
      '........ooooooo.........',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ],
    // Frame 3: CLACK! Jaw snaps shut on impact. Key steep diagonal 67 deg.
    [
      '........................',
      '........................',
      '........................',
      '....................xx..',
      '........ooooooo....xggx.',
      '......oorrrrrrroo..xgyx.',
      '.....owwrrrrrRRRRo..xx..',
      '....owwrrrrrRRRRRdo.x...',
      '....orrrrRRRRRRRddoxkx..',
      '....ottttthhhhssddoxgyx.',
      '....otthbthhbbssddoxggx.',
      '....otthbthhbbssddo.xx..',
      '....ottttthhhhssddo.....',
      '....orrrrRRRRRRRddo.....',
      '....owwrrrrrRRRRRdo.....',
      '.....owwrrrrrRRRRo......',
      '......oodddddddoo.......',
      '........ooooooo.........',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ],
    // Frame 4: Recoil, jaw parting 1px. Key vertical 90 deg.
    [
      '........................',
      '........................',
      '....................xx..',
      '...................xggyx',
      '........ooooooo....xgykx',
      '......oorrrrrrroo...xx..',
      '.....owwrrrrrRRRRo..x...',
      '....owwrrrrrRRRRRdo.x...',
      '....orrrrRRRRRRRddo.xx..',
      '....ottttthhhhssddoxgykx',
      '....ommmmmmmmmmmddoxggyx',
      '....otthbthhbbssddo.xx..',
      '....ottttthhhhssddo.....',
      '....orrrrRRRRRRRddo.....',
      '....owwrrrrrRRRRRdo.....',
      '.....owwrrrrrRRRRo......',
      '......oodddddddoo.......',
      '........ooooooo.........',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ],
    // Frame 5: Mouth wide open second chatter. Key angled 112 deg.
    [
      '........................',
      '........................',
      '........ooooooo.........',
      '......oorrrrrrroo.......',
      '.....owwrrrrrRRRRo..xx..',
      '....owwrrrrrRRRRRdo.xgkx',
      '....orrrrRRRRRRRddo.xgyx',
      '....ottttthhhhssddo..xx.',
      '....otthbthhbbssddo.x...',
      '....ommmmmmmmmmmddoxkx..',
      '....ommmmmmmmmmmddoxgykx',
      '....otthbthhbbssddoxggyx',
      '....ottttthhhhssddo.xx..',
      '....orrrrRRRRRRRddo.....',
      '....owwrrrrrRRRRRdo.....',
      '.....owwrrrrrRRRRo......',
      '......oodddddddoo.......',
      '........ooooooo.........',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ],
    // Frame 6: CLACK! Second sharp chomp bite. Key angled 135 deg.
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........ooooooo.........',
      '......oorrrrrrroo...xx..',
      '.....owwrrrrrRRRRo.xggyx',
      '....owwrrrrrRRRRRdoxgykx',
      '....orrrrRRRRRRRddo.xx..',
      '....ottttthhhhssddo.x...',
      '....otthbthhbbssddoxkx..',
      '....otthbthhbbssddoxgykx',
      '....ottttthhhhssddoxggyx',
      '....orrrrRRRRRRRddo.xx..',
      '....owwrrrrrRRRRRdo.....',
      '.....owwrrrrrRRRRo......',
      '......oodddddddoo.......',
      '........ooooooo.........',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ],
    // Frame 7: Settle clench before next cycle. Key angled 157 deg.
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........ooooooo.........',
      '......oorrrrrrroo.......',
      '.....owwrrrrrRRRRo..xx..',
      '....owwrrrrrRRRRRdo.xgkx',
      '....orrrrRRRRRRRddo.xgyx',
      '....ottttthhhhssddo.xxx.',
      '....otthbthhbbssddoxggyx',
      '....otthbthhbbssddoxgykx',
      '....ottttthhhhssddo.xxx.',
      '....orrrrRRRRRRRddo.....',
      '....owwrrrrrRRRRRdo.....',
      '.....owwrrrrrRRRRo......',
      '......oodddddddoo.......',
      '........ooooooo.........',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ]
  ];

  const asset = {
    id: 'chattering_teeth',
    category: 'sky',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Classic wind-up chatter teeth clacking up and down with spinning brass key',
    palette,
    frames
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
