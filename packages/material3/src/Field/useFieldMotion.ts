// Copyright (c) Meta Platforms, Inc. and affiliates.
// Material spring inputs: Copyright The Android Open Source Project, Apache-2.0.

'use client';

/**
 * @file useFieldMotion.ts
 * @input Field focus/population state, the selected Material motion scheme, and reduced-motion preference
 * @output Continuous Compose spring frames for label, placeholder, indicator, and color
 * @position Shared private motion recipe for native filled and outlined fields
 */

import {useEffect, useRef, useState} from 'react';
import {material3SpringSpecs} from '../foundation.js';
import {
  sampleMaterial3Spring,
  type Material3SpringFrame,
  type Material3SpringSpec,
} from '../motion.js';

type FieldValues = {
  label: number;
  placeholder: number;
  indicator: number;
  color: number;
};

export type FieldMotion = FieldValues & {velocity: FieldValues};

type Key = keyof FieldValues;
type Segment = {
  startMs: number;
  from: Material3SpringFrame;
  target: number;
  spec: Material3SpringSpec;
};

function targets(
  focused: boolean,
  populated: boolean,
  hasLabel: boolean,
): FieldValues {
  return {
    label: focused || populated ? 1 : 0,
    placeholder: !hasLabel || (focused && !populated) ? 1 : 0,
    indicator: focused ? 2 : 1,
    color: focused ? 1 : 0,
  };
}

function spring(
  key: Key,
  expressive: boolean,
  target: number,
): Material3SpringSpec {
  const scheme = material3SpringSpecs[expressive ? 'expressive' : 'standard'];
  const values =
    key === 'label' || key === 'indicator'
      ? scheme.fast.spatial
      : key === 'placeholder' && target > 0
        ? scheme.slow.effects
        : scheme.fast.effects;
  return [values[0], values[1]];
}

function frame(segment: Segment, now: number): Material3SpringFrame {
  return sampleMaterial3Spring(
    segment.spec,
    [{timeMs: 0, target: segment.target}],
    Math.max(0, now - segment.startMs),
    segment.from,
  );
}

/** Reversals start at the current spring position and velocity. */
export function useFieldMotion(
  focused: boolean,
  populated: boolean,
  hasLabel: boolean,
  expressive: boolean,
): FieldMotion {
  const desired = targets(focused, populated, hasLabel);
  const [motion, setMotion] = useState<FieldMotion>({
    ...desired,
    velocity: {label: 0, placeholder: 0, indicator: 0, color: 0},
  });
  const segments = useRef<Record<Key, Segment> | null>(null);
  const animation = useRef<number | null>(null);
  const settledSince = useRef<number | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const keys: Key[] = ['label', 'placeholder', 'indicator', 'color'];
    const cancel = () => {
      if (animation.current !== null) {
        cancelAnimationFrame(animation.current);
      }
      animation.current = null;
    };
    const snap = () => {
      cancel();
      segments.current = null;
      settledSince.current = null;
      setMotion({
        ...desired,
        velocity: {label: 0, placeholder: 0, indicator: 0, color: 0},
      });
    };
    if (media.matches) {
      snap();
      media.addEventListener('change', onPreferenceChange);
      return () => {
        cancel();
        media.removeEventListener('change', onPreferenceChange);
      };
    }
    const now = performance.now();
    const previous = segments.current;
    const next = {} as Record<Key, Segment>;
    for (const key of keys) {
      const from = previous
        ? frame(previous[key], now)
        : {position: motion[key], velocity: 0};
      next[key] = {
        startMs: now,
        from,
        target: desired[key],
        spec: spring(key, expressive, desired[key]),
      };
    }
    segments.current = next;
    settledSince.current = null;
    const paint = () => {
      const current = segments.current;
      if (!current) {
        return;
      }
      const time = performance.now();
      const value = {} as FieldValues;
      const velocity = {} as FieldValues;
      let settled = true;
      for (const key of keys) {
        const sample = frame(current[key], time);
        value[key] = sample.position;
        velocity[key] = sample.velocity;
        if (
          Math.abs(sample.position - current[key].target) > 0.0001 ||
          Math.abs(sample.velocity) > 0.0001
        ) {
          settled = false;
        }
      }
      setMotion({...value, velocity});
      if (settled) {settledSince.current ??= time;}
      else {settledSince.current = null;}
      // An underdamped spring can briefly cross the position and velocity
      // thresholds before the final oscillation has settled.
      if (
        (settledSince.current !== null && time - settledSince.current >= 200) ||
        time - now >= 1600
      ) {
        animation.current = null;
        setMotion({
          ...desired,
          velocity: {label: 0, placeholder: 0, indicator: 0, color: 0},
        });
      } else {
        animation.current = requestAnimationFrame(paint);
      }
    };
    cancel();
    animation.current = requestAnimationFrame(paint);
    media.addEventListener('change', onPreferenceChange);
    function onPreferenceChange() {
      if (media.matches) {
        snap();
      }
    }
    return () => {
      cancel();
      media.removeEventListener('change', onPreferenceChange);
    };
  }, [focused, populated, hasLabel, expressive]);

  return motion;
}
