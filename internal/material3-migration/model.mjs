// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Workbook tables; pinned migration policy.
 * @output Dependency priorities, explicit token membership and deduplicated family source briefs.
 * @position Temporary migration domain; no product package imports this module.
 */
import {sourcePlan} from './routing.mjs';
export const sheets = {
  tasks: 'Tasks',
  edges: 'Dependencies',
  components: 'Component mapping',
  tokens: 'Token mapping',
  checks: 'Acceptance checks',
  reviews: 'QA reviews',
};
export function table(wb, name) {
  const [headers, ...rows] = wb.worksheets.getItem(name).getUsedRange().values;
  if (
    !headers ||
    new Set(headers.filter(Boolean)).size !== headers.filter(Boolean).length
  )
    throw new Error(`Invalid headers: ${name}`);
  return rows
    .map((row, index) =>
      Object.assign(
        Object.fromEntries(headers.map((key, i) => [key, row[i] ?? ''])),
        {_row: index + 2},
      ),
    )
    .filter(row => headers.some(key => row[key] !== ''));
}
export function write(wb, name, row, fields) {
  const sheet = wb.worksheets.getItem(name),
    headers = sheet.getUsedRange().getRow(0).values[0];
  for (const [key, value] of Object.entries(fields)) {
    const column = headers.indexOf(key);
    if (column < 0) throw new Error(`Missing ${name} column: ${key}`);
    sheet.getRangeByIndexes(row - 1, column, 1, 1).values = [[value]];
  }
}
export const meta = wb =>
  Object.fromEntries(
    wb.worksheets
      .getItem('Overview')
      .getUsedRange()
      .values.filter(r => r[0]),
  );
