// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file source.ts
 * @input Material 3 theme definition and source-backed foundation exports
 * @output Source theme package entry point for builders and tools
 * @position Public Material 3 theme source entry point
 */

export {material3Theme} from './material3Theme';
export {material3IconRegistry} from './material3Icons';
export {
  material3LightColorScheme,
  material3DarkColorScheme,
} from './material3Colors';
export {material3TypeStyle, material3TypeRoles} from './material3Typography';
export {material3CssCorners, material3CornerListCss} from './material3Shape';
export {
  material3Durations,
  material3Easings,
  material3StateLayerOpacity,
} from './material3Motion';
export {material3ComponentGeometry} from './material3Spatial';
export {material3ElevationLayers} from './material3Elevation';
