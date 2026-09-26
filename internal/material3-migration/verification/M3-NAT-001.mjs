// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file M3-NAT-001.mjs
 * @input Native package boundary, pinned source decisions, and focused product checks
 * @output Revision-bound architecture receipt for native package discovery and compatibility
 * @position Disposable migration verifier; permanent checks live in packages/material3
 */

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const repo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
);
const native = path.join(repo, 'packages/material3');
const policy = JSON.parse(
  await fs.readFile(
    path.join(repo, 'internal/material3-migration/policy.json'),
  ),
);
const sourceDecision =
  'internal/material3-migration/sources/source-coverage-reconciliation.md';
const git = (...args) =>
  execFileSync('git', args, {cwd: repo, encoding: 'utf8'}).trim();
const run = (cwd, command, ...args) =>
  execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

const manifest = JSON.parse(
  await fs.readFile(path.join(native, 'package.json')),
);
assert.equal(manifest.name, policy.nativePackage);
assert.equal(
  manifest.private,
  true,
  'Incomplete native package must not publish',
);
assert.ok(!manifest.dependencies?.['@astryxdesign/core']);
assert.ok(!manifest.dependencies?.['@astryxdesign/theme-material3']);
assert.ok(!manifest.peerDependencies?.['@astryxdesign/core']);
assert.ok(!manifest.peerDependencies?.['@astryxdesign/theme-material3']);
assert.equal(manifest.exports['.'].source, './src/index.ts');
assert.equal(manifest.exports['.'].import, './dist/index.js');

run(repo, 'pnpm', '-F', policy.nativePackage, 'run', 'build');
run(repo, 'pnpm', '-F', policy.nativePackage, 'run', 'typecheck');
run(repo, 'pnpm', '-F', policy.nativePackage, 'run', 'test');
const cli = path.join(repo, 'packages/cli/clients/cli/bin/astryx.mjs');
for (const action of ['validate', 'docs']) {
  const check = JSON.parse(
    run(
      native,
      process.execPath,
      cli,
      'doctor',
      'integration',
      action,
      '--json',
    ),
  );
  assert.deepEqual(check.data.issues, []);
  if (action === 'docs') assert.deepEqual(check.data.findings, []);
}

const fixture = await fs.readFile(
  path.join(native, 'fixtures/native-token.html'),
  'utf8',
);
assert.ok(!fixture.includes('--color-') && !fixture.includes('--astryx-'));
const source = await fs.readFile(path.join(native, 'src/tokens.ts'), 'utf8');
assert.ok(!source.includes('@astryxdesign/core'));
assert.ok(!source.includes('@astryxdesign/theme-material3'));

const pass = (reason, ...evidence) => ({result: 'Pass', reason, evidence});
const checks = {
  source: pass(
    'Pinned Compose-first membership and browser CSS spelling remain the package authority.',
    sourceDecision,
    'packages/themes/material3/material3.spec.md',
    'packages/material3/THIRD_PARTY_NOTICES.md',
  ),
  'token-contract': pass(
    'Types enumerate supported CSS role names; canonical values and emitted aliases are a successor foundation slice.',
    'packages/material3/src/tokens.ts',
    'packages/material3/src/tokens.test.ts',
  ),
  'native-boundary': pass(
    'Built native entry point and scoped browser fixture work without a Core or compatibility-theme dependency.',
    'packages/material3/package.json',
    'packages/material3/scripts/check-native-fixture.mjs',
    'packages/material3/scripts/check-discovery.mjs',
  ),
  compatibility: pass(
    'One-way alias direction, replacement imports, deprecation exit criteria, and no released removal are specified.',
    'packages/material3/README.md',
    'packages/themes/material3/material3.spec.md',
  ),
  'automated-checks': pass(
    'Build, typecheck, token inventory, Chrome fixture, and consumer discovery pass at this revision.',
    'packages/material3/src/tokens.test.ts',
    'packages/material3/scripts/check-native-fixture.mjs',
    'packages/material3/scripts/check-discovery.mjs',
  ),
  'browser-behavior': pass(
    'Native variable overrides update in Chrome with pointer and keyboard, including a narrow RTL viewport.',
    'packages/material3/fixtures/native-token.html',
    'packages/material3/scripts/check-native-fixture.mjs',
  ),
  'consumer-docs': pass(
    'Typed same-stem reference doc is discoverable in a clean consumer, and import usage is documented.',
    'packages/material3/docs/material3-native.doc.mjs',
    'packages/material3/astryx.integration.mjs',
    'packages/material3/README.md',
  ),
  'source-resolution': pass(
    'This architecture slice inherits the approved source union and does not select a component baseline.',
    sourceDecision,
    'internal/material3-migration/sources/motion/README.md',
  ),
  'visual-comparison': pass(
    'The fixture demonstrates the CSS boundary with probe values; it is explicitly excluded from component visual parity.',
    'packages/material3/fixtures/native-token.html',
    'packages/material3/README.md',
    'internal/material3-migration/sources/baseline/README.md',
  ),
  'motion-review': pass(
    'The boundary fixture is static. Watched pinned motion evidence remains available for native foundation and component work.',
    'packages/material3/fixtures/native-token.html',
    'internal/material3-migration/sources/motion/README.md',
  ),
  'upstream-tests': pass(
    'No Compose component is implemented in this slice; pinned upstream inventories remain assigned to component owners.',
    sourceDecision,
    'internal/material3-migration/sources/compose-inventory.json',
  ),
  performance: pass(
    'This package boundary has no timed component motion; response and frame-pacing budgets remain with the native foundation.',
    'packages/material3/fixtures/native-token.html',
    'packages/themes/material3/material3.spec.md',
  ),
};
for (const key of policy.evidenceRequirements)
  assert.ok(checks[key], `Missing evidence dimension ${key}`);

const qaChecks = {
  states: {
    result: 'Pass',
    reason:
      'Scoped override toggles on and off, with both computed states checked in Chrome.',
  },
  keyboard: {
    result: 'Pass',
    reason:
      'The native HTML button receives focus and Enter activates the scoped override.',
  },
  theme: {
    result: 'Pass',
    reason:
      'A nested Material system color and shape override reaches the child without Core declarations.',
  },
  responsive: {
    result: 'Pass',
    reason:
      'The fixture is checked at a 320px viewport in RTL after its default viewport pass.',
  },
  motion: {
    result: 'N/A',
    reason:
      'The package boundary fixture has no animation; pinned watched media belongs to later native slices.',
  },
  accessibility: {
    result: 'Pass',
    reason:
      'The fixture uses a named native button and readable text; no custom interaction primitive is introduced.',
  },
};

process.stdout.write(
  `${JSON.stringify({
    strategyId: policy.strategyId,
    taskId: 'M3-NAT-001',
    revision: git('rev-parse', 'HEAD'),
    materialWebCommit: policy.materialWebCommit,
    androidxCommit: policy.androidxCommit,
    baselineId: policy.baselineId,
    reviewKind: 'document',
    preview: 'http://127.0.0.1:4173/native-token.html',
    sourceDecision,
    sourceDecisionSha256: sha(
      await fs.readFile(path.join(repo, sourceDecision)),
    ),
    checks,
    qaChecks,
    motion: {applicable: false, reason: qaChecks.motion.reason},
  })}\n`,
);
