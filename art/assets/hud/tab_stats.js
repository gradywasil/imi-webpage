(function (root) {
  'use strict';

  // tab_stats: 16x16 · 4 frames · 8 fps · loop
  // Antique parchment ledger with rising statistical bar graph,
  // fluttering parchment corner and climbing upward trend glint.

  function buildFrames() {
    const rawFrames = [
      // Frame 0: Corner slightly curled, glint on red bar
      [
        '................',
        '..dddddddd......',
        '..dpppppppwdd...',
        '..dp...p..pwc...',
        '..dp..yy..pwdd..',
        '..dp..YY..pcc...',
        '..dp..YY..Gppd..',
        '..dp..yy.gGppd..',
        '..dp..yy.gGppd..',
        '..dpwRYY.ggppd..',
        '..dpRRyy.ggppd..',
        '..dssddddddssd..',
        '..dssssssssssd..',
        '...dddddddddd...',
        '................',
        '................'
      ],
      // Frame 1: Corner flutters up (+1 row at top right), glint on gold bar
      [
        '............ww..',
        '..dddddddddwwd..',
        '..dpppppppwwc...',
        '..dp...p..pwdd..',
        '..dp..yy..pcc...',
        '..dp..wY..Gppd..',
        '..dp..YY.gGppd..',
        '..dp..yy.gGppd..',
        '..dprryy.ggppd..',
        '..dpRRyy.ggppd..',
        '..dssddddddssd..',
        '..dssssssssssd..',
        '...dddddddddd...',
        '................',
        '................',
        '................'
      ],
      // Frame 2: Corner curled high, trend glint flashes atop green bar
      [
        '............dd..',
        '..dddddddddwwd..',
        '..dpppppppwwc...',
        '..dp...p..pwdd..',
        '..dp..yy..pcc...',
        '..dp..YY..wppd..',
        '..dp..YY.gGppd..',
        '..dp..yy.gGppd..',
        '..dprryy.ggppd..',
        '..dpRRyy.ggppd..',
        '..dssddddddssd..',
        '..dssssssssssd..',
        '...dddddddddd...',
        '................',
        '................',
        '................'
      ],
      // Frame 3: Corner relaxing back down, spark settles
      [
        '................',
        '..dddddddd......',
        '..dpppppppwdd...',
        '..dp...p..pwc...',
        '..dp..yy..pwdd..',
        '..dp..wY..pcc...',
        '..dp..YY..Gppd..',
        '..dp..YY.gGppd..',
        '..dp..yy.gGppd..',
        '..dprrYY.ggppd..',
        '..dpRRyy.ggppd..',
        '..dssddddddssd..',
        '..dssssssssssd..',
        '...dddddddddd...',
        '................',
        '................'
      ]
    ];

    return rawFrames.map(rows => ({ rows }));
  }

  const asset = {
    id: 'tab_stats',
    category: 'hud',
    size: [16, 16],
    fps: 8,
    loop: true,
    staticFrame: 0,
    notes: 'Parchment ledger tab icon with rising colorful statistical bar graph, fluttering corner, and trend glint',
    palette: {
      '.': null,
      'd': '#30180a', // deep wood/ink outline
      's': '#786842', // parchment shadow outline
      'c': '#c9b88a', // parchment fold shadow
      'p': '#ede0b8', // parchment face cream
      'w': '#ffffff', // paper glint / trend highlight
      'r': '#b8322a', // bar 1 red base
      'R': '#e86a50', // bar 1 red light
      'y': '#ffd23a', // bar 2 gold base
      'Y': '#fff08c', // bar 2 gold light
      'g': '#2f8a35', // bar 3 green base
      'G': '#74c648'  // bar 3 green light
    },
    frames: buildFrames()
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
