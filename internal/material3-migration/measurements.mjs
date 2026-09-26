// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Independent upstream/browser recordings and approved numeric budgets. @output Recomputed trajectory and response comparisons. @position Temporary verification; enduring fixtures/tests belong to product owners. */
import {isDeepStrictEqual} from 'node:util';
const requireValue = (ok, message) => {
  if (!ok) throw new Error(message);
};
const number = n => Number.isFinite(n) && n >= 0;
export function compareTrace(reference, actual, spec, commit) {
  requireValue(
    reference.producer?.kind === 'upstream' &&
      reference.producer.commit === commit &&
      reference.producer.source &&
      reference.producer.command &&
      reference.producer.runtime,
    'Trace reference must identify execution of the pinned upstream source and runtime.',
  );
  requireValue(
    actual.producer?.kind === 'browser' &&
      actual.producer.command &&
      reference.inputs &&
      Object.keys(reference.inputs).length &&
      typeof spec.unit === 'string' &&
      spec.unit.length &&
      isDeepStrictEqual(reference.inputs, actual.inputs) &&
      reference.unit === actual.unit &&
      reference.unit === spec.unit,
    'Trace inputs, coordinate units or producer differ.',
  );
  requireValue(
    spec.approvalReference &&
      number(spec.positionTolerance) &&
      number(spec.velocityTolerance) &&
      number(spec.settlingToleranceMs),
    'Trace tolerances require an approved baseline.',
  );
  const a = actual.samples,
    r = reference.samples;
  requireValue(
    Array.isArray(a) &&
      Array.isArray(r) &&
      r.length >= 3 &&
      a.length === r.length,
    'Trace needs matched start, intermediate and settled samples.',
  );
  let positionError = 0,
    velocityError = 0;
  for (let i = 0; i < r.length; i++) {
    requireValue(
      number(r[i].timeMs) &&
        r[i].timeMs === a[i].timeMs &&
        (!i || r[i].timeMs > r[i - 1].timeMs) &&
        [r[i].position, r[i].velocity, a[i].position, a[i].velocity].every(
          Number.isFinite,
        ),
      'Trace timestamps or values are invalid.',
    );
    positionError = Math.max(
      positionError,
      Math.abs(r[i].position - a[i].position),
    );
    velocityError = Math.max(
      velocityError,
      Math.abs(r[i].velocity - a[i].velocity),
    );
  }
  requireValue(
    number(reference.settledAtMs) &&
      number(actual.settledAtMs) &&
      Math.max(reference.settledAtMs, actual.settledAtMs) <= r.at(-1).timeMs,
    'Trace needs measured settling times within the recording.',
  );
  requireValue(
    positionError <= spec.positionTolerance &&
      velocityError <= spec.velocityTolerance &&
      Math.abs(reference.settledAtMs - actual.settledAtMs) <=
        spec.settlingToleranceMs,
    'Motion trajectory, velocity or settling differs from reference.',
  );
  return {
    positionError,
    velocityError,
    settlingErrorMs: Math.abs(reference.settledAtMs - actual.settledAtMs),
  };
}
export function measurePerformance(actual, spec) {
  requireValue(
    spec.approvalReference &&
      spec.environment?.browser &&
      spec.environment.device &&
      isDeepStrictEqual(actual.environment, spec.environment),
    'Performance requires the approved browser/device profile.',
  );
  requireValue(
    number(spec.maxInputLatencyMs) &&
      number(spec.frameBudgetMs) &&
      spec.frameBudgetMs > 0 &&
      number(spec.maxLongFrameRatio) &&
      spec.maxLongFrameRatio <= 1 &&
      Number.isInteger(spec.minInputSamples) &&
      spec.minInputSamples > 0 &&
      Number.isInteger(spec.minFrameSamples) &&
      spec.minFrameSamples > 0,
    'Invalid performance budgets or sampling requirements.',
  );
  requireValue(
    Array.isArray(actual.inputLatencyMs) &&
      actual.inputLatencyMs.length >= spec.minInputSamples &&
      actual.inputLatencyMs.every(number) &&
      Array.isArray(actual.frameIntervalsMs) &&
      actual.frameIntervalsMs.length >= spec.minFrameSamples &&
      actual.frameIntervalsMs.every(n => number(n) && n > 0),
    'Insufficient or invalid browser timing samples.',
  );
  const inputLatencyMs = Math.max(...actual.inputLatencyMs),
    longFrameRatio =
      actual.frameIntervalsMs.filter(n => n > spec.frameBudgetMs).length /
      actual.frameIntervalsMs.length;
  requireValue(
    inputLatencyMs <= spec.maxInputLatencyMs &&
      longFrameRatio <= spec.maxLongFrameRatio,
    'Input response or frame pacing exceeds the approved budget.',
  );
  return {inputLatencyMs, longFrameRatio};
}
