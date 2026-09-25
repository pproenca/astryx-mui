// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file material3Motion.test.ts
 * @input Material 3 motion source artifact and theme-owned exports
 * @output Pinned-value, Sass-only classification, and state-layer recipe checks
 * @position Material 3 motion foundation verification
 */

import {describe, expect, it} from 'vitest';
import source from './material3MotionSource.json';
import {
  material3Durations,
  material3Easings,
  material3StateLayerColor,
  material3StateLayerOpacity,
} from './material3Motion';

describe('Material 3 motion and state source', () => {
  it('keeps all pinned Sass-only durations and easing curves, with no invented motion path', () => {
    expect(source.sourceCommit).toBe(
      'cbd34a8921915af94d5ef65c2a69eece41d5b4f3',
    );
    expect(material3Durations).toEqual(source.durations);
    expect(material3Easings).toEqual(source.easings);
    expect(Object.keys(material3Durations)).toHaveLength(16);
    expect(Object.keys(material3Easings)).toHaveLength(10);
    expect(material3Durations['duration-short1']).toBe('50ms');
    expect(material3Durations['duration-extra-long4']).toBe('1000ms');
    expect(material3Easings['easing-standard']).toBe(
      'cubic-bezier(0.2, 0, 0, 1)',
    );
    expect(source.unsupportedPath).toBeNull();
  });

  it('uses all four source opacities to compose foreground-colored state layers', () => {
    expect(material3StateLayerOpacity).toEqual(source.stateLayerOpacity);
    expect(material3StateLayerOpacity['hover-state-layer-opacity']).toBe(0.08);
    expect(material3StateLayerOpacity['focus-state-layer-opacity']).toBe(0.12);
    expect(material3StateLayerOpacity['pressed-state-layer-opacity']).toBe(
      0.12,
    );
    expect(material3StateLayerOpacity['dragged-state-layer-opacity']).toBe(
      0.16,
    );
    expect(
      material3StateLayerColor(
        'var(--md-sys-color-on-surface)',
        'hover-state-layer-opacity',
      ),
    ).toBe(
      'color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)',
    );
  });
});
