from pathlib import Path
import re

def edit(name, pairs):
    p = Path(name)
    raw = p.read_bytes()
    nl = b'\r\n' if b'\r\n' in raw else b'\n'
    for old, new in pairs:
        a, b = old.encode().replace(b'\n', nl), new.encode().replace(b'\n', nl)
        pattern = re.escape(old.encode()).replace(b'\\\n', b'\\r?\\n')
        matches = list(re.finditer(pattern, raw))
        if len(matches) != 1:
            raise RuntimeError(f'{name}: expected one match for {old[:90]!r}, got {len(matches)}')
        match = matches[0]
        local_nl = b'\r\n' if b'\r\n' in match[0] else b'\n'
        raw = raw[:match.start()] + new.encode().replace(b'\n',local_nl) + raw[match.end():]
    p.write_bytes(raw)

edit('vault.js',[("if (!object(v) || v.version !== 1) return fail('VAULT_VERSION', 'prem.vault');", "if (!object(v) || v.version !== 1) return fail('VAULT_VERSION', 'prem.vault');\n    if (own(v,'freeLamp') && (!object(v.freeLamp) || v.freeLamp.version !== 1 || v.freeLamp.rule !== 1 || Object.keys(v.freeLamp).length !== 2)) return fail('FREE_LAMP_VERSION','prem.vault.freeLamp');")])
for name in ['index.html','classic.html','tools/balance.html']:
    prefix = '../' if name.startswith('tools/') else ''
    p=Path(name); raw=p.read_bytes(); nl=b'\r\n' if b'\r\n' in raw else b'\n'
    old=f'<script src="{prefix}vault.js"></script>'.encode()
    assert raw.count(old)==1
    raw=raw.replace(old,b'')
    gate=f'<script src="{prefix}vault-save-gate.js"></script>'.encode()
    raw=raw.replace(gate,f'<script src="{prefix}vault.js"></script>'.encode()+nl+f'<script src="{prefix}vault-play.js"></script>'.encode()+nl+gate)
    p.write_bytes(raw)
edit('sw.js',[("const VERSION = 'imi-v73';","const VERSION = 'imi-v74';"),("'vault-save-gate.js', 'rewards.js', 'vault.js'","'vault-save-gate.js', 'rewards.js', 'vault.js', 'vault-play.js'")])
edit('vault-save-gate.js',[("let hall = false, seasons = false, awards = false;","let lamp = false, hall = false, seasons = false, awards = false;"),("""          blocked = true;
          const flags = new URLSearchParams(location.search);
          // Version recognition selects copy, never validates or admits Vault state.
          resume = object(state.prem.vault) && state.prem.vault.version === 1 &&
            (flags.get('lg01a') !== '1' || flags.get('lg02') !== '1');""","""          const flags = new URLSearchParams(location.search);
          lamp = !!window.VaultPlay?.supported(state);
          const admitted = lamp && VaultPlay.enabled();
          blocked = blocked || !admitted;
          resume = lamp && VaultPlay.isolated() && ['lg01a','lg02','lg02lamp'].some(k => flags.get(k) !== '1');"""),("if (blocked) {\n    document.documentElement.dataset.vaultBlocked", "if (blocked) {\n    document.documentElement.dataset.vaultBlocked" )])
# Resume remains sequential and same-edition; only the supported lamp branch gets the extra flag.
p=Path('vault-save-gate.js'); raw=p.read_bytes(); needle=b"url.searchParams.set('lg02', '1');"
assert raw.count(needle)==1
raw=raw.replace(needle,needle+b" if (lamp) url.searchParams.set('lg02lamp','1');")
p.write_bytes(raw)
edit('rewards.js',[("        owner = true;", """        if (window.VaultPlay && !VaultPlay.rawCheck(localStorage.getItem('imi-ops-v1'),localStorage.getItem('imi-score'))) {
          failed = true; startup.length = 0;
          return status('This save changed or cannot be opened safely. Your saved data has not been changed.');
        }
        owner = true;"""),("    if (owns() && localUnresolved()) {", """    if (owns() && !transactionRetry && !localIntent && window.VaultPlay?.enabled() && VaultPlay.pending(api?.state() || {})) lampAction({kind:'activate',purchaseId:VaultPlay.pending(state())});
    if (owns() && localUnresolved()) {"""),("  function hold(message) {\n    fault", """  let lampCapability = null, lifetimeLease = null, lifetimeSequence = 0;
  function hold(message) {
    if (window.VaultPlay?.enabled() && api && !lifetimeLease) {
      lifetimeLease = Object.freeze({id:++lifetimeSequence,mono:performance.now(),wall:Date.now()});
      api.lampHold(lifetimeLease);
    }
    fault"""),("        if (frame?.done) {\n          api.vaultComplete();", """        if (frame?.done) {
          api.vaultComplete();
          if (intent.command) return commitLamp(intent);"""),("    runLocalTransaction, localDisposition, boundaryProgressing", "    lampAction, lampReview, lampUndoable, lampStartup,\n    runLocalTransaction, localDisposition, boundaryProgressing"),("      if (localIntent) {\n        if (!continueLocal())", """      if (!localIntent && lifetimeLease && window.VaultPlay?.enabled()) {
        localIntent = {id:'boundary:lamp-recovery',settle:api.vaultBoundary,build:p=>p,continue:()=>{}};
      }
      if (localIntent) {
        if (!continueLocal())"""),("    afterRender,\n    actions:","    afterRender,\n    vaultClosed:() => { if(lifetimeLease) {api.lampRelease(lifetimeLease); lifetimeLease=null;} },\n    actions:")])
