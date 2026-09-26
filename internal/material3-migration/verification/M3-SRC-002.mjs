// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Sole migration workbook and pinned Figma/Compose/Web inventories. @output Revision-bound source-coverage receipt. @position Disposable M3-SRC-002 verification recipe. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {workbook} from '../workbook.mjs';
import {table, ids, graph} from '../model.mjs';
import {coveragePlan} from '../audit.mjs';
import {loadCompose} from '../compose.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const source = 'internal/material3-migration/sources';
const decision = `${source}/source-coverage-reconciliation.md`;
const policy = JSON.parse(
  await fs.readFile(
    path.join(repo, 'internal/material3-migration/policy.json'),
  ),
);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (cwd, ...args) =>
  execFileSync('git', args, {cwd, encoding: 'utf8'}).trim();
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
assert(
  process.env.M3_WORKBOOK,
  'Set M3_WORKBOOK to the sole migration database',
);
assert(
  process.env.M3_ANDROIDX,
  'Set M3_ANDROIDX to the pinned AndroidX checkout',
);
assert(
  git(process.env.M3_ANDROIDX, 'rev-parse', 'HEAD') === policy.androidxCommit,
  'AndroidX checkout changed',
);
const index = await loadCompose(repo, policy);
const kit = JSON.parse(
  await fs.readFile(path.join(repo, `${source}/figma-kit-inventory.json`)),
);
const evidence = await workbook(process.env.M3_WORKBOOK, false, async wb => {
  const blockers = coveragePlan(wb, policy, index);
  assert(!blockers.length, `Source coverage blocked: ${blockers.join(' | ')}`);
  const figma = table(wb, 'Design kit sets');
  const compose = table(wb, 'Compose sources');
  const web = table(wb, 'Material components');
  const mappings = table(wb, 'Component mapping');
  const tasks = table(wb, 'Tasks');
  const edges = table(wb, 'Dependencies');
  const checks = table(wb, 'Acceptance checks');
  graph(tasks, edges);
  assert(
    figma.length === 171 && compose.length === 80 && web.length === 54,
    'Frozen source row count changed',
  );
  assert(
    kit.componentSets.length === figma.length,
    'Pinned Figma inventory length changed',
  );
  for (const set of kit.componentSets) {
    const row = figma.find(r => r['Figma node ID'] === set.node_id);
    assert(
      row &&
        row.Page === set.page &&
        row['Component set'] === set.name &&
        row['Variant axes'] === set.axes &&
        row['Variant values'] === set.values &&
        Number(row.Variants) === set.variants &&
        row.Properties === set.properties,
      `Figma set differs from pinned export: ${set.node_id}`,
    );
  }
  for (const row of web) {
    const mapIds = ids(row['Mapping IDs']);
    assert(
      mapIds.length &&
        mapIds.every(id =>
          mappings.some(
            m => m['Map ID'] === id && m.Disposition === 'Required',
          ),
        ),
      `Web element lacks a required native owner: ${row.ID}`,
    );
  }
  const apiRows = compose.filter(r => r.Kind === 'API surface');
  assert(
    apiRows.length === 9,
    'Published Compose API module inventory changed',
  );
  for (const row of apiRows) {
    const bytes = await fs.readFile(
      path.join(process.env.M3_ANDROIDX, row['Source path']),
    );
    assert(
      sha(bytes) === row['Source SHA256'],
      `Pinned API snapshot changed: ${row.ID}`,
    );
  }
  const main = apiRows.find(r => r.ID === 'compose:api/material3');
  const api = await fs.readFile(
    path.join(process.env.M3_ANDROIDX, main['Source path']),
    'utf8',
  );
  const publicComposableNames = new Set(
    api
      .split('\n')
      .filter(line =>
        line.includes(
          'method @KotlinOnly @androidx.compose.runtime.Composable public ',
        ),
      )
      .map(line =>
        line.split(' public ')[1].split('(')[0].trim().split(/\s+/).at(-1),
      ),
  );
  assert(
    publicComposableNames.size === 304,
    'Main Material 3 public composable surface changed',
  );
  const indexed = new Set(index.families.flatMap(f => f.symbols));
  const variants = mappings
    .map(m => String(m['Required variants'] || ''))
    .join(' ');
  const unowned = [...publicComposableNames].filter(
    name => !indexed.has(name) && !new RegExp(`\\b${name}\\b`).test(variants),
  );
  assert(
    !unowned.length,
    `Unowned public Compose API helpers: ${unowned.join(', ')}`,
  );
  for (const id of ['M3-FIG-001', 'M3-FIG-002']) {
    assert(
      tasks.some(
        t =>
          t['Task ID'] === id &&
          t.Contract === policy.strategyId &&
          t.Status === 'Backlog',
      ),
      `Figma-only native owner missing: ${id}`,
    );
    for (const parent of ['M3-SRC-002', 'M3-NAT-006'])
      assert(
        edges.some(
          e =>
            e.Predecessor === parent && e.Successor === id && e.Kind === 'Hard',
        ),
        `Figma-only owner missing hard dependency: ${parent} -> ${id}`,
      );
  }
  for (const mapId of ['CM-0064', 'CM-0292']) {
    assert(
      mappings.some(
        m => m['Map ID'] === mapId && m.Disposition === 'Native extension',
      ),
      `Figma-only native mapping missing: ${mapId}`,
    );
    assert(
      checks.filter(c => c['Map ID'] === mapId).length ===
        policy.nativeAcceptance.length,
      `Figma-only native acceptance incomplete: ${mapId}`,
    );
  }
  for (const [row, id] of [
    [figma, '52515:32926'],
    [compose, 'compose:api/material3-a2ui'],
  ]) {
    const item = row.find(r => r['Figma node ID'] === id || r.ID === id);
    assert(
      item?.Disposition === 'Excluded' &&
        item.Reason &&
        item['Approval reference'],
      `Approved platform exclusion missing: ${id}`,
    );
  }
  return {
    changed: false,
    data: {
      sourceRows: {
        figma: figma.length,
        compose: compose.length,
        web: web.length,
      },
      publicComposableNames: publicComposableNames.size,
      apiModules: apiRows.length,
      nativeExtensionMaps: ['CM-0064', 'CM-0292'],
    },
  };
});
const info = evidence.data;
const pass = (...files) => ({
  result: 'Pass',
  reason:
    'Pinned source membership and native ownership verified; native implementation remains open.',
  evidence: files,
});
const na = (reason, ...files) => ({result: 'N/A', reason, evidence: files});
const checks = {
  source: pass(
    decision,
    `${source}/figma-kit-inventory.json`,
    `${source}/compose-inventory.json`,
  ),
  'token-contract': na(
    'Canonical native token graph is a successor; this slice assigns shape and component source ownership.',
    decision,
    'packages/themes/material3/material3.spec.md',
  ),
  'native-boundary': na(
    'The native package is a successor; this slice freezes source ownership.',
    decision,
    'packages/themes/material3/material3.spec.md',
  ),
  compatibility: na(
    'Core compatibility delegation follows native implementation.',
    'packages/themes/material3/material3.spec.md',
  ),
  'automated-checks': pass(
    'internal/material3-migration/verification/M3-SRC-002.mjs',
    'internal/material3-migration/audit.mjs',
    'internal/material3-migration/tests/compose-workflow.test.mjs',
  ),
  'browser-behavior': na(
    'No native browser component exists in this source slice; browser/OS keyboard and adaptive semantics are assigned.',
    decision,
  ),
  'consumer-docs': na(
    'Native consumer documentation follows implementation of the public exports.',
    'packages/themes/material3/material3.spec.md',
  ),
  'source-resolution': pass(decision, `${source}/source-versions.md`),
  'visual-comparison': na(
    'This membership slice creates no new native rendering; M3-SRC-001 provides the pinned source captures.',
    `${source}/README.md`,
    `${source}/baseline/README.md`,
  ),
  'motion-review': pass(
    `${source}/motion/README.md`,
    `${source}/motion/source-reference/README.md`,
    decision,
  ),
  'upstream-tests': na(
    'Public API and upstream test inventory are pinned; family tasks translate applicable Compose cases into permanent web tests.',
    `${source}/compose-inventory.json`,
    decision,
  ),
  performance: na(
    'Native response and frame pacing require implemented browser components.',
    `${source}/baseline/README.md`,
  ),
};
for (const key of policy.evidenceRequirements)
  assert(checks[key], `Missing evidence dimension ${key}`);
