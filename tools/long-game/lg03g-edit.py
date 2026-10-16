from pathlib import Path

def edit(file, fn):
    p=Path(file); b=p.read_bytes(); s=b.decode(); nl='\r\n' if '\r\n' in s else '\n'; s=s.replace('\r\n','\n'); t=fn(s); p.write_bytes(t.replace('\n',nl).encode())
def one(s,a,b):
    assert s.count(a)==1, (a[:100],s.count(a));return s.replace(a,b)
def ops(s):
    s=one(s,"    { id: 'timed', name: 'Deadline', stars: 5, goalN: 8, minutes: 20, desc: 'Sell 8 titles within 20 minutes.', perk: 'Golden banana \"Lucky\" bonuses are 25% bigger, forever.' }", "    { id: 'timed', name: 'Deadline', stars: 5, goalN: 8, minutes: 20, desc: 'Sell 8 titles within 20 minutes.', perk: 'Golden banana \"Lucky\" bonuses are 25% bigger, forever.' },\n    { id: 'smallcrew', name: 'Small Crew', stars: 0, goalN: 6, helper: 'hire', desc: 'At most 2 typists per owned desk. Sell 6 progression titles.', perk: 'Auto-hire level at least 1, retaining higher levels and its base unlock.' },\n    { id: 'quietshop', name: 'Quiet Shop', stars: 0, goalN: 6, helper: 'shop', desc: 'Hold to type, Writing contracts, Paw metronome, Double touch, Literary agent and Market analyst cannot be acquired or take effect, including Veteran Crew Hold. Sell 6 progression titles.', perk: 'Auto-shop level at least 1, retaining higher levels and its base unlock.' },\n    { id: 'patientpress', name: 'Patient Press', stars: 0, goalN: 8, helper: 'coach', desc: 'Publisher purchases and automatic sales are disabled. Sell 8 progression titles manually.', perk: 'Auto-coach level at least 1, retaining higher levels and its base unlock.' },\n    { id: 'baremetal', name: 'Bare Metal', stars: 0, goalN: 8, helper: 'restore', desc: 'No Mk II or Mk III restorations. New desks remain available. Sell 8 progression titles.', perk: 'Auto-restore level at least 1, retaining higher levels and its base unlock.' }")
    s=one(s,"  const chPerk = id => !!S.chDone[id];", "  const challengePrototype = new URLSearchParams(location.search).get('lg03') === '1';\n  const challengeCatalog = () => CHALLENGES.filter(c => !c.helper || challengePrototype || S.chDone[c.id] || chal(c.id));\n  const challengeSelectable = c => !c.helper || challengePrototype && S.printing >= 4 && S.intro.done && !!writer?.owns();\n  const challengeReward = c => c.helper ? `${c.perk} First clear also gives Letters on the highest owned desk: floor(max(50, min(5000, 180 × productive letters/second))). No new stars or Diamond Bananas. Replays pay nothing.` : `+${c.stars} stars and a perk: ${c.perk}`;\n  const toolOn = key => !!S[key] && !chal('quietshop');\n  const challengeShopLock = what => chal('quietshop') && ['hold', 'contracts', 'metro', 'dbl', 'agent', 'analyst'].includes(what) ? 'Blocked by Quiet Shop' :\n    chal('patientpress') && what === 'pub' ? 'Blocked by Patient Press' : chal('baremetal') && what === 'mk' ? 'Blocked by Bare Metal' : '';\n  const chPerk = id => !!S.chDone[id];")
    s=one(s,"    const C = chDef(S.challenge.id), challengeWasDone = !!S.chDone[C.id]; S.challenge = null;", "    const C = chDef(S.challenge.id), challengeWasDone = !!S.chDone[C.id];\n    if (kind === 'done' && C.helper) {\n      if (!writer?.owns() || !progressing() || writer.localDisposition() || !writer.guard(S)) return;\n      if (!challengeWasDone) {\n        const automation = extensions.get('automation')?.firstClearFloor(C.id, S.meta.automation);\n        if (!automation) return;\n        S.meta.automation = automation;\n      }\n    }\n    S.challenge = null;")
    s=one(s,"if (first) { S.legacy.stars += C.stars; S.legacy.total += C.stars; }", "if (first && C.stars) { S.legacy.stars += C.stars; S.legacy.total += C.stars; }")
    s=one(s,"${first ? ` +${C.stars} Legacy stars and a permanent perk.` : ''}","${first ? ` ${challengeReward(C)}` : ''}")
    s=one(s,"    const gain = starsNow(); if (gain < 1) return;\n    IMI.pickups", "    const gain = starsNow(); if (gain < 1) return;\n    const constraint = chId && chDef(chId);\n    if (chId && (!constraint || !challengeSelectable(constraint) || constraint.helper && (writer.localDisposition() || !writer.guard(S)))) return;\n    IMI.pickups")
    s=one(s,"if (legLvl('crew')) { S.hold = true;", "if (legLvl('crew')) { S.hold = !chal('quietshop');")
    s=one(s,"      <p class=\"o-dim\">You keep awards, stats, pitched titles", "      ${C ? `<p>${C.desc} First-clear benefit: ${challengeReward(C)}</p>` : ''}\n      <p class=\"o-dim\">You keep awards, stats, pitched titles")
    s=one(s,"CHALLENGES.map(c => [c.id, c.name", "challengeCatalog().map(c => [c.id, c.name")
    s=one(s,'data-act="chpick" data-id="${id}" aria-pressed=', 'data-act="chpick" data-id="${id}" ${id && !challengeSelectable(chDef(id)) ? \'disabled\' : \'\'} aria-pressed=')
    s=one(s,'${picked.desc} Reward: <b>+${picked.stars} stars</b> and a perk: ${picked.perk}', '${picked.desc} First-clear benefit: ${challengeReward(picked)}')
    s=one(s,'Constraints make a run harder in a literary way. Each is worth stars and a permanent perk the first time you finish it.', 'Choose a constraint for the next run. The four new constraints require Printing 5, the completed introduction and the reward save owner (lg01a=1). Each first clear pays its listed benefit once.')
    s=one(s,"() => CHALLENGES.every(c => S.chDone[c.id])", "() => ['vowel', 'haiku', 'hands', 'timed'].every(id => S.chDone[id])")
    s=s.replace('CHALLENGES.filter(c => S.chDone[c.id])', 'challengeCatalog().filter(c => S.chDone[c.id])')
    s=one(s,'challenges:CHALLENGES.length', 'challenges:challengeCatalog().length')
    # One effective-tool predicate covers loaded and inherited effects in online/away/reward-basis/UI paths.
    for k in ['metro','dbl','agent','contracts','analyst','hold']:
        s=s.replace(f'(S.{k} ?',f"(toolOn('{k}') ?")
    s=s.replace('const nx = S.analyst ?',"const nx = toolOn('analyst') ?")
    s=s.replace('if (S.hold) holding = true',"if (toolOn('hold')) holding = true")
    s=s.replace('holding && S.hold',"holding && toolOn('hold')")
    s=s.replace(": S.hold ?",": toolOn('hold') ?")
    s=one(s,"if (!S.pub.tier || !S.pub.on || document.querySelector", "if (chal('patientpress') || !S.pub.tier || !S.pub.on || document.querySelector")
    s=one(s,"const out = { n: 0, pay: 0 }; if (S.pub.tier < 3", "const out = { n: 0, pay: 0 }; if (chal('patientpress') || S.pub.tier < 3")
    s=one(s,"const p = S.pub; if (!p.tier) return '';", "const p = S.pub; if (chal('patientpress')) return 'Publisher disabled by Patient Press. Sell titles manually.'; if (!p.tier) return '';")
    s=one(s,"const r = RBY[id]; if (!r || !canWrite(r)) return;", "const r = RBY[id]; if (!r || !canWrite(r) || chal('patientpress') && (opts.auto || opts.silent)) return;")
    s=one(s,"const slots = timed && S.pub.tier", "const slots = timed && !chal('patientpress') && S.pub.tier")
    s=one(s,"if (S.pub.tier && S.pub.on) { pubClock", "if (!chal('patientpress') && S.pub.tier && S.pub.on) { pubClock")
    s=one(s,"const upCap = (u, d) => (u.tier ?", "const upCap = (u, d) => (u.k === 'paw' && chal('smallcrew') ? 2 : u.tier ?")
    s=one(s,"    if (u.needs === 'hold' && !S.hold)", "    if (u.k === 'paw' && chal('smallcrew') && d.paws >= 2) return 'Small Crew allows 2 typists per desk';\n    if (u.needs === 'hold' && !toolOn('hold'))")
    s=one(s,"  function shopLock(what) {", "  function shopLock(what) {\n    const constraint = challengeShopLock(what); if (constraint) return constraint;")
    s=one(s,"    const i = +arg;\n    if (what === 'desk')", "    const i = +arg;\n    if (challengeShopLock(what)) return;\n    if (what === 'desk')")
    s=one(s,"const price = mkCost(i), margin = [2, 1.75, 1.5, 1][level], error = d.mk", "const price = mkCost(i), margin = [2, 1.75, 1.5, 1][level], error = challengeShopLock('mk') || (d.mk")
    s=one(s,"? `Waiting for wallet of at least ${margin} times the restoration price` : '';", "? `Waiting for wallet of at least ${margin} times the restoration price` : '');")
    s=one(s,"const lock = t === 0 && soldCount() < 3 ? 'Needs 3 sold titles' : '';", "const lock = challengeShopLock('pub') || (t === 0 && soldCount() < 3 ? 'Needs 3 sold titles' : '');")
    s=one(s,"${have < mkCost(i) ? 'disabled' : ''}>Restore", "${challengeShopLock('mk') || have < mkCost(i) ? 'disabled' : ''}>${challengeShopLock('mk') || 'Restore'}")
    s=one(s,"const item = (name, desc, cost, owned, lock, act, i) => `", "const item = (name, desc, cost, owned, lock, act, i) => { lock = challengeShopLock(act) || lock; return `")
    s=one(s,"${lock || have < cost ? 'disabled' : ''}>Buy</button>`}</div>`;", "${lock || have < cost ? 'disabled' : ''}>Buy</button>`}</div>`; };")
    s=one(s,"if (!S.pub.tier) return '';", "if (chal('patientpress')) return '<p class=\"o-warn\">Publisher disabled by Patient Press. Manual selling is available.</p>';\n    if (!S.pub.tier) return '';")
    s=one(s,"chpick: el => { ui.nextCh = el.dataset.id;", "chpick: el => { const c = chDef(el.dataset.id); if (el.dataset.id && (!c || !challengeSelectable(c))) return; ui.nextCh = el.dataset.id;")
    s=one(s,"pubon: () => { S.pub.on", "pubon: () => { if (chal('patientpress')) return; S.pub.on")
    s=one(s,"pubrule: el => { S.pub.rule", "pubrule: el => { if (chal('patientpress')) return; S.pub.rule")
    return s

