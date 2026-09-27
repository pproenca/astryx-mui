// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose-first Divider decision, native public exports, exact browser captures and performance. @output Exact-revision native Divider acceptance receipt. @position Disposable M3-NAT-004 verifier; permanent checks remain in the native package. */
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
  'internal/material3-migration/sources/baseline/divider-compose-first.json';
const sourceBytes = await read(sourceDecision);
const source = JSON.parse(sourceBytes);
const actualRoot = 'internal/material3-migration/actual/M3-NAT-004';
const actual = name => `${actualRoot}/${name}`;
const pass = (reason, ...evidence) => ({result: 'Pass', reason, evidence});

assert.equal(source.authority, 'compose-first');
assert.equal(source.compose.commit, policy.androidxCommit);
assert.equal(source.web.commit, policy.materialWebCommit);
assert.equal(source.baselineId, policy.baselineId);
assert.equal(source.compose.tests.length, 6);
assert.equal(source.scenarios.length, 7);
assert.equal(source.motion.applicable, false);
for (const item of source.scenarios)
  assert.equal(hash(await read(item.baseline)), item.baselineSha256);

run('pnpm', '-F', '@astryxdesign/material3', 'build');
run('pnpm', '-F', '@astryxdesign/theme-material3', 'build');
run(
  'pnpm',
  'exec',
  'vitest',
  'run',
  'packages/core/src/Divider/Divider.test.tsx',
);
run('pnpm', '-F', '@astryxdesign/material3', 'test');
run('pnpm', '-F', '@astryxdesign/material3', 'typecheck');
run('pnpm', 'check:knowledge');
run(
  'node',
  'internal/material3-migration/actual/capture-native-divider.mjs',
  '--check',
);
run(
  'node',
  'internal/material3-migration/actual/capture-native-divider-performance.mjs',
  '--check',
);

const nativePackage = JSON.parse(await read('packages/material3/package.json'));
assert.ok(nativePackage.exports['./Divider']);
assert.ok(!nativePackage.dependencies?.['@astryxdesign/core']);
assert.ok(!nativePackage.dependencies?.['@astryxdesign/theme-material3']);
const performance = JSON.parse(await read(actual('performance.json')));
measurePerformance(performance, source.performance[0]);

const checks = {
  source: pass(
    'Pinned Compose Divider and DividerTokens govern geometry, color, hairline and static behavior; Web fills the documented inset and browser semantics gaps.',
    sourceDecision,
    'internal/material3-migration/sources/families/family-CM-0017.md',
  ),
  'token-contract': pass(
    'The native rules consume supported --md-divider-color and --md-divider-thickness roles directly, with scoped overrides.',
    'packages/material3/src/Divider/DividerRule.tsx',
    'packages/material3/scripts/check-divider-browser.mjs',
  ),
  'native-boundary': pass(
    'Public horizontal and vertical exports build without a Core adapter or compatibility theme dependency.',
    'packages/material3/package.json',
    'packages/material3/src/Divider/index.ts',
    'packages/material3/scripts/check-discovery.mjs',
  ),
  compatibility: pass(
    'The separately published Core Divider keeps labels, strong treatment and semantic defaults; its focused test and compatibility theme build pass while native entry points own Compose behavior.',
    'packages/themes/material3/material3.spec.md',
    'packages/material3/src/Divider/HorizontalDivider.spec.md',
    'packages/material3/src/Divider/VerticalDivider.spec.md',
    'packages/core/src/Divider/Divider.test.tsx',
  ),
  'automated-checks': pass(
    'The native package suite and typecheck include exact pixel, browser semantics, density and gallery regressions.',
    'packages/material3/package.json',
    'packages/material3/scripts/check-divider-pixels.mjs',
    'packages/material3/scripts/check-divider-hairline-browser.mjs',
    'packages/material3/src/Divider/Divider.test.tsx',
  ),
  'browser-behavior': pass(
    'Chrome verifies decorative and explicit separator semantics, forced colors, RTL, narrow layout, pointer inertness and one-device-pixel hairline at DPR 1 and 2.',
    'packages/material3/scripts/check-divider-browser.mjs',
    'packages/material3/scripts/check-divider-hairline-browser.mjs',
  ),
  'consumer-docs': pass(
    'Same-stem component docs, native package README, gallery, Storybook and docsite expose the native exports and source status.',
    'packages/material3/src/Divider/HorizontalDivider.doc.mjs',
    'packages/material3/src/Divider/VerticalDivider.doc.mjs',
    'packages/material3/README.md',
    'apps/storybook/stories/Material3NativeDivider.stories.tsx',
    'apps/docsite/src/app/(site)/material3/foundations/page.tsx',
  ),
  'source-resolution': pass(
    'Compose owns all overlapping static geometry and defaults; optional 16px logical insets and decorative browser semantics are named Web gaps.',
    sourceDecision,
    'internal/material3-migration/sources/families/family-CM-0017.md',
  ),
  'visual-comparison': pass(
    'All seven native public-export captures match pinned source-value projections with zero changed RGBA pixels.',
    'packages/material3/scripts/check-divider-pixels.mjs',
    actual('divider-horizontal-light.png'),
    actual('diff/divider-horizontal-light.png'),
  ),
  'motion-review': pass(
    'Pinned standalone Compose Divider is static; transition, interruption and reversal scenarios do not apply to this rule.',
    sourceDecision,
    source.motion.evidence,
  ),
  'upstream-tests': pass(
    'Six pinned Compose size, custom size, indent and hairline cases map to permanent native visual, geometry and density checks.',
    sourceDecision,
    'packages/material3/scripts/check-divider-pixels.mjs',
    'packages/material3/scripts/check-divider-hairline-browser.mjs',
  ),
  performance: pass(
    'Thirty native control input responses and 360 active style-change frames meet the approved desktop Chrome profile.',
    actual('performance.json'),
    'internal/material3-migration/actual/capture-native-divider-performance.mjs',
  ),
};
for (const requirement of policy.evidenceRequirements)
  assert.ok(checks[requirement], `Missing ${requirement}`);
