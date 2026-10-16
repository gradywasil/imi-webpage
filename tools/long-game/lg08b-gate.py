from pathlib import Path
p=Path('vault-save-gate.js');s=p.read_text(encoding='utf-8');s=s.replace('imprint = false, pitch', 'imprint = false, estate = false, pitch')
needle='      const cfg = object(state) && state.meta?.automation?.pitch;'
s=s.replace(needle,'''      const endowment = object(state) && state.meta?.estate;
      if (object(endowment) && own(endowment,'pending') && endowment.pending !== null) {
        estate = true;
        const flags = new URLSearchParams(location.search), p = endowment.pending;
        // Envelope only. Estate validates the exact source, successor and wallet before recovery.
        const known = endowment.version === 1 && object(p) && p.version === 1 &&
          typeof p.id === 'string' && p.id.startsWith('estate:') && object(p.quote) &&
          object(p.candidate) && p.candidate.meta?.estate?.version === 1 && Array.isArray(p.crew) &&
          ['balance','seed','at'].every(k => Number.isSafeInteger(p[k]) && p[k] >= 0) && own(p,'sourceEstate') && own(p,'marker') && own(p,'reward');
        const needsFlags = known && ['lg08estate','lg01a','lg05folio','lg05layers'].some(flag => flags.get(flag) !== '1');
        resume = resume || needsFlags;
        blocked = blocked || !known || needsFlags;
      }
'''+needle)
s=s.replace("title.textContent = media ?", "title.textContent = estate ? 'Estate recovery' : media ?")
s=s.replace("message.textContent = media ?", "message.textContent = estate ? (resume ? 'This save has an unfinished Estate. Resume with its recovery flags to finish safely.' : 'This unfinished Estate cannot be opened safely. Your saved data has not been changed.') : media ?")
s=s.replace("scope.textContent = media ?", "scope.textContent = estate ? 'Recovery stays on this local test origin. Other progression waits until the exact Estate and wallet replacement are settled.' : media ?")
s=s.replace("for (const flag of media || pitch ?", "for (const flag of estate ? ['lg08estate','lg01a','lg05folio','lg05layers'] : media || pitch ?")
p.write_text(s,encoding='utf-8',newline='\n')
p=Path('estate.js');s=p.read_text(encoding='utf-8-sig');s=s.replace("    const candidate = api.estateRoom(s), crew", "    if (s.meta.estate === undefined) Layers.initializeIdentity(s);\n    const candidate = api.estateRoom(s), crew")
s=s.replace("    const p = {version:1,", "    const at = Date.now(); candidate.lastSeen = at;\n    const p = {version:1,at,")
s=s.replace('    const intent = copy(s); intent.meta.estate', '    const intent = copy(s); intent.lastSeen = at; intent.meta.estate')
s=s.replace('!integer(p.seed) ||', '!integer(p.at) || !integer(p.seed) ||')
s=s.replace('    const expected = api.estateRoom(source); installStart(expected,p.crew);', '    const expected = api.estateRoom(source); expected.lastSeen = p.at; installStart(expected,p.crew);')
p.write_text(s,encoding='utf-8',newline='\n')
