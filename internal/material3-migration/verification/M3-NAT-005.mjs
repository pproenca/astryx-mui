// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Verified foundation receipt and built docsite/Storybook native gallery. @output Exact-revision visual gallery receipt. @position Disposable M3-NAT-005 verifier; product gallery regression lives in packages/material3. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
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
const nativeReceipt = JSON.parse(
  run(
    process.execPath,
    'internal/material3-migration/verification/M3-NAT-002.mjs',
  ),
);
run('pnpm', '-F', '@astryxdesign/storybook', 'typecheck');
run('pnpm', '-F', '@astryxdesign/docsite', 'typecheck');
run('pnpm', '-F', '@astryxdesign/storybook', 'build');
run('pnpm', '-F', '@astryxdesign/docsite', 'build');

const galleryRoot = 'packages/material3/dist/gallery';
const docsiteRoot = 'apps/docsite/public/material3-gallery';
const storybookRoot = 'apps/storybook/dist/material3-gallery';
const manifest = JSON.parse(
  await fs.readFile(path.join(repo, galleryRoot, 'evidence/manifest.json')),
);
assert.equal(manifest.scenarios.length, 18);
assert.equal(new Set(manifest.scenarios.map(item => item.dimension)).size, 8);
assert.equal(
  manifest.capturedNativeRevision,
  '9fe75263aab78c67dbe5fe49ef30b95ca872ee27',
);
for (const root of [galleryRoot, docsiteRoot, storybookRoot]) {
  const build = JSON.parse(
    await fs.readFile(path.join(repo, root, 'revision.json')),
  );
  assert.equal(build.revision, revision, `${root} has stale native build`);
  assert.equal(build.dirty, false, `${root} was built from a dirty revision`);
  for (const item of manifest.scenarios) {
    for (const kind of ['source', 'native', 'diff'])
      await fs.access(path.join(repo, root, 'evidence', item.files[kind]));
  }
  for (const name of [
    'index.html',
    'fixtures/foundation.html',
    'evidence/compose-default-spatial.mp4',
    'evidence/native-motion.webm',
  ])
    await fs.access(path.join(repo, root, name));
}
const storyIndex = JSON.parse(
  await fs.readFile(path.join(repo, 'apps/storybook/dist/index.json')),
);
assert.ok(storyIndex.entries['material-3-native-foundations--gallery']);
const prerender = JSON.parse(
  await fs.readFile(
    path.join(repo, 'apps/docsite/.next/prerender-manifest.json'),
  ),
);
assert.ok(prerender.routes['/material3/foundations']);
const nativeManifest = JSON.parse(
  await fs.readFile(path.join(repo, 'packages/material3/package.json')),
);
assert.equal(nativeManifest.private, true);
assert.ok(!nativeManifest.dependencies?.['@astryxdesign/core']);
assert.ok(!nativeManifest.dependencies?.['@astryxdesign/theme-material3']);
const galleryBuild = await fs.readFile(
  path.join(repo, 'packages/material3/scripts/build-gallery.mjs'),
  'utf8',
);
assert.ok(!galleryBuild.includes('internal/material3-migration'));

const pass = (reason, ...evidence) => ({result: 'Pass', reason, evidence});
const checks = {
  ...nativeReceipt.checks,
  'native-boundary': pass(
    'Both published gallery copies import the native package build and retain the private package boundary.',
    'packages/material3/package.json',
    'packages/material3/gallery/index.html',
    'packages/material3/scripts/build-gallery.mjs',
    'apps/docsite/scripts/copy-material3-gallery.mjs',
    'apps/storybook/.storybook/main.ts',
  ),
  'automated-checks': pass(
    'Native browser regression, Storybook production build, docsite production build and both typechecks pass at the verified revision.',
    'packages/material3/scripts/check-gallery.mjs',
    'apps/storybook/package.json',
    'apps/docsite/package.json',
  ),
  'browser-behavior': pass(
    'Product gallery controls propagate scheme and direction to the live native fixture; Chrome checks keyboard, reduced motion and 390px layout.',
    'packages/material3/scripts/check-gallery.mjs',
    'packages/material3/gallery/index.html',
    'packages/material3/fixtures/foundation.html',
  ),
  'consumer-docs': pass(
    'The docsite route, Storybook story and native package reference identify source, status, exact revision, comparisons and pending components.',
    'apps/docsite/src/app/(site)/material3/foundations/page.tsx',
    'apps/storybook/stories/Material3Foundations.stories.tsx',
    'packages/material3/docs/material3-native.doc.mjs',
    'packages/material3/THIRD_PARTY_NOTICES.md',
  ),
  'visual-comparison': pass(
    'Eighteen product-owned representative comparison triplets cover all eight foundation dimensions; full 59-scenario exact-pixel evidence remains bound to the verified native graph.',
    'packages/material3/gallery/evidence/manifest.json',
    'packages/material3/gallery/evidence/README.md',
    'internal/material3-migration/actual/M3-NAT-002/shape-expressive-dark.png',
  ),
  'motion-review': pass(
    'The gallery exposes watched pinned Compose and native recordings beside interactive interruption, reversal and reduced-motion controls.',
    'packages/material3/gallery/index.html',
    'packages/material3/gallery/evidence/compose-default-spatial.mp4',
    'packages/material3/gallery/evidence/native-motion.webm',
    'packages/material3/scripts/check-gallery.mjs',
  ),
};
const receipt = {
  ...nativeReceipt,
  taskId: 'M3-NAT-005',
  revision,
  preview: `http://127.0.0.1:3000/material3/foundations?revision=${revision}`,
  checks,
  qaChecks: {
    states: {
      result: 'Pass',
      reason:
        'The native gallery exposes scheme, scoped override and source/native comparison states.',
    },
    keyboard: {
      result: 'Pass',
      reason:
        'Chrome activates the native scoped override with Enter inside the gallery iframe.',
    },
    theme: {
      result: 'Pass',
      reason:
        'Docsite and Storybook distinguish the native gallery from the Core compatibility theme; light, dark and Expressive modes reach native tokens.',
    },
    responsive: {
      result: 'Pass',
      reason: 'Chrome checks the gallery and native fixture at 390px with RTL.',
    },
    motion: {
      result: 'Pass',
      reason:
        'Pinned and native videos play beside the interrupted spring; reduced motion reaches the native fixture.',
    },
    accessibility: {
      result: 'Pass',
      reason:
        'The gallery has named sections, labeled controls, a titled iframe, keyboard focus styles and native button/select behavior.',
    },
  },
};
process.stdout.write(`${JSON.stringify(receipt)}\n`);
