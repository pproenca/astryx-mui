// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file material3Theme.ts
 * @input Canonical native Material 3 graph and Astryx defineTheme contract
 * @output Core compatibility aliases and 24px Icon default
 * @position Material 3 theme definition for runtime and static compilation
 *
 * Core token names remain portable. Material CSS-backed roles are theme-local;
 * aliases flow toward them. Source-only values retain Astryx-owned local names.
 */

import {defineTheme, type TokenValue} from '@astryxdesign/core/theme';
import {material3TokenValues} from '@astryxdesign/material3';
import {material3SourceOnlyTracking} from './material3Typography';
import {
  material3Durations,
  material3Easings,
  material3StateLayerOpacity,
} from './material3Motion';
import {material3ElevationLayers} from './material3Elevation';
import {material3IconRegistry} from './material3Icons';

const entries = (
  prefix: string,
  values: Record<string, string>,
): Record<string, TokenValue> =>
  Object.fromEntries(
    Object.entries(values).map(([name, value]) => [`${prefix}${name}`, value]),
  );

const nativeLight = material3TokenValues('light', 'web-compat');
const nativeDark = material3TokenValues('dark', 'web-compat');
const materialValue = (name: keyof typeof nativeLight) => nativeLight[name];
const materialVar = (name: keyof typeof nativeLight) => `var(${name})`;

const material3LocalTokens: Record<string, TokenValue> = {
  ...Object.fromEntries(
    Object.entries(nativeLight).map(([name, value]) => [
      name,
      value === nativeDark[name as keyof typeof nativeDark]
        ? value
        : [value, nativeDark[name as keyof typeof nativeDark]],
    ]),
  ),
  ...entries(
    '--astryx-theme-material3-typescale-',
    material3SourceOnlyTracking,
  ),
  ...entries('--astryx-theme-material3-motion-', {
    ...material3Durations,
    ...material3Easings,
  }),
  ...entries(
    '--astryx-theme-material3-state-',
    Object.fromEntries(
      Object.entries(material3StateLayerOpacity).map(([name, value]) => [
        name,
        String(value),
      ]),
    ),
  ),
};

const color = (role: string) =>
  materialVar(`--md-sys-color-${role}` as keyof typeof nativeLight);
const type = (role: string, property: string) =>
  materialVar(
    `--md-sys-typescale-${role}-${property}` as keyof typeof nativeLight,
  );
const ratio = (role: string) => {
  return String(
    Number(
      (
        Number.parseFloat(
          materialValue(
            `--md-sys-typescale-${role}-line-height` as keyof typeof nativeLight,
          ),
        ) /
        Number.parseFloat(
          materialValue(
            `--md-sys-typescale-${role}-size` as keyof typeof nativeLight,
          ),
        )
      ).toFixed(6),
    ),
  );
};
const semanticType = (astryx: string, material: string) => ({
  [`--text-${astryx}-size`]: type(material, 'size'),
  [`--text-${astryx}-weight`]: type(material, 'weight'),
  [`--text-${astryx}-leading`]: ratio(material),
});
const shadowLayer = (level: 'level1' | 'level2' | 'level3') => {
  const shadow = color('shadow');
  const layers = material3ElevationLayers(level, shadow);
  const key = layers.key.boxShadow.replace(
    shadow,
    `color-mix(in srgb, ${shadow} 30%, transparent)`,
  );
  const ambient = layers.ambient.boxShadow.replace(
    shadow,
    `color-mix(in srgb, ${shadow} 15%, transparent)`,
  );
  return `${key}, ${ambient}`;
};

