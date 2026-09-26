// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Native Compose geometry, licensed Roboto and pinned default/narrow/RTL captures. @output Exact browser geometry comparisons. @position Permanent native spacing regression. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';
import {chromium} from 'playwright';
import {
  material3ColorValues,
  material3FoundationGeometry,
} from '../dist/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const referenceRoot = path.join(root, 'fixtures/references/spacing');
const manifest = JSON.parse(
  await fs.readFile(path.join(referenceRoot, 'manifest.json'), 'utf8'),
);
const font = await fs.readFile(
  path.resolve(root, '../themes/material3/scripts/fonts/Roboto-wdth-wght.ttf'),
);
assert.equal(
  createHash('sha256').update(font).digest('hex'),
  manifest.font.sha256,
);
const fontUrl = `data:font/ttf;base64,${font.toString('base64')}`;
const dimensions = material3FoundationGeometry;
const baseline = dimensions.button.baseline;
const expressive = dimensions.button.expressiveSmall;
const field = dimensions.textField;
const pointer = dimensions.button.precisionPointerOptIn;
assert.equal(pointer.minHeightPx, 36);
assert.equal(pointer.paddingBlockPx, 8);
assert.equal(pointer.iconAdjacentPaddingInlinePx, 12);

const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  for (const mode of ['light', 'dark']) {
    const colors = material3ColorValues(mode);
    const theme = {
      surface: colors.surface,
      surfaceContainerLow: colors['surface-container-low'],
      primary: colors.primary,
      onPrimary: colors['on-primary'],
      onSurface: colors['on-surface'],
      onSurfaceVariant: colors['on-surface-variant'],
      outline: colors.outline,
    };
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      @font-face{font-family:SourceRoboto;src:url('${fontUrl}') format('truetype');font-weight:100 900}
      *{box-sizing:border-box}html,body{margin:0}body{width:1180px;height:640px;background:${theme.surface};color:${theme.onSurface};font:15px/22px SourceRoboto,sans-serif}
      main{padding:28px 38px}h1{font-size:24px;line-height:32px;margin:0 0 4px}h2{font-size:17px;line-height:24px;margin:24px 0 12px}p{font-size:13px;margin:0;color:${theme.onSurfaceVariant}}
      .row{display:flex;gap:24px}.card{width:520px;background:${theme.surfaceContainerLow};border-radius:18px;padding:18px 20px;height:195px}.title{font-size:15px;font-weight:600;margin-bottom:12px}.spec{font-size:12px;color:${theme.onSurfaceVariant};margin-top:10px}.button{min-width:${baseline.minWidthPx}px;height:${baseline.minHeightPx}px;border-radius:100px;background:${theme.primary};color:${theme.onPrimary};display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:500}.measure{display:flex;align-items:center;gap:12px}.ruler{background:${theme.outline};height:2px;margin-top:14px;position:relative}.ruler:before,.ruler:after{content:'';position:absolute;top:-5px;width:2px;height:12px;background:${theme.outline}}.ruler:after{right:0}.dim{font-size:12px;white-space:nowrap;color:${theme.onSurfaceVariant}}
      .field{width:${field.minWidthPx}px;height:${field.minHeightPx}px;border:1px solid ${theme.outline};border-radius:4px;position:relative;display:flex;align-items:center;padding:0 ${field.paddingInlinePx}px;font-size:14px}.filled{background:${theme.surfaceContainerLow};border:none;border-bottom:1px solid ${theme.onSurfaceVariant}}.label{position:absolute;top:7px;left:16px;font-size:11px;color:${theme.onSurfaceVariant}}.withlabel{padding-top:14px}.pads{display:flex;gap:8px;margin-top:12px}.pill{background:${theme.surface};border:1px solid ${theme.outline};border-radius:8px;padding:4px 8px;font-size:12px}.note{margin-top:20px;font-size:12px;line-height:18px;max-width:1050px}
    </style></head><body><main><h1>Compose spacing and density · ${mode === 'light' ? 'Light' : 'Dark'}</h1><p>Default source geometry; native interaction, labels and responsive layout remain separate</p><h2>Filled Button · baseline and expressive small overload</h2><div class="row"><div class="card"><div class="title">Baseline Button</div><div class="measure"><div class="button" style="padding:${baseline.paddingBlockPx}px ${baseline.paddingInlinePx}px">Button</div><span class="dim">40 dp min height · 58 dp min width</span></div><div class="ruler" style="width:180px"></div><div class="spec">24 dp start/end · 8 dp top/bottom · 18 dp default icon</div></div><div class="card"><div class="title">Expressive small Button</div><div class="measure"><div class="button" style="padding:${expressive.paddingBlockPx}px ${expressive.paddingInlinePx}px">Button</div><span class="dim">40 dp min height · 58 dp min width</span></div><div class="ruler" style="width:160px"></div><div class="spec">16 dp start/end · 10 dp top/bottom · 20 dp icon · 8 dp icon/label gap</div></div></div><h2>TextField · filled and outlined defaults</h2><div class="row"><div class="card"><div class="title">Filled · inside label</div><div class="field filled withlabel"><span class="label">Label</span>Input text</div><div class="pads"><span class="pill">280 × 56 dp min</span><span class="pill">16 dp inline</span><span class="pill">8 dp block with label</span></div></div><div class="card"><div class="title">Outlined · no inside label</div><div class="field">Input text</div><div class="pads"><span class="pill">280 × 56 dp min</span><span class="pill">16 dp inline</span><span class="pill">16 dp block without label</span></div></div></div><p class="note">Precision-pointer sizing is opt-in and disabled in pinned Compose. With its flag and device condition enabled, a small Button may use 36 dp height; this sheet records the default 40 dp branch. TextField labels here indicate padding inputs, not an exact floating-label layout.</p></main></body></html>`;
    const captureHtml = html.replace(
      '</style>',
      `@media(max-width:600px){body{width:390px;height:1100px}main{padding:18px 14px}h1{font-size:21px;line-height:28px}h2{margin:16px 0 9px}.row{display:block}.card{width:100%;height:178px;padding:14px 16px;margin-bottom:10px}.measure{gap:8px}.dim{font-size:11px}.pads{gap:4px;flex-wrap:wrap}.pill{font-size:10px;padding:3px 5px}.note{margin-top:8px}}[dir="rtl"] .label{left:auto;right:16px}</style>`,
    );
    const page = await browser.newPage({
      viewport: manifest.viewport,
      deviceScaleFactor: 1,
    });
    await page.setContent(captureHtml);
    await page.evaluate(() => document.fonts.ready);
    assert.ok(
      await page.evaluate(() => document.fonts.check('15px SourceRoboto')),
    );
    const check = async file => {
      const actual = PNG.sync.read(await page.screenshot());
      const expected = PNG.sync.read(
        await fs.readFile(path.join(referenceRoot, file)),
      );
      assert.equal(actual.width, expected.width);
      assert.equal(actual.height, expected.height);
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
        file,
      );
    };
    await check(`spacing-${mode}.png`);
    if (mode === 'light') {
      await page.setViewportSize(manifest.variantCaptures.narrowLight.viewport);
      await check(manifest.variantCaptures.narrowLight.file);
    } else {
      await page.evaluate(() => {
        document.documentElement.dir = 'rtl';
      });
      await check(manifest.variantCaptures.rtlDark.file);
    }
    await page.close();
  }
  console.log(
    `Chrome ${browser.version()}: Compose geometry matches default, narrow and RTL source pixels.`,
  );
} finally {
  await browser.close();
}
