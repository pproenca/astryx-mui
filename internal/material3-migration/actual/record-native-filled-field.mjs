// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Built FilledField gallery and a Chromium executable.
 * @output Normal-speed native playback plus input and active-motion frame timing.
 * @position Disposable M3-GAP-009 capture; permanent browser checks live with FilledField.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const repo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
);
const gallery = path.join(repo, 'packages/material3/dist/gallery');
const revision = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: repo,
  encoding: 'utf8',
}).trim();
const output = path.resolve(
  process.env.M3_FIELD_CAPTURE_DIR ||
    path.join(repo, 'internal/material3-migration/actual/M3-GAP-009'),
);
const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
};
const server = http.createServer(async (request, response) => {
  try {
    const relative = `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`;
    const file = path.resolve(gallery, relative);
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
  headless: true,
  executablePath: process.env.M3_BROWSER_EXECUTABLE,
});
const url = `http://127.0.0.1:${server.address().port}/fixtures/filled-field.html`;

try {
  await fs.mkdir(output, {recursive: true});
  const context = await browser.newContext({
    viewport: {width: 960, height: 740},
    deviceScaleFactor: 1,
    recordVideo: {dir: output, size: {width: 960, height: 740}},
  });
  const page = await context.newPage();
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  const input = page.locator('#native-email');
  await input.waitFor();
  await page.waitForTimeout(200);
  for (const scheme of ['light', 'expressive-light']) {
    await page.getByLabel('Scheme').selectOption(scheme);
    await input.evaluate(node => node.focus());
    await page.waitForTimeout(120);
    await input.evaluate(node => node.blur());
    await page.waitForTimeout(40);
    await input.evaluate(node => node.focus());
    await page.waitForTimeout(440);
    await input.evaluate(node => node.blur());
    await page.waitForTimeout(360);
  }
  await page.emulateMedia({reducedMotion: 'reduce'});
  await input.evaluate(node => node.focus());
  await page.waitForTimeout(320);
  const video = page.video();
  assert.ok(video, 'Missing FilledField native recording');
  await context.close();
  const videoFile = path.join(output, 'native-filled-field.webm');
  await fs.rename(await video.path(), videoFile);
  const videoSha256 = createHash('sha256')
    .update(await fs.readFile(videoFile))
    .digest('hex');

  const perf = await browser.newPage({
    viewport: {width: 960, height: 740},
    deviceScaleFactor: 1,
  });
  await perf.goto(url);
  await perf.locator('#native-email').focus();
  await perf.evaluate(() => {
    window.__fieldInputLatencyMs = [];
    document
      .querySelector('#native-email')
      .addEventListener('keydown', event => {
        requestAnimationFrame(() =>
          window.__fieldInputLatencyMs.push(
            performance.now() - event.timeStamp,
          ),
        );
      });
  });
  for (let index = 0; index < 30; index++) await perf.keyboard.press('x');
  await perf.waitForFunction(() => window.__fieldInputLatencyMs.length === 30);
  const inputLatencyMs = await perf.evaluate(
    () => window.__fieldInputLatencyMs,
  );
  const frameIntervalsMs = await perf.evaluate(
    () =>
      new Promise(resolve => {
        const input = document.querySelector('#native-email');
        const frames = [];
        let previous;
        const timer = setInterval(() => {
          if (document.activeElement === input) input.blur();
          else input.focus();
        }, 180);
        const sample = now => {
          if (previous !== undefined) frames.push(now - previous);
          previous = now;
          if (frames.length >= 360) {
            clearInterval(timer);
            resolve(frames);
          } else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }),
  );
  const performance = {
    producer: {
      kind: 'browser',
      command:
        'node internal/material3-migration/actual/record-native-filled-field.mjs',
      revision,
    },
    environment: {
      browser: `Chrome ${browser.version()}`,
      os: `${os.platform()} ${os.release()}`,
      device:
        os.platform() === 'darwin'
          ? 'macOS desktop reference'
          : 'local diagnostic',
      refreshRateHz: 60,
    },
    inputLatencyMs,
    frameIntervalsMs,
  };
  await fs.writeFile(
    path.join(output, 'performance.json'),
    `${JSON.stringify(performance, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(output, 'capture.json'),
    `${JSON.stringify({schemaVersion: 1, revision, video: 'native-filled-field.webm', videoSha256, environment: performance.environment}, null, 2)}\n`,
  );
  const maxInputLatencyMs = Math.max(...inputLatencyMs);
  const longFrameRatio =
    frameIntervalsMs.filter(interval => interval > 20).length /
    frameIntervalsMs.length;
  console.log(
    JSON.stringify({
      output,
      environment: performance.environment,
      inputSamples: inputLatencyMs.length,
      maxInputLatencyMs,
      frameSamples: frameIntervalsMs.length,
      longFrameRatio,
    }),
  );
  await perf.close();
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
