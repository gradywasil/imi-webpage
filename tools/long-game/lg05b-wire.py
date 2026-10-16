from pathlib import Path
def edit(name, old, new):
    p=Path(name); raw=p.read_bytes(); a=old.encode()
    crlf=raw.count(b'\r\n') > raw.count(b'\n')/2
    if a not in raw or crlf: a=old.replace("\n","\r\n").encode()
    assert raw.count(a)==1, (name,old[:100],raw.count(a))
    newline="\r\n" if crlf else "\n"
    p.write_bytes(raw.replace(a,new.replace("\n",newline).encode()))
edit('rewards.js', '  function descriptor(id, origin) {\n    const rule = row(id), basis = api.rewardBasis(), E = window.Economy, tier = rule.tier;', '  function descriptor(id, origin, basis = api.rewardBasis()) {\n    const rule = row(id), E = window.Economy, tier = rule.tier;')
edit('rewards.js', "...Object.keys({...firsts, ...letterFirsts}).filter(id => id.startsWith('layer:') ? s.printing >= 1 : s.chDone[id.split(':')[1]])", "...Object.keys({...firsts, ...letterFirsts}).filter(id => id === 'layer:imprint:first' ? (s.meta.layers?.count || 0) > 0 : id.startsWith('layer:') ? s.printing >= 1 : s.chDone[id.split(':')[1]])")
edit('rewards.js', '      return !volatile && !fault && !writing;', '      return !volatile && !fault && !writing && !candidate.meta.layers?.pending;')
edit('rewards.js', '  function reconcile() {\n    if (state().meta?.folio?.pending', '  function reconcile() {\n    if (state().meta?.layers?.pending && !finishLayer().ok) return false;\n    if (state().meta?.folio?.pending')
edit('rewards.js', '    try {\n      if (folioWaiting)', '    try {\n      if (layerWaiting) { const result = continueLayer(layerWaiting); if (!result.ok) { if (!result.refused) return false; layerWaiting = null; } }\n      if (folioWaiting)')
edit('rewards.js', '  function deliver(id, claim) {', """  // Fixed Imprint commands only; no callbacks, arbitrary candidate or wallet amount.
  let layerWaiting = null, layerWalletWriting = false;
  function layerWrite(request) {
    const result = transaction(() => api.layerCommit(request));
    if (!result.ok && !result.refused) hold('Imprint waiting to save. Retry to finish the foundation. ' + result.error);
    return result;
  }
  function finishLayer() {
    try {
      const p = window.Layers.pending(state());
      layerWalletWriting = true;
      let paid;
      try { paid = wallet().replaceImprintAcknowledged(p.id); } finally { layerWalletWriting = false; }
      if (!paid.ok) { hold('Imprint wallet waiting to save. Retry to finish. ' + paid.error); return paid; }
      const result = layerWrite({action:'finish'});
      if (!result.ok) { if (result.refused) hold(result.error); return result; }
      const c = state().rewards.claims['layer:imprint:first'];
      if (c?.status === 'prepared' && !transaction(() => deliver('layer:imprint:first',c))) return {ok:false, error:'First foundation Letters waiting to save.'};
      return result;
    } catch(error) { hold(error.message); return {ok:false,error:error.message}; }
  }
  function continueLayer(request) {
    if (state().meta.layers?.pending) return finishLayer();
    if (request.action === 'found') {
      const baseline = wallet().saveAcknowledged();
      if (!baseline.ok) { hold('Imprint baseline waiting to save. Retry to finish. ' + baseline.error); return baseline; }
    }
    const result = layerWrite(request);
    if (!result.ok) return result;
    layerWaiting = null;
    return request.action === 'found' ? finishLayer() : result;
  }
  function layerAction(request) {
    if (!window.Layers?.enabled || !api || !owns() || busy || volatile || fault || transactionRetry || localUnresolved() || folioWaiting ||
        !window.IMI.ops.progression.running() || !guard(state())) return {ok:false,error:'Finish the waiting save before using Imprints.'};
    try {
      if (request.action === 'found') {
        if (!window.Layers.same(window.Layers.quote(state()),request.quote) || !window.Layers.same(state().meta.layers,request.expected)) invalid('Foundation changed. Review it again.');
      } else window.Layers.proposal(state(),request);
      layerWaiting = clone(request);
      const result = continueLayer(layerWaiting);
      if (result.refused) layerWaiting = null;
      return result;
    } catch(error) { layerWaiting = null; return {ok:false,error:error.message}; }
  }
  function layerWallet(id) {
    if (!layerWalletWriting || !owns() || !window.Layers?.enabled) return null;
    const p = window.Layers.pending(state());
    return p.id === id ? {seed:p.seed} : null;
  }
  function deliver(id, claim) {""")
