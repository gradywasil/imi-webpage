const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=process.cwd(),out=path.resolve('docs/plan/long-game/evidence/LG-02/free-lamp-r1'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const write=(n,v)=>fs.writeFileSync(path.join(out,n),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
if(process.argv[2]==='source'){
  const identities={};
  for(const run of ['cap-final','failure-pixel-final','failure-classic-final','undo-final']){
    const loaded=JSON.parse(fs.readFileSync(path.join(out,run+'-sources-errors.json'))),mismatches=[],bom=[];
    for(const [url,h]of Object.entries(loaded.sources)){
      const f=path.join(root,url.replace(/^\//,''));if(!fs.existsSync(f))continue;const b=fs.readFileSync(f);
      if(hash(b)===h)continue;
      if(b.subarray(0,3).equals(Buffer.from([239,187,191]))&&hash(b.subarray(3))===h)bom.push({path:url,raw:hash(b),devtoolsResponse:h});else mismatches.push(url);
    }
    identities[run]={errors:loaded.errors,mismatches,bomQualification:bom};
  }
  assert.deepEqual(identities['cap-final'].mismatches,[]);
  write('loaded-source-comparison.json',identities);
  const before=JSON.parse(fs.readFileSync(path.join(out,'before-status.json'))),index=hash(fs.readFileSync('.git/index'));
  write('final-status.json',{branch:cp.execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),head:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),status:cp.execFileSync('git',['status','--porcelain=v1'],{encoding:'utf8'}),index,indexByteEqual:before.index===index,cachedDiff:cp.execFileSync('git',['diff','--cached','--stat'],{encoding:'utf8'})});
  write('closing-tool-source.json',{path:'tools/long-game/lg02d-close.cjs',sha256:hash(fs.readFileSync(__filename))});
  console.log('Final native inputs match disk; existing Seasons UTF-8 BOM removal by DevTools response extraction is explicitly qualified.');
}else{
  const files=[];
  function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,entry.name);if(entry.isDirectory())walk(f);else if(entry.name!=='parent-dispatch.json'&&entry.name!=='close-seal.json')files.push(f);}}
  walk(out);
  const manifest=Object.fromEntries(files.map(f=>[path.relative(out,f).replaceAll('\\','/'),{bytes:fs.statSync(f).size,sha256:hash(fs.readFileSync(f))}]));
  const final=JSON.parse(fs.readFileSync(path.join(out,'source-final.json')));for(const [f,v]of Object.entries(final))assert.equal(hash(fs.readFileSync(f)),v.sha256,f);
  write('close-seal.json',{candidateOnly:true,writerReleased:true,task:'docs/plan/long-game/LG-02D-free-lamp-implementation.md',taskSha256:hash(fs.readFileSync('docs/plan/long-game/LG-02D-free-lamp-implementation.md')),files:manifest});
  console.log('Candidate sealed; product/source manifest still exact. Writer released for independent review.');
}
