// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Pinned Compose scalar field traces, palette roles and licensed Roboto fixture.
 * @output Matched source-value field frames, reduced-motion frames and normal-speed clips.
 * @position Disposable source renderer; these browser pixels are not Compose device captures.
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
const sources = path.dirname(here);
const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const policy = await read(
  path.join(repo, 'internal/material3-migration/policy.json'),
);
const inventory = await read(path.join(sources, 'compose-inventory.json'));
const motion = await read(path.join(here, 'field-motion.json'));
if (
  inventory.commit !== policy.androidxCommit ||
  motion.composeCommit !== policy.androidxCommit
)
  throw new Error('Field reference source pins differ');

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
  return resolve(name);
};
const hex = channels =>
  `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
const font = await fs.readFile(
  path.join(
    repo,
    'packages/themes/material3/scripts/fonts/Roboto-wdth-wght.ttf',
  ),
);
const fontSha256 = sha256(font);
if (
  fontSha256 !==
  'd7598e12c5dbef095ff8272cfc55da0250bd07fbdecbac8a530b9b277872a134'
)
  throw new Error('Pinned SIL OFL Roboto fixture changed');
const fontUrl = `data:font/ttf;base64,${font.toString('base64')}`;
const times = [0, 20, 80, 120, 160, 180, 260, 600, 880, 1200];
const state = (scheme, timeMs) =>
  Object.fromEntries(
    Object.entries(motion.schemes[scheme]).map(([key, trace]) => {
      const sample = trace.samples.find(
        candidate => candidate.timeMs === timeMs,
      );
      if (!sample) throw new Error(`Missing ${scheme} ${key} ${timeMs}ms`);
      return [key, sample.position];
    }),
  );
const check = process.argv.includes('--check');
const save = async (file, bytes) => {
  const digest = sha256(bytes);
  if (check) {
    if (sha256(await fs.readFile(path.join(here, file))) !== digest)
      throw new Error(`Field reference changed: ${file}`);
  } else await fs.writeFile(path.join(here, file), bytes);
  return digest;
};

function html(mode) {
  const roles = Object.fromEntries(
    [
      'Surface',
      'SurfaceContainerHighest',
      'OnSurface',
      'OnSurfaceVariant',
      'Primary',
    ].map(role => [role, hex(color(mode, role))]),
  );
  const cards = ['standard', 'expressive']
    .flatMap(scheme =>
      ['filled', 'outlined'].map(
        style => `
      <section class="sample">
        <div class="caption">${scheme === 'standard' ? 'Standard' : 'Expressive'} · ${style}</div>
        <div class="field ${style}" id="${scheme}-${style}">
          <span class="label">Email address</span>
          <span class="placeholder">name@example.com</span>
        </div>
        <div class="support">Supporting text</div>
      </section>`,
      ),
    )
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:SourceRoboto;src:url('${fontUrl}') format('truetype');font-weight:100 900}
    *{box-sizing:border-box}html,body{margin:0;width:960px;height:420px}
    body{background:${roles.Surface};color:${roles.OnSurface};font:16px/24px SourceRoboto,sans-serif}
    main{padding:22px 36px}h1{font-size:22px;line-height:30px;margin:0 0 4px}
    p{font-size:13px;line-height:20px;margin:0 0 19px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:24px 28px}
    .sample{width:400px}.caption{font-size:13px;line-height:20px;margin-bottom:16px}
    .field{position:relative;width:280px;height:56px;overflow:visible}
    .field.filled{background:${roles.SurfaceContainerHighest};border-radius:4px 4px 0 0}
    .field.outlined{background:${roles.Surface};border:1px solid ${roles.OnSurfaceVariant};border-radius:4px}
    .label,.placeholder{position:absolute;left:16px;white-space:nowrap;pointer-events:none}
    .label{top:16px;color:${roles.OnSurfaceVariant};transform-origin:left top}
    .outlined .label{left:12px;padding:0 4px;background:${roles.Surface}}
    .placeholder{top:18px;color:${roles.OnSurfaceVariant};opacity:0}
    .support{font-size:12px;line-height:18px;margin:4px 0 0 16px;color:${roles.OnSurfaceVariant}}
    .legend{font-size:12px;line-height:18px;margin-top:18px;color:${roles.OnSurfaceVariant}}
  </style></head><body><main>
    <h1>Compose text field motion · ${mode}</h1>
    <p id="stage">Source-value browser projection · focus 0ms · blur 120ms · refocus 160ms · blur 600ms</p>
    <div class="grid">${cards}</div>
    <div class="legend">Label: fast spatial · placeholder: slow in / fast out · stroke: fast spatial · color: fast effects</div>
  </main></body></html>`;
}

