const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const pp=require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out='docs/plan/long-game/evidence/LG-05/shelf-parent-final-r3',root=process.cwd();
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),write=(n,v)=>fs.writeFileSync(out+'/'+n+'.json',JSON.stringify(v,null,2),{flag:'wx'});
const fixture=JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-05/implementation-shelf-r1/final-ui-failure.json'));
fixture.state.lastSeen=Date.now();delete fixture.state.meta.layers.purchases.shelf;fixture.state.meta.layers.seals=2;fixture.state.meta.layers.shelf=[];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(f,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(e?'missing':b);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 const result={qualification:'Fresh controlled fixture derived from the previously passing focused pointer setup; shelf ownership reset to absent with 2 Seals; stamps seeded. Documented repository headless native Core/Rewards functional workflow.',checks:[],errors:[],loaded:{}};
 try{
  browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const context=await browser.createBrowserContext(),page=await context.newPage(),reads=[];
  await page.setBypassServiceWorker(true);await page.setCacheEnabled(false);await page.setViewport({width:360,height:560});
  page.on('pageerror',e=>result.errors.push(e.message));
  page.on('response',r=>{const f=new URL(r.url()).pathname.slice(1);if(['layers.js','folio.js','ops.js','rewards.js','core.js','layers.css'].includes(f))reads.push(r.buffer().then(b=>result.loaded[f]=hash(b)));});
  const seed=await page.evaluateOnNewDocument(f=>{localStorage.setItem('imi-ops-v1',JSON.stringify(f.state));localStorage.setItem('imi-score',JSON.stringify(f.wallet));},fixture);
  const url='http://127.0.0.1:'+server.address().port+'/index.html?s=pixel&lg01a=1&lg05folio=1&lg05layers=1#play';
  await page.goto(url);await page.removeScriptToEvaluateOnNewDocument(seed.identifier);
  await page.waitForFunction(()=>window.Rewards?.owns()&&window.IMI?.ops?.progression.running(),{timeout:10000});
  result.before=await page.evaluate(()=>({held:Rewards.held(),guard:Rewards.guard(IMI.ops.dev.S()),seals:IMI.ops.dev.S().meta.layers.seals}));
  assert.equal(result.before.held,false);assert(result.before.guard);result.checks.push('Valid non-held save-owner fixture');
  await page.evaluate(()=>IMI.ops.dev.action('go',{tab:'folio'}));
  await page.waitForSelector('[data-act="folio:shelf"]',{visible:true});await page.click('[data-act="folio:shelf"]');
  await page.waitForFunction(()=>IMI.ops.dev.ui.tab==='imprints'&&document.querySelector('.layer-shelf'),{timeout:5000});
  result.label=await page.$eval('[data-act="layers:shelf"]',e=>e.textContent);
  assert.equal(result.label,'Buy Mixed shelf \u00b7 2 Seals');result.checks.push('Normal pointer Genre shelf navigation and corrected purchase label');
  await page.click('[data-act="layers:shelf"]');
  await page.waitForFunction(()=>IMI.ops.dev.S().meta.layers.purchases.shelf===true);
  assert.equal(await page.evaluate(()=>IMI.ops.dev.S().meta.layers.seals),0);result.checks.push('Pointer purchase costs exactly 2 Seals');
  for(const id of ['mystery','horror']){await page.click('[data-act="layers:slot"][data-id="'+id+'"]');await page.waitForFunction(id=>IMI.ops.dev.S().meta.layers.shelf.includes(id),{},id);}
  assert.equal(await page.evaluate(()=>Layers.shelfBonus(IMI.ops.dev.S())),.05);
  await page.click('[data-act="layers:remove"][data-id="horror"]');
  await page.waitForFunction(()=>IMI.ops.dev.S().meta.layers.shelf.length===1);
  result.checks.push('Normal pointer slot pair and remove persist through acknowledged commands');
  await page.reload();await page.waitForFunction(()=>window.Rewards?.owns()&&window.IMI?.ops?.progression.running(),{timeout:10000});
  result.after=await page.evaluate(()=>({held:Rewards.held(),seals:IMI.ops.dev.S().meta.layers.seals,owned:IMI.ops.dev.S().meta.layers.purchases.shelf,slots:IMI.ops.dev.S().meta.layers.shelf,bonus:Layers.shelfBonus(IMI.ops.dev.S())}));
  assert.equal(result.after.held,false);assert.equal(result.after.owned,true);assert.equal(result.after.seals,0);assert.deepEqual(result.after.slots,['mystery']);assert.equal(result.after.bonus,0);
  result.checks.push('Reload retains purchase, exact Seal balance and edited slots');
  await Promise.all(reads);for(const [f,h] of Object.entries(result.loaded))assert.equal(h,hash(fs.readFileSync(f)));
  assert.deepEqual(result.errors,[]);result.status='PASS';write('pointer-check',result);console.log(JSON.stringify({status:result.status,checks:result.checks}));
 }catch(e){result.status='FAIL';result.error=e.stack;write('first-failure',result);throw e;}
 finally{if(browser)await browser.close();await new Promise(r=>server.close(r));write('cleanup',{ownBrowserClosed:true,ownInProcessServerClosed:true,noOwnerOriginsUsed:true});}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
