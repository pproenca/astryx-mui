// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned policy and source manifests for all eight foundation dimensions. @output Versioned Compose-first source decision and scenario matrix. @position Disposable migration source baseline generator. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateSource} from '../../evidence.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const sources = path.dirname(here);
const repo = path.resolve(sources, '../../..');
const read = async file => JSON.parse(await fs.readFile(file));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const policy = await read(
  path.join(repo, 'internal/material3-migration/policy.json'),
);
const manifest = async directory =>
  read(path.join(sources, directory, 'manifest.json'));
const checkedImage = async (directory, file, expected) => {
  const relative = `internal/material3-migration/sources/${directory}/${file}`;
  if (sha256(await fs.readFile(path.join(repo, relative))) !== expected)
    throw new Error(`Source capture hash changed: ${relative}`);
  return relative;
};
const scenarios = [];
const add = async ({
  directory,
  file,
  hash,
  id,
  dimension,
  mode,
  manifest: source,
  viewport,
  fonts = [],
  content,
  state,
  sourceReference,
  direction,
}) => {
  const baseline = await checkedImage(directory, file, hash);
  scenarios.push({
    id,
    dimensions: [dimension],
    sourceReference,
    baseline,
    baselineSha256: hash,
    environment: {
      browser: source.browser || 'deterministic RGBA source renderer',
      os: source.os || (dimension === 'color' ? 'portable' : 'darwin 27.0.0'),
      dpr: source.dpr || 1,
      viewport,
      fonts,
      theme: mode,
      content,
      state,
      ...(direction ? {direction} : {}),
    },
  });
};
const font = source =>
  source.font
    ? [{file: source.font.file, sha256: source.font.sha256, loaded: true}]
    : [];

const colors = await manifest('color-reference');
if (
  colors.composeCommit !== policy.androidxCommit ||
  colors.figmaSha256 !== policy.figmaSha256
)
  throw new Error('Color source pins changed');
for (const [name, item] of Object.entries(colors.files)) {
  const mode =
    name === 'dark' || name.endsWith('-dt') || name.startsWith('kit-dark')
      ? 'dark'
      : 'light';
  await add({
    directory: 'color-reference',
    file: item.file,
    hash: item.sha256,
    id: `color-${name}`,
    dimension: 'color',
    mode,
    manifest: colors,
    viewport: {width: colors.width, height: colors.height},
    content: `${colors.roles.length} ordered Material color roles; ${name}`,
    state: 'static-role-map',
    sourceReference: name.startsWith('kit-')
      ? 'Frozen Figma M3 mode values; Compose has no matching fixed mode map'
      : 'Pinned Compose ColorScheme and palette tokens',
  });
}
const twoMode = async (directory, dimension, sourceReference, options = {}) => {
  const source = await manifest(directory);
  if (source.composeCommit !== policy.androidxCommit)
    throw new Error(`${directory} Compose pin changed`);
  for (const mode of ['light', 'dark']) {
    const item = source.files[mode];
    const file =
      typeof item === 'string'
        ? item
        : item?.file || `${options.prefix || dimension}-${mode}.png`;
    const hash = typeof item === 'object' ? item?.sha256 : source.files[file];
    if (!hash) throw new Error(`Missing ${directory} ${mode} image hash`);
    await add({
      directory,
      file,
      hash,
      id: `${dimension}-${mode}`,
      dimension,
      mode,
      manifest: source,
      viewport: options.viewport?.(source, item) || source.viewport,
      fonts: options.fonts?.(source) || font(source),
      content: options.content || `${dimension} source fixture`,
      state: options.state || 'static',
      sourceReference,
    });
  }
  return source;
};
const type = await twoMode(
  'typography-reference',
  'typography',
  'Pinned Compose baseline and emphasized TypographyTokens; licensed Roboto browser fixture',
  {
    viewport: (_source, item) => ({width: item.width, height: item.height}),
    content: 'All 30 Compose type roles, Aa 0123456789',
  },
);
const corner = await twoMode(
  'corner-reference',
  'shape',
  'Pinned Compose ShapeTokens and frozen kit corner mappings',
  {
    prefix: 'corners',
    viewport: (_source, item) => ({width: item.width, height: item.height}),
    content: 'Ten Compose corner roles',
  },
);
const shape = await manifest('shape-reference');
if (
  shape.composeCommit !== policy.androidxCommit ||
  shape.mappings.length !== 35
)
  throw new Error('Expressive shape source changed');
