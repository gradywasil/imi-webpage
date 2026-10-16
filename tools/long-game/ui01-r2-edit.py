from pathlib import Path
import shutil
base=Path('docs/plan/long-game/evidence/UI-01/implementation-r2')
for f in ['ops.js','ops.css','sw.js']: shutil.copyfile(f,base/('before-'+f))
def edit(f,fn):
 p=Path(f); s=p.read_bytes().decode('utf-8'); p.write_bytes(fn(s).encode('utf-8'))
def js(s):
 s=s.replace("  const combo = { n: 0, t: 0, timer: 0 };", """  const HIGH_MILES = new URLSearchParams(location.search).get('ui01') === '1' ? [
    [500, 'LONG RUN'], [1000, 'MARATHON'], [2000, 'IRON PAWS'],
    [3000, 'UNBROKEN'], [4000, 'LEGEND'], [5000, 'TYPING MYTH']
  ].map(([n, name]) => ({ n, name, desc: `A streak of ${n} taps!`, recognition: true })) : [];
  const combo = { n: 0, t: 0, timer: 0 };
  let milestoneNotice, noticeTimer, noticeItems = [];
  function showMilestone(m) {
    if (!milestoneNotice) {
      milestoneNotice = document.createElement('div'); milestoneNotice.className = 'o-milestone-notice';
      milestoneNotice.setAttribute('role', 'status'); root.appendChild(milestoneNotice);
    }
    noticeItems.push(m);
    const visible = noticeItems.slice(0, 2), rest = noticeItems.slice(2);
    milestoneNotice.innerHTML = visible.map(x => `<b>${esc(x.name)}!</b><span>${esc(x.desc)}</span>`).join('') +
      (rest.length ? `<details><summary>${rest.length} more streak milestones</summary>${rest.map(x => `<b>${esc(x.name)}!</b><span>${esc(x.desc)}</span>`).join('')}</details>` : '');
    milestoneNotice.hidden = false;
    clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { milestoneNotice.hidden = true; noticeItems = []; }, 3000);
  }""".replace('\n','\r\n'))
 s=s.replace("    const d = cur(), now = performance.now();\r\n    if (now < (ui.mcd[m.n]", "    if (m.recognition) { showMilestone(m); root.dataset.streak = m.n; mark(); return; }\r\n    const d = cur(), now = performance.now();\r\n    if (now < (ui.mcd[m.n]")
 s=s.replace("    floatText(m.name + '!', cx, cy, '#ffd23a', true); floatText(m.desc, cx, cy + 46, '#fff6d6');", "    showMilestone(m);")
 s=s.replace("    if (stage.dataset.heat !== String(heat)) stage.dataset.heat = heat;", "    if (root.dataset.heat !== String(heat)) root.dataset.heat = heat;")
 s=s.replace("    const m = MILES.find(x => x.n === combo.n);", "    const m = MILES.find(x => x.n === combo.n) || HIGH_MILES.find(x => x.n === combo.n);")
 s=s.replace("stage.dataset.heat = 0; combo.n = 0;", "root.dataset.heat = 0; delete root.dataset.streak; combo.n = 0;")
 old="MILES.map(m => `<span class=\"o-mile"
 s=s.replace(old,"[...MILES, ...HIGH_MILES.filter(m => m.n > combo.n).slice(0, 1)].map(m => `<span class=\"o-mile")
 a=s.index("  const buffBar = document.createElement('div');")
 b=s.index("    const st = $('#oStage'); if (st)",a)
 s=s[:a]+"""  const buffBar = document.createElement('div'); buffBar.className = 'o-buffbar'; buffBar.setAttribute('aria-live', 'polite');
  const buffDisplay = {};
  const BUFF_DETAILS = {
    frenzy: 'All typists work twice as fast.', golden: 'Every tap types two letters.',
    snack: 'Typists work 50% faster.', rush: 'Royalties pay seven times as much.',
    sluggish: 'Typists work more slowly.', critic: 'Royalties are halved.'
  };
  function renderBuffs() {
    if (!progressing()) return;
    const now = performance.now(), on = Object.keys(buffs).filter(buffOn), floor = ui.tab === 'floor';
    const host = floor ? $('#o-floor') : $('.o-wrap');
    if (host && !buffBar.closest('.o-writer-content') && buffBar.parentNode !== host) {
      if (floor) host.prepend(buffBar); else host.insertBefore(buffBar, $('.o-panel'));
    }
    for (const k of Object.keys(buffDisplay)) if (!on.includes(k)) delete buffDisplay[k];
    morph(buffBar, on.map((k, i) => {
      const remaining = Math.max(0, buffs[k] - now), old = buffDisplay[k];
      if (!old || remaining > old.remaining + 250) buffDisplay[k] = { total: remaining };
      const display = buffDisplay[k]; display.remaining = remaining;
      const ratio = Math.min(1, remaining / display.total), desc = BUFF_DETAILS[k];
      return `<div class="o-buff ${k} ${BUFF_INFO[k][1]}"><b>${BUFF_INFO[k][0]}</b>${floor && i < 2 ? `<span class="o-buff-desc">${desc}</span>` : `<details><summary aria-label="Read ${BUFF_INFO[k][0]} effect">Effect details</summary><span>${desc}</span></details>`}<span class="o-buff-meter" role="img" aria-label="${esc(BUFF_INFO[k][0])}: ${Math.ceil(remaining / 1000)} seconds remaining"><i style="transform:scaleX(${ratio.toFixed(4)})"></i></span></div>`;
    }).join('') + (S.challenge ? `<div class="o-buff chal"><b>OULIPO: ${esc(chDef(S.challenge.id).name)}</b><span>${chProgress()}</span></div>` : ''));
""".replace('\n','\r\n')+s[b:]
 s=s.replace("    wrap.dataset.tab = ui.tab;", "    wrap.dataset.tab = ui.tab; root.dataset.tab = ui.tab;")
 s=s.replace('<div class="o-row"><button type="button" class="o-btn sm" data-act="read"', '<div class="o-row o-actions"><button type="button" class="o-btn sm" data-act="read"')
 return s
