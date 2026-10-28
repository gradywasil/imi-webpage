(() => {
  const $ = s => document.querySelector(s);
  const PAGE = 48;
  const SHELVES = [
    ['all', 'All'], ['stories', 'Stories'], ['songs', 'Songs'], ['tv-shows', 'TV'],
    ['radio-plays', 'Radio'], ['sketches', 'Sketches'], ['films', 'Films']
  ];
  const LABEL = { stories: 'Story', songs: 'Song', 'tv-shows': 'TV episode', 'radio-plays': 'Radio play', sketches: 'Sketch', films: 'Film' };
  const state = { shelf: 'all', q: '', sort: 'title', page: 0 };
  let items = [], shown = [], lastFocus = null;

  /* ---- catalog ---- */
  Promise.all(['library/books.json', 'library/archives.json'].map(u => fetch(u).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })))
    .then(([books, archives]) => {
      items = [
        ...books.map(b => ({ id: 'stories/' + b.slug, shelf: 'stories', title: b.parody, sub: 'A parody of “' + b.original + '”', words: b.words, min: b.minutes, path: 'stories/' + b.slug + '.md' })),
        ...archives.map(a => ({ id: a.id, shelf: a.archive, title: a.title, sub: a.target, words: a.words, min: a.readingMinutes, path: a.path }))
      ];
      buildShelves(); render(); fromHash();
    })
    .catch(() => { $('#count').textContent = 'The stacks are locked. Run node sync-library.mjs, then serve the site over http.'; });

  function buildShelves() {
    const box = $('#shelves');
    for (const [key, name] of SHELVES) {
      const n = key === 'all' ? items.length : items.filter(i => i.shelf === key).length;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'shelf'; b.dataset.shelf = key; b.setAttribute('role', 'tab');
      b.innerHTML = `${name} <small>${n.toLocaleString()}</small>`;
      b.addEventListener('click', () => { state.shelf = key; state.page = 0; render(); });
      box.appendChild(b);
    }
  }

  const rnd = new Map();
  const rkey = id => { if (!rnd.has(id)) rnd.set(id, Math.random()); return rnd.get(id); };

  function render() {
    const q = state.q.trim().toLowerCase();
    shown = items.filter(i => (state.shelf === 'all' || i.shelf === state.shelf) && (!q || (i.title + ' ' + i.sub).toLowerCase().includes(q)));
    const cmp = {
      title: (a, b) => a.title.localeCompare(b.title),
      short: (a, b) => a.words - b.words,
      long: (a, b) => b.words - a.words,
      random: (a, b) => rkey(a.id) - rkey(b.id)
    }[state.sort];
    shown.sort(cmp);
    const pages = Math.max(1, Math.ceil(shown.length / PAGE));
    state.page = Math.min(state.page, pages - 1);

    document.querySelectorAll('.shelf').forEach(b => b.setAttribute('aria-selected', String(b.dataset.shelf === state.shelf)));
    $('#count').textContent = `${shown.length.toLocaleString()} of ${items.length.toLocaleString()} manuscripts`;

    const grid = $('#grid'); grid.textContent = '';
    if (!shown.length) grid.innerHTML = '<p class="empty">No manuscripts match. The monkeys are still typing.</p>';
    for (const it of shown.slice(state.page * PAGE, (state.page + 1) * PAGE)) {
      const a = document.createElement('a');
      a.className = 'card'; a.href = '#' + it.id;
      const kind = document.createElement('span'); kind.className = 'kind'; kind.textContent = LABEL[it.shelf];
      const h = document.createElement('h3'); h.textContent = it.title;
      const p = document.createElement('p'); p.textContent = it.sub;
      const m = document.createElement('span'); m.className = 'meta'; m.textContent = `${it.min} min read · ${it.words.toLocaleString()} words`;
      a.append(kind, h, p, m); grid.appendChild(a);
    }

    const pager = $('#pager'); pager.textContent = '';
    if (pages > 1) {
      const mk = (txt, to, dis) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'leaf-link'; b.textContent = txt; b.disabled = dis;
        b.addEventListener('click', () => { state.page = to; render(); scrollTo({ top: $('.controls').offsetTop - 70 }); });
        return b;
      };
      const s = document.createElement('span'); s.textContent = `Page ${state.page + 1} of ${pages}`;
      pager.append(mk('← Prev', state.page - 1, state.page === 0), s, mk('Next →', state.page + 1, state.page === pages - 1));
    }
  }

  let qt;
  $('#q').addEventListener('input', e => { clearTimeout(qt); qt = setTimeout(() => { state.q = e.target.value; state.page = 0; render(); }, 150); });
  $('#sort').addEventListener('change', e => { state.sort = e.target.value; state.page = 0; render(); });

  /* ---- reader ---- */
  const reader = $('#reader'), body = $('#readerBody');
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<i>$2</i>');

  function markdown(md) {
    const lines = md.replace(/\r/g, '').split('\n'), out = [];
    let para = [], list = null, table = null;
    const flush = () => {
      if (para.length) { out.push('<p>' + para.map(inline).join('<br>') + '</p>'); para = []; }
      if (list) { out.push('<ul>' + list.map(l => '<li>' + inline(l) + '</li>').join('') + '</ul>'); list = null; }
      if (table) { out.push('<table>' + table.map((r, i) => '<tr>' + r.map(c => (i ? '<td>' : '<th>') + inline(c) + (i ? '</td>' : '</th>')).join('') + '</tr>').join('') + '</table>'); table = null; }
    };
    for (const raw of lines) {
      const line = raw.trimEnd(); let m;
      if (!line.trim()) { flush(); continue; }
      if ((m = line.match(/^(#{1,4})\s+(.*)/))) { flush(); out.push(`<h${m[1].length + 1}>${inline(m[2])}</h${m[1].length + 1}>`); continue; }
      if (/^-{3,}$/.test(line.trim())) { flush(); out.push('<hr>'); continue; }
      if (line.startsWith('|')) {
        if (/^\|[\s:|-]+\|?$/.test(line)) continue;
        if (!table) { flush(); table = []; }
        table.push(line.replace(/^\||\|$/g, '').split('|').map(c => c.trim())); continue;
      }
      if ((m = line.match(/^[-*]\s+(.*)/))) { if (!list) { flush(); list = []; } list.push(m[1]); continue; }
      if ((m = line.match(/^>\s?(.*)/))) { flush(); out.push('<blockquote>' + inline(m[1]) + '</blockquote>'); continue; }
      if (list || table) flush();
      para.push(line);
    }
    flush(); return out.join('\n');
  }

  let token = 0;
  async function open(id) {
    const it = items.find(i => i.id === id); if (!it) return;
    const mine = ++token;
    if (reader.hidden) { lastFocus = document.activeElement; reader.hidden = false; document.body.classList.add('reading'); }
    body.innerHTML = '<p class="loading">Fetching manuscript…</p>';
    reader.scrollTop = 0; body.focus({ preventScroll: true });
    try {
      const r = await fetch('library/' + it.path); if (!r.ok) throw new Error(r.status);
      const text = await r.text();
      if (mine !== token) return;
      body.innerHTML = markdown(text);
      body.insertAdjacentHTML('afterbegin', '<p class="kind">' + LABEL[it.shelf] + ' · ' + it.min + ' min read</p>');
      document.title = it.title + ' · THE LIBRARY';
      const h = body.querySelector('h2'); if (h) h.id = 'readerTitle';
    } catch { if (mine === token) body.innerHTML = '<p class="loading">That manuscript has been eaten by a goat.</p>'; }
  }
  function close() {
    token++; reader.hidden = true; document.body.classList.remove('reading'); document.title = 'THE LIBRARY · INFINITE MONKEY INDUSTRIES';
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  function fromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) open(id); else if (!reader.hidden) close();
  }
  addEventListener('hashchange', () => items.length && fromHash());
  $('#readerClose').addEventListener('click', close);
  $('#readerRandom').addEventListener('click', () => { const p = shown.length ? shown : items; location.hash = p[Math.floor(Math.random() * p.length)].id; });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !reader.hidden) close(); });
})();