const qaChecks = {
  states: {
    result: 'Pass',
    reason:
      'The standalone line is static in light, dark and Expressive schemes; custom width, color and inset changes render.',
  },
  keyboard: {
    result: 'Pass',
    reason:
      'Decorative and semantic rules stay out of Tab order; the container owns any interaction.',
  },
  theme: {
    result: 'Pass',
    reason:
      'Material divider roles and scoped overrides reach native paint without Core aliases.',
  },
  responsive: {
    result: 'Pass',
    reason:
      'Logical start inset follows RTL, narrow containers do not overflow, and hairline occupies zero extent.',
  },
  motion: {
    result: 'N/A',
    reason:
      'Pinned Compose standalone Divider has no transition or animation; static source selection is recorded.',
  },
  accessibility: {
    result: 'Pass',
    reason:
      'Decoration is hidden by default, explicit separator orientation is exposed, and forced colors preserve contrast.',
  },
};
const upstreamTests = source.compose.tests.map(item => ({
  id: item.id,
  result: 'Pass',
  reason:
    'The corresponding pinned Compose size, indent or hairline invariant is translated to native browser geometry and pixels.',
  evidence: sourceDecision,
  nativeTest: item.id.includes('hairline')
    ? 'packages/material3/scripts/check-divider-hairline-browser.mjs'
    : 'packages/material3/scripts/check-divider-pixels.mjs',
}));
const receipt = {
  strategyId: policy.strategyId,
  taskId: 'M3-NAT-004',
  revision,
  materialWebCommit: policy.materialWebCommit,
  androidxCommit: policy.androidxCommit,
  baselineId: policy.baselineId,
  reviewKind: 'visual',
  preview: `http://127.0.0.1:8430/fixtures/divider.html?revision=${revision}`,
  sourceDecision,
  sourceDecisionSha256: hash(sourceBytes),
  checks,
  qaChecks,
  tokenIds: ['TM-02802', 'TM-02803'],
  visualComparisons: source.scenarios.map(item => ({
    id: item.id,
    environment: item.environment,
    actual: actual(`${item.id}.png`),
    diff: actual(`diff/${item.id}.png`),
  })),
  motion: {applicable: false},
  upstreamTests,
  performance: [
    {id: source.performance[0].id, actual: actual('performance.json')},
  ],
};
process.stdout.write(`${JSON.stringify(receipt)}\n`);
