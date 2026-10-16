/* LG-08C: finite authored copies and fixed, acknowledged Archive income. */
window.Archive = (() => {
  'use strict';
  const enabled = new URLSearchParams(location.search).get('lg08archive') === '1' && !!window.Estate?.enabled;
  const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const integer = x => Number.isSafeInteger(x) && x >= 0;
  const copy = x => JSON.parse(JSON.stringify(x));
  const same = Layers.same, hours = 3600000, costs = [1,2,4];
  // Capture authored defaults before Ops tuning and pitch registration can change recipes.
  const books = Object.fromEntries(window.READERS.filter(r => !r.kid && !r.lib && !r.gen).map(r => {
    const need = {}; let longest = 0;
    for (const word of (r.text.toLowerCase().match(/[a-z']+/g) || []).map(w => w.replace(/'/g,'')).filter(w => w.length > 1)) {
      const w = word.toUpperCase(); need[w] = (need[w] || 0) + 1; longest = Math.max(longest,w.length);
    }
    const band = Math.max(0,Math.floor((longest - 2) / 2));
    return [r.id,{id:r.id,title:r.title,need,pay:Math.round(r.pay * [.15,.4,.35,.2,.2,.2][band]) * 25}];
  }));
  const fail = message => {throw Error(message);};
  function current(s) {
    const a = s.meta.archive;
    if (a === undefined) return {version:1,revision:0,sequence:0,slots:0,usedCopies:{},entries:[],memorial:[],working:null,fraction:0,through:0};
    if (!object(a) || a.version !== 1 || !['revision','sequence','slots','through'].every(k => integer(a[k])) || a.slots > 3 ||
        !object(a.usedCopies) || Object.entries(a.usedCopies).some(([id,n]) => !books[id] || !integer(n)) ||
        !Array.isArray(a.entries) || a.entries.length > a.slots || !Array.isArray(a.memorial) ||
        !Number.isFinite(a.fraction) || a.fraction < 0 || a.fraction >= 25 ||
        a.working !== null && !a.entries.some(e => e.key === a.working) ||
        new Set(a.entries.map(e => e.title)).size !== a.entries.length || new Set(a.entries.map(e => e.slot)).size !== a.entries.length ||
        [...a.entries,...a.memorial].some(e => !object(e) || !books[e.title] || !integer(e.key) || !e.key || e.key > a.revision || !integer(e.slot) || e.slot >= a.slots ||
          e.basis !== 1 || !integer(e.pay) || !e.pay || !integer(e.born) || !Number.isFinite(e.age) || e.age < 0 || e.age > 48 * hours ||
          !integer(e.deposits) || e.deposits > 2 || !integer(e.used) || !e.used || e.used > (a.usedCopies[e.title] || 0)) ||
        a.memorial.some(e => !integer(e.retired)) ||
        new Set([...a.entries,...a.memorial].map(e => e.key)).size !== a.entries.length + a.memorial.length) fail('Unsupported Archive save. Preserve it for recovery.');
    return copy(a);
  }
  function available(s,r) {
    if (s.meta.archive === undefined) return true;
    try {return !current(s).entries.some(e => e.title === r.id);} catch {return false;}
  }
  const age = (e,at) => Math.min(48 * hours,Math.max(e.age,at - e.born,0));
  const stage = (e,at) => e.deposits >= 2 && age(e,at) >= 48 * hours ? 2 : e.deposits >= 1 && age(e,at) >= 12 * hours ? 1 : 0;
  function integral(a,from,to,seconds) {
    if (![from,to,seconds].every(Number.isFinite) || from < 0 || to < from || seconds < 0 || to === from && seconds) fail('Invalid Archive interval.');
    let amount = 0;
    for (const e of a.entries) {
      const points = [from,...[12,48].map(h => e.born + h * hours).filter(t => t > from && t < to),to];
      for (let i = 1; i < points.length; i++) amount += e.pay / 3600 * [1,2,4][stage(e,(points[i-1]+points[i])/2)] * seconds * (points[i]-points[i-1]) / (to-from || 1);
    }
    return amount;
  }
  function income(a,interval) {
    const next = copy(a); let amount = a.fraction;
    if (!object(interval) || !integer(interval.observed) || !Array.isArray(interval.spans) || interval.spans.length > 128) fail('Invalid Archive checkpoint.');
    let through = a.through;
    for (const span of interval.spans) {
      if (!object(span) || span.start < through || span.end > interval.observed) fail('Archive interval was already settled.');
      amount += integral(a,span.start,span.end,span.seconds); through = span.end;
    }
    if (!Number.isFinite(amount) || amount < 0 || amount > Number.MAX_SAFE_INTEGER - 25) fail('Archive income cannot be represented safely.');
    const payout = Math.floor((amount + 1e-9) / 25) * 25;
    next.fraction = Math.max(0,amount - payout); next.through = Math.max(through,interval.observed);
    for (const e of next.entries) e.age = age(e,interval.observed);
    if (!integer(next.sequence + 1)) fail('Archive checkpoint counter exhausted.');
    next.sequence++;
    return {next,payout};
  }
  function pending(s) {
    if (!enabled) fail('Resume Archive with its original development flags.');
    const a = current(s), p = a.pending;
    if (!object(p) || p.version !== 1 || !Layers.epochMatches(s,p) || !object(p.interval) || !object(p.next)) fail('Unsupported Archive income intent.');
    delete a.pending;
    const expected = income(a,p.interval), credit = p.credit;
    if (!same(expected.next,p.next) || p.id !== `archive:e${p.resetEpoch}:${expected.next.sequence}` ||
        (expected.payout ? !object(credit) || credit.id !== p.id || credit.amount !== expected.payout || !integer(credit.previous) || !integer(credit.sequence) || credit.sequence !== credit.previous + 1 : credit !== null)) fail('Archive income provenance changed.');
    return p;
  }
  function prepare(s,interval,marker) {
    const a = current(s);
    if (a.pending) fail('Finish the pending Archive income first.');
    const result = income(a,interval), id = `archive:e${Layers.estateIdentity(s).resetEpoch}:${result.next.sequence}`;
    const previous = marker?.sequence || 0;
    if (!integer(previous + 1)) fail('Wallet receipt counter exhausted.');
    return {...a,pending:{version:1,...Layers.epochFields(s),id,interval:copy(interval),next:result.next,credit:result.payout ? {id,previous,sequence:previous+1,amount:result.payout} : null}};
  }
  const copies = (s,a,id) => Math.max(0,(s.editions[id] || 0) - (a.usedCopies[id] || 0));
  function proposal(s,request) {
    if (!enabled || !Estate.current(s).count || !s.intro.done) fail('Archive opens after your first Estate.');
    const a = current(s);
    if (a.pending || !Layers.epochMatches(s,request) || request.revision !== a.revision || !integer(request.at)) fail('Archive changed. Review this action again.');
    if (s.rewards.awayCheckpoint || s.meta.folio?.pending || s.meta.estate?.pending || s.meta.layers?.pending || s.prem.vault?.transition) fail('Finish pending production and recovery first.');
    const next = {...s,meta:{...s.meta,archive:a}}, e = a.entries.find(e => e.key === request.key);
    if (request.action === 'buy') {
      const estate = Estate.current(s), cost = costs[a.slots];
      if (cost === undefined || estate.charters < cost) fail('Insufficient Charters or all slots owned.');
      next.meta.estate = {...estate,charters:estate.charters-cost}; a.slots++;
    } else if (request.action === 'endow') {
      const book = books[request.title], used = (a.usedCopies[request.title] || 0) + 1;
      if (!book || !integer(s.editions[book.id]) || !integer(used) || !copies(s,a,book.id) || a.entries.some(e => e.title === book.id) ||
          !integer(request.slot) || request.slot >= a.slots || a.entries.some(e => e.slot === request.slot)) fail('Choose an available earlier copy and empty owned slot.');
      const key = a.revision + 1;
      a.usedCopies[book.id] = used; a.entries.push({key,title:book.id,slot:request.slot,basis:1,pay:book.pay,born:request.at,age:0,deposits:0,used});
      if (s.focus === book.id || s.meta.productionGoal?.manual === book.id) {
        next.focus = null; next.autoFocus = true;
        if (s.meta.productionGoal) next.meta.productionGoal = {...s.meta.productionGoal,manual:null};
      }
    } else if (request.action === 'return') a.working = null;
    else {
      if (!e) fail('Choose an active Archive entry.');
      if (request.action === 'retire') {a.entries = a.entries.filter(x => x !== e);a.memorial.push({...e,retired:request.at});if(a.working === e.key)a.working=null;}
      else if (request.action === 'move') {
        if (!integer(request.slot) || request.slot >= a.slots || a.entries.some(e => e.slot === request.slot)) fail('Choose an empty owned slot.');
        e.slot = request.slot;
      } else if (request.action === 'work' || request.action === 'deposit') {
        if (s.meta.worksDemo?.working || window.WorksPlay?.current(s)?.working) fail('Pause Works first.');
        if (e.deposits >= 2) fail('All restoration materials are already deposited.');
        if (request.action === 'work') {
          if (s.meta.folio?.working || s.meta.folio !== undefined && !Folio.valid(s.meta.folio)) fail('Return from Folio work first.');
          const need = books[e.title].need;
          if (!Object.keys(need).every(w => s.desks[Math.max(0,Math.floor((w.length-2)/2))]?.owned && !(s.challenge?.id === 'haiku' && w.length > 5))) fail('Own every ingredient desk and finish conflicting challenges first.');
          a.working = e.key;
        } else {
          const need = Object.entries(books[e.title].need).map(([w,n]) => [w,n * (e.deposits ? 2 : 1)]);
          if (!need.every(([w,n]) => integer(s.bank[w]) && s.bank[w] >= n)) fail('Bank the whole original recipe before depositing.');
          next.bank = {...s.bank};for(const [w,n] of need) next.bank[w] -= n;
          e.deposits++;a.working=null;
        }
      } else fail('Unknown Archive action.');
    }
    if (!integer(a.revision + 1)) fail('Archive command counter exhausted.');
    a.revision++; return next;
  }
  function goal(s) {
    if (!enabled || s.meta.archive === undefined || s.challenge) return null;
    try {
      const a = current(s), e = a.entries.find(e => e.key === a.working);
      if (!e || e.deposits >= 2) return null;
      const need = Object.fromEntries(Object.entries(books[e.title].need).map(([w,n]) => [w,n * (e.deposits ? 2 : 1)]));
      return {title:'Archive: '+books[e.title].title,need,total:Object.values(need).reduce((n,v)=>n+v,0)};
    } catch {return null;}
  }
  function retained(s) {
    if (s.meta.archive === undefined) return;
    const a = current(s);
    if (a.pending) fail('Finish Archive income before resetting.');
  }
  let api, notice = '';
  const escape = x => String(x).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button = (action,text,attrs='') => `<button class="o-btn" type="button" data-act="archive:${action}" ${attrs}>${text}</button>`;
  function act(action,extra={}) {
    if (!api.archiveSettle()) return {ok:false,error:'Income is waiting to save. Use Retry.'};
    const s = api.state(), result = Rewards.archiveAction({action,...Layers.epochFields(s),revision:current(s).revision,at:Date.now(),...extra});
    notice = result.ok ? 'Archive saved.' : result.error;api.mark();return result;
  }
  function confirm(action,extra,text) {
    const focus = document.activeElement, el = document.createElement('div');el.className='o-modal layer-confirm archive-confirm';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Confirm Archive action');
    el.innerHTML=`<div class="o-modal-card"><h3>Confirm Archive action</h3><div class="layer-details" tabindex="0"><p>${escape(text)}</p></div><div class="o-row">${button('cancel','Cancel')}${button('confirm','Confirm')}</div></div>`;
    const close=()=>{el.remove();focus?.focus();};el.querySelector('[data-act="archive:cancel"]').onclick=close;
    el.querySelector('[data-act="archive:confirm"]').onclick=()=>{act(action,extra);close();};
    el.onkeydown=e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const buttons=el.querySelectorAll('button'),first=buttons[0],last=buttons[1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
    document.body.appendChild(el);el.querySelector('button').focus();
  }
  function render(c,pane) {
    api=c;
    try {
      const s=c.state(),a=current(s),now=Date.now(),empty=Array.from({length:a.slots},(_,i)=>i).filter(i=>!a.entries.some(e=>e.slot===i));
      let html=`<section class="o-card layers archive"><h3>Archive</h3><p>Charters: ${Estate.current(s).charters}. Permanent slots: ${a.slots}/3.</p><p>Slot prices: 1, 2, then 4 Charters. Earlier copies are finite.</p>${a.slots<3?button('buy',`Buy slot ${a.slots+1} for ${costs[a.slots]} Charters`,Estate.current(s).charters<costs[a.slots]?'disabled':''):''}${button('back','Back to Estate')}${a.working!==null?button('return','Return to production'):''}<p>Saved fractional income: ${a.fraction.toFixed(4)} bananas. Automatic payouts in multiples of 25.</p>${notice?`<p role="status">${escape(notice)}</p>`:''}</section>`;
      for(const e of a.entries){const book=books[e.title],st=stage(e,now),need=Object.entries(book.need).map(([w,n])=>[w,n*(e.deposits?2:1)]),ready=need.every(([w,n])=>(s.bank[w]||0)>=n);
        html+=`<section class="o-card layers archive"><h3>Slot ${e.slot+1}: ${escape(book.title)}</h3><p>Stage ${st}. Real age ${(age(e,now)/hours).toFixed(2)}/48 hours. Materials deposited ${e.deposits}/2.</p><p>Frozen basis v${e.basis}: ${e.pay.toLocaleString('en-US')} bananas. Rate ${(e.pay/3600*[1,2,4][st]).toFixed(6)} per productive game second.</p><p>Archived, retire entry to resume sales. Previously written royalties continue until reset.</p><p>Stage 1 needs 12 real hours and one recipe. Stage 2 needs 48 real hours and two further recipes. Deposits wait safely for age.</p>${e.deposits<2?`<p>Next deposit: ${need.map(([w,n])=>`${w} ${s.bank[w]||0}/${n}`).join(', ')}.</p>${button('work',a.working===e.key?'Working on restoration':'Work on restoration',`data-key="${e.key}" ${a.working===e.key?'disabled':''}`)}${button('deposit','Review full deposit',`data-key="${e.key}" ${ready?'':'disabled'}`)}`:''}${empty.map(slot=>button('move',`Move to slot ${slot+1}`,`data-key="${e.key}" data-slot="${slot}"`)).join('')}${button('retire','Review retirement',`data-key="${e.key}"`)}</section>`;
      }
      if(empty.length) html+='<section class="o-card layers archive"><h3>Earlier authored copies</h3>'+Object.values(books).map(b=>`<p>${escape(b.title)}: ${copies(s,a,b.id)} available of ${s.editions[b.id]||0} earlier copies.</p>${button('endow','Review '+escape(b.title),`data-title="${b.id}" data-slot="${empty[0]}" ${copies(s,a,b.id)&&!a.entries.some(e=>e.title===b.id)?'':'disabled'}`)}`).join('')+'</section>';
      html+=`<section class="o-card layers archive"><h3>Retired entries</h3><p>${a.memorial.length} memorials. Consumed copies and Charters are never refunded.</p><p>Restoration work targets ingredients with enabled keepers and pauses Publisher. Return preserves your book, production set and keeper settings.</p></section>`;
      c.morph(pane,html);
    } catch(error){c.morph(pane,`<section class="o-card layers"><h3>Archive unavailable</h3><p>${escape(error.message)}</p></section>`);}
  }
  if(enabled)(window.__OPS_EXTENSIONS??=[]).push(['archive',{tab:['archive','','Archive','Restore earlier editions','Archive',true],visible:c=>Estate.current(c.state()).count>0,init:(_reason,c)=>{api=c;},render,actions:{
    buy:()=>act('buy'),back:()=>{if(current(api.state()).working!==null&&!act('return').ok)return;api.setTab('estate');},return:()=>act('return'),
    endow:el=>{const s=api.state(),a=current(s),b=books[el.dataset.title];confirm('endow',{title:b.id,slot:+el.dataset.slot},`Permanently consume one earlier ${b.title} copy. ${copies(s,a,b.id)-1} copies remain. Withdraw future sales until retirement. Frozen basis ${b.pay} bananas, stage 0 rate ${(b.pay/3600).toFixed(6)} per productive game second. No refund on retirement.`);},
    work:el=>act('work',{key:+el.dataset.key}),move:el=>act('move',{key:+el.dataset.key,slot:+el.dataset.slot}),
    deposit:el=>{const e=current(api.state()).entries.find(e=>e.key===+el.dataset.key);confirm('deposit',{key:e.key},`Consume ${e.deposits?2:1} complete original recipes of banked words for ${books[e.title].title}. Ingredients: ${Object.entries(books[e.title].need).map(([w,n])=>`${w} x ${n*(e.deposits?2:1)}`).join(', ')}. No partial deposit. Materials remain while waiting for real age.`);},
    retire:el=>confirm('retire',{key:+el.dataset.key},'Settle income and permanently retire this entry. Future income stops. Ordinary sale eligibility returns under current run rules. No copy, material or Charter refund.')
  }}]);
  return {enabled,current,available,books,age,stage,integral,income,prepare,pending,proposal,goal,retained,copies};
})();
