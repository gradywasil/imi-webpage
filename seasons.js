/* Seasons records explicit, acknowledged observations of existing Stats units. */
window.Seasons = (() => {
  'use strict';
  const flags = new URLSearchParams(location.search), enabled = (window.GameFeatures?.enabled('lg09seasons') ?? flags.get('lg09seasons') === '1') && (window.GameFeatures?.enabled('lg01a') ?? flags.get('lg01a') === '1');
  const anchor = 1767571200000, duration = 604800000;
  const integer = n => Number.isSafeInteger(n) && n >= 0;
  const object = n => n !== null && typeof n === 'object' && !Array.isArray(n);
  const copy = n => JSON.parse(JSON.stringify(n));
  const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
  const fail = () => { throw Error('Unsupported Seasons record or counter regression. Save preserved.'); };
  const current = s => s.meta?.seasons;
  const access = s => !!s.intro.done && (s.printing >= 1 || current(s)?.access === true || s.meta.layers?.count > 0 || s.meta.estate?.count > 0);
  function week(at) {
    if (!integer(at) || at < anchor) fail();
    const weekIndex = Math.floor((at-anchor)/duration), start = anchor+weekIndex*duration, end = start+duration;
    if (![start,end].every(integer)) fail();
    return {weekIndex,start,end,theme:weekIndex%2 ? 'word-bank' : 'typewriter',metric:weekIndex%2 ? 'words' : 'letters',target:weekIndex%2 ? 10 : 100};
  }
  function observed(s,at = Date.now()) {
    if (!integer(at) || !integer(current(s)?.lastObservedAt ?? 0)) fail();
    return Math.max(at,current(s)?.lastObservedAt ?? 0);
  }
  function descriptor(basis) {
    if (!Number.isFinite(basis.bananas) || basis.bananas < 0 || !Number.isFinite(basis.speed) || basis.speed <= 0) fail();
    return {version:1,rule:1,origin:'seasons',kind:'C',tier:0,rate:basis.bananas,speed:basis.speed,minutes:5,floor:6250,cap:250000,
      amount:Economy.round(Math.max(6250,Math.min(250000,300*basis.bananas)))};
  }
  function validDescriptor(d) {
    if (!object(d) || !same(d,{...d,...descriptor({bananas:d.rate,speed:d.speed})})) fail();
  }
  function proof(a) {
    return {rule:1,observedAt:a.observedAt,metric:a.metric,baseline:a.baseline,sample:a.lastSample,delta:a.lastSample-a.baseline};
  }
  function validate(s) {
    const c = current(s); if (c === undefined) return;
    if (!object(c) || c.version !== 1 || c.rule !== 1 || c.access !== true || !integer(c.sequence) || !integer(c.lastObservedAt) ||
        c.highestSuccessWeek !== null && !integer(c.highestSuccessWeek)) fail();
    const a = c.active;
    if (a != null) {
      if (!object(a) || !integer(a.sequence) || !a.sequence || a.sequence !== c.sequence || a.id !== `seasons:${a.sequence}` ||
          !['active','complete'].includes(a.status) || !integer(a.participationAt)) fail();
      const w = week(a.participationAt);
      if (!Object.keys(w).every(k => a[k] === w[k]) || ![a.baseline,a.lastSample,a.savedProgress,a.observedAt,a.baseline+a.target].every(integer) ||
          a.lastSample < a.baseline || a.observedAt < a.participationAt || a.observedAt >= a.end || a.observedAt > c.lastObservedAt ||
          a.savedProgress !== Math.min(a.target,a.lastSample-a.baseline) || !integer(s.stats?.[a.metric]) || s.stats[a.metric] < a.lastSample) fail();
      validDescriptor(a.descriptor);
      if (a.status === 'complete' ? a.savedProgress !== a.target || !object(a.proof) || !same(a.proof,{...a.proof,...proof(a)}) || c.highestSuccessWeek !== a.weekIndex :
          a.savedProgress >= a.target || a.proof != null || c.highestSuccessWeek !== null && c.highestSuccessWeek >= a.weekIndex) fail();
    }
    if (c.highestSuccessWeek !== null && !(a?.status === 'complete' && a.weekIndex === c.highestSuccessWeek) && c.lastClaim?.weekIndex !== c.highestSuccessWeek) fail();
    if (c.lastOutcome != null && (!object(c.lastOutcome) || !['expired','left','claimed'].includes(c.lastOutcome.status) ||
        !integer(c.lastOutcome.sequence) || !c.lastOutcome.sequence || c.lastOutcome.sequence > c.sequence || !integer(c.lastOutcome.at) || c.lastOutcome.at > c.lastObservedAt)) fail();
    if (c.lastClaim != null) {
      const r = c.lastClaim;
      if (!object(r) || r.origin !== 'seasons-claim' || !integer(r.seasonsSequence) || !r.seasonsSequence || r.seasonsSequence > c.sequence ||
          r.id !== `seasons-claim:${r.seasonsSequence}` || !integer(r.sequence) || !r.sequence || !integer(r.acceptedAt) || r.acceptedAt > c.lastObservedAt ||
          !integer(r.weekIndex) || c.highestSuccessWeek === null || r.weekIndex > c.highestSuccessWeek || a && r.seasonsSequence >= a.sequence) fail();
      validDescriptor(r.descriptor);
      if (r.amount !== r.descriptor.amount || !object(r.proof) || r.proof.rule !== 1 || r.proof.metric !== (r.weekIndex%2 ? 'words' : 'letters') ||
          ![r.proof.observedAt,r.proof.baseline,r.proof.sample,r.proof.delta,r.proof.baseline+(r.weekIndex%2 ? 10 : 100)].every(integer) || r.proof.sample-r.proof.baseline !== r.proof.delta ||
          r.proof.delta < (r.weekIndex%2 ? 10 : 100) || week(r.proof.observedAt).weekIndex !== r.weekIndex || r.proof.observedAt > r.acceptedAt) fail();
    }
    if (c.pending != null && (!object(c.pending) || c.pending.version !== 1 || !['participate','observe','leave','expire','claim'].includes(c.pending.action) ||
        typeof c.pending.source !== 'string' || typeof c.pending.absent !== 'boolean' || typeof c.pending.pendingNull !== 'boolean' || !integer(c.pending.at))) fail();
    if (s.rewards?.walletHead?.origin === 'seasons-claim' && !['id','sequence','amount','origin'].every(k => c.lastClaim?.[k] === s.rewards.walletHead[k])) fail();
  }
  const fresh = () => ({version:1,rule:1,access:true,sequence:0,lastObservedAt:0,highestSuccessWeek:null,active:null,lastOutcome:null,lastClaim:null});
  function assertChoice(s,p) {
    validate(s);
    const c = current(s), a = c?.active;
    if (!integer(p.at) || p.at < (c?.lastObservedAt ?? 0) || p.run !== (a?.id ?? null)) fail();
    if (p.action === 'participate') {
      const w = week(p.at);
      if (!access(s) || a || !integer((c?.sequence ?? 0)+1) || c?.highestSuccessWeek != null && w.weekIndex <= c.highestSuccessWeek) throw Error('Claim your saved bonus first, or return in a later UTC week.');
      if (!same(w,p.week) || !integer(p.sample) || p.sample !== s.stats[w.metric] || !integer(p.sample+w.target)) fail();
      validDescriptor(p.descriptor);
    } else {
      if (!a || (p.action === 'claim' ? a.status !== 'complete' : a.status !== 'active')) throw Error('Seasons changed. Review the current week again.');
      if (p.action === 'observe' && (p.at < a.observedAt || p.at >= a.end || !integer(p.sample) || p.sample !== s.stats[a.metric] || p.sample < a.lastSample)) fail();
      if (p.action === 'expire' && p.at < a.end) fail();
    }
  }
  function outcome(s,p,now) {
    const c = current(s), a = c.active;
    if (!integer(now)) fail();
    c.lastObservedAt = Math.max(c.lastObservedAt,p.at,now);
    if (p.action === 'participate') {
      c.sequence++;
      c.active = {id:`seasons:${c.sequence}`,sequence:c.sequence,...copy(p.week),participationAt:p.at,baseline:p.sample,lastSample:p.sample,
        savedProgress:0,observedAt:p.at,descriptor:copy(p.descriptor),status:'active'};
      // A participation intent first acknowledged after its week cannot earn progress.
      if (c.lastObservedAt >= c.active.end) { c.lastOutcome={status:'expired',sequence:c.sequence,at:c.lastObservedAt}; c.active=null; }
    } else if (p.action === 'observe') {
      a.lastSample=p.sample; a.observedAt=p.at; a.savedProgress=Math.min(a.target,p.sample-a.baseline);
      if (a.savedProgress === a.target) { a.status='complete'; a.proof=proof(a); c.highestSuccessWeek=a.weekIndex; }
    } else if (p.action === 'claim') {
      c.lastClaim={origin:'seasons-claim',id:p.id,sequence:p.sequence,amount:p.pay,seasonsSequence:a.sequence,weekIndex:a.weekIndex,
        acceptedAt:p.at,descriptor:copy(a.descriptor),proof:copy(a.proof)};
      s.rewards.walletHead={id:p.id,sequence:p.sequence,amount:p.pay,origin:'seasons-claim'};
      c.lastOutcome={status:'claimed',sequence:a.sequence,at:p.at}; c.active=null;
    } else { c.lastOutcome={status:p.action === 'expire' ? 'expired' : 'left',sequence:a.sequence,at:p.at}; c.active=null; }
    delete c.pending;
  }
  const escape = x => String(x).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const utc = at => new Date(at).toISOString().replace('T',' ').replace('.000Z',' UTC');
  const name = theme => theme === 'typewriter' ? 'Typewriter week' : 'Word-bank week';
  const objective = theme => theme === 'typewriter' ? 'Add 100 to Letters typed, then Save progress this week.' : 'Bank 10 more words, then Save progress this week.';
  let review = null, notice = '';
  function render(api) {
    const s=api.state(); if (!access(s)) return '';
    try {
      validate(s);
      const c=current(s), a=c?.active, at=observed(s), w=week(at), amount=a?.descriptor.amount ?? descriptor(api.rewardBasis()).amount;
      const reason=api.seasonsDisabled(), waiting=Rewards.held();
      const button=(act,text) => `<button type="button" class="o-btn" data-act="seasons:${act}" data-binding="${escape(JSON.stringify({sequence:c?.sequence ?? 0,run:a?.id ?? null,weekIndex:w.weekIndex}))}"${reason||waiting?' disabled':''}>${text}</button>`;
      let status='Available', actions='';
      if (a?.status === 'complete') { status='Complete. Your saved bonus has no expiry.'; actions=button('claim',`Claim ${amount.toLocaleString()} bananas`); }
      else if (a) { status=`Saved progress: ${a.savedProgress}/${a.target}.`; actions=at >= a.end ? button('expire','Save expiry') : button('observe','Save progress')+button('leave','Leave week free'); }
      else if (c?.highestSuccessWeek != null && w.weekIndex <= c.highestSuccessWeek) status='Completed for this UTC week. Themes return.';
      else actions=review ? `<p>Reviewed bonus: ${review.descriptor.amount.toLocaleString()} bananas.</p>${button('participate','Participate free')}${button('cancel','Cancel')}` : button('review','Review free week');
      return `<section class="o-card lg09k-seasons" aria-label="Weekly Seasons"><h3>${name(a?.theme ?? w.theme)}</h3><p>${escape(status)}</p><p>${objective(a?.theme ?? w.theme)}</p><p>Bonus: <b>${amount.toLocaleString()} bananas</b>, fixed at participation.</p><p>${a?.status === 'complete' ? 'Claim this saved bonus before joining another week.' : `Save progress before ${utc(a?.end ?? w.end)}. Time away and resets count toward this end.`}</p><p>Optional. Skip free; themes return. Saved completed bonuses never expire.</p><details><summary class="o-btn">Production and clock rules</summary><p>Uses Stats production totals, including time away. Newly banked words can use old letters; words already banked do not count. Gifts, sales and this bonus do not directly count.</p><p>Leave and restart free before success with a new baseline. One success per original week, no backlog or streak. Ordinary resets keep your attempt and frozen bonus. Claim pays the current room.</p><p>Uses this device's clock. Clock changes and edited or imported saves can affect weeks. A Save fixed before the deadline can finish through Retry later. If the first Save fails, keep this page open to Retry. Later undated progress cannot finish an expired week.</p></details>${reason?`<p>${escape(reason)}</p>`:''}${notice?`<p role="status">${escape(notice)}</p>`:''}<div class="lg09k-actions">${actions}</div></section>`;
    } catch(error) { return `<section class="o-card lg09k-seasons"><h3>Weekly Seasons</h3><p>${escape(error.message)}</p></section>`; }
  }
  function command(action,api,el) {
    const result=Rewards.seasonsAction({action,binding:JSON.parse(el.dataset.binding),...(action === 'participate' ? {quote:review} : {})});
    notice=result.ok ? '' : result.error;
    if (result.ok || result.refused) review=null;
    api.mark();
  }
  if (enabled) (window.__OPS_EXTENSIONS ??= []).push(['seasons',{actions:{
    review:(el,api)=>{try { review={week:week(observed(api.state())),descriptor:descriptor(api.rewardBasis())}; notice=''; } catch(error) { notice=error.message; } api.mark();},
    cancel:(el,api)=>{review=null;api.mark();},
    participate:(el,api)=>command('participate',api,el),observe:(el,api)=>command('observe',api,el),leave:(el,api)=>command('leave',api,el),expire:(el,api)=>command('expire',api,el),claim:(el,api)=>command('claim',api,el)
  }}]);
  return Object.freeze({enabled,current,access,week,observed,descriptor,validate,fresh,assertChoice,outcome,render});
})();
