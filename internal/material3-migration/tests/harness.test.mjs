// Copyright (c) Meta Platforms, Inc. and affiliates.

import {test} from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {ready, graph, ids, table, write} from '../model.mjs';
import {
  validateSource,
  validateReceipt,
  validateMotion,
  fileAt,
} from '../evidence.mjs';
import {selectFrames} from '../motion.mjs';
import {pixels} from '../compare.mjs';
import {presentXML, visible} from '../presentation.mjs';
import {validateMerge} from '../workflow.mjs';
import {parse, commands} from '../cli.mjs';
const task = (id, phase = 'Foundation', status = 'Backlog', priority = 1) => ({
  'Task ID': id,
  Phase: phase,
  Status: status,
  Priority: priority,
});
test('dependencies precede priority, Web/Figma overlap does not outrank priority', () => {
  const tasks = [
    task('f', 'Foundation', 'Approved'),
    task('web', 'Web only / unresolved', 'Backlog', 1),
    task('shared', 'Shared Web + Figma', 'Backlog', 99),
  ];
  const edges = [{Predecessor: 'f', Successor: 'shared', Kind: 'Hard'}];
  assert.deepEqual(
    ready(tasks, edges).map(t => t['Task ID']),
    ['web'],
  );
  tasks[0].Status = 'Closed';
  assert.deepEqual(
    ready(tasks, edges).map(t => t['Task ID']),
    ['web', 'shared'],
  );
  tasks[2]['Hold reason'] = 'Unresolved source';
  assert.deepEqual(
    ready(tasks, edges).map(t => t['Task ID']),
    ['web'],
  );
});
test('unknown references and cycles fail; mapping ranges include all variants', () => {
  assert.throws(
    () =>
      graph(
        [task('a')],
        [{Predecessor: 'missing', Successor: 'a', Kind: 'Hard'}],
      ),
    /Unknown/,
  );
  assert.throws(
    () =>
      graph(
        [task('a'), task('b')],
        [
          {Predecessor: 'b', Successor: 'a', Kind: 'Hard'},
          {Predecessor: 'a', Successor: 'b', Kind: 'Hard'},
        ],
      ),
    /cycle/,
  );
  assert.deepEqual(ids('CM-0002 to CM-0004, CM-0008'), [
    'CM-0002',
    'CM-0003',
    'CM-0004',
    'CM-0008',
  ]);
});
const environment = {
  browser: 'Chromium pinned',
  os: 'pinned',
  dpr: 1,
  viewport: [320, 240],
  fonts: ['font-hash'],
  theme: 'light',
  content: 'fixture',
  state: 'default',
};
function source() {
  return {
    authority: 'figma-first',
    web: {commit: 'web'},
    figma: {sha256: 'a'.repeat(64), inventory: 'inventory.json'},
    guidance: [
      {
        url: 'https://m3.material.io/styles/motion/overview',
        capturedAt: '2026-09-26',
        capture: 'page.png',
      },
    ],
    decisions: [
      {
        dimension: 'shape',
        figmaSpecified: true,
        chosen: 'figma',
        reason: 'Owner selected Figma',
        evidence: 'node.json',
      },
    ],
    scenarios: [
      {
        id: 'default',
        sourceReference: 'Figma 12:34',
        baseline: 'expected.png',
        environment,
      },
    ],
  };
}
test('active Compose-first policy rejects a stale Figma-first source decision', () => {
  assert.throws(
    () => validateSource(source(), {schemaVersion: 4}),
    /authority differs from policy/,
  );
});
test('legacy Figma precedence and explicit tolerance cannot be bypassed by a conflicting Web value', () => {
  const s = source();
  validateSource(s, {materialWebCommit: 'web'});
  s.decisions[0].chosen = 'web';
  assert.throws(
    () => validateSource(s, {materialWebCommit: 'web'}),
    /Figma must win/,
  );
  s.decisions[0].chosen = 'figma';
  s.scenarios[0].tolerance = {changedPixels: 1, maxChannelDelta: 1};
  assert.throws(
    () => validateSource(s, {materialWebCommit: 'web'}),
    /reviewed exception/,
  );
  s.scenarios[0].tolerance.approvalReference = 'actual reviewed exception';
  s.scenarios[0].tolerance.reason = 'Documented text antialiasing';
  validateSource(s, {materialWebCommit: 'web'});
});
test('strict comparator catches a one-pixel change and dimension mismatch', () => {
  const a = {width: 1, height: 1, data: Buffer.from([1, 2, 3, 255])};
  assert.equal(pixels(a, a).changedPixels, 0);
  assert.equal(
    pixels(a, {...a, data: Buffer.from([2, 2, 3, 255])}).changedPixels,
    1,
  );
  assert.throws(() => pixels(a, {...a, width: 2}), /dimensions/);
});
test('stale receipts and implementation without visual review are rejected', () => {
  const p = {
    strategyId: 'v2',
    materialWebCommit: 'web',
    evidenceRequirements: ['source'],
  };
  const t = {...task('x'), Layer: 'Component'};
  const r = {
    strategyId: 'v2',
    materialWebCommit: 'web',
    taskId: 'x',
    revision: 'head',
    checks: {source: {result: 'Pass', evidence: ['node.json']}},
    qaChecks: Object.fromEntries(
      [
        'states',
        'keyboard',
        'theme',
        'responsive',
        'motion',
        'accessibility',
      ].map(k => [k, {result: 'Pass', reason: 'Checked'}]),
    ),
    reviewKind: 'document',
  };
  assert.throws(() => validateReceipt(r, p, t, 'head'), /visual review/);
  r.reviewKind = 'visual';
  r.preview = 'http://localhost:6006';
  r.sourceDecision = 'source.json';
  r.sourceDecisionSha256 = 'a'.repeat(64);
  validateReceipt(r, p, t, 'head');
  r.revision = 'old';
  assert.throws(() => validateReceipt(r, p, t, 'head'), /stale/);
});
test('source documents can evidence native-only N/A checks without weakening component gates', () => {
  const p = {
    strategyId: 'v2',
    materialWebCommit: 'web',
    evidenceRequirements: ['source', 'native-boundary'],
  };
  const receipt = {
    strategyId: 'v2',
    materialWebCommit: 'web',
    taskId: 'source',
    revision: 'head',
    checks: {
      source: {result: 'Pass', evidence: ['source.json']},
      'native-boundary': {
        result: 'N/A',
        reason: 'No native implementation in a source decision task',
        evidence: ['contract.md'],
      },
    },
    qaChecks: Object.fromEntries(
      [
        'states',
        'keyboard',
        'theme',
        'responsive',
        'motion',
        'accessibility',
      ].map(key => [key, {result: 'N/A', reason: 'Source task only'}]),
    ),
    reviewKind: 'document',
  };
  validateReceipt(receipt, p, {...task('source'), Layer: 'Source'}, 'head');
  assert.throws(
    () =>
      validateReceipt(
        {...receipt, taskId: 'component', reviewKind: 'visual'},
        p,
        {...task('component'), Layer: 'Component'},
        'head',
      ),
    /Missing evidence: native-boundary/,
  );
  receipt.checks['native-boundary'].reason = '';
  assert.throws(
    () =>
      validateReceipt(receipt, p, {...task('source'), Layer: 'Source'}, 'head'),
    /Missing evidence: native-boundary/,
  );
});
test('approval never substitutes for merge, CI and worktree cleanup', () => {
  const pr = {
    state: 'OPEN',
    headRefOid: 'head',
    mergeCommit: {oid: 'merge'},
    baseRefName: 'main',
    statusCheckRollup: [{status: 'COMPLETED', conclusion: 'SUCCESS'}],
  };
  const t = {'Verified SHA': 'head', Worktree: '/tmp/task'};
  assert.throws(() => validateMerge(pr, t, '', true), /merged/);
  pr.state = 'MERGED';
  assert.throws(
    () => validateMerge(pr, t, 'worktree /tmp/task\nHEAD head\n', true),
    /worktree/,
  );
  pr.statusCheckRollup[0].conclusion = 'FAILURE';
  assert.throws(() => validateMerge(pr, t, '', true), /failing/);
  pr.statusCheckRollup[0].conclusion = 'SUCCESS';
  validateMerge(pr, t, '', true);
});
test('evidence rejects path escape including symlinks', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'm3-evidence-'));
  try {
    await fs.writeFile(path.join(root, 'good'), 'test');
    assert.equal(
      await fileAt(root, 'good'),
      await fs.realpath(path.join(root, 'good')),
    );
    await assert.rejects(fileAt(root, '../outside'), /relative/);
    await fs.symlink('/etc/hosts', path.join(root, 'escape'));
    await assert.rejects(fileAt(root, 'escape'), /escapes/);
  } finally {
    await fs.rm(root, {recursive: true, force: true});
  }
});
test('header-addressed updates survive reordered columns', () => {
  const values = [
    ['Status', 'Task ID'],
    ['Backlog', 'task'],
  ];
  const wb = {
    worksheets: {
      getItem: () => ({
        getUsedRange: () => ({values, getRow: () => ({values: [values[0]]})}),
        getRangeByIndexes: (r, c) => ({
          set values(v) {
            values[r][c] = v[0][0];
          },
        }),
      }),
    },
  };
  const row = table(wb, 'Tasks')[0];
  assert.equal(row['Task ID'], 'task');
  write(wb, 'Tasks', 2, {Status: 'Claimed'});
  assert.equal(values[1][0], 'Claimed');
  assert.throws(() => write(wb, 'Tasks', 2, {Nonexistent: 'x'}), /Missing/);
});
test('presentation preserves sheet identity and keeps six working tabs visible', () => {
  const names = ['Reference', ...visible];
  const xml = `<workbook><bookViews><workbookView activeTab="6"/></bookViews><sheets>${names.map((name, i) => `<sheet name="${name}" sheetId="${i + 1}" r:id="r${i + 1}"/>`).join('')}</sheets><definedNames><definedName localSheetId="0">x</definedName></definedNames></workbook>`;
  const result = presentXML(xml);
  assert.equal((result.match(/state="visible"/g) || []).length, 6);
  assert.match(result, /name="Reference" sheetId="1" r:id="r1" state="hidden"/);
  assert.match(result, /localSheetId="6"/);
});
test('manifest names executable commands and parser rejects unknown options', () => {
  for (const c of commands)
    assert.equal(parse(c.name.split(' ')).command, c.name);
  assert.throws(() => parse(['task', 'pop', '--mystery']), /Unknown option/);
  assert.equal(
    parse(['task', 'qa', 'M3-CMP-001', 'approve', '--reference', 'human'])
      .decision,
    'approve',
  );
});

