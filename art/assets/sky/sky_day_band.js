(function (root) {
  // Seamless horizontal tile band: sky_day_band (32x16, tile: true, still: true)
  // Radiant midday atmosphere graduating from deep zenith blue to warm horizon light,
  // laced with feathered, wispy cirrus cloud filaments.

  const palette = {
    'd': '#123e64', // zenith deep blue
    's': '#2878b4', // upper azure sky
    'b': '#52b8ec', // mid cyan sky
    'l': '#9ce0ff', // lower pale sky
    'p': '#e4f6ff', // horizon atmosphere haze
    'w': '#ffffff', // pure white cirrus highlight / horizon crest
    'h': '#eef4fb', // soft cirrus body light
    'c': '#d2e2f0'  // feathered cirrus shadow
  };

  // 16 rows, each exactly 32 chars wide.
  // CRITICAL: Col 0 MUST match Col 31 for seamless horizontal tiling!
  const rows = [
    'dddddddddddddddddddddddddddddddd', // 0: Zenith deep
    'ddddsddddddddsddddddddsddddddddd', // 1: Zenith with upper sky speckle
    'ssssssssssssssssssssssssssssssss', // 2: Upper sky
    'sssbssssssssbssssssbsssssssssbss', // 3: Dither to mid sky
    'bbbbbbbwwhcbbbbbbbbbbbbbwwhcbbbb', // 4: Mid sky with high cirrus wisp
    'bbbbbbwhhhhcbbbbbbbbbbwhhhhcbbbb', // 5: Cirrus wisp core
    'bbbbbbbchcbbbbbbbbbbbbbchcbbbbbb', // 6: Cirrus trail
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', // 7: Mid sky
    'bbblbbbbbbbbbbbbbbblbbbbbbbbbbbb', // 8: Dither to pale sky
    'lllwhhhhhcwwhclllwhhhhhcwwhcllll', // 9: Lower wispy cirrus streamer
    'lllchhhhhwhhhclllchhhhhwhhhcllll', // 10: Cirrus streamer tail
    'llllllllllllllllllllllllllllllll', // 11: Pale sky
    'lllpllllllllplllllllpllllllllpll', // 12: Dither to horizon
    'pppppppppppppppppppppppppppppppp', // 13: Horizon haze
    'pppwppppppppppwppppppppppwpppppp', // 14: Dither to luminous crest
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww'  // 15: Horizon light crest
  ];

  const asset = {
    id: 'sky_day_band',
    category: 'sky',
    size: [32, 16],
    fps: 8,
    loop: true,
    still: true,
    tile: true,
    staticFrame: 0,
    notes: '32x16 horizontal seamless tile, sky blue gradient with wispy cirrus',
    palette,
    frames: [{ rows }]
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
