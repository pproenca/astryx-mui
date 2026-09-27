// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Pinned Compose Button shape trace, color roles and licensed Roboto.
 * @output Selected source-value frames and normal-speed light/dark shape clips.
 * @position Disposable browser projection; these are not Compose device pixels.
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
const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const policy = await read(
  path.join(repo, 'internal/material3-migration/policy.json'),
);
const inventory = await read(
  path.join(
    repo,
    'internal/material3-migration/sources/compose-inventory.json',
  ),
);
const motionBytes = await fs.readFile(
  path.join(here, 'button-shape-motion.json'),
);
const motion = JSON.parse(motionBytes);
const source = await read(path.join(here, 'manifest.json'));
if (
  inventory.commit !== policy.androidxCommit ||
  source.composeCommit !== policy.androidxCommit ||
  sha256(motionBytes) !== source.traceSha256
)
  throw new Error('Button shape source pins differ');
if (process.argv.slice(2).some(arg => arg !== '--check'))
  throw new Error('Usage: node render-button-shape.mjs [--check]');
const check = process.argv.includes('--check');

const token = name => {
  const item = inventory.tokens.find(candidate => candidate.name === name);
  if (!item) throw new Error(`Missing token: ${name}`);
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
    if (!expression) throw new Error(`Missing ${mode} role: ${role}`);
    return expression.startsWith('PaletteTokens.')
      ? rgb(palette.get(expression.slice('PaletteTokens.'.length)))
      : resolve(expression);
  }
  return `#${resolve(name)
    .map(channel => channel.toString(16).padStart(2, '0'))
    .join('')}`;
};
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
const selectedTimes = [0, 20, 100, 120, 160, 180, 260, 600, 880, 1000];
const role = (tokenName, key) => {
  const expression = token(tokenName).get(key);
  if (!expression?.startsWith('ColorSchemeKeyTokens.'))
    throw new Error(`Unresolved Button style token: ${tokenName}.${key}`);
  return expression.slice('ColorSchemeKeyTokens.'.length);
};
const styles = [
  [
    'Filled',
    role('FilledButtonTokens', 'ContainerColor'),
    role('FilledButtonTokens', 'LabelTextColor'),
    null,
  ],
  [
    'Elevated',
    role('ElevatedButtonTokens', 'ContainerColor'),
    role('ElevatedButtonTokens', 'LabelTextColor'),
    null,
  ],
  [
    'Tonal',
    role('FilledTonalButtonTokens', 'ContainerColor'),
    role('FilledTonalButtonTokens', 'LabelTextColor'),
    null,
  ],
  [
    'Outlined',
    'Surface',
    role('OutlinedButtonTokens', 'LabelTextColor'),
    role('OutlinedButtonTokens', 'OutlineColor'),
  ],
  // Button.kt uses Primary directly while TextButtonTokens.LabelColor awaits correction.
  ['Text', 'Surface', 'Primary', null],
];
const small = token('ButtonSmallTokens');
const shapeTokens = token('ShapeTokens');
if (
  small.get('ContainerHeight') !== '40.0.dp' ||
  small.get('ContainerShapeRound') !== 'ShapeKeyTokens.CornerFull' ||
  small.get('ContainerShapeSquare') !== 'ShapeKeyTokens.CornerMedium' ||
  small.get('PressedContainerShape') !== 'ShapeKeyTokens.CornerSmall'
)
  throw new Error('Pinned small Button shape binding changed');
