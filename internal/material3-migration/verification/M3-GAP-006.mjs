// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose-first Elevation decision, native package tests and exact browser captures. @output Exact-revision M3-GAP-006 acceptance receipt. @position Disposable migration verifier; permanent checks remain in the native package. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {measurePerformance} from '../measurements.mjs';

const repo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
);
const read = relative => fs.readFile(path.join(repo, relative));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const run = (command, ...args) =>
  execFileSync(command, args, {
    cwd: repo,
    encoding: 'utf8',
    env: {...process.env, M3_CAPTURE_DIR: ''},
    stdio: ['ignore', 'pipe', 'pipe'],
  });
const revision = run('git', 'rev-parse', 'HEAD').trim();
const policy = JSON.parse(
  await read('internal/material3-migration/policy.json'),
);
const sourceDecision =
  'internal/material3-migration/sources/baseline/elevation-compose-first.json';
const sourceBytes = await read(sourceDecision);
const source = JSON.parse(sourceBytes);
const actualRoot = 'internal/material3-migration/actual/M3-GAP-006';
const actual = name => `${actualRoot}/${name}`;
const pass = (reason, ...evidence) => ({result: 'Pass', reason, evidence});

assert.equal(source.authority, 'compose-first');
assert.equal(source.compose.commit, policy.androidxCommit);
assert.equal(source.web.commit, policy.materialWebCommit);
assert.equal(source.baselineId, policy.baselineId);
assert.equal(source.compose.tests.length, 6);
assert.equal(source.scenarios.length, 2);
assert.equal(source.motion.applicable, false);
for (const item of source.scenarios)
  assert.equal(hash(await read(item.baseline)), item.baselineSha256);

run('pnpm', '-F', '@astryxdesign/material3', 'test');
run('pnpm', '-F', '@astryxdesign/material3', 'typecheck');
run('pnpm', 'check:knowledge');
run(
  'node',
  'internal/material3-migration/actual/capture-native-elevation.mjs',
  '--check',
);

const nativePackage = JSON.parse(await read('packages/material3/package.json'));
assert.ok(nativePackage.exports['./Elevation']);
assert.ok(!nativePackage.dependencies?.['@astryxdesign/core']);
assert.ok(!nativePackage.dependencies?.['@astryxdesign/theme-material3']);
const performance = JSON.parse(await read(actual('performance.json')));
measurePerformance(performance, source.performance[0]);

const checks = {
  source: pass(
    'Pinned Compose governs six levels and tonal/shadow independence; frozen Figma effects and pinned Web fill the CSS shadow and browser layer gaps.',
    sourceDecision,
    'internal/material3-migration/sources/families/family-CM-0018.md',
  ),
  'token-contract': pass(
    'Both native layers consume the scoped --md-sys-color-shadow role directly; the owner supplies tonal color.',
    'packages/material3/src/Elevation/Elevation.tsx',
    'packages/material3/scripts/check-elevation-pixels.mjs',
  ),
  'native-boundary': pass(
    'The native public export builds without a Core adapter or compatibility theme dependency.',
    'packages/material3/package.json',
    'packages/material3/src/Elevation/index.ts',
    'packages/material3/scripts/check-discovery.mjs',
  ),
  compatibility: pass(
    'The additive opt-in visual primitive leaves Core and Material theme compatibility owners intact.',
    'packages/material3/src/Elevation/Elevation.spec.md',
    'packages/themes/material3/material3.spec.md',
  ),
  'automated-checks': pass(
    'Package test and typecheck run exact source/native pixels, unit semantics, discovery and gallery behavior.',
    'packages/material3/package.json',
    'packages/material3/src/Elevation/Elevation.test.tsx',
    'packages/material3/scripts/check-elevation-native-baseline.mjs',
  ),
  'browser-behavior': pass(
    'Chrome verifies owner pointer and keyboard action, decorative semantics, forced colors, inherited radius and static paint.',
    'packages/material3/scripts/check-elevation-pixels.mjs',
    'packages/material3/scripts/check-gallery.mjs',
  ),
  'consumer-docs': pass(
    'Same-stem API docs, README, Storybook, gallery, source PNGs and third-party notices expose the native primitive.',
    'packages/material3/src/Elevation/Elevation.doc.mjs',
    'packages/material3/README.md',
    'apps/storybook/stories/Material3NativeElevation.stories.tsx',
    'packages/material3/THIRD_PARTY_NOTICES.md',
  ),
  'source-resolution': pass(
    'Compose chooses levels and separation; Figma/Web CSS shadow geometry and inert browser attachment are explicit gaps.',
    sourceDecision,
    'internal/material3-migration/sources/families/family-CM-0018.json',
  ),
  'visual-comparison': pass(
    'All twelve light/dark level captures match independent source shadow layers with zero changed RGBA pixels; 24 additional theme and override crops pass.',
    'packages/material3/scripts/check-elevation-native-baseline.mjs',
    'packages/material3/scripts/check-elevation-pixels.mjs',
    'internal/material3-migration/actual/capture-native-elevation.mjs',
    actual('elevation-light.png'),
    actual('diff/elevation-light.png'),
  ),
  'motion-review': pass(
    'Pinned standalone Elevation has no Compose composable or default motion; future owners animate their own state changes.',
    sourceDecision,
    source.motion.evidence,
  ),
  'upstream-tests': pass(
    'Six pinned Compose Surface tests map to permanent foundation tonal/shadow checks and native shadow pixels.',
    'packages/material3/src/foundation.test.ts',
    'packages/material3/scripts/check-elevation-native-baseline.mjs',
    sourceDecision,
  ),
  performance: pass(
    'Thirty level-change responses and 360 active shadow-color frames meet the approved desktop Chrome profile.',
    actual('performance.json'),
    'internal/material3-migration/actual/capture-native-elevation-performance.mjs',
  ),
};
for (const requirement of policy.evidenceRequirements)
  assert.ok(checks[requirement], `Missing ${requirement}`);

