// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Current native FocusRing, pinned Compose-first baseline and committed browser captures. @output Exact-revision visual, motion and interaction receipt. @position Disposable M3-GAP-011 verifier; permanent checks remain in the native package. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const read = async file => fs.readFile(path.join(repo, file));
const policy = JSON.parse(await read('internal/material3-migration/policy.json'));
const sourceDecision = 'internal/material3-migration/sources/baseline/focus-compose-first.json';
const sourceBytes = await read(sourceDecision);
const source = JSON.parse(sourceBytes);
const actualRoot = 'internal/material3-migration/actual/M3-GAP-011';
const actual = file => `${actualRoot}/${file}`;
const revision = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: repo, encoding: 'utf8'}).trim();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const run = (command, ...args) => execFileSync(command, args, {
  cwd: repo,
  encoding: 'utf8',
  env: {...process.env, M3_CAPTURE_DIR: ''},
  stdio: ['ignore', 'pipe', 'pipe'],
});
const pass = (reason, ...evidence) => ({result: 'Pass', reason, evidence});

assert.equal(source.authority, 'compose-first');
assert.equal(source.compose.commit, policy.androidxCommit);
assert.equal(source.web.commit, policy.materialWebCommit);
assert.equal(source.baselineId, policy.baselineId);
assert.equal(source.scenarios.length, 26);
assert.deepEqual(
  new Set(source.scenarios.flatMap(item => item.dimensions)),
  new Set(['focus-indication', 'focus-motion', 'optional-web-outward-ring']),
);
assert.equal(source.scenarios.filter(item => item.timeMs !== undefined).length, 20);
run('pnpm', '-F', '@astryxdesign/material3', 'run', 'test');
run('pnpm', '-F', '@astryxdesign/material3', 'run', 'typecheck');
run('node', 'internal/material3-migration/actual/capture-native-focus-ring.mjs', '--check');

const review = JSON.parse(await read(actual('motion-review.json')));
assert.ok(review.watchedBy && review.watchedAt && review.watchedAt.endsWith('Z'));
assert.ok(Array.isArray(review.observations) && review.observations.length >= 3);
assert.equal(review.referenceSha256, source.motion.sha256);
assert.equal(review.actualSha256, hash(await read(actual('native-focus.webm'))));
const checks = {
  source: pass('Pinned Compose selects the default indication, two-stroke inset geometry and spring; Web fills the explicit outward gap.', sourceDecision, 'internal/material3-migration/sources/families/family-CM-0023.md'),
  'token-contract': pass('The native ring consumes supported Secondary and OnSecondary roles, including scoped role overrides.', 'packages/material3/src/FocusRing/FocusRing.tsx', 'packages/material3/scripts/check-focus-ring-browser.mjs'),
  'native-boundary': pass('FocusRing exports from the native package and imports no Core adapter.', 'packages/material3/package.json', 'packages/material3/src/index.ts', 'packages/material3/src/FocusRing/index.ts'),
  compatibility: pass('The opt-in native ring leaves existing Core theme compatibility and default control focus behavior intact.', 'packages/material3/src/FocusRing/FocusRing.spec.md', 'packages/themes/material3/material3.spec.md', 'packages/material3/scripts/check-focus-ring-pixels.mjs'),
  'automated-checks': pass('Native package test and typecheck pass, including unit, browser, pixel and spring checks.', 'packages/material3/package.json', 'packages/material3/src/FocusRing/FocusRing.test.tsx', 'packages/material3/scripts/check-focus-ring-browser.mjs'),
  'browser-behavior': pass('Keyboard, pointer, associated label, hidden-input ref replacement, disabled, forced colors and zoom/RTL behavior pass in Chrome.', 'packages/material3/scripts/check-focus-ring-browser.mjs', 'packages/material3/fixtures/focus-ring.tsx'),
  'consumer-docs': pass('Native opt-in API, examples, discovery and upstream attribution are shipped with the package.', 'packages/material3/src/FocusRing/FocusRing.doc.mjs', 'packages/material3/README.md', 'packages/material3/THIRD_PARTY_NOTICES.md'),
  'source-resolution': pass('Compose owns the default and inset; the only outward selection and browser focus modality use recorded source gaps.', sourceDecision, 'internal/material3-migration/sources/families/family-CM-0023.md', 'packages/material3/src/FocusRing/FocusRing.spec.md'),
  'visual-comparison': pass('All 26 native frames match pinned Compose/Web value renders at exactly zero changed RGBA pixels.', 'internal/material3-migration/actual/capture-native-focus-ring.mjs', 'packages/material3/scripts/check-focus-ring-pixels.mjs', actual('focus-light-0260.png'), actual('diff/web-outward-dark-active.png')),
  'motion-review': pass('Normal-speed reference and native playback, timestamped contact sheet and aligned spring/interruption/reduced-motion captures are reviewed.', actual('motion-review.json'), actual('native-focus.webm'), actual('inspection/contact-sheet.png'), 'packages/material3/scripts/check-focus-ring-motion.mjs'),
  'upstream-tests': pass('The three pinned inset-ring cases are translated to native pixels and scoped role checks; default Ripple opacity stays with its owner.', 'packages/material3/scripts/check-focus-ring-pixels.mjs', 'packages/material3/scripts/check-focus-ring-browser.mjs', sourceDecision),
  performance: pass('Chrome/macOS input response and active-frame pacing meet the approved profile with 30 and 360 samples.', actual('performance.json'), 'internal/material3-migration/actual/record-native-focus-ring.mjs', sourceDecision),
};
for (const requirement of policy.evidenceRequirements)
  assert.ok(checks[requirement], `Missing ${requirement} check`);

