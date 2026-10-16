/* The daily board owns its bounded rules and projection; Ops owns real sales. */
window.CommissionBoard = (() => {
  'use strict';
  const flags = new URLSearchParams(location.search), enabled = (window.GameFeatures?.enabled('lg09board') ?? flags.get('lg09board') === '1') && (window.GameFeatures?.enabled('lg01a') ?? flags.get('lg01a') === '1');
  const ids = ['ape-in-the-cape','goodnight-baboon','very-hungry-capuchin','three-little-twigs','chimp-in-the-hat','green-eggs-and-hamster'];
  const integer = n => Number.isSafeInteger(n) && n >= 0;
  const object = n => n !== null && typeof n === 'object' && !Array.isArray(n);
  const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
  const copy = n => JSON.parse(JSON.stringify(n));
  const fail = () => {throw Error('Unsupported Commission board record. Save preserved.');};
  const day = at => Math.floor(at / 86400000);
  const current = s => s.meta?.commissionBoard;
  const observed = (s,at = Date.now()) => Math.max(at,current(s)?.lastObservedAt ?? 0);
  const eligible = r => !!r && ids.includes(r.id) && r.band === 0 && !r.gen && !r.kid && !r.lib && Object.keys(r.need).every(w => w.length === 2 || w.length === 3);
  const access = s => !!s.intro.done && (s.printing >= 1 || current(s)?.access === true || s.meta.layers?.count > 0 || s.meta.estate?.count > 0);
  function descriptor(basis) {
    if (!Number.isFinite(basis.bananas) || basis.bananas < 0 || !Number.isFinite(basis.speed) || basis.speed <= 0) fail();
    return {version:1,rule:1,origin:'commission-board',kind:'C',tier:0,rate:basis.bananas,speed:basis.speed,minutes:5,floor:6250,cap:250000,
      amount:Economy.round(Math.max(6250,Math.min(250000,300*basis.bananas)))};
  }
  function validDescriptor(d) {
    if (!object(d) || !same(d,{...d,...descriptor({bananas:d.rate,speed:d.speed})})) fail();
  }
  function receipt(r,kind) {
    if (!object(r) || r.origin !== 'board-'+kind || !integer(r.boardSequence) || !r.boardSequence ||
        r.id !== `board-${kind}:${r.boardSequence}` || !integer(r.sequence) || !r.sequence || !integer(r.amount) || !r.amount || r.amount % 25 ||
        !integer(r.acceptedAt) || kind === 'sale' && !ids.includes(r.title)) fail();
  }
  function validate(s) {
    const c = current(s); if (c === undefined) return;
    if (!object(c) || c.version !== 1 || c.access !== true || !integer(c.sequence) || !integer(c.lastObservedAt) ||
        c.highestSuccessDay !== null && !integer(c.highestSuccessDay)) fail();
    if (c.receipt != null) {receipt(c.receipt,'sale'); if(c.receipt.boardSequence > c.sequence || c.highestSuccessDay !== day(c.receipt.acceptedAt) || c.receipt.acceptedAt > c.lastObservedAt) fail();}
    if (c.lastClaim != null) {receipt(c.lastClaim,'claim'); validDescriptor(c.lastClaim.descriptor); if(c.lastClaim.amount !== c.lastClaim.descriptor.amount || c.lastClaim.boardSequence > c.sequence) fail();}
    if (c.lastOutcome != null && (!object(c.lastOutcome) || !['expired','abandoned','claimed'].includes(c.lastOutcome.status) || !integer(c.lastOutcome.sequence) || c.lastOutcome.sequence > c.sequence || !integer(c.lastOutcome.at))) fail();
    const a = c.active;
    if (a != null) {
      if (!object(a) || a.id !== `board:${c.sequence}` || a.sequence !== c.sequence || !['active','complete'].includes(a.status) ||
          !integer(a.startedAt) || !integer(a.expiresAt) || a.expiresAt !== a.startedAt+600000 || c.lastObservedAt < a.startedAt) fail();
      validDescriptor(a.descriptor);
      if (a.status === 'complete' && (!object(a.proof) || !same(a.proof,c.receipt) || a.proof.boardSequence !== a.sequence ||
          a.proof.acceptedAt < a.startedAt || a.proof.acceptedAt >= a.expiresAt || c.highestSuccessDay !== day(a.proof.acceptedAt))) fail();
      if (a.status === 'active' && a.proof != null) fail();
    }
    if (c.pending != null && (!object(c.pending) || c.pending.version !== 1 || !['start','abandon','expire','sale','claim'].includes(c.pending.action) ||
        typeof c.pending.source !== 'string' || !integer(c.pending.at))) fail();
  }
  function assertChoice(s,p,names) {
    validate(s); const c = current(s), a = c?.active;
    if (p.at < (c?.lastObservedAt ?? 0)) fail();
    if (p.action === 'start') {
      if (!access(s) || a || !names.length || !integer(p.at+600000) || !integer((c?.sequence ?? 0)+1) || c?.highestSuccessDay != null && day(p.at) <= c.highestSuccessDay) throw Error('Claim the saved bonus or return on a later UTC day with an eligible unsold book.');
      validDescriptor(p.descriptor);
    } else {
      if (!a || p.run !== a.id) throw Error('Commission changed. Review it again.');
      if (p.action === 'claim' ? a.status !== 'complete' : a.status !== 'active') fail();
      if (p.action === 'expire' && p.at < a.expiresAt || p.action === 'sale' && (p.at < a.startedAt || p.at >= a.expiresAt)) fail();
    }
  }
  function outcome(s,p,now) {
    const c = s.meta.commissionBoard, a = c.active;
    c.lastObservedAt = Math.max(c.lastObservedAt,p.at,now);
    if (p.action === 'start') {
      c.sequence++;
      c.active = {id:`board:${c.sequence}`,sequence:c.sequence,status:'active',startedAt:p.at,expiresAt:p.at+600000,descriptor:copy(p.descriptor)};
      if (c.lastObservedAt >= c.active.expiresAt) {c.lastOutcome={status:'expired',sequence:c.sequence,at:c.lastObservedAt}; c.active=null;}
    } else if (p.action === 'sale') {
      const r = {origin:'board-sale',id:p.id,sequence:p.sequence,amount:p.pay,boardSequence:a.sequence,title:p.title,acceptedAt:p.at};
      c.receipt=r; a.status='complete'; a.proof=copy(r); c.highestSuccessDay=day(p.at);
      s.rewards.walletHead={id:r.id,sequence:r.sequence,amount:r.amount,origin:r.origin};
    } else if (p.action === 'claim') {
      c.lastClaim={origin:'board-claim',id:p.id,sequence:p.sequence,amount:p.pay,boardSequence:a.sequence,acceptedAt:p.at,descriptor:copy(a.descriptor)};
      s.rewards.walletHead={id:p.id,sequence:p.sequence,amount:p.pay,origin:'board-claim'};
      c.lastOutcome={status:'claimed',sequence:a.sequence,at:p.at}; c.active=null;
    } else {c.lastOutcome={status:p.action === 'expire' ? 'expired' : 'abandoned',sequence:a.sequence,at:p.at}; c.active=null;}
    delete c.pending;
  }
  const fresh = () => ({version:1,access:true,sequence:0,highestSuccessDay:null,lastObservedAt:0,active:null,lastOutcome:null,lastClaim:null,receipt:null});
  let review = null, notice = '';
  const escape = x => String(x).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render(api) {
    const s=api.state(); if (!access(s)) return '';
    const c=current(s), a=c?.active, now=observed(s), amount=a?.descriptor.amount ?? descriptor(api.rewardBasis()).amount;
    const names=api.boardNames(), waiting=Rewards.held(), expired=a?.status === 'active' && now >= a.expiresAt;
    const button=(act,text,disabled=false) => `<button type="button" class="o-btn" data-act="commission-board:${act}"${disabled||waiting?' disabled':''}>${text}</button>`;
    let status='Available', action='';
    if (a?.status === 'complete') {status='Complete, 1/1'; action=button('claim',`Claim ${amount.toLocaleString()} bananas`);}
    else if (a) {status=expired?'Deadline passed, 0/1':'Active, 0/1'; action=expired?button('expire','Save expiry'):button('abandon','Abandon free');}
    else if (c?.highestSuccessDay != null && day(now)<=c.highestSuccessDay) status='Completed for this UTC day';
    else if (!names.length) status='No eligible unsold books available';
    else action=review ? `<p>Reviewed bonus: ${review.amount.toLocaleString()} bananas. Starts when accepted; ends 10 real minutes later.</p>${button('start','Start free')}${button('cancel','Cancel')}` : button('review','Review free brief');
    return `<section class="o-card lg09g-board" aria-label="Commission board"><h3>Short shelf delivery</h3><p>${status}</p><p>Manually sell 1 authored Bamboo book with only 2- and 3-letter recipe words within 10 real minutes.</p><p>Bonus: <b>${amount.toLocaleString()} bananas</b>, fixed at Start. Normal sale price is paid separately.</p>${a?`<p>${a.status==='complete'?'Your saved bonus has no expiry.':`Ends ${escape(new Date(a.expiresAt).toLocaleString())}, including time away and resets.`}</p>`:''}<details><summary>Eligible books and rules</summary><p>${escape(names.join(', ') || 'None available this run. An active brief can continue after a reset.')}</p><p>Existing stock counts. Use the normal manual Sell button. Publisher, away, challenge and work sales do not count. Turn Publisher off to keep a book for this brief.</p><p>One successful brief per UTC day. Claim before starting another. Attempts and bonuses carry through ordinary resets. Expiry and abandonment are free, with no streak or skip penalty.</p><p>This device uses its local clock. Saved time observations cannot move backward; clock changes while closed can affect the deadline.</p></details>${notice?`<p role="status">${escape(notice)}</p>`:''}<div class="lg09g-actions">${action}</div></section>`;
  }
  function command(action,api) {
    const result=Rewards.boardAction({action,...(action==='start'?{quote:review}:{})});
    notice=result.ok?'':result.startedAt !== undefined ? `Start waiting to save. Its reviewed deadline is ${new Date(result.startedAt+600000).toLocaleString()}. Retry keeps this time and bonus.` : result.error;
    if(result.ok)review=null; api.mark(); api.setTab('press');
  }
  if (enabled) (window.__OPS_EXTENSIONS ??= []).push(['commission-board',{
    actions:{review:(el,api)=>{review=descriptor(api.rewardBasis());notice='';api.mark();},cancel:(el,api)=>{review=null;api.mark();},
      start:(el,api)=>command('start',api),claim:(el,api)=>command('claim',api),abandon:(el,api)=>command('abandon',api),expire:(el,api)=>command('expire',api)}
  }]);
  return Object.freeze({enabled,ids,current,observed,day,eligible,access,descriptor,validate,assertChoice,outcome,fresh,render});
})();
