from pathlib import Path

# Preserve every existing Ops/SW byte outside these two leased insertions.
p = Path('ops.js')
raw = p.read_bytes()
anchor = b'      quoteAutomationShop(key) {'
block = '''      automationCoachTargets() {
        return S.desks.flatMap((d, index) => d.owned ? d.crew.slice(0, d.paws).map((_, paw) =>
          ({ index, paw, ...extensionAPI.quoteAutomationCoach(index, paw) })) : []);
      },
      quoteAutomationCoach(i, p) {
        if (!S.chDone.hands || !S.intro.done) return { ok:false, error:'Requires No Hands completion' };
        if (!extensionAPI.automationAllowed()) return { ok:false, error:'Progression or save is paused' };
        const d = Number.isInteger(i) && S.desks[i], t = d?.owned && Number.isInteger(p) && p >= 0 && p < d.paws && d.crew[p];
        if (!t) return { ok:false, error:'Monkey is not owned' };
        const coach = t.coach || 0, price = coachCost(i, t);
        const error = coach >= COACH_MAX ? 'Coaching cap reached' :
          !(price <= bananas.get() / 20) ? 'Waiting for cost at most 5% of wallet' : '';
        return { ok:!error, error, price, coach, level:levelOf(t.xp), name:t.name, desk:DESKS[i].name };
      },
      coachAutomationOne(i, p) {
        return extensionAPI.quoteAutomationCoach(i, p).ok && !!coachTypist(i, p);
      },
'''.replace('\n', '\r\n').encode()
assert raw.count(anchor) == 1 and b'      automationCoachTargets() {' not in raw
p.write_bytes(raw.replace(anchor, block + anchor))
p = Path('sw.js')
raw = p.read_bytes()
assert raw.count(b"const VERSION = 'imi-v37';") == 1
p.write_bytes(raw.replace(b"const VERSION = 'imi-v37';", b"const VERSION = 'imi-v38';"))
