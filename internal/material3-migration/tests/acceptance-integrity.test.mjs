// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Real temporary Git checkouts and token acceptance mutations. @output Regression coverage for closure, provenance and harness retirement. @position Disposable harness tests. */
import {test} from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {tokenReady, tokenCompletionFormula} from '../token-completion.mjs';
import {assertCommittedEvidence} from '../evidence.mjs';
import {clean} from '../workflow.mjs';
import {hash} from '../workbook.mjs';
import {retireCheck, hasHarnessDependency} from '../audit.mjs';
import {buildRevision} from '../../../packages/material3/scripts/build-revision.mjs';

async function withRepo(action) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'm3-integrity-'));
  const git = (...args) =>
    execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
  try {
    git('init', '-q');
    git('config', 'user.name', 'Test');
    git('config', 'user.email', 'test@example.invalid');
    git('config', 'commit.gpgsign', 'false');
    await action(root, git);
  } finally {
    await fs.rm(root, {recursive: true, force: true});
  }
}

const token = {
  Contract: 'native',
  'Material token': '--md-icon-size',
  'Astryx candidate': '--md-icon-size',
  Relationship: 'Confirmed',
  Verification: 'Pass',
  Evidence: 'committed-source.ts',
  'Native QA': 'Approved',
  Review: 'Approved',
  Merged: 'Yes',
};
test('every completion field is required; human approval and merge cannot be inferred', () => {
  assert.equal(tokenReady(token, 'native', true), true);
  for (const field of Object.keys(token)) {
    assert.equal(
      tokenReady({...token, [field]: ''}, 'native', true),
      false,
      field,
    );
  }
  assert.equal(
    tokenReady({...token, Relationship: 'Candidate'}, 'native'),
    false,
  );
  assert.equal(tokenReady({...token, Evidence: '   '}, 'native'), false);
  assert.equal(
    tokenReady({...token, Review: '', 'Native QA': '', Merged: ''}, 'native'),
    true,
  );
  assert.match(tokenCompletionFormula(2, 'native'), /E2="Confirmed"/);
  assert.match(tokenCompletionFormula(2, 'native'), /P2="Yes"/);
});

test('untracked inputs and ignored evidence cannot enter a revision-bound receipt', async () => {
  await withRepo(async (repo, git) => {
    await fs.writeFile(path.join(repo, 'source.txt'), 'committed');
    await fs.writeFile(path.join(repo, '.gitignore'), 'ignored.txt\n');
    git('add', '.');
    git('commit', '-qm', 'fixture');
    const revision = git('rev-parse', 'HEAD');
    clean(repo);
    await assertCommittedEvidence(repo, revision, {
      'source.txt': hash('committed'),
    });
    await fs.writeFile(path.join(repo, 'new.ts'), 'local implementation');
    assert.throws(() => clean(repo), /untracked inputs/);
    await fs.rm(path.join(repo, 'new.ts'));
    await fs.writeFile(path.join(repo, 'ignored.txt'), 'local evidence');
    clean(repo);
    await assert.rejects(
      assertCommittedEvidence(repo, revision, {
        'ignored.txt': hash('local evidence'),
      }),
      /not a committed/,
    );
    await fs.writeFile(path.join(repo, 'source.txt'), 'changed');
    await assert.rejects(
      assertCommittedEvidence(repo, revision, {'source.txt': hash('changed')}),
      /differs from verified commit/,
    );
    assert.equal(
      buildRevision(repo, {ASTRYX_BUILD_REVISION: 'a'.repeat(40)}).revision,
      revision,
    );
    assert.equal(buildRevision(repo).dirty, true);
  });
});

test('retirement commands receive archive revision and run with no Git or harness', async () => {
  await withRepo(async (repo, git) => {
    await fs.mkdir(path.join(repo, 'packages/material3'), {recursive: true});
    await fs.mkdir(path.join(repo, 'internal/material3-migration'), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(repo, 'internal/material3-migration/marker'),
      'must be removed',
    );
    await fs.writeFile(
      path.join(repo, 'packages/material3/package.json'),
      JSON.stringify({
        scripts: {build: 'node proof.mjs', test: 'node proof.mjs'},
      }),
    );
    await fs.copyFile(
      new URL(
        '../../../packages/material3/scripts/build-revision.mjs',
        import.meta.url,
      ),
      path.join(repo, 'build-revision.mjs'),
    );
    await fs.writeFile(
      path.join(repo, 'proof.mjs'),
      `import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {buildRevision} from './build-revision.mjs';
assert.equal(existsSync('.git'), false);
assert.equal(existsSync('internal/material3-migration'), false);
assert.deepEqual(buildRevision(process.cwd()), {revision: process.env.ASTRYX_BUILD_REVISION, dirty: false});
console.log('archive proof passed');`,
    );
    git('add', '.');
    git('commit', '-qm', 'fixture');
    const state = await fs.mkdtemp(
      path.join(os.tmpdir(), 'm3-retire-receipt-'),
    );
    try {
      const result = await retireCheck(
        repo,
        {
          nativeRoot: 'packages/material3',
          baselineId: 'test',
          retirementCommands: [[process.execPath, 'proof.mjs']],
        },
        'policy',
        state,
      );
      assert.equal(result.harnessAbsent, true);
      assert.equal(result.revision, git('rev-parse', 'HEAD'));
      assert.equal(result.commands.length, 1);
    } finally {
      await fs.rm(state, {recursive: true, force: true});
    }
  });
});

test('an archive without explicit valid provenance fails closed', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'm3-no-git-'));
  try {
    assert.throws(() => buildRevision(root, {}), /ASTRYX_BUILD_REVISION/);
    assert.throws(
      () => buildRevision(root, {ASTRYX_BUILD_REVISION: 'main'}),
      /full commit SHA/,
    );
  } finally {
    await fs.rm(root, {recursive: true, force: true});
  }
});

test('retirement retains historical provenance but rejects executable or data dependencies', () => {
  const trace =
    'packages/material3/fixtures/references/motion/traces/standard-default-spatial.json';
  const command =
    'node internal/material3-migration/sources/motion/upstream/capture-compose-springs.mjs';
  const data = {
    producer: {kind: 'upstream', commit: 'a'.repeat(40), command},
    samples: [],
  };
  assert.equal(hasHarnessDependency(trace, JSON.stringify(data)), false);
  assert.equal(
    hasHarnessDependency(
      trace,
      JSON.stringify({
        ...data,
        input: 'internal/material3-migration/missing.json',
      }),
    ),
    true,
  );
  assert.equal(
    hasHarnessDependency(
      'packages/material3/package.json',
      JSON.stringify({scripts: {test: command}}),
    ),
    true,
  );
  assert.equal(
    hasHarnessDependency(
      'packages/material3/src/index.ts',
      "import 'internal/material3-migration/runtime.mjs'",
    ),
    true,
  );
  const foundation = 'packages/material3/src/foundationSource.json';
  const sourceFiles = {
    'internal/material3-migration/sources/color.json': 'b'.repeat(64),
  };
  assert.equal(
    hasHarnessDependency(foundation, JSON.stringify({sourceFiles})),
    false,
  );
  assert.equal(
    hasHarnessDependency(
      foundation,
      JSON.stringify({sourceFiles, runtime: '.m3-receipts/data.json'}),
    ),
    true,
  );
  assert.equal(
    hasHarnessDependency(
      foundation,
      JSON.stringify({
        sourceFiles: {
          'internal/material3-migration/sources/color.json': 'not-a-hash',
        },
      }),
    ),
    true,
  );
});
