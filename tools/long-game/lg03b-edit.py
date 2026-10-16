from pathlib import Path

def edit(name, old, new):
    p = Path(name)
    source = p.read_bytes().decode('utf-8')
    old, new = old.replace('\n', '\r\n'), new.replace('\n', '\r\n')
    assert source.count(old) == 1, name
    p.write_bytes(source.replace(old, new).encode('utf-8'))

edit('ops.js', "      hireAutomationOne(i, reservePercent) {", """      quoteAutomationShop(key) {
        if (!['hold', 'contracts', 'metro', 'dbl', 'agent', 'analyst'].includes(key)) return { ok:false, error:'Unsupported shop item' };
        const price = SHOP[key], owned = !!S[key], lock = shopLock(key);
        const error = owned ? 'Owned' : lock || (S.printing < 2 || !S.intro.done ? 'Requires Printing 3' :
          !extensionAPI.automationAllowed() ? 'Progression or save is paused' :
          !(price < bananas.get() / 10) ? 'Waiting for price below 10% of wallet' : '');
        return { ok:!error, price, owned, error };
      },
      buyAutomationShopOne(key) {
        return extensionAPI.quoteAutomationShop(key).ok && !!buy(key);
      },
      hireAutomationOne(i, reservePercent) {""")
edit('ops.js', "  function buy(what, arg) {", """  function shopLock(what) {
    if (what === 'dbl' && !S.hold) return 'Needs Hold to type';
    if ((what === 'agent' || what === 'analyst') && soldCount() < 2) return 'Needs 2 sold titles';
    if ((what === 'metro' || what === 'dbl' || what === 'contracts') && !S.desks[2].owned) return 'Unlocks with Lagoon Sprint';
    return '';
  }
  function buy(what, arg) {""")
edit('ops.js', """      if (what === 'dbl' && !S.hold) return;
      if ((what === 'agent' || what === 'analyst') && soldCount() < 2) return;
      if ((what === 'metro' || what === 'dbl' || what === 'contracts') && !S.desks[2].owned) return;""", "      if (shopLock(what)) return;")
edit('ops.js', """    IMI.sfx.ding(); mark(); save();
  }

  /* ================= icons""", """    IMI.sfx.ding(); mark(); save();
    return true;
  }

  /* ================= icons""")
edit('sw.js', "const VERSION = 'imi-v36';", "const VERSION = 'imi-v37';")
