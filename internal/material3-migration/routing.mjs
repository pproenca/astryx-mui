// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Existing mappings and Compose-first shared family decisions. @output Deduplicated research ownership with evidenced gaps and approved exceptions. @position Disposable source projection; the workbook remains the task database. */
import {isDeepStrictEqual} from 'node:util';
import {digest} from './compose.mjs';

export const precedence = {
  design: ['compose', 'figma', 'website', 'web'],
  behavior: ['compose', 'website', 'figma', 'web'],
  motion: ['compose', 'website', 'figma', 'web'],
  browser: ['web', 'web-platform'],
};
const split = value =>
  String(value || '')
    .split(/[,;]\s*/)
    .filter(Boolean);
const unique = values => [...new Set(values)].sort();
// Shared research only: these variants retain distinct exports, tasks and checks.
const aliases = {
  'compose:OutlinedTextField': 'compose:TextField',
  'compose:TabRow': 'compose:Tab',
};
const keys = m => [
  ...split(m['Compose families']).map(id => aliases[id] || id),
  ...(String(m['Native export'] || '').startsWith('@astryxdesign/material3/')
    ? [`native:${m['Native export']}`]
    : []),
];
export function familyGroups(mappings) {
  const groups = [];
  for (const m of [...mappings].sort((a, b) =>
    a['Map ID'].localeCompare(b['Map ID']),
  )) {
    const refs = keys(m),
      matching = groups.filter(g => refs.some(ref => g.keys.has(ref)));
    const group = matching.shift() || {keys: new Set(), members: []};
    if (!groups.includes(group)) groups.push(group);
    for (const other of matching) {
      other.members.forEach(row => group.members.push(row));
      other.keys.forEach(key => group.keys.add(key));
      groups.splice(groups.indexOf(other), 1);
    }
    refs.forEach(ref => group.keys.add(ref));
    group.members.push(m);
  }
  return groups.map(g => {
    const members = g.members.sort((a, b) =>
      a['Map ID'].localeCompare(b['Map ID']),
    );
    const id = `family-${members[0]['Map ID']}`;
    const references = {
      figma: unique(members.flatMap(m => split(m['Figma nodes']))),
      compose: unique(members.flatMap(m => split(m['Compose families']))),
      web: unique(
        members
          .filter(m => String(m['Material element']).startsWith('md-'))
          .map(m => m['Material source'])
          .filter(Boolean),
      ),
    };
    const scope = members.map(m =>
      Object.fromEntries(
        [
          'Map ID',
          'Material element',
          'Figma nodes',
          'Compose families',
          'Material source',
          'Required variants',
        ].map(k => [k, m[k] || '']),
      ),
    );
    return {
      id,
      mappingIds: members.map(m => m['Map ID']),
      variants: members.map(m => m['Material element']),
      references,
      scopeSha256: digest(JSON.stringify(scope)),
      decision: `internal/material3-migration/sources/families/${id}.json`,
    };
  });
}
export function sourcePlan(mappings, mapIds, full = false) {
  return familyGroups(mappings)
    .filter(g => g.mappingIds.some(id => mapIds.includes(id)))
    .map(g => ({
      id: g.id,
      mappingIds: g.mappingIds,
      variants: g.variants,
      decision: g.decision,
      scopeSha256: g.scopeSha256,
      membershipOwner: 'M3-SRC-002',
      researchOwner: g.decision,
      state: 'Read the shared decision; resolve it once if missing.',
      linked: Object.fromEntries(
        Object.entries(g.references).map(([k, v]) => [
          k,
          v.length
            ? 'linked'
            : 'not yet linked; absence must be established once',
        ]),
      ),
      precedence,
      ...(full ? {references: g.references} : {}),
    }));
}
const requireValue = (ok, message) => {
  if (!ok) throw new Error(message);
};
function deviation(route, files) {
  const exception = route.exception;
  requireValue(
    (route.gapReason && route.gapEvidence) ||
      (exception?.reason && exception.evidence && exception.approvalReference),
    'Skipping a higher source requires a specific gap with evidence or an explicitly approved exception.',
  );
  files.push(route.gapEvidence || exception.evidence);
}
export function validateFamily(record, group, policy) {
  requireValue(
    record.schemaVersion === 2 &&
      record.authority === 'compose-first' &&
      record.familyId === group.id &&
      record.scopeSha256 === group.scopeSha256,
    'Shared family decision has stale ownership or variant scope.',
  );
  requireValue(
    isDeepStrictEqual(record.pins, {
      figma: policy.figmaSha256,
      compose: policy.androidxCommit,
      web: policy.materialWebCommit,
    }),
    'Shared family decision has stale source pins.',
  );
  const files = [];
  requireValue(
    Object.keys(record.coverage || {}).every(k =>
      ['figma', 'compose', 'web'].includes(k),
    ),
    'Unknown coverage source; record missing guidance for the specific route as a gap.',
  );
  for (const name of ['figma', 'compose', 'web']) {
    const coverage = record.coverage?.[name];
    requireValue(
      ['present', 'absent'].includes(coverage?.status) && coverage.evidence,
      'Establish source presence or absence once per family.',
    );
    requireValue(
      coverage.status !== 'absent' || coverage.reason,
      'Source absence needs a recorded search reason.',
    );
    requireValue(
      coverage.status !== 'absent' || !group.references[name].length,
      'Remove rejected candidate links from the workbook before declaring source absence.',
    );
    files.push(coverage.evidence);
  }
  for (const [concern, order] of Object.entries(precedence)) {
    const route = record.routes?.[concern];
    requireValue(
      route && typeof route.figmaSpecified === 'boolean' && route.evidence,
      'Resolve every family concern once.',
    );
    const allowed = concern === 'browser' ? order : ['figma', ...order];
    requireValue(
      allowed.includes(route.primary),
      'Unsupported source for family concern.',
    );
    requireValue(
      !record.coverage[route.primary] ||
        record.coverage[route.primary].status === 'present',
      'Selected source is absent.',
    );
    const preferred = order.find(
      name =>
        !record.coverage[name] || record.coverage[name].status === 'present',
    );
    if (route.primary !== preferred) deviation(route, files);
    files.push(route.evidence);
  }
  const overrides = record.overrides || [];
  requireValue(
    new Set(overrides.map(o => o.dimension)).size === overrides.length,
    'Duplicate family dimension override.',
  );
  for (const o of overrides) {
    requireValue(
      o.dimension &&
        precedence[o.concern || 'design']?.includes(o.primary) &&
        o.reason &&
        o.evidence &&
        typeof o.figmaSpecified === 'boolean',
      'Dimension overrides need a valid concern and explicit evidence.',
    );
    if (o.primary !== record.routes[o.concern || 'design'].primary)
      deviation(o, files);
    requireValue(
      !record.coverage[o.primary] ||
        record.coverage[o.primary].status === 'present',
      'Override selects an absent source.',
    );
    files.push(o.evidence);
  }
  return unique(files);
}
export function validateFamilyUse(source, records) {
  for (const decision of source.decisions) {
    const family =
      records.length === 1
        ? records[0]
        : records.find(r => r.familyId === decision.familyId);
    requireValue(family, 'Identify the shared family for each task decision.');
    const selected =
      family.overrides?.find(o => o.dimension === decision.dimension) ||
      family.routes[decision.concern || 'design'];
    requireValue(
      selected &&
        selected.primary === decision.chosen &&
        selected.figmaSpecified === decision.figmaSpecified,
      'Task decision differs from its shared family decision; resolve the delta once in the family owner.',
    );
  }
}
