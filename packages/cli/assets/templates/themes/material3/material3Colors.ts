// Copyright (c) Meta Platforms, Inc. and affiliates.
// Source palette and role data: Copyright 2023 Google LLC, Apache-2.0.

/**
 * @file material3Colors.ts
 * @input Pinned Material Web v0.192 palette and light/dark role maps in material3ColorSource.json
 * @output Reference palette and resolved Material 3 system color schemes
 * @position Material 3 theme foundation; consumed by the theme and component overrides
 *
 * The palette is source data, not a promise that Material Web exposes
 * --md-ref-palette-* CSS custom properties. Its theming guide explicitly does not.
 */

import source from './material3ColorSource.json';

export const material3ColorSourceCommit = source.sourceCommit;
export const material3ReferencePalette = source.palette;

export type Material3SystemColorRole = keyof typeof source.lightRolePaletteKeys;
export type Material3SystemColorScheme = Record<
  Material3SystemColorRole,
  string
>;

function resolveScheme(
  references: Record<Material3SystemColorRole, string>,
): Material3SystemColorScheme {
  return Object.fromEntries(
    Object.entries(references).map(([role, paletteKey]) => [
      role,
      material3ReferencePalette[
        paletteKey as keyof typeof material3ReferencePalette
      ],
    ]),
  ) as Material3SystemColorScheme;
}

export const material3LightColorScheme = resolveScheme(
  source.lightRolePaletteKeys,
);
export const material3DarkColorScheme = resolveScheme(
  source.darkRolePaletteKeys,
);
