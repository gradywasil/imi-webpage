from pathlib import Path
for name in ['ops.js','rewards.js','automation.js']:
 p=Path(name); raw=p.read_bytes(); nl='\r\n' if b'\r\n' in raw else '\n'; s=raw.decode().replace('\r\n','\n')
 if name=='rewards.js': s=s.replace('descriptor(`challenge:${id}:first`)',"descriptor(`challenge:${id}:first`,'new')")
 if name=='ops.js':
  s=s.replace("!!writer?.owns() && !writer.held() && !writer.localDisposition() && writer.guard(S);","(!writer || writer.owns() && !writer.held() && !writer.localDisposition() && writer.guard(S));")
  s=s.replace("c.imprint ? gardenPrototype() && layers.identity(S) >= 1", "c.imprint ? gardenPrototype() && validChallengeImprint()")
  s=s.replace("  const imprintChallenge =", "  const validChallengeImprint = () => { try { return layers.current(S).count >= 1; } catch { return false; } };\n  const imprintChallenge =")
  s=s.replace('if (!imprintChallenge(s) || r.kid || r.lib)', 'if (!r) return false;\n    if (!imprintChallenge(s) || r.kid || r.lib)')
 if name=='automation.js':
  for key,title in [('garden','Hand-planted'),('pitch','One brief'),('media','Paper only'),('muse','Fixed cast')]:
   a=s.index(f'function {key}Card('); b=s.index('\n  }',a)
   card=s[a:b].replace('</section>', f'<p>{title} first clear: 45-second attempts, keeping the usual unlock.</p></section>')
   s=s[:a]+card+s[b:]
 p.write_bytes(s.replace('\n',nl).encode())