const qaChecks = {
  states: {
    result: 'Pass',
    reason:
      'All pinned Figma variant and state axes remain in source rows and native owner links.',
  },
  keyboard: {
    result: 'Pass',
    reason:
      'The approved OS virtual-keyboard boundary is recorded; native text-input keyboard semantics remain required.',
  },
  theme: {
    result: 'Pass',
    reason:
      'The pinned baseline preserves light/dark and Expressive source coverage; native theme acceptance remains open.',
  },
  responsive: {
    result: 'Pass',
    reason:
      'Layout-grid and adaptive API rows retain native Scaffold and navigation owners; browser layout tests remain open.',
  },
  motion: {
    result: 'Pass',
    reason:
      'M3-SRC-001 watched official motion media and pinned timed source frames; family-specific and native motion remain open.',
  },
  accessibility: {
    result: 'N/A',
    reason:
      'This source-only slice has no rendered component; native semantic acceptance remains open.',
  },
};
const receipt = {
  strategyId: policy.strategyId,
  taskId: 'M3-SRC-002',
  revision: git(repo, 'rev-parse', 'HEAD'),
  materialWebCommit: policy.materialWebCommit,
  androidxCommit: policy.androidxCommit,
  baselineId: policy.baselineId,
  reviewKind: 'document',
  sourceDecision: decision,
  sourceDecisionSha256: sha(await fs.readFile(path.join(repo, decision))),
  checks,
  qaChecks,
  sourceCoverage: info,
  motion: {
    sourceOnly: true,
    reference: `${source}/motion/source-reference/compose-default-spatial.mp4`,
    observations: `${source}/motion/README.md`,
    timedFrames: `${source}/motion/source-reference/manifest.json`,
    nativeRecording: null,
  },
};
process.stdout.write(`${JSON.stringify(receipt)}\n`);
