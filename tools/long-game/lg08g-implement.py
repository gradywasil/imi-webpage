from pathlib import Path

def edit(f,fn):
 p=Path(f);b=p.read_bytes();s=b.decode('utf-8');nl='\r\n' if b'\r\n' in b else '\n';s=s.replace('\r\n','\n');s=fn(s);p.write_bytes(s.replace('\n',nl).encode('utf-8'))

def ops(s):
 anchor='  function doPrint(chId) {'
 code='''  // LG-08G owns only ordinary Printing. Challenge/full reset keep their old path.
  const printingEnabled = () => ['lg08print','lg03','lg01a','lg05folio','lg05layers','lg08estate'].every(k => new URLSearchParams(location.search).get(k) === '1');
  const printInteger = n => Number.isSafeInteger(n) && n >= 0;
  let printingOffer = null, printingIntent = null;
  function printingQuote(source = S) {
    if (!printingEnabled() || !extensions.get('automation')?.validConfig(source.meta.automation)) throw Error('Unsupported Printing settings or missing flags.');
    layers.current(source); archiveFeature?.retained(source); worksDemo?.retained(source); worksPlay?.retained(source);
    const gain = Math.floor(Math.sqrt(source.run.earned / cash(5e5))), epoch = layers.estateIdentity(source)?.resetEpoch;
    if (source.challenge || ![source.run.earned,source.printing,source.printing + 1,source.legacy.stars,source.legacy.total,gain,source.legacy.stars + gain,source.legacy.total + gain].every(printInteger) ||
        gain < 1 || source.legacy.stars > source.legacy.total || epoch !== undefined && !printInteger(epoch + 1) ||
        !printInteger(source.legacy.ups.seed ?? 0) || (source.legacy.ups.seed ?? 0) > 3 || ![0,1].includes(source.legacy.ups.crew ?? 0) ||
        Object.values(source.editions).some(n => !printInteger(n)) || Object.keys(source.written).some(id => !printInteger((source.editions[id] ?? 0) + 1))) throw Error('Printing counters cannot advance safely.');
    return {...layers.epochFields(source),printing:source.printing,earned:source.run.earned,stars:source.legacy.stars,total:source.legacy.total,gain};
  }
  function printingReady() {
    if (!printingEnabled() || !writer?.owns() || !progressing() || !writer.guard(S) || writer.held() || writer.localDisposition() || window.VaultSaveGate?.blocked ||
        S.challenge || ui.nextCh || !challengeSettled() || !extensionAPI.identitySettled() || !extensionAPI.layerSettled() || workPaused() ||
        S.meta.folio?.working || S.meta.archive?.working || S.meta.worksDemo?.working || worksPlay?.current(S)?.working ||
        S.meta.folio?.pending || S.meta.layers?.pending || S.meta.estate?.pending || S.meta.archive?.pending || S.meta.automation?.print?.pending ||
        document.hidden || IMI.screen() !== 'game' || IMI.tour?.active() || document.querySelector('.mg01-overlay, .o-modal, .o-celebrate, .set-pop:not([hidden])')) throw Error('Finish current work and waiting saves before Printing.');
    printingQuote();
  }
  // Ignore only elapsed presentation counters. All room, earnings, identity and wallet inputs bind review.
  const printingSource = source => {
    const next = pitchCopy(source); delete next.lastSeen; delete next.log;
    delete next.stats.secs; delete next.stats.playSecs;
    return JSON.stringify(next);
  };
  function printingRoom(source, crew, at) {
    const q = printingQuote(source), next = layers.projectRoom(source,fresh());
    next.printing = q.printing + 1; next.run.earned = 0;
    next.intro = {...source.intro,done:true,train:true,words:true,shop:true};
    next.legacy = {...next.legacy,stars:q.stars + q.gain,total:q.total + q.gain};
    if (q.resetEpoch !== undefined) next.meta.estate.resetEpoch = q.resetEpoch + 1;
    worksPlay?.exit(next);
    if (next.meta.worksDemo) next.meta.worksDemo.working = false;
    if (next.meta.archive) next.meta.archive.working = null;
    pg?.clearManual(next); extensions.get('automation')?.clearGardenPending(next); clearMuseIncomplete(next); clearPitchPending(next);
    if (next.meta.folio !== undefined) next.meta.folio = folio.current(next);
    next.rewards.activeGold = null;
    next.desks[0].paws = crew.length; next.desks[0].crew = pitchCopy(crew);
    if (crew.length) next.hold = true;
    for (const t of crew) next.looks[t.look] = 1;
    const cfg = next.meta.automation?.print;
    next.meta.automation = {...next.meta.automation,version:1,print:{...cfg,version:1,manual:{...cfg?.manual,complete:true}}};
    delete next.meta.automation.print.pending;
    next.lastSeen = at;
    return next;
  }
  function printingPending() {
    const p = S.meta.automation?.print?.pending;
    if (!printingEnabled() || !p || p.version !== 1 || p.origin !== 'manual' || !printInteger(p.at) || !printInteger(p.balance) || p.balance % Economy.scale ||
        !printInteger(p.seed) || !Array.isArray(p.crew) || typeof p.source !== 'string' || typeof p.automationAbsent !== 'boolean' ||
        !Object.hasOwn(p,'sourcePrint') || !layers.same(p.marker,bananas.acknowledgement()) || ![p.balance,p.seed].includes(bananas.get())) throw Error('Waiting Printing requires its exact original intent and wallet.');
    const source = pitchCopy(S);
    if (p.automationAbsent) delete source.meta.automation;
    else if (p.sourcePrint === null) delete source.meta.automation.print;
    else source.meta.automation.print = pitchCopy(p.sourcePrint);
    const q = printingQuote(source), id = layers.identityKey('printing',[q.printing + 1,q.total,q.earned],q);
    if (p.id !== id || !/^printing:(?:e(?:0|[1-9]\\d*):)?(?:0|[1-9]\\d*):(?:0|[1-9]\\d*):(?:0|[1-9]\\d*)$/.test(p.id) ||
        !layers.same(q,p.quote) || printingSource(source) !== p.source || p.seed !== cash([0,1000,10000,100000][source.legacy.ups.seed || 0]) ||
        !extensionAPI.estateCrewValid(p.crew,source) || !layers.same(printingRoom(source,p.crew,p.at),p.candidate)) throw Error('Waiting Printing source or successor changed. Save preserved.');
    return p;
  }
  function printingReview() {
    printingReady();
    if (!archiveSettle()) throw Error('Archive income waiting to save.');
    printingReady();
    const quote = printingQuote();
    printingOffer = {quote,source:printingSource(S),balance:bananas.get(),marker:bananas.acknowledgement()};
    return pitchCopy(quote);
  }
  function printingFreeze(request) {
    printingReady();
    if (request?.origin !== 'manual' || !printingOffer || !layers.same(request.quote,printingOffer.quote) ||
        printingSource(S) !== printingOffer.source || bananas.get() !== printingOffer.balance || !layers.same(bananas.acknowledgement(),printingOffer.marker)) throw Error('Printing changed. Review it again.');
    // Only this named Archive settlement may refresh the reviewed boundary.
    if (!archiveSettle()) throw Error('Archive income waiting to save.');
    printingReady();
    const quote = printingQuote(), at = Date.now(), room = fresh(), crew = [];
    if (S.legacy.ups.crew) for (let i=0;i<2;i++) crew.push(newTypist(room));
    const p = {version:1,origin:'manual',at,id:layers.identityKey('printing',[quote.printing + 1,quote.total,quote.earned],quote),quote,
      source:printingSource(S),sourcePrint:pitchCopy(S.meta.automation?.print ?? null),automationAbsent:S.meta.automation === undefined,
      balance:bananas.get(),marker:bananas.acknowledgement(),seed:cash([0,1000,10000,100000][S.legacy.ups.seed || 0]),crew,
      candidate:printingRoom(S,crew,at)};
    printingIntent = {...pitchCopy(S),meta:{...pitchCopy(S.meta),automation:{...pitchCopy(S.meta.automation ?? {}),version:1,print:{...pitchCopy(S.meta.automation?.print ?? {}),version:1,pending:p}}}};
    printingOffer = null;
    return p.id;
  }
  function printingCommit(action) {
    if (!writer?.owns() || !writer.transacting() || !printingEnabled() || window.VaultSaveGate?.blocked || writer.localDisposition()) return {ok:false,status:'refused',refused:true,error:'Printing owner unavailable'};
    try {
      let candidate, p;
      if (action === 'prepare') {
        if (!printingIntent || printingSource(S) !== printingIntent.meta.automation.print.pending.source) throw Error('Prepared Printing source changed.');
        candidate = printingIntent;
      } else if (action === 'finish') {p = printingPending();candidate = p.candidate;}
      else throw Error('Unknown Printing command.');
      const result = Economy.saveStateAcknowledged(candidate);
      if (!result.ok) return {...result,status:'held'};
      S = candidate; printingIntent = null;
      if (p) {
        layerRuntimeReset('floor');
        extensionEvent('init','printing');
        extensionEvent('reset',{kind:'printing',gain:p.quote.gain,previousPrinting:p.quote.printing});
        if (pg?.active(pgContext)) pickAutoFocus();
        logIt(`Printing ${S.printing + 1} begins. Legacy stars: ${S.legacy.stars}.`);
        newsPush(`SECOND PRINTING: the room is reborn with ${S.legacy.total} Legacy stars. Titles can be sold again.`);
        shownN['cel-st'] = 0;
        celebrate(PX ? `PRINTING ${S.printing + 1}` : `Printing ${S.printing + 1}`, PX ? 'THE PRESSES ROLL AGAIN' : 'The presses roll again',
          `<p class="o-cel-stars">+${cnt('cel-st',p.quote.gain)} Legacy star${p.quote.gain > 1 ? 's' : ''}</p><p class="o-cel-sub">Every title can be sold again. Income x${(legacyMult() * editionMult()).toFixed(2)}.</p>`);
      }
      mark();
      return {ok:true,status:p ? 'acknowledged' : 'prepared',id:p?.id ?? S.meta.automation.print.pending.id};
    } catch(error) {return {ok:false,status:'refused',refused:true,error:error.message};}
  }

'''
 assert anchor in s;s=s.replace(anchor,code+anchor)
 s=s.replace('  function doPrint(chId) {\n',"  function doPrint(chId) {\n    if (printingEnabled() && !chId && !S.challenge) { try { return writer.printingAction({origin:'manual',quote:printingReview()}); } catch(error) { return {ok:false,status:'refused',refused:true,error:error.message}; } }\n",1)
 s=s.replace('  function askPrint() {\n',"  function askPrint() {\n    let printQuote;\n    if (printingEnabled() && !ui.nextCh && !S.challenge) { try { printQuote = printingReview(); } catch(error) { newsPush(error.message);return; } }\n",1)
 s=s.replace("close(); doPrint(ui.nextCh);", "close(); if (printQuote) { const r = writer.printingAction({origin:'manual',quote:printQuote}); if (!r.ok) newsPush(r.error); } else doPrint(ui.nextCh);")
 s=s.replace('    state: () => S, save, mark, morph, setTab,','    state: () => S, save, mark, morph, setTab,\n    printingEnabled, printingReview, printingFreeze, printingPending, printingCommit,')
 return s
