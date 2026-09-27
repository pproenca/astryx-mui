// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native Elevation gallery and approved Chrome desktop profile. @output Thirty level-change responses and 360 active shadow-color frame intervals. @position Disposable M3-GAP-006 browser measurement. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {measurePerformance} from '../measurements.mjs';

const repo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
);
const gallery = path.join(repo, 'packages/material3/dist/gallery');
const destination = path.join(
  repo,
  'internal/material3-migration/actual/M3-GAP-006/performance.json',
);
const source = JSON.parse(
  await fs.readFile(
    path.join(
      repo,
      'internal/material3-migration/sources/baseline/elevation-compose-first.json',
    ),
  ),
);
const profile = source.performance[0];
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, 'http://localhost').pathname,
    );
    const file = path.resolve(gallery, `.${pathname}`);
    if (!file.startsWith(gallery + path.sep))
      throw new Error('Outside gallery');
    response.setHeader(
      'Content-Type',
      mime[path.extname(file)] || 'application/octet-stream',
    );
    response.end(await fs.readFile(file));
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  executablePath: process.env.M3_BROWSER_EXECUTABLE,
});
try {
  const page = await browser.newPage({
    viewport: {width: 1180, height: 800},
    deviceScaleFactor: 1,
  });
  await page.goto(
    `http://127.0.0.1:${server.address().port}/fixtures/elevation.html`,
  );
  await page.getByTestId('action-elevation').waitFor();
  await page.evaluate(() => {
    window.__elevationInputLatencyMs = [];
    document.querySelector('#level').addEventListener('change', event => {
      requestAnimationFrame(() =>
        window.__elevationInputLatencyMs.push(
          performance.now() - event.timeStamp,
        ),
      );
    });
  });
  for (let index = 0; index < profile.minInputSamples; index++)
    await page.locator('#level').selectOption(index % 2 ? '0' : '5');
  await page.waitForFunction(
    count => window.__elevationInputLatencyMs.length >= count,
    profile.minInputSamples,
  );
  const inputLatencyMs = await page.evaluate(
    () => window.__elevationInputLatencyMs,
  );
  const frameIntervalsMs = await page.evaluate(
    () =>
      new Promise(resolve => {
        const rule = document.querySelector(
          '[data-testid="action-elevation"]',
        );
        const scope = rule.parentElement;
        const frames = [];
        let previous;
        function frame(now) {
          if (previous !== undefined) frames.push(now - previous);
          scope.style.setProperty(
            '--md-sys-color-shadow',
            frames.length % 2 ? '#6750a4' : '#006a60',
          );
          getComputedStyle(rule.children[0]).boxShadow;
          if (frames.length >= 360) {
            scope.style.removeProperty('--md-sys-color-shadow');
            resolve(frames);
          } else {
            previous = now;
            requestAnimationFrame(frame);
          }
        }
        requestAnimationFrame(frame);
      }),
  );
  const actual = {
    producer: {
      kind: 'browser',
      command:
        'node internal/material3-migration/actual/capture-native-elevation-performance.mjs',
    },
    environment: {
      browser: `Chrome ${browser.version()}`,
      os: `${os.platform()} ${os.release()}`,
      device: profile.environment.device,
      refreshRateHz: profile.environment.refreshRateHz,
    },
    inputLatencyMs,
    frameIntervalsMs,
  };
  const measured = measurePerformance(actual, profile);
  assert.equal(inputLatencyMs.length, 30);
  assert.equal(frameIntervalsMs.length, 360);
  if (!process.argv.includes('--check')) {
    await fs.mkdir(path.dirname(destination), {recursive: true});
    await fs.writeFile(destination, `${JSON.stringify(actual, null, 2)}\n`);
  }
  console.log(
    JSON.stringify({
      inputSamples: inputLatencyMs.length,
      frameSamples: frameIntervalsMs.length,
      ...measured,
    }),
  );
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
