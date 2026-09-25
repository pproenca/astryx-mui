// Copyright (c) Meta Platforms, Inc. and affiliates.
// Source elevation data: Copyright 2022-2023 Google LLC, Apache-2.0.

/**
 * @file material3Elevation.ts
 * @input Pinned Material Web elevation geometry and a theme shadow color
 * @output Exact key and ambient shadow layers for six web elevation levels
 * @position Material 3 theme foundation; component stacking stays component-owned
 *
 * Material Web renders two independently translucent shadow layers. Keep
 * separate pseudo-elements or elements when applying these values; merging
 * the two box shadows changes the result where they overlap.
 */

import source from './material3ElevationSource.json';

export type Material3ElevationLevel = keyof typeof source.layers;

export function material3ElevationLayers(
  level: Material3ElevationLevel,
  shadowColor: string,
) {
  const layers = source.layers[level];
  return {
    key: {
      boxShadow: layers.key.boxShadow.replace(source.sampleColor, shadowColor),
      opacity: layers.key.opacity,
    },
    ambient: {
      boxShadow: layers.ambient.boxShadow.replace(
        source.sampleColor,
        shadowColor,
      ),
      opacity: layers.ambient.opacity,
    },
  };
}
