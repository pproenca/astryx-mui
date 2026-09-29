// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Pinned policy, shared field family route and watched source-value manifest.
 * @output Reproducible filled/outlined field source baseline with approved source and native motion limits.
 * @position Disposable source decision generator; public API and native acceptance remain separate.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../../..');
const read = async file =>
  JSON.parse(await fs.readFile(path.join(repo, file), 'utf8'));
const policy = await read('internal/material3-migration/policy.json');
const manifest = await read(
  'internal/material3-migration/sources/field-reference/manifest.json',
);
const browserMotion = await read(
  'internal/material3-migration/sources/field-reference/browser-field-motion.json',
);
const measured = {
  interpolationPosition: 0,
  interpolationVelocityPerSecond: 0,
  indicatorDp: 0,
  indicatorVelocityDpPerSecond: 0,
  settlingMs: 0,
  eventTimingMs: 0,
};
for (const group of Object.values(browserMotion.schemes))
  for (const trace of Object.values(group)) {
    const position = trace.unit === 'dp' ? 'indicatorDp' : 'interpolationPosition';
    const velocity = trace.unit === 'dp' ? 'indicatorVelocityDpPerSecond' : 'interpolationVelocityPerSecond';
    measured[position] = Math.max(measured[position], trace.errors.position);
    measured[velocity] = Math.max(measured[velocity], trace.errors.velocity);
    measured.settlingMs = Math.max(measured.settlingMs, trace.errors.settlingMs);
  }
const family = await read(
  'internal/material3-migration/sources/families/family-CM-0021.json',
);
if (
  family.pins.compose !== policy.androidxCommit ||
  manifest.composeCommit !== policy.androidxCommit ||
  family.pins.figma !== policy.figmaSha256 ||
  family.pins.web !== policy.materialWebCommit
)
  throw new Error('Field source pins differ from policy');
const motionBytes = await fs.readFile(
  path.join(
    repo,
    'internal/material3-migration/sources/field-reference/field-motion.json',
  ),
);
if (
  browserMotion.composeCommit !== policy.androidxCommit ||
  browserMotion.referenceSha256 !==
    createHash('sha256').update(motionBytes).digest('hex')
)
  throw new Error('Independent browser trace differs from pinned Kotlin input');

const familyEvidence =
  'internal/material3-migration/sources/families/family-CM-0021.md';
const motionEvidence =
  'internal/material3-migration/sources/field-reference/README.md';
const sourceRoot = 'internal/material3-migration/sources/field-reference/';
const nativeMotionApproval = 'human:pproenca:2026-09-29:field-native-motion-limits';
const reference =
  'Pinned Compose TextFieldImpl.kt and Kotlin spring probe; browser source-value projection, not Android device pixels';
