// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose-first Icon decision, native package, exact light/dark captures, and browser timing. @output Exact-revision native Icon acceptance receipt. @position Disposable M3-NAT-003 verification recipe. */
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
  'internal/material3-migration/sources/baseline/icon-compose-first.json';
const sourceBytes = await read(sourceDecision);
const source = JSON.parse(sourceBytes);
assert.equal(source.compose.commit, policy.androidxCommit);
assert.equal(source.web.commit, policy.materialWebCommit);
assert.equal(source.compose.tests.length, 6);
assert.equal(source.motion.applicable, false);
assert.equal(source.scenarios.length, 2);
for (const scenario of source.scenarios)
  assert.equal(hash(await read(scenario.baseline)), scenario.baselineSha256);

run('pnpm', '-F', '@astryxdesign/theme-material3', 'build');
run('pnpm', '-F', '@astryxdesign/material3', 'test');
run('pnpm', '-F', '@astryxdesign/material3', 'typecheck');
run(
  'pnpm',
  'exec',
  'vitest',
  'run',
  'packages/themes/material3/src/MaterialSymbol.test.tsx',
  'packages/material3/src/Icon/Icon.test.tsx',
  'packages/material3/src/MaterialSymbol/MaterialSymbol.test.tsx',
);
run('pnpm', 'check:knowledge');
run(
  'node',
  'internal/material3-migration/actual/capture-native-icon.mjs',
  '--check',
);
run(
  'node',
  'internal/material3-migration/actual/capture-native-icon-performance.mjs',
  '--check',
);

const material3 = JSON.parse(await read('packages/material3/package.json'));
assert.equal(material3.private, true);
assert.ok(!material3.dependencies?.['@astryxdesign/core']);
assert.ok(!material3.dependencies?.['@astryxdesign/theme-material3']);
for (const subpath of ['./Icon', './MaterialSymbol', './components.css'])
  assert.ok(material3.exports[subpath], `Missing native ${subpath} export`);
for (const extension of ['mjs', 'cjs']) {
  const built = await read(
    `packages/themes/material3/dist/MaterialSymbol.${extension}`,
  );
  assert.ok(
    !built.toString().includes('@astryxdesign/material3'),
    `Theme compatibility ${extension} depends on private native package`,
  );
}
const actualRoot = 'internal/material3-migration/actual/M3-NAT-003';
const actual = name => `${actualRoot}/${name}`;
const performance = JSON.parse(await read(actual('performance.json')));
const metrics = measurePerformance(performance, source.performance[0]);
assert.ok(metrics.inputLatencyMs <= 100 && metrics.longFrameRatio <= 0.05);
const pass = (reason, ...evidence) => ({result: 'Pass', reason, evidence});
const checks = {
  source: pass(
    'Pinned Compose Icon.kt and standalone IconTest cases govern overlapping defaults; the source family records the SVG/font browser gap.',
    sourceDecision,
    'internal/material3-migration/sources/families/family-CM-0024.md',
    'internal/material3-migration/sources/compose-icons.md',
  ),
  'token-contract': pass(
    'Native glyphs consume --md-icon-size and --md-icon-font directly, with inherited Material system color and scoped overrides.',
    'packages/material3/src/Icon/Icon.tsx',
    'packages/material3/src/MaterialSymbol/MaterialSymbol.tsx',
    'packages/material3/scripts/check-icons-browser.mjs',
  ),
  'native-boundary': pass(
    'The native package exports glyphs and CSS without importing Core or the compatibility theme.',
    'packages/material3/package.json',
    'packages/material3/src/index.ts',
    'packages/material3/scripts/check-discovery.mjs',
  ),
  compatibility: pass(
    'The released theme MaterialSymbol path delegates in source and builds self-contained ESM/CJS and CSS from the native owner.',
    'packages/themes/material3/src/MaterialSymbol.tsx',
    'packages/themes/material3/scripts/build-material-symbol.mjs',
    'packages/themes/material3/src/MaterialSymbol.test.tsx',
  ),
  'automated-checks': pass(
    'Native package, legacy compatibility and exact source capture checks pass at this revision.',
    'packages/material3/package.json',
    'packages/material3/src/Icon/Icon.test.tsx',
    'packages/material3/src/MaterialSymbol/MaterialSymbol.test.tsx',
    'internal/material3-migration/actual/capture-native-icon.mjs',
  ),
  'browser-behavior': pass(
    'Chrome checks default and intrinsic geometry, scheme tint and contrast, all font axes, RTL, narrow viewport, accessible naming and keyboard-owned action.',
    'packages/material3/scripts/check-icons-browser.mjs',
    'packages/material3/fixtures/icons.tsx',
  ),
  'consumer-docs': pass(
    'Same-stem native docs, package README, Storybook and docsite expose the font loading and accessible naming contract.',
    'packages/material3/src/Icon/Icon.doc.mjs',
    'packages/material3/src/MaterialSymbol/MaterialSymbol.doc.mjs',
    'packages/material3/README.md',
    'apps/storybook/stories/Material3Icons.stories.tsx',
    'apps/docsite/src/app/(site)/material3/foundations/page.tsx',
  ),
  'source-resolution': pass(
    'Compose owns tint, intrinsic vector size, 24px fallback, semantics and static motion; pinned artwork/font guidance fills the named gap.',
    sourceDecision,
    'internal/material3-migration/sources/families/family-CM-0024.md',
    'internal/material3-migration/sources/guidance/icons.md',
  ),
  'visual-comparison': pass(
    'Independent native light and dark captures match the pinned source at zero changed RGBA pixels.',
    actual('icons-light.png'),
    actual('icons-dark.png'),
    actual('diff/icons-light.png'),
    actual('diff/icons-dark.png'),
  ),
  'motion-review': pass(
    'Pinned standalone Icon is static; interactive motion belongs to its containing control.',
    sourceDecision,
    'internal/material3-migration/sources/families/family-CM-0024.md',
  ),
  'upstream-tests': pass(
    'Six overlapping pinned IconTest size, scaling, tint and semantics cases translate to permanent native tests.',
    sourceDecision,
    'packages/material3/src/Icon/Icon.test.tsx',
    'packages/material3/scripts/check-icons-browser.mjs',
  ),
  performance: pass(
    'Thirty native input responses and 360 active gallery frames meet the approved Chrome/macOS limits.',
    actual('performance.json'),
    'internal/material3-migration/actual/capture-native-icon-performance.mjs',
  ),
};
for (const requirement of policy.evidenceRequirements)
  assert.ok(checks[requirement], `Missing ${requirement}`);
