(function (root) {
  // Seamless horizontal tile band: sky_night_band (32x16, tile: true, still: true)
  // Deep celestial indigo night sky graduating to twilight horizon mist,
  // studded with brilliant multi-tiered stars and distant constellation motes.

  const palette = {
    'i': '#0c1442', // abyssal indigo zenith
    'u': '#1a2872', // deep midnight blue
    'b': '#2e44a8', // upper indigo sky
    's': '#141828', // midnight navy shadow
    't': '#28304a', // celestial navy tone
    'h': '#454f6e', // horizon celestial haze
    'p': '#6a7796', // horizon twilight mist
    'w': '#ffffff', // primary star core glint
    'y': '#fff7b0', // warm stellar corona
    'g': '#f4d242', // golden star diamond
    'm': '#d8e0f0', // cool blue-white star
    'c': '#7e8ab0'  // faint stellar halo
  };

  // Sparkle coordinates for pinpoint stars to guarantee zero orphan violations
  const sparkles = [
    [4, 1], [18, 1], [27, 2], [11, 4], [22, 5], [7, 7], [15, 8], [28, 9], [3, 11]
  ];

  // 16 rows, each exactly 32 chars wide.
  // Col 0 MUST match Col 31 for seamless horizontal tiling!
  const rows = [
    'iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii', // 0: Abyssal zenith
    'iiiimiiiiiiiiiiiiimiiiiiiiiiiiii', // 1: Pinpoint cool stars at x=4, 18
    'iiiiiiiiiiiiiiiiiiiiiiiiiiiwiiii', // 2: Pinpoint star at x=27
    'iiiuuuuuuiiiiyuiuuuuuuuuuiiiuiii', // 3: Diamond star corona
    'uuuuuuuuuuuwywuuuuuuuuuuuuuuuuuu', // 4: Diamond star cross at x=11
    'uuuuuuuuuuuuuuuuuuuuuuwyuuuuuuuu', // 5: Warm twin star at x=22
    'uuubuuuuuuuubuuuuuuubuuuuuuubuuu', // 6: Deep navy dither
    'bbbbbbbwbbbbbbbbbbbbbbbbbbbbbbbb', // 7: Star at x=7
    'bbbbbbbbbbbbbbmwbbbbbbbbbbbbbbbb', // 8: Twin star at x=14,15
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbcmcb', // 9: Star cluster at x=28,29,30
    'ssssssssssssssssssssssssssssssss', // 10: Midnight shadow
    'ssstssssssssssssssssssstssssssss', // 11: Pinpoint at x=3
    'tttttttttttttttttttttttttttttttt', // 12: Storm navy
    'tttthtttttttttttttttthtttttttttt', // 13: Navy to haze
    'hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh', // 14: Horizon celestial haze
    'pppppppppppppppppppppppppppppppp'  // 15: Horizon twilight mist
  ];

  const asset = {
    id: 'sky_night_band',
    category: 'sky',
    size: [32, 16],
    fps: 8,
    loop: true,
    still: true,
    tile: true,
    staticFrame: 0,
    sparkles,
    notes: '32x16 horizontal seamless tile, deep indigo with starfield',
    palette,
    frames: [{ rows }]
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
