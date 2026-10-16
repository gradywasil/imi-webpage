from pathlib import Path
p=Path('layers.js');s=p.read_text();s=s.replace("visible:c => c.state().printing >= 7 || identity(c.state()) > 0", "visible:c => shelfFirst || c.state().printing >= 7 || identity(c.state()) > 0");p.write_bytes(s.replace('\n','\r\n').encode())
