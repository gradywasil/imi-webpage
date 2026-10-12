(function (root) {
  // Seamless horizontal tile band: sky_sunset_band (32x16, tile: true, still: true)
  // Dramatic dusk twilight gradient melting from deep cosmic violet
  // through rich magenta-rose into incandescent amber-gold horizon glow.

  const palette = {
    'v': '#280c48', // deep twilight violet zenith
    'p': '#4e2280', // royal purple dusk
    'm': '#7a46bc', // vibrant violet
    'l': '#b58cf0', // lavender cloud crest
    'r': '#c8486c', // dusky magenta rose
    's': '#e86a50', // warm salmon sunset
    'o': '#d97a0c', // deep amber orange
    'g': '#ffd23a', // radiant gold base
    'y': '#fff08c', // golden horizon light
    'w': '#fffbe0', // luminous white-gold horizon crest
    'k': '#351c0c', // backlit cloud underbelly silhouette
    'b': '#6e3004'  // warm amber cloud rim
  };

  // 16 rows, each exactly 32 chars wide.
  // Col 0 MUST match Col 31 for seamless horizontal tiling!
  const rows = [
    'vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv', // 0: Cosmic violet zenith
    'vvvvpvvvvvvvvvvvvvvvpvvvvvvvvvvv', // 1: Zenith with purple dither
    'pppppppppppppppppppppppppppppppp', // 2: Royal purple dusk
    'pppmpppppppppmpppppppppmpppppppp', // 3: Purple to violet dither
    'mmmmmmmlmrmmmmmmmmmmmmmlmrmmmmmm', // 4: High dusk cloud wisp
    'mmmmmmkbbrommmmmmmmmmmkbbrommmmm', // 5: Cloud rim catching sunset gold
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm', // 6: Vibrant violet
    'rrrrmrrrrrrrrrrrrmrrrrrrrrrrrrmr', // 7: Dusky magenta rose
    'ssssssssssssssssssssssssssssssss', // 8: Warm salmon dusk
    'ssssoosssssssssssssoosssssssssss', // 9: Salmon to amber transition
    'oooooooooooooooooooooooooooooooo', // 10: Deep amber orange
    'oooogoooooooooooooogoooooooooooo', // 11: Amber into golden light
    'gggggggggggggggggggggggggggggggg', // 12: Radiant gold
    'gggyggggggggggyggggggggggygggggg', // 13: Gold into soft light
    'yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy', // 14: Soft golden horizon
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww'  // 15: Incandescent horizon crest
  ];

  const asset = {
    id: 'sky_sunset_band',
    category: 'sky',
    size: [32, 16],
    fps: 8,
    loop: true,
    still: true,
    tile: true,
    staticFrame: 0,
    notes: '32x16 horizontal seamless tile, violet to amber gradient',
    palette,
    frames: [{ rows }]
  };

  (root.ArtV2 = root.ArtV2 || { assets: {} }).assets = root.ArtV2.assets || {};
  root.ArtV2.assets[asset.id] = asset;
  if (typeof module === 'object' && module.exports) module.exports = asset;
})(typeof self !== 'undefined' ? self : this);
