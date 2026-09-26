// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Native elevation/state helpers, licensed Roboto and pinned captures. @output Exact light/dark browser pixel comparisons. @position Permanent native layer regression. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';
import {chromium} from 'playwright';
import {captureFoundation} from './capture-foundation.mjs';
import {
  material3ColorValues,
  material3ElevationLevels,
  material3ElevationShadowLayers,
  material3FilledButtonStateColors,
  material3LayerColor,
  material3StateOpacity,
  material3TonalElevation,
} from '../dist/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const font = await fs.readFile(
  path.resolve(root, '../themes/material3/scripts/fonts/Roboto-wdth-wght.ttf'),
);
const fontUrl = `data:font/ttf;base64,${font.toString('base64')}`;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const reference = async (family, name) =>
  fs.readFile(path.join(root, 'fixtures/references', family, name));
const manifests = Object.fromEntries(
  await Promise.all(
    ['elevation', 'state'].map(async family => [
      family,
      JSON.parse(await reference(family, 'manifest.json')),
    ]),
  ),
);
for (const manifest of Object.values(manifests))
  assert.equal(hash(font), manifest.font.sha256);

const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  for (const mode of ['light', 'dark']) {
    const colors = material3ColorValues(mode);
    const primary = colors.primary;
    const surface = colors.surface;
    const onSurface = colors['on-surface'];
    const backdrop = colors['surface-container-lowest'];
    const elevation = manifests.elevation;
    assert.deepEqual(material3ElevationLevels, elevation.levels);
    const tonalColors = material3ElevationLevels.map(item =>
      material3TonalElevation(mode, item.dp),
    );
    const nestedColor = material3TonalElevation(
      mode,
      elevation.cases[mode].nested.absoluteDp,
    );
    const tonal = material3ElevationLevels
      .map(
        (item, index) =>
          `<figure><div class="sample" style="background:${tonalColors[index]}"></div><figcaption>Level ${index} · ${item.dp} dp<br>${tonalColors[index]} · ${item.alpha.toFixed(5)}</figcaption></figure>`,
      )
      .join('');
    const shadows = material3ElevationLevels
      .map(item => {
        const layers = material3ElevationShadowLayers(mode, item.level);
        const shadow =
          item.level === 0
            ? 'none'
            : [layers.key, layers.ambient]
                .map(
                  layer =>
                    `${layer.boxShadow.replace(/^#[0-9a-f]+ /i, '')} rgba(0, 0, 0, ${layer.opacity})`,
                )
                .join(', ');
        return `<figure><div class="shadow" style="box-shadow:${shadow}"></div><figcaption>Level ${item.level} · ${item.dp} dp</figcaption></figure>`;
      })
      .join('');
    const page = await browser.newPage({
      viewport: elevation.viewport,
      deviceScaleFactor: 1,
    });
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
      @font-face{font-family:SourceRoboto;src:url('${fontUrl}') format('truetype');font-weight:100 900}
      *{box-sizing:border-box}html,body{margin:0;padding:0}body{width:1280px;height:760px;background:${backdrop};color:${onSurface};font:16px/24px SourceRoboto,sans-serif}
      main{padding:28px 36px}h1{font-size:24px;line-height:32px;margin:0 0 8px}h2{font-size:17px;line-height:24px;margin:0 0 12px}p{margin:0 0 16px;font-size:13px;line-height:20px}
      section{margin-bottom:20px}.row{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}figure{margin:0;text-align:center}.sample{width:152px;height:110px;margin:0 auto;border-radius:16px}.shadow{width:152px;height:78px;margin:0 auto;background:${surface};border-radius:16px}
      figcaption{font-size:12px;line-height:18px;margin-top:8px}.nested{display:flex;gap:24px;align-items:center}.parent{width:276px;height:110px;padding:23px 54px;background:${tonalColors[2]};border-radius:16px}.child{height:64px;background:${nestedColor};border-radius:12px}.standalone{width:168px;height:64px;background:${tonalColors[1]};border-radius:12px}.note{max-width:600px;font-size:13px;line-height:20px}
    </style></head><body><main><h1>Compose tonal elevation · ${mode === 'light' ? 'Light' : 'Dark'}</h1><p>Source-value browser rendition · tonal and shadow elevation are independent</p><section><h2>Tonal surface · shadow 0</h2><div class="row">${tonal}</div></section><section><h2>Nested tonal surfaces</h2><div class="nested"><div class="parent"><div class="child"></div></div><div class="standalone"></div><div class="note">Parent 3 dp + child 1 dp = child color at absolute 4 dp (${nestedColor}). Standalone child at 1 dp (${tonalColors[1]}). Neither sample has a shadow.</div></div></section><section><h2>Kit/Web browser shadow geometry · tonal 0</h2><div class="row">${shadows}</div></section></main></body></html>`);
    await page.evaluate(() => document.fonts.ready);
    assert.ok(
      await page.evaluate(() => document.fonts.check('16px SourceRoboto')),
    );
    let actual = PNG.sync.read(await page.screenshot());
    let expected = PNG.sync.read(
      await reference('elevation', `elevation-${mode}.png`),
    );
    assert.equal(
      pixelmatch(
        actual.data,
        expected.data,
        null,
        expected.width,
        expected.height,
        {threshold: 0, includeAA: true},
      ),
      0,
      `${mode} elevation pixels`,
    );
    await captureFoundation(`elevation-${mode}`, actual);
    await page.close();

    const state = manifests.state;
    assert.deepEqual(material3StateOpacity, state.stateOpacity);
    const generic = [
      {name: 'Rest', alpha: 0, fill: surface},
      ...Object.entries(material3StateOpacity).map(([name, alpha]) => ({
        name,
        alpha,
        fill: material3LayerColor(surface, onSurface, alpha),
      })),
    ];
    const button = ['Rest', 'hover', 'focus', 'pressed', 'Disabled'].map(
      name => {
        const output = material3FilledButtonStateColors(
          mode,
          name.toLowerCase(),
        );
        return {
          name,
          alpha:
            name === 'Rest'
              ? 0
              : name === 'Disabled'
                ? null
                : material3StateOpacity[name],
          fill: output.container,
          label: output.label,
        };
      },
    );
    const cards = generic
      .map(
        item =>
          `<figure><div class="generic" style="background:${item.fill}"></div><figcaption>${item.name} · ${item.alpha.toFixed(2)}<br>${item.fill}</figcaption></figure>`,
      )
      .join('');
    const buttons = button
      .map(
        item =>
          `<figure><div class="button" style="background:${item.fill};color:${item.label}">Button</div><figcaption>${item.name}${item.alpha === null ? '' : ` · ${item.alpha.toFixed(2)}`}<br>${item.fill}</figcaption></figure>`,
      )
      .join('');
    const statePage = await browser.newPage({
      viewport: state.viewport,
      deviceScaleFactor: 1,
    });
    await statePage.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
      @font-face{font-family:SourceRoboto;src:url('${fontUrl}') format('truetype');font-weight:100 900}
      *{box-sizing:border-box}html,body{margin:0;padding:0}body{width:1180px;height:560px;background:${backdrop};color:${onSurface};font:16px/24px SourceRoboto,sans-serif}
      main{padding:28px 36px}h1{font-size:24px;line-height:32px;margin:0 0 8px}h2{font-size:17px;line-height:24px;margin:0 0 12px}p{margin:0 0 20px;font-size:13px;line-height:20px}
      section{margin-bottom:30px}.row{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}figure{margin:0;text-align:center}.generic{width:160px;height:96px;margin:0 auto;border-radius:16px}.button{width:160px;height:40px;margin:28px auto;display:flex;align-items:center;justify-content:center;border-radius:9999px;font-size:14px;font-weight:500}figcaption{font-size:12px;line-height:18px;margin-top:8px}.note{font-size:13px;line-height:20px;max-width:1000px}
    </style></head><body><main><h1>Compose state layers · ${mode === 'light' ? 'Light' : 'Dark'}</h1><p>Static source-value browser rendition · interactive ripple and focus acceptance remain separate</p><section><h2>OnSurface layer over Surface</h2><div class="row">${cards}</div></section><section><h2>Filled Button · Primary with OnPrimary layer</h2><div class="row">${buttons}</div></section><div class="note">Disabled uses OnSurface container at 10% and OnSurfaceVariant label at 38%. Focused browser controls also need a visible focus indicator. Pressed feedback animates in the source; this sheet shows only its static layer color.</div></main></body></html>`);
    await statePage.evaluate(() => document.fonts.ready);
    assert.ok(
      await statePage.evaluate(() => document.fonts.check('16px SourceRoboto')),
    );
    actual = PNG.sync.read(await statePage.screenshot());
    expected = PNG.sync.read(await reference('state', `state-${mode}.png`));
    assert.equal(
      pixelmatch(
        actual.data,
        expected.data,
        null,
        expected.width,
        expected.height,
        {threshold: 0, includeAA: true},
      ),
      0,
      `${mode} state pixels`,
    );
    await captureFoundation(`state-layers-${mode}`, actual);
    await statePage.close();
  }
  console.log(
    `Chrome ${browser.version()}: elevation and state layers match pinned light/dark pixels.`,
  );
} finally {
  await browser.close();
}
