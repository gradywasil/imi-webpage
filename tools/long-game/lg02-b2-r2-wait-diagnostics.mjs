// Read-only diagnostics around immutable Puppeteer waits. Preserve and rethrow failures.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const out='docs/plan/long-game/evidence/LG-02/implementation-b2-r2';
const {default:pp}=await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const launch=pp.launch.bind(pp);let number=0;
pp.launch=async(...args)=>{
  const browser=await launch(...args),create=browser.createBrowserContext.bind(browser);
  browser.createBrowserContext=async(...args)=>{
    const context=await create(...args),newPage=context.newPage.bind(context);
    context.newPage=async(...args)=>{
      const page=await newPage(...args),events=[],reads=[];
      page.on('pageerror',error=>events.push({type:'pageerror',stack:error.stack}));
      page.on('console',msg=>{if(msg.type()==='error')events.push({type:'console-error',text:msg.text()});});
      page.on('requestfailed',r=>events.push({type:'requestfailed',url:r.url(),failure:r.failure()}));
      page.on('response',r=>{if(/\/(?:core|rewards|economy|ops|vault)\.js$|\/tools\/balance\.html$/.test(new URL(r.url()).pathname))reads.push(r.buffer().then(bytes=>events.push({type:'response',url:r.url(),status:r.status(),sha256:createHash('sha256').update(bytes).digest('hex')})).catch(e=>events.push({type:'buffer-error',url:r.url(),error:e.message})));});
      const wait=page.waitForFunction.bind(page);
      page.waitForFunction=async(...args)=>{
        try{return await wait(...args);}
        catch(error){
          const state=await page.evaluate(()=>({url:location.href,ready:document.readyState,hidden:document.hidden,body:document.body?.innerText,core:typeof Core,imi:!!window.IMI,ops:!!window.IMI?.ops,owns:window.Rewards?.owns?.(),running:window.IMI?.ops?.progression?.running(),gate:window.VaultSaveGate,opsRaw:localStorage.getItem('imi-ops-v1'),walletRaw:localStorage.getItem('imi-score')})).catch(e=>({error:e.message}));
          await Promise.allSettled(reads);
          fs.writeFileSync(out+'/wait-diagnostic-'+process.pid+'-'+number+++'.json',JSON.stringify({coverage:'read-only wait diagnostics; original timeout/arguments/browser parameters unchanged',error:error.stack,events,state},null,2)+'\n',{flag:'wx'});
          throw error;
        }
      };
      return page;
    };return context;
  };return browser;
};
