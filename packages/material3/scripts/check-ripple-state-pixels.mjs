// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Retained pinned Compose state frames, native Ripple comparison fixture and Chrome. @output Permanent 16-frame state-layer pixel regression. @position Native package visual acceptance after the migration harness is removed. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';
import {chromium} from 'playwright';

const packageRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const gallery=path.join(packageRoot,'dist/gallery');
const source=path.join(packageRoot,'fixtures/references/ripple');
const manifest=JSON.parse(await fs.readFile(path.join(source,'manifest.json')));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.ttf':'font/ttf'};
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
const events=[
  {timeMs:0,kind:'enter'},
  {timeMs:80,kind:'drag',value:true},
  {timeMs:180,kind:'drag',value:false},
  {timeMs:220,kind:'leave'},
  {timeMs:300,kind:'focus'},
  {timeMs:420,kind:'blur'},
  {timeMs:500,kind:'drag',value:true},
  {timeMs:530,kind:'drag',value:false},
  {timeMs:720,kind:'drag',value:true},
  {timeMs:820,kind:'drag',value:false},
];
const frames=[100,187,320,520,580,870];
const actions={100:'drag over hover',187:'drag stop; hover remains',320:'focus enter',520:'drag enter',580:'early drag cancel',870:'drag exit'};
// Values are independently derived from the pinned 15/45/150ms linear state tweens.
const alpha={100:0.08+(0.16-0.08)*20/45,187:0.16+(0.08-0.16)*7/15,320:0.1*20/45,520:0.16*20/45,580:(0.16*30/45)*(1-50/150),870:0.16*(1-50/150)};
const setup=async(scheme,reduced)=>{
  const pages=[];
  for(const focusOwner of ['generic','button']){
    const page=await browser.newPage({viewport:{width:960,height:360},deviceScaleFactor:1,reducedMotion:reduced?'reduce':'no-preference'});
    await page.clock.install({time:new Date('2026-09-27T00:00:00Z')});
    await page.goto(`http://127.0.0.1:${server.address().port}/fixtures/ripple-state-compare.html?scheme=${scheme}`);
    await page.waitForFunction(()=>document.querySelectorAll('[data-md-ripple-ready]').length===2);
    await page.evaluate(()=>document.fonts.ready);
    await page.clock.pauseAt(new Date(Date.now()+1000));
    pages.push({page,focusOwner});
  }
  return pages;
};
const composite=async pages=>{
  const base=PNG.sync.read(await pages[0].page.screenshot());
  const second=PNG.sync.read(await pages[1].page.screenshot());
  for(let y=99;y<191;y++)for(let x=424;x<644;x++){
    const offset=(y*960+x)*4;
    second.data.copy(base.data,offset,offset,offset+4);
  }
  return PNG.sync.write(base);
};
const sync=async(pages,timeMs,eventTime)=>{
  for(const {page} of pages)await page.evaluate(({timeMs,eventTime})=>{
    for(const root of document.querySelectorAll('[data-md-ripple-ready]')){
      const layer=root.firstElementChild;
      for(const animation of layer.getAnimations()){
        animation.pause();
        animation.currentTime=Math.min(timeMs-eventTime,animation.effect.getTiming().duration);
      }
      void getComputedStyle(layer).opacity;
    }
  },{timeMs,eventTime});
};
const fire=async(pages,event)=>{
  for(const {page,focusOwner} of pages){
    if(event.kind==='focus'){
      await page.keyboard.press('Tab');
      if(focusOwner==='button')await page.keyboard.press('Tab');
    }else if(event.kind==='blur')await page.evaluate(()=>document.activeElement.blur());
    else await page.evaluate(event=>{
      if(event.kind==='drag')window.dispatchEvent(new CustomEvent('set-dragged',{detail:event.value}));
      else for(const id of ['generic','button'])document.getElementById(id).dispatchEvent(new PointerEvent(event.kind==='enter'?'pointerenter':'pointerleave'));
    },event);
  }
};
const setStage=async(pages,timeMs,reduced)=>{
  const selected=events.filter(event=>event.timeMs<=timeMs).at(-1);
  const value=reduced?(selected.value?0.16:0):alpha[timeMs];
  const action=reduced?(timeMs===500?'drag enter':'early drag cancel'):actions[timeMs];
  const label=`${reduced?'Reduced motion · ':''}${action} · ${timeMs}ms · alpha ${value.toFixed(4)}`;
  for(const {page} of pages)await page.evaluate(label=>{document.getElementById('stage').textContent=label;},label);
};
const compare=async(name,pages)=>{
  const reference=await fs.readFile(path.join(source,name));
  assert.equal(createHash('sha256').update(reference).digest('hex'),manifest.stateLayer.frames[name]);
  const expected=PNG.sync.read(reference);
  let genericChanged,buttonChanged,outsideChanged,genericMax,buttonMax;
  for(let attempt=0;attempt<6;attempt++){
    const actual=PNG.sync.read(await composite(pages));
    assert.equal(actual.width,960);
    assert.equal(actual.height,360);
    genericChanged=buttonChanged=outsideChanged=genericMax=buttonMax=0;
    for(let index=0;index<actual.data.length;index+=4){
      const delta=Math.max(...[0,1,2,3].map(channel=>Math.abs(actual.data[index+channel]-expected.data[index+channel])));
      if(!delta)continue;
      const pixel=index/4,x=pixel%960,y=Math.floor(pixel/960);
      if(x>=76&&x<296&&y>=99&&y<191){genericChanged++;genericMax=Math.max(genericMax,delta);}
      else if(x>=424&&x<644&&y>=99&&y<191){buttonChanged++;buttonMax=Math.max(buttonMax,delta);}
      else outsideChanged++;
    }
    if(genericMax<=manifest.stateLayer.genericMaxChannelDifference&&buttonMax<=manifest.stateLayer.buttonMaxChannelDifference&&buttonChanged<=manifest.stateLayer.buttonMaxChangedPixels&&outsideChanged===manifest.stateLayer.outsideChangedPixels)break;
  }
  assert.ok(genericMax<=manifest.stateLayer.genericMaxChannelDifference,`${name}: generic delta ${genericMax}`);
  assert.ok(buttonMax<=manifest.stateLayer.buttonMaxChannelDifference,`${name}: button delta ${buttonMax}`);
  assert.ok(buttonChanged<=manifest.stateLayer.buttonMaxChangedPixels,`${name}: button changed ${buttonChanged}`);
  assert.equal(outsideChanged,manifest.stateLayer.outsideChangedPixels,`${name}: outside changed`);
  process.stdout.write(`${name}: generic ${genericChanged} px / max ${genericMax} channel, button ${buttonChanged} px / max ${buttonMax} channel, outside ${outsideChanged}\n`);
};
try{
  assert.equal(Object.keys(manifest.stateLayer.frames).length,16);
  for(const scheme of ['light','dark']){
    const pages=await setup(scheme,false);
    let current=0,eventIndex=0,eventTime=0;
    for(const timeMs of frames){
      while(eventIndex<events.length&&events[eventIndex].timeMs<=timeMs){
        const event=events[eventIndex++];
        for(const {page} of pages)await page.clock.runFor(event.timeMs-current);
        current=event.timeMs;
        await sync(pages,current,eventTime);
        await fire(pages,event);
        eventTime=current;
        await sync(pages,current,eventTime);
      }
      for(const {page} of pages)await page.clock.runFor(timeMs-current);
      current=timeMs;
      await sync(pages,current,eventTime);
      await setStage(pages,timeMs,false);
      await compare(`state-motion-${scheme}-${String(timeMs).padStart(4,'0')}.png`,pages);
    }
    for(const {page} of pages)await page.close();
    const reducedPages=await setup(scheme,true);
    for(const timeMs of [500,530]){
      await fire(reducedPages,{kind:'drag',value:timeMs===500});
      await setStage(reducedPages,timeMs,true);
      await compare(`state-motion-${scheme}-reduced-${timeMs}.png`,reducedPages);
    }
    for(const {page} of reducedPages)await page.close();
  }
  process.stdout.write('Native Ripple state-layer pixels match the pinned source within approved raster limits.\n');
}finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
