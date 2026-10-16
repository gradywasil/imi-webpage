from pathlib import Path

def edit(name, changes):
    path = Path(name)
    text = path.read_bytes().decode('utf-8')
    newline = '\r\n' if '\r\n' in text else '\n'
    for old, new in changes:
        old, new = old.replace('\n', newline), new.replace('\n', newline)
        assert text.count(old) == 1, (name, old[:100], text.count(old))
        text = text.replace(old, new)
    path.write_bytes(text.encode('utf-8'))

edit('pickups.js', [
('const clear = () => { if (active) { clearTimeout(active.timer);', "const clear = () => { if (active) { reward.netCleared?.('ordinary', active.net); clearTimeout(active.timer);"),
('''    el.addEventListener('click', e => {
      e.stopPropagation(); if (active !== item) return;''', '''    const claim = () => {
      if (active !== item) return;'''),
('''      const r = el.getBoundingClientRect(); clear(); reward.collect(value, [r.left + r.width / 2, r.top + r.height / 2]);
    });''', '''      const r = el.getBoundingClientRect(); clear(); reward.collect(value, [r.left + r.width / 2, r.top + r.height / 2]);
    };
    el.addEventListener('click', e => { e.stopPropagation(); claim(); });
    item.net = { el, valid:() => active === item && eligible() && now() < item.expires, claim };
    reward.netCreated?.('ordinary', item.net);''')])

edit('ops.js', [
('''    const end = () => { if (done) return; done = true; clearInterval(trail);''', '''    let netItem;
    const end = () => { if (done) return; done = true; extensions.get('automation')?.netCleared('golden', netItem); clearInterval(trail);'''),
('''    el.addEventListener('click', e => {
      if (!progressing()) return;
      if (done) return;
      e.stopPropagation(); const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      end(); if (!introActive()) goldEffect(roulette(rotten ? ROT_FX : GOLD_FX), x, y);
    });''', '''    const claim = () => {
      if (!progressing()) return;
      if (done) return;
      const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      end(); if (!introActive()) goldEffect(roulette(rotten ? ROT_FX : GOLD_FX), x, y);
    };
    el.addEventListener('click', e => { if (!progressing() || done) return; e.stopPropagation(); claim(); });
    netItem = { el, valid:() => !rotten && !done && productionNow() < goldUntil, claim };
    extensions.get('automation')?.netCreated('golden', netItem);'''),
('''  const pickup = {
    eligible:''', '''  const pickup = {
    ...(new URLSearchParams(location.search).get('lg03') === '1' ? {
      netCreated:(kind, item) => extensions.get('automation')?.netCreated(kind, item),
      netCleared:(kind, item) => extensions.get('automation')?.netCleared(kind, item)
    } : {}),
    eligible:'''),
('''    writer.onStatusPresentation(content => {
      if (content) {''', '''    writer.onStatusPresentation(content => {
      if (content) {
        extensions.get('automation')?.netBlocked();''')])

