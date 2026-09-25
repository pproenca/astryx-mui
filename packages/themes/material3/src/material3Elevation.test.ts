// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file material3Elevation.test.ts
 * @input Material 3 elevation source and two-layer projection
 * @output Web-level, source-dp, and independent-shadow regression checks
 * @position Material 3 elevation foundation verification
 */

import {describe, expect, it} from 'vitest';
import source from './material3ElevationSource.json';
import {material3ElevationLayers} from './material3Elevation';

describe('Material 3 elevation', () => {
  it('uses the active web levels rather than generated dp values', () => {
    expect(Object.values(source.systemLevels)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(Object.values(source.generatedDp)).toEqual([0, 1, 3, 6, 8, 12]);
    expect(source.componentCssProperties).toEqual([
      '--md-elevation-level',
      '--md-elevation-shadow-color',
    ]);
  });

  it('retains the distinct key and ambient geometry and opacity', () => {
    const level3 = material3ElevationLayers('level3', '#000');
    expect(level3.key).toEqual({
      boxShadow: '#000 0px 1px 3px 0px',
      opacity: 0.3,
    });
    expect(level3.ambient).toEqual({
      boxShadow: '#000 0px 4px 8px 3px',
      opacity: 0.15,
    });
    expect(material3ElevationLayers('level0', '#000').key.boxShadow).toBe(
      '#000 0px 0px 0px 0px',
    );
  });
});
