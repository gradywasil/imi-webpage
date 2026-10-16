from pathlib import Path

def edit(name,fn):
 p=Path(name); s=p.read_bytes().decode('utf-8'); nl='\r\n' if '\r\n' in s else '\n'; s=s.replace('\r\n','\n'); p.write_bytes(fn(s).replace('\n',nl).encode('utf-8'))
def rep(s,a,b):
 assert a in s,a[:100]; return s.replace(a,b)

def ops(s):
 s=rep(s,'  const folioGoal = () => folio?.goal(S);', '''  const archive = window.Archive;
  const titleAvailable = r => !archive || archive.available(S,r);
  const folioGoal = () => archive?.goal(S) || folio?.goal(S);
  let archiveSpans = [];
  function archiveSettle() {
    if (!archive?.enabled || S.meta.archive === undefined) return true;
    return writer.archiveIncome().ok;
  }''')
 s=rep(s,'!S.meta?.estate?.pending &&','!S.meta?.estate?.pending && !S.meta?.archive?.pending &&')
 s=rep(s,"    if (!writer.guard(S)) return", "    if (!archiveSettle()) return {ok:false,error:'Archive income waiting to save'};\n    if (!writer.guard(S)) return")
 s=rep(s,'const focusRecipe = () => folioGoal() || (S.focus && !S.written[S.focus]', 'const focusRecipe = () => folioGoal() || (S.focus && titleAvailable(RBY[S.focus] || {}) && !S.written[S.focus]')
 s=rep(s,'if (S.written[r.id] || !inPlay(r)', 'if (!titleAvailable(r) || S.written[r.id] || !inPlay(r)')
 s=rep(s,'byId: RBY, inPlay, bandOf','byId: RBY, available:titleAvailable, inPlay, bandOf')
 s=rep(s,"if (folioGoal()) return 'Publisher paused while working on Folio.';", "if (folioGoal()) return 'Publisher paused while working on Folio or Archive restoration.';")
 s=rep(s,'const canWrite = r => !S.written[r.id]', 'const canWrite = r => titleAvailable(r) && !S.written[r.id]')
 s=rep(s,'const r = RBY[el.dataset.id]; if (pg?.active(pgContext))', 'const r = RBY[el.dataset.id]; if (!r || !titleAvailable(r)) return; if (pg?.active(pgContext))')
 s=rep(s,"${foc || lock !== undefined ? 'disabled' : ''}","${foc || lock !== undefined || !titleAvailable(r) ? 'disabled' : ''}")
 s=rep(s,'${done ? \'\' : `<div class="o-chips">${chipsFor(r)}</div>`}', '${!titleAvailable(r) ? \'<p class="o-warn">Archived, retire entry to resume sales</p>\' : \'\'}${done ? \'\' : `<div class="o-chips">${chipsFor(r)}</div>`}')
 s=rep(s,"    const quote = layers.quote(S), start", "    if (!archiveSettle()) throw Error('Archive income is waiting to save.');\n    const quote = layers.quote(S), start")
 s=rep(s,'    const gain = starsNow(); if (gain < 1) return;', "    if (!archiveSettle()) return;\n    try { archive?.retained(S); } catch { return; }\n    const gain = starsNow(); if (gain < 1) return;")
 s=rep(s,'    S = f; pg?.clearManual(S);','    S = f; if (S.meta.archive) S.meta.archive = {...S.meta.archive,working:null}; pg?.clearManual(S);')
 s=rep(s,'        const quote = Estate.quote(S), start', "        if (!archiveSettle()) throw Error('Archive income is waiting to save.');\n        const quote = Estate.quote(S), start")
 s=rep(s,"'roy','div','bulk','complete'", "'roy','div','archive','bulk','complete'")
 # Only enabled Archive inserts a new phase; default checkpoint bytes/behavior stay identical.
 s=rep(s,"writer.awayCredit(rep.div, 'bulk')", "writer.awayCredit(rep.div, archive?.enabled && S.meta.archive !== undefined ? 'archive' : 'bulk')")
 s=rep(s,"else if (cp) cp.phase = 'bulk';\n    }\n    S.stats.awayMax", "else if (cp) cp.phase = archive?.enabled && S.meta.archive !== undefined ? 'archive' : 'bulk';\n    }\n    if (cp?.phase === 'archive' && !writer.archiveIncome().ok) return;\n    S.stats.awayMax")
 s=rep(s,'      royAcc += (rr + dr) * paidSeconds; royClock += dt;', '''      if (archive?.enabled && S.meta.archive !== undefined) {
        const end = Math.max(Date.now(), S.meta.archive.through, archiveSpans.at(-1)?.end || 0);
        const start = Math.max(S.meta.archive.through, archiveSpans.at(-1)?.end || end - realDt * 1000);
        // Real productive dt is already speed-scaled once; wall time only selects the age stage.
        archiveSpans.push({start,end:Math.max(end,start + .001),seconds:dt});
        if (archiveSpans.length >= 100 && !archiveSettle()) return;
      }
      royAcc += (rr + dr) * paidSeconds; royClock += dt;''')
 anchor='    ...(window.Estate?.enabled ? {'
 block='''    ...(archive?.enabled ? {
      archiveSettle,
      archiveCommit(request) {
        if (!writer?.owns() || !writer.transacting() || window.VaultSaveGate?.blocked || writer.localDisposition()) return {ok:false,error:'Archive save owner unavailable'};
        try {
          let candidate;
          if (request.action === 'income') {
            const cp = S.rewards.awayCheckpoint;
            let interval;
            if (cp?.phase === 'archive') {
              const start = Math.max(cp.nowMs - cp.awaySec * 1000,S.meta.archive.through), end = Math.max(start,cp.nowMs - cp.awaySec * 1000 + cp.sec * 1000);
              interval = {observed:cp.nowMs,spans:end > start ? [{start,end,seconds:(end-start)/1000*cp.multiplier*cp.eff}] : []};
            } else if (archiveSpans.length) interval = {observed:Math.ceil(Math.max(Date.now(),archiveSpans.at(-1).end)),spans:archiveSpans};
            else return {ok:true,empty:true};
            candidate = {...S,meta:{...S.meta,archive:archive.prepare(S,interval,bananas.acknowledgement())}};
          } else if (request.action === 'incomeFinish') {
            const p = archive.pending(S), a = p.next;
            candidate = {...S,meta:{...S.meta,archive:a},rewards:pitchCopy(S.rewards),run:{...S.run,earned:S.run.earned+(p.credit?.amount || 0)}};
            if (p.credit) candidate.rewards.walletHead = {id:p.credit.id,sequence:p.credit.sequence,amount:p.credit.amount,origin:'archive'};
            if (candidate.rewards.awayCheckpoint?.phase === 'archive') candidate.rewards.awayCheckpoint.phase = 'bulk';
          } else candidate = archive.proposal(S,request);
          candidate.lastSeen = S.rewards.awayCheckpoint ? S.lastSeen : Math.max(S.lastSeen,Date.now());
          const result = Economy.saveStateAcknowledged(candidate);
          if (result.ok) {
            S = candidate;
            if (request.action === 'incomeFinish') archiveSpans = [];
            bankV++; mark();
          }
          return result;
        } catch(error) {return {ok:false,refused:true,error:error.message};}
      }
    } : {}),
'''
 s=rep(s,anchor,block+anchor)
 return s
