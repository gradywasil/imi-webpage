from pathlib import Path

def edit(file,old,new):
 p=Path(file); b=p.read_bytes(); newline='\r\n' if b.count(b'\r\n')==b.count(b'\n') else '\n'
 old=old.replace('\n',newline).encode(); new=new.replace('\n',newline).encode()
 assert b.count(old)==1,(file,old[:100],b.count(old))
 p.write_bytes(b.replace(old,new))

edit('ops.js','!S.meta?.automation?.challenge?.pending && !S.meta?.challengeMastery?.pending','!S.meta?.commissionBoard?.pending && !S.meta?.automation?.challenge?.pending && !S.meta?.challengeMastery?.pending')
edit('ops.js','    challengeEnabled, challengeValidate, challengeReady, challengePending, challengeFreeze, challengeCommit,','    boardEnabled, boardNames, boardFreeze, boardPending, boardCommit,\n    challengeEnabled, challengeValidate, challengeReady, challengePending, challengeFreeze, challengeCommit,')
edit('ops.js',"    challengeBeforeSale(S,r);\n    if (fromEl)","    if (boardEnabled() && !opts.auto && !opts.silent && CommissionBoard.current(S)?.active?.status === 'active' && CommissionBoard.eligible(r) && !S.challenge && !workPaused()) {\n      const action = CommissionBoard.observed(S) >= CommissionBoard.current(S).active.expiresAt ? 'expire' : 'sale';\n      const result = writer.boardAction({action,...(action === 'sale' ? {id} : {})});\n      if (action === 'sale' || !result.ok) return result;\n    }\n    challengeBeforeSale(S,r);\n    if (fromEl)")
edit('ops.js','${shelfHTML()}</div>`;','${shelfHTML()}</div>${boardEnabled() ? \'<div id="lg09g-board"></div>\' : \'\'}`;')
block=r'''  // These commands freeze only the board's reviewed choice or actual manual sale.
  const boardEnabled = () => !!writer && window.CommissionBoard?.enabled;
  const boardNames = () => CommissionBoard.ids.map(id => RBY[id]).filter(r => CommissionBoard.eligible(r) && titleAvailable(r) && !S.written[r.id]).map(r => r.title);
  let boardIntent = null;
  function boardReady(action) {
    if (!boardEnabled() || !writer.owns() || !progressing() || !writer.guard(S) || writer.held() || writer.localDisposition() ||
        !challengeSettled() || !extensionAPI.identitySettled() || workPaused() || S.meta.folio?.working || S.meta.archive?.working ||
        S.meta.folio?.pending || S.meta.automation?.print?.pending || trainingPool?.mode() === 'suspended' ||
        document.hidden || IMI.screen() !== 'game' || IMI.tour?.active() || document.querySelector('.mg01-overlay, .o-modal, .o-celebrate, .set-pop:not([hidden])') ||
        ['start','sale'].includes(action) && (S.challenge || masteryActive() || challengeActive())) throw Error('Commission waits for visible ordinary play and settled saves and work.');
  }
  function boardPending() {
    CommissionBoard.validate(S);
    const p = S.meta.commissionBoard?.pending;
    if (!boardEnabled() || !p) throw Error('Commission owner unavailable.');
    const source = pitchCopy(S); delete source.meta.commissionBoard.pending;
    if (p.absent) delete source.meta.commissionBoard;
    if (printingSource(source) !== p.source) throw Error('Commission source changed. Save preserved.');
    CommissionBoard.assertChoice(source,p,boardNames());
    if (p.action === 'sale' || p.action === 'claim') {
      const a = CommissionBoard.current(source).active;
      if (p.id !== `board-${p.action}:${a.sequence}` || !printInteger(p.previous) || p.sequence !== p.previous+1 ||
          ![p.sequence,p.balance,p.pay,p.balance+p.pay,source.run.earned+p.pay].every(printInteger) || !p.pay || p.pay % Economy.scale) throw Error('Invalid Commission payment.');
      if (p.action === 'sale') {
        const r=RBY[p.title];
        if (source.challenge || !CommissionBoard.eligible(r) || !canWrite(r) || !pitchSame(p.recipe,[r.title,r.text,r.pay]) || !pitchSame(p.need,r.need) ||
            !Number.isFinite(p.mult) || p.mult < .5 || p.mult > 2 || !Array.isArray(p.muses) || p.muses.some(id => !MUSES.some(m => m.id===id)) ||
            p.pay !== salePay(r,p.mult,id => p.muses.includes(id)) || !printInteger(source.stats.lump+p.pay)) throw Error('Commission reader or price changed.');
      } else if (p.pay !== a.descriptor.amount || !pitchSame(p.descriptor,a.descriptor)) throw Error('Commission bonus changed.');
      const marker=bananas.acknowledgement(), paid=marker?.id===p.id && marker.sequence===p.sequence && marker.amount===p.pay;
      if (!paid && !pitchSame(marker,p.marker) || bananas.get() !== p.balance+(paid?p.pay:0)) throw Error('Commission wallet baseline changed.');
    }
    return p;
  }
  function boardFreeze(request) {
    boardReady(request.action);
    if (!archiveSettle()) throw Error('Archive income waiting to save.');
    boardReady(request.action);
    const a=CommissionBoard.current(S)?.active, action=request.action, at=CommissionBoard.observed(S);
    let p={version:1,action,at,run:a?.id ?? null,source:printingSource(S),absent:S.meta.commissionBoard===undefined};
    if (action==='start') {
      const quote=CommissionBoard.descriptor(rewardBasis());
      if (!pitchSame(quote,request.quote)) throw Error('Income changed. Review the current bonus again.');
      p.descriptor=quote;
    }
    CommissionBoard.assertChoice(S,p,boardNames());
    if (action==='sale' || action==='claim') {
      const marker=bananas.acknowledgement(), previous=marker?.sequence ?? 0;
      p={...p,id:`board-${action}:${a.sequence}`,previous,sequence:previous+1,marker,balance:bananas.get()};
      if(action==='sale') {
        const r=RBY[request.id];
        if(!CommissionBoard.eligible(r) || !canWrite(r) || !challengeSaleAllowed(r)) throw Error('An eligible book must be ready for a manual sale.');
        const mult=marketMult(r.band);
        p={...p,title:r.id,need:pitchCopy(r.need),recipe:[r.title,r.text,r.pay],mult,pay:salePay(r,mult),muses:MUSES.filter(m=>museOn(m.id)).map(m=>m.id)};
      } else {p.pay=a.descriptor.amount;p.descriptor=pitchCopy(a.descriptor);}
    }
    const candidate=pitchCopy(S); candidate.meta.commissionBoard ??= CommissionBoard.fresh(); candidate.meta.commissionBoard.pending=p;
    const live=S; try {S=candidate;boardPending();} finally {S=live;}
    boardIntent=candidate;
  }
  function boardCommit(action) {
    if (!writer?.owns() || !writer.transacting() || !boardEnabled() || writer.localDisposition() || window.VaultSaveGate?.blocked) return {ok:false,error:'Commission owner unavailable.'};
    try {
      let candidate,p;
      if(action==='prepare') {
        if(!boardIntent || printingSource(S)!==boardIntent.meta.commissionBoard.pending.source) throw Error('Commission changed before intent save.');
        candidate=boardIntent;
      } else if(action==='finish') {
        p=boardPending(); candidate=pitchCopy(S);
        if(p.action==='sale' || p.action==='claim') {
          const marker=bananas.acknowledgement();
          if(marker?.id!==p.id || marker.sequence!==p.sequence || marker.amount!==p.pay) throw Error('Commission payment is not acknowledged.');
          candidate.run.earned+=p.pay;
          if(p.action==='sale') {
            for(const w in p.need){candidate.bank[w]-=p.need[w];if(candidate.bank[w]<=0)delete candidate.bank[w];}
            candidate.written[p.title]=true;candidate.stats.lump+=p.pay;candidate.stats.bestMult=Math.max(candidate.stats.bestMult||0,p.mult);
            pg?.clearManual(candidate,p.title);if(candidate.focus===p.title)candidate.focus=null;
          }
        }
        CommissionBoard.outcome(candidate,p,CommissionBoard.observed(S));
      } else throw Error('Unknown Commission phase.');
      candidate.lastSeen=Date.now(); CommissionBoard.validate(candidate);
      const result=Economy.saveStateAcknowledged(candidate);if(!result.ok)return result;
      S=candidate;boardIntent=null;
      if(p?.action==='sale'){bankV++;dropCaches();introProgress();pickAutoFocus();salePublished(RBY[p.title],p.pay,p.mult,null,{});}
      mark();return {ok:true,status:p?'acknowledged':'prepared'};
    }catch(error){return {ok:false,error:error.message};}
  }

'''
edit('ops.js','  const challengeEnabled = () =>',block+'  const challengeEnabled = () =>')
edit('rewards.js','    api?.masteryValidate(candidate); api?.challengeValidate(candidate);','    api?.masteryValidate(candidate); api?.challengeValidate(candidate); window.CommissionBoard?.validate(candidate);')
edit('rewards.js',"['away','pitch-sale','archive','mastery-sale','challenge-sale'].includes", "['away','pitch-sale','archive','mastery-sale','challenge-sale','board-sale','board-claim'].includes")
edit('rewards.js',"!(r.walletHead.origin === 'challenge-sale' ?", "!(r.walletHead.origin.startsWith('board-') ? ['id','sequence','amount','origin'].every(k => candidate.meta.commissionBoard?.[r.walletHead.origin === 'board-sale' ? 'receipt' : 'lastClaim']?.[k] === r.walletHead[k]) : r.walletHead.origin === 'challenge-sale' ?")
edit('rewards.js','return !volatile && !fault && !writing && !candidate.meta.automation?.challenge?.pending','return !volatile && !fault && !writing && !boardWaiting && !candidate.meta.commissionBoard?.pending && !candidate.meta.automation?.challenge?.pending')
block=r'''  let boardWaiting = false;
  function boardWrite(action) {
    const result=transaction(()=>api.boardCommit(action));
    if(!result.ok)hold('Commission waiting to save. Retry the exact command. '+result.error);
    return result;
  }
  function continueBoard() {
    try {
      if(!state().meta.commissionBoard?.pending) {
        const baseline=wallet().saveAcknowledged();
        if(!baseline.ok){hold('Commission wallet baseline waiting. '+baseline.error);return baseline;}
        const prepared=boardWrite('prepare');if(!prepared.ok)return prepared;
      }
      const p=api.boardPending();
      if(p.action==='sale' || p.action==='claim') {
        const paid=wallet().creditReward({id:p.id,previous:p.previous,sequence:p.sequence,amount:p.pay});
        if(!paid.ok){hold('Commission payment waiting. '+paid.error);return paid;}
      }
      const result=boardWrite('finish');if(result.ok)boardWaiting=false;return result;
    }catch(error){hold(error.message);return {ok:false,error:error.message};}
  }
  function boardAction(request) {
    if(!api?.boardEnabled() || !owns() || busy || volatile || fault || transactionRetry || localUnresolved() ||
        !window.IMI.ops.progression.running() || !guard(state()) || !object(request) ||
        !['start','abandon','expire','sale','claim'].includes(request.action) || Object.keys(request).some(k=>!['action','id','quote'].includes(k)) ||
        request.id!==undefined && request.action!=='sale' || request.quote!==undefined && request.action!=='start') return {ok:false,refused:true,error:'Finish waiting saves before the Commission.'};
    try {api.boardFreeze(request);}catch(error){return {ok:false,refused:true,error:error.message};}
    boardWaiting=true;return continueBoard();
  }

'''
edit('rewards.js','  let challengeWaiting = false;',block+'  let challengeWaiting = false;')
edit('rewards.js','  function reconcile() {','  function reconcile() {\n    if (state().meta.commissionBoard?.pending && !continueBoard().ok) return false;')
edit('rewards.js','    busy = true; fault = null;\n    try {','    busy = true; fault = null;\n    try {\n      if ((boardWaiting || state().meta.commissionBoard?.pending) && !continueBoard().ok) return false;')
edit('rewards.js','    guard, retry, challengeAction,','    guard, retry, boardAction, challengeAction,')
edit('vault-save-gate.js','challenge = false, estate = false','challenge = false, board = false, estate = false')
block=r'''      const boardRecord = object(state) && state.meta?.commissionBoard;
      if (boardRecord !== undefined) {
        const known = object(boardRecord) && boardRecord.version === 1 && Number.isSafeInteger(boardRecord.sequence) && boardRecord.sequence >= 0;
        if (!known || boardRecord.pending != null) {
          board = true;
          const p=boardRecord?.pending, flags=new URLSearchParams(location.search);
          const envelope=known && object(p) && p.version===1 && ['start','abandon','expire','sale','claim'].includes(p.action) && typeof p.source==='string';
          const missing=envelope && ['lg09board','lg01a'].some(k=>flags.get(k)!=='1');
          resume=resume||missing;blocked=blocked||!envelope||missing;
        }
      }
'''
edit('vault-save-gate.js','      const print = object(state)',block+'      const print = object(state)')
edit('vault-save-gate.js',"title.textContent = challenge ?", "title.textContent = board ? 'Commission recovery' : challenge ?")
edit('vault-save-gate.js',"message.textContent = challenge ?", "message.textContent = board ? (resume ? 'Resume the Commission board to finish its exact saved command.' : 'This Commission record cannot be opened safely. Your saved data is preserved.') : challenge ?")
edit('vault-save-gate.js',"scope.textContent = challenge ?", "scope.textContent = board ? 'Production waits for the saved command and payment. Retry keeps the original deadline and completion day.' : challenge ?")
edit('vault-save-gate.js',"for (const flag of challenge ?", "for (const flag of board ? ['lg09board','lg01a'] : challenge ?")
for f in ['index.html','classic.html','tools/balance.html']:
 prefix='../' if f.startswith('tools/') else ''
 edit(f,f'<script src="{prefix}ops.js"></script>',f'<script src="{prefix}commission-board.js"></script>\n'+f'<script src="{prefix}ops.js"></script>')
 if not f.startswith('tools/'):
  edit(f,'<link rel="stylesheet" href="ops.css">','<link rel="stylesheet" href="ops.css">\n  <link rel="stylesheet" href="commission-board.css">')
edit('sw.js',"'imi-v68'","'imi-v69'")
edit('sw.js',"'works.js',", "'commission-board.js', 'commission-board.css', 'works.js',")
