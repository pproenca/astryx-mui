// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose elevation/color source, Web browser shadow geometry and licensed Roboto fixture. @output Light/dark tonal and browser-shadow source captures with numeric provenance. @position Disposable foundation elevation reference generator. */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const sources = path.dirname(here);
const repo = path.resolve(sources, '../../..');
const read = async file => JSON.parse(await fs.readFile(file));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const compose = await read(path.join(sources, 'compose-inventory.json'));
const figma = await read(path.join(sources, 'figma-foundation-values.json'));
const web = await read(
  path.join(
    repo,
    'packages/themes/material3/src/material3ElevationSource.json',
  ),
);
const policy = await read(
  path.join(repo, 'internal/material3-migration/policy.json'),
);
if (
  compose.commit !== policy.androidxCommit ||
  figma.sourceExportSha256 !== policy.figmaSha256 ||
  web.sourceCommit !== policy.materialWebCommit
)
  throw new Error('Elevation reference source pins differ from policy');
const colorSource = compose.families.find(item => item.name === 'ColorScheme');
if (
  colorSource?.sha256 !==
  '2cae5584a44f5b6ffd15203f75b67138d386642589359a047bccdc31b046fd91'
)
  throw new Error('Pinned Compose tonal elevation formula source changed');
const androidx = process.env.M3_ANDROIDX;
if (!androidx)
  throw new Error('Set M3_ANDROIDX to the pinned AndroidX checkout');
