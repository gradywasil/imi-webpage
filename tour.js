/* TYPEWRITER OPS: the guided tour and one-shot tips.
   A tiny coach-mark engine: a pulsing ring around the thing to press (never a blocking overlay) plus a speech bubble.
   It reads the game through IMI.ops.snap() and re-checks on the IMI event bus; it never touches game state. */
(() => {
  function start() {
  'use strict';
  if (window.VaultSaveGate?.blocked) return;
  const { setTimeout, clearTimeout, setInterval, clearInterval, requestAnimationFrame, cancelAnimationFrame } = window.Rewards?.enabled ? Rewards.timers : window;
  const IMI = window.IMI;
  if (!IMI || !IMI.ops || !IMI.on || window.__OPS_HEADLESS) return;
  const PX = IMI.edition === 'pixel', KEY = 'imi-tour', snap = () => IMI.ops.snap();
  const $ = s => document.querySelector(s);
  const tabBtn = id => `.o-tab[data-tab="${id}"]`;
  const TAB_NAME = { floor: 'Floor', training: 'Train', lab: 'Words', press: 'Titles', shop: 'Shop' };

  /* ---- persistence ---- */
  let T = { step: 0, done: false, tips: {}, tipsOff: false };
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && typeof s === 'object') { T = { ...T, ...s, tips: { ...(s.tips || {}) } }; } } catch { /* corrupt: start over */ }
  const store = () => { if (window.Rewards?.enabled && !Rewards.owns()) return; try { localStorage.setItem(KEY, JSON.stringify(T)); } catch { /* storage blocked */ } };
  if (!IMI.ops.introActive()) T.done = true;
  else if (T.version !== 2 || T.done) T = { ...T, version: 2, step: 0, done: false };
  store();

  /* ---- the script. text: 1-2 short lines. done(s): the player did the thing (so a reload or a head start skips it).
        next: also offer a Next button. view(s): swap target/text for the current state. hint: nudge a slow player. ---- */
  const STEPS = [
    { id: 'tap', tab: 'floor', target: '#oStage', text: 'Tap the typewriter, or press Space or Enter, for random letters. Make 25 taps to open Train.', done: s => s.intro.train,
      view: s => s.combo >= 10 ? { text: 'A 10-tap streak earns 3 bonus letters. At 25, typists get double speed for 15s. Keep tapping to open Train.' } : null },
    { id: 'hire', tab: 'training', target: '.o-btn[data-act="up"][data-k="paw"]', text: 'Train is open! Spend letters to hire your first automatic typist.', done: s => s.paws > 0,
      view: s => s.letters < s.hireCost ? { tab: 'floor', target: '#oStage', text: `Your first hire costs ${s.hireCost} letters. Keep tapping; your keeper leaves these letters for hiring.` } : null },
    { id: 'work', tab: 'floor', target: '#oStage', text: 'Your typist works automatically. Make 10 more manual taps to introduce your keeper.', done: s => s.intro.words },
    { id: 'words', tab: 'lab', target: '#oKeepers', text: 'Words and Titles are open! Your keeper now banks words. Pause it to save letters for Train.', next: true },
    { id: 'sell', tab: 'press', target: '#oGoal', text: 'Blue key underlines mark needed letters. Taps stay random. Bank every word in the goal, then Write & sell.', done: s => s.sold >= 1,
      view: s => {
        if (!s.ready) return null;
        if ($('#o-press .o-btn[data-act="write"]:not(:disabled)')) return { target: '#o-press .o-btn[data-act="write"]:not(:disabled)', text: 'Your title is ready! Press Write & sell to earn bananas.' };
        if ($('#oLibQ')?.value.trim()) return { target: '#oLibQ', text: 'A title is ready. Clear the title search to find it.' };
        if ($('#o-press [data-act="libcap"][data-c="all"]')?.getAttribute('aria-pressed') === 'false') return { target: '#o-press [data-act="libcap"][data-c="all"]', text: 'A title is ready. Choose All under Word max to find it.' };
        return { target: '#o-press [data-act="libf"][data-f="ready"]', text: 'A title is ready. Choose Ready to find it, then Write & sell.' };
      },
      hint: [60, 'You can return to Floor and tap while the keeper works.'] },
    { id: 'shop', tab: 'shop', target: '.o-btn[data-act="buy"][data-what="desk"][data-i="1"]', text: 'Shop is open! Bananas buy machines and boosts. Save for your second typewriter; you can finish this introduction now.', next: true },
    { id: 'end', tab: null, target: '#railToggle', text: 'Keep typing and selling. More departments open as you grow. Floor has a Key guide. The menu holds Settings, the edition switch and tutorial Replay.', next: true, last: true }
  ];

  /* ---- one-shot tips (after the tour). when(s): condition; ev: an event that raises it ---- */
  const TIPS = [
    { id: 'ready', ev: 'ready', seen: s => s.sold >= 1, target: tabBtn('press'), text: 'A title is ready! Open Titles and press Write & sell.' },
    { id: 'hot', when: s => s.sold >= 1 && s.hot, target: tabBtn('press'), text: 'A market is HOT! Open Titles > Market and sell into it.' },
    { id: 'gold', ev: 'goldspawn', seen: s => s.gold > 0, text: 'A golden banana! Catch it before it floats away.', live: true },
    { id: 'pitch', when: s => s.pitch && s.sold >= 2, target: tabBtn('press'), text: 'New: Pitches. Commission your own titles in Titles > Pitches.' },
    { id: 'muse', when: s => s.museSlots > 0, target: 'tab:muses', text: 'A Muse seat is open. Invite a Muse in the Muses tab.' },
    { id: 'legacy', when: s => s.stars >= 1, target: 'tab:legacy', text: 'You earned a Legacy star! Open Legacy to go to press.' },
    { id: 'workshop', when: s => s.lg?.workshop, target: 'tab:workshop', text: 'New: the Workshop! Send an expedition out for Parts.' },
    { id: 'ledger', when: s => s.lg?.ledger, target: 'tab:legacy', text: 'You can buy the Rebuild Ledger in Legacy. It remembers how you rebuild.' },
    { id: 'exphome', when: s => s.lg?.expHome, target: 'tab:workshop', text: 'Your expedition is home! Collect it in the Workshop.' },
    { id: 'foreman', when: s => s.lg?.foreman, target: 'tab:legacy', text: 'Printing Foreman bought! Switch on Room control in Legacy.' },
    { id: 'annex', when: s => s.lg?.campus, target: 'tab:campus', text: 'The Annex can open! Visit the Campus tab.' },
    { id: 'studio', when: s => s.lg?.studio, target: 'tab:campus', text: 'The Studio can open! Visit the Campus tab.' },
    { id: 'daily', ev: 'daily', text: 'Come back tomorrow for a bigger banana crate.' }
  ];

  /* ---- DOM ---- */
  const reduced = () => IMI.reduceMotion || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const ring = document.createElement('div'); ring.className = 'tour-ring'; ring.hidden = true;
  const bub = document.createElement('div'); bub.className = 'tour-bub'; bub.hidden = true; bub.setAttribute('role', 'status'); bub.setAttribute('aria-live', 'polite');
  bub.innerHTML = '<span class="tour-mk" aria-hidden="true"></span><div class="tour-body"><p class="tour-txt"></p><div class="tour-row"><small class="tour-n"></small><button type="button" class="tour-skip"></button><button type="button" class="tour-next"></button></div></div>';
  document.body.append(ring, bub);
  const txtEl = bub.querySelector('.tour-txt'), nEl = bub.querySelector('.tour-n'), skipEl = bub.querySelector('.tour-skip'), nextEl = bub.querySelector('.tour-next'), mk = bub.querySelector('.tour-mk');
  try {                                            // the pixel monkey, scaled to a 34px face
    if (PX && window.PXA) { const probe = PXA.el('i-monkey', 1); mk.appendChild(PXA.el('i-monkey', 34 / (parseFloat(probe.style.width) || 34))); } else mk.textContent = '🐒';
  } catch { mk.textContent = '🐒'; }

  /* ---- engine state ---- */
  let mode = T.done ? 'idle' : 'tour';         // 'tour' | 'tip' | 'idle'
  let replaying = false, stepAt = performance.now(), hintTimer = 0, tip = null, tipTimer = 0, lastTip = -1e9, drawKey = '';
  const pending = {};                            // tips raised by an event, waiting for a quiet moment
  const TIP_GAP = 120000;
  let recovering = false, tipAt = 0, tipRemaining = 0;

  const visible = el => !!el && !el.hidden && el.getClientRects().length > 0 && !el.closest('[hidden]');
  const resolve = sel => {                       // 'tab:id' = that department's tab in the side rail
    if (!sel) return null;
    if (sel.startsWith('tab:')) { const t = $(tabBtn(sel.slice(4))); return visible(t) ? t : null; }
    const el = $(sel); return visible(el) ? el : null;
  };
  const recoveryVisible = () => visible($('.o-writer-status'));
  const busy = () => IMI.screen() !== 'game' || document.hidden || recoveryVisible() || !!document.querySelector('.o-modal, .o-celebrate');
  const stepView = (st, s) => {                  // what to show right now: the step itself, a detour to its tab, or a state-based variant
    let v = { tab: st.tab, target: st.target, text: st.text };
    if (st.view) { const o = st.view(s); if (o) v = { ...v, ...o }; }
    if (v.tab && s.tab !== v.tab) {
      const t = $(tabBtn(v.tab));
      return { target: visible(t) ? tabBtn(v.tab) : null, text: `Open <b>${TAB_NAME[v.tab] || v.tab}</b>`, detour: true };
    }
    if (st.hint && performance.now() - stepAt > st.hint[0] * 1000) v.text += ` <i>${st.hint[1]}</i>`;
    return v;
  };

  /* ---- layout: the bubble goes below/above the target (or docks on phones), clamped in the viewport, never over the target ---- */
  const overlap = (a, b) => { const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); return w > 0 && h > 0 ? w * h : 0; };
  function place(tr) {
    const vw = innerWidth, vh = innerHeight, bw = bub.offsetWidth, bh = bub.offsetHeight, m = 8, gap = 14;
    const lo = m, tabTop = vh;                                 // the departments sit in a side rail now, so the bubble may use the full height
    const rl = Math.min(vw - bw - m, ($('#rail') ? $('#rail').getBoundingClientRect().right : 0) + m);       // keep the bubble off the side rail
    const clampX = cx => Math.max(m, rl, Math.min(vw - bw - m, cx - bw / 2));
    const cx = tr ? tr.left + tr.width / 2 : vw / 2;
    const c = {
      below: tr && { x: clampX(cx), y: tr.bottom + gap, side: 'below' },
      above: tr && { x: clampX(cx), y: tr.top - gap - bh, side: 'above' },
      dockTop: { x: clampX(vw / 2), y: lo, side: 'dock' },
      dockBot: { x: clampX(vw / 2), y: tabTop - bh - m, side: 'dock' }
    };
    const phone = vw <= 720, low = tr && tr.top + tr.height / 2 > vh * .5;
    const big = tr && tr.height > vh * .25;                    // a huge target (the stage) can't have a bubble beside it on a phone: dock away from it
    const order = !tr ? ['dockTop', 'dockBot'] : phone && big ? (low ? ['dockTop', 'above', 'below', 'dockBot'] : ['dockBot', 'below', 'above', 'dockTop']) : (low ? ['above', 'below', 'dockTop', 'dockBot'] : ['below', 'above', 'dockBot', 'dockTop']);
    let best = null, bestO = Infinity;
    for (const k of order) {
      const p = c[k]; if (!p) continue;
      const fits = p.y >= lo - 2 && p.y + bh <= vh - m + 2;
      const o = (tr ? overlap({ left: p.x, top: p.y, right: p.x + bw, bottom: p.y + bh }, tr) : 0) + (fits ? 0 : 1e7);
      if (o < bestO) { bestO = o; best = p; if (o === 0) break; }
    }
    best.y = Math.max(m, Math.min(vh - bh - m, best.y));
    bub.style.left = Math.round(best.x) + 'px'; bub.style.top = Math.round(best.y) + 'px';
    bub.dataset.side = best.side; bub.style.setProperty('--tail', Math.round(Math.max(16, Math.min(bw - 16, cx - best.x))) + 'px');
  }

  function hide() { bub.hidden = true; ring.hidden = true; drawKey = ''; }
  function draw() {
    if ((window.Rewards?.enabled && !Rewards.owns()) || mode === 'idle' || busy()) return hide();
    let target = null, text = '', num = '', canNext = false, last = false;
    if (mode === 'tour') {
      const st = STEPS[T.step]; if (!st) return finish();
      const v = stepView(st, snap());
      target = resolve(v.target); text = v.text; num = `${T.step + 1}/${STEPS.length}`; canNext = !!st.next || replaying; last = !!st.last || (replaying && T.step === STEPS.length - 1);
      skipEl.hidden = !replaying && IMI.ops.introActive(); skipEl.textContent = 'Skip'; nextEl.hidden = !canNext || !!v.detour; nextEl.textContent = last ? 'Done' : 'Next';
    } else {
      if (!tip) return hide();
      target = resolve(tip.target); text = tip.text; skipEl.hidden = true; nextEl.hidden = false; nextEl.textContent = 'Got it'; nEl.textContent = '';
    }
    nEl.textContent = num;
    const key = mode + (mode === 'tour' ? T.step : tip.id) + '|' + text;
    const changed = key !== drawKey;
    if (changed) { drawKey = key; txtEl.innerHTML = text; }
    if (changed && target) { const r = target.getBoundingClientRect(); if (r.bottom > innerHeight || r.top < 0) target.scrollIntoView({ block: 'nearest', behavior: 'instant' }); }   // inside the pane; the page itself never scrolls
    bub.dataset.kind = mode; bub.hidden = false;
    const tr = target ? target.getBoundingClientRect() : null;
    if (tr) {
      const pad = 5; ring.hidden = false;
      ring.style.cssText = `left:${tr.left - pad}px;top:${tr.top - pad}px;width:${tr.width + pad * 2}px;height:${tr.height + pad * 2}px`;
    } else ring.hidden = true;
    ring.classList.toggle('still', reduced());
    place(tr);
  }

  /* ---- tour flow ---- */
  function arm() {                                // restart the slow-player hint clock for the current step
    stepAt = performance.now(); clearTimeout(hintTimer);
    const st = STEPS[T.step]; if (st && st.hint) hintTimer = setTimeout(() => draw(), st.hint[0] * 1000 + 50);
  }
  function finish() {
    clearTimeout(hintTimer); if (!replaying) IMI.ops.completeIntro(); T.done = true; replaying = false; mode = 'idle'; lastTip = performance.now(); store(); hide();
  }
  function advance(dir = 1) {
    T.step += dir; store(); arm();
    if (T.step >= STEPS.length) return finish();
    IMI.sfx.tick(); drawKey = '';
  }
  function check() {                              // a player who already did the thing (or is ahead) skips straight past it
    if (mode !== 'tour' || replaying) return;
    let guard = 0, s = snap();
    while (mode === 'tour' && guard++ < STEPS.length) {
      const st = STEPS[T.step]; if (!st || !st.done || !st.done(s)) break;
      advance(1);
    }
  }
  nextEl.addEventListener('click', () => { if (mode === 'tour') advance(1); else dismissTip(); draw(); });
  skipEl.addEventListener('click', () => skip());

  function skip() { if (mode === 'tour' && (replaying || !IMI.ops.introActive())) { finish(); IMI.say('Tour skipped. Replay it any time from Settings.'); } }
  function replay() {
    if (IMI.ops.introActive()) { mode = 'tour'; check(); draw(); return; }
    replaying = true; T.step = 0; mode = 'tour'; arm(); drawKey = '';
    if (tip) dismissTip(true);
    const f = $(tabBtn('floor')); if (f) f.click();
    draw();
  }

  /* ---- tips ---- */
  const tipsOn = v => { if (v !== undefined) { T.tipsOff = !v; if (!v && tip) dismissTip(true); store(); } return !T.tipsOff; };
  function showTip(t) {
    tip = t; T.tips[t.id] = true; lastTip = performance.now(); store(); mode = 'tip'; drawKey = '';
    armTip(11000);
    IMI.sfx.tick(); draw();
  }
  function armTip(milliseconds) {
    clearTimeout(tipTimer); tipAt = performance.now(); tipRemaining = milliseconds;
    tipTimer = setTimeout(() => dismissTip(), milliseconds);
  }
  function dismissTip(quiet) { clearTimeout(tipTimer); tip = null; mode = T.done ? 'idle' : 'tour'; drawKey = ''; if (!quiet) draw(); else hide(); }
  function tryTips(s) {
    if (!T.done || tip || !tipsOn() || busy() || performance.now() - lastTip < TIP_GAP) return;
    for (const t of TIPS) {
      if (T.tips[t.id]) continue;
      if (t.ev ? pending[t.ev] : (s || snap()) && t.when((s || snap()))) { if (t.ev) { delete pending[t.ev]; if (t.live && IMI.screen() !== 'game') continue; } return showTip(t); }
    }
  }
  /* a save that is already past a tip's moment shouldn't be told about it now */
  if (T.done) { const s = snap(); TIPS.forEach(t => { if ((t.when && t.when(s)) || (t.seen && t.seen(s))) T.tips[t.id] = true; }); store(); }
  TIPS.filter(t => t.ev).forEach(t => IMI.on(t.ev, () => { if (T.tips[t.id] || !T.done) return; pending[t.ev] = true; if (t.live) setTimeout(() => delete pending[t.ev], 6000); tryTips(); }));

  /* ---- wiring ---- */
  // Recovery changes while productive rendering is stopped; keep Ops' sole status consumer.
  let recoveryPanel = $('.o-writer-status');
  const recoveryObserver = new MutationObserver(records => {
    if (window.Rewards?.enabled && !Rewards.owns()) { recoveryObserver.disconnect(); hide(); return; }
    const statusNode = node => node.nodeType === 1 && node.matches('.o-writer-status');
    if (!records.some(record => record.target.matches?.('.o-writer-status') ||
        [...record.addedNodes, ...record.removedNodes].some(statusNode))) return;
    const panel = $('.o-writer-status');
    if (panel && panel !== recoveryPanel) {
      recoveryPanel = panel; recoveryObserver.observe(panel, { attributes: true, attributeFilter: ['hidden'] });
    }
    const held = recoveryVisible();
    if (held === recovering) return;
    recovering = held;
    if (tip) {
      if (held) { tipRemaining = Math.max(0, tipRemaining - (performance.now() - tipAt)); clearTimeout(tipTimer); }
      else armTip(tipRemaining);
    }
    draw();
  });
  recoveryObserver.observe(document.body, { childList: true });
  recoveryObserver.observe($('#opsRoot .o-panel'), { childList: true });
  recovering = recoveryVisible();
  if (recoveryPanel) recoveryObserver.observe(recoveryPanel, { attributes: true, attributeFilter: ['hidden'] });
  addEventListener('pagehide', () => { recoveryObserver.disconnect(); hide(); }, { once: true });
  ['tap', 'letters', 'hire', 'bank', 'sold', 'desk', 'focus'].forEach(n => IMI.on(n, check));
  IMI.on('tab', () => { check(); draw(); });
  IMI.on('render', () => { check(); draw(); tryTips(); });
  $('#opsRoot').addEventListener('toggle', () => { drawKey = ''; draw(); }, true);
  addEventListener('resize', () => requestAnimationFrame(() => { drawKey = ''; draw(); }));
  if (window.ResizeObserver) new ResizeObserver(() => { drawKey = ''; draw(); }).observe($('#opsRoot'));
  IMI.onScreen(() => { check(); draw(); });
  addEventListener('keydown', e => {
    if (e.key !== 'Escape' || bub.hidden || (mode === 'tour' && !replaying && IMI.ops.introActive())) return;
    e.stopImmediatePropagation();
    if (mode === 'tour') skip(); else dismissTip();
  }, true);

  IMI.tour = { replay, skip, reset: () => { T = { version: 2, step: 0, done: false, tips: {}, tipsOff: false }; replaying = false; mode = 'tour'; tip = null; clearTimeout(tipTimer); store(); arm(); hide(); }, active: () => mode === 'tour', tipsOn };
  arm(); setTimeout(() => { check(); draw(); }, 400);
  }
  if (window.Rewards?.enabled) Rewards.start(start); else start();
})();