edit('rewards.js', 'awayCredit, folioAction, transacting:', "awayCredit, folioAction, layerAction, layerWallet,\n    layerReward:basis => descriptor('layer:imprint:first','new',basis), transacting:")
edit('core.js', '          creditReward({ id, sequence, previous, amount } = {}) {', """          replaceImprintAcknowledged(id) {
            const intent = canWrite() && writer.layerWallet(id);
            if (!intent) return {ok:false, error:'No owned Imprint wallet intent'};
            // Exact replacement is replayable while the prepared reset holds progression.
            // Preserve rewardMarker and all wallet metadata through Economy's default marker.
            const result = Economy.saveScoreAcknowledged(intent.seed);
            if (result.ok) { clearTimeout(saveT); saveT = 0; score = intent.seed; paintScore(false, {reward:id}); }
            return result;
          },
          creditReward({ id, sequence, previous, amount } = {}) {""")
edit('folio.js', 'f.version === 1 && integer(f.printing)', 'f.version === 1 && (f.imprint === undefined || integer(f.imprint)) && integer(f.printing)')
edit('folio.js', "f.pending.credit.id === `folio:${f.printing}:${f.pending.selection.id}`", "f.pending.credit.id === cashID(f, f.pending.selection.id)")
edit('folio.js', "  const markerValid = h =>", "  const cashID = (f,id) => (f.imprint || 0) > 0 ? `folio:${f.imprint}:${f.printing}:${id}` : `folio:${f.printing}:${id}`;\n  const markerValid = h =>")
edit('folio.js', '/^folio:\\d+:(pocket|journey|wonder)$/', '/^folio:(?:\\d+:)?\\d+:(pocket|journey|wonder)$/')
edit('folio.js', "entry(h.id.split(':')[2])?.cash", "entry(h.id.split(':').pop())?.cash")
edit('folio.js', '    const f = s.meta.folio;', '    const f = s.meta.folio;') if False else None
edit('folio.js', "    if (f === undefined) return {version:1, printing:s.printing, selection:null, working:false, completed:{}, gallery:{}};", "    const imprint = window.Layers?.identity(s) || 0;\n    if (f === undefined) return {version:1, printing:s.printing, ...(imprint ? {imprint} : {}), selection:null, working:false, completed:{}, gallery:{}};")
edit('folio.js', "    if (!valid(f) || f.pending && f.printing !== s.printing)", "    if (!valid(f) || f.pending && (f.printing !== s.printing || (f.imprint || 0) !== imprint))")
edit('folio.js', "    return f.printing === s.printing ? copy(f) : {...copy(f), printing:s.printing, selection:null, working:false, completed:{}};", "    return f.printing === s.printing && (f.imprint || 0) === imprint ? copy(f) : {...copy(f), ...(imprint ? {imprint} : {}), printing:s.printing, selection:null, working:false, completed:{}};")
edit('folio.js', 's.intro.done && s.printing >= 3;', 's.intro.done && (s.printing >= 3 || window.Layers?.charter(s));')
edit('folio.js', 'f.printing !== s.printing || !f.working', "f.printing !== s.printing || (f.imprint || 0) !== (window.Layers?.identity(s) || 0) || !f.working")
edit('folio.js', 'id:`folio:${s.printing}:${f.selection.id}`', 'id:cashID(f,f.selection.id)')
# Only registrations in the three shells, plus the explicitly simulated wallet bridge.
for name in ['index.html','classic.html','tools/balance.html']:
    prefix='../' if name.startswith('tools/') else ''
    edit(name, f'<script src="{prefix}folio.js"></script>', f'<script src="{prefix}folio.js"></script>\n<link rel="stylesheet" href="{prefix}layers.css">\n<script src="{prefix}layers.js"></script>')
# The balance bridge is not native Core evidence. Keep its optional wallet method intent-bound too.
edit('tools/balance.html', '    b.creditReward = request =>', "    b.replaceImprintAcknowledged = id => { const p=Rewards.layerWallet(id); if(!p)return {ok:false,error:'No Imprint intent'}; const r=Economy.saveScoreAcknowledged(p.seed); if(r.ok){score=p.seed;paint({reward:id});}return r; };\n    b.creditReward = request =>")
edit('sw.js', "const VERSION = 'imi-v48';", "const VERSION = 'imi-v49';")
edit('sw.js', "  'folio.js', 'training-pool.js'", "  'layers.js', 'layers.css', 'folio.js', 'training-pool.js'")