def auto(s):
    return one(s,"    reset, validConfig:supported,", "    reset, validConfig:supported,\n    firstClearFloor(id, current) {\n      const helper = {smallcrew:'hire', quietshop:'shop', patientpress:'coach', baremetal:'restore'}[id];\n      if (!helper || !supported(current)) return null;\n      const next = current === undefined ? {version:1} : JSON.parse(JSON.stringify(current));\n      next.tiers = { ...next.tiers, version:1, [helper]:Math.max(next.tiers?.[helper] ?? 0, 1) };\n      return next;\n    },")
def rewards(s):
    s=one(s,"  const object = n =>", "  const letterFirsts = {\n    'challenge:smallcrew:first':{kind:'L', tier:0}, 'challenge:quietshop:first':{kind:'L', tier:0},\n    'challenge:patientpress:first':{kind:'L', tier:0}, 'challenge:baremetal:first':{kind:'L', tier:0}\n  };\n  const object = n =>")
    s=s.replace('!assignments[id.slice(6)] && !firsts[id]', '!assignments[id.slice(6)] && !firsts[id] && !letterFirsts[id]')
    s=s.replace('(assignments[id.slice(6)] || firsts[id])', '(assignments[id.slice(6)] || firsts[id] || letterFirsts[id])')
    s=one(s,"  function row(id) {", "  function row(id) {\n    if (Object.hasOwn(letterFirsts, id)) return letterFirsts[id];")
    s=one(s,"...Object.keys(firsts).filter(id =>", "...Object.keys({...firsts, ...letterFirsts}).filter(id =>")
    s=one(s,"  function historical(s, id) {", "  function historical(s, id) {\n    if (Object.hasOwn(letterFirsts, id)) return false;")
    return s
edit('ops.js',ops);edit('automation.js',auto);edit('rewards.js',rewards);edit('sw.js',lambda s:one(s,"imi-v45","imi-v46"))
