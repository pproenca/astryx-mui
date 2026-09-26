/** @input Workbook, repository and task verifiers. @output Reviewable task transitions. @position Disposable migration workflow. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {
  table,
  write,
  meta,
  sheets,
  ready,
  getTask,
  brief,
  requireMappings,
} from './model.mjs';
import {hash} from './workbook.mjs';
import {fileAt, validateEvidence} from './evidence.mjs';
const home = path.dirname(fileURLToPath(import.meta.url));
export const policyFile = 'internal/material3-migration/policy.json';
export async function policy() {
  const text = await fs.readFile(path.join(home, 'policy.json'), 'utf8');
  return {value: JSON.parse(text), hash: hash(text)};
}
export function exec(repo, command, args) {
  return execFileSync(command, args, {
    cwd: repo,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 120000,
  }).trim();
}
function clean(repo) {
  if (exec(repo, 'git', ['status', '--porcelain', '--untracked-files=no']))
    throw new Error('Commit tracked changes before verification');
}
function checkPolicy(wb, p) {
  const m = meta(wb);
  if (
    m['Migration strategy'] !== p.value.strategyId ||
    m['Policy SHA256'] !== p.hash
  )
    throw new Error(
      'Workbook and CLI policy differ; reconcile before continuing',
    );
}
async function readReceipt(task, opts) {
  const file = path.resolve(
    opts.stateDir,
    path.basename(task['Receipt path'] || ''),
  );
  if (!task['Receipt path']) throw new Error('Missing stored receipt');
  return JSON.parse(await fs.readFile(file, 'utf8'));
}
function scope(wb, task) {
  const b = brief(wb, task['Task ID'], true);
  delete b.status;
  delete b.next;
  return hash(JSON.stringify(b));
}
function result(type, data, changed = false) {
  return {changed, type, data};
}
function markQA(wb, coverage, value) {
  for (const [name, key, ids] of [
    [sheets.components, 'Map ID', coverage.mapIds],
    [sheets.tokens, 'Map ID', coverage.tokenIds],
  ])
    for (const row of table(wb, name).filter(r => ids.includes(r[key])))
      write(wb, name, row._row, {'Native QA': value});
}
function addReview(wb, values) {
  const s = wb.worksheets.getItem(sheets.reviews),
    headers = s.getUsedRange().values[0];
  s.tables.items
    .find(t => t.name === 'MigrationQA')
    .rows.add(null, [headers.map(h => values[h] || '')]);
}
export function validateMerge(pr, task, worktrees, containsMerge) {
  if (
    pr.state !== 'MERGED' ||
    pr.headRefOid !== task['Verified SHA'] ||
    !pr.mergeCommit?.oid ||
    pr.baseRefName !== 'main' ||
    !containsMerge
  )
    throw new Error(
      'Verified PR head must be merged into main and available locally',
    );
  const checks = pr.statusCheckRollup || [];
  if (
    !checks.length ||
    checks.some(
      c =>
        (c.status && c.status !== 'COMPLETED') ||
        !['SUCCESS', 'NEUTRAL', 'SKIPPED'].includes(c.conclusion || c.state),
    )
  )
    throw new Error('PR checks are missing, pending or failing');
  if (task.Worktree && worktrees.includes(`worktree ${task.Worktree}\n`))
    throw new Error(
      'Remove the completed task worktree safely from another checkout, then run finish',
    );
}
export async function dispatch(wb, command, opts) {
  const p = await policy(),
    repo = opts.repo;
  checkPolicy(wb, p);
  const tasks = table(wb, sheets.tasks),
    edges = table(wb, sheets.edges);
  if (command === 'source') {
    if (
      !opts.query ||
      !Number.isInteger(opts.limit) ||
      opts.limit < 1 ||
      opts.limit > 50
    )
      throw new Error('Supply a query and --limit between 1 and 50');
    const query = opts.query.toLowerCase();
    const matches = [];
    for (const name of [
      'Design kit sets',
      'Design kit variables',
      'Design kit styles',
      'Material components',
      'Material tokens',
      'Material access',
    ])
      for (const row of table(wb, name)) {
        const values = Object.fromEntries(
          Object.entries(row).filter(([key]) => key !== '_row'),
        );
        if (
          Object.values(values).some(value =>
            String(value).toLowerCase().includes(query),
          )
        )
          matches.push({sheet: name, row: row._row, values});
      }
    return result('source.matches', {
      query: opts.query,
      matchCount: matches.length,
      results: matches.slice(0, opts.limit),
      hint: 'These are pinned source records, not approval or confirmed equivalence.',
      next: ['task show <id> --full'],
    });
  }
  if (command === 'status')
    return result('status', {
      strategy: p.value.strategyId,
      ready: ready(tasks, edges).map(t => ({
        id: t['Task ID'],
        title: t.Title,
        phase: t.Phase,
      })),
      active: tasks
        .filter(t =>
          ['Claimed', 'Awaiting QA', 'Approved', 'Blocked'].includes(t.Status),
        )
        .map(t => ({id: t['Task ID'], status: t.Status})),
      next: ['task pop'],
    });
  if (command === 'task show')
    return result('task.brief', brief(wb, opts.id, opts.full));
  if (command === 'task pop') {
    if (tasks.some(t => ['Claimed', 'Awaiting QA'].includes(t.Status)))
      throw new Error(
        'An active task is awaiting implementation or QA; finish or block it before claiming another',
      );
    const task = ready(tasks, edges)[0];
    if (!task)
      return result('task.empty', {
        message: 'No dependency-ready task',
        next: ['status'],
      });
    write(wb, sheets.tasks, task._row, {
      Status: 'Claimed',
      Owner: process.env.USER || 'local',
      'Claimed at': new Date().toISOString(),
    });
    return result('task.claimed', brief(wb, task['Task ID'], opts.full), true);
  }
  const task = getTask(wb, opts.id);
  if (command === 'task block') {
    if (!['Claimed', 'Awaiting QA'].includes(task.Status) || !opts.reason)
      throw new Error('Blocking requires an active task and --reason');
    write(wb, sheets.tasks, task._row, {
      Status: 'Blocked',
      'Hold reason': opts.reason,
    });
    return result('task.blocked', {taskId: opts.id, reason: opts.reason}, true);
  }
  if (command === 'task unblock') {
    if (!task['Hold reason']) throw new Error('Task has no manual hold');
    write(wb, sheets.tasks, task._row, {'Hold reason': ''});
    return result('task.unblocked', {taskId: opts.id, next: ['status']}, true);
  }
  if (command === 'task finish') {
    getTask(wb, opts.id, ['Approved']);
    if (!opts.pr)
      throw new Error('Provide --pr with the reviewed pull request');
    const pr = JSON.parse(
      exec(repo, 'gh', [
        'pr',
        'view',
        opts.pr,
        '--json',
        'state,headRefOid,mergeCommit,mergedAt,statusCheckRollup,baseRefName,url',
      ]),
    );
    let contains = false;
    try {
      exec(repo, 'git', [
        'merge-base',
        '--is-ancestor',
        pr.mergeCommit?.oid || 'missing',
        'refs/remotes/origin/main',
      ]);
      contains = true;
    } catch {}
    validateMerge(
      pr,
      task,
      exec(repo, 'git', ['worktree', 'list', '--porcelain']),
      contains,
    );
    const receipt = await readReceipt(task, opts);
    if (hash(JSON.stringify(receipt)) !== task['Receipt SHA256'])
      throw new Error('Verification receipt changed');
    if (task['Scope SHA256'] !== scope(wb, task))
      throw new Error('Acceptance scope changed after approval');
    const approved = table(wb, sheets.reviews).findLast(
      r =>
        r['Task ID'] === opts.id &&
        r['Verified SHA'] === task['Verified SHA'] &&
        r.Decision === 'Approved',
    );
    if (!approved) throw new Error('Missing exact-revision human approval');
    const evidence = JSON.parse(approved.Notes.split('\n')[0]);
    for (const [relative, digest] of Object.entries(evidence.files || {}))
      if (
        !/^[a-f0-9]{64}$/.test(digest) ||
        hash(await fs.readFile(path.join(opts.stateDir, 'files', digest))) !==
          digest
      )
        throw new Error(`Approved evidence changed: ${relative}`);
    const coverage = requireMappings(wb, task, p.value, receipt);
    for (const name of [sheets.components, sheets.tokens])
      for (const row of table(wb, name).filter(r =>
        (name === sheets.components
          ? coverage.mapIds
          : coverage.tokenIds
        ).includes(r['Map ID']),
      )) {
        if (row['Native QA'] !== 'Approved')
          throw new Error('Native QA changed after approval');
        write(wb, name, row._row, {Merged: 'Yes'});
      }
    write(wb, sheets.tasks, task._row, {
      Status: 'Closed',
      PR: pr.url,
      'Merge SHA': pr.mergeCommit.oid,
    });
    return result(
      'task.closed',
      {taskId: opts.id, merge: pr.mergeCommit.oid, next: ['task pop']},
      true,
    );
  }
  if (command === 'task review') {
    getTask(wb, opts.id, ['Awaiting QA', 'Approved']);
    clean(repo);
    if (exec(repo, 'git', ['rev-parse', 'HEAD']) !== task['Verified SHA'])
      throw new Error('Review checkout differs from the verified revision');
    const receipt = await readReceipt(task, opts);
    if (
      hash(JSON.stringify(receipt)) !== task['Receipt SHA256'] ||
      task['Scope SHA256'] !== scope(wb, task)
    )
      throw new Error('Review evidence changed; verify again');
    return result('task.review', {
      ...brief(wb, opts.id),
      revision: task['Verified SHA'],
      preview: receipt.preview,
      sourceDecision: receipt.sourceDecision,
      motion: receipt.motion,
      visualComparisons: receipt.visualComparisons,
      next: [
        `task qa ${opts.id} approve --reference '<actual human decision>'`,
      ],
    });
  }
  getTask(
    wb,
    opts.id,
    command === 'task verify' ? ['Claimed'] : ['Awaiting QA'],
  );
  clean(repo);
  const revision = exec(repo, 'git', ['rev-parse', 'HEAD']);
  let receipt;
  if (command === 'task verify') {
    const recipe = path.join(p.value.recipeDirectory, `${opts.id}.mjs`);
    try {
      await fileAt(repo, recipe);
    } catch {
      throw new Error(
        `Missing verification recipe: ${recipe}. Implement focused checks and emit the evidence receipt before verification.`,
      );
    }
    receipt = JSON.parse(exec(repo, process.execPath, [recipe, '--json']));
  } else {
    if (!['approve', 'reject'].includes(opts.decision) || !opts.reference)
      throw new Error(
        'QA needs approve/reject and --reference to the actual human decision',
      );
    if (task['Verified SHA'] !== revision)
      throw new Error('QA revision changed; reverify and review this revision');
    receipt = await readReceipt(task, opts);
    if (hash(JSON.stringify(receipt)) !== task['Receipt SHA256'])
      throw new Error('Verification receipt changed');
  }
  // Allow a human rejection even if a previously passing preview/check is now broken.
  if (command === 'task qa' && opts.decision === 'reject') {
    const review = table(wb, sheets.reviews).findLast(
      r =>
        r['Task ID'] === opts.id &&
        r['Verified SHA'] === revision &&
        r.Decision === 'Pending',
    );
    if (!review) throw new Error('No pending review for this revision');
    write(wb, sheets.reviews, review._row, {
      Decision: 'Rejected',
      Reviewer: process.env.USER || 'local',
      Notes: opts.reference,
      'Reviewed at': new Date().toISOString(),
    });
    write(wb, sheets.tasks, task._row, {Status: 'Claimed', QA: 'Rejected'});
    return result(
      'task.rejected',
      {taskId: opts.id, next: [`task verify ${opts.id}`]},
      true,
    );
  }
  const fingerprints = await validateEvidence(
    repo,
    receipt,
    p.value,
    task,
    revision,
  );
  if (receipt.reviewKind === 'visual') {
    const source = JSON.parse(
      await fs.readFile(await fileAt(repo, receipt.sourceDecision), 'utf8'),
    );
    if (source.figma.sha256 !== meta(wb)['Figma SHA256'])
      throw new Error('Figma export differs from workbook source pin');
    const response = await fetch(receipt.preview, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('Preview is unavailable');
  }
  const coverage = requireMappings(wb, task, p.value, receipt);
  if (command === 'task qa' && task['Scope SHA256'] !== scope(wb, task))
    throw new Error('Task references or acceptance changed after verification');
  if (exec(repo, 'git', ['rev-parse', 'HEAD']) !== revision)
    throw new Error('Code revision changed during verification');
  clean(repo);
  if (command === 'task verify') {
    const receiptName = `${opts.id}-${revision}.json`;
    await fs.mkdir(path.join(opts.stateDir, 'files'), {recursive: true});
    for (const [relative, digest] of Object.entries(fingerprints)) {
      const bytes = await fs.readFile(await fileAt(repo, relative));
      if (hash(bytes) !== digest)
        throw new Error('Evidence changed during archive');
      const target = path.join(opts.stateDir, 'files', digest);
      try {
        await fs.writeFile(target, bytes, {flag: 'wx'});
      } catch (error) {
        if (
          error.code !== 'EEXIST' ||
          hash(await fs.readFile(target)) !== digest
        )
          throw error;
      }
    }
    const receiptFile = path.join(opts.stateDir, receiptName),
      text = JSON.stringify(receipt);
    try {
      await fs.writeFile(receiptFile, text, {flag: 'wx'});
    } catch (error) {
      if (
        error.code !== 'EEXIST' ||
        (await fs.readFile(receiptFile, 'utf8')) !== text
      )
        throw new Error(
          'Evidence for this revision changed; commit the corrected evidence and verify again',
        );
    }
    const updates = {
      Status: 'Awaiting QA',
      'Verified SHA': revision,
      Verification: 'Source, pixel, motion and behavioral evidence verified',
      QA: 'Pending',
      'Receipt path': receiptName,
      'Receipt SHA256': hash(JSON.stringify(receipt)),
      Worktree: (() => {
        const root = exec(repo, 'git', ['rev-parse', '--show-toplevel']);
        const primary = exec(repo, 'git', ['worktree', 'list', '--porcelain'])
          .split('\n')[0]
          .replace(/^worktree /, '');
        return root === primary ? '' : root;
      })(),
    };
    if (receipt.sourceDecision)
      updates['Source decision'] = receipt.sourceDecision;
    write(wb, sheets.tasks, task._row, updates);
    write(wb, sheets.tasks, task._row, {
      'Scope SHA256': scope(wb, getTask(wb, opts.id)),
    });
    markQA(wb, coverage, 'Pending');
    addReview(wb, {
      'Task ID': opts.id,
      'Verified SHA': revision,
      Preview: receipt.preview || 'Document review',
      States: receipt.qaChecks.states.result,
      Keyboard: receipt.qaChecks.keyboard.result,
      Theme: receipt.qaChecks.theme.result,
      Responsive: receipt.qaChecks.responsive.result,
      Motion: receipt.qaChecks.motion.result,
      Accessibility: receipt.qaChecks.accessibility.result,
      Decision: 'Pending',
      Notes: JSON.stringify({files: fingerprints, qa: receipt.qaChecks}),
    });
    return result(
      'task.verified',
      {
        taskId: opts.id,
        revision,
        preview: receipt.preview,
        next: [`task review ${opts.id}`],
      },
      true,
    );
  }
  const review = table(wb, sheets.reviews).findLast(
    r =>
      r['Task ID'] === opts.id &&
      r['Verified SHA'] === revision &&
      r.Decision === 'Pending',
  );
  if (!review) throw new Error('No pending review');
  if (
    JSON.stringify(JSON.parse(review.Notes.split('\n')[0]).files) !==
    JSON.stringify(fingerprints)
  )
    throw new Error('Evidence files changed since verification');
  write(wb, sheets.reviews, review._row, {
    Decision: 'Approved',
    Reviewer: process.env.USER || 'local',
    Notes: `${review.Notes}\nHuman decision: ${opts.reference}`,
    'Reviewed at': new Date().toISOString(),
  });
  write(wb, sheets.tasks, task._row, {Status: 'Approved', QA: 'Approved'});
  markQA(wb, coverage, 'Approved');
  for (const name of [sheets.components, sheets.tokens])
    for (const row of table(wb, name).filter(r =>
      (name === sheets.components
        ? coverage.mapIds
        : coverage.tokenIds
      ).includes(r['Map ID']),
    ))
      write(
        wb,
        name,
        row._row,
        name === sheets.components
          ? {'Work status': 'Verified', Review: 'Approved'}
          : {Review: 'Approved'},
      );
  return result(
    'task.approved',
    {
      taskId: opts.id,
      revision,
      next: [
        `Merge the approved PR, remove its clean worktree from another checkout, then: task finish ${opts.id} --pr <url>`,
      ],
    },
    true,
  );
}
