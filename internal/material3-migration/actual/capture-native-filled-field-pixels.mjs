// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Built FilledField gallery and the approved filled-only source crops.
 * @output Matched native visual frames with the source's plain surface backing at source timestamps.
 * @position Disposable M3-GAP-009 pixel capture; permanent visual behavior lives with FilledField.
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

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const gallery = path.join(repo, 'packages/material3/dist/gallery');
const baseline = JSON.parse(await fs.readFile(
  path.join(repo, 'internal/material3-migration/sources/baseline/filled-field-compose-first.json'),
  'utf8',
));
const output = path.resolve(process.env.M3_FIELD_PIXEL_DIR || path.join(
  repo,
  'internal/material3-migration/actual/M3-GAP-009',
));
const partial = process.argv.includes('--partial');
const revision = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: repo, encoding: 'utf8'}).trim();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const mime = {'.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf'};
const server = http.createServer(async (request, response) => {
  try {
    const relative = `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`;
    const file = path.resolve(gallery, relative);
    if (!file.startsWith(gallery + path.sep)) throw new Error('Outside gallery');
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    response.end(await fs.readFile(file));
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({headless: true, executablePath: process.env.M3_BROWSER_EXECUTABLE});
const url = `http://127.0.0.1:${server.address().port}/fixtures/filled-field.html`;
const observed = [];
try {
  await fs.mkdir(output, {recursive: true});
  for (const mode of ['light', 'dark']) {
    for (const variant of ['standard', 'expressive']) {
      if (partial && mode === 'dark' && variant === 'expressive') continue;
      const scheme = variant === 'expressive'
        ? `expressive-${mode}`
        : mode;
      const frames = baseline.scenarios.filter(item =>
        item.id.startsWith(`filled-${variant}-field-${mode}-`),
      );
      assert.equal(frames.length, 11, `Missing ${variant} ${mode} source frames`);
      const page = await browser.newPage({viewport: {width: 960, height: 420}, deviceScaleFactor: 1});
      await page.clock.install({time: new Date('2026-09-29T00:00:00Z')});
      await page.goto(url);
      await page.locator('[data-md-field-container]').waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.ok(await page.evaluate(() => document.fonts.check('16px Roboto')));
      await page.getByLabel('Scheme').selectOption(scheme);
      // Keep gallery heading glyphs behind the rounded corners from entering
      // the crop. This surface is behind the component, never over its pixels.
      await page.addStyleTag({content: `
        body {background: var(--md-sys-color-surface) !important;}
        body::before {content: ""; position: fixed; left: 36px;
          top: ${variant === 'standard' ? 131 : 269}px;
          width: 280px; height: 56px;
          background: var(--md-sys-color-surface); z-index: 999;}
        [data-md-filled-field] {position: fixed !important; left: 36px !important;
          top: ${variant === 'standard' ? 131 : 269}px !important;
          width: 280px !important; z-index: 1000 !important;}
      `});
      await page.waitForTimeout(100);
      await page.clock.pauseAt(new Date('2026-09-29T00:01:00Z'));
      const visualFocus = page.getByLabel('Visual focus');
      const timed = frames.filter(frame => frame.timeMs !== undefined).sort((a, b) => a.timeMs - b.timeMs);
      let previous = 0;
      for (const frame of timed) {
        if (frame.timeMs > previous)
          await page.clock.fastForward(frame.timeMs - previous);
        previous = frame.timeMs;
        if (frame.timeMs === 0 || frame.timeMs === 160) await visualFocus.selectOption('on');
        if (frame.timeMs === 120 || frame.timeMs === 600) await visualFocus.selectOption('off');
        const bytes = await page.screenshot({clip: frame.environment.crop, animations: 'allow'});
        await fs.writeFile(path.join(output, `${frame.id}.png`), bytes);
        observed.push({id: frame.id, sha256: hash(bytes)});
      }
      await page.emulateMedia({reducedMotion: 'reduce'});
      await visualFocus.selectOption('on');
      const reduced = frames.find(frame => frame.timeMs === undefined);
      assert.ok(reduced);
      const bytes = await page.screenshot({clip: reduced.environment.crop, animations: 'allow'});
      await fs.writeFile(path.join(output, `${reduced.id}.png`), bytes);
      observed.push({id: reduced.id, sha256: hash(bytes)});
      await page.close();
    }
  }
  if (!partial) assert.equal(observed.length, baseline.scenarios.length);
  const report = {
    schemaVersion: 1,
    revision,
    sourceDecision: 'internal/material3-migration/sources/baseline/filled-field-compose-first.json',
    environment: {browser: `Chrome ${browser.version()}`, os: `${os.platform()} ${os.release()}`, viewport: {width: 960, height: 420}, dpr: 1},
    partial,
    frames: observed,
  };
  await fs.writeFile(path.join(output, 'pixel-capture.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({output, revision, environment: report.environment, frames: observed.length, partial}));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