edit('ops.js',ops)

def auto(s):
 anchor='  function supported(m) {'
 s=s.replace(anchor,'''  function validPrint(p) {
    return p === undefined || object(p) && p.version === 1 &&
      (p.enabled === undefined || typeof p.enabled === 'boolean') &&
      (p.N === undefined || Number.isSafeInteger(p.N) && p.N >= 5 && p.N <= 240) &&
      (p.manual === undefined || object(p.manual) && (p.manual.complete === undefined || typeof p.manual.complete === 'boolean')) &&
      (p.pending == null || object(p.pending) && p.pending.version === 1 && ['manual','auto'].includes(p.pending.origin));
  }
'''+anchor)
 s=s.replace('m.version === 1 && (!api.museEnabled()', 'm.version === 1 && validPrint(m.print) && (!api.museEnabled()',1)
 return s
edit('automation.js',auto)

def core(s):
 s=s.replace("!IMI.ops?.extensions?.state().meta.estate?.pending ?", "!IMI.ops?.extensions?.state().meta.estate?.pending && !IMI.ops?.extensions?.state().meta.automation?.print?.pending ?")
 s=s.replace('          replaceEstateAcknowledged(id) {','''          replacePrintingAcknowledged(id) {
            const intent = canWrite() && writer.printingWallet(id);
            if (!intent || ![intent.balance,intent.seed].includes(score)) return {ok:false,status:'refused',error:'No exact owned Printing replacement'};
            const result = Economy.saveScoreAcknowledged(intent.seed);
            if (!result.ok) return {...result,status:'held'};
            clearTimeout(saveT); saveT = 0; score = intent.seed; paintScore(false,{reward:id});
            return {ok:true,status:'acknowledged',id};
          },
          replaceEstateAcknowledged(id) {''')
 return s
