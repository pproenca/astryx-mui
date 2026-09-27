// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Pinned focus spring probes, Compose palettes, Ripple geometry and licensed Roboto.
 * @output Light/dark focus indication frames and a normal-speed source-motion clip.
 * @position Disposable source-value browser renderer; native evidence is captured separately.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const sources = path.dirname(here);
const repo = path.resolve(here, '../../../..');
const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const policy = await read(
  path.join(repo, 'internal/material3-migration/policy.json'),
);
const inventory = await read(path.join(sources, 'compose-inventory.json'));
const focus = await read(path.join(here, 'focus-manifest.json'));
if (
  inventory.commit !== policy.androidxCommit ||
  focus.composeCommit !== policy.androidxCommit
)
  throw new Error('Focus reference source pins differ');

const traces = {};
for (const scheme of ['standard', 'expressive']) {
  const item = focus.traces[scheme];
  const bytes = await fs.readFile(path.join(repo, item.file));
  if (sha256(bytes) !== item.sha256)
    throw new Error(`Pinned focus trace changed: ${scheme}`);
  traces[scheme] = JSON.parse(bytes);
}
const token = name => {
  const item = inventory.tokens.find(candidate => candidate.name === name);
  if (!item) throw new Error(`Missing Compose token: ${name}`);
  return new Map(
    item.values.map(({name: key, expression}) => [key, expression]),
  );
};
const palette = token('PaletteTokens');
const rgb = expression => {
  const match = expression?.match(
    /^Color\(red = (\d+), green = (\d+), blue = (\d+)\)$/,
  );
  if (!match) throw new Error(`Unresolved Compose color: ${expression}`);
  return match.slice(1).map(Number);
};
const color = (mode, name) => {
  const scheme = token(`Color${mode}Tokens`);
  function resolve(role) {
    const expression = scheme.get(role);
    if (!expression) throw new Error(`Missing Compose ${mode} role: ${role}`);
    return expression.startsWith('PaletteTokens.')
      ? rgb(palette.get(expression.slice('PaletteTokens.'.length)))
      : resolve(expression);
  }
  return resolve(name);
};
const hex = channels =>
  `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
const composite = (base, layer, alpha) =>
  base.map((channel, index) =>
    Math.round(channel * (1 - alpha) + layer[index] * alpha),
  );
const roboto = await fs.readFile(
  path.join(
    repo,
    'packages/themes/material3/scripts/fonts/Roboto-wdth-wght.ttf',
  ),
);
const robotoSha256 = sha256(roboto);
if (
  robotoSha256 !==
  'd7598e12c5dbef095ff8272cfc55da0250bd07fbdecbac8a530b9b277872a134'
)
  throw new Error('Pinned licensed Roboto fixture changed');
const fontUrl = `data:font/ttf;base64,${roboto.toString('base64')}`;
const times = [0, 20, 80, 120, 140, 160, 180, 260, 600, 880];
const sample = (scheme, timeMs) => {
  const hit = traces[scheme].samples.find(item => item.timeMs === timeMs);
  if (!hit) throw new Error(`Missing ${scheme} focus sample at ${timeMs} ms`);
  return hit;
};

function html(mode) {
  const surface = color(mode, 'Surface');
  const container = color(mode, 'SurfaceContainerLow');
  const onSurface = color(mode, 'OnSurface');
  const secondary = color(mode, 'Secondary');
  const onSecondary = color(mode, 'OnSecondary');
  const focusLayer = composite(container, onSurface, 0.1);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:SourceRoboto;src:url('${fontUrl}') format('truetype');font-weight:100 900}
    *{box-sizing:border-box}html,body{margin:0;width:960px;height:360px}
    body{background:${hex(surface)};color:${hex(onSurface)};font:16px/24px SourceRoboto,sans-serif}
    main{padding:26px 36px}h1{font-size:22px;line-height:30px;margin:0 0 5px}p{font-size:13px;line-height:20px;margin:0 0 22px}
    .row{display:flex;gap:28px}.sample{width:270px;text-align:center}.label{font-size:13px;line-height:20px;margin-top:14px}
    .target{position:relative;width:220px;height:92px;margin:0 auto;background:${hex(container)}}
    .opacity{background:${hex(focusLayer)}}.inner,.outer{position:absolute;inset:0;pointer-events:none}
    .inner{border:0 solid ${hex(onSecondary)}}.outer{border:0 solid ${hex(secondary)}}
    .legend{margin-top:22px;font-size:12px;line-height:20px}
  </style></head><body><main>
    <h1>Compose focus indication · ${mode}</h1>
    <p id="stage">Source-value browser rendering · standard and Expressive fast springs</p>
    <div class="row"><div class="sample"><div class="target opacity"></div><div class="label">Default · OnSurface at 10%</div></div>
      <div class="sample"><div class="target"><div id="standard-inner" class="inner"></div><div id="standard-outer" class="outer"></div></div><div class="label">Optional inset · standard</div></div>
      <div class="sample"><div class="target"><div id="expressive-inner" class="inner"></div><div id="expressive-outer" class="outer"></div></div><div class="label">Optional inset · Expressive</div></div></div>
    <div class="legend">Outer: Secondary, 0dp inset, 2dp stroke · Inner: OnSecondary, 1dp inset, 3dp stroke · DPR 1</div>
  </main></body></html>`;
}

