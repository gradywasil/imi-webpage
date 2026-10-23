/* The three secondary currencies as pictures: Diamond Bananas (animated), Legacy stars and Inspiration.
   Pixel edition: sprites from pixel.js, set as CSS variables. Classic edition: the vector versions below.
   Everything else in the game asks for the picture here instead of writing the currency's name out. */
window.Gems = (() => {
  'use strict';
  const svg = body => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${body}</svg>`)}")`;
  const CLASSIC = {
    dbn: svg(`<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ecfcff"/><stop offset=".45" stop-color="#52d0ff"/><stop offset="1" stop-color="#1d5fb0"/></linearGradient></defs>`
      + `<path d="M7 3C4.4 12 8.6 21 21 19.2l.7-2.5C14.6 16.6 11 11 10.6 3z" fill="url(#g)" stroke="#14407a" stroke-width="1.3" stroke-linejoin="round"/>`
      + `<path d="M7 1.6h3.8l-.1 2.4H7z" fill="#a86cff" stroke="#4a2aa0" stroke-width="1" stroke-linejoin="round"/>`
      + `<path d="M7.6 6.2l2.6 2.6M7.4 10.4l3.2 2.6M10.2 14.6l3 1.6M14 16.4l1.8 1.8" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".9"/>`),
    star: svg(`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff08c"/><stop offset="1" stop-color="#ffb81f"/></linearGradient></defs>`
      + `<path d="M12 1.8l3 6.6 7.2.7-5.4 4.8 1.6 7.1L12 17.3l-6.4 3.7 1.6-7.1L1.8 9.1l7.2-.7z" fill="url(#g)" stroke="#b56a00" stroke-width="1.3" stroke-linejoin="round"/>`),
    insp: svg(`<defs><radialGradient id="g" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#fff9c4"/><stop offset=".55" stop-color="#ffd23a"/><stop offset="1" stop-color="#f29a1c"/></radialGradient></defs>`
      + `<path d="M12 2.2a7.3 7.3 0 0 0-4.2 13.3c.6.5.9 1.1.9 1.8v.5h6.6v-.5c0-.7.3-1.3.9-1.8A7.3 7.3 0 0 0 12 2.2z" fill="url(#g)" stroke="#b56a00" stroke-width="1.2" stroke-linejoin="round"/>`
      + `<path d="M9 19.2h6M9.8 21.6h4.4" stroke="#6d6a7c" stroke-width="1.8" stroke-linecap="round"/>`)
  };
  CLASSIC.part = svg(`<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f4fb"/><stop offset=".55" stop-color="#b8b8c8"/><stop offset="1" stop-color="#6c6c80"/></linearGradient></defs>`
      + `<path d="M10.4 1.6h3.2l.6 2.7 1.9.8 2.3-1.5 2.3 2.3-1.5 2.3.8 1.9 2.7.6v3.2l-2.7.6-.8 1.9 1.5 2.3-2.3 2.3-2.3-1.5-1.9.8-.6 2.7h-3.2l-.6-2.7-1.9-.8-2.3 1.5-2.3-2.3 1.5-2.3-.8-1.9-2.7-.6v-3.2l2.7-.6.8-1.9-1.5-2.3 2.3-2.3 2.3 1.5 1.9-.8z" fill="url(#g)" stroke="#43435a" stroke-width="1.2" stroke-linejoin="round"/>`
      + `<circle cx="12" cy="12" r="3.3" fill="#2a2a3a" stroke="#43435a" stroke-width="1"/>`);
  CLASSIC.seal = svg(`<defs><radialGradient id="g" cx=".38" cy=".32" r=".85"><stop offset="0" stop-color="#ff8f7a"/><stop offset=".6" stop-color="#d63a2c"/><stop offset="1" stop-color="#8a1a14"/></radialGradient></defs>`
      + `<path d="M7.4 14.6L5.2 22l3.4-1.8 1.6 2.6 1.4-7z M16.6 14.6l2.2 7.4-3.4-1.8-1.6 2.6-1.4-7z" fill="#e8a622" stroke="#8a5a0a" stroke-width="1" stroke-linejoin="round"/>`
      + `<circle cx="12" cy="10" r="8.2" fill="#f2b23a" stroke="#8a5a0a" stroke-width="1.3"/><circle cx="12" cy="10" r="6" fill="url(#g)" stroke="#6a1a14" stroke-width="1"/>`
      + `<path d="M12 5.6l1.3 2.7 2.9.3-2.2 2 .7 2.9-2.7-1.5-2.7 1.5.7-2.9-2.2-2 2.9-.3z" fill="#ffe28a" stroke="#b56a00" stroke-width=".7" stroke-linejoin="round"/>`);
  CLASSIC.ban = svg(`<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff08c"/><stop offset=".6" stop-color="#ffd23a"/><stop offset="1" stop-color="#c98f0e"/></linearGradient></defs>`
      + `<path d="M7 3C4.4 12 8.6 21 21 19.2l.7-2.5C14.6 16.6 11 11 10.6 3z" fill="url(#g)" stroke="#8a5a0a" stroke-width="1.3" stroke-linejoin="round"/><path d="M7 1.6h3.8l-.1 2.4H7z" fill="#7a4c28" stroke="#2a170b" stroke-width="1" stroke-linejoin="round"/>`);
  for (const k in CLASSIC) document.documentElement.style.setProperty('--gc-' + k, CLASSIC[k]);
  const NAME = { dbn: 'Diamond Bananas', star: 'Legacy stars', insp: 'Inspiration', ban: 'bananas', part: 'Parts', seal: 'Press Seals' };
  /* the picture alone; the diamond banana also gets its sparkles */
  const html = (kind, cls = '') => `<span class="gem ${kind} ${cls}" role="img" aria-label="${NAME[kind]}"><i class="gem-art"></i>${kind === 'dbn' ? '<b class="gem-sp"></b><b class="gem-sp"></b><b class="gem-sp"></b>' : ''}</span>`;
  /* picture + number, as shown in a price or a card corner */
  const amount = (kind, n, cls = '') => `<span class="gem-amt ${kind} ${cls}" title="${NAME[kind]}" aria-label="${n} ${NAME[kind]}">${html(kind)}<b>${n}</b></span>`;

  const short = n => n < 1e4 ? String(Math.floor(n)) : n < 1e6 ? (n / 1e3).toFixed(n < 1e5 ? 1 : 0).replace(/\.0$/, '') + 'K' : (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  /* the wallet row under the banana counter: only currencies you actually hold are drawn */
  function mount() {
    if (!window.IMI?.on) return setTimeout(mount, 100);        // the game object is created a little after the scripts load
    const hud = document.getElementById('hud'); if (!hud || document.getElementById('hudGems')) return;
    const row = document.createElement('div'); row.id = 'hudGems'; row.className = 'hud-gems'; row.hidden = true;
    row.innerHTML = ['dbn', 'star', 'insp', 'part', 'seal'].map(k => `<span class="hud-gem ${k}" data-gem="${k}" hidden>${html(k, 'big')}<b>0</b></span>`).join('');
    hud.after(row);
    const cells = Object.fromEntries([...row.children].map(c => [c.dataset.gem, c]));
    const set = (kind, n) => {
      const c = cells[kind], b = c.querySelector(':scope > b'), show = n > 0, text = short(n);
      if (c.hidden === show) c.hidden = !show;
      if (b.textContent !== text) {
        const up = +c.dataset.n < n; b.textContent = text; c.dataset.n = n;
        if (up && !c.hidden && !IMI.reduceMotion) { c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }
      }
    };
    const update = () => {
      let S; try { S = IMI.ops?.extensions?.state?.(); } catch { return; }
      if (!S) return;
      set('dbn', (S.prem?.earned || 0) + (S.prem?.bought || 0));
      set('star', S.legacy?.stars || 0);
      const mg = S.meta?.minigames, pool = mg?.pool || {};
      set('insp', (mg?.wallet || 0) + (pool.speed || 0) + (pool.keeper || 0) + (pool.sales || 0) + (pool.luck || 0));
      set('part', S.meta?.workshop?.parts || 0);
      set('seal', S.meta?.layers?.seals || 0);
      const any = Object.values(cells).some(c => !c.hidden); if (row.hidden === any) row.hidden = !any;
    };
    IMI.on('render', update); update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(mount)); else setTimeout(mount);
  return Object.freeze({ html, amount, NAME });
})();
