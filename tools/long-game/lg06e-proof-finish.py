from pathlib import Path
p=Path('tools/long-game/lg06e-check.cjs');s=p.read_text()
s=s.replace("await new Promise(r=>setTimeout(r,450));await page.screenshot", "await new Promise(r=>setTimeout(r,2300));await page.evaluate(()=>{const pane=document.querySelector('#o-legacy'),button=pane.querySelector('[data-id=handplanted]');pane.scrollTop+=button.getBoundingClientRect().top-pane.getBoundingClientRect().top-4;});await page.screenshot")
needle="await page.reload();await page.waitForFunction(()=>Rewards.owns()&&IMI.ops?.progression.running());const reload="
s=s.replace(needle,"""if(id==='handplanted'){
+const cadence=await page.evaluate(()=>{const s=IMI.ops.dev.S(),a=IMI.ops.extensions,h=__OPS_EXTENSIONS.find(([k])=>k==='automation')[1];const current=s.meta.automation,next=JSON.parse(JSON.stringify(current));next.garden={...next.garden,enabled:true,bed:0,letter:'E',desk:'mint'};const edit=a.commitAutomation(JSON.stringify(current),next);h.tick({gameSeconds:44,replay:false});const at44=s.garden.beds[0];h.tick({gameSeconds:1,replay:false});const at45=s.garden.beds[0];return {edit,at44,at45,ready:h.gardenReady()};});result.checks.push({cadence});assert(cadence.edit.ok&&cadence.at44===null&&cadence.at45&&cadence.ready);
+}
+""".replace('\n+','\n')+needle)
p.write_text(s)
