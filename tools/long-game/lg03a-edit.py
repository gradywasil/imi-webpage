"""Apply byte-bounded LG-03A seams, preserving existing line endings."""
from pathlib import Path

def replace(path, old, new):
    p = Path(path)
    data = p.read_bytes()
    ending = b'\r\n' if b'\r\n' in data else b'\n'
    before, after = (s.replace('\n', ending.decode()).encode() for s in (old, new))
    assert data.count(before) == 1, (path, old)
    p.write_bytes(data.replace(before, after))

replace('ops.js', '  function buyUp(k) {\n    const i = S.sel, d = cur(), u = UPS.find(x => x.k === k); if (!u) return;',
        '  function buyUp(k, i = S.sel, want = buyWant()) {\n    const d = S.desks[i], u = UPS.find(x => x.k === k); if (!u) return;')
replace('ops.js', '    const plan = upPlan(u, d, i, buyWant()); if (plan.n <= 0 || totalLetters(d) < plan.cost) return;',
        '    const plan = upPlan(u, d, i, want); if (plan.n <= 0 || totalLetters(d) < plan.cost) return;')
replace('ops.js', "    if (u.k === 'paw') IMI.emit('hire', { n: plan.n, desk: i });\n  }",
        "    if (u.k === 'paw') IMI.emit('hire', { n: plan.n, desk: i });\n    return true;\n  }")
replace('ops.js', '    state: () => S, save, mark, morph, setTab,', '''    state: () => S, save, mark, morph, setTab,
    ...(new URLSearchParams(location.search).get('lg03') === '1' ? {
      automationAllowed: () => !window.VaultSaveGate?.blocked && progressing() && (!writer || !writer.localDisposition() && writer.guard(S)),
      automationDesks: () => DESKS.map((d, index) => ({ id:d.id, name:d.name, index, owned:S.desks[index].owned })),
      commitAutomation(expected, next) {
        if (!extensionAPI.automationAllowed()) return { ok:false, error:'Save owner is unavailable' };
        const current = S.meta.automation;
        if ((current === undefined ? null : JSON.stringify(current)) !== expected || current !== undefined && current?.version !== 1 || !next || next.version !== 1) return { ok:false, error:'Automation save changed or is unsupported' };
        const automation = JSON.parse(JSON.stringify(next)), lastSeen = S.rewards.awayCheckpoint ? S.lastSeen : Date.now();
        const result = Economy.saveStateAcknowledged({ ...S, meta:{ ...S.meta, automation }, lastSeen });
        if (result.ok) { S.meta.automation = automation; S.lastSeen = lastSeen; mark(); }
        return result;
      },
      quoteAutomationHire(i, reservePercent) {
        if (S.printing < 1 || !S.intro.done) return { ok:false, error:'Requires Printing 2' };
        if (!extensionAPI.automationAllowed()) return { ok:false, error:'Progression or save is paused' };
        const d = Number.isInteger(i) && S.desks[i], u = UPS.find(x => x.k === 'paw');
        if (!d?.owned) return { ok:false, error:'Desk is not owned' };
        if (!Number.isInteger(reservePercent) || reservePercent < 0 || reservePercent > 100 || reservePercent % 5) return { ok:false, error:'Unsupported reserve' };
        const lock = upLock(u, d), plan = upPlan(u, d, i, 1), held = totalLetters(d);
        if (lock) return { ok:false, error:lock };
        if (!plan.n) return { ok:false, error:'Typist cap reached' };
        if (held < plan.cost) return { ok:false, error:'Waiting for affordable letters', cost:plan.cost };
        if (held - plan.cost < Math.ceil(held * reservePercent / 100)) return { ok:false, error:'Waiting for letter reserve', cost:plan.cost };
        return { ok:true, cost:plan.cost };
      },
      hireAutomationOne(i, reservePercent) {
        return extensionAPI.quoteAutomationHire(i, reservePercent).ok && !!buyUp('paw', i, 1);
      }
    } : {}),''')
for shell in ['index.html', 'classic.html', 'tools/balance.html']:
    prefix = '../' if shell.startswith('tools/') else ''
    replace(shell, f'<script src="{prefix}minigame-progression.js"></script>', f'<script src="{prefix}minigame-progression.js"></script>\n<script src="{prefix}automation.js"></script>')
    replace(shell, f'<link rel="stylesheet" href="{prefix}minigame-progression.css">', f'<link rel="stylesheet" href="{prefix}minigame-progression.css">\n<link rel="stylesheet" href="{prefix}automation.css">')
replace('sw.js', "const VERSION = 'imi-v35';", "const VERSION = 'imi-v36';")
replace('sw.js', "  'minigame-progression.js',", "  'automation.js', 'automation.css', 'minigame-progression.js',")

replace('ops.js', "extensionEvent('tick', { realSeconds: realDt, gameSeconds: dt });", "extensionEvent('tick', { realSeconds: realDt, gameSeconds: dt, ...(extensions.has('automation') ? { replay:!!frame } : {}) });")
