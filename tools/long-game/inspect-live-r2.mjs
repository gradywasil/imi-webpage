// Read-only diagnostics from the verified task-owned live browser. Does not advance time or RNG.
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const [profileDirectory,output]=process.argv.slice(2);
if(!profileDirectory||!output)throw new Error('Supply verified task browser directory and fresh output');
const [port,path]= (await readFile(profileDirectory+'/DevToolsActivePort','utf8')).trim().split(/\r?\n/);
const {default:puppeteer}=await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const browser=await puppeteer.connect({browserWSEndpoint:`ws://127.0.0.1:${port}${path}`});
try {
  const page=(await browser.pages()).find(p=>p.url().includes('/tools/balance.html?long-game'));
  if(!page)throw new Error('Task simulation page absent');
  const result=await page.evaluate(()=>JSON.parse(JSON.stringify({calendar:LongGameBot.report().calendarMinutes,active:LongGameBot.report().activeMinutes,finite:LongGameBot.report().finiteComplete,bot:Bot.report(),desks:IMI.ops.dev.S().desks,legacy:IMI.ops.dev.S().legacy})));
  await writeFile(output,JSON.stringify(result,null,2),{flag:'wx'});
  console.log({calendar:result.calendar,active:result.active,training:result.bot.final.training});
} finally {browser.disconnect();}
