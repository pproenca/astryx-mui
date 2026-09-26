import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  assertTaskGate,
  assertMappings,
  blockers,
  validateGraph,
  validateReceipt,
} from './material3-migration-loop.mjs';

const task = (id, status) => [id, '', '', '', 1, status];
test('new hard prerequisites block an already claimed component', () => {
  const rows = [task('native-foundation', 'Backlog'), task('badge', 'Claimed')];
  const edges = [['native-foundation', 'badge', 'Hard']];
  assert.deepEqual(blockers('badge', rows, edges), ['native-foundation']);
  assert.throws(
    () => assertTaskGate('badge', rows, edges, 'Claimed'),
    /blocked by native-foundation/,
  );
  rows[0][5] = 'Closed';
  assert.equal(assertTaskGate('badge', rows, edges, 'Claimed')[0], 'badge');
});
test('a stale approval or superseded pilot cannot close native work', () => {
  const rows = [
    task('old-pilot', 'Superseded'),
    task('new-pilot', 'Awaiting QA'),
  ];
  assert.throws(
    () =>
      assertTaskGate(
        'new-pilot',
        rows,
        [['old-pilot', 'new-pilot', 'Hard']],
        'Awaiting QA',
      ),
    /blocked/,
  );
  assert.throws(
    () => assertTaskGate('old-pilot', rows, [], 'Awaiting QA'),
    /must be Awaiting QA/,
  );
});
test('unknown dependencies and cycles fail before claiming', () => {
  const rows = [task('a', 'Backlog'), task('b', 'Backlog')];
  assert.throws(
    () => validateGraph(rows, [['missing', 'a', 'Hard']]),
    /Unknown dependency/,
  );
  assert.throws(
    () =>
      validateGraph(rows, [
        ['a', 'b', 'Hard'],
        ['b', 'a', 'Hard'],
      ]),
    /cycle/,
  );
});
test('receipts require native, exact-revision and complete evidence', () => {
  const policy = {
    strategyId: 'native-v1',
    materialWebCommit: 'source',
    evidenceRequirements: ['token-contract', 'native-boundary'],
  };
  const receipt = {
    strategyId: 'native-v1',
    taskId: 'task',
    revision: 'sha',
    materialWebCommit: 'source',
    reviewKind: 'visual',
    preview: 'http://localhost:6006',
    checks: Object.fromEntries(
      policy.evidenceRequirements.map(key => [
        key,
        {result: 'Pass', evidence: ['tests/evidence.json']},
      ]),
    ),
    qaChecks: Object.fromEntries(
      [
        'states',
        'keyboard',
        'theme',
        'responsive',
        'motion',
        'accessibility',
      ].map(key => [
        key,
        {result: 'Pass', reason: 'Verified by the task recipe'},
      ]),
    ),
  };
  validateReceipt(receipt, policy, 'task', 'sha');
  assert.throws(
    () => validateReceipt({...receipt, revision: 'old'}, policy, 'task', 'sha'),
    /exact code revision/,
  );
  assert.throws(
    () =>
      validateReceipt(
        {...receipt, strategyId: 'legacy'},
        policy,
        'task',
        'sha',
      ),
    /active strategy/,
  );
  assert.throws(
    () => validateReceipt({...receipt, checks: {}}, policy, 'task', 'sha'),
    /Missing native evidence/,
  );
  assert.throws(
    () =>
      validateReceipt(
        {
          ...receipt,
          checks: {
            ...receipt.checks,
            'native-boundary': {result: 'Pass', evidence: ['../outside']},
          },
        },
        policy,
        'task',
        'sha',
      ),
    /Missing native evidence/,
  );
  assert.throws(
    () => validateReceipt({...receipt, preview: ''}, policy, 'task', 'sha'),
    /interactive preview/,
  );
});

test('foundation token coverage cannot omit native evidence', () => {
  const token = Array(15).fill('');
  token[0] = 'TM-00001';
  token[5] = 'Pass';
  token[6] = 'tests/source-receipt.json';
  token[13] = 'native-v1';
  const sheets = {
    'Component mapping': [],
    'Acceptance checks': [],
    'Token mapping': [token],
  };
  const wb = {
    worksheets: {
      getItem: name => ({
        getUsedRange: () => ({values: [[], ...sheets[name]]}),
      }),
    },
  };
  const foundation = [
    'native-foundation',
    '',
    '',
    'Foundation',
    1,
    'Claimed',
    '',
    '',
  ];
  const policy = {strategyId: 'native-v1'};
  assert.throws(() => assertMappings(wb, foundation, policy), /tokenIds/);
  assert.deepEqual(
    assertMappings(wb, foundation, policy, {tokenIds: ['TM-00001']}),
    {ids: [], tokenIds: ['TM-00001']},
  );
  token[13] = 'Legacy bridge';
  assert.throws(
    () => assertMappings(wb, foundation, policy, {tokenIds: ['TM-00001']}),
    /Missing native token evidence/,
  );
});
