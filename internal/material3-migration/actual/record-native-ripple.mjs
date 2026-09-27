// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native Ripple gallery and Chrome. @output Native press/state playback and measured response/frame pacing. @position Disposable M3-GAP-013 motion and performance capture. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const gallery=path.join(repo,'packages/material3/dist/gallery');
const output=path.join(repo,'internal/material3-migration/actual/M3-GAP-013');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.ttf':'font/ttf'};
const server=http.createServer(async(request,response)=>{
  try{
    const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    const file=path.resolve(gallery,`.${pathname}`);
    if(!file.startsWith(gallery+path.sep))throw new Error('Outside gallery');
    response.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    response.end(await fs.readFile(file));
  }catch{response.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({channel:'chrome',headless:true,executablePath:process.env.M3_BROWSER_EXECUTABLE});
try{
  await fs.mkdir(output,{recursive:true});
  const pressContext=await browser.newContext({viewport:{width:960,height:360},deviceScaleFactor:1,recordVideo:{dir:output,size:{width:960,height:360}}});
  const press=await pressContext.newPage();
  await press.goto(`http://127.0.0.1:${server.address().port}/fixtures/ripple-compare.html`);
  await press.waitForFunction(()=>document.querySelectorAll('[data-md-ripple-ready]').length===2);
  await press.evaluate(()=>document.fonts.ready);
  await press.waitForTimeout(160);
  const dispatch=async(kind,id,x=40,y=30)=>press.evaluate(({kind,id,x,y})=>{
    for(const owner of [document.getElementById('bounded'),document.getElementById('unbounded')]){
      if(kind==='down'){
        const rect=owner.getBoundingClientRect();
        owner.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:id,clientX:rect.left+x,clientY:rect.top+y}));
      }
    }
    if(kind==='up')document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:id}));
  },{kind,id,x,y});
  await dispatch('down',1);
  await press.waitForTimeout(50);
  await dispatch('up',1);
  await press.waitForTimeout(110);
  await dispatch('down',2,180,62);
  await press.waitForTimeout(140);
  await dispatch('up',2);
  await dispatch('down',3,110,40);
  await press.waitForTimeout(100);
  await dispatch('up',3);
  await press.waitForTimeout(350);
  const pressVideo=press.video();
  assert.ok(pressVideo);
  await pressContext.close();
  await fs.rename(await pressVideo.path(),path.join(output,'native-ripple-press.webm'));

  const stateContext=await browser.newContext({viewport:{width:980,height:940},deviceScaleFactor:1,recordVideo:{dir:output,size:{width:980,height:940}}});
  const state=await stateContext.newPage();
  await state.goto(`http://127.0.0.1:${server.address().port}/fixtures/ripple.html?playback=1`);
  await state.waitForFunction(()=>document.querySelector('[data-testid="bounded-ripple"]')?.dataset.mdRippleReady==='true');
  await state.waitForTimeout(120);
  const box=await state.locator('#bounded-owner').boundingBox();
  assert.ok(box);
  await state.mouse.move(box.x+40,box.y+30);
  await state.waitForTimeout(100);
  await state.locator('#drag-toggle').check();
  await state.waitForTimeout(100);
  await state.locator('#drag-toggle').uncheck();
  await state.waitForTimeout(70);
  await state.mouse.move(5,5);
  await state.waitForTimeout(70);
  await state.keyboard.press('Tab');
  await state.waitForTimeout(140);
  await state.locator('#scheme').selectOption('dark');
  await state.waitForTimeout(130);
  await state.locator('#drag-toggle').check();
  await state.waitForTimeout(80);
  await state.locator('#drag-toggle').uncheck();
  await state.waitForTimeout(200);
  await state.emulateMedia({reducedMotion:'reduce'});
  await state.locator('#drag-toggle').check();
  await state.waitForTimeout(80);
  await state.locator('#drag-toggle').uncheck();
  await state.waitForTimeout(120);
  const stateVideo=state.video();
  assert.ok(stateVideo);
  await stateContext.close();
  await fs.rename(await stateVideo.path(),path.join(output,'native-ripple-state.webm'));

  const perf=await browser.newPage({viewport:{width:980,height:940},deviceScaleFactor:1});
  await perf.goto(`http://127.0.0.1:${server.address().port}/fixtures/ripple.html`);
  await perf.waitForFunction(()=>document.querySelector('[data-testid="bounded-ripple"]')?.dataset.mdRippleReady==='true');
  await perf.locator('#bounded-owner').focus();
  await perf.evaluate(()=>{
    window.__inputLatencyMs=[];
    document.getElementById('bounded-owner').addEventListener('keydown',event=>{
      requestAnimationFrame(()=>window.__inputLatencyMs.push(performance.now()-event.timeStamp));
    });
  });
  for(let index=0;index<30;index++)await perf.keyboard.press('Space');
  await perf.waitForFunction(()=>window.__inputLatencyMs.length===30);
  const inputLatencyMs=await perf.evaluate(()=>window.__inputLatencyMs);
  const frameIntervalsMs=await perf.evaluate(()=>new Promise(resolve=>{
    const frames=[];
    const owner=document.getElementById('bounded-owner');
    let pointerId=100;
    const timer=setInterval(()=>{
      const id=pointerId++;
      const rect=owner.getBoundingClientRect();
      owner.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:id,clientX:rect.left+40,clientY:rect.top+30}));
      setTimeout(()=>document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:id})),55);
    },180);
    let previous;
    function frame(now){
      if(previous!==undefined)frames.push(now-previous);
      previous=now;
      if(frames.length>=300){clearInterval(timer);resolve(frames);}
      else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }));
  const performance={
    producer:{kind:'browser',command:'node internal/material3-migration/actual/record-native-ripple.mjs'},
    environment:{browser:`Chrome ${browser.version()}`,os:`${os.platform()} ${os.release()}`,device:'macOS desktop reference',refreshRateHz:60},
    inputLatencyMs,frameIntervalsMs,
  };
  await fs.writeFile(path.join(output,'performance.json'),`${JSON.stringify(performance,null,2)}\n`);
  const maxInput=Math.max(...inputLatencyMs);
  const over20Ratio=frameIntervalsMs.filter(value=>value>20).length/frameIntervalsMs.length;
  assert.ok(maxInput<=100,`Input response ${maxInput}ms exceeds approved budget`);
  assert.ok(over20Ratio<=0.05,`Long-frame ratio ${over20Ratio} exceeds approved budget`);
  process.stdout.write(`${JSON.stringify({pressVideo:'native-ripple-press.webm',stateVideo:'native-ripple-state.webm',inputSamples:inputLatencyMs.length,maxInputLatencyMs:maxInput,frameSamples:frameIntervalsMs.length,over20Ratio,maxFrameMs:Math.max(...frameIntervalsMs)})}\n`);
  await perf.close();
}finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
