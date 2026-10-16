from pathlib import Path
p=Path('automation.js');b=p.read_bytes();nl='\r\n' if b'\r\n' in b else '\n';s=b.decode().replace('\r\n','\n');a='  function observeNet() {\n';assert a in s;s=s.replace(a,a+'    if (api && museElapsed && !museReady()) resetMuseClock();\n',1);p.write_bytes(s.replace('\n',nl).encode())
