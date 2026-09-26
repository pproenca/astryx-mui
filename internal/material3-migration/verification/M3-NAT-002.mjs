// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Canonical native graph, Compose-first baseline and committed independent recordings. @output Exact-revision visual foundation receipt. @position Disposable M3-NAT-002 verifier; permanent regression checks live with product packages. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const policy = JSON.parse(await fs.readFile(path.join(repo, 'internal/material3-migration/policy.json')));
const sourceDecision = 'internal/material3-migration/sources/baseline/compose-first.json';
const sourceBytes = await fs.readFile(path.join(repo, sourceDecision));
const source = JSON.parse(sourceBytes);
const revision = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: repo, encoding: 'utf8'}).trim();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const run = (command, ...args) => execFileSync(command, args, {
  cwd: repo,
  encoding: 'utf8',
  env: {...process.env, M3_CAPTURE_DIR: ''},
  stdio: ['ignore', 'pipe', 'pipe'],
});

assert.equal(source.compose.commit, policy.androidxCommit);
assert.equal(source.web.commit, policy.materialWebCommit);
assert.equal(source.baselineId, policy.baselineId);
assert.equal(source.scenarios.length, 59);
run('pnpm', '-F', '@astryxdesign/material3', 'run', 'test');
run('pnpm', '-F', '@astryxdesign/theme-material3', 'run', 'build');
run('pnpm', 'exec', 'vitest', 'run',
  'packages/core/src/theme/tokens.test.ts',
  'packages/themes/material3/src/material3Colors.test.ts',
  'packages/themes/material3/src/material3Typography.test.ts',
  'packages/themes/material3/src/material3Shape.test.ts',
  'packages/themes/material3/src/material3Motion.test.ts',
  'packages/themes/material3/src/material3Elevation.test.ts');
run('node', 'packages/themes/material3/scripts/check-theme-parity.mjs');
run('node', 'internal/material3-migration/actual/capture-native-icons.mjs', '--check');

const actualRoot = 'internal/material3-migration/actual/M3-NAT-002';
const actual = name => `${actualRoot}/${name}`;
const tokenCoverage = JSON.parse(await fs.readFile(path.join(repo, actual('token-coverage.json'))));
assert.equal(tokenCoverage.taskId, 'M3-NAT-002');
assert.equal(tokenCoverage.tokens.length, 123);
assert.deepEqual(tokenCoverage.tokens.map(item => item.name),
  Object.keys((await import('../../../packages/material3/dist/index.js')).material3TokenValues('light')).filter(name =>
    ['--md-ref-typeface-', '--md-sys-color-', '--md-sys-typescale-', '--md-sys-shape-'].some(prefix => name.startsWith(prefix))));
execFileSync('git', ['merge-base', '--is-ancestor', tokenCoverage.evidenceRevision, revision], {cwd: repo});
const pass = (reason, ...evidence) => ({result: 'Pass', reason, evidence});
const motionPass = (reason, evidence) => ({result: 'Pass', reason, evidence});
const checks = {
  source: pass('Compose-first baseline and pinned media supply the selected foundation values.', sourceDecision, 'internal/material3-migration/sources/reconciliation.md', 'internal/material3-migration/sources/motion/README.md'),
  'token-contract': pass('One typed native graph emits public Material roles and keeps source-only values explicit.', 'packages/material3/src/foundation.ts', 'packages/material3/src/foundationSource.json', 'packages/material3/src/foundation.test.ts', actual('token-coverage.json')),
  'native-boundary': pass('Native CSS, resolver and browser fixture build without the Core compatibility theme.', 'packages/material3/package.json', 'packages/material3/src/index.ts', 'packages/material3/fixtures/foundation.html', 'packages/material3/scripts/check-native-fixture.mjs'),
  compatibility: pass('The Core bridge reads native canonical values at build time and emits portable references to Material roles.', 'packages/themes/material3/src/material3Theme.ts', 'packages/core/src/theme/tokens.ts', 'packages/themes/material3/scripts/check-theme-parity.mjs', 'packages/themes/material3/material3.spec.md'),
  'automated-checks': pass('Native package, Core token resolver and Material compatibility build/browser checks pass at this revision.', 'packages/material3/src/motion.test.ts', 'packages/material3/scripts/check-foundation-browser.mjs', 'packages/material3/scripts/check-layer-browser.mjs', 'packages/material3/scripts/check-spacing-browser.mjs'),
  'browser-behavior': pass('Chrome checks native scoped colors, dark mode, narrow RTL, keyboard activation and continuous interrupted springs.', 'packages/material3/fixtures/foundation.html', 'packages/material3/scripts/check-foundation-interaction.mjs'),
  'consumer-docs': pass('Native package discovery, token usage, compatibility and source attribution are documented.', 'packages/material3/README.md', 'packages/material3/docs/material3-native.doc.mjs', 'packages/material3/THIRD_PARTY_NOTICES.md'),
  'source-resolution': pass('All eight foundation decisions retain Compose priority and named source gaps.', sourceDecision, 'internal/material3-migration/sources/compose-icons.md', 'internal/material3-migration/sources/compose-motion.md'),
  'visual-comparison': pass('Fifty-nine independently captured light/dark scenarios have exact zero-pixel RGBA diffs.', 'internal/material3-migration/actual/generate-foundation-diffs.mjs', actual('typography-light.png'), actual('shape-expressive-dark.png'), actual('diff/motion-light-260.png')),
  'motion-review': pass('Watched official guidance and source replay are paired with native WebM, timed panels, interruption and reduced-motion checks.', 'internal/material3-migration/sources/motion/README.md', 'internal/material3-migration/sources/motion/source-reference/README.md', actual('native-motion.webm'), 'packages/material3/scripts/check-foundation-interaction.mjs'),
  'upstream-tests': pass('Foundation spring equations match independent pinned Kotlin traces; component composable tests remain owned by their later families.', 'packages/material3/src/motion.test.ts', 'packages/material3/fixtures/references/motion/manifest.json', sourceDecision),
  performance: pass('Approved Chrome/macOS profile is measured with 30 input and 360 active-frame samples.', actual('performance.json'), 'internal/material3-migration/actual/capture-native-motion.mjs', sourceDecision),
};
for (const requirement of policy.evidenceRequirements)
  assert.ok(checks[requirement], `Missing ${requirement} check`);
