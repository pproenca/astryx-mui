// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file material3Theme.ts
 * @input Pinned Material 3 foundation sources and Astryx defineTheme contract
 * @output Standalone maintained Material 3 theme with portable and local roles
 * @position Material 3 theme definition for runtime and static compilation
 *
 * Core token names remain portable. Material CSS-backed roles are theme-local;
 * Sass-only foundation values use Astryx-owned theme-local names. Component
 * parity is tracked by separate migrations and is not implied by this theme.
 */

import {defineTheme, type TokenValue} from '@astryxdesign/core/theme';
import {
  material3LightColorScheme,
  material3DarkColorScheme,
} from './material3Colors';
import {
  material3Typeface,
  material3Typescale,
  material3SourceOnlyTracking,
} from './material3Typography';
import {material3CssCorners} from './material3Shape';
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

const material3LocalTokens: Record<string, TokenValue> = {
  ...Object.fromEntries(
    Object.keys(material3LightColorScheme).map(role => [
      `--md-sys-color-${role}`,
      [
        material3LightColorScheme[
          role as keyof typeof material3LightColorScheme
        ],
        material3DarkColorScheme[role as keyof typeof material3DarkColorScheme],
      ] as [string, string],
    ]),
  ),
  ...entries('--md-ref-typeface-', material3Typeface),
  ...entries('--md-sys-typescale-', material3Typescale),
  ...entries('--md-sys-shape-', material3CssCorners),
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

const modeColor = (role: string, mode: 'light' | 'dark') =>
  (mode === 'light' ? material3LightColorScheme : material3DarkColorScheme)[
    role as keyof typeof material3LightColorScheme
  ];
const color = (role: string): [string, string] => [
  modeColor(role, 'light'),
  modeColor(role, 'dark'),
];
const colored = (
  render: (mode: 'light' | 'dark') => string,
): [string, string] => [render('light'), render('dark')];
const type = (role: string, property: string) =>
  (material3Typescale as Record<string, string>)[`${role}-${property}`];
const ratio = (role: string) => {
  const values = material3Typescale as Record<string, string>;
  return String(
    Number(
      (
        Number.parseFloat(values[`${role}-line-height`]) /
        Number.parseFloat(values[`${role}-size`])
      ).toFixed(6),
    ),
  );
};
const semanticType = (astryx: string, material: string) => ({
  [`--text-${astryx}-size`]: type(material, 'size'),
  [`--text-${astryx}-weight`]: type(material, 'weight'),
  [`--text-${astryx}-leading`]: ratio(material),
});
const shadowLayer = (level: 'level1' | 'level2' | 'level3') =>
  colored(mode => {
    const shadow = modeColor('shadow', mode);
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
  });

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
    '--color-text-disabled': colored(
      mode =>
        `color-mix(in srgb, ${modeColor('on-surface', mode)} 38%, ${modeColor('surface', mode)})`,
    ),
    '--color-icon-primary': color('on-surface'),
    '--color-icon-secondary': color('on-surface-variant'),
    '--color-icon-accent': color('primary'),
    '--color-icon-disabled': colored(
      mode =>
        `color-mix(in srgb, ${modeColor('on-surface', mode)} 38%, ${modeColor('surface', mode)})`,
    ),
    '--color-error': color('error'),
    '--color-error-muted': color('error-container'),
    '--color-on-error': color('on-error'),
    '--color-border': color('outline-variant'),
    '--color-border-emphasized': color('outline'),
    '--color-overlay': colored(
      mode =>
        `color-mix(in srgb, ${modeColor('scrim', mode)} 32%, transparent)`,
    ),
    '--color-overlay-hover': colored(
      mode =>
        `color-mix(in srgb, ${modeColor('on-surface', mode)} 8%, transparent)`,
    ),
    '--color-overlay-pressed': colored(
      mode =>
        `color-mix(in srgb, ${modeColor('on-surface', mode)} 12%, transparent)`,
    ),
    '--color-shadow': color('shadow'),
    '--radius-none': '0px',
    '--radius-inner': material3CssCorners['corner-extra-small'],
    '--radius-element': material3CssCorners['corner-small'],
    '--radius-container': material3CssCorners['corner-medium'],
    '--radius-page': material3CssCorners['corner-extra-large'],
    '--radius-chat': material3CssCorners['corner-extra-large'],
    '--radius-full': material3CssCorners['corner-full'],
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
    '--font-family-body': 'Roboto, Arial, sans-serif',
    '--font-family-heading': 'Roboto, Arial, sans-serif',
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
});
