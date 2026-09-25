// Copyright (c) Meta Platforms, Inc. and affiliates.
// Source type data: Copyright 2023 Google LLC, Apache-2.0.

/**
 * @file material3Typography.ts
 * @input Pinned Material Web v0.192 typeface, active typescale, and generated tracking values
 * @output Material 3 type role data and CSS style values with a browser font fallback
 * @position Material 3 theme foundation; consumed by theme and component typography mappings
 *
 * Roboto is the pinned source typeface. Callers must load Roboto weights 400,
 * 500, and 700 for source-faithful glyph metrics, as Material Web documents.
 */

import source from './material3TypographySource.json';

export const material3Typeface = source.typeface;
export const material3Typescale = source.typescale;
export const material3SourceOnlyTracking = source.sourceOnlyTracking;

export const material3TypeRoles = [
  'display-large',
  'display-medium',
  'display-small',
  'headline-large',
  'headline-medium',
  'headline-small',
  'title-large',
  'title-medium',
  'title-small',
  'body-large',
  'body-medium',
  'body-small',
  'label-large',
  'label-medium',
  'label-small',
] as const;

export type Material3TypeRole = (typeof material3TypeRoles)[number];

type Material3TypeStyle = {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: string;
  letterSpacing: string;
};

export function material3TypeStyle(
  role: Material3TypeRole,
  options: {prominent?: boolean} = {},
): Material3TypeStyle {
  const values = material3Typescale as Record<string, string>;
  const tracking = material3SourceOnlyTracking as Record<string, string>;
  const weightKey =
    options.prominent && `${role}-weight-prominent` in values
      ? `${role}-weight-prominent`
      : `${role}-weight`;
  return {
    fontFamily: `${values[`${role}-font`]}, Arial, sans-serif`,
    fontSize: values[`${role}-size`],
    lineHeight: values[`${role}-line-height`],
    fontWeight: values[weightKey],
    letterSpacing: tracking[`${role}-tracking`],
  };
}