edit('core.js',core)

def rewards(s):
 s=s.replace('!candidate.meta.automation?.media?.pending &&', '!candidate.meta.automation?.media?.pending && !candidate.meta.automation?.print?.pending &&',1)
 anchor='  // Estate has fixed commands'
 i=s.index(anchor)
 s=s[:i]+'''  // Printing accepts only its reviewed fixed owner command. Retry never calls doPrint.
  let printingWaiting = false, printingWalletWriting = false;
  function printingWrite(action) {
    const r = transaction(() => api.printingCommit(action));
    if (!r.ok) hold('Printing waiting to save. Retry the exact Printing. ' + r.error);
    return r;
  }
  function continuePrinting() {
    try {
      if (!state().meta.automation?.print?.pending) {
        const baseline = wallet().saveAcknowledged();
        if (!baseline.ok) {hold('Printing wallet baseline waiting to save. ' + baseline.error);return {...baseline,status:'held'};}
        const prepared = printingWrite('prepare');
        if (!prepared.ok) return prepared;
      }
      const p = api.printingPending();
      printingWalletWriting = true;
      let paid;
      try {paid = wallet().replacePrintingAcknowledged(p.id);} finally {printingWalletWriting = false;}
      if (!paid.ok) {hold('Printing wallet waiting to save. Retry the exact Printing. ' + paid.error);return {...paid,status:'held'};}
      const result = printingWrite('finish');
      if (result.ok) printingWaiting = false;
      return result;
    } catch(error) {hold(error.message);return {ok:false,status:'held',error:error.message};}
  }
  function printingAction(request) {
    if (!api?.printingEnabled() || !owns() || busy || volatile || fault || transactionRetry || localUnresolved() ||
        folioWaiting || layerWaiting || pitchWaiting || mediaWaiting || estateWaiting || !window.IMI.ops.progression.running() || !guard(state())) return {ok:false,status:'refused',refused:true,error:'Finish waiting saves before Printing.'};
    try {api.printingFreeze(request);} catch(error) {return {ok:false,status:'refused',refused:true,error:error.message};}
    printingWaiting = true;
    return continuePrinting();
  }
  function printingWallet(id) {
    if (!printingWalletWriting || !owns() || !api?.printingEnabled()) return null;
    const p = api.printingPending();
    return p.id === id ? {balance:p.balance,seed:p.seed} : null;
  }
'''+s[i:]
 s=s.replace('  function reconcile() {\n',"  function reconcile() {\n    if (state().meta.automation?.print?.pending && !continuePrinting().ok) return false;\n",1)
 s=s.replace('    try {\n      if (worksPlayWaiting)',"    try {\n      if ((printingWaiting || state().meta.automation?.print?.pending) && !continuePrinting().ok) return false;\n      if (worksPlayWaiting)",1)
 s=s.replace('    guard, retry, worksPlayAction,','    guard, retry, printingAction, printingWallet, worksPlayAction,',1)
 return s
