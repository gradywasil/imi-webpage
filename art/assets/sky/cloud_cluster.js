(function (root) {
  // 8-frame handcrafted animated pixel art: cloud_cluster (32x24, 8 fps, loop)
  // Billowing cumulus cloud cluster with multiple rounded lobes.
  // Buoyant vertical floating bob and internal shading that drifts across the puffs.

  const palette = {
    '.': null,
    'w': '#ffffff', // sunlight cloud crest highlight
    'h': '#eef4fb', // bright cloud puff light
    'b': '#d2e2f0', // soft cumulus base
    's': '#a4bcd4', // drifting underside shade
    'd': '#5a7490', // deep contour outline
    'm': '#9aa8c8', // rear lobe shadow
    'k': '#454f6e'  // deep underbelly crease
  };

  // 8 authored frames of cumulus cloud with drifting shade and gentle vertical bob
  const frames = [
    // Frame 0: Baseline Y, shade centered
    [
      '................................',
      '................................',
      '................................',
      '...........dddddd...............',
      '.........ddwhhhhwhdd............',
      '.......ddwhhhhhwhhhhdd..........',
      '.....ddwhhhhhhhhhhhhhhdd........',
      '....dwhhhhhhbbhhhhhhhhhhdd......',
      '...dwhhhhhbbbbbbbbhhhhhhwhdd....',
      '..dwhhhhhbbbbbbbbbbbbhhwhhhhdd..',
      '..dwhhhbbbbssssssbbbbhhhhbhhk...',
      '..dhbbbssddssssssssbbbbbbbhhkd..',
      '..dssbbddkmdsssssssssbbbbshhskd.',
      '..dsssddkmddsssssssssbbssshhskd.',
      '..dsssddkddsssssssssssssshhskd..',
      '...dssddddsssssssssssssshhskd...',
      '....dddd..ddddssssssssddddk.....',
      '..............dddddddd..........',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ],
    // Frame 1: Bob up 1px, shade shifting right
    [
      '................................',
      '................................',
      '...........dddddd...............',
      '.........ddwhhhhwhdd............',
      '.......ddwhhhhhwhhhhdd..........',
      '.....ddwhhhhhhhhhhhhhhdd........',
      '....dwhhhhhhhbbhhhhhhhhhdd......',
      '...dwhhhhhhbbbbbbbbhhhhhwhdd....',
      '..dwhhhhhhbbbbbbbbbbbbhhwhhhhdd.',
      '..dwhhhbbbbsssssssbbbbhhhhbhhk..',
      '..dhbbbssddsssssssssbbbbbbbhhkd.',
      '..dssbbddkmdsssssssssbbbbshhskd.',
      '..dsssddkmddsssssssssbbssshhskd.',
      '..dsssddkddsssssssssssssshhskd..',
      '...dssddddsssssssssssssshhskd...',
      '....dddd..ddddssssssssddddk.....',
      '..............dddddddd..........',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ],
    // Frame 2: Bob apex 1px, shade shifting right
    [
      '................................',
      '................................',
      '...........dddddd...............',
      '.........ddwhhhhwhdd............',
      '.......ddwhhhhhwhhhhdd..........',
      '.....ddwhhhhhhhhhhhhhhdd........',
      '....dwhhhhhhhhbbhhhhhhhhdd......',
      '...dwhhhhhhhbbbbbbbbhhhhwhdd....',
      '..dwhhhhhhbbbbbbbbbbbbhhwhhhhdd.',
      '..dwhhhbbbbbsssssssbbbhhhhbhhk..',
      '..dhbbbssddsssssssssbbbbbbbhhkd.',
      '..dssbbddkmdssssssssssbbbshhskd.',
      '..dsssddkmddssssssssssbbsshhskd.',
      '..dsssddkddsssssssssssssshhskd..',
      '...dssddddsssssssssssssshhskd...',
      '....dddd..ddddssssssssddddk.....',
      '..............dddddddd..........',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ],
    // Frame 3: Returning to baseline Y, shade moving right
    [
      '................................',
      '................................',
      '................................',
      '...........dddddd...............',
      '.........ddwhhhhwhdd............',
      '.......ddwhhhhhwhhhhdd..........',
      '.....ddwhhhhhhhhhhhhhhdd........',
      '....dwhhhhhhhhbbhhhhhhhhdd......',
      '...dwhhhhhhhbbbbbbbbhhhhwhdd....',
      '..dwhhhhhhbbbbbbbbbbbbhhwhhhhdd.',
      '..dwhhhbbbbbsssssssbbbhhhhbhhk..',
      '..dhbbbssddsssssssssbbbbbbbhhkd.',
      '..dssbbddkmdssssssssssbbbshhskd.',
      '..dsssddkmddssssssssssbbsshhskd.',
      '..dsssddkddsssssssssssssshhskd..',
      '...dssddddsssssssssssssshhskd...',
      '....dddd..ddddssssssssddddk.....',
      '..............dddddddd..........',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ],
    // Frame 4: Bob down 1px, shade drifting across
    [
      '................................',
      '................................',
      '................................',
      '................................',
      '...........dddddd...............',
      '.........ddwhhhhwhdd............',
      '.......ddwhhhhhwhhhhdd..........',
      '.....ddwhhhhhhhhhhhhhhdd........',
      '....dwhhhhhhhbbhhhhhhhhhdd......',
      '...dwhhhhhhbbbbbbbbhhhhhwhdd....',
      '..dwhhhhhbbbbbbbbbbbbhhwhhhhdd..',
      '..dwhhhbbbbssssssbbbbhhhhbhhk...',
      '..dhbbbssddssssssssbbbbbbbhhkd..',
      '..dssbbddkmdsssssssssbbbbshhskd.',
      '..dsssddkmddsssssssssbbssshhskd.',
      '..dsssddkddsssssssssssssshhskd..',
      '...dssddddsssssssssssssshhskd...',
      '....dddd..ddddssssssssddddk.....',
      '..............dddddddd..........',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ],
    // Frame 5: Bob down 1px trough, shade cycling
    [
      '................................',
      '................................',
      '................................',
      '................................',
      '...........dddddd...............',
      '.........ddwhhhhwhdd............',
      '.......ddwhhhhhwhhhhdd..........',
      '.....ddwhhhhhhhhhhhhhhdd........',
      '....dwhhhhhhbbhhhhhhhhhhdd......',
      '...dwhhhhhbbbbbbbbhhhhhhwhdd....',
      '..dwhhhhhbbbbbbbbbbbbhhwhhhhdd..',
      '..dwhhhbbbbssssssbbbbhhhhbhhk...',
      '..dhbbbssddssssssssbbbbbbbhhkd..',
      '..dssbbddkmdsssssssssbbbbshhskd.',
      '..dsssddkmddsssssssssbbssshhskd.',
      '..dsssddkddsssssssssssssshhskd..',
      '...dssddddsssssssssssssshhskd...',
      '....dddd..ddddssssssssddddk.....',
      '..............dddddddd..........',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ],
    // Frame 6: Returning from trough towards baseline Y
    [
      '................................',
      '................................',
      '................................',
      '...........dddddd...............',
      '.........ddwhhhhwhdd............',
      '.......ddwhhhhhwhhhhdd..........',
      '.....ddwhhhhhhhhhhhhhhdd........',
      '....dwhhhhhhbbhhhhhhhhhhdd......',
      '...dwhhhhhbbbbbbbbhhhhhhwhdd....',
      '..dwhhhhhbbbbbbbbbbbbhhwhhhhdd..',
      '..dwhhhbbbbssssssbbbbhhhhbhhk...',
      '..dhbbbssddssssssssbbbbbbbhhkd..',
      '..dssbbddkmdsssssssssbbbbshhskd.',
      '..dsssddkmddsssssssssbbssshhskd.',
      '..dsssddkddsssssssssssssshhskd..',
      '...dssddddsssssssssssssshhskd...',
      '....dddd..ddddssssssssddddk.....',
      '..............dddddddd..........',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ],
    // Frame 7: Baseline Y, transitioning back to Frame 0
    [
      '................................',
      '................................',
      '................................',
      '...........dddddd...............',
      '.........ddwhhhhwhdd............',
      '.......ddwhhhhhwhhhhdd..........',
      '.....ddwhhhhhhhhhhhhhhdd........',
      '....dwhhhhhhbbhhhhhhhhhhdd......',
      '...dwhhhhhbbbbbbbbhhhhhhwhdd....',
      '..dwhhhhhbbbbbbbbbbbbhhwhhhhdd..',
      '..dwhhhbbbbssssssbbbbhhhhbhhk...',
      '..dhbbbssddssssssssbbbbbbbhhkd..',
      '..dssbbddkmdsssssssssbbbbshhskd.',
      '..dsssddkmddsssssssssbbssshhskd.',
      '..dsssddkddsssssssssssssshhskd..',
      '...dssddddsssssssssssssshhskd...',
      '....dddd..ddddssssssssddddk.....',
      '..............dddddddd..........',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ]
  ];

  const asset = {
    id: 'cloud_cluster',
    category: 'sky',
    size: [32, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Floating cumulus cloud cluster with drifting shade and buoyant bob',
    palette,
    frames
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
