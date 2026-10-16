/* Two exact earned-only items. Inert until the actual owned Ops API installs them. */
window.VaultPlay = (() => {
  'use strict';
  const item = 'lamp-plus:1', clone = x => JSON.parse(JSON.stringify(x));
  const speedItem = 'game-speed:1';
  const speedEnabled = () => (window.GameFeatures?.enabled('lg02speed') ?? new URLSearchParams(location.search).get('lg02speed') === '1');
  const speedReady = () => true;
  const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const flags = () => ['lg01a','lg02','lg02lamp'].every(k => (window.GameFeatures?.enabled(k) ?? new URLSearchParams(location.search).get(k) === '1'));
  // The task runner establishes this before navigation and records the external identities.
  // This assertion is not proof against other or stale documents on a shared origin.
  const isolated = () => window.__LG02_LAMP_TASK?.origin === location.origin &&
    /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(location.origin);
  const enabled = () => flags() && (!!window.GameFeatures && !GameFeatures.legacy || isolated());
  const available = () => true;
  const pending = s => Object.entries(s.prem?.vault?.purchases || {}).find(([,r]) => r.status === 'undoable')?.[0];
  const cap = s => s.prem?.vault?.active?.[item] ? 86400 : 0;
  const speed = s => s.prem?.vault?.active?.[speedItem] ? 1.25 : 1;
  // The head gate can recognize only this fixed Archive checkpoint envelope.
  // Archive validates its exact integral/successor before any startup writer runs.
  function archiveRecovery(s) {
    const a=s.meta?.archive,p=a?.pending,cp=s.rewards?.awayCheckpoint;
    if (!s.prem?.vault?.freeSpeed || !object(p) || p.version!==1 || Object.keys(p).length!==6 ||
        !Number.isSafeInteger(p.resetEpoch) || p.resetEpoch!==s.meta.estate?.resetEpoch ||
        p.id!==`archive:e${p.resetEpoch}:${a.sequence+1}` || cp?.phase!=='archive' || !object(p.interval) ||
        Object.keys(p.interval).length!==2 || p.interval.observed!==cp.nowMs || !Array.isArray(p.interval.spans) ||
        !object(p.next) || p.next.version!==1 || p.next.sequence!==a.sequence+1 || !Object.hasOwn(p,'credit')) return false;
    const start=Math.max(cp.nowMs-cp.awaySec*1000,a.through),end=Math.max(start,cp.nowMs-cp.awaySec*1000+cp.sec*1000);
    const spans=p.interval.spans,span=spans[0];
    if (end>start ? spans.length!==1 || !object(span) || Object.keys(span).length!==3 || span.start!==start || span.end!==end || span.seconds!==(end-start)/1000*cp.multiplier*cp.eff : spans.length!==0) return false;
    const c=p.credit;
    return c===null || object(c) && Object.keys(c).length===4 && c.id===p.id &&
      [c.previous,c.sequence,c.amount].every(Number.isSafeInteger) && c.previous>=0 && c.sequence===c.previous+1 && c.amount>0 && c.amount%25===0;
  }
  function startupCheck(raw) {
    try {
      const s=JSON.parse(raw);
      if (!s?.prem?.vault?.freeSpeed || s.meta?.archive?.pending==null) return true;
      if (!archiveRecovery(s) || !window.Archive?.enabled) return false;
      Archive.pending(s);
      return true;
    } catch { return false; }
  }
  function savedSupported(s, absent = false) {
    if (!object(s) || !object(s.prem)) return absent && object(s) && s.prem === undefined;
    const p = s.prem, v = p.vault;
    if ([p.bought,p.boughtTotal,p.spentBought].some(n => n !== undefined && n !== 0) ||
        Object.values(p.credits || {}).some(c => c.source !== 'earned')) return false;
    if (v === undefined) return absent && Vault.validate(s).status === 'absent';
    if (Vault.validate(s).status !== 'valid' || !object(v.freeLamp) || v.freeLamp.version !== 1 || v.freeLamp.rule !== 1 ||
        Object.keys(v.freeLamp).length !== 2 || Object.keys(v).some(k => !['version','nextSequence','purchases','owned','active','selections','settings','freeLamp','freeSpeed','transition'].includes(k))) return false;
    if (v.freeSpeed !== undefined && (!object(v.freeSpeed) || v.freeSpeed.version !== 1 || v.freeSpeed.rule !== 1 || Object.keys(v.freeSpeed).length !== 2)) return false;
    if (Object.keys(v.settings).some(k => k !== 'hideStore') || Object.keys(v.selections).length ||
        Object.values(v.purchases).some(r => ![item,speedItem].includes(r.itemId) || r.itemId === speedItem && !v.freeSpeed || r.debitBought !== 0 ||
          Object.keys(r).some(k => /effect|multiplier|speed|entitlement|selection/i.test(k)))) return false;
    const cp = s.rewards?.awayCheckpoint;
    return !cp || cp.multiplier === speed(s) && !cp.capUnbounded && cp.cap === Vault.oldEffects(s)?.capSeconds;
  }
  // Busy gameplay belongs to its existing owner; it only prevents new Vault commands.
  function supported(s, absent = false) {
    if (!savedSupported(s, absent)) return false;
    const m = s.meta || {}, a = m.automation || {};
    if (Object.entries(m).some(([k,x]) => x?.pending != null && !(k==='archive' && archiveRecovery(s))) || Object.values(a).some(x => x?.pending != null || x?.manual?.pending != null) || m.minigames?.active != null ||
        a.pitch?.sale != null || m.challengeMastery?.active != null || a.challenge?.active != null || s.challenge?.a11 || s.challenge?.mastery) return false;
    return true;
  }
  function rawCheck(opsRaw, walletRaw) {
    try {
      const s = opsRaw === null ? null : JSON.parse(opsRaw), w = walletRaw === null ? null : JSON.parse(walletRaw);
      if (s?.prem && Object.hasOwn(s.prem,'vault')) {
        if (!available() || !enabled() || s.prem.vault.freeSpeed && (!speedEnabled() || !speedReady()) || !savedSupported(s) || !object(w) || w.economyVersion !== 1 || !Number.isSafeInteger(w.score) || w.score < 0) return false;
      }
      return true;
    } catch { return false; }
  }
  const empty = () => ({version:1,nextSequence:1,purchases:{},owned:{},active:{},selections:{},settings:{hideStore:false},freeLamp:{version:1,rule:1}});
  function review(s, itemId = item) {
    if (![item,speedItem].includes(itemId)) throw Error('Unsupported Vault item.');
    const cost = itemId === speedItem ? 150 : 100;
    if (!enabled() || itemId === speedItem && (!speedEnabled() || !speedReady()) || !supported(s,true) || !s.intro?.done || itemId === item && s.lamp !== 3 || !s.rewards?.migration ||
        s.prem.vault?.settings.hideStore || s.prem.vault?.owned[itemId] || pending(s) || s.prem.earned < cost) throw Error(itemId === item ? 'Requires ordinary Night Lamp tier 3, completed introduction, 100 earned Diamond Bananas and settled rewards.' : 'Requires completed introduction, 150 earned Diamond Bananas, settled rewards and ready speed support.');
    return {itemId,catalogueRevision:1,cost,priorTier:0,debitEarned:cost,debitBought:0,remaining:s.prem.earned-cost,printing:s.printing,lamp:s.lamp,nextSequence:s.prem.vault?.nextSequence || 1};
  }
  function project(s, command, at) {
    if (!supported(s,true) || !Number.isFinite(at) || Math.abs(at)>8.64e15) throw Error('Unsupported lamp source or time. Save preserved.');
    const next = clone(s), p = next.prem;
    if (command.kind === 'reserve') {
      if (JSON.stringify(review(s,command.quote?.itemId)) !== JSON.stringify(command.quote)) throw Error('The purchase review changed. Review it again.');
      p.vault ??= empty();
      const {itemId,cost} = command.quote;
      if (itemId === speedItem) p.vault.freeSpeed ??= {version:1,rule:1};
      const v = p.vault, sequence = v.nextSequence++, id = 'vault:'+sequence;
      p.earned -= cost; p.spentEarned += cost;
      v.purchases[id] = {version:1,catalogueRevision:1,sequence,itemId,cost,debitEarned:cost,debitBought:0,priorTier:0,targetTier:1,createdWallMs:at,printingAtPurchase:s.printing,status:'undoable'};
      v.owned[itemId] = id;
    } else if (command.kind === 'settings') {
      if (typeof command.hideStore !== 'boolean') throw Error('Invalid store preference');
      p.vault ??= empty(); p.vault.settings.hideStore = command.hideStore;
    } else {
      const v = p.vault, r = v?.purchases[command.purchaseId];
      if (!r || !['activate','refund'].includes(command.kind)) throw Error('Unknown lamp command');
      const status = command.kind === 'activate' ? 'active' : 'refunded';
      if (r.status === status) return next;
      if (r.status !== 'undoable' || v.transition || s.rewards.awayCheckpoint) throw Error('Lamp work must settle first');
      if (command.kind === 'refund') {
        p.earned += r.debitEarned; p.bought += r.debitBought; p.spentEarned -= r.debitEarned; p.spentBought -= r.debitBought;
        delete v.owned[r.itemId]; r.refundedWallMs = at;
      } else { v.active[r.itemId] = command.purchaseId; r.activatedWallMs = at; }
      r.status = status;
    }
    if (!supported(next)) throw Error('Lamp candidate cannot be represented safely');
    return next;
  }
  function install(api) {
    if (!available() || !enabled() || !window.Rewards?.enabled) return;
    let quote = null, notice = '', page = 0;
    const name = id => id === speedItem ? 'Game Speed tier 1' : 'Night Lamp+ tier 1';
    const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const button = (act,label,disabled='') => `<button type="button" class="o-btn" data-act="vault:${act}" ${disabled}>${label}</button>`;
    const inert = on => document.querySelectorAll('#rail, #hud, #settingsBtn, .o-deskstrip, #oGoals').forEach(el => {el.inert=on;});
    function close() {quote=null;inert(false);api.mark();}
    function cancelReview() {close();render(api,document.getElementById('o-vault'));document.querySelector('[data-act="vault:review"]')?.focus();}
    function command(c) {close(); const r=Rewards.lampAction(c); if(r?.error)notice=r.error;api.mark();return r;}
    function render(a,host) {
      const s=a.state(),p=s.prem,v=p.vault,id=pending(s),r=v?.purchases[id],held=Rewards.held();
      let body=`<h2>Diamond Vault</h2><p>${p.earned+p.bought} Diamond Bananas. ${p.earned} earned, ${p.bought} bought.</p><p>Earned by playing. Game speed: x${speed(s)}. Current offline cap: ${a.vaultContext().cap/3600} real hours. Offline efficiency: ${Math.round(a.vaultContext().eff*100)}%.</p>`;
      if (notice) body+=`<p role="status">${esc(notice)}</p>`;
      if (quote) {
        body+=`<section class="lg02d-lamp-review" role="dialog" aria-modal="true" aria-labelledby="lampReviewTitle" tabindex="0"><h3 id="lampReviewTitle">${name(quote.itemId)}</h3><p>${quote.itemId === speedItem ? 'Permanent x1.25 productive game time online and offline. The offline cap counts real hours; efficiency and world, calendar and minigame clocks stay unchanged.' : `Offline cap: 24 real hours. Offline efficiency stays ${Math.round(a.vaultContext().eff*100)}%. Requires ordinary Night Lamp tier 3 for this first purchase.`}</p><p>Uses ${quote.cost} earned and 0 bought Diamond Bananas. After purchase: ${quote.remaining} total.</p><p>Saved items can be undone here for 10 real seconds. Reloading or leaving ends Undo. This is game currency, not a money payment.</p>${button('cancel','Cancel')}${button('confirm',`Spend ${quote.cost} Diamond Bananas`)}</section>`;
      } else {
        if(r)body+=`<section class="o-card"><p>Saved. ${name(r.itemId)} starts after Undo closes.</p><p>Undo is local to this page. Leaving or reloading ends it.</p>${button('undo',`Undo ${name(r.itemId)}`,held||!Rewards.lampUndoable(id)?'disabled':'')}${button('keep','Keep purchase',held?'disabled':'')}</section>`;
        if(cap(s))body+='<p>Night Lamp+ tier 1 owned and active. Permanent 24-hour real offline cap.</p>';
        if(speed(s) === 1.25)body+='<p>Game Speed tier 1 owned and active. Permanent x1.25 productive game time online and offline.</p>';
        if(speedEnabled()&&!v?.settings.hideStore&&!v?.owned[speedItem])body+=`<section class="o-card"><h3>Game Speed tier 1</h3><p>150 Diamond Bananas. Permanent x1.25 productive game time online and offline. Real offline cap and current efficiency stay unchanged.</p><p>Requires completed introduction and settled rewards.${p.earned<150?' Need '+(150-p.earned)+' more earned Diamond Bananas.':''}</p>${button('review-speed','Review Game Speed',id||held||!speedReady()?'disabled':'')}</section>`;
        if(!v?.settings.hideStore&&!v?.owned[item])body+=`<section class="o-card"><h3>Night Lamp+ tier 1</h3><p>100 Diamond Bananas. Permanent 24-hour real offline cap; current lamp and Woolf efficiency stay unchanged. No online speed change.</p><p>Initial purchase requires ordinary Night Lamp tier 3, completed introduction and settled rewards.${p.earned<100?' Need '+(100-p.earned)+' more earned Diamond Bananas.':''}</p>${button('review','Review Night Lamp+',id||held?'disabled':'')}</section>`;
        const history=Object.entries(v?.purchases||{}).reverse(),slice=history.slice(page*20,page*20+20);
        if(history.length)body+=`<details><summary>Local Diamond Banana history (${history.length})</summary>${slice.map(([key,h])=>`<p>${esc(key)}. ${esc(new Date(h.createdWallMs).toLocaleString())}. ${name(h.itemId)}. ${h.cost} DB, ${h.debitEarned} earned / ${h.debitBought} bought. ${h.status==='undoable'?'Waiting to activate':h.status==='active'?'Active':'Undone'}.</p>`).join('')}${page?button('previous','Previous'):''}${history.length>(page+1)*20?button('next','Next'):''}</details>`;
      }
      body+='<p>Items stay through Second Printing. This game saves on this browser. Clearing browser data can lose your save.</p><p>No ads. Ever. Every layer, challenge and automation can be reached by playing. Diamond Bananas buy the exact permanent upgrades shown here. No random prizes or timed offers.</p>';
      a.morph(host,`<div class="lg02d-lamp">${body}</div>`);
    }
    function openReview(itemId) {try{quote=Rewards.lampReview(itemId);inert(true);api.mark();queueMicrotask(()=>{render(api,document.getElementById('o-vault'));document.querySelector('[data-act="vault:cancel"]')?.focus();});}catch(e){notice=e.message;api.mark();}}
    api.register('vault',{speed:a=>speed(a.state()),tab:['vault','moon','Vault','Earned permanent upgrade','Vault'],visible:a=>a.state().intro.done&&(a.state().prem.earned>0||!!a.state().prem.vault),render,
      actions:{review:()=>openReview(item),'review-speed':()=>openReview(speedItem),cancel:cancelReview,confirm:()=>{const q=quote;command({kind:'reserve',quote:q});},undo:()=>command({kind:'refund',purchaseId:pending(api.state())}),keep:()=>command({kind:'activate',purchaseId:pending(api.state())}),previous:()=>{page=Math.max(0,page-1);api.mark();},next:()=>{page++;api.mark();}},
      afterRender:()=>{if(Rewards.held()&&quote)close();},
      lampRefused:message=>{notice=message;api.mark();},
      lampSaved:event=>{const r=api.state().prem.vault?.purchases[event.purchaseId || pending(api.state())];notice=event.kind==='settings'?'Store preference saved.':event.kind==='reserve'?`Saved. ${name(r.itemId)} starts after Undo closes.`:event.kind==='refund'?`Undone. ${r.debitEarned} Diamond Bananas returned.`:`${name(r.itemId)} active.`;api.mark();}
    });
    document.addEventListener('keydown',e=>{
      if(!quote)return;
      if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();cancelReview();}
      if(e.key==='Tab'){const controls=[...document.querySelectorAll('.lg02d-lamp-review button')],first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    },true);
    window.IMI.settings.registerVault({render:()=>`<div class="set-row lg02d-lamp-setting"><span>Hide the Diamond store</span><button type="button" class="set-btn" data-set="lamp-hide" aria-pressed="${!!api.state().prem.vault?.settings.hideStore}">${api.state().prem.vault?.settings.hideStore?'On':'Off'}</button><p>Hide item prices and spending buttons. Your earned Diamond Bananas and owned items still work.</p><button type="button" class="set-btn" data-set="lamp-open">Vault, history and pending purchase</button></div>`,action:act=>act==='lamp-hide'?command({kind:'settings',hideStore:!api.state().prem.vault?.settings.hideStore}):api.setTab('vault')});
  }
  return Object.freeze({available,enabled,isolated,speedEnabled,speedReady,supported,savedSupported,rawCheck,startupCheck,pending,cap,speed,review,project,empty,install});
})();
