from pathlib import Path
p=Path('layers.css');p.write_bytes(p.read_bytes().replace(b'\r\n',b'\n'))
p=Path('tools/long-game/lg05c-manifest.py');s=p.read_text(encoding='utf-8-sig').replace("a=before.decode().splitlines(True);b=after.decode().splitlines(True)","a=before.decode().splitlines(True);b=after.decode().splitlines(True)");p.write_text(s)
