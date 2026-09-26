// Copyright (c) Meta Platforms, Inc. and affiliates.
// Material values: Copyright The Android Open Source Project and Google LLC, Apache-2.0.

/**
 * @file foundation.ts
 * @input Pinned Compose-first foundation data and supported Material Web CSS names
 * @output One native value graph for typed access, runtime CSS and static CSS
 * @position Native Material 3 foundation; component recipes bind these roles locally
 *
 * Compose-only geometry, typography variants, spring inputs and state values are
 * source data, not invented public --md-* custom properties.
 */

import source from './foundationSource.json' with {type: 'json'};
import {
  material3ComponentTokens,
  material3ShapeRoles,
  material3SystemColorRoles,
  material3TypefaceRoles,
  material3TypeRoles,
  type Material3TokenName,
} from './tokens.js';

export type Material3KitScheme = keyof typeof source.colors.kitModes;
export type Material3Scheme =
  'light' | 'dark' | 'expressive-light' | Material3KitScheme;
export type Material3TokenProfile = 'native' | 'web-compat';

type ColorRole = (typeof material3SystemColorRoles)[number];
type ColorValues = Record<ColorRole, string>;

const palette = source.colors.palette as Record<string, string>;
const colorKeys = source.colors as {
  standardLightKeys: Record<ColorRole, string>;
  standardDarkKeys: Record<ColorRole, string>;
  expressiveLightKeys: Partial<Record<ColorRole, string>>;
};

function resolveColors(keys: Record<ColorRole, string>): ColorValues {
  return Object.fromEntries(
    material3SystemColorRoles.map(role => {
      const value = palette[keys[role]];
      if (!value) {
        throw new Error(`Missing pinned Material color ${role}`);
      }
      return [role, value];
    }),
  ) as ColorValues;
}

/** Pinned Compose default schemes, with Web's documented Shadow gap. */
export const material3StandardLightColors = resolveColors(
  colorKeys.standardLightKeys,
);
export const material3StandardDarkColors = resolveColors(
  colorKeys.standardDarkKeys,
);
export const material3ExpressiveLightColors = resolveColors({
  ...colorKeys.standardLightKeys,
  ...colorKeys.expressiveLightKeys,
});
/** Figma-only named and contrast modes retain their frozen source values. */
export const material3KitModeNames = Object.keys(
  source.colors.kitModes,
) as Material3KitScheme[];

export function material3ColorValues(scheme: Material3Scheme): ColorValues {
  switch (scheme) {
    case 'light':
      return material3StandardLightColors;
    case 'dark':
      return material3StandardDarkColors;
    case 'expressive-light':
      return material3ExpressiveLightColors;
    default:
      return source.colors.kitModes[scheme] as ColorValues;
  }
}

/** Exact CSS-backed component defaults; components declare them on their host. */
export const material3ComponentDefaults = {
  '--md-divider-color': 'var(--md-sys-color-outline-variant)',
  '--md-divider-thickness': '1px',
  '--md-badge-color': 'var(--md-sys-color-error)',
  '--md-badge-large-color': 'var(--md-sys-color-error)',
  '--md-badge-large-label-text-color': 'var(--md-sys-color-on-error)',
  '--md-badge-large-label-text-font':
    'var(--md-sys-typescale-label-small-font)',
  '--md-badge-large-label-text-line-height':
    'var(--md-sys-typescale-label-small-line-height)',
  '--md-badge-large-label-text-size':
    'var(--md-sys-typescale-label-small-size)',
  '--md-badge-large-label-text-weight':
    'var(--md-sys-typescale-label-small-weight)',
  '--md-badge-large-shape': 'var(--md-sys-shape-corner-full)',
  '--md-badge-large-size': '16px',
  '--md-badge-shape': 'var(--md-sys-shape-corner-full)',
  '--md-badge-size': '6px',
} as const satisfies Record<(typeof material3ComponentTokens)[number], string>;

