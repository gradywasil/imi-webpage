// Task-only static transport. A large backlog prevents refused script connections.
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),port=8313;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.ico':'image/x-icon','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
    if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
    const bytes=await fs.readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':bytes.length});res.end(bytes);
  }catch(error){res.writeHead(error.code==='ENOENT'?404:500);res.end();}
});
server.listen({host:'127.0.0.1',port,backlog:1024},()=>console.log(JSON.stringify({pid:process.pid,root,port,backlog:1024})));
