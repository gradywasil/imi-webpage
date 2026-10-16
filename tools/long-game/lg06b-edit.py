from pathlib import Path

def edit(file,old,new):
 p=Path(file); b=p.read_bytes(); nl='\r\n' if b.count(b'\r\n')>b.count(b'\n')/2 else '\n'
 a=old.replace('\n',nl).encode(); z=new.replace('\n',nl).encode(); assert b.count(a)==1,(file,old[:90],b.count(a)); p.write_bytes(b.replace(a,z))

edit('ops.js',"    (!S.prem?.vault?.transition || writer.boundaryProgressing()));", "    !S.meta?.automation?.pitch?.sale && (!S.prem?.vault?.transition || writer.boundaryProgressing()));")
edit('ops.js','  function pitchHTML() {', '''  const pitchPrototype = () => gardenPrototype();
  const pitchCopy = v => JSON.parse(JSON.stringify(v));
  const pitchSame = (a,b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  const pitchInteger = n => Number.isSafeInteger(n) && n >= 0;
  const pitchRecord = p => !!p && typeof p === 'object' && !Array.isArray(p) && typeof p.id === 'string' && /^p-[a-z0-9]+$/.test(p.id) &&
    typeof p.title === 'string' && !!p.title && typeof p.text === 'string' && !!p.text && pitchInteger(p.pay) && p.pay > 0 && p.pay % Economy.scale === 0;
  function validPitch(p) {
    return p === undefined || !!p && typeof p === 'object' && !Array.isArray(p) && p.version === 1 &&
      (p.enabled === undefined || typeof p.enabled === 'boolean') &&
      (p.manual === undefined || !!p.manual && typeof p.manual === 'object' && !Array.isArray(p.manual) &&
        (p.manual.complete === undefined || typeof p.manual.complete === 'boolean') &&
        (p.manual.pending == null || pitchRecord(p.manual.pending.recipe) && ['printing','imprint'].every(k => pitchInteger(p.manual.pending[k])))) &&
      (p.sale == null || !!p.sale && typeof p.sale === 'object' && !Array.isArray(p.sale) && p.sale.version === 1);
  }
  function trackedPitch(s = S) {
    const p = s.meta.automation?.pitch, m = p?.manual, record = m?.pending;
    return validPitch(p) && !m?.complete && !!record && record.printing === s.printing && record.imprint === layers.identity(s) &&
      !s.written[record.recipe.id] && s.pitches.some(r => pitchSame(r,record.recipe));
  }
  function clearPitchPending(s) {
    const p = s.meta.automation?.pitch;
    if (pitchPrototype() && validPitch(p) && p?.manual?.pending && !p.sale) s.meta = {...s.meta, automation:{...s.meta.automation,
      pitch:{...p, manual:{...p.manual, pending:null}}}};
  }
  let commissionPending = null, commissionNotice = '';
  function pitchSelection() {
    const p = S.meta.productionGoal;
    if (pg && p !== undefined && !pg.valid(p)) return -1;
    if (pg?.active(pgContext) && (p.manual || !['all','pitches'].includes(p.collection)) ||
        S.focus && !S.autoFocus && !S.written[S.focus] || S.meta.folio?.working || S.meta.folio !== undefined && !folio.valid(S.meta.folio)) return -1;
    return (S.offers || []).map((p,i) => ({p,i,r:pitchRecord(p) ? buildRecipe({...p,gen:true}) : null})).filter(({p,r}) =>
      r && !S.written[p.id] && !RBY[p.id] && !S.pitches.some(x => x.id === p.id) && S.offers.filter(x => x.id === p.id).length === 1 &&
      Object.keys(r.need).every(w => S.desks[bandOf(w.length)]?.owned && !(chal('haiku') && bandOf(w.length) > 1)) &&
      marketMult(r.band) >= 1 && (!pg?.active(pgContext) || r.band === S.meta.productionGoal.band))
      .sort((a,b) => a.r.band - b.r.band || a.i - b.i)[0]?.i ?? -1;
  }
  function commission(i, origin = 'manual', el, retry = null) {
    const helper = extensions.get('automation'), refuse = error => { commissionPending = null; layerChoices.delete('pitch'); commissionNotice = error; mark(); return {ok:false,retryable:false,error}; };
    if (!pitchPrototype() || !writer?.owns() || !extensionAPI.automationAllowed() || !helper.validConfig(S.meta.automation) ||
        !['manual','auto'].includes(origin) || !Number.isInteger(i) || pitchActive() >= PITCH_MAX) return refuse('Commission owner, save or capacity unavailable.');
    try { layers.current(S); } catch { return refuse('Unsupported Imprint save.'); }
    if (commissionPending && commissionPending !== retry) return {ok:false,error:'Retry the waiting commission first.'};
    const p = S.offers?.[i];
    if (!pitchRecord(p) || RBY[p.id] || S.written[p.id] || S.pitches.some(x => x.id === p.id) || S.offers.filter(x => x.id === p.id).length !== 1) return refuse('Offer absent, duplicated or already registered.');
    if (origin === 'auto' && (!helper.pitchReady() || pitchSelection() !== i)) return refuse('Auto-pitch is paused or no current offer qualifies.');
    const basis = JSON.stringify([S.offers,S.pitches,S.stats.pitched ?? 0,S.meta.automation,S.printing,layers.identity(S)]);
    if (retry && (retry.state !== S || retry.basis !== basis)) return refuse('Commission changed. Choose again.');
    const request = retry || {state:S,basis,i,origin,replacement:genPitch(buildRecipe(p).band)};
    if (!pitchRecord(request.replacement) || RBY[request.replacement.id] || S.offers.some(x => x.id === request.replacement.id) || S.pitches.some(x => x.id === request.replacement.id)) return refuse('Replacement identity unavailable.');
    const candidate = {...S, offers:S.offers.slice(), pitches:[...S.pitches,pitchCopy(p)], stats:{...S.stats,pitched:(S.stats.pitched || 0)+1}, meta:pitchCopy(S.meta), lastSeen:Date.now()};
    candidate.offers[i] = pitchCopy(request.replacement);
    if (origin === 'manual' && !candidate.meta.automation?.pitch?.manual?.complete && !trackedPitch()) {
      const m = candidate.meta.automation || {version:1}, cfg = m.pitch || {version:1,enabled:false};
      candidate.meta.automation = {...m,pitch:{...cfg,manual:{...cfg.manual,complete:false,pending:{recipe:pitchCopy(p),printing:S.printing,imprint:layers.identity(S)}}}};
    }
    if (!writer.guard(candidate)) return refuse('Commission save guard refused.');
    const result = layerChoiceResult('pitch',Economy.saveStateAcknowledged(candidate));
    if (!result.ok) { commissionPending = request; commissionNotice = 'Commission save failed. Retry keeps the same replacement.'; mark(); return result; }
    S.offers = candidate.offers; S.pitches = candidate.pitches; S.stats = candidate.stats; S.meta = candidate.meta; S.lastSeen = candidate.lastSeen;
    registerPitch(p); commissionPending = null; commissionNotice = 'Commission saved.';
    commissionPublished(p,el); return result;
  }
  function pitchSaleValidate() {
    const p = S.meta.automation?.pitch, t = p?.sale, record = p?.manual?.pending;
    if (!pitchPrototype() || !validPitch(p) || !t || !trackedPitch() || !pitchSame(t.recipe,record.recipe) ||
        t.version !== 1 || t.printing !== S.printing || t.imprint !== layers.identity(S) || !['manual','publisher'].includes(t.origin) ||
        typeof t.id !== 'string' || t.id !== `pitch-sale:${t.imprint}:${t.printing}:${t.recipe.id}` ||
        !Number.isFinite(t.mult) || t.mult < MK_MIN || t.mult > MK_MAX || !pitchInteger(t.pay) || !t.pay || t.pay % Economy.scale ||
        !pitchInteger(t.previous) || t.sequence !== t.previous + 1 || !pitchInteger(t.balance) ||
        !pitchSame(t.marker, t.previous ? t.marker : null) || t.previous && (t.marker?.sequence !== t.previous) ||
        !pitchSame(t.need,RBY[t.recipe.id]?.need) || !canWrite(RBY[t.recipe.id]) ||
        !pitchSame(t.bank,Object.fromEntries(Object.keys(t.need).map(w => [w,S.bank[w]]))) ||
        !pitchSame(t.stats,[S.stats.lump,S.stats.pitchSold || 0,S.stats.bestMult || 0]) || t.earned !== S.run.earned) throw Error('Unsupported tracked pitch sale. Save preserved.');
    const marker = bananas.acknowledgement(), paid = marker?.id === t.id && marker.sequence === t.sequence && marker.amount === t.pay;
    if (!paid && !pitchSame(marker,t.marker) || bananas.get() !== t.balance + (paid ? t.pay : 0)) throw Error('Tracked pitch wallet baseline mismatch. Save preserved.');
    return t;
  }
  function pitchSaleCommit(request) {
    if (!pitchPrototype() || !writer?.owns() || !writer.transacting() || writer.localDisposition()) return {ok:false,refused:true,error:'Tracked sale owner unavailable.'};
    try {
      let candidate, t;
      if (request.action === 'prepare') {
        const r = RBY[request.id], cfg = S.meta.automation?.pitch;
        if (!trackedPitch() || cfg.sale || r?.id !== cfg.manual.pending.recipe.id || !canWrite(r) || document.hidden || IMI.screen() !== 'game' ||
            chal('patientpress') && request.auto || request.auto && (S.focus === r.id && !S.autoFocus || !(!pg || pg.allowsSale(pgContext,r)))) throw Error('Tracked title is unavailable for visible sale.');
        const marker = bananas.acknowledgement(), previous = marker?.sequence || 0, mult = marketMult(r.band);
        t = {version:1,id:`pitch-sale:${layers.identity(S)}:${S.printing}:${r.id}`, recipe:pitchCopy(cfg.manual.pending.recipe), printing:S.printing,imprint:layers.identity(S),
          origin:request.auto ? 'publisher' : 'manual', previous,sequence:previous+1,marker,balance:bananas.get(),mult,pay:salePay(r,mult),need:pitchCopy(r.need),
          bank:Object.fromEntries(Object.keys(r.need).map(w => [w,S.bank[w]])),stats:[S.stats.lump,S.stats.pitchSold || 0,S.stats.bestMult || 0],earned:S.run.earned};
        if (!pitchInteger(t.balance+t.pay) || !pitchInteger(t.sequence)) throw Error('Tracked sale exceeds safe wallet limits.');
        candidate = {...S,meta:{...S.meta,automation:{...S.meta.automation,pitch:{...cfg,sale:t}}}};
      } else if (request.action === 'finish') {
        t = pitchSaleValidate();
        const marker = bananas.acknowledgement();
        if (marker?.id !== t.id || marker.sequence !== t.sequence || marker.amount !== t.pay) throw Error('Tracked sale credit is not acknowledged.');
        candidate = pitchCopy(S);
        for (const w in t.need) { candidate.bank[w] -= t.need[w]; if (candidate.bank[w] <= 0) delete candidate.bank[w]; }
        candidate.written[t.recipe.id] = true; candidate.stats.lump += t.pay; candidate.stats.pitchSold = (candidate.stats.pitchSold || 0)+1;
        candidate.stats.bestMult = Math.max(candidate.stats.bestMult || 0,t.mult); candidate.run.earned += t.pay;
        const cfg = candidate.meta.automation.pitch;
        cfg.manual = {...cfg.manual,complete:true,pending:null,receipt:{id:t.id,sequence:t.sequence,amount:t.pay}}; cfg.sale = null;
        candidate.rewards.walletHead = {...cfg.manual.receipt,origin:'pitch-sale'};
        pg?.clearManual(candidate,t.recipe.id); if (candidate.focus === t.recipe.id) candidate.focus = null;
      } else throw Error('Unknown tracked sale command.');
      candidate.lastSeen = Date.now();
      const result = Economy.saveStateAcknowledged(candidate);
      if (result.ok) {
        if (request.action === 'prepare') S.meta = candidate.meta;
        else {
          for (const k of ['bank','written','stats','run','meta','rewards','focus','autoFocus']) S[k] = candidate[k];
          bankV++; dropCaches(); introProgress(); pickAutoFocus(); salePublished(RBY[t.recipe.id],t.pay,t.mult,null,{auto:t.origin === 'publisher'});
        }
        S.lastSeen = candidate.lastSeen; mark();
      }
      return result;
    } catch(error) { return {ok:false,refused:true,error:error.message}; }
  }
  function pitchHTML() {''')
