// Task-only observations and real failing storage injection in an admitted game.
window.qaB2={
  async snapshot(){
    const rect=e=>{const r=e?.getBoundingClientRect();return r?{x:r.x,y:r.y,w:r.width,h:r.height}:null;};
    const button=document.querySelector('.o-writer-status button'),content=document.querySelector('.o-writer-content'),b=rect(button);
    const hits=b&&b.w?[[.5,.5],[.08,.08],[.92,.08],[.08,.92],[.92,.92]].map(([x,y])=>{const e=document.elementFromPoint(b.x+b.w*x,b.y+b.h*y);return {x:b.x+b.w*x,y:b.y+b.h*y,hit:e===button||button.contains(e),tag:e?.tagName,cls:e?.className};}):[];
    return {url:location.href,viewport:[innerWidth,innerHeight],page:[document.documentElement.scrollWidth,document.documentElement.scrollHeight,scrollX,scrollY],owner:Rewards.owns?.(),held:Rewards.held?.(),running:IMI?.ops?.progression.running(),intro:IMI?.ops?.introActive(),tour:localStorage.getItem('imi-tour'),tourText:document.querySelector('.tour-txt')?.textContent,tourNumber:document.querySelector('.tour-n')?.textContent,bubbleHidden:document.querySelector('.tour-bub')?.hidden,ringHidden:document.querySelector('.tour-ring')?.hidden,focus:document.activeElement?.getAttribute('aria-label')||document.activeElement?.textContent?.slice(0,80),button:b,hits,internal:content?{client:content.clientHeight,scroll:content.scrollHeight,top:content.scrollTop,rect:rect(content)}:null,chips:[...document.querySelectorAll('.o-buffbar > *')].map(e=>({text:e.textContent,rect:rect(e)})),continued:window.__qaContinued,failed:window.__qaFailed,opsRaw:localStorage.getItem('imi-ops-v1'),walletRaw:localStorage.getItem('imi-score')};
  },
  hold(){
    window.__qaContinued=0;window.__qaFailed=0;window.__qaReject=2;window.__qaOpen=false;window.__qaRejected=[];
    const set=Storage.prototype.setItem;window.__qaSet=set;
    Storage.prototype.setItem=function(k,v){
      let s;try{s=JSON.parse(v);}catch{}
      if(k==='imi-ops-v1'&&s?.prem?.vault?.transition)__qaOpen=true;
      if(k==='imi-ops-v1'&&__qaOpen&&s?.prem?.vault&&!s.prem.vault.transition&&__qaReject>0){__qaReject--;__qaFailed++;__qaRejected.push(v);throw new DOMException('QA closing storage failure. '+ 'The acknowledged historical boundary is waiting for its separate closing save. '.repeat(5),'QuotaExceededError');}
      return set.call(this,k,v);
    };
    let renders=0;const counted=()=>renders++;IMI.on('render',counted);
    const accepted=Rewards.runLocalTransaction({id:'boundary:qa-native',kind:'settlement',settle:IMI.ops.extensions.vaultBoundary,build:p=>p,continue:()=>__qaContinued++});
    const atReturn=renders;
    return Promise.resolve().then(()=>{IMI.off('render',counted);return {accepted,held:Rewards.held(),renderDelta:renders-atReturn,bubbleHidden:document.querySelector('.tour-bub').hidden,ringHidden:document.querySelector('.tour-ring').hidden};});
  }
};
