// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Frozen reference membership, workbook coverage and merged revision. @output Fail-closed coverage and isolated harness-removal proof. @position Disposable final migration gate. */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {table, meta, sheets, ids} from './model.mjs';
import {digest, loadCompose} from './compose.mjs';
import {scopeMembers} from './upgrade.mjs';
const run = promisify(execFile);

export function coveragePlan(wb, policy, index) {
  const blockers = [],
    mappings = table(wb, sheets.components),
    tasks = table(wb, sheets.tasks);
  if (
    meta(wb)['Scope inventory SHA256'] !==
    digest(JSON.stringify(scopeMembers(wb)))
  )
    blockers.push(
      'Frozen source inventory membership changed; reconcile the baseline explicitly.',
    );
  const compose = table(wb, 'Compose sources');
  if (
    index.families.length !== compose.length ||
    index.families.some(
      f => !compose.some(r => r.ID === f.id && r['Source SHA256'] === f.sha256),
    )
  )
    blockers.push('Compose source inventory differs from pinned index.');
  for (const name of [
    'Compose sources',
    'Design kit sets',
    'Material components',
  ])
    for (const row of table(wb, name)) {
      const id = row.ID || row['Figma node ID'];
      if (row.Disposition === 'Excluded') {
        if (!row.Reason || !row['Approval reference'])
          blockers.push(
            `${name} ${id}: exclusion requires a reason and human approval.`,
          );
        continue;
      }
      if (!['Required', 'Helper', 'Foundation'].includes(row.Disposition)) {
        blockers.push(`${name} ${id}: unclassified reference.`);
        continue;
      }
      const mapIds = ids(row['Mapping IDs']);
      if (row.Disposition === 'Foundation') {
        const owner = tasks.find(t => t['Task ID'] === row['Coverage task']);
        if (
          owner?.Layer !== 'Foundation' ||
          owner.Contract !== policy.strategyId ||
          !row.Reason
        )
          blockers.push(`${name} ${id}: missing native foundation owner.`);
      } else if (
        !mapIds.length ||
        mapIds.some(
          id =>
            !mappings.some(
              m =>
                m['Map ID'] === id &&
                ['Required', 'Native extension'].includes(m.Disposition),
            ),
        )
      )
        blockers.push(`${name} ${id}: missing required native mapping.`);
      if (row.Disposition === 'Helper' && !row.Reason)
        blockers.push(`${name} ${id}: helper needs explicit parent ownership.`);
      if (name === 'Design kit sets' && row.Disposition !== 'Excluded') {
        if (
          !row['Variant axes'] ||
          !row['Variant values'] ||
          !Number(row.Variants) ||
          !row.Properties
        )
          blockers.push(
            `${name} ${id}: frozen variant inventory is incomplete.`,
          );
        for (const mapId of mapIds) {
          const mapping = mappings.find(m => m['Map ID'] === mapId);
          if (
            mapping &&
            !String(mapping['Figma nodes'] || '')
              .split(/[,;]\s*/)
              .includes(id)
          )
            blockers.push(
              `${name} ${id}: ${mapId} lacks the reverse Figma link.`,
            );
        }
      }
    }
  return blockers;
}
export async function auditCoverage(wb, policy, repo) {
  const index = await loadCompose(repo, policy),
    blockers = coveragePlan(wb, policy, index);
  const figma = JSON.parse(
    await fs.readFile(
      path.join(
        repo,
        'internal/material3-migration/sources/figma-kit-inventory.json',
      ),
      'utf8',
    ),
  );
  const nodes = table(wb, 'Design kit sets');
  if (
    figma.componentSets.length !== nodes.length ||
    figma.componentSets.some(
      n => !nodes.some(r => r['Figma node ID'] === n.node_id),
    )
  )
    blockers.push('Figma source inventory differs from pinned export.');
  const tasks = table(wb, sheets.tasks),
    components = table(wb, sheets.components),
    tokens = table(wb, sheets.tokens),
    checks = table(wb, sheets.checks);
  for (const t of tasks.filter(t => t.Contract === policy.strategyId))
    if (
      t.Status !== 'Closed' ||
      !t['Merge SHA'] ||
      !t['Verified SHA'] ||
      !t['Receipt SHA256']
    )
      blockers.push(
        `${t['Task ID']}: not verified, approved and merged under the current contract.`,
      );
  let requiredComponents = 0;
  for (const m of components) {
    if (['Required', 'Native extension'].includes(m.Disposition)) {
      requiredComponents++;
      if (
        !tasks.some(
          t =>
            t.Contract === policy.strategyId &&
            t.Status === 'Closed' &&
            ids(t['Mapping IDs']).includes(m['Map ID']),
        )
      )
        blockers.push(`${m['Map ID']}: missing closed native task owner.`);
      if (
        m['Fully migrated?'] !== 'Yes' ||
        m.Contract !== policy.strategyId ||
        !String(m['Native export']).startsWith(policy.nativePackage + '/') ||
        !String(m['Native source']).startsWith(policy.nativeRoot + '/')
      )
        blockers.push(`${m['Map ID']}: native implementation is incomplete.`);
      if (
        !checks.some(c => c['Map ID'] === m['Map ID']) ||
        checks.some(c => c['Map ID'] === m['Map ID'] && c.Gate !== 'Ready')
      )
        blockers.push(`${m['Map ID']}: incomplete acceptance.`);
      const matched = tokens.filter(
        t =>
          ids(m['Token IDs'], 'TM').includes(t['Map ID']) ||
          String(m['Token filter'] || '')
            .split(/[,;]/)
            .some(
              p =>
                p.trim() &&
                String(t['Material token']).startsWith(
                  p.trim().replace(/\*$/, ''),
                ),
            ),
      );
      if (!matched.length || matched.some(t => t['Fully migrated?'] !== 'Yes'))
        blockers.push(
          `${m['Map ID']}: required token mappings are incomplete.`,
        );
      try {
        await fs.access(path.join(repo, m['Native source'] || 'missing'));
      } catch {
        blockers.push(`${m['Map ID']}: native source file is missing.`);
      }
    } else if (
      !['Legacy', 'Excluded'].includes(m.Disposition) ||
      !m['Scope reason'] ||
      !m['Scope approval']
    )
      blockers.push(
        `${m['Map ID']}: classify the Astryx-only mapping with an approved reason.`,
      );
  }
  return {
    complete: blockers.length === 0,
    baseline: policy.baselineId,
    requiredComponents,
    blockers,
  };
}
export async function retireCheck(repo, policy, policyHash, stateDir) {
  const exec = async (c, args, cwd = repo) =>
    (
      await run(c, args, {
        cwd,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
        timeout: 600000,
      })
    ).stdout;
  if ((await exec('git', ['status', '--porcelain'])).trim())
    throw new Error('Retirement requires a clean, committed checkout.');
  const revision = (await exec('git', ['rev-parse', 'HEAD'])).trim();
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), 'material3-retirement-'),
  );
  try {
    const archive = path.join(root, 'source.tar'),
      checkout = path.join(root, 'checkout');
    await fs.mkdir(checkout);
    await exec('git', [
      'archive',
      '--format=tar',
      `--output=${archive}`,
      revision,
    ]);
    await exec('tar', ['-xf', archive, '-C', checkout]);
    await fs.rm(path.join(checkout, 'internal/material3-migration'), {
      recursive: true,
      force: true,
    });
    await fs.rm(
      path.join(checkout, 'docs/contributing/material3-migration.md'),
      {force: true},
    );
    const native = JSON.parse(
      await fs.readFile(
        path.join(checkout, policy.nativeRoot, 'package.json'),
        'utf8',
      ),
    );
    if (!native.scripts?.build || !native.scripts?.test)
      throw new Error(
        'Native package must expose permanent build and regression test scripts.',
      );
    const tracked = (await exec('git', ['ls-files', 'packages', 'apps']))
      .trim()
      .split('\n');
    for (const file of tracked.filter(f =>
      /\.(?:[cm]?[jt]sx?|json|css)$/.test(f),
    )) {
      const text = await fs.readFile(path.join(checkout, file), 'utf8');
      if (/internal\/material3-migration|\.m3-receipts/.test(text))
        throw new Error(
          `Product source depends on disposable migration artifacts: ${file}`,
        );
    }
    const commands = [];
    await fs.mkdir(stateDir, {recursive: true});
    for (const [command, ...args] of policy.retirementCommands) {
      const started = Date.now(),
        output = await exec(command, args, checkout);
      const log = `retirement-${revision}-${commands.length + 1}.log`;
      await fs.writeFile(path.join(stateDir, log), output);
      commands.push({
        command: [command, ...args],
        durationMs: Date.now() - started,
        log,
        outputSha256: digest(output),
      });
    }
    const receipt = {
      revision,
      policyHash,
      baselineId: policy.baselineId,
      harnessAbsent: true,
      commands,
    };
    await fs.mkdir(stateDir, {recursive: true});
    await fs.writeFile(
      path.join(stateDir, `retirement-${revision}.json`),
      JSON.stringify(receipt, null, 2) + '\n',
    );
    return receipt;
  } finally {
    await fs.rm(root, {recursive: true, force: true});
  }
}
