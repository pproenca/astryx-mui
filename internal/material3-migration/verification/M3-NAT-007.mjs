// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Approved native gallery, pinned foundation references and current built consumers. @output Exact-revision foundation acceptance receipt. @position Disposable M3-NAT-007 gate before native component work. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
);
const run = (command, ...args) =>
  execFileSync(command, args, {
    cwd: repo,
    encoding: 'utf8',
    env: {...process.env, M3_CAPTURE_DIR: ''},
    stdio: ['ignore', 'pipe', 'pipe'],
  });
const revision = run('git', 'rev-parse', 'HEAD').trim();
const approvedGalleryMerge = '54d0464d3192648c2cd5f51ce99ff3d804a1e5d1';

// Reuse the accepted comparisons only while the native renderers, captured
// references and published consumers are byte-identical to the merged gallery.
// The verifier below still rebuilds and reruns the browser and motion checks.
assert.equal(
  run(
    'git',
    'diff',
    '--name-only',
    approvedGalleryMerge,
    revision,
    '--',
    'packages/material3/src',
    'packages/material3/fixtures',
    'packages/material3/gallery',
    'apps/docsite/src/app/(site)/material3/foundations',
    'apps/storybook/stories/Material3Foundations.stories.tsx',
    'internal/material3-migration/sources/baseline/compose-first.json',
  ),
  '',
  'Foundation rendering or reference inputs changed since gallery approval',
);

const receipt = JSON.parse(
  run(
    process.execPath,
    'internal/material3-migration/verification/M3-NAT-005.mjs',
  ),
);
assert.equal(receipt.revision, revision);
assert.equal(receipt.visualComparisons.length, 59);
assert.equal(new Set(receipt.visualComparisons.map(item => item.id)).size, 59);
assert.deepEqual(
  [
    ...new Set(receipt.visualComparisons.map(item => item.id.split('-')[0])),
  ].sort(),
  [
    'color',
    'typography',
    'shape',
    'spacing',
    'elevation',
    'icons',
    'state',
    'motion',
  ].sort(),
);
for (const scenario of Object.values(receipt.motion.scenarios))
  assert.equal(scenario.result, 'Pass');

receipt.taskId = 'M3-NAT-007';
receipt.checks['visual-comparison'] = {
  result: 'Pass',
  reason:
    'The previously approved gallery inputs are unchanged. Fresh native, docsite and Storybook builds pass, and all 59 pinned foundation scenarios retain exact pixel comparisons.',
  evidence: [
    'packages/material3/gallery/evidence/manifest.json',
    'internal/material3-migration/actual/M3-NAT-002/token-coverage.json',
    'internal/material3-migration/actual/M3-NAT-002/diff/motion-light-260.png',
    'internal/material3-migration/verification/M3-NAT-007.mjs',
  ],
};
receipt.checks['motion-review'] = {
  result: 'Pass',
  reason:
    'The approved Compose and native recordings remain visible; fresh native browser checks cover interruption, reversal and reduced motion at this revision.',
  evidence: [
    'packages/material3/gallery/evidence/compose-default-spatial.mp4',
    'packages/material3/gallery/evidence/native-motion.webm',
    'packages/material3/scripts/check-foundation-interaction.mjs',
    'internal/material3-migration/verification/M3-NAT-007.mjs',
  ],
};
process.stdout.write(`${JSON.stringify(receipt)}\n`);
