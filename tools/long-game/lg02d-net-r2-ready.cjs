const fs=require('node:fs'),assert=require('node:assert/strict');
for(const [f,a,b]of [['vault-play.js','  // automation.js must retain its acknowledged net claim slot through this hold first.\r\n  const available = () => false;','  const available = () => true;'],['sw.js','imi-v74','imi-v75']]){const s=fs.readFileSync(f,'utf8'),needle=a.replaceAll('\r\n','\n');const actual=s.includes(a)?a:needle;assert.equal(s.split(actual).length,2,f);fs.writeFileSync(f,s.replace(actual,b));}

