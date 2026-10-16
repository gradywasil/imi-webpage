import http from 'node:http';
import path from 'node:path';
import { readFile,stat,writeFile } from 'node:fs/promises';
const root = process.cwd(), port = 8168;
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server = http.createServer(async(req,res) => {
  try {
    const url = new URL(req.url,'http://localhost'), file = path.resolve(root,'.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    if (!(await stat(file)).isFile()) { res.writeHead(404).end(); return; }
    const bytes = await readFile(file);
    res.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'public, max-age=60','Content-Length':bytes.length});
    res.end(bytes);
  } catch { res.writeHead(404).end(); }
});
server.listen(port,'127.0.0.1',async() => {
  await writeFile('docs/plan/long-game/evidence/LG-01/implementation-c-r2/server.json',JSON.stringify({pid:process.pid,root,port,command:process.argv,cacheOnlyDifference:true},null,2)+'\n',{flag:'wx'});
});
