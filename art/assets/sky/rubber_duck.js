(function (root) {
  // 8-frame handcrafted animated pixel art: rubber_duck (24x24, 8 fps, loop)
  // Classic yellow bath duck bobbing buoyantly on rhythmic water ripple rings
  // with subtle squish-and-stretch easing on the crests and troughs.

  const palette = {
    '.': null,
    'w': '#fffbe0', // yellow highlight / sheen
    'h': '#fff08c', // canary yellow light
    'b': '#ffd23a', // classic yellow base
    's': '#c98f0e', // warm golden shadow
    'd': '#5a3a06', // selective deep outline
    'y': '#fff4a0', // beak highlight
    'o': '#d97a0c', // orange beak
    'r': '#781c16', // beak seam shadow
    'i': '#1a0f14', // pupil dark
    'p': '#ffffff', // specular eye highlight
    'l': '#d6f0ff', // ripple foam crest
    'u': '#7ec8f0', // ripple water blue
    'v': '#3a8ec8', // ripple water shadow
    'k': '#184c78'  // deep ripple outline
  };

  const frames = [
    // Frame 0: Neutral waterline rest position
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........ddddd...........',
      '.......dwhhhbd..........',
      '......dwwhpibdddd.......',
      '.....dwhhpiisdyyod......',
      '.....dwhhhbbddoord......',
      '.....dwhhbbbdddd........',
      '....ddwhhbbbbdd.........',
      '...dwwwhhbbbbbbdd.......',
      '..dwwwwhhbbbbbbbsd......',
      '..dwwwwhhbbbbbbbbsd.....',
      '..dwwwwwhbbbbbbbbssd....',
      '...ddwwwhbbbbbbsssdd....',
      '....dddsssbbssssddd.....',
      '.....kddssssssddk.......',
      '...kkluuvvvvvvuulkk.....',
      '..kkuuuuuuuuuuuuukk.....',
      '...kkvvvvvvvvvvvkk......',
      '.....kkkkkkkkkkk........',
      '........................',
      '........................'
    ],
    // Frame 1: Rising up (+1px), slight upward stretch
    [
      '........................',
      '........................',
      '........................',
      '........ddddd...........',
      '.......dwhhhbd..........',
      '......dwwhpibdddd.......',
      '.....dwhhpiisdyyod......',
      '.....dwhhhbbddoord......',
      '.....dwhhbbbdddd........',
      '....ddwhhbbbbdd.........',
      '...dwwwhhbbbbbbdd.......',
      '..dwwwwhhbbbbbbbsd......',
      '..dwwwwhhbbbbbbbbsd.....',
      '..dwwwwwhbbbbbbbbssd....',
      '...ddwwwhbbbbbbsssdd....',
      '....dddsssbbssssddd.....',
      '.....kddssssssddk.......',
      '....kkluuvvvvvvuulk.....',
      '..kkluuvvvvvvvvvuulk....',
      '...kkuuuuuuuuuuuukk.....',
      '....kkvvvvvvvvvvkk......',
      '......kkkkkkkkkk........',
      '........................',
      '........................'
    ],
    // Frame 2: Crest apex (+2px high), stretched, ripple expanding outward
    [
      '........................',
      '........................',
      '........ddddd...........',
      '.......dwhhhbd..........',
      '......dwwhpibdddd.......',
      '.....dwhhpiisdyyod......',
      '.....dwhhhbbddoord......',
      '.....dwhhbbbdddd........',
      '....ddwhhbbbbdd.........',
      '...dwwwhhbbbbbbdd.......',
      '..dwwwwhhbbbbbbbsd......',
      '..dwwwwhhbbbbbbbbsd.....',
      '..dwwwwwhbbbbbbbbssd....',
      '...ddwwwhbbbbbbsssdd....',
      '....dddsssbbssssddd.....',
      '.....kddssssssddk.......',
      '......kkluuvvuulk.......',
      '..kkluuuvvvvvvuuuulk....',
      '.kkuuuuuuuuuuuuuuuukk...',
      '..kkvvvvvvvvvvvvvvkk....',
      '....kkkkkkkkkkkkkk......',
      '........................',
      '........................',
      '........................'
    ],
    // Frame 3: Descending back towards waterline (+1px)
    [
      '........................',
      '........................',
      '........................',
      '........ddddd...........',
      '.......dwhhhbd..........',
      '......dwwhpibdddd.......',
      '.....dwhhpiisdyyod......',
      '.....dwhhhbbddoord......',
      '.....dwhhbbbdddd........',
      '....ddwhhbbbbdd.........',
      '...dwwwhhbbbbbbdd.......',
      '..dwwwwhhbbbbbbbsd......',
      '..dwwwwhhbbbbbbbbsd.....',
      '..dwwwwwhbbbbbbbbssd....',
      '...ddwwwhbbbbbbsssdd....',
      '....dddsssbbssssddd.....',
      '.....kddssssssddk.......',
      '....kkluuvvvvvvuulk.....',
      '..kkluuuvvvvvvvvuuulk...',
      '...kkuuuuuuuuuuuuukk....',
      '....kkvvvvvvvvvvvkk.....',
      '......kkkkkkkkkkk.......',
      '........................',
      '........................'
    ],
    // Frame 4: Neutral waterline rest position
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........ddddd...........',
      '.......dwhhhbd..........',
      '......dwwhpibdddd.......',
      '.....dwhhpiisdyyod......',
      '.....dwhhhbbddoord......',
      '.....dwhhbbbdddd........',
      '....ddwhhbbbbdd.........',
      '...dwwwhhbbbbbbdd.......',
      '..dwwwwhhbbbbbbbsd......',
      '..dwwwwhhbbbbbbbbsd.....',
      '..dwwwwwhbbbbbbbbssd....',
      '...ddwwwhbbbbbbsssdd....',
      '....dddsssbbssssddd.....',
      '.....kddssssssddk.......',
      '...kkluuvvvvvvuulkk.....',
      '..kkuuuuuuuuuuuuukk.....',
      '...kkvvvvvvvvvvvkk......',
      '.....kkkkkkkkkkk........',
      '........................',
      '........................'
    ],
    // Frame 5: Dips into trough (-1px), starting gentle squish
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........ddddd...........',
      '.......dwhhhbd..........',
      '......dwwhpibdddd.......',
      '.....dwhhpiisdyyod......',
      '.....dwhhhbbddoord......',
      '....ddwhhbbbdddd........',
      '...dwwwhhbbbbbdd........',
      '..dwwwwwhbbbbbbbssd.....',
      '..dwwwwwwhbbbbbbbbssd...',
      '...ddwwwwwhbbbbbbbsssdd.',
      '....ddddsssbbsssssdddd..',
      '....kkluudssssssdduulk..',
      '...kkuuuuvvvvvvvvuuuukk.',
      '....kkuuuuuuuuuuuuuukk..',
      '.....kkvvvvvvvvvvvkk....',
      '.......kkkkkkkkkkk......',
      '........................',
      '........................',
      '........................'
    ],
    // Frame 6: Deepest trough squish (-1px), body spreads 1px wider, water curls
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........ddddd...........',
      '.......dwhhhbd..........',
      '......dwwhpibdddd.......',
      '.....dwhhpiisdyyod......',
      '.....dwhhhbbddoord......',
      '....ddwhhbbbdddd........',
      '...dwwwhhbbbbbdd........',
      '..dwwwwwhbbbbbbbssd.....',
      '..dwwwwwwhbbbbbbbbssd...',
      '...ddwwwwwhbbbbbbbsssdd.',
      '....ddddsssbbsssssdddd..',
      '....kkluudssssssdduulk..',
      '...kkluuvvvvvvvvvvuulkk.',
      '....kkuuuuuuuuuuuuuukk..',
      '.....kkvvvvvvvvvvvkk....',
      '.......kkkkkkkkkkk......',
      '........................',
      '........................',
      '........................'
    ],
    // Frame 7: Springing back up from squish towards baseline
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........ddddd...........',
      '.......dwhhhbd..........',
      '......dwwhpibdddd.......',
      '.....dwhhpiisdyyod......',
      '.....dwhhhbbddoord......',
      '.....dwhhbbbdddd........',
      '....ddwhhbbbbdd.........',
      '...dwwwhhbbbbbbdd.......',
      '..dwwwwhhbbbbbbbsd......',
      '..dwwwwhhbbbbbbbbsd.....',
      '..dwwwwwhbbbbbbbbssd....',
      '...ddwwwhbbbbbbsssdd....',
      '....dddsssbbssssddd.....',
      '.....kddssssssddk.......',
      '...kkluuvvvvvvuulkk.....',
      '..kkuuuuuuuuuuuuukk.....',
      '...kkvvvvvvvvvvvkk......',
      '.....kkkkkkkkkkk........',
      '........................',
      '........................'
    ]
  ];

  const asset = {
    id: 'rubber_duck',
    category: 'sky',
    size: [24, 24],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Yellow bath rubber duck bobbing on ripple waves with squash and stretch',
    palette,
    frames
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
