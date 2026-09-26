// Copyright (c) Meta Platforms, Inc. and affiliates.
// Spring equations: Copyright The Android Open Source Project, Apache-2.0.

/**
 * @file motion.ts
 * @input Compose spring damping/stiffness and a timed sequence of target changes
 * @output Position and velocity at a requested time, including interruptions
 * @position Native Material 3 motion foundation; pixel values are caller supplied
 *
 * Uses the analytical damped oscillator from pinned Compose SpringSimulation.
 * A retarget starts from the preceding position and velocity, so reversing a
 * running spring remains continuous. Reduced motion is a component decision:
 * callers set the final state immediately while retaining non-motion feedback.
 */

export type Material3SpringSpec = readonly [
  dampingRatio: number,
  stiffness: number,
];
export type Material3SpringTarget = {timeMs: number; target: number};
export type Material3SpringFrame = {position: number; velocity: number};

function springSegment(
  spec: Material3SpringSpec,
  start: Material3SpringFrame,
  target: number,
  elapsedMs: number,
): Material3SpringFrame {
  const [dampingRatio, stiffness] = spec;
  const naturalFrequency = Math.sqrt(stiffness);
  const time = elapsedMs / 1000;
  const displacement = start.position - target;
  const r = -dampingRatio * naturalFrequency;
  let position: number;
  let velocity: number;
  if (dampingRatio > 1) {
    const offset =
      naturalFrequency * Math.sqrt(dampingRatio * dampingRatio - 1);
    const plus = r + offset;
    const minus = r - offset;
    const b = (minus * displacement - start.velocity) / (minus - plus);
    const a = displacement - b;
    position = a * Math.exp(minus * time) + b * Math.exp(plus * time);
    velocity =
      a * minus * Math.exp(minus * time) + b * plus * Math.exp(plus * time);
  } else if (dampingRatio === 1) {
    const b = start.velocity + naturalFrequency * displacement;
    const decay = Math.exp(-naturalFrequency * time);
    position = (displacement + b * time) * decay;
    velocity = (b - naturalFrequency * (displacement + b * time)) * decay;
  } else {
    const frequency =
      naturalFrequency * Math.sqrt(1 - dampingRatio * dampingRatio);
    const cosine = displacement;
    const sine = (-r * displacement + start.velocity) / frequency;
    const phase = frequency * time;
    const decay = Math.exp(r * time);
    position = decay * (cosine * Math.cos(phase) + sine * Math.sin(phase));
    velocity =
      position * r +
      decay *
        (-frequency * cosine * Math.sin(phase) +
          frequency * sine * Math.cos(phase));
  }
  return {
    position: Math.fround(position + target),
    velocity: Math.fround(velocity),
  };
}

/** Sample a Compose-style spring through retargets and reversals. */
export function sampleMaterial3Spring(
  spec: Material3SpringSpec,
  changes: readonly Material3SpringTarget[],
  timeMs: number,
  initial: Material3SpringFrame = {position: 0, velocity: 0},
): Material3SpringFrame {
  if (
    !Number.isFinite(spec[0]) ||
    spec[0] < 0 ||
    !Number.isFinite(spec[1]) ||
    spec[1] <= 0 ||
    !Number.isFinite(timeMs) ||
    timeMs < 0 ||
    !Number.isFinite(initial.position) ||
    !Number.isFinite(initial.velocity)
  )
    {throw new RangeError('Invalid Material spring input');}
  if (
    !changes.length ||
    changes[0].timeMs !== 0 ||
    changes.some(
      (item, index) =>
        !Number.isFinite(item.target) ||
        !Number.isFinite(item.timeMs) ||
        (index > 0 && item.timeMs <= changes[index - 1].timeMs),
    )
  )
    {throw new RangeError(
      'Material spring targets must start at 0 and increase',
    );}
  let segmentStart = 0;
  let frame = initial;
  let target = changes[0].target;
  for (let index = 1; index < changes.length; index++) {
    const change = changes[index];
    if (change.timeMs > timeMs) {break;}
    frame = springSegment(spec, frame, target, change.timeMs - segmentStart);
    segmentStart = change.timeMs;
    target = change.target;
  }
  return springSegment(spec, frame, target, timeMs - segmentStart);
}
