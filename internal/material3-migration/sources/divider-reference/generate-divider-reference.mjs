// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose Divider source and tokens, pinned Web inset decision. @output Reproducible static source-value browser captures and Divider baseline. @position Disposable migration reference generator. */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import prettier from 'prettier';
import {validateSource} from '../../evidence.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../../..');
const read = async file => JSON.parse(await fs.readFile(path.join(repo, file)));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const policy = await read('internal/material3-migration/policy.json');
const inventory = await read(
  'internal/material3-migration/sources/compose-inventory.json',
);
const figma = await read(
  'internal/material3-migration/sources/figma-kit-inventory.json',
);
const androidx = process.env.M3_ANDROIDX;
if (
  !androidx ||
  execFileSync('git', ['-C', androidx, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim() !== policy.androidxCommit
)
  throw new Error('Set M3_ANDROIDX to the pinned AndroidX checkout');
if (
  inventory.commit !== policy.androidxCommit ||
  figma.source.localExportSha256 !== policy.figmaSha256
)
  throw new Error('Source inventory pins changed');
const source = inventory.families.find(item => item.name === 'Divider');
if (
  !source ||
  sha(await fs.readFile(path.join(androidx, source.path))) !== source.sha256
)
  throw new Error('Pinned Compose Divider source changed');
const tokens = name =>
  new Map(
    inventory.tokens
      .find(item => item.name === name)
      .values.map(v => [v.name, v.expression]),
  );
if (
  tokens('DividerTokens').get('Thickness') !== '1.0.dp' ||
  tokens('DividerTokens').get('Color') !== 'ColorSchemeKeyTokens.OutlineVariant'
)
  throw new Error('Pinned Divider token selection changed');
const palette = tokens('PaletteTokens');
const color = mode => {
  const role = tokens(`Color${mode}Tokens`).get('OutlineVariant');
  const rgb = palette
    .get(role.replace('PaletteTokens.', ''))
    .match(/^Color\(red = (\d+), green = (\d+), blue = (\d+)\)$/);
  if (!rgb) throw new Error('Pinned OutlineVariant palette changed');
  return `#${rgb
    .slice(1)
    .map(v => Number(v).toString(16).padStart(2, '0'))
    .join('')}`;
};
const cases = [
  {
    id: 'horizontal-light',
    mode: 'Light',
    orientation: 'horizontal',
    thickness: 1,
    inset: 'none',
    direction: 'ltr',
  },
  {
    id: 'horizontal-dark',
    mode: 'Dark',
    orientation: 'horizontal',
    thickness: 1,
    inset: 'none',
    direction: 'ltr',
  },
  {
    id: 'vertical-light',
    mode: 'Light',
    orientation: 'vertical',
    thickness: 1,
    inset: 'none',
    direction: 'ltr',
  },
  {
    id: 'custom-20-light',
    mode: 'Light',
    orientation: 'horizontal',
    thickness: 20,
    inset: 'none',
    direction: 'ltr',
  },
  {
    id: 'hairline-light',
    mode: 'Light',
    orientation: 'horizontal',
    thickness: 0,
    inset: 'none',
    direction: 'ltr',
  },
  {
    id: 'inset-start-ltr',
    mode: 'Light',
    orientation: 'horizontal',
    thickness: 1,
    inset: 'start',
    direction: 'ltr',
  },
  {
    id: 'inset-start-rtl',
    mode: 'Light',
    orientation: 'horizontal',
    thickness: 1,
    inset: 'start',
    direction: 'rtl',
  },
];
const check = process.argv.includes('--check');
const viewport = {width: 480, height: 240};
const files = {};
const scenarios = [];
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  for (const item of cases) {
    const line = color(item.mode);
    const horizontal = item.orientation === 'horizontal';
    const inset = item.inset === 'start' ? 'margin-inline-start:16px;' : '';
    const style = horizontal
      ? `width:${item.inset === 'start' ? 'calc(100% - 16px)' : '100%'};height:${item.thickness}px;${inset}`
      : `height:100%;width:${item.thickness}px;`;
    const hairline =
      item.thickness === 0
        ? `div.rule::after{content:'';position:absolute;inset-inline:0;top:0;height:1px;background:${line}}`
        : '';
    const html = `<!doctype html><html dir="${item.direction}"><head><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:480px;height:240px}body{background:${item.mode === 'Light' ? '#fff' : '#000'}}main{position:absolute;left:40px;top:40px;width:400px;height:160px}.rule{position:relative;background:${item.thickness === 0 ? 'transparent' : line};${style}}${hairline}</style></head><body><main><div class="rule"></div></main></body></html>`;
    const page = await browser.newPage({viewport, deviceScaleFactor: 1});
    await page.setContent(html);
    const box = await page.locator('.rule').boundingBox();
    const expected = horizontal
      ? {width: item.inset === 'start' ? 384 : 400, height: item.thickness}
      : {width: item.thickness, height: 160};
    if (!box || box.width !== expected.width || box.height !== expected.height)
      throw new Error(
        `Divider source geometry changed: ${item.id}: ${JSON.stringify(box)}`,
      );
    const bytes = await page.screenshot();
    const file = `${item.id}.png`;
    files[file] = sha(bytes);
    if (check) {
      if (sha(await fs.readFile(path.join(here, file))) !== files[file])
        throw new Error(`Source capture changed: ${file}`);
    } else await fs.writeFile(path.join(here, file), bytes);
    scenarios.push({
      id: `divider-${item.id}`,
      dimensions: [
        item.inset === 'start' ? 'optional-fixed-insets' : 'divider-geometry',
      ],
      sourceReference:
        item.inset === 'start'
          ? 'Pinned Compose full-span rule with explicit pinned Web 16px logical inset gap fill'
          : 'Pinned Compose Divider.kt and DividerTokens.kt, rendered as a source-value browser projection',
      baseline: `internal/material3-migration/sources/divider-reference/${file}`,
      baselineSha256: files[file],
      environment: {
        browser: `Chrome ${browser.version()}`,
        os: `${os.platform()} ${os.release()}`,
        dpr: 1,
        viewport,
        fonts: [],
        theme: item.mode.toLowerCase(),
        content: `${item.orientation} ${item.thickness === 0 ? 'hairline' : `${item.thickness}dp`} rule on fixture background`,
        state: 'static',
        direction: item.direction,
      },
    });
    await page.close();
  }
} finally {
  await browser.close();
}
const relative =
  'internal/material3-migration/sources/baseline/divider-compose-first.json';
const baseline = {
  schemaVersion: 1,
  authority: 'compose-first',
  status:
    'Resolved static Divider source selection; native acceptance pending.',
  baselineId: policy.baselineId,
  web: {commit: policy.materialWebCommit},
  compose: {
    commit: policy.androidxCommit,
    inventory: policy.composeInventory,
    tests: [
      'horizontalDivider_defaultSize',
      'horizontalDivider_customSize',
      'verticalDivider_defaultSize',
      'verticalDivider_customSize',
      'divider_withIndent_doesNotChangeSize',
      'divider_hairlineThickness',
    ].map(id => ({
      id: `DividerTest.${id}`,
      source:
        'compose/material3/material3/src/androidDeviceTest/kotlin/androidx/compose/material3/DividerTest.kt',
    })),
    reason:
      'Selected Compose size and hairline tests; Android device raster cases remain platform-specific.',
    evidence: 'internal/material3-migration/sources/families/family-CM-0017.md',
  },
  figma: {
    sha256: policy.figmaSha256,
    inventory: 'internal/material3-migration/sources/figma-kit-inventory.json',
  },
  guidance: [
    {
      url: 'https://m3.material.io/styles/color/roles',
      capturedAt: '2026-09-26',
      capture: 'internal/material3-migration/sources/guidance/color-roles.md',
    },
  ],
  decisions: [
    {
      dimension: 'divider-geometry',
      concern: 'design',
      chosen: 'compose',
      figmaSpecified: false,
      reason:
        'Pinned Compose selects full-span horizontal/vertical 1dp OutlineVariant rules, custom thickness and zero-layout-height hairline paint.',
      evidence:
        'internal/material3-migration/sources/families/family-CM-0017.md',
    },
    {
      dimension: 'divider-behavior',
      concern: 'behavior',
      chosen: 'compose',
      figmaSpecified: false,
      reason: 'Standalone rules group content visually without interaction.',
      evidence:
        'internal/material3-migration/sources/families/family-CM-0017.md',
    },
    {
      dimension: 'divider-motion',
      concern: 'motion',
      chosen: 'compose',
      figmaSpecified: false,
      reason:
        'Pinned Compose standalone Divider has no transition or animation.',
      evidence:
        'internal/material3-migration/sources/families/family-CM-0017.md',
    },
    {
      dimension: 'browser-semantics',
      concern: 'browser',
      chosen: 'web',
      figmaSpecified: false,
      reason:
        'Decorative default and explicit meaningful separator role come from pinned Web and native standards.',
      evidence:
        'internal/material3-migration/sources/families/family-CM-0017.md',
    },
    {
      dimension: 'optional-fixed-insets',
      concern: 'design',
      chosen: 'web',
      figmaSpecified: false,
      reason:
        'Pinned Web supplies explicit 16px logical inset choices absent from Compose.',
      evidence:
        'internal/material3-migration/sources/families/family-CM-0017.md',
    },
  ],
  scenarios,
  motion: {
    applicable: false,
    reason:
      'Pinned standalone Compose Divider draws static geometry and color without a transition.',
    evidence: 'internal/material3-migration/sources/families/family-CM-0017.md',
  },
  performance: (
    await read(
      'internal/material3-migration/sources/baseline/icon-compose-first.json',
    )
  ).performance,
};
validateSource(baseline, policy);
const bytes = Buffer.from(
  await prettier.format(JSON.stringify(baseline), {
    ...(await prettier.resolveConfig(path.join(repo, relative))),
    filepath: path.join(repo, relative),
  }),
);
if (check) {
  if (sha(await fs.readFile(path.join(repo, relative))) !== sha(bytes))
    throw new Error('Divider source decision changed');
} else await fs.writeFile(path.join(repo, relative), bytes);
console.log(
  JSON.stringify({
    baseline: relative,
    cases: cases.length,
    hashes: files,
    check,
  }),
);