const qaChecks = {
  states: {
    result: 'Pass',
    reason:
      'Static glyphs render in light, dark and Expressive schemes with default, explicit and intrinsic sizes.',
  },
  keyboard: {
    result: 'Pass',
    reason:
      'The named parent button owns focus and activates with Enter; glyphs remain presentational.',
  },
  theme: {
    result: 'Pass',
    reason:
      'Material system text color and component icon size/font overrides reach native glyphs without Core aliases.',
  },
  responsive: {
    result: 'Pass',
    reason:
      'The native preview stays within a 390px viewport in RTL; all glyph dimensions remain stable.',
  },
  motion: {
    result: 'N/A',
    reason:
      'The pinned standalone Icon is static; control motion is owned by later interactive families.',
  },
  accessibility: {
    result: 'Pass',
    reason:
      'Named standalone glyphs expose one image name; decoration and nested SVGs are hidden.',
  },
};
const upstreamTests = source.compose.tests.map(item => ({
  id: item.id,
  result: 'Pass',
  reason:
    'The overlapping vector size, scale, tint or image semantics invariant is translated to the native SVG channel.',
  evidence: 'packages/material3/src/Icon/Icon.test.tsx',
  nativeTest: 'packages/material3/src/Icon/Icon.test.tsx',
}));
const receipt = {
  strategyId: policy.strategyId,
  taskId: 'M3-NAT-003',
  revision,
  materialWebCommit: policy.materialWebCommit,
  androidxCommit: policy.androidxCommit,
  baselineId: policy.baselineId,
  reviewKind: 'visual',
  preview: `http://127.0.0.1:8792/fixtures/icons.html?revision=${revision}`,
  sourceDecision,
  sourceDecisionSha256: hash(sourceBytes),
  checks,
  qaChecks,
  tokenIds: ['TM-00814', 'TM-00815', 'TM-04298'],
  upstreamTests,
  performance: [
    {id: source.performance[0].id, actual: actual('performance.json')},
  ],
  visualComparisons: source.scenarios.map(item => ({
    id: item.id,
    environment: item.environment,
    actual: actual(`${item.id}.png`),
    diff: actual(`diff/${item.id}.png`),
  })),
  motion: {applicable: false},
};
process.stdout.write(`${JSON.stringify(receipt)}\n`);