const browser = await chromium.launch({channel: 'chrome', headless: true});
const temporary = await fs.mkdtemp(
  path.join(os.tmpdir(), 'astryx-field-frames-'),
);
const images = {};
const clips = {};
try {
  for (const mode of ['Light', 'Dark']) {
    const page = await browser.newPage({
      viewport: {width: 960, height: 420},
      deviceScaleFactor: 1,
    });
    await page.setContent(html(mode));
    await page.evaluate(() => document.fonts.ready);
    if (!(await page.evaluate(() => document.fonts.check('16px SourceRoboto'))))
      throw new Error('Pinned Roboto did not load');
    const resting = color(mode, 'OnSurfaceVariant');
    const active = color(mode, 'Primary');
    for (let index = 0; index <= 60; index++) {
      const timeMs = index * 20;
      const values = {
        standard: state('standard', timeMs),
        expressive: state('expressive', timeMs),
      };
      await page.evaluate(
        ({values, timeMs, resting, active}) => {
          const mix = alpha =>
            `rgb(${resting
              .map((value, index) =>
                Math.round(value * (1 - alpha) + active[index] * alpha),
              )
              .join(',')})`;
          for (const [scheme, value] of Object.entries(values)) {
            for (const style of ['filled', 'outlined']) {
              const field = document.getElementById(`${scheme}-${style}`);
              const label = field.querySelector('.label');
              const placeholder = field.querySelector('.placeholder');
              const labelProgress = value.label;
              label.style.top = `${16 - labelProgress * (style === 'filled' ? 13 : 24)}px`;
              label.style.fontSize = `${16 - labelProgress * 4}px`;
              label.style.lineHeight = `${24 - labelProgress * 8}px`;
              label.style.color = mix(Math.max(0, Math.min(1, value.color)));
              placeholder.style.opacity = String(
                Math.max(0, Math.min(1, value.placeholder)),
              );
              const stroke = `${Math.max(0, value.indicator)}px solid ${mix(
                Math.max(0, Math.min(1, value.color)),
              )}`;
              if (style === 'filled') field.style.borderBottom = stroke;
              else field.style.border = stroke;
            }
          }
          document.getElementById('stage').textContent =
            `Source-value browser projection · focus 0ms · blur 120ms · refocus 160ms · blur 600ms · ${timeMs}ms`;
        },
        {values, timeMs, resting, active},
      );
      const frame = await page.screenshot();
      await fs.writeFile(
        path.join(
          temporary,
          `${mode.toLowerCase()}-${String(index).padStart(3, '0')}.png`,
        ),
        frame,
      );
      if (times.includes(timeMs)) {
        const name = `field-${mode.toLowerCase()}-${String(timeMs).padStart(4, '0')}.png`;
        images[name] = await save(name, frame);
      }
    }
    await page.evaluate(active => {
      for (const field of document.querySelectorAll('.field')) {
        const style = field.classList.contains('filled')
          ? 'filled'
          : 'outlined';
        const label = field.querySelector('.label');
        label.style.top = style === 'filled' ? '3px' : '-8px';
        label.style.fontSize = '12px';
        label.style.lineHeight = '16px';
        label.style.color = `rgb(${active.join(',')})`;
        field.style[style === 'filled' ? 'borderBottom' : 'border'] =
          `2px solid rgb(${active.join(',')})`;
        field.querySelector('.placeholder').style.opacity = '1';
      }
      document.getElementById('stage').textContent =
        'Reduced motion · immediately focused browser adaptation';
    }, active);
    const reducedName = `field-${mode.toLowerCase()}-reduced.png`;
    images[reducedName] = await save(reducedName, await page.screenshot());
    await page.close();
    const clipName = `compose-field-${mode.toLowerCase()}.mp4`;
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
      '-map_metadata',
      '-1',
      clip,
    ]);
    clips[clipName] = await save(clipName, await fs.readFile(clip));
  }
  const manifest = {
    schemaVersion: 1,
    composeCommit: policy.androidxCommit,
    figmaSha256: policy.figmaSha256,
    webCommit: policy.materialWebCommit,
    motionSha256: sha256(
      await fs.readFile(path.join(here, 'field-motion.json')),
    ),
    renderer: 'Chrome source-value browser projection',
    browser: `Chrome ${browser.version()}`,
    os: `${os.platform()} ${os.release()}`,
    viewport: {width: 960, height: 420},
    dpr: 1,
    font: {family: 'Roboto', sha256: fontSha256, loaded: true},
    sequence: motion.sequence,
    times,
    images,
    clips,
    note: 'Browser projection of Compose scalar spring values, not Compose device pixels.',
  };
  const bytes = JSON.stringify(manifest, null, 2) + '\n';
  if (check) {
    if ((await fs.readFile(path.join(here, 'manifest.json'), 'utf8')) !== bytes)
      throw new Error('Field reference manifest changed');
  } else await fs.writeFile(path.join(here, 'manifest.json'), bytes);
  console.log(
    `Rendered ${Object.keys(images).length} frames and ${Object.keys(clips).length} clips`,
  );
} finally {
  await browser.close();
  await fs.rm(temporary, {recursive: true, force: true});
}
