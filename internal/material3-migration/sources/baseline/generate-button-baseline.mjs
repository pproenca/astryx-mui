// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Pinned Button family route, shape and elevation motion, and foundation state capture.
 * @output Reproducible five-style Button source baseline for the sole workbook.
 * @position Disposable source decision; native comparison limits and QA remain separate.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../../..');
const sourceRoot = 'internal/material3-migration/sources/button-reference/';
const familyEvidence =
  'internal/material3-migration/sources/families/family-CM-0002.md';
const motionEvidence = sourceRoot + 'README.md';
const read = async relative =>
  JSON.parse(await fs.readFile(path.join(repo, relative), 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const policy = await read('internal/material3-migration/policy.json');
const family = await read(
  'internal/material3-migration/sources/families/family-CM-0002.json',
);
const shape = await read(sourceRoot + 'render-manifest.json');
const elevation = await read(sourceRoot + 'elevation-render-manifest.json');
const state = await read(
  'internal/material3-migration/sources/state-reference/manifest.json',
);
const inventoryBytes = await fs.readFile(
  path.join(
    repo,
    'internal/material3-migration/sources/compose-inventory.json',
  ),
);
const shapeMotionBytes = await fs.readFile(
  path.join(repo, sourceRoot + 'button-shape-motion.json'),
);
const shapeMotion = await read(sourceRoot + 'manifest.json');
const elevationMotion = await read(sourceRoot + 'button-elevation-motion.json');
if (
  family.pins.compose !== policy.androidxCommit ||
  family.pins.figma !== policy.figmaSha256 ||
  family.pins.web !== policy.materialWebCommit ||
  shape.composeCommit !== policy.androidxCommit ||
  elevation.composeCommit !== policy.androidxCommit ||
  state.composeCommit !== policy.androidxCommit ||
  elevationMotion.producer.commit !== policy.androidxCommit ||
  elevation.composeInventorySha256 !== sha256(inventoryBytes) ||
  shapeMotion.traceSha256 !== sha256(shapeMotionBytes)
)
  throw new Error('Button source pins differ from the frozen policy');
if (
  shape.fontSha256 !== elevation.fontSha256 ||
  shape.browser !== elevation.browser
)
  throw new Error('Button source render environments differ');

async function checkedImage(relative, expected) {
  const actual = sha256(await fs.readFile(path.join(repo, relative)));
  if (actual !== expected)
    throw new Error(`Button source image changed: ${relative}`);
}
const environment = (theme, stateName, render) => ({
  browser: render.browser,
  os: state.os,
  dpr: render.viewport.dpr,
  viewport: {width: render.viewport.width, height: render.viewport.height},
  fonts: [
    {
      file: 'packages/themes/material3/scripts/fonts/Roboto-wdth-wght.ttf',
      sha256: render.fontSha256,
      loaded: true,
    },
  ],
  theme,
  content:
    'Five Compose Button style color and small-shape source-value projections',
  state: stateName,
  direction: 'ltr',
});
const scenarios = [];
for (const [name, hash] of Object.entries(shape.images)) {
  const match =
    /^button-shape-(light|dark)-(\d{4}|reduced-(?:pressed|rest))\.png$/.exec(
      name,
    );
  if (!match) throw new Error(`Unexpected Button shape frame: ${name}`);
  const relative = sourceRoot + name;
  await checkedImage(relative, hash);
  const reduced = match[2].startsWith('reduced');
  scenarios.push({
    id: name.slice(0, -4),
    dimensions: ['button-geometry', 'button-shape-motion'],
    sourceReference:
      'Pinned Compose Button.kt and AnimatedShapeState; browser source-value projection, not Android device pixels',
    baseline: relative,
    baselineSha256: hash,
    environment: environment(
      match[1],
      reduced ? match[2] : 'press-release-repress-release',
      shape,
    ),
    ...(reduced ? {} : {timeMs: Number(match[2])}),
  });
}
for (const mode of ['light', 'dark']) {
  const name = `state-${mode}.png`;
  const hash = state.files[name];
  const relative =
    'internal/material3-migration/sources/state-reference/' + name;
  await checkedImage(relative, hash);
  scenarios.push({
    id: `button-state-${mode}`,
    dimensions: ['button-state'],
    sourceReference:
      'Pinned Compose Ripple, Surface and filled Button state token capture',
    baseline: relative,
    baselineSha256: hash,
    environment: {
      browser: state.browser,
      os: state.os,
      dpr: state.dpr,
      viewport: state.viewport,
      fonts: [state.font],
      theme: mode,
      content:
        'Generic and filled Button rest, hover, focus, press, drag and disabled source colors',
      state: 'rest-hover-focus-pressed-dragged-disabled',
      direction: 'ltr',
    },
  });
}
const decisions = [
  {
    dimension: 'button-geometry',
    concern: 'design',
    chosen: 'compose',
    figmaSpecified: true,
    reason:
      'Pinned Compose owns five style and size tokens, default geometry, colors, outlines and elevations; Figma confirms variant axes without an exact conflicting value.',
    evidence: familyEvidence,
  },
  {
    dimension: 'button-behavior',
    concern: 'behavior',
    chosen: 'compose',
    figmaSpecified: false,
    reason:
      'Pinned Compose owns momentary action, enabled/disabled and interaction state behavior.',
    evidence: familyEvidence,
  },
  {
    dimension: 'button-shape-motion',
    concern: 'motion',
    chosen: 'compose',
    figmaSpecified: false,
    reason:
      'The optional Expressive ButtonShapes overload uses DefaultEffects and AnimatedShapeState reversal, probed from the pinned spring.',
    evidence: motionEvidence,
  },
  {
    dimension: 'button-elevation-motion',
    concern: 'motion',
    chosen: 'compose',
    figmaSpecified: false,
    reason:
      'Pinned ButtonElevation resolves the last active interaction and uses incoming/outgoing tweens with disabled snap.',
    evidence: motionEvidence,
  },
  {
    dimension: 'browser-semantics',
    concern: 'browser',
    chosen: 'web',
    figmaSpecified: false,
    reason:
      'Pinned Material Web and native standards supply button, link, form, keyboard and ARIA semantics.',
    evidence: familyEvidence,
  },
];
const testNames = [
  'button_positioning',
  'button_withIcon_positioning',
  'button_small_precisionPointerEnabled_positioning',
  'button_defaultColors',
  'filledTonalButton_defaultColors',
  'elevatedButton_defaultColors',
  'outlinedButton_defaultColors',
  'textButton_defaultColors',
  'button_xSmall_positioning',
  'button_small_positioning',
  'button_medium_positioning',
  'button_large_positioning',
  'button_xLarge_positioning',
  'button_withAnimatedShape_defaultShape',
  'button_withAnimatedShape_pressedShape',
];
const tests = testNames.map(name => ({
  id: `ButtonTest.${name}`,
  source:
    'compose/material3/material3/src/androidDeviceTest/kotlin/androidx/compose/material3/ButtonTest.kt',
}));
const baseline = {
  schemaVersion: 1,
  authority: 'compose-first',
  status:
    'Pinned five-style Button source selection and watched shape/elevation motion captured; native API, comparison limits and acceptance pending.',
  baselineId: policy.baselineId,
  web: {commit: policy.materialWebCommit},
  compose: {
    commit: policy.androidxCommit,
    inventory: policy.composeInventory,
    tests,
    reason:
      'Selected geometry, color and pressed-shape tests; Android device rasterization remains platform-specific.',
    evidence: familyEvidence,
  },
  figma: {
    sha256: policy.figmaSha256,
    inventory: 'internal/material3-migration/sources/figma-kit-inventory.json',
  },
  guidance: [
    {
      url: 'https://m3.material.io/styles/motion/overview/how-it-works',
      capturedAt: '2026-09-26',
      capture: 'internal/material3-migration/sources/guidance/motion.md',
    },
  ],
  decisions,
  scenarios,
  motion: {
    applicable: true,
    reference: sourceRoot + 'compose-button-shape-light.mp4',
    sha256: shape.clips['compose-button-shape-light.mp4'],
    additionalReferences: [
      {
        file: sourceRoot + 'compose-button-shape-dark.mp4',
        sha256: shape.clips['compose-button-shape-dark.mp4'],
      },
      {
        file: sourceRoot + 'compose-button-elevation-light.mp4',
        sha256: elevation.clips['compose-button-elevation-light.mp4'],
      },
      {
        file: sourceRoot + 'compose-button-elevation-dark.mp4',
        sha256: elevation.clips['compose-button-elevation-dark.mp4'],
      },
    ],
    evidence: motionEvidence,
    numeric: {
      applicable: true,
      status:
        'Pinned source motion captured; native comparison limits require separate approval before implementation.',
      evidence: motionEvidence,
      sourceTrace: sourceRoot + 'button-shape-motion.json',
      browserTrace: sourceRoot + 'browser-button-shape-motion.json',
      elevationTrace: sourceRoot + 'button-elevation-motion.json',
      traces: [],
    },
  },
  performance: [
    {
      id: 'desktop-chrome-macos-reference',
      approvalReference:
        'human:pproenca:2026-09-26:M3-NAT-002-foundation-limits',
      status: 'Approved foundation browser profile; native Button run pending.',
      environment: {
        browser: shape.browser,
        os: state.os,
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
const bytes = `${JSON.stringify(baseline, null, 2)}\n`;
const target = path.join(here, 'button-compose-first.json');
if (process.argv.includes('--check')) {
  if ((await fs.readFile(target, 'utf8')) !== bytes)
    throw new Error('Button source baseline changed');
} else await fs.writeFile(target, bytes);
console.log(
  `Button baseline: ${scenarios.length} scenarios, ${tests.length} pinned test routes`,
);
