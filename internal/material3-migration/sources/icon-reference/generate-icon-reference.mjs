// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose icon semantics, Google Material Symbols fonts/SVGs and frozen kit inventory. @output Light/dark icon source captures with hashes. @position Disposable foundation icon reference generator. */
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
const figma = await read(path.join(sources, 'figma-kit-inventory.json'));
const icons = await read(
  path.join(repo, 'packages/themes/material3/src/material3IconSource.json'),
);
const policy = await read(
  path.join(repo, 'internal/material3-migration/policy.json'),
);
if (
  compose.commit !== policy.androidxCommit ||
  figma.source.localExportSha256 !== policy.figmaSha256 ||
  icons.sourceCommit !== 'bd8cb85bd4bad964fe6918f79665bb40c3a8efef'
)
  throw new Error('Icon reference source pins differ');
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
const iconSource = compose.families.find(item => item.name === 'Icon');
const composeFile = await fs.readFile(path.join(androidx, iconSource.path));
if (
  sha256(composeFile) !== iconSource.sha256 ||
  !composeFile.toString().includes('tint: Color = LocalContentColor.current') ||
  !composeFile
    .toString()
    .includes(
      'DefaultIconSizeModifier = Modifier.size(SmallIconButtonTokens.IconSize)',
    ) ||
  !composeFile.toString().includes('this.role = Role.Image')
)
  throw new Error('Pinned Compose Icon sizing/tint/semantics source differs');
const smallToken = compose.tokens.find(
  item => item.name === 'SmallIconButtonTokens',
);
if (
  !smallToken?.values.some(
    item => item.name === 'IconSize' && item.expression === '24.0.dp',
  )
)
  throw new Error('Pinned Compose Icon fallback size differs');
const kitIconSets = figma.componentSets.filter(item => /icon/i.test(item.name));
if (kitIconSets.length < 21)
  throw new Error('Frozen kit icon component coverage changed');
const fontCache =
  process.env.M3_ICON_FONT_CACHE || '/private/tmp/astryx-material3-font-cache';
const fontPins = {
  Outlined: 'c5c96fcb27145d17a04cb2fa68d33921ca4258c6bb2cf6fac8b1bce401595e57',
  Rounded: '0865c62d7fda358cd4cdb77792b758afa66fae2c4159fa3fb04a2c1d05700e9e',
  Sharp: '2349783253d47d2d1b92ab63dd4284988f05e73459aa9c8f6e9a78ed360101c9',
};
const fontUrls = {};
for (const [name, expected] of Object.entries(fontPins)) {
  const bytes = await fs.readFile(
    path.join(fontCache, `MaterialSymbols${name}.woff2`),
  );
  if (sha256(bytes) !== expected)
    throw new Error(`Pinned Material Symbols ${name} font differs`);
  fontUrls[name] = `data:font/woff2;base64,${bytes.toString('base64')}`;
}
const selectedGlyphs = ['close', 'check', 'search'];
for (const name of selectedGlyphs)
  if (
    icons.artwork[name]?.symbol !== name ||
    icons.artwork[name].variant !== 'outlined'
  )
    throw new Error(`Pinned outlined SVG artwork changed: ${name}`);
