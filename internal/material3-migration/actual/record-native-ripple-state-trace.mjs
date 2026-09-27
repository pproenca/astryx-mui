// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native Ripple state fixture and pinned Compose event times. @output Independent 5 ms Chrome state-layer opacity recording. @position Disposable M3-GAP-013 numeric motion evidence. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const gallery = path.join(repo, 'packages/material3/dist/gallery');
const source = JSON.parse(await fs.readFile(path.join(repo, 'internal/material3-migration/sources/ripple-reference/state-motion-manifest.json')));
const destination = path.join(repo, 'internal/material3-migration/actual/M3-GAP-013/compose-ripple-state-layer.json');
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
const browser = await chromium.launch({channel:'chrome', headless:true, executablePath:process.env.M3_BROWSER_EXECUTABLE});
try {
  const page = await browser.newPage({viewport:{width:960,height:360},deviceScaleFactor:1});
  await page.clock.install({time:new Date('2026-09-27T00:00:00Z')});
  await page.goto(`http://127.0.0.1:${server.address().port}/fixtures/ripple-state-compare.html?scheme=light`);
  await page.waitForFunction(() => document.querySelector('#generic [data-md-ripple-ready]'));
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  const actions = ['enter','drag-on','drag-off','leave','focus','blur','drag-on','drag-off','drag-on','drag-off'];
  assert.equal(actions.length, source.sourceValues.events.length);
  const events = source.sourceValues.events;
  const samples = [];
  let eventIndex = 0, eventStart = 0;
  for (let timeMs = 0; timeMs <= 970; timeMs += 5) {
    await page.evaluate(({timeMs,eventStart}) => {
      const layer = document.querySelector('#generic [data-md-ripple-ready]').firstElementChild;
      const animation = layer.getAnimations().at(-1);
      if (animation) {animation.pause();animation.currentTime = Math.min(timeMs-eventStart, animation.effect.getTiming().duration);}
      void getComputedStyle(layer).opacity;
    }, {timeMs,eventStart});
    if (eventIndex < events.length && events[eventIndex].timeMs === timeMs) {
      const action = actions[eventIndex++];
      if (action === 'focus') await page.keyboard.press('Tab');
      else if (action === 'blur') await page.evaluate(() => document.activeElement.blur());
      else if (action.startsWith('drag')) await page.evaluate(value => window.dispatchEvent(new CustomEvent('set-dragged', {detail:value})), action === 'drag-on');
      else await page.evaluate(action => document.getElementById('generic').dispatchEvent(new PointerEvent(action === 'enter' ? 'pointerenter' : 'pointerleave')), action);
      eventStart = timeMs;
    }
    const alpha = await page.evaluate(({timeMs,eventStart}) => {
      const layer = document.querySelector('#generic [data-md-ripple-ready]').firstElementChild;
      const animation = layer.getAnimations().at(-1);
      if (animation) {animation.pause();animation.currentTime = Math.min(timeMs-eventStart, animation.effect.getTiming().duration);}
      return Number(getComputedStyle(layer).opacity);
    }, {timeMs,eventStart});
    samples.push({timeMs,alpha});
  }
  assert.equal(eventIndex, events.length);
  assert.equal(samples.length,195);
  await fs.writeFile(destination, JSON.stringify({schemaVersion:1,producer:{kind:'browser',command:'node internal/material3-migration/actual/record-native-ripple-state-trace.mjs',browser:`Chrome ${browser.version()}`,method:'Native Ripple state-layer WAAPI computed opacity'},inputs:{events},unit:'alpha',settledAtMs:970,samples},null,2)+'\n');
  process.stdout.write(`Recorded ${samples.length} native Ripple state samples.\n`);
  await page.close();
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
