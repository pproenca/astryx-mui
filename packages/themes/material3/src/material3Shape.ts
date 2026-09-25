// Copyright (c) Meta Platforms, Inc. and affiliates.
// Source shape data: Copyright 2023 Google LLC, Apache-2.0.

/**
 * @file material3Shape.ts
 * @input Pinned Material Web v0.192 shape wrapper values
 * @output Seven CSS corner roles and five Sass corner lists
 * @position Material 3 theme foundation; component shapes are mapped separately
 *
 * Material Web's multi-corner names are Sass-only shorthand values. They are
 * not CSS custom properties and are mirrored for RTL when used by Astryx.
 */

import source from './material3ShapeSource.json';

export const material3CssCorners = source.cssCorners;
export const material3SassOnlyCornerLists = source.sassOnlyCornerLists;

export type Material3CornerListName = keyof typeof material3SassOnlyCornerLists;

export function material3CornerListCss(
  name: Material3CornerListName,
  direction: 'ltr' | 'rtl' = 'ltr',
): string {
  const corners = material3SassOnlyCornerLists[name];
  const values =
    direction === 'rtl' && (name.endsWith('-start') || name.endsWith('-end'))
      ? [corners[1], corners[0], corners[3], corners[2]]
      : corners;
  return values.join(' ');
}
