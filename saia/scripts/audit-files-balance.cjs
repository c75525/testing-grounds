const puppeteer=require('C:/Users/sampl/Downloads/surf-cli/node_modules/puppeteer');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const results=[];
 try{
  for(const [width,height] of [[320,568],[393,852],[614,774],[1440,900],[3440,1213]]){
   const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.setViewport({width,height});
   await page.goto('http://localhost:4173/files.html',{waitUntil:'networkidle0'});
   await page.waitForFunction(()=>document.querySelector('.files-page').classList.contains('is-layout-ready'));
   await new Promise(r=>setTimeout(r,1300));
   async function audit(action,label){
    const metrics=await page.evaluate(async({action})=>{
     const samples=[];
     if(action==='escape')dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
     else if(action)document.querySelector(action).click();
     await new Promise(resolve=>{
      const start=performance.now();
      function frame(now){
       const main=document.querySelector('.files-page').getBoundingClientRect();
       const group=document.querySelector('.files-layout').getBoundingClientRect();
       const nav=document.querySelector('.bottom-nav').getBoundingClientRect();
       samples.push({x:Math.abs((group.left+group.right)/2-(main.left+main.right)/2),y:Math.abs((group.top+group.bottom)/2-(main.top+main.bottom)/2),top:group.top,bottom:group.bottom,nav:nav.top,left:group.left,right:group.right});
       if(now-start<1250)requestAnimationFrame(frame);else resolve();
      }
      requestAnimationFrame(frame);
     });
     return {frames:samples.length,maxX:Math.max(...samples.map(s=>s.x)),maxY:Math.max(...samples.map(s=>s.y)),last:samples.at(-1),clipped:samples.some(s=>s.left<-.5||s.right>innerWidth+.5||s.top<-.5||s.bottom>s.nav+.5)};
    },{action});
    assert.ok(metrics.maxX<1&&metrics.maxY<1,`${width} ${label} center ${JSON.stringify(metrics)}`);
    assert.equal(metrics.clipped,false,`${width} ${label} clipped ${JSON.stringify(metrics)}`);
    console.log(width,label,metrics.frames,'frames; max center error',metrics.maxX,metrics.maxY);
    results.push({width,height,label,...metrics});
   }
   await audit(null,'overview');
   for(const folder of [0,1,2]){
    await audit(`[data-folder="${folder}"]`,'open-'+folder);
    if(folder!==2){
     await audit(`#folder-${folder} .file-button`,'preview-'+folder);
     assert.equal(await page.$eval('.file-preview',e=>e.hidden),false);
     await page.screenshot({path:path.join(__dirname,`../audited-preview-${width}-${folder}.png`)});
     await audit('escape','back-to-folder-'+folder);
    }
    await audit('escape','back-to-overview-'+folder);
   }
   await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
   await audit('[data-folder="0"]','reduced-open');
   await audit('#folder-0 .file-button','reduced-preview');
   assert.deepEqual(errors,[]);
   await page.close();
  }
  require('node:fs').writeFileSync(path.join(__dirname,'../docs/files-balance-test-results.json'),JSON.stringify(results,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
