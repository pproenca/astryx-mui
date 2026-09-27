// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native FocusRing comparison and interactive gallery fixtures. @output Watched-review WebM and measured keyboard response/frame pacing. @position Disposable M3-GAP-011 motion and performance capture. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const gallery = path.join(repo, 'packages/material3/dist/gallery');
const output = path.join(repo, 'internal/material3-migration/actual/M3-GAP-011');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.ttf':'font/ttf'};
const server = http.createServer(async (request,response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    const file = path.resolve(gallery,`.${pathname}`);
    if (!file.startsWith(gallery+path.sep)) throw new Error('Outside gallery');
    response.setHeader('Content-Type',mime[path.extname(file)] || 'application/octet-stream');
    response.end(await fs.readFile(file));
  } catch {response.writeHead(404).end();}
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const browser = await chromium.launch({channel:'chrome',headless:true,executablePath:process.env.M3_BROWSER_EXECUTABLE});
try {
  await fs.mkdir(output,{recursive:true});
  const context = await browser.newContext({
    viewport:{width:960,height:360},deviceScaleFactor:1,
    recordVideo:{dir:output,size:{width:960,height:360}},
  });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/fixtures/focus-ring-compare.html`);
  await page.locator('#standard-target span').waitFor({state:'attached'});
  await page.locator('#expressive-target span').waitFor({state:'attached'});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(120);
  await page.locator('#driver').evaluate(node => node.blur());
  await page.waitForTimeout(40);
  await page.locator('#driver').evaluate(node => node.focus());
  await page.waitForTimeout(440);
  await page.locator('#driver').evaluate(node => node.blur());
  await page.waitForTimeout(350);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#driver').evaluate(node => node.focus());
  await page.waitForTimeout(320);
  const video = page.video();
  assert.ok(video,'Missing native FocusRing recording');
  await context.close();
  const videoPath = await video.path();
  await fs.rename(videoPath,path.join(output,'native-focus.webm'));

  const perf = await browser.newPage({viewport:{width:1100,height:900},deviceScaleFactor:1});
  await perf.goto(`http://127.0.0.1:${server.address().port}/fixtures/focus-ring.html`);
  await perf.locator('#inset-owner').waitFor();
  await perf.keyboard.press('Tab');
  await perf.keyboard.press('Tab');
  await perf.keyboard.press('Tab');
  await perf.keyboard.press('Tab');
  await perf.keyboard.press('Tab');
  await perf.evaluate(() => {
    window.__inputLatencyMs = [];
    document.querySelector('#inset-owner').addEventListener('keydown', event => {
      requestAnimationFrame(() => window.__inputLatencyMs.push(performance.now() - event.timeStamp));
    });
  });
  for (let index=0;index<30;index++) await perf.keyboard.press('Space');
  await perf.waitForFunction(() => window.__inputLatencyMs.length === 30);
  const inputLatencyMs = await perf.evaluate(() => window.__inputLatencyMs);
  const frameIntervalsMs = await perf.evaluate(() => new Promise(resolve => {
    const frames = [];
    const inset = document.querySelector('#inset-owner');
    const outward = document.querySelector('#outward-owner');
    let index = 0;
    const timer = setInterval(() => (index++ % 2 ? inset : outward).focus(),180);
    let previous;
    function frame(now) {
      if (previous !== undefined) frames.push(now - previous);
      previous = now;
      if (frames.length >= 360) {
        clearInterval(timer);
        resolve(frames);
      } else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }));
  const performance = {
    producer:{kind:'browser',command:'node internal/material3-migration/actual/record-native-focus-ring.mjs'},
    environment:{browser:`Chrome ${browser.version()}`,os:`${os.platform()} ${os.release()}`,device:'macOS desktop reference',refreshRateHz:60},
    inputLatencyMs,frameIntervalsMs,
  };
  await fs.writeFile(path.join(output,'performance.json'),`${JSON.stringify(performance,null,2)}\n`);
  const maxInput = Math.max(...inputLatencyMs);
  const over20Ratio = frameIntervalsMs.filter(value => value > 20).length / frameIntervalsMs.length;
  assert.ok(maxInput <= 100,`Input response ${maxInput}ms exceeds approved budget`);
  assert.ok(over20Ratio <= 0.05,`Long-frame ratio ${over20Ratio} exceeds approved budget`);
  console.log(JSON.stringify({video:'native-focus.webm',inputSamples:inputLatencyMs.length,maxInputLatencyMs:maxInput,frameSamples:frameIntervalsMs.length,over20Ratio,maxFrameMs:Math.max(...frameIntervalsMs)}));
  await perf.close();
} finally {
  await browser.close();
  await new Promise((resolve,reject) => server.close(error => error ? reject(error) : resolve()));
}
