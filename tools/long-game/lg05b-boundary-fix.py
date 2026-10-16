from pathlib import Path
exec(Path('tools/long-game/lg05b-wire.py').read_text().split("edit('rewards.js'")[0])
edit('ops.js', '  let layerOffer = null;', '''  let layerOffer = null;
  const layerChoices = new Set();
  function layerChoiceResult(kind, result) {
    if (layers?.enabled) { if (result.ok) layerChoices.delete(kind); else layerChoices.add(kind); }
    return result;
  }''')
edit('ops.js', '      layerPreview,', '''      layerPreview,
      layerSettled:() => !layerChoices.size && trainingPool?.mode() !== 'suspended' &&
        !document.querySelector('.mg01-overlay') && (!pg || S.meta.productionGoal === undefined || pg.valid(S.meta.productionGoal)) &&
        (!extensions.get('automation') || extensions.get('automation').validConfig(S.meta.automation)),''')
# Track only failures of existing acknowledged preference writes, so founding cannot discard an unsaved choice.
p=Path('ops.js'); t=p.read_bytes().decode(); lines=t.splitlines(keepends=True)
for i,line in enumerate(lines):
 if 'const result = Economy.saveStateAcknowledged(' not in line: continue
 if 'productionGoal }, focus' in line: kind='productionGoal'
 elif 'trainingPool }, lastSeen' in line: kind='trainingPool'
 elif 'automation }, lastSeen' in line or 'automation }, legacy' in line: kind='automation'
 elif 'minigames }, lastSeen' in line: kind='minigames'
 else: continue
 lines[i]=line.replace('Economy.saveStateAcknowledged(',f"layerChoiceResult('{kind}', Economy.saveStateAcknowledged(").replace(');\r\n', '));\r\n')
p.write_bytes(''.join(lines).encode())
edit('layers.js', '    if (s.challenge ||', "    if (window.IMI.ops.extensions.layerSettled && !window.IMI.ops.extensions.layerSettled()) throw Error('Finish the waiting production, training, helper or Break Room choice first.');\n    if (s.challenge ||")
# Retain unknown per-desk and nested upgrade/keeper fields, while clearing the named run inventories.
edit('layers.js', '    next.editions = {...s.editions};', "    next.desks = fresh.desks.map((d,i) => ({...s.desks[i], ...d, up:{...s.desks[i]?.up, ...d.up}, keeper:{...s.desks[i]?.keeper, ...d.keeper}}));\n    next.editions = {...s.editions};")
edit('rewards.js', "(s.meta.layers?.count || 0) > 0", "s.meta.layers?.version === 1 && (s.meta.layers.count || 0) > 0")
edit('ops.js', "      const last = rt[i].sheet.slice(-1).toUpperCase();", "      const last = rt[i].sheet.slice(-1).toUpperCase(), frequency = freqNow();")
edit('ops.js', 'pick(Object.fromEntries([...VOWELS].map(v => [v, freqNow()[v]])))', 'pick(Object.fromEntries([...VOWELS].map(v => [v, frequency[v]])))')
edit('ops.js', '      else ch = pick(freqNow());', '      else ch = pick(frequency);')
