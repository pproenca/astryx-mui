// Copyright (c) Meta Platforms, Inc. and affiliates.

import {test} from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {compareTrace, measurePerformance} from '../measurements.mjs';
import {flowMetrics, excelTime, transition} from '../flow.mjs';
import {ready} from '../model.mjs';
import {digest, loadCompose, declarations} from '../compose.mjs';
import {preparationInputs, preparationStatus} from '../preparation.mjs';
import {coveragePlan} from '../audit.mjs';
import {scopeMembers} from '../upgrade.mjs';
import {validateSource} from '../evidence.mjs';

test('token extraction retains typed getters and multiline shape expressions', () => {
  const values = declarations(
    'internal object Tokens {\n    inline val Color: ColorToken\n        get() = ColorSchemeKeyTokens.Primary\n\n    const val Opacity = 0.38f\n    val Shape =\n        RoundedCornerShape(\n            topStart = 8.dp,\n            topEnd = 8.dp\n        )\n}\n',
  );
  assert.equal(values.length, 3);
  assert.deepEqual(values[0], {
    name: 'Color',
    expression: 'ColorSchemeKeyTokens.Primary',
    line: 2,
  });
  assert.equal(values[1].expression, '0.38f');
  assert.match(values[2].expression, /topStart = 8.dp/);
  assert.equal(values[2].expression.endsWith(')'), true);
});

