from pathlib import Path

def edit(name, changes):
    p = Path(name)
    data = p.read_bytes()
    for old, new in changes:
        old, new = old.replace('\n', '\r\n').encode(), new.replace('\n', '\r\n').encode()
        assert data.count(old) == 1, (name, old[:100], data.count(old))
        data = data.replace(old, new)
    p.write_bytes(data)

edit('automation.js', [
 ("  const netSetting = () => ({ enabled:false, ordinary:0, golden:0, ...saved()?.net });", """  const helpers = ['hire', 'coach', 'shop', 'restore', 'net'];
  const level = id => saved()?.tiers?.[id] ?? 0;
  const interval = id => [20, 15, 10, 5][level(id)];
  const margin = () => [2, 1.75, 1.5, 1][level('restore')];
  const sequences = ['CSCSCCSCSC', 'CCCSCCSCSC', 'CCCCCCSCSC', 'CCCCCCCCCC'];
  const netSetting = () => ({ version:1, enabled:false, ordinary:0, golden:0, ...saved()?.net });"""),
 ("return m === undefined || object(m) && m.version === 1 && (m.desks", """return m === undefined || object(m) && m.version === 1 &&
      (m.tiers === undefined || object(m.tiers) && m.tiers.version === 1 && helpers.every(id =>
        m.tiers[id] === undefined || Number.isInteger(m.tiers[id]) && m.tiers[id] >= 0 && m.tiers[id] <= 3)) &&
      (!(m.tiers?.net > 0) || m.net?.version === 2) && (m.desks"""),
 ("object(m.net) && m.net.version === 1 &&", "object(m.net) && [1, 2].includes(m.net.version) &&"),
 ("m.net[k] < 5));", "m.net[k] < (m.net.version === 2 ? 10 : 5)));") ,
 ("    const result = api.commitAutomation(p.expected, p.next);", """    const result = p.upgrade ? api.buyAutomationTier(p.upgrade, p.level, p.expected) : api.commitAutomation(p.expected, p.next);
    if (p.upgrade) {
      if (p.upgrade === 'hire') elapsed = cursor = 0;
      else if (p.upgrade === 'shop') shopElapsed = 0;
      else if (p.upgrade === 'coach') coachElapsed = 0;
      else if (p.upgrade === 'restore') restoreElapsed = restoreCursor = 0;
      else cancelNet();
      if (result.retryable === false) { pending = null; notice = result.error; api.mark(); return; }
    }"""),
 ("    if (p.net) {", "    if (p.upgrade) { /* Only this helper's runtime was reset above. */ } else if (p.net) {"),
 ("  function netReady() {", """  function upgrade(el) {
    const id = el.dataset.helper, expectedLevel = Number(el.dataset.level);
    if (pending || !helpers.includes(id) || !api.quoteAutomationTier(id).ok || level(id) !== expectedLevel) return;
    if (id === 'net') cancelNet();
    const current = saved();
    write({ upgrade:id, level:expectedLevel, expected:current === undefined ? null : JSON.stringify(current) });
  }
  function tierCard(id, safe) {
    if (!safe) return '<p>Upgrades disabled for unsupported save data.</p>';
    const q = api.quoteAutomationTier(id), n = level(id);
    const effect = id === 'net' ? `${[60,70,80,100][n]}% selection per kind` : id === 'restore' ? `${margin()} times restoration price in wallet` : `Every ${interval(id)} active game seconds`;
    return `<p>Level ${n} of 3. ${effect}. ${n === 3 ? 'Max level.' : `Next upgrade: ${q.price} Legacy star${q.price === 1 ? '' : 's'}. ${q.error || ''}`}</p>${n === 3 ? '' : `<button data-act="automation:upgrade" data-helper="${id}" data-level="${n}" ${pending || !q.ok ? 'disabled' : ''}>Upgrade ${id === 'net' ? 'net' : `auto-${id}`} (${q.price} star${q.price === 1 ? '' : 's'})</button>`}`;
  }
  function netReady() {"""),
 ("next.net = { ...netSetting(), version:1, enabled };", "next.net = { ...netSetting(), enabled };"),
 ("next.net = { ...cfg, version:1, [kind]:(phase + 1) % 5 };", "next.net = { ...cfg, [kind]:(phase + 1) % (cfg.version === 2 ? 10 : 5) };"),
 ("if (phase === 1 || phase === 3)", "if ((cfg.version === 2 ? sequences[level('net')][phase] : 'CSCSC'[phase]) === 'S')"),
 ("Waiting for an owned desk below Mk III and a wallet of at least twice its current restoration price.", "Waiting for an owned desk below Mk III and the current level’s wallet margin."),
 ("Waiting for the next 20-second attempt.` :", "Waiting for the next ${interval('coach')}-second attempt.` :"),
 ("return q.ok ? 'Waiting for next hire, one globally per 20 active game seconds' : q.error;", "return q.ok ? `Waiting for next hire, one globally per ${interval('hire')} active game seconds` : q.error;"),
 ("Each purchase helper attempts once per 20 game seconds.", "Earned upgrades spend Legacy stars. Levels and settings survive Printing."),
 ("<h3>Banana net</h3>", "<h3>Banana net</h3>${tierCard('net', safe)}"),
 ("Selects 3 of 5 new ordinary and 3 of 5 new golden bananas in separate sequences: catch, skip, catch, skip, catch.", "Selects ${safe ? [60,70,80,100][level('net')] : 60}% of new ordinary and golden bananas in separate deterministic sequences."),
 ("<h3>Auto-restore</h3>", "<h3>Auto-restore</h3>${tierCard('restore', safe)}"),
 ("at least twice its current price in your wallet", "at least ${safe ? margin() : 2} times its current price in your wallet"),
 ("<h3>Auto-coach</h3>", "<h3>Auto-coach</h3>${tierCard('coach', safe)}"),
 ("<h3>Auto-shop</h3>", "<h3>Auto-shop</h3>${tierCard('shop', safe)}"),
 ("<p>One hire globally per 20 active game seconds.", "${tierCard('hire', safe)}<p>One hire globally per ${safe ? interval('hire') : 20} active game seconds."),
 ("    reset,\n    netBlocked", "    reset, validConfig:supported,\n    netBlocked"),
 ("    actions:{ toggle:", "    actions:{ upgrade, toggle:"),
 ("Math.min(20, elapsed + gameSeconds)", "Math.min(interval('hire'), elapsed + gameSeconds)"),
 ("Math.min(20, shopElapsed + gameSeconds)", "Math.min(interval('shop'), shopElapsed + gameSeconds)"),
 ("Math.min(20, coachElapsed + gameSeconds)", "Math.min(interval('coach'), coachElapsed + gameSeconds)"),
 ("[elapsed + 1e-9 >= 20, shopElapsed + 1e-9 >= 20, coachElapsed + 1e-9 >= 20,", "[elapsed + 1e-9 >= interval('hire'), shopElapsed + 1e-9 >= interval('shop'), coachElapsed + 1e-9 >= interval('coach'),"),
])

