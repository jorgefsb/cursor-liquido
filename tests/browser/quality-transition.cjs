'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const REPO=path.resolve(__dirname,'../..');
const HERE=path.resolve(process.env.QUALITY_PROOF_DIR||path.join(REPO,'test-output/quality'));
fs.mkdirSync(HERE,{recursive:true});
(async()=>{
 const b=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const rows=[];
 try{
 for(const variant of ['baseline','candidate','candidate','baseline'])for(const intensity of ['mucho','hardcore']){
  const p=await b.newPage({viewport:{width:1200,height:950}});
  const requests=[];p.on('request',q=>{if(/^https?:/.test(q.url()))requests.push(q.url());});
  await p.goto('file://'+path.join(REPO,'dist/cursor-liquido-standalone.html'));
  if(variant==='baseline')await p.evaluate(()=>{ window.FluidEngine=Object.getPrototypeOf(window.FluidEngine); });
  assert.equal(await p.evaluate(()=>LiquidCursor.version),'1.0.1');
  await p.evaluate(intensity=>{
   const c=LiquidCursor.mount({intensity});const e=c.engine;if(!e.boot())throw Error('No WebGL');
   // Cancel the automatic frame after the real handler has queued each input.
   window.probePause=()=>{if(e.raf)cancelAnimationFrame(e.raf);e.raf=0;};
   window.addEventListener('pointermove',window.probePause);
  },intensity);
  const a=await p.locator('.arena').boundingBox();
  await p.mouse.move(100,a.y+190);await p.mouse.move(140,a.y+190);
  const row=await p.evaluate(()=>{
   const e=LiquidCursor.current.engine;
   const pending=Object.assign({},e.pending);if(!e.pending)throw Error('Native input did not queue');
   const n=e.stats.splats;
   // Declared timing fixture: the next slow frame crosses the real budget threshold.
   e.slowFrames=11;const now=performance.now();e.lastTime=now-116.7;e.lastInput=now;
   e.frame(now);if(e.raf)cancelAnimationFrame(e.raf);e.raf=0;
   const gl=e.gl,d=e.dye.read,data=new Float32Array(d.width*d.height*4);
   gl.bindFramebuffer(gl.FRAMEBUFFER,d.framebuffer);gl.readPixels(0,0,d.width,d.height,gl.RGBA,gl.FLOAT,data);
   let peak=0,active=0;for(let i=0;i<data.length;i+=4){let v=Math.max(data[i],data[i+1],data[i+2]);peak=Math.max(peak,v);if(v>.003)active++;}
   const error=gl.getError();gl.bindFramebuffer(gl.FRAMEBUFFER,null);
   e.pass('display',null,{source:d},{opacity:e.options.opacity});
   return {pending,splatDelta:e.stats.splats-n,quality:e.stats.quality,peak,active,error};
  });
  assert.equal(row.quality,'reduced');assert.equal(row.error,0);
  if(variant==='baseline'){assert.equal(row.splatDelta,0);assert.equal(row.peak,0);}
  else{assert.equal(row.splatDelta,1);assert(row.active>0);assert(row.peak>0);}
  await p.screenshot({path:path.join(HERE,'quality-'+rows.length+'-'+variant+'-'+intensity+'.png')});
  await p.mouse.move(160,a.y+190);await p.mouse.move(180,a.y+190);
  assert(await p.evaluate(()=>!!LiquidCursor.current.engine.pending));
  const scroll=await p.evaluate(()=>{
   const e=LiquidCursor.current.engine;window.dispatchEvent(new Event('scroll'));
   return e.pointer===null&&e.pending===null;
  });
  assert(scroll,'scroll clears actual queued input');
  await p.mouse.move(210,a.y+190);await p.mouse.move(240,a.y+190);
  assert(await p.evaluate(()=>!!LiquidCursor.current.engine.pending));
  await p.setViewportSize({width:1201,height:951});
  await p.waitForFunction(()=>LiquidCursor.current.engine.width===1201&&LiquidCursor.current.engine.height===951);
  const safety=await p.evaluate(()=>{
   const e=LiquidCursor.current.engine;
   window.removeEventListener('pointermove',window.probePause);
   // Actual viewport resize above, not a fabricated pending gesture.
   const viewportClears=e.pointer===null&&e.pending===null;
   for(let i=0;i<24;i++)e.watchBudget(100);
   return {viewportClears,paused:e.performancePaused,glReleased:e.gl===null,pending:e.pending};
  });
  assert(safety.viewportClears&&safety.paused&&safety.glReleased&&safety.pending===null,JSON.stringify(safety));
  assert.deepEqual(requests,[]);
  rows.push({variant,intensity,...row,safety:{...safety,scrollClears:scroll},requests});await p.close();
 }
 const proof={scope:'Real pointer input; declared slow-frame timing; unchanged shader execution and float dye readback. Not a physical performance measurement.',passed:rows.length,failed:0,rows};
 fs.writeFileSync(path.join(HERE,'candidate-results.json'),JSON.stringify(proof,null,2));console.log(JSON.stringify(proof,null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