function workbook(tables) {
  const sheets = Object.fromEntries(
    Object.entries(tables).map(([name, rows]) => {
      const headers = [...new Set(rows.flatMap(r => Object.keys(r)))];
      const values = [headers, ...rows.map(r => headers.map(h => r[h] ?? ''))];
      return [
        name,
        {
          getUsedRange: () => ({values, getRow: () => ({values: [values[0]]})}),
          getRangeByIndexes: (r, c) => ({
            set values(v) {
              values[r][c] = v[0][0];
            },
          }),
        },
      ];
    }),
  );
  return {worksheets: {getItem: name => sheets[name]}};
}
const trace = () => ({
  producer: {
    kind: 'upstream',
    commit: 'pin',
    source: 'SpringSimulation.kt',
    command: 'upstream-test',
    runtime: 'JVM pinned',
  },
  unit: 'px',
  inputs: {start: 0, target: 10, interruptionMs: 100},
  settledAtMs: 200,
  samples: [
    {timeMs: 0, position: 0, velocity: 0},
    {timeMs: 100, position: 7, velocity: 1},
    {timeMs: 200, position: 10, velocity: 0},
  ],
});
const spec = {
  unit: 'px',
  approvalReference: 'review',
  positionTolerance: 0.1,
  velocityTolerance: 0.1,
  settlingToleranceMs: 2,
};
test('independent traces catch velocity, interruption, provenance and incomplete settling', () => {
  const reference = trace(),
    actual = {...trace(), producer: {kind: 'browser', command: 'capture'}};
  assert.equal(compareTrace(reference, actual, spec, 'pin').positionError, 0);
  actual.samples[1].velocity = 5;
  assert.throws(() => compareTrace(reference, actual, spec, 'pin'), /velocity/);
  actual.samples[1].velocity = 1;
  actual.inputs.interruptionMs = 120;
  assert.throws(() => compareTrace(reference, actual, spec, 'pin'), /inputs/);
  actual.inputs.interruptionMs = 100;
  assert.throws(
    () => compareTrace(reference, actual, spec, 'wrong'),
    /pinned upstream/,
  );
  actual.settledAtMs = 300;
  assert.throws(
    () => compareTrace(reference, actual, spec, 'pin'),
    /within the recording/,
  );
  actual.settledAtMs = 200;
  assert.throws(
    () =>
      compareTrace(
        {...reference, inputs: undefined},
        {...actual, inputs: undefined},
        spec,
        'pin',
      ),
    /inputs/,
  );
});
test('performance cannot pass with empty samples, an unbounded budget or another device', () => {
  const profile = {
    approvalReference: 'review',
    environment: {browser: 'Chromium pinned', device: 'device-a'},
    maxInputLatencyMs: 50,
    frameBudgetMs: 20,
    maxLongFrameRatio: 0.25,
    minInputSamples: 2,
    minFrameSamples: 4,
  };
  const run = {
    environment: profile.environment,
    inputLatencyMs: [10, 15],
    frameIntervalsMs: [16, 16, 16, 30],
  };
  assert.equal(measurePerformance(run, profile).longFrameRatio, 0.25);
  assert.throws(
    () => measurePerformance({...run, inputLatencyMs: []}, profile),
    /samples/,
  );
  assert.throws(
    () =>
      measurePerformance({...run, frameIntervalsMs: [16, 16, 30, 30]}, profile),
    /pacing/,
  );
  assert.throws(
    () => measurePerformance(run, {...profile, frameBudgetMs: Infinity}),
    /budgets/,
  );
  assert.throws(
    () =>
      measurePerformance(
        {...run, environment: {...profile.environment, device: 'device-b'}},
        profile,
      ),
    /profile/,
  );
});
test('source policy rejects duplicate case IDs and empty performance profile IDs', () => {
  const policy = {
    schemaVersion: 3,
    materialWebCommit: 'web',
    androidxCommit: 'compose',
    composeInventory: 'index.json',
    figmaSha256: 'a'.repeat(64),
    baselineId: 'baseline',
  };
  const s = {
    authority: 'figma-first',
    web: {commit: 'web'},
    figma: {sha256: policy.figmaSha256},
    baselineId: 'baseline',
    compose: {
      commit: 'compose',
      inventory: 'index.json',
      tests: [
        {id: 'x', source: 'upstream'},
        {id: 'x', source: 'other'},
      ],
    },
    performance: [{id: 'desktop'}],
  };
  assert.throws(() => validateSource(s, policy), /Map upstream/);
  s.performance = [{}];
  assert.throws(() => validateSource(s, policy), /performance profiles/);
});
test('shared blockers outrank easier isolated work regardless of Web overlap', () => {
  const tasks = [
    {
      'Task ID': 'expressive',
      Phase: 'Component',
      Priority: 50,
      Status: 'Backlog',
    },
    {
      'Task ID': 'web',
      Phase: 'Shared Web + Figma',
      Priority: 1,
      Status: 'Backlog',
    },
    {'Task ID': 'child', Status: 'Backlog'},
  ];
  assert.deepEqual(
    ready(tasks, [
      {Predecessor: 'expressive', Successor: 'child', Kind: 'Hard'},
    ]).map(t => t['Task ID']),
    ['expressive', 'web'],
  );
});
test('flow records elapsed stages without inventing historical time', () => {
  const now = Date.UTC(2026, 8, 26),
    t = {
      'Task ID': 'a',
      Status: 'Awaiting QA',
      'Stage entered at': excelTime(now - 60000),
      'QA wait ms': 1000,
      'Rework count': 1,
    };
  const wb = workbook({Tasks: [t]});
  transition(wb, {...t, _row: 2}, 'Claimed', {}, now);
  const values = wb.worksheets.getItem('Tasks').getUsedRange().values;
  assert.ok(Math.abs(values[1][values[0].indexOf('QA wait ms')] - 61000) < 1);
  const metrics = flowMetrics([t, {'Task ID': 'old', Status: 'Closed'}], now);
  assert.equal(metrics.measuredTasks, 1);
  assert.equal(metrics.closedLast7Days, 0);
  assert.equal(metrics.medianCycleMs, null);
  assert.equal(metrics.rejections, 1);
});
test('preparation invalidates changed token membership, baseline or referenced source bytes', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'm3-prepare-'));
  try {
    const task = {
      'Task ID': 't',
      Layer: 'Component',
      'Mapping IDs': 'CM-0001',
      'Source decision': 'baseline.json',
      Preparation: 'packet.json',
    };
    const rows = {
      'Component mapping': [{'Map ID': 'CM-0001', 'Token IDs': 'TM-00001'}],
      'Acceptance checks': [],
    };
    const wb = workbook(rows),
      policy = {strategyId: 'test'};
    await fs.writeFile(path.join(root, 'reference'), 'source');
    const packet = {
      baseline: 'baseline.json',
      scopeSha256: digest(JSON.stringify(preparationInputs(wb, task, policy))),
      files: {reference: digest('source')},
    };
    const bytes = JSON.stringify(packet);
    await fs.writeFile(path.join(root, 'packet.json'), bytes);
    task['Preparation SHA256'] = digest(bytes);
    assert.equal((await preparationStatus(wb, task, policy, root)).ready, true);
    task['Source decision'] = 'other.json';
    assert.match(
      (await preparationStatus(wb, task, policy, root)).reason,
      /baseline changed/,
    );
    task['Source decision'] = 'baseline.json';
    const changed = workbook({
      ...rows,
      'Component mapping': [{'Map ID': 'CM-0001', 'Token IDs': 'TM-00002'}],
    });
    assert.match(
      (await preparationStatus(changed, task, policy, root)).reason,
      /scope changed/,
    );
    await fs.writeFile(path.join(root, 'reference'), 'different');
    assert.match(
      (await preparationStatus(wb, task, policy, root)).reason,
      /reference changed/,
    );
  } finally {
    await fs.rm(root, {recursive: true, force: true});
  }
});
test('index loading rejects altered source data even with the correct commit', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'm3-index-'));
  try {
    const index = {commit: 'pin', families: []};
    const policy = {
      androidxCommit: 'pin',
      composeInventory: 'index.json',
      composeInventorySha256: digest(JSON.stringify(index)),
    };
    await fs.writeFile(path.join(root, 'index.json'), JSON.stringify(index));
    await loadCompose(root, policy);
    await fs.writeFile(
      path.join(root, 'index.json'),
      JSON.stringify({...index, families: [{id: 'invented'}]}),
    );
    await assert.rejects(loadCompose(root, policy), /index hash/);
  } finally {
    await fs.rm(root, {recursive: true, force: true});
  }
});
test('coverage fails on an unmapped reference, unapproved exclusion or deleted inventory member', () => {
  const data = {
    Tasks: [{'Task ID': 'foundation', Layer: 'Foundation', Contract: 'v3'}],
    'Component mapping': [],
    'Compose sources': [
      {
        ID: 'compose:Shape',
        'Source SHA256': 'hash',
        Disposition: 'Foundation',
        'Coverage task': 'foundation',
        Reason: 'Foundation owner',
      },
    ],
    'Design kit sets': [],
    'Material components': [],
    Overview: [],
  };
  const policy = {strategyId: 'v3'},
    index = {families: [{id: 'compose:Shape', sha256: 'hash'}]};
  data.Overview = [
    {
      Key: 'Scope inventory SHA256',
      Value: digest(JSON.stringify(scopeMembers(workbook(data)))),
    },
  ];
  assert.deepEqual(coveragePlan(workbook(data), policy, index), []);
  data['Compose sources'][0].Disposition = 'Required';
  assert.match(
    coveragePlan(workbook(data), policy, index).join(' '),
    /missing required native mapping/,
  );
  data['Compose sources'][0].Disposition = 'Excluded';
  assert.match(
    coveragePlan(workbook(data), policy, index).join(' '),
    /human approval/,
  );
  data['Compose sources'] = [];
  assert.match(
    coveragePlan(workbook(data), policy, index).join(' '),
    /membership changed/,
  );
});
test('coverage retains exact Figma variants and reverse native owner links', () => {
  const data = {
    Tasks: [],
    'Component mapping': [
      {'Map ID': 'CM-0001', Disposition: 'Required', 'Figma nodes': '7:9'},
    ],
    'Compose sources': [],
    'Design kit sets': [
      {
        'Figma node ID': '7:9',
        'Variant axes': 'State',
        'Variant values': 'State: Enabled, Pressed',
        Variants: 2,
        Properties: 'State',
        'Mapping IDs': 'CM-0001',
        Disposition: 'Required',
      },
    ],
    'Material components': [],
    Overview: [],
  };
  const policy = {strategyId: 'v3'},
    index = {families: []};
  data.Overview = [
    {
      Key: 'Scope inventory SHA256',
      Value: digest(JSON.stringify(scopeMembers(workbook(data)))),
    },
  ];
  assert.deepEqual(coveragePlan(workbook(data), policy, index), []);
  data['Component mapping'][0]['Figma nodes'] = '';
  assert.match(
    coveragePlan(workbook(data), policy, index).join(' '),
    /reverse Figma link/,
  );
  data['Component mapping'][0]['Figma nodes'] = '7:9';
  data['Design kit sets'][0]['Variant values'] = '';
  assert.match(
    coveragePlan(workbook(data), policy, index).join(' '),
    /variant inventory is incomplete/,
  );
});
