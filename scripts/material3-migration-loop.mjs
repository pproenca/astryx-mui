/**
 * @input Existing migration workbook, repository policy, task-owned verification recipes.
 * @output Claims and exact-revision verification/QA transitions under the native contract.
 * @position Workbook task.mjs dispatches here; the workbook remains the only task database.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

export const policyPath = 'docs/contributing/material3-migration-policy.json';
const rowsOf = (wb, name) =>
  wb.worksheets.getItem(name).getUsedRange().values.slice(1);
const metadata = wb =>
  Object.fromEntries(
    wb.worksheets
      .getItem('Overview')
      .getUsedRange()
      .values.filter(row => row[0]),
  );
const eligible = row => ['Backlog', 'Ready', 'Blocked'].includes(row[5]);

export function validateGraph(rows, edges) {
  const ids = new Set(rows.map(row => row[0]));
  if (ids.size !== rows.length)
    throw new Error('Duplicate task IDs in workbook.');
  const graph = new Map([...ids].map(id => [id, []]));
  for (const [from, to, kind] of edges) {
    if (!ids.has(from) || !ids.has(to))
      throw new Error(`Unknown dependency: ${from} -> ${to}`);
    if (kind === 'Hard') graph.get(to).push(from);
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) throw new Error(`Dependency cycle at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const predecessor of graph.get(id)) visit(predecessor);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of ids) visit(id);
}

export function blockers(id, rows, edges) {
  return edges
    .filter(edge => edge[1] === id && edge[2] === 'Hard')
    .map(edge => edge[0])
    .filter(
      predecessor => rows.find(row => row[0] === predecessor)?.[5] !== 'Closed',
    );
}

export function assertTaskGate(id, rows, edges, expectedStatus) {
  validateGraph(rows, edges);
  const task = rows.find(row => row[0] === id);
  if (!task) throw new Error(`Unknown task: ${id}`);
  const missing = blockers(id, rows, edges);
  if (missing.length)
    throw new Error(
      `${id} is blocked by ${missing.join(', ')}. Read the native migration guide.`,
    );
  if (task[5] !== expectedStatus)
    throw new Error(
      `${id} must be ${expectedStatus}; current status is ${task[5]}.`,
    );
  return task;
}

export function validateReceipt(receipt, policy, id, revision) {
  if (
    receipt.strategyId !== policy.strategyId ||
    receipt.taskId !== id ||
    receipt.revision !== revision ||
    receipt.materialWebCommit !== policy.materialWebCommit
  ) {
    throw new Error(
      'Verification receipt must match the active strategy, task, source and exact code revision.',
    );
  }
  for (const requirement of policy.evidenceRequirements) {
    const item = receipt.checks?.[requirement];
    if (
      item?.result !== 'Pass' ||
      !Array.isArray(item.evidence) ||
      !item.evidence.length ||
      item.evidence.some(
        file =>
          typeof file !== 'string' ||
          !file.trim() ||
          path.isAbsolute(file) ||
          file.split(/[\\/]/).includes('..'),
      )
    ) {
      throw new Error(`Missing native evidence: ${requirement}`);
    }
  }
  for (const key of [
    'states',
    'keyboard',
    'theme',
    'responsive',
    'motion',
    'accessibility',
  ]) {
    const item = receipt.qaChecks?.[key];
    if (!['Pass', 'N/A'].includes(item?.result) || !item.reason?.trim())
      throw new Error(`Missing QA evidence/reason: ${key}`);
  }
  if (!['visual', 'document'].includes(receipt.reviewKind))
    throw new Error('Declare visual or document review.');
  if (
    receipt.reviewKind === 'visual' &&
    !/^https?:\/\//.test(receipt.preview || '')
  )
    throw new Error('Visual work requires an interactive preview.');
}

function mappingIds(value) {
  const text = String(value || '');
  const range = text.match(/CM-(\d+)\s+to\s+CM-(\d+)/);
  if (range)
    return Array.from(
      {length: Number(range[2]) - Number(range[1]) + 1},
      (_, i) => `CM-${String(Number(range[1]) + i).padStart(4, '0')}`,
    );
  return [...new Set(text.match(/CM-\d+/g) || [])];
}

function tokenPrefixes(value) {
  const prefixes = String(value || '')
    .split(/[,;]/)
    .map(item => item.trim().replace(/\*$/, ''));
  if (
    !prefixes.length ||
    prefixes.some(item => !/^--md-[a-z0-9-]+$/.test(item))
  )
    throw new Error(
      'Token scope must contain comma-separated Material CSS prefixes, without prose.',
    );
  return prefixes;
}

export function assertMappings(wb, task, policy, receipt = {}) {
  // Foundation/architecture tasks may refer to entire sheets, not component IDs.
  const ids = mappingIds(task[7]);
  const mappings = rowsOf(wb, 'Component mapping');
  const checks = rowsOf(wb, 'Acceptance checks');
  const tokens = rowsOf(wb, 'Token mapping');
  const tokenIds = new Set(receipt.tokenIds || []);
  if (task[3] === 'Foundation' && !tokenIds.size)
    throw new Error('Foundation verification must identify its tokenIds.');
  for (const id of ids) {
    const row = mappings.find(item => item[0] === id);
    if (
      !row ||
      row[21] !== policy.strategyId ||
      !String(row[22] || '').startsWith(`${policy.nativePackage}/`)
    )
      throw new Error(`${id} has no verified native contract/export.`);
    const acceptance = checks.filter(item => item[0] === id);
    for (const [name] of policy.nativeAcceptance) {
      if (
        !acceptance.some(
          item =>
            item[3] === 'Native contract' &&
            item[4] === name &&
            item[6] === 'Required' &&
            item[7] === 'Pass' &&
            item[8],
        )
      )
        throw new Error(`${id} needs native check: ${name}`);
    }
    if (!acceptance.length || acceptance.some(item => item[11] !== 'Ready'))
      throw new Error(`${id} has incomplete acceptance evidence.`);
    if (
      row[5] !== 'Confirmed' ||
      row[15] ||
      row[19] !== 'Pass' ||
      !row[20] ||
      !row[18]
    )
      throw new Error(`${id} has unresolved mapping or token evidence.`);
    const filters = tokenPrefixes(row[18]);
    const matched = tokens.filter(item =>
      filters.some(prefix => String(item[1]).startsWith(prefix)),
    );
    if (
      !matched.length ||
      matched.some(
        item =>
          item[13] !== policy.strategyId || item[5] !== 'Pass' || !item[6],
      )
    )
      throw new Error(
        `${id} token mapping is not verified under the native contract.`,
      );
    for (const token of matched) tokenIds.add(token[0]);
  }
  for (const id of tokenIds) {
    const token = tokens.find(item => item[0] === id);
    if (
      !token ||
      token[13] !== policy.strategyId ||
      token[5] !== 'Pass' ||
      !token[6]
    )
      throw new Error(`Missing native token evidence: ${id}`);
  }
  return {ids, tokenIds: [...tokenIds]};
}

export async function runNativeLoop(context) {
  const {
    command,
    taskId,
    decision,
    repoPath,
    directory,
    load,
    withLock,
    run,
    requireCleanTrackedTree,
    materialWebPath,
  } = context;
  const initial = await load();
  const meta = metadata(initial);
  if (!meta['Migration strategy']) return false;
  const initialRows = rowsOf(initial, 'Tasks');
  const initialEdges = rowsOf(initial, 'Dependencies');
  validateGraph(initialRows, initialEdges);
  if (['status', 'plan'].includes(command)) {
    console.log(
      `Strategy: ${meta['Migration strategy']}. Database: existing migration workbook.`,
    );
    const ready = initialRows
      .filter(
        row =>
          eligible(row) && !blockers(row[0], initialRows, initialEdges).length,
      )
      .sort((a, b) => a[4] - b[4]);
    console.log(
      'Ready:',
      ready.map(row => `${row[0]} ${row[2]}`).join('\n') || 'none',
    );
    console.log(
      'Active/blocked:',
      initialRows
        .filter(row => ['Claimed', 'Awaiting QA', 'Blocked'].includes(row[5]))
        .map(
          row =>
            `${row[0]} ${row[5]} ${blockers(row[0], initialRows, initialEdges).join(', ')}`,
        )
        .join('\n') || 'none',
    );
    return true;
  }
  if (!['pop', 'verify', 'qa'].includes(command))
    throw new Error(
      'Legacy initialization and correction commands are disabled after the native pivot. Edit the existing workbook through its locked migration workflow.',
    );
  let policyText;
  try {
    policyText = await fs.readFile(path.join(repoPath, policyPath), 'utf8');
  } catch {
    throw new Error(
      `This checkout lacks ${policyPath}. Integrate the native migration pivot before continuing; do not resume the old Core adapter queue.`,
    );
  }
  const policy = JSON.parse(policyText);
  const digest = createHash('sha256').update(policyText).digest('hex');
  function assertPolicy(wb) {
    const values = metadata(wb);
    if (
      values['Migration strategy'] !== policy.strategyId ||
      values['Policy SHA256'] !== digest
    )
      throw new Error(
        'Repository policy and workbook differ. Reconcile the existing workbook before continuing.',
      );
  }
  assertPolicy(initial);
  if (command === 'pop') {
    const result = await withLock(async wb => {
      assertPolicy(wb);
      const rows = rowsOf(wb, 'Tasks');
      const edges = rowsOf(wb, 'Dependencies');
      validateGraph(rows, edges);
      if (rows.some(row => row[5] === 'Claimed'))
        throw new Error(
          'A task is already claimed. Finish or explicitly block that claim before popping another.',
        );
      const task = rows
        .filter(row => eligible(row) && !blockers(row[0], rows, edges).length)
        .sort((a, b) => a[4] - b[4])[0];
      if (!task)
        return {changed: false, message: 'No dependency-ready native task.'};
      const row = rows.indexOf(task) + 2;
      const sheet = wb.worksheets.getItem('Tasks');
      sheet.getRange(`F${row}`).values = [['Claimed']];
      sheet.getRange(`I${row}:J${row}`).values = [
        [process.env.USER || 'local', new Date().toISOString()],
      ];
      return {
        changed: true,
        message: `Claimed ${task[0]}: ${task[2]}. Contract ${policy.strategyId}.`,
      };
    });
    console.log(result.message);
    return true;
  }
  const expected = command === 'verify' ? 'Claimed' : 'Awaiting QA';
  const task = assertTaskGate(taskId, initialRows, initialEdges, expected);
  requireCleanTrackedTree();
  const revision = run('git', ['rev-parse', 'HEAD']);
  if (
    run('git', ['rev-parse', 'HEAD'], {cwd: materialWebPath}) !==
    policy.materialWebCommit
  )
    throw new Error('Material Web source pin changed.');
  const receiptFile = path.join(directory, `${taskId}-native-receipt.json`);
  let receipt;
  if (command === 'verify') {
    const recipe = path.join(policy.recipeDirectory, `${taskId}.mjs`);
    try {
      await fs.access(path.join(repoPath, recipe));
    } catch {
      throw new Error(
        `Native verification recipe missing: ${recipe}. Implement it with this task; legacy theme tests cannot close native work.`,
      );
    }
    receipt = JSON.parse(run(process.execPath, [recipe, '--json']));
  } else {
    if (!['approve', 'reject'].includes(decision))
      throw new Error('QA decision must be approve or reject.');
    receipt = JSON.parse(await fs.readFile(receiptFile, 'utf8'));
  }
  validateReceipt(receipt, policy, taskId, revision);
  if (
    receipt.reviewKind === 'document' &&
    !['Architecture', 'Review', 'Planning'].includes(task[3])
  )
    throw new Error('This implementation task requires visual review.');
  for (const requirement of policy.evidenceRequirements)
    for (const item of [receipt.checks[requirement]])
      for (const evidence of item.evidence) {
        const file = await fs.realpath(path.join(repoPath, evidence));
        if (
          !file.startsWith(`${await fs.realpath(repoPath)}${path.sep}`) ||
          !(await fs.stat(file)).isFile()
        )
          throw new Error(`Invalid repository evidence: ${evidence}`);
      }
  if (receipt.reviewKind === 'visual') {
    const response = await fetch(receipt.preview, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      throw new Error('Interactive native preview is unavailable.');
  }
  const args = process.argv.slice(2);
  const approvalIndex = args.indexOf('--approval-reference');
  const approval = approvalIndex < 0 ? '' : args[approvalIndex + 1];
  if (command === 'qa' && !approval?.trim())
    throw new Error(
      'Record the actual human decision using --approval-reference.',
    );
  const result = await withLock(async wb => {
    assertPolicy(wb);
    requireCleanTrackedTree();
    if (run('git', ['rev-parse', 'HEAD']) !== revision)
      throw new Error('Revision changed during verification.');
    const rows = rowsOf(wb, 'Tasks');
    const current = assertTaskGate(
      taskId,
      rows,
      rowsOf(wb, 'Dependencies'),
      expected,
    );
    const {ids, tokenIds} = assertMappings(wb, current, policy, receipt);
    if (command === 'qa' && current[10] !== revision)
      throw new Error('Task verification is for another revision.');
    const sheet = wb.worksheets.getItem('Tasks');
    const row = rows.indexOf(current) + 2;
    const qa = wb.worksheets.getItem('QA reviews');
    const reviews = rowsOf(wb, 'QA reviews');
    function setNativeQA(value) {
      const mapping = wb.worksheets.getItem('Component mapping');
      const tokens = wb.worksheets.getItem('Token mapping');
      for (const id of ids) {
        const index =
          rowsOf(wb, 'Component mapping').findIndex(item => item[0] === id) + 2;
        mapping.getRange(`X${index}`).values = [[value]];
      }
      for (const id of tokenIds) {
        const index =
          rowsOf(wb, 'Token mapping').findIndex(item => item[0] === id) + 2;
        tokens.getRange(`O${index}`).values = [[value]];
        if (value === 'Approved')
          tokens.getRange(`H${index}`).values = [['Approved']];
      }
    }
    if (command === 'verify') {
      setNativeQA('Pending');
      sheet.getRange(`F${row}`).values = [['Awaiting QA']];
      sheet.getRange(`K${row}:M${row}`).values = [
        [
          revision,
          `Native requirements verified: ${policy.strategyId}`,
          'Pending',
        ],
      ];
      const data = [
        taskId,
        revision,
        receipt.preview || 'Document review',
        ...[
          'states',
          'keyboard',
          'theme',
          'responsive',
          'motion',
          'accessibility',
        ].map(key => receipt.qaChecks[key].result),
        'Pending',
        '',
        Object.entries(receipt.qaChecks)
          .map(([key, item]) => `${key}: ${item.reason}`)
          .join('. '),
        '',
      ];
      qa.tables.items
        .find(table => table.name === 'MigrationQA')
        .rows.add(null, [data]);
      await fs.writeFile(receiptFile, JSON.stringify(receipt, null, 2) + '\n');
    } else {
      const index = reviews.findLastIndex(
        item =>
          item[0] === taskId && item[1] === revision && item[9] === 'Pending',
      );
      if (index < 0)
        throw new Error('No pending human QA row for this exact revision.');
      qa.getRange(`J${index + 2}:M${index + 2}`).values = [
        [
          decision === 'approve' ? 'Approved' : 'Rejected',
          process.env.USER || 'local',
          `${reviews[index][11]}. Decision: ${approval}`,
          new Date().toISOString(),
        ],
      ];
      sheet.getRange(`F${row}`).values = [
        [decision === 'approve' ? 'Closed' : 'Claimed'],
      ];
      sheet.getRange(`M${row}`).values = [
        [decision === 'approve' ? 'Approved' : 'Rejected'],
      ];
      setNativeQA(decision === 'approve' ? 'Approved' : 'Rejected');
      if (decision === 'approve') {
        const mapping = wb.worksheets.getItem('Component mapping');
        for (const id of ids) {
          const mr =
            rowsOf(wb, 'Component mapping').findIndex(item => item[0] === id) +
            2;
          mapping.getRange(`G${mr}`).values = [['Verified']];
          mapping.getRange(`J${mr}`).values = [['Approved']];
        }
      }
    }
    return {
      changed: true,
      message: `${taskId}: ${command === 'verify' ? 'Awaiting QA' : decision === 'approve' ? 'Closed' : 'Claimed for rework'} at ${revision}.`,
    };
  });
  console.log(result.message);
  return true;
}
