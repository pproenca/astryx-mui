// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file material3Colors.test.ts
 * @input Material 3 color source data and resolved scheme exports
 * @output Pinned-source equivalence and representative contrast evidence
 * @position Material 3 color foundation verification
 */

import {describe, expect, it} from 'vitest';
import source from './material3ColorSource.json';
import {
  material3ColorSourceCommit,
  material3DarkColorScheme,
  material3LightColorScheme,
  material3ReferencePalette,
} from './material3Colors';

function luminance(hex: string): number {
  const expanded =
    hex.length === 4
      ? `#${[...hex.slice(1)].map(channel => channel + channel).join('')}`
      : hex;
  const [red, green, blue] = expanded
    .slice(1)
    .match(/.{2}/g)!
    .map(channel => Number.parseInt(channel, 16) / 255);
  const linear = (channel: number) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
}

function contrast(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe('Material 3 color source', () => {
  it('resolves every role to the pinned Sass output in both modes', () => {
    expect(material3ColorSourceCommit).toBe(
      'cbd34a8921915af94d5ef65c2a69eece41d5b4f3',
    );
    expect(Object.keys(material3ReferencePalette)).toHaveLength(91);
    expect(Object.keys(material3LightColorScheme)).toHaveLength(49);
    expect(Object.keys(material3DarkColorScheme)).toHaveLength(49);
    expect(material3LightColorScheme).toEqual(source.lightResolved);
    expect(material3DarkColorScheme).toEqual(source.darkResolved);
    expect(material3ReferencePalette.primary40).toBe('#6750a4');
    expect(material3LightColorScheme.primary).toBe('#6750a4');
    expect(material3DarkColorScheme.primary).toBe('#d0bcff');
  });

  it.each([
    ['light', material3LightColorScheme],
    ['dark', material3DarkColorScheme],
  ] as const)(
    'keeps representative %s role pairs readable',
    (_mode, scheme) => {
      for (const [foreground, background] of [
        ['on-primary', 'primary'],
        ['on-secondary', 'secondary'],
        ['on-tertiary', 'tertiary'],
        ['on-error', 'error'],
        ['on-surface', 'surface'],
        ['on-surface-variant', 'surface-variant'],
      ] as const) {
        expect(
          contrast(scheme[foreground], scheme[background]),
        ).toBeGreaterThanOrEqual(4.5);
      }
    },
  );
});
