exec(open('tools/long-game/lg06a-edit.py',encoding='utf-8-sig').read().split("edit('ops.js'")[0])
edit('ops.js',"      crops:indices.map(i => S.garden.beds[i])};", """      crops:indices.map(i => S.garden.beds[i]),
      identities:indices.map(i => { const b = S.garden.beds[i]; return b ? [b.ch,b.desk,b.gardenToken ?? null] : null; }),
      config:origin === 'auto' ? JSON.stringify(S.meta.automation.garden) : null};""")
edit('ops.js',"S.garden.beds[i] !== p.crops[n]))", "S.garden.beds[i] !== p.crops[n] || JSON.stringify(p.identities[n]) !== JSON.stringify(S.garden.beds[i] ? [S.garden.beds[i].ch,S.garden.beds[i].desk,S.garden.beds[i].gardenToken ?? null] : null)))")
edit('ops.js',"      mark();\n    }\n    return {...result, amount:result.ok ? amount : 0};", "      if (p.action === 'plant' && p.origin === 'manual') IMI.sfx.tick();\n      mark();\n    }\n    return {...result, amount:result.ok ? amount : 0};")
edit('automation.js',"typeof g.manual.pending.token === 'string' &&", "typeof g.manual.pending.token === 'string' && g.manual.pending.token.length > 0 &&")
edit('automation.js',"          /^[A-Z]$/.test(g.manual.pending.letter)));", "          typeof g.manual.pending.letter === 'string' && /^[A-Z]$/.test(g.manual.pending.letter) &&\n          api.automationDesks().some(d => d.index === g.manual.pending.desk)));")
edit('automation.js',"return gardenUnlocked() && gardenSetting().enabled && (!gardenPending || gardenPending === request) && !pending", "return gardenUnlocked() && gardenSetting().enabled && (!request || request.config === JSON.stringify(saved().garden)) && (!gardenPending || gardenPending === request) && !pending")
edit('automation.js',"    else { pending = null; notice = ''; suspended.clear(); }", """    else {
      const gardenOff = suspended.has('garden') && !p.garden;
      pending = null; notice = ''; suspended.clear();
      if (gardenOff) suspended.add('garden');
    }""")
edit('automation.js',"    const progress = cfg.manual?.complete", "    const text = value => String(value).replace(/[&<>\"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', \"'\":'&#39;'}[c]));\n    const progress = cfg.manual?.complete")
edit('automation.js'," : gardenNotice || (on ? 'Waiting", " : text(gardenNotice) || (on ? 'Waiting")