edit('rewards.js',rewards)

def gate(s):
 s=s.replace('imprint = false, estate = false,','imprint = false, printing = false, estate = false,',1)
 anchor='      const endowment = object(state) && state.meta?.estate;'
 s=s.replace(anchor,'''      const print = object(state) && state.meta?.automation?.print;
      if (object(print) && own(print,'pending') && print.pending !== null) {
        printing = true;
        const p = print.pending, flags = new URLSearchParams(location.search);
        // Envelope only. Ops validates the fixed source, frozen crew and exact successor.
        const known = print.version === 1 && object(p) && p.version === 1 && p.origin === 'manual' &&
          typeof p.id === 'string' && p.id.startsWith('printing:') && object(p.quote) && object(p.candidate) &&
          p.candidate.meta?.automation?.print?.version === 1 && Array.isArray(p.crew) && typeof p.source === 'string' &&
          ['balance','seed','at'].every(k => Number.isSafeInteger(p[k]) && p[k] >= 0) && own(p,'sourcePrint') && own(p,'marker');
        const needsFlags = known && ['lg08print','lg03','lg01a','lg05folio','lg05layers','lg08estate'].some(k => flags.get(k) !== '1');
        resume = resume || needsFlags; blocked = blocked || !known || needsFlags;
      }
'''+anchor)
 s=s.replace("title.textContent = archive ?", "title.textContent = printing ? 'Printing recovery' : archive ?",1)
 s=s.replace("message.textContent = archive ?", "message.textContent = printing ? (resume ? 'This save has an unfinished Printing. Resume with its recovery flags to finish safely.' : 'This unfinished Printing cannot be opened safely. Your saved data has not been changed.') : archive ?",1)
 s=s.replace("scope.textContent = archive ?", "scope.textContent = printing ? 'Production waits until the exact saved Printing and seed-wallet replacement are settled.' : archive ?",1)
 s=s.replace('for (const flag of archive ?', "for (const flag of printing ? ['lg08print','lg03','lg01a','lg05folio','lg05layers','lg08estate'] : archive ?",1)
 return s
edit('vault-save-gate.js',gate)
edit('sw.js',lambda s:s.replace("imi-v64","imi-v65",1))
