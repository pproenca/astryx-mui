// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Native FocusRing comparison fixture, Chrome fake clock and pinned Kotlin focus traces. @output Position, velocity, interruption and settling differences. @position Permanent native FocusRing motion regression. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const root = path.join(packageRoot, 'dist/gallery');
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, 'http://localhost').pathname,
    );
    const file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(root + path.sep)) throw new Error('Outside gallery');
    response.setHeader(
      'Content-Type',
      {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.ttf': 'font/ttf',
      }[path.extname(file)] || 'application/octet-stream',
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
    viewport: {width: 960, height: 360},
    deviceScaleFactor: 1,
  });
  await page.clock.install({time: new Date('2026-09-27T00:00:00Z')});
  await page.goto(
    `http://127.0.0.1:${server.address().port}/fixtures/focus-ring-compare.html`,
  );
  await page.locator('#standard-target span').waitFor({state: 'attached'});
  await page.locator('#expressive-target span').waitFor({state: 'attached'});
  await page.clock.pauseAt(new Date('2026-09-27T00:01:00Z'));
  await page.keyboard.press('Tab');
  const traces = Object.fromEntries(
    await Promise.all(
      ['standard', 'expressive'].map(async style => [
        style,
        JSON.parse(
          await fs.readFile(
            path.join(
              packageRoot,
              'fixtures/references/focus',
              `${style}-focus.json`,
            ),
          ),
        ),
      ]),
    ),
  );
  let maxPosition = 0;
  let maxVelocity = 0;
  const nativeSamples = {standard: [], expressive: []};
  for (let timeMs = 0; timeMs <= 1200; timeMs += 20) {
    if (timeMs > 0) await page.clock.fastForward(20);
    if (timeMs === 120 || timeMs === 600)
      await page.locator('#driver').evaluate(node => node.blur());
    if (timeMs === 160)
      await page.locator('#driver').evaluate(node => node.focus());
    for (const style of ['standard', 'expressive']) {
      const native = await page
        .locator(`#${style}-target span`)
        .evaluate(node => ({
          position: Number(node.getAttribute('data-md-focus-progress')),
          velocity: Number(node.getAttribute('data-md-focus-velocity')),
        }));
      const reference = traces[style].samples.find(
        sample => sample.timeMs === timeMs,
      );
      assert.ok(reference, `${style} ${timeMs}ms source sample`);
      const position = Math.abs(native.position - reference.position);
      const velocity = Math.abs(native.velocity - reference.velocity);
      maxPosition = Math.max(maxPosition, position);
      maxVelocity = Math.max(maxVelocity, velocity);
      nativeSamples[style].push({timeMs, ...native});
    }
  }
  assert.ok(maxPosition <= 0.0002, `focus position difference ${maxPosition}`);
  assert.ok(maxVelocity <= 0.002, `focus velocity difference ${maxVelocity}`);
  const settled = samples =>
    samples.find(
      (sample, index) =>
        sample.timeMs >= 600 &&
        samples
          .slice(index)
          .every(
            item =>
              Math.abs(item.position) <= 0.0001 &&
              Math.abs(item.velocity) <= 0.0001,
          ),
    )?.timeMs;
  for (const style of ['standard', 'expressive'])
    assert.equal(
      settled(nativeSamples[style]),
      traces[style].settledAtMs,
      `${style} focus settling`,
    );
  console.log(
    JSON.stringify({
      maxPosition,
      maxVelocity,
      settledAtMs: {
        standard: settled(nativeSamples.standard),
        expressive: settled(nativeSamples.expressive),
      },
    }),
  );
  await page.close();
} finally {
  await browser.close();
  await new Promise((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve())),
  );
}
