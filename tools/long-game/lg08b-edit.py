from pathlib import Path
p=Path('layers.js'); s=p.read_text(encoding='utf-8')
s=s.replace("!integer(e.resetEpoch))", "!integer(e.resetEpoch) || ['count','starBaseline','charters'].some(k => e[k] !== undefined && !integer(e[k])))")
s=s.replace('function project(s, fresh) {\n    const q = quote(s), next = copy(s), l = current(s);','function projectRoom(s, fresh) {\n    const next = copy(s);')
a=s.index('    const estate = advanceIdentity(s, true);',s.index('function projectRoom')); b=s.index('    if (next.meta.productionGoal)',a)
foundation=s[a:b]; s=s[:a]+s[b:]
s=s.replace('imprint:l.count + 1, printing:0','imprint:identity(next), printing:0')
pos=s.index('  function proposal(s, request)')
s=s[:pos]+'''  function project(s, fresh) {
    const q = quote(s), l = current(s), next = projectRoom(s, fresh);
'''+foundation+'''    if (next.meta.folio) next.meta.folio = {...next.meta.folio, ...epochFields(next), imprint:l.count + 1};
    return next;
  }
'''+s[pos:]
s=s.replace('Imprints founded: ${l.count}.','Lifetime Imprints founded: ${l.count}. Local Imprints: ${estateIdentity(s)?.localImprints ?? l.count}.')
s=s.replace('charter, quote, project, proposal','charter, settled, quote, projectRoom, project, proposal')
p.write_text(s,encoding='utf-8',newline='\n')
p=Path('ops.js'); s=p.read_text(encoding='utf-8')
s=s.replace('!S.meta?.layers?.pending &&','!S.meta?.layers?.pending && !S.meta?.estate?.pending &&')
s=s.replace('  function layerPreview() {\n    const quote = layers.quote(S), room = layers.project(S, fresh()), d = room.desks[0];','  function startingRoom(room) {\n    const d = room.desks[0];')
s=s.replace("    const reward = S.rewards.claims['layer:imprint:first'] ? null : writer.layerReward({desk:0, letters:[rate], speed:multiplier});\n    return layerOffer = {quote, room, legacy:JSON.stringify(S.legacy), seed:cash([0,1000,10000,100000][room.legacy.ups.seed || 0]), reward};", "    return {room, basis:{desk:0, letters:[rate], speed:multiplier}, seed:cash([0,1000,10000,100000][room.legacy.ups.seed || 0])};\n  }\n  function layerPreview() {\n    const quote = layers.quote(S), start = startingRoom(layers.project(S, fresh()));\n    const reward = S.rewards.claims['layer:imprint:first'] ? null : writer.layerReward(start.basis);\n    return layerOffer = {...start, quote, legacy:JSON.stringify(S.legacy), reward};")
s=s.replace('function layerRuntimeReset() {','function layerRuntimeReset(tab = \'imprints\') {').replace("mcd:{}, tab:'imprints', nextCh:''", "mcd:{}, tab, nextCh:''")
needle='    ...(layers?.enabled ? {\n      layerPreview,'
insert='''    ...(window.Estate?.enabled ? {
      estatePreview() {
        const quote = Estate.quote(S), start = startingRoom(Estate.project(S, fresh()));
        return Estate.review(S, {...start, quote, reward:S.rewards.claims['layer:estate:first'] ? null : writer.estateReward(start.basis)});
      },
      estateCommit(request) {
        if (!writer?.owns() || !writer.transacting() || window.VaultSaveGate?.blocked || writer.localDisposition()) return {ok:false,refused:true,error:'Estate owner unavailable'};
        try {
          const candidate = request.action === 'reset' ? Estate.prepare(S,request) : Estate.pending(S).candidate;
          const result = Economy.saveStateAcknowledged(candidate);
          if (result.ok) {
            S = candidate;
            if (request.action === 'finish') { Estate.clearReview(); layerRuntimeReset('estate'); }
            mark();
          }
          return result;
        } catch(error) { return {ok:false,refused:true,error:error.message}; }
      },
      estateRoom:source => Estate.project(source, fresh(), true)
    } : {}),
'''
s=s.replace(needle,insert+needle)
p.write_text(s,encoding='utf-8',newline='\n')