const corner = name => {
  const match = shapeTokens
    .get(name)
    ?.match(/^RoundedCornerShape\(([0-9.]+)\.dp\)$/);
  if (!match) throw new Error(`Pinned Compose corner changed: ${name}`);
  return Number(match[1]);
};
const shapeEndpoints = {
  round: {rest: 20, pressed: corner('CornerSmall')},
  square: {rest: corner('CornerMedium'), pressed: corner('CornerSmall')},
};
const save = async (name, bytes) => {
  const hash = sha256(bytes);
  const target = path.join(here, name);
  if (check) {
    if (sha256(await fs.readFile(target)) !== hash)
      throw new Error(`Button shape reference changed: ${name}`);
  } else await fs.writeFile(target, bytes);
  return hash;
};
function html(mode) {
  const cards = shape =>
    styles
      .map(([name, container, content, outline]) => {
        const background = color(mode, container);
        const text = color(mode, content);
        const border = outline ? `1px solid ${color(mode, outline)}` : '0';
        return `<button data-shape="${shape}" style="background:${background};color:${text};border:${border}">Action</button>`;
      })
      .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:SourceRoboto;src:url('${fontUrl}') format('truetype');font-weight:100 900}
    *{box-sizing:border-box}html,body{margin:0;width:960px;height:360px}
    body{background:${color(mode, 'Surface')};color:${color(mode, 'OnSurface')};font:14px/20px SourceRoboto,sans-serif}
    main{padding:24px 32px}h1{font-size:22px;line-height:28px;margin:0 0 6px}
    p{margin:0 0 22px}.grid{display:grid;grid-template-columns:76px repeat(5,1fr);column-gap:10px;row-gap:14px;align-items:center}
    .caption{font-size:12px}.type{font-weight:500}
    button{width:145px;height:40px;border-radius:20px;font:500 14px/20px SourceRoboto,sans-serif}
    .note{margin-top:26px;font-size:12px}
  </style></head><body><main>
    <h1>Compose Button pressed shape · ${mode.toLowerCase()}</h1>
    <p id="stage">Source-value browser projection · press 0ms · release 120ms · repress 160ms · release 600ms</p>
    <div class="grid">
      <span></span>${styles.map(([name]) => `<span class="caption">${name}</span>`).join('')}
      <span class="type">Round</span>${cards('round')}
      <span class="type">Square</span>${cards('square')}
    </div>
    <div class="note">One DefaultEffects shape path serves standard and Expressive schemes. State layer and elevation motion have separate source owners.</div>
  </main></body></html>`;
}

const browser = await chromium.launch({channel: 'chrome', headless: true});
const temporary = await fs.mkdtemp(
  path.join(os.tmpdir(), 'astryx-button-frames-'),
);
const images = {};
const clips = {};
try {
  for (const mode of ['Light', 'Dark']) {
    const page = await browser.newPage({
      viewport: {width: 960, height: 360},
      deviceScaleFactor: 1,
    });
    await page.setContent(html(mode));
    await page.evaluate(() => document.fonts.ready);
    if (!(await page.evaluate(() => document.fonts.check('14px SourceRoboto'))))
      throw new Error('Pinned Roboto did not load');
    for (let index = 0; index < motion.samples.length; index++) {
      const sample = motion.samples[index];
      await page.evaluate(
        ({fraction, timeMs}) => {
          for (const button of document.querySelectorAll('button')) {
            const rest = button.dataset.shape === 'square' ? 12 : 20;
            button.style.borderRadius = `${rest + (8 - rest) * fraction}px`;
          }
          document.getElementById('stage').textContent =
            `Source-value browser projection · press 0ms · release 120ms · repress 160ms · release 600ms · ${timeMs}ms`;
        },
        {fraction: sample.pressedFraction, timeMs: sample.timeMs},
      );
      const frame = await page.screenshot();
      await fs.writeFile(
        path.join(
          temporary,
          `${mode.toLowerCase()}-${String(index).padStart(3, '0')}.png`,
        ),
        frame,
      );
      if (selectedTimes.includes(sample.timeMs)) {
        const name = `button-shape-${mode.toLowerCase()}-${String(sample.timeMs).padStart(4, '0')}.png`;
        images[name] = await save(name, frame);
      }
    }
    for (const state of ['pressed', 'rest']) {
      await page.evaluate(
        ({state, shapeEndpoints}) => {
          for (const button of document.querySelectorAll('button'))
            button.style.borderRadius = `${shapeEndpoints[button.dataset.shape][state]}px`;
          document.getElementById('stage').textContent =
            `Reduced motion browser adaptation · immediate ${state} shape`;
        },
        {state, shapeEndpoints},
      );
      const name = `button-shape-${mode.toLowerCase()}-reduced-${state}.png`;
      images[name] = await save(name, await page.screenshot());
    }
    await page.close();
    const clipName = `compose-button-shape-${mode.toLowerCase()}.mp4`;
    const clip = path.join(temporary, clipName);
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
      clip,
    ]);
    clips[clipName] = await save(clipName, await fs.readFile(clip));
  }
  const manifest = {
    schemaVersion: 1,
    composeCommit: policy.androidxCommit,
    sourceTraceSha256: sha256(motionBytes),
    fontSha256,
    browser: `Chrome ${browser.version()}`,
    viewport: {width: 960, height: 360, dpr: 1},
    selectedTimes,
    styles,
    shapeEndpoints,
    images,
    clips,
  };
  const bytes = `${JSON.stringify(manifest, null, 2)}\n`;
  const target = path.join(here, 'render-manifest.json');
  if (check) {
    if ((await fs.readFile(target, 'utf8')) !== bytes)
      throw new Error('Button shape render manifest changed');
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
