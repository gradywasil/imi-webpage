const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto');
const out='docs/plan/long-game/evidence/LG-02/tutorial-repair-b2-r3',run=process.argv[2];
if(!/^[a-z0-9-]+$/.test(run))throw Error('Named exclusive run required');
const write=(name,value)=>fs.writeFileSync(out+'/'+run+'-'+name+'.json',JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const files=['tour.js','sw.js','tests/tour-save-hold.test.cjs',...fs.readdirSync('tools/long-game').filter(n=>/^lg02-b2-r3-.*\.(cjs|mjs)$/.test(n)).map(n=>'tools/long-game/'+n)];
const syntax=files.map(file=>{const args=['--check',file],r=cp.spawnSync(process.execPath,args,{encoding:'utf8'});return {file,args,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),exit:r.status,stdout:r.stdout,stderr:r.stderr};});write('syntax',syntax);
if(syntax.some(r=>r.exit)){process.exitCode=1;}else if(!run.startsWith('syntax')){
 const env={...process.env,PUPPETEER_MODULE:'C:/Users/arran/AppData/Local/Temp/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js',LG02_B2_R3_RUN:run};
 const args=['--test','--test-concurrency=1','tests/tour-save-hold.test.cjs'],started=new Date().toISOString();
 write('test-command-before',{started,executable:process.execPath,args,env:{PUPPETEER_MODULE:env.PUPPETEER_MODULE,LG02_B2_R3_RUN:run},sources:syntax.map(r=>({file:r.file,sha256:r.sha256})),routing:'Only the NEW r3 fixture writer executes; it uses this exclusive r3 evidence root and wx. No historical writer or suite is invoked.'});
 const r=cp.spawnSync(process.execPath,args,{env,encoding:'utf8',maxBuffer:5*1024*1024});
 write('test-command-result',{started,finished:new Date().toISOString(),args,exit:r.status,stdout:r.stdout,stderr:r.stderr});console.log(r.stdout);console.error(r.stderr);process.exitCode=r.status||0;
}