const environment = (theme, state) => ({
  browser: manifest.browser,
  os: manifest.os,
  dpr: manifest.dpr,
  viewport: manifest.viewport,
  fonts: [manifest.font],
  theme,
  content:
    'Four 280 x 56 field source projections: standard/Expressive, filled/outlined, empty with label and placeholder',
  state,
  direction: 'ltr',
});
const scenarios = Object.entries(manifest.images).map(([name, sha256]) => {
  const match = /^field-(light|dark)-(\d{4}|reduced)\.png$/.exec(name);
  if (!match) throw new Error(`Unexpected field source frame: ${name}`);
  const reduced = match[2] === 'reduced';
  return {
    id: name.slice(0, -4),
    dimensions: ['field-geometry', 'field-motion'],
    sourceReference: reduced
      ? 'Pinned Compose focused state with immediate browser reduced-motion adaptation'
      : reference,
    baseline: sourceRoot + name,
    baselineSha256: sha256,
    environment: environment(
      match[1],
      reduced ? 'reduced-motion-focused' : 'focus-blur-refocus-blur',
    ),
    ...(reduced ? {} : {timeMs: Number(match[2])}),
  };
});
const decisions = [
  {
    dimension: 'field-geometry',
    concern: 'design',
    chosen: 'compose',
    figmaSpecified: true,
    reason:
      'Pinned Compose owns filled and outlined geometry, token roles, label defaults, and state styling; frozen Figma axes confirm coverage without an evidenced dimensional override.',
    evidence: familyEvidence,
  },
  {
    dimension: 'field-behavior',
    concern: 'behavior',
    chosen: 'compose',
    figmaSpecified: false,
    reason:
      'Pinned Compose owns focus, empty/nonempty label phases, decoration, error, and disabled state; web input semantics are a separate browser concern.',
    evidence: familyEvidence,
  },
  {
    dimension: 'field-motion',
    concern: 'motion',
    chosen: 'compose',
    figmaSpecified: false,
    reason:
      'Pinned fast spatial, fast effects, and slow effects springs are probed with blur interruption and refocus reversal.',
    evidence: motionEvidence,
  },
  {
    dimension: 'browser-semantics',
    concern: 'browser',
    chosen: 'web',
    figmaSpecified: false,
    reason:
      'Pinned Material Web text-field owners bridge a native input/textarea to form, keyboard, focus, validity, and accessibility semantics.',
    evidence: familyEvidence,
  },
];
const tests = [
  'TextFieldTest.testTextField_defaultHeight',
  'TextFieldTest.testTextField_heightDoesNotChange_duringFocusAnimation',
  'TextFieldTest.testTextField_labelPosition_whenFocused',
  'TextFieldTest.testTextField_prefixAndSuffixAndPlaceholder_areNotDisplayed_withLabel_ifLabelCanExpand',
  'TextFieldTest.testTextField_errorSemantics_defaultMessage',
  'OutlinedTextFieldTest.testOutlinedTextField_defaultWidth',
  'OutlinedTextFieldTest.testOutlinedTextFields_singleFocus',
  'OutlinedTextFieldTest.testOutlinedTextField_labelPosition_whenFocused',
].map(id => ({
  id,
  source: `compose/material3/material3/src/androidDeviceTest/kotlin/androidx/compose/material3/${id.startsWith('Outlined') ? 'OutlinedTextFieldTest.kt' : 'TextFieldTest.kt'}`,
}));
const baseline = {
  schemaVersion: 1,
  authority: 'compose-first',
  status:
    'Pinned field source selection, public API, source comparison, and native motion limits approved; pixel and interactive acceptance pending.',
  baselineId: policy.baselineId,
  web: {commit: policy.materialWebCommit},
  compose: {
    commit: policy.androidxCommit,
    inventory: policy.composeInventory,
    tests,
    reason:
      'Selected visual, motion, focus, and error tests; Android device rasterization remains platform-specific.',
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
    reference: sourceRoot + 'compose-field-light.mp4',
    sha256: manifest.clips['compose-field-light.mp4'],
    secondReference: {
      file: sourceRoot + 'compose-field-dark.mp4',
      sha256: manifest.clips['compose-field-dark.mp4'],
    },
    evidence: motionEvidence,
    numeric: {
      applicable: true,
      status:
        'Source and native motion limits approved; pixel and interactive acceptance remain pending.',
      evidence: motionEvidence,
      sourceTrace: sourceRoot + 'field-motion.json',
      browserTrace: sourceRoot + 'browser-field-motion.json',
      sourceComparison: {
        approvalReference: 'human:pproenca:2026-09-29:field-source-limits',
        limits: {
          interpolationPosition: 0.0002,
          interpolationVelocityPerSecond: 0.002,
          indicatorDp: 0.001,
          indicatorVelocityDpPerSecond: 0.002,
          settlingMs: 0,
          eventTimingMs: 0,
        },
        measured,
        eventTimingMethod:
          'The independent browser calculation consumes the pinned target-change timestamps verbatim; schedule difference is zero by construction.',
      },
      traces: ['standard', 'expressive'].flatMap(scheme =>
        ['label', 'placeholder', 'indicator', 'color'].map(property => {
          const indicator = property === 'indicator';
          return {
            id: `${scheme}-${property}`,
            reference: `${sourceRoot}traces/${scheme}-${property}.json`,
            unit: indicator ? 'dp' : 'interpolation',
            approvalReference: nativeMotionApproval,
            positionTolerance: indicator ? 0.001 : 0.0002,
            velocityTolerance: 0.002,
            settlingToleranceMs: 0,
          };
        }),
      ),
    },
  },
  performance: [
    {
      id: 'desktop-chrome-macos-reference',
      approvalReference:
        'human:pproenca:2026-09-26:M3-NAT-002-foundation-limits',
      status: 'Approved foundation browser profile; native field run pending.',
      environment: {
        browser: manifest.browser,
        os: manifest.os,
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
const bytes = JSON.stringify(baseline, null, 2) + '\n';
const file = path.join(here, 'field-compose-first.json');
if (process.argv.includes('--check')) {
  if ((await fs.readFile(file, 'utf8')) !== bytes)
    throw new Error('Field source baseline changed');
} else await fs.writeFile(file, bytes);
console.log(
  `Field baseline: ${scenarios.length} scenarios, ${tests.length} pinned test routes`,
);
