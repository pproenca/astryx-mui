// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native foundation fixture and independent Compose trace inputs. @output Browser motion traces and input/frame timings for M3-NAT-002. @position Disposable revision-bound foundation measurement. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const packageRoot = path.join(repo, 'packages/material3');
const output = path.join(repo, 'internal/material3-migration/actual/M3-NAT-002');
const source = path.join(repo, 'internal/material3-migration/sources/motion/upstream/traces');
const mime = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json'};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(packageRoot, `.${pathname}`);
    if (!file.startsWith(packageRoot + path.sep)) throw new Error('Outside native package');
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    response.end(await fs.readFile(file));
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const url = `http://127.0.0.1:${server.address().port}/fixtures/foundation.html`;
  const page = await browser.newPage({viewport: {width: 1180, height: 800}, deviceScaleFactor: 1});
  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.__foundationQA));
  await fs.mkdir(output, {recursive: true});
  for (const style of ['standard', 'expressive']) {
    const id = `${style}-default-spatial`;
    const reference = JSON.parse(await fs.readFile(path.join(source, `${id}.json`)));
    const inputs = reference.inputs;
    const actual = await page.evaluate(async ({style, inputs}) => {
      const {sampleMaterial3Spring, material3SpringSpecs} = await import('/dist/index.js');
      const spec = material3SpringSpecs[style].default.spatial;
      const samples = [];
      for (let timeMs = 0; timeMs <= inputs.endMs; timeMs += inputs.stepMs) {
        samples.push({timeMs, ...sampleMaterial3Spring(spec, inputs.changes, timeMs, {
          position: inputs.initialPosition,
          velocity: inputs.initialVelocity,
        })});
      }
      const final = inputs.changes.at(-1);
      const settled = samples.find(sample => sample.timeMs >= final.timeMs &&
        samples.filter(item => item.timeMs >= sample.timeMs).every(item =>
          Math.abs(item.position - final.target) <= inputs.settling.position &&
          Math.abs(item.velocity) <= inputs.settling.velocity));
      return {samples, settledAtMs: settled?.timeMs};
    }, {style, inputs});
    assert.equal(actual.samples.length, reference.samples.length);
    assert.equal(actual.settledAtMs, reference.settledAtMs);
    const trace = {
      producer: {kind: 'browser', command: 'node internal/material3-migration/actual/capture-native-motion.mjs', browser: `Chrome ${browser.version()}`},
      unit: 'px', inputs, ...actual,
    };
    await fs.writeFile(path.join(output, `${id}.json`), `${JSON.stringify(trace, null, 2)}\n`);
  }

  await page.evaluate(() => {
    window.__inputLatencyMs = [];
    document.querySelector('#override').addEventListener('click', event => {
      requestAnimationFrame(() => window.__inputLatencyMs.push(performance.now() - event.timeStamp));
    });
  });
  for (let index = 0; index < 30; index++) await page.locator('#override').click();
  await page.waitForFunction(() => window.__inputLatencyMs.length === 30);
  const inputLatencyMs = await page.evaluate(() => window.__inputLatencyMs);
  const frameIntervalsMs = await page.evaluate(() => new Promise(resolve => {
    const frames = [];
    const actions = ['#enter', '#interrupt', '#reverse', '#exit'];
    let actionIndex = 0;
    const timer = setInterval(() => {
      document.querySelector(actions[actionIndex++ % actions.length]).click();
    }, 180);
    document.querySelector('#enter').click();
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
    producer: {kind: 'browser', command: 'node internal/material3-migration/actual/capture-native-motion.mjs'},
    environment: {browser: `Chrome ${browser.version()}`, os: `${os.platform()} ${os.release()}`, device: 'macOS desktop reference', refreshRateHz: 60},
    inputLatencyMs,
    frameIntervalsMs,
  };
  await fs.writeFile(path.join(output, 'performance.json'), `${JSON.stringify(performance, null, 2)}\n`);
  const sorted = [...frameIntervalsMs].sort((a, b) => a - b);
  console.log(JSON.stringify({chrome: browser.version(), inputSamples: inputLatencyMs.length, maxInputLatencyMs: Math.max(...inputLatencyMs), frameSamples: frameIntervalsMs.length, medianFrameMs: sorted[Math.floor(sorted.length / 2)], over1667Ratio: frameIntervalsMs.filter(n => n > 16.67).length / frameIntervalsMs.length, over20Ratio: frameIntervalsMs.filter(n => n > 20).length / frameIntervalsMs.length, maxFrameMs: Math.max(...frameIntervalsMs)}));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
