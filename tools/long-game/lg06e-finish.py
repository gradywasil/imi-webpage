from pathlib import Path
p=Path('ops.js'); raw=p.read_bytes(); nl='\r\n' if b'\r\n' in raw else '\n'; s=raw.decode().replace('\r\n','\n')
a=s.index("    { id: 'baremetal',");b=s.index('\n',a);line=s[a:b];s=s[:a]+s[b:];s=s.replace("    { id: 'handplanted',",line+','+'\n    { id: \'handplanted\',',1);s=s.replace("helper: 'muse', imprint: true, desc:","helper: 'muse', imprint: true, desc:")
# Last challenge must not leave an unnecessary empty line/comma correction.
s=s.replace("perk: 'Muse director attempts every 45 active game seconds after its usual unlock.' },\n\n", "perk: 'Muse director attempts every 45 active game seconds after its usual unlock.' }\n")
s=s.replace("!S.rewards.awayCheckpoint && !!writer", "!S.rewards.awayCheckpoint && !!writer")
s=s.replace("!S.rewards.awayCheckpoint && (!writer", "!S.rewards.awayCheckpoint && !Object.values(S.rewards.claims || {}).some(c => c.status === 'prepared') && (!writer")
s=s.replace("const challengeReward = c => c.helper ?", "const challengeReward = c => c.imprint ? `${c.perk} First clear also gives a balanced Letters bundle on your highest owned desk: three minutes of productive output, at least 50 and at most 5,000 letters. Replays pay nothing.` : c.helper ?")
p.write_bytes(s.replace('\n',nl).encode())
