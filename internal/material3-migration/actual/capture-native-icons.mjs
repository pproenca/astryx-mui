// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Native icon size/color graph, pinned licensed Google artwork and local font cache. @output Independent browser icon foundation captures. @position Disposable M3-NAT-002 visual evidence; component Icon acceptance remains separate. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';
import {chromium} from 'playwright';
import {material3ColorValues, material3FoundationGeometry, material3IconDefaults} from '../../../packages/material3/dist/index.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const sourceRoot = path.join(repo, 'internal/material3-migration/sources/icon-reference');
const output = path.join(repo, 'internal/material3-migration/actual/M3-NAT-002');
const manifest = JSON.parse(await fs.readFile(path.join(sourceRoot, 'manifest.json')));
const artwork = JSON.parse(await fs.readFile(path.join(repo, 'packages/themes/material3/src/material3IconSource.json')));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sixDigit = value => value.length === 4 ? `#${[...value.slice(1)].map(x => x + x).join('')}` : value;
assert.equal(artwork.sourceCommit, manifest.googleIconCommit);
assert.equal(material3IconDefaults.unsizedFallbackPx, manifest.composeFallbackSize);
assert.equal(material3IconDefaults.defaultTint, 'currentColor');
assert.equal(material3FoundationGeometry.button.expressiveSmall.iconSizePx, 20);
assert.equal(material3FoundationGeometry.button.expressiveSmall.iconGapPx, 8);
const fontCache = process.env.M3_ICON_FONT_CACHE || '/private/tmp/astryx-material3-font-cache';
const fonts = {};
for (const [family, expected] of Object.entries(manifest.fontPins)) {
  const bytes = await fs.readFile(path.join(fontCache, `MaterialSymbols${family}.woff2`));
  assert.equal(hash(bytes), expected, `${family} licensed font hash`);
  fonts[family] = `data:font/woff2;base64,${bytes.toString('base64')}`;
}
const names = manifest.cases.light.glyphs;
const svg = name => {
  const selected = artwork.artwork[name];
  assert.equal(selected.sha256, manifest.artwork[name].sha256);
  return `<svg aria-hidden="true" width="${material3IconDefaults.unsizedFallbackPx}" height="${material3IconDefaults.unsizedFallbackPx}" viewBox="${selected.viewBox}" fill="currentColor">${selected.paths.map(d => `<path d="${d}"/>`).join('')}</svg>`;
};
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  assert.equal(`Chrome ${browser.version()}`, manifest.browser);
  await fs.mkdir(output, {recursive: true});
  for (const mode of ['light', 'dark']) {
    const values = material3ColorValues(mode);
    const theme = {
      surface: sixDigit(values.surface),
      surfaceContainerLow: sixDigit(values['surface-container-low']),
      primary: sixDigit(values.primary),
      onPrimary: sixDigit(values['on-primary']),
      onSurface: sixDigit(values['on-surface']),
    };
    assert.deepEqual(theme, manifest.cases[mode].theme);
    const families = Object.keys(fonts).map(name =>
      `<div class="card"><div class="name">Material Symbols ${name}</div><div class="symbols">${names.map(glyph => `<div class="sample"><span class="font ${name}" aria-hidden="true">${glyph}</span><small>${glyph}</small></div>`).join('')}</div><div class="caption">FILL 0 · wght 400 · GRAD 0 · opsz 24</div></div>`).join('');
    const svgs = names.map(name => `<div class="sample"><span class="svg">${svg(name)}</span><small>${name}</small></div>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      @font-face{font-family:Outlined;src:url('${fonts.Outlined}') format('woff2')}
      @font-face{font-family:Rounded;src:url('${fonts.Rounded}') format('woff2')}
      @font-face{font-family:Sharp;src:url('${fonts.Sharp}') format('woff2')}
      *{box-sizing:border-box}html,body{margin:0}body{width:1180px;height:640px;background:${theme.surface};color:${theme.onSurface};font:16px/24px Arial,sans-serif}main{padding:28px 36px}h1{font-size:25px;line-height:32px;margin:0 0 5px}p{margin:0;color:${theme.onSurface};font-size:13px}h2{font-size:17px;margin:24px 0 12px}.row{display:flex;gap:16px}.card{background:${theme.surfaceContainerLow};border-radius:18px;padding:18px;flex:1;height:185px}.name{font-size:14px;font-weight:600}.symbols{display:flex;justify-content:space-around;margin-top:25px}.sample{text-align:center;min-width:64px}.sample small{display:block;font-size:11px;margin-top:12px}.font{display:block;font-size:${material3IconDefaults.unsizedFallbackPx}px;line-height:${material3IconDefaults.unsizedFallbackPx}px;width:${material3IconDefaults.unsizedFallbackPx}px;height:${material3IconDefaults.unsizedFallbackPx}px;margin:auto;font-feature-settings:'liga';font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24}.Outlined{font-family:Outlined}.Rounded{font-family:Rounded}.Sharp{font-family:Sharp}.svg{display:block;width:${material3IconDefaults.unsizedFallbackPx}px;height:${material3IconDefaults.unsizedFallbackPx}px;margin:auto}.caption{font-size:11px;margin-top:14px}.button{height:${material3FoundationGeometry.button.expressiveSmall.minHeightPx}px;min-width:58px;border-radius:100px;background:${theme.primary};color:${theme.onPrimary};display:inline-flex;gap:${material3FoundationGeometry.button.expressiveSmall.iconGapPx}px;align-items:center;padding:0 16px;font-size:14px;font-weight:600}.button .font{font-size:20px;line-height:20px;width:20px;height:20px;font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 20}.note{margin-top:16px;max-width:1020px;line-height:20px}
    </style></head><body><main><h1>Compose icon size and Material Symbols · ${mode === 'light' ? 'Light' : 'Dark'}</h1><p>24 dp unsized-painter fallback · source font styles · component glyph decisions remain separate</p><h2>Pinned Material Symbols fonts</h2><div class="row">${families}</div><h2>Pinned Google outlined SVG paths and a 20 dp Button icon</h2><div class="row"><div class="card"><div class="name">Selected SVG artwork · 24 dp</div><div class="symbols">${svgs}</div><div class="caption">Existing Core compatibility registry artwork</div></div><div class="card"><div class="name">Component binding example</div><div style="margin-top:25px"><div class="button"><span class="font Outlined" aria-hidden="true">check</span>Confirm</div></div><div class="caption">Expressive small Button icon 20 dp · 8 dp gap · OnPrimary tint</div></div></div><p class="note">A meaningful standalone symbol needs an accessible name; decorative artwork is hidden. An icon action needs a labelled interactive control and focus target. The font family and glyph are selected source-gap examples, not universal Compose defaults.</p></main></body></html>`;
    const page = await browser.newPage({viewport: manifest.viewport, deviceScaleFactor: manifest.dpr});
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    for (const family of Object.keys(fonts))
      assert.ok(await page.evaluate(name => document.fonts.check(`24px ${name}`), family), `${family} loaded`);
    const bytes = await page.screenshot();
    const actual = PNG.sync.read(bytes);
    const expected = PNG.sync.read(await fs.readFile(path.join(sourceRoot, `icons-${mode}.png`)));
    assert.equal(pixelmatch(actual.data, expected.data, null, expected.width, expected.height, {threshold: 0, includeAA: true}), 0, `${mode} icon pixels`);
    await fs.writeFile(path.join(output, `icons-${mode}.png`), bytes);
    await page.close();
  }
  console.log(`Chrome ${browser.version()}: native icon size/tint graph matches pinned font and artwork source pixels.`);
} finally {
  await browser.close();
}
