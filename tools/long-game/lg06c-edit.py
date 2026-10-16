from pathlib import Path

def edit(file, fn):
 p=Path(file); b=p.read_bytes(); s=b.decode(); newline='\r\n' if b'\r\n' in b else '\n'; s=s.replace('\r\n','\n'); s=fn(s); p.write_bytes(s.replace('\n',newline).encode())
def replace(s,a,b):
 assert a in s,a[:120]
 return s.replace(a,b,1)

ops=r"""  // A8 has one fixed command for manual and automatic catalogue releases.
  const mediaPrototype = () => gardenPrototype();
  const mediaSetting = () => ({version:1,enabled:false,manual:{complete:false},sequence:0,pending:null,...S.meta.automation?.media});
  const mediaObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  function mediaShape(t) {
    return mediaObject(t) && t.version === 1 && ['manual','auto'].includes(t.origin) &&
      ['printing','imprint','sequence','before','quantity','cost','balance','after'].every(k => pitchInteger(t[k])) &&
      t.sequence > 0 && t.quantity > 0 && t.cost > 0 && t.cost % Economy.scale === 0 && t.balance >= t.cost &&
      t.after === t.balance - t.cost && t.balance - t.after === t.cost && DIVS.some(d => d.id === t.division) &&
      t.id === `media:${t.imprint}:${t.printing}:${t.sequence}` && typeof t.config === 'string' &&
      Array.isArray(t.catalogue) && t.catalogue.length > 0 && t.catalogue.every(x => Array.isArray(x) && x.length === 2 && typeof x[0] === 'string' && Number.isFinite(x[1]) && x[1] > 0) &&
      mediaObject(t.wallet) && t.wallet.score === t.balance && t.wallet.economyVersion >= 1;
  }
  function validMedia(m) {
    return m === undefined || mediaObject(m) && m.version === 1 &&
      (m.enabled === undefined || typeof m.enabled === 'boolean') &&
      (m.manual === undefined || mediaObject(m.manual) && (m.manual.complete === undefined || typeof m.manual.complete === 'boolean')) &&
      (m.sequence === undefined || pitchInteger(m.sequence)) && (m.pending == null || mediaShape(m.pending));
  }
  const mediaConfig = cfg => JSON.stringify({...cfg,pending:null});
  const mediaCatalogue = D => divOrder[D.id]?.map(x => [x.title,x.words]);
  function mediaSelection() {
    loadArchive();
    return DIVS.map((D,index) => ({D,index,before:divCount(D),...divPlan(D,1)})).filter(q =>
      divOrder[q.D.id]?.length && divUnlocked(q.D) && q.n === 1 && pitchInteger(q.cost) && q.cost > 0 && q.cost <= bananas.get() && q.cost <= bananas.get() * .05)
      .sort((a,b) => a.before - b.before || a.index - b.index)[0];
  }
  function mediaPlan(id, quantity, origin) {
    const helper = extensions.get('automation'), cfg = mediaSetting(), D = DIVS.find(d => d.id === id);
    if (!mediaPrototype() || !writer?.owns() || !extensionAPI.automationAllowed() || !helper.validConfig(S.meta.automation) || cfg.pending ||
        !S.intro.done || document.hidden || IMI.screen() !== 'game' || IMI.tour?.active() || document.querySelector('.o-modal, .o-celebrate, .set-pop:not([hidden])') ||
        !D || !divUnlocked(D) || !['manual','auto'].includes(origin)) throw Error('Media release is unavailable during this activity or save.');
    const imprint = layers.current(S).count;
    loadArchive();
    if (!divOrder[D.id]?.length) throw Error('Waiting for the media catalogue to load. Release again when ready.');
    if (origin === 'auto' && (!helper.mediaReady() || mediaSelection()?.D.id !== id || quantity !== 1)) throw Error('No automatic release qualifies.');
    const plan = divPlan(D,quantity), balance = bananas.get();
    const t = {version:1,id:`media:${imprint}:${S.printing}:${cfg.sequence+1}`,origin,division:id,printing:S.printing,imprint,
      sequence:cfg.sequence+1,before:divCount(D),quantity:plan.n,cost:plan.cost,balance,after:balance-plan.cost,
      config:mediaConfig(cfg),catalogue:mediaCatalogue(D),wallet:JSON.parse(localStorage.getItem('imi-score'))};
    // The baseline flush below acknowledges current income before any intent is stored.
    t.wallet.score = balance;
    if (!mediaShape(t) || origin === 'auto' && t.cost > balance * .05) throw Error('Media quote is unaffordable or cannot be represented safely.');
    return t;
  }
  function mediaValidate(t = S.meta.automation?.media?.pending, prepared = true) {
    const cfg = mediaSetting(), D = DIVS.find(d => d.id === t?.division);
    if (!mediaPrototype() || !validMedia(S.meta.automation?.media) || !mediaShape(t) ||
        !extensions.get('automation').validConfig(S.meta.automation) || t.printing !== S.printing || t.imprint !== layers.current(S).count ||
        t.sequence !== cfg.sequence + 1 || t.config !== mediaConfig(cfg) || divCount(D) !== t.before || !divUnlocked(D) ||
        prepared && !pitchSame(t,cfg.pending) || !prepared && cfg.pending) throw Error('Unsupported or stale media release. Save preserved.');
    loadArchive();
    if (!divOrder[D.id]) throw Error('Waiting for the frozen media catalogue. Retry when loaded.');
    const q = divPlan(D,t.quantity);
    if (!pitchSame(t.catalogue,mediaCatalogue(D)) || q.n !== t.quantity || q.cost !== t.cost ||
        t.origin === 'auto' && (!cfg.enabled || !cfg.manual?.complete || t.imprint < 3 || t.quantity !== 1 || t.cost > t.balance * .05)) throw Error('Media catalogue, configuration or quote mismatch. Save preserved.');
    const wallet = JSON.parse(localStorage.getItem('imi-score'));
    if (!pitchSame({...wallet,score:t.balance},t.wallet) || !pitchSame(bananas.acknowledgement(),t.wallet.rewardMarker ?? null) ||
        ![t.balance,t.after].includes(bananas.get()) || wallet.score !== bananas.get() || !prepared && bananas.get() !== t.balance) throw Error('Media wallet baseline mismatch. Save preserved.');
    return t;
  }
  function mediaCommit(request) {
    if (!mediaPrototype() || !writer?.owns() || !writer.transacting() || writer.localDisposition()) return {ok:false,refused:true,error:'Media save owner unavailable.'};
    try {
      const t = mediaValidate(request.action === 'prepare' ? request.intent : undefined,request.action !== 'prepare');
      if (!['prepare','finish'].includes(request.action)) throw Error('Unknown media command.');
      const candidate = pitchCopy(S), cfg = mediaSetting();
      candidate.meta.automation = {...candidate.meta.automation,version:1,media:{...cfg,pending:pitchCopy(t)}};
      if (request.action === 'finish') {
        if (bananas.get() !== t.after) throw Error('Media debit is not acknowledged.');
        candidate.divs[t.division] = t.before + t.quantity;
        candidate.meta.automation.media = {...cfg,sequence:t.sequence,pending:null,
          manual:{...cfg.manual,complete:!!cfg.manual?.complete || t.origin === 'manual'}};
      }
      candidate.lastSeen = Date.now();
      const result = Economy.saveStateAcknowledged(candidate);
      if (result.ok) {
        S.meta = candidate.meta; S.lastSeen = candidate.lastSeen;
        if (request.action === 'finish') { S.divs = candidate.divs; releasePublished(DIVS.find(d => d.id === t.division),t.before,t.quantity); }
        mark();
      }
      return result;
    } catch(error) { return {ok:false,refused:true,error:error.message}; }
  }
"""
def ops_edit(s):
 s=replace(s,"!S.meta?.automation?.pitch?.sale &&", "!S.meta?.automation?.pitch?.sale && !S.meta?.automation?.media?.pending &&")
 s=replace(s,'  function releaseDiv(id) {',ops+'  function releaseDiv(id) {\n    if (mediaPrototype()) return writer.mediaRelease({division:id,quantity:buyWant(),origin:\'manual\'});')
 s=replace(s,'    const before = divCount(D); S.divs[D.id] = before + plan.n;\n    const ord', '    const before = divCount(D); S.divs[D.id] = before + plan.n;\n    releasePublished(D,before,plan.n); mark(); save();\n  }\n  function releasePublished(D,before,quantity) {\n    const plan = {n:quantity};\n    const ord')
 # Publication is already durable on the opted-in path; keep the legacy save at its caller.
 start=s.index('  function releasePublished(');end=s.index('  function premiere()',start)
 chunk=s[start:end];chunk=replace(chunk,'    mark(); save();','    mark();');s=s[:start]+chunk+s[end:]
 s=replace(s,'layerSettled:() => !layerChoices.size', 'layerSettled:() => !S.meta.automation?.media?.pending && !layerChoices.size')
 s=replace(s,'      pitchEnabled:pitchPrototype,', '      mediaEnabled:mediaPrototype, validMedia, mediaPlan, mediaValidate, mediaCommit,\n      mediaNext:() => { const q = mediaSelection(); return q ? {division:q.D.id,name:q.D.name,index:q.before,cost:q.cost} : null; },\n      mediaAttempt:() => { const q = mediaSelection(); return q ? writer.mediaRelease({division:q.D.id,quantity:1,origin:\'auto\'}) : {ok:false,error:\'Waiting for a loaded, unlocked release costing at most 5% of your wallet.\'}; },\n      pitchEnabled:pitchPrototype,')
 s=replace(s,' || current?.net && current.net.version', ' || !pitchSame(current?.media?.manual,next.media?.manual) || (current?.media?.sequence ?? 0) !== (next.media?.sequence ?? 0) || !pitchSame(current?.media?.pending,next.media?.pending) || current?.net && current.net.version')
 return s