export function ids(text, prefix = 'CM') {
  const s = String(text || ''),
    result = new Set();
  const pattern = new RegExp(
    `${prefix}-(\\d+)(?:\\s+to\\s+${prefix}-(\\d+))?`,
    'g',
  );
  for (const match of s.matchAll(pattern)) {
    const start = Number(match[1]),
      end = Number(match[2] || match[1]);
    if (end < start || end - start > 10000)
      throw new Error('Invalid mapping range');
    for (let n = start; n <= end; n++)
      result.add(`${prefix}-${String(n).padStart(match[1].length, '0')}`);
  }
  return [...result];
}
export function graph(tasks, edges) {
  const byId = new Map(tasks.map(t => [t['Task ID'], t]));
  if (byId.size !== tasks.length) throw new Error('Duplicate task IDs');
  const visiting = new Set(),
    visited = new Set();
  for (const e of edges)
    if (!byId.has(e.Predecessor) || !byId.has(e.Successor))
      throw new Error('Unknown dependency');
  function visit(id) {
    if (visiting.has(id)) throw new Error(`Dependency cycle: ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const e of edges.filter(e => e.Successor === id && e.Kind === 'Hard'))
      visit(e.Predecessor);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of byId.keys()) visit(id);
  return byId;
}
export function blocked(task, tasks, edges) {
  return edges
    .filter(e => e.Successor === task['Task ID'] && e.Kind === 'Hard')
    .map(e => e.Predecessor)
    .filter(id => tasks.find(t => t['Task ID'] === id)?.Status !== 'Closed');
}
export function ready(tasks, edges) {
  graph(tasks, edges);
  const rank = t => (t.Phase === 'Foundation' ? 0 : 1);
  const open = new Set(
    tasks.filter(t => t.Status !== 'Closed').map(t => t['Task ID']),
  );
  const unlocks = t =>
    new Set(
      edges
        .filter(
          e =>
            e.Kind === 'Hard' &&
            e.Predecessor === t['Task ID'] &&
            open.has(e.Successor),
        )
        .map(e => e.Successor),
    ).size;
  return tasks
    .filter(
      t =>
        ['Backlog', 'Ready', 'Blocked'].includes(t.Status) &&
        !t['Hold reason'] &&
        !blocked(t, tasks, edges).length,
    )
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        unlocks(b) - unlocks(a) ||
        Number(a.Priority) - Number(b.Priority) ||
        a['Task ID'].localeCompare(b['Task ID']),
    );
}
export function getTask(wb, id, expected) {
  const tasks = table(wb, sheets.tasks),
    edges = table(wb, sheets.edges);
  graph(tasks, edges);
  const task = tasks.find(t => t['Task ID'] === id);
  if (!task) throw new Error(`Unknown task: ${id}`);
  if (expected) {
    const blockers = blocked(task, tasks, edges);
    if (blockers.length) throw new Error(`Blocked by ${blockers.join(', ')}`);
    if (!expected.includes(task.Status))
      throw new Error(
        `Expected ${expected.join('/')} but ${id} is ${task.Status}`,
      );
  }
  return task;
}
export function brief(wb, id, full = false) {
  const task = getTask(wb, id),
    mapIds = ids(task['Mapping IDs']);
  const mappings = table(wb, sheets.components).filter(m =>
    mapIds.includes(m['Map ID']),
  );
  const checks = table(wb, sheets.checks).filter(c =>
    mapIds.includes(c['Map ID']),
  );
  const figmaIds = new Set(
    mappings.flatMap(m =>
      String(m['Figma nodes'])
        .split(/[,;]\s*/)
        .filter(Boolean),
    ),
  );
  const figma = table(wb, 'Design kit sets').filter(r =>
    figmaIds.has(r['Figma node ID']),
  );
  return {
    taskId: id,
    title: task.Title,
    status: task.Status,
    outcome: task.Notes,
    target: task.Target,
    phase: task.Phase,
    preparation: {
      file: task.Preparation || '',
      sha256: task['Preparation SHA256'] || '',
    },
    blockers: blocked(task, table(wb, sheets.tasks), table(wb, sheets.edges)),
    baseline:
      task['Source decision'] ||
      'Unresolved: reconcile sources before verification',
    sources: {
      webCommit: meta(wb)['Material Web'],
      composeCommit: meta(wb).AndroidX,
      baseline: meta(wb)['Baseline ID'],
      figmaSha256: meta(wb)['Figma SHA256'],
      guidance:
        'Reuse the selected family captures. Consult another source only for a named gap or changed input; motion still requires watched media.',
    },
    owners: [
      'AGENTS.md',
      'packages/themes/material3/material3.spec.md',
      'docs/README.md',
    ],
    sourceFamilies: sourcePlan(table(wb, sheets.components), mapIds, full),
    mappings: mappings.map(m => ({
      id: m['Map ID'],
      element: m['Material element'],
      ...(full
        ? {
            web: m['Material source'],
            guidance: m.Guideline,
            figmaNodes: m['Figma nodes'],
            composeFamilies: m['Compose families'],
          }
        : {}),
      coverage: m['Source coverage'],
      resolution: m['Source resolution'],
      nativeExport: m['Native export'],
      requiredVariants: m['Required variants'],
      ...(full
        ? {tokenIds: m['Token IDs']}
        : {tokenCount: ids(m['Token IDs'], 'TM').length}),
    })),
    ...(full
      ? {
          figma: figma.map(f => ({
            node: f['Figma node ID'],
            set: f['Component set'],
            axes: f['Variant axes'],
            values: f['Variant values'],
          })),
        }
      : {}),
    acceptance: {
      count: checks.length,
      open: checks.filter(c => c.Gate !== 'Ready').length,
      dimensions: [...new Set(checks.map(c => c.Dimension))],
      ...(full ? {checks} : {}),
    },
    review: [
      'Compare native and selected reference at identical viewport, DPR, fonts, theme, content and state.',
      'Watch source GIF/video and native motion at normal speed, then inspect aligned frames.',
      'Try interruption, reversal, reduced motion, keyboard, RTL and narrow layouts.',
    ],
    next: [task.Preparation ? `task verify ${id}` : `task prepare ${id}`],
  };
}
export function requireMappings(wb, task, policy, receipt) {
  const components = table(wb, sheets.components),
    checks = table(wb, sheets.checks),
    tokens = table(wb, sheets.tokens);
  const tokenIds = new Set(receipt.tokenIds || []),
    mapIds = ids(task['Mapping IDs']);
  if (task.Layer === 'Foundation' && !tokenIds.size)
    throw new Error('Foundation receipt must identify tokenIds');
  for (const id of mapIds) {
    const m = components.find(m => m['Map ID'] === id);
    if (!m) throw new Error(`Missing mapping ${id}`);
    // Extension classification is a planning outcome; it cannot mark a component migrated.
    if (task.Phase === 'Extension') continue;
    if (
      m.Contract !== policy.strategyId ||
      !String(m['Native export']).startsWith(policy.nativePackage + '/') ||
      (policy.schemaVersion >= 3 &&
        !String(m['Native source']).startsWith(policy.nativeRoot + '/')) ||
      m['Source resolution'] !== 'Resolved'
    )
      throw new Error(`Unresolved native/source contract: ${id}`);
    const acceptance = checks.filter(c => c['Map ID'] === id);
    if (!acceptance.length || acceptance.some(c => c.Gate !== 'Ready'))
      throw new Error(`Incomplete acceptance: ${id}`);
    for (const [name] of policy.nativeAcceptance)
      if (
        !acceptance.some(
          c => c.Scenario === name && c.Result === 'Pass' && c.Evidence,
        )
      )
        throw new Error(`Missing native check ${id}: ${name}`);
    if (
      m.Relationship !== 'Confirmed' ||
      m.Blocker ||
      m['Token gate'] !== 'Pass' ||
      !m['Token evidence']
    )
      throw new Error(`Unresolved mapping/token evidence ${id}`);
    const explicit = ids(m['Token IDs'], 'TM');
    const prefixes = String(m['Token filter'] || '')
      .split(/[,;]/)
      .map(s => s.trim().replace(/\*$/, ''))
      .filter(Boolean);
    if (prefixes.some(s => !/^--md-[a-z0-9-]+$/.test(s)))
      throw new Error('Use Material CSS token prefixes without prose');
    const matched = tokens.filter(
      t =>
        explicit.includes(t['Map ID']) ||
        prefixes.some(p => String(t['Material token']).startsWith(p)),
    );
    if (explicit.some(id => !tokens.some(t => t['Map ID'] === id)))
      throw new Error(`Unknown explicit token membership: ${id}`);
    if (!matched.length) throw new Error(`No tokens match ${id}`);
    for (const t of matched) tokenIds.add(t['Map ID']);
  }
  for (const id of tokenIds) {
    const t = tokens.find(t => t['Map ID'] === id);
    if (
      !t ||
      t.Contract !== policy.strategyId ||
      t.Verification !== 'Pass' ||
      !t.Evidence
    )
      throw new Error(`Missing native token evidence ${id}`);
  }
  return {
    mapIds: task.Phase === 'Extension' ? [] : mapIds,
    tokenIds: [...tokenIds],
  };
}