# Shared incumbent publication, unchanged after the durable path.
p=Path('ops.js'); text=p.read_text(encoding='utf-8'); start=text.index('      ui.fresh = p.id;',text.index('    commission: el =>')); end=text.index('\n    },\n    repitch:',start); pub=text[start:end];
edit('ops.js',pub,'      commissionPublished(p,el);')
edit('ops.js',"  const pitchPrototype = () => gardenPrototype();", "  function commissionPublished(p,el) {\n"+pub.replace('      ','    ').replace("const at = IMI.centerOf(el); floatText", "const at = el ? IMI.centerOf(el) : null; if (at) floatText")+"\n  }\n  const pitchPrototype = () => gardenPrototype();")
edit('ops.js',"      const i = +el.dataset.i, p = S.offers[i]; if (!p || pitchActive() >= PITCH_MAX) return;", "      if (pitchPrototype()) return commission(+el.dataset.i,'manual',el);\n      const i = +el.dataset.i, p = S.offers[i]; if (!p || pitchActive() >= PITCH_MAX) return;")
edit('ops.js',"    if (fromEl) gatherWords(fromEl);", "    if (pitchPrototype() && trackedPitch() && S.meta.automation.pitch.manual.pending.recipe.id === id) {\n      if (opts.silent || document.hidden || IMI.screen() !== 'game') return;\n      return writer.pitchSale({action:'prepare',id,auto:!!opts.auto});\n    }\n    if (fromEl) gatherWords(fromEl);")
p=Path('ops.js'); text=p.read_text(encoding='utf-8'); start=text.index('    if (at) { IMI.burst(at[0]',text.index('  function writeTitle(')); end=text.index('\n  }\n\n  /* ================= training',start); pub=text[start:end];
edit('ops.js',pub,'    salePublished(r,pay,mk,at,opts);')
edit('ops.js','  /* ================= training upgrades', '''  function salePublished(r,pay,mk,at,opts) {
    const id = r.id, quiet = !!opts.silent;
'''+pub+'''
  }

  /* ================= training upgrades''')