edit('ops.js',ops_edit)

coord=r"""  // Fixed media prepare/debit/finish only. Never use the reward-credit marker for a purchase.
  let mediaWaiting = null, mediaWalletWriting = false;
  function mediaWrite(request) {
    const result = transaction(() => api.mediaCommit(request));
    if (!result.ok) hold('Media release waiting. Retry the exact release. ' + result.error);
    return result;
  }
  function finishMedia() {
    try {
      const t = api.mediaValidate();
      mediaWalletWriting = true;
      let paid;
      try { paid = wallet().debitMediaAcknowledged(t.id); } finally { mediaWalletWriting = false; }
      if (!paid.ok) { hold('Media debit waiting. Retry the exact release. ' + paid.error); return paid; }
      return mediaWrite({action:'finish'});
    } catch(error) { hold(error.message); return {ok:false,error:error.message}; }
  }
  function continueMedia() {
    if (state().meta.automation?.media?.pending) return finishMedia();
    try { api.mediaValidate(mediaWaiting,false); } catch(error) { hold(error.message); return {ok:false,error:error.message}; }
    const baseline = wallet().saveAcknowledged();
    if (!baseline.ok) { hold('Media baseline waiting. Retry the exact release. ' + baseline.error); return baseline; }
    const result = mediaWrite({action:'prepare',intent:mediaWaiting});
    if (!result.ok) return result;
    mediaWaiting = null;
    return finishMedia();
  }
  function mediaRelease(request) {
    if (!api?.mediaEnabled() || !owns() || busy || volatile || fault || transactionRetry || localUnresolved() || folioWaiting || layerWaiting || pitchWaiting ||
        !window.IMI.ops.progression.running() || !guard(state()) || !object(request) ||
        Object.keys(request).some(k => !['division','quantity','origin'].includes(k))) return {ok:false,error:'Finish the waiting save before releasing media.'};
    try {
      // Freeze once, before any acknowledgement. Retry never selects or quotes another release.
      const intent = api.mediaPlan(request.division,request.quantity,request.origin);
      const baseline = wallet().saveAcknowledged();
      if (baseline.ok) intent.wallet = JSON.parse(localStorage.getItem('imi-score'));
      mediaWaiting = clone(intent);
      if (!baseline.ok) { hold('Media baseline waiting. Retry the exact release. ' + baseline.error); return baseline; }
      return continueMedia();
    } catch(error) { return {ok:false,error:error.message}; }
  }
  function mediaWallet(id) {
    if (!mediaWalletWriting || !owns()) return null;
    const t = api.mediaValidate();
    return t.id === id ? t : null;
  }
"""
def rewards_edit(s):
 s=replace(s,"!candidate.meta.automation?.pitch?.sale;", "!candidate.meta.automation?.pitch?.sale && !candidate.meta.automation?.media?.pending && (!api.mediaEnabled?.() || api.validMedia(candidate.meta.automation?.media));")
 s=replace(s,'  // One predecessor sale only.',coord+'  // One predecessor sale only.')
 s=replace(s,'  function reconcile() {','  function reconcile() {\n    if (state().meta.automation?.media?.pending && !finishMedia().ok) return false;')
 s=replace(s,'      if (state().meta.automation?.pitch?.sale) api.pitchSaleValidate();', "      if (api.mediaEnabled?.() && !api.validMedia(state().meta.automation?.media)) invalid('Unsupported media configuration. Save preserved.');\n      if (state().meta.automation?.media?.pending && !finishMedia().ok) return;\n      if (state().meta.automation?.pitch?.sale) api.pitchSaleValidate();")
 s=replace(s,'    try {\n      if (state().meta.automation?.pitch?.sale || pitchWaiting)', '    try {\n      if (state().meta.automation?.media?.pending || mediaWaiting) { const result = continueMedia(); if (!result.ok) return false; mediaWaiting = null; }\n      if (state().meta.automation?.pitch?.sale || pitchWaiting)')
 s=replace(s,'layerAction, layerWallet, pitchSale,','layerAction, layerWallet, pitchSale, mediaRelease, mediaWallet,')
 return s