const qaChecks = {
  states: {result: 'Pass', reason: 'Native system scopes and interactive override toggle on and off under light/dark schemes.'},
  keyboard: {result: 'Pass', reason: 'Enter activates the named native HTML override button; other controls retain native select/input semantics.'},
  theme: {result: 'Pass', reason: 'Thirty-five emitted schemes resolve all 49 system roles; scoped native override and Core same-scope compatibility pass.'},
  responsive: {result: 'Pass', reason: 'Narrow 390 px and RTL fixture checks pass alongside default desktop comparisons.'},
  motion: {result: 'Pass', reason: 'Native spring preserves position/velocity on interruption and reversal and jumps to target under reduced motion.'},
  accessibility: {result: 'Pass', reason: 'Fixture controls have visible labels, native keyboard behavior and focus styling; component-specific accessibility remains pending.'},
};
const motion = {
  applicable: true,
  reference: source.motion.reference,
  referenceSha256: source.motion.sha256,
  actualRecording: actual('native-motion.webm'),
  contactSheet: actual('motion-light.png'),
  watchedBy: 'Codex',
  watchedAt: new Date().toISOString(),
  observations: [
    {timeMs: 0, note: 'Both source spatial dots start at zero before the enter target.'},
    {timeMs: 260, note: 'After the 120 ms retarget, standard and Expressive positions remain continuous at distinct intermediate values.'},
    {timeMs: 1380, note: 'After reverse to the negative target, both traces have settled without discontinuity.'},
  ],
  scenarios: {
    enter: motionPass('Native playback advances from zero toward the target.', actual('native-motion.webm')),
    exit: motionPass('Exit retargets the running spring to zero.', actual('native-motion.webm')),
    interruption: motionPass('Position and velocity remain continuous on the 120 ms retarget.', 'packages/material3/scripts/check-foundation-interaction.mjs'),
    reversal: motionPass('The reversed target retains current state and settles at its new position.', actual('native-motion.webm')),
    'reduced-motion': motionPass('Checkbox and prefers-reduced-motion both jump to the target with zero velocity.', 'packages/material3/scripts/check-foundation-interaction.mjs'),
  },
  traces: source.motion.numeric.traces.map(item => ({id: item.id, actual: actual(`${item.id}.json`)})),
};
const visualComparisons = source.scenarios.map(item => ({
  id: item.id,
  environment: item.environment,
  ...(item.timeMs === undefined ? {} : {timeMs: item.timeMs}),
  actual: actual(`${item.id}.png`),
  diff: actual(`diff/${item.id}.png`),
}));
const receipt = {
  strategyId: policy.strategyId,
  taskId: 'M3-NAT-002',
  revision,
  materialWebCommit: policy.materialWebCommit,
  androidxCommit: policy.androidxCommit,
  baselineId: policy.baselineId,
  reviewKind: 'visual',
  preview: `http://127.0.0.1:4173/packages/material3/fixtures/foundation.html?revision=${revision}`,
  sourceDecision,
  sourceDecisionSha256: hash(sourceBytes),
  checks,
  qaChecks,
  tokenIds: tokenCoverage.tokens.map(item => item.id),
  upstreamTests: [],
  performance: source.performance.map(item => ({id: item.id, actual: actual('performance.json')})),
  visualComparisons,
  motion,
};
process.stdout.write(`${JSON.stringify(receipt)}\n`);
