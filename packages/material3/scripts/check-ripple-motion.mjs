// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose-derived Ripple trace, native Ripple gallery and Chrome Web Animations. @output Native press interpolation, velocity and settling comparison. @position Permanent Ripple motion regression. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gallery = path.join(root, 'dist/gallery');
const sourceFile = path.join(root, 'fixtures/references/ripple/source-motion.json');
const sourceBytes = await fs.readFile(sourceFile);
assert.equal(createHash('sha256').update(sourceBytes).digest('hex'), '66fa157aa2e6aaafffaf5f8f6379e2d1c46eb1fbcf6ee2d184c57e75d5d6eb73');
const source = JSON.parse(sourceBytes);
assert.equal(source.source.composeCommit, 'a095da93f8e98dea8748ceed79ea8427aade245f');
assert.equal(source.press.samples, 456);
assert.equal(source.state.samples, 195);
const cubic = (first, second, t) => 3 * (1 - t) ** 2 * t * first + 3 * (1 - t) * t ** 2 * second + t ** 3;
function fastOutSlowIn(fraction) {
  if (fraction <= 0) return 0;
  if (fraction >= 1) return 1;
  let lo = 0, hi = 1;
  for (let step = 0; step < 32; step++) {
    const mid = (lo + hi) / 2;
    if (cubic(.4, .2, mid) < fraction) lo = mid;
    else hi = mid;
  }
  return cubic(0, 1, (lo + hi) / 2);
}
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(gallery, `.${pathname}`);
    if (!file.startsWith(gallery + path.sep)) throw new Error('Outside gallery');
    response.setHeader('Content-Type', {'.html':'text/html','.js':'text/javascript','.css':'text/css','.ttf':'font/ttf'}[path.extname(file)] || 'application/octet-stream');
    response.end(await fs.readFile(file));
  } catch {response.writeHead(404).end();}
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({channel:'chrome',headless:true,executablePath:process.env.M3_BROWSER_EXECUTABLE});
try {
  let maxPosition = 0, maxVelocity = 0, maxAlpha = 0, maxAlphaVelocity = 0;
  const traces = [];
  for (const bounded of [true, false]) {
    const page = await browser.newPage({viewport:{width:960,height:360},deviceScaleFactor:1});
    await page.goto(`http://127.0.0.1:${server.address().port}/fixtures/ripple-compare.html`);
    await page.waitForFunction(() => document.querySelectorAll('[data-md-ripple-ready]').length === 2);
    const actual = await page.evaluate(bounded => {
      const owner = document.getElementById(bounded ? 'bounded' : 'unbounded');
      const rect = owner.getBoundingClientRect();
      owner.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1,clientX:rect.left+40,clientY:rect.top+30}));
      const moving = owner.querySelector('[data-md-ripple-ready]').children[1].children[0];
      const circle = moving.children[0];
      const position = moving.getAnimations()[0];
      const growth = circle.getAnimations().find(animation => animation.effect.getTiming().duration === 225);
      const entry = circle.getAnimations().find(animation => animation.effect.getTiming().duration === 75);
      const timings = [position,growth,entry].map(animation => ({duration:animation.effect.getTiming().duration,easing:animation.effect.getTiming().easing}));
      for (const animation of [position,growth,entry]) animation.pause();
      const samples = [];
      for (let timeMs=0; timeMs<=225; timeMs+=5) {
        for (const animation of [position,growth,entry]) animation.currentTime=timeMs;
        const positionProgress=position.effect.getComputedTiming().progress;
        const growthProgress=growth.effect.getComputedTiming().progress;
        const entryProgress=entry.effect.getComputedTiming().progress;
        const radiusStart=66, radiusEnd=Math.hypot(220,92)/2+(bounded?10:0);
        const xStart=bounded?40:110, yStart=bounded?30:46;
        samples.push({timeMs,radius:radiusStart+(radiusEnd-radiusStart)*growthProgress,
          x:xStart+(110-xStart)*positionProgress,y:yStart+(46-yStart)*positionProgress,alpha:entryProgress});
      }
      return {timings,samples};
    }, bounded);
    assert.deepEqual(actual.timings, [
      {duration:225,easing:'linear'},
      {duration:225,easing:'cubic-bezier(0.4, 0, 0.2, 1)'},
      {duration:75,easing:'linear'},
    ]);
    traces.push({bounded, samples: actual.samples, settledAtMs: 225});
    let previous = null;
    for (const sample of actual.samples) {
      const fraction=sample.timeMs/225;
      const radius=66+(Math.hypot(220,92)/2+(bounded?10:0)-66)*fastOutSlowIn(fraction);
      const x=(bounded?40:110)+(110-(bounded?40:110))*fraction;
      const y=(bounded?30:46)+(46-(bounded?30:46))*fraction;
      const alpha=Math.min(sample.timeMs/75,1);
      const errors=[Math.abs(sample.radius-radius),Math.abs(sample.x-x),Math.abs(sample.y-y)];
      maxPosition=Math.max(maxPosition,...errors);
      maxAlpha=Math.max(maxAlpha,Math.abs(sample.alpha-alpha));
      if (previous) {
        maxVelocity=Math.max(maxVelocity,...errors.map((error,index) => Math.abs((sample[['radius','x','y'][index]]-previous.actual[['radius','x','y'][index]]-( [radius,x,y][index]-previous.source[index]))/0.005)));
        maxAlphaVelocity=Math.max(maxAlphaVelocity,Math.abs((sample.alpha-previous.actual.alpha-(alpha-previous.alpha))/0.005));
      }
      previous={actual:sample,source:[radius,x,y],alpha};
    }
    const end=actual.samples.at(-1);
    assert.equal(end.timeMs,225);
    assert.ok(Math.abs(end.radius-(Math.hypot(220,92)/2+(bounded?10:0)))<.001);
    await page.close();
  }
  assert.ok(maxPosition <= .001, `position ${maxPosition}px`);
  assert.ok(maxVelocity <= .2, `velocity ${maxVelocity}px/s`);
  assert.ok(maxAlpha <= .000001, `alpha ${maxAlpha}`);
  assert.ok(maxAlphaVelocity <= .0005, `alpha velocity ${maxAlphaVelocity}/s`);
  const recordIndex = process.argv.indexOf('--record');
  if (recordIndex >= 0) {
    const destination = process.argv[recordIndex + 1];
    assert.ok(destination && !destination.startsWith('-'), 'Missing native Ripple trace destination');
    await fs.writeFile(destination, JSON.stringify({
      schemaVersion: 1,
      producer: {kind: 'browser', command: 'node packages/material3/scripts/check-ripple-motion.mjs --record', browser: `Chrome ${browser.version()}`, method: 'Native Ripple Web Animations API samples'},
      inputs: {size: {width: 220, height: 92}, origin: {x: 40, y: 30}, startMs: 0},
      unit: 'alpha-radius-px-center-px',
      traces,
    }, null, 2) + '\n');
  }
  process.stdout.write(JSON.stringify({maxPosition,maxVelocity,maxAlpha,maxAlphaVelocity,settlingDifferenceMs:0})+'\n');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