edit('rewards.js',rewards_edit)

def core_edit(s):
 s=replace(s,'return canWrite() ? Economy.saveScoreAcknowledged(score)', "return canWrite() && !IMI.ops?.extensions?.state().meta.automation?.media?.pending ? Economy.saveScoreAcknowledged(score)")
 s=replace(s,'          replaceImprintAcknowledged(id) {',r"""          debitMediaAcknowledged(id) {
            const intent = canWrite() && writer.mediaWallet(id);
            if (!intent || ![intent.balance,intent.after].includes(score)) return {ok:false,error:'No exact owned media debit'};
            const result = Economy.saveScoreAcknowledged(intent.after);
            if (result.ok) { clearTimeout(saveT); saveT = 0; score = intent.after; paintScore(false); }
            return result;
          },
          replaceImprintAcknowledged(id) {""")
 return s
edit('core.js',core_edit)

auto=r"""  const mediaSetting = () => ({version:1,enabled:false,manual:{complete:false},sequence:0,pending:null,...saved()?.media});
  let mediaElapsed = 0, mediaLast = null, mediaNotice = '';
  const resetMediaClock = () => { mediaElapsed = 0; mediaLast = null; };
  function mediaUnlocked() {
    if (!api.mediaEnabled() || !supported(saved()) || !api.state().intro.done || !mediaSetting().manual?.complete) return false;
    try { return Layers.current(api.state()).count >= 3; } catch { return false; }
  }
  function mediaReady() {
    return mediaUnlocked() && mediaSetting().enabled && !mediaSetting().pending && !pending && !suspended.has('media') &&
      !document.hidden && IMI.screen() === 'game' && api.automationAllowed() && !IMI.tour?.active() &&
      !document.querySelector('.o-modal, .o-celebrate, .set-pop:not([hidden])');
  }
  function editMedia() {
    if (!api.mediaEnabled() || !supported(saved())) return;
    const enabled = !mediaSetting().enabled || suspended.has('media');
    if (!enabled) { suspended.add('media'); resetMediaClock(); }
    if (pending || enabled && !mediaUnlocked()) return;
    const current = saved(), next = current === undefined ? {version:1} : JSON.parse(JSON.stringify(current));
    next.media = {...mediaSetting(),enabled}; resetMediaClock();
    write({expected:current === undefined ? null : JSON.stringify(current),next,media:true});
  }
  function mediaCard(safe) {
    if (!api.mediaEnabled()) return '';
    const cfg = safe ? mediaSetting() : {}, on = cfg.enabled && !suspended.has('media'), q = safe ? api.mediaNext() : null;
    const text = v => String(v).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    return `<section class="o-card lg06c-media"><h3>Auto-media</h3><p>Free. Requires Imprint 3 and introduction complete. ${cfg.manual?.complete ? 'Manual release saved.' : 'Release media by hand once. Older releases do not count.'}</p><p>One release every 60 active game seconds. Smallest next catalogue index, then division order. Automatic cost at most 5% of your wallet. Manual affordability unchanged.</p><p>${q ? `Next: ${text(q.name)}, #${q.index+1}, ${Economy.fmt(q.cost)} bananas.` : 'Waiting for a loaded, unlocked and affordable catalogue release.'}</p><button data-act="automation:media-toggle" aria-pressed="${!!on}" ${!safe || !on && (pending || !mediaUnlocked()) ? 'disabled' : ''}>Auto-media: ${on ? 'On' : 'Off'}</button><p role="status">${!safe ? 'Unsupported media data preserved. Actions disabled.' : suspended.has('media') ? 'Off locally. Retry to save Off.' : cfg.pending ? 'Release held for exact debit recovery. Retry to finish.' : text(mediaNotice || (on ? 'Waiting for the next 60-second attempt.' : 'Off'))}</p>${cfg.pending ? '<button data-act="automation:media-retry">Retry media release</button>' : ''}</section>`;
  }
"""
def auto_edit(s):
 s=replace(s,'  function supported(m) {',auto+'  function supported(m) {')
 s=replace(s,'m.version === 1 && (!api.gardenEnabled()', 'm.version === 1 && (!api.mediaEnabled() || api.validMedia(m.media)) && (!api.gardenEnabled()')
 s=replace(s,'function reset() { resetPitchClock();', "function reset() { resetMediaClock(); mediaNotice = ''; resetPitchClock();")
 s=replace(s,'if (p.pitch) resetPitchClock();', 'if (p.media) resetMediaClock(); else if (p.pitch) resetPitchClock();')
 s=replace(s,"const gardenOff = suspended.has('garden')", "const mediaOff = suspended.has('media') && !p.media;\n      const gardenOff = suspended.has('garden')")
 s=replace(s,"if (gardenOff) suspended.add('garden');", "if (mediaOff) suspended.add('media');\n      if (gardenOff) suspended.add('garden');")
 s=replace(s,'  function observeNet() {', '  function observeNet() {\n    if (api && mediaElapsed && !mediaReady()) resetMediaClock();')
 s=replace(s,'${pitchCard(safe)}${gardenCard(safe)}', '${mediaCard(safe)}${pitchCard(safe)}${gardenCard(safe)}')
 s=replace(s,'resetGardenClock(); resetPitchClock(); }); },','resetGardenClock(); resetPitchClock(); resetMediaClock(); }); },')
 s=replace(s,'reset, pitchReady,', 'reset, mediaReady, pitchReady,')
 s=replace(s,"actions:{ 'pitch-toggle'", "actions:{ 'media-toggle':editMedia, 'media-retry':() => { resetMediaClock(); Rewards.retry(); }, 'pitch-toggle'")
 s=replace(s,'      serviceNet({replay});',r"""      serviceNet({replay});
      const mediaActive = !replay && mediaReady(), mediaNow = api.clock.productionNow();
      if (!mediaActive) resetMediaClock();
      else {
        if (mediaLast !== null && mediaNow - mediaLast > gameSeconds * 1000 + 250) resetMediaClock();
        mediaLast = mediaNow;
        if (Number.isFinite(gameSeconds) && gameSeconds > 0) mediaElapsed = Math.min(60,mediaElapsed + gameSeconds);
      }""")
 s=replace(s,'pitchActive && pitchElapsed + 1e-9 >= 60];', 'pitchActive && pitchElapsed + 1e-9 >= 60, mediaActive && mediaElapsed + 1e-9 >= 60];')
 s=replace(s,'      if (service === 5) {', "      if (service === 6) {\n        mediaElapsed = 0; const result = api.mediaAttempt(); mediaNotice = result?.ok ? 'Release saved.' : result?.error || 'Waiting for a qualifying release.';\n      }\n      if (service === 5) {")
 s=replace(s,'resetGardenClock(); resetPitchClock(); });', 'resetGardenClock(); resetPitchClock(); resetMediaClock(); });')
 return s
