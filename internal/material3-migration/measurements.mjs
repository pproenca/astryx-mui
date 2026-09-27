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
export function compareSourceValueTrace(reference, actual, spec, commit) {
  requireValue(spec.format === 'source-values-v1' && reference.composeCommit === commit &&
    actual.producer?.kind === 'browser' && actual.producer.command &&
    actual.unit === spec.unit && spec.approvalReference,
  'Native source-value trace lacks pinned provenance or approval');
  const value = reference.sourceValues;
  let positionError = 0, velocityError = 0, alphaError = 0, alphaVelocityError = 0;
  const checkSamples = (samples, expected, settledAtMs) => {
    requireValue(samples.length >= 3 && samples[0].timeMs === 0 &&
      samples.at(-1).timeMs === settledAtMs,
    'Native trace omits its start, intermediates or settled frame');
    let before;
    for (const sample of samples) {
      requireValue(Number.isFinite(sample.timeMs) && (!before || sample.timeMs > before.sample.timeMs),
      'Native trace timestamps are invalid');
      const source = expected(sample.timeMs);
      for (const key of Object.keys(source)) {
        requireValue(Number.isFinite(sample[key]), `Native trace ${key} is invalid`);
        const error = Math.abs(sample[key] - source[key]);
        if (key === 'alpha') alphaError = Math.max(alphaError, error);
        else positionError = Math.max(positionError, error);
        if (before) {
          const seconds = (sample.timeMs - before.sample.timeMs) / 1000;
          const drift = Math.abs((sample[key] - before.sample[key] - source[key] + before.source[key]) / seconds);
          if (key === 'alpha') alphaVelocityError = Math.max(alphaVelocityError, drift);
          else velocityError = Math.max(velocityError, drift);
        }
      }
      before = {sample, source};
    }
  };
  if (spec.unit === 'alpha-radius-px-center-px') {
    requireValue(actual.traces?.length === 2 &&
      actual.inputs?.size?.width === value.size.width &&
      actual.inputs?.size?.height === value.size.height &&
      actual.inputs?.origin?.x === value.presses[0].origin.x &&
      actual.inputs?.origin?.y === value.presses[0].origin.y &&
      actual.inputs?.startMs === value.presses[0].startMs,
    'Native press trace inputs differ from pinned Compose source values');
    const cubic = (first, second, t) => 3 * (1-t)**2*t*first + 3*(1-t)*t**2*second + t**3;
    const eased = fraction => {
      if (fraction <= 0) return 0;
      if (fraction >= 1) return 1;
      let low = 0, high = 1;
      for (let i = 0; i < 48; i++) {
        const mid = (low + high) / 2;
        if (cubic(.4, .2, mid) < fraction) low = mid; else high = mid;
      }
      return cubic(0, 1, (low + high) / 2);
    };
    for (const bounded of [true, false]) {
      const trace = actual.traces.find(item => item.bounded === bounded);
      requireValue(trace && trace.settledAtMs === value.radiusAndCenterMs,
      'Native press geometry did not settle at the pinned time');
      const center = {x:value.size.width/2,y:value.size.height/2};
      const origin = bounded ? value.presses[0].origin : center;
      const endRadius = bounded ? value.boundedEndRadius : value.unboundedEndRadius;
      checkSamples(trace.samples, timeMs => ({
        radius:value.startRadius+(endRadius-value.startRadius)*eased(Math.min(timeMs/value.radiusAndCenterMs,1)),
        x:origin.x+(center.x-origin.x)*Math.min(timeMs/value.radiusAndCenterMs,1),
        y:origin.y+(center.y-origin.y)*Math.min(timeMs/value.radiusAndCenterMs,1),
        alpha:Math.min(timeMs/value.fadeInMs,1),
      }), value.radiusAndCenterMs);
    }
  } else if (spec.unit === 'alpha') {
    requireValue(isDeepStrictEqual(actual.inputs?.events, value.events) &&
      actual.settledAtMs === value.events.at(-1).timeMs + value.events.at(-1).durationMs &&
      actual.samples?.length === 195,
    'Native state trace inputs or settlement differ from pinned Compose');
    const expected = timeMs => {
      let from = 0, target = 0, started = 0, duration = 0;
      for (const event of value.events) {
        if (event.timeMs > timeMs) break;
        from += (target-from)*Math.min((event.timeMs-started)/(duration || 1),1);
        target = value.opacity[event.state] ?? 0;
        started = event.timeMs;
        duration = event.durationMs;
      }
      return {alpha:from+(target-from)*Math.min((timeMs-started)/(duration || 1),1)};
    };
    checkSamples(actual.samples, expected, actual.settledAtMs);
  } else throw new Error('Unsupported native source-value trace unit');
  requireValue(positionError <= spec.positionTolerance && velocityError <= spec.velocityTolerance &&
    alphaError <= (spec.alphaTolerance ?? spec.positionTolerance) &&
    alphaVelocityError <= (spec.alphaVelocityTolerance ?? spec.velocityTolerance),
  'Native Ripple trajectory or velocity exceeds the approved Compose limits');
  return {positionError, velocityError, alphaError, alphaVelocityError, settlingErrorMs:0};
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
