// Refresh public-site snapshots without sending visitors to a screenshot service.
const puppeteer = require('C:/Users/sampl/Downloads/surf-cli/node_modules/puppeteer');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const data = vm.runInNewContext(fs.readFileSync(path.join(root, 'files-data.js'), 'utf8') + '\nFILES_DATA;');
const tools = {'Are.na':'arena', 'Wayback Machine':'wayback', 'Google Fonts':'google-fonts', 'GitHub':'github'};
const jobs = data.flatMap(folder => folder.items.map(item => ({...item, key:folder.label === 'SAIA Channels' ? `channel-${item.label}` : `tool-${tools[item.label]}`})));
const output = path.join(root, 'assets/files/thumbnails');
fs.mkdirSync(output, {recursive:true});
(async () => {
 const browser = await puppeteer.launch({headless:true, executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const results = {};
 const failures = [];
 let cursor = 0;
 async function worker() {
  while (cursor < jobs.length) {
   const item = jobs[cursor++];
   const page = await browser.newPage();
   try {
    await page.setViewport({width:1200,height:728,deviceScaleFactor:1});
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion', value:'reduce'}]);
    const response = await page.goto(item.url, {waitUntil:'networkidle2',timeout:35000});
    if (!response || response.status() >= 400) throw new Error(`HTTP ${response?.status()}`);
    await Promise.race([page.evaluate(()=>document.fonts.ready), new Promise(r=>setTimeout(r,2500))]);
    await new Promise(r=>setTimeout(r,1800));
    const title = await page.title();
    const text = await page.$eval('body',e=>e.innerText);
    if (text.trim().length < 60 || /just a moment|access denied|verify you are human|checking your browser/i.test(title + ' ' + text.slice(0,500))) throw new Error('No usable public-page content');
    // Avoid archiving unfinished image placeholders above the fold.
    await Promise.race([page.evaluate(()=>Promise.all([...document.images].filter(img=>img.getBoundingClientRect().top<innerHeight).map(img=>img.decode().catch(()=>{})))),new Promise(r=>setTimeout(r,3000))]);
    const filename = `${item.key}.webp`;
    await page.screenshot({path:path.join(output,filename),type:'webp',quality:78});
    results[item.url] = {src:`./assets/files/thumbnails/${filename}`,title,capturedAt:new Date().toISOString()};
    console.log('Captured',item.key,title);
   } catch (error) {
    failures.push({url:item.url,error:error.message});
    console.error('FAILED',item.key,error.message);
   } finally { await page.close(); }
  }
 }
 try { await Promise.all([worker(),worker()]); } finally { await browser.close(); }
 const sorted = Object.fromEntries(jobs.filter(item=>results[item.url]).map(item=>[item.url,results[item.url]]));
 fs.writeFileSync(path.join(root,'files-thumbnails.js'),'// Public website snapshots; regenerate with scripts/capture-file-thumbnails.cjs.\nconst FILE_THUMBNAILS = '+JSON.stringify(sorted,null,2)+';\n');
 fs.writeFileSync(path.join(output,'capture-report.json'),JSON.stringify({capturedAt:new Date().toISOString(),count:Object.keys(sorted).length,failures},null,2)+'\n');
 console.log(`Saved ${Object.keys(sorted).length}/${jobs.length} website thumbnails.`);
 if(failures.length) process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