edit('automation.js',auto_edit)

def gate_edit(s):
 s=replace(s,'pitch = false;', 'pitch = false, media = false;')
 s=replace(s,"      if (object(state) && own(state, 'prem')) {",r"""      const mediaCfg = object(state) && state.meta?.automation?.media;
      if (mediaCfg !== undefined) {
        const cfgKnown = object(mediaCfg) && mediaCfg.version === 1 &&
          (mediaCfg.enabled === undefined || typeof mediaCfg.enabled === 'boolean') &&
          (mediaCfg.sequence === undefined || Number.isSafeInteger(mediaCfg.sequence) && mediaCfg.sequence >= 0) &&
          (mediaCfg.manual === undefined || object(mediaCfg.manual) && (mediaCfg.manual.complete === undefined || typeof mediaCfg.manual.complete === 'boolean'));
        const t = mediaCfg?.pending;
        if (!cfgKnown || t != null) {
          media = true;
          const flags = new URLSearchParams(location.search);
          const known = cfgKnown && object(t) && t.version === 1 && typeof t.id === 'string' && t.id.startsWith('media:') &&
            ['manual','auto'].includes(t.origin) && typeof t.division === 'string' && typeof t.config === 'string' && Array.isArray(t.catalogue) && object(t.wallet) &&
            ['printing','imprint','sequence','before','quantity','cost','balance','after'].every(k => Number.isSafeInteger(t[k]) && t[k] >= 0) &&
            t.sequence > 0 && t.quantity > 0 && t.cost > 0 && t.balance >= t.cost && t.after === t.balance - t.cost;
          const needsFlags = known && ['lg03','lg01a','lg05folio','lg05layers'].some(flag => flags.get(flag) !== '1');
          resume = resume || needsFlags;
          blocked = blocked || !known || needsFlags;
        }
      }
      if (object(state) && own(state, 'prem')) {""")
 s=replace(s,"title.textContent = pitch ?", "title.textContent = media ? 'Media release recovery' : pitch ?")
 s=replace(s,'message.textContent = pitch ?', "message.textContent = media ? (resume ? 'This save has an unfinished media release. Resume with its recovery flags to finish safely.' : 'This media release cannot be opened safely. Your saved data has not been changed.') : pitch ?")
 s=replace(s,'scope.textContent = pitch ?', "scope.textContent = media ? 'Recovery stays on this local test origin. Other progression waits until the exact release and debit are settled.' : pitch ?")
 s=replace(s,'const flag of pitch ?', 'const flag of media || pitch ?')
 return s
edit('vault-save-gate.js',gate_edit)
edit('sw.js',lambda s:replace(s,"imi-v55","imi-v56"))
edit('automation.css',lambda s:s+"\n.lg06c-media p { margin: .4rem 0; overflow-wrap: anywhere; }\n.lg06c-media button { min-height: 44px; }\nhtml[data-style=\"classic\"] .lg06c-media { border-radius: 12px; }\n")
