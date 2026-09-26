// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Workbook scope, shared family decisions and selected baselines. @output Hashed packets reusing source research across variants. @position Disposable preparation; packets carry evidence, never task status. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {digest, loadCompose, composeBrief} from './compose.mjs';
import {table, sheets, ids} from './model.mjs';
import {fileAt, validateSource} from './evidence.mjs';
import {documentLayers} from './flow.mjs';
import {familyGroups, validateFamily, validateFamilyUse} from './routing.mjs';

export function preparationInputs(wb, task, policy) {
  const mapIds = ids(task['Mapping IDs']);
  const mappings = table(wb, sheets.components)
    .filter(m => mapIds.includes(m['Map ID']))
    .map(m =>
      Object.fromEntries(
        [
          'Map ID',
          'Material element',
          'Native export',
          'Native source',
          'Figma nodes',
          'Compose families',
          'Source resolution',
          'Required variants',
          'Token IDs',
          'Token filter',
          'Disposition',
        ].map(k => [k, m[k] || '']),
      ),
    );
  const checks = table(wb, sheets.checks)
    .filter(c => mapIds.includes(c['Map ID']))
    .map(c =>
      Object.fromEntries(
        [
          'Map ID',
          'Dimension',
          'Scenario',
          'Expected check',
          'Applicable?',
          'Requirement source',
          'Notes / N/A reason',
        ].map(k => [k, c[k] || '']),
      ),
    );
  return {
    policy,
    families: familyGroups(table(wb, sheets.components)).filter(g =>
      g.mappingIds.some(id => mapIds.includes(id)),
    ),
    task: Object.fromEntries(
      ['Task ID', 'Layer', 'Target', 'Mapping IDs', 'Notes'].map(k => [
        k,
        task[k] || '',
      ]),
    ),
    mappings,
    checks,
  };
}
export async function prepareTask(wb, task, policy, repo, baseline) {
  const inputs = preparationInputs(wb, task, policy),
    index = await loadCompose(repo, policy);
  const files = {};
  const add = async p => {
    if (files[p]) return;
    files[p] = digest(await fs.readFile(await fileAt(repo, p)));
  };
  await add(policy.composeInventory);
  for (const p of [
    'AGENTS.md',
    policy.contract,
    'docs/contributing/material3-migration.md',
    'internal/material3-migration/routing.mjs',
  ])
    await add(p);
  const familyIds = [
    ...new Set(
      inputs.mappings.flatMap(m =>
        String(m['Compose families'])
          .split(/[,;]\s*/)
          .filter(Boolean),
      ),
    ),
  ];
  if (task.Layer === 'Foundation')
    familyIds.push(
      ...index.families
        .filter(f => f.kind === 'Foundation' && !familyIds.includes(f.id))
        .map(f => f.id),
    );
  for (const id of familyIds)
    if (!index.families.some(f => f.id === id))
      throw new Error(`Unknown Compose family: ${id}`);
  const routing = [];
  if (!documentLayers.includes(task.Layer)) {
    if (!baseline)
      throw new Error(
        'Implementation preparation requires --baseline <resolved source decision JSON>.',
      );
    await add(baseline);
    const source = JSON.parse(
      await fs.readFile(await fileAt(repo, baseline), 'utf8'),
    );
    validateSource(source, policy);
    for (const group of inputs.families) {
      await add(group.decision);
      const record = JSON.parse(
        await fs.readFile(await fileAt(repo, group.decision), 'utf8'),
      );
      for (const file of validateFamily(record, group, policy)) await add(file);
      routing.push(record);
    }
    if (routing.length) validateFamilyUse(source, routing);
    if (inputs.mappings.some(m => m['Source resolution'] !== 'Resolved'))
      throw new Error(
        'Resolve component sources before preparing implementation.',
      );
    for (const p of [
      source.figma.inventory,
      source.compose.evidence,
      ...(source.guidance || []).map(g => g.capture),
      ...source.decisions.map(d => d.evidence),
      ...source.scenarios.map(s => s.baseline),
      source.motion?.reference,
      source.motion?.evidence,
      source.motion?.numeric?.evidence,
      ...(source.motion?.numeric?.traces || []).map(t => t.reference),
    ].filter(Boolean))
      await add(p);
  }
  const packet = {
    schemaVersion: 1,
    scopeSha256: digest(JSON.stringify(inputs)),
    sources: {
      compose: policy.androidxCommit,
      web: policy.materialWebCommit,
      figma: policy.figmaSha256,
    },
    baseline: baseline || null,
    routing,
    files,
    compose: composeBrief(index, familyIds, true),
    criteria: inputs.checks,
    decisions: documentLayers.includes(task.Layer)
      ? 'Source/planning work resolves the baseline; this preparation does not certify design readiness.'
      : 'Resolved baseline required; code and interactive QA remain pending.',
  };
  const relative = `internal/material3-migration/prepared/${task['Task ID']}.json`;
  const bytes = JSON.stringify(packet, null, 2) + '\n';
  await fs.mkdir(path.join(repo, 'internal/material3-migration/prepared'), {
    recursive: true,
  });
  let reused = false;
  try {
    reused = (await fs.readFile(path.join(repo, relative), 'utf8')) === bytes;
  } catch {}
  if (!reused) await fs.writeFile(path.join(repo, relative), bytes);
  return {relative, sha256: digest(bytes), reused};
}
export async function preparationStatus(wb, task, policy, repo) {
  try {
    if (!task.Preparation || !task['Preparation SHA256'])
      throw new Error('Run task prepare.');
    const bytes = await fs.readFile(await fileAt(repo, task.Preparation));
    if (digest(bytes) !== task['Preparation SHA256'])
      throw new Error('Prepared packet changed.');
    const packet = JSON.parse(bytes);
    if (
      !documentLayers.includes(task.Layer) &&
      packet.baseline !== task['Source decision']
    )
      throw new Error('Selected baseline changed; prepare again.');
    if (
      packet.scopeSha256 !==
      digest(JSON.stringify(preparationInputs(wb, task, policy)))
    )
      throw new Error(
        'Sources, policy or acceptance scope changed; prepare again.',
      );
    for (const [p, h] of Object.entries(packet.files))
      if (digest(await fs.readFile(await fileAt(repo, p))) !== h)
        throw new Error(`Prepared reference changed: ${p}`);
    return {ready: true, packet};
  } catch (error) {
    return {ready: false, reason: error.message};
  }
}
