/* One earned Small Crew run. No production, purchases or wallet authority. */
window.AutoChallenge = (() => {
  'use strict';
  const enabled = (window.GameFeatures?.enabled('lg08challenge') ?? new URLSearchParams(location.search).get('lg08challenge') === '1');
  const ids = ['ape-in-the-cape','goodnight-baboon','very-hungry-capuchin','three-little-twigs','chimp-in-the-hat','green-eggs-and-hamster'];
  const goldIDs = [...ids,'peter-panzee','swing-in-the-willows','charlie-chimpolate','wild-apes'];
  const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const integer = n => Number.isSafeInteger(n) && n >= 0;
  const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
  const copy = x => JSON.parse(JSON.stringify(x));
  const config = s => s.meta.automation?.challenge;
  const active = s => config(s)?.active;
  function gold(g) {
    return object(g) && g.version === 1 && g.rule === 1 && g.origin === 'manual' && g.medal === 'gold' && g.target === 10 &&
      integer(g.sequence) && g.sequence > 0 && ['resetEpoch','printing','imprint'].every(k => integer(g[k])) &&
      g.id === `mastery:e${g.resetEpoch}:${g.sequence}` && same(g.required,goldIDs) && Array.isArray(g.sold) &&
      g.sold.length === 10 && new Set(g.sold).size === 10 && goldIDs.every(id => g.sold.includes(id)) && same(g.contained,['bronze','silver','gold']);
  }
  function run(r) {
    return object(r) && r.version === 1 && r.rule === 1 && r.origin === 'auto-challenge' &&
      integer(r.sequence) && r.sequence > 0 && ['resetEpoch','printing','imprint'].every(k => integer(r[k])) &&
      r.id === `a11:e${r.resetEpoch}:${r.sequence}` && gold(r.gold) &&
      ['producing','completed-awaiting-exit','manual-continuation'].includes(r.phase) && Array.isArray(r.sold) &&
      r.sold.length <= 6 && same(r.sold,ids.slice(0,r.sold.length)) &&
      (r.target === null || r.target === ids[r.sold.length]) && (r.phase !== 'completed-awaiting-exit' || r.sold.length === 6 && r.target === null);
  }
  function valid(c) {
    return c === undefined || object(c) && c.version === 1 && integer(c.sequence) && c.cursor === 0 &&
      ['enabled','disclosed'].every(k => c[k] === undefined || typeof c[k] === 'boolean') &&
      Array.isArray(c.selected) && (c.selected.length === 0 || same(c.selected,['smallcrew'])) &&
      (c.gold === undefined || gold(c.gold)) && (c.active == null || run(c.active) && c.active.sequence === c.sequence && c.active.phase !== 'manual-continuation') &&
      (c.last == null || run(c.last) && c.last.sequence <= c.sequence && ['completed','abandoned','manual'].includes(c.last.outcome) && integer(c.last.at)) &&
      (c.receipt == null || object(c.receipt) && integer(c.receipt.resetEpoch) && integer(c.receipt.runSequence) && c.receipt.runSequence > 0 && c.receipt.runSequence <= c.sequence && ids.includes(c.receipt.title) && c.receipt.run === `a11:e${c.receipt.resetEpoch}:${c.receipt.runSequence}` && c.receipt.id === `a11-sale:e${c.receipt.resetEpoch}:${c.receipt.runSequence}:${c.receipt.title}` && integer(c.receipt.sequence) && c.receipt.sequence > 0 && integer(c.receipt.amount) && c.receipt.amount > 0 && c.receipt.amount % 25 === 0);
  }
  function validate(s) {
    const c = config(s), r = active(s);
    if (!valid(c) || s.challenge?.a11 && !r) throw Error('Unsupported A11 record. Save preserved.');
    if (r && (!enabled || !Layers.epochMatches(s,r) || r.printing !== s.printing || r.imprint !== Layers.identity(s) ||
        !s.chDone.smallcrew || !s.intro.done || !gold(s.meta.challengeMastery?.highest) || !same(r.gold,s.meta.challengeMastery.highest) || !same(r.gold,c.gold) ||
        r.sold.some(id => !s.written[id]) || (r.phase === 'completed-awaiting-exit' ? s.challenge != null : s.challenge?.id !== 'smallcrew' || s.challenge.a11 !== r.id) ||
        s.desks.some(d => d.owned && (d.paws > 2 || d.crew.length > 2)))) throw Error('Unsupported active A11 run. Save preserved.');
  }
  function compatible(s) {
    const p = s.meta.productionGoal;
    return p === undefined || !!(window.ProductionGoal?.valid(p) && (!p.enabled || p.band === 0 && p.collection === 'authored' && p.manual === null && p.advance === false));
  }
  function earned(s) {
    return enabled && s.intro.done && s.chDone.smallcrew && s.meta.estate?.count >= 3 && s.legacy.ups.crew === 1 &&
      gold(s.meta.challengeMastery?.highest) && valid(config(s));
  }
  function selection(s) {
    validate(s);
    const c = config(s);
    if (!earned(s) || !c?.enabled || !c.disclosed || !same(c.selected,['smallcrew']) || active(s) || !compatible(s) || !integer(c.sequence + 1)) throw Error('A11 requires Estate 3, saved manual Gold, Veteran Crew and a supported enabled selection.');
    return {version:1,mode:'smallcrew-auto',rule:1,sequence:c.sequence+1,gold:copy(s.meta.challengeMastery.highest),config:JSON.stringify(c)};
  }
  function enter(s,selection,at) {
    const c = config(s), r = {version:1,rule:1,origin:'auto-challenge',id:`a11:e${s.meta.estate.resetEpoch}:${selection.sequence}`,sequence:selection.sequence,
      resetEpoch:s.meta.estate.resetEpoch,printing:s.printing,imprint:Layers.identity(s),gold:copy(selection.gold),phase:'producing',target:null,sold:[]};
    s.meta.automation.challenge = {...c,sequence:r.sequence,active:r};
    s.challenge = {id:'smallcrew',start:at,a11:r.id}; s.focus = null; s.autoFocus = true;
  }
  function outcome(s,p) {
    const c = config(s), r = c.active;
    if (p.action === 'focus') {r.target = p.title; s.focus = p.title; s.autoFocus = true;}
    if (p.action === 'sale') {
      r.sold.push(p.title); r.target = null; s.focus = null;
      c.receipt = {...c.receipt,id:p.id,sequence:p.sequence,amount:p.pay,run:r.id,resetEpoch:r.resetEpoch,runSequence:r.sequence,title:p.title};
      s.rewards.walletHead = {...c.receipt,origin:'challenge-sale'};
      if (r.sold.length === 6) {s.chDone = {...s.chDone,smallcrew:true}; s.challenge = null; r.phase = 'completed-awaiting-exit';}
    }
    if (['exit','abandon','continue'].includes(p.action)) {
      c.last = {...c.last,...copy(r),outcome:p.action === 'exit' ? 'completed' : p.action === 'abandon' ? 'abandoned' : 'manual',at:p.at};
      c.active = null; c.enabled = false;
      if (p.action === 'continue') {c.last.phase = 'manual-continuation'; delete s.challenge.a11;} else s.challenge = null;
    }
    if (p.action === 'settings') s.meta.automation.challenge = {...c,...p.fields};
    delete config(s).pending;
  }
  return Object.freeze({enabled,ids:Object.freeze(ids),config,active,gold,valid,validate,compatible,earned,selection,enter,outcome});
})();
