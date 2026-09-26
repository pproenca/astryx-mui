// Copyright (c) Meta Platforms, Inc. and affiliates.
import {test} from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  captureAttempt,
  feedback,
  readAttempt,
  recordLesson,
  attemptDetails,
} from '../feedback.mjs';
import {exec} from '../workflow.mjs';
import {parse} from '../cli.mjs';
const metadata = {
  taskId: 'M3-SRC-001',
  command: 'task verify',
  revision: 'fixed',
  procedureSha256: 'procedure',
  sourcePins: {compose: 'pin'},
};
async function fixture(run) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'm3-feedback-'));
  try {
    await run(dir);
  } finally {
    await fs.rm(dir, {recursive: true, force: true});
  }
}
test('failed verifier output is retained and a successful retry cannot overwrite it', () =>
  fixture(async dir => {
    let failed;
    await assert.rejects(
      captureAttempt(dir, metadata, async () => {
        attemptDetails({preparationSha256: 'packet'});
        exec(dir, process.execPath, [
          '-e',
          'console.error("missing fixture");process.exit(3)',
        ]);
      }),
      e => {
        failed = e.attemptId;
        return /missing fixture/.test(e.message);
      },
    );
    const before = await readAttempt(dir, failed);
    assert.equal(before.outcome, 'failed');
    assert.equal(before.preparationSha256, 'packet');
    assert.equal(
      await fs.readFile(
        path.join(dir, 'attempts', failed, 'command-1.stderr.txt'),
        'utf8',
      ),
      'missing fixture\n',
    );
    const retry = await captureAttempt(dir, metadata, async () => {
      exec(dir, process.execPath, [
        '-e',
        'console.log("ok");console.error("warning")',
      ]);
      return {type: 'task.verified', data: {taskId: metadata.taskId}};
    });
    assert.notEqual(retry.data.attemptId, failed);
    assert.equal(
      await fs.readFile(
        path.join(
          dir,
          'attempts',
          retry.data.attemptId,
          'command-1.stderr.txt',
        ),
        'utf8',
      ),
      'warning\n',
    );
    assert.deepEqual(await readAttempt(dir, failed), before);
    assert.deepEqual((await feedback(dir)).outcomes, {
      passed: 1,
      failed: 1,
      rejected: 0,
      incomplete: 0,
    });
  }));
test('transaction/export failures are recorded as failures, not verified outcomes', () =>
  fixture(async dir => {
    await assert.rejects(
      captureAttempt(dir, metadata, async () => {
        throw new Error('Workbook changed outside this transaction');
      }),
      /Workbook changed/,
    );
    assert.equal((await feedback(dir)).outcomes.failed, 1);
  }));
test('human rejection remains distinct from command failure', () =>
  fixture(async dir => {
    await captureAttempt(dir, {...metadata, command: 'task qa'}, async () => ({
      type: 'task.rejected',
      data: {},
    }));
    const result = await feedback(dir);
    assert.equal(result.outcomes.rejected, 1);
    assert.equal(result.outcomes.failed, 0);
  }));
test('crashed attempts stay incomplete and cannot substantiate a lesson', () =>
  fixture(async dir => {
    await fs.mkdir(path.join(dir, 'attempts', 'interrupted'), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(dir, 'attempts', 'interrupted', 'start.json'),
      JSON.stringify({
        ...metadata,
        id: 'interrupted',
        startedAt: new Date().toISOString(),
      }),
    );
    assert.equal((await feedback(dir)).outcomes.incomplete, 1);
    await assert.rejects(
      recordLesson(dir, {
        schemaVersion: 1,
        id: 'lesson',
        summary: 'Failure',
        cause: 'Observed cause',
        action: 'Check fixture',
        taskIds: ['M3-SRC-001'],
        attemptIds: ['interrupted'],
      }),
      /Incomplete/,
    );
  }));
test('feedback samples are bounded and lesson updates preserve rejected interventions', () =>
  fixture(async dir => {
    const ids = [];
    for (let i = 0; i < 10; i++) {
      try {
        const r = await captureAttempt(dir, metadata, async () => {
          if (i < 6) throw new Error('missing fixture');
          return {type: 'task.verified', data: {}};
        });
        ids.push(r.data.attemptId);
      } catch (e) {
        ids.push(e.attemptId);
      }
    }
    const note = {
      schemaVersion: 1,
      id: 'fixture',
      summary: 'Missing fixture repeats',
      cause: 'Fixture absent',
      action: 'Prepare fixture once',
      taskIds: ['M3-SRC-001'],
      attemptIds: [ids[0], ids[6]],
      intervention: {
        changeReference: 'reviewed diff',
        before: ids[0],
        after: ids[6],
        decision: 'rejected',
        reason: 'One success does not prove a general fix',
      },
    };
    const a = await recordLesson(dir, note);
    const b = await recordLesson(dir, note);
    assert.equal(a.version, b.version);
    await recordLesson(dir, {...note, summary: 'Narrow fixture diagnosis'});
    assert.equal(
      (await fs.readdir(path.join(dir, 'lessons', 'fixture'))).length,
      2,
    );
    const report = await feedback(dir);
    assert.equal(report.sample.length, 8);
    assert.equal(report.recurring[0].count, 6);
    assert.equal(report.lessons.length, 1);
    assert.equal((await feedback(dir, 'M3-SRC-002')).lessons.length, 0);
    await assert.rejects(
      recordLesson(dir, {...note, attemptIds: ['../escape']}),
      /Invalid attempt/,
    );
  }));
test('finalization failure after success never asks the caller to retry the mutation', () =>
  fixture(async dir => {
    let runs = 0;
    const result = await captureAttempt(dir, metadata, async () => {
      runs++;
      const [id] = await fs.readdir(path.join(dir, 'attempts'));
      await fs.mkdir(path.join(dir, 'attempts', id, 'finish.json'));
      return {type: 'task.verified', data: {}};
    });
    assert.equal(runs, 1);
    assert.equal(result.type, 'task.verified');
    assert.match(result.data.feedbackWarning, /Action completed/);
  }));
test('feedback commands are parsed independently of workbook task IDs', () => {
  assert.equal(parse(['feedback']).command, 'feedback');
  assert.equal(parse(['feedback', 'show', 'abc']).command, 'feedback show');
  assert.equal(
    parse(['feedback', 'record', '--file', 'lesson.json']).flags.file,
    'lesson.json',
  );
});
