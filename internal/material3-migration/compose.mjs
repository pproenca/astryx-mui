// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned, read-only AndroidX checkout. @output Reproducible source index and bounded task references. @position Disposable migration source adapter. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

export const digest = value => createHash('sha256').update(value).digest('hex');
export const composeRoot =
  'compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/';
const foundations = new Set([
  'ColorScheme',
  'MaterialTheme',
  'Typography',
  'Shapes',
  'MotionScheme',
  'MaterialShapes',
  'ContentColor',
  'Ripple',
  'InteractiveComponentSize',
  'Surface',
  'Text',
]);
const utility =
  /Defaults$|Colors$|Positions$|Scope$|State$|Override$|Experimental|Local|Tokens$|Kt$/;
const git = (root, args) =>
  execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  }).trim();
export function checkCompose(root, policy) {
  if (!root)
    throw new Error(
      'Set M3_ANDROIDX or --androidx to the existing pinned shallow checkout.',
    );
  if (git(root, ['rev-parse', 'HEAD']) !== policy.androidxCommit)
    throw new Error(
      'AndroidX revision differs from policy; select the pinned checkout.',
    );
  if (
    git(root, [
      'status',
      '--porcelain',
      '--',
      'compose/material3',
      'compose/animation/animation-core',
      'graphics/graphics-shapes',
    ])
  )
    throw new Error('AndroidX reference sources contain local changes.');
  return {
    commit: policy.androidxCommit,
    shallow: git(root, ['rev-parse', '--is-shallow-repository']) === 'true',
  };
}
export function declarations(text) {
  const lines = text.split('\n'),
    result = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(
      /^([ \t]*)(?:(?:public|internal|private|const|inline)\s+)*val\s+(\w+)\b(.*)$/,
    );
    if (!m) continue;
    const block = [m[3]];
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() && lines[j].match(/^[ \t]*/)[0].length <= m[1].length)
        break;
      block.push(lines[j]);
    }
    const body = block.join('\n'),
      assignment = body.indexOf('=');
    result.push({
      name: m[2],
      expression: (assignment < 0 ? body : body.slice(assignment + 1)).trim(),
      line: i + 1,
    });
  }
  return result;
}
export async function indexCompose(root, policy) {
  checkCompose(root, policy);
  const paths = git(root, [
    'ls-tree',
    '-r',
    '--name-only',
    'HEAD',
    '--',
    'compose/material3/material3/src',
    'compose/material3/material3/samples',
    'compose/animation/animation-core/src/commonMain',
    'graphics/graphics-shapes/src/commonMain',
  ])
    .split('\n')
    .filter(p => p.endsWith('.kt'));
  const apiPaths = git(root, [
    'ls-tree',
    '-r',
    '--name-only',
    'HEAD',
    '--',
    'compose/material3',
  ])
    .split('\n')
    .filter(p => p.endsWith('/api/current.txt'));
  const files = new Map();
  for (const p of [...paths, ...apiPaths]) {
    try {
      files.set(p, await fs.readFile(path.join(root, p), 'utf8'));
    } catch {
      throw new Error(
        `Missing sparse source: ${p}. Expand the checkout for the indexed source roots.`,
      );
    }
  }
  const ref = p => ({
    path: p,
    sha256: digest(files.get(p)),
    url: `https://android.googlesource.com/platform/frameworks/support/+/${policy.androidxCommit}/${p}`,
  });
  const tokenFiles = paths.filter(p => p.startsWith(composeRoot + 'tokens/'));
  const tokens = tokenFiles.map(p => ({
    ...ref(p),
    name: path.basename(p, '.kt'),
    version: files.get(p).match(/VERSION:\s*(\S+)/)?.[1] || '',
    values: declarations(files.get(p)),
  }));
  const families = [];
  for (const p of paths.filter(
    p =>
      p.startsWith(composeRoot) &&
      !p.includes('/internal/') &&
      !p.includes('/tokens/'),
  )) {
    const text = files.get(p),
      name = path.basename(p, '.kt');
    if (
      utility.test(name) ||
      (!/@Composable/.test(text) && !foundations.has(name))
    )
      continue;
    const symbols = [
      ...new Set(
        [...text.matchAll(/public\s+fun\s+(?:<[^>]+>\s*)?(\w+)\s*\(/g)].map(
          m => m[1],
        ),
      ),
    ];
    if (!symbols.length && !foundations.has(name)) continue;
    const tests = paths
      .filter(
        t =>
          /\/(?:androidDeviceTest|commonTest|androidHostTest)\//.test(t) &&
          path.basename(t).startsWith(name) &&
          /Test\.kt$/.test(t),
      )
      .map(t => ({
        ...ref(t),
        cases: [...files.get(t).matchAll(/\bfun\s+(\w+)\s*\(/g)].map(m => m[1]),
      }));
    families.push({
      id: `compose:${name}`,
      name,
      kind: foundations.has(name) ? 'Foundation' : 'Component',
      ...ref(p),
      symbols,
      expressive: /Expressive|ButtonShapes|MotionScheme/.test(text),
      tokens: tokens.filter(t => text.includes(t.name)).map(t => t.name),
      tests,
      samples: paths
        .filter(
          t => t.includes('/samples/') && path.basename(t).startsWith(name),
        )
        .map(ref),
    });
  }
  for (const p of apiPaths) {
    const name = p
      .replace('compose/material3/', '')
      .replace('/api/current.txt', '');
    families.push({
      id: `compose:api/${name}`,
      name: `API ${name}`,
      kind: 'API surface',
      ...ref(p),
      symbols: [],
      expressive: /Expressive/.test(files.get(p)),
      tokens: [],
      tests: [],
      samples: [],
    });
  }
  return {
    schemaVersion: 1,
    commit: policy.androidxCommit,
    attribution: {
      copyright: 'The Android Open Source Project',
      license: 'Apache-2.0',
      licenseFile: 'internal/material3-migration/sources/LICENSE.androidx',
      modification:
        'Derived source inventory; token expressions are extracted, Kotlin implementation is not redistributed.',
    },
    description:
      'Candidate families and extracted token expressions. Extraction is a navigation aid, not a Kotlin parser or proof of complete APIs. Source presence does not prove design equivalence or completion.',
    families: families.sort((a, b) => a.id.localeCompare(b.id)),
    tokens,
    motion: paths
      .filter(p =>
        /\/(SpringSimulation|SpringEstimation|FloatAnimationSpec)\.kt$/.test(p),
      )
      .map(ref),
  };
}
export async function loadCompose(repo, policy) {
  const index = JSON.parse(
    await fs.readFile(path.join(repo, policy.composeInventory), 'utf8'),
  );
  if (index.commit !== policy.androidxCommit)
    throw new Error('Compose index is stale; run source prepare.');
  if (digest(JSON.stringify(index)) !== policy.composeInventorySha256)
    throw new Error('Compose index hash differs from the pinned policy.');
  return index;
}
export function composeBrief(index, familyIds, full = false) {
  return index.families
    .filter(f => familyIds.includes(f.id))
    .map(f => ({
      ...f,
      tests: f.tests.map(t => ({
        ...t,
        cases: full ? t.cases : t.cases.slice(0, 8),
      })),
      tokens: f.tokens.map(name => {
        const t = index.tokens.find(t => t.name === name);
        return full ? t : {name, path: t.path, sha256: t.sha256, url: t.url};
      }),
    }));
}
