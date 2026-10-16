import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),port=8170;
const mime={'.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost'),relative=decodeURIComponent(url.pathname).replace(/^\//,'')||'index.html';
  const file=path.resolve(root,relative);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  try {
    const frozen=url.searchParams.has('frozen')||process.env.LG01_REPAIR_FROZEN==='1';
    const source=frozen&&['ops.js','rewards.js','ops.css','sw.js'].includes(relative)?path.join(root,'docs/plan/long-game/evidence/LG-01/repair-runtime-r2/before/source',relative):file;
    const bytes=await readFile(source);
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'public, max-age=60','Content-Length':bytes.length});res.end(bytes);
  }catch{res.writeHead(404);res.end();}
}).listen(port,'127.0.0.1',async()=>{
  await writeFile('docs/plan/long-game/evidence/LG-01/repair-runtime-r2/server-'+(process.env.LG01_REPAIR_FROZEN==='1'?'frozen':'current')+'.json',JSON.stringify({root,port,pid:process.pid,frozen:process.env.LG01_REPAIR_FROZEN==='1',command:process.argv},null,2)+'\n',{flag:'wx'});
  console.log('Repair server '+port+' PID '+process.pid);
});
