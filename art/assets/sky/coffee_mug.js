(function (root) {
  // 8-frame handcrafted animated pixel art: coffee_mug (24x24, 8 fps, loop)
  // Chunky ceramic diner mug with turquoise accent stripe.
  // Steaming hot coffee with a floating roasted coffee bean bobbing on gentle ripples.
  // Rising, curling steam plumes loop seamlessly across 8 frames.

  const palette = {
    '.': null,
    'w': '#ffffff', // ceramic highlight / steam glint
    'h': '#fff6d6', // ceramic body light
    'b': '#ede0b8', // ceramic body base
    's': '#c9b88a', // ceramic shadow
    'k': '#786842', // ceramic / bean outline
    'u': '#52b8ec', // diner turquoise stripe light
    'v': '#2878b4', // diner turquoise stripe shadow
    'c': '#caa078', // coffee crema foam ring
    'f': '#563418', // rich coffee brew
    'd': '#381e0c', // coffee deep shadow
    'e': '#1e0e04', // bean center crease / darkest shadow
    'g': '#86592e', // roasted bean light
    't': '#eef4fb', // steam highlight
    'm': '#d2e2f0'  // steam soft shadow
  };

  // Base mug body and handle
  // Mug sits from y=9 to y=21, handle on right side x=18..22
  // Interior coffee pool is at y=10..12, x=6..16

  const frames = [
    // Frame 0: Bean at y=11, steam curling up-left
    [
      '........................',
      '........tt..............',
      '.......tmmt.............',
      '........tt..............',
      '.....tt.................',
      '....tmmt................',
      '.....tt.....tt..........',
      '...........tmmt.........',
      '.....kkkkkkkkkkkk.......',
      '....khhhhhwhhhhhk.......',
      '....khcccccccccsk.kkk...',
      '....khcfgeffdccskkwwk...',
      '....khcfffffdccsk.hsk...',
      '....khuuuuvvvvksk.hsk...',
      '....khhhhhhhhhkskkwwk...',
      '....khhhhhhhhhk.kkk.....',
      '....kbbbbbbbbbkk........',
      '....ksbssssssskk........',
      '....kssssssssskk........',
      '.....kksssssskk.........',
      '......kkkkkkkk..........',
      '....kkkkkkkkkkkk........',
      '........................',
      '........................'
    ],
    // Frame 1: Bean bobs up 1px to y=10, ripple begins, steam curls upward
    [
      '........................',
      '.......tt...............',
      '......tmmt..............',
      '.......tt...............',
      '....tt.......tt.........',
      '...tmmt.....tmmt........',
      '....tt.......tt.........',
      '.......tt...............',
      '.....kkkkkkkkkkkk.......',
      '....khhhhhwhhhhhk.......',
      '....khccfgefdccsk.kkk...',
      '....khcfffffdccskkwwk...',
      '....khccffccdccsk.hsk...',
      '....khuuuuvvvvksk.hsk...',
      '....khhhhhhhhhkskkwwk...',
      '....khhhhhhhhhk.kkk.....',
      '....kbbbbbbbbbkk........',
      '....ksbssssssskk........',
      '....kssssssssskk........',
      '.....kksssssskk.........',
      '......kkkkkkkk..........',
      '....kkkkkkkkkkkk........',
      '........................',
      '........................'
    ],
    // Frame 2: Bean at y=10 apex, ripple expands, steam twists right
    [
      '........................',
      '......tt................',
      '.....tmmt...............',
      '......tt.....tt.........',
      '...tt.......tmmt........',
      '..tmmt.......tt.........',
      '...tt...................',
      '........tt..............',
      '.....kkkkkkkkkkkk.......',
      '....khhhhhwhhhhhk.......',
      '....khccfgefdccsk.kkk...',
      '....khcffccfdccskkwwk...',
      '....khccccccdccsk.hsk...',
      '....khuuuuvvvvksk.hsk...',
      '....khhhhhhhhhkskkwwk...',
      '....khhhhhhhhhk.kkk.....',
      '....kbbbbbbbbbkk........',
      '....ksbssssssskk........',
      '....kssssssssskk........',
      '.....kksssssskk.........',
      '......kkkkkkkk..........',
      '....kkkkkkkkkkkk........',
      '........................',
      '........................'
    ],
    // Frame 3: Bean tilting down to y=11, steam cresting
    [
      '........................',
      '.....tt......tt.........',
      '....tmmt....tmmt........',
      '.....tt......tt.........',
      '..tt....................',
      '.tmmt...................',
      '..tt........tt..........',
      '...........tmmt.........',
      '.....kkkkkkkkkkkk.......',
      '....khhhhhwhhhhhk.......',
      '....khcccccccccsk.kkk...',
      '....khcfgeffdccskkwwk...',
      '....khccffccdccsk.hsk...',
      '....khuuuuvvvvksk.hsk...',
      '....khhhhhhhhhkskkwwk...',
      '....khhhhhhhhhk.kkk.....',
      '....kbbbbbbbbbkk........',
      '....ksbssssssskk........',
      '....kssssssssskk........',
      '.....kksssssskk.........',
      '......kkkkkkkk..........',
      '....kkkkkkkkkkkk........',
      '........................',
      '........................'
    ],
    // Frame 4: Bean dipping to y=11, steam wisp curling right
    [
      '........................',
      '....tt.......tt.........',
      '...tmmt.....tmmt........',
      '....tt.......tt.........',
      '........................',
      '.......tt...............',
      '......tmmt..tt..........',
      '.......tt..tmmt.........',
      '.....kkkkkkkkkkkk.......',
      '....khhhhhwhhhhhk.......',
      '....khcccccccccsk.kkk...',
      '....khcfgfffdccskkwwk...',
      '....khcffeeddccsk.hsk...',
      '....khuuuuvvvvksk.hsk...',
      '....khhhhhhhhhkskkwwk...',
      '....khhhhhhhhhk.kkk.....',
      '....kbbbbbbbbbkk........',
      '....ksbssssssskk........',
      '....kssssssssskk........',
      '.....kksssssskk.........',
      '......kkkkkkkk..........',
      '....kkkkkkkkkkkk........',
      '........................',
      '........................'
    ],
    // Frame 5: Bean at lowest dip y=12, tiny splash ripple ring, steam swirling
    [
      '........................',
      '...tt.......tt..........',
      '..tmmt.....tmmt.........',
      '...tt.......tt..........',
      '........................',
      '........tt..............',
      '.......tmmt.............',
      '........tt..tt..........',
      '.....kkkkkkkkkkkk.......',
      '....khhhhhwhhhhhk.......',
      '....khcccccccccsk.kkk...',
      '....khcffccfdccskkwwk...',
      '....khcfgfffdccsk.hsk...',
      '....khuuuuvvvvksk.hsk...',
      '....khhhhhhhhhkskkwwk...',
      '....khhhhhhhhhk.kkk.....',
      '....kbbbbbbbbbkk........',
      '....ksbssssssskk........',
      '....kssssssssskk........',
      '.....kksssssskk.........',
      '......kkkkkkkk..........',
      '....kkkkkkkkkkkk........',
      '........................',
      '........................'
    ],
    // Frame 6: Bean rising back to y=11, steam ascending
    [
      '........................',
      '..tt.........tt.........',
      '.tmmt.......tmmt........',
      '..tt.........tt.........',
      '.........tt.............',
      '........tmmt............',
      '.........tt.............',
      '.....tt.....tt..........',
      '.....kkkkkkkkkkkk.......',
      '....khhhhhwhhhhhk.......',
      '....khcccccccccsk.kkk...',
      '....khcfgeffdccskkwwk...',
      '....khcffccfdccsk.hsk...',
      '....khuuuuvvvvksk.hsk...',
      '....khhhhhhhhhkskkwwk...',
      '....khhhhhhhhhk.kkk.....',
      '....kbbbbbbbbbkk........',
      '....ksbssssssskk........',
      '....kssssssssskk........',
      '.....kksssssskk.........',
      '......kkkkkkkk..........',
      '....kkkkkkkkkkkk........',
      '........................',
      '........................'
    ],
    // Frame 7: Bean settling at y=11, steam completing loop to Frame 0
    [
      '........................',
      '.tt..........tt.........',
      'tmmt........tmmt........',
      '.tt..........tt.........',
      '........tt..............',
      '.......tmmt.............',
      '........tt..tt..........',
      '....tt.....tmmt.........',
      '.....kkkkkkkkkkkk.......',
      '....khhhhhwhhhhhk.......',
      '....khcccccccccsk.kkk...',
      '....khcfgeffdccskkwwk...',
      '....khcfffffdccsk.hsk...',
      '....khuuuuvvvvksk.hsk...',
      '....khhhhhhhhhkskkwwk...',
      '....khhhhhhhhhk.kkk.....',
      '....kbbbbbbbbbkk........',
      '....ksbssssssskk........',
      '....kssssssssskk........',
      '.....kksssssskk.........',
      '......kkkkkkkk..........',
      '....kkkkkkkkkkkk........',
      '........................',
      '........................'
    ]
  ];

  const asset = {
    id: 'coffee_mug',
    category: 'sky',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Ceramic diner mug with curling steam wisps and a floating coffee bean bobbing on ripples',
    palette,
    frames
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