for (const mode of ['light', 'dark']) {
  const file =
    mode === 'light'
      ? 'compose-expressive-shapes.png'
      : 'compose-expressive-shapes-dark.png';
  await add({
    directory: 'shape-reference',
    file,
    hash: shape.files[file],
    id: `shape-expressive-${mode}`,
    dimension: 'shape',
    mode,
    manifest: shape,
    viewport: {width: 1540, height: 1100},
    fonts: [{family: 'Arial', purpose: 'index labels only'}],
    content: 'All 35 compiled Compose MaterialShapes cubics',
    state: 'static-expressive-shapes',
    sourceReference:
      'Pinned Compose MaterialShapes compiled cubics; kit 35-variant mapping',
  });
}
await twoMode(
  'elevation-reference',
  'elevation',
  'Pinned Compose tonal elevation formula and independent browser shadow geometry',
  {
    content: 'Levels 0–5, nested tonal surface, browser shadow',
  },
);
await twoMode(
  'state-reference',
  'state-layers',
  'Pinned Compose StateTokens, Ripple and filled Button binding; kit state styles',
  {
    prefix: 'state',
    content: 'Generic OnSurface states and filled Button states',
    state: 'rest-hover-focus-pressed-dragged-disabled',
  },
);
const spacing = await twoMode(
  'spacing-reference',
  'spacing-density',
  'Pinned Compose baseline/expressive Button and TextField defaults',
  {
    prefix: 'spacing',
    content: 'Button and TextField default geometry diagrams',
  },
);
for (const [variant, capture] of Object.entries(spacing.variantCaptures)) {
  const mode = variant === 'rtlDark' ? 'dark' : 'light';
  await add({
    directory: 'spacing-reference',
    file: capture.file,
    hash: spacing.files[capture.file],
    id: `spacing-density-${variant}`,
    dimension: 'spacing-density',
    mode,
    manifest: spacing,
    viewport: capture.viewport,
    fonts: font(spacing),
    content: 'Button and TextField default geometry diagrams',
    state: variant === 'rtlDark' ? 'static-rtl' : 'static-narrow',
    direction: capture.direction,
    sourceReference: 'Pinned Compose baseline/expressive Button and TextField defaults',
  });
}
const icon = await manifest('icon-reference');
if (
  icon.composeCommit !== policy.androidxCommit ||
  icon.googleIconCommit !== 'bd8cb85bd4bad964fe6918f79665bb40c3a8efef'
)
  throw new Error('Icon source pins changed');
for (const mode of ['light', 'dark']) {
  const file = `icons-${mode}.png`;
  await add({
    directory: 'icon-reference',
    file,
    hash: icon.files[file],
    id: `icons-${mode}`,
    dimension: 'icons',
    mode,
    manifest: icon,
    viewport: icon.viewport,
    fonts: Object.entries(icon.fontPins).map(([family, hash]) => ({
      family: `Material Symbols ${family}`,
      sha256: hash,
      loaded: true,
    })),
    content:
      'close, check and search in three font families plus pinned SVG paths',
    state: 'static-glyph-samples',
    sourceReference:
      'Pinned Compose Icon fallback/tint; Google Material Symbols artwork gap fill',
  });
}
const motion = await manifest('motion/source-reference');
if (motion.composeCommit !== policy.androidxCommit)
  throw new Error('Motion source pin changed');
