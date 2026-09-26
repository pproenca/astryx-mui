// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose/Figma/Web source captures, watched guidance notes and source decision. @output Revision-bound source-only evidence receipt. @position Disposable workbook verification recipe for M3-SRC-001. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const policy = JSON.parse(
  await fs.readFile(
    path.join(repo, 'internal/material3-migration/policy.json'),
  ),
);
const source = 'internal/material3-migration/sources';
const baseline = `${source}/baseline/compose-first.json`;
const check = (relative, files) => ({
  result: 'Pass',
  reason:
    'Verified source-task evidence; native acceptance remains with later tasks.',
  evidence: [relative, ...files],
});
const na = (reason, evidence) => ({result: 'N/A', reason, evidence});
function run(command, args) {
  const output = execFileSync(command, args, {
    cwd: repo,
    encoding: 'utf8',
    maxBuffer: 5_000_000,
    timeout: 100000,
    env: process.env,
  });
  process.stderr.write(`${command} ${args.join(' ')}\n${output}\n`);
}
if (!process.env.M3_ANDROIDX)
  throw new Error('Set M3_ANDROIDX to the clean pinned AndroidX checkout');
for (const generator of [
  `${source}/generate-color-reference.mjs`,
  `${source}/generate-typography-reference.mjs`,
  `${source}/generate-corner-reference.mjs`,
  `${source}/elevation-reference/generate-elevation-reference.mjs`,
  `${source}/state-reference/generate-state-reference.mjs`,
  `${source}/spacing-reference/generate-spacing-reference.mjs`,
  `${source}/icon-reference/generate-icon-reference.mjs`,
  `${source}/shape-reference/capture-compose-shapes.mjs`,
  `${source}/motion/upstream/capture-compose-springs.mjs`,
  `${source}/motion/source-reference/generate-motion-reference.mjs`,
  `${source}/baseline/generate-source-decision.mjs`,
])
  run(process.execPath, [generator, '--check']);
const vitest = path.join(repo, 'node_modules/.bin/vitest');
await fs.access(vitest);
run(vitest, [
  'run',
  '--config',
  'internal/material3-migration/verification/source-vitest.config.mjs',
]);
const checks = {
  source: check(`${source}/source-versions.md`, [baseline]),
  'token-contract': na(
    'Canonical native tokens are a successor task; this source task selects their pinned values.',
    [
      `${source}/reconciliation.md`,
      'packages/themes/material3/material3.spec.md',
    ],
  ),
  'native-boundary': na(
    'The native package does not exist yet; its contract and dependency direction are selected here.',
    ['packages/themes/material3/material3.spec.md'],
  ),
  compatibility: na(
    'Core compatibility delegation is an implementation successor, not source-task acceptance.',
    ['packages/themes/material3/material3.spec.md'],
  ),
  'automated-checks': check(
    'internal/material3-migration/verification/source-vitest.config.mjs',
    ['internal/material3-migration/tests/source-baseline.test.mjs'],
  ),
  'browser-behavior': na(
    'This source task records semantics and state references; native keyboard and browser behavior have no implementation to test.',
    [`${source}/compose-state.md`, `${source}/compose-icons.md`],
  ),
  'consumer-docs': na(
    'Product consumer documentation follows the native package and component public APIs.',
    ['packages/themes/material3/material3.spec.md'],
  ),
  'source-resolution': check(baseline, [`${source}/reconciliation.md`]),
  'visual-comparison': check(`${source}/shape-reference/README.md`, [
    `${source}/baseline/README.md`,
    `${source}/motion/source-reference/manifest.json`,
  ]),
  'motion-review': check(`${source}/motion/README.md`, [
    `${source}/compose-motion.md`,
    `${source}/motion/source-reference/README.md`,
  ]),
  'upstream-tests': na(
    'Pinned upstream spring code was executed; Compose UI assertions are mapped to native tests per component family later.',
    [`${source}/motion/upstream/README.md`, `${source}/compose-inventory.json`],
  ),
  performance: na(
    'Browser input and frame budgets are proposed for human review; native recordings do not exist in this source task.',
    [`${source}/baseline/README.md`, baseline],
  ),
};
for (const key of policy.evidenceRequirements)
  if (!checks[key]) throw new Error(`Missing source-task check: ${key}`);
const qaChecks = {
  states: {
    result: 'Pass',
    reason:
      'Compose and kit states are captured in both themes; native interactions remain open.',
  },
  keyboard: {
    result: 'N/A',
    reason: 'No native interactive control in this source task.',
  },
  theme: {
    result: 'Pass',
    reason: 'All eight dimensions have pinned Light and Dark source fixtures.',
  },
  responsive: {
    result: 'N/A',
    reason:
      'Source capture sizes are pinned; responsive native QA follows implementation.',
  },
  motion: {
    result: 'Pass',
    reason:
      'Official clips were watched and timed frames inspected; independent Kotlin interruption/reversal traces and source replay are pinned.',
  },
  accessibility: {
    result: 'N/A',
    reason: 'Source references do not provide native interactive semantics.',
  },
};
const baselineBytes = await fs.readFile(path.join(repo, baseline));
const receipt = {
  strategyId: policy.strategyId,
  taskId: 'M3-SRC-001',
  revision: execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: repo,
    encoding: 'utf8',
  }).trim(),
  materialWebCommit: policy.materialWebCommit,
  androidxCommit: policy.androidxCommit,
  baselineId: policy.baselineId,
  reviewKind: 'document',
  sourceDecision: baseline,
  sourceDecisionSha256: createHash('sha256')
    .update(baselineBytes)
    .digest('hex'),
  checks,
  qaChecks,
  motion: {
    sourceOnly: true,
    reference: `${source}/motion/source-reference/compose-default-spatial.mp4`,
    observations: `${source}/motion/README.md`,
    timedFrames: `${source}/motion/source-reference/manifest.json`,
    nativeRecording: null,
  },
};
process.stdout.write(`${JSON.stringify(receipt)}\n`);