const check = process.argv.includes('--check');
const images = {};
const browser = await chromium.launch({channel: 'chrome', headless: true});
const temporary = await fs.mkdtemp(
  path.join(os.tmpdir(), 'astryx-focus-frames-'),
);
try {
  for (const mode of ['Light', 'Dark']) {
    const page = await browser.newPage({
      viewport: {width: 960, height: 360},
      deviceScaleFactor: 1,
    });
    await page.setContent(html(mode));
    await page.evaluate(() => document.fonts.ready);
    if (!(await page.evaluate(() => document.fonts.check('16px SourceRoboto'))))
      throw new Error('Pinned Roboto did not load');
    for (const timeMs of times) {
      const positions = ['standard', 'expressive'].map(scheme =>
        timeMs >= traces[scheme].settledAtMs
          ? 0
          : sample(scheme, timeMs).position,
      );
      await page.evaluate(
        ({positions, timeMs}) => {
          for (const [index, scheme] of ['standard', 'expressive'].entries()) {
            const progress = Math.max(0, positions[index]);
            const inner = document.getElementById(`${scheme}-inner`);
            const outer = document.getElementById(`${scheme}-outer`);
            inner.style.inset = `${Math.ceil(progress)}px`;
            inner.style.borderWidth = `${Math.ceil(3 * progress)}px`;
            outer.style.borderWidth = `${Math.ceil(2 * progress)}px`;
          }
          document.getElementById('stage').textContent =
            `Focus 0ms · blur 120ms · refocus 160ms · blur 600ms · ${timeMs}ms`;
        },
        {positions, timeMs},
      );
      const name = `focus-${mode.toLowerCase()}-${String(timeMs).padStart(4, '0')}.png`;
      const bytes = await page.screenshot();
      images[name] = sha256(bytes);
      if (check) {
        if (sha256(await fs.readFile(path.join(here, name))) !== images[name])
          throw new Error(`Focus source frame changed: ${name}`);
      } else await fs.writeFile(path.join(here, name), bytes);
    }
    await page.close();
  }

  const page = await browser.newPage({
    viewport: {width: 960, height: 360},
    deviceScaleFactor: 1,
  });
  await page.setContent(html('Light'));
  await page.evaluate(() => document.fonts.ready);
  for (let index = 0; index <= 60; index++) {
    const timeMs = index * 20;
    const positions = ['standard', 'expressive'].map(scheme =>
      timeMs >= traces[scheme].settledAtMs
        ? 0
        : sample(scheme, timeMs).position,
    );
    await page.evaluate(
      ({positions, timeMs}) => {
        for (const [index, scheme] of ['standard', 'expressive'].entries()) {
          const progress = Math.max(0, positions[index]);
          const inner = document.getElementById(`${scheme}-inner`);
          const outer = document.getElementById(`${scheme}-outer`);
          inner.style.inset = `${Math.ceil(progress)}px`;
          inner.style.borderWidth = `${Math.ceil(3 * progress)}px`;
          outer.style.borderWidth = `${Math.ceil(2 * progress)}px`;
        }
        document.getElementById('stage').textContent =
          `Focus 0ms · blur 120ms · refocus 160ms · blur 600ms · ${timeMs}ms`;
      },
      {positions, timeMs},
    );
    await page.screenshot({
      path: path.join(temporary, `frame-${String(index).padStart(3, '0')}.png`),
    });
  }
  await page.close();
  const clip = path.join(temporary, 'compose-focus.mp4');
  execFileSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-framerate',
    '50',
    '-i',
    path.join(temporary, 'frame-%03d.png'),
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
    '-map_metadata',
    '-1',
    clip,
  ]);
  const clipBytes = await fs.readFile(clip);
  const clipHash = sha256(clipBytes);
  if (check) {
    if (
      sha256(await fs.readFile(path.join(here, 'compose-focus.mp4'))) !==
      clipHash
    )
      throw new Error('Focus source clip changed');
  } else await fs.writeFile(path.join(here, 'compose-focus.mp4'), clipBytes);
  const manifest = {
    schemaVersion: 1,
    composeCommit: policy.androidxCommit,
    figmaSha256: policy.figmaSha256,
    webCommit: policy.materialWebCommit,
    focusTraceManifest: focus.traces,
    renderer: 'Chrome source-value browser fixture',
    browser: `Chrome ${browser.version()}`,
    os: `${os.platform()} ${os.release()}`,
    dpr: 1,
    viewport: {width: 960, height: 360},
    font: {family: 'Roboto', sha256: robotoSha256, loaded: true},
    times,
    colors: Object.fromEntries(
      ['Light', 'Dark'].map(mode => [
        mode.toLowerCase(),
        Object.fromEntries(
          [
            'Surface',
            'SurfaceContainerLow',
            'OnSurface',
            'Secondary',
            'OnSecondary',
          ].map(role => [role, hex(color(mode, role))]),
        ),
      ]),
    ),
    images,
    clip: {file: 'compose-focus.mp4', sha256: clipHash},
  };
  const manifestBytes = `${JSON.stringify(manifest, null, 2)}\n`;
  if (check) {
    if (
      (await fs.readFile(path.join(here, 'manifest.json'), 'utf8')) !==
      manifestBytes
    )
      throw new Error('Focus source manifest changed');
  } else await fs.writeFile(path.join(here, 'manifest.json'), manifestBytes);
  console.log(
    JSON.stringify({images: Object.keys(images).length, clipSha256: clipHash}),
  );
} finally {
  await browser.close();
  await fs.rm(temporary, {recursive: true, force: true});
}
