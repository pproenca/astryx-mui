// Copyright (c) Meta Platforms, Inc. and affiliates.
// Material CSS role names: Copyright 2023 Google LLC, Apache-2.0.

/**
 * @file tokens.ts
 * @input CSS-backed role names in pinned Material Web wrappers and the approved Material 3 family contract
 * @output Narrow types and references for supported Material CSS custom properties
 * @position Native token API; canonical values and alias emission follow in the foundation migration
 *
 * These are property names, not a second value map. In particular, generated
 * palette and tracking data are not represented as public --md-* CSS roles.
 */

export const material3SystemColorRoles = [
  'background',
  'error',
  'error-container',
  'inverse-on-surface',
  'inverse-primary',
  'inverse-surface',
  'on-background',
  'on-error',
  'on-error-container',
  'on-primary',
  'on-primary-container',
  'on-primary-fixed',
  'on-primary-fixed-variant',
  'on-secondary',
  'on-secondary-container',
  'on-secondary-fixed',
  'on-secondary-fixed-variant',
  'on-surface',
  'on-surface-variant',
  'on-tertiary',
  'on-tertiary-container',
  'on-tertiary-fixed',
  'on-tertiary-fixed-variant',
  'outline',
  'outline-variant',
  'primary',
  'primary-container',
  'primary-fixed',
  'primary-fixed-dim',
  'scrim',
  'secondary',
  'secondary-container',
  'secondary-fixed',
  'secondary-fixed-dim',
  'shadow',
  'surface',
  'surface-bright',
  'surface-container',
  'surface-container-high',
  'surface-container-highest',
  'surface-container-low',
  'surface-container-lowest',
  'surface-dim',
  'surface-tint',
  'surface-variant',
  'tertiary',
  'tertiary-container',
  'tertiary-fixed',
  'tertiary-fixed-dim',
] as const;

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

export const material3TypefaceRoles = [
  'brand',
  'plain',
  'weight-bold',
  'weight-medium',
  'weight-regular',
] as const;

export const material3ShapeRoles = [
  'corner-extra-large',
  'corner-extra-small',
  'corner-full',
  'corner-large',
  'corner-medium',
  'corner-none',
  'corner-small',
] as const;

/** CSS-backed component properties already present in the compatibility source. */
export const material3ComponentTokens = [
  '--md-divider-color',
  '--md-divider-thickness',
  '--md-badge-color',
  '--md-badge-large-color',
  '--md-badge-large-label-text-color',
  '--md-badge-large-label-text-font',
  '--md-badge-large-label-text-line-height',
  '--md-badge-large-label-text-size',
  '--md-badge-large-label-text-weight',
  '--md-badge-large-shape',
  '--md-badge-large-size',
  '--md-badge-shape',
  '--md-badge-size',
] as const;

type SystemColorRole = (typeof material3SystemColorRoles)[number];
type TypeRole = (typeof material3TypeRoles)[number];
type TypefaceRole = (typeof material3TypefaceRoles)[number];
type ShapeRole = (typeof material3ShapeRoles)[number];
type TypescaleProperty = 'font' | 'line-height' | 'size' | 'weight';

export type Material3SystemColorToken = `--md-sys-color-${SystemColorRole}`;
export type Material3TypescaleToken =
  | `--md-sys-typescale-${TypeRole}-${TypescaleProperty}`
  | '--md-sys-typescale-label-large-weight-prominent'
  | '--md-sys-typescale-label-medium-weight-prominent';
export type Material3TypefaceToken = `--md-ref-typeface-${TypefaceRole}`;
export type Material3ShapeToken = `--md-sys-shape-${ShapeRole}`;
export type Material3ComponentToken = (typeof material3ComponentTokens)[number];
export type Material3TokenName =
  | Material3SystemColorToken
  | Material3TypescaleToken
  | Material3TypefaceToken
  | Material3ShapeToken
  | Material3ComponentToken;

/** Reference a supported Material CSS role without resolving or copying its value. */
export function material3Var<T extends Material3TokenName>(
  name: T,
): `var(${T})` {
  return `var(${name})`;
}
