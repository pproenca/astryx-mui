// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native foundation fixture and Chrome. @output Independent native WebM showing entry, interruption, reversal and reduced motion. @position Disposable M3-NAT-002 playback evidence. */
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const packageRoot = path.join(repo, 'packages/material3');
const output = path.join(repo, 'internal/material3-migration/actual/M3-NAT-002');
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
  await fs.mkdir(output, {recursive: true});
  const context = await browser.newContext({viewport: {width: 1180, height: 800}, deviceScaleFactor: 1, recordVideo: {dir: output, size: {width: 1180, height: 800}}});
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/fixtures/foundation.html?revision=native-motion`);
  await page.waitForFunction(() => Boolean(window.__foundationQA));
  await page.waitForTimeout(250);
  await page.locator('#enter').click();
  await page.waitForTimeout(120);
  await page.locator('#interrupt').click();
  await page.waitForTimeout(140);
  await page.locator('#reverse').click();
  await page.waitForTimeout(520);
  await page.locator('#exit').click();
  await page.waitForTimeout(520);
  await page.locator('#reduced').check();
  await page.locator('#enter').click();
  await page.waitForTimeout(330);
  const video = page.video();
  await context.close();
  const saved = await video.path();
  await fs.copyFile(saved, path.join(output, 'native-motion.webm'));
  await fs.unlink(saved);
  console.log(`Chrome ${browser.version()}: recorded ${path.relative(repo, path.join(output, 'native-motion.webm'))}`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