type TypeStyle = {
  fontSizePx: number;
  lineHeightPx: number;
  letterSpacingPx: number;
  fontWeight: number;
};

/** Includes all 15 emphasized roles. These are not all Material Web CSS names. */
export const material3TypeStyles = source.typography.styles as Record<
  string,
  TypeStyle
>;
export const material3ExpressiveShapes = source.shapes.expressive;
export const material3CornerShapes = source.shapes.corners;
export const material3ElevationLevels = source.elevation.levels;
export const material3SpringSpecs = source.motion;
export const material3StateOpacity = source.state.opacity;
export const material3FoundationGeometry = source.spacing;
export const material3IconDefaults = source.icons;

function colorChannels(color: string): number[] {
  if (!/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(color))
    {throw new RangeError(`Expected a hexadecimal Material color: ${color}`);}
  const digits =
    color.length === 4
      ? [...color.slice(1)].map(digit => digit + digit).join('')
      : color.slice(1);
  return [0, 2, 4].map(index =>
    Number.parseInt(digits.slice(index, index + 2), 16),
  );
}

/** Composite an alpha layer in sRGB, matching pinned source browser sheets. */
export function material3LayerColor(
  base: string,
  layer: string,
  opacity: number,
): string {
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1)
    {throw new RangeError('Material layer opacity must be within 0–1');}
  const a = colorChannels(base);
  const b = colorChannels(layer);
  return `#${a
    .map((channel, index) =>
      Math.round(channel * (1 - opacity) + b[index] * opacity)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** Compose tonal elevation uses absolute dp, including nested surfaces. */
export function material3TonalElevation(
  scheme: Material3Scheme,
  absoluteDp: number,
): string {
  if (!Number.isFinite(absoluteDp) || absoluteDp < 0)
    {throw new RangeError('Material elevation must be non-negative');}
  const colors = material3ColorValues(scheme);
  const alpha =
    absoluteDp === 0 ? 0 : (4.5 * Math.log(absoluteDp + 1) + 2) / 100;
  return material3LayerColor(colors.surface, colors['surface-tint'], alpha);
}

/** Separate key and ambient Web shadow geometry; tonal elevation is independent. */
export function material3ElevationShadowLayers(
  scheme: Material3Scheme,
  level: 0 | 1 | 2 | 3 | 4 | 5,
) {
  const geometry = source.elevation.shadowLayers[`level${level}`];
  const shadow = material3ColorValues(scheme).shadow;
  return {
    key: {
      ...geometry.key,
      boxShadow: geometry.key.boxShadow.replace(
        source.elevation.shadowSampleColor,
        shadow,
      ),
    },
    ambient: {
      ...geometry.ambient,
      boxShadow: geometry.ambient.boxShadow.replace(
        source.elevation.shadowSampleColor,
        shadow,
      ),
    },
  };
}

/** Compose-filled Button static state colors; focus ring and ripple stay component-owned. */
export function material3FilledButtonStateColors(
  scheme: Material3Scheme,
  state: 'rest' | 'hover' | 'focus' | 'pressed' | 'disabled',
) {
  const colors = material3ColorValues(scheme);
  if (state === 'disabled') {
    const container = material3LayerColor(
      colors.surface,
      colors['on-surface'],
      source.state.disabled.containerOpacity,
    );
    return {
      container,
      label: material3LayerColor(
        container,
        colors['on-surface-variant'],
        source.state.disabled.labelOpacity,
      ),
    };
  }
  return {
    container:
      state === 'rest'
        ? colors.primary
        : material3LayerColor(
            colors.primary,
            colors['on-primary'],
            source.state.opacity[state],
          ),
    label: colors['on-primary'],
  };
}

const rem = (px: number) => `${Number((px / 16).toFixed(6))}rem`;

/** Public CSS-backed roles for one scheme. Source-only values stay above. */
export function material3TokenValues(
  scheme: Material3Scheme,
  profile: Material3TokenProfile = 'native',
): Record<Material3TokenName, string> {
  const colors = material3ColorValues(scheme);
  const values: Record<string, string> = {};
  for (const role of material3SystemColorRoles) {
    values[`--md-sys-color-${role}`] = colors[role];
  }
  for (const role of material3TypefaceRoles) {
    values[`--md-ref-typeface-${role}`] =
      source.typography.typeface[
        role as keyof typeof source.typography.typeface
      ];
  }
  for (const role of material3TypeRoles) {
    const style = material3TypeStyles[role];
    if (!style) {
      throw new Error(`Missing pinned Material type style ${role}`);
    }
    const prefix = `--md-sys-typescale-${role}`;
    values[`${prefix}-font`] = 'var(--md-ref-typeface-plain)';
    values[`${prefix}-line-height`] = rem(style.lineHeightPx);
    values[`${prefix}-size`] = rem(style.fontSizePx);
    values[`${prefix}-weight`] = String(style.fontWeight);
  }
  values['--md-sys-typescale-label-large-weight-prominent'] = String(
    material3TypeStyles['label-large-emphasized'].fontWeight,
  );
  values['--md-sys-typescale-label-medium-weight-prominent'] = String(
    material3TypeStyles['label-medium-emphasized'].fontWeight,
  );
  for (const role of material3ShapeRoles) {
    const value =
      source.shapes.corners[
        role.replace('corner-', '') as keyof typeof source.shapes.corners
      ];
    if (value === undefined) {
      throw new Error(`Missing pinned Material shape ${role}`);
    }
    values[`--md-sys-shape-${role}`] =
      value === 'full'
        ? profile === 'native'
          ? '50%'
          : '9999px'
        : `${value}px`;
  }
  Object.assign(values, material3ComponentDefaults);
  return values as Record<Material3TokenName, string>;
}

/** Resolve a typed role from the same graph used to emit runtime and built CSS. */
export function resolveMaterial3Token(
  name: Material3TokenName,
  options: {
    scheme?: Material3Scheme;
    profile?: Material3TokenProfile;
    overrides?: Partial<Record<Material3TokenName, string>>;
  } = {},
): string {
  const values = material3TokenValues(
    options.scheme || 'light',
    options.profile || 'native',
  );
  const seen = new Set<string>();
  const resolve = (token: string): string => {
    if (seen.has(token)) {
      throw new Error(`Material token cycle at ${token}`);
    }
    const value =
      options.overrides?.[token as Material3TokenName] ??
      values[token as Material3TokenName];
    if (value === undefined) {
      throw new Error(`Unknown Material token ${token}`);
    }
    seen.add(token);
    const result = value.replace(/var\((--[a-z0-9-]+)\)/g, (_, next: string) =>
      resolve(next),
    );
    seen.delete(token);
    return result;
  };
  return resolve(name);
}

/** CSS for standalone native usage. Component defaults are emitted by components. */
export function material3TokenCss(): string {
  const declarations = (values: Record<string, string>) =>
    Object.entries(values)
      .map(([name, value]) => `  ${name}: ${value};`)
      .join('\n');
  const publicSystemRoles = (scheme: Material3Scheme) =>
    Object.fromEntries(
      Object.entries(material3TokenValues(scheme)).filter(
        ([name]) =>
          !material3ComponentTokens.includes(
            name as (typeof material3ComponentTokens)[number],
          ),
      ),
    );
  return (
    [
      `:root, [data-md-scheme='light'] {\n${declarations(publicSystemRoles('light'))}\n}`,
      ...(['dark', 'expressive-light', ...material3KitModeNames] as const).map(
        scheme =>
          `[data-md-scheme='${scheme}'] {\n${declarations(publicSystemRoles(scheme))}\n}`,
      ),
    ].join('\n\n') + '\n'
  );
}