edit('ops.js',ops)

def rewards(s):
 s=rep(s,"!['away','pitch-sale'].includes(r.walletHead.origin)","!['away','pitch-sale','archive'].includes(r.walletHead.origin)")
 s=rep(s,"r.walletHead.origin === 'away' ?", "r.walletHead.origin === 'archive' ? r.walletHead.id.startsWith('archive:') : r.walletHead.origin === 'away' ?")
 s=rep(s,"'roy','div','bulk','complete'","'roy','div','archive','bulk','complete'")
 s=rep(s,'!candidate.meta.estate?.pending &&','!candidate.meta.estate?.pending && !candidate.meta.archive?.pending &&')
 block='''  // The only Archive payment is the fixed interval supplied by its actual Ops owner.
  let archiveWaiting = null;
  function archiveWrite(request) {
    const result = transaction(() => api.archiveCommit(request));
    if (!result.ok && !result.refused) hold('Archive waiting to save. Retry the same action. ' + result.error);
    return result;
  }
  function finishArchive() {
    try {
      const p = window.Archive.pending(state());
      if (p.credit) {
        const paid = wallet().creditReward(p.credit);
        if (!paid.ok) {hold('Archive income waiting for wallet acknowledgement. ' + paid.error);return paid;}
      }
      const result = archiveWrite({action:'incomeFinish'});
      if (!result.ok) hold(result.error);
      return result;
    } catch(error) {hold(error.message);return {ok:false,error:error.message};}
  }
  function archiveIncome() {
    if (!window.Archive?.enabled || !api || !owns()) return {ok:false,error:'Archive income owner unavailable'};
    if (state().meta.archive === undefined) return {ok:true,empty:true};
    if (state().meta.archive.pending) return finishArchive();
    if (fault || volatile || localUnresolved()) return {ok:false,error:'Finish waiting recovery first'};
    const baseline = wallet().saveAcknowledged();
    if (!baseline.ok) {hold('Archive wallet baseline waiting to save. ' + baseline.error);return baseline;}
    const result = archiveWrite({action:'income'});
    if (result.refused) hold(result.error);
    return result.ok && !result.empty ? finishArchive() : result;
  }
  function archiveAction(request) {
    if (!window.Archive?.enabled || !api || !owns() || busy || fault || volatile || transactionRetry || localUnresolved() ||
        !window.IMI.ops.progression.running() || !guard(state())) return {ok:false,error:'Finish waiting saves before using Archive.'};
    try {
      window.Archive.proposal(state(),request);
      archiveWaiting = clone(request);
      const result = archiveWrite(archiveWaiting);
      if (result.ok || result.refused) archiveWaiting = null;
      return result;
    } catch(error) {return {ok:false,error:error.message};}
  }
'''
 s=rep(s,'  let imprintChallengeWaiting = null;',block+'  let imprintChallengeWaiting = null;')
 s=rep(s,'  function reconcile() {','  function reconcile() {\n    if (state().meta.archive?.pending && !finishArchive().ok) return false;')
 s=rep(s,'      if (estateWaiting || state().meta.estate?.pending)', '''      if (state().meta.archive?.pending && !finishArchive().ok) return false;
      if (archiveWaiting) {const result = archiveWrite(archiveWaiting);if(!result.ok && !result.refused)return false;archiveWaiting=null;}
      if (estateWaiting || state().meta.estate?.pending)''')
 s=rep(s,'guard, retry, estateAction','guard, retry, archiveAction, archiveIncome, estateAction')
 return s
