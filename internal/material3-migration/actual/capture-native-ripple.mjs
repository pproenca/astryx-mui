// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose Ripple baseline, built native comparison fixture and Chrome. @output Revision-bound native press frames and measured differences. @position Disposable M3-GAP-013 visual capture; permanent representative checks live in packages/material3. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';
import {chromium} from 'playwright';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const gallery = path.join(repo, 'packages/material3/dist/gallery');
const output = path.join(repo, 'internal/material3-migration/actual/M3-GAP-013');
const source = JSON.parse(await fs.readFile(path.join(repo, 'internal/material3-migration/sources/baseline/ripple-compose-first.json')));
const scenarios = source.scenarios.filter(item => item.id.startsWith('ripple-'));
const stateSource = JSON.parse(await fs.readFile(path.join(repo, 'internal/material3-migration/sources/ripple-reference/state-motion-manifest.json')));
const check = process.argv.includes('--check');
const stateOnly = process.argv.includes('--state-only');
const events = [
  {timeMs:0,kind:'down',id:1,x:40,y:30},
  {timeMs:50,kind:'up',id:1},
  {timeMs:160,kind:'down',id:2,x:180,y:62},
  {timeMs:300,kind:'up',id:2},
  {timeMs:300,kind:'down',id:3,x:110,y:40},
  {timeMs:400,kind:'up',id:3},
];
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
try{
  if(!check)await fs.mkdir(path.join(output,'diff'),{recursive:true});
  const results=[];
  const measure=(item,bytes,expected)=>{
    const image=PNG.sync.read(bytes);
    assert.equal(image.width,expected.width);
    assert.equal(image.height,expected.height);
    const diff=new PNG({width:image.width,height:image.height});
    const changed=pixelmatch(expected.data,image.data,diff.data,image.width,image.height,{threshold:0});
    if(!item.id.startsWith('state-motion'))return {changed,diff,accepted:changed<=5};
    let genericChanged=0,buttonChanged=0,outsideChanged=0,genericMaxChannel=0,buttonMaxChannel=0;
    for(let index=0;index<image.data.length;index+=4){
      const delta=Math.max(...[0,1,2,3].map(channel=>Math.abs(image.data[index+channel]-expected.data[index+channel])));
      if(!delta)continue;
      const pixel=index/4,x=pixel%image.width,y=Math.floor(pixel/image.width);
      if(x>=76&&x<296&&y>=99&&y<191){genericChanged++;genericMaxChannel=Math.max(genericMaxChannel,delta);}
      else if(x>=424&&x<644&&y>=99&&y<191){buttonChanged++;buttonMaxChannel=Math.max(buttonMaxChannel,delta);}
      else outsideChanged++;
    }
    return {changed,diff,stateChangedPixels:genericChanged+buttonChanged+outsideChanged,genericChanged,buttonChanged,outsideChanged,genericMaxChannel,buttonMaxChannel,
      accepted:outsideChanged===0&&genericMaxChannel<=1&&buttonMaxChannel<=5&&buttonChanged<=600};
  };
  const capture=async(item,screenshot)=>{
    const expected=PNG.sync.read(await fs.readFile(path.join(repo,item.baseline)));
    let actual,metrics;
    for(let attempt=0;attempt<6;attempt++){
      actual=await screenshot();
      metrics=measure(item,actual,expected);
      if(metrics.accepted)break;
    }
    const {diff,...summary}=metrics;
    process.stdout.write(`${item.id}: ${item.id.startsWith('state-motion')?summary.stateChangedPixels:summary.changed} changed pixels${item.id.startsWith('state-motion')?`, generic max ${summary.genericMaxChannel}, button max ${summary.buttonMaxChannel}, outside ${summary.outsideChanged}`:''}\n`);
    if(check){
      const retained=measure(item,await fs.readFile(path.join(output,`${item.id}.png`)),expected);
      assert.ok(retained.accepted,`${item.id}: retained native frame exceeds comparison rule`);
    }else{
      await fs.writeFile(path.join(output,`${item.id}.png`),actual);
      await fs.writeFile(path.join(output,'diff',`${item.id}.png`),PNG.sync.write(diff));
    }
    assert.ok(metrics.accepted,`${item.id}: native frame exceeds comparison rule`);
    results.push({id:item.id,actualSha256:createHash('sha256').update(actual).digest('hex'),...summary});
  };
  if(!stateOnly)for(const scheme of ['light','dark']){
    const page=await browser.newPage({viewport:{width:960,height:360},deviceScaleFactor:1});
    await page.clock.install({time:new Date('2026-09-27T00:00:00Z')});
    await page.goto(`http://127.0.0.1:${server.address().port}/fixtures/ripple-compare.html?scheme=${scheme}`);
    await page.waitForFunction(()=>document.querySelectorAll('[data-md-ripple-ready]').length===2);
    await page.evaluate(()=>document.fonts.ready);
    await page.clock.pauseAt(new Date(Date.now()+1000));
    let currentTime=0,eventIndex=0;
    const sync=async timeMs=>page.evaluate(timeMs=>{
      for(const owner of [document.getElementById('bounded'),document.getElementById('unbounded')]){
        const layer=owner.querySelector('[data-md-ripple-ready]').children[1];
        for(const moving of [...layer.children]){
          const start=Number(moving.dataset.startMs);
          const releasedAt=moving.dataset.releasedAt === undefined ? Infinity : Number(moving.dataset.releasedAt);
          const elapsed=Math.max(0,timeMs-start);
          const circle=moving.children[0];
          for(const animation of [moving.getAnimations()[0],...circle.getAnimations()]){
            if(!animation)continue;
            animation.pause();
            const duration=animation.effect.getTiming().duration;
            animation.currentTime=duration===150
              ? Math.max(0,timeMs-start-225)
              : duration===75 && timeMs>=releasedAt
                ? duration
                : Math.min(elapsed,duration);
          }
          // Force the paused animation sample into the first compositor frame.
          void getComputedStyle(circle).opacity;
        }
      }
    },timeMs);
    const fire=async event=>page.evaluate(event=>{
      for(const owner of [document.getElementById('bounded'),document.getElementById('unbounded')]){
        if(event.kind==='down'){
          const rect=owner.getBoundingClientRect();
          owner.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:event.id,clientX:rect.left+event.x,clientY:rect.top+event.y}));
          owner.querySelector('[data-md-ripple-ready]').children[1].lastElementChild.dataset.startMs=String(event.timeMs);
        }
      }
      if(event.kind==='up'){
        for(const owner of [document.getElementById('bounded'),document.getElementById('unbounded')]){
          const layer=owner.querySelector('[data-md-ripple-ready]').children[1];
          layer.lastElementChild.dataset.releasedAt=String(event.timeMs);
        }
        document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:event.id}));
      }
    },event);
    for(const item of scenarios.filter(item=>item.environment.theme===scheme && !item.id.includes('reduced'))){
      const invisibleNewPresses=[];
      while(eventIndex<events.length && events[eventIndex].timeMs<=item.timeMs){
        const event=events[eventIndex++];
        if(event.kind==='down' && event.timeMs===item.timeMs){
          invisibleNewPresses.push(event);
          continue;
        }
        await page.clock.runFor(event.timeMs-currentTime);
        currentTime=event.timeMs;
        await sync(currentTime);
        await fire(event);
        await sync(currentTime);
      }
      await page.clock.runFor(item.timeMs-currentTime);
      currentTime=item.timeMs;
      await sync(currentTime);
      await page.evaluate(timeMs=>{
        document.getElementById('stage').textContent=`Press 0ms · release 50ms · press 160ms · press 300ms · release 400ms · ${timeMs}ms`;
      },item.timeMs);
      await capture(item,()=>page.screenshot());
      for(const event of invisibleNewPresses){
        await fire(event);
        await sync(currentTime);
      }
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const item of scenarios.filter(item=>item.environment.theme===scheme && item.id.includes('reduced'))){
      const active=item.id.endsWith('-press');
      await page.evaluate(active=>{
        for(const owner of [document.getElementById('bounded'),document.getElementById('unbounded')]){
          const rect=owner.getBoundingClientRect();
          if(active)owner.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:4,clientX:rect.left+40,clientY:rect.top+30}));
        }
        if(!active)document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:4}));
        document.getElementById('stage').textContent=active
          ? 'Reduced motion · immediately visible pressed state'
          : 'Reduced motion · immediately cleared after release';
        for(const circle of document.querySelectorAll('[data-md-ripple-ready] > span:nth-child(2) > span > span'))void getComputedStyle(circle).opacity;
      },active);
      await capture(item,()=>page.screenshot());
    }
    await page.close();
  }
  const stateEvents=[
    {timeMs:0,kind:'enter',state:'hover'},
    {timeMs:80,kind:'drag',value:true,state:'drag'},
    {timeMs:180,kind:'drag',value:false,state:'hover'},
    {timeMs:220,kind:'leave',state:'rest'},
    {timeMs:300,kind:'focus',state:'focus'},
    {timeMs:420,kind:'blur',state:'rest'},
    {timeMs:500,kind:'drag',value:true,state:'drag'},
    {timeMs:530,kind:'drag',value:false,state:'rest'},
    {timeMs:720,kind:'drag',value:true,state:'drag'},
    {timeMs:820,kind:'drag',value:false,state:'rest'},
  ];
  for(const scheme of ['light','dark']){
    const stateScenarios=source.scenarios.filter(item=>item.id.startsWith(`state-motion-${scheme}-`));
    const normal=stateScenarios.filter(item=>!item.id.includes('reduced'));
    const setup=async reduced=>{
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
    const syncState=async(pages,timeMs,eventTime)=>{
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
    const setStage=async(pages,item,reduced)=>{
      const sample=stateSource.samples[item.timeMs];
      const event=stateEvents.filter(value=>value.timeMs<=item.timeMs).at(-1);
      const alpha=reduced?(event.state==='drag'?0.16:0):sample.alpha;
      const label=`${reduced?'Reduced motion · ':''}${sample.action} · ${item.timeMs}ms · alpha ${alpha.toFixed(4)}`;
      for(const {page} of pages)await page.evaluate(label=>{document.getElementById('stage').textContent=label;},label);
    };
    const fireState=async(pages,event)=>{
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
    const pages=await setup(false);
    let current=0,eventIndex=0,eventTime=0;
    for(const item of normal){
      while(eventIndex<stateEvents.length && stateEvents[eventIndex].timeMs<=item.timeMs){
        const event=stateEvents[eventIndex++];
        for(const {page} of pages)await page.clock.runFor(event.timeMs-current);
        current=event.timeMs;
        await syncState(pages,current,eventTime);
        await fireState(pages,event);
        eventTime=current;
        await syncState(pages,current,eventTime);
      }
      for(const {page} of pages)await page.clock.runFor(item.timeMs-current);
      current=item.timeMs;
      await syncState(pages,current,eventTime);
      await setStage(pages,item,false);
      await capture(item,()=>composite(pages));
    }
    for(const {page} of pages)await page.close();
    const reducedPages=await setup(true);
    for(const item of stateScenarios.filter(value=>value.id.includes('reduced'))){
      await fireState(reducedPages,{kind:'drag',value:item.timeMs===500});
      await setStage(reducedPages,item,true);
      await capture(item,()=>composite(reducedPages));
    }
    for(const {page} of reducedPages)await page.close();
  }
  if(!stateOnly){
    assert.equal(results.length,source.scenarios.length);
    const manifest={schemaVersion:1,browser:`Chrome ${browser.version()}`,sourceDecision:'internal/material3-migration/sources/baseline/ripple-compose-first.json',pressMaxChangedPixels:5,stateGenericMaxChannel:1,stateButtonMaxChannel:5,stateButtonMaxChangedPixels:600,stateOutsideChangedPixels:0,results};
    if(check){
      const retained=JSON.parse(await fs.readFile(path.join(output,'comparison.json')));
      assert.deepEqual(retained.results.map(item=>item.id),results.map(item=>item.id));
    }else await fs.writeFile(path.join(output,'comparison.json'),`${JSON.stringify(manifest,null,2)}\n`);
  }
}finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