edit('ops.js',"    if (gardenPrototype()) extensions.get('automation')?.clearGardenPending(S);", "    if (gardenPrototype()) extensions.get('automation')?.clearGardenPending(S);\n    clearPitchPending(S); commissionPending = null; layerChoices.delete('pitch');")
edit('ops.js',"      gardenEnabled:gardenPrototype,", """      gardenEnabled:gardenPrototype,
      pitchEnabled:pitchPrototype, validPitch, trackedPitch, clearPitchPending,
      pitchSaleValidate, pitchSaleCommit,
      pitchStatus:() => ({pending:!!commissionPending,notice:commissionNotice}),
      retryCommission:() => commissionPending && commission(commissionPending.i,commissionPending.origin,null,commissionPending),
      pitchAttempt:() => { const i = pitchSelection(); return i < 0 ? {ok:false,error:'Waiting for a reachable wanted offer and free focus.'} : commission(i,'auto'); },""")
edit('ops.js',"JSON.stringify(current?.garden?.manual) !== JSON.stringify(next.garden?.manual)","JSON.stringify(current?.garden?.manual) !== JSON.stringify(next.garden?.manual) || !pitchSame(current?.pitch?.manual,next.pitch?.manual) || !pitchSame(current?.pitch?.sale,next.pitch?.sale)")
# Offline selection must skip the tracked title rather than repeatedly choosing a deferred sale.
edit('ops.js',"let best = null, bp = -1; for (const r of pubSellable()) { const p = salePay(r, 1);", "let best = null, bp = -1; for (const r of pubSellable()) { if (pitchPrototype() && trackedPitch() && S.meta.automation.pitch.manual.pending.recipe.id === r.id) continue; const p = salePay(r, 1);")
edit('layers.js',"    window.IMI?.ops?.extensions?.clearGardenPending?.(next);", "    window.IMI?.ops?.extensions?.clearGardenPending?.(next);\n    window.IMI?.ops?.extensions?.clearPitchPending?.(next);")
edit('sw.js',"const VERSION = 'imi-v54';","const VERSION = 'imi-v55';")
