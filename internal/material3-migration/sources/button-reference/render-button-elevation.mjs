// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Pinned Compose Button elevation source-value trace and licensed Roboto.
 * @output Selected light/dark frames and normal-speed source-value elevation clips.
 * @position Disposable browser schematic; these are not Compose device shadow pixels.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../../..');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const traceBytes = await fs.readFile(
  path.join(here, 'button-elevation-motion.json'),
);
const trace = JSON.parse(traceBytes);
const policy = JSON.parse(
  await fs.readFile(
    path.join(repo, 'internal/material3-migration/policy.json'),
  ),
);
if (trace.producer.commit !== policy.androidxCommit)
  throw new Error('Button elevation source pin differs');
if (process.argv.slice(2).some(arg => arg !== '--check'))
  throw new Error('Usage: node render-button-elevation.mjs [--check]');
const check = process.argv.includes('--check');
const fontBytes = await fs.readFile(
  path.join(
    repo,
    'packages/themes/material3/scripts/fonts/Roboto-wdth-wght.ttf',
  ),
);
const fontSha256 = sha256(fontBytes);
if (
  fontSha256 !==
  'd7598e12c5dbef095ff8272cfc55da0250bd07fbdecbac8a530b9b277872a134'
)
  throw new Error('Pinned SIL OFL Roboto fixture changed');
