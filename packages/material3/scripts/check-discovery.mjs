// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file check-discovery.mjs
 * @input Built native package and same-stem integration descriptor
 * @output Consumer-level Astryx discovery and doc-topic evidence
 * @position Native package integration regression
 */

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const repo = path.resolve(packageRoot, '../..');
const cli = path.join(repo, 'packages/cli/clients/cli/bin/astryx.mjs');
const project = await fs.mkdtemp(
  path.join(os.tmpdir(), 'astryx-m3-discovery-'),
);
try {
  await fs.mkdir(path.join(project, 'node_modules/@astryxdesign'), {
    recursive: true,
  });
  await fs.symlink(
    packageRoot,
    path.join(project, 'node_modules/@astryxdesign/material3'),
  );
  await fs.writeFile(
    path.join(project, 'package.json'),
    '{"name":"material3-consumer","private":true,"type":"module"}\n',
  );
  await fs.writeFile(
    path.join(project, 'astryx.config.mjs'),
    "export default {integrations: ['@astryxdesign/material3']};\n",
  );
  const run = (...args) =>
    JSON.parse(
      execFileSync(process.execPath, [cli, ...args, '--json'], {
        cwd: project,
        encoding: 'utf8',
      }),
    );
  const discovered = run('discover');
  assert.equal(discovered.meta?.configured, true);
  assert.deepEqual(discovered.data, []);
  const topic = run('docs', 'material3-native');
  assert.ok(
    JSON.stringify(topic).includes('Native Material 3'),
    `Native package reference doc is not served to consumers: ${JSON.stringify(topic)}`,
  );
  const imported = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      "import {material3Var} from '@astryxdesign/material3'; process.stdout.write(material3Var('--md-sys-color-primary'));",
    ],
    {cwd: project, encoding: 'utf8'},
  );
  assert.equal(imported, 'var(--md-sys-color-primary)');
} finally {
  await fs.rm(project, {recursive: true, force: true});
}
process.stdout.write('Native Material 3 consumer discovery passed.\n');