edit('ops.js',js)
def css(s):
 s=s.replace("#opsRoot { flex:","#opsRoot { position: relative; isolation: isolate; flex:")
 s=s.replace('.o-scene::before { content:', '#opsRoot::before { z-index: -1; pointer-events: none; content:')
 s=s.replace('.o-stage[data-heat="', 'html[data-screen="game"] #opsRoot[data-tab="floor"][data-heat="')
 s=s.replace('] .o-scene::before', ']::before')
 s=s.replace('.o-scene::before, .o-btn::after', '#opsRoot::before, .o-btn::after')
 s=s.replace(".o-buffbar { position: fixed; left: 50%; transform: translateX(-50%); z-index: 30; display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; max-width: calc(100vw - 70px); pointer-events: none; }", ".o-buffbar { flex: none; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; width: 100%; min-width: 0; }")
 s+='''\r\n/* UI-01: bounded notices and shared action geometry retain each edition's paint. */
#opsRoot[data-streak]::before { --heat: rgba(181,140,240,.3); }
html[data-fx="low"] #opsRoot::before { animation: none !important; transition: none; }
.o-buff { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0; max-width: 100%; padding: 8px; text-align: center; overflow-wrap: anywhere; animation: none; }
.o-buff::after { display: none; }
.o-buff b { font-weight: 400; }
.o-buff span, .o-buff details { font-family: var(--font-body, inherit); font-size: 14px; line-height: 1.25; }
.o-buff details { width: 100%; }
.o-buff summary { min-height: 40px; display: grid; place-items: center; cursor: pointer; }
.o-buff-meter { display: block; width: 100%; height: 5px; background: rgba(26,15,20,.25); }
.o-buff-meter i { display: block; height: 100%; background: #3a210d; transform-origin: left; }
#o-floor > .o-buffbar { position: absolute; top: 48px; left: 0; z-index: 7; padding: 0 8px; max-height: 45%; overflow: auto; pointer-events: none; }
#o-floor > .o-buffbar .o-buff { flex: 0 1 260px; }
#o-floor > .o-buffbar details { pointer-events: auto; }
.o-wrap > .o-buffbar .o-buff { flex: 1 1 140px; }
html[data-style="classic"] .o-buff { border-radius: 12px; }
html[data-style="pixel"] .o-buff { border-radius: 0; }
.o-milestone-notice { position: absolute; z-index: 20; top: 45%; left: 50%; transform: translate(-50%, -50%); width: min(420px, calc(100% - 16px)); max-height: 42%; overflow: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; text-align: center; overflow-wrap: anywhere; background: #1a0f14; color: #fff6d6; border: 3px solid #ffd23a; }
.o-milestone-notice[hidden], #opsRoot:not([data-tab="floor"]) > .o-milestone-notice { display: none; }
.o-milestone-notice b { color: #ffd23a; }
.o-milestone-notice details > span, .o-milestone-notice details > b { display: block; margin-block: 8px; }
.o-milestone-notice summary { min-height: 40px; cursor: pointer; }
html[data-style="pixel"] .o-milestone-notice { font-family: var(--font-px); font-size: 10px; line-height: 1.5; }
html[data-style="pixel"] .o-milestone-notice span { font-family: 'VT323', monospace; font-size: 20px; line-height: 1.1; }
html[data-style="classic"] .o-milestone-notice { border-radius: 12px; font-family: var(--font-display); font-size: 18px; }
html[data-style="classic"] .o-milestone-notice span { font-family: var(--font-body); font-size: 16px; }
.o-card { container-type: inline-size; }
.o-card > .o-btn { align-self: flex-end; margin-top: auto; min-height: 40px; }
.o-actions, .o-coach, .pg01-actions { gap: 8px; }
.o-actions { justify-content: flex-start; margin-top: auto; }
.o-actions > .o-btn:last-child { margin-left: auto; }
.o-actions .o-btn, .o-coach .o-btn, .o-seg button { min-height: 40px; }
.o-seg { display: flex; flex: 1 1 auto; width: 100%; gap: 4px; }
.o-seg button, .pg01-actions > .o-btn { flex: 1 1 auto; justify-content: center; }
.o-row > .o-seg { width: auto; min-width: min(100%, 240px); }
.o-filters .o-row { gap: 8px; }
@container (max-width: 320px) {
  .o-card > .o-btn, .o-actions > .o-btn:last-child { width: 100%; margin-left: 0; }
  .o-coach > .o-btn { flex: 1 1 100%; justify-content: center; }
}
'''.replace('\n','\r\n')
 return s
edit('ops.css',css)
edit('sw.js',lambda s:s.replace("imi-v39","imi-v40"))
