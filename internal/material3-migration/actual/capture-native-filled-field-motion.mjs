// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Built FilledField fixture, pinned Kotlin field-spring probe, and Chrome fake clock.
 * @output Independent native samples, per-path source extracts, and measured differences.
 * @position Disposable M3-GAP-009 motion capture; the component owns permanent regressions.
 */

import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const repo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
);
const gallery = path.join(repo, 'packages/material3/dist/gallery');
const sourceDir = path.join(
  repo,
  'internal/material3-migration/sources/field-reference',
);
const actualDir = path.join(
  repo,
  'internal/material3-migration/actual/M3-GAP-009',
);
const source = JSON.parse(
  await fs.readFile(path.join(sourceDir, 'field-motion.json'), 'utf8'),
);
const policy = JSON.parse(
  await fs.readFile(
    path.join(repo, 'internal/material3-migration/policy.json'),
    'utf8',
  ),
);
if (source.composeCommit !== policy.androidxCommit)
  throw new Error('Pinned Kotlin field trace differs from migration policy');
const revision = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: repo,
  encoding: 'utf8',
}).trim();
const record = process.argv.includes('--record');
const command =
  'node internal/material3-migration/actual/capture-native-filled-field-motion.mjs --record';
const keys = ['label', 'placeholder', 'indicator', 'color'];
const server = http.createServer(async (request, response) => {
  try {
    const relative = `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`;
    const file = path.resolve(gallery, relative);
    if (!file.startsWith(gallery + path.sep))
      throw new Error('Outside gallery');
    response.setHeader(
      'Content-Type',
      {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
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
  headless: true,
  executablePath: process.env.M3_BROWSER_EXECUTABLE,
});
const browserName = `Chrome ${browser.version()}`;
const report = {revision, browser: browserName, paths: {}};
const write = async (file, value) => {
  await fs.mkdir(path.dirname(file), {recursive: true});
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
};

try {
  for (const scheme of ['standard', 'expressive']) {
    const page = await browser.newPage({
      viewport: {width: 960, height: 740},
      deviceScaleFactor: 1,
    });
    await page.clock.install({time: new Date('2026-09-29T00:00:00Z')});
    await page.goto(
      `http://127.0.0.1:${server.address().port}/fixtures/filled-field.html`,
    );
    const input = page.locator('#native-email');
    await input.waitFor({state: 'attached'});
    if (scheme === 'expressive') {
      await page.getByLabel('Scheme').selectOption('expressive-light');
      await page.waitForTimeout(100);
    }
    await page.clock.pauseAt(new Date('2026-09-29T00:01:00Z'));
    const captures = Object.fromEntries(keys.map(key => [key, []]));
    for (let timeMs = 0; timeMs <= source.endMs; timeMs += source.stepMs) {
      if (timeMs > 0) await page.clock.fastForward(source.stepMs);
      if (timeMs === 0 || timeMs === 160)
        await input.evaluate(node => node.focus());
      if (timeMs === 120 || timeMs === 600)
        await input.evaluate(node => node.blur());
      const values = await page
        .locator('[data-md-filled-field]')
        .evaluate(node =>
          Object.fromEntries(
            ['label', 'placeholder', 'indicator', 'color'].map(key => [
              key,
              {
                position: Number(
                  node.getAttribute(`data-md-field-${key}-position`),
                ),
                velocity: Number(
                  node.getAttribute(`data-md-field-${key}-velocity`),
                ),
              },
            ]),
          ),
        );
      for (const key of keys) captures[key].push({timeMs, ...values[key]});
    }
    await page.close();
    for (const key of keys) {
      const expected = source.schemes[scheme][key];
      const samples = captures[key];
      const target = expected.changes.at(-1).target;
      const settledAtMs = samples.find(
        (sample, index) =>
          sample.timeMs >= 600 &&
          samples
            .slice(index)
            .every(
              candidate =>
                Math.abs(candidate.position - target) <= 0.0001 &&
                Math.abs(candidate.velocity) <= 0.0001,
            ),
      )?.timeMs;
      const name = `${scheme}-${key}`;
      report.paths[name] = {
        unit: expected.unit,
        positionDifference: Math.max(
          ...samples.map((sample, index) =>
            Math.abs(sample.position - expected.samples[index].position),
          ),
        ),
        velocityDifference: Math.max(
          ...samples.map((sample, index) =>
            Math.abs(sample.velocity - expected.samples[index].velocity),
          ),
        ),
        settledAtMs,
        sourceSettledAtMs: expected.settledAtMs,
      };
      if (record) {
        const inputs = {
          initialPosition: expected.initial,
          initialVelocity: 0,
          changes: expected.changes,
          stepMs: source.stepMs,
          endMs: source.endMs,
        };
        await write(path.join(sourceDir, 'traces', `${name}.json`), {
          schemaVersion: 1,
          producer: {
            kind: 'upstream',
            commit: policy.androidxCommit,
            source:
              'compose/animation/animation-core/src/commonMain/kotlin/androidx/compose/animation/core/SpringSimulation.kt',
            command: source.producer.command,
            runtime: `${source.producer.kotlin}; ${source.producer.java}`,
          },
          inputs,
          unit: expected.unit,
          settledAtMs: expected.settledAtMs,
          samples: expected.samples,
        });
        await write(path.join(actualDir, `${name}.json`), {
          schemaVersion: 1,
          producer: {kind: 'browser', command, browser: browserName, revision},
          inputs,
          unit: expected.unit,
          settledAtMs,
          samples,
        });
      }
    }
  }
  if (record) await write(path.join(actualDir, 'motion-summary.json'), report);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
