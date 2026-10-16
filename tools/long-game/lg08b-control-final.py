from pathlib import Path
p=Path('tools/long-game/lg08b-default.cjs');s=p.read_text().replace("['before','final','confirmation']","['before','final','confirmation','stable']");s=s.replace("'vault-save-gate.js','sw.js'","'vault-save-gate.js','sw.js',...(phase === 'before' ? [] : ['estate.js'])");p.write_text(s)