edit('rewards.js',rewards)

def pg(s):
 s=rep(s,'const members = (c, p) => c.recipes.filter(r => member(r, p));', 'const members = (c, p) => c.recipes.filter(r => member(r, p) && c.available(r));')
 s=rep(s,'const eligible = (c, r) => c.inPlay(r)', 'const eligible = (c, r) => c.available(r) && c.inPlay(r)')
 s=rep(s,'p.manual && c.byId[p.manual] && !s.written[p.manual]', 'p.manual && c.byId[p.manual] && eligible(c,c.byId[p.manual]) && !s.written[p.manual]')
 s=rep(s,"const allowsSale = (c, r) => !active(c) ||", "const allowsSale = (c, r) => c.available(r) && (!active(c) ||")
 s=rep(s,'member(r, raw(c));','member(r, raw(c)));')
 s=rep(s,'const set = members(c, p), left', 'const excluded = c.recipes.filter(r => member(r,p) && !c.available(r)).length;\n    const set = members(c, p), left')
 s=rep(s,"!set.length ? 'No titles in this set'", "!set.length ? excluded ? 'All titles archived' : 'No titles in this set'")
 s=rep(s,'${set.length - left.length}/${set.length} sold', '${set.length - left.length}/${set.length} sold, ${excluded} archived excluded')
 return s