if (
  execFileSync('git', ['-C', androidx, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim() !== policy.androidxCommit ||
  execFileSync('git', ['-C', androidx, 'status', '--porcelain'], {
    encoding: 'utf8',
  }).trim()
)
  throw new Error('AndroidX checkout differs from the pinned clean revision');
const source = await fs.readFile(path.join(androidx, colorSource.path));
if (
  sha256(source) !== colorSource.sha256 ||
  !source.toString().includes('((4.5f * ln(elevation.value + 1)) + 2f) / 100f')
)
  throw new Error('Pinned Compose tonal formula differs');
const token = name => {
  const file = compose.tokens.find(item => item.name === name);
  if (!file) throw new Error(`Missing Compose token: ${name}`);
  return new Map(
    file.values.map(({name: key, expression}) => [key, expression]),
  );
};
const elevation = token('ElevationTokens');
const palette = token('PaletteTokens');
const levels = Array.from({length: 6}, (_, index) => {
  const expression = elevation.get(`Level${index}`);
  if (!/^\d+(?:\.\d+)?\.dp$/.test(expression || ''))
    throw new Error(`Unresolved Compose elevation level ${index}`);
  const dp = Number(expression.slice(0, -3));
  if (dp !== web.generatedDp[`level${index}`])
    throw new Error('Compose/Web elevation numbers differ');
  return {
    level: index,
    dp,
    alpha: dp === 0 ? 0 : (4.5 * Math.log(dp + 1) + 2) / 100,
  };
});
const robotoPath = path.join(
  repo,
  'packages/themes/material3/scripts/fonts/Roboto-wdth-wght.ttf',
);
const roboto = await fs.readFile(robotoPath);
const robotoSha256 = sha256(roboto);
if (
  robotoSha256 !==
  'd7598e12c5dbef095ff8272cfc55da0250bd07fbdecbac8a530b9b277872a134'
)
  throw new Error('Pinned licensed Roboto fixture changed');
const fontUrl = `data:font/ttf;base64,${roboto.toString('base64')}`;

const rgb = expression => {
  const match = expression?.match(
    /^Color\(red = (\d+), green = (\d+), blue = (\d+)\)$/,
  );
  if (!match)
    throw new Error(`Unresolved Compose palette color: ${expression}`);
  return match.slice(1).map(Number);
};
const color = (mode, name) => {
  const scheme = token(`Color${mode}Tokens`);
  function resolve(role) {
    const expression = scheme.get(role);
    if (!expression) throw new Error(`Missing Compose ${mode} color: ${role}`);
    return expression.startsWith('PaletteTokens.')
      ? rgb(palette.get(expression.slice('PaletteTokens.'.length)))
      : resolve(expression);
  }
  return resolve(name);
};
const hex = channels =>
  `#${channels.map(value => value.toString(16).padStart(2, '0')).join('')}`;
const composite = (base, tint, alpha) =>
  base.map((channel, index) =>
    Math.round(channel * (1 - alpha) + tint[index] * alpha),
  );
const browserShadow = level => {
  if (level === 0) return 'none';
  return Object.values(web.layers[`level${level}`])
    .map(layer => {
      const geometry = layer.boxShadow.replace(/^rgb\(1, 2, 3\) /, '');
      if (geometry === layer.boxShadow)
        throw new Error('Unrecognized pinned Web shadow color placeholder');
      return `${geometry} rgba(0, 0, 0, ${layer.opacity})`;
    })
    .join(', ');
};

const files = {};
const cases = {};
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  for (const mode of ['Light', 'Dark']) {
    const surface = color(mode, 'Surface');
    const tint = color(mode, 'SurfaceTint');
    const onSurface = color(mode, 'OnSurface');
    const backdrop = color(mode, 'SurfaceContainerLowest');
    const colors = levels.map(item =>
      hex(item.dp === 0 ? surface : composite(surface, tint, item.alpha)),
    );
    const parentDp = levels[2].dp;
    const childDp = levels[1].dp;
    const nestedAlpha = (4.5 * Math.log(parentDp + childDp + 1) + 2) / 100;
    const nestedColor = hex(composite(surface, tint, nestedAlpha));
    const tonal = levels
      .map(
        (item, index) =>
          `<figure><div class="sample" style="background:${colors[index]}"></div><figcaption>Level ${index} · ${item.dp} dp<br>${colors[index]} · ${item.alpha.toFixed(5)}</figcaption></figure>`,
      )
      .join('');
    const shadows = levels
      .map(
        item =>
          `<figure><div class="shadow" style="box-shadow:${browserShadow(item.level)}"></div><figcaption>Level ${item.level} · ${item.dp} dp</figcaption></figure>`,
      )
      .join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      @font-face{font-family:SourceRoboto;src:url('${fontUrl}') format('truetype');font-weight:100 900}
      *{box-sizing:border-box}html,body{margin:0;padding:0}body{width:1280px;height:760px;background:${hex(backdrop)};color:${hex(onSurface)};font:16px/24px SourceRoboto,sans-serif}
      main{padding:28px 36px}h1{font-size:24px;line-height:32px;margin:0 0 8px}h2{font-size:17px;line-height:24px;margin:0 0 12px}p{margin:0 0 16px;font-size:13px;line-height:20px}
      section{margin-bottom:20px}.row{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}figure{margin:0;text-align:center}.sample{width:152px;height:110px;margin:0 auto;border-radius:16px}.shadow{width:152px;height:78px;margin:0 auto;background:${hex(surface)};border-radius:16px}
      figcaption{font-size:12px;line-height:18px;margin-top:8px}.nested{display:flex;gap:24px;align-items:center}.parent{width:276px;height:110px;padding:23px 54px;background:${colors[2]};border-radius:16px}.child{height:64px;background:${nestedColor};border-radius:12px}.standalone{width:168px;height:64px;background:${colors[1]};border-radius:12px}.note{max-width:600px;font-size:13px;line-height:20px}
    </style></head><body><main><h1>Compose tonal elevation · ${mode}</h1><p>Source-value browser rendition · tonal and shadow elevation are independent</p><section><h2>Tonal surface · shadow 0</h2><div class="row">${tonal}</div></section><section><h2>Nested tonal surfaces</h2><div class="nested"><div class="parent"><div class="child"></div></div><div class="standalone"></div><div class="note">Parent 3 dp + child 1 dp = child color at absolute 4 dp (${nestedColor}). Standalone child at 1 dp (${colors[1]}). Neither sample has a shadow.</div></div></section><section><h2>Kit/Web browser shadow geometry · tonal 0</h2><div class="row">${shadows}</div></section></main></body></html>`;
    const page = await browser.newPage({
      viewport: {width: 1280, height: 760},
      deviceScaleFactor: 1,
    });
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    if (!(await page.evaluate(() => document.fonts.check('16px SourceRoboto'))))
      throw new Error('Pinned Roboto did not load');
    const png = await page.screenshot();
    files[`elevation-${mode.toLowerCase()}.png`] = png;
    cases[mode.toLowerCase()] = {
      surface: hex(surface),
      surfaceTint: hex(tint),
      backdrop: hex(backdrop),
      tonalColors: colors,
      nested: {
        parentDp,
        childDp,
        absoluteDp: parentDp + childDp,
        color: nestedColor,
      },
    };
    await page.close();
  }
  const manifest = {
    schemaVersion: 1,
    composeCommit: policy.androidxCommit,
    colorSchemeSha256: colorSource.sha256,
    figmaSha256: policy.figmaSha256,
    webCommit: policy.materialWebCommit,
    formula: 'elevation === 0 ? 0 : (4.5 * ln(elevation + 1) + 2) / 100',
    levels,
    cases,
    browser: `Chrome ${browser.version()}`,
    os: `${os.platform()} ${os.release()}`,
    dpr: 1,
    viewport: {width: 1280, height: 760},
    font: {file: path.relative(repo, robotoPath), sha256: robotoSha256},
    files: Object.fromEntries(
      Object.entries(files).map(([name, bytes]) => [name, sha256(bytes)]),
    ),
  };
  files['manifest.json'] = Buffer.from(
    JSON.stringify(manifest, null, 2) + '\n',
  );
} finally {
  await browser.close();
}
const check = process.argv.includes('--check');
for (const [name, bytes] of Object.entries(files)) {
  const file = path.join(here, name);
  if (check) {
    if (!(await fs.readFile(file)).equals(bytes))
      throw new Error(`Elevation source fixture differs: ${name}`);
  } else {
    await fs.writeFile(file, bytes);
  }
}
console.log(
  JSON.stringify({
    mode: check ? 'checked' : 'written',
    files: Object.keys(files),
  }),
);