const qaChecks = {
  states: {
    result: 'Pass',
    reason:
      'All six static levels render with separate key and ambient shadows; the owner controls level changes.',
  },
  keyboard: {
    result: 'Pass',
    reason:
      'The decorative span stays out of tab order; the button owner retains Enter activation and focus.',
  },
  theme: {
    result: 'Pass',
    reason:
      'Light, dark, Expressive and scoped shadow-color tokens reach both native layers.',
  },
  responsive: {
    result: 'Pass',
    reason:
      'Inherited shape and pointer ownership hold in RTL and narrow gallery layouts.',
  },
  motion: {
    result: 'N/A',
    reason:
      'Pinned standalone Elevation is static; no default enter, exit, interruption, reversal or reduced-motion sequence exists.',
  },
  accessibility: {
    result: 'Pass',
    reason:
      'The visual span is aria-hidden, pointer inert and nonsemantic; forced colors suppress its shadow without altering the owner.',
  },
};
const upstreamTests = source.compose.tests.map(item => ({
  id: item.id,
  result: 'Pass',
  reason:
    'Compose Surface tonal/shadow independence and levels are mapped to canonical native foundation values and static shadow pixels.',
  evidence: sourceDecision,
  nativeTest: item.id.includes('Shadows')
    ? 'packages/material3/scripts/check-elevation-native-baseline.mjs'
    : 'packages/material3/src/foundation.test.ts',
}));
const receipt = {
  strategyId: policy.strategyId,
  taskId: 'M3-GAP-006',
  revision,
  materialWebCommit: policy.materialWebCommit,
  androidxCommit: policy.androidxCommit,
  baselineId: policy.baselineId,
  reviewKind: 'visual',
  tokenIds: [
    'TM-01729',
    'TM-02878',
    'TM-02879',
    'TM-02880',
    'TM-02881',
    'TM-02882',
    'TM-02883',
  ],
  preview: `http://127.0.0.1:8440/fixtures/elevation.html?revision=${revision}`,
  sourceDecision,
  sourceDecisionSha256: hash(sourceBytes),
  checks,
  qaChecks,
  visualComparisons: source.scenarios.map(item => ({
    id: item.id,
    environment: item.environment,
    actual: actual(`${item.id}.png`),
    diff: actual(`diff/${item.id}.png`),
  })),
  motion: {applicable: false},
  upstreamTests,
  performance: [
    {
      id: source.performance[0].id,
      actual: actual('performance.json'),
    },
  ],
};
process.stdout.write(`${JSON.stringify(receipt)}\n`);