for (const mode of ['light', 'dark']) {
  const file = `motion-${mode}.png`;
  await add({
    directory: 'motion/source-reference',
    file,
    hash: motion.files[file],
    id: `motion-${mode}`,
    dimension: 'motion',
    mode,
    manifest: motion,
    viewport: motion.sheetViewport,
    fonts: font(motion),
    content:
      'Standard and Expressive default spatial positions at 0, 120, 260, 600, 900 and 1380 ms',
    state: 'retargeted-reversed-upstream-trace',
    sourceReference:
      'Pinned Kotlin SpringSimulation traces and watched Material guidance clips',
  });
}
for (const mode of ['light', 'dark']) {
  const sheet = scenarios.find(item => item.id === `motion-${mode}`);
  for (const [timeMs, x, y] of [
    [0, 31, 96],
    [260, 786, 96],
    [1380, 786, 280],
  ]) {
    const id = `motion-${mode}-${timeMs}`;
    const baseline = `internal/material3-migration/sources/motion/source-reference/frames/${id}.png`;
    const baselineSha256 = sha256(await fs.readFile(path.join(repo, baseline)));
    scenarios.push({
      id,
      dimensions: ['motion'],
      sourceReference:
        'Pinned Kotlin SpringSimulation start, intermediate and settled panel from the source contact sheet',
      baseline,
      baselineSha256,
      timeMs,
      environment: {
        ...sheet.environment,
        content: `Standard and Expressive default spatial positions at ${timeMs} ms`,
        state: 'retargeted-reversed-upstream-trace-panel',
        captureRegion: {x, y, width: 363, height: 170},
      },
    });
  }
}
const evidence = {
  color: 'internal/material3-migration/sources/reconciliation.md',
  typography: 'internal/material3-migration/sources/compose-typography.md',
  shape: 'internal/material3-migration/sources/shape-reference/README.md',
  'spacing-density':
    'internal/material3-migration/sources/compose-spacing-density.md',
  elevation: 'internal/material3-migration/sources/compose-elevation.md',
  icons: 'internal/material3-migration/sources/compose-icons.md',
  'state-layers': 'internal/material3-migration/sources/compose-state.md',
  motion: 'internal/material3-migration/sources/compose-motion.md',
};
const reasons = {
  color:
    'Compose selects baseline and Expressive roles; kit fixed contrast and named modes fill Compose gaps.',
  typography:
    'Compose selects 30 default and emphasized roles; pinned Roboto is the documented browser comparison font.',
  shape:
    'Compose selects corner values and 35 Expressive paths; kit names map variants without replacing geometry.',
  'spacing-density':
    'Compose component defaults select Button and TextField geometry; no universal spacing scale is inferred.',
  elevation:
    'Compose selects tonal elevation and nested surface behavior; Web/kit shadow layers fill browser geometry.',
  icons:
    'Compose selects Icon tint, semantics and unsized fallback; pinned Google artwork fills the generic Icon glyph gap.',
  'state-layers':
    'Compose selects default layer opacity and Ripple/filled Button bindings; browser focus semantics remain native.',
  motion:
    'Compose selects spring scheme and token inputs; watched official clips show intent and Kotlin traces supply interruption/reversal source motion.',
};
const decision = {
  schemaVersion: 1,
  authority: 'compose-first',
  baselineId: policy.baselineId,
  web: {commit: policy.materialWebCommit},
  compose: {
    commit: policy.androidxCommit,
    inventory: policy.composeInventory,
    tests: [],
    reason:
      'This foundation token graph selects source values and spring math; composable behavior tests are selected per native component family.',
    evidence: 'internal/material3-migration/sources/compose-inventory.json',
  },
  figma: {
    sha256: policy.figmaSha256,
    inventory: 'internal/material3-migration/sources/figma-kit-inventory.json',
  },
  guidance: [
    ['color-roles', 'https://m3.material.io/styles/color/roles'],
    ['typography-fonts', 'https://m3.material.io/styles/typography/fonts'],
    ['shape', 'https://m3.material.io/styles/shape/overview-principles'],
    ['spacing', 'https://m3.material.io/styles/spacing/overview'],
    ['elevation', 'https://m3.material.io/styles/elevation/overview'],
    ['icons', 'https://m3.material.io/styles/icons/overview'],
    [
      'state-layers',
      'https://m3.material.io/foundations/interaction/states/state-layers',
    ],
    ['motion', 'https://m3.material.io/styles/motion/overview/how-it-works'],
  ].map(([name, url]) => ({
    url,
    capturedAt: '2026-09-26',
    capture: `internal/material3-migration/sources/guidance/${name}.md`,
  })),
  decisions: policy.foundationDimensions.map(dimension => ({
    dimension,
    concern: dimension === 'motion' ? 'motion' : 'design',
    figmaSpecified: !['spacing-density', 'motion'].includes(dimension),
    chosen: 'compose',
    reason: reasons[dimension],
    evidence: evidence[dimension],
  })),
  scenarios,
  motion: {
    applicable: true,
    reference:
      'internal/material3-migration/sources/motion/source-reference/compose-default-spatial.mp4',
    sha256: motion.files['compose-default-spatial.mp4'],
    evidence: 'internal/material3-migration/sources/motion/README.md',
    numeric: {
      applicable: true,
      traces: [
        {
          id: 'standard-default-spatial',
          reference:
            'internal/material3-migration/sources/motion/upstream/traces/standard-default-spatial.json',
          unit: 'px',
          approvalReference:
            'human:pproenca:2026-09-26:M3-NAT-002-foundation-limits',
          positionTolerance: 0.0002,
          velocityTolerance: 0.002,
          settlingToleranceMs: 0,
        },
        {
          id: 'expressive-default-spatial',
          reference:
            'internal/material3-migration/sources/motion/upstream/traces/expressive-default-spatial.json',
          unit: 'px',
          approvalReference:
            'human:pproenca:2026-09-26:M3-NAT-002-foundation-limits',
          positionTolerance: 0.0002,
          velocityTolerance: 0.002,
          settlingToleranceMs: 0,
        },
      ],
      status: 'approved after native Chrome measurement and owner review on 2026-09-26',
    },
  },
  performance: [
    {
      id: 'desktop-chrome-macos-reference',
      approvalReference:
        'human:pproenca:2026-09-26:M3-NAT-002-foundation-limits',
      status: 'approved after native Chrome measurement and owner review on 2026-09-26',
      environment: {
        browser: motion.browser,
        os: motion.os,
        device: 'macOS desktop reference',
        refreshRateHz: 60,
      },
      maxInputLatencyMs: 100,
      frameBudgetMs: 20,
      maxLongFrameRatio: 0.05,
      minInputSamples: 30,
      minFrameSamples: 300,
    },
  ],
};
if (scenarios.length !== 59)
  throw new Error(`Expected 59 source scenarios, got ${scenarios.length}`);
for (const dimension of policy.foundationDimensions)
  for (const mode of ['light', 'dark'])
    if (
      !scenarios.some(
        item =>
          item.dimensions.includes(dimension) &&
          item.environment.theme === mode,
      )
    )
      throw new Error(`Missing ${dimension}/${mode} source coverage`);
validateSource(decision, policy);
const bytes = Buffer.from(JSON.stringify(decision, null, 2) + '\n');
const file = path.join(here, 'compose-first.json');
if (process.argv.includes('--check')) {
  if (!(await fs.readFile(file)).equals(bytes))
    throw new Error('Compose-first source decision differs');
} else {
  await fs.writeFile(file, bytes);
}
console.log(
  JSON.stringify({
    mode: process.argv.includes('--check') ? 'checked' : 'written',
    scenarios: scenarios.length,
    dimensions: policy.foundationDimensions,
  }),
);
