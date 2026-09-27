// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Git checkout or explicit revision of an exported source archive. @output Gallery build provenance. @position Permanent documentation build helper. */
import {existsSync} from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

export function buildRevision(repo, env = process.env) {
  if (!existsSync(path.join(repo, '.git'))) {
    const revision = env.ASTRYX_BUILD_REVISION;
    if (!/^[a-f0-9]{40}$/.test(revision || ''))
      throw new Error(
        'A source archive requires ASTRYX_BUILD_REVISION with its full commit SHA.',
      );
    return {revision, dirty: false};
  }
  const git = args =>
    execFileSync('git', args, {cwd: repo, encoding: 'utf8'}).trim();
  // An environment variable must never hide a dirty checkout or replace its HEAD.
  return {
    revision: git(['rev-parse', 'HEAD']),
    dirty: Boolean(git(['status', '--porcelain'])),
  };
}
