// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file index.ts
 * @input Supported Material CSS role names from pinned source wrappers
 * @output Native package token-name and CSS-variable entry point
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
