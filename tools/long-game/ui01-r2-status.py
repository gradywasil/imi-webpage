from pathlib import Path
root=Path('docs/plan/long-game')
for name in ['UI-01-consistent-layout.md','UI-01-implementation-r2.md']:
 p=root/name;s=p.read_bytes().decode('utf-8');marker='## Status and handoff'+ ('\r\n' if '\r\n' in s else '\n');assert marker in s
 s=s.replace(marker,marker+'\r\nCANDIDATE COMPLETE 2026-10-14. Full approved fallback UI batch implemented in shared long-game. Independent review follows. See [implementation-r2 handoff](evidence/UI-01/implementation-r2/handoff.md), focused/final geometry results, fresh equal five-minute controls and final identities. Final small grid/filter/next-high corrections have source/geometry verification; captured UI images and the single detector run predate those corrections. No acceptance, default activation, commit or deployment. Royalty work remains queued.\r\n',1);p.write_bytes(s.encode('utf-8'))