const fontUrl = `data:font/ttf;base64,${fontBytes.toString('base64')}`;
const selectedTimes = [
  0, 40, 80, 100, 140, 180, 220, 240, 260, 320, 360, 380, 480, 500, 580, 720,
];
const schemes = {
  Light: {
    surface: '#fef7ff',
    ink: '#1d1b20',
    filled: '#6750a4',
    onFilled: '#ffffff',
    elevated: '#f7f2fa',
    onElevated: '#6750a4',
    tonal: '#e8def8',
    onTonal: '#4a4458',
    track: '#e6e0e9',
  },
  Dark: {
    surface: '#141218',
    ink: '#e6e0e9',
    filled: '#d0bcff',
    onFilled: '#381e72',
    elevated: '#211f26',
    onElevated: '#d0bcff',
    tonal: '#4a4458',
    onTonal: '#e8def8',
    track: '#49454f',
  },
};
function html(mode) {
  const c = schemes[mode];
  const rows = [
    ['Elevated', c.elevated, c.onElevated],
    ['Filled', c.filled, c.onFilled],
    ['Tonal', c.tonal, c.onTonal],
  ]
    .map(
      ([name, background, ink]) =>
        `<div class="row" data-style="${name}"><span class="name">${name}</span><button style="background:${background};color:${ink}">Action</button><div class="track"><div class="bar" style="background:${ink}"></div></div><span class="value">0.00 dp</span></div>`,
    )
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:SourceRoboto;src:url('${fontUrl}') format('truetype');font-weight:100 900}
    *{box-sizing:border-box}html,body{margin:0;width:960px;height:320px}
    body{background:${c.surface};color:${c.ink};font:14px/20px SourceRoboto,sans-serif}
    main{padding:20px 32px}h1{font-size:21px;line-height:27px;margin:0 0 3px}
    p{font-size:12px;margin:0 0 16px}.row{display:flex;align-items:center;height:48px;gap:18px}
    .name{width:78px}.row button{width:132px;height:40px;border:0;border-radius:20px;font:500 14px SourceRoboto,sans-serif}
    .track{height:12px;width:360px;border-radius:8px;background:${c.track};overflow:hidden}
    .bar{height:100%;width:0}.value{font-variant-numeric:tabular-nums;width:80px}
    .note{font-size:12px;line-height:18px;margin-top:13px;max-width:850px}
  </style></head><body><main>
    <h1>Compose Button interaction elevation · ${mode.toLowerCase()}</h1>
    <p id="stage">Pinned source-value browser schematic</p>
    ${rows}
    <div class="note">Bar length represents dp; shadow blur is schematic. Hover, press, release, hover interruption, exit, disable snap and enable snap are shown. Outlined/Text keep 0 dp.</div>
  </main></body></html>`;
}
const save = async (name, bytes) => {
  const target = path.join(here, name);
  const hash = sha256(bytes);
  if (check) {
    if (sha256(await fs.readFile(target)) !== hash)
      throw new Error(`Button elevation render changed: ${name}`);
  } else await fs.writeFile(target, bytes);
  return hash;
};
const browser = await chromium.launch({channel: 'chrome', headless: true});
const temporary = await fs.mkdtemp(
  path.join(os.tmpdir(), 'astryx-button-elevation-'),
);
const images = {};
const clips = {};
try {
  for (const mode of ['Light', 'Dark']) {
    const page = await browser.newPage({
      viewport: {width: 960, height: 320},
      deviceScaleFactor: 1,
    });
    await page.setContent(html(mode));
    await page.evaluate(() => document.fonts.ready);
    if (!(await page.evaluate(() => document.fonts.check('14px SourceRoboto'))))
      throw new Error('Pinned Roboto did not load');
    for (let index = 0; index < trace.traces.Elevated.length; index++) {
      const timeMs = trace.traces.Elevated[index].timeMs;
      const values = Object.fromEntries(
        Object.entries(trace.traces).map(([name, samples]) => [
          name,
          samples[index].elevationDp,
        ]),
      );
      const current = [...trace.changes]
        .reverse()
        .find(change => change.timeMs <= timeMs);
      await page.evaluate(
        ({timeMs, values, state}) => {
          document.getElementById('stage').textContent =
            `Pinned source-value browser schematic · ${timeMs} ms · ${state}`;
          for (const [name, dp] of Object.entries(values)) {
            const row = document.querySelector(`[data-style="${name}"]`);
            row.querySelector('.bar').style.width =
              `${(Math.max(0, dp) / 3) * 100}%`;
            row.querySelector('.value').textContent = `${dp.toFixed(2)} dp`;
            row.querySelector('button').style.boxShadow =
              `0 ${dp * 1.5}px ${dp * 4}px rgba(0,0,0,${Math.min(0.26, dp * 0.07)})`;
          }
        },
        {timeMs, values, state: current?.state ?? 'rest'},
      );
      const frame = await page.screenshot();
      await fs.writeFile(
        path.join(
          temporary,
          `${mode.toLowerCase()}-${String(index).padStart(3, '0')}.png`,
        ),
        frame,
      );
      if (selectedTimes.includes(timeMs)) {
        const name = `button-elevation-${mode.toLowerCase()}-${String(timeMs).padStart(4, '0')}.png`;
        images[name] = await save(name, frame);
      }
    }
    for (const state of ['hover', 'disabled']) {
      const values = Object.fromEntries(
        Object.entries(trace.styles).map(([name, item]) => [name, item[state]]),
      );
      await page.evaluate(
        ({state, values}) => {
          document.getElementById('stage').textContent =
            `Reduced motion browser adaptation · immediate ${state}`;
          for (const [name, dp] of Object.entries(values)) {
            const row = document.querySelector(`[data-style="${name}"]`);
            row.querySelector('.bar').style.width = `${(dp / 3) * 100}%`;
            row.querySelector('.value').textContent = `${dp.toFixed(2)} dp`;
            row.querySelector('button').style.boxShadow =
              `0 ${dp * 1.5}px ${dp * 4}px rgba(0,0,0,${Math.min(0.26, dp * 0.07)})`;
          }
        },
        {state, values},
      );
      const name = `button-elevation-${mode.toLowerCase()}-reduced-${state}.png`;
      images[name] = await save(name, await page.screenshot());
    }
    await page.close();
    const name = `compose-button-elevation-${mode.toLowerCase()}.mp4`;
    const output = path.join(temporary, name);
    execFileSync('ffmpeg', [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-framerate',
      '50',
      '-i',
      path.join(temporary, `${mode.toLowerCase()}-%03d.png`),
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '15',
      '-pix_fmt',
      'yuv420p',
      '-threads',
      '1',
      output,
    ]);
    clips[name] = await save(name, await fs.readFile(output));
  }
  const manifest = {
    schemaVersion: 1,
    composeCommit: policy.androidxCommit,
    sourceTraceSha256: sha256(traceBytes),
    fontSha256,
    browser: `Chrome ${browser.version()}`,
    viewport: {width: 960, height: 320, dpr: 1},
    selectedTimes,
    images,
    clips,
  };
  const bytes = `${JSON.stringify(manifest, null, 2)}\n`;
  const target = path.join(here, 'elevation-render-manifest.json');
  if (check) {
    if ((await fs.readFile(target, 'utf8')) !== bytes)
      throw new Error('Button elevation render manifest changed');
  } else await fs.writeFile(target, bytes);
  console.log(
    JSON.stringify({
      images: Object.keys(images).length,
      clips,
      browser: manifest.browser,
    }),
  );
} finally {
  await browser.close();
  await fs.rm(temporary, {recursive: true, force: true});
}