edit('automation.js', [
("  const restoreSetting =", "  const netUnlocked = () => api.state().printing >= 5 && !!api.state().chDone.timed && api.state().intro.done;\n  const netSetting = () => ({ enabled:false, ordinary:0, golden:0, ...saved()?.net });\n  const netItems = { ordinary:null, golden:null };\n  const cancelNet = () => { netItems.ordinary = netItems.golden = null; };\n  const restoreSetting ="),
("(m.restore.enabled === undefined || typeof m.restore.enabled === 'boolean'));", """(m.restore.enabled === undefined || typeof m.restore.enabled === 'boolean')) &&
      (m.net === undefined || object(m.net) && m.net.version === 1 &&
        (m.net.enabled === undefined || typeof m.net.enabled === 'boolean') &&
        ['ordinary', 'golden'].every(k => m.net[k] === undefined || Number.isInteger(m.net[k]) && m.net[k] >= 0 && m.net[k] < 5));"""),
("function reset() { elapsed", "function reset() { cancelNet(); elapsed"),
("    if (p.restore) restoreElapsed", "    if (p.net) { if (!result.ok) cancelNet(); } else if (p.restore) restoreElapsed"),
("Could not save this change. Automatic spending is paused. Retry to keep it.", "Could not save this change. Automation is paused. Retry to keep it."),
('''  function editRestore() {''', '''  function netReady() {
    return netUnlocked() && supported(saved()) && netSetting().enabled && !pending && !suspended.has('net') &&
      !document.hidden && IMI.screen() === 'game' && api.automationAllowed() && !IMI.tour?.active() &&
      !document.querySelector('.mg01-overlay, .o-modal, .o-celebrate, .set-pop:not([hidden])');
  }
  function itemVisible(item) {
    if (!item.el.isConnected || item.el.closest('[inert], [hidden]')) return false;
    const style = getComputedStyle(item.el), r = item.el.getBoundingClientRect();
    return style.visibility !== 'hidden' && style.display !== 'none' && r.width > 0 && r.height > 0 &&
      r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;
  }
  function observeNet() {
    if (!netItems.ordinary && !netItems.golden) return;
    if (!netReady()) return cancelNet();
    for (const kind of ['ordinary', 'golden']) {
      const slot = netItems[kind];
      if (slot && (!slot.item.valid() || slot.item.el.closest('[inert], [hidden]') || slot.admitted && !itemVisible(slot.item))) netItems[kind] = null;
    }
  }
  function editNet() {
    if (pending || !netUnlocked() || !supported(saved())) return;
    const current = saved(), next = current === undefined ? {version:1} : JSON.parse(JSON.stringify(current));
    const enabled = !netSetting().enabled;
    next.net = { ...netSetting(), version:1, enabled };
    cancelNet();
    if (!enabled) suspended.add('net');
    write({ expected:current === undefined ? null : JSON.stringify(current), next, net:true });
  }
  function serviceNet({replay}) {
    if (replay || !netReady()) return cancelNet();
    for (const kind of ['ordinary', 'golden']) {
      if (!netReady()) return cancelNet();
      const slot = netItems[kind];
      if (!slot) continue;
      if (!slot.item.valid() || slot.item.el.closest('[inert], [hidden]')) { netItems[kind] = null; continue; }
      if (!itemVisible(slot.item)) { if (slot.admitted) netItems[kind] = null; continue; }
      if (!slot.admitted) {
        const current = saved(), next = JSON.parse(JSON.stringify(current)), cfg = netSetting(), phase = cfg[kind];
        next.net = { ...cfg, version:1, [kind]:(phase + 1) % 5 };
        write({ expected:JSON.stringify(current), next, net:true });
        if (pending) return;
        if (phase === 1 || phase === 3) { netItems[kind] = null; continue; }
        slot.admitted = true; slot.at = api.clock.productionNow();
      } else if (api.clock.productionNow() - slot.at >= 1000) {
        netItems[kind] = null;
        if (netReady() && slot.item.valid() && itemVisible(slot.item)) slot.item.claim();
      }
    }
  }
  function netStatus() {
    if (!netUnlocked()) return 'Requires Printing 6, Deadline completion and introduction completion.';
    if (suspended.has('net')) return 'Off locally. Retry to save Off.';
    if (pending) return 'Paused until Retry saves. Previous items will not be caught.';
    return netSetting().enabled ? 'On. Waiting for new visible, unblocked items.' : 'Off';
  }
  function editRestore() {'''),
("Each helper attempts once per 20 game seconds.", "Each purchase helper attempts once per 20 game seconds. Banana net uses the item timing below."),
("automatic spending and edits are disabled.", "automation and edits are disabled."),
("<section class=\"o-card lg03-restore\">", """<section class="o-card lg03-net"><h3>Banana net</h3><p>${netUnlocked() ? 'Unlocked by Printing 6 and Deadline.' : 'Locked until Printing 6, Deadline completion and introduction completion.'} Selects 3 of every 5 new ordinary bananas and, separately, 3 of every 5 golden bananas. Catch, skip, catch, skip, catch. Manual collection gets the first game second.</p><button data-act="automation:net-toggle" aria-label="Banana net" aria-pressed="${safe && !suspended.has('net') && netSetting().enabled}" ${!safe || pending || !netUnlocked() ? 'disabled' : ''}>Banana net: ${safe && !suspended.has('net') && netSetting().enabled ? 'On' : 'Off'}</button><p role="status">${safe ? escape(netStatus()) : 'Automatic catching disabled'}</p><p>Visible, unblocked live play only. No catches behind minigames, dialogs, Settings or the tour, and no offline catches. Skips stay clickable. Selection does not guarantee a payout. Settings and sequence stay across Printing.</p></section><section class="o-card lg03-restore">"""),
("    reset,\n    actions:", """    reset,
    netBlocked:cancelNet,
    netCreated(kind, item) {
      if (netReady() && item.valid() && !item.el.closest('[inert], [hidden]')) netItems[kind] = {item, admitted:false};
    },
    netCleared(kind, item) { if (netItems[kind]?.item === item) netItems[kind] = null; },
    actions:"""),
("'restore-toggle':editRestore", "'net-toggle':editNet, 'restore-toggle':editRestore"),
("    tick({gameSeconds, replay}) {\n      if", "    tick({gameSeconds, replay}) {\n      serviceNet({replay});\n      if"),
("  document.addEventListener('change'", """  new MutationObserver(observeNet).observe(document.body, {subtree:true, childList:true, attributes:true, attributeFilter:['hidden', 'inert', 'class', 'style']});
  document.addEventListener('visibilitychange', cancelNet);
  addEventListener('resize', cancelNet);
  document.addEventListener('change'""")])
edit('sw.js', [("const VERSION = 'imi-v43';", "const VERSION = 'imi-v44';")])
