// Copyright (c) Meta Platforms, Inc. and affiliates.
// Source motion and state data: Copyright 2023 Google LLC, Apache-2.0.

/**
 * @file material3Motion.ts
 * @input Pinned Material Web v0.192 motion and state wrapper values
 * @output Theme-owned durations, easings, and state-layer color recipe
 * @position Material 3 theme foundation; component motion is mapped separately
 *
 * These values are Sass-only in Material Web, not public --md-sys-motion CSS
 * variables. Component styles must apply a CSS prefers-reduced-motion override.
 */

import source from './material3MotionSource.json';

export const material3Durations = source.durations;
export const material3Easings = source.easings;
export const material3StateLayerOpacity = source.stateLayerOpacity;

export type Material3StateLayer = keyof typeof material3StateLayerOpacity;

/** Compose a foreground-colored layer over the current surface. */
export function material3StateLayerColor(
  foreground: string,
  state: Material3StateLayer,
): string {
  return `color-mix(in srgb, ${foreground} ${material3StateLayerOpacity[state] * 100}%, transparent)`;
}
