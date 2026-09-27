// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native FocusRing comparison fixtures and pinned Compose/Web source frames. @output Revision-bound 26-frame native captures and browser motion traces. @position Disposable M3-GAP-011 source-parity capture. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';
import {chromium} from 'playwright';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const gallery = path.join(repo, 'packages/material3/dist/gallery');
const source = path.join(repo, 'internal/material3-migration/sources/indication-reference');
const output = path.join(repo, 'internal/material3-migration/actual/M3-GAP-011');
const check = process.argv.includes('--check');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const save = async (name, bytes) => {
  const file = path.join(output, name);
  if (check) {
    assert.equal(sha(await fs.readFile(file)), sha(bytes), `${name} changed`);
  } else {
    await fs.mkdir(path.dirname(file), {recursive: true});
    await fs.writeFile(file, bytes);
  }
};
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.ttf':'font/ttf'};
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const file = path.resolve(gallery, `.${decodeURIComponent(url.pathname)}`);
    if (!file.startsWith(gallery + path.sep)) throw new Error('Outside gallery');
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    const bytes = await fs.readFile(file);
    response.end(path.extname(file) === '.html' && url.searchParams.get('mode') === 'dark'
      ? bytes.toString().replace('data-md-scheme="light"', 'data-md-scheme="dark"')
      : bytes);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({channel:'chrome',headless:true,executablePath:process.env.M3_BROWSER_EXECUTABLE});
const base = `http://127.0.0.1:${server.address().port}/fixtures`;
let captured = 0;
try {
  assert.equal(browser.version(), '153.0.8010.53', 'Pinned browser version changed');
  assert.equal(`${os.platform()} ${os.release()}`, 'darwin 27.0.0', 'Pinned OS profile changed');
  for (const mode of ['light','dark']) {
    const page = await browser.newPage({viewport:{width:960,height:360},deviceScaleFactor:1});
    await page.clock.install({time:new Date('2026-09-27T00:00:00Z')});
    await page.goto(`${base}/focus-ring-compare.html?mode=${mode}`);
    await page.locator('#standard-target span').waitFor({state:'attached'});
    await page.locator('#expressive-target span').waitFor({state:'attached'});
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.evaluate(() => document.fonts.check('16px SourceRoboto')), true);
    await page.clock.pauseAt(new Date('2026-09-27T00:01:00Z'));
    await page.keyboard.press('Tab');
    const samples = {standard:[],expressive:[]};
    const captureTimes = new Set([0,20,80,120,140,160,180,260,600,880]);
    for (let timeMs=0;timeMs<=1200;timeMs+=20) {
      if (timeMs) await page.clock.fastForward(20);
      if (timeMs === 120 || timeMs === 600)
        await page.locator('#driver').evaluate(node => node.blur());
      if (timeMs === 160)
        await page.locator('#driver').evaluate(node => node.focus());
      for (const style of ['standard','expressive']) {
        const current = await page.locator(`#${style}-target span`).evaluate(node => ({
          position:Number(node.getAttribute('data-md-focus-progress')),
          velocity:Number(node.getAttribute('data-md-focus-velocity')),
        }));
        samples[style].push({timeMs,...current});
      }
      if (!captureTimes.has(timeMs)) continue;
      await page.locator('#stage').evaluate((node, time) => {
        node.textContent = `Focus 0ms · blur 120ms · refocus 160ms · blur 600ms · ${time}ms`;
      },timeMs);
      await capture(page,`focus-${mode}-${String(timeMs).padStart(4,'0')}.png`);
    }
    if (mode === 'light') {
      for (const style of ['standard','expressive']) {
        const reference = JSON.parse(await fs.readFile(path.join(source,`${style}-focus.json`)));
        const settledAtMs = samples[style].find((sample,index) =>
          sample.timeMs >= 600 && samples[style].slice(index).every(item =>
            Math.abs(item.position) <= 0.0001 && Math.abs(item.velocity) <= 0.0001,
          ),
        )?.timeMs;
        const actual = {
          producer:{kind:'browser',command:'node internal/material3-migration/actual/capture-native-focus-ring.mjs',browser:`Chrome ${browser.version()}`},
          unit:reference.unit,
          inputs:reference.inputs,
          settledAtMs,
          samples:samples[style],
        };
        await save(`${style}-fast-focus.json`,Buffer.from(`${JSON.stringify(actual,null,2)}\n`));
      }
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.locator('#driver').evaluate(node => node.focus());
    assert.equal(await page.locator('#driver').evaluate(node => node.matches(':focus-visible')),true,'Reduced-motion focus must be keyboard-visible');
    await page.locator('#stage').evaluate(node => {
      node.textContent = 'Reduced motion · immediately visible focused state';
    });
    await capture(page,`focus-${mode}-reduced.png`);
    await page.close();

    const outward = await browser.newPage({viewport:{width:960,height:360},deviceScaleFactor:1});
    await outward.goto(`${base}/focus-ring-outward-compare.html?mode=${mode}`);
    await outward.locator('#outward-target span').waitFor({state:'attached'});
    await outward.evaluate(() => document.fonts.ready);
    await outward.keyboard.press('Tab');
    await outward.waitForTimeout(700);
    await outward.locator('h1').evaluate((node,value) => {
      node.textContent = `Material Web outward focus ring · ${value === 'dark' ? 'Dark' : 'Light'}`;
    },mode);
    await capture(outward,`web-outward-${mode}-rest.png`);
    await outward.keyboard.press('Shift+Tab');
    await outward.keyboard.press('Tab');
    await outward.locator('#outward-target span').evaluate(node => {
      const animation = node.getAnimations()[0];
      assertAnimation(animation);
      animation.pause();
      animation.currentTime = 150;
      animation.commitStyles();
      animation.cancel();
      node.style.animationName = 'none';
      function assertAnimation(value) {if (!value) throw new Error('Missing outward animation');}
    });
    await outward.locator('p').evaluate(node => {
      node.textContent = 'Optional browser presentation · active width';
    });
    await outward.locator('.legend').evaluate(node => {
      node.textContent = 'Secondary · 2px outward offset · 8px outline · full corner · DPR 1';
    });
    await capture(outward,`web-outward-${mode}-active.png`);
    await outward.close();
  }
  console.log(JSON.stringify({captured,exactPixels:true,browser:`Chrome ${browser.version()}`,check}));
} finally {
  await browser.close();
  await new Promise((resolve,reject) => server.close(error => error ? reject(error) : resolve()));
}

async function capture(page,name) {
  const bytes = await page.screenshot();
  const expected = PNG.sync.read(await fs.readFile(path.join(source,name)));
  const actual = PNG.sync.read(bytes);
  assert.deepEqual([actual.width,actual.height],[expected.width,expected.height],name);
  const diff = new PNG({width:actual.width,height:actual.height});
  const changed = pixelmatch(expected.data,actual.data,diff.data,actual.width,actual.height,{threshold:0,includeAA:true});
  if (changed) {
    await fs.writeFile(path.join(os.tmpdir(),`astryx-${name}`),bytes);
    await fs.writeFile(path.join(os.tmpdir(),`astryx-diff-${name}`),PNG.sync.write(diff));
  }
  assert.equal(changed,0,`${name} source pixel difference`);
  await save(name,bytes);
  await save(`diff/${name}`,PNG.sync.write(diff));
  captured++;
}
