// Documentation QA only. Uses an installed Playwright, no persistent server.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');
const root = path.resolve(__dirname, '..');
const types = {'.html':'text/html','.css':'text/css','.ttf':'font/ttf','.png':'image/png','.gif':'image/gif','.mp4':'video/mp4','.vtt':'text/vtt'};
const server = http.createServer((req,res)=>{
  const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(p,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(p)]||'text/plain');res.end(data);});
});
(async()=>{
 let browser;
 const rows=[];
 try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const origin=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  for(const lang of ['es','en'])for(const mobile of [false,true]){
   const page=await browser.newPage({viewport:mobile?{width:390,height:1000}:{width:1440,height:1000},reducedMotion:'reduce'});
   const errors=[];const failures=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400)failures.push(r.url());});
   const size=mobile?'mobile':'desktop';
   for(const kind of ['preview','showcase']){
    const target=kind==='preview'?`docs/preview.${lang}.html`:`docs/showcase${lang==='en'?'.en':''}.html`;
    await page.goto(origin+'/'+target);await page.evaluate(()=>document.fonts.ready);
    await page.waitForTimeout(300);
    const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),font:document.fonts.check('700 24px Outfit')&&document.fonts.check('400 18px Inter'),cover:document.querySelector('picture img').currentSrc.split('/').pop(),h2:[...document.querySelectorAll('h2')].map(x=>x.textContent)}));
    await page.screenshot({path:path.join(root,`reports/docs-${kind}-${lang}-${size}.png`)});
    if(kind==='showcase'){
     const video=page.locator('video');await video.scrollIntoViewIfNeeded();
     await page.evaluate(()=>document.querySelector('video').scrollIntoView({block:'center'}));
     await page.evaluate(async()=>{const v=document.querySelector('video');await new Promise((resolve,reject)=>{if(v.readyState>=1)return resolve();v.addEventListener('loadedmetadata',resolve,{once:true});v.addEventListener('error',reject,{once:true});});v.textTracks[document.documentElement.lang==='es'?0:1].mode='showing';v.currentTime=3.5;await v.play();});
     await page.waitForTimeout(600);await page.evaluate(()=>document.querySelector('video').pause());
     const v=await page.evaluate(()=>{const v=document.querySelector('video');return {width:v.videoWidth,height:v.videoHeight,duration:v.duration,time:v.currentTime,tracks:[...v.textTracks].map(t=>({language:t.language,cues:t.cues?.length||0,mode:t.mode,active:[...(t.activeCues||[])].map(c=>c.text)}))};});
     state.video=v;
     await page.screenshot({path:path.join(root,`reports/docs-player-${lang}-${size}.png`)});
    }
    rows.push({lang,size,kind,...state,errors:[...errors],failures:[...failures]});
   }
   await page.close();
  }
  // Verify caption tracks and media when opened by double-click, without HTTP.
  const offline=await browser.newPage();
  await offline.goto('file://'+path.join(root,'docs/showcase.html'));
  await offline.evaluate(()=>{document.querySelector('video').textTracks[0].mode='showing';});
  await offline.waitForFunction(()=>document.querySelector('video').textTracks[0].cues?.length===4);
  rows.push({kind:'offline-caption-check',cues:await offline.evaluate(()=>document.querySelector('video').textTracks[0].cues.length)});
  await offline.close();
  const passed=rows.every(r=>!r.overflow&&!r.broken?.length&&!r.errors?.length&&!r.failures?.length&&(r.font!==false)&&(!r.video||r.video.tracks.some(t=>t.cues===4&&t.mode==='showing'&&t.active.length)));
  fs.writeFileSync(path.join(root,'reports/docs-browser-verification.json'),JSON.stringify({passed,rows},null,2)+'\n');
  console.log(JSON.stringify({passed,checks:rows.length},null,2));
  if(!passed)process.exitCode=1;
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
