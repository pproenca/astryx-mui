// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native Icon gallery and approved Chrome desktop profile. @output Native control response and 360-frame pacing evidence. @position Disposable M3-NAT-003 browser measurement. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {measurePerformance} from '../measurements.mjs';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
);
const gallery = path.join(root, 'packages/material3/dist/gallery');
const destination = path.join(
  root,
  'internal/material3-migration/actual/M3-NAT-003/performance.json',
);
const source = JSON.parse(
  await fs.readFile(
    path.join(
      root,
      'internal/material3-migration/sources/baseline/icon-compose-first.json',
    ),
  ),
);
const profile = source.performance[0];
const fontConfig = await fs.readFile(
  path.join(gallery, 'fixtures/font-config.js'),
  'utf8',
);
assert.match(
  fontConfig,
  /fontAvailable = 'true'/,
  'Build gallery with pinned local fonts for measurement',
);
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
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
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const page = await browser.newPage({
    viewport: {width: 1180, height: 800},
    deviceScaleFactor: 1,
  });
  await page.goto(
    `http://127.0.0.1:${server.address().port}/fixtures/icons.html`,
  );
  await page.getByTestId('font-check').waitFor();
  await page.evaluate(() => {
    window.__iconInputLatencyMs = [];
    document.querySelector('#size').addEventListener('change', event => {
      requestAnimationFrame(() =>
        window.__iconInputLatencyMs.push(performance.now() - event.timeStamp),
      );
    });
  });
  for (let index = 0; index < profile.minInputSamples; index++)
    await page.locator('#size').selectOption(index % 2 ? '24' : '20');
  await page.waitForFunction(
    count => window.__iconInputLatencyMs.length >= count,
    profile.minInputSamples,
  );
  const inputLatencyMs = await page.evaluate(() => window.__iconInputLatencyMs);
  const frameIntervalsMs = await page.evaluate(
    () =>
      new Promise(resolve => {
        const glyph = document.querySelector('[data-testid="svg-check"]');
        const frames = [];
        let previous;
        function frame(now) {
          if (previous !== undefined) frames.push(now - previous);
          glyph.style.transform = `translateX(${Math.sin(frames.length / 18) * 3}px)`;
          if (frames.length >= 360) {
            glyph.style.transform = '';
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
        'node internal/material3-migration/actual/capture-native-icon-performance.mjs',
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
