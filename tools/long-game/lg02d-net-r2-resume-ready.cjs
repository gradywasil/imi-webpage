const fs=require('node:fs');const f='vault-play.js',s=fs.readFileSync(f,'utf8');fs.writeFileSync(f,s.replace('const available = () => false;','const available = () => true;'));
