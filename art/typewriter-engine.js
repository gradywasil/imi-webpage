/**
 * MonkeyOS v2 - Master 16-Bit Pixel Art Typewriter Engine
 * Created for art direction testing (the old gemini-art lab, now folded into art/)
 * 
 * Features:
 * - 100% Authentic Handcrafted 16-Bit Pixel Art Architecture (Zero generic vector shapes)
 * - Godot-Style Nearest Integer Scaling & Sub-pixel Snapping (no shimmer, razor sharp pixels)
 * - 64x64 High-Detail Sprite Architecture with true spatial physical mobility
 * - Authentic 4x5 Bitmap Pixel Font for all 36 round keycaps
 * - Mechanical Escapement Ticker Gearbox with rotating ratchet cog & rocking escapement dog
 * - Fluted Rubber Platen Cylinder with rotating ridges & knurled gear knobs
 * - Moving Carriage Escapement, Margin Bell clapper, and scrolling laid-paper sheet
 * - 24 Radiating Steel Typebars with pivoting hammers striking the ribbon vibrator
 * - 5 Monkeys physically operating the machine:
 *   1. Key Stomper: Parabolic leaps, dual-foot stomps, compressing key stems with dust clouds
 *   2. Carriage Return Slammer: Grips brass lever with two hands, pulls with full weight, rides carriage
 *   3. Platen Roller Acrobat: Treadmill walks on spinning rubber cylinder, inspects text with magnifying glass
 *   4. Escapement Mechanic Monkey: Taps ticking ratchet cogwheel with steel wrench on every stroke
 *   5. Ribbon Spool Mischief: Tugs ink ribbon loop and stamps black inky paw prints
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ProtoEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------------------------------------------------------------
   * 16-BIT RETRO COLOR PALETTES
   * --------------------------------------------------------------- */
  const PAL = {
    // Monkey Chocolate Fur
    furDarkest: '#140803',
    furDark:    '#2c1508',
    furBase:    '#582e12',
    furMid:     '#7e441c',
    furLight:   '#a65e28',
    furHi:      '#d68444',

    // Monkey Cream Skin / Muzzle / Paws
    skinDark:   '#8e5428',
    skinBase:   '#d49258',
    skinLight:  '#f0bc88',
    skinHi:     '#ffe2be',

    // Cast Iron Typewriter Body (Rich metallic 5-tone ramp)
    ironBlack:  '#090c10',
    ironDark:   '#161c24',
    ironMid:    '#26303e',
    ironLight:  '#44546a',
    ironHi:     '#788ea8',
    ironSpec:   '#b4c6dc',

    // Polished Brass & Gold Inlays (5-tone ramp)
    brassDark:  '#3a2806',
    brassBase:  '#7a5814',
    brassMid:   '#b88824',
    brassLight: '#f4c448',
    brassHi:    '#fff08c',

    // Ivory Keycaps & Paper
    paperDark:  '#baa882',
    paperBase:  '#e4d4b2',
    paperLight: '#fbf6e6',
    paperWhite: '#ffffff',

    // Keycaps
    keyCapRim:  '#b48c34',
    keyFace:    '#fdf9ee',
    keyShade:   '#dcd0bc',

    // Inks & Ribbons
    inkBlack:   '#10080c',
    inkDark:    '#201218',
    redDark:    '#5a1010',
    redBase:    '#a82020',
    redLight:   '#e64444',
    redHi:      '#ff8080',

    // Jungle Greenery & Accents
    leafDark:   '#123216',
    leafBase:   '#246428',
    leafLight:  '#489e3e',
    leafHi:     '#84da60',

    // Smoke & Dust Puffs
    dustDark:   '#a49886',
    dustLight:  '#e4dcd0'
  };

  /* ---------------------------------------------------------------
   * 4x5 BITMAP PIXEL FONT FOR KEYCAPS & MECHANICAL PAPER
   * --------------------------------------------------------------- */
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
    '!': [0b0100, 0b0100, 0b0100, 0b0000, 0b0100],
    '?': [0b1110, 0b0001, 0b0110, 0b0000, 0b0100],
    '-': [0b0000, 0b0000, 0b1111, 0b0000, 0b0000],
    ':': [0b0000, 0b0100, 0b0000, 0b0100, 0b0000],
    ' ': [0b0000, 0b0000, 0b0000, 0b0000, 0b0000]
  };

  function drawPixelGlyph(g, ch, x, y, col) {
    const glyph = PIXEL_GLYPHS[ch] || PIXEL_GLYPHS[' '];
    g.fillStyle = col;
    for (let r = 0; r < 5; r++) {
      const rowBits = glyph[r];
      for (let c = 0; c < 4; c++) {
        if ((rowBits >> (3 - c)) & 1) {
          g.fillRect(x + c, y + r, 1, 1);
        }
      }
    }
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

  function drawSteppedEllipse(ctx, cx, cy, rx, ry, col) {
    if (!col) return;
    ctx.fillStyle = col;
    const x0 = Math.floor(cx - rx), y0 = Math.floor(cy - ry);
    const x1 = Math.ceil(cx + rx),  y1 = Math.ceil(cy + ry);
    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        const dx = (px + 0.5 - cx) / rx, dy = (py + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) {
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }
  }

  function drawSteppedLine(ctx, x0, y0, x1, y1, col, width = 1) {
    if (!col) return;
    ctx.fillStyle = col;
    let ix0 = Math.floor(x0), iy0 = Math.floor(y0);
    const ix1 = Math.floor(x1), iy1 = Math.floor(y1);
    const dx = Math.abs(ix1 - ix0), sx = ix0 < ix1 ? 1 : -1;
    const dy = -Math.abs(iy1 - iy0), sy = iy0 < iy1 ? 1 : -1;
    let err = dx + dy;
    while (true) {
      if (width === 1) {
        ctx.fillRect(ix0, iy0, 1, 1);
      } else {
        ctx.fillRect(ix0 - Math.floor(width / 2), iy0 - Math.floor(width / 2), width, width);
      }
      if (ix0 === ix1 && iy0 === iy1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; ix0 += sx; }
      if (e2 <= dx) { err += dx; iy0 += sy; }
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

  /* ---------------------------------------------------------------
   * PIXEL BUFFER (INTEGER RASTERIZER)
   * --------------------------------------------------------------- */
  class PixelBuffer {
    constructor(w, h) {
      this.w = w;
      this.h = h;
      this.canvas = document.createElement('canvas');
      this.canvas.width = w;
      this.canvas.height = h;
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
      this.ctx.imageSmoothingEnabled = false;
    }

    clear() {
      this.ctx.clearRect(0, 0, this.w, this.h);
    }

    rect(x, y, w, h, col) {
      this.ctx.fillStyle = col;
      this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    }

    dot(x, y, col) {
      this.rect(x, y, 1, 1, col);
    }

    circle(cx, cy, r, col) {
      this.ctx.fillStyle = col;
      const x0 = Math.floor(cx - r), y0 = Math.floor(cy - r);
      const x1 = Math.ceil(cx + r),  y1 = Math.ceil(cy + r);
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
          if (dx * dx + dy * dy <= r * r) {
            this.ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }

    capsule(x0, y0, x1, y1, r, col) {
      this.ctx.fillStyle = col;
      const minX = Math.floor(Math.min(x0, x1) - r), maxX = Math.ceil(Math.max(x0, x1) + r);
      const minY = Math.floor(Math.min(y0, y1) - r), maxY = Math.ceil(Math.max(y0, y1) + r);
      const vx = x1 - x0, vy = y1 - y0;
      const lenSq = vx * vx + vy * vy || 1;
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const px = x + 0.5 - x0, py = y + 0.5 - y0;
          let t = (px * vx + py * vy) / lenSq;
          t = Math.max(0, Math.min(1, t));
          const cx = x0 + t * vx, cy = y0 + t * vy;
          const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
          if (dx * dx + dy * dy <= r * r) {
            this.ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }

    steppedLine(x0, y0, x1, y1, col, width = 1) {
      this.ctx.fillStyle = col;
      let ix0 = Math.floor(x0), iy0 = Math.floor(y0);
      const ix1 = Math.floor(x1), iy1 = Math.floor(y1);
      const dx = Math.abs(ix1 - ix0), sx = ix0 < ix1 ? 1 : -1;
      const dy = -Math.abs(iy1 - iy0), sy = iy0 < iy1 ? 1 : -1;
      let err = dx + dy;

      while (true) {
        if (width === 1) {
          this.ctx.fillRect(ix0, iy0, 1, 1);
        } else {
          this.ctx.fillRect(ix0 - Math.floor(width / 2), iy0 - Math.floor(width / 2), width, width);
        }
        if (ix0 === ix1 && iy0 === iy1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; ix0 += sx; }
        if (e2 <= dx) { err += dx; iy0 += sy; }
      }
    }

    steppedBezierCurve(x0, y0, cx, cy, x1, y1, col, width = 1) {
      const steps = Math.max(16, Math.round(Math.hypot(x1 - x0, y1 - y0) * 1.5));
      let prevX = Math.round(x0), prevY = Math.round(y0);
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const it = 1 - t;
        const curX = Math.round(it * it * x0 + 2 * it * t * cx + t * t * x1);
        const curY = Math.round(it * it * y0 + 2 * it * t * cy + t * t * y1);
        this.steppedLine(prevX, prevY, curX, curY, col, width);
        prevX = curX;
        prevY = curY;
      }
    }
  }

  /* ---------------------------------------------------------------
   * 64x64 MODULAR MONKEY RASTERIZER (RICH CHOCOLATE / CREAM PIXEL ART)
   * --------------------------------------------------------------- */
  function renderMonkey64(params) {
    const {
      x = 32,
      y = 32,
      facing = 1, // 1 for right, -1 for left
      squashX = 1.0,
      squashY = 1.0,
      bodyTilt = 0,
      headTilt = 0,
      headY = 0,
      expr = 'smile',
      armL = [-12, 6],
      armR = [12, 6],
      legL = [-6, 16],
      legR = [6, 16],
      tailCurve = 0,
      hat = null,
      heldItem = null
    } = params;

    const buf = new PixelBuffer(64, 64);
    const ctx = buf.ctx;

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (facing === -1) {
      ctx.scale(-1, 1);
    }

    // Tail (Behind body, pure stepped pixel curved spine - no vector blur)
    buf.steppedBezierCurve(
      Math.round(-4 * squashX), Math.round(8 * squashY),
      Math.round(-15 - tailCurve * 6), Math.round(2 - tailCurve * 4),
      Math.round(-19 + tailCurve * 4), Math.round(-8 - tailCurve * 8),
      PAL.furDarkest, 3
    );
    buf.steppedBezierCurve(
      Math.round(-4 * squashX), Math.round(8 * squashY),
      Math.round(-15 - tailCurve * 6), Math.round(2 - tailCurve * 4),
      Math.round(-19 + tailCurve * 4), Math.round(-8 - tailCurve * 8),
      PAL.furBase, 1
    );

    // Body (Rich chocolate fur with outline and cream tummy)
    ctx.save();
    ctx.rotate(bodyTilt);
    buf.capsule(-6 * squashX, 0, 6 * squashX, 0, 7.5 * squashY, PAL.furDarkest);
    buf.capsule(-5 * squashX, 0, 5 * squashX, 0, 6.5 * squashY, PAL.furBase);
    buf.capsule(-3 * squashX, -1, 3 * squashX, -1, 5.0 * squashY, PAL.furLight);

    // Cream Belly Patch
    buf.capsule(-2.5 * squashX, 1, 2.5 * squashX, 1, 3.8 * squashY, PAL.skinLight);
    buf.capsule(-1.5 * squashX, 1, 1.5 * squashX, 1, 2.5 * squashY, PAL.skinHi);
    ctx.restore();

    // Legs & Paws
    buf.capsule(-4 * squashX, 6 * squashY, legL[0], legL[1], 3.0, PAL.furDark);
    buf.capsule(-4 * squashX, 6 * squashY, legL[0], legL[1], 2.2, PAL.furBase);
    buf.capsule(4 * squashX, 6 * squashY, legR[0], legR[1], 3.0, PAL.furDark);
    buf.capsule(4 * squashX, 6 * squashY, legR[0], legR[1], 2.2, PAL.furBase);
    buf.circle(legL[0], legL[1] + 1, 3.0, PAL.skinDark);
    buf.circle(legL[0], legL[1] + 1, 2.0, PAL.skinLight);
    buf.circle(legR[0], legR[1] + 1, 3.0, PAL.skinDark);
    buf.circle(legR[0], legR[1] + 1, 2.0, PAL.skinLight);

    // Head
    ctx.save();
    ctx.translate(0, headY);
    ctx.rotate(headTilt);

    // Ears
    buf.circle(-9.5, -4, 4.5, PAL.furDarkest);
    buf.circle(-9.5, -4, 3.8, PAL.furBase);
    buf.circle(-9.5, -4, 2.4, PAL.skinBase);
    buf.circle(9.5, -4, 4.5, PAL.furDarkest);
    buf.circle(9.5, -4, 3.8, PAL.furBase);
    buf.circle(9.5, -4, 2.4, PAL.skinBase);

    // Head Dome
    buf.circle(0, -6, 8.2, PAL.furDarkest);
    buf.circle(0, -6, 7.5, PAL.furBase);
    buf.circle(0, -7.5, 6.0, PAL.furLight);

    // Face Brow Mask
    buf.circle(-3.2, -6, 4.6, PAL.skinBase);
    buf.circle(3.2, -6, 4.6, PAL.skinBase);
    buf.capsule(-2.5, -3, 2.5, -3, 5.0, PAL.skinLight);

    // Eyes
    if (expr === 'blink') {
      buf.rect(-5, -6, 3, 1, PAL.inkDark);
      buf.rect(2, -6, 3, 1, PAL.inkDark);
    } else if (expr === 'wink') {
      buf.circle(-4, -6, 2.0, PAL.inkBlack);
      buf.dot(-4, -6.5, PAL.paperWhite);
      buf.rect(2, -6, 3, 1, PAL.inkDark);
    } else if (expr === 'screech') {
      buf.circle(-4, -7, 2.4, PAL.paperWhite);
      buf.circle(4, -7, 2.4, PAL.paperWhite);
      buf.dot(-4, -7, PAL.inkBlack);
      buf.dot(4, -7, PAL.inkBlack);
    } else if (expr === 'surprised') {
      buf.circle(-4, -6.5, 2.5, PAL.paperWhite);
      buf.circle(4, -6.5, 2.5, PAL.paperWhite);
      buf.dot(-4, -6.5, PAL.inkBlack);
      buf.dot(4, -6.5, PAL.inkBlack);
    } else {
      // Determined / Happy Typist Eyes
      buf.circle(-4, -6, 2.2, PAL.paperWhite);
      buf.circle(4, -6, 2.2, PAL.paperWhite);
      buf.circle(-3.6, -6, 1.3, PAL.inkBlack);
      buf.circle(3.6, -6, 1.3, PAL.inkBlack);
      buf.dot(-4, -6.5, PAL.paperWhite);
      buf.dot(3.2, -6.5, PAL.paperWhite);
    }

    // Muzzle & Mouth
    buf.circle(0, -2.5, 1.4, PAL.furDarkest);
    if (expr === 'screech') {
      buf.capsule(-2, 0, 2, 0, 2.2, PAL.inkBlack);
      buf.rect(-1.5, -0.8, 3, 1, PAL.paperWhite);
    } else if (expr === 'surprised') {
      buf.circle(0, 0.5, 2.2, PAL.inkBlack);
    } else {
      buf.dot(-2, 0, PAL.skinDark);
      buf.dot(-1, 0.8, PAL.skinDark);
      buf.dot(0, 1.0, PAL.skinDark);
      buf.dot(1, 0.8, PAL.skinDark);
      buf.dot(2, 0, PAL.skinDark);
    }

    // Hats
    if (hat === 'cap') {
      buf.capsule(-7, -11, 7, -11, 3.0, PAL.brassDark);
      buf.rect(-8, -10, 16, 2, PAL.brassMid);
      buf.rect(3, -9, 8, 2, PAL.brassHi);
    } else if (hat === 'crown') {
      buf.rect(-5, -12, 10, 2, PAL.brassDark);
      buf.rect(-4, -14, 2, 3, PAL.brassLight);
      buf.rect(-1, -15, 2, 4, PAL.brassHi);
      buf.rect(2, -14, 2, 3, PAL.brassLight);
      buf.dot(0, -15, PAL.redLight);
    }

    ctx.restore();

    // Arms & Hands
    buf.capsule(-6 * squashX, -2 * squashY, armL[0], armL[1], 2.8, PAL.furDark);
    buf.capsule(-6 * squashX, -2 * squashY, armL[0], armL[1], 2.2, PAL.furBase);
    buf.capsule(6 * squashX, -2 * squashY, armR[0], armR[1], 2.8, PAL.furDark);
    buf.capsule(6 * squashX, -2 * squashY, armR[0], armR[1], 2.2, PAL.furBase);
    buf.circle(armL[0], armL[1], 2.5, PAL.skinLight);
    buf.circle(armR[0], armR[1], 2.5, PAL.skinLight);

    // Props
    if (heldItem === 'wrench') {
      buf.steppedLine(armR[0] - 1, armR[1] + 2, armR[0] + 9, armR[1] - 8, PAL.ironHi, 2);
      buf.circle(armR[0] + 9, armR[1] - 8, 3.2, PAL.ironHi);
      buf.dot(armR[0] + 10, armR[1] - 9, PAL.ironDark);
    } else if (heldItem === 'glass') {
      buf.circle(armR[0] + 6, armR[1] - 4, 4.8, PAL.brassMid);
      buf.circle(armR[0] + 6, armR[1] - 4, 3.2, 'rgba(255,255,255,0.45)');
      buf.capsule(armR[0] + 2, armR[1], armR[0] - 2, armR[1] + 4, 1.5, PAL.brassDark);
    } else if (heldItem === 'banana') {
      // 100% Stepped Pixel Art Banana (No vector arc)
      const bx = armR[0] + 5, by = armR[1] - 8;
      drawSteppedCircle(ctx, bx, by, 3.8, PAL.brassDark);
      drawSteppedCircle(ctx, bx + 1, by - 2, 3.2, PAL.brassLight);
      drawSteppedCircle(ctx, bx + 2, by - 4, 2.6, PAL.brassHi);
      buf.dot(bx + 11, by, PAL.brassDark);
      buf.dot(bx + 1, by + 4, PAL.leafDark);
    }

    ctx.restore();
    return buf.canvas;
  }

  /* ---------------------------------------------------------------
   * 64x64 ANIMATION GENERATORS
   * --------------------------------------------------------------- */
  function generateKeyStomp64() {
    if (typeof MonkeyVariants !== 'undefined' && MonkeyVariants.generateKeyStomp64) {
      return MonkeyVariants.generateKeyStomp64();
    }
    const frames = [];
    for (let f = 0; f < 16; f++) {
      let squashX = 1.0, squashY = 1.0;
      let yOff = 0;
      let expr = 'smile';
      let armL = [-12, 6], armR = [12, 6];
      let legL = [-6, 16], legR = [6, 16];
      let tailCurve = 0;

      if (f < 3) {
        const p = f / 3;
        squashX = 1.25 + p * 0.15;
        squashY = 0.75 - p * 0.15;
        yOff = p * 5;
        expr = 'smile';
        armL = [-11, 10];
        armR = [11, 10];
        legL = [-9, 12];
        legR = [9, 12];
      } else if (f < 7) {
        const p = (f - 3) / 4;
        squashX = 0.82;
        squashY = 1.28;
        yOff = -12 - Math.sin(p * Math.PI) * 20;
        expr = 'surprised';
        armL = [-12, -10];
        armR = [12, -10];
        legL = [-4, 18];
        legR = [4, 18];
      } else if (f < 11) {
        const p = (f - 7) / 4;
        squashX = 0.85;
        squashY = 1.20;
        yOff = -16 + p * 28;
        expr = 'screech';
        armL = [-9, 4];
        armR = [9, 4];
        legL = [-7, 18];
        legR = [7, 18];
      } else {
        const p = (f - 11) / 5;
        if (p < 0.4) {
          squashX = 1.45;
          squashY = 0.62;
          yOff = 11;
          expr = 'screech';
          armL = [-15, 11];
          armR = [15, 11];
          legL = [-12, 10];
          legR = [12, 10];
        } else {
          squashX = 1.05 - (p - 0.4) * 0.08;
          squashY = 0.95 + (p - 0.4) * 0.08;
          yOff = 8 - (p - 0.4) * 10;
          expr = 'smile';
        }
      }

      frames.push(renderMonkey64({
        x: 32,
        y: 32 + yOff,
        squashX,
        squashY,
        headY: squashY < 0.8 ? 3 : 0,
        expr,
        armL,
        armR,
        legL,
        legR,
        tailCurve,
        hat: 'cap'
      }));
    }
    return { name: 'Key Stomp (64x64)', id: 'key_stomp_64', frames, fps: 30, description: 'Rocket leap and dual-foot squash-landing directly compressing typewriter keys with dust clouds.' };
  }

  function generateCarriageLever64() {
    if (typeof MonkeyVariants !== 'undefined' && MonkeyVariants.generateCarriageLever64) {
      return MonkeyVariants.generateCarriageLever64();
    }
    const frames = [];
    for (let f = 0; f < 18; f++) {
      let pull = 0;
      let bodyTilt = 0;
      let expr = 'smile';
      let armL = [-12, 4], armR = [14, -8];

      if (f < 5) {
        pull = (f / 5) * 0.4;
        bodyTilt = -pull * 0.35;
        armR = [12 - pull * 4, -4 - pull * 8];
        expr = 'surprised';
      } else if (f < 10) {
        pull = 0.4 + ((f - 5) / 5) * 0.6;
        bodyTilt = -pull * 0.50;
        armR = [14, -12];
        armL = [-4, -8];
        expr = 'screech';
      } else if (f < 14) {
        const p = (f - 10) / 4;
        pull = 1.0 - p * 0.8;
        bodyTilt = (p - 0.5) * 0.3;
        armR = [10, -2];
        expr = 'smile';
      } else {
        const p = (f - 14) / 4;
        pull = 0.2 * (1 - p);
        bodyTilt = 0;
        expr = 'wink';
      }

      frames.push(renderMonkey64({
        x: 32 - pull * 6,
        y: 32 + pull * 2,
        squashX: 1.0 + pull * 0.15,
        squashY: 1.0 - pull * 0.15,
        bodyTilt,
        headTilt: -bodyTilt * 0.6,
        expr,
        armL,
        armR,
        tailCurve: -pull * 1.5,
        hat: 'cap'
      }));
    }
    return { name: 'Carriage Slam (64x64)', id: 'carriage_lever_64', frames, fps: 30, description: 'Two-handed lever pull with full body weight, carriage slide, and margin bell strike.' };
  }

  function generateRollerAcrobat64() {
    if (typeof MonkeyVariants !== 'undefined' && MonkeyVariants.generateRollerAcrobat64) {
      return MonkeyVariants.generateRollerAcrobat64();
    }
    const frames = [];
    for (let f = 0; f < 16; f++) {
      const step = (f / 16) * Math.PI * 2;
      const legBobL = Math.sin(step) * 4;
      const legBobR = Math.sin(step + Math.PI) * 4;

      frames.push(renderMonkey64({
        x: 32,
        y: 30 + Math.abs(Math.sin(step * 2)) * 2,
        squashX: 1.02,
        squashY: 0.98,
        bodyTilt: Math.sin(step) * 0.08,
        headTilt: Math.sin(step) * 0.12,
        expr: (f % 8 === 0) ? 'wink' : 'smile',
        armL: [-14, 4],
        armR: [12, -4],
        legL: [-6, 16 + legBobL],
        legR: [6, 16 + legBobR],
        tailCurve: Math.sin(step) * 1.2,
        heldItem: 'glass'
      }));
    }
    return { name: 'Roller Acrobat (64x64)', id: 'roller_acrobat_64', frames, fps: 24, description: 'Treadmill walks on the spinning platen cylinder and inspects freshly typed manuscript lines.' };
  }

  function generateEscapementMechanic64() {
    if (typeof MonkeyVariants !== 'undefined' && MonkeyVariants.generateEscapementMechanic64) {
      return MonkeyVariants.generateEscapementMechanic64();
    }
    const frames = [];
    for (let f = 0; f < 16; f++) {
      let tap = 0;
      let expr = 'smile';
      if (f >= 4 && f <= 8) {
        tap = Math.sin(((f - 4) / 4) * Math.PI);
        expr = 'screech';
      }

      frames.push(renderMonkey64({
        x: 32,
        y: 32 + tap * 2,
        facing: -1,
        squashX: 1.0 + tap * 0.1,
        squashY: 1.0 - tap * 0.1,
        bodyTilt: -tap * 0.18,
        headTilt: tap * 0.15,
        expr,
        armL: [-8, 6],
        armR: [12 + tap * 4, -4 - tap * 6],
        legL: [-7, 16],
        legR: [5, 16],
        tailCurve: 0.8,
        heldItem: 'wrench'
      }));
    }
    return { name: 'Escapement Mechanic (64x64)', id: 'escapement_mechanic_64', frames, fps: 24, description: 'Perched on the side gearbox, taps the rotating escapement ratchet cog with a steel wrench on every keystroke.' };
  }

  function generateRibbonMischief64() {
    if (typeof MonkeyVariants !== 'undefined' && MonkeyVariants.generateRibbonMischief64) {
      return MonkeyVariants.generateRibbonMischief64();
    }
    const frames = [];
    for (let f = 0; f < 16; f++) {
      const cycle = (f / 16) * Math.PI * 2;
      const tug = Math.sin(cycle);
      let expr = (f > 4 && f < 10) ? 'screech' : 'smile';

      frames.push(renderMonkey64({
        x: 32 + tug * 3,
        y: 34 - Math.abs(tug) * 2,
        squashX: 1.05 + tug * 0.1,
        squashY: 0.95 - tug * 0.1,
        bodyTilt: tug * 0.2,
        headTilt: -tug * 0.15,
        expr,
        armL: [-10, 6 + tug * 4],
        armR: [12 + tug * 6, -2 - tug * 5],
        legL: [-8, 14],
        legR: [6, 15],
        tailCurve: Math.cos(cycle) * 1.3,
        hat: 'cap'
      }));
    }
    return { name: 'Ribbon Mischief (64x64)', id: 'ribbon_mischief_64', frames, fps: 24, description: 'Tugs on the ink ribbon loop beside the brass spools and leaves inky black paw prints on the desk.' };
  }

  function generateVictoryDance64() {
    if (typeof MonkeyVariants !== 'undefined' && MonkeyVariants.generateVictoryDance64) {
      return MonkeyVariants.generateVictoryDance64();
    }
    const frames = [];
    for (let f = 0; f < 16; f++) {
      let dance = (f / 16) * Math.PI * 2;
      let bob = Math.abs(Math.sin(dance * 2)) * 6;
      let kick = Math.sin(dance) * 5;
      let expr = (f % 4 === 0) ? 'wink' : 'smile';

      frames.push(renderMonkey64({
        x: 32,
        y: 32 - bob,
        squashX: 1.06,
        squashY: 0.94,
        bodyTilt: Math.sin(dance) * 0.18,
        headTilt: -Math.sin(dance) * 0.12,
        expr,
        armL: [-11, -9],
        armR: [11, -10],
        legL: [-5 - kick, 16 + Math.abs(kick) * 0.6],
        legR: [5 + kick, 16 - Math.abs(kick) * 0.6],
        tailCurve: Math.sin(dance * 2) * 1.4,
        hat: 'crown',
        heldItem: 'banana'
      }));
    }
    return { name: 'Victory Dance (64x64)', id: 'victory_dance_64', frames, fps: 24, description: 'Triumphant golden banana celebration dance with joyful kicks and starburst particles.' };
  }

  /* ---------------------------------------------------------------
   * MASTER 16-BIT MECHANICAL TYPEWRITER STAGE
   * --------------------------------------------------------------- */
  class TypewriterPixelStage {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { willReadFrequently: true });
      this.ctx.imageSmoothingEnabled = false;

      this.scaleMode = options.scaleMode || 3;
      this.pixelSnap = options.pixelSnap !== false;
      this.showPixelGrid = false;
      this.resMode = options.resMode || '64';

      // Logical Resolution (16:10 aspect ratio)
      this.logicalW = 384;
      this.logicalH = 240;

      // Smooth Camera Lerping
      this.cameraMode = 'full';
      this.camX = 192;
      this.camY = 120;
      this.targetCamX = 192;
      this.targetCamY = 120;
      this.camZoom = 1.0;
      this.targetCamZoom = 1.0;

      this.updateIntegerScaling();
      this.initAudio();

      // Carriage & Escapement Mechanics
      this.carriageX = 0;
      this.targetCarriageX = 0;
      this.paperLines = [
        'THE MONKEY WRITETH...',
        'CHAPTER I: THE TYPEWRITER',
        'TYPING IS PURE JOY!'
      ];
      this.currentLineText = 'TO BE OR NOT TO BE ';
      this.paperScrollY = 0;
      this.targetPaperScrollY = 0;

      // Escapement Ticker Cogwheel & Ratchet Dog
      this.tickerAngle = 0;
      this.targetTickerAngle = 0;
      this.escapementDog = 0;

      // Fluted Platen Roller & Knurled Knobs
      this.platenAngle = 0;
      this.targetPlatenAngle = 0;

      // Typebar Basket (24 radiating steel linkages)
      this.activeTypebar = null;
      this.typebarProgress = 0;
      this.activeTypebarAngle = 0;

      // Ribbon Spools
      this.leftSpoolAngle = 0;
      this.rightSpoolAngle = 0;

      // Carriage Return Lever & Bell
      this.leverAngle = 0;
      this.targetLeverAngle = 0;
      this.bellDingTimer = 0;
      this.bellRings = [];

      // 4-Tier Beveled Keyboard Deck
      this.initKeyboard();

      // Dynamic Particles & Footprints
      this.particles = [];
      this.footprints = [];

      // Mouse Hover State
      this.mouseLogicalX = -100;
      this.mouseLogicalY = -100;
      this.hoveredKey = null;
      this.deskTheme = 'mahogany';

      // Initialize Monkeys
      this.initMonkeys();
      this.setupMouseEvents();
    }

    updateIntegerScaling() {
      if (this.scaleMode === 'auto') {
        const parentW = this.canvas.parentElement ? this.canvas.parentElement.clientWidth : 960;
        const parentH = window.innerHeight * 0.65;
        this.scale = Math.max(1, Math.floor(Math.min(parentW / this.logicalW, parentH / this.logicalH)));
      } else {
        this.scale = parseInt(this.scaleMode, 10) || 3;
      }

      this.canvas.width = this.logicalW * this.scale;
      this.canvas.height = this.logicalH * this.scale;
      this.ctx.imageSmoothingEnabled = false;
    }

    
    setDeskTheme(theme) {
      this.deskTheme = theme;
    }
    setCameraMode(mode) {
      this.cameraMode = mode;
      if (mode === 'keyboard') {
        this.targetCamX = 192;
        this.targetCamY = 175;
        this.targetCamZoom = 1.45;
      } else if (mode === 'carriage') {
        this.targetCamX = 192;
        this.targetCamY = 75;
        this.targetCamZoom = 1.45;
      } else if (mode === 'ribbon') {
        this.targetCamX = 270;
        this.targetCamY = 120;
        this.targetCamZoom = 1.6;
      } else if (mode === 'gearbox') {
        this.targetCamX = 312;
        this.targetCamY = 162;
        this.targetCamZoom = 1.75;
      } else {
        this.targetCamX = 192;
        this.targetCamY = 120;
        this.targetCamZoom = 1.0;
      }
    }

    initKeyboard() {
      this.keys = [];
      const cx = 192;
      const cy = 166;

      const rows = [
        { chars: ['1','2','3','4','5','6','7','8','9','0'], yOffset: 0, spacing: 14 },
        { chars: ['Q','W','E','R','T','Y','U','I','O','P'], yOffset: 12, spacing: 14.5 },
        { chars: ['A','S','D','F','G','H','J','K','L'], yOffset: 24, spacing: 15 },
        { chars: ['Z','X','C','V','B','N','M'], yOffset: 36, spacing: 16 }
      ];

      rows.forEach((row, rIdx) => {
        const rowW = (row.chars.length - 1) * row.spacing;
        const startX = cx - rowW / 2;
        const baseY = cy + row.yOffset;

        row.chars.forEach((ch, cIdx) => {
          const kx = startX + cIdx * row.spacing;
          this.keys.push({
            ch,
            row: rIdx,
            x: kx,
            y: baseY,
            baseY: baseY,
            depressedY: 0,
            targetDepressedY: 0,
            radius: 5.5,
            isDown: false
          });
        });
      });

      // Spacebar
      this.spacebar = {
        ch: ' ',
        x: cx,
        y: cy + 49,
        baseY: cy + 49,
        w: 110,
        h: 7,
        depressedY: 0,
        targetDepressedY: 0,
        isDown: false
      };
    }

    getKey(ch) {
      if (ch === ' ') return this.spacebar;
      return this.keys.find(k => k.ch === ch.toUpperCase()) || null;
    }

    setupMouseEvents() {
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        const screenX = clientX * (this.canvas.width / rect.width);
        const screenY = clientY * (this.canvas.height / rect.height);

        const unscaledX = screenX / this.scale;
        const unscaledY = screenY / this.scale;

        this.mouseLogicalX = (unscaledX - this.logicalW / 2) / this.camZoom + this.camX;
        this.mouseLogicalY = (unscaledY - this.logicalH / 2) / this.camZoom + this.camY;

        this.hoveredKey = null;
        for (const k of this.keys) {
          const dx = this.mouseLogicalX - k.x;
          const dy = this.mouseLogicalY - (k.baseY + k.depressedY);
          if (dx * dx + dy * dy <= k.radius * k.radius * 1.5) {
            this.hoveredKey = k;
            break;
          }
        }
        if (!this.hoveredKey) {
          const s = this.spacebar;
          if (this.mouseLogicalX >= s.x - s.w / 2 && this.mouseLogicalX <= s.x + s.w / 2 &&
              this.mouseLogicalY >= s.y && this.mouseLogicalY <= s.y + s.h) {
            this.hoveredKey = s;
          }
        }
      });

      this.canvas.addEventListener('click', () => {
        if (this.hoveredKey) {
          this.triggerType(this.hoveredKey.ch);
        }
      });
    }

    initMonkeys() {
      this.monkeys = [
        // 1. Key Stomper (Active Hurdling & Stomp Physics)
        {
          id: 'stomper',
          role: 'Key Stomper',
          anim: generateKeyStomp64(),
          frame: 0,
          fpsTimer: 0,
          x: 192,
          y: 162,
          startX: 192,
          startY: 162,
          targetX: 192,
          targetY: 162,
          facing: 1,
          isJumping: false,
          jumpProgress: 0,
          state: 'idle',
          active: true
        },
        // 2. Carriage Return Rider
        {
          id: 'carriage_rider',
          role: 'Carriage Rider',
          anim: generateCarriageLever64(),
          frame: 0,
          fpsTimer: 0,
          x: 94,
          y: 68,
          facing: 1,
          state: 'idle',
          active: true
        },
        // 3. Platen Roller Acrobat & Paper Inspector
        {
          id: 'roller_acrobat',
          role: 'Paper Inspector',
          anim: generateRollerAcrobat64(),
          frame: 0,
          fpsTimer: 0,
          x: 192,
          y: 42,
          facing: 1,
          state: 'idle',
          active: true
        },
        // 4. Escapement Mechanic Monkey (Taps Gear with Wrench)
        {
          id: 'escapement_mechanic',
          role: 'Gearbox Mechanic',
          anim: generateEscapementMechanic64(),
          frame: 0,
          fpsTimer: 0,
          x: 326,
          y: 166,
          facing: -1,
          state: 'idle',
          active: true
        },
        // 5. Ribbon Spool Mischief Monkey
        {
          id: 'ribbon_mischief',
          role: 'Ribbon Spool Monkey',
          anim: generateRibbonMischief64(),
          frame: 0,
          fpsTimer: 0,
          x: 284,
          y: 104,
          facing: 1,
          state: 'idle',
          active: true
        }
      ];
    }


    setMonkeyVariant(slotId, variantId) {
      if (typeof MonkeyVariants === 'undefined') return;
      const m = this.monkeys.find(mon => mon.id === slotId);
      if (!m) return;
      let action = 'stomp';
      if (slotId === 'carriage_rider') action = 'slam';
      else if (slotId === 'roller_acrobat') action = 'roll';
      else if (slotId === 'escapement_mechanic') action = 'tap';
      else if (slotId === 'ribbon_mischief') action = 'tug';
      m.variantId = variantId;
      m.anim = MonkeyVariants.generateActionAnimation64(variantId, action);
      m.frame = 0;
      m.fpsTimer = 0;
    }

    setAllMonkeyVariants(variantId) {
      if (typeof MonkeyVariants === 'undefined') return;
      this.currentRosterVariant = variantId;
      this.setMonkeyVariant('stomper', variantId);
      this.setMonkeyVariant('carriage_rider', variantId);
      this.setMonkeyVariant('roller_acrobat', variantId);
      this.setMonkeyVariant('escapement_mechanic', variantId);
      this.setMonkeyVariant('ribbon_mischief', variantId);
    }

    initAudio() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.audioCtx = new AudioCtx();
      } catch (e) {
        this.audioCtx = null;
      }
    }

    playClickSfx() {
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const now = this.audioCtx.currentTime;

      // Authentic mechanical strike clatter & ping
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.04);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.045);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.05);

      // Escapement ratchet tooth clack
      const clack = this.audioCtx.createOscillator();
      const clackGain = this.audioCtx.createGain();
      clack.type = 'square';
      clack.frequency.setValueAtTime(160, now);
      clackGain.gain.setValueAtTime(0.14, now);
      clackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.022);
      clack.connect(clackGain);
      clackGain.connect(this.audioCtx.destination);
      clack.start(now);
      clack.stop(now + 0.025);
    }

    playBellSfx() {
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const now = this.audioCtx.currentTime;

      // High-pitched bright brass margin bell (1850 Hz)
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1850, now);
      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.72);
    }

    triggerType(char = 'A') {
      const ch = char.toUpperCase();
      this.playClickSfx();

      // Advance Escapement Ticker Gearbox by 1 tooth
      this.targetTickerAngle += (Math.PI * 2) / 14;
      this.escapementDog = 1.0;

      // Advance Platen Roller slightly
      this.targetPlatenAngle += 0.12;

      // Rotate Ribbon Spools
      this.leftSpoolAngle += 0.35;
      this.rightSpoolAngle -= 0.35;

      // Key physical depression & target setting
      const targetKey = this.getKey(ch);
      if (targetKey) {
        targetKey.targetDepressedY = 3.5;
        targetKey.isDown = true;
      }

      // Sweep matching typebar from basket!
      this.activeTypebar = ch;
      this.typebarProgress = 1.0;
      const charCode = ch.charCodeAt(0);
      const norm = (charCode >= 65 && charCode <= 90) ? (charCode - 65) / 25 : 0.5;
      this.activeTypebarAngle = Math.PI * 0.18 + norm * (Math.PI * 0.64);

      // Advance Typed Text
      this.currentLineText += ch;
      if (this.currentLineText.length > 32) {
        this.triggerCarriageReturn();
      }

      // Carriage steps left
      this.targetCarriageX -= 4.2;
      if (this.targetCarriageX < -46) {
        this.triggerCarriageReturn();
      }

      // Sparks at platen center ribbon vibrator
      for (let i = 0; i < 5; i++) {
        this.particles.push({
          x: 192 + (Math.random() - 0.5) * 6,
          y: 84,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 2.5 - 1,
          life: 14,
          color: Math.random() < 0.5 ? PAL.brassLight : PAL.ironSpec
        });
      }

      // Target Key Stomper to Leap onto this Key!
      const stomper = this.monkeys.find(m => m.id === 'stomper');
      if (stomper && stomper.active) {
        stomper.startX = stomper.x;
        stomper.startY = stomper.y;
        if (targetKey) {
          stomper.targetX = targetKey.x;
          stomper.targetY = targetKey.baseY - 14;
        } else {
          stomper.targetX = 192 + (Math.random() - 0.5) * 60;
          stomper.targetY = 162;
        }
        stomper.facing = stomper.targetX < stomper.x ? -1 : 1;
        stomper.isJumping = true;
        stomper.jumpProgress = 0;
        stomper.frame = 0;
        stomper.state = 'playing';
      }

      // Escapement Mechanic Monkey taps gear with wrench!
      const mechanic = this.monkeys.find(m => m.id === 'escapement_mechanic');
      if (mechanic && mechanic.active) {
        mechanic.state = 'playing';
        mechanic.frame = 0;
        // Spark on gear tooth
        this.particles.push({
          x: 312,
          y: 172,
          vx: -1.2,
          vy: -1.5,
          life: 10,
          color: PAL.brassLight
        });
      }

      // Ribbon Mischief chance
      const ribbonM = this.monkeys.find(m => m.id === 'ribbon_mischief');
      if (ribbonM && Math.random() < 0.4) {
        ribbonM.state = 'playing';
        ribbonM.frame = 0;
        this.footprints.push({
          x: ribbonM.x + (Math.random() - 0.5) * 10,
          y: 148 + Math.random() * 6,
          life: 360
        });
      }
    }

    triggerCarriageReturn() {
      this.playBellSfx();
      this.bellDingTimer = 30;

      this.bellRings.push({
        x: 290 + this.carriageX,
        y: 62,
        r: 4,
        alpha: 1.0
      });

      this.targetCarriageX = 24;
      this.targetLeverAngle = 0.65;

      const rider = this.monkeys.find(m => m.id === 'carriage_rider');
      if (rider && rider.active) {
        rider.state = 'playing';
        rider.frame = 0;
      }

      // Platen roller spins & paper scrolls
      this.targetPlatenAngle += Math.PI * 1.5;
      const roller = this.monkeys.find(m => m.id === 'roller_acrobat');
      if (roller && roller.active) {
        roller.state = 'playing';
        roller.frame = 0;
      }

      if (this.currentLineText.trim().length > 0) {
        this.paperLines.push(this.currentLineText);
        if (this.paperLines.length > 5) this.paperLines.shift();
      }
      this.currentLineText = '';
      this.targetPaperScrollY += 10;
    }

    triggerVictory() {
      this.playBellSfx();
      const victoryAnim = generateVictoryDance64();
      this.monkeys.forEach(m => {
        m.anim = victoryAnim;
        m.state = 'playing';
        m.frame = 0;
      });

      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 1.2 + Math.random() * 3.8;
        this.particles.push({
          x: 192,
          y: 90,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd - 2,
          life: 40,
          color: [PAL.brassLight, PAL.redLight, PAL.leafLight, PAL.paperLight][Math.floor(Math.random() * 4)]
        });
      }
    }

    update() {
      // Smooth Camera Lerp
      this.camX += (this.targetCamX - this.camX) * 0.12;
      this.camY += (this.targetCamY - this.camY) * 0.12;
      this.camZoom += (this.targetCamZoom - this.camZoom) * 0.12;

      // Smooth Carriage Movement
      this.carriageX += (this.targetCarriageX - this.carriageX) * 0.22;

      // Escapement Ticker Gearbox Lerp & Dog Recovery
      this.tickerAngle += (this.targetTickerAngle - this.tickerAngle) * 0.35;
      if (this.escapementDog > 0) {
        this.escapementDog *= 0.8;
        if (this.escapementDog < 0.05) this.escapementDog = 0;
      }

      // Platen Angle Lerp
      this.platenAngle += (this.targetPlatenAngle - this.platenAngle) * 0.25;

      // Lever recovery
      this.leverAngle += (this.targetLeverAngle - this.leverAngle) * 0.25;
      if (Math.abs(this.targetLeverAngle) > 0.05) this.targetLeverAngle *= 0.85;

      // Paper scroll lerp
      this.paperScrollY += (this.targetPaperScrollY - this.paperScrollY) * 0.2;

      // Typebar recovery
      if (this.typebarProgress > 0) {
        this.typebarProgress -= 0.12;
        if (this.typebarProgress < 0) this.typebarProgress = 0;
      }

      // Bell timer & soundwave rings
      if (this.bellDingTimer > 0) this.bellDingTimer--;
      for (let i = this.bellRings.length - 1; i >= 0; i--) {
        const b = this.bellRings[i];
        b.r += 0.8;
        b.alpha -= 0.04;
        if (b.alpha <= 0) this.bellRings.splice(i, 1);
      }

      // Update Key Spring Depressions
      const allKeys = [...this.keys, this.spacebar];
      allKeys.forEach(k => {
        k.depressedY += (k.targetDepressedY - k.depressedY) * 0.35;
        if (k.targetDepressedY > 0) {
          k.targetDepressedY *= 0.65;
          if (k.targetDepressedY < 0.1) {
            k.targetDepressedY = 0;
            k.isDown = false;
          }
        }
      });

      // Update Particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.14;
        p.life--;
        if (p.life <= 0) this.particles.splice(i, 1);
      }

      // Footprints Fade
      for (let i = this.footprints.length - 1; i >= 0; i--) {
        this.footprints[i].life--;
        if (this.footprints[i].life <= 0) this.footprints.splice(i, 1);
      }

      // Update Monkeys with Physical Machine Linkage
      this.monkeys.forEach(m => {
        if (m.id === 'carriage_rider') {
          m.x = 88 + this.carriageX;
        }
        if (m.id === 'roller_acrobat') {
          m.x = 192 + this.carriageX;
        }

        // Key Stomper Parabolic Hurdling
        if (m.id === 'stomper' && m.isJumping) {
          m.jumpProgress += 0.075;
          if (m.jumpProgress >= 1.0) {
            m.jumpProgress = 1.0;
            m.isJumping = false;
            m.x = m.targetX;
            m.y = m.targetY;

            // Dust cloud puffs on landing
            for (let i = 0; i < 6; i++) {
              this.particles.push({
                x: m.x + (Math.random() - 0.5) * 10,
                y: m.y + 16,
                vx: (Math.random() - 0.5) * 2.8,
                vy: -Math.random() * 1.4,
                life: 14,
                color: PAL.dustLight
              });
            }
          } else {
            const t = m.jumpProgress;
            m.x = m.startX + (m.targetX - m.startX) * t;
            const dist = Math.abs(m.targetX - m.startX);
            const arcH = 26 + Math.min(32, dist * 0.45);
            m.y = (m.startY + (m.targetY - m.startY) * t) - Math.sin(t * Math.PI) * arcH;
          }
        }

        // Smoothed Animation Frame Advance with Impact Holds & Eased Pacing
        m.fpsTimer++;
        // Natural retro pacing: 18-20 FPS base speed (interval 3-4 ticks)
        const targetFps = Math.min(20, m.anim.fps || 20);
        let interval = Math.round(60 / targetFps);

        // Hold keycap impact squash and jump launch anticipation for 2 extra ticks
        if (m.state === 'playing') {
          const isImpactFrame = (m.id === 'stomper' && (m.frame === 15 || m.frame === 16)) ||
                                (m.id === 'carriage_rider' && (m.frame === 11 || m.frame === 12)) ||
                                (m.id === 'escapement_mechanic' && (m.frame === 9 || m.frame === 10));
          if (isImpactFrame) {
            interval += 2; // Extra readable weight on impact
          }
        }

        if (m.fpsTimer >= interval) {
          m.fpsTimer = 0;
          if (m.state === 'playing') {
            m.frame++;
            if (m.frame >= m.anim.frames.length) {
              m.frame = 0;
              m.state = 'idle';
            }
          } else {
            // Idle breathing cycle: relaxed 4-frame pacing
            m.idleTimer = (m.idleTimer || 0) + 1;
            if (m.idleTimer >= 2) {
              m.idleTimer = 0;
              m.frame = (m.frame + 1) % 4;
            }
          }
        }
      });
    }

    render() {
      const g = this.ctx;
      g.imageSmoothingEnabled = false;
      const snap = (v) => this.pixelSnap ? Math.round(v) : v;

      g.save();
      g.clearRect(0, 0, this.canvas.width, this.canvas.height);

      g.scale(this.scale, this.scale);
      g.translate(snap(this.logicalW / 2), snap(this.logicalH / 2));
      g.scale(this.camZoom, this.camZoom);
      g.translate(-snap(this.camX), -snap(this.camY));

      // 1. Desk Surface Theme
      const theme = this.deskTheme || 'mahogany';
      if (theme === 'jungle') {
        g.fillStyle = '#0a2a1c';
        g.fillRect(0, 0, this.logicalW, this.logicalH);
        g.fillStyle = '#144630';
        for (let y = 20; y < this.logicalH; y += 36) {
          g.fillRect(0, y, this.logicalW, 2);
        }
      } else if (theme === 'blueprint') {
        g.fillStyle = '#0c1a2e';
        g.fillRect(0, 0, this.logicalW, this.logicalH);
        g.fillStyle = '#163259';
        for (let x = 0; x < this.logicalW; x += 16) g.fillRect(x, 0, 1, this.logicalH);
        for (let y = 0; y < this.logicalH; y += 16) g.fillRect(0, y, this.logicalW, 1);
      } else if (theme === 'parchment') {
        g.fillStyle = '#d9ceb9';
        g.fillRect(0, 0, this.logicalW, this.logicalH);
        g.fillStyle = '#c7bca5';
        for (let y = 30; y < this.logicalH; y += 42) {
          g.fillRect(0, y, this.logicalW, 1);
        }
      } else {
        // Mahogany Desk Surface
        g.fillStyle = '#160c07';
        g.fillRect(0, 0, this.logicalW, this.logicalH);
        g.fillStyle = '#22140c';
        for (let y = 30; y < this.logicalH; y += 42) {
          g.fillRect(0, y, this.logicalW, 2);
        }
      }

      // Desk Cast Shadow
      g.fillStyle = 'rgba(0, 0, 0, 0.55)';
      g.fillRect(36, 196, 312, 32);

      // Inky Paw Prints
      this.footprints.forEach(fp => {
        const a = Math.min(1.0, fp.life / 60);
        g.fillStyle = `rgba(18, 9, 12, ${a * 0.75})`;
        g.fillRect(snap(fp.x - 3), snap(fp.y - 2), 6, 4);
        g.fillRect(snap(fp.x - 3), snap(fp.y - 4), 1, 2);
        g.fillRect(fp.x, snap(fp.y - 5), 1, 2);
        g.fillRect(snap(fp.x + 3), snap(fp.y - 4), 1, 2);
      });

      // 2. Render Full Pixel Typewriter Assembly
      this.renderTypewriter(g, snap);

      // 3. Render Monkeys (Positioned, Facing, and Snapped)
      const halfSize = this.resMode === '64' ? 32 : 24;
      this.monkeys.forEach(m => {
        if (!m.active) return;
        const currentFrame = m.anim.frames[m.frame] || m.anim.frames[0];
        if (currentFrame) {
          const mx = snap(m.x);
          const my = snap(m.y);

          // Shadow
          drawSteppedEllipse(g, mx, my + halfSize - 8, Math.round(halfSize * 0.38), 4, 'rgba(12, 8, 8, 0.45)');

          // Sprite Blit
          g.save();
          g.translate(mx, my);
          if (m.facing === -1) {
            g.scale(-1, 1);
          }
          g.drawImage(currentFrame, -halfSize, -halfSize);
          g.restore();
        }
      });

      // 4. Render Dynamic Particles (Sparks & Dust)
      this.particles.forEach(p => {
        g.fillStyle = p.color;
        const sz = p.life > 7 ? 2 : 1;
        g.fillRect(snap(p.x), snap(p.y), sz, sz);
      });

      // 5. Soundwave Bell Rings
      this.bellRings.forEach(b => {
        drawSteppedRing(g, snap(b.x), snap(b.y), b.r, 1, `rgba(255, 209, 59, ${b.alpha})`);
      });

      // 6. Optional Pixel Grid
      if (this.showPixelGrid && this.scale >= 2) {
        g.fillStyle = 'rgba(255, 255, 255, 0.06)';
        for (let x = 0; x < this.logicalW; x += 2) {
          g.fillRect(x, 0, 1 / this.scale, this.logicalH);
        }
        for (let y = 0; y < this.logicalH; y += 2) {
          g.fillRect(0, y, this.logicalW, 1 / this.scale);
        }
      }

      g.restore();
    }

    renderTypewriter(g, snap) {
      const cx = 192;
      const cy = 145;
      const carX = snap(cx + this.carriageX);

      // ==========================================
      // LAYER A: MOVING CARRIAGE & FLUTED RUBBER PLATEN
      // ==========================================
      g.save();
      g.translate(carX, 68);

      // Carriage Frame Rail Base (Cast Iron & Polished Steel)
      g.fillStyle = PAL.ironBlack;
      g.fillRect(-116, -7, 232, 22);
      g.fillStyle = PAL.ironDark;
      g.fillRect(-114, -5, 228, 18);
      g.fillStyle = PAL.ironMid;
      g.fillRect(-114, -5, 228, 2);
      g.fillStyle = PAL.ironHi;
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
      const fluteScroll = Math.round((this.platenAngle * 10) % 4);
      for (let fy = -11 + fluteScroll; fy <= 4; fy += 4) {
        g.fillRect(-96, fy, 192, 1);
      }

      // Platen Knurled Knobs (Left & Right) with Rotating Ridges
      const drawKnurledKnob = (kx) => {
        g.fillStyle = PAL.ironBlack;
        g.fillRect(kx - 1, -16, 13, 26);
        g.fillStyle = PAL.brassDark;
        g.fillRect(kx, -15, 11, 24);
        g.fillStyle = PAL.brassLight;
        g.fillRect(kx + 2, -13, 7, 20);

        // Vertical knurling notches shifting with platenAngle
        const notchOff = Math.round((this.platenAngle * 8) % 3);
        g.fillStyle = PAL.brassDark;
        for (let nx = kx + 2 + notchOff; nx <= kx + 8; nx += 3) {
          g.fillRect(nx, -13, 1, 20);
        }
      };
      drawKnurledKnob(-107);
      drawKnurledKnob(96);

      // Paper Sheet (Ivory texture with red margin line)
      const paperW = 142;
      const paperH = 88;
      g.fillStyle = PAL.paperDark;
      g.fillRect(-paperW / 2, -paperH + 4, paperW, paperH);
      g.fillStyle = PAL.paperLight;
      g.fillRect(-paperW / 2 + 2, -paperH + 6, paperW - 4, paperH - 4);
      g.fillStyle = PAL.redBase;
      g.fillRect(-paperW / 2 + 16, -paperH + 6, 1, paperH - 4); // Margin line

      // Vintage Ornamental Watermark / Letterhead Stamp
      drawPixelGlyph(g, 'I', -25, -paperH + 10, 'rgba(150, 140, 120, 0.45)');
      drawPixelGlyph(g, 'M', -19, -paperH + 10, 'rgba(150, 140, 120, 0.45)');
      drawPixelGlyph(g, 'I', -13, -paperH + 10, 'rgba(150, 140, 120, 0.45)');
      g.fillStyle = 'rgba(150, 140, 120, 0.35)';
      g.fillRect(-35, -paperH + 17, 70, 1);
      g.fillRect(-20, -paperH + 19, 40, 1);

      // Typed Text on Paper (Crisp Monospace Pixel Font)
      this.paperLines.forEach((line, idx) => {
        const lineY = -48 + idx * 8 - (this.paperScrollY % 8);
        if (lineY > -paperH + 10 && lineY < -8) {
          for (let ci = 0; ci < line.length; ci++) {
            drawPixelGlyph(g, line[ci], -paperW / 2 + 20 + ci * 5, lineY, PAL.inkBlack);
          }
        }
      });

      // Current Line
      for (let ci = 0; ci < this.currentLineText.length; ci++) {
        drawPixelGlyph(g, this.currentLineText[ci], -paperW / 2 + 20 + ci * 5, -14, PAL.redDark);
      }
      // Blinking Cursor
      if (Math.floor(Date.now() / 350) % 2 === 0) {
        g.fillStyle = PAL.redDark;
        g.fillRect(-paperW / 2 + 20 + this.currentLineText.length * 5, -14, 4, 5);
      }

      // Paper Bail Bar (Steel rod holding down sheet)
      g.fillStyle = PAL.ironHi;
      g.fillRect(-94, -2, 188, 3);
      g.fillStyle = '#1c222a';
      g.fillRect(-62, -3, 8, 5); // Left rubber pinch roller
      g.fillRect(54, -3, 8, 5);  // Right rubber pinch roller

      // Articulated Carriage Return Lever (Pivots smoothly on Return)
      g.save();
      g.translate(-108, -6);
      g.rotate(-0.2 + this.leverAngle);
      g.fillStyle = PAL.ironBlack;
      g.fillRect(-3, -33, 8, 36);
      g.fillStyle = PAL.brassDark;
      g.fillRect(-2, -32, 6, 34);
      g.fillStyle = PAL.brassLight;
      g.fillRect(-1, -30, 4, 30);
      g.fillStyle = PAL.brassHi;
      g.fillRect(-7, -35, 16, 8); // Brass paddle
      g.restore();

      // Dome Margin Bell with Spring Clapper
      drawSteppedCircle(g, 104, -2, 7.5, PAL.brassDark);
      drawSteppedCircle(g, 103, -3, 5.5, PAL.brassLight);
      g.fillStyle = PAL.brassHi;
      g.fillRect(101, -5, 2, 2);

      // Bell Clapper Hammer
      g.fillStyle = PAL.ironHi;
      const clapperOff = this.bellDingTimer > 0 ? 3 : 0;
      g.fillRect(110 - clapperOff, -3, 4, 2);

      g.restore(); // End Carriage transform

      // ==========================================
      // LAYER B: MAIN CAST IRON BODY & GOLD PINSTRIPING
      // ==========================================
      // Main Cast Iron Chassis
      g.fillStyle = PAL.ironBlack;
      g.fillRect(cx - 126, cy - 43, 252, 96);
      g.fillStyle = PAL.ironDark;
      g.fillRect(cx - 124, cy - 41, 248, 92);
      g.fillStyle = PAL.ironMid;
      g.fillRect(cx - 123, cy - 40, 246, 2); // Chamfer highlight

      // Gold Pinstripe Borders
      g.fillStyle = PAL.brassMid;
      g.fillRect(cx - 121, cy - 38, 242, 2);
      g.fillRect(cx - 121, cy + 49, 242, 2);
      g.fillRect(cx - 121, cy - 38, 2, 89);
      g.fillRect(cx + 119, cy - 38, 2, 89);

      // Flank Cast Iron Ventilation Louvers (Beveled 3D Slits)
      g.fillStyle = '#080a0e';
      for (let ly = cy - 24; ly <= cy + 18; ly += 7) {
        g.fillRect(cx - 114, ly, 10, 3);
        g.fillRect(cx + 104, ly, 10, 3);
        g.fillStyle = PAL.ironMid;
        g.fillRect(cx - 114, ly + 3, 10, 1);
        g.fillRect(cx + 104, ly + 3, 10, 1);
        g.fillStyle = '#080a0e';
      }

      // 4 Corner Brass Hex Rivets with Specular Gleam
      const drawRivet = (rx, ry) => {
        drawSteppedCircle(g, rx, ry, 2.5, PAL.brassDark);
        g.fillStyle = PAL.brassHi;
        g.fillRect(rx - 1, ry - 1, 1, 1);
      };
      drawRivet(cx - 118, cy - 35);
      drawRivet(cx + 116, cy - 35);
      drawRivet(cx - 118, cy + 46);
      drawRivet(cx + 116, cy + 46);

      // Cast Iron Feet with Rubber Base
      g.fillStyle = PAL.ironBlack;
      g.fillRect(cx - 125, cy + 51, 18, 6);
      g.fillRect(cx + 107, cy + 51, 18, 6);
      g.fillStyle = '#0a0d12';
      g.fillRect(cx - 123, cy + 55, 14, 3);
      g.fillRect(cx + 109, cy + 55, 14, 3);

      // Brass Medallion ("REGAL SCRIBE NO. 10")
      g.fillStyle = PAL.brassDark;
      g.fillRect(cx - 56, cy - 37, 112, 13);
      g.fillStyle = PAL.brassLight;
      g.fillRect(cx - 54, cy - 35, 108, 9);
      const titleText = 'REGAL SCRIBE NO. 10';
      const titleX = cx - (titleText.length * 5) / 2;
      for (let ci = 0; ci < titleText.length; ci++) {
        drawPixelGlyph(g, titleText[ci], titleX + ci * 5, cy - 33, PAL.inkBlack);
      }

      // ==========================================
      // LAYER C: TYPEBAR BASKET LINKAGES
      // ==========================================
      // Semicircular Cavity
      drawSteppedSemicircle(g, cx, cy - 14, 52, '#0a0d10', PAL.ironMid);

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

        drawSteppedLine(g, snap(x1), snap(y1), snap(x2), snap(y2), (i % 2 === 0) ? PAL.ironHi : PAL.ironMid, 1);

        // Type hammer heads at tips
        g.fillStyle = PAL.ironHi;
        g.fillRect(snap(x2 - 1), snap(y2 - 1), 2, 2);
      }

      // Active Typebar Striking Platen!
      if (this.typebarProgress > 0) {
        const strikeH = 46 * this.typebarProgress;
        drawSteppedLine(g, cx, cy - 10, cx, Math.round(cy - 10 - strikeH), PAL.ironSpec, 2);

        g.fillStyle = PAL.brassLight;
        g.fillRect(cx - 3, cy - 12 - strikeH, 6, 4);
      }

      // Central Ribbon Vibrator Guide (Hops up 4px when struck)
      const vibY = cy - 42 - (this.typebarProgress * 4);
      g.fillStyle = PAL.ironHi;
      g.fillRect(cx - 6, vibY, 12, 10);
      g.fillStyle = PAL.ironBlack;
      g.fillRect(cx - 4, vibY + 2, 8, 6);

      // ==========================================
      // LAYER D: MECHANICAL ESCAPEMENT TICKER GEARBOX (RIGHT FLANK)
      // ==========================================
      const gearBoxX = cx + 120;
      const gearBoxY = cy + 18;
      g.fillStyle = PAL.ironBlack;
      g.fillRect(gearBoxX - 10, gearBoxY - 14, 26, 36);
      g.fillStyle = PAL.ironDark;
      g.fillRect(gearBoxX - 8, gearBoxY - 12, 22, 32);

      // Rotating Escapement Ratchet Cogwheel (14 teeth)
      g.save();
      g.translate(gearBoxX, gearBoxY);
      g.rotate(this.tickerAngle);

      // Steel Cog Body
      drawSteppedCircle(g, 0, 0, 11, PAL.ironLight);
      drawSteppedCircle(g, 0, 0, 6, PAL.ironBlack);

      // 14 Sharp Ratchet Teeth
      g.fillStyle = PAL.ironHi;
      for (let t = 0; t < 14; t++) {
        const tAng = (t / 14) * Math.PI * 2;
        const tx = Math.cos(tAng) * 12;
        const ty = Math.sin(tAng) * 12;
        g.fillRect(snap(tx - 1), snap(ty - 1), 2, 2);
      }

      // Brass Center Pinion & Spoke
      drawSteppedCircle(g, 0, 0, 3, PAL.brassLight);
      g.restore();

      // Escapement Anchor / Rocking Dog Lever
      const dogRock = this.escapementDog * 4;
      g.fillStyle = PAL.brassHi;
      g.fillRect(gearBoxX - 10, gearBoxY - 10 - dogRock, 4, 8);
      g.fillRect(gearBoxX - 6, gearBoxY - 10 - dogRock, 3, 3);

      // ==========================================
      // LAYER E: TWIN EXPOSED BRASS RIBBON SPOOLS
      // ==========================================
      const drawSpool = (sx, sy, angle, isLeft) => {
        // Pure Stepped Pixel Spool (Zero vector arc blur)
        drawSteppedCircle(g, sx, sy, 18, '#0a0d10');
        drawSteppedCircle(g, sx, sy, 16, PAL.brassBase);
        drawSteppedCircle(g, sx, sy, 13, isLeft ? PAL.redBase : PAL.inkBlack);

        // 4 Stepped Spoke Cutouts
        for (let sp = 0; sp < 4; sp++) {
          const spokeAng = angle + (sp * Math.PI / 2);
          const px = sx + Math.cos(spokeAng) * 7;
          const py = sy + Math.sin(spokeAng) * 7;
          drawSteppedCircle(g, Math.round(px), Math.round(py), 3, PAL.brassDark);
        }

        drawSteppedCircle(g, sx, sy, 4, PAL.brassHi);
      };

      const spoolY = cy - 20;
      drawSpool(cx - 86, spoolY, this.leftSpoolAngle, true);
      drawSpool(cx + 86, spoolY, this.rightSpoolAngle, false);

      // Ribbon Threading Tape (Stepped Pixel Raster Lines)
      drawSteppedLine(g, cx - 70, spoolY, cx - 6, Math.round(vibY + 4), PAL.redBase, 2);
      drawSteppedLine(g, cx + 6, Math.round(vibY + 4), cx + 70, spoolY, PAL.inkBlack, 2);

      // ==========================================
      // LAYER F: 4-ROW TIERED BEVELED KEYBOARD & SPACEBAR
      // ==========================================
      // Keyboard Tray
      g.fillStyle = PAL.ironBlack;
      g.fillRect(cx - 106, cy + 4, 212, 56);
      g.fillStyle = PAL.ironDark;
      g.fillRect(cx - 104, cy + 6, 208, 52);

      // Render Individual Round Keys (Handcrafted 16-Bit Pixel Clusters)
      this.keys.forEach(k => {
        const isHovered = this.hoveredKey === k;
        const ky = snap(k.baseY + k.depressedY);
        const kx = snap(k.x);

        // Vertical Steel Stem Underneath
        g.fillStyle = PAL.ironHi;
        g.fillRect(kx - 1, ky + 2, 2, (k.baseY - ky) + 5);

        // Outer Cast Shadow into Well
        g.fillStyle = PAL.ironBlack;
        g.fillRect(kx - 5, ky + 4, 10, 2);

        // Brass / Chrome Beveled Outer Ring (11x11 Pixel Circle)
        g.fillStyle = isHovered ? PAL.brassHi : PAL.brassMid;
        g.fillRect(kx - 5, ky - 3, 10, 7);
        g.fillRect(kx - 4, ky - 5, 8, 11);
        g.fillRect(kx - 3, ky - 6, 6, 13);

        // Inner Shaded Face (Ivory when raised, depressed gold when pushed)
        g.fillStyle = k.isDown ? PAL.brassLight : PAL.keyFace;
        g.fillRect(kx - 4, ky - 2, 8, 5);
        g.fillRect(kx - 3, ky - 4, 6, 9);
        g.fillRect(kx - 2, ky - 5, 4, 11);

        // Crescent Shadow on bottom of keycap
        if (!k.isDown) {
          g.fillStyle = PAL.keyShade;
          g.fillRect(kx - 3, ky + 2, 6, 2);
          g.fillRect(kx - 2, ky + 3, 4, 1);
        }

        // Crisp 4x5 Bitmap Pixel Font Glyph!
        drawPixelGlyph(g, k.ch, kx - 2, ky - 2, PAL.inkBlack);
      });

      // Spacebar
      const s = this.spacebar;
      const sy = snap(s.baseY + s.depressedY);
      const isSpaceHovered = this.hoveredKey === s;

      // Dual Steel Plunger Stems
      g.fillStyle = PAL.ironHi;
      g.fillRect(s.x - 30, sy + 3, 3, (s.baseY - sy) + 6);
      g.fillRect(s.x + 27, sy + 3, 3, (s.baseY - sy) + 6);

      // Spacebar Body (Beveled Brass/Iron with Knurled Top)
      g.fillStyle = PAL.ironBlack;
      g.fillRect(s.x - s.w / 2 - 1, sy, s.w + 2, s.h + 2);
      g.fillStyle = PAL.brassDark;
      g.fillRect(s.x - s.w / 2, sy + 1, s.w, s.h);
      g.fillStyle = isSpaceHovered || s.isDown ? PAL.brassHi : PAL.brassLight;
      g.fillRect(s.x - s.w / 2, sy, s.w, s.h - 1);
      g.fillStyle = PAL.brassHi;
      g.fillRect(s.x - s.w / 2 + 2, sy + 1, s.w - 4, 1);
    }
  }

  /* ---------------------------------------------------------------
   * SPRITESHEET EXPORTER
   * --------------------------------------------------------------- */
  function exportAnimationToSpritesheet(animData) {
    const { frames, name } = animData;
    const frameW = frames[0].width;
    const frameH = frames[0].height;
    const sheetCanvas = document.createElement('canvas');
    sheetCanvas.width = frameW * frames.length;
    sheetCanvas.height = frameH;
    const sCtx = sheetCanvas.getContext('2d');
    sCtx.imageSmoothingEnabled = false;

    frames.forEach((frame, i) => {
      sCtx.drawImage(frame, i * frameW, 0);
    });

    return {
      name,
      canvas: sheetCanvas,
      dataUrl: sheetCanvas.toDataURL('image/png'),
      frameW,
      frameH,
      frameCount: frames.length,
      fps: animData.fps
    };
  }

  /* ---------------------------------------------------------------
   * PUBLIC MODULE EXPORTS
   * --------------------------------------------------------------- */
  return {
    PAL,
    PIXEL_GLYPHS,
    drawPixelGlyph,
    PixelBuffer,
    renderMonkey64,
    generateKeyStomp64,
    generateCarriageLever64,
    generateRollerAcrobat64,
    generateEscapementMechanic64,
    generateRibbonMischief64,
    generateVictoryDance64,
    TypewriterPixelStage,
    exportAnimationToSpritesheet,
    getAllAnimations64() {
      return [
        generateKeyStomp64(),
        generateCarriageLever64(),
        generateRollerAcrobat64(),
        generateEscapementMechanic64(),
        generateRibbonMischief64(),
        generateVictoryDance64()
      ];
    }
  };
}));
