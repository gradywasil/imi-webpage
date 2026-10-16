from pathlib import Path

def edit(name, old, new):
    p=Path(name); raw=p.read_bytes(); a=old.replace("\n","\r\n").encode(); b=new.replace("\n","\r\n").encode()
    assert raw.count(a)==1, (name, old[:100],raw.count(a))
    p.write_bytes(raw.replace(a,b))
edit('ops.js', '  const folio = window.Folio;', '  const folio = window.Folio;\n  const layers = window.Layers;')
edit('ops.js', '  const progressing = () => !writer || (writer.owns() && !paused && !writer.transacting() &&', '  const progressing = () => !writer || (writer.owns() && !paused && !writer.transacting() && !S.meta?.layers?.pending &&')
edit('ops.js', '  function newTypist() {\n    const used = new Set(S.desks.flatMap(d => (d.crew || []).map(t => t.name)));', '  function newTypist(candidate = S) {\n    const used = new Set(candidate.desks.flatMap(d => (d.crew || []).map(t => t.name)));')
edit('ops.js', "    const look = rollLook(); ui.lastLook = { id: look.id, fresh: !(S.looks || {})[look.id] }; seeLook(look.id);", "    const look = rollLook();\n    if (candidate === S) ui.lastLook = { id: look.id, fresh: !(S.looks || {})[look.id] };\n    (candidate.looks || (candidate.looks = {}))[look.id] = 1;")
edit('ops.js', '    if (!chal(\'vowel\')) return FREQ;\n    return freqCache || (freqCache = Object.fromEntries(Object.entries(FREQ).map(([k, v]) => [k, VOWELS.includes(k) ? v * .35 : v])));', "    const base = !chal('vowel') ? FREQ : freqCache || (freqCache = Object.fromEntries(Object.entries(FREQ).map(([k, v]) => [k, VOWELS.includes(k) ? v * .35 : v])));\n    return layers?.weights(S, base) || base;")
edit('ops.js', 'pick(Object.fromEntries([...VOWELS].map(v => [v, FREQ[v]])))', 'pick(Object.fromEntries([...VOWELS].map(v => [v, freqNow()[v]])))')
edit('ops.js', "* (1 + (extensions.get('minigames')?.titleSaleBonus?.() || 0)));", "* (1 + (extensions.get('minigames')?.titleSaleBonus?.() || 0)) * (layers?.saleFactor(S, r.band, museOn) || 1));")
edit('ops.js', "    morph($('#o-legacy'), subTabs('legacy', tabs) + body);", "    morph($('#o-legacy'), subTabs('legacy', tabs) + body + (layers?.enabled && (S.printing >= 7 || layers.identity(S)) ? '<div class=\"o-card layers\"><h3>Imprints</h3><p>A new room with retained Legacy and permanent Press Seal purchases.</p><button class=\"o-btn\" data-act=\"layers:open\">Review Imprints</button></div>' : ''));")
edit('ops.js', "          if (patch.bank) candidate.bank = patch.bank;", "          if (request.action === 'finish') { const stamps = layers?.stamp(S); if (stamps) candidate.meta.layers = stamps; }\n          if (patch.bank) candidate.bank = patch.bank;")
edit('ops.js', "    state: () => S, save, mark, morph, setTab,", """    state: () => S, save, mark, morph, setTab,
    ...(layers?.enabled ? {
      layerPreview,
      layerCommit(request) {
        if (!writer?.owns() || !writer.transacting() || window.VaultSaveGate?.blocked || writer.localDisposition()) return {ok:false, error:'Imprint save owner unavailable'};
        try {
          let candidate;
          if (request.action === 'found') {
            const q = layers.quote(S);
            if (!layers.same(q,request.quote) || !layers.same(S.meta.layers,request.expected)) throw Error('Foundation changed. Review it again.');
            const offer = layerOffer && layers.same(layerOffer.quote,q) ? layerOffer : layerPreview();
            candidate = layers.project(S, fresh());
            candidate.desks = JSON.parse(JSON.stringify(offer.room.desks)); candidate.hold = offer.room.hold;
            candidate.looks = {...candidate.looks, ...offer.room.looks};
            if (offer.reward) candidate.rewards.claims['layer:imprint:first'] = {status:'prepared', origin:'new', descriptor:offer.reward};
            const pending = {id:`imprint:${q.count + 1}:${q.total}`, total:q.total, seed:offer.seed, marker:bananas.acknowledgement(), candidate};
            candidate = {...S, meta:{...S.meta, layers:{...layers.current(S), pending}}};
          } else if (request.action === 'finish') {
            candidate = JSON.parse(JSON.stringify(layers.pending(S).candidate));
          } else candidate = {...S, meta:{...S.meta, layers:layers.proposal(S,request)}};
          candidate.lastSeen = Date.now();
          const result = Economy.saveStateAcknowledged(candidate);
          if (result.ok) {
            if (request.action === 'finish') { S = candidate; layerOffer = null; layerRuntimeReset(); }
            else { S.meta = candidate.meta; S.lastSeen = candidate.lastSeen; }
            mark();
          }
          return result;
        } catch(error) { return {ok:false, refused:true, error:error.message}; }
      }
    } : {}),""")