edit('production-goal.js',pg)
edit('folio.js',lambda s:rep(s,"if (action === 'work') f.working = true;", "if (action === 'work') { if (s.meta.archive?.working != null) fail('Return from Archive restoration first.'); f.working = true; }"))
edit('layers.js',lambda s:rep(rep(rep(s,'    estateIdentity(s);\n    if (s.meta.folio?.pending', '    estateIdentity(s);\n    window.Archive?.retained(s);\n    if (s.meta.folio?.pending'), '    if (window.IMI.ops.extensions.layerSettled', '    window.Archive?.retained(s);\n    if (window.IMI.ops.extensions.layerSettled'), '    if (next.meta.productionGoal)', '    if (next.meta.archive) next.meta.archive = {...next.meta.archive,working:null};\n    if (next.meta.productionGoal)'))
edit('estate.js',lambda s:rep(s,'<p>Archive curation is the next slice. Charters stay saved until then.</p>', "${window.Archive?.enabled && e.count > 0 ? button('archive','Open Archive') : '<p>Archive opens after the first Estate with its development flag.</p>'}").replace("actions:{review:preview,back:","actions:{archive:() => api.setTab('archive'),review:preview,back:"))
for f in ['index.html','classic.html','tools/balance.html']:
 edit(f,lambda s:rep(s,'<script src="'+('../' if f.startswith('tools/') else '')+'estate.js"></script>','<script src="'+('../' if f.startswith('tools/') else '')+'estate.js"></script>\n<script src="'+('../' if f.startswith('tools/') else '')+'archive.js"></script>'))
edit('sw.js',lambda s:rep(rep(s,"imi-v60","imi-v61"),"'estate.js',","'archive.js', 'estate.js',"))

def gate(s):
 s=rep(s,'estate = false, pitch', 'estate = false, archive = false, pitch')
 s=rep(s,'      const cfg = object(state)', '''      const a = object(state) && state.meta?.archive;
      if (object(a) && own(a,'pending') && a.pending !== null) {
        archive = true;
        const p = a.pending, flags = new URLSearchParams(location.search);
        const known = a.version === 1 && object(p) && p.version === 1 && typeof p.id === 'string' && p.id.startsWith('archive:') &&
          Number.isSafeInteger(p.resetEpoch) && p.resetEpoch >= 0 && object(p.interval) && object(p.next) && p.next.version === 1 && own(p,'credit');
        const needsFlags = known && ['lg08archive','lg08estate','lg01a','lg05folio','lg05layers'].some(flag => flags.get(flag) !== '1');
        resume = resume || needsFlags; blocked = blocked || !known || needsFlags;
      }
      const cfg = object(state)''')
 s=rep(s,"estate ? 'Estate recovery'", "archive ? 'Archive income recovery' : estate ? 'Estate recovery'")
 s=rep(s,"message.textContent = estate ?", "message.textContent = archive ? (resume ? 'Resume Archive with its recovery flags to settle the saved income interval.' : 'This Archive income intent cannot be opened safely. Saved data is preserved.') : estate ?")
 s=rep(s,"scope.textContent = estate ?", "scope.textContent = archive ? 'Production waits for the exact saved Archive income payment.' : estate ?")
 s=rep(s,"for (const flag of estate ?", "for (const flag of archive ? ['lg08archive','lg08estate','lg01a','lg05folio','lg05layers'] : estate ?")
 return s
edit('vault-save-gate.js',gate)
