// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Revision-bound receipts, pinned Compose/Figma/Web baselines and independent recordings.
 * @output Recomputed pixel, trajectory and browser evidence under the pinned source authority.
 * @position Migration-only verification. Product regression tests outlive this tool.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {hash} from './workbook.mjs';
import {compare} from './compare.mjs';
import {compareTrace, measurePerformance} from './measurements.mjs';
const required = (condition, message) => {
  if (!condition) throw new Error(message);
};
export async function fileAt(repo, relative) {
  required(
    typeof relative === 'string' &&
      relative.trim() &&
      !path.isAbsolute(relative) &&
      !relative.split(/[\\/]/).includes('..'),
    'Evidence must be a repository-relative file',
  );
  const root = await fs.realpath(repo),
    file = await fs.realpath(path.resolve(root, relative));
  required(
    file.startsWith(root + path.sep) && (await fs.stat(file)).isFile(),
    `Evidence escapes repository: ${relative}`,
  );
  return file;
}
export function validateSource(source, policy) {
  required(
    source.authority ===
      (policy.schemaVersion >= 4 ? 'compose-first' : 'figma-first'),
    'The selected source authority differs from policy; prepare the source decision again',
  );
  required(
    source.web?.commit === policy.materialWebCommit,
    'Source baseline must pin Material Web',
  );
  if (policy.schemaVersion >= 3) {
    required(
      source.compose?.commit === policy.androidxCommit &&
        source.compose.inventory === policy.composeInventory,
      'Source baseline must pin Compose and its source inventory.',
    );
    required(
      source.figma?.sha256 === policy.figmaSha256 &&
        source.baselineId === policy.baselineId,
      'Source baseline differs from the frozen Material 3 + Expressive scope.',
    );
    required(
      Array.isArray(source.performance) &&
        source.performance.length &&
        source.performance.every(p => p.id) &&
        new Set(source.performance.map(p => p.id)).size ===
          source.performance.length,
      'Declare approved browser/device performance profiles.',
    );
    required(
      Array.isArray(source.compose.tests) &&
        source.compose.tests.every(t => t.id && t.source) &&
        new Set(source.compose.tests.map(t => t.id)).size ===
          source.compose.tests.length &&
        (source.compose.tests.length ||
          (source.compose.reason && source.compose.evidence)),
      'Map upstream test cases or document missing Compose coverage.',
    );
  }
  required(
    /^[a-f0-9]{64}$/.test(source.figma?.sha256 || '') && source.figma.inventory,
    'Source baseline must identify the Figma export and inventory',
  );
  required(
    Array.isArray(source.guidance) && source.guidance.length,
    'Capture relevant Material guidance',
  );
  for (const item of source.guidance)
    required(
      /^https:\/\/m3\.material\.io\//.test(item.url) &&
        item.capturedAt &&
        item.capture,
      'Guidance needs official URL, capture date and local capture',
    );
  required(
    Array.isArray(source.decisions) && source.decisions.length,
    'Resolve each relevant source discrepancy',
  );
  for (const decision of source.decisions) {
    required(
      decision.dimension &&
        (decision.concern === 'browser'
          ? ['web', 'web-platform']
          : policy.sourceAuthority || ['figma', 'website', 'web']
        ).includes(decision.chosen) &&
        typeof decision.figmaSpecified === 'boolean' &&
        decision.reason &&
        decision.evidence,
      'Resolve the source for each design dimension',
    );
    required(
      policy.schemaVersion >= 4 ||
        !decision.figmaSpecified ||
        decision.chosen === 'figma',
      'Figma must win wherever it specifies the design',
    );
  }
  required(
    Array.isArray(source.scenarios) && source.scenarios.length,
    'Source baseline must enumerate expected scenarios',
  );
  required(
    new Set(source.scenarios.map(s => s.id)).size === source.scenarios.length,
    'Duplicate source scenario IDs',
  );
  for (const s of source.scenarios) {
    required(
      s.id && s.sourceReference && s.baseline && s.environment,
      'Scenario needs a pinned visual baseline and rendering environment',
    );
    for (const key of [
      'browser',
      'os',
      'dpr',
      'viewport',
      'fonts',
      'theme',
      'content',
      'state',
    ])
      required(
        s.environment[key] !== undefined,
        `Missing rendering condition: ${key}`,
      );
    const t = s.tolerance || {changedPixels: 0, maxChannelDelta: 0};
    required(
      Number.isInteger(t.changedPixels) &&
        t.changedPixels >= 0 &&
        Number.isInteger(t.maxChannelDelta) &&
        t.maxChannelDelta >= 0 &&
        t.maxChannelDelta <= 255,
      'Invalid pixel tolerance',
    );
    if (t.changedPixels || t.maxChannelDelta)
      required(
        t.approvalReference && t.reason,
        'Any pixel tolerance requires an explicit reviewed exception',
      );
  }
}
export function validateReceipt(receipt, policy, task, revision) {
  if (policy.schemaVersion >= 3)
    required(
      receipt.androidxCommit === policy.androidxCommit &&
        receipt.baselineId === policy.baselineId,
      'Receipt has stale Compose revision or scope baseline.',
    );
  required(
    receipt.strategyId === policy.strategyId &&
      receipt.taskId === task['Task ID'] &&
      receipt.revision === revision &&
      receipt.materialWebCommit === policy.materialWebCommit,
    'Receipt has stale strategy, task, code revision or source',
  );
  for (const key of policy.evidenceRequirements) {
    const check = receipt.checks?.[key];
    const sourceOnlyNA =
      task.Layer === 'Source' &&
      receipt.reviewKind === 'document' &&
      check?.result === 'N/A' &&
      check.reason;
    required(
      (check?.result === 'Pass' || sourceOnlyNA) &&
        Array.isArray(check.evidence) &&
        check.evidence.length,
      `Missing evidence: ${key}`,
    );
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
    required(
      ['Pass', 'N/A'].includes(item?.result) && item.reason,
      `Missing QA evidence: ${key}`,
    );
  }
  required(
    ['visual', 'document'].includes(receipt.reviewKind),
    'Declare visual/document review',
  );
  if (receipt.reviewKind === 'document')
    required(
      [
        'Architecture',
        'Review',
        'Planning',
        'Source',
        'Extension planning',
      ].includes(task.Layer),
      'Implementation requires visual review',
    );
  else
    required(
      /^https?:\/\//.test(receipt.preview || '') &&
        receipt.sourceDecision &&
        receipt.sourceDecisionSha256,
      'Visual review requires preview and hashed source decision',
    );
}
export function validateMotion(source, motion, policy) {
  required(
    motion && source.motion,
    'Motion applicability must be resolved in the source baseline',
  );
  required(
    typeof source.motion.applicable === 'boolean',
    'Declare motion applicability explicitly',
  );
  if (!source.motion.applicable) {
    required(
      motion.applicable === false &&
        source.motion.reason &&
        source.motion.evidence,
      'Static components require source-backed motion N/A',
    );
    return;
  }
  required(
    motion.applicable === true &&
      Array.isArray(motion.observations) &&
      motion.observations.length >= 3,
    'Watch the motion reference and record start, intermediate and end observations',
  );
  required(
    motion.reference === source.motion.reference &&
      motion.referenceSha256 === source.motion.sha256,
    'Motion reference changed',
  );
  required(
    /\.(gif|mp4|webm|mov)$/i.test(motion.reference || ''),
    'Motion review needs the animation media, not a poster or web URL',
  );
  required(
    motion.actualRecording &&
      motion.actualRecording !== motion.reference &&
      /\.(gif|mp4|webm|mov)$/i.test(motion.actualRecording),
    'Capture native motion independently for playback review',
  );
  required(
    motion.watchedBy && motion.watchedAt && motion.contactSheet,
    'Record who watched the clip and a timestamped contact sheet',
  );
  const times = motion.observations.map(o => o.timeMs);
  required(
    new Set(times).size >= 3 &&
      motion.observations.every(
        o => Number.isFinite(o.timeMs) && o.timeMs >= 0 && o.note,
      ),
    'Record distinct timed motion observations',
  );
  for (const kind of policy.motionScenarios) {
    const check = motion.scenarios?.[kind];
    required(
      ['Pass', 'N/A'].includes(check?.result) && check.reason && check.evidence,
      `Missing motion scenario: ${kind}`,
    );
  }
  const frames = source.scenarios.filter(s => Number.isFinite(s.timeMs));
  required(
    frames.length >= 3 && new Set(frames.map(s => s.timeMs)).size >= 3,
    'Motion needs start, intermediate and end frames, not just endpoints',
  );
}
export async function validateEvidence(repo, receipt, policy, task, revision) {
  validateReceipt(receipt, policy, task, revision);
  const fingerprints = {};
  async function fingerprint(relative) {
    const file = await fileAt(repo, relative);
    fingerprints[relative] = hash(await fs.readFile(file));
    return file;
  }
  for (const check of Object.values(receipt.checks))
    for (const item of check.evidence) await fingerprint(item);
  if (receipt.reviewKind === 'visual') {
    const sourceFile = await fingerprint(receipt.sourceDecision);
    required(
      fingerprints[receipt.sourceDecision] === receipt.sourceDecisionSha256,
      'Source decision changed after verification',
    );
    const source = JSON.parse(await fs.readFile(sourceFile, 'utf8'));
    validateSource(source, policy);
    if (policy.schemaVersion >= 3) {
      await fingerprint(source.compose.inventory);
      if (source.compose.evidence) await fingerprint(source.compose.evidence);
      const upstream = receipt.upstreamTests || [];
      required(
        new Set(upstream.map(t => t.id)).size === upstream.length &&
          upstream.length === source.compose.tests.length,
        'Upstream test coverage differs from the selected cases.',
      );
      for (const expected of source.compose.tests) {
        const actual = upstream.find(t => t.id === expected.id);
        required(
          expected.id &&
            expected.source &&
            actual &&
            ['Pass', 'N/A'].includes(actual.result) &&
            actual.reason &&
            actual.evidence &&
            (actual.result === 'N/A' || actual.nativeTest),
          'Missing translated upstream test or explicit platform difference.',
        );
        await fingerprint(actual.evidence);
        if (actual.nativeTest) await fingerprint(actual.nativeTest);
      }
      const performance = receipt.performance || [];
      required(
        performance.length === source.performance.length &&
          new Set(performance.map(p => p.id)).size === performance.length,
        'Browser/device performance coverage differs.',
      );
      for (const profile of source.performance) {
        const run = performance.find(p => p.id === profile.id);
        required(run?.actual, 'Missing performance recording.');
        measurePerformance(
          JSON.parse(await fs.readFile(await fingerprint(run.actual), 'utf8')),
          profile,
        );
      }
      if (source.motion?.applicable) {
        const numeric = source.motion.numeric;
        required(
          typeof numeric?.applicable === 'boolean',
          'Declare numeric motion applicability.',
        );
        if (!numeric.applicable) {
          required(
            numeric.reason && numeric.evidence,
            'Numeric motion N/A requires source evidence.',
          );
          await fingerprint(numeric.evidence);
        } else {
          const runs = receipt.motion?.traces || [];
          required(
            Array.isArray(numeric.traces) &&
              numeric.traces.length &&
              numeric.traces.every(t => t.id) &&
              new Set(numeric.traces.map(t => t.id)).size ===
                numeric.traces.length &&
              runs.length === numeric.traces.length &&
              new Set(runs.map(t => t.id)).size === runs.length,
            'Missing independent motion trajectories.',
          );
          for (const spec of numeric.traces) {
            const run = runs.find(t => t.id === spec.id);
            required(
              run?.actual && run.actual !== spec.reference,
              'Trace reference and browser capture must be independent.',
            );
            compareTrace(
              JSON.parse(
                await fs.readFile(await fingerprint(spec.reference), 'utf8'),
              ),
              JSON.parse(
                await fs.readFile(await fingerprint(run.actual), 'utf8'),
              ),
              spec,
              policy.androidxCommit,
            );
          }
        }
      }
    }
    for (const g of source.guidance) await fingerprint(g.capture);
    await fingerprint(source.figma.inventory);
    for (const decision of source.decisions)
      await fingerprint(decision.evidence);
    const actuals = receipt.visualComparisons || [];
    required(
      actuals.length === source.scenarios.length,
      'Visual scenario coverage differs from the resolved source baseline',
    );
    required(
      new Set(actuals.map(a => a.id)).size === actuals.length,
      'Duplicate actual visual scenarios',
    );
    for (const scenario of source.scenarios) {
      const actual = actuals.find(a => a.id === scenario.id);
      required(actual, 'Missing visual scenario');
      required(
        isDeepStrictEqual(actual.environment, scenario.environment),
        'Rendering conditions differ from baseline',
      );
      if (scenario.timeMs !== undefined)
        required(
          actual.timeMs === scenario.timeMs,
          'Motion frame timestamps differ',
        );
      required(
        scenario.baseline !== actual.actual,
        'Reference and actual must be independently captured files',
      );
      const measured = await compare(
        await fingerprint(scenario.baseline),
        await fingerprint(actual.actual),
        await fingerprint(actual.diff),
        true,
      );
      const tolerance = scenario.tolerance || {
        changedPixels: 0,
        maxChannelDelta: 0,
      };
      required(
        measured.changedPixels <= tolerance.changedPixels &&
          measured.maxChannelDelta <= tolerance.maxChannelDelta,
        `Pixel mismatch ${scenario.id}: ${measured.changedPixels} pixels, max channel delta ${measured.maxChannelDelta}`,
      );
    }
    const motion = receipt.motion;
    validateMotion(source, motion, policy);
    if (source.motion.applicable) {
      const media = await fingerprint(motion.reference);
      const bytes = await fs.readFile(media);
      const signature = bytes.subarray(0, 6).toString('ascii');
      required(
        signature === 'GIF87a' ||
          signature === 'GIF89a' ||
          bytes.subarray(4, 8).toString('ascii') === 'ftyp' ||
          bytes.subarray(0, 4).toString('hex') === '1a45dfa3',
        'Motion reference is not supported animation media',
      );
      required(
        fingerprints[motion.reference] === motion.referenceSha256,
        'Motion media digest mismatch',
      );
      await fingerprint(motion.contactSheet);
      await fingerprint(motion.actualRecording);
      for (const check of Object.values(motion.scenarios))
        await fingerprint(check.evidence);
    }
    if (source.motion.evidence) await fingerprint(source.motion.evidence);
    if (task.Layer === 'Foundation' || task.Layer === 'QA')
      for (const dimension of policy.foundationDimensions) {
        required(
          source.decisions.some(d => d.dimension === dimension),
          `Foundation source decision missing: ${dimension}`,
        );
        for (const mode of ['light', 'dark'])
          required(
            source.scenarios.some(
              s =>
                s.dimensions?.includes(dimension) &&
                s.environment.theme === mode,
            ),
            `Missing ${mode} foundation visual coverage: ${dimension}`,
          );
      }
  }
  return fingerprints;
}