# Place the candidate sampler adjacent to the existing reward sampler. It never replaces S.
edit('ops.js', '  const canMake = (d, w) =>', """  let layerOffer = null;
  function layerPreview() {
    const quote = layers.quote(S), room = layers.project(S, fresh()), d = room.desks[0];
    if (room.legacy.ups.crew) { room.hold = true; d.paws = 2; for (let n=0;n<2;n++) d.crew.push(newTypist(room)); }
    const skyNow = sky(), multiplier = speed();
    const rate = multiplier / PAW_BASE[0] / (skyNow.wx === 3 ? 2 : 1) * d.crew.reduce((sum,t) => {
      const m = trMul(t);
      let factor = (1 + .1 * (room.legacy.ups.speed || 0)) * (room.chDone.vowel ? 1.05 : 1) * (room.chDone.hands ? 1.1 : 1) * (1 + t.talent / 100);
      if (t.trait === 'speedy') factor *= 1 + .25 * m;
      if (t.trait === 'owl') factor *= skyNow.night ? 1 + .4 * m : .9;
      if (t.trait === 'rainy') { if (skyNow.wx >= 1) factor *= 1 + .3 * m; if (skyNow.wx === 3) factor *= 2; }
      if (t.trait === 'lucky') factor *= 1 + .05 * m;
      return sum + factor * (1 + (extensions.get('minigames')?.automaticTypingBonus?.() || 0));
    },0);
    const reward = S.rewards.claims['layer:imprint:first'] ? null : writer.layerReward({desk:0, letters:[rate], speed:multiplier});
    return layerOffer = {quote, room, seed:cash([0,1000,10000,100000][room.legacy.ups.seed || 0]), reward};
  }
  function layerRuntimeReset() {
    IMI.pickups?.clear(); goldEnd?.(); holding = false; royAcc = coinBank = 0;
    combo.n = combo.t = 0; keeperT = []; freqCache = null; lastBananas = bananas.get();
    rt.forEach(r => { r.timers = []; r.sheet = ''; r.col = 0; r.n = 0; });
    Object.assign(ui, {hot:DESKS.map(() => false), readySet:null, pulled:null, fresh:null, dropped:{}, mcd:{}, tab:'imprints', nextCh:''});
    Object.keys(buffs).forEach(k => { buffs[k] = 0; }); typists = []; dropCaches(); bankV++;
    // Reset runtime cadences only. Reward initialization must not reinterpret the new local Printing.
    for (const id of ['automation','minigames']) extensions.get(id)?.reset?.({kind:'imprint'}, extensionAPI);
    buildStage(); mark();
  }
  const canMake = (d, w) =>""")
