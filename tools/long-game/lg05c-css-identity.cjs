const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const out='docs/plan/long-game/evidence/LG-05/implementation-shelf-r1',h=x=>crypto.createHash('sha256').update(x).digest('hex'),ui=JSON.parse(fs.readFileSync(`${out}/confirmation-ui.json`));
const css=fs.readFileSync('layers.css','utf8');for(const r of ui)assert.equal(h(css.replace(/\n/g,'\r\n')),r.loaded['layers.css']);
fs.writeFileSync(`${out}/css-newline-identity.json`,JSON.stringify({finalHash:h(css),executedHash:ui[0].loaded['layers.css'],onlyDifference:'CRLF execution bytes restored to original LF convention; exact reconstruction equality asserted'},null,2),{flag:'wx'});
