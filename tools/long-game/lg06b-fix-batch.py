exec(open('tools/long-game/lg06b-edit.py',encoding='utf-8-sig').read().split("edit('ops.js'")[0])
edit('ops.js',"  function validPitch(p) {", """  const pitchSaleShape = t => !!t && typeof t === 'object' && !Array.isArray(t) && t.version === 1 && pitchRecord(t.recipe) &&
    ['printing','imprint','previous','sequence','balance','pay','earned'].every(k => pitchInteger(t[k])) && t.pay > 0 && t.pay % Economy.scale === 0 &&
    t.sequence === t.previous + 1 && typeof t.id === 'string' && t.id === `pitch-sale:${t.imprint}:${t.printing}:${t.recipe.id}` &&
    ['manual','publisher'].includes(t.origin) && Number.isFinite(t.mult) && t.mult >= .5 && t.mult <= 2 &&
    !!t.need && typeof t.need === 'object' && !Array.isArray(t.need) && !!t.bank && typeof t.bank === 'object' && !Array.isArray(t.bank) &&
    Object.keys(t.need).length > 0 && Object.entries(t.need).every(([w,n]) => /^[A-Z]+$/.test(w) && pitchInteger(n) && n > 0 && pitchInteger(t.bank[w]) && t.bank[w] >= n) &&
    Array.isArray(t.stats) && t.stats.length === 3 && pitchInteger(t.stats[0]) && pitchInteger(t.stats[1]) && Number.isFinite(t.stats[2]) && t.stats[2] >= 0 &&
    (t.previous === 0 ? t.marker === null : !!t.marker && t.marker.sequence === t.previous && typeof t.marker.id === 'string' && pitchInteger(t.marker.amount) && t.marker.amount > 0);
  function validPitch(p) {""")
edit('ops.js',"(p.sale == null || !!p.sale && typeof p.sale === 'object' && !Array.isArray(p.sale) && p.sale.version === 1);", "(p.sale == null || pitchSaleShape(p.sale));")
edit('ops.js',"!s.written[record.recipe.id] && s.pitches.some(r => pitchSame(r,record.recipe));", "!s.written[record.recipe.id] && s.pitches.filter(r => r.id === record.recipe.id).length === 1 && s.pitches.some(r => pitchSame(r,record.recipe));")
edit('ops.js',"        !pitchSame(t.marker, t.previous ? t.marker : null) || t.previous && (t.marker?.sequence !== t.previous) ||", "        t.pay !== salePay(RBY[t.recipe.id],t.mult) || !pitchSame([RBY[t.recipe.id]?.title,RBY[t.recipe.id]?.text],[t.recipe.title,t.recipe.text]) ||")
# Prepared quote checks before any durable intent, including representable final stat totals.
edit('ops.js',"if (!pitchInteger(t.balance+t.pay) || !pitchInteger(t.sequence))", "if (!pitchSaleShape(t) || !pitchInteger(t.balance+t.pay) || !pitchInteger(t.stats[0]+t.pay) || !pitchInteger(t.stats[1]+1) || !pitchInteger(t.earned+t.pay))")
# Unknown/malformed intent must hold before normalization or reward migration can write.
edit('rewards.js',"      const next = normalize(clone(state()));", "      if (state().meta.automation?.pitch?.sale) api.pitchSaleValidate();\n      const next = normalize(clone(state()));")
# Do not leave a removed/stale volatile sale request in an endless held loop.
edit('rewards.js',"    if (!result.ok) hold('Tracked pitch sale waiting. Retry to finish. ' + result.error);", "    if (!result.ok) { if (result.refused && !state().meta.automation?.pitch?.sale) pitchWaiting = null; hold('Tracked pitch sale waiting. Retry to finish. ' + result.error); }")
# Cold intent envelope blocks versions and malformed scalar/credit fields without any writes.
edit('vault-save-gate.js',"object(t.recipe) && typeof t.recipe.id === 'string' && object(cfg.manual) && object(cfg.manual.pending);", """object(t.recipe) && typeof t.recipe.id === 'string' && object(cfg.manual) && object(cfg.manual.pending) &&
          ['printing','imprint','previous','sequence','balance','pay','earned'].every(k => Number.isSafeInteger(t[k]) && t[k] >= 0) &&
          t.pay > 0 && t.sequence === t.previous + 1 && object(t.bank) && object(t.need) && Array.isArray(t.stats) &&
          ['manual','publisher'].includes(t.origin);""")
