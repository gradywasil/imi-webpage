// Route only the four inspected immutable artifact writers; never redirect reads.
const fs=require('node:fs'),path=require('node:path'),{syncBuiltinESMExports}=require('node:module');
const base=path.resolve('docs/plan/long-game/evidence/LG-02/qa-runtime-b2-r1');
const roots=['LG-01/implementation-b','LG-01/repair-b-r2','LG-02/implementation-b2-r2','LG-02/tutorial-repair-b2-r3'].map(p=>path.resolve('docs/plan/long-game/evidence',p));
const routes=[],inside=(p,r)=>p===r||p.startsWith(r+path.sep),write=fs.writeFileSync;
let writing=false;
function checkedWrite(file,data,options){writing=true;try{return write(file,data,options);}finally{writing=false;}}
function route(file,operation){
  if(typeof file!=='string')throw Error('Unsupported output path type');
  const original=path.resolve(file),index=roots.findIndex(r=>inside(original,r));
  let mapped;
  if(index>=0){
    const rel=path.relative(roots[index],original),phase=process.env.REPAIR_PHASE;
    if(index===0&&rel&&!/^fixture-[^\\/]+(?:[\\/]|$)/.test(rel))throw Error('Unsupported fixture output');
    if(index===1&&rel&&(!phase||!rel.startsWith(phase+'-')||/[\\/]/.test(rel)))throw Error('Unsupported away output');
    if(index>=2&&rel&&(!rel.endsWith('.json')||/[\\/]/.test(rel)))throw Error('Unsupported coordinator/tour output');
    mapped=path.join(base,'routed',String(index),rel);
  }else if(inside(original,base))mapped=original;
  else throw Error('Unleased output: '+operation+' '+original);
  routes.push({operation,original,mapped});return mapped;
}
const exclusive=options=>({...typeof options==='object'?options:{encoding:options},flag:'wx'});
fs.writeFileSync=(file,data,options)=>checkedWrite(route(file,'writeFileSync'),data,exclusive(options));
const mkdir=fs.promises.mkdir,asyncWrite=fs.promises.writeFile;
fs.promises.mkdir=(file,options)=>mkdir(route(file,'mkdir'),options);
fs.promises.writeFile=(file,data,options)=>asyncWrite(route(file,'writeFile'),data,exclusive(options));
// Other mutations are unavailable to the inspected writers, including sibling paths.
for(const [owner,names]of [[fs,['appendFileSync','mkdirSync','renameSync','copyFileSync','unlinkSync','rmSync','rmdirSync','truncateSync','writeSync','openSync','writeFile','mkdir','appendFile','rename','copyFile','unlink','rm','rmdir','truncate','open','createWriteStream']],[fs.promises,['appendFile','rename','copyFile','unlink','rm','rmdir','truncate','open']]])for(const name of names){
  const original=owner[name];owner[name]=function(file,...args){
    if(writing&&(name==='openSync'||name==='writeSync'))return original.call(this,file,...args);
    if(name==='openSync'&&(args[0]==='r'||args[0]===undefined))return original.call(this,file,...args);
    const candidates=(/^(rename|copyFile)/.test(name)?[file,args[0]]:[file]).map(p=>Buffer.isBuffer(p)?p.toString():p);
    if(candidates.some(p=>typeof p!=='string'||inside(path.resolve(p),process.cwd())))throw Error('Unsupported mutation: '+name);
    return original.call(this,file,...args);
  };
}
syncBuiltinESMExports();
process.on('exit',()=>checkedWrite(path.join(base,'routes-'+process.pid+'.json'),JSON.stringify(routes,null,2)+'\n',{flag:'wx'}));
module.exports={route,routes};