edit('rewards.js',[("  // Fixed media prepare/debit/finish only.","""  function lampReview() {
    if (!api || !owns() || busy || localIntent || volatile || fault || transactionRetry || !guard(state()) || !api.identitySettled()) throw Error('Finish waiting work before reviewing a purchase.');
    return VaultPlay.review(state());
  }
  function lampUndoable(id) {
    return owns() && lampCapability?.purchaseId === id && performance.now() < lampCapability.expiresMono;
  }
  function commitLamp(intent) {
    const c=intent.command;
    try {
      localCandidate(state());
      if (c.kind === 'reserve' && JSON.stringify(VaultPlay.review(state())) !== JSON.stringify(c.quote)) {
        localIntent=null; return {ok:false,refused:true,error:'The purchase review changed. Review it again.'};
      }
      const baseline=wallet().saveAcknowledged();
      if (!baseline.ok) return hold('Wallet baseline waiting to save. '+baseline.error);
      const result=transaction(()=>api.lampCommit(c,localCandidate));
      if (!result.ok) return hold((c.kind==='reserve'?'Purchase not saved. No Diamond Bananas spent. Retry to save this purchase.':c.kind==='refund'?'Undo not saved. Purchase is still saved. Retry to return 100 Diamond Bananas.':c.kind==='activate'?'Purchase saved. Upgrade not active yet. Retry to activate it.':'Store preference not saved. Retry to save it.')+' '+result.error);
      localIntent=null;
      if(c.kind==='reserve') {
        const purchaseId=VaultPlay.pending(state());
        lampCapability={purchaseId,expiresMono:performance.now()+10000};
        timers.setTimeout(()=>{if(owns()&&!transactionRetry&&!localIntent&&VaultPlay.pending(state())===purchaseId)lampAction({kind:'activate',purchaseId});},10000);
      } else if(c.kind==='refund'||c.kind==='activate') lampCapability=null;
      api.lampSaved(c);
      return result;
    } catch(error) {localIntent=null;return {ok:false,refused:true,error:error.message};}
  }
  function lampAction(request) {
    if (!window.VaultPlay?.enabled() || !api || !owns() || busy || fault || volatile || transactionRetry || localIntent || !object(request)) return {ok:false,refused:true,error:'Finish waiting saves first.'};
    const allowed={reserve:['kind','quote'],refund:['kind','purchaseId'],activate:['kind','purchaseId'],settings:['kind','hideStore']}[request.kind];
    if(!allowed || Object.keys(request).some(k=>!allowed.includes(k)) || !VaultPlay.supported(state(),true) || !guard(state())) return {ok:false,refused:true,error:'Unsupported lamp command.'};
    const command=clone(request), receipt=state().prem.vault?.purchases[command.purchaseId];
    if(receipt && receipt.status===(command.kind==='refund'?'refunded':command.kind==='activate'?'active':''))return {ok:true,duplicate:true};
    if(command.kind==='refund'&&!lampUndoable(command.purchaseId))return {ok:false,refused:true,error:'Undo ended. Keep the saved purchase.'};
    if(command.kind==='reserve') {try {if(JSON.stringify(lampReview())!==JSON.stringify(command.quote))throw Error('The purchase review changed. Review it again.');}catch(error){return {ok:false,refused:true,error:error.message};}}
    if(command.kind==='activate'&&receipt?.status!=='undoable')return {ok:false,refused:true,error:'No saved reservation.'};
    if(!window.IMI.ops.progression.running())return {ok:false,refused:true,error:'Progression paused.'};
    localIntent={id:'boundary:lamp-'+command.kind,command,settle:api.vaultBoundary,build:p=>p};
    return continueLocal();
  }
  function lampStartup() {
    if(!window.VaultPlay?.enabled()||!VaultPlay.pending(state()))return true;
    const id=VaultPlay.pending(state());
    // Startup owns all positive absence, independently of the welcome threshold.
    return lampAction({kind:'activate',purchaseId:id});
  }
  // Fixed media prepare/debit/finish only.""")])
