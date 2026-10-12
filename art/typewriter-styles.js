/**
 * MonkeyOS v2 - Typewriter Styles & Restoration Tier Theme Engine
 * Location: art/typewriter-styles.js
 *
 * Authentic 16-Bit Pixel Art Hardware Stylist & Color Schemes
 * Supports all 6 canonical MonkeyOS typewriter models:
 *   1. Bamboo Classic   (id: 'mint',   #78d9a0 vintage sage enamel, cast iron, bamboo brass)
 *   2. Hibiscus Ribbon  (id: 'rose',   #f08aa4 rose pink lacquer, crimson velvet, rose-gold)
 *   3. Lagoon Sprint    (id: 'blue',   #5fa8f0 oceanic aqua blue, streamlined chrome/silver, nautical brass)
 *   4. Honeycomb Ledger (id: 'amber',  #f2b23a warm amber gold, deep bronze, polished dark mahogany)
 *   5. Orchid Imperial  (id: 'orchid', #b58cf0 royal imperial purple, velvet violet, 24K gilded gold leaf)
 *   6. Moonflower Grand (id: 'moon',   #dfe3f2 iridescent pearlescent platinum, slate steel, luminous ice-cyan)
 *
 * Restoration Tiers:
 *   - Mk I:   Base restoration with clean factory paint and crisp brass pinstriping
 *   - Mk II:  Double-ring gold pinstripes, gold carriage accents, polished brass ribbon spools
 *   - Mk III: Regal crown crest on medallion, gleaming gold leaf borders, radiant carriage trim
 *
 * Strict UMD export compatible with browser window and Node/CommonJS test runners.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TypewriterStyles = factory(root);
  }
}(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  /* ===============================================================
   * 1. 4x5 BITMAP PIXEL FONT FOR MEDALLIONS & RETRO HARDWARE
   * Every character is represented by 5 rows of 4 bits.
   * Completely raster-aligned: zero anti-aliasing fuzz.
   * =============================================================== */
  const PIXEL_GLYPHS = {
    'A': [0b0110, 0b1001, 0b1111, 0b1001, 0b1001],
    'B': [0b1110, 0b1001, 0b1110, 0b1001, 0b1110],
    'C': [0b0111, 0b1000, 0b1000, 0b1000, 0b0111],
    'D': [0b1110, 0b1001, 0b1001, 0b1001, 0b1110],
    'E': [0b1111, 0b1000, 0b1110, 0b1000, 0b1111],
    'F': [0b1111, 0b1000, 0b1110, 0b1000, 0b1000],
    'G': [0b0111, 0b1000, 0b1011, 0b1001, 0b0111],
    'H': [0b1001, 0b1001, 0b1111, 0b1001, 0b1001],
    'I': [0b1110, 0b0100, 0b0100, 0b0100, 0b1110],
    'J': [0b0011, 0b0001, 0b0001, 0b1001, 0b0110],
    'K': [0b1001, 0b1010, 0b1100, 0b1010, 0b1001],
    'L': [0b1000, 0b1000, 0b1000, 0b1000, 0b1111],
    'M': [0b1001, 0b1111, 0b1001, 0b1001, 0b1001],
    'N': [0b1001, 0b1101, 0b1011, 0b1001, 0b1001],
    'O': [0b0110, 0b1001, 0b1001, 0b1001, 0b0110],
    'P': [0b1110, 0b1001, 0b1110, 0b1000, 0b1000],
    'Q': [0b0110, 0b1001, 0b1001, 0b1010, 0b0101],
    'R': [0b1110, 0b1001, 0b1110, 0b1010, 0b1001],
    'S': [0b0111, 0b1000, 0b0110, 0b0001, 0b1110],
    'T': [0b1111, 0b0100, 0b0100, 0b0100, 0b0100],
    'U': [0b1001, 0b1001, 0b1001, 0b1001, 0b0110],
    'V': [0b1001, 0b1001, 0b1001, 0b0110, 0b0100],
    'W': [0b1001, 0b1001, 0b1001, 0b1111, 0b1001],
    'X': [0b1001, 0b1001, 0b0110, 0b1001, 0b1001],
    'Y': [0b1001, 0b1001, 0b0110, 0b0100, 0b0100],
    'Z': [0b1111, 0b0010, 0b0100, 0b1000, 0b1111],
    '0': [0b0110, 0b1011, 0b1101, 0b1001, 0b0110],
    '1': [0b0100, 0b1100, 0b0100, 0b0100, 0b1110],
    '2': [0b1110, 0b0001, 0b0110, 0b1000, 0b1111],
    '3': [0b1110, 0b0001, 0b0110, 0b0001, 0b1110],
    '4': [0b1001, 0b1001, 0b1111, 0b0001, 0b0001],
    '5': [0b1111, 0b1000, 0b1110, 0b0001, 0b1110],
    '6': [0b0111, 0b1000, 0b1110, 0b1001, 0b0110],
    '7': [0b1111, 0b0001, 0b0010, 0b0100, 0b0100],
    '8': [0b0110, 0b1001, 0b0110, 0b1001, 0b0110],
    '9': [0b0110, 0b1001, 0b0111, 0b0001, 0b1110],
    '.': [0b0000, 0b0000, 0b0000, 0b0000, 0b0100],
    ',': [0b0000, 0b0000, 0b0000, 0b0100, 0b1000],
    ':': [0b0000, 0b0100, 0b0000, 0b0100, 0b0000],
    '!': [0b0100, 0b0100, 0b0100, 0b0000, 0b0100],
    '?': [0b1110, 0b0001, 0b0110, 0b0000, 0b0100],
    '-': [0b0000, 0b0000, 0b1111, 0b0000, 0b0000],
    '+': [0b0000, 0b0100, 0b1110, 0b0100, 0b0000],
    '*': [0b0000, 0b1010, 0b0100, 0b1010, 0b0000],
    '/': [0b0001, 0b0010, 0b0100, 0b1000, 0b0000],
    '#': [0b1010, 0b1111, 0b1010, 0b1111, 0b1010],
    ' ': [0b0000, 0b0000, 0b0000, 0b0000, 0b0000]
  };

  /**
   * Draw a single 4x5 bitmap pixel font character.
   */
  function drawPixelGlyph(ctx, ch, x, y, col) {
    const glyph = PIXEL_GLYPHS[ch] || PIXEL_GLYPHS[' '];
    ctx.fillStyle = col;
    const px = Math.round(x);
    const py = Math.round(y);
    for (let r = 0; r < 5; r++) {
      const rowBits = glyph[r];
      for (let c = 0; c < 4; c++) {
        if ((rowBits >> (3 - c)) & 1) {
          ctx.fillRect(px + c, py + r, 1, 1);
        }
      }
    }
  }

  /**
   * Draw a string using the 4x5 pixel font.
   */
  function drawPixelText(ctx, text, x, y, col, spacing = 5) {
    if (!text) return;
    const str = String(text).toUpperCase();
    let curX = Math.round(x);
    const curY = Math.round(y);
    for (let i = 0; i < str.length; i++) {
      drawPixelGlyph(ctx, str[i], curX, curY, col);
      curX += spacing;
    }
  }

  /**
   * Measure text width with pixel font spacing.
   */
  function measurePixelText(text, spacing = 5) {
    if (!text) return { width: 0, height: 5 };
    const len = String(text).length;
    return {
      width: len > 0 ? (len - 1) * spacing + 4 : 0,
      height: 5
    };
  }

  /* ===============================================================
   * 2. CANONICAL MONKEYOS TYPEWRITER MODELS (DESKS 1 TO 6)
   * Handcrafted 16-bit palettes, historical styling notes & trims.
   * =============================================================== */
  const TYPEWRITER_MODELS = {
    // -------------------------------------------------------------
    // MODEL 1: BAMBOO CLASSIC (Mint Sage)
    // -------------------------------------------------------------
    mint: {
      id: 'mint',
      modelNo: 1,
      name: 'Bamboo Classic',
      shortName: 'Bamboo Classic',
      badge: 'NO. 1',
      medallionText: 'BAMBOO CLASSIC NO. 1',
      wordsBand: '2–3 letters',
      deskIndex: 0,
      price: 0,
      tagline: 'Vintage sage / mint green enamel with polished bamboo brass',
      description: 'The free starting workhorse of MonkeyOS. Finished in vintage sage green enamel over heavy cast iron, featuring polished bamboo-cane brass trim, warm ivory keycaps, and a crisp forest green ribbon.',

      // Primary Enamel Ramp (Vintage sage / mint green)
      primary: {
        darkest: '#0e2217',
        dark:    '#1a3d2a',
        base:    '#316d4c',
        mid:     '#56b07c',
        light:   '#78d9a0', // Signature Mint
        hi:      '#a4f2c2',
        spec:    '#d6fae6'
      },

      // Secondary Trim (Polished bamboo brass & warm cane)
      trim: {
        darkest: '#261a04',
        dark:    '#4a3508',
        base:    '#7a5a12',
        mid:     '#9b7818',
        light:   '#d4af37', // Bamboo Brass
        hi:      '#f5d76e',
        gleam:   '#fff8c4'
      },

      // Keys (Ivory keycaps, bamboo brass rings, dark green lettering)
      keys: {
        face:        '#fbf6e6',
        shade:       '#d8ceb2',
        facePressed: '#78d9a0',
        ring:        '#9b7818',
        ringHi:      '#f5d76e',
        letter:      '#133822', // Dark Green Lettering
        stem:        '#788ea8',
        shadow:      '#0e2217'
      },

      // Twin Exposed Ribbon
      ribbon: {
        left:  '#246428', // Forest Green Tape
        right: '#10080c'  // Carbon Black Tape
      },

      // Laid Paper Sheet
      paper: {
        base:       '#e4d4b2',
        light:      '#fbf6e6',
        dark:       '#baa882',
        marginLine: '#316d4c' // Sage margin
      },

      // Medallion Styling
      medallion: {
        plateBg:     '#f5d76e',
        plateDark:   '#4a3508',
        plateBorder: '#9b7818',
        textCol:     '#133822',
        textShadow:  '#d4af37',
        crestCol:    '#ffd700',
        jewelCol:    '#22c55e' // Jade / Emerald
      }
    },

    // -------------------------------------------------------------
    // MODEL 2: HIBISCUS RIBBON (Rose Pink)
    // -------------------------------------------------------------
    rose: {
      id: 'rose',
      modelNo: 2,
      name: 'Hibiscus Ribbon',
      shortName: 'Hibiscus Ribbon',
      badge: 'NO. 2',
      medallionText: 'HIBISCUS RIBBON NO. 2',
      wordsBand: '4–5 letters',
      deskIndex: 1,
      price: 2000,
      tagline: 'Soft vintage rose pink lacquer with crimson velvet & warm rose-gold',
      description: 'Lyrical and romantic salon typewriter. Finished in soft rose pink lacquer with deep crimson velvet accents, warm rose-gold pinstriping, cream keycaps, and deep ruby lettering.',

      // Primary Enamel Ramp (Soft vintage rose pink lacquer)
      primary: {
        darkest: '#280a14',
        dark:    '#481423',
        base:    '#822e44',
        mid:     '#c95c78',
        light:   '#f08aa4', // Signature Rose
        hi:      '#fbc2cf',
        spec:    '#ffe9ee'
      },

      // Secondary Trim (Crimson velvet & warm rose-gold)
      trim: {
        darkest: '#380512',
        dark:    '#5e0e22',
        base:    '#b02040', // Crimson Velvet
        mid:     '#c97f8c',
        light:   '#f7b2bd', // Warm Rose-Gold
        hi:      '#fce4ec',
        gleam:   '#ffffff'
      },

      // Keys (Soft cream keycaps, crimson rings, deep ruby lettering)
      keys: {
        face:        '#fdf5f0',
        shade:       '#e6d0c8',
        facePressed: '#f08aa4',
        ring:        '#b02040', // Crimson Ring
        ringHi:      '#f7b2bd', // Rose-Gold Rim Highlight
        letter:      '#5c0d20', // Deep Ruby Lettering
        stem:        '#a3b9d0',
        shadow:      '#280a14'
      },

      // Twin Exposed Ribbon
      ribbon: {
        left:  '#b02040', // Crimson Ribbon
        right: '#380512'  // Deep Plum Ink
      },

      // Paper Sheet
      paper: {
        base:       '#faeee7',
        light:      '#fff9f6',
        dark:       '#cfb8ad',
        marginLine: '#b02040' // Crimson margin
      },

      medallion: {
        plateBg:     '#fce4ec',
        plateDark:   '#5e0e22',
        plateBorder: '#c97f8c',
        textCol:     '#5c0d20',
        textShadow:  '#f7b2bd',
        crestCol:    '#f7b2bd',
        jewelCol:    '#e62244' // Ruby Gem
      }
    },

    // -------------------------------------------------------------
    // MODEL 3: LAGOON SPRINT (Ocean Blue)
    // -------------------------------------------------------------
    blue: {
      id: 'blue',
      modelNo: 3,
      name: 'Lagoon Sprint',
      shortName: 'Lagoon Sprint',
      badge: 'NO. 3',
      medallionText: 'LAGOON SPRINT NO. 3',
      wordsBand: '6–7 letters',
      deskIndex: 2,
      price: 25000,
      tagline: 'Oceanic aqua / lagoon blue with streamlined chrome & nautical brass',
      description: 'Streamlined coastal speedster. High-gloss oceanic aqua blue enamel with aircraft-grade aluminum, mirror-chrome carriage rail, nautical brass fittings, and cool ice-white keycaps with electric cyan highlights.',

      // Primary Enamel Ramp (Oceanic aqua / lagoon blue)
      primary: {
        darkest: '#071526',
        dark:    '#0d2745',
        base:    '#1d4d80',
        mid:     '#387ec4',
        light:   '#5fa8f0', // Signature Lagoon Blue
        hi:      '#94c8fa',
        spec:    '#d6ebff'
      },

      // Secondary Trim (Streamlined chrome & polished aluminum + nautical brass)
      trim: {
        darkest: '#1a2633',
        dark:    '#384c60',
        base:    '#5c748c', // Machined Slate Steel
        mid:     '#a3b9d0', // Polished Aluminum
        light:   '#e2ebf5', // Gleaming Chrome
        hi:      '#ffffff',
        gleam:   '#b4f2ff',
        nauticalBrass: '#e5c158',
        nauticalBrassDark: '#8c6c18'
      },

      // Keys (Cool ice-white keycaps, navy rings, electric cyan highlights)
      keys: {
        face:        '#eef5fc',
        shade:       '#bfd4e6',
        facePressed: '#5fa8f0',
        ring:        '#1d4d80', // Navy Ring
        ringHi:      '#00e5ff', // Electric Cyan Highlight
        letter:      '#0a1c33', // Deep Oceanic Navy Lettering
        stem:        '#e2ebf5',
        shadow:      '#071526'
      },

      // Twin Exposed Ribbon
      ribbon: {
        left:  '#00bcd4', // Cyan Ribbon
        right: '#0d2745'  // Deep Navy Tape
      },

      paper: {
        base:       '#e8eff7',
        light:      '#ffffff',
        dark:       '#b2c2d4',
        marginLine: '#00bcd4' // Cyan margin
      },

      medallion: {
        plateBg:     '#e2ebf5',
        plateDark:   '#0d2745',
        plateBorder: '#387ec4',
        textCol:     '#0a1c33',
        textShadow:  '#94c8fa',
        crestCol:    '#e5c158', // Nautical Brass Crown
        jewelCol:    '#00e5ff'  // Aquamarine
      }
    },

    // -------------------------------------------------------------
    // MODEL 4: HONEYCOMB LEDGER (Amber Gold)
    // -------------------------------------------------------------
    amber: {
      id: 'amber',
      modelNo: 4,
      name: 'Honeycomb Ledger',
      shortName: 'Honeycomb Ledger',
      badge: 'NO. 4',
      medallionText: 'HONEYCOMB LEDGER NO. 4',
      wordsBand: '8–9 letters',
      deskIndex: 3,
      price: 312500,
      tagline: 'Rich warm amber / honeycomb gold with aged bronze & dark mahogany',
      description: 'Stately high-counting ledger engine. Warm honeycomb amber enamel with aged antique bronze castings, polished dark mahogany woodgrain trim, and parchment keycaps with dark sepia lettering.',

      // Primary Enamel Ramp (Rich warm amber / honeycomb gold)
      primary: {
        darkest: '#211400',
        dark:    '#3b2401',
        base:    '#754c06',
        mid:     '#ba7f18',
        light:   '#f2b23a', // Signature Honeycomb Gold
        hi:      '#fad675',
        spec:    '#fff0bd'
      },

      // Secondary Trim (Aged bronze & polished dark mahogany)
      trim: {
        darkest: '#1c0e04',
        dark:    '#402008', // Dark Mahogany Shadow
        base:    '#804010', // Rich Mahogany Woodgrain
        mid:     '#b86818', // Antique Bronze
        light:   '#e0a020', // Burnished Bronze
        hi:      '#ffd266',
        gleam:   '#fff2b8'
      },

      // Keys (Warm parchment keycaps, antique bronze bezels, dark sepia lettering)
      keys: {
        face:        '#f6eedc',
        shade:       '#d6c4a5',
        facePressed: '#f2b23a',
        ring:        '#754c06', // Antique Bronze
        ringHi:      '#e0a020', // Burnished Bronze Highlight
        letter:      '#3b2401', // Dark Sepia Lettering
        stem:        '#804010',
        shadow:      '#211400'
      },

      ribbon: {
        left:  '#804010', // Rich Sepia Ribbon
        right: '#211400'  // Pitch Carbon
      },

      paper: {
        base:       '#eee1c6',
        light:      '#faf5ea',
        dark:       '#c8b28f',
        marginLine: '#754c06' // Sepia margin
      },

      medallion: {
        plateBg:     '#ffd266',
        plateDark:   '#3b2401',
        plateBorder: '#804010',
        textCol:     '#3b2401',
        textShadow:  '#fad675',
        crestCol:    '#e0a020',
        jewelCol:    '#f59e0b' // Amber Citrine
      }
    },

    // -------------------------------------------------------------
    // MODEL 5: ORCHID IMPERIAL (Royal Purple)
    // -------------------------------------------------------------
    orchid: {
      id: 'orchid',
      modelNo: 5,
      name: 'Orchid Imperial',
      shortName: 'Orchid Imperial',
      badge: 'NO. 5',
      medallionText: 'ORCHID IMPERIAL NO. 5',
      wordsBand: '10–11 letters',
      deskIndex: 4,
      price: 3906250,
      tagline: 'Royal imperial purple / velvet violet with ornate gilded 24K gold leafing',
      description: 'Aristocratic salon masterpiece. Royal imperial purple velvet enamel finished with ornate 24K gold leaf scrollwork, royal dark obsidian keycaps with sparkling gold rims and gold lettering.',

      // Primary Enamel Ramp (Royal imperial purple / velvet violet)
      primary: {
        darkest: '#150a26',
        dark:    '#271447',
        base:    '#4f2e87',
        mid:     '#8357c9',
        light:   '#b58cf0', // Signature Imperial Purple
        hi:      '#d7befa',
        spec:    '#f2e8ff'
      },

      // Secondary Trim (Ornate gilded 24K gold leafing)
      trim: {
        darkest: '#332000',
        dark:    '#593a00',
        base:    '#9e6a00',
        mid:     '#ffae00', // Deep Gold Leaf
        light:   '#ffd700', // Gilded 24K Gold
        hi:      '#fff080', // Radiant Gleam
        gleam:   '#ffffff'
      },

      // Keys (Royal dark obsidian keycaps, sparkling gold rims, gold lettering)
      keys: {
        face:        '#221238', // Royal Dark Obsidian
        shade:       '#140924',
        facePressed: '#8357c9',
        ring:        '#ffae00', // Gold Rim
        ringHi:      '#ffd700', // 24K Sparkle Rim
        letter:      '#ffd700', // Radiant Gold Lettering
        stem:        '#ffd700',
        shadow:      '#150a26'
      },

      ribbon: {
        left:  '#7b2cb0', // Imperial Violet
        right: '#150a26'  // Midnight Black Tape
      },

      paper: {
        base:       '#eae4f5',
        light:      '#f9f6fd',
        dark:       '#b9abc9',
        marginLine: '#4f2e87' // Violet margin
      },

      medallion: {
        plateBg:     '#ffd700',
        plateDark:   '#271447',
        plateBorder: '#9e6a00',
        textCol:     '#271447',
        textShadow:  '#fff080',
        crestCol:    '#ffd700',
        jewelCol:    '#8357c9' // Imperial Amethyst
      }
    },

    // -------------------------------------------------------------
    // MODEL 6: MOONFLOWER GRAND (Pearlescent Platinum)
    // -------------------------------------------------------------
    moon: {
      id: 'moon',
      modelNo: 6,
      name: 'Moonflower Grand',
      shortName: 'Moonflower Grand',
      badge: 'NO. 6',
      medallionText: 'MOONFLOWER GRAND NO. 6',
      wordsBand: '12–13 letters',
      deskIndex: 5,
      price: 48828125,
      tagline: 'Iridescent pearlescent platinum with mirror sterling silver & luminous ice-cyan',
      description: 'The crowning jewel of mechanical typistry. Iridescent pearlescent platinum white lacquer, mirror-polished sterling silver carriage rails, mother-of-pearl keycaps, and luminous ice-cyan radiance.',

      // Primary Enamel Ramp (Iridescent pearlescent platinum white)
      primary: {
        darkest: '#1e2230',
        dark:    '#394059',
        base:    '#7680a3',
        mid:     '#b8c0d9',
        light:   '#dfe3f2', // Signature Pearlescent Platinum
        hi:      '#f6f8fd',
        spec:    '#ffffff'
      },

      // Secondary Trim (Mirror-polished sterling silver & luminous ice-cyan)
      trim: {
        darkest: '#26323d',
        dark:    '#445869',
        base:    '#728c9f',
        mid:     '#88d4e4', // Luminous Ice-Cyan Sheen
        light:   '#c8f4f9', // Polished Silver Cyan
        hi:      '#ffffff', // Pure Sterling Mirror Glint
        gleam:   '#d4fbff'
      },

      // Keys (Polished mother-of-pearl keycaps, silver bezels, cyan lettering)
      keys: {
        face:        '#f5f7fc', // Polished Mother-of-Pearl
        shade:       '#cbd3e6',
        facePressed: '#c8f4f9',
        ring:        '#7680a3', // Sterling Silver Bezel
        ringHi:      '#ffffff',
        letter:      '#2b3447', // Deep Slate with Cyan Tint
        stem:        '#dfe3f2',
        shadow:      '#1e2230'
      },

      ribbon: {
        left:  '#56cfe1', // Ice-Cyan Ribbon
        right: '#26323d'  // Slate Carbon Tape
      },

      paper: {
        base:       '#eef2f9',
        light:      '#ffffff',
        dark:       '#b9c3d4',
        marginLine: '#88d4e4' // Cyan margin
      },

      medallion: {
        plateBg:     '#c8f4f9',
        plateDark:   '#26323d',
        plateBorder: '#7680a3',
        textCol:     '#2b3447',
        textShadow:  '#ffffff',
        crestCol:    '#ffffff', // Platinum Crown
        jewelCol:    '#56cfe1'  // Cyan Diamond
      }
    }
  };

  /* ===============================================================
   * 3. RESTORATION TIERS: MK I, MK II, MK III
   * Upgrades add pinstriping, gold leafing, custom medallions,
   * gleaming carriage chrome and royal crests.
   * =============================================================== */
  const RESTORATION_TIERS = {
    1: {
      level: 1,
      id: 'mk1',
      code: 'MK I',
      name: 'Mk I - Standard Overhaul',
      pinstripeStyle: 'single',
      pinstripeCount: 1,
      spoolGrade: 'satin',
      carriageFinish: 'polished',
      medallionStyle: 'classic',
      hasCrownCrest: false,
      hasGoldLeafScrolls: false,
      description: 'Base restoration with high-gloss factory enamel, single brass/silver pinstripe, and riveted brass medallion.'
    },
    2: {
      level: 2,
      id: 'mk2',
      code: 'MK II',
      name: 'Mk II - Artisan Double-Stripe',
      pinstripeStyle: 'double',
      pinstripeCount: 2,
      spoolGrade: 'brass_flanged',
      carriageFinish: 'gold_accented',
      medallionStyle: 'corner_rosettes',
      hasCrownCrest: false,
      hasGoldLeafScrolls: true,
      description: 'Artisan restoration featuring double-ring gold pinstripes, gold carriage accents, polished brass ribbon spools, and rosette-bracketed plaque.'
    },
    3: {
      level: 3,
      id: 'mk3',
      code: 'MK III',
      name: 'Mk III - Grand Imperial Masterpiece',
      pinstripeStyle: 'filigree',
      pinstripeCount: 3,
      spoolGrade: 'jeweled_crest',
      carriageFinish: 'radiant_chrome_gold',
      medallionStyle: 'regal_crown',
      hasCrownCrest: true,
      hasGoldLeafScrolls: true,
      description: 'Museum-grade royal restoration boasting handcrafted 16-bit crown crest on medallion, gleaming gold leaf borders, radiant carriage chrome, and gemstone rivets.'
    }
  };

  /**
   * Normalize model ID (handles keys, numbers 1-6, uppercase, etc.)
   */
  function normalizeModelId(modelId) {
    if (!modelId) return 'mint';
    const s = String(modelId).toLowerCase().trim();
    if (TYPEWRITER_MODELS[s]) return s;
    if (s === '1' || s === 'bamboo') return 'mint';
    if (s === '2' || s === 'hibiscus') return 'rose';
    if (s === '3' || s === 'lagoon') return 'blue';
    if (s === '4' || s === 'honeycomb') return 'amber';
    if (s === '5' || s === 'orchid') return 'orchid';
    if (s === '6' || s === 'moonflower') return 'moon';
    return 'mint';
  }

  /**
   * Normalize restoration tier level (1, 2, 3)
   */
  function normalizeMkLevel(tier) {
    if (tier === 2 || tier === '2' || tier === 'mk2' || tier === 'mkii' || tier === 'Mk II') return 2;
    if (tier === 3 || tier === '3' || tier === 'mk3' || tier === 'mkiii' || tier === 'Mk III') return 3;
    return 1;
  }

  /**
   * Get full typewriter color palette and styling specifications.
   *
   * @param {string|number} modelId Model ID ('mint', 'rose', 'blue', 'amber', 'orchid', 'moon')
   * @param {number|string} mkLevel Restoration tier (1, 2, or 3)
   * @returns {Object} Complete palette overrides compatible with ProtoEngine and custom renderers
   */
  function getTypewriterPalette(modelId, mkLevel) {
    const mId = normalizeModelId(modelId);
    const mk = normalizeMkLevel(mkLevel);
    const model = TYPEWRITER_MODELS[mId];
    const tier = RESTORATION_TIERS[mk];

    // Determine Pinstripe colors based on Tier
    let pinstripePrimary = model.trim.mid;
    let pinstripeSecondary = model.trim.light;
    let pinstripeGleam = model.trim.hi;
    let carriageRailColor = model.trim.light;
    let carriageRailHi = model.trim.hi;

    if (mk === 2) {
      pinstripePrimary = model.trim.light;
      pinstripeSecondary = model.trim.hi;
      carriageRailColor = model.trim.light;
      carriageRailHi = model.trim.gleam;
    } else if (mk === 3) {
      pinstripePrimary = model.trim.hi;
      pinstripeSecondary = model.trim.gleam;
      pinstripeGleam = '#ffffff';
      carriageRailColor = model.trim.hi;
      carriageRailHi = '#ffffff';
    }

    // Compose rich theme object
    return {
      // Model & Tier Metadata
      id: model.id,
      name: model.name,
      shortName: model.shortName,
      modelNo: model.modelNo,
      medallionText: model.medallionText,
      tagline: model.tagline,
      description: model.description,
      mkLevel: mk,
      mkName: tier.code,
      tierTitle: tier.name,

      // ProtoEngine backward-compatible flat color mappings
      ironBlack:  model.primary.darkest,
      ironDark:   model.primary.dark,
      ironMid:    model.primary.base,
      ironLight:  model.primary.mid,
      ironHi:     model.primary.light,
      ironSpec:   model.primary.hi,

      brassDark:  model.trim.dark,
      brassBase:  model.trim.base,
      brassMid:   model.trim.mid,
      brassLight: model.trim.light,
      brassHi:    model.trim.hi,

      paperDark:  model.paper.dark,
      paperBase:  model.paper.base,
      paperLight: model.paper.light,
      paperWhite: '#ffffff',
      paperMargin: model.paper.marginLine,

      keyCapRim:   model.keys.ring,
      keyCapRimHi: model.keys.ringHi,
      keyFace:     model.keys.face,
      keyShade:    model.keys.shade,
      keyLetter:   model.keys.letter,
      keyStem:     model.keys.stem,

      inkBlack: model.ribbon.right,
      inkDark:  model.primary.darkest,
      redDark:  model.ribbon.left,
      redBase:  model.ribbon.left,
      redLight: model.trim.light,
      redHi:    model.trim.hi,

      // Structured Sub-Palettes
      chassis: {
        darkest:            model.primary.darkest,
        dark:               model.primary.dark,
        base:               model.primary.base,
        mid:                model.primary.mid,
        light:              model.primary.light,
        hi:                 model.primary.hi,
        spec:               model.primary.spec,
        pinstripePrimary:   pinstripePrimary,
        pinstripeSecondary: pinstripeSecondary,
        pinstripeGleam:     pinstripeGleam,
        shadow:             'rgba(0,0,0,0.55)'
      },

      trim: {
        darkest: model.trim.darkest,
        dark:    model.trim.dark,
        base:    model.trim.base,
        mid:     model.trim.mid,
        light:   model.trim.light,
        hi:      model.trim.hi,
        gleam:   model.trim.gleam,
        jewel:   model.medallion.jewelCol
      },

      keys: {
        face:        model.keys.face,
        shade:       model.keys.shade,
        facePressed: model.keys.facePressed,
        ring:        model.keys.ring,
        ringHi:      model.keys.ringHi,
        letter:      model.keys.letter,
        stem:        model.keys.stem,
        shadow:      model.keys.shadow
      },

      carriage: {
        railBase:    carriageRailColor,
        railDark:    model.primary.dark,
        railHi:      carriageRailHi,
        railSpec:    model.trim.gleam,
        platenDark:  '#0c0e12',
        platenBase:  '#181e26',
        platenFlute: '#10141a',
        platenHi:    '#3a4a5e',
        knobDark:    model.trim.dark,
        knobLight:   model.trim.light,
        knobHi:      model.trim.hi,
        leverBase:   model.trim.base,
        leverLight:  model.trim.light,
        leverHi:     model.trim.hi,
        bellDark:    model.trim.dark,
        bellLight:   model.trim.light,
        bellHi:      model.trim.hi
      },

      spool: {
        rim:       model.trim.base,
        flange:    model.trim.mid,
        tapeLeft:  model.ribbon.left,
        tapeRight: model.ribbon.right,
        cutout:    model.trim.dark,
        center:    model.trim.hi,
        spokeGrade: tier.spoolGrade
      },

      medallion: {
        plateBg:     model.medallion.plateBg,
        plateDark:   model.medallion.plateDark,
        plateBorder: model.medallion.plateBorder,
        textCol:     model.medallion.textCol,
        textShadow:  model.medallion.textShadow,
        crestCol:    model.medallion.crestCol,
        jewelCol:    model.medallion.jewelCol,
        tierName:    tier.code,
        hasCrown:    tier.hasCrownCrest,
        hasScrolls:  tier.hasGoldLeafScrolls
      }
    };
  }

  /* ===============================================================
   * 4. AUTHENTIC 16-BIT MEDALLION PIXEL ART RASTERIZER
   * Zero vector blur. Draws brass plate, borders, rivets,
   * corner rosettes, 4x5 text, and Mk III royal crown crest.
   * =============================================================== */
  /**
   * Draw the authentic 16-bit Typewriter Medallion.
   *
   * @param {CanvasRenderingContext2D} ctx Destination 2D context
   * @param {string|number} modelId Model ID ('mint', 'rose', 'blue', 'amber', 'orchid', 'moon')
   * @param {number|string} mkLevel Restoration Tier (1, 2, 3)
   * @param {number} cx Center X on canvas (e.g. 192)
   * @param {number} cy Center Y on canvas (e.g. 108)
   */
  function drawTypewriterMedallion(ctx, modelId, mkLevel, cx, cy) {
    const pal = getTypewriterPalette(modelId, mkLevel);
    const m = pal.medallion;
    const t = pal.trim;
    const mk = pal.mkLevel;

    const snapX = Math.round(cx);
    const snapY = Math.round(cy);

    // Plate geometry
    const plateW = 124;
    const plateH = 14;
    const leftX = snapX - Math.floor(plateW / 2);
    const topY = snapY - Math.floor(plateH / 2);

    // -------------------------------------------------------------
    // A. DROP SHADOW ON CHASSIS
    // -------------------------------------------------------------
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(leftX + 1, topY + 1, plateW, plateH);

    // -------------------------------------------------------------
    // B. MK III WINGED GOLD LEAF SCROLLWORK FLANGES
    // -------------------------------------------------------------
    if (m.hasScrolls) {
      const scrollCol = mk === 3 ? t.hi : t.mid;
      const scrollDark = t.dark;

      // Left Flange Wing (3-tier stepped gold bracket)
      ctx.fillStyle = scrollDark;
      ctx.fillRect(leftX - 5, topY + 2, 5, 10);
      ctx.fillRect(leftX - 8, topY + 4, 3, 6);
      ctx.fillStyle = scrollCol;
      ctx.fillRect(leftX - 4, topY + 3, 4, 8);
      ctx.fillRect(leftX - 7, topY + 5, 3, 4);
      ctx.fillStyle = t.gleam;
      ctx.fillRect(leftX - 7, topY + 6, 1, 2);

      // Right Flange Wing
      ctx.fillStyle = scrollDark;
      ctx.fillRect(leftX + plateW, topY + 2, 5, 10);
      ctx.fillRect(leftX + plateW + 5, topY + 4, 3, 6);
      ctx.fillStyle = scrollCol;
      ctx.fillRect(leftX + plateW, topY + 3, 4, 8);
      ctx.fillRect(leftX + plateW + 4, topY + 5, 3, 4);
      ctx.fillStyle = t.gleam;
      ctx.fillRect(leftX + plateW + 6, topY + 6, 1, 2);
    }

    // -------------------------------------------------------------
    // C. MEDALLION RIM & BEVELED BASE
    // -------------------------------------------------------------
    ctx.fillStyle = m.plateDark;
    ctx.fillRect(leftX, topY, plateW, plateH);

    // Outer Trim Chamfer
    ctx.fillStyle = t.mid;
    ctx.fillRect(leftX + 1, topY + 1, plateW - 2, plateH - 2);

    // Inner Inlay Plate Body
    ctx.fillStyle = m.plateBg;
    ctx.fillRect(leftX + 2, topY + 2, plateW - 4, plateH - 4);

    // -------------------------------------------------------------
    // D. PINSTRIPING (Mk I single, Mk II/III double gold leaf)
    // -------------------------------------------------------------
    ctx.fillStyle = m.plateBorder;
    ctx.fillRect(leftX + 3, topY + 3, plateW - 6, 1);
    ctx.fillRect(leftX + 3, topY + plateH - 4, plateW - 6, 1);
    ctx.fillRect(leftX + 3, topY + 3, 1, plateH - 6);
    ctx.fillRect(leftX + plateW - 4, topY + 3, 1, plateH - 6);

    if (mk >= 2) {
      // Secondary Inner Inset Pinstripe (Double-Ring)
      ctx.fillStyle = t.hi;
      ctx.fillRect(leftX + 5, topY + 4, plateW - 10, 1);
      ctx.fillRect(leftX + 5, topY + plateH - 5, plateW - 10, 1);

      // Corner Rosettes (4-corner 2x2 golden diamond ornaments)
      const drawRosette = (rx, ry) => {
        ctx.fillStyle = t.hi;
        ctx.fillRect(rx, ry - 1, 1, 3);
        ctx.fillRect(rx - 1, ry, 3, 1);
        ctx.fillStyle = t.gleam;
        ctx.fillRect(rx, ry, 1, 1);
      };
      drawRosette(leftX + 6, topY + 6);
      drawRosette(leftX + plateW - 7, topY + 6);
      drawRosette(leftX + 6, topY + plateH - 7);
      drawRosette(leftX + plateW - 7, topY + plateH - 7);
    }

    // -------------------------------------------------------------
    // E. CORNER RIVETS / SCREWS
    // -------------------------------------------------------------
    const drawRivet = (rx, ry) => {
      ctx.fillStyle = m.plateDark;
      ctx.fillRect(rx, ry, 2, 2);
      ctx.fillStyle = mk === 3 ? m.jewelCol : t.gleam;
      ctx.fillRect(rx, ry, 1, 1); // Specular highlight or jewel
    };
    drawRivet(leftX + 2, topY + 2);
    drawRivet(leftX + plateW - 4, topY + 2);
    drawRivet(leftX + 2, topY + plateH - 4);
    drawRivet(leftX + plateW - 4, topY + plateH - 4);

    // -------------------------------------------------------------
    // F. CRISP 4x5 BITMAP TITLE TEXT
    // -------------------------------------------------------------
    const titleText = pal.medallionText;
    const textMeas = measurePixelText(titleText, 5);
    const textX = Math.round(snapX - textMeas.width / 2);
    const textY = Math.round(topY + (plateH - 5) / 2);

    // Subtle 1px Drop Shadow for Lettering Contrast
    if (m.textShadow) {
      drawPixelText(ctx, titleText, textX, textY + 1, m.textShadow, 5);
    }
    // Main Glyph Lettering
    drawPixelText(ctx, titleText, textX, textY, m.textCol, 5);

    // -------------------------------------------------------------
    // G. MK II / MK III TIER INSIGNIA
    // -------------------------------------------------------------
    if (mk === 2) {
      // Small "MK II" badge in lower right corner or flank dots
      ctx.fillStyle = t.hi;
      ctx.fillRect(leftX + 11, topY + 6, 2, 2);
      ctx.fillRect(leftX + plateW - 13, topY + 6, 2, 2);
    }

    // -------------------------------------------------------------
    // H. MK III REGAL CROWN CREST (Perched atop center plaque)
    // Handcrafted 16-bit pixel crown with golden spires & ruby jewel!
    // -------------------------------------------------------------
    if (m.hasCrown) {
      const crownCx = snapX;
      const crownBaseY = topY - 1; // Rests exactly on top edge

      // Crown Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(crownCx - 7, crownBaseY - 6, 14, 7);

      // Base Gold Band (13x2 px)
      ctx.fillStyle = t.dark;
      ctx.fillRect(crownCx - 7, crownBaseY - 2, 14, 3);
      ctx.fillStyle = t.mid;
      ctx.fillRect(crownCx - 6, crownBaseY - 2, 12, 2);
      ctx.fillStyle = t.hi;
      ctx.fillRect(crownCx - 5, crownBaseY - 2, 10, 1);

      // Velvet Arch Dome Backdrop inside Crown
      ctx.fillStyle = pal.ironMid;
      ctx.fillRect(crownCx - 5, crownBaseY - 5, 10, 3);

      // 5 Radiating Golden Spires
      // Center Spire (Tallest, Cross & Pearl, H: 7px)
      ctx.fillStyle = t.hi;
      ctx.fillRect(crownCx - 1, crownBaseY - 7, 2, 5);
      ctx.fillStyle = t.gleam;
      ctx.fillRect(crownCx - 1, crownBaseY - 8, 2, 1); // Pearl Top
      ctx.fillRect(crownCx - 2, crownBaseY - 6, 4, 1); // Cross arms

      // Left Flank Spire (H: 5px)
      ctx.fillStyle = t.mid;
      ctx.fillRect(crownCx - 4, crownBaseY - 5, 1, 3);
      ctx.fillStyle = t.hi;
      ctx.fillRect(crownCx - 4, crownBaseY - 6, 1, 1); // Pearl

      // Right Flank Spire (H: 5px)
      ctx.fillStyle = t.mid;
      ctx.fillRect(crownCx + 3, crownBaseY - 5, 1, 3);
      ctx.fillStyle = t.hi;
      ctx.fillRect(crownCx + 3, crownBaseY - 6, 1, 1); // Pearl

      // Far Left Spire (H: 4px)
      ctx.fillStyle = t.mid;
      ctx.fillRect(crownCx - 6, crownBaseY - 4, 1, 2);
      ctx.fillStyle = t.gleam;
      ctx.fillRect(crownCx - 6, crownBaseY - 5, 1, 1);

      // Far Right Spire (H: 4px)
      ctx.fillStyle = t.mid;
      ctx.fillRect(crownCx + 5, crownBaseY - 4, 1, 2);
      ctx.fillStyle = t.gleam;
      ctx.fillRect(crownCx + 5, crownBaseY - 5, 1, 1);

      // Central Gemstone on Crown Base (Ruby / Emerald / Aquamarine)
      ctx.fillStyle = m.jewelCol;
      ctx.fillRect(crownCx - 1, crownBaseY - 2, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(crownCx - 1, crownBaseY - 2, 1, 1); // Gem Glint

      // Flank Gem Dots
      ctx.fillStyle = t.darkest;
      ctx.fillRect(crownCx - 4, crownBaseY - 2, 1, 1);
      ctx.fillRect(crownCx + 3, crownBaseY - 2, 1, 1);

      // Radiating 4-Point Specular Starburst on Upper Corner
      const starX = leftX + plateW - 4;
      const starY = topY - 2;
      ctx.fillStyle = t.gleam;
      ctx.fillRect(starX, starY - 2, 1, 5);
      ctx.fillRect(starX - 2, starY, 5, 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(starX, starY, 1, 1);
    }
  }

  /* ===============================================================
   * 5. FULL TYPEWRITER CHASSIS & PINSTRIPE RASTERIZER
   * Renders the authentic tiered cast-iron / enamel body.
   * =============================================================== */
  /**
   * Draw the typewriter chassis with model-specific enamel & tiered pinstriping.
   */
  function drawTypewriterChassis(ctx, modelId, mkLevel, cx, cy, options = {}) {
    const pal = getTypewriterPalette(modelId, mkLevel);
    const snap = (v) => Math.round(v);
    const c = pal.chassis;
    const t = pal.trim;
    const mk = pal.mkLevel;

    const width = options.width || 252;
    const height = options.height || 96;
    const left = snap(cx - width / 2);
    const top = snap(cy - 43);

    // 1. Chassis Outer Base (Deep Shadow Enamel)
    ctx.fillStyle = c.darkest;
    ctx.fillRect(left, top, width, height);

    // 2. Main Enamel Coat
    ctx.fillStyle = c.dark;
    ctx.fillRect(left + 2, top + 2, width - 4, height - 4);

    // 3. Chamfer Upper Highlight Sheen
    ctx.fillStyle = c.base;
    ctx.fillRect(left + 3, top + 3, width - 6, 2);
    ctx.fillStyle = c.light;
    ctx.fillRect(left + width / 4, top + 3, width / 2, 1); // Central light flare

    // 4. Pinstripes according to Restoration Tier
    const stripeMargin = 5;
    const sLeft = left + stripeMargin;
    const sTop = top + stripeMargin;
    const sW = width - stripeMargin * 2;
    const sH = height - stripeMargin * 2;

    // Single / Primary Pinstripe (All Tiers)
    ctx.fillStyle = c.pinstripePrimary;
    ctx.fillRect(sLeft, sTop, sW, 1);
    ctx.fillRect(sLeft, sTop + sH - 1, sW, 1);
    ctx.fillRect(sLeft, sTop, 1, sH);
    ctx.fillRect(sLeft + sW - 1, sTop, 1, sH);

    // Mk II Double-Ring Pinstripe
    if (mk >= 2) {
      const inset = 3;
      ctx.fillStyle = c.pinstripeSecondary;
      ctx.fillRect(sLeft + inset, sTop + inset, sW - inset * 2, 1);
      ctx.fillRect(sLeft + inset, sTop + sH - 1 - inset, sW - inset * 2, 1);
      ctx.fillRect(sLeft + inset, sTop + inset, 1, sH - inset * 2);
      ctx.fillRect(sLeft + sW - 1 - inset, sTop + inset, 1, sH - inset * 2);

      // Corner Brackets
      const drawCornerBracket = (bx, by, dx, dy) => {
        ctx.fillStyle = t.hi;
        ctx.fillRect(bx, by, 3 * dx, 1);
        ctx.fillRect(bx, by, 1, 3 * dy);
      };
      drawCornerBracket(sLeft + inset, sTop + inset, 1, 1);
      drawCornerBracket(sLeft + sW - 1 - inset, sTop + inset, -1, 1);
      drawCornerBracket(sLeft + inset, sTop + sH - 1 - inset, 1, -1);
      drawCornerBracket(sLeft + sW - 1 - inset, sTop + sH - 1 - inset, -1, -1);
    }

    // Mk III Grand Imperial Filigree Corners & Gold Leaf Crest
    if (mk === 3) {
      const drawFiligreeCorner = (fx, fy, dirX, dirY) => {
        ctx.fillStyle = t.hi;
        ctx.fillRect(fx, fy, 4 * dirX, 1);
        ctx.fillRect(fx, fy, 1, 4 * dirY);
        ctx.fillRect(fx + 2 * dirX, fy + 2 * dirY, 2 * dirX, 1);
        ctx.fillStyle = t.gleam;
        ctx.fillRect(fx + dirX, fy + dirY, 1, 1);
      };
      drawFiligreeCorner(sLeft + 1, sTop + 1, 1, 1);
      drawFiligreeCorner(sLeft + sW - 2, sTop + 1, -1, 1);
      drawFiligreeCorner(sLeft + 1, sTop + sH - 2, 1, -1);
      drawFiligreeCorner(sLeft + sW - 2, sTop + sH - 2, -1, -1);
    }

    // 5. Heavy Rubber Feet
    ctx.fillStyle = c.darkest;
    ctx.fillRect(left + 1, top + height - 2, 18, 6);
    ctx.fillRect(left + width - 19, top + height - 2, 18, 6);
    ctx.fillStyle = '#0a0d12';
    ctx.fillRect(left + 3, top + height + 2, 14, 3);
    ctx.fillRect(left + width - 17, top + height + 2, 14, 3);

    // 6. Draw Centered Medallion Plaque
    const medY = top + 10;
    drawTypewriterMedallion(ctx, modelId, mkLevel, cx, medY);
  }

  /* ---------------------------------------------------------------
   * PURE PIXEL ART RASTER HELPERS (ZERO VECTOR ARC/ELLIPSE BLUR)
   * --------------------------------------------------------------- */
  function drawSteppedCircle(ctx, cx, cy, r, col) {
    if (!col) return;
    ctx.fillStyle = col;
    const x0 = Math.floor(cx - r), y0 = Math.floor(cy - r);
    const x1 = Math.ceil(cx + r),  y1 = Math.ceil(cy + r);
    const rSq = r * r;
    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        const dx = px + 0.5 - cx, dy = py + 0.5 - cy;
        if (dx * dx + dy * dy <= rSq) {
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }
  }

  function drawSteppedRing(ctx, cx, cy, r, thickness, col) {
    if (!col) return;
    ctx.fillStyle = col;
    const rOuter = r + thickness / 2;
    const rInner = Math.max(0, r - thickness / 2);
    const x0 = Math.floor(cx - rOuter), y0 = Math.floor(cy - rOuter);
    const x1 = Math.ceil(cx + rOuter),  y1 = Math.ceil(cy + rOuter);
    const rOutSq = rOuter * rOuter;
    const rInSq = rInner * rInner;
    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        const dx = px + 0.5 - cx, dy = py + 0.5 - cy;
        const dSq = dx * dx + dy * dy;
        if (dSq <= rOutSq && dSq >= rInSq) {
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }
  }

  function drawSteppedSemicircle(ctx, cx, cy, r, col, strokeCol) {
    if (col) {
      ctx.fillStyle = col;
      const x0 = Math.floor(cx - r), y0 = Math.floor(cy);
      const x1 = Math.ceil(cx + r),  y1 = Math.ceil(cy + r);
      const rSq = r * r;
      for (let py = y0; py <= y1; py++) {
        for (let px = x0; px <= x1; px++) {
          const dx = px + 0.5 - cx, dy = py + 0.5 - cy;
          if (dy >= 0 && dx * dx + dy * dy <= rSq) {
            ctx.fillRect(px, py, 1, 1);
          }
        }
      }
    }
    if (strokeCol) {
      drawSteppedRing(ctx, cx, cy, r, 2, strokeCol);
    }
  }

  /* ===============================================================
   * 6. TYPEWRITER SPOOLS & CARRIAGE ACCENTS
   * =============================================================== */
  /**
   * Draw exposed ribbon spool with tier styling.
   */
  function drawTypewriterSpool(ctx, sx, sy, angle, isLeft, modelId, mkLevel) {
    const pal = getTypewriterPalette(modelId, mkLevel);
    const sp = pal.spool;
    const t = pal.trim;
    const mk = pal.mkLevel;

    // Spool Cavity Shadow (100% Pure Stepped Pixel Art)
    drawSteppedCircle(ctx, sx, sy, 18, '#0a0d10');

    // Outer Flange Rim
    drawSteppedCircle(ctx, sx, sy, 16, mk >= 2 ? t.light : sp.rim);

    // Wound Ribbon Tape
    drawSteppedCircle(ctx, sx, sy, 13, isLeft ? sp.tapeLeft : sp.tapeRight);

    // 4 Stepped Brass Spokes
    for (let i = 0; i < 4; i++) {
      const spokeAng = angle + (i * Math.PI / 2);
      const px = sx + Math.cos(spokeAng) * 7;
      const py = sy + Math.sin(spokeAng) * 7;
      drawSteppedCircle(ctx, Math.round(px), Math.round(py), 3, sp.cutout);
    }

    // Center Spindle Pinion
    drawSteppedCircle(ctx, sx, sy, 4, mk === 3 ? t.gleam : sp.center);

    // Mk III Crown Star Center Jewel
    if (mk === 3) {
      ctx.fillStyle = pal.medallion.jewelCol;
      ctx.fillRect(Math.round(sx - 1), Math.round(sy - 1), 2, 2);
    }
  }

  /* ===============================================================
   * 7. COMPLETE TYPEWRITER STAGE RASTERIZER (THEME ENGINE CORE)
   * Full authentic 16-bit rendering implementing model enamel,
   * trims, keyed fonts, spools, paper, and tiered restoration.
   * =============================================================== */
  function renderTypewriterStyled(stage, g, snap) {
    if (!stage) return;
    const modelId = stage.modelId || 'mint';
    const mkLevel = stage.mkLevel || 1;
    const pal = stage.palette || getTypewriterPalette(modelId, mkLevel);
    const cx = 192;
    const cy = 145;
    const carX = snap(cx + (stage.carriageX || 0));

    // ==========================================
    // LAYER A: MOVING CARRIAGE & FLUTED RUBBER PLATEN
    // ==========================================
    g.save();
    g.translate(carX, 68);

    // Carriage Frame Rail Base (Cast Iron & Polished Steel / Model Trim)
    g.fillStyle = pal.ironBlack;
    g.fillRect(-116, -7, 232, 22);
    g.fillStyle = pal.ironDark;
    g.fillRect(-114, -5, 228, 18);
    g.fillStyle = pal.ironMid;
    g.fillRect(-114, -5, 228, 2);
    g.fillStyle = pal.carriage ? pal.carriage.railHi : pal.ironHi;
    g.fillRect(-114, 11, 228, 2);

    // Fluted Rubber Platen Cylinder (-96 to 96, H: 18)
    g.fillStyle = '#0c0e12';
    g.fillRect(-96, -12, 192, 18);
    g.fillStyle = '#181e26';
    g.fillRect(-96, -11, 192, 16);
    g.fillStyle = '#26303e';
    g.fillRect(-96, -10, 192, 12);
    g.fillStyle = '#3a4a5e';
    g.fillRect(-96, -9, 192, 4); // Specular highlight

    // Rotating Rubber Flutes (Visible Treadmill Grooves)
    g.fillStyle = '#10141a';
    const fluteScroll = Math.round(((stage.platenAngle || 0) * 10) % 4);
    for (let fy = -11 + fluteScroll; fy <= 4; fy += 4) {
      g.fillRect(-96, fy, 192, 1);
    }

    // Platen Knurled Knobs (Left & Right) with Rotating Ridges
    const drawKnurledKnob = (kx) => {
      g.fillStyle = pal.ironBlack;
      g.fillRect(kx - 1, -16, 13, 26);
      g.fillStyle = pal.brassDark;
      g.fillRect(kx, -15, 11, 24);
      g.fillStyle = pal.brassLight;
      g.fillRect(kx + 2, -13, 7, 20);

      // Vertical knurling notches shifting with platenAngle
      const notchOff = Math.round(((stage.platenAngle || 0) * 8) % 3);
      g.fillStyle = pal.brassDark;
      for (let nx = kx + 2 + notchOff; nx <= kx + 8; nx += 3) {
        g.fillRect(nx, -13, 1, 20);
      }
    };
    drawKnurledKnob(-107);
    drawKnurledKnob(96);

    // Paper Sheet (Ivory texture with model-themed margin line)
    const paperW = 142;
    const paperH = 88;
    g.fillStyle = pal.paperDark;
    g.fillRect(-paperW / 2, -paperH + 4, paperW, paperH);
    g.fillStyle = pal.paperLight;
    g.fillRect(-paperW / 2 + 2, -paperH + 6, paperW - 4, paperH - 4);
    g.fillStyle = pal.paperMargin || '#a82020';
    g.fillRect(-paperW / 2 + 16, -paperH + 6, 1, paperH - 4); // Margin line

    // Typed Text on Paper (Crisp Monospace Pixel Font)
    if (stage.paperLines) {
      stage.paperLines.forEach((line, idx) => {
        const lineY = -48 + idx * 8 - ((stage.paperScrollY || 0) % 8);
        if (lineY > -paperH + 10 && lineY < -8) {
          for (let ci = 0; ci < line.length; ci++) {
            drawPixelGlyph(g, line[ci], -paperW / 2 + 20 + ci * 5, lineY, pal.inkBlack);
          }
        }
      });
    }

    // Current Line
    if (stage.currentLineText) {
      for (let ci = 0; ci < stage.currentLineText.length; ci++) {
        drawPixelGlyph(g, stage.currentLineText[ci], -paperW / 2 + 20 + ci * 5, -14, pal.paperMargin || pal.redDark);
      }
      // Blinking Cursor
      if (Math.floor(Date.now() / 350) % 2 === 0) {
        g.fillStyle = pal.paperMargin || pal.redDark;
        g.fillRect(-paperW / 2 + 20 + stage.currentLineText.length * 5, -14, 4, 5);
      }
    }

    // Paper Bail Bar (Steel rod holding down sheet)
    g.fillStyle = pal.ironHi;
    g.fillRect(-94, -2, 188, 3);
    g.fillStyle = '#1c222a';
    g.fillRect(-62, -3, 8, 5); // Left rubber pinch roller
    g.fillRect(54, -3, 8, 5);  // Right rubber pinch roller

    // Articulated Carriage Return Lever (Pivots smoothly on Return)
    g.save();
    g.translate(-108, -6);
    g.rotate(-(stage.leverAngle || 0));

    // Lever Arm (Curved Chrome Rod)
    g.fillStyle = pal.carriage ? pal.carriage.railHi : pal.ironHi;
    g.fillRect(-12, -2, 14, 4);
    g.fillRect(-22, -14, 12, 4);
    g.fillRect(-24, -12, 4, 12);

    // Lever Ergonomic Handle Knob (Stepped Pixel Raster)
    drawSteppedCircle(g, -24, -14, 5.5, pal.brassLight);
    drawSteppedCircle(g, -25, -15, 2.5, pal.brassHi);
    g.restore();

    // Margin Bell (Turned Brass Dome - 100% Pure Stepped Pixel Art)
    drawSteppedCircle(g, 104, -8, 8, pal.brassDark);
    drawSteppedCircle(g, 104, -8, 6.5, pal.brassLight);
    drawSteppedCircle(g, 102, -10, 2.5, pal.brassHi);

    g.restore(); // End Carriage Layer

    // ==========================================
    // LAYER B: MAIN ENAMEL CHASSIS & MEDALLION
    // ==========================================
    // Main Enamel Chassis Body
    g.fillStyle = pal.ironBlack;
    g.fillRect(cx - 126, cy - 43, 252, 96);
    g.fillStyle = pal.ironDark;
    g.fillRect(cx - 124, cy - 41, 248, 92);
    g.fillStyle = pal.ironMid;
    g.fillRect(cx - 123, cy - 40, 246, 2); // Chamfer highlight

    // Tiered Pinstripes
    const pinstripe1 = pal.chassis ? pal.chassis.pinstripePrimary : pal.brassMid;
    g.fillStyle = pinstripe1;
    g.fillRect(cx - 121, cy - 38, 242, 2);
    g.fillRect(cx - 121, cy + 49, 242, 2);
    g.fillRect(cx - 121, cy - 38, 2, 89);
    g.fillRect(cx + 119, cy - 38, 2, 89);

    if (mkLevel >= 2) {
      // Mk II Double-Ring Pinstripes
      const pinstripe2 = pal.chassis ? pal.chassis.pinstripeSecondary : pal.brassHi;
      g.fillStyle = pinstripe2;
      g.fillRect(cx - 117, cy - 34, 234, 1);
      g.fillRect(cx - 117, cy + 45, 234, 1);
      g.fillRect(cx - 117, cy - 34, 1, 80);
      g.fillRect(cx + 116, cy - 34, 1, 80);

      // Corner Brackets
      g.fillStyle = pal.trim.hi;
      g.fillRect(cx - 117, cy - 34, 3, 1);
      g.fillRect(cx - 117, cy - 34, 1, 3);
      g.fillRect(cx + 114, cy - 34, 3, 1);
      g.fillRect(cx + 116, cy - 34, 1, 3);
      g.fillRect(cx - 117, cy + 45, 3, 1);
      g.fillRect(cx - 117, cy + 43, 1, 3);
      g.fillRect(cx + 114, cy + 45, 3, 1);
      g.fillRect(cx + 116, cy + 43, 1, 3);
    }
    if (mkLevel === 3) {
      // Mk III Radiant Gold Leaf Corner Filigree
      const gleam = pal.trim ? pal.trim.gleam : '#ffffff';
      g.fillStyle = gleam;
      g.fillRect(cx - 119, cy - 36, 4, 1);
      g.fillRect(cx - 119, cy - 36, 1, 4);
      g.fillRect(cx + 116, cy - 36, 4, 1);
      g.fillRect(cx + 119, cy - 36, 1, 4);
      g.fillRect(cx - 119, cy + 47, 4, 1);
      g.fillRect(cx - 119, cy + 44, 1, 4);
      g.fillRect(cx + 116, cy + 47, 4, 1);
      g.fillRect(cx + 119, cy + 44, 1, 4);
    }

    // Cast Iron Feet with Rubber Base
    g.fillStyle = pal.ironBlack;
    g.fillRect(cx - 125, cy + 51, 18, 6);
    g.fillRect(cx + 107, cy + 51, 18, 6);
    g.fillStyle = '#0a0d12';
    g.fillRect(cx - 123, cy + 55, 14, 3);
    g.fillRect(cx + 109, cy + 55, 14, 3);

    // Authentic Handcrafted 16-Bit Medallion
    drawTypewriterMedallion(g, modelId, mkLevel, cx, cy - 30);

    // ==========================================
    // LAYER C: TYPEBAR BASKET LINKAGES
    // ==========================================
    // Semicircular Cavity (Pure Stepped Pixel Raster)
    drawSteppedSemicircle(g, cx, cy - 14, 52, '#0a0d10', pal.ironMid);

    // 24 Radiating Steel Typebars
    const numBars = 24;
    for (let i = 0; i < numBars; i++) {
      const ang = Math.PI * 0.16 + (i / (numBars - 1)) * (Math.PI * 0.68);
      const r1 = 18;
      const r2 = 49;
      const x1 = cx + Math.cos(ang) * r1;
      const y1 = cy - 14 + Math.sin(ang) * r1;
      const x2 = cx + Math.cos(ang) * r2;
      const y2 = cy - 14 + Math.sin(ang) * r2;

      g.strokeStyle = (i % 2 === 0) ? pal.ironHi : pal.ironMid;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(snap(x1), snap(y1));
      g.lineTo(snap(x2), snap(y2));
      g.stroke();

      // Type hammer heads at tips
      g.fillStyle = pal.ironHi;
      g.fillRect(snap(x2 - 1), snap(y2 - 1), 2, 2);
    }

    // Active Typebar Striking Platen!
    if (stage.typebarProgress > 0) {
      const strikeH = 46 * stage.typebarProgress;
      g.strokeStyle = pal.ironSpec;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(cx, cy - 10);
      g.lineTo(cx, cy - 10 - strikeH);
      g.stroke();

      g.fillStyle = pal.brassLight;
      g.fillRect(cx - 3, cy - 12 - strikeH, 6, 4);
    }

    // Central Ribbon Vibrator Guide (Hops up 4px when struck)
    const vibY = cy - 42 - ((stage.typebarProgress || 0) * 4);
    g.fillStyle = pal.ironHi;
    g.fillRect(cx - 6, vibY, 12, 10);
    g.fillStyle = pal.ironBlack;
    g.fillRect(cx - 4, vibY + 2, 8, 6);

    // ==========================================
    // LAYER D: MECHANICAL ESCAPEMENT TICKER GEARBOX (RIGHT FLANK)
    // ==========================================
    const gearBoxX = cx + 120;
    const gearBoxY = cy + 18;
    g.fillStyle = pal.ironBlack;
    g.fillRect(gearBoxX - 10, gearBoxY - 14, 26, 36);
    g.fillStyle = pal.ironDark;
    g.fillRect(gearBoxX - 8, gearBoxY - 12, 22, 32);

    // Rotating Escapement Ratchet Cogwheel (14 teeth)
    g.save();
    g.translate(gearBoxX, gearBoxY);
    g.rotate(stage.tickerAngle || 0);

    // Steel Cog Body (Stepped Pixel Raster)
    drawSteppedCircle(g, 0, 0, 11, pal.ironLight);
    drawSteppedCircle(g, 0, 0, 6, pal.ironBlack);

    // 14 Sharp Ratchet Teeth
    g.fillStyle = pal.ironHi;
    for (let t = 0; t < 14; t++) {
      const tAng = (t / 14) * Math.PI * 2;
      const tx = Math.cos(tAng) * 12;
      const ty = Math.sin(tAng) * 12;
      g.fillRect(snap(tx - 1), snap(ty - 1), 2, 2);
    }

    // Brass Center Pinion & Spoke (Stepped Pixel Raster)
    drawSteppedCircle(g, 0, 0, 3, pal.brassLight);
    g.restore();

    // Escapement Anchor / Rocking Dog Lever
    const dogRock = (stage.escapementDog || 0) * 4;
    g.fillStyle = pal.brassHi;
    g.fillRect(gearBoxX - 10, gearBoxY - 10 - dogRock, 4, 8);
    g.fillRect(gearBoxX - 6, gearBoxY - 10 - dogRock, 3, 3);

    // ==========================================
    // LAYER E: TWIN EXPOSED BRASS RIBBON SPOOLS
    // ==========================================
    const spoolY = cy - 20;
    drawTypewriterSpool(g, cx - 86, spoolY, stage.leftSpoolAngle || 0, true, modelId, mkLevel);
    drawTypewriterSpool(g, cx + 86, spoolY, stage.rightSpoolAngle || 0, false, modelId, mkLevel);

    // Ribbon Threading Tape
    g.strokeStyle = pal.spool ? pal.spool.tapeLeft : pal.redBase;
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(cx - 70, spoolY);
    g.lineTo(cx - 6, vibY + 4);
    g.stroke();

    g.strokeStyle = pal.spool ? pal.spool.tapeRight : pal.inkBlack;
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(cx + 6, vibY + 4);
    g.lineTo(cx + 70, spoolY);
    g.stroke();

    // ==========================================
    // LAYER F: 4-ROW TIERED BEVELED KEYBOARD & SPACEBAR
    // ==========================================
    // Keyboard Tray
    g.fillStyle = pal.ironBlack;
    g.fillRect(cx - 106, cy + 4, 212, 56);
    g.fillStyle = pal.ironDark;
    g.fillRect(cx - 104, cy + 6, 208, 52);

    // Render Individual Round Keys (Handcrafted 16-Bit Pixel Clusters)
    if (stage.keys) {
      stage.keys.forEach(k => {
        const isHovered = stage.hoveredKey === k;
        const ky = snap(k.baseY + k.depressedY);
        const kx = snap(k.x);

        // Vertical Steel Stem Underneath
        g.fillStyle = pal.keys && pal.keys.stem ? pal.keys.stem : pal.ironHi;
        g.fillRect(kx - 1, ky + 2, 2, (k.baseY - ky) + 5);

        // Outer Cast Shadow into Well
        g.fillStyle = pal.ironBlack;
        g.fillRect(kx - 5, ky + 4, 10, 2);

        // Brass / Chrome Beveled Outer Ring (11x11 Pixel Circle)
        g.fillStyle = isHovered ? (pal.keyCapRimHi || pal.brassHi) : (pal.keyCapRim || pal.brassMid);
        g.fillRect(kx - 5, ky - 3, 10, 7);
        g.fillRect(kx - 4, ky - 5, 8, 11);
        g.fillRect(kx - 3, ky - 6, 6, 13);

        // Inner Shaded Face (Model specific face, depressed when pushed)
        g.fillStyle = k.isDown ? (pal.keys ? pal.keys.facePressed : pal.brassLight) : pal.keyFace;
        g.fillRect(kx - 4, ky - 2, 8, 5);
        g.fillRect(kx - 3, ky - 4, 6, 9);
        g.fillRect(kx - 2, ky - 5, 4, 11);

        // Crescent Shadow on bottom of keycap
        if (!k.isDown) {
          g.fillStyle = pal.keyShade;
          g.fillRect(kx - 3, ky + 2, 6, 2);
          g.fillRect(kx - 2, ky + 3, 4, 1);
        }

        // Crisp 4x5 Bitmap Pixel Font Glyph!
        drawPixelGlyph(g, k.ch, kx - 2, ky - 2, pal.keyLetter || pal.inkBlack);
      });
    }

    // Spacebar
    if (stage.spacebar) {
      const s = stage.spacebar;
      const sy = snap(s.baseY + s.depressedY);
      const isSpaceHovered = stage.hoveredKey === s;

      // Dual Steel Plunger Stems
      g.fillStyle = pal.ironHi;
      g.fillRect(s.x - 30, sy + 3, 3, (s.baseY - sy) + 6);
      g.fillRect(s.x + 27, sy + 3, 3, (s.baseY - sy) + 6);

      // Spacebar Body (Beveled Brass/Iron with Knurled Top)
      g.fillStyle = pal.ironBlack;
      g.fillRect(s.x - s.w / 2 - 1, sy, s.w + 2, s.h + 2);
      g.fillStyle = pal.brassDark;
      g.fillRect(s.x - s.w / 2, sy + 1, s.w, s.h);
      g.fillStyle = isSpaceHovered || s.isDown ? pal.brassHi : pal.brassLight;
      g.fillRect(s.x - s.w / 2, sy, s.w, s.h - 1);
      g.fillStyle = pal.brassHi;
      g.fillRect(s.x - s.w / 2 + 2, sy + 1, s.w - 4, 1);
    }
  }

  /* ===============================================================
   * 8. PROTO-ENGINE / STAGE THEME ADAPTER
   * Seamlessly links model palettes to TypewriterPixelStage.
   * =============================================================== */
  /**
   * Apply a typewriter model and tier theme directly to a stage instance.
   *
   * @param {Object} stage ProtoEngine.TypewriterPixelStage instance
   * @param {string|number} modelId Model ID ('mint', 'rose', 'blue', 'amber', 'orchid', 'moon')
   * @param {number|string} mkLevel Restoration tier (1, 2, 3)
   */
  function applyTypewriterTheme(stage, modelId, mkLevel) {
    if (!stage) return null;
    const pal = getTypewriterPalette(modelId, mkLevel);
    stage.modelId = pal.id;
    stage.mkLevel = pal.mkLevel;
    stage.palette = pal;

    // Apply color ramps to stage internal PAL references if present
    if (stage.keys && stage.keys.length > 0) {
      stage.keys.forEach(k => {
        k.colorFace = pal.keys.face;
        k.colorRing = pal.keys.ring;
        k.colorLetter = pal.keys.letter;
      });
    }

    return pal;
  }

  /**
   * Enhance ProtoEngine TypewriterPixelStage to natively support
   * all 6 models and 3 restoration tiers.
   */
  function enhanceProtoEngine(ProtoEngine) {
    if (!ProtoEngine || !ProtoEngine.TypewriterPixelStage) return false;
    const Stage = ProtoEngine.TypewriterPixelStage;

    if (Stage.prototype._enhancedByTypewriterStyles) return true;
    Stage.prototype._enhancedByTypewriterStyles = true;

    // Enhance constructor defaults
    const origInit = Stage.prototype.initKeyboard;
    Stage.prototype.setModel = function(modelId, mkLevel) {
      if (modelId !== undefined) this.modelId = normalizeModelId(modelId);
      if (mkLevel !== undefined) this.mkLevel = normalizeMkLevel(mkLevel);
      this.palette = getTypewriterPalette(this.modelId, this.mkLevel);
      if (this.keys) {
        this.keys.forEach(k => {
          k.colorFace = this.palette.keys.face;
          k.colorRing = this.palette.keys.ring;
          k.colorLetter = this.palette.keys.letter;
        });
      }
    };

    // Replace renderTypewriter with full theme-aware rasterizer
    Stage.prototype.renderTypewriter = function(g, snap) {
      if (!this.palette || !this.palette.chassis) {
        this.setModel(this.modelId || 'mint', this.mkLevel || 1);
      }
      renderTypewriterStyled(this, g, snap);
    };

    return true;
  }

  // Auto-enhance ProtoEngine if available in environment
  if (typeof root !== 'undefined' && root && root.ProtoEngine) {
    enhanceProtoEngine(root.ProtoEngine);
  } else if (typeof window !== 'undefined') {
    if (window.ProtoEngine) {
      enhanceProtoEngine(window.ProtoEngine);
    } else {
      let _pe = undefined;
      try {
        Object.defineProperty(window, 'ProtoEngine', {
          configurable: true,
          enumerable: true,
          get() { return _pe; },
          set(val) {
            _pe = val;
            if (val) enhanceProtoEngine(val);
          }
        });
      } catch (e) {}
    }
  }

  /**
   * Return an array of all 6 canonical models.
   */
  function getAllModels() {
    return Object.keys(TYPEWRITER_MODELS).map(k => TYPEWRITER_MODELS[k]);
  }

  /**
   * Return an array of all restoration tiers.
   */
  function getAllTiers() {
    return Object.keys(RESTORATION_TIERS).map(k => RESTORATION_TIERS[k]);
  }

  /* ===============================================================
   * PUBLIC EXPORTS
   * =============================================================== */
  return {
    // Canonical Data
    TYPEWRITER_MODELS,
    RESTORATION_TIERS,
    PIXEL_GLYPHS,

    // Core Helpers
    normalizeModelId,
    normalizeMkLevel,
    getTypewriterPalette,
    getAllModels,
    getAllTiers,

    // 16-Bit Pixel Art Rasterization Helpers
    drawPixelGlyph,
    drawPixelText,
    measurePixelText,
    drawTypewriterMedallion,
    drawTypewriterChassis,
    drawTypewriterSpool,
    renderTypewriterStyled,
    applyTypewriterTheme,
    enhanceProtoEngine
  };
}));