const token = name => {
  const file = compose.tokens.find(item => item.name === name);
  return new Map(
    file.values.map(({name: key, expression}) => [key, expression]),
  );
};
const palette = token('PaletteTokens');
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
const svg = name => {
  const artwork = icons.artwork[name];
  return `<svg aria-hidden="true" width="24" height="24" viewBox="${artwork.viewBox}" fill="currentColor">${artwork.paths.map(d => `<path d="${d}"/>`).join('')}</svg>`;
};
const files = {};
const cases = {};
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  for (const mode of ['Light', 'Dark']) {
    const theme = Object.fromEntries(
      [
        'Surface',
        'SurfaceContainerLow',
        'Primary',
        'OnPrimary',
        'OnSurface',
      ].map(name => [
        name.charAt(0).toLowerCase() + name.slice(1),
        hex(color(mode, name)),
      ]),
    );
    const families = Object.keys(fontPins)
      .map(
        name =>
          `<div class="card"><div class="name">Material Symbols ${name}</div><div class="symbols">${selectedGlyphs.map(glyph => `<div class="sample"><span class="font ${name}" aria-hidden="true">${glyph}</span><small>${glyph}</small></div>`).join('')}</div><div class="caption">FILL 0 · wght 400 · GRAD 0 · opsz 24</div></div>`,
      )
      .join('');
    const svgs = selectedGlyphs
      .map(
        name =>
          `<div class="sample"><span class="svg">${svg(name)}</span><small>${name}</small></div>`,
      )
      .join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      @font-face{font-family:Outlined;src:url('${fontUrls.Outlined}') format('woff2')}
      @font-face{font-family:Rounded;src:url('${fontUrls.Rounded}') format('woff2')}
      @font-face{font-family:Sharp;src:url('${fontUrls.Sharp}') format('woff2')}
      *{box-sizing:border-box}html,body{margin:0}body{width:1180px;height:640px;background:${theme.surface};color:${theme.onSurface};font:16px/24px Arial,sans-serif}main{padding:28px 36px}h1{font-size:25px;line-height:32px;margin:0 0 5px}p{margin:0;color:${theme.onSurface};font-size:13px}h2{font-size:17px;margin:24px 0 12px}.row{display:flex;gap:16px}.card{background:${theme.surfaceContainerLow};border-radius:18px;padding:18px;flex:1;height:185px}.name{font-size:14px;font-weight:600}.symbols{display:flex;justify-content:space-around;margin-top:25px}.sample{text-align:center;min-width:64px}.sample small{display:block;font-size:11px;margin-top:12px}.font{display:block;font-size:24px;line-height:24px;width:24px;height:24px;margin:auto;font-feature-settings:'liga';font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24}.Outlined{font-family:Outlined}.Rounded{font-family:Rounded}.Sharp{font-family:Sharp}.svg{display:block;width:24px;height:24px;margin:auto}.caption{font-size:11px;margin-top:14px}.button{height:40px;min-width:58px;border-radius:100px;background:${theme.primary};color:${theme.onPrimary};display:inline-flex;gap:8px;align-items:center;padding:0 16px;font-size:14px;font-weight:600}.button .font{font-size:20px;line-height:20px;width:20px;height:20px;font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 20}.note{margin-top:16px;max-width:1020px;line-height:20px}
    </style></head><body><main><h1>Compose icon size and Material Symbols · ${mode}</h1><p>24 dp unsized-painter fallback · source font styles · component glyph decisions remain separate</p><h2>Pinned Material Symbols fonts</h2><div class="row">${families}</div><h2>Pinned Google outlined SVG paths and a 20 dp Button icon</h2><div class="row"><div class="card"><div class="name">Selected SVG artwork · 24 dp</div><div class="symbols">${svgs}</div><div class="caption">Existing Core compatibility registry artwork</div></div><div class="card"><div class="name">Component binding example</div><div style="margin-top:25px"><div class="button"><span class="font Outlined" aria-hidden="true">check</span>Confirm</div></div><div class="caption">Expressive small Button icon 20 dp · 8 dp gap · OnPrimary tint</div></div></div><p class="note">A meaningful standalone symbol needs an accessible name; decorative artwork is hidden. An icon action needs a labelled interactive control and focus target. The font family and glyph are selected source-gap examples, not universal Compose defaults.</p></main></body></html>`;
    const page = await browser.newPage({
      viewport: {width: 1180, height: 640},
      deviceScaleFactor: 1,
    });
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    for (const name of Object.keys(fontPins))
      if (
        !(await page.evaluate(
          family => document.fonts.check(`24px ${family}`),
          name,
        ))
      )
        throw new Error(`Pinned Material Symbols ${name} did not load`);
    files[`icons-${mode.toLowerCase()}.png`] = await page.screenshot();
    cases[mode.toLowerCase()] = {
      theme,
      glyphs: selectedGlyphs,
      axes: {fill: 0, weight: 400, grade: 0, opticalSize: 24},
    };
    await page.close();
  }
  const manifest = {
    schemaVersion: 1,
    composeCommit: policy.androidxCommit,
    figmaSha256: policy.figmaSha256,
    composeIcon: {path: iconSource.path, sha256: iconSource.sha256},
    composeFallbackSize: 24,
    googleIconCommit: icons.sourceCommit,
    fontPins,
    artwork: Object.fromEntries(
      selectedGlyphs.map(name => [
        name,
        {
          sourcePath: icons.artwork[name].sourcePath,
          sha256: icons.artwork[name].sha256,
        },
      ]),
    ),
    kitIconSetCount: kitIconSets.length,
    cases,
    browser: `Chrome ${browser.version()}`,
    os: `${os.platform()} ${os.release()}`,
    dpr: 1,
    viewport: {width: 1180, height: 640},
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
      throw new Error(`Icon source fixture differs: ${name}`);
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