test('presentation handles namespace-qualified Artifact workbook XML', () => {
  const xml = `<x:workbook><x:sheets>${visible.map((name, i) => `<x:sheet name="${name}" sheetId="${i + 1}" />`).join('')}</x:sheets></x:workbook>`;
  assert.equal((presentXML(xml).match(/state="visible"/g) || []).length, 6);
});

test('motion cannot pass with endpoints, an unwatched poster, or a missing reduced-motion case', () => {
  const policy = {
    motionScenarios: [
      'enter',
      'exit',
      'interruption',
      'reversal',
      'reduced-motion',
    ],
  };
  const source = {
    motion: {applicable: true, reference: 'reference.webm', sha256: 'hash'},
    scenarios: [{timeMs: 0}, {timeMs: 120}, {timeMs: 240}],
  };
  const motion = {
    applicable: true,
    reference: 'reference.webm',
    referenceSha256: 'hash',
    actualRecording: 'actual.webm',
    watchedBy: 'reviewer',
    watchedAt: 'now',
    contactSheet: 'frames.png',
    observations: [
      {timeMs: 0, note: 'begin'},
      {timeMs: 120, note: 'shape changes'},
      {timeMs: 240, note: 'settles'},
    ],
    scenarios: Object.fromEntries(
      policy.motionScenarios.map(k => [
        k,
        {
          result: 'Pass',
          reason: 'Observed and tested',
          evidence: 'timing.json',
        },
      ]),
    ),
  };
  validateMotion(source, motion, policy);
  delete motion.scenarios['reduced-motion'];
  assert.throws(() => validateMotion(source, motion, policy), /reduced-motion/);
  motion.scenarios['reduced-motion'] = {
    result: 'Pass',
    reason: 'No nonessential movement',
    evidence: 'reduced.json',
  };
  source.scenarios.splice(1, 1);
  assert.throws(() => validateMotion(source, motion, policy), /intermediate/);
  source.scenarios.push({timeMs: 120});
  source.motion.reference = motion.reference = 'poster.png';
  assert.throws(() => validateMotion(source, motion, policy), /poster/);
});

test('motion inspection reports actual decoded timestamps and rejects invented frames', () => {
  assert.deepEqual(
    selectFrames([0, 115, 240], [0, 40, 80, 120, 160, 200, 240]).map(
      f => f.actualTimeMs,
    ),
    [0, 120, 240],
  );
  assert.throws(() => selectFrames([0, 100], [0, 40, 80, 120]), /3–12/);
  assert.throws(() => selectFrames([0, 100, 999], [0, 40, 80, 120]), /exceeds/);
});
