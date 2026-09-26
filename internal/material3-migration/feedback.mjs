// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Observable CLI attempts and evidence-linked lessons. @output Immutable local diagnostics and bounded feedback for the next slice. @position Disposable learning support; never task state or design authority. */
import fs from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import path from 'node:path';
import {AsyncLocalStorage} from 'node:async_hooks';
import {randomUUID, createHash} from 'node:crypto';
const context = new AsyncLocalStorage();
const hash = value => createHash('sha256').update(value).digest('hex');
const check = (ok, message) => {
  if (!ok) throw new Error(message);
};
const safeId = id => /^[a-zA-Z0-9][a-zA-Z0-9-]{0,100}$/.test(id || '');
const json = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const save = (file, value) =>
  fs.writeFile(file, JSON.stringify(value, null, 2) + '\n', {flag: 'wx'});
const list = async dir => {
  try {
    return await fs.readdir(dir);
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
};
export const trackedCommands = new Set([
  'task prepare',
  'task verify',
  'task qa',
]);
export function attemptDetails(details) {
  const current = context.getStore();
  if (current) Object.assign(current.details, details);
}

export async function procedureFingerprint(repo) {
  const root = 'internal/material3-migration';
  const files = (await fs.readdir(path.join(repo, root)))
    .filter(f => /\.(mjs|json)$/.test(f))
    .map(f => `${root}/${f}`);
  files.push(
    'AGENTS.md',
    'docs/contributing/material3-migration.md',
    `${root}/README.md`,
    'packages/themes/material3/material3.spec.md',
  );
  const entries = await Promise.all(
    files
      .sort()
      .map(async f => [f, hash(await fs.readFile(path.join(repo, f)))]),
  );
  return hash(JSON.stringify(entries));
}

// Called by the existing synchronous command runner. No environment or model reasoning is captured.
export function commandEvidence(command, args, output) {
  const current = context.getStore();
  if (!current) return;
  const number = ++current.commands;
  const files = {};
  for (const name of ['stdout', 'stderr']) {
    const bytes = output[name] || '';
    const file = `command-${number}.${name}.txt`;
    writeFileSync(path.join(current.dir, file), bytes, {flag: 'wx'});
    files[name] = {file, sha256: hash(bytes)};
  }
  writeFileSync(
    path.join(current.dir, `command-${number}.json`),
    JSON.stringify(
      {
        command,
        args,
        status: output.status,
        signal: output.signal || null,
        ...files,
      },
      null,
      2,
    ),
    {flag: 'wx'},
  );
}

export async function captureAttempt(stateDir, metadata, action) {
  const id = randomUUID(),
    dir = path.join(stateDir, 'attempts', id);
  await fs.mkdir(dir, {recursive: true});
  const started = Date.now();
  await save(path.join(dir, 'start.json'), {
    schemaVersion: 1,
    id,
    ...metadata,
    startedAt: new Date(started).toISOString(),
  });
  const current = {dir, commands: 0, details: {}};
  let value, failure;
  try {
    value = await context.run(current, action);
  } catch (error) {
    failure = error;
  }
  const finish = {
    ...current.details,
    outcome: failure
      ? 'failed'
      : value?.type === 'task.rejected'
        ? 'rejected'
        : 'passed',
    durationMs: Date.now() - started,
    commands: current.commands,
    finishedAt: new Date().toISOString(),
    resultType: value?.type || null,
    ...(failure
      ? {error: {code: failure.code || null, message: failure.message}}
      : {}),
  };
  try {
    await save(path.join(dir, 'finish.json'), finish);
  } catch (error) {
    // A workbook transaction may already have committed. Never disguise it as a retryable failure.
    if (failure)
      failure.message += ` (attempt finalization failed: ${error.message})`;
    else
      return {
        ...value,
        data: {
          ...value.data,
          attemptId: id,
          feedbackWarning:
            'Action completed; attempt finalization failed. Inspect task state before any retry.',
        },
      };
  }
  if (failure) {
    failure.attemptId = id;
    throw failure;
  }
  return {...value, data: {...value.data, attemptId: id}};
}

export async function readAttempt(stateDir, id) {
  check(safeId(id), 'Invalid attempt ID');
  const dir = path.join(stateDir, 'attempts', id),
    start = await json(path.join(dir, 'start.json'));
  let finish;
  try {
    finish = await json(path.join(dir, 'finish.json'));
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    finish = {outcome: 'incomplete'};
  }
  return {...start, ...finish, diagnosticDirectory: dir};
}

export async function recordLesson(stateDir, input) {
  check(
    input.schemaVersion === 1 && safeId(input.id),
    'Lesson needs schemaVersion 1 and a stable ID',
  );
  for (const field of ['summary', 'cause', 'action'])
    check(
      typeof input[field] === 'string' &&
        input[field].trim() &&
        input[field].length <= 1500,
      `Lesson needs concise ${field}`,
    );
  check(
    Array.isArray(input.taskIds) &&
      input.taskIds.length &&
      input.taskIds.every(id => /^M3-[A-Z]+-\d+$/.test(id)),
    'Scope lessons to existing task IDs; no global rules',
  );
  check(
    Array.isArray(input.attemptIds) && input.attemptIds.length,
    'Lesson needs observed attempt evidence',
  );
  const evidence = await Promise.all(
    input.attemptIds.map(id => readAttempt(stateDir, id)),
  );
  check(
    evidence.every(a => a.outcome !== 'incomplete'),
    'Incomplete attempts cannot substantiate a lesson',
  );
  check(
    evidence.some(a => input.taskIds.includes(a.taskId)),
    'Lesson scope must include an evidenced task',
  );
  if (input.intervention) {
    const i = input.intervention;
    check(
      ['retained', 'rejected'].includes(i.decision) &&
        i.changeReference &&
        i.reason &&
        i.before &&
        i.after,
      'Intervention needs one change reference, before/after attempt IDs, decision and reason',
    );
    check(
      input.attemptIds.includes(i.before) &&
        input.attemptIds.includes(i.after) &&
        i.before !== i.after,
      'Before/after attempts must be distinct cited evidence',
    );
  }
  // Store only the defined fields. Lessons remain observations even when a change is retained.
  const note = {
    schemaVersion: 1,
    id: input.id,
    summary: input.summary,
    cause: input.cause,
    action: input.action,
    taskIds: [...new Set(input.taskIds)].sort(),
    attemptIds: [...new Set(input.attemptIds)].sort(),
    ...(input.intervention ? {intervention: input.intervention} : {}),
  };
  const bytes = JSON.stringify(note),
    version = hash(bytes);
  const dir = path.join(stateDir, 'lessons', input.id);
  await fs.mkdir(dir, {recursive: true});
  const target = path.join(dir, `${version}.json`);
  try {
    await save(target, {
      ...note,
      version,
      recordedAt: new Date().toISOString(),
    });
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
  }
  return {
    id: input.id,
    version,
    authority:
      'Observation only; adoption uses normal code review and frozen acceptance gates.',
  };
}

export async function feedback(stateDir, taskId) {
  const attempts = await Promise.all(
    (await list(path.join(stateDir, 'attempts')))
      .filter(safeId)
      .map(id => readAttempt(stateDir, id)),
  );
  const relevant = attempts
    .filter(a => !taskId || a.taskId === taskId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const notes = [];
  for (const id of (await list(path.join(stateDir, 'lessons'))).filter(
    safeId,
  )) {
    const dir = path.join(stateDir, 'lessons', id);
    const versions = await Promise.all(
      (await list(dir))
        .filter(f => /^[a-f0-9]{64}\.json$/.test(f))
        .map(f => json(path.join(dir, f))),
    );
    const latest = versions.sort((a, b) =>
      b.recordedAt.localeCompare(a.recordedAt),
    )[0];
    if (latest && (!taskId || latest.taskIds.includes(taskId)))
      notes.push(latest);
  }
  const groups = new Map();
  for (const a of relevant.filter(a => a.outcome === 'failed')) {
    const symptom = `${a.command}: ${a.error?.message || 'unknown failure'}`;
    const g = groups.get(symptom) || {symptom, count: 0, attemptIds: []};
    g.count++;
    if (g.attemptIds.length < 5) g.attemptIds.push(a.id);
    groups.set(symptom, g);
  }
  const sample = a => ({
    id: a.id,
    taskId: a.taskId,
    command: a.command,
    outcome: a.outcome,
    durationMs: a.durationMs,
    procedureSha256: a.procedureSha256,
  });
  return {
    attempts: relevant.length,
    outcomes: Object.fromEntries(
      ['passed', 'failed', 'rejected', 'incomplete'].map(s => [
        s,
        relevant.filter(a => a.outcome === s).length,
      ]),
    ),
    recurring: [...groups.values()]
      .filter(g => g.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    sample: [
      ...relevant
        .filter(a => ['failed', 'rejected'].includes(a.outcome))
        .slice(0, 5),
      ...relevant.filter(a => a.outcome === 'passed').slice(0, 3),
    ].map(sample),
    lessons: notes
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
      .slice(0, 5),
    note: 'Bounded diagnostic sample, not a success-rate estimate. Duration measures CLI elapsed time, not model effort. Lessons cannot change source authority, acceptance or task status.',
    next: [
      'feedback show <attempt-id>',
      'feedback record --file <lesson.json>',
    ],
  };
}
