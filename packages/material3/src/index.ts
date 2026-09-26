// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file index.ts
 * @input Supported Material CSS names and the pinned Compose-first foundation graph
 * @output Native token names, values, typed resolver and CSS-variable entry point
 * @position Public native Material 3 package entry point
 */

export {
  material3ComponentTokens,
  material3ShapeRoles,
  material3SystemColorRoles,
  material3TypeRoles,
  material3TypefaceRoles,
  material3Var,
} from './tokens.js';
export type {
  Material3ComponentToken,
  Material3ShapeToken,
  Material3SystemColorToken,
  Material3TokenName,
  Material3TypefaceToken,
  Material3TypescaleToken,
} from './tokens.js';
export {
  material3ColorValues,
  material3ComponentDefaults,
  material3CornerShapes,
  material3ElevationLevels,
  material3ExpressiveLightColors,
  material3ExpressiveShapes,
  material3FoundationGeometry,
  material3IconDefaults,
  material3KitModeNames,
  material3SpringSpecs,
  material3StandardDarkColors,
  material3StandardLightColors,
  material3StateOpacity,
  material3TokenCss,
  material3TokenValues,
  material3TypeStyles,
  resolveMaterial3Token,
} from './foundation.js';
export type {
  Material3KitScheme,
  Material3Scheme,
  Material3TokenProfile,
} from './foundation.js';
