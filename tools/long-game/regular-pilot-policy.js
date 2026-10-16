(() => {
  'use strict';
  const D = IMI.ops.dev, E = IMI.ops.extensions, S = () => D.S();
  const copy = value => JSON.parse(JSON.stringify(value));
  const record = {calendarSeconds:__pilotClock.now()/1000, activeSeconds:__pilotClock.now()/1000, productiveSeconds:S().stats.secs, pickups:{ordinarySpawns:0,ordinaryAttempts:0,ordinaryCatches:0,ordinaryMisses:null,ordinaryUncaughtRemovals:0,goldSpawns:0,goldAttempts:0,goldCatches:0,goldMisses:null,goldUncaughtRemovals:0,events:[],limits:'DOM identities observed since policy admission; catches require synchronous product-stat increments. Uncaught removal may be expiry or disposal, so exact misses are unknown.'}, resets:[], folio:[], foundation:[], away:[], waits:{}, errors:[], milestones:{}};
  let bot = false, bound = false, retryUsed = false;
  const mark = (name, yes) => { if (yes && !record.milestones[name]) record.milestones[name] = {calendarMinutes:record.calendarSeconds/60,activeMinutes:record.activeSeconds/60}; };
  const wait = why => { record.waits[why] = (record.waits[why] || 0) + 1; };
  const click = selector => { const el = document.querySelector(selector); if (el && !el.disabled && !el.hidden && !el.closest('[hidden]') && el.getClientRects().length) { el.click(); return true; } return false; };
  function acknowledged(result, context) {
    if (result?.ok) return result;
    if (!result?.refused && Rewards.held() && !retryUsed) {
      retryUsed = true;
      const ok = Rewards.retry();
      record.errors.push({context, original:result, retry:ok});
      if (ok && !Rewards.held() && Rewards.owns() && Rewards.guard(S()) && IMI.ops.progression.running()) return {ok:true,retried:true,original:result};
    }
    throw Error(context+': '+(result?.error || result?.status || 'unacknowledged'));
  }
  function modal() {
    if (Rewards.held()) acknowledged({ok:false}, 'held save');
    if (!Rewards.owns() || !Rewards.guard(S()) || !IMI.ops.progression.running()) throw Error('Owner or progression guard stopped');
    const status = document.querySelector('.o-writer-status:not([hidden])');
    if (status) throw Error('Writer status: '+status.textContent.trim());
    if (click('.o-celebrate')) return true;
    if (document.querySelector('.o-daily')) {
      click('.o-daily .o-btn:not(:disabled)');
      return true;
    }
    const unknown = document.querySelector('.o-modal, .set-pop:not([hidden]), .mg01-overlay');
    if (unknown) throw Error('Unknown modal: '+unknown.textContent.trim().slice(0,180));
    return false;
  }
  const items = new Map(); let pickupID = 0;
  function track(el) {
    if (!el.matches?.('.o-pickup, .o-gold:not(.rotten)') || items.has(el)) return;
    const kind = el.matches('.o-pickup') ? 'ordinary' : 'gold';
    const item = {id:++pickupID,kind,caught:false,removed:false}; items.set(el,item);
    record.pickups[kind+'Spawns']++;
    record.pickups.events.push({id:item.id,kind,event:'observed spawn',clock:__pilotClock.now()});
  }
  function mutations(records) {
    for (const row of records) for (const node of row.addedNodes) {
      track(node); node.querySelectorAll?.('.o-pickup, .o-gold:not(.rotten)').forEach(track);
    }
    for (const [el,item] of items) if (!el.isConnected && !item.removed) {
      item.removed=true;
      if (!item.caught) record.pickups[item.kind+'UncaughtRemovals']++;
      record.pickups.events.push({id:item.id,kind:item.kind,event:item.caught?'caught removal':'uncaught removal; expiry/disposal unknown',clock:__pilotClock.now()});
    }
  }
  const pickupObserver = new MutationObserver(mutations);
  pickupObserver.observe(document.body,{childList:true,subtree:true});
  document.querySelectorAll('.o-pickup, .o-gold:not(.rotten)').forEach(track);
  function catches() {
    mutations(pickupObserver.takeRecords());
    for (const [el,item] of items) if (el.isConnected && !item.caught && !item.removed) {
      const before = item.kind==='ordinary' ? S().stats.pickups : S().gold;
      if (!el.getClientRects().length || el.closest('[hidden]')) continue;
      el.click();
      record.pickups[item.kind+'Attempts']++;
      const delta = (item.kind==='ordinary' ? S().stats.pickups : S().gold)-before;
      if (delta===1) { item.caught=true; record.pickups[item.kind+'Catches']++; }
      else if (delta!==0) throw Error('Unexpected pickup stat delta');
      record.pickups.events.push({id:item.id,kind:item.kind,event:'attempt',confirmed:delta===1,clock:__pilotClock.now()});
    }
    mutations(pickupObserver.takeRecords());
  }
  function intro() {
    const s = S();
    if (s.intro.done) return true;
    if (!s.intro.train || !s.intro.words || s.desks[0].paws<1) {
      click('.o-tab[data-tab="floor"]');
      const stage = document.querySelector('#oStage');
      if (!stage) throw Error('Intro stage unavailable');
      stage.focus();
      for (let n=0;n<3;n++) {
        stage.dispatchEvent(new KeyboardEvent('keydown',{key:' ',code:'Space',bubbles:true,cancelable:true}));
        window.dispatchEvent(new KeyboardEvent('keyup',{key:' ',code:'Space',bubbles:true}));
      }
    }
    if (s.intro.train && s.desks[0].paws<1) {
      click('.o-tab[data-tab="training"]'); click('.o-btn[data-act="up"][data-k="paw"]:not(:disabled)');
    }
    if (s.intro.words) {
      click('.o-tab[data-tab="lab"]'); click('.tour-next');
      click('.o-tab[data-tab="press"]');
      click('#o-press .o-btn[data-act="write"]:not(:disabled)');
      if (s.intro.shop) { click('.o-tab[data-tab="shop"]'); click('.tour-next'); click('.tour-next'); }
    }
    return S().intro.done;
  }
  function commission(index, offer) {
    const entry = {index,id:offer.id,clock:__pilotClock.now(),result:'not clicked'};
    record.commission = entry;
    const sameOffer = () => JSON.stringify(S().offers[index]) === JSON.stringify(offer);
    try {
      if (!sameOffer()) throw Error('Commission offer changed before navigation');
      if (!click('.o-tab[data-tab="press"]') || D.ui.tab!=='press') throw Error('Titles control unavailable');
      if (!click('#o-press [data-act="sub"][data-dept="press"][data-sub="pitches"]')) throw Error('Pitches control unavailable');
      // Sub navigation marks dirty; the normal Titles tab handler renders synchronously.
      if (!click('.o-tab[data-tab="press"]') || D.ui.sub.press!=='pitches') throw Error('Pitches pane unavailable');
      const selector = '#o-press button[data-act="commission"][data-i="'+index+'"]';
      const buttons = document.querySelectorAll(selector);
      if (!sameOffer() || buttons.length!==1 || buttons[0].closest('.o-card.sub')?.querySelector('h3')?.textContent!==offer.title) throw Error('Commission control stale or mismatched');
      if (!click(selector)) throw Error('Commission control unavailable or disabled');
      entry.result = 'clicked';
      entry.status = E.pitchStatus();
      if (!S().pitches.some(p => JSON.stringify(p)===JSON.stringify(offer)) || entry.status.pending) throw Error('Commission did not settle the chosen offer');
      entry.result = 'chosen offer present; no pending commission';
    } catch (error) {
      entry.error = String(error);
      throw error;
    } finally {
      if (!click('.o-tab[data-tab="floor"]') || D.ui.tab!=='floor') throw Error('Commission return to Floor unavailable');
    }
  }
  function startBot() {
    if (bot) return;
    Bot.start({profile:'active',strategy:'collect',activeMinutes:Infinity,tapRate:3,realActions:true,usePublisher:true,commission});
    S().bank = {...S().bank};
    click('.o-tab[data-tab="floor"]');
    bot = true;
  }
  function folio(action, extra={}) {
    const request = {action,...Layers.epochFields(S()),expected:copy(S().meta.folio ?? null),...extra};
    const entry={calendarMinutes:record.calendarSeconds/60,request}; record.folio.push(entry);
    entry.result=Rewards.folioAction(request);
    const result = acknowledged(entry.result, 'Folio '+action); entry.acknowledgement=result;
    const f=S().meta.folio;
    if (action==='work' && !f?.working || action==='return' && f?.working || action==='choose' && JSON.stringify(f?.selection)!==JSON.stringify(extra.selection)) throw Error('Folio command lacked acknowledged state');
    return result;
  }
  function folioStep() {
    const s = S(); if (bound || s.printing < 3) return false;
    if (s.meta.folio?.completed?.pocket) { bound=true; folio('return'); click('.o-tab[data-tab="floor"]'); mark('pocketBinding',true); return false; }
    if (!s.meta.folio?.selection) folio('choose',{selection:{id:'pocket',leaves:[0,1],reward:{kind:'cash'}}});
    if (!S().meta.folio?.working) folio('work');
    const q=Folio.quote(S(),S().meta.folio.selection);
    if (q.amount!==6250 || JSON.stringify(q.need)!==JSON.stringify({THE:2,APE:1,CAP:1})) throw Error('Pocket contract changed');
    const need = q.need;
    if (Object.entries(need).every(([word,n]) => (S().bank[word] || 0)>=n)) {
      folio('prepare');
      const f=S().meta.folio;
      if (!f?.completed?.pocket || f.pending || f.cashHead?.amount!==6250 || f.gallery?.pocket?.count!==1) throw Error('Folio prepare did not acknowledge one Pocket binding/payment');
      bound=true; folio('return'); click('.o-tab[data-tab="floor"]'); mark('pocketBinding',true);
      return false;
    }
    wait('Folio ingredients'); return true;
  }
  function legacy() {
    for (const id of ['crew','seed','speed','sales','golden']) {
      const u=D.LEG.find(row=>row.id===id), level=D.legLvl(id);
      if (level<u.max && S().legacy.stars>=u.costs[level]) { D.action('legbuy',{id}); break; }
    }
  }
  function observe() {
    const s=S(); mark('intro',s.intro.done); mark('Printing4',s.printing>=3); mark('Printing8',s.printing>=7);
    mark('lifetime60',s.legacy.total>=60); mark('firstImprint',!!s.meta.layers?.count);
  }
  function second() {
    const before=__pilotClock.now();
    const productiveBefore=S().stats.secs;
    if (modal()) { wait('known modal'); __pilotClock.advance(1000); }
    else if (!intro()) { __pilotClock.advance(1000); }
    else if (typeof Bot !== 'undefined') {
    startBot(); click('.o-tab[data-tab="floor"]'); catches();
    if (folioStep()) __pilotClock.advance(1000);
    else { Bot.run(1/60); legacy(); }
    } else __pilotClock.advance(1000);
    if (__pilotClock.now()-before!==1000) throw Error('Policy second clock mismatch');
    record.calendarSeconds=__pilotClock.now()/1000; record.activeSeconds++;
    record.productiveSeconds+=S().stats.secs-productiveBefore;
    mutations(pickupObserver.takeRecords());
    observe();
  }
  function sessionEnd() {
    const s=S();
    if (!s.intro.done || !bot) { wait('intro incomplete at session end'); return; }
    if (modal()) { wait('known modal at session end'); return; }
    if (s.meta.folio?.working || s.meta.folio?.pending) { wait('Folio work at session end'); return; }
    if (bound && s.printing>=7 && s.legacy.total>=60) {
      const offer=E.layerPreview();
      const request={action:'found',quote:offer.quote,expected:copy(s.meta.layers ?? null),...Layers.epochFields(s)};
      const entry={calendarMinutes:record.calendarSeconds/60,request}; record.foundation.push(entry);
      entry.result=Rewards.layerAction(request);
      const result=acknowledged(entry.result,'Imprint'); entry.acknowledgement=result;
      const l=S().meta.layers,c=S().rewards.claims['layer:imprint:first'];
      if (l?.count!==offer.quote.count+1 || l.baseline!==offer.quote.total || l.seals!==(request.expected?.seals??0)+offer.quote.seals || c?.status!=='committed') throw Error('Imprint command lacked acknowledged successor/first claim');
      return;
    }
    if (s.printing>=3 && !bound) { wait('Pocket binding before Printing'); return; }
    if (D.starsNow()<1) { wait('pending star below one'); return; }
    const quote=E.printingReview('manual');
    const request={origin:'manual',quote},entry={calendarMinutes:record.calendarSeconds/60,request}; record.resets.push(entry);
    entry.result=Rewards.printingAction(request);
    const result=acknowledged(entry.result,'Printing'); entry.acknowledgement=result;
    if (S().legacy.total!==quote.total+quote.gain) throw Error('Printing lifetime gain mismatch');
    if (S().printing!==quote.printing+1) throw Error('Printing command lacked acknowledged successor');
  }
  function away(seconds) {
    const before={cash:IMI.bananas.get(),cap:D.awayCap(),efficiency:D.awayEff(),lastSeen:S().lastSeen};
    acknowledged(IMI.bananas.saveAcknowledged(),'pre-away wallet Save');
    acknowledged(E.save(),'pre-away state Save'); __pilotClock.skip(seconds*1000);
    const progress=IMI.ops.simulateAway(seconds);
    record.calendarSeconds+=seconds;
    record.away.push({calendarMinutes:record.calendarSeconds/60,seconds,before,progress,afterCash:IMI.bananas.get()});
    if (!IMI.ops.progression.running()) throw Error('Away owner stopped progression');
    if (!progress || S().rewards.awayCheckpoint) throw Error('Away did not acknowledge completion');
    acknowledged(IMI.bananas.saveAcknowledged(),'post-away wallet Save');
    acknowledged(E.save(),'post-away state Save');
    // The visible-return handler rebases tick's last time. Saved lastSeen prevents another absence payout.
    document.dispatchEvent(new Event('visibilitychange'));
    if (!IMI.ops.progression.running() || S().lastSeen!==Date.now()) throw Error('Away return boundary unsettled');
    observe();
  }
  function snapshot(compact=false) {
    mutations(pickupObserver.takeRecords());
    const history=compact ? {...record,resets:record.resets.length,folio:record.folio.length,foundation:record.foundation.length,away:record.away.length,pickups:{...record.pickups,events:record.pickups.events.length}} : record;
    const s=S(), wallet=IMI.bananas.acknowledgement();
    return {...history,clock:__pilotClock.now(),intro:s.intro,tab:D.ui.tab,guard:Rewards.guard(s),retryUsed,gameSpeed:IMI.ops.clock.speed(),premium:s.prem,automation:s.meta.automation??null,productStats:{pickups:s.stats.pickups,pickupEarned:s.stats.pickupEarned,gold:s.gold,secs:s.stats.secs,playSecs:s.stats.playSecs},botStarted:bot,bound,screen:IMI.screen(),owner:Rewards.owns(),running:IMI.ops.progression.running(),held:Rewards.held(),printing:s.printing+1,pendingStars:D.starsNow(),currentStars:s.legacy.stars,lifetimeStars:s.legacy.total,runEarned:s.run.earned,bank:{THE:s.bank.THE||0,APE:s.bank.APE||0,CAP:s.bank.CAP||0},folio:s.meta.folio??null,layers:s.meta.layers??null,pendingPrinting:s.meta.automation?.print?.pending??null,desks:s.desks.map(d=>({owned:d.owned,paws:d.paws,mk:d.mk,crew:d.crew.length,up:d.up,keeper:d.keeper,letters:Object.values(d.letters).reduce((a,b)=>a+b,0)})),cash:IMI.bananas.get(),wallet,awards:s.awards,rewards:s.rewards,rawSaveLength:localStorage.getItem('imi-ops-v1')?.length||0};
  }
  window.RegularPilot={second,sessionEnd,away,snapshot,record};
})();
