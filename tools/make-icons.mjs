// Dev helper (needs puppeteer-core + Chrome; see docs/plan/README.md). node tools/make-icons.mjs
// Builds installed-app icons from icons/src/app-icon-master.png and browser icons from favicon.svg:
//   app-icon-master.png  -> icons/icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png (the installed app's icon)
//   favicon.svg          -> icons/favicon-16/32/48.png and favicon.ico (browser tab fallbacks)
import puppeteer from 'puppeteer-core';
import fs from 'fs';
const here = process.env.IMI_ROOT || new URL('../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const data = f => 'data:image/' + (f.endsWith('.svg') ? 'svg+xml' : 'png') + ';base64,' + fs.readFileSync(here + f).toString('base64');
const JOBS = [
  ['icons/src/app-icon-master.png', 'icon-192.png', 192, 'any'], ['icons/src/app-icon-master.png', 'icon-512.png', 512, 'any'],
  ['icons/src/app-icon-master.png', 'icon-maskable-512.png', 512, 'maskable'], ['icons/src/app-icon-master.png', 'apple-touch-icon.png', 180, 'apple'],
  ['favicon.svg', 'favicon-16.png', 16, 'any'], ['favicon.svg', 'favicon-32.png', 32, 'any'], ['favicon.svg', 'favicon-48.png', 48, 'any']
];
const b = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
const page = await b.newPage();
await page.setViewport({ width: 600, height: 600 });
const out = {};
for (const [src, name, size, kind] of JOBS) {
  out[name] = await page.evaluate(async (url, size, kind) => {
    const img = new Image(); img.src = url; await img.decode();
    const W = img.naturalWidth;
    const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
    // step-down scaling (halve until close, then the last step) keeps small sizes crisp instead of aliased
    const scaled = (target) => { let cur = canvas(W, W); cur.getContext('2d').drawImage(img, 0, 0); let s = W;
      while (s / 2 >= target) { const n = canvas(s / 2, s / 2), x = n.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cur, 0, 0, s / 2, s / 2); cur = n; s /= 2; }
      if (s !== target) { const n = canvas(target, target), x = n.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cur, 0, 0, target, target); cur = n; } return cur; };
    const o = canvas(size, size), x = o.getContext('2d');
    if (kind === 'any') x.drawImage(scaled(size), 0, 0);
    else {                                                            // maskable / iOS: opaque full-bleed square, art inside the safe zone over a blurred copy of itself
      x.fillStyle = '#0a2a1c'; x.fillRect(0, 0, size, size);
      const bg = scaled(Math.round(size * 1.4)); x.save(); x.filter = `blur(${Math.round(size * 0.05)}px)`; x.drawImage(bg, (size - bg.width) / 2, (size - bg.height) / 2); x.restore();
      const k = kind === 'maskable' ? 0.82 : 0.94, inner = Math.round(size * k), art = scaled(inner); x.drawImage(art, (size - inner) / 2, (size - inner) / 2);
    }
    return o.toDataURL('image/png');
  }, data(src), size, kind);
  fs.writeFileSync(here + 'icons/' + name, Buffer.from(out[name].split(',')[1], 'base64'));
}
await b.close();
// favicon.ico: 16/32/48 PNGs inside an ICO container (every current browser reads this)
const pngs = [16, 32, 48].map(n => fs.readFileSync(here + `icons/favicon-${n}.png`)), head = Buffer.alloc(6 + 16 * pngs.length);
head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
let off = head.length; pngs.forEach((p, i) => { const e = 6 + i * 16, n = [16, 32, 48][i]; head[e] = n; head[e + 1] = n; head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6); head.writeUInt32LE(p.length, e + 8); head.writeUInt32LE(off, e + 12); off += p.length; });
fs.writeFileSync(here + 'favicon.ico', Buffer.concat([head, ...pngs]));
console.log('icons written');
