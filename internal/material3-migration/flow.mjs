// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Existing task states and timestamps. @output Dependency priorities and measured stage elapsed time. @position Disposable scheduling; no invented historical timings. */
import {write, sheets, blocked} from './model.mjs';
export const documentLayers = [
  'Source',
  'Architecture',
  'Planning',
  'Review',
  'Extension planning',
];
export const stageFields = {
  Claimed: 'Implementation ms',
  'Awaiting QA': 'QA wait ms',
  Approved: 'Merge wait ms',
  Blocked: 'Blocked ms',
};
export const excelTime = ms => ms / 86400000 + 25569;
export function milliseconds(value) {
  if (typeof value === 'number') return (value - 25569) * 86400000;
  return value ? Date.parse(value) : NaN;
}
export function transition(wb, task, status, fields = {}, now = Date.now()) {
  const since = milliseconds(task['Stage entered at']),
    stage = stageFields[task.Status];
  const measured =
    stage && Number.isFinite(since)
      ? {[stage]: Number(task[stage] || 0) + Math.max(0, now - since)}
      : {};
  write(wb, sheets.tasks, task._row, {
    ...measured,
    ...fields,
    Status: status,
    'Stage entered at': excelTime(now),
  });
}
export function flowMetrics(tasks, now = Date.now(), edges = []) {
  const stages = Object.fromEntries(
    Object.values(stageFields).map(f => [f, 0]),
  );
  let measuredTasks = 0;
  const queue = [];
  for (const task of tasks) {
    const since = milliseconds(task['Stage entered at']);
    if (!Number.isFinite(since)) continue;
    measuredTasks++;
    for (const field of Object.keys(stages))
      stages[field] += Number(task[field] || 0);
    const ageMs = Math.max(0, now - since),
      field = stageFields[task.Status];
    if (field) stages[field] += ageMs;
    if (field)
      queue.push({
        id: task['Task ID'],
        status: task.Status,
        ageMs,
        reason: task['Hold reason'] || blocked(task, tasks, edges).join(', '),
      });
  }
  const completed = tasks.filter(
    t => t.Status === 'Closed' && Number.isFinite(milliseconds(t['Closed at'])),
  );
  const cycleMs = completed
    .map(t => milliseconds(t['Closed at']) - milliseconds(t['Claimed at']))
    .filter(n => Number.isFinite(n) && n >= 0)
    .sort((a, b) => a - b);
  const middle = Math.floor(cycleMs.length / 2),
    medianCycleMs = cycleMs.length
      ? cycleMs.length % 2
        ? cycleMs[middle]
        : (cycleMs[middle - 1] + cycleMs[middle]) / 2
      : null;
  return {
    measuredTasks,
    stages,
    queue,
    closedLast7Days: completed.filter(
      t =>
        milliseconds(t['Closed at']) >= now - 7 * 86400000 &&
        milliseconds(t['Closed at']) <= now,
    ).length,
    cycleSamples: cycleMs.length,
    medianCycleMs,
    rejections: tasks.reduce((n, t) => n + Number(t['Rework count'] || 0), 0),
    note: 'Elapsed stage time since tracking began, not active working time. Earlier history is unmeasured.',
  };
}