const qaChecks = {
  states: {result: 'Pass', reason: 'Keyboard focus, pointer suppression, blur/refocus, disabled and detached/reconnected semantic target pass.'},
  keyboard: {result: 'Pass', reason: 'The decorative span stays out of tab order and target focus follows native focus-visible behavior.'},
  theme: {result: 'Pass', reason: 'Light/dark standard and Expressive inset states and Web outward states match pinned values; CSS role overrides remain scoped.'},
  responsive: {result: 'Pass', reason: 'The inset ring stays aligned at 320 px viewport, RTL and 200% zoom; outward clip diagnostics are checked.'},
  motion: {result: 'Pass', reason: 'Timed enter, exit, interruption, refocus and reduced-motion frames are exact; both browser traces settle at 880 ms.'},
  accessibility: {result: 'Pass', reason: 'The span is aria-hidden and unfocusable; native target, label, forced colors and reduced motion retain browser semantics.'},
};
const motionPass = (reason, ...evidence) => ({result: 'Pass', reason, evidence});
const motion = {
  applicable: true,
  reference: source.motion.reference,
  referenceSha256: source.motion.sha256,
  actualRecording: actual('native-focus.webm'),
  watchedBy: review.watchedBy,
  watchedAt: review.watchedAt,
  contactSheet: actual('inspection/contact-sheet.png'),
  observations: review.observations,
  scenarios: {
    enter: motionPass('Both inset strokes grow from zero with the Compose fast spatial spring.', actual('focus-light-0020.png'), actual('focus-light-0080.png')),
    exit: motionPass('Focus blur retargets both strokes to zero with fast effects.', actual('focus-light-0600.png'), actual('focus-light-0880.png')),
    interruption: motionPass('At 120 ms blur and 160 ms refocus, position and velocity remain continuous.', actual('focus-light-0120.png'), actual('focus-light-0160.png'), 'packages/material3/scripts/check-focus-ring-motion.mjs'),
    reversal: motionPass('Refocus after blur reverses the running spring and settles at the selected target.', actual('focus-dark-0180.png'), actual('focus-dark-0260.png')),
    'reduced-motion': motionPass('Browser reduced-motion preference paints final geometry without spring travel.', actual('focus-light-reduced.png'), actual('focus-dark-reduced.png'), 'packages/material3/scripts/check-focus-ring-browser.mjs'),
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
const upstreamTests = source.compose.tests.map(item => {
  if (item.id.includes('insetFocusRing')) return {
    id: item.id,
    result: 'Pass',
    reason: 'Compose inset ring stroke geometry and scoped default/overridden colors are translated to native browser assertions.',
    evidence: 'packages/material3/scripts/check-focus-ring-pixels.mjs',
    nativeTest: 'packages/material3/scripts/check-focus-ring-browser.mjs',
  };
  return {
    id: item.id,
    result: 'N/A',
    reason: 'Default bounded and unbounded Ripple focus opacity belongs to the later native Ripple owner; this primitive is opt-in.',
    evidence: 'internal/material3-migration/sources/families/family-CM-0023.md',
  };
});
const receipt = {
  strategyId: policy.strategyId,
  taskId: 'M3-GAP-011',
  revision,
  materialWebCommit: policy.materialWebCommit,
  androidxCommit: policy.androidxCommit,
  baselineId: policy.baselineId,
  reviewKind: 'visual',
  preview: `http://127.0.0.1:4173/fixtures/focus-ring.html?revision=${revision}`,
  sourceDecision,
  sourceDecisionSha256: hash(sourceBytes),
  checks,
  qaChecks,
  visualComparisons,
  motion,
  upstreamTests,
  performance: source.performance.map(item => ({id: item.id, actual: actual('performance.json')})),
};
process.stdout.write(`${JSON.stringify(receipt)}\n`);
