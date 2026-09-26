// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native package, package-owned comparisons, and current Git revision. @output Standalone native gallery in dist/gallery. @position Product documentation build; no migration-harness dependency. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const repo = path.resolve(packageRoot, '../..');
const dist = path.join(packageRoot, 'dist');
const gallery = path.join(dist, 'gallery');
const required = ['index.js', 'tokens.css'];
for (const name of required) await fs.access(path.join(dist, name));

await fs.rm(gallery, {recursive: true, force: true});
await fs.mkdir(path.join(gallery, 'dist'), {recursive: true});
await fs.mkdir(path.join(gallery, 'fixtures'), {recursive: true});
await fs.copyFile(
  path.join(packageRoot, 'gallery/index.html'),
  path.join(gallery, 'index.html'),
);
await fs.copyFile(
  path.join(packageRoot, 'fixtures/foundation.html'),
  path.join(gallery, 'fixtures/foundation.html'),
);
await fs.cp(
  path.join(packageRoot, 'fixtures/fonts'),
  path.join(gallery, 'fixtures/fonts'),
  {recursive: true},
);
await fs.cp(
  path.join(packageRoot, 'gallery/evidence'),
  path.join(gallery, 'evidence'),
  {recursive: true},
);
for (const entry of await fs.readdir(dist, {withFileTypes: true})) {
  if (
    entry.name === 'gallery' ||
    !entry.isFile() ||
    !/\.(?:js|json|css)$/.test(entry.name)
  )
    continue;
  await fs.copyFile(
    path.join(dist, entry.name),
    path.join(gallery, 'dist', entry.name),
  );
}
const revision = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: repo,
  encoding: 'utf8',
}).trim();
const dirty = Boolean(
  execFileSync('git', ['status', '--porcelain'], {
    cwd: repo,
    encoding: 'utf8',
  }).trim(),
);
await fs.writeFile(
  path.join(gallery, 'revision.json'),
  `${JSON.stringify({revision, dirty})}\n`,
);
console.log(
  `Built native foundation gallery at ${revision}${dirty ? ' (working tree changed)' : ''}`,
);
