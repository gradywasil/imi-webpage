from pathlib import Path
p=Path('ops.js'); b=p.read_bytes(); s=b.decode(); n='\r\n' if b'\r\n' in b else '\n'
s=s.replace("    if (s.challenge.id === 'fixedcast' && r.seats != null", "    if (s.challenge.id === 'fixedcast' && challengeCount(s) >= 4 && r.seats == null) return null;"+n+"    if (s.challenge.id === 'fixedcast' && r.seats != null")
s=s.replace("reset: () => { if (confirm('Reset Typewriter", "reset: () => { if (imprintChallenge() && !challengeSettled()) return; if (confirm('Reset Typewriter")
p.write_bytes(s.encode())
