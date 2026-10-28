/* STORY: the cutscene engine and the observer that decides when a chapter of the story plays.
   - StoryLogic (top of this file) is pure: the arc, which scenes a save has passed, the silent marking of old saves, the queue and the
     never-interrupt rules. tests/story.test.cjs runs it in node.
   - The engine (start(), browser only) watches the game through IMI.ops.snap() and the IMI event bus like tour.js does. It never writes game
     state and never pauses the economy: the game keeps ticking under a scene. Its only storage is localStorage 'imi-story'
     ({ v: 1, seen: { id: ts }, off: false, word }), written only by the tab that owns the save (Rewards).
   - The scenes themselves are StoryKit.scene() definitions in story-scenes-*.js; the drawing kit is story-kit.js.
   Debug: IMI.story.play(id) from the console; ?story=<id> plays one on load (&t=<s> seeks, &pause=1 freezes);
   ?story=world&stage=3&studios=songs,tv&muses=poe&printing=1&phase=night&wx=2&desks=4 shows the living world on its own. */
(function (G) {
  'use strict';

  /* =====================  PURE LOGIC  ===================== */
  const StoryLogic = (() => {
    /* The arc, in order. passed(f): the save has reached this moment. Scene ids are permanent: they are save keys. */
    const ARC = [
      { id: 'prologue', chapter: 0, title: 'The Clearing', passed: () => true },
      { id: 'first-hire', chapter: 1, title: 'Our First Employee', passed: f => f.paws > 0 || f.printing > 0 },
      { id: 'first-word', chapter: 2, title: 'A Real Word', passed: f => f.words > 0 || f.printing > 0 },
      { id: 'first-sale', chapter: 3, title: 'We Are a Publisher', passed: f => f.sold > 0 || f.printing > 0 },
      { id: 'machine-hibiscus', chapter: 4, title: 'A Roof Over Our Heads', passed: f => f.owned >= 2 },
      { id: 'machine-lagoon', chapter: 5, title: 'The Boathouse', passed: f => f.owned >= 3 },
      { id: 'machine-honeycomb', chapter: 6, title: 'The Hive', passed: f => f.owned >= 4 },
      { id: 'machine-orchid', chapter: 7, title: 'The Grand Hall', passed: f => f.owned >= 5 },
      { id: 'machine-moonflower', chapter: 8, title: 'The Tower', passed: f => f.owned >= 6 },
      { id: 'media-records', chapter: 9, title: 'Why Stop at Books?', passed: f => (f.divs.songs || 0) > 0 },
      { id: 'media-tv', chapter: 10, title: 'Lights, Camera, Ook', passed: f => (f.divs.tv || 0) > 0 },
      { id: 'media-radio', chapter: 11, title: 'On the Air', passed: f => (f.divs.radio || 0) > 0 },
      { id: 'media-troupe', chapter: 12, title: 'Curtain Up', passed: f => (f.divs.sketch || 0) > 0 },
      { id: 'first-muse', chapter: 13, title: 'A Famous Visitor', passed: f => f.muses.length > 0 },
      { id: 'second-printing', chapter: 14, title: 'Let\'s Write It Again', passed: f => f.printing >= 1 },
    ];
    const BY = Object.fromEntries(ARC.map(a => [a.id, a]));
    const WAIT_TAB = 20000, QUIET_TAP = 1500;
    /** The facts the arc reads, from IMI.ops.snap() (missing fields are zero) */
    const facts = (s = {}) => ({
      typed: s.typed | 0, paws: s.paws | 0, words: s.words | 0, sold: s.sold | 0, owned: Math.max(1, s.owned | 0), printing: s.printing | 0,
      divs: s.divs || {}, muses: s.muses || [], combo: s.combo | 0, tab: s.tab || 'floor', introDone: !!(s.intro && s.intro.done),
    });
    /** A save that has done nothing yet: the prologue is for these only */
    const brandNew = f => f.typed === 0 && f.paws === 0 && f.words === 0 && f.sold === 0 && f.printing === 0;
    const load = raw => {
      const st = { v: 1, seen: {}, off: false };
      if (raw && typeof raw === 'object') { if (raw.seen && typeof raw.seen === 'object') for (const k in raw.seen) if (BY[k]) st.seen[k] = +raw.seen[k] || 1; st.off = !!raw.off; if (typeof raw.word === 'string') st.word = raw.word; for (const k of ['peak', 'prev']) { const e = cleanEmpire(raw[k]); if (e) st[k] = e; } }
      return st;
    };
    const eligible = (a, f) => (a.id === 'prologue' ? brandNew(f) : a.passed(f));
    /** First run on this save (stored = false): every scene the save is already past is marked seen silently, the prologue too unless the save is brand new.
        Later runs: settle() only. Returns true if anything changed. */
    function boot(st, f, now, stored) {
      let ch = false;
      if (!stored) for (const a of ARC) if (!st.seen[a.id] && (a.id === 'prologue' ? !brandNew(f) : a.passed(f))) { st.seen[a.id] = now; ch = true; }
      return settle(st, f, now) || ch;
    }
    /** Keep the state honest as the save moves: a prologue that missed its moment (the player already typed) is marked; with auto-play off every passed scene is marked (it unlocks for replay). */
    function settle(st, f, now) {
      let ch = false;
      if (!st.seen.prologue && !brandNew(f)) { st.seen.prologue = now; ch = true; }
      if (st.off) for (const a of ARC) if (!st.seen[a.id] && eligible(a, f)) { st.seen[a.id] = now; ch = true; }
      const due = ARC.filter(a => !st.seen[a.id] && eligible(a, f));   // a save that jumped ahead (import, restore, cloud sync): no marathon, only the furthest scene plays
      if (due.length >= 3) for (const a of due.slice(0, -1)) { st.seen[a.id] = now; ch = true; }
      return ch;
    }
    /** The next scene to play: the first unseen one, in arc order, the save has reached (only those in `available` if given) */
    function pending(st, f, available) {
      if (st.off) return null;
      for (const a of ARC) if (!st.seen[a.id] && eligible(a, f) && (!available || available(a.id))) return a.id;
      return null;
    }
    /** May a scene start now? env: { screen, hidden, blocked, combo, sinceTap (ms), tab, waited (ms the scene has been due), prologue } -> { ok, why } */
    function canPlay(env) {
      if (env.screen !== 'game') return { ok: false, why: 'screen' };
      if (env.hidden) return { ok: false, why: 'hidden' };
      if (env.blocked) return { ok: false, why: 'blocked' };
      if (env.prologue) return { ok: true, why: '' };
      if (env.combo > 0 || env.sinceTap < QUIET_TAP) return { ok: false, why: 'streak' };
      if (env.tab !== 'floor' && env.waited < WAIT_TAB) return { ok: false, why: 'tab' };
      return { ok: true, why: '' };
    }
    const mark = (st, id, now) => { if (!BY[id] || st.seen[id]) return false; st.seen[id] = now; return true; };
    const list = (st, available) => ARC.map(a => ({ id: a.id, title: a.title, chapter: a.chapter, seen: !!st.seen[a.id], ready: available ? !!available(a.id) : true }));
    /** The building's stage 0..5 (clearing, hut, boathouse, hive, hall, tower): one per machine owned */
    const stage = f => Math.max(0, Math.min(5, (f.owned | 0) - 1));
    /* The empire a printing reached (its tallest building, studios, muses): kept in st.peak while the run grows; when a printing completes the run
       resets, so the old peak moves to st.prev, which the second-printing scene shows going dark. Returns true if anything changed. */
    const STUDIOS = ['songs', 'tv', 'radio', 'sketch', 'film'];
    function cleanEmpire(e) {
      if (!e || typeof e !== 'object' || !Number.isFinite(+e.p)) return null;
      const ids = a => (Array.isArray(a) ? a.filter(x => typeof x === 'string').slice(0, 5) : []);
      return { p: Math.max(0, +e.p | 0), stage: Math.max(0, Math.min(5, +e.stage | 0)), desks: Math.max(1, Math.min(6, +e.desks | 0 || 1)), studios: ids(e.studios).filter(x => STUDIOS.includes(x)), muses: ids(e.muses).slice(0, 3) };
    }
    function track(st, f) {
      const cur = { p: f.printing, stage: stage(f), desks: Math.max(1, Math.min(6, f.owned)), studios: STUDIOS.filter(id => (f.divs[id] || 0) > 0), muses: f.muses.filter(x => typeof x === 'string').slice(0, 3) };
      const pk = st.peak;
      if (!pk || pk.p !== cur.p) { if (pk && pk.p < cur.p) st.prev = pk; st.peak = cur; return true; }
      let ch = false;
      if (cur.stage > pk.stage) { pk.stage = cur.stage; ch = true; }
      if (cur.desks > pk.desks) { pk.desks = cur.desks; ch = true; }
      const studios = STUDIOS.filter(id => pk.studios.includes(id) || cur.studios.includes(id)); if (studios.length > pk.studios.length) { pk.studios = studios; ch = true; }
      if (cur.muses.length >= pk.muses.length && cur.muses.join() !== pk.muses.join()) { pk.muses = cur.muses; ch = true; }
      return ch;
    }
    return { ARC, BY, WAIT_TAB, QUIET_TAP, facts, brandNew, load, boot, settle, pending, canPlay, mark, list, stage, track };
  })();
  G.StoryLogic = StoryLogic;
  if (typeof document === 'undefined') return;

  /* =====================  ENGINE (browser)  ===================== */
  function start() {
    if (G.VaultSaveGate && G.VaultSaveGate.blocked) return;
    const IMI = G.IMI, SK = G.StoryKit;
    if (!IMI || !IMI.ops || !IMI.on || !SK || G.__OPS_HEADLESS) return;
    const T = G.Rewards && G.Rewards.enabled ? G.Rewards.timers : G;
    const raf = f => (T.requestAnimationFrame || G.requestAnimationFrame).call(G, f);
    const owner = () => !(G.Rewards && G.Rewards.enabled && !G.Rewards.owns());
    const KEY = 'imi-story', L = StoryLogic, html = document.documentElement;
    const reduced = () => !!(IMI.reduceMotion || (G.matchMedia && G.matchMedia('(prefers-reduced-motion: reduce)').matches));
    const q = new URLSearchParams(location.search);
    const HOLD = !!navigator.webdriver && q.get('storyauto') !== '1';   // automated browsers (the test suites) drive the game, not the story: no scene starts by itself unless ?storyauto=1

    /* ---- persistence ---- */
    let stored = null; try { stored = JSON.parse(localStorage.getItem(KEY)); } catch { stored = null; }
    const S = L.load(stored);
    const store = () => { if (!owner()) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage blocked */ } };
    const snap = () => { try { return IMI.ops.snap(); } catch { return {}; } };
    const facts = () => L.facts(snap());
    if (L.boot(S, facts(), Date.now(), !!stored) || !stored) store();
    const available = id => !!SK.scenes[id];

    /* ---- the world the scenes and the title screen draw ---- */
    const STUDIOS = ['songs', 'tv', 'radio', 'sketch', 'film'];
    function world() {
      const s = snap(), f = L.facts(s), sky = SK.skyNow(), crew = (s.crew || []).slice(0, 6), lead = crew[0];
      return {
        stage: L.stage(f), desks: Math.max(1, Math.min(6, f.owned)), studios: STUDIOS.filter(id => (f.divs[id] || 0) > 0), muses: f.muses.slice(0, 3), printing: f.printing,
        crew, founder: lead ? { look: lead.look, hat: lead.hat || 0 } : { look: 'v01', hat: 0 }, paws: f.paws, lastLook: s.lastLook || null,
        firstWord: S.word || s.lastBanked || null, phase: sky.phase, wx: sky.wx, empire: S.prev ? JSON.parse(JSON.stringify(S.prev)) : null,
      };
    }

    /* ---- the overlay ---- */
    const el = document.createElement('div'); el.id = 'story'; el.className = 'story'; el.hidden = true; el.tabIndex = -1;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Story');
    el.innerHTML = '<canvas class="st-cv" aria-hidden="true"></canvas><div class="st-bar st-top" aria-hidden="true"></div><div class="st-bar st-bot" aria-hidden="true"></div>' +
      '<div class="st-title" hidden><small></small><b></b></div><button type="button" class="st-skip">SKIP<i aria-hidden="true"></i></button><div class="st-fade" aria-hidden="true"></div>';
    document.body.appendChild(el);
    const cv = el.querySelector('.st-cv'), skipBtn = el.querySelector('.st-skip'), titleEl = el.querySelector('.st-title'), fadeEl = el.querySelector('.st-fade');
    const cap = SK.caption(el);

    /* ---- playing ---- */
    const OUTRO = 1.7, FADE = 0.45;
    let P = null, lastEnd = -1e9, dueSince = {}, lastTap = -1e9;
    const sfx = (name, arg) => { try { const f = IMI.sfx && IMI.sfx[name]; if (f) f.call(IMI.sfx, arg); } catch { /* sound is optional */ } };
    const music = (fn, arg) => { try { const m = IMI.music; if (m && typeof m[fn] === 'function') m[fn](arg); } catch { /* music is optional */ } };
    function castOf(def, w, who) {
      if (!who || who === 'narrator') return null;
      const c = (def.cast ? def.cast(w) : {})[who] || (who === 'founder' ? { look: w.founder.look, hat: w.founder.hat, name: 'You' } : null);
      return c;
    }
    function play(id, o = {}) {
      const def = id === 'world' ? previewDef() : SK.scenes[id];
      if (!def) { console.warn('[story] no scene', id); return false; }
      if (P) close(true);
      const w = Object.assign(world(), o.world || {});
      if (def.prepare) { try { def.prepare(w); } catch (e) { console.error('[story] prepare', id, e); if (!o.replay && L.mark(S, id, Date.now())) store(); return false; } }   // a broken scene is passed over, never retried every second
      const from = document.activeElement;
      P = { id, def, w, from, t: 0, prevT: 0, beat: -1, capN: 0, replay: !!o.replay, phase: 'play', outroT: 0, paused: false, last: performance.now(), age: 0, ended: false, preview: id === 'world' };
      el.hidden = false; html.classList.add('story-on'); el.classList.toggle('preview', P.preview); el.dataset.scene = id;
      titleEl.hidden = true; fadeEl.style.opacity = '1'; cap.hide(); skipBtn.hidden = P.preview;
      if (!P.preview) { music('play', 'story'); sfx('whoosh'); }
      try { IMI.emit && IMI.emit('story', { id, playing: true }); } catch { /* bus is optional */ }
      raf(frame);
      el.focus({ preventScroll: true });
      return true;
    }
    function close(quiet) {
      if (!P) return;
      const id = P.id, prev = P;
      const had = el.contains(document.activeElement);
      P = null; el.hidden = true; html.classList.remove('story-on'); cap.hide(); titleEl.hidden = true;
      if (had || document.activeElement === document.body) { const f = prev.from; if (f && f !== document.body && f.isConnected && f.getClientRects().length) f.focus({ preventScroll: true }); else el.blur(); }   // focus goes back where it was (the Floor's typewriter, the STORY list...)
      if (!prev.preview) {
        if (L.mark(S, id, Date.now())) store();
        music('duck', false); if (IMI.screen && IMI.screen() === 'game') music('play', 'floor');
        lastEnd = performance.now();
        if (prev.def.onEnd && !quiet) { try { prev.def.onEnd(prev.w); } catch (e) { console.error(e); } }
        try { IMI.emit && IMI.emit('story', { id, playing: false }); } catch { /* bus is optional */ }
      }
    }
    /** Jump to the next beat; the first press only finishes the line being typed */
    function next() {
      if (!P) return;
      if (P.phase === 'outro') { P.outroT = Math.max(P.outroT, OUTRO); return; }
      if (P.capN < cap.length()) { P.capN = cap.length(); return; }
      const b = P.def.beats || [], nb = b[P.beat + 1];
      P.t = nb ? Math.max(P.t, nb.at) : Math.max(P.t, P.def.duration);
    }
    function skip() { if (!P) return; if (P.preview) return close(true); sfx('tick'); P.phase = 'outro'; P.outroT = OUTRO; P.skipped = true; }
    function beatAt(def, t) { let bi = -1; (def.beats || []).forEach((b, i) => { if (t >= b.at) bi = i; }); return bi; }

    /* a scene that throws (drawing, actors, camera, cues, captions) closes itself: it must never leave the overlay up over a game it is swallowing keys from */
    function frame(now) { if (!P) return; try { tick(now); } catch (e) { console.error('[story] frame', P && P.id, e); close(true); } }
    function tick(now) {
      const dt = Math.min(0.1, Math.max(0, (now - P.last) / 1000)); P.last = now; P.age += dt;
      const def = P.def, rm = reduced();
      if (!P.paused && !document.hidden) { if (P.phase === 'play') P.t += dt; else P.outroT += dt; }
      let t = P.t;
      if (P.phase === 'play' && t >= def.duration && !P.preview) { P.phase = 'outro'; P.outroT = 0; t = P.t = def.duration; }
      // beats and the caption
      const bi = beatAt(def, t);
      if (bi !== P.beat && P.phase === 'play') {
        P.beat = bi; const b = def.beats[bi];
        const c = b && b.text ? castOf(def, P.w, b.who) : null;
        cap.show(c && b.expr ? Object.assign({}, c, { expr: b.expr }) : c, b ? b.text : ''); P.capN = rm ? 1e9 : 0;
      }
      if (P.phase === 'play' && P.capN < cap.length()) {
        const before = Math.floor(P.capN); P.capN = Math.min(cap.length(), P.capN + dt * 40);
        if (Math.floor(P.capN) !== before && Math.floor(P.capN) % 3 === 0) sfx('tick');
      }
      cap.type(P.capN);
      // sound cues: only while time runs normally (a jump does not replay every cue it passes)
      if (def.cues && t - P.prevT > 0 && t - P.prevT < 0.25) for (const c of def.cues) if (c.at > P.prevT && c.at <= t) { if (c.fn) { try { c.fn(P.w); } catch (e) { console.error(e); } } else sfx(c.sfx, c.arg); }
      P.prevT = t;
      // draw
      const A = def.actors ? def.actors(t, P.w) : {};
      const camT = rm ? ((def.beats || [])[Math.max(0, bi)] || { at: 0 }).at : t;
      const cam = def.camera ? def.camera(camT, P.w, A) : { x: 0, y: -40, z: 0 };
      const phone = innerWidth < innerHeight;
      try {
        SK.render(cv, t, P.w, {
          safe: def.safe ? def.safe(phone) : phone ? [112, 150] : [200, 120], zoom: cam.z || 0, cam, fy: def.fy ? def.fy(phone) : phone ? 0.56 : 0.43,
          sky: def.sky ? (typeof def.sky === 'function' ? def.sky(P.w) : def.sky) : null, stage: A.stage != null ? A.stage : def.stage ? def.stage(P.w) : null,
          crew: def.crew === true, crewOpts: def.crewOpts, build: A.build, towerLit: A.towerLit, doorman: A.doorman,
          back: def.back ? (g, tt, v) => def.back(g, t, P.w, A, v) : null,
          draw: def.draw ? (g, tt, v) => def.draw(g, t, P.w, A, v) : null,
          front: def.front ? (g, tt, v) => def.front(g, t, P.w, A, v) : null,
          screen: def.screen ? (g, tt, v) => def.screen(g, t, P.w, A, v) : null,
        });
      } catch (e) { console.error('[story] draw', e); close(true); return; }
      // fade in, the outro (chapter card, then fade out), the end
      let fade = rm ? 0 : Math.max(0, 1 - P.age / 0.6);
      if (P.phase === 'outro') {
        if (!P.ended) {
          P.ended = true; cap.hide(); skipBtn.hidden = true; music('duck', true);
          if (!P.skipped) { const ch = L.BY[P.id] ? L.BY[P.id].chapter : def.chapter; titleEl.querySelector('small').textContent = ch === 0 ? 'PROLOGUE' : 'CHAPTER ' + (ch == null ? '' : ch); titleEl.querySelector('b').textContent = def.title || (L.BY[P.id] || {}).title || ''; titleEl.hidden = false; titleEl.classList.remove('in'); void titleEl.offsetWidth; titleEl.classList.add('in'); sfx('stamp'); }
        }
        const k = (P.outroT - (P.skipped ? OUTRO : OUTRO - 0.2)) / FADE;
        fade = Math.max(fade, Math.min(1, rm ? (k > 0 ? 1 : 0) : k));
        if (P.outroT >= OUTRO + FADE) { fadeEl.style.opacity = '1'; close(false); return; }
      }
      fadeEl.style.opacity = String(Math.round(fade * 6) / 6);   // stepped
      raf(frame);
    }

    /* ---- input: click / Space / Enter advance, Esc skips; nothing reaches the game while a scene plays ---- */
    el.addEventListener('pointerdown', e => { if (!P || e.target.closest('.st-skip')) return; e.preventDefault(); next(); });
    skipBtn.addEventListener('click', e => { e.stopPropagation(); skip(); });
    /* through StoryKit's key gate (story-kit.js), which runs before every other window listener; Tab stays inside the overlay */
    SK.keyGate = e => {
      if (!P) return;
      if (e.type === 'keyup') { if (!(e.ctrlKey || e.metaKey)) e.stopImmediatePropagation(); return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      e.stopImmediatePropagation();
      if (e.key === 'Tab') { e.preventDefault(); (skipBtn.hidden || document.activeElement === skipBtn ? el : skipBtn).focus({ preventScroll: true }); }
      else if (e.key === 'Escape') { e.preventDefault(); skip(); }
      else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { if (e.target === skipBtn && e.key !== ' ') { e.preventDefault(); skip(); return; } e.preventDefault(); if (!e.repeat) next(); }
    };

    /* ---- the observer: is a scene due, and is this a good moment? ---- */
    const BLOCKERS = '.o-modal, .o-celebrate, .mg01-overlay, .set-pop:not([hidden]), [aria-modal="true"]:not(#story)';
    const shown = n => !!n && !n.hidden && n.getClientRects().length > 0 && !n.closest('[hidden]');
    const blocked = () => [...document.querySelectorAll(BLOCKERS)].some(shown) || shown(document.querySelector('.o-writer-status'));
    IMI.on('tap', () => { lastTap = performance.now(); });
    IMI.on('bank', d => { if (!S.word && !S.seen['first-word'] && d && d.word) { S.word = String(d.word).toUpperCase(); store(); } });
    function check() {
      if (!owner()) return;
      const f = facts();
      if (L.track(S, f)) store();   // the empire this printing reached (for the second-printing scene), even while a scene plays
      if (P) return;
      if (L.settle(S, f, Date.now())) store();
      const id = L.pending(S, f, available);
      if (!id || HOLD) return;
      const now = performance.now();
      if (IMI.screen() === 'game' && !dueSince[id]) dueSince[id] = now;
      if (id !== 'prologue' && now - lastEnd < 6000) return;
      const ok = L.canPlay({ screen: IMI.screen(), hidden: document.hidden, blocked: blocked(), combo: f.combo, sinceTap: now - lastTap, tab: f.tab, waited: dueSince[id] ? now - dueSince[id] : 0, prologue: id === 'prologue' });
      if (ok.ok) play(id);
    }
    ['hire', 'bank', 'sold', 'desk', 'tab'].forEach(n => IMI.on(n, () => T.setTimeout.call(G, check, 400)));
    IMI.onScreen(s => { if (s === 'game') T.setTimeout.call(G, check, 250); else if (P && !P.preview) close(true); });
    T.setInterval.call(G, check, 1000);

    /* ---- the living-world preview (?story=world) ---- */
    function previewDef() {
      const n = k => (q.get(k) != null ? +q.get(k) : null), list = k => (q.get(k) ? q.get(k).split(',').filter(Boolean) : null);
      return {
        id: 'world', title: 'World', duration: 1e9, beats: [], crew: true,
        prepare(w) {
          if (n('stage') != null) { w.stage = n('stage'); w.desks = n('desks') || w.stage + 1; }
          if (n('desks') != null) w.desks = n('desks');
          if (list('studios')) w.studios = list('studios'); if (list('muses')) w.muses = list('muses'); if (n('printing') != null) w.printing = n('printing');
          if (q.get('phase')) w.phase = q.get('phase'); if (n('wx') != null) w.wx = n('wx');
          if (q.get('looks')) w.crew = q.get('looks').split(',').map(l => ({ look: l, hat: 0 }));
          if (q.get('founder')) w.founder = { look: q.get('founder'), hat: n('hat') || 0 };
        },
        safe: phone => { if (q.get('safe')) return q.get('safe').split(',').map(Number); const st = Math.max(0, Math.min(5, n('stage') != null ? n('stage') : L.stage(facts()))); return phone ? [[124, 150], [130, 170], [150, 190], [160, 230], [190, 240], [190, 330]][st] : [[200, 120], [220, 130], [250, 140], [270, 170], [290, 175], [300, 320]][st]; },
        camera: () => { const st = Math.max(0, Math.min(5, n('stage') != null ? n('stage') : L.stage(facts()))); return { x: n('cx') || 0, y: n('cy') != null ? n('cy') : [-40, -46, -50, -64, -66, -130][st], z: n('zoom') || 0 }; },
      };
    }

    /* ---- the API ---- */
    IMI.story = {
      list: () => L.list(S, available),
      play: (id, o = {}) => play(id, { replay: o.replay !== false, world: o.world }),
      active: () => !!P && !P.preview,
      playing: () => (P ? P.id : null),
      on(v) { S.off = !v; L.settle(S, facts(), Date.now()); store(); return !S.off; },
      isOn: () => !S.off,
      stage: () => L.stage(facts()),
      world,
      next, skip,
      seek(t) { if (P) { P.t = Math.max(0, +t || 0); P.prevT = P.t; P.beat = -2; P.phase = 'play'; P.ended = false; titleEl.hidden = true; P.age = 9; } },
      pause(v = true) { if (P) P.paused = !!v; },
      reset() { if (P) close(true); S.seen = {}; delete S.word; delete S.peak; delete S.prev; dueSince = {}; store(); },   // a new game (Settings > Reset): the story starts over, the auto-play choice stays
      _state: () => JSON.parse(JSON.stringify(S)),
    };

    /* ---- ?story=<id> plays on load (for screenshots) ---- */
    const qid = q.get('story');
    if (qid) {
      const go = () => { play(qid, { replay: true }); const tt = q.get('t'); if (tt != null) IMI.story.seek(+tt); if (q.get('pause')) IMI.story.pause(true); };
      (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => T.setTimeout.call(G, go, 300));
    } else T.setTimeout.call(G, check, 600);
  }
  if (G.Rewards && G.Rewards.enabled) G.Rewards.start(start); else start();
})(typeof globalThis !== 'undefined' ? globalThis : window);
