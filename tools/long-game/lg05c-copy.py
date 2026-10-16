from pathlib import Path
p=Path('layers.js');s=p.read_bytes();s=s.replace('Buy Mixed shelf · 2 Seals'.encode(),'Buy Mixed shelf / 2 Seals'.encode());p.write_bytes(s)