export const material3Theme = defineTheme({
  name: 'material3',
  iconDefaultSize: 'lg',
  localTokens: material3LocalTokens,
  icons: material3IconRegistry,
  tokens: {
    '--color-background-body': color('background'),
    '--color-background-surface': color('surface'),
    '--color-background-card': color('surface-container-low'),
    '--color-background-popover': color('surface-container'),
    '--color-background-muted': color('surface-container-high'),
    '--color-background-inverted': color('inverse-surface'),
    '--color-accent': color('primary'),
    '--color-accent-muted': color('primary-container'),
    '--color-on-accent': color('on-primary'),
    '--color-neutral': color('secondary-container'),
    '--color-text-primary': color('on-surface'),
    '--color-text-secondary': color('on-surface-variant'),
    '--color-text-accent': color('primary'),
    '--color-text-disabled': `color-mix(in srgb, ${color('on-surface')} 38%, ${color('surface')})`,
    '--color-icon-primary': color('on-surface'),
    '--color-icon-secondary': color('on-surface-variant'),
    '--color-icon-accent': color('primary'),
    '--color-icon-disabled': `color-mix(in srgb, ${color('on-surface')} 38%, ${color('surface')})`,
    '--color-error': color('error'),
    '--color-error-muted': color('error-container'),
    '--color-on-error': color('on-error'),
    '--color-border': color('outline-variant'),
    '--color-border-emphasized': color('outline'),
    '--color-overlay': `color-mix(in srgb, ${color('scrim')} 32%, transparent)`,
    '--color-overlay-hover': `color-mix(in srgb, ${color('on-surface')} 8%, transparent)`,
    '--color-overlay-pressed': `color-mix(in srgb, ${color('on-surface')} 12%, transparent)`,
    '--color-shadow': color('shadow'),
    '--radius-none': materialVar('--md-sys-shape-corner-none'),
    '--radius-inner': materialVar('--md-sys-shape-corner-extra-small'),
    '--radius-element': materialVar('--md-sys-shape-corner-small'),
    '--radius-container': materialVar('--md-sys-shape-corner-medium'),
    '--radius-page': materialVar('--md-sys-shape-corner-extra-large'),
    '--radius-chat': materialVar('--md-sys-shape-corner-extra-large'),
    '--radius-full': materialVar('--md-sys-shape-corner-full'),
    '--duration-fast-min': material3Durations['duration-short1'],
    '--duration-fast': material3Durations['duration-short2'],
    '--duration-fast-max': material3Durations['duration-short4'],
    '--duration-medium-min': material3Durations['duration-medium1'],
    '--duration-medium': material3Durations['duration-medium2'],
    '--duration-medium-max': material3Durations['duration-medium4'],
    '--duration-slow-min': material3Durations['duration-long1'],
    '--duration-slow': material3Durations['duration-long4'],
    '--duration-slow-max': material3Durations['duration-extra-long4'],
    '--ease-standard': material3Easings['easing-standard'],
    '--shadow-low': shadowLayer('level1'),
    '--shadow-med': shadowLayer('level2'),
    '--shadow-high': shadowLayer('level3'),
    '--font-family-body': `${materialVar('--md-ref-typeface-plain')}, Arial, sans-serif`,
    '--font-family-heading': `${materialVar('--md-ref-typeface-plain')}, Arial, sans-serif`,
    '--font-size-xs': type('label-small', 'size'),
    '--font-size-sm': type('body-small', 'size'),
    '--font-size-base': type('body-medium', 'size'),
    '--font-size-lg': type('body-large', 'size'),
    '--font-size-xl': type('title-large', 'size'),
    '--font-size-2xl': type('headline-small', 'size'),
    '--font-size-3xl': type('headline-medium', 'size'),
    '--font-size-4xl': type('headline-large', 'size'),
    '--font-size-5xl': type('display-large', 'size'),
    ...semanticType('display-1', 'display-large'),
    ...semanticType('display-2', 'display-medium'),
    ...semanticType('display-3', 'display-small'),
    ...semanticType('heading-1', 'headline-large'),
    ...semanticType('heading-2', 'headline-medium'),
    ...semanticType('heading-3', 'headline-small'),
    ...semanticType('heading-4', 'title-large'),
    ...semanticType('heading-5', 'title-medium'),
    ...semanticType('heading-6', 'title-small'),
    ...semanticType('body', 'body-medium'),
    ...semanticType('large', 'body-large'),
    ...semanticType('label', 'label-large'),
    ...semanticType('supporting', 'body-small'),
  },
  components: {
    divider: {
      base: {
        '--astryx-divider-color': 'var(--md-divider-color)',
        '--astryx-divider-thickness': 'var(--md-divider-thickness)',
        '--astryx-divider-inset': '16px',
      },
      'variant:strong': {
        '--astryx-divider-color': 'var(--md-sys-color-outline)',
      },
    },
  },
});