edit('ops.js', [
 ("current !== undefined && current?.version !== 1 || !next || next.version !== 1", "!extensions.get('automation').validConfig(current) || !next || !extensions.get('automation').validConfig(next) || JSON.stringify(current?.tiers) !== JSON.stringify(next.tiers) || current?.net && current.net.version !== next.net?.version"),
 ("      quoteAutomationHire(i, reservePercent) {", """      quoteAutomationTier(id) {
        const current = S.meta.automation, valid = extensions.get('automation').validConfig(current);
        const level = current?.tiers?.[id] ?? 0, price = [1, 2, 4][level];
        const gate = { hire:S.printing >= 1, shop:S.printing >= 2, coach:!!S.chDone.hands,
          restore:S.printing >= 4 && !!S.chDone.haiku, net:S.printing >= 5 && !!S.chDone.timed };
        const error = !Object.hasOwn(gate, id) || !valid ? 'Unsupported automation tier' :
          !S.intro.done || !gate[id] ? 'Helper is locked' : level === 3 ? 'Max level' :
          !extensionAPI.automationAllowed() ? 'Save owner is unavailable' :
          !Number.isSafeInteger(S.legacy.stars) || S.legacy.stars < price ? 'Not enough Legacy stars' : '';
        return { ok:!error, error, level, price };
      },
      buyAutomationTier(id, expectedLevel, expected) {
        const q = extensionAPI.quoteAutomationTier(id), current = S.meta.automation;
        if (!q.ok || q.level !== expectedLevel || (current === undefined ? null : JSON.stringify(current)) !== expected)
          return { ok:false, retryable:false, error:q.error || 'Automation tier changed. Choose the upgrade again.' };
        const automation = current === undefined ? {version:1} : JSON.parse(JSON.stringify(current));
        automation.tiers = { ...automation.tiers, version:1, [id]:q.level + 1 };
        if (id === 'net') automation.net = { enabled:false, ordinary:0, golden:0, ...automation.net, version:2 };
        const legacy = { ...S.legacy, stars:S.legacy.stars - q.price }, lastSeen = S.rewards.awayCheckpoint ? S.lastSeen : Date.now();
        const result = Economy.saveStateAcknowledged({ ...S, legacy, meta:{ ...S.meta, automation }, lastSeen });
        if (result.ok) { S.legacy = legacy; S.meta.automation = automation; S.lastSeen = lastSeen; mark(); }
        return result;
      },
      quoteAutomationHire(i, reservePercent) {"""),
 ("const price = mkCost(i), error = d.mk >= 2 ? 'Restoration cap reached' :\n          !(bananas.get() >= 2 * price) ? 'Waiting for wallet of at least twice the restoration price' : '';", """const level = S.meta.automation?.tiers?.restore ?? 0;
        if (!extensions.get('automation').validConfig(S.meta.automation)) return { ok:false, error:'Unsupported automation tier' };
        const price = mkCost(i), margin = [2, 1.75, 1.5, 1][level], error = d.mk >= 2 ? 'Restoration cap reached' :
          !(bananas.get() >= margin * price) ? `Waiting for wallet of at least ${margin} times the restoration price` : '';"""),
])
edit('sw.js', [("const VERSION = 'imi-v44';", "const VERSION = 'imi-v45';")])
